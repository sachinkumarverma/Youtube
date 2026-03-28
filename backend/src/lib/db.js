const { Pool, types } = require('pg');
require('dotenv').config();

// TIMESTAMP WITHOUT TIME ZONE (OID 1114) is stored as UTC in Supabase
// but pg driver interprets it as local time — force UTC interpretation
types.setTypeParser(1114, str => new Date(str + 'Z'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/external connections
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
