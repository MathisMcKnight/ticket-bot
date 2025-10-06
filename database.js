// database.js
const Database = require('better-sqlite3');
const db = new Database('./data.db');

// Initialize tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    channel_id TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS configs (
    guild_id TEXT PRIMARY KEY,
    category_id TEXT,
    support_role_id TEXT
  );

  CREATE TABLE IF NOT EXISTS blacklists (
    user_id TEXT PRIMARY KEY
  );
`);

module.exports = db;
