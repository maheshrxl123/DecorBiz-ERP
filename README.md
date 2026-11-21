# DecorBiz ERP & Storefront

**Version 2.0** · Maintained by **OmniBiz Technologies**  
*Private & Proprietary Software for Tiles, Sanitaryware, Faucets & Construction Materials Dealers.*

---

## Overview

DecorBiz is a specialized showroom enterprise resource planning (ERP) system and integrated online storefront designed specifically for dealers selling:
- **Tiles & Slabs** (Ceramic, porcelain, vitrified, large-format slabs with box/sqft/sqm conversions)
- **Sanitaryware** (Water closets, basins, bathtubs, cisterns)
- **Faucets & Chrome-Plated (CP) Fittings** (Taps, showers, diverters, mixers)
- **Tiles Adhesive & Grout** (Cement adhesives, epoxy grout, waterproofing)
- **Other / General Hardware** (Plumbing, electrical, tools, fasteners, paint)

### Architecture Highlights
- **Deployment Model**: One install = One business = One Firebase project (Spark or Blaze).
- **Frontend**: React 18/19, Vite, TypeScript, PWA with Offline-first billing support.
- **Styling**: CSS Variables & tokens (`#1F4D3A` primary, `#C4A574` accent, `#F6F3EE` stone bg). Source Sans 3 & Noto Sans Devanagari typography.
- **Icons**: Tabler Icons (`@tabler/icons-react`).
- **Data Engine**: Cloud Firestore with atomic transactions for stock movements, invoice allocation, and ledger updates.
- **Media**: ImageKit integration with client-side image compression and signed access for private documents.
- **Language**: Bilingual English & Hindi with official industry terminology.
- **GST & Accounting**: Comprehensive Indian GST (CGST+SGST / IGST), HSN validation, party khata with credit limits, weighted average inventory valuation.

---

## Directory Structure

```text
decorbiz/
├── README.md                      # Project documentation
├── LICENSE                        # Proprietary license (OmniBiz Technologies)
├── CHANGELOG.md                  # Version release history
├── .env.example                  # Environment template
├── config/
│   ├── app.config.ts             # Application metadata, currency, locale, placeholders
│   ├── modules.config.ts         # Module registry and feature toggles
│   └── theme.tokens.css          # Design system color tokens and typography
├── src/
│   ├── app/                      # Router, guards, storefront vs ERP routes
│   ├── core/                     # Money (INR), units & area calculator, GST, stock, permissions, offline queue
│   ├── erp/                      # ERP views: POS billing, inventory, khata, quotations, settings
│   ├── storefront/               # Public storefront: catalogue, tile calculator, cart, accounts
│   ├── components/               # Reusable UI components & modals
│   ├── i18n/                     # Bilingual dictionaries (en.json, hi.json)
│   ├── lib/                      # Firebase initialization and helpers
│   ├── services/                 # Firestore services (single-tenant architecture)
│   └── types/                    # Core TypeScript schemas & Zod validators
├── firebase/
│   ├── firestore.rules           # Security rules covering the 8 roles and custom claims
│   ├── firestore.indexes.json    # Firestore composite query indexes
│   └── seed.json                 # Standard seeds for lines, categories, demo data
├── server/                       # Serverless adapter (ImageKit signatures, claims, webhooks)
├── scripts/                      # Management scripts (setup, check-env, export, import, upgrade)
└── docs/                         # Manuals and import templates
```

---

## Roles & Access Control

DecorBiz enforces 8 fixed roles defined in code and secured by custom Firebase Authentication claims:
1. **Owner**: Full access, settings, approvals, export/restore, module toggles.
2. **Manager**: Daily operations, billing, inventory, purchasing, reports, discount overrides.
3. **Cashier**: Fast POS counter billing, payments, customer search. Restricted from viewing purchase prices and margins.
4. **Storekeeper**: Stock receipts, adjustments, breakage records, barcode labels.
5. **Accountant**: GST reporting, ledgers, statements, day book, financial exports.
6. **View-only**: Read-only access to operational reports.
7. **Website Manager**: Public storefront content, banners, enquiries, coupon codes, review moderation.
8. **Delivery Staff**: Assigned deliveries, delivery challan updates, proof-of-delivery photo capture.

---

## Setup & Getting Started

1. **Prerequisites**: Node.js 18+ and npm.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Copy `.env.example` to `.env` and provide your Firebase and ImageKit configuration.
4. **Verify Environment**:
   ```bash
   npm run check-env
   ```
5. **Initialize Project Data**:
   ```bash
   npm run setup
   ```
6. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## License

OmniBiz Technologies - All Rights Reserved. Not for public redistribution.
