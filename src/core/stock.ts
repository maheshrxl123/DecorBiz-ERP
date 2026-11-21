/**
 * DecorBiz Stock Engine & Balance Rules
 * PRD Section 7.6 & Section 3.1
 * Rule: Sellable quantity is never written below zero.
 * A bill never makes on-hand negative.
 */

export interface StockBalance {
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
}

export function getSellableQuantity(balance: { onHand: number; reserved?: number }): number {
  const onHand = balance.onHand || 0;
  const reserved = balance.reserved || 0;
  return Math.max(0, onHand - reserved);
}

/**
 * Validate whether requested quantity can be fulfilled from current stock
 */
export function canFulfillStock(
  currentOnHand: number,
  currentReserved: number,
  requestedQuantity: number,
  isReservation: boolean = false
): { allowed: boolean; sellable: number; message?: string } {
  const sellable = Math.max(0, currentOnHand - currentReserved);

  if (isReservation) {
    if (requestedQuantity > sellable) {
      return {
        allowed: false,
        sellable,
        message: `Insufficient sellable quantity. Available: ${sellable}, Requested: ${requestedQuantity}`,
      };
    }
  } else {
    // For direct counter sales, cannot exceed on-hand
    if (requestedQuantity > currentOnHand) {
      return {
        allowed: false,
        sellable,
        message: `Insufficient stock on hand. Available: ${currentOnHand}, Requested: ${requestedQuantity}`,
      };
    }
  }

  return { allowed: true, sellable };
}
