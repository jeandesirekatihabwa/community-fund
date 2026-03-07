require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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

app.post('/auth/google', async (req, res) => {
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
app.post('/auth/register', async (req, res) => {
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
app.post('/auth/login', async (req, res) => {
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

app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // in cents
            currency: currency,
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

app.post('/record-contribution', async (req, res) => {
    const { amount, currency, payment_intent_id, status, user_id } = req.body;
    try {
        await db.run(
            'INSERT INTO contributions (amount, currency, payment_intent_id, status, user_id) VALUES (?, ?, ?, ?, ?)',
            [amount, currency, payment_intent_id, status, user_id]
        );
        res.send({ success: true });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
