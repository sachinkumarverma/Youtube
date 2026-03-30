const { query } = require('./src/lib/db');
const { generateId } = require('./src/lib/id');
require('dotenv').config();

async function backfill() {
  try {
    // Check if already backfilled
    const existing = await query('SELECT COUNT(*) as cnt FROM video_view_logs');
    if (parseInt(existing.rows[0].cnt) > 0) {
      console.log('video_view_logs already has data, skipping backfill.');
      process.exit(0);
    }

    // Insert from history table
    const historyRows = await query('SELECT video_id, viewed_at FROM history ORDER BY viewed_at');
    console.log(`Found ${historyRows.rows.length} history records to backfill...`);

    for (const row of historyRows.rows) {
      await query(
        'INSERT INTO video_view_logs (id, video_id, viewed_at) VALUES ($1, $2, $3)',
        [generateId(), row.video_id, row.viewed_at]
      );
    }

    console.log(`Backfilled ${historyRows.rows.length} view logs.`);
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  }
}

backfill();
