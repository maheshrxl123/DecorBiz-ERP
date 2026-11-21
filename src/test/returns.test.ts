import { describe, test, expect } from 'vitest';
import {
  validateSalesReturn,
  validateCreditNote,
  validateSupplierReturn,
} from '../lib/firebase/validators';
import { ALL_PERMISSIONS } from '../types/firestore';

describe('DecorBiz Returns, Credit Notes & Supplier Returns', () => {
  const orgId = 'org_test_tiles';
  const storeId = 'store_test_main';

  test('RBAC System Roles include returns permissions', () => {
    expect(ALL_PERMISSIONS).toContain('returns.read');
    expect(ALL_PERMISSIONS).toContain('returns.create');
    expect(ALL_PERMISSIONS).toContain('credit_note.create');
    expect(ALL_PERMISSIONS).toContain('supplier_return.create');
  });

  test('Runtime Validators for Sales Return & Credit Notes', () => {
    const validReturnPayload = {
      id: 'ret_123',
      organizationId: orgId,
      storeId,
      returnNumber: 'RET-2026-0001',
      originalInvoiceId: 'inv_101',
      originalInvoiceNumber: 'INV-2026-1001',
      items: [
        {
          productId: 'prod_1',
          productName: 'Kajaria 600x1200mm GVT Glossy Tile',
          batchId: 'batch_1',
          batchNumber: 'SHADE-A12',
          expiryDate: '2030-12-31',
          originallySoldQty: 10,
          previouslyReturnedQty: 0,
          returnQty: 2,
          unitPrice: 750,
          mrp: 900,
          discountPercent: 0,
          discountAmount: 0,
          taxableAmount: 1500,
          gstRate: 18,
          cgstAmount: 135,
          sgstAmount: 135,
          totalTaxAmount: 270,
          totalAmount: 1770,
          condition: 'sealed_resalable',
          restocked: true,
        },
      ],
      itemsCount: 1,
      totalQuantityReturned: 2,
      subtotalReturned: 1500,
      totalTaxReturned: 270,
      grandTotalRefund: 1770,
      refundMode: 'credit_note',
      returnPolicyApplied: 'Standard return within 3 days',
      reason: 'Excess boxes from bathroom layout',
      status: 'approved',
      approvedByUid: 'mgr_1',
      createdByUid: 'user_123',
    };

    expect(validateSalesReturn(validReturnPayload, orgId)).toBe(true);

    const validCreditNote = {
      id: 'cn_123',
      organizationId: orgId,
      storeId,
      creditNoteNumber: 'CN-2026-0001',
      salesReturnId: 'ret_123',
      salesReturnNumber: 'RET-2026-0001',
      originalInvoiceId: 'inv_101',
      originalInvoiceNumber: 'INV-2026-1001',
      customerId: 'cust_123',
      customerName: 'Suresh Construction',
      amount: 1770,
      balanceRemaining: 1770,
      status: 'issued',
      createdByUid: 'user_123',
    };

    expect(validateCreditNote(validCreditNote, orgId)).toBe(true);

    const validSupplierReturn = {
      id: 'sret_123',
      organizationId: orgId,
      storeId,
      supplierReturnNumber: 'SR-2026-0001',
      supplierId: 'sup_123',
      supplierName: 'Kajaria Ceramics Distributors',
      items: [
        {
          productId: 'prod_1',
          productName: 'Kajaria 600x1200mm GVT Glossy Tile',
          batchId: 'batch_1',
          batchNumber: 'SHADE-A12',
          expiryDate: '2030-01-01',
          quantity: 5,
          unitPurchaseCost: 500,
          gstRate: 18,
          taxableAmount: 2500,
          cgstAmount: 225,
          sgstAmount: 225,
          totalAmount: 2950,
          reason: 'damaged',
        },
      ],
      itemsCount: 1,
      totalQuantity: 5,
      subtotal: 2500,
      taxableAmount: 2500,
      cgstTotal: 225,
      sgstTotal: 225,
      totalTax: 450,
      roundOff: 0,
      grandTotal: 2950,
      reason: 'Transit chip damage return',
      status: 'approved',
      createdByUid: 'user_123',
    };

    expect(validateSupplierReturn(validSupplierReturn, orgId)).toBe(true);
  });
});
