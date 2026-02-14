const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/ai_platform';

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO organization_balance_projection (org_id, available, reserved, consumed, refunded, updated_at)
      VALUES ('00000000-0000-4000-a000-000000000001', 10000, 0, 0, 0, now())
      ON CONFLICT (org_id) DO UPDATE SET available = 10000, updated_at = now();
    `);
    console.log('Seed: one org balance row inserted/updated.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
