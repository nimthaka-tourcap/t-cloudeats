const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Disable SSL certificate validation for the setup script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Custom zero-dependency .env loader
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
  console.log("Connected to PostgreSQL database.");

  // Create table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      price NUMERIC NOT NULL,
      category TEXT NOT NULL,
      portion TEXT NOT NULL,
      image TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await client.query(createTableQuery);
  console.log("Table 'menu_items' created or already exists.");

  // Check if it has items
  const checkItems = await client.query("SELECT COUNT(*) FROM menu_items");
  const count = parseInt(checkItems.rows[0].count, 10);

  if (count === 0) {
    console.log("Seeding default menu items...");
    const defaultItems = [
      { title: "Egg Fried Rice", price: 750, category: "Fried Rice", portion: "Full Portion" },
      { title: "Classic Chicken Fried Rice", price: 1000, category: "Fried Rice", portion: "Full Portion" },
      { title: "Prawns Fried Rice", price: 1100, category: "Fried Rice", portion: "Full Portion" },
      { title: "Beef Fried Rice", price: 1200, category: "Fried Rice", portion: "Full Portion" },
      { title: "Seafood Fried Rice", price: 1300, category: "Fried Rice", portion: "Full Portion" },
      { title: "Surf & Turf Fried Rice", price: 1400, category: "Fried Rice", portion: "Full Portion" },
      { title: "Nasi Goreng", price: 1300, category: "Fried Rice", portion: "Full Portion" },
      { title: "Chicken Chopsuey Rice", price: 1250, category: "Chopsuey", portion: "Full Portion" },
      { title: "Prawn Chopsuey Rice", price: 1350, category: "Chopsuey", portion: "Full Portion" },
      { title: "Seafood Chopsuey Rice", price: 1450, category: "Chopsuey", portion: "Full Portion" },
      { title: "Surf & Turf Chopsuey Rice", price: 1600, category: "Chopsuey", portion: "Full Portion" },
      { title: "Egg Fried Noodles", price: 750, category: "Noodles", portion: "Full Portion" },
      { title: "Chicken Fried Noodles", price: 1000, category: "Noodles", portion: "Full Portion" },
      { title: "Prawn Fried Noodles", price: 1100, category: "Noodles", portion: "Full Portion" },
      { title: "Beef Fried Noodles", price: 1200, category: "Noodles", portion: "Full Portion" },
      { title: "Seafood Fried Noodles", price: 1300, category: "Noodles", portion: "Full Portion" },
      { title: "Surf & Turf Fried Noodles", price: 1400, category: "Noodles", portion: "Full Portion" },
      { title: "Egg Kottu", price: 750, category: "Kottu", portion: "Full Portion" },
      { title: "Chicken Kottu", price: 1000, category: "Kottu", portion: "Full Portion" },
      { title: "Beef Kottu", price: 1200, category: "Kottu", portion: "Full Portion" },
      { title: "Seafood Kottu", price: 1300, category: "Kottu", portion: "Full Portion" },
      { title: "Surf & Turf Kottu", price: 1400, category: "Kottu", portion: "Full Portion" },
      { title: "Fried Chicken Cheese Kottu", price: 1500, category: "Kottu", portion: "Full Portion" },
      { title: "Sri Lankan Chicken Devilled", price: 1000, category: "Ultimate Bites", portion: "250g" },
      { title: "Sri Lankan Fish Devilled", price: 1100, category: "Ultimate Bites", portion: "250g" },
      { title: "Sri Lankan Prawn Devilled", price: 1100, category: "Ultimate Bites", portion: "250g" },
      { title: "Sri Lankan Beef Devilled", price: 1400, category: "Ultimate Bites", portion: "250g" },
      { title: "Sri Lankan Pork Devilled", price: 1300, category: "Ultimate Bites", portion: "250g" },
      { title: "Garlic Buttered Vegetable", price: 900, category: "Ultimate Bites", portion: "Regular" },
      { title: "French Fries", price: 800, category: "Ultimate Bites", portion: "Regular" },
      { title: "Kochi Bite", price: 800, category: "Ultimate Bites", portion: "10 Pcs" },
      { title: "Hot Butter Cuttlefish", price: 900, category: "Ultimate Bites", portion: "Regular" },
      { title: "Ice Milo", price: 250, category: "Beverages", portion: "Regular" },
      { title: "Milk Shake", price: 350, category: "Beverages", portion: "Regular" },
      { title: "Ice Coffee", price: 250, category: "Beverages", portion: "Regular" },
      { title: "Mineral Water", price: 100, category: "Beverages", portion: "1 Liter" }
    ];

    for (const item of defaultItems) {
      await client.query(
        "INSERT INTO menu_items (title, price, category, portion) VALUES ($1, $2, $3, $4)",
        [item.title, item.price, item.category, item.portion]
      );
    }
    console.log("Seeding complete!");
  } else {
    console.log("Table already has data. Skipping seeding.");
  }

  await client.end();
}

main().catch(err => {
  console.error("Setup failed:", err);
  process.exit(1);
});
