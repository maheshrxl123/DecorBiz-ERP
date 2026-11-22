import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db, getFirebaseAuth } from '../lib/firebase/config';
import {
  GSTLedgerEntry,
  EInvoiceConfiguration,
  EInvoiceRecord,
  EWayBillRecord,
  GSTFilingPeriod,
  GSTSupplyType,
} from '../types/gst';
import { logAuditEvent } from './auditService';
import { sanitizeFirestorePayload } from '../lib/firebase/queryUtils';

export interface GspServerStatus {
  configured: boolean;
  provider: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  missingFields: string[];
}

async function getBearerHeaders(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('You must be signed in to access the server GSP gateway.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const gstService = {
  // Ledger
  async createLedgerEntry(orgId: string, entry: Omit<GSTLedgerEntry, 'id' | 'createdAt'>): Promise<string> {
    const ref = doc(collection(db, 'organizations', orgId, 'gstLedgerEntries'));
    const now = serverTimestamp();
    await setDoc(ref, {
      ...entry,
      id: ref.id,
      organizationId: orgId,
      createdAt: now,
    });
    return ref.id;
  },

  async getLedgerEntries(orgId: string, storeId?: string, taxPeriod?: string): Promise<GSTLedgerEntry[]> {
    const constraints = [];
    if (storeId) constraints.push(where('storeId', '==', storeId));
    if (taxPeriod) constraints.push(where('taxPeriod', '==', taxPeriod));
    const q = query(
      collection(db, 'organizations', orgId, 'gstLedgerEntries'),
      ...constraints,
      orderBy('documentDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as GSTLedgerEntry);
  },

  // E-Invoice Configuration
  async getEInvoiceConfig(orgId: string): Promise<EInvoiceConfiguration | null> {
    if (!orgId) return null;
    try {
      const snap = await getDocs(query(collection(db, 'organizations', orgId, 'eInvoiceConfiguration')));
      if (snap.empty) return null;
      return snap.docs[0].data() as EInvoiceConfiguration;
    } catch (err) {
      console.warn('Failed to get e-invoice configuration:', err);
      return null;
    }
  },

  async saveEInvoiceConfig(orgId: string, payload: Partial<EInvoiceConfiguration>, uid: string) {
    const snap = await getDocs(query(collection(db, 'organizations', orgId, 'eInvoiceConfiguration')));
    const ref = snap.empty
      ? doc(collection(db, 'organizations', orgId, 'eInvoiceConfiguration'))
      : doc(db, 'organizations', orgId, 'eInvoiceConfiguration', snap.docs[0].id);

    await setDoc(
      ref,
      sanitizeFirestorePayload({
        ...payload,
        id: ref.id,
        organizationId: orgId,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      }),
      { merge: true }
    );

    await logAuditEvent(orgId, {
      actorUid: uid,
      action: 'gst.configuration.updated' as any,
      entityType: 'einvoice_configuration',
      entityId: ref.id,
      metadata: { details: 'E-Invoice Configuration updated' },
    });
  },

  // Periods
  async getFilingPeriods(orgId: string, financialYear?: string): Promise<GSTFilingPeriod[]> {
    const constraints = [];
    if (financialYear) constraints.push(where('financialYear', '==', financialYear));
    const q = query(
      collection(db, 'organizations', orgId, 'gstFilingPeriods'),
      ...constraints,
      orderBy('periodStart', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as GSTFilingPeriod);
  },

  // Tax Math (CGST + SGST for intra-state, IGST for inter-state)
  calculateTaxes(taxableValue: number, gstRate: number, supplierGstin: string, recipientGstin?: string) {
    if (!taxableValue) taxableValue = 0;
    if (!gstRate) gstRate = 0;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    const isInterState =
      recipientGstin &&
      supplierGstin &&
      recipientGstin.substring(0, 2) !== supplierGstin.substring(0, 2);

    if (isInterState) {
      igst = (taxableValue * gstRate) / 100;
    } else {
      cgst = (taxableValue * (gstRate / 2)) / 100;
      sgst = (taxableValue * (gstRate / 2)) / 100;
    }

    const totalTax = cgst + sgst + igst;

    return {
      taxableValue: Number(taxableValue.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      isInterState: Boolean(isInterState),
    };
  },

  // -------------------------------------------------------------
  // Server-Side GSP / IRP Gateway & E-Way Bill Integration (PRD V5)
  // -------------------------------------------------------------

  async getGspServerStatus(): Promise<GspServerStatus> {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/gsp/status', { method: 'GET', headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Could not retrieve server GSP status.');
    }
    return data as GspServerStatus;
  },

  /**
   * Test live connectivity to the server-configured GSP / IRP gateway.
   */
  async testIRPConnection(
    config: EInvoiceConfiguration
  ): Promise<{ success: boolean; configured?: boolean; latencyMs: number; message: string }> {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/gsp/test', {
      method: 'POST',
      headers,
      body: JSON.stringify({ gstin: config.gstin }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: Boolean(data?.success),
      configured: Boolean(data?.configured),
      latencyMs: typeof data?.latencyMs === 'number' ? data.latencyMs : 0,
      message: data?.message || data?.error || 'Failed to test GSP gateway connection.',
    };
  },

  /**
   * Fetch all generated E-Invoices from Cloud Firestore
   */
  async getEInvoices(orgId: string): Promise<EInvoiceRecord[]> {
    if (!orgId) return [];
    const ref = collection(db, 'organizations', orgId, 'einvoices');
    try {
      try {
        const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EInvoiceRecord));
      } catch {
        const snap = await getDocs(ref);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EInvoiceRecord));
      }
    } catch (err) {
      console.warn('Could not fetch e-invoices:', err);
      return [];
    }
  },

  /**
   * Fetch all generated E-Way bills from Cloud Firestore
   */
  async getEWayBills(orgId: string): Promise<EWayBillRecord[]> {
    if (!orgId) return [];
    const ref = collection(db, 'organizations', orgId, 'ewaybills');
    try {
      try {
        const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EWayBillRecord));
      } catch {
        const snap = await getDocs(ref);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EWayBillRecord));
      }
    } catch (err) {
      console.warn('Could not fetch e-waybills:', err);
      return [];
    }
  },

  /**
   * Generate official IRN via authenticated server-side GSP adapter and persist to Firestore
   */
  async generateIRN(
    orgId: string,
    caller: { uid: string; email?: string | null; displayName?: string | null },
    invoice: {
      id: string;
      invoiceNumber: string;
      invoiceDate: string;
      supplierGstin: string;
      customerGstin: string;
      customerName: string;
      taxableAmount: number;
      totalTax: number;
      grandTotal: number;
      storeId?: string;
    }
  ): Promise<EInvoiceRecord> {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/gsp/irn', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organizationId: orgId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        supplierGstin: invoice.supplierGstin,
        customerGstin: invoice.customerGstin,
        customerName: invoice.customerName,
        taxableAmount: invoice.taxableAmount,
        totalTax: invoice.totalTax,
        grandTotal: invoice.grandTotal,
      }),
    });

    const gspData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(gspData?.error || 'Server GSP IRN generation failed.');
    }

    const recordId = `einv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const einvDocRef = doc(db, 'organizations', orgId, 'einvoices', recordId);

    const einvoiceData = sanitizeFirestorePayload({
      id: recordId,
      organizationId: orgId,
      storeId: invoice.storeId || 'store_main',
      sourceId: invoice.id,
      sourceType: 'SALE_INVOICE',
      documentNumber: invoice.invoiceNumber,
      documentDate: invoice.invoiceDate,
      status: 'GENERATED',
      generatedAt: serverTimestamp(),
      irn: gspData.irn,
      acknowledgementNumber: gspData.acknowledgementNumber,
      acknowledgementDate: gspData.acknowledgementDate,
      signedQRCode: gspData.signedQRCode,
      provider: gspData.provider || 'GSP',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(einvDocRef, einvoiceData);

    await logAuditEvent(orgId, {
      actorUid: caller.uid,
      actorEmail: caller.email || null,
      actorDisplayName: caller.displayName || null,
      action: 'einvoice.generated',
      entityType: 'einvoice',
      entityId: recordId,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        irn: gspData.irn,
        acknowledgementNumber: gspData.acknowledgementNumber,
      },
    });

    return {
      ...einvoiceData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      generatedAt: Timestamp.now(),
    } as EInvoiceRecord;
  },

  /**
   * Cancel an existing IRN via the server-side GSP adapter and update Firestore
   */
  async cancelIRN(
    orgId: string,
    caller: { uid: string; email?: string | null; displayName?: string | null },
    recordId: string,
    cancelReason: '1' | '2' | '3' | '4',
    cancelRemarks: string,
    irnHash?: string,
    supplierGstin?: string
  ): Promise<void> {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/gsp/irn/cancel', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organizationId: orgId,
        supplierGstin,
        irn: irnHash || recordId,
        cancelReason,
        cancelRemarks: cancelRemarks.trim(),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Server GSP IRN cancellation failed.');
    }

    const docRef = doc(db, 'organizations', orgId, 'einvoices', recordId);
    await updateDoc(docRef, {
      status: 'CANCELLED',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cancelReason,
      cancelRemarks: cancelRemarks.trim(),
    });

    await logAuditEvent(orgId, {
      actorUid: caller.uid,
      actorEmail: caller.email || null,
      actorDisplayName: caller.displayName || null,
      action: 'einvoice.cancelled',
      entityType: 'einvoice',
      entityId: recordId,
      metadata: {
        cancelReason,
        cancelRemarks,
      },
    });
  },

  /**
   * Generate official E-Way Bill via authenticated server-side GSP adapter and persist to Firestore
   */
  async generateEWayBill(
    orgId: string,
    caller: { uid: string; email?: string | null; displayName?: string | null },
    payload: {
      irn?: string;
      invoiceNumber: string;
      invoiceDate: string;
      vehicleNumber: string;
      vehicleType: 'REGULAR' | 'ODC';
      transporterId?: string;
      transporterName?: string;
      distanceKm: number;
      supplyType: GSTSupplyType;
      fromPincode: string;
      toPincode: string;
      storeId?: string;
      supplierGstin?: string;
    }
  ): Promise<EWayBillRecord> {
    const headers = await getBearerHeaders();
    const res = await fetch('/api/gsp/ewaybill', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organizationId: orgId,
        ...payload,
      }),
    });

    const gspData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(gspData?.error || 'Server GSP E-Way Bill generation failed.');
    }

    const recordId = `ewb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, 'organizations', orgId, 'ewaybills', recordId);

    const ewbData = sanitizeFirestorePayload({
      id: recordId,
      organizationId: orgId,
      storeId: payload.storeId || 'store_main',
      irn: payload.irn || null,
      invoiceNumber: payload.invoiceNumber,
      invoiceDate: payload.invoiceDate,
      ewayBillNumber: gspData.ewayBillNumber,
      ewayBillDate: gspData.ewayBillDate,
      validUpto: gspData.validUpto,
      vehicleNumber: payload.vehicleNumber.toUpperCase().replace(/\s+/g, ''),
      vehicleType: payload.vehicleType,
      transporterId: payload.transporterId || null,
      transporterName: payload.transporterName || null,
      distanceKm: payload.distanceKm,
      supplyType: payload.supplyType,
      fromPincode: payload.fromPincode,
      toPincode: payload.toPincode,
      status: 'ACTIVE',
      generatedByUid: caller.uid,
      createdAt: serverTimestamp(),
    });

    await setDoc(docRef, ewbData);

    await logAuditEvent(orgId, {
      actorUid: caller.uid,
      actorEmail: caller.email || null,
      actorDisplayName: caller.displayName || null,
      action: 'ewaybill.generated',
      entityType: 'ewaybill',
      entityId: recordId,
      metadata: {
        ewayBillNumber: gspData.ewayBillNumber,
        vehicleNumber: payload.vehicleNumber,
      },
    });

    return {
      ...ewbData,
      createdAt: Timestamp.now(),
    } as EWayBillRecord;
  },
};
