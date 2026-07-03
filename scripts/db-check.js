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

  // Check columns of customers table
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'customers';
  `);
  console.log("Columns:", res.rows);

  // Let's add address_label if not exists
  await client.query(`
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_label VARCHAR;
  `);
  console.log("ALTER TABLE executed successfully!");

  // Double check
  const res2 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'customers';
  `);
  console.log("Columns after ALTER:", res2.rows);

  await client.end();
}

main().catch(console.error);
