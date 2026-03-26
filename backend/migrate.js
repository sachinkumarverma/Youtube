const { query } = require('./src/lib/db');
const fs = require('fs');
require('dotenv').config();

async function migrate() {
  try {
    const migrationDir = './migrations';
    const files = fs.readdirSync(migrationDir).sort();
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(`${migrationDir}/${file}`, 'utf8');
      await query(sql);
      console.log(`  ✓ ${file} completed`);
    }
    console.log('\nAll migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
