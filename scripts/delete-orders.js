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

  // Find all orders where customer details match the test name or phone
  const searchPhone = "+94701340716";
  const searchName = "Nimthaka Kannangara";
  
  console.log(`Searching for orders with customer phone containing "${searchPhone}" or name containing "${searchName}"...`);
  const res = await client.query(`
    SELECT id, timestamp, customer->>'name' as name, customer->>'phone' as phone, status, total 
    FROM orders 
    WHERE customer->>'phone' LIKE $1 OR customer->>'name' ILIKE $2;
  `, [`%701340716%`, `%Nimthaka%`]);
  
  console.log(`Found ${res.rows.length} matching orders:`);
  console.log(res.rows);

  if (res.rows.length > 0) {
    const orderIds = res.rows.map(r => r.id);
    console.log("Deleting matching orders from database...");
    
    // Perform deletion
    const delRes = await client.query(`
      DELETE FROM orders 
      WHERE id = ANY($1::text[]);
    `, [orderIds]);
    
    console.log(`Deleted ${delRes.rowCount} orders successfully from PostgreSQL database!`);
  } else {
    console.log("No matching orders found to delete.");
  }

  await client.end();
}

main().catch(console.error);
