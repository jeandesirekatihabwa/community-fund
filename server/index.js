require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Configure Redis for Socket.IO horizontal scaling
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Redis] Socket.IO Adapter configured successfully.');
}).catch((err) => {
    console.error('[Redis] Failed to connect to Redis for Socket.IO adapter:', err);
});

const PORT = process.env.PORT || 3001;

app.use(cors());

// The Stripe Webhook requires the raw unparsed body to verify the signature
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
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
            await db.run(
                'INSERT INTO contributions (amount, currency, payment_intent_id, status, user_id) VALUES (?, ?, ?, ?, ?)',
                [amount, currency, payment_intent_id, 'succeeded', user_id]
            );
            
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

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/config', (req, res) => {
    res.send({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
});

// database setup
let db;
(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE,
            email TEXT,
            name TEXT,
            avatar TEXT,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            amount INTEGER,
            currency TEXT,
            payment_intent_id TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
})();

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
    max: 5, // Limit each IP to 5 payment intent creations per windowMs
    message: { error: 'Too many payment requests from this IP. Please wait before trying another card.' }
});

app.post('/auth/google', authLimiter, async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: google_id, email, name, picture: avatar } = payload;

        let user = await db.get('SELECT * FROM users WHERE google_id = ?', [google_id]);

        if (!user) {
            const result = await db.run(
                'INSERT INTO users (google_id, email, name, avatar) VALUES (?, ?, ?, ?)',
                [google_id, email, name, avatar]
            );
            user = { id: result.lastID, google_id, email, name, avatar };
        }

        // Create a session token for our app
        const sessionToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({ user, token: sessionToken });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Manual Registration
app.post('/auth/register', authLimiter, async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
            [email, name, hashedPassword]
        );

        const user = { id: result.lastID, email, name, avatar: null };
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({ user, token });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
});

// Manual Login
app.post('/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = user;
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({ user: userWithoutPassword, token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Login failed' });
    }
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

// Replaced by secure Server-Side /api/webhook logic

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

app.get('/my-contributions', authenticateToken, async (req, res) => {
    try {
        console.log("Fetching contributions for user ID:", req.user.id);
        const contributions = await db.all(
            'SELECT * FROM contributions WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(contributions);
    } catch (e) {
        console.error("DB Query Failed GET /my-contributions:", e);
        res.status(500).send({ error: "Failed to fetch contributions from database." });
    }
});

app.get('/community-stats', async (req, res) => {
    try {
        const result = await db.get(
            `SELECT 
                COUNT(*) as total_contributions, 
                SUM(amount) as total_amount,
                COUNT(DISTINCT user_id) as total_contributors
             FROM contributions WHERE status = 'succeeded'`
        );

        // Get recent contributions
        const recent = await db.all(
            `SELECT c.amount, c.created_at, u.name, u.avatar 
             FROM contributions c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.status = 'succeeded' 
             ORDER BY c.created_at DESC LIMIT 5`
        );

        res.json({ stats: result, recent });
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
