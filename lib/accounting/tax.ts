import { round2 } from "./format";

export interface AccountingSettings {
  id: string;
  company_name: string;
  company_reg_no: string;
  fiscal_year_start_month: number;
  fiscal_year_start_day: number;
  vat_registered: boolean;
  vat_rate: number;
  sscl_registered: boolean;
  sscl_rate: number;
  capex_threshold: number;
  uber_commission_rate: number;
  pickme_commission_rate: number;
  smallwares_policy: "EXPENSE" | "AMORTIZE_12M";
}

export interface TaxBreakdown {
  grossAmount: number;
  taxExclusiveRevenue: number;
  vatAmount: number;
  ssclAmount: number;
}

/**
 * Separates tax-exclusive revenue from VAT (18%) and SSCL (2.5%) liabilities
 * when the company is registered. Never treats collected VAT/SSCL as revenue.
 *
 * When prices are VAT-inclusive (standard Sri Lankan F&B menu pricing):
 * Gross = Net * (1 + SSCL_rate + VAT_rate)
 */
export function decomposeTaxInclusiveSale(
  grossAmount: number,
  settings: Pick<AccountingSettings, "vat_registered" | "vat_rate" | "sscl_registered" | "sscl_rate">
): TaxBreakdown {
  const gross = round2(grossAmount);
  const vatRate = settings.vat_registered ? Number(settings.vat_rate || 0.18) : 0;
  const ssclRate = settings.sscl_registered ? Number(settings.sscl_rate || 0.025) : 0;

  if (vatRate === 0 && ssclRate === 0) {
    return {
      grossAmount: gross,
      taxExclusiveRevenue: gross,
      vatAmount: 0,
      ssclAmount: 0,
    };
  }

  const divisor = 1 + vatRate + ssclRate;
  const taxExclusive = round2(gross / divisor);
  const vatAmount = round2(taxExclusive * vatRate);
  const ssclAmount = round2(gross - taxExclusive - vatAmount);

  return {
    grossAmount: gross,
    taxExclusiveRevenue: taxExclusive,
    vatAmount,
    ssclAmount,
  };
}
