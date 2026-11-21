export * from './product';
export * from './batch';
export * from './transfer';
export * from './replenishment';
export * from './ecommerce';
export * from './foundation';

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
  | 'projects';

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
  | 'returned';

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
  icon?: string;
  statusVariant?: 'default' | 'success' | 'warning' | 'critical' | 'info';
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
  subValue?: string;
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
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier' | 'storekeeper' | 'accountant' | 'viewer' | 'website_manager' | 'delivery_staff' | string;
  phone?: string;
  photoURL?: string;
}
