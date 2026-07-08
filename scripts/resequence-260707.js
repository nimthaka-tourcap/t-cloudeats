const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load env variables
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

async function run() {
  await client.connect();
  try {
    console.log("Fetching orders for business date 260707...");
    const res = await client.query("SELECT * FROM orders WHERE id LIKE 'INV-260707-%' ORDER BY timestamp ASC;");
    const remaining = res.rows;
    console.log(`Found ${remaining.length} orders.`);

    for (let i = 0; i < remaining.length; i++) {
      const oldId = remaining[i].id;
      const nextSeq = i + 1;
      const newId = `INV-260707-${String(nextSeq).padStart(3, '0')}`;
      
      if (oldId !== newId) {
        console.log(`Updating ${oldId} -> ${newId}...`);
        
        await client.query("DELETE FROM orders WHERE id = $1;", [oldId]);
        
        const insertQuery = `
          INSERT INTO orders (id, timestamp, items, subtotal, tax, total, status, type, customer)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        const values = [
          newId,
          remaining[i].timestamp,
          JSON.stringify(remaining[i].items),
          remaining[i].subtotal,
          remaining[i].tax,
          remaining[i].total,
          remaining[i].status,
          remaining[i].type,
          remaining[i].customer ? JSON.stringify(remaining[i].customer) : null
        ];
        await client.query(insertQuery, values);
      } else {
        console.log(`Order ${oldId} is already in correct sequence.`);
      }
    }
    console.log("Orders for 2026/07/07 re-sequenced successfully!");
  } catch (err) {
    console.error("Error during re-sequencing:", err);
  } finally {
    await client.end();
  }
}

run();
