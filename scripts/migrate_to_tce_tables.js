const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Custom .env loader
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env:", e);
}

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  await client.connect();
  console.log("Connected to PostgreSQL database for migration.\n");

  // 1. Create tce_menu_items and copy data
  console.log("--> Creating tce_menu_items...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS tce_menu_items (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      price NUMERIC NOT NULL,
      category TEXT NOT NULL,
      portion TEXT NOT NULL,
      image TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      sku TEXT,
      description TEXT
    );
  `);
  await client.query(`
    INSERT INTO tce_menu_items (id, title, price, category, portion, image, created_at, sku, description)
    SELECT id, title, price, category, portion, image, created_at, sku, description
    FROM menu_items
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      price = EXCLUDED.price,
      category = EXCLUDED.category,
      portion = EXCLUDED.portion,
      image = EXCLUDED.image,
      sku = EXCLUDED.sku,
      description = EXCLUDED.description;
  `);
  // Update sequence to max id
  await client.query(`
    SELECT setval(pg_get_serial_sequence('tce_menu_items', 'id'), COALESCE(MAX(id), 1)) FROM tce_menu_items;
  `);
  const countMenu = await client.query(`SELECT COUNT(*) FROM tce_menu_items`);
  console.log(`tce_menu_items ready with ${countMenu.rows[0].count} rows.`);

  // 2. Create tce_orders and copy data
  console.log("\n--> Creating tce_orders...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS tce_orders (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      items JSONB NOT NULL,
      subtotal NUMERIC NOT NULL,
      tax NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      customer JSONB
    );
  `);
  await client.query(`
    INSERT INTO tce_orders (id, timestamp, items, subtotal, tax, total, status, type, customer)
    SELECT id, timestamp, items, subtotal, tax, total, status, type, customer
    FROM orders
    ON CONFLICT (id) DO UPDATE SET
      timestamp = EXCLUDED.timestamp,
      items = EXCLUDED.items,
      subtotal = EXCLUDED.subtotal,
      tax = EXCLUDED.tax,
      total = EXCLUDED.total,
      status = EXCLUDED.status,
      type = EXCLUDED.type,
      customer = EXCLUDED.customer;
  `);
  const countOrders = await client.query(`SELECT COUNT(*) FROM tce_orders`);
  console.log(`tce_orders ready with ${countOrders.rows[0].count} rows.`);

  // 3. Create tce_customers and copy data
  console.log("\n--> Creating tce_customers...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS tce_customers (
      phone TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      birthday TIMESTAMP WITH TIME ZONE,
      address_label VARCHAR
    );
  `);
  await client.query(`
    INSERT INTO tce_customers (phone, name, address, created_at, birthday, address_label)
    SELECT phone, name, address, created_at, birthday, address_label
    FROM customers
    ON CONFLICT (phone) DO UPDATE SET
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      birthday = EXCLUDED.birthday,
      address_label = EXCLUDED.address_label;
  `);
  const countCustomers = await client.query(`SELECT COUNT(*) FROM tce_customers`);
  console.log(`tce_customers ready with ${countCustomers.rows[0].count} rows.`);

  // 4. Create tce_inventory and copy data from zb_inventory (keeping zb_inventory intact!)
  console.log("\n--> Creating tce_inventory and copying data from zb_inventory...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS tce_inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT NOT NULL,
      unit TEXT NOT NULL,
      par_level NUMERIC NOT NULL DEFAULT 0,
      quantity NUMERIC NOT NULL DEFAULT 0,
      unit_cost NUMERIC NOT NULL DEFAULT 0,
      supplier TEXT,
      expiration_date TEXT,
      storage_location TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await client.query(`
    INSERT INTO tce_inventory (id, name, category, sku, unit, par_level, quantity, unit_cost, supplier, expiration_date, storage_location, created_at)
    SELECT id, name, category, sku, unit, par_level, quantity, unit_cost, supplier, expiration_date, storage_location, created_at
    FROM zb_inventory
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      sku = EXCLUDED.sku,
      unit = EXCLUDED.unit,
      par_level = EXCLUDED.par_level,
      quantity = EXCLUDED.quantity,
      unit_cost = EXCLUDED.unit_cost,
      supplier = EXCLUDED.supplier,
      expiration_date = EXCLUDED.expiration_date,
      storage_location = EXCLUDED.storage_location;
  `);
  const countInv = await client.query(`SELECT COUNT(*) FROM tce_inventory`);
  console.log(`tce_inventory ready with ${countInv.rows[0].count} rows.`);

  // 5. Enable RLS and add Policies on all 4 TCE tables
  console.log("\n--> Enabling RLS & Creating Access Policies...");
  const tceTables = ['tce_menu_items', 'tce_orders', 'tce_customers', 'tce_inventory'];

  for (const t of tceTables) {
    // Enable RLS
    await client.query(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY;`);
    
    // Drop existing policy if present, then create fresh public policy
    const policyName = `Allow public all access on ${t}`;
    await client.query(`DROP POLICY IF EXISTS "${policyName}" ON "${t}";`);
    await client.query(`
      CREATE POLICY "${policyName}"
      ON "${t}"
      FOR ALL
      TO anon, authenticated, service_role
      USING (true)
      WITH CHECK (true);
    `);
    console.log(`RLS enabled & policy created on ${t}`);
  }

  // 6. Enable Realtime Publications on TCE tables
  console.log("\n--> Adding TCE tables to Supabase Realtime publication...");
  for (const t of tceTables) {
    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "${t}";`);
      console.log(`Added ${t} to supabase_realtime`);
    } catch (pubErr) {
      if (pubErr.message && pubErr.message.includes('already in publication')) {
        console.log(`${t} is already in supabase_realtime publication.`);
      } else {
        console.warn(`Note on publication for ${t}:`, pubErr.message);
      }
    }
  }

  console.log("\n==========================================");
  console.log("MIGRATION COMPLETED SUCCESSFULLY!");
  console.log("==========================================");

  await client.end();
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
