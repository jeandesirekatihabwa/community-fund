require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');
const { sendVerificationEmail } = require('./emailService');

const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [
    frontendUrl,
    frontendUrl ? `https://${frontendUrl}` : null,
    frontendUrl ? `http://${frontendUrl}` : null,
    'https://community-fund-client.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174'
].filter(Boolean);

const app = express();
app.set('trust proxy', 1); // Required for Render/Cloud environments
const server = http.createServer(app);

let prisma;
try {
  prisma = new PrismaClient({
    errorFormat: 'minimal',
  });
  
  // Test database connection
  prisma.$connect()
    .then(() => console.log('[Database] Connected successfully.'))
    .catch((err) => {
      console.error('[Database] Connection failed:', err.message);
    });
} catch (e) {
  console.error('[Database] Prisma initialization failed:', e.message);
}

const io = new Server(server, {
    cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Configure Redis for Socket.IO horizontal scaling
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('[Redis] Socket.IO Adapter configured successfully.');
    }).catch((err) => {
        console.error('[Redis] Failed to connect to Redis for Socket.IO adapter:', err);
    });
} else {
    console.log('[Redis] skipping Redis adapter (no REDIS_URL provided)');
}

const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true
}));

// The Stripe Webhook requires the raw unparsed body to verify the signature
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[Webhook Error] STRIPE_WEBHOOK_SECRET is not configured.');
            return res.status(500).send('Webhook secret missing');
        }

        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            webhookSecret
        );
    } catch (err) {
        console.error(`[Webhook Error] Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const amount = paymentIntent.amount;
        const currency = paymentIntent.currency;
        const payment_intent_id = paymentIntent.id;
        const user_id = paymentIntent.metadata?.user_id || null;
        
        try {
            await prisma.contributions.create({
                data: {
                    amount,
                    currency,
                    payment_intent_id,
                    status: 'succeeded',
                    user_id: user_id ? parseInt(user_id) : null
                }
            });
            
            console.log(`[Webhook] Recorded successful payment ${payment_intent_id} for user ${user_id}`);
            io.emit('stats_updated');
        } catch (dbErr) {
            console.error(`[Webhook] Database insert failed:`, dbErr);
            return res.status(500).send('Database Error');
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send({received: true});
});

// Parse JSON bodies for all remaining routes
app.use(express.json());

// Health check for production monitoring
app.get('/health', (req, res) => {
    res.status(200).send({ status: 'healthy', uptime: process.uptime() });
});
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/config', (req, res) => {
    res.send({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
});

// database setup (Prisma handles initialization automatically)
// No manual table creation needed as Prisma migrations handle schema.

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- Rate Limiters ---
// Create a strict rate limiter for authentication routes to prevent brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register requests per windowMs
    message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});

// Create a very strict rate limiter for payment intents to prevent card testing algorithms
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Increased for testing (Prevents card testing attacks)
    message: { error: 'Too many payment requests from this IP. Please wait before trying another card.' }
});

// Middleware to verify session token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) {
        console.log("No token provided");
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) {
            console.error("JWT Verification failed:", err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

app.post('/auth/google', authLimiter, async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: google_id, email, name, picture: avatar } = payload;

        let user = await prisma.users.findUnique({
            where: { google_id }
        });

        if (!user) {
            user = await prisma.users.create({
                // Google users are pre-verified
                data: { google_id, email, name, avatar, is_verified: true }
            });
        }

        // Create a session token for our app
        const sessionToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({ user, token: sessionToken });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Helper to generate 6-digit random code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- Unified Professional Auth Flow (Initiate -> Verify -> Onboard) ---

/**
 * Step 1: Initialize Session
 * Discovers if user exists and sends OTP regardless.
 */
app.post('/auth/init', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        let user = await prisma.users.findUnique({ where: { email } });
        
        const verification_code = generateCode();
        const verification_expires = new Date(Date.now() + 600000); // 10 minutes

        if (!user) {
            // Create a pending user
            user = await prisma.users.create({
                data: {
                    email,
                    verification_code,
                    verification_expires,
                    is_verified: false
                }
            });
        } else {
            // Update existing user with new code
            await prisma.users.update({
                where: { id: user.id },
                data: { verification_code, verification_expires }
            });
        }

        await sendVerificationEmail(email, verification_code);

        res.json({ 
            message: 'Security code dispatched', 
            isNewUser: !user.name // If no name, they haven't onboarded
        });
    } catch (error) {
        console.error("Auth Init Error:", error);
        res.status(500).json({ error: 'Identity discovery failed' });
    }
});

// Step 2: Verify & Authenticate
app.post('/auth/verify', authLimiter, async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    try {
        const user = await prisma.users.findUnique({ where: { email } });

        if (!user || user.verification_code !== code) {
            return res.status(400).json({ error: 'Invalid security code' });
        }

        if (new Date() > user.verification_expires) {
            return res.status(400).json({ error: 'Security code expired' });
        }

        // Mark as verified
        const updatedUser = await prisma.users.update({
            where: { id: user.id },
            data: { 
                is_verified: true,
                verification_code: null,
                verification_expires: null
            }
        });

        const token = jwt.sign(
            { id: updatedUser.id, email: updatedUser.email }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '7d' }
        );

        res.json({ 
            user: updatedUser, 
            token,
            isNewUser: !updatedUser.name
        });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: 'Verification system error' });
    }
});

/**
 * Step 3: Onboarding (For new users)
 */
app.post('/auth/onboard', authenticateToken, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Full name is required' });

    try {
        const updatedUser = await prisma.users.update({
            where: { id: req.user.id },
            data: { name }
        });

        res.json({ user: updatedUser });
    } catch (error) {
        console.error("Onboarding error:", error);
        res.status(500).json({ error: 'Profile creation failed' });
    }
});

// Resend Verification Code
app.post('/auth/resend-code', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const user = await prisma.users.findFirst({
            where: { email }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.is_verified) return res.status(400).json({ error: 'Account already verified' });

        const verification_code = generateCode();
        const verification_expires = new Date(Date.now() + 600000); // 10 minutes

        await prisma.users.update({
            where: { id: user.id },
            data: { 
                verification_code,
                verification_expires
            }
        });

        await sendVerificationEmail(email, verification_code);

        res.json({ message: 'A fresh verification code has been sent to your email.' });
    } catch (error) {
        console.error("Resend code error:", error);
        res.status(500).json({ error: 'Failed to resend code' });
    }
});

// --- Legacy Login Support (Disabled in Unified Flow) ---
app.post('/auth/login', authLimiter, (req, res) => {
    res.status(410).json({ error: 'Please use the unified security code entry.' });
});

app.get('/', (req, res) => {
    res.send('Weekly Contribution API is running');
});

app.post('/create-payment-intent', paymentLimiter, async (req, res) => {
    try {
        const { amount, currency, user_id } = req.body;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // in cents
            currency: currency,
            metadata: {
                user_id: user_id
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (e) {
        res.status(400).send({ error: { message: e.message } });
    }
});


// Local fallback for development environment without webhook tunneling
if (process.env.NODE_ENV !== 'production') {
    app.post('/api/verify-payment', authenticateToken, async (req, res) => {
    const { payment_intent_id } = req.body;
    
    if (!payment_intent_id) {
        return res.status(400).send({ error: 'Missing payment intent ID' });
    }

    try {
        // Retrieve the payment intent from Stripe to confirm it actually succeeded
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).send({ error: 'Payment has not succeeded' });
        }

        // Check if we already recorded this payment
        const existing = await prisma.contributions.findFirst({
            where: { payment_intent_id }
        });

        if (existing) {
            return res.send({ success: true, message: 'Already recorded' });
        }

        const amount = paymentIntent.amount;
        const currency = paymentIntent.currency;
        const user_id = paymentIntent.metadata?.user_id || req.user.id;
        
        // Save the contribution
        await prisma.contributions.create({
            data: {
                amount,
                currency,
                payment_intent_id,
                status: 'succeeded',
                user_id: user_id ? parseInt(user_id) : null
            }
        });
        
        console.log(`[Local Sync] Recorded successful payment ${payment_intent_id} for user ${user_id}`);
        io.emit('stats_updated');
        
        res.send({ success: true, message: 'Payment recorded locally' });
    } catch (e) {
        console.error("Local sync error:", e);
        res.status(500).send({ error: e.message });
    }
});
}
app.get('/my-contributions', authenticateToken, async (req, res) => {
    try {
        console.log("Fetching contributions for user ID:", req.user.id);
        const contributions = await prisma.contributions.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_at: 'desc' }
        });
        res.json(contributions);
    } catch (e) {
        console.error("DB Query Failed GET /my-contributions:", e);
        res.status(500).send({ error: "Failed to fetch contributions from database." });
    }
});

app.get('/community-stats', async (req, res) => {
    try {
        const aggregate = await prisma.contributions.aggregate({
            _count: { id: true },
            _sum: { amount: true },
            where: { status: 'succeeded' }
        });

        const contributorCount = await prisma.contributions.groupBy({
            by: ['user_id'],
            where: { status: 'succeeded' }
        });

        const stats = {
            total_contributions: aggregate._count.id,
            total_amount: aggregate._sum.amount,
            total_contributors: contributorCount.length
        };

        // Get recent contributions
        const recentRaw = await prisma.contributions.findMany({
            where: { status: 'succeeded' },
            orderBy: { created_at: 'desc' },
            take: 5,
            include: { users: true }
        });

        // Map to match the previous structure
        const recent = recentRaw.map(c => ({
            amount: c.amount,
            created_at: c.created_at,
            name: c.users?.name,
            avatar: c.users?.avatar
        }));

        res.json({ stats, recent });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

io.on('connection', (socket) => {
    console.log(`[Socket] A user connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
