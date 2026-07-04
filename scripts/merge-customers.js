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

  const targetPhone = "+94777974673"; // The correct 9-digit phone
  const oldPhone = "+9477974673";     // The 8-digit typo phone
  const mergedName = "Chamindu Godella";
  const mergedAddress = "552/2/R Godella Road, Mulleriyawa New Town";

  // 1. Delete the old typo customer profile from customers table
  console.log(`Deleting customer profile with phone ${oldPhone}...`);
  const deleteCustRes = await client.query(`
    DELETE FROM customers 
    WHERE phone = $1;
  `, [oldPhone]);
  console.log(`Deleted ${deleteCustRes.rowCount} customer profile.`);

  // 2. Upsert the merged customer profile
  console.log(`Upserting customer profile for phone ${targetPhone}...`);
  const upsertCustRes = await client.query(`
    INSERT INTO customers (phone, name, address) 
    VALUES ($1, $2, $3)
    ON CONFLICT (phone) 
    DO UPDATE SET name = $2, address = $3;
  `, [targetPhone, mergedName, mergedAddress]);
  console.log("Customer profile upsert completed.");

  // 3. Update all historical orders that belong to either of the two phone numbers
  console.log("Updating historical orders for both phones...");
  const mergedCustObj = {
    phone: targetPhone,
    name: mergedName,
    address: mergedAddress
  };

  const updateOrdersRes = await client.query(`
    UPDATE orders 
    SET customer = $1::jsonb 
    WHERE customer->>'phone' = $2 OR customer->>'phone' = $3;
  `, [JSON.stringify(mergedCustObj), targetPhone, oldPhone]);
  console.log(`Updated ${updateOrdersRes.rowCount} orders in database!`);

  await client.end();
}

main().catch(console.error);
