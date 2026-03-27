const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
const fetch = require('cross-fetch');
require('dotenv').config();

// Fix for "fetch failed" in Node 18+ (ensures ipv4 is tried first)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase URL or Key is missing from environment variables!');
} else {
  console.log('Supabase Initialized. URL:', supabaseUrl.substring(0, 15) + '...');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: { 'x-my-custom-header': 'viewtube' },
    fetch: fetch
  }
});

module.exports = { supabase };
