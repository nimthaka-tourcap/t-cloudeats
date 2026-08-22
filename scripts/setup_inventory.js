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
  console.error("Failed to load .env file:", e);
}

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING in environment variables.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL database.");

  // Create table tce_inventory
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tce_inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      par_level NUMERIC NOT NULL DEFAULT 0,
      quantity NUMERIC NOT NULL DEFAULT 0,
      unit_cost NUMERIC NOT NULL DEFAULT 0,
      supplier TEXT,
      expiration_date TEXT,
      storage_location TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await client.query(createTableQuery);
  console.log("Table 'tce_inventory' created successfully or already exists.");

  // Check if there are any records
  const checkItems = await client.query("SELECT COUNT(*) FROM tce_inventory");
  const count = parseInt(checkItems.rows[0].count, 10);

  if (count === 0) {
    console.log("Seeding default inventory items...");
    const sampleInventory = [
      {
        id: "INV-1",
        name: "Cheese Block",
        category: "Dairy",
        sku: "INV-DAI-001",
        unit: "lbs",
        par_level: 10,
        quantity: 15,
        unit_cost: 1200,
        supplier: "Richlife Dairy Ltd",
        expiration_date: "2026-09-12",
        storage_location: "Cooler"
      },
      {
        id: "INV-2",
        name: "Kottu Roti Strips",
        category: "Produce",
        sku: "INV-DRY-001",
        unit: "lbs",
        par_level: 50,
        quantity: 80,
        unit_cost: 250,
        supplier: "Prima Flour Bakery",
        expiration_date: "2026-08-15",
        storage_location: "Dry Shelf"
      },
      {
        id: "INV-3",
        name: "Boneless Chicken Breast",
        category: "Meat",
        sku: "INV-MEA-001",
        unit: "lbs",
        par_level: 30,
        quantity: 45,
        unit_cost: 950,
        supplier: "Keells Foods",
        expiration_date: "2026-08-10",
        storage_location: "Freezer"
      },
      {
        id: "INV-4",
        name: "Penne Pasta",
        category: "Dry Goods",
        sku: "INV-DRY-002",
        unit: "cases",
        par_level: 15,
        quantity: 8,
        unit_cost: 2200,
        supplier: "Barilla Importers",
        expiration_date: "2027-02-28",
        storage_location: "Dry Shelf"
      },
      {
        id: "INV-5",
        name: "Chopped Leeks & Carrots",
        category: "Produce",
        sku: "INV-PRO-001",
        unit: "lbs",
        par_level: 20,
        quantity: 25,
        unit_cost: 180,
        supplier: "Manning Market Vendor",
        expiration_date: "2026-08-05",
        storage_location: "Cooler"
      }
    ];

    for (const item of sampleInventory) {
      await client.query(
        `INSERT INTO tce_inventory (id, name, category, sku, unit, par_level, quantity, unit_cost, supplier, expiration_date, storage_location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [item.id, item.name, item.category, item.sku, item.unit, item.par_level, item.quantity, item.unit_cost, item.supplier, item.expiration_date, item.storage_location]
      );
    }
    console.log("Seeding complete!");
  } else {
    console.log("Table 'tce_inventory' already has data. Skipping seed.");
  }

  await client.end();
}

main().catch(err => {
  console.error("Inventory setup failed:", err);
  process.exit(1);
});
