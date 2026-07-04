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

  const phone = "+94772051949";
  const editCustName = "tyre kade shop";
  const editCustAddress = "tyree kade, Angoda 10620";
  const editCustAddressLabel = null;

  // Let's first search for orders with this customer phone
  const searchRes = await client.query(`
    SELECT id, customer 
    FROM orders 
    WHERE customer->>'phone' = $1;
  `, [phone]);
  console.log("Found orders before update:", searchRes.rows);

  const updatedCustObj = {
    phone,
    name: editCustName,
    address: editCustAddress,
    address_label: editCustAddressLabel
  };

  // Perform update in database using pg client
  const updateRes = await client.query(`
    UPDATE orders 
    SET customer = $1::jsonb 
    WHERE customer->>'phone' = $2;
  `, [JSON.stringify(updatedCustObj), phone]);

  console.log(`Updated ${updateRes.rowCount} orders in PG!`);

  // Verify updates
  const verifyRes = await client.query(`
    SELECT id, customer 
    FROM orders 
    WHERE customer->>'phone' = $1;
  `, [phone]);
  console.log("Verify orders after update:", verifyRes.rows);

  await client.end();
}

main().catch(console.error);
