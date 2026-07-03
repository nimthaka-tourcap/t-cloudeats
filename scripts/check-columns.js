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

  // Check columns of orders table
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders';
  `);
  console.log("Columns of orders table:", res.rows);

  await client.end();
}

main().catch(console.error);
