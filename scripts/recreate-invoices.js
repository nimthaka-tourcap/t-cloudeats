const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// load env variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const cleanLine = line.replace(/\r/g, '').trim();
    if (!cleanLine || cleanLine.startsWith('#')) return;
    const parts = cleanLine.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (parts) {
      process.env[parts[1]] = parts[2].replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const correctOrders = [
  {
    id: "INV-260707-001",
    timestamp: "2026-07-07T11:22:24.000Z",
    customer: { name: "Pasindu ", phone: "+94743634878", address: "angoda, Andiambalama 11558" },
    items: [
      {
        quantity: 1,
        menuItem: { id: 13, sku: "KT-02", price: 1100, title: "Chicken Kottu", portion: "Serves Two", category: "Kottu" },
        comment: "extra onion . pick up at 6.45pm"
      }
    ],
    subtotal: 1100,
    tax: 0,
    total: 1100,
    status: "Completed",
    type: "Delivery"
  },
  {
    id: "INV-260707-002",
    timestamp: "2026-07-07T12:51:15.000Z",
    customer: { name: "Aruna Wasantha ", phone: "+94769912175", address: "bank juction, Angoda 10620" },
    items: [
      {
        quantity: 1,
        menuItem: { id: 2, sku: "FR-02", price: 1100, title: "Classic Chicken Fried Rice", portion: "Serves Two", category: "Fried Rice" }
      }
    ],
    subtotal: 1100,
    tax: 0,
    total: 1100,
    status: "Completed",
    type: "Delivery"
  },
  {
    id: "INV-260707-003",
    timestamp: "2026-07-07T13:47:00.000Z",
    customer: { name: "Jayanthi", phone: "+94742305161", address: "godella, Angoda 10620" },
    items: [
      {
        quantity: 1,
        menuItem: { id: 13, sku: "KT-02", price: 1100, title: "Chicken Kottu", portion: "Serves Two", category: "Kottu" }
      }
    ],
    subtotal: 1100,
    tax: 0,
    total: 1100,
    status: "Completed",
    type: "Delivery"
  },
  {
    id: "INV-260707-004",
    timestamp: "2026-07-07T13:48:00.000Z",
    customer: { name: "Hansa Chathuranga", phone: "+94718137778", address: "Angoda" },
    items: [
      {
        quantity: 1,
        menuItem: { id: 2, sku: "FR-02", price: 1100, title: "Classic Chicken Fried Rice", portion: "Serves Two", category: "Fried Rice" }
      }
    ],
    subtotal: 1100,
    tax: 0,
    total: 1100,
    status: "Completed",
    type: "Take Away"
  },
  {
    id: "INV-260707-005",
    timestamp: "2026-07-07T14:08:45.000Z",
    customer: { name: "Jayanthi", phone: "+94742305161", address: "godella, Angoda 10620" },
    items: [
      {
        quantity: 1,
        menuItem: { id: 25, sku: "BV-03", price: 300, title: "Coca Cola (1050 ml)", portion: "1050 ml", category: "Beverages" }
      }
    ],
    subtotal: 300,
    tax: 0,
    total: 300,
    status: "Completed",
    type: "Delivery"
  },
  {
    id: "INV-260707-006",
    timestamp: "2026-07-07T14:29:43.000Z",
    customer: { name: "kiyosi ge siya", phone: "+94776090305", address: "godella, Angoda 10620" },
    items: [
      {
        quantity: 1,
        menuItem: { id: 2, sku: "FR-02", price: 1100, title: "Classic Chicken Fried Rice", portion: "Serves Two", category: "Fried Rice" }
      }
    ],
    subtotal: 1100,
    tax: 0,
    total: 1100,
    status: "Completed",
    type: "Delivery"
  },
  {
    id: "INV-260707-007",
    timestamp: "2026-07-07T15:27:00.000Z",
    customer: { name: "Dilhani", phone: "+94719236781", address: "Godella road, Mulleriyawa 10620" },
    items: [
      {
        quantity: 1,
        menuItem: { id: 5, sku: "FR-05", price: 900, title: "Seafood Fried Rice", portion: "Serves Two", category: "Fried Rice" }
      },
      {
        quantity: 1,
        menuItem: { id: 22, sku: "UB-05", price: 900, title: "Sri Lankan Pork Devilled", portion: "250g", category: "Ultimate Bites" }
      }
    ],
    subtotal: 1800,
    tax: 0,
    total: 1800,
    status: "Completed",
    type: "Delivery"
  },
  {
    id: "INV-260707-008",
    timestamp: "2026-07-07T15:45:00.000Z",
    customer: {
      name: "Dilshan Tiwanka",
      phone: "+94764008414",
      address: "557/3/5, Godella Mawatha, New Town, Mulleriyawa 10620"
    },
    items: [
      {
        quantity: 1,
        menuItem: { id: 8, sku: "CS-01", price: 1500, title: "Chicken Chopsuey Rice", portion: "Serves Two", category: "Chopsuey" },
        comment: "4 person,1500/="
      }
    ],
    subtotal: 1500,
    tax: 0,
    total: 1500,
    status: "Completed",
    type: "Delivery"
  },
  {
    id: "INV-260707-009",
    timestamp: "2026-07-07T16:00:00.000Z",
    customer: {
      name: "Nimthaka Kannangara",
      phone: "+94701340716",
      address: "499/3/C/11, Siriperakum Mawatha, Mulleriyawa 10620"
    },
    items: [
      {
        quantity: 1,
        menuItem: { id: 8, sku: "CS-01", price: 1300, title: "Chicken Chopsuey Rice", portion: "Serves Two", category: "Chopsuey" }
      }
    ],
    subtotal: 1300,
    tax: 0,
    total: 1300,
    status: "Completed",
    type: "Take Away"
  }
];

async function run() {
  await client.connect();
  try {
    console.log("Deleting all existing 260707 invoices (including ignored ones)...");
    await client.query("DELETE FROM orders WHERE id LIKE 'INV-260707-%' OR id LIKE 'IGNORED-260707-%';");

    console.log("Inserting correct invoices into PG...");
    for (const order of correctOrders) {
      const insertQuery = `
        INSERT INTO orders (id, timestamp, items, subtotal, tax, total, status, type, customer)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `;
      const values = [
        order.id,
        order.timestamp,
        JSON.stringify(order.items),
        order.subtotal,
        order.tax,
        order.total,
        order.status,
        order.type,
        JSON.stringify(order.customer)
      ];
      await client.query(insertQuery, values);
      console.log(`Inserted ${order.id} | ${order.customer.name} | Total: ${order.total}`);
    }

    console.log("Invoices recreated successfully in PG!");
  } catch (err) {
    console.error("Error recreating invoices:", err);
  } finally {
    await client.end();
  }
}

run();
