const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log("Adding password column to users table...");
    db.run("ALTER TABLE users ADD COLUMN password TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'password' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Successfully added 'password' column.");
        }
        db.close();
    });
});
