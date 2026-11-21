/**
 * DecorBiz Roles & Permissions
 * Strictly implements the 8 fixed roles from PRD Section 6
 * 
 * Roles:
 * 1. owner
 * 2. manager
 * 3. cashier
 * 4. storekeeper
 * 5. accountant
 * 6. viewer
 * 7. website_manager
 * 8. delivery_staff
 */

export type DecorBizRole =
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'storekeeper'
  | 'accountant'
  | 'viewer'
  | 'website_manager'
  | 'delivery_staff';

export const ALL_ROLES: DecorBizRole[] = [
  'owner',
  'manager',
  'cashier',
  'storekeeper',
  'accountant',
  'viewer',
  'website_manager',
  'delivery_staff',
];

export const ROLE_LABELS: Record<DecorBizRole, { en: string; hi: string }> = {
  owner: { en: 'Owner', hi: 'मालिक' },
  manager: { en: 'Manager', hi: 'प्रबंधक' },
  cashier: { en: 'Cashier', hi: 'कैशियर' },
  storekeeper: { en: 'Storekeeper', hi: 'स्टोरकीपर' },
  accountant: { en: 'Accountant', hi: 'लेखाकार' },
  viewer: { en: 'View-only', hi: 'केवल देखें' },
  website_manager: { en: 'Website Manager', hi: 'वेबसाइट प्रबंधक' },
  delivery_staff: { en: 'Delivery Staff', hi: 'डिलीवरी स्टाफ' },
};

export interface UserPermissions {
  canBillAndQuote: boolean;
  canOverrideDiscountAndVoid: boolean;
  canReceivePayments: boolean;
  canManageParties: boolean;
  canManageItemsAndCategories: boolean;
  canSeePurchasePriceAndMargin: boolean;
  canAdjustStock: boolean;
  canManagePurchases: boolean;
  canManageExpenses: boolean;
  canViewReports: boolean;
  canExportAndRestore: boolean;
  canManageUsersAndModules: boolean;
  canManageWebsiteContent: boolean;
  canApproveTradeAccountsAndReturns: boolean;
  canAccessDeliveries: boolean;
  canApproveAIProposals: boolean;
}

export function getRolePermissions(role: DecorBizRole): UserPermissions {
  switch (role) {
    case 'owner':
      return {
        canBillAndQuote: true,
        canOverrideDiscountAndVoid: true,
        canReceivePayments: true,
        canManageParties: true,
        canManageItemsAndCategories: true,
        canSeePurchasePriceAndMargin: true,
        canAdjustStock: true,
        canManagePurchases: true,
        canManageExpenses: true,
        canViewReports: true,
        canExportAndRestore: true,
        canManageUsersAndModules: true,
        canManageWebsiteContent: true,
        canApproveTradeAccountsAndReturns: true,
        canAccessDeliveries: true,
        canApproveAIProposals: true,
      };

    case 'manager':
      return {
        canBillAndQuote: true,
        canOverrideDiscountAndVoid: true,
        canReceivePayments: true,
        canManageParties: true,
        canManageItemsAndCategories: true,
        canSeePurchasePriceAndMargin: true,
        canAdjustStock: true,
        canManagePurchases: true,
        canManageExpenses: true,
        canViewReports: true,
        canExportAndRestore: true, // Export only
        canManageUsersAndModules: false,
        canManageWebsiteContent: true,
        canApproveTradeAccountsAndReturns: true,
        canAccessDeliveries: true,
        canApproveAIProposals: false,
      };

    case 'cashier':
      return {
        canBillAndQuote: true,
        canOverrideDiscountAndVoid: false,
        canReceivePayments: true,
        canManageParties: true,
        canManageItemsAndCategories: false,
        canSeePurchasePriceAndMargin: false, // Hidden from Cashier!
        canAdjustStock: false,
        canManagePurchases: false,
        canManageExpenses: true, // Own only
        canViewReports: true, // Own sales only
        canExportAndRestore: false,
        canManageUsersAndModules: false,
        canManageWebsiteContent: false,
        canApproveTradeAccountsAndReturns: false,
        canAccessDeliveries: false,
        canApproveAIProposals: false,
      };

    case 'storekeeper':
      return {
        canBillAndQuote: false,
        canOverrideDiscountAndVoid: false,
        canReceivePayments: false,
        canManageParties: false,
        canManageItemsAndCategories: true,
        canSeePurchasePriceAndMargin: false,
        canAdjustStock: true,
        canManagePurchases: true,
        canManageExpenses: false,
        canViewReports: true, // Stock reports
        canExportAndRestore: false,
        canManageUsersAndModules: false,
        canManageWebsiteContent: false,
        canApproveTradeAccountsAndReturns: false,
        canAccessDeliveries: false,
        canApproveAIProposals: false,
      };

    case 'accountant':
      return {
        canBillAndQuote: true,
        canOverrideDiscountAndVoid: false,
        canReceivePayments: true,
        canManageParties: true,
        canManageItemsAndCategories: false,
        canSeePurchasePriceAndMargin: true,
        canAdjustStock: false,
        canManagePurchases: true,
        canManageExpenses: true,
        canViewReports: true,
        canExportAndRestore: true, // Export only
        canManageUsersAndModules: false,
        canManageWebsiteContent: false,
        canApproveTradeAccountsAndReturns: false,
        canAccessDeliveries: false,
        canApproveAIProposals: false,
      };

    case 'viewer':
      return {
        canBillAndQuote: false,
        canOverrideDiscountAndVoid: false,
        canReceivePayments: false,
        canManageParties: false,
        canManageItemsAndCategories: false,
        canSeePurchasePriceAndMargin: false,
        canAdjustStock: false,
        canManagePurchases: false,
        canManageExpenses: false,
        canViewReports: true,
        canExportAndRestore: false,
        canManageUsersAndModules: false,
        canManageWebsiteContent: false,
        canApproveTradeAccountsAndReturns: false,
        canAccessDeliveries: false,
        canApproveAIProposals: false,
      };

    case 'website_manager':
      return {
        canBillAndQuote: false,
        canOverrideDiscountAndVoid: false,
        canReceivePayments: false,
        canManageParties: false,
        canManageItemsAndCategories: false,
        canSeePurchasePriceAndMargin: false,
        canAdjustStock: false,
        canManagePurchases: false,
        canManageExpenses: false,
        canViewReports: true, // Web only
        canExportAndRestore: false,
        canManageUsersAndModules: false,
        canManageWebsiteContent: true,
        canApproveTradeAccountsAndReturns: false,
        canAccessDeliveries: false,
        canApproveAIProposals: false,
      };

    case 'delivery_staff':
      return {
        canBillAndQuote: false,
        canOverrideDiscountAndVoid: false,
        canReceivePayments: false,
        canManageParties: false,
        canManageItemsAndCategories: false,
        canSeePurchasePriceAndMargin: false,
        canAdjustStock: false,
        canManagePurchases: false,
        canManageExpenses: false,
        canViewReports: false,
        canExportAndRestore: false,
        canManageUsersAndModules: false,
        canManageWebsiteContent: false,
        canApproveTradeAccountsAndReturns: false,
        canAccessDeliveries: true, // Own stops only
        canApproveAIProposals: false,
      };
  }
}
