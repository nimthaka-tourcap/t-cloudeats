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

  // Find all orders that might be test orders (associated with +94701340716)
  const phone = "+94701340716";
  
  console.log("Searching for orders with phone or customer name details containing the test phone...");
  const res = await client.query(`
    SELECT id, timestamp, customer_name, customer_phone, status, total 
    FROM orders 
    WHERE customer_phone = $1 OR customer_phone LIKE $2 OR customer_name ILIKE '%Nimthaka%';
  `, [phone, '%701340716%']);
  
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
    
    console.log(`Deleted ${delRes.rowCount} orders successfully!`);
  } else {
    console.log("No matching orders found to delete.");
  }

  await client.end();
}

main().catch(console.error);
