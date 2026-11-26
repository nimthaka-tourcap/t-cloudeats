const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
if (!connectionString) {
  console.error("Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING");
  process.exit(1);
}

const FIXED_ASSETS = [
  { name: "POS Monitor Terminal", category: "POS_IT_HARDWARE", account: "1530", cost: 150000 },
  { name: "POS Tablet", category: "POS_IT_HARDWARE", account: "1530", cost: 60000 },
  { name: "Vertical Fridge", category: "KITCHEN_EQUIPMENT", account: "1510", cost: 150000 },
  { name: "Undercounter Chiller", category: "KITCHEN_EQUIPMENT", account: "1510", cost: 230000 },
  { name: "Haier Freezer / Fridge", category: "KITCHEN_EQUIPMENT", account: "1510", cost: 90000 },
  { name: "Stainless Working Table", category: "FURNITURE_FIXTURES", account: "1540", cost: 75000 },
  { name: "Commercial Sink", category: "FURNITURE_FIXTURES", account: "1540", cost: 85000 },
  { name: "Storage Rack", category: "FURNITURE_FIXTURES", account: "1540", cost: 25000 },
  { name: "Gas Line / Piping (Main)", category: "GAS_INFRASTRUCTURE", account: "1520", cost: 140000 },
  { name: "Gas Line / Piping (Extra)", category: "GAS_INFRASTRUCTURE", account: "1520", cost: 120000 },
  { name: "Gas Burner / Equipment 1", category: "GAS_INFRASTRUCTURE", account: "1520", cost: 55000 },
  { name: "Gas Burner / Equipment 2", category: "GAS_INFRASTRUCTURE", account: "1520", cost: 55000 },
  { name: "Gas Cylinder & Regulator Setup", category: "GAS_INFRASTRUCTURE", account: "1520", cost: 25000 },
  { name: "Hot Plate", category: "KITCHEN_EQUIPMENT", account: "1510", cost: 16000 },
  { name: "Deep Fryer", category: "KITCHEN_EQUIPMENT", account: "1510", cost: 11000 },
  { name: "Exhaust Fan & Installation", category: "FURNITURE_FIXTURES", account: "1540", cost: 13000 },
  { name: "Wall / Standing Fan", category: "FURNITURE_FIXTURES", account: "1540", cost: 9500 },
  { name: "Impulse / Packaging Sealer", category: "KITCHEN_EQUIPMENT", account: "1510", cost: 9500 },
  { name: "Digital Weighing Scale", category: "KITCHEN_EQUIPMENT", account: "1510", cost: 6000 },
];

const SMALLWARES = [
  { name: "1x2 Deep GN Container", qty: 4 },
  { name: "1x1 GN Container", qty: 4 },
  { name: "1x1 8-Inch Deep GN Container", qty: 2 },
  { name: "1x1 6-Inch Deep GN Container", qty: 2 },
  { name: "1x2 Shallow GN Container", qty: 6 },
  { name: "Small Pot", qty: 1 },
  { name: "Large Pot", qty: 1 },
  { name: "Large Colander", qty: 1 },
  { name: "Small Colander", qty: 1 },
  { name: "Condiments Container", qty: 1 },
  { name: "Chopping Board", qty: 2 },
  { name: "Small Blender", qty: 1 },
  { name: "Wok", qty: 2 },
  { name: "Larger Wok", qty: 1 },
  { name: "Wok Spoon", qty: 3 },
  { name: "Soup Ladle", qty: 1 },
  { name: "Spider Spoon", qty: 1 },
  { name: "Cleaver Knife", qty: 1 },
  { name: "Spoons", qty: 8 },
  { name: "Sauce Pan", qty: 2 },
  { name: "Plastic Container", qty: 10 },
  { name: "Shaker", qty: 1 },
];

