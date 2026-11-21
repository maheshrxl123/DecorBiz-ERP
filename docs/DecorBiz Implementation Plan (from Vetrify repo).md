# DecorBiz Implementation Plan (from Vetrify repo)

Nov 21, 2026 · @Mahesh

The plan builds DecorBiz by porting selected Vetrify code into a new repo with a new Firebase project, in the PRD's five-version order, with Phase 0 first and Version 1 as the first usable release.

## 1. Decisions locked and working method

- **Original repo is never touched.** Clone Vetrify into a new private repo named `decorbiz`, start a fresh git history, and use a new Firebase project (Spark) and a new ImageKit and Vercel project. No data migration is needed.
- **PRD wins** on every conflict except the features you chose to keep: GST and e-way bill screens and architect analytics stay; wholesale is deleted; all pharmacy and Gemini code is deleted now.
- **Everything else that is built but not in the current version** (Tasks, combo suite builder, double-entry journal, store pickup, e-invoice IRN) is kept in the repo but hidden behind module switches, off by default.
- **Shape:** one install, one business, PRD section 3.3 collections, custom claims, eight fixed roles, separate `customers` accounts.
- **Fixed choices:** price per sq ft converted to box; Razorpay first; email only (no SMS yet); PRD palette and fonts; whole UI in English and Hindi using the glossary.
- **Team:** one developer, so work is sequenced to get a billable showroom (Version 1) live first, and each version is shippable on its own.

Durations below are my estimates for one full-time developer using AI-assisted coding. They are not commitments; section 8 shows the ranges and what could move them.

## 2. What happens to each part of the Vetrify repo

The UI kit, billing, khata, purchasing and GST code ports with edits; rules, server and data access are rebuilt on the PRD shape; pharmacy and wholesale code is deleted.

| Area in repo | Action | Notes |
| --- | --- | --- |
| UI kit (`components/ui`, common, dialogs, loading skeletons) | Port | Restyle to PRD tokens; swap lucide for Tabler. |
| Auth screens and `authService` (sign in, reset) | Port | Remove public sign-up for staff; staff only via Owner invite. |
| Staff invitation, staff detail drawers | Port | Rebuild on claims and the 8 PRD roles. |
| Roles and `rbac.ts`, `firestore.rules` | Rebuild | Write new rules from section 6 of the PRD plus rules tests. |
| Product master, categories, brands, CSV import, image uploader | Port | Re-model onto product, variant, balance; add missing line fields. |
| `server.ts`, `api/index.ts`, ImageKit signing | Rebuild | Small Vercel functions behind interfaces; keep the signing logic. |
| POS screen (barcode, discount, payments, print) | Port | Largest reuse. Fix invoice numbering, add discount limit, A5, UPI QR, amount in words. |
| Tile calculator | Port | Default 10%, read from setting; round up to boxes. |
| Customers, khata, collections aging, statements | Port | Becomes `parties`; keep aging and statement. |
| Purchases, suppliers, GRN, supplier returns | Port | Add landed cost and weighted average; drop FEFO and expiry except adhesive. |
| Sales returns and credit notes | Port | Add the PRD return policy and approval. |
| Breakage register | Port | Add who bears cost. |
| Godowns and stock transfers | Port | Hidden behind the godown switch (Version 4). |
| GST engine, HSN report, e-way bill, e-invoice | Port | GST engine and e-way data export stay; IRN generation hidden until Version 5. |
| Analytics: P&L, sq ft velocity, shade velocity, architect attribution | Port | Rewire to the new collections. |
| Audit log, activity log, notifications | Port | Slim down to PRD section 20.2 events. |
| Tasks workspace, combo suite builder, double-entry journal, store pickup | Hide | Module switches, off by default. |
| Online-order service and customer storefront view | Rebuild | Replace with a real public storefront and the PRD order flow. |
| Wholesale module (all `wholesale*` files, rules, types) | Delete |  |
| Prescriptions, H1, clinical, quarantine, destruction, Gemini endpoints | Delete |  |
| 9 `patch*.cjs`, 12 `.sh` scripts, `.aistudio/`, committed screenshots | Delete |  |
| `firebase-applet-config.json` and the hardcoded keys in `server.ts` | Delete | Use `.env` only. |

