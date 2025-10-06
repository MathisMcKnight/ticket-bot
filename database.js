// database.js
const Database = require('better-sqlite3');
const db = new Database('./data.db');

// Initialize tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number INTEGER,
    user_id TEXT,
    channel_id TEXT,
    status TEXT,
    ticket_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS configs (
    guild_id TEXT PRIMARY KEY,
    category_id TEXT,
    support_role_id TEXT,
    transcript_channel_id TEXT
  );

  CREATE TABLE IF NOT EXISTS blacklists (
    user_id TEXT PRIMARY KEY,
    reason TEXT,
    blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    ticket_number INTEGER,
    channel_id TEXT,
    user_id TEXT,
    user_tag TEXT,
    ticket_type TEXT,
    messages TEXT,
    close_reason TEXT,
    closed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
  );
`);

// Migration: Add missing columns to existing tables
const addColumnIfNotExists = (table, column, type) => {
  try {
    const checkColumn = db.prepare(`PRAGMA table_info(${table})`).all();
    const columnExists = checkColumn.some(col => col.name === column);
    
    if (!columnExists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`✅ Added column ${column} to ${table}`);
    }
  } catch (error) {
    console.error(`Error adding column ${column} to ${table}:`, error.message);
  }
};

// Add new columns if they don't exist
addColumnIfNotExists('tickets', 'ticket_number', 'INTEGER');
addColumnIfNotExists('configs', 'transcript_channel_id', 'TEXT');
addColumnIfNotExists('transcripts', 'ticket_number', 'INTEGER');
addColumnIfNotExists('transcripts', 'close_reason', 'TEXT');
addColumnIfNotExists('transcripts', 'token', 'TEXT');
addColumnIfNotExists('transcripts', 'file_path', 'TEXT');

// Create unique index for token column if it doesn't exist
try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transcripts_token ON transcripts(token)`);
} catch (error) {
  console.error('Error creating unique index:', error.message);
}

module.exports = db;
