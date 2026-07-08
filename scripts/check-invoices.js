const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres.gxzroeersbmlvstsiqjk:GUUJYO4pTzBOb2yi@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("Connected to PG!");

  const res = await client.query(`
    SELECT id, timestamp, status, total, customer, items 
    FROM orders 
    WHERE customer->>'phone' = '+94719236781' OR customer->>'name' ILIKE '%Dilhani%'
    ORDER BY timestamp DESC;
  `);

  console.log(`Found ${res.rows.length} orders for Dilhani:`);
  res.rows.forEach(row => {
    console.log(`ID: ${row.id} | Total: ${row.total} | Timestamp: ${row.timestamp}`);
    console.log(`  Items: ${JSON.stringify(row.items)}`);
  });

  await client.end();
}

main().catch(console.error);