## 3. Phase 0: new repo and foundation (about 1.5 to 2 weeks)

Phase 0 ends when an empty DecorBiz install runs on a fresh Firebase project with correct routes, claims, rules, theme, Hindi switch and module switches, and no pharmacy or wholesale code left.

- [ ] Create the private `decorbiz` repo from a copy of Vetrify (no original history); add proprietary LICENSE, README, CHANGELOG
- [ ] Delete: wholesale, prescriptions, H1, clinical, quarantine, destruction, Gemini endpoints, patch and shell scripts, `.aistudio/`, committed images, `firebase-applet-config.json`
- [ ] Rename package to `decorbiz`; remove `PharmacyProduct`, `PharmacyBatch`, `dlNumber` and similar names everywhere
- [ ] Create Firebase project (Spark), ImageKit and Vercel projects; fill `.env` with the PRD section 2.4 variables only
- [ ] Add React Router: `/` storefront, `/erp/login`, `/erp/*`, `/account/login`; non-staff on `/erp` sees the storefront 404; `noindex` on ERP
- [ ] Replace Express with small Vercel functions behind `media`, `payments`, `messaging`, `claims`, `ai` interfaces; use the Admin SDK to verify tokens and set claims
- [ ] Write `firestore.rules` for the PRD section 3.3 collections and eight roles; remove the open customer reads and writes
- [ ] Set up Firebase Emulator and rules unit tests (customer cannot read purchase price, Website Manager cannot write stock, counter only in a bill transaction)
- [ ] Add `config/app.config.ts`, `modules.config.ts` and a module registry; a disabled module has no menu, route or write path
- [ ] Replace theme with PRD tokens, Source Sans 3, Noto Sans Devanagari, Source Serif 4; swap lucide for Tabler
- [ ] Add i18n (`en.json`, `hi.json`) with the PRD glossary and a language switch; add Indian number formatting
- [ ] Add the five-button mobile bar and the single 240 px sidebar
- [ ] Write `scripts/setup`, `check-env`, `export`, `import`; setup seeds the five lines, Other/General categories and the Owner with a claim
- [ ] Add TanStack Query, React Hook Form and Zod; switch tests to Vitest and Playwright; add private-repo CI (lint, test, build)
- [ ] Add PWA manifest and service worker shell (offline billing itself comes in Version 1)

## 4. Version 1 Showroom (about 5 to 6 weeks)

Version 1 is done when a cashier can bill by barcode and search in Hindi and English, offline and online, and the PRD section 21 Version 1 checks pass.

- [ ] Data layer: `products`, `variants`, `balances`, `stockMoves`, `parties`, `bills`, `quotations`, `payments`, `counters`, `audit`, `settings/*`, with Zod schemas and rules
- [ ] Product line forms for all five lines with the PRD section 7.3 fields; variants per section 7.4; HSN and GST required before first sale
- [ ] Categories, brands, series management; image upload (JPEG, PNG, WebP, client compression, 8-image cap with tags)
- [ ] Stock balances and sellable quantity; a bill never makes on-hand negative
- [ ] Counter bill in one transaction: counter-allocated `CNT` number, stock move, party balance; price resolution from section 8.1; per-variant discount limit with Manager approval
- [ ] Units: box, piece, sq ft and sq m conversion for tiles; integer units elsewhere
- [ ] GST engine: CGST+SGST or IGST by place of supply; tax-inclusive or exclusive setting; round-off
- [ ] Print and share: A4, A5, 58 mm, 80 mm; amount in words, UPI QR, bank details, PDF built in browser, manual WhatsApp share
- [ ] Payments, khata, party ledger, statement PDF, credit limit and days
- [ ] Single-room area quotation (wastage default 10%, Owner-editable) stored in Firestore, convertible to a bill; sales return is Version 4 per the PRD
- [ ] Offline billing: cache items and parties on device, queue bills with device id, "Number pending sync", Conflict state when stock is gone, offline banner
- [ ] ERP home (sales, cash, you'll get, you'll give, low stock) and basic reports
- [ ] Roles Owner to View-only with permission checks in UI and rules; profile screen; onboarding checklist; Simple Mode defaults
- [ ] Public business card at `/` (name, address, phone)
- [ ] Acceptance run: all Version 1 items in PRD section 21 on a fresh Firebase project

