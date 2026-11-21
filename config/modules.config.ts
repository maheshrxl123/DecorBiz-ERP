/**
 * DecorBiz Module Registry & Configuration
 * Based on DecorBiz PRD v2.0 Section 4.1 & Section 16
 * 
 * In Simple Mode (Default for Version 1):
 * Only core showroom modules are enabled: dashboard, billing, quotations, 
 * parties & khata, inventory, payments, GST, and basic reports.
 * Advanced modules stay hidden until enabled by the Owner.
 */

export interface ModuleDefinition {
  id: string;
  name: string;
  nameHi: string;
  version: 1 | 2 | 3 | 4 | 5;
  enabledInSimpleMode: boolean;
  category: 'core' | 'operations' | 'storefront' | 'advanced';
  dependencies?: string[];
  description: string;
}

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  // Version 1: Core Showroom (Simple Mode Defaults)
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    nameHi: 'डैशबोर्ड',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: 'Daily showroom overview, sales, cash, receivables, payables, and low stock alerts.',
  },
  billing: {
    id: 'billing',
    name: 'Counter Billing (POS)',
    nameHi: 'काउंटर बिलिंग (POS)',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: 'Fast barcode & search billing, tile box conversion, discount controls, multi-format printing.',
  },
  quotations: {
    id: 'quotations',
    name: 'Single-Room Quotations',
    nameHi: 'कोटेशन',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: 'Area calculator with 10% wastage, tile coverage estimator, convert to bill.',
  },
  inventory: {
    id: 'inventory',
    name: 'Items & Inventory',
    nameHi: 'आइटम और स्टॉक',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: '5 fixed product lines, variants, SKU, barcode, HSN, sellable stock balance.',
  },
  parties: {
    id: 'parties',
    name: 'Parties & Khata',
    nameHi: 'पार्टी और खाता',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: 'Customer & supplier ledgers, you will get/give balances, statements, credit limit.',
  },
  payments: {
    id: 'payments',
    name: 'Payments',
    nameHi: 'भुगतान',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: 'Cash, UPI, Card, and Bank payments recording and reconciliation.',
  },
  gst_reports: {
    id: 'gst_reports',
    name: 'GST Reports',
    nameHi: 'जीएसटी रिपोर्ट',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: 'Monthly/quarterly CGST, SGST, IGST tax breakdown and HSN summary.',
  },
  reports_basic: {
    id: 'reports_basic',
    name: 'Basic Reports',
    nameHi: 'बुनियादी रिपोर्ट',
    version: 1,
    enabledInSimpleMode: true,
    category: 'core',
    description: 'Today sales, register summary, stock on-hand, cash book.',
  },

  // Version 2: Purchasing & Control
  purchases: {
    id: 'purchases',
    name: 'Purchasing & Landed Cost',
    nameHi: 'खरीद और आवक',
    version: 2,
    enabledInSimpleMode: false,
    category: 'operations',
    description: 'Supplier purchase bills, weighted average cost allocation with freight/unloading.',
  },
  expenses: {
    id: 'expenses',
    name: 'Showroom Expenses',
    nameHi: 'खर्च रजिस्टर',
    version: 2,
    enabledInSimpleMode: false,
    category: 'operations',
    description: 'Daily operational expenses with receipts and day book tracking.',
  },
  stock_adjustments: {
    id: 'stock_adjustments',
    name: 'Stock Count & Adjustments',
    nameHi: 'स्टॉक समायोजन',
    version: 2,
    enabledInSimpleMode: false,
    category: 'operations',
    description: 'Physical audit adjustments, barcode label printing (50x25mm / 38x25mm).',
  },
  breakage: {
    id: 'breakage',
    name: 'Breakage Register',
    nameHi: 'टूट-फूट रजिस्टर',
    version: 2,
    enabledInSimpleMode: false,
    category: 'operations',
    description: 'Log damaged tiles/sanitaryware with responsibility (supplier, transporter, shop).',
  },
  warranties: {
    id: 'warranties',
    name: 'Warranty Register',
    nameHi: 'वारंटी रजिस्टर',
    version: 2,
    enabledInSimpleMode: false,
    category: 'operations',
    description: 'Track sanitaryware and CP fitting warranties and claims.',
  },

  // Version 3: E-commerce Storefront
  storefront: {
    id: 'storefront',
    name: 'Online Storefront',
    nameHi: 'ऑनलाइन स्टोरफ्रंट',
    version: 3,
    enabledInSimpleMode: false,
    category: 'storefront',
    description: 'Public e-commerce catalogue at root (/), cart, customer checkout, orders queue.',
  },
  coupons_loyalty: {
    id: 'coupons_loyalty',
    name: 'Coupons & Loyalty',
    nameHi: 'कूपन और लॉयल्टी',
    version: 3,
    enabledInSimpleMode: false,
    category: 'storefront',
    description: 'Promotional discount codes, customer loyalty point accrual and redemption.',
  },
  enquiries: {
    id: 'enquiries',
    name: 'Showroom Visits & Enquiries',
    nameHi: 'पूछताछ और विजिट',
    version: 3,
    enabledInSimpleMode: false,
    category: 'storefront',
    description: 'Leads, measurement visits, showroom appointments slot calendar.',
  },

  // Version 4: Delivery & Projects
  delivery: {
    id: 'delivery',
    name: 'Delivery Challans',
    nameHi: 'डिलीवरी चालान',
    version: 4,
    enabledInSimpleMode: false,
    category: 'advanced',
    description: 'Vehicle routing, transporter management, proof of delivery photo.',
  },
  godowns: {
    id: 'godowns',
    name: 'Godowns & Multi-Location',
    nameHi: 'गोदाम और स्थान',
    version: 4,
    enabledInSimpleMode: false,
    category: 'advanced',
    description: 'Multi-location inventory tracking and inter-godown transfers.',
  },
  projects: {
    id: 'projects',
    name: 'Multi-Room Project Quotations',
    nameHi: 'प्रोजेक्ट और साइट्स',
    version: 4,
    enabledInSimpleMode: false,
    category: 'advanced',
    description: 'Multi-room bathroom suites, site ledgers, referrer/architect commissions.',
  },
  returns: {
    id: 'returns',
    name: 'Sales Returns & Credit Notes',
    nameHi: 'बिक्री वापसी (क्रेडिट नोट)',
    version: 4,
    enabledInSimpleMode: false,
    category: 'advanced',
    description: '3-day damage return claims, seal verification, Manager approval.',
  },

  // Version 5: Accounts & AI
  double_entry_accounts: {
    id: 'double_entry_accounts',
    name: 'Double-Entry Accounting',
    nameHi: 'वित्तीय लेखांकन',
    version: 5,
    enabledInSimpleMode: false,
    category: 'advanced',
    description: 'Journal vouchers, ledger accounts, trial balance, P&L, balance sheet.',
  },
  einvoice: {
    id: 'einvoice',
    name: 'E-Invoice & E-Way Bill (GSP)',
    nameHi: 'ई-इनवॉइस और ई-वे बिल',
    version: 5,
    enabledInSimpleMode: false,
    category: 'advanced',
    description: 'Government portal IRN generation and direct e-way bill dispatch.',
  },
  ai_assistant: {
    id: 'ai_assistant',
    name: 'AI Showroom Assistant',
    nameHi: 'एआई सहायक',
    version: 5,
    enabledInSimpleMode: false,
    category: 'advanced',
    description: 'AI drafting and insights with strict Owner proposal approval flow.',
  },
};

/**
 * Get active modules based on saved settings in Firestore
 */
export function getActiveModules(customSettings?: Record<string, boolean>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [key, mod] of Object.entries(MODULE_REGISTRY)) {
    if (customSettings && key in customSettings) {
      result[key] = customSettings[key];
    } else {
      result[key] = mod.enabledInSimpleMode;
    }
  }
  return result;
}
