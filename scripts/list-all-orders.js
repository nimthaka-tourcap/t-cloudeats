const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres.gxzroeersbmlvstsiqjk:GUUJYO4pTzBOb2yi@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: {
      rejectUnauthorized: false
    }
  });
  await client.connect();
  console.log("Connected to PG!");

  // List all orders with their id, raw timestamp, formatted local time, and business date
  const res = await client.query(`
    SELECT id, timestamp, customer->>'name' as name, total 
    FROM orders 
    ORDER BY timestamp DESC
    LIMIT 20;
  `);

  console.log("Latest 20 orders in DB:");
  res.rows.forEach(row => {
    const d = new Date(row.timestamp);
    console.log(`${row.id} | DB timestamp: ${row.timestamp} | Local: ${d.toLocaleString('en-US', { timeZone: 'Asia/Colombo' })} | Total: ${row.total}`);
  });

  await client.end();
}

main().catch(console.error);
