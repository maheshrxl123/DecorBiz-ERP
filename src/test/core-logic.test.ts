import { describe, test, expect } from 'vitest';
import { formatINR, amountInWords } from '../core/money';
import { calculateTileRequirements, sqftRateToBoxPrice, boxPriceToSqftRate } from '../core/units';
import { calculateGST, calculateRoundOff, getStateCodeFromGSTIN } from '../core/tax';
import { canFulfillStock, getSellableQuantity } from '../core/stock';
import { getRolePermissions, ALL_ROLES } from '../core/permissions';
import { getDeviceId, saveOfflineBill, getOfflineBillsQueue } from '../core/offline';

describe('DecorBiz Core Logic Test Suite (PRD v2.0)', () => {
  // 1. Money & Indian Formatting
  describe('Money & Indian Formatting (PRD 5.1 & 5.6)', () => {
    test('formatINR formats numbers with Indian grouping and rupee symbol', () => {
      expect(formatINR(123456.78)).toBe('₹1,23,456.78');
      expect(formatINR(5000)).toBe('₹5,000.00');
      expect(formatINR(10000000)).toBe('₹1,00,00,000.00');
      expect(formatINR(0)).toBe('₹0.00');
      expect(formatINR(-4500.5)).toBe('-₹4,500.50');
      expect(formatINR(null)).toBe('₹0.00');
    });

    test('amountInWords converts numbers to Indian English words', () => {
      expect(amountInWords(15420)).toBe('Rupees Fifteen Thousand Four Hundred Twenty Only');
      expect(amountInWords(3626.5)).toBe('Rupees Three Thousand Six Hundred Twenty Six and Fifty Paise Only');
      expect(amountInWords(100000)).toBe('Rupees One Lakh Only');
      expect(amountInWords(0)).toBe('Rupees Zero Only');
    });
  });

  // 2. Units & Tile Area Calculator
  describe('Units & Tile Area Calculator (PRD 7.5 & 0)', () => {
    test('calculateTileRequirements computes area with default 10% wastage and whole box rounding', () => {
      // Room 10 ft x 12 ft = 120 sq ft
      // Wastage 10% = 12 sq ft -> total = 132 sq ft
      // Box size = 15.5 sq ft per box -> 132 / 15.5 = 8.51 -> 9 boxes
      const result = calculateTileRequirements({
        lengthFeet: 10,
        widthFeet: 12,
        sqftPerBox: 15.5,
      });

      expect(result.carpetAreaSqft).toBe(120);
      expect(result.wastageSqft).toBe(12);
      expect(result.totalAreaSqft).toBe(132);
      expect(result.boxesNeeded).toBe(9);
      expect(result.roundedTotalSqft).toBe(9 * 15.5);
    });

    test('calculateTileRequirements supports custom wastage percentage', () => {
      const result = calculateTileRequirements({
        lengthFeet: 20,
        widthFeet: 15,
        sqftPerBox: 16,
        wastagePercent: 15, // 15% wastage
      });

      // 300 sq ft + 45 sq ft = 345 sq ft -> 345 / 16 = 21.56 -> 22 boxes
      expect(result.carpetAreaSqft).toBe(300);
      expect(result.wastageSqft).toBe(45);
      expect(result.totalAreaSqft).toBe(345);
      expect(result.boxesNeeded).toBe(22);
    });

    test('sqftRateToBoxPrice and boxPriceToSqftRate convert accurately', () => {
      expect(sqftRateToBoxPrice(48, 16)).toBe(768);
      expect(boxPriceToSqftRate(768, 16)).toBe(48);
    });
  });

  // 3. Indian GST Engine
  describe('Indian GST Engine (PRD 8.2)', () => {
    test('calculateGST splits intra-state into CGST (50%) and SGST (50%)', () => {
      const breakdown = calculateGST({
        amount: 10000,
        gstRate: 18,
        businessStateCode: '23',
        customerStateCode: '23', // Same state (Madhya Pradesh)
        isTaxInclusive: false,
      });

      expect(breakdown.isInterState).toBe(false);
      expect(breakdown.taxableAmount).toBe(10000);
      expect(breakdown.cgstRate).toBe(9);
      expect(breakdown.cgstAmount).toBe(900);
      expect(breakdown.sgstRate).toBe(9);
      expect(breakdown.sgstAmount).toBe(900);
      expect(breakdown.igstAmount).toBe(0);
      expect(breakdown.totalTax).toBe(1800);
      expect(breakdown.totalWithTax).toBe(11800);
    });

    test('calculateGST assigns entire tax to IGST for inter-state supply', () => {
      const breakdown = calculateGST({
        amount: 10000,
        gstRate: 18,
        businessStateCode: '23',
        customerStateCode: '27', // Other state (Maharashtra)
        isTaxInclusive: false,
      });

      expect(breakdown.isInterState).toBe(true);
      expect(breakdown.cgstAmount).toBe(0);
      expect(breakdown.sgstAmount).toBe(0);
      expect(breakdown.igstRate).toBe(18);
      expect(breakdown.igstAmount).toBe(1800);
      expect(breakdown.totalWithTax).toBe(11800);
    });

    test('calculateGST extracts tax correctly from tax-inclusive amount', () => {
      const breakdown = calculateGST({
        amount: 1180,
        gstRate: 18,
        isTaxInclusive: true,
      });

      expect(breakdown.taxableAmount).toBe(1000);
      expect(breakdown.totalTax).toBe(180);
      expect(breakdown.totalWithTax).toBe(1180);
    });

    test('calculateRoundOff computes invoice rounding difference', () => {
      const r1 = calculateRoundOff(3626.4);
      expect(r1.roundOff).toBe(-0.4);
      expect(r1.finalTotal).toBe(3626);

      const r2 = calculateRoundOff(3626.8);
      expect(r2.roundOff).toBe(0.2);
      expect(r2.finalTotal).toBe(3627);
    });

    test('getStateCodeFromGSTIN parses 2-digit state prefix', () => {
      expect(getStateCodeFromGSTIN('23AAAAA0000A1Z5')).toBe('23');
      expect(getStateCodeFromGSTIN('27AADCB2230M1ZT')).toBe('27');
      expect(getStateCodeFromGSTIN('INVALID')).toBeNull();
    });
  });

  // 4. Stock & Balance Rules
  describe('Stock & Sellable Quantity Rules (PRD 7.6 & 3.1)', () => {
    test('getSellableQuantity subtracts reserved stock from on-hand and never goes below zero', () => {
      expect(getSellableQuantity({ onHand: 50, reserved: 10 })).toBe(40);
      expect(getSellableQuantity({ onHand: 5, reserved: 10 })).toBe(0);
      expect(getSellableQuantity({ onHand: 0, reserved: 0 })).toBe(0);
    });

    test('canFulfillStock allows sale when stock is sufficient', () => {
      const check = canFulfillStock(50, 10, 20);
      expect(check.allowed).toBe(true);
      expect(check.sellable).toBe(40);
    });

    test('canFulfillStock rejects sale if requested quantity exceeds on-hand', () => {
      const check = canFulfillStock(15, 0, 20);
      expect(check.allowed).toBe(false);
      expect(check.message).toContain('Insufficient stock on hand');
    });
  });

  // 5. Roles & Permissions (PRD Section 6)
  describe('Fixed Roles & Permissions (PRD Section 6)', () => {
    test('ensures all 8 PRD roles are defined', () => {
      expect(ALL_ROLES).toHaveLength(8);
      expect(ALL_ROLES).toContain('owner');
      expect(ALL_ROLES).toContain('manager');
      expect(ALL_ROLES).toContain('cashier');
      expect(ALL_ROLES).toContain('storekeeper');
      expect(ALL_ROLES).toContain('accountant');
      expect(ALL_ROLES).toContain('viewer');
      expect(ALL_ROLES).toContain('website_manager');
      expect(ALL_ROLES).toContain('delivery_staff');
    });

    test('cashier cannot see purchase price or override discounts without manager approval', () => {
      const cashierPerms = getRolePermissions('cashier');
      expect(cashierPerms.canBillAndQuote).toBe(true);
      expect(cashierPerms.canSeePurchasePriceAndMargin).toBe(false);
      expect(cashierPerms.canOverrideDiscountAndVoid).toBe(false);
    });

    test('website manager cannot modify items or stock', () => {
      const webMgrPerms = getRolePermissions('website_manager');
      expect(webMgrPerms.canManageWebsiteContent).toBe(true);
      expect(webMgrPerms.canManageItemsAndCategories).toBe(false);
      expect(webMgrPerms.canAdjustStock).toBe(false);
      expect(webMgrPerms.canBillAndQuote).toBe(false);
    });

    test('delivery staff only accesses delivery challans', () => {
      const deliveryPerms = getRolePermissions('delivery_staff');
      expect(deliveryPerms.canAccessDeliveries).toBe(true);
      expect(deliveryPerms.canBillAndQuote).toBe(false);
      expect(deliveryPerms.canManageItemsAndCategories).toBe(false);
    });

    test('owner has full authority including user/module control and export/restore', () => {
      const ownerPerms = getRolePermissions('owner');
      expect(ownerPerms.canManageUsersAndModules).toBe(true);
      expect(ownerPerms.canExportAndRestore).toBe(true);
      expect(ownerPerms.canApproveAIProposals).toBe(true);
    });
  });

  // 6. Offline Queue & Device Tracking
  describe('Offline Queue & Device Tracking (PRD 9.2)', () => {
    test('generates unique device id and manages offline bills queue in storage', () => {
      const devId = getDeviceId();
      expect(devId).toMatch(/^DEV-/);

      const bill = saveOfflineBill({ customer: 'Walk-in', total: 3500 });
      expect(bill.status).toBe('pending_sync');
      expect(bill.tempId).toContain(devId);

      const queue = getOfflineBillsQueue();
      expect(queue.some((b) => b.tempId === bill.tempId)).toBe(true);
    });
  });
});
