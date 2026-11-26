import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

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

export async function POST() {
  try {
    const result = await withTransaction(async (client) => {
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
            `INSERT INTO tce_fixed_assets (id, name, asset_category, account_code, purchase_date, cost, residual_value, useful_life_months, monthly_depreciation, status)
             VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 0, 60, $6, 'ACTIVE')`,
            [faId, fa.name, fa.category, fa.account, fa.cost, monthlyDep]
          );
          faInserted++;
        }
      }

      let swInserted = 0;
      for (let i = 0; i < SMALLWARES.length; i++) {
        const sw = SMALLWARES[i];
        const exists = await client.query(`SELECT id FROM tce_inventory WHERE name = $1 LIMIT 1`, [sw.name]);
        if (exists.rows.length === 0) {
          await client.query(
            `INSERT INTO tce_inventory (id, name, category, sku, unit, par_level, quantity, unit_cost, storage_location)
             VALUES ($1, $2, 'Kitchen Smallwares', $3, 'pcs', $4, $4, 0, 'Dry Shelf')`,
            [`INV-SW-${String(i + 1).padStart(3, "0")}`, sw.name, `SW-${String(i + 1).padStart(3, "0")}`, sw.qty]
          );
          swInserted++;
        }
      }

      let clInserted = 0;
      for (let i = 0; i < CLEANING.length; i++) {
        const cl = CLEANING[i];
        const exists = await client.query(`SELECT id FROM tce_inventory WHERE name = $1 LIMIT 1`, [cl.name]);
        if (exists.rows.length === 0) {
          await client.query(
            `INSERT INTO tce_inventory (id, name, category, sku, unit, par_level, quantity, unit_cost, storage_location)
             VALUES ($1, $2, 'Cleaning & Hygiene', $3, $4, 0, 0, 0, 'Dry Shelf')`,
            [`INV-CL-${String(i + 1).padStart(3, "0")}`, cl.name, `CL-${String(i + 1).padStart(3, "0")}`, cl.unit]
          );
          clInserted++;
        }
      }

      const empExists = await client.query(`SELECT id FROM tce_employees WHERE full_name = 'Thushan Indika' LIMIT 1`);
      let empInserted = 0;
      if (empExists.rows.length === 0) {
        await client.query(
          `INSERT INTO tce_employees (id, full_name, role, basic_salary, allowances, apit_applicable, is_active)
           VALUES ('EMP-0001', 'Thushan Indika', 'Kitchen Staff', 120000.00, 0, true, true)`
        );
        empInserted = 1;
      }

      return { faInserted, swInserted, clInserted, empInserted };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
