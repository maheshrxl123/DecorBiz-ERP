import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from '../lib/firebase/config';
import { sanitizeFirestorePayload } from '../lib/firebase/queryUtils';
import { userService } from './userService';

export type CustomerAccountType =
  | 'retail'
  | 'contractor'
  | 'architect'
  | 'plumber'
  | 'mason'
  | 'dealer';

export type TradeApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface CustomerAccountProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  customerType: CustomerAccountType;
  approvalStatus: TradeApprovalStatus;
  accountRole: 'customer';
  status: 'active' | 'suspended';
  gstin?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
}

export interface SyncCustomerAccountParams {
  uid: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  customerType?: CustomerAccountType;
  gstin?: string | null;
  isRegistration?: boolean;
}

function mapFirestoreWriteError(error: unknown): Error {
  const err = error as { code?: string; message?: string } | null;
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'permission-denied' || msg.toLowerCase().includes('missing or insufficient permissions')) {
    return new Error(
      'Cloud Firestore permission denied while saving your customer profile. Please publish the latest firestore.rules in Firebase Console -> Firestore Database -> Rules.'
    );
  }
  if (code === 'unavailable' || msg.toLowerCase().includes('client is offline')) {
    return new Error(
      'Unable to reach Cloud Firestore right now. Please check your internet connection and verify the Firestore database is enabled.'
    );
  }
  return new Error(msg || 'Failed to save customer profile to Cloud Firestore.');
}

function resolveDefaultApprovalStatus(customerType: CustomerAccountType): TradeApprovalStatus {
  // PRD Section 11.4: Retail customers can order immediately; trade types wait for ERP approval
  return customerType === 'retail' ? 'approved' : 'pending';
}

export const customerAccountService = {
  /**
   * Fetch storefront customer profile from /customers/{uid}
   */
  async getCustomerAccount(uid: string): Promise<CustomerAccountProfile | null> {
    if (!uid || !isFirebaseConfigured) return null;
    const db = getFirestoreDb();
    const customerRef = doc(db, 'customers', uid);
    const snap = await getDoc(customerRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      uid: snap.id,
      name: data.name || 'Customer',
      email: data.email || '',
      phone: data.phone || '',
      customerType: (data.customerType as CustomerAccountType) || 'retail',
      approvalStatus: (data.approvalStatus as TradeApprovalStatus) || 'approved',
      accountRole: 'customer',
      status: data.status === 'suspended' ? 'suspended' : 'active',
      gstin: data.gstin ?? null,
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
      lastLoginAt: data.lastLoginAt ?? null,
    };
  },

  /**
   * Create or backfill customer profile in Cloud Firestore at /customers/{uid} and /users/{uid}.
   * Ensures both newly registered customers AND existing Firebase Auth-only accounts persist cleanly.
   */
  async syncCustomerAccountOnAuth(
    params: SyncCustomerAccountParams
  ): Promise<CustomerAccountProfile> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Unable to save customer profile.');
    }
    if (!params.uid) {
      throw new Error('Authenticated user UID is required.');
    }

    const db = getFirestoreDb();
    const customerRef = doc(db, 'customers', params.uid);

    const normalizedName =
      params.name?.trim() ||
      (params.email ? params.email.split('@')[0] : 'Customer');
    const normalizedEmail = (params.email || '').trim().toLowerCase();
    const normalizedPhone = params.phone?.trim() || '';
    const requestedType: CustomerAccountType = params.customerType || 'retail';

    try {
      const existingSnap = await getDoc(customerRef);

      if (!existingSnap.exists()) {
        const approvalStatus = resolveDefaultApprovalStatus(requestedType);
        const createPayload = sanitizeFirestorePayload({
          uid: params.uid,
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          customerType: requestedType,
          approvalStatus,
          accountRole: 'customer',
          status: 'active',
          gstin: params.gstin?.trim() || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        await setDoc(customerRef, createPayload);
      } else {
        const updateFields: Record<string, any> = {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (params.isRegistration && params.name?.trim()) {
          updateFields.name = params.name.trim();
        }
        if (params.isRegistration && normalizedPhone) {
          updateFields.phone = normalizedPhone;
        }
        if (params.gstin !== undefined) {
          updateFields.gstin = params.gstin?.trim() || null;
        }

        await updateDoc(customerRef, sanitizeFirestorePayload(updateFields));
      }

      // Keep root /users/{uid} synchronized with customer accountType metadata
      await userService.createUserProfile(params.uid, {
        email: normalizedEmail || null,
        displayName: normalizedName,
        phoneNumber: normalizedPhone || null,
        accountType: 'customer',
        primaryOrganizationId: null,
      });

      const savedProfile = await this.getCustomerAccount(params.uid);
      if (!savedProfile) {
        throw new Error('Customer record was written but could not be verified in Cloud Firestore.');
      }
      return savedProfile;
    } catch (error) {
      console.error('[customerAccountService] Failed to sync customer account in Firestore:', error);
      throw mapFirestoreWriteError(error);
    }
  },
};