const CLEANING = [
  { name: "Dishwash Liquid", unit: "L" },
  { name: "Floor Mop", unit: "pcs" },
  { name: "Clorox / Bleach", unit: "L" },
  { name: "Hand Wash", unit: "L" },
];

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to PostgreSQL for Kitchen Setup Seed.");

  // 1. Ensure 6400, 6500, 6600 CoA codes exist
  const extraCoa = [
    { code: "6400", name: "Smallwares & Kitchen Utensils", type: "OPEX", normal: "DEBIT", parent: "6000", sub: "OPEX", desc: "Utensils, GN pans, pots, woks, knives" },
    { code: "6500", name: "Cleaning & Hygiene Supplies", type: "OPEX", normal: "DEBIT", parent: "6000", sub: "OPEX", desc: "Dishwash liquid, bleach, mops, hand wash" },
    { code: "6600", name: "Marketing & Promotional", type: "OPEX", normal: "DEBIT", parent: "6000", sub: "OPEX", desc: "Promotional boards, signage, ads" },
  ];
  for (const c of extraCoa) {
    await client.query(
      `INSERT INTO tce_chart_of_accounts (code, name, account_type, normal_balance, parent_code, sub_type, is_system, is_active, description)
       VALUES ($1, $2, $3, $4, $5, $6, true, true, $7)
       ON CONFLICT (code) DO NOTHING`,
      [c.code, c.name, c.type, c.normal, c.parent, c.sub, c.desc]
    );
  }

  // 2. Seed Fixed Assets idempotently by name
  let faInserted = 0;
  const countRes = await client.query(`SELECT COUNT(*) FROM tce_fixed_assets`);
  let faSeq = parseInt(countRes.rows[0].count, 10);

  for (const fa of FIXED_ASSETS) {
    const exists = await client.query(`SELECT id FROM tce_fixed_assets WHERE name = $1 LIMIT 1`, [fa.name]);
    if (exists.rows.length === 0) {
      faSeq++;
      const faId = `FA-${String(faSeq).padStart(4, "0")}`;
      const monthlyDep = Math.round((fa.cost / 60) * 100) / 100;
      await client.query(
        `INSERT INTO tce_fixed_assets
          (id, name, asset_category, account_code, purchase_date, cost, residual_value, useful_life_months, monthly_depreciation, status)
         VALUES ($1, $2, $3, $4, '2026-07-02', $5, 0, 60, $6, 'ACTIVE')`,
        [faId, fa.name, fa.category, fa.account, fa.cost, monthlyDep]
      );
      faInserted++;
    }
  }

  // 3. Seed Promotional Boards OpEx (6600) idempotently
  const promoExists = await client.query(
    `SELECT id FROM tce_journal_entries WHERE reference_id = 'SETUP-PROMO-BOARDS' LIMIT 1`
  );
  if (promoExists.rows.length === 0) {
    const jeId = `JE-SETUP-PROMO`;
    await client.query(
      `INSERT INTO tce_journal_entries (id, entry_date, fiscal_year, reference_type, reference_id, description, status, created_by)
       VALUES ($1, CURRENT_DATE, 'FY2026/27', 'EXPENSE', 'SETUP-PROMO-BOARDS', 'Initial Setup: Promotional Boards (6600)', 'POSTED', 'OWNER_SEED')
       ON CONFLICT (id) DO NOTHING`,
      [jeId]
    );
    await client.query(
      `INSERT INTO tce_journal_lines (journal_entry_id, account_code, debit, credit, memo)
       VALUES ($1, '6600', 6500.00, 0, 'Promotional Boards'), ($1, '2210', 0, 6500.00, 'Founder/Director Setup Advance')`,
      [jeId]
    );
  }

  // 4. Seed Kitchen Smallwares idempotently
  let swInserted = 0;
  for (let i = 0; i < SMALLWARES.length; i++) {
    const sw = SMALLWARES[i];
    const exists = await client.query(`SELECT id FROM tce_inventory WHERE name = $1 LIMIT 1`, [sw.name]);
    if (exists.rows.length === 0) {
      const id = `INV-SW-${String(i + 1).padStart(3, "0")}`;
      const sku = `SW-${String(i + 1).padStart(3, "0")}`;
      await client.query(
        `INSERT INTO tce_inventory (id, name, category, sku, unit, par_level, quantity, unit_cost, storage_location)
         VALUES ($1, $2, 'Kitchen Smallwares', $3, 'pcs', $4, $4, 0, 'Dry Shelf')`,
        [id, sw.name, sku, sw.qty]
      );
      swInserted++;
    }
  }

  // 5. Seed Cleaning & Hygiene Consumables idempotently
  let clInserted = 0;
  for (let i = 0; i < CLEANING.length; i++) {
    const cl = CLEANING[i];
    const exists = await client.query(`SELECT id FROM tce_inventory WHERE name = $1 LIMIT 1`, [cl.name]);
    if (exists.rows.length === 0) {
      const id = `INV-CL-${String(i + 1).padStart(3, "0")}`;
      const sku = `CL-${String(i + 1).padStart(3, "0")}`;
      await client.query(
        `INSERT INTO tce_inventory (id, name, category, sku, unit, par_level, quantity, unit_cost, storage_location)
         VALUES ($1, $2, 'Cleaning & Hygiene', $3, $4, 0, 0, 0, 'Dry Shelf')`,
        [id, cl.name, sku, cl.unit]
      );
      clInserted++;
    }
  }

  // 6. Seed Employee Thushan Indika idempotently
  const empExists = await client.query(`SELECT id FROM tce_employees WHERE full_name = 'Thushan Indika' LIMIT 1`);
  let empInserted = 0;
  if (empExists.rows.length === 0) {
    await client.query(
      `INSERT INTO tce_employees (id, full_name, role, basic_salary, allowances, apit_applicable, is_active)
       VALUES ('EMP-0001', 'Thushan Indika', 'Kitchen Staff', 120000.00, 0, true, true)`
    );
    empInserted = 1;
  }

  console.log(`Seed complete: ${faInserted} Fixed Assets, ${swInserted} Smallwares, ${clInserted} Cleaning items, ${empInserted} Employee.`);
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