**Reuse:** POS screen, tile calculator, print modal, customer and khata screens, collections aging and statement, product form and CSV import. **Do not reuse:** random invoice numbers, localStorage quotations, FEFO batch selection.

## 5. Version 2 Purchasing and control (about 3 to 4 weeks)

Version 2 is done when a purchase receipt changes on-hand and weighted average cost including freight, and an exported file restores into an empty project.

- [ ] Purchase bills and purchase returns; supplier ledger
- [ ] Landed cost: allocate freight and unloading across lines; weighted average cost; store final purchasing price separately; hide both from Cashier
- [ ] Opening stock import and stock adjustments; stock count by scan
- [ ] Barcode: USB and camera scan on bill, goods receipt and stock count; labels 50x25 and 38x25 mm in Code 128, EAN-13 and QR
- [ ] Excel and CSV import with preview for products (sheet per line), opening stock, parties, rate lists; failed rows do not roll back accepted rows; templates in `docs/`
- [ ] Supplier rate-list import with preview and price history
- [ ] Low-stock alerts, display and sample stock, breakage register with who bears the cost, adhesive expiry on receipt lot
- [ ] Expenses with attachments (private ImageKit file with 15-minute signed URL); cash book, bank book, day book; simple profit estimate
- [ ] Warranty register
- [ ] Audit log screen (PRD section 20.2 events)
- [ ] JSON and CSV export and restore with typed business-name confirmation; `npm run upgrade` backs up first
- [ ] Stock reports: on hand, value at weighted average, low stock, dead and slow stock, margin by line and brand; Excel and PDF export
- [ ] Acceptance run: Version 2 items in PRD section 21, plus an upgrade test from Version 1 data

**Reuse:** supplier, PO and GRN screens, breakage panel, audit viewer, replenishment logic, analytics queries. **Change:** remove FEFO and expiry rules from everything except adhesive.

## 6. Version 3 Storefront (about 6 to 8 weeks)

Version 3 is the biggest build because the public shop does not exist yet; it is done when a retail customer can order with COD, staff can confirm it into a `WEB` bill, and a Razorpay webhook marks an advance paid.

- [ ] Public storefront at `/` with the PRD navigation, serif headings, English and Hindi content fields on products, banners, blog, policies and inspiration
- [ ] Customer accounts at `/account/login`, separate from staff; registration with customer type; no guest checkout
- [ ] Catalogue: publish switch, filters, sort, English and Hindi search by name, brand, series and SKU, stable slugs, meta tags, `sitemap.xml` (storefront URLs only)
- [ ] Product page: gallery (8 images), variant pickers, area calculator rounding up to whole boxes, GST note, stock state, series siblings, sets, YouTube link, approved reviews
- [ ] Trade tiers (contractor, plumber, architect, mason, dealer) with approval screen; online discount on resolved price
- [ ] Cart and checkout: billing and shipping address, optional GSTIN, serviceable-pincode check, quote request fallback
- [ ] Order flow fixed to PRD: Placed does not touch stock; staff confirmation reserves stock and creates the `WEB` bill in one transaction; first confirmation wins; remove the auto-created batch and price fallbacks
- [ ] Payments: COD, UPI on delivery, partial advance (default 30%), Razorpay through the server adapter with webhook verification, khata checkout for approved trade parties; Cashfree and PhonePe adapters after Razorpay works
- [ ] Coupons, loyalty, reviews and questions with moderation, blog, room inspiration gallery
- [ ] Enquiries (quote, showroom visit, measurement visit) with slot calendar and lead statuses
- [ ] Staff screens: website orders queue, trade approval, content, coupons, enquiries, notifications; Website Manager role limited by rules
- [ ] Email notifications through the adapter
- [ ] Usage warning on Owner home for Spark limits
- [ ] Acceptance run: Version 3 items in PRD section 21

**Reuse:** order status UI, address model, delivery partner types, notification centre. **Rebuild:** `ecommerceService`, `CustomerStorefrontView`, and the online-order rules.

## 7. Versions 4 and 5 (about 4 to 5 weeks, then 4 to 6 weeks)

Version 4 adds delivery, returns and projects on top of the storefront; Version 5 adds full accounts, e-invoice and the AI assistant.

