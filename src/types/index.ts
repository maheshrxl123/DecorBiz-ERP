export * from './product';
export * from './batch';
export * from './transfer';
export * from './replenishment';
export * from './ecommerce';
export * from './foundation';
export * from './firestore';
export * from './collections';
export * from './analytics';
export * from './accounting';
export * from './warehouse';
export * from './gst';
import type { ReactNode } from 'react';

export type NavModuleId =
  | 'dashboard'
  | 'pos'
  | 'billing'
  | 'inventory'
  | 'quotations'
  | 'transfers'
  | 'purchases'
  | 'sales_returns'
  | 'customers'
  | 'parties'
  | 'suppliers'
  | 'collections'
  | 'payments'
  | 'expenses'
  | 'ecommerce'
  | 'reports'
  | 'gst_accounts'
  | 'notifications'
  | 'tasks'
  | 'replenishment'
  | 'audit_centre'
  | 'activity_centre'
  | 'warehouses'
  | 'settings'
  | 'storefront'
  | 'delivery'
  | 'projects'
  | 'compliance';

export interface NavItem {
  id: NavModuleId;
  label: string;
  icon: string;
  badge?: string | number;
  badgeVariant?: 'primary' | 'warning' | 'critical' | 'neutral';
  isFuture?: boolean;
  phase?: number;
  shortcut?: string;
}

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'paid'
  | 'pending'
  | 'failed'
  | 'completed'
  | 'draft'
  | 'cancelled'
  | 'returned'
  | 'near_expiry'
  | 'expired'
  | 'archived'
  | 'warning'
  | 'success'
  | 'critical'
  | 'neutral'
  | 'damaged'
  | 'secondary'
  | 'danger'
  | 'recalled'
  | 'quarantined'
  | 'depleted'
  | 'reserved';
  // Additional operational statuses used by inventory screens

export interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    comparisonText: string;
  };
  icon?: ReactNode;
  statusVariant?: 'default' | 'success' | 'warning' | 'critical' | 'info';
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
  subValue?: string;
  subtitle?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface StoreContext {
  id: string;
  name: string;
  location: string;
  gstin: string;
  status: 'online' | 'offline' | 'syncing';
  dlNumber?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier' | 'storekeeper' | 'accountant' | 'viewer' | 'website_manager' | 'delivery_staff' | string;
  phone?: string;
  photoURL?: string;
}

export type PharmacyProduct = import('./product').Product;
export type InventoryItem = import('./product').Product;
export interface PosProductItem {
  id: string;
  name: string;
  brand: string;
  composition?: string;
  sku: string;
  batchId: string;
  batch: string;
  expiry: string;
  stock: number;
  unit: string;
  mrp: number;
  price: number;
  gst: number;
  hsnCode: string;
  hasBatches: boolean;
  gstPercent?: number;
  dosageForm?: string;
  schedule?: string;
  shadeNumber?: string;
  toneCode?: string;
  caliberCode?: string;
  finish?: string;
  grade?: string;
  dimensionsMm?: string;
  coveragePerBoxSqFt?: number;
  piecesPerBox?: number;
  weightPerBoxKg?: number;
  totalStoreStock?: number;
  [key: string]: unknown;
}
export interface PosCartItem {
  id: string;
  productId: string;
  productName?: string;
  name?: string;
  brand?: string;
  composition?: string;
  sku?: string;
  batchId?: string;
  batch?: string;
  batchNumber?: string;
  shadeNumber?: string;
  toneCode?: string;
  caliberCode?: string;
  finish?: string;
  dimensionsMm?: string;
  coverageSqFt?: number;
  coveragePerBoxSqFt?: number;
  sqFtCalculated?: number;
  gstPercent?: number;
  gst?: number;
  dosageForm?: string;
  schedule?: string;
  isPrescriptionRequired?: boolean;
  grade?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  piecesPerBox?: number;
  weightPerBoxKg?: number;
  totalTax?: number;
  expiry?: string;
  expiryDate?: string;
  qty?: number;
  quantity?: number;
  availableStock?: number;
  unit?: string;
  mrp?: number;
  price?: number;
  salePrice?: number;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  gstRate?: number;
  hsnCode?: string;
  taxableAmount?: number;
  total?: number;
}
export interface PosBillSummary {
  subtotal: number;
  discount?: number;
  discountAmount?: number;
  taxableAmount: number;
  taxAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  freightAmount?: number;
  loadingUnloadingAmount?: number;
  roundOff?: number;
  grandTotal: number;
  totalSavings?: number;
  totalItems?: number;
  totalQty?: number;
}
export interface ArchitectPartner {
  id: string;
  name?: string;
  phone?: string;
  commissionPercent?: number;
  defaultCommissionPercent?: number;
  firmName?: string;
  role?: string;
  email?: string;
  totalBusinessDriven?: number;
  totalCommissionAccrued?: number;
  totalCommissionPaid?: number;
  pendingBalance?: number;
  [key: string]: unknown;
}
