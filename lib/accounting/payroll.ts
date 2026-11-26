import { round2 } from "./format";

export interface PayrollCalculation {
  grossSalary: number;
  epfEmployee8: number;
  epfEmployer12: number;
  etfEmployer3: number;
  apitTax: number;
  netSalary: number;
  totalEmployerCost: number;
}

/**
 * Sri Lanka IRD APIT (Advance Personal Income Tax) Monthly Table 1 (Resident Employees)
 * Relief threshold: LKR 100,000/month (LKR 1,200,000/year), progressive slabs of LKR 41,667 at 6%, 12%, 18%, 24%, 30%, 36%.
 */
export function calculateSriLankaAPIT(monthlyGross: number, apitApplicable: boolean): number {
  if (!apitApplicable || monthlyGross <= 100000) return 0;

  let remaining = monthlyGross - 100000;
  let tax = 0;
  const slabs = [
    { limit: 41666.67, rate: 0.06 },
    { limit: 41666.67, rate: 0.12 },
    { limit: 41666.67, rate: 0.18 },
    { limit: 41666.67, rate: 0.24 },
    { limit: 41666.67, rate: 0.30 },
  ];

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, slab.limit);
    tax += taxable * slab.rate;
    remaining -= taxable;
  }

  if (remaining > 0) {
    tax += remaining * 0.36;
  }

  return round2(tax);
}

/**
 * Computes Sri Lankan statutory payroll:
 * - Employee EPF: 8% (deducted from Gross)
 * - Employer EPF: 12% (additional employer cost)
 * - Employer ETF: 3% (additional employer cost)
 * - APIT: IRD progressive withholding if applicable
 */
export function calculateSriLankaPayroll(
  basicSalary: number,
  allowances: number,
  apitApplicable: boolean
): PayrollCalculation {
  const grossSalary = round2(Number(basicSalary || 0) + Number(allowances || 0));
  const epfEmployee8 = round2(grossSalary * 0.08);
  const epfEmployer12 = round2(grossSalary * 0.12);
  const etfEmployer3 = round2(grossSalary * 0.03);
  const apitTax = calculateSriLankaAPIT(grossSalary, apitApplicable);
  const netSalary = round2(grossSalary - epfEmployee8 - apitTax);
  const totalEmployerCost = round2(grossSalary + epfEmployer12 + etfEmployer3);

  return {
    grossSalary,
    epfEmployee8,
    epfEmployer12,
    etfEmployer3,
    apitTax,
    netSalary,
    totalEmployerCost,
  };
}
