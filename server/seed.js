const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log("Dropping old contributions table...");
    db.run("DROP TABLE IF EXISTS contributions");
    
    console.log("Recreating contributions table with user_id...");
    db.run(`CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount INTEGER,
        currency TEXT,
        payment_intent_id TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.all("SELECT id FROM users", (err, users) => {
        if (err) {
            console.error("Error fetching users:", err);
            return;
        }
        
        if (users && users.length > 0) {
            const userId = users[0].id;
            console.log(`Found user ID ${userId}, seeding contributions...`);
            
            const stmt = db.prepare("INSERT INTO contributions (user_id, amount, currency, payment_intent_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)");
            
            // Insert a few dummy successful contributions
            const pastDate1 = new Date();
            pastDate1.setDate(pastDate1.getDate() - 7);
            
            const pastDate2 = new Date();
            pastDate2.setDate(pastDate2.getDate() - 14);
            
            stmt.run(userId, 500, 'eur', 'pi_test_12345_dummy', 'succeeded', pastDate1.toISOString());
            stmt.run(userId, 500, 'eur', 'pi_test_67890_dummy', 'succeeded', pastDate2.toISOString());
            
            stmt.finalize(() => {
                console.log("Successfully seeded 2 contributions. Ready!");
                db.close();
            });
        } else {
            console.log("No users found in the DB. Please log in on the frontend first so a user is created.");
            db.close();
        }
    });
});
