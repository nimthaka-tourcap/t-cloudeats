const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Disable SSL certificate validation for the script
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

function cleanTitle(title) {
  return title.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
}

async function main() {
  await client.connect();
  console.log("Connected to PostgreSQL database.");

  // 1. Read scraped JSON from scratchpad
  const scratchpadPath = "C:\\Users\\nimth\\.gemini\\antigravity-ide\\brain\\93bb7aa2-952e-45f7-bb6f-eef8b8d7d2ef\\browser\\scratchpad_mj1qjeos.md";
  if (!fs.existsSync(scratchpadPath)) {
    console.error("Scraped scratchpad file not found.");
    process.exit(1);
  }

  const content = fs.readFileSync(scratchpadPath, 'utf8');
  const jsonMatch = content.match(/```json([\s\S]*?)```/);
  if (!jsonMatch) {
    console.error("No JSON block found in scratchpad.");
    process.exit(1);
  }

  const scrapedItems = JSON.parse(jsonMatch[1].trim());
  console.log(`Loaded ${scrapedItems.length} scraped items from Google Menu.`);

  // 2. Fetch all database menu items
  const res = await client.query("SELECT id, title, price FROM menu_items");
  const dbItems = res.rows;
  console.log(`Fetched ${dbItems.length} menu items from database.`);

  let updatedCount = 0;

  // 3. Match and update prices
  for (const scraped of scrapedItems) {
    const googleTitle = scraped.title;
    const googlePrice = Number(scraped.price);

    const matchedDbItem = dbItems.find(dbItem => {
      return cleanTitle(dbItem.title) === cleanTitle(googleTitle);
    });

    if (matchedDbItem) {
      if (Number(matchedDbItem.price) !== googlePrice) {
        console.log(`Updating "${matchedDbItem.title}": LKR ${matchedDbItem.price} -> LKR ${googlePrice}`);
        await client.query(
          "UPDATE menu_items SET price = $1 WHERE id = $2",
          [googlePrice, matchedDbItem.id]
        );
        updatedCount++;
      } else {
        console.log(`"${matchedDbItem.title}" already matches (LKR ${googlePrice}).`);
      }
    } else {
      console.log(`No database match found for Google item: "${googleTitle}"`);
    }
  }

  console.log(`Update complete. Updated ${updatedCount} items.`);
  await client.end();
}

main().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
