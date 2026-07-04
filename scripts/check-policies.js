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

  // Query policies on orders and customers tables
  const res = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename IN ('orders', 'customers');
  `);
  console.log("Policies:", res.rows);

  await client.end();
}

main().catch(console.error);
