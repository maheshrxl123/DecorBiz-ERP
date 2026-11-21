/**
 * DecorBiz Indian GST Engine
 * Implements CGST+SGST (intra-state) or IGST (inter-state)
 * PRD Section 8.2 & Section 0
 */

export interface TaxCalculationParams {
  amount: number;             // Line item base amount or gross
  gstRate: number;            // e.g., 18 for 18%
  isTaxInclusive?: boolean;   // Whether the rate entered already includes tax
  businessStateCode?: string; // 2-digit GST state code of dealer showroom (e.g., '23')
  customerStateCode?: string; // 2-digit GST state code of customer or place of supply
}

export interface TaxBreakdown {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalWithTax: number;
  isInterState: boolean;
}

/**
 * Extract 2-digit state code from GSTIN or return fallback
 */
export function getStateCodeFromGSTIN(gstin?: string): string | null {
  if (!gstin || gstin.trim().length < 2) return null;
  const code = gstin.trim().substring(0, 2);
  return /^\d{2}$/.test(code) ? code : null;
}

/**
 * Computes GST breakdown according to Place of Supply rules
 */
export function calculateGST(params: TaxCalculationParams): TaxBreakdown {
  const {
    amount,
    gstRate,
    isTaxInclusive = false,
    businessStateCode = '23', // Default Madhya Pradesh
    customerStateCode,
  } = params;

  // Inter-state when customer state code is specified and differs from business state code
  const isInterState = Boolean(customerStateCode && customerStateCode !== businessStateCode);

  let taxableAmount = 0;
  let totalTax = 0;

  if (isTaxInclusive) {
    taxableAmount = (amount * 100) / (100 + gstRate);
    totalTax = amount - taxableAmount;
  } else {
    taxableAmount = amount;
    totalTax = (amount * gstRate) / 100;
  }

  // Round intermediate calculations to 2 decimals
  taxableAmount = Math.round(taxableAmount * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;
  const totalWithTax = Math.round((taxableAmount + totalTax) * 100) / 100;

  if (isInterState) {
    return {
      taxableAmount,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount: totalTax,
      totalTax,
      totalWithTax,
      isInterState: true,
    };
  } else {
    const halfRate = gstRate / 2;
    const halfTax = Math.round((totalTax / 2) * 100) / 100;
    // Adjust penny difference if any
    const cgstAmount = halfTax;
    const sgstAmount = Math.round((totalTax - halfTax) * 100) / 100;

    return {
      taxableAmount,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalTax,
      totalWithTax,
      isInterState: false,
    };
  }
}

/**
 * Calculate invoice round-off adjustment
 * Example: 3626.40 -> roundOff = -0.40, finalTotal = 3626.00
 */
export function calculateRoundOff(totalAmount: number): { roundOff: number; finalTotal: number } {
  const rounded = Math.round(totalAmount);
  const roundOff = Math.round((rounded - totalAmount) * 100) / 100;
  return {
    roundOff,
    finalTotal: rounded,
  };
}
