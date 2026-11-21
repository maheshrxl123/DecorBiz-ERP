/**
 * DecorBiz Units & Tile Area Calculator
 * Implements Box, Piece, Sq Ft, and Sq M conversions per PRD Section 7.5
 */

export interface TileCalculationInput {
  lengthFeet: number;
  widthFeet: number;
  sqftPerBox: number;
  piecesPerBox?: number;
  wastagePercent?: number; // Default 10%
}

export interface TileCalculationResult {
  carpetAreaSqft: number;
  wastageSqft: number;
  totalAreaSqft: number;
  totalAreaSqm: number;
  boxesNeeded: number;
  roundedTotalSqft: number;
}

/**
 * Calculate Tile Area & required whole boxes with wastage
 * Wastage defaults to 10% per PRD Section 0 and Section 7.5
 */
export function calculateTileRequirements(input: TileCalculationInput): TileCalculationResult {
  const wastage = input.wastagePercent !== undefined ? input.wastagePercent : 10;
  const carpetAreaSqft = Math.max(0, input.lengthFeet * input.widthFeet);
  const wastageSqft = (carpetAreaSqft * wastage) / 100;
  const totalAreaSqft = carpetAreaSqft + wastageSqft;
  const totalAreaSqm = totalAreaSqft * 0.092903;

  const sqftPerBox = Math.max(0.001, input.sqftPerBox || 1);
  // Whole boxes rounding up
  const boxesNeeded = Math.ceil(totalAreaSqft / sqftPerBox);
  const roundedTotalSqft = boxesNeeded * sqftPerBox;

  return {
    carpetAreaSqft: Math.round(carpetAreaSqft * 100) / 100,
    wastageSqft: Math.round(wastageSqft * 100) / 100,
    totalAreaSqft: Math.round(totalAreaSqft * 100) / 100,
    totalAreaSqm: Math.round(totalAreaSqm * 100) / 100,
    boxesNeeded,
    roundedTotalSqft: Math.round(roundedTotalSqft * 100) / 100,
  };
}

/**
 * Convert selling price per sq ft to price per box
 */
export function sqftRateToBoxPrice(ratePerSqft: number, sqftPerBox: number): number {
  return Math.round(ratePerSqft * sqftPerBox * 100) / 100;
}

/**
 * Convert price per box to rate per sq ft
 */
export function boxPriceToSqftRate(pricePerBox: number, sqftPerBox: number): number {
  if (!sqftPerBox || sqftPerBox <= 0) return pricePerBox;
  return Math.round((pricePerBox / sqftPerBox) * 100) / 100;
}
