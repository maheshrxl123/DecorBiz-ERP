/**
 * DecorBiz App Configuration
 * Based on DecorBiz PRD v2.0 Section 1.4 & Section 2
 */

export interface ProductLineConfig {
  id: 'tiles' | 'sanitary' | 'faucets' | 'adhesive' | 'general';
  nameEn: string;
  nameHi: string;
  description: string;
  defaultUnit: string;
  allowedUnits: string[];
}

export const APP_CONFIG = {
  name: 'DecorBiz',
  version: '2.0.0',
  license: 'Proprietary - OmniBiz Technologies',
  defaultLocale: 'en-IN',
  defaultCurrency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'dd/MM/yyyy',

  // Placeholder Business Data (PRD Section 1.4)
  placeholderBusiness: {
    legalName: 'Decor Studio Private Limited',
    tradeName: 'Decor Studio',
    city: 'Indore',
    state: 'Madhya Pradesh',
    stateCode: '23',
    address: 'Palasia Showroom, Indore, Madhya Pradesh',
    pincode: '452001',
    phone: '+91 98765 43210',
    email: 'contact@decorstudio.in',
    gstin: '23AAAAA0000A1Z5',
    gstScheme: 'Regular' as const,
    financialYearStart: '01-04',
    currency: 'INR',
    defaultLocationName: 'Showroom',
  },

  // Fixed Product Lines (PRD Section 7.1)
  productLines: [
    {
      id: 'tiles',
      nameEn: 'Tiles & Slabs',
      nameHi: 'टाइल्स और स्लैब',
      description: 'Ceramic, porcelain, vitrified, and large-format slabs',
      defaultUnit: 'box',
      allowedUnits: ['box', 'piece', 'sqft', 'sqm'],
    },
    {
      id: 'sanitary',
      nameEn: 'Sanitaryware',
      nameHi: 'सैनिटरीवेयर',
      description: 'Water closets, wash basins, cisterns, bathtubs',
      defaultUnit: 'piece',
      allowedUnits: ['piece', 'set'],
    },
    {
      id: 'faucets',
      nameEn: 'Faucets & CP',
      nameHi: 'नल और सीपी फिटिंग',
      description: 'Taps, mixers, showers, diverters, CP fittings',
      defaultUnit: 'piece',
      allowedUnits: ['piece'],
    },
    {
      id: 'adhesive',
      nameEn: 'Tiles Adhesive',
      nameHi: 'टाइल एडहेसिव',
      description: 'Cement adhesives, epoxy grout, tile grout, waterproofing',
      defaultUnit: 'pack',
      allowedUnits: ['pack', 'kg', 'litre'],
    },
    {
      id: 'general',
      nameEn: 'Other/General',
      nameHi: 'अन्य',
      description: 'Plumbing, electrical, paint, tools, fasteners, cement & steel',
      defaultUnit: 'piece',
      allowedUnits: ['piece', 'box', 'pack', 'kg', 'meter', 'bag'],
    },
  ] as ProductLineConfig[],

  // Seeded Categories under Other/General (PRD Section 7.1)
  generalSeededCategories: [
    'Plumbing',
    'Electrical',
    'Paint',
    'Tools',
    'Fasteners',
    'Cement and steel',
    'General',
  ],

  // Number & Currency Formatting
  numberFormat: {
    locale: 'en-IN',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },

  // Invoicing Defaults (PRD Section 5.6)
  invoice: {
    counterPrefix: 'CNT',
    websitePrefix: 'WEB',
    defaultTaxInclusive: false,
    defaultTileWastagePercent: 10,
    creditDaysDefault: 30,
  },
};
