const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres.gxzroeersbmlvstsiqjk:GUUJYO4pTzBOb2yi@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("Connected to PG!");

  // Query all orders ending with -003, -004, -007 or containing it
  const res = await client.query(`
    SELECT id, timestamp, status, total, customer 
    FROM orders 
    WHERE id LIKE '%-003' OR id LIKE '%-004' OR id LIKE '%-007'
    ORDER BY timestamp DESC;
  `);

  console.log(`Found ${res.rows.length} matching orders:`);
  res.rows.forEach(row => {
    console.log(`ID: ${row.id} | Status: ${row.status} | Total: ${row.total} | Timestamp: ${row.timestamp} | Customer: ${JSON.stringify(row.customer)}`);
  });

  await client.end();
}

main().catch(console.error);