### Version 4 Delivery and projects

- [ ] Delivery challan, Delivery Staff role (own stops only), status updates, proof-of-delivery photo (private file)
- [ ] Pincode list with charges, weight slabs, unloading charge; own vehicle busy then transporter
- [ ] 7-day reserve release that runs on ERP open and before any stock sale
- [ ] Returns workflow: no return after seal is opened, 3-day damage claim, Owner or Manager approval; sales return and credit note on the billing engine (screen B5)
- [ ] Godown module switch, location picker on bills, location transfer (ported from Vetrify warehouses and transfers)
- [ ] Multi-room project quotation, site ledgers, referrer commission with payout (extends the architect commission code)
- [ ] Cheque register; e-way bill data export (ported); optional SMS adapter
- [ ] Acceptance run: Version 4 items in PRD section 21

### Version 5 Accounts and assistant

- [ ] Double-entry accounting switched on (ported journal), trial balance, profit and loss, balance sheet, bank reconciliation, comparison charts
- [ ] E-invoice through a GSP (ported screens), off until configured and never blocking a bill
- [ ] AI assistant: Owner supplies provider and key (encrypted by the adapter); fixed tool list; every change is a proposal the Owner approves
- [ ] Acceptance run: Version 5 items in PRD section 21

## 8. Schedule, risks and testing

One developer needs roughly 24 to 31 weeks for all five versions, and a billable Version 1 is ready around week 7 to 8.

| Phase | Estimate (weeks) | Cumulative (weeks) | Usable at the end |
| --- | --- | --- | --- |
| Phase 0 Foundation | 1.5 to 2 | 1.5 to 2 | No |
| Version 1 Showroom | 5 to 6 | 6.5 to 8 | Yes, counter billing |
| Version 2 Purchasing and control | 3 to 4 | 9.5 to 12 | Yes, full back office |
| Version 3 Storefront | 6 to 8 | 15.5 to 20 | Yes, online shop |
| Version 4 Delivery and projects | 4 to 5 | 19.5 to 25 | Yes |
| Version 5 Accounts and assistant | 4 to 6 | 23.5 to 31 | Yes |

**Fastest path:** release Version 1 to one real shop as soon as it passes acceptance, and let that shop's feedback shape Version 2 priorities.

**Main risks**

- Version 3 is the largest unknown: Razorpay webhooks, checkout and content in two languages. Build Razorpay in Version 3 and the other gateways later.
- Offline billing with correct numbering and conflicts is the hardest part of Version 1; build and test it early, not last.
- Spark limits (about 50,000 reads and 20,000 writes a day) can bite a busy storefront; page and cache reads from day one.
- Porting code that assumed multi-tenant paths can leave hidden `organizations/{orgId}` references; grep for them at the end of Phase 0.
- Ported screens may carry sample numbers or fallbacks (for example the 100-rupee price fallback); review each ported screen against the PRD before accepting it.

**Testing**

- Rules unit tests for every case in PRD section 20.1, run in CI on each commit.
- Vitest for core logic: money, GST, units, price resolution, weighted average, area calculator.
- Playwright flows for each version's acceptance list in PRD section 21, run on a fresh emulator and on an upgraded copy of the previous version's data.
- Manual device checks: Android Chrome and iOS Safari PWA, 80 mm thermal print dialog, USB barcode scanner.

## 9. Open items

None of these block Phase 0, but each needs an answer before the version named.

- [ ] Phase 0: who creates the new GitHub repo and Firebase, ImageKit and Vercel accounts? This session can only read Vetrify, so it can prepare the cleaned code as files but cannot push to your new repo.
- [ ] Version 1: which first shop will test it, and do you have its GSTIN, bank and UPI details for print templates?
- [ ] Version 1: who reviews the Hindi strings? The glossary covers about 19 terms; the whole UI needs many more.
- [ ] Version 2: do you have a supplier price list sample to test the rate-list import?
- [ ] Version 3: which SMTP or email service will send order mail, and do you have a Razorpay test account?
- [ ] Version 3: what are the serviceable pincodes, delivery charges and return policy wording for the first shop?
- [ ] Version 5: which AI provider will the Owner connect, and which GSP for e-invoice?
