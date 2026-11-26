const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load .env
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
  console.error("Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING in .env");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const COA_SEED = [
  // 1000 - Assets (Current)
  { code: '1110', name: 'Cash in Hand', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Physical cash register & petty cash (LKR)' },
  { code: '1120', name: 'Bank Account – Operating (LKR)', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Primary Pvt Ltd commercial bank account' },
  { code: '1130', name: 'Aggregator Receivables – Uber Eats', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Net payouts receivable from Uber Eats' },
  { code: '1131', name: 'Aggregator Receivables – PickMe Food', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Net payouts receivable from PickMe Food' },
  { code: '1140', name: 'Raw Ingredient & Spice Inventory', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Perpetual inventory of meats, produce, dry goods, and spices' },
  { code: '1150', name: 'Food Packaging Inventory', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Containers, kraft boxes, bags, cutlery' },
  { code: '1160', name: 'Cleaning & Hygiene Consumables', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Sanitizers, detergents, gloves, hairnets' },
  { code: '1170', name: 'Prepaid Smallwares (Amortized 12M)', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1100', sub_type: 'CURRENT_ASSET', description: 'Low-value utensils amortized over 12 months when policy = AMORTIZE_12M' },

  // 1500 - Non-Current Assets (PP&E / CapEx)
  { code: '1510', name: 'Kitchen Equipment & Refrigeration', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1500', sub_type: 'PPE', description: 'Chillers, freezers, stainless prep tables, fryers' },
  { code: '1520', name: 'Cooking & Gas Infrastructure', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1500', sub_type: 'PPE', description: 'Gas piping, commercial burners, exhaust hoods (CapEx)' },
  { code: '1530', name: 'POS & IT Hardware', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1500', sub_type: 'PPE', description: 'POS terminals, thermal printers, routers' },
  { code: '1540', name: 'Furniture & Fixtures', account_type: 'ASSET', normal_balance: 'DEBIT', parent_code: '1500', sub_type: 'PPE', description: 'Racks, shelving, workbenches' },
  { code: '1590', name: 'Accumulated Depreciation – PP&E', account_type: 'ASSET', normal_balance: 'CREDIT', parent_code: '1500', sub_type: 'ACCUMULATED_DEPRECIATION', description: 'Contra-asset account for straight-line depreciation' },

  // 2000 - Liabilities
  { code: '2110', name: 'Accounts Payable – Suppliers', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'CURRENT_LIABILITY', description: 'Amounts owed to ingredient and packaging suppliers' },
  { code: '2120', name: 'Accrued Utilities & Salaries', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'CURRENT_LIABILITY', description: 'Unpaid salaries, electricity, water accruals' },
  { code: '2130', name: 'EPF Payable (12% Employer + 8% Employee)', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'CURRENT_LIABILITY', description: 'Central Bank of Sri Lanka EPF statutory liability' },
  { code: '2131', name: 'ETF Payable (3% Employer)', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'CURRENT_LIABILITY', description: 'Employees Trust Fund Board 3% statutory liability' },
  { code: '2135', name: 'APIT / PAYE Tax Payable', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'CURRENT_LIABILITY', description: 'Inland Revenue Department (IRD) APIT withholding payable' },
  { code: '2140', name: 'VAT Output Payable (18%)', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'CURRENT_LIABILITY', description: 'Value Added Tax collected (excluded from revenue)' },
  { code: '2145', name: 'SSCL Payable (2.5%)', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'CURRENT_LIABILITY', description: 'Social Security Contribution Levy payable' },
  { code: '2210', name: 'Director Loans / Shareholder Current Account', account_type: 'LIABILITY', normal_balance: 'CREDIT', parent_code: '2000', sub_type: 'NON_CURRENT_LIABILITY', description: 'Director advances & founder working capital loans' },

  // 3000 - Equity
  { code: '3100', name: 'Stated Capital – Ordinary Shares', account_type: 'EQUITY', normal_balance: 'CREDIT', parent_code: '3000', sub_type: 'EQUITY', description: 'Issued share capital under Companies Act No. 7 of 2007' },
  { code: '3200', name: 'Retained Earnings', account_type: 'EQUITY', normal_balance: 'CREDIT', parent_code: '3000', sub_type: 'EQUITY', description: 'Accumulated undistributed profits/losses' },

  // 4000 - Revenue
  { code: '4110', name: 'Direct Cloud Kitchen Sales', account_type: 'REVENUE', normal_balance: 'CREDIT', parent_code: '4000', sub_type: 'REVENUE', description: 'Direct takeaway, delivery, WhatsApp & dine-in sales (tax-exclusive)' },
  { code: '4120', name: 'Delivery Platform Sales – Uber Eats', account_type: 'REVENUE', normal_balance: 'CREDIT', parent_code: '4000', sub_type: 'REVENUE', description: 'Gross customer order value via Uber Eats (tax-exclusive)' },
  { code: '4121', name: 'Delivery Platform Sales – PickMe Food', account_type: 'REVENUE', normal_balance: 'CREDIT', parent_code: '4000', sub_type: 'REVENUE', description: 'Gross customer order value via PickMe Food (tax-exclusive)' },
  { code: '4900', name: 'Discounts & Refunds (Contra-Revenue)', account_type: 'REVENUE', normal_balance: 'DEBIT', parent_code: '4000', sub_type: 'CONTRA_REVENUE', description: 'Promotional discounts, customer refunds, and void allowances' },

  // 5000 - Cost of Goods Sold (COGS)
  { code: '5110', name: 'Raw Ingredients & Spices Consumed', account_type: 'COGS', normal_balance: 'DEBIT', parent_code: '5000', sub_type: 'COGS', description: 'Theoretical & actual food cost of dishes sold' },
  { code: '5120', name: 'Food Packaging Materials', account_type: 'COGS', normal_balance: 'DEBIT', parent_code: '5000', sub_type: 'COGS', description: 'Takeaway boxes, bags, foils, labels consumed' },
  { code: '5130', name: 'Kitchen Waste & Spoilage', account_type: 'COGS', normal_balance: 'DEBIT', parent_code: '5000', sub_type: 'COGS', description: 'Expired, burnt, or spoiled ingredient write-offs' },
  { code: '5140', name: 'Inventory Stock-Take Variance', account_type: 'COGS', normal_balance: 'DEBIT', parent_code: '5000', sub_type: 'COGS', description: 'Weekly physical count variance vs. perpetual ledger' },

  // 6000 - Operating Expenses (OpEx)
  { code: '6110', name: 'Kitchen Rent', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Monthly cloud kitchen facility lease' },
  { code: '6120', name: 'Electricity', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'CEB / LECO monthly power bill' },
  { code: '6130', name: 'Water', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'NWSDB water supply bill' },
  { code: '6140', name: 'LP Gas Refills (Operational)', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Recurring Litro / LAUGFS cylinder refills (distinct from Gas CapEx)' },
  { code: '6150', name: 'Internet & Telecom', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Fiber internet, POS data, kitchen hotline' },
  { code: '6160', name: 'Staff Salaries & Wages', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Gross monthly payroll for chefs, helpers, cashiers' },
  { code: '6161', name: 'EPF Employer Contribution (12%)', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Employer statutory 12% EPF expense' },
  { code: '6162', name: 'ETF Employer Contribution (3%)', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Employer statutory 3% ETF expense' },
  { code: '6200', name: 'Delivery Platform Commissions', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Uber Eats & PickMe Food marketplace commissions' },
  { code: '6210', name: 'Smallwares & Low-Value Utensils', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Pots, pans, GN containers, knives below CapEx threshold' },
  { code: '6220', name: 'Cleaning & Hygiene Expense', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Consumed cleaning chemicals and sanitation supplies' },
  { code: '6230', name: 'Marketing & Promotional Boards', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Signage, social ads, aggregator promotions' },
  { code: '6300', name: 'Depreciation Expense', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'DEPRECIATION', description: 'Monthly straight-line depreciation on PP&E' },
  { code: '6900', name: 'Miscellaneous Operating Expenses', account_type: 'OPEX', normal_balance: 'DEBIT', parent_code: '6000', sub_type: 'OPEX', description: 'Other general & administrative kitchen expenses' }
];

async function main() {
  await client.connect();
  console.log("Connected to PostgreSQL.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS tce_accounting_settings (
      id TEXT PRIMARY KEY DEFAULT 'DEFAULT',
      company_name TEXT NOT NULL DEFAULT 'T-Cloud Eats (Pvt) Ltd',
      company_reg_no TEXT DEFAULT '',
      fiscal_year_start_month INT NOT NULL DEFAULT 4,
      fiscal_year_start_day INT NOT NULL DEFAULT 1,
      vat_registered BOOLEAN NOT NULL DEFAULT false,
      vat_rate NUMERIC(6,4) NOT NULL DEFAULT 0.1800,
      sscl_registered BOOLEAN NOT NULL DEFAULT false,
      sscl_rate NUMERIC(6,4) NOT NULL DEFAULT 0.0250,
      capex_threshold NUMERIC(14,2) NOT NULL DEFAULT 25000.00,
      uber_commission_rate NUMERIC(6,4) NOT NULL DEFAULT 0.3300,
      pickme_commission_rate NUMERIC(6,4) NOT NULL DEFAULT 0.2200,
      smallwares_policy TEXT NOT NULL DEFAULT 'EXPENSE',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tce_chart_of_accounts (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      normal_balance TEXT NOT NULL,
      parent_code TEXT,
      sub_type TEXT,
      is_system BOOLEAN NOT NULL DEFAULT true,
      is_active BOOLEAN NOT NULL DEFAULT true,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS tce_journal_entries (
      id TEXT PRIMARY KEY,
      entry_date DATE NOT NULL,
      fiscal_year TEXT NOT NULL,
      reference_type TEXT NOT NULL,
      reference_id TEXT,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'POSTED',
      reversed_by_id TEXT,
      reverses_entry_id TEXT,
      reversal_reason TEXT,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tce_je_date ON tce_journal_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_tce_je_ref ON tce_journal_entries(reference_type, reference_id);

    CREATE TABLE IF NOT EXISTS tce_journal_lines (
      id SERIAL PRIMARY KEY,
      journal_entry_id TEXT NOT NULL REFERENCES tce_journal_entries(id) ON DELETE RESTRICT,
      account_code TEXT NOT NULL REFERENCES tce_chart_of_accounts(code) ON DELETE RESTRICT,
      debit NUMERIC(14,2) NOT NULL DEFAULT 0,
      credit NUMERIC(14,2) NOT NULL DEFAULT 0,
      memo TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tce_jl_je ON tce_journal_lines(journal_entry_id);
    CREATE INDEX IF NOT EXISTS idx_tce_jl_acc ON tce_journal_lines(account_code);

    CREATE TABLE IF NOT EXISTS tce_fixed_assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      asset_category TEXT NOT NULL,
      account_code TEXT NOT NULL REFERENCES tce_chart_of_accounts(code),
      accum_dep_account_code TEXT NOT NULL DEFAULT '1590',
      purchase_date DATE NOT NULL,
      cost NUMERIC(14,2) NOT NULL,
      residual_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      useful_life_months INT NOT NULL,
      monthly_depreciation NUMERIC(14,2) NOT NULL,
      accumulated_depreciation NUMERIC(14,2) NOT NULL DEFAULT 0,
      last_depreciation_date DATE,
      supplier TEXT,
      invoice_ref TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      journal_entry_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tce_recipes (
      id TEXT PRIMARY KEY,
      menu_item_id INT,
      dish_name TEXT NOT NULL,
      portion TEXT NOT NULL DEFAULT 'Regular',
      packaging_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      utility_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tce_recipe_ingredients (
      id SERIAL PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES tce_recipes(id) ON DELETE CASCADE,
      inventory_id TEXT,
      ingredient_name TEXT NOT NULL,
      recipe_qty NUMERIC(12,4) NOT NULL,
      recipe_unit TEXT NOT NULL,
      unit_cost_override NUMERIC(12,4)
    );

    CREATE TABLE IF NOT EXISTS tce_stock_movements (
      id TEXT PRIMARY KEY,
      inventory_id TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity_delta NUMERIC(12,4) NOT NULL,
      unit TEXT NOT NULL,
      unit_cost NUMERIC(14,2) NOT NULL,
      total_cost NUMERIC(14,2) NOT NULL,
      reference_id TEXT,
      reason TEXT,
      journal_entry_id TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tce_employees (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      nic_no TEXT,
      role TEXT NOT NULL,
      basic_salary NUMERIC(14,2) NOT NULL,
      allowances NUMERIC(14,2) NOT NULL DEFAULT 0,
      epf_number TEXT,
      apit_applicable BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tce_payroll_runs (
      id TEXT PRIMARY KEY,
      pay_period TEXT NOT NULL,
      pay_date DATE NOT NULL,
      employee_id TEXT NOT NULL REFERENCES tce_employees(id),
      employee_name TEXT NOT NULL,
      gross_salary NUMERIC(14,2) NOT NULL,
      epf_employee_8 NUMERIC(14,2) NOT NULL,
      epf_employer_12 NUMERIC(14,2) NOT NULL,
      etf_employer_3 NUMERIC(14,2) NOT NULL,
      apit_tax NUMERIC(14,2) NOT NULL DEFAULT 0,
      net_salary NUMERIC(14,2) NOT NULL,
      total_employer_cost NUMERIC(14,2) NOT NULL,
      journal_entry_id TEXT,
      status TEXT NOT NULL DEFAULT 'POSTED',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tce_aggregator_settlements (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      settlement_date DATE NOT NULL,
      gross_sales NUMERIC(14,2) NOT NULL,
      commission_amount NUMERIC(14,2) NOT NULL,
      net_payout_received NUMERIC(14,2) NOT NULL,
      bank_account_code TEXT NOT NULL DEFAULT '1120',
      reference_no TEXT,
      journal_entry_id TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("All tce_ accounting tables created/verified.");

  // Seed default settings
  await client.query(`
    INSERT INTO tce_accounting_settings (id) VALUES ('DEFAULT')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Seed Chart of Accounts
  for (const acc of COA_SEED) {
    await client.query(
      `INSERT INTO tce_chart_of_accounts (code, name, account_type, normal_balance, parent_code, sub_type, is_system, is_active, description)
       VALUES ($1, $2, $3, $4, $5, $6, true, true, $7)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         account_type = EXCLUDED.account_type,
         normal_balance = EXCLUDED.normal_balance,
         parent_code = EXCLUDED.parent_code,
         sub_type = EXCLUDED.sub_type`,
      [acc.code, acc.name, acc.account_type, acc.normal_balance, acc.parent_code, acc.sub_type, acc.description]
    );
  }
  console.log(`Seeded ${COA_SEED.length} Chart of Accounts entries.`);

  await client.end();
}

main().catch(err => {
  console.error("Setup failed:", err);
  process.exit(1);
});
