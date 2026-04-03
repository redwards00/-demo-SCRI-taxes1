export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

// 2024 Federal Tax Brackets for Single Filers
export const FEDERAL_BRACKETS_2024: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: null, rate: 0.37 },
];

export const STANDARD_DEDUCTION_2024 = 14600;

export function calculateFederalTax(income: number): number {
  const taxableIncome = Math.max(0, income - STANDARD_DEDUCTION_2024);
  let totalTax = 0;

  for (const bracket of FEDERAL_BRACKETS_2024) {
    if (taxableIncome > bracket.min) {
      const upperLimit = bracket.max === null ? taxableIncome : Math.min(taxableIncome, bracket.max);
      const taxableInBracket = upperLimit - bracket.min;
      totalTax += taxableInBracket * bracket.rate;
    } else {
      break;
    }
  }

  return totalTax;
}

export function calculateFICA(income: number): number {
  // Social Security: 6.2% up to $168,600
  // Medicare: 1.45% on all income
  const socialSecurity = Math.min(income, 168600) * 0.062;
  const medicare = income * 0.0145;
  return socialSecurity + medicare;
}
