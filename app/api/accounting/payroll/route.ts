import { NextResponse } from "next/server";
import { getPool, withTransaction } from "@/lib/db";
import { postJournalEntry } from "@/lib/accounting/ledger";
import { calculateSriLankaPayroll } from "@/lib/accounting/payroll";
import { round2, todayISO } from "@/lib/accounting/format";

export async function GET() {
  try {
    const pool = getPool();
    const [empRes, runRes] = await Promise.all([
      pool.query(`SELECT * FROM tce_employees ORDER BY full_name ASC`),
      pool.query(`SELECT * FROM tce_payroll_runs ORDER BY pay_date DESC, id DESC LIMIT 100`),
    ]);
    return NextResponse.json({
      employees: empRes.rows,
      runs: runRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "ADD_EMPLOYEE") {
      const { full_name, nic_no, role, basic_salary, allowances = 0, epf_number, apit_applicable = false } = body;
      if (!full_name || !role || !basic_salary) {
        return NextResponse.json({ error: "Missing employee fields" }, { status: 400 });
      }
      const pool = getPool();
      const id = `EMP-${Date.now().toString().slice(-6)}`;
      const res = await pool.query(
        `INSERT INTO tce_employees (id, full_name, nic_no, role, basic_salary, allowances, epf_number, apit_applicable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, full_name, nic_no || null, role, Number(basic_salary), Number(allowances), epf_number || null, Boolean(apit_applicable)]
      );
      return NextResponse.json(res.rows[0], { status: 201 });
    }

    if (action === "RUN_PAYROLL") {
      const { pay_period, pay_date = todayISO(), payment_account = "1120", createdBy = "DIRECTOR" } = body;
      if (!pay_period) {
        return NextResponse.json({ error: "pay_period (YYYY-MM) is required" }, { status: 400 });
      }

      const result = await withTransaction(async (client) => {
        const empRes = await client.query(
          `SELECT * FROM tce_employees WHERE is_active = true ORDER BY full_name`
        );
        if (empRes.rows.length === 0) {
          throw new Error("No active employees found.");
        }

        let totalGross = 0;
        let totalEpfEmp8 = 0;
        let totalEpfEr12 = 0;
        let totalEtfEr3 = 0;
        let totalApit = 0;
        let totalNet = 0;
        const runRecords: any[] = [];

        for (const emp of empRes.rows) {
          const calc = calculateSriLankaPayroll(
            Number(emp.basic_salary),
            Number(emp.allowances),
            Boolean(emp.apit_applicable)
          );
          totalGross = round2(totalGross + calc.grossSalary);
          totalEpfEmp8 = round2(totalEpfEmp8 + calc.epfEmployee8);
          totalEpfEr12 = round2(totalEpfEr12 + calc.epfEmployer12);
          totalEtfEr3 = round2(totalEtfEr3 + calc.etfEmployer3);
          totalApit = round2(totalApit + calc.apitTax);
          totalNet = round2(totalNet + calc.netSalary);
          runRecords.push({ emp, calc });
        }

        const totalEpfPayable = round2(totalEpfEmp8 + totalEpfEr12);
        const lines: { accountCode: string; debit?: number; credit?: number; memo?: string }[] = [
          { accountCode: "6160", debit: totalGross, memo: `Gross salaries (${pay_period})` },
          { accountCode: "6161", debit: totalEpfEr12, memo: `Employer EPF 12% (${pay_period})` },
          { accountCode: "6162", debit: totalEtfEr3, memo: `Employer ETF 3% (${pay_period})` },
          { accountCode: "2130", credit: totalEpfPayable, memo: `Total EPF Payable 20% (${pay_period})` },
          { accountCode: "2131", credit: totalEtfEr3, memo: `ETF Payable 3% (${pay_period})` },
          { accountCode: payment_account, credit: totalNet, memo: `Net salary payout (${pay_period})` },
        ];
        if (totalApit > 0) {
          lines.push({ accountCode: "2135", credit: totalApit, memo: `APIT Tax Payable (${pay_period})` });
        }

        const je = await postJournalEntry(client, {
          entryDate: pay_date,
          referenceType: "PAYROLL",
          referenceId: `PAY-${pay_period}`,
          description: `Monthly Sri Lanka Payroll (${pay_period}) - ${empRes.rows.length} staff`,
          createdBy,
          lines,
        });

        for (const { emp, calc } of runRecords) {
          const runId = `PR-${pay_period}-${emp.id}`;
          await client.query(
            `INSERT INTO tce_payroll_runs
              (id, pay_period, pay_date, employee_id, employee_name, gross_salary, epf_employee_8, epf_employer_12, etf_employer_3, apit_tax, net_salary, total_employer_cost, journal_entry_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              runId,
              pay_period,
              pay_date,
              emp.id,
              emp.full_name,
              calc.grossSalary,
              calc.epfEmployee8,
              calc.epfEmployer12,
              calc.etfEmployer3,
              calc.apitTax,
              calc.netSalary,
              calc.totalEmployerCost,
              je.id,
            ]
          );
        }

        return { journalEntryId: je.id, staffCount: runRecords.length, totalGross, totalNet, totalEpfPayable, totalEtfEr3, totalApit };
      });

      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, full_name, role, basic_salary, allowances, apit_applicable, is_active } = body;
    if (!id || !full_name) {
      return NextResponse.json({ error: "Employee id and full_name are required" }, { status: 400 });
    }
    const pool = getPool();
    const res = await pool.query(
      `UPDATE tce_employees
       SET full_name = $1,
           role = COALESCE($2, role),
           basic_salary = COALESCE($3, basic_salary),
           allowances = COALESCE($4, allowances),
           apit_applicable = COALESCE($5, apit_applicable),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [
        full_name.trim(),
        role || null,
        basic_salary !== undefined ? Number(basic_salary) : null,
        allowances !== undefined ? Number(allowances) : null,
        apit_applicable !== undefined ? Boolean(apit_applicable) : null,
        is_active !== undefined ? Boolean(is_active) : null,
        id,
      ]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing employee id" }, { status: 400 });
    const pool = getPool();
    await pool.query(`UPDATE tce_employees SET is_active = false WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
