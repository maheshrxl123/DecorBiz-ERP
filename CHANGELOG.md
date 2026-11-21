# Changelog

All notable changes to DecorBiz are documented in this file in accordance with Keep a Changelog.

## [2.0.0] - 2026-11-21

### Phase 0: Foundation & Core Refactoring
- **Cleaned Legacy Code**:
  - Removed all legacy pharmacy/clinical modules (`PharmacyProduct`, `PharmacyBatch`, `dlNumber`, `quarantineService`, `clinicalService`, `destructionService`, `prescriptionService`, `ScheduleH1`, etc.).
  - Deleted obsolete wholesale modules and components (`WholesaleOrders`, `WholesaleInvoices`, `wholesaleService.ts`, etc.).
  - Deleted legacy patches (`patch.cjs` - `patch9.cjs`) and shell helper scripts.
  - Removed obsolete AI Studio assets and committed screenshots.
  - Removed `@google/genai` package and direct Gemini endpoints.
- **Architectural Transformation**:
  - Migrated from multi-tenant `organizations/{orgId}` schema to single-tenant, root-level collections per PRD Section 3.3.
  - Implemented 8 fixed roles: Owner, Manager, Cashier, Storekeeper, Accountant, View-only, Website Manager, and Delivery Staff.
  - Added module registry in `config/modules.config.ts` with Simple Mode default toggles.
  - Implemented design system tokens in `config/theme.tokens.css` with primary forest green (`#1F4D3A`), warm stone (`#C4A574`), and neutral surfaces.
  - Integrated bilingual i18n system (`en.json` & `hi.json`) with official Hindi terminology from PRD Section 22 glossary.
  - Added router structure: `/` (Storefront / Business Card), `/erp/login` (Staff login, noindex), `/erp/*` (Staff ERP), `/account/login` (Customer login).

### Version 1: Showroom Release
- **Counter POS Billing**:
  - Barcode and product search across English and Hindi names, SKU, and series.
  - Tile box, piece, sq ft, and sq m dynamic conversion.
  - Single-transaction bill creation allocating sequential `CNT` prefix invoice numbers.
  - Indian GST engine supporting intra-state (CGST+SGST) and inter-state (IGST).
  - Multi-format printing: A4, A5, 58mm thermal, and 80mm thermal with UPI QR and amount in words.
  - Offline billing queue with device tracking, "Number pending sync", and stock conflict detection.
- **Inventory & Catalogue**:
  - Support for the 5 fixed product lines: Tiles & Slabs, Sanitaryware, Faucets & CP, Tiles Adhesive, Other/General.
  - Variant-level pricing, barcodes, HSN codes, and stock balances.
  - Atomic stock balance management preventing negative inventory.
- **Parties & Khata**:
  - Complete customer ledger, credit limits, credit days, and payment tracking.
  - Receivable ("आपको मिलेंगे") and Payable ("आपको देने हैं") balance tracking.
  - Printable statement of account with manual WhatsApp sharing.
- **Quotation**:
  - Single-room area quotation with customizable 10% wastage calculation, convertible directly into counter bills.
- **ERP Home & Reports**:
  - Real-time sales metrics, cash received, receivables/payables, and low stock alerts.
