const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        ticket_number INTEGER UNIQUE,
        user_id TEXT,
        channel_id TEXT,
        status TEXT,
        ticket_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS configs (
        guild_id TEXT PRIMARY KEY,
        category_id TEXT,
        support_role_id TEXT,
        transcript_channel_id TEXT,
        general_inquiry_category_id TEXT,
        general_inquiry_role_id TEXT,
        press_clearance_category_id TEXT,
        press_clearance_role_id TEXT,
        agency_hotline_category_id TEXT,
        agency_hotline_role_id TEXT,
        internal_affairs_category_id TEXT,
        internal_affairs_role_id TEXT,
        escalation_category_id TEXT
      );

      CREATE TABLE IF NOT EXISTS blacklists (
        user_id TEXT PRIMARY KEY,
        reason TEXT,
        blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER,
        ticket_number INTEGER,
        channel_id TEXT,
        user_id TEXT,
        user_tag TEXT,
        ticket_type TEXT,
        messages TEXT,
        close_reason TEXT,
        token TEXT UNIQUE,
        file_path TEXT,
        closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
      );

      CREATE INDEX IF NOT EXISTS idx_transcripts_token ON transcripts(token);
    `);
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

const db = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      return res;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  },
  
  pool
};

initializeDatabase().catch(console.error);

module.exports = db;
