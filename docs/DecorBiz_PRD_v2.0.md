# DecorBiz

## Product Requirements Document (PRD)

| | |
|---|---|
| **Version** | 2.0 |
| **Product** | DecorBiz |
| **Maintainer** | OmniBiz Technologies |
| **License** | Private. OmniBiz Technologies owns the code. Not open source. |
| **Type** | ERP and e-commerce for tiles, sanitaryware, and related hardware. Installed separately for each dealer. |
| **Model** | One install = one business = one Firebase project |
| **Stack** | React 18 + Vite + TypeScript (installable PWA). Cloud Firestore + Firebase Authentication. ImageKit for media. A small server adapter, initially on Vercel, for secrets and webhooks. |
| **Charts / Icons** | Chart.js or Recharts / Tabler Icons only. No emoji. |
| **Languages** | English and Hindi |
| **Region default** | India (INR, GST, Indian number format, +91) |
| **Example URLs** | `https://www.decorbiz.ai.studio` is an example only, not a required production domain |

This document replaces the BizOne ERP PRD for this product. DecorBiz does not use Supabase. It does not include kirana, medical, clothing, general-retail, wholesale, or service packs.

Figures marked **(verify)** depend on Firebase, ImageKit, or payment-provider limits that change. Check the provider's current documentation before a release.

---

## 0. Decisions that were fixed while writing

These points were not spelled out in one sentence. They are now product rules. Change them only by revising this PRD.

| Topic | Rule in this PRD |
|---|---|
| Wider hardware | Plumbing, electrical, paint, tools, fasteners, and cement and steel are seeded categories inside **Other/General**. They are not separate product lines. |
| Backup | The backup module is JSON and CSV export and restore from the ERP. There is no Google Drive backup. |
| Tile batch | Shade, batch, and caliber are optional fields on Tiles & Slabs. They are not required. A bill does not warn when batches are mixed. |
| Cut pieces | The counter can sell tiles by piece, box, sq ft, or sq m. There is no separate cut-piece workflow. The website sells tiles in whole boxes only. |
| Wastage | The area calculator defaults to **10%** wastage. The Owner can change the default. |
| Stock value | On-hand value and margin use **weighted average** cost. Freight and unloading are included in that cost. **Final purchasing price** is the latest landed unit cost and is stored separately. FIFO is not the valuation method. |
| Returns | The Owner can change the policy. The default is: no return after the box or seal is opened; a damage or breakage claim within **3 days** of delivery; the **Owner** approves any refund or replacement. |
| Partial advance | The percent is a setting. The default is **30%**, collected online through an enabled gateway. If no gateway is enabled, partial advance is unavailable. |
| Languages | Screens are English and Hindi. Customer-facing content (product name, description, banners, blog, policies, inspiration) has both an English and a Hindi field. |
| Low stock | At or below the reorder level, the ERP shows a low-stock alert and the website still sells the item. The website shows **Out of stock** only when the sellable quantity is zero. The product can stay published. |
| Reviews | A review or question is visible only after the Owner or Website Manager approves it. |
| Unconfirmed orders | Placing an order does not reduce stock. Only staff confirmation does. There is no second timer for orders that staff have not yet accepted. |
| Spark plan | The install targets Firebase **Spark**. Work that Spark cannot run is done in the server adapter or when the app is next opened. See section 3.4. |

---

## 1. Overview

DecorBiz is a private showroom system for businesses that sell tiles, slabs, sanitaryware, faucets and chrome-plated fittings, tile adhesive, and related hardware. OmniBiz Technologies installs it once per dealer.

The same install has two faces:

- The **storefront** is the public shop at the site root (`/`).
- The **ERP** is the staff application at `/erp`. It is not linked from the shop, it is marked `noindex`, and it is left out of the sitemap.

Staff run the shop from the ERP: billing, stock, purchases, khata, the website, orders, and reports. Customers use the storefront. The ERP is the only place where catalogue, prices, stock, content, coupons, delivery, and orders are managed.

The default experience is Simple Mode: a cashier can bill quickly, and advanced modules stay off until the Owner enables them. The product must not feel like a form-builder or a custom-accounting workshop.

### 1.1 Goals

1. A cashier can make a counter bill in under one minute, including a barcode scan, without training.
2. Stock, money, and party balances stay correct and can be reconciled.
3. One catalogue feeds the counter and the website. A product is on the website only when **Publish to website** is on.
4. Each of the five versions can be installed and used in a live shop. A later version upgrades the same install without losing data.
5. Owners get on/off switches. Only OmniBiz developers change structure, product lines, or code.
6. English and Hindi are both first-class in the interface and in customer-facing content.
7. The counter keeps working when the internet drops, and syncs when it returns.
8. The AI assistant, when enabled, can draft and explain. It cannot change data until the Owner approves.

### 1.2 Product boundary

DecorBiz is for one tiles and sanitaryware business per install.

Not part of the five versions:

- A second business inside the same install, or a multi-tenant SaaS
- Kirana, medical, clothing, restaurant, or other trade packs
- Native Android or iOS apps (the existing Capacitor Android project is not part of DecorBiz)
- A 3D or AR tile visualizer
- Uploaded product video or a 360° viewer (a YouTube link is allowed)
- Google sign-in, phone OTP, or a cashier PIN
- Google Drive backup
- Manufacturing and payroll modules
- Open-source licensing or a public repository

Live e-invoice through a GSP is Version 5, not earlier. E-way bill **data export** is Version 4.

### 1.3 Target users

| User | Needs |
|---|---|
| Owner | Sales, dues, staff, modules, backup export, approvals |
| Manager | Daily sales, purchases, prices, stock, reports |
| Cashier | Fast billing, payments, print or share |
| Storekeeper | Stock in and out, barcode, adjustments, breakage |
| Accountant | GST, ledgers, exports |
| View-only | Read reports without changing data |
| Website Manager | Banners, pages, blog, inspiration, coupons, enquiries, review moderation. Not prices or stock. |
| Delivery Staff | Assigned deliveries, status, proof-of-delivery photo |
| Retail customer | Browse, calculate area, order, track, review |
| Trade customer | After ERP approval: contractor, plumber, architect, mason, or dealer price |
| Developer (OmniBiz) | Install, upgrade, theme tokens, server adapter |

### 1.4 Placeholder business

Setup examples and demo data use these placeholders. They are not a real customer.

| Field | Placeholder |
|---|---|
| Legal name | Decor Studio Private Limited |
| Trade name | Decor Studio |
| City | Indore |
| Address | Palasia Showroom, Indore, Madhya Pradesh |
| GSTIN | 23AAAAA0000A1Z5 |
| GST scheme | Regular |
| Financial year | 1 April to 31 March |
| Locations | One showroom until the godown module is enabled |
| Currency | INR |

---

## 2. Product model and deployment

### 2.1 One install, one business

One Firebase project and one deployed web app serve one business. There is a single business profile. Optional locations (showroom, godown) exist only inside that business.

OmniBiz repeats this install for every dealer. Dealers do not share a database.

### 2.2 Routes

| URL | Who | Behaviour |
|---|---|---|
| `/` | Public | Storefront. If the storefront module is off, show the business name, address, and phone only. |
| `/erp/login` | Staff who know the address | Email and password. `noindex`. No link from the shop. |
| `/erp` and `/erp/*` | Signed-in staff | ERP. |
| `/erp` and `/erp/*` without a staff session | Anyone else | The storefront 404 page. No login form and no "staff only" message. |
| `/account/login` | Customers | Email and password. |

A customer account that signs in at `/erp/login` is rejected and sees the same 404. A staff account cannot be used as a shopper account.

### 2.3 Deployment

| Piece | Initial choice | Rule |
|---|---|---|
| Web app | Vercel | Static PWA. Can move to another static host later. |
| Server adapter | Vercel serverless functions | The only place for private keys, webhooks, and Admin SDK. |
| Database and auth | Firebase, Spark plan | One production project per dealer. |
| Media | ImageKit free plan | Public product media. Signed URLs for private files. |
| Firestore region | Chosen in the Firebase console when the project is created | Not hardcoded. Record the region in the install notes. |
| DNS | The dealer's own domain | The `decorbiz.ai.studio` host is an example in docs only. |

Developers use the Firebase Emulator locally. A second cloud project for staging is not required.

### 2.4 Environment and secrets

Browser variables are only public client configuration:

| Variable | In browser | Required |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Yes |
| `VITE_FIREBASE_APP_ID` | Yes | Yes |
| `VITE_IMAGEKIT_URL_ENDPOINT` | Yes | Yes |
| `VITE_IMAGEKIT_PUBLIC_KEY` | Yes | Yes |
| `VITE_APP_NAME` | Yes | No |

Server-adapter secrets, never shipped to the browser:

| Secret | Purpose |
|---|---|
| Firebase service account | Set custom claims, trusted writes, webhook updates |
| `IMAGEKIT_PRIVATE_KEY` | Sign uploads and private URLs |
| `APP_ENCRYPTION_KEY` | Encrypt integration secrets at rest |
| Payment, SMS, SMTP, and AI keys | Used only after the Owner enables that integration |

Integration keys are entered in **Settings → Integrations**. The browser posts them once to the adapter. The adapter encrypts them and stores ciphertext in Firestore. The browser never receives them back in plaintext. Enabling Razorpay, Cashfree, PhonePe, an included SMS provider, or email does not require a code change. Adding a provider that has no adapter yet does require an OmniBiz code change.

Core counter billing must work when every optional integration is off.

### 2.5 Setup

1. Create the Firebase project on Spark, choose the region, and enable Email/Password authentication and Firestore.
2. Create the ImageKit account and the Vercel project.
3. Fill `.env`. `npm install`, then `npm run setup`.
4. `check-env` checks the Firebase client config, adapter secrets, and ImageKit public endpoint. It does not fail because a payment or SMS key is empty.
5. Setup asks for the business profile (placeholders are the defaults in demo), the Owner email and password, GST on or off, financial-year start, and demo data yes or no.
6. Setup writes the business profile, seeds the five product lines and the Other/General categories, creates the Owner with a staff claim, and prints the storefront URL and `/erp/login`.

There is no browser installer. The service account never passes through a shop browser.

### 2.6 Upgrades

Each version is a tagged release that a shop can run every day. `npm run upgrade` backs up by running the export, applies that version's Firestore migrations in order, and prints what changed. Data already entered is kept. A module that ships in a later version stays off until the Owner turns it on, except when the upgrade notes say it is part of the new default.

---

## 3. Architecture

| Layer | Technology | Role |
|---|---|---|
| UI | React, Vite, TypeScript | PWA, storefront and ERP routes |
| Server state | TanStack Query | Cache, pagination, retries |
| Forms | React Hook Form + Zod | Validation |
| Tables | TanStack Table (virtualized) | Large lists |
| Styling | CSS variables | ERP theme and storefront theme from one token set |
| Database | Cloud Firestore | Documents, counters, security rules |
| Auth | Firebase Authentication | Email and password only |
| Access | Security rules + custom claims | Staff and customers are different |
| Media | ImageKit | Images and file delivery |
| Privileged logic | Server adapter | Claims, ImageKit signatures, payment webhooks, email, SMS, AI proxy |
| Files | Browser | PDF and Excel built on device |
| Tests | Vitest, Playwright, Firebase rules unit tests | Unit, end-to-end, rules |
| CI | Private repository CI | Lint, test, build |

### 3.1 Rules

1. Stock, invoice numbers, and party balances change only inside a Firestore transaction. Screen totals are previews until the transaction commits.
2. Sellable quantity is never written below zero.
3. The service account and ImageKit private key never appear in frontend code, logs, or exports.
4. A disabled module has no menu, no route, and no client write path.
5. Product-line fields are code, not a form builder.
6. The server adapter is behind an interface (`media`, `payments`, `messaging`, `claims`, `ai`) so the host can move off Vercel without rewriting screens.
7. PDF and Excel are built in the browser.
8. Custom claims are set only by the Admin SDK.

### 3.2 Repository shape

```text
decorbiz/
├── README.md  LICENSE (proprietary)  CHANGELOG.md  .env.example
├── package.json  vite.config.ts
├── config/        app.config.ts  modules.config.ts  theme.tokens.css
├── src/
│   ├── app/       storefront routes, erp routes, guards
│   ├── core/      money, units, tax, stock, permissions
│   ├── erp/       billing, parties, inventory, purchase, payments,
│   │              expenses, reports, delivery, projects, settings, ai
│   ├── storefront/  home, catalogue, product, cart, checkout, account, content
│   ├── components/
│   ├── i18n/      en.json  hi.json
│   └── types/
├── firebase/      firestore.rules  firestore.indexes.json  seed
├── server/        adapter (ImageKit, claims, webhooks, mail, SMS, AI)
├── scripts/       setup, check-env, upgrade, export, import
└── docs/          install, upgrade, user manual (en, hi)
```

### 3.3 Firestore shape

Firestore has no joins. The PRD accepts duplicated names on bills and orders (party name, item name, GSTIN snapshot) so a printed invoice does not change when a master record is edited later.

Main collections:

| Collection | Holds |
|---|---|
| `business/profile` | The one business |
| `settings/*` | Invoice series, tax, modules, delivery, returns, loyalty, payments |
| `staff/{uid}` | Staff profile and role. Claim is the source of access. |
| `customers/{uid}` | Shopper profile, trade type, approval, GSTIN |
| `parties/{id}` | Khata parties, suppliers, referrers. A customer may be linked. |
| `productLines/{id}` | The five fixed lines |
| `categories/{id}` | Owner-managed, each tied to one line |
| `brands/{id}`, `series/{id}` | Brand and design family |
| `products/{id}` | Design-level item and line-specific fields |
| `variants/{id}` | Sellable SKU: price, barcode, stock identity |
| `balances/{variantId_locationId}` | On-hand and reserved quantity |
| `stockMoves/{id}` | Immutable in, out, adjust, reserve, release |
| `bills/{id}`, `billLines` | Counter and website invoices |
| `quotations/{id}` | Estimates |
| `payments/{id}` | Receipts and payouts |
| `purchases/{id}` | Supplier bills and returns |
| `expenses/{id}` | Expenses |
| `webOrders/{id}` | Website orders before and after confirmation |
| `coupons/{id}`, `loyalty/{partyId}` | Promotions |
| `enquiries/{id}`, `slots/{id}` | Leads and the visit calendar |
| `content/*` | Banners, pages, blog, inspiration |
| `reviews/{id}` | Reviews and questions |
| `deliveries/{id}` | Challans and proof of delivery |
| `locations/{id}` | Showroom and optional godowns |
| `projects/{id}` | Site ledgers |
| `commissions/{id}` | Referrer commission |
| `warranties/{id}`, `breakage/{id}` | After-sales registers |
| `files/{id}` | ImageKit path, purpose, public or private |
| `counters/{name}` | Invoice and order numbers |
| `audit/{id}` | Important changes |
| `offlineQueue` | Local only, on the device, until sync |

Security rules:

- Public reads: published products, public content, brand and category names. Purchase price, discount limit, and staff notes are not in those documents.
- Customers read and write only their own profile, cart, orders, and reviews.
- Staff access follows section 6.
- Website Manager writes content, coupons, enquiries, and review status. Rules reject changes to price and stock from that role.
- Delivery Staff reads only deliveries assigned to them, and may update status and the proof photo.
- Invoice numbers come from a counter document inside the same transaction as the bill.

### 3.4 Spark plan constraints

The dealer project stays on Spark unless OmniBiz moves that dealer to Blaze. These limits must be written in the install guide **(verify)**:

- Stored data about 1 GiB
- About 50,000 document reads a day, 20,000 writes, and 20,000 deletes

Consequences that are part of the design:

- No Cloud Functions and no scheduled jobs.
- The 7-day stock release runs when a staff member opens the ERP and again before any stock transaction. It is not a midnight cron job.
- Payment webhooks, email, SMS, ImageKit signing, and the AI proxy run in the server adapter.
- A busy website can exhaust Spark in a day. The Owner screen shows a storage and usage warning. Moving that install to Blaze is an OmniBiz operations change, not a feature rewrite.
- Firebase Authentication email and password, including reset mail sent by Firebase, is the login method.

### 3.5 ImageKit

- Free plan **(verify)**.
- Product images, room photos, banners, and the logo are public ImageKit URLs.
- Claim photos, expense files, and other staff attachments are private. The adapter issues a signed URL that expires in 15 minutes.
- The browser asks the adapter for an upload signature, then uploads to ImageKit. The private key stays on the adapter.
- Accepted images: JPEG, PNG, WebP. The client compresses before upload. Executables and other types are rejected.
- A product holds at most **8** images in total. That total includes the primary image, variant images, and room or installed photos. Each image has a tag: `primary`, `gallery`, `variant`, or `room`.
- Video is a YouTube URL only. It does not count toward the 8 images.

---

## 4. Customization

Owners do not change the software's structure.

**Not in the app:** custom product-line builder, form builder, report builder, workflow builder, custom role builder, theme builder, print-template designer.

**Owner controls:** business profile, invoice series, module switches, users and the fixed roles, categories, brands, series, coupons, content, delivery pincodes, light or dark mode, language, integrations, export and restore.

**Developer controls:**

| Point | What it changes |
|---|---|
| `config/app.config.ts` | App name, locale, currency, enabled version |
| `config/theme.tokens.css` | Colour, type, radius |
| Product-line code | Fields and units for the five lines |
| Module registry | Routes, menu, permissions |
| `server/` adapters | A new payment or SMS provider |
| `src/i18n/` | Strings |

Switching a module off hides it and keeps its data.

### 4.1 Simple Mode

A new install turns on only: dashboard, billing, quotations, parties and khata, inventory, payments, GST, and the basic home report.

Purchases, expenses, storefront, coupons, loyalty, delivery, godowns, projects, cheque register, SMS, payment gateways, double-entry accounting, and AI stay off until the Owner enables them. Their data model can exist after the version that ships them is installed.

---

## 5. UI design

### 5.1 Two faces, one brand

There is no logo and no brand colour guide yet. Until OmniBiz supplies one, both faces use the tokens below. Tokens live in `theme.tokens.css` and can be replaced without a layout change.

The ERP is flat and quiet: borders, no gradients, no decorative graphics, phone-first at 360 px.

The storefront uses the same colours and a more photographic layout: large product images, more whitespace, and a serif face for marketing headings only. The ERP keeps a sans-serif face everywhere.

| Token | Hex | Use |
|---|---|---|
| `--primary` | `#1F4D3A` | Buttons, ERP active state |
| `--primary-dark` | `#143528` | Pressed state, links |
| `--accent` | `#C4A574` | Storefront highlights, price |
| `--bg` | `#F6F3EE` | Page background |
| `--surface` | `#FFFFFF` | Cards |
| `--text` | `#1C1917` | Main text |
| `--text-muted` | `#57534E` | Labels |
| `--border` | `#E7E5E4` | Borders |
| `--receive` | `#15803D` | To receive, success |
| `--give` | `#B91C1C` | To give, errors |
| `--warning` | `#A16207` | Low stock |

Dark theme for the ERP swaps the surfaces to deep stone (`#1C1917` background, `#292524` cards, `#FAFAF9` text) and keeps the same primary green. Status is never colour alone; every status has a label.

Typography: **Source Sans 3** for UI and Hindi **Noto Sans Devanagari**. Storefront headings: **Source Serif 4**. Sizes 12, 14, 16, 18, 20, 24, 32 px. Amounts use tabular digits and Indian grouping (₹1,23,456.00).

Touch targets are at least 48 × 48 px. Motion is 150–200 ms and respects reduced motion. Icons are Tabler, 24 px.

### 5.2 ERP navigation

Mobile bottom bar, exactly five controls:

1. Home
2. Bills
3. Quick Actions (+)
4. Parties
5. More

Quick Actions opens a sheet: New Bill, Receive Payment, Add Party, Add Item, Add Expense, New Purchase. Items and the rest live under More. There is no sixth floating button.

Desktop: one sidebar, 240 px, collapsing to 72 px. No second sidebar. Settings uses horizontal tabs inside the page.

The top bar has search, language, theme, notifications, and the profile menu.

### 5.3 Storefront navigation

The shop does not use the ERP five-button bar.

Header: Home, Tiles & Slabs, Sanitaryware, Faucets & CP, Adhesive, Other, Inspiration, Blog, Account, Cart.

Footer: about, contact, policies, store locator.

### 5.4 Shared components

Buttons (primary, secondary, ghost, danger), app bar, image upload with progress, searchable pickers, line-item rows, status chips, toasts, empty and error states, skeleton loading. Destructive actions use a dialog that names the record. Charts need a text summary.

Every list defines empty, loading, error, offline, and permission-denied states.

### 5.5 Profile

Every signed-in person has a profile: display name, phone, photo, password change, and email change with verification. They can see their role. They cannot change their role. The app never stores a plaintext password.

### 5.6 Print

| Output | Spec |
|---|---|
| Tax invoice | A4 and A5, plus 58 mm and 80 mm thermal |
| Header | Logo, legal name, address, GSTIN, phone |
| Lines | Name, HSN, qty and unit, rate, discount, tax, amount |
| Footer | Tax summary, amount in words, bank details, UPI QR, terms |
| Labels | 50 × 25 mm and 38 × 25 mm, Code 128, EAN-13, or QR |
| Share | Browser print, PDF, and a manual WhatsApp share of the PDF |

Counter series and website series use different prefixes (default `CNT` and `WEB`), editable in invoice settings. Numbers do not overlap.

### 5.7 Accessibility

Visible focus, labelled inputs, AA contrast, text scale to 200%, keyboard use on desktop, screen-reader names on icon buttons.

---

## 6. Roles and permissions

Roles are fixed in code. The Owner invites staff. There is no public staff signup. The last Owner cannot be removed or demoted. Deactivating a user blocks access immediately.

| Capability | Owner | Manager | Cashier | Storekeeper | Accountant | View-only | Website Mgr | Delivery |
|---|---|---|---|---|---|---|---|---|
| Bills and quotations | Yes | Yes | Yes | No | Yes | No | No | No |
| Discount above the item limit, void bill | Yes | Yes | No | No | No | No | No | No |
| Payments | Yes | Yes | Yes | No | Yes | No | No | No |
| Parties | Yes | Yes | Yes | No | Yes | No | No | No |
| Items, categories, brands | Yes | Yes | No | Yes | No | No | No | No |
| See purchase price and margin | Yes | Yes | No | No | Yes | No | No | No |
| Stock adjustment | Yes | Yes | No | Yes | No | No | No | No |
| Purchases | Yes | Yes | No | Yes | Yes | No | No | No |
| Expenses | Yes | Yes | Own | No | Yes | No | No | No |
| Reports | Yes | Yes | Own sales | Stock | Yes | Yes | Web only | No |
| Export and restore | Yes | Export | No | No | Export | No | No | No |
| Users, modules, integrations | Yes | No | No | No | No | No | No | No |
| Website content, coupons, enquiries | Yes | Yes | No | No | No | No | Yes | No |
| Prices and stock from the website role | — | — | — | — | — | — | No | No |
| Approve trade accounts and returns | Yes | Yes | No | No | No | No | No | No |
| Assigned deliveries and proof photo | Yes | Yes | No | No | No | No | No | Own stops |
| AI chat | Yes | Yes | Optional | Optional | Yes | No | No | No |
| Approve AI changes | Yes | No | No | No | No | No | No | No |

Customers register themselves. Retail can order as soon as the account exists. Contractor, plumber, architect, mason, and dealer accounts see retail prices until a Manager or Owner approves the trade tier.

---

## 7. Catalogue and inventory

### 7.1 Product lines

Five lines exist in code. The Owner cannot add, rename, or delete a line. The Owner can add, edit, and archive categories under every line.

| Line id | Name | What it is |
|---|---|---|
| `tiles` | Tiles & Slabs | Ceramic, porcelain, vitrified, and slabs |
| `sanitary` | Sanitaryware | WC, basins, cisterns, bathtubs, and related |
| `faucets` | Faucets & CP | Taps, mixers, showers, and chrome-plated fittings |
| `adhesive` | Tiles Adhesive | Adhesive, grout, and waterproofing compounds |
| `general` | Other/General | Related hardware that has no line of its own |

Seeded categories under Other/General: Plumbing, Electrical, Paint, Tools, Fasteners, Cement and steel, General. The Owner may add more.

A product belongs to one line and one category. A product is one design. A variant is what is stocked, priced, barcoded, and sold.

### 7.2 Shared commercial fields

Every variant stores:

| Field | Rule |
|---|---|
| SKU | Unique inside the business |
| Barcode | Optional until labels are printed. EAN-13, Code 128, or QR. Unique when present. |
| MRP | Printed on labels and the product page |
| Selling price | Showroom price before a tier or an online discount |
| Final purchasing price | Latest landed unit cost. Hidden from cashier, website, and delivery roles. |
| Discount limit | Maximum extra discount a cashier may apply |
| HSN and GST % | Required before the first sale and before publish |
| Reorder level | ERP alert only |
| Publish flag | On the parent product. Out-of-stock products may stay published. |
| Online discount | Optional percent or amount off the resolved price, website only |

### 7.3 Fields by line

**Tiles & Slabs.** Size in mm and inches, thickness, finish, surface, body (ceramic, porcelain, vitrified, slab), application (floor, wall, outdoor, parking, elevation), rectified yes/no, faces (random or bookmatch), colour, design name, grade / PEI, water absorption, brand, series, pieces per box, sq ft per box, sq m per box, weight per box, optional shade, optional batch, optional caliber.

**Sanitaryware.** Type (WC, wall-hung, basin, pedestal, urinal, cistern, bathtub, other), mounting, rough-in, trap (P or S), flush type, colour, brand, series, sold as piece or set, seat and cover included yes/no, warranty months, dimensions, weight.

**Faucets & CP.** Type (tap, mixer, shower, diverter, health faucet, waste coupling, other), finish (chrome, matt black, gold, other), material, size, brand, series, cartridge, pressure or flow (optional), warranty months.

**Tiles Adhesive.** Type (cement-based adhesive, epoxy grout, tile grout, waterproofing, other), grade, pack size and unit (kg or litre), coverage per kg or per litre, shelf life, grout colour, brand, batch, expiry.

**Other/General.** Name, category, brand, unit, size, and up to eight specification rows of label plus value. No form builder.

### 7.4 Variants

| Line | Variant axes | Each variant has |
|---|---|---|
| Tiles & Slabs | Size, finish, shade | Own stock, prices, barcode |
| Sanitaryware | Colour, mounting | Own stock, prices, barcode |
| Faucets & CP | Finish, size | Own stock, prices, barcode |
| Tiles Adhesive | Pack size, colour | Own stock, prices, barcode |
| Other/General | One name chosen by the Owner | Own stock, prices, barcode |

### 7.5 Units

| Goods | Counter | Website |
|---|---|---|
| Tiles (not slabs) | Box, piece, sq ft, and sq m, converted from pieces per box and coverage per box | Whole boxes only. Area entry rounds up to the next box. |
| Slabs | Integer slabs. No box conversion. | Integer slabs |
| Sanitaryware | Integer pieces, or one set | Same |
| Faucets & CP | Integer pieces | Same |
| Adhesive | Integer packs | Integer packs |
| Other/General | The unit chosen on the item | The same unit, no fractional packs when the unit is a pack, box, or piece |

The area calculator is on the ERP quotation and on the tile product page: length × width, wastage percent, result in boxes (or slabs). Default wastage is 10%.

### 7.6 Stock

- One shared stock pool for the counter and the website.
- The default location is the showroom.
- When the godown module is on, a bill or a delivery can take stock from a chosen location. When it is off, every movement uses the showroom.
- On-hand quantity minus quantity reserved by confirmed, unfinished orders is the sellable quantity.
- A website checkout does **not** reserve stock.
- Staff confirmation reserves stock and creates the bill in one transaction. If sellable quantity is too low, confirmation stops and nothing is reserved.
- The reserve is released if, 7 days after confirmation, the order has neither a payment nor a delivered status. The check runs when the ERP is opened and before stock is sold.
- The counter cannot save a bill that would make on-hand negative.
- Display and sample quantity is stored apart from sellable stock. Selling a display piece is an explicit stock move.
- Breakage and damage record the quantity, reason, and who bears the cost (supplier, transporter, or the shop) and post a stock adjustment.
- Adhesive expiry is tracked on the receipt lot. Tile shade, batch, and caliber stay optional text on the variant.

### 7.7 Cost

On each purchase receipt the app allocates freight and unloading across lines. Weighted average cost updates from the landed unit cost. Margin reports use that average, not MRP.

The supplier rate-list import accepts Excel or CSV: brand, SKU or barcode, new purchase price, optional MRP, effective date. The user previews changes before applying. Previous prices stay in a price-history list.

### 7.8 Barcode

USB scanners act as keyboard input. The phone camera can scan as well. Scan works on the bill, on goods receipt, and on stock count. Labels print Code 128, EAN-13, or QR at the two sizes in section 5.6.

### 7.9 Import

Excel and CSV import, with a preview, for:

- Products, with a sheet per product line and the columns in section 7.3
- Opening stock by SKU and location
- Parties
- Supplier rate lists

Unknown columns are reported and skipped. A failed row does not roll back rows already accepted. The template files ship in `docs/` because no supplier sample was provided.

### 7.10 Series and sets

- A **series** groups variants of one design family (for example one tile collection) for the catalogue and for filters.
- A **set** is a sellable bundle, such as a bathroom set, with its own price and component products. Selling a set reduces each component.

---

## 8. Pricing, tax, and parties

### 8.1 How a price is chosen

1. If the party has a fixed rate for that variant, use it.
2. Else if their tier has a fixed rate, use it.
3. Else if their tier has a percent, apply it to the selling price.
4. Else use the selling price.
5. On a website order, apply the product's online discount after the steps above.
6. A cashier may add a further discount only up to the variant's discount limit. Above that, a Manager or Owner must approve.

Tiers: retail, contractor, plumber, architect, mason, dealer. Each tier can store both a percent and a fixed rate. The fixed rate wins when both are present.

Retail website prices match the showroom selling price, plus the optional online discount. Trade prices appear only after approval and only when that customer is signed in.

### 8.2 GST

- Regular GST.
- The same tax engine builds counter bills and website bills.
- Place of supply is the business state. Same state: CGST + SGST. Other state: IGST.
- Rates and HSN live on the variant.
- A customer may enter GSTIN at checkout. It is copied onto the tax invoice. Billing address and shipping address are stored separately.
- Version 4 exports e-way bill data. Version 5 can send e-invoice through a GSP. Neither is required to bill.

### 8.3 Parties and khata

A party is a customer, supplier, or referrer. The ledger shows bills, returns, payments, and opening balance. "You'll get" and "You'll give" use the receive and give colours.

Credit limit and credit days can be set per party. A website order can be charged to khata only for an approved trade party, and only when the new balance would not cross the credit limit.

Statements export to PDF and can be shared manually on WhatsApp.

---

## 9. Counter billing

### 9.1 Bill

A bill has a party (or Cash), lines, discounts within limits, GST, round-off, and one or more payments. Status is Draft, Paid, Partial, Due, or Void. Void is an Owner or Manager action and it reverses stock.

Sales return creates a credit note against a bill and puts stock back.

Quotations convert to bills. The quotation can contain several rooms. Each room has size, wastage, and lines for tiles, sanitaryware, faucets, and adhesive. Version 1 includes a single-room area quotation. The full multi-room bathroom quotation ships in Version 4.

### 9.2 Offline

The ERP PWA caches the shell, parties used recently, and items already opened or searched on that device.

- The cashier can create bills offline for cached items.
- Offline bills get a device id and sit in a visible queue.
- When the network returns, each bill syncs in a transaction.
- If stock is no longer available, that bill is marked **Conflict**. It is not posted. The cashier edits or cancels it.
- Checkout on the website requires a network connection.
- Offline mode does not print a tax invoice number until the sync transaction allocates one. The screen shows "Number pending sync" so two devices cannot display the same final number.

### 9.3 Speed

The bill screen opens on search and scan. One primary action: Save. Safe actions do not ask for a second confirmation. Target: a known item, a barcode, a party, and a payment in under one minute.

---

## 10. Purchases, expenses, payments

- Purchase bills and purchase returns update weighted average cost and stock.
- Expenses have a category, amount, mode, and optional attachment.
- Payments in and out support cash, UPI, bank, card, cheque, and adjustment against a bill.
- The cheque register (Version 4) stores cheque number, bank, date, and cleared or bounced status.
- A day summary shows sales, receipts, and expenses for the counter series and the website series separately and combined.

---

## 11. Storefront

### 11.1 Pages

Home, product line, category, series, brand, product detail, search, cart, checkout, account, orders, wishlist, contact, about, store locator, policies (shipping, returns, privacy, terms), blog, room inspiration, tile visualizer, quote request, book a showroom visit, measurement visit.

Placeholder copy in the seed data is enough to click through. It is not final marketing copy. Example home heading: "Tiles and sanitaryware for your home." Example subheading: "Visit the Indore showroom or order for delivery in the city."

### 11.2 Catalogue page behaviour

- Only published products are visible.
- Quantity zero shows **Out of stock** and disables add to cart. The page remains.
- Filters: product line, category, brand, series, size, finish, colour, application, price range, in stock only.
- Sort: relevance, price, newest.
- Search matches English and Hindi names, brand, series, and SKU.
- URLs are stable slugs from the English name. Each product has a meta title and description in both languages.
- `sitemap.xml` lists storefront URLs only. `/erp` is `noindex` and absent from the sitemap.

### 11.3 Product page

Gallery (up to 8 images), variant pickers, MRP, the signed-in customer's price, GST note, stock state, area calculator for tiles, box rounding explanation, specifications for that product line, series siblings, related set, YouTube link if present, approved reviews and questions.

The visualizer in all five versions is a room-photo gallery plus the area calculator. It does not overlay a tile on a photo and it is not 3D.

### 11.4 Account and orders

- An account is required before an order. There is no guest checkout.
- Registration collects name, email, password, phone, and customer type.
- Retail can order immediately.
- A trade type waits for ERP approval before trade prices or khata checkout appear.
- Wishlist and order history are per account.
- The customer can download the GST invoice after the order has a bill.

### 11.5 Cart and checkout

The cart shows the unit the website is allowed to sell (section 7.5), the resolved price, and delivery eligibility.

Checkout collects billing address, shipping address, optional GSTIN, delivery pincode, and payment method. The pincode must be in the serviceable list. Outside that list, the customer can still send a quote request.

### 11.6 Content the ERP manages

Homepage banners, categories, series, product text, prices, stock visibility, coupons, blog, room inspiration, policies, pincodes, delivery charges, enquiries, orders, and returns. Website Manager can change content, coupons, and enquiries. They cannot change prices or stock.

Blog posts and inspiration items have a title, body, cover image, and publish flag, in English and Hindi.

### 11.7 Reviews

A signed-in customer can submit a rating and a review, or a question, on a product they can open. It stays hidden until the Owner or Website Manager approves it.

---

## 12. Online orders, pay, and delivery

### 12.1 Status

| Status | Meaning |
|---|---|
| Placed | Customer submitted. Stock is unchanged. |
| Confirmed | Staff accepted. Stock is reserved. A bill exists in the `WEB` series. |
| Rejected | Staff declined. No stock change. |
| Out for delivery | Delivery Staff has the stop. |
| Delivered | Proof captured, or staff marked it delivered. |
| Expired | 7 days after confirmation with no payment and no delivery. Stock released. |
| Cancelled | Stock released if it had been reserved. |

Staff must confirm before a website order becomes a bill. Two placed orders can ask for the last box. The first confirmation wins. The second fails with an out-of-stock message.

### 12.2 Payment methods

All of these are in the product. Gateways and SMS stay off until configured.

| Method | When it is available |
|---|---|
| Cash on delivery | Storefront on, pincode serviceable |
| UPI on delivery | Same |
| Partial advance | A gateway is enabled. Default 30% online. Balance on delivery. |
| Razorpay, Cashfree, PhonePe | Owner enables one or more in Settings and pastes keys. No code edit. |
| Charge to khata | Approved trade party with enough credit limit |

The adapter verifies gateway webhooks with the provider secret. The browser does not mark an order paid by itself.

### 12.3 Delivery

Delivery is only in the store city and nearby areas, expressed as a pincode list maintained in the ERP.

Each pincode can have a charge. Weight slabs add to that charge. An unloading or floor charge is optional per order.

The shop's own vehicle is the default. If staff mark own vehicles busy, the order can move to a transporter and that transporter's charge.

Delivery Staff sees only assigned stops, updates status, and uploads a proof photo.

### 12.4 Coupons and loyalty

A coupon has a code, a percent or a flat amount, an optional brand, an optional product line, a minimum order, dates, and a usage limit.

Loyalty is on for the business when the Owner enables it: points per rupee, rupee value of a point, and a minimum bill to redeem. Points are earned on paid bills from the counter and the website.

### 12.5 Returns

The Owner edits the policy text and the numbers. Defaults:

- No return after the box or seal is opened.
- Damage or breakage reported within 3 days of delivery can be claimed.
- The Owner approves a refund or a replacement. A Manager may also approve, matching the role table. Website Manager records the request and does not approve it.

Approved return or replacement posts the stock and accounts effects through the same billing engine.

### 12.6 Enquiries

Quote request, showroom visit, and measurement visit each create a lead. Status values: New, Contacted, Visit booked, Quoted, Won, Lost.

Showroom and measurement visits use a slot calendar. The Owner defines days, times, and capacity. The customer picks an open slot. There is no separate third-party calendar product.

### 12.7 Notifications

- In-app notifications for staff.
- Email for order status, through the adapter, when SMTP is set.
- Manual WhatsApp share of the invoice or statement. The app does not call the WhatsApp Business API.
- SMS is optional. The Owner connects an included provider in Settings. Until then, nothing is sent by SMS.

---

## 13. Showroom operations beyond the counter

These stay in the product and ship in the version named in section 16.

| Feature | Behaviour |
|---|---|
| Projects and sites | A party can have sites. Quotation, stage delivery, advance, and a running balance per site. |
| Referrer commission | One plumber, mason, or architect on a bill. Percent or amount per unit. A payout marks commission paid. |
| Warranty register | Warranty months copied from the item at sale. Claims and supplier follow-up. |
| Breakage register | As in section 7.6. |
| Delivery challan | Vehicle, driver, transporter, loading and unloading, status, proof photo. |
| Godowns | Optional module, off by default. One extra location or more. A bill can draw from a godown only when the module is on. |
| Display and samples | Separate from sellable quantity. |

---

## 14. Reports

Standard reports, not a report builder:

- Today's sales, split by counter series and website series
- You'll get and you'll give
- Stock on hand and stock value at weighted average
- Low stock
- Sales and margin by product line, category, and brand
- Dead and slow stock
- GST summary (output tax, and input tax once purchases exist)
- Rate-change history
- Coupon and loyalty liability
- Enquiry pipeline
- Delivery status
- Warranty due and commission due
- Site balances
- Breakage loss

Version 5 adds comparison charts, trial balance, profit and loss, balance sheet, and bank reconciliation. Earlier versions include a cash book, bank book, day book, and a simple profit estimate from sales minus weighted-average cost minus expenses.

Reports export to Excel and PDF.

---

## 15. AI assistant

Optional. Off by default. Ships in Version 5.

- The Owner connects their own provider and model in Settings. The key is stored encrypted.
- The assistant can answer questions about this business's data, draft a quotation message, and propose an action.
- It cannot post a bill, change stock, or change a price unless the Owner approves that proposal on screen.
- Tools are a fixed list: read reports, draft text, propose a stock adjustment, propose a party reminder. No open-ended tool installation.

---

## 16. Five versions

Each version is production-ready. A dealer on an earlier version does not see later menus. Upgrade keeps data.

### Version 1 — Showroom

A shop can bill, track dues, and maintain the catalogue.

Includes: email/password staff auth, business profile, the five product lines, categories, items and variants, stock balances, counter billing, GST invoice, print and PDF and WhatsApp share, payments, basic khata, parties, single-room area quotation, dashboard, English and Hindi, PWA, offline billing and conflict queue, Simple Mode, roles Owner through View-only, user profile.

The public site shows the business card only.

### Version 2 — Purchasing and control

Includes everything in Version 1 plus: purchases and purchase returns, landed cost, weighted average, opening stock, adjustments, barcode scan and labels, Excel and CSV import, low-stock alerts, display and sample stock, breakage register, adhesive expiry, expenses, audit log, JSON and CSV export and restore, supplier rate-list import, price history, warranty register, cash book and day book.

### Version 3 — Storefront

Includes everything in Version 2 plus: the full shop, publish switch, search and filters, cart and checkout, customer accounts, trade-tier approval, online discount, coupons, loyalty, reviews, blog, inspiration, visualizer gallery, SEO and sitemap, enquiries and slot calendar, placed orders, staff confirmation, separate `WEB` series, COD, UPI on delivery, gateway adapters, partial advance, khata checkout for approved trade parties, email notifications.

### Version 4 — Delivery and projects

Includes everything in Version 3 plus: delivery challan, Delivery Staff, pincode and weight and unloading charges, own vehicle and transporter, proof of delivery, the 7-day release, returns workflow, godown module, multi-room project quotations, site ledgers, referrer commission, cheque register, e-way bill data export, optional SMS.

### Version 5 — Accounts and assistant

Includes everything in Version 4 plus: double-entry accounting, trial balance, profit and loss, balance sheet, reconciliation, advanced charts, e-invoice through a GSP, and the AI assistant.

### 16.1 Upgrade rule

`npm run upgrade` exports data, applies only the new version's migrations, and leaves new modules off until the Owner enables them. Invoice numbers already issued do not change.

---

## 17. Settings

| Screen | Who | Purpose |
|---|---|---|
| Business profile | Owner | Legal name, trade name, address, GSTIN, logo, FY start |
| Invoice | Owner | Prefixes `CNT` and `WEB`, terms, tax inclusive or exclusive (default exclusive) |
| Modules | Owner | On and off, with dependencies shown first |
| Users | Owner | Staff invite, role, deactivate |
| Delivery | Owner, Manager | Pincodes, slabs, unloading, vehicle busy |
| Returns | Owner | Policy text and the 3-day default |
| Payments | Owner | Enable COD, UPI on delivery, gateways, advance percent |
| Loyalty | Owner | Points rules |
| Integrations | Owner | Email, SMS, gateways, AI. Masked secrets. |
| Language and theme | Any staff | English or Hindi, light or dark |
| Export and restore | Owner | JSON full data. CSV for the import templates. |
| Activity | Owner | Audit list |
| Profile | Any signed-in user | Own name, phone, photo, password |

Restore is Owner-only and asks for the business name to be typed before it runs.

---

## 18. Screen inventory

Version is the first version where the screen is usable with real data.

| ID | Screen | Version |
|---|---|---|
| A1 | Staff login `/erp/login` | 1 |
| A2 | Password reset | 1 |
| A3 | Onboarding checklist | 1 |
| UP1 | Profile | 1 |
| H1 | ERP home | 1 |
| B1–B3 | Bills list, bill, bill detail | 1 |
| B4 | Quotation, single room | 1 |
| B4b | Multi-room project quotation | 4 |
| B5 | Sales return | 4 |
| B6 | Print and share | 1 |
| P1–P5 | Parties, khata, payment, statement | 1 |
| I1–I6 | Items, item form by product line, adjustment, labels, categories | 2 for labels and adjustment; 1 for item form and list |
| I7 | Location transfer | 4 |
| U1–U3 | Purchases and purchase return | 2 |
| E1 | Expenses | 2 |
| R1–R2 | Reports | 1 basic, 2 stock, 5 accounting |
| S1–S6 | Settings listed in section 17 | 1 |
| S7 | Export and restore | 2 |
| W0 | Public business card | 1 |
| W1 | Storefront home | 3 |
| W2 | Line, category, series, brand | 3 |
| W3 | Product | 3 |
| W4 | Search | 3 |
| W5 | Cart and checkout | 3 |
| W6 | Account, orders, wishlist | 3 |
| W7 | Blog, inspiration, visualizer, policies, contact, locator | 3 |
| W8 | Quote and visit booking | 3 |
| O1 | Website orders queue | 3 |
| O2 | Trade-account approval | 3 |
| D1 | Deliveries and proof | 4 |
| HW2 | Site ledger | 4 |
| HW3 | Warranty | 2 |
| HW5 | Breakage | 2 |
| HW6 | Commission | 4 |
| N1 | Notifications | 3 |
| AI1 | AI chat and approvals | 5 |

---

## 19. Wireframes

Text wireframes show structure only. Spacing and colour follow section 5.

### 19.1 ERP home

```text
+--------------------------------------+
| Decor Studio            [search][bell]|
+--------------------------------------+
| Today's sales          Cash received |
| Rs 24,580              Rs 18,200     |
+--------------------------------------+
| You'll get             You'll give   |
| Rs 1,42,300            Rs 56,800     |
+--------------------------------------+
| Low stock (4)     Orders to confirm  |
| Website orders wait here from V3     |
+--------------------------------------+
| Home | Bills |  (+)  | Parties | More|
+--------------------------------------+
```

### 19.2 New bill

```text
+--------------------------------------+
| < New bill            [scan][party]  |
| [ search name, SKU, or barcode     ] |
+--------------------------------------+
| Kajaria 600x600  Ivory               |
| 2 box × Rs 48.00/sq ft      Rs 3,072 |
| Discount within limit                |
+--------------------------------------+
| Subtotal                    Rs 3,072 |
| CGST + SGST                   Rs 554 |
| Total                       Rs 3,626 |
| [ Cash ] [ UPI ] [ Credit ]          |
| [ Save bill ]                        |
+--------------------------------------+
```

### 19.3 Add a tile

```text
+--------------------------------------+
| < New item           Line: Tiles     |
| Design name                          |
| Category    Brand    Series          |
| Size mm     Size in    Thickness     |
| Finish      Body       Application   |
| Pcs/box     Sq ft/box  Sq m/box      |
| --- Variant ------------------------- |
| Shade (optional)   Barcode           |
| MRP    Selling price                 |
| Purchase price     Discount limit    |
| HSN    GST %      Reorder level      |
| Images 0/8     [ Publish to website ]|
| [ Save ]                             |
+--------------------------------------+
```

Other lines show their own fields from section 7.3 in the same layout. Purchase price is hidden for roles who cannot see it.

### 19.4 Storefront home

```text
+--------------------------------------+
| Decor Studio          Account   Cart |
| Tiles  Sanitary  Faucets  Adhesive   |
+--------------------------------------+
| [ large room photograph            ] |
| Tiles and sanitaryware for your home |
| [ Visit showroom ]  [ Browse tiles ] |
+--------------------------------------+
| Shop by line                         |
| [Tiles] [Sanitary] [Faucets] [More]  |
+--------------------------------------+
| Inspiration          Blog            |
+--------------------------------------+
```

### 19.5 Product and checkout

```text
+--------------------------------------+
| [ image 1 of 8 ]                     |
| 600 × 600 mm   Matt   Floor          |
| Rs 48.00 / sq ft     plus GST        |
| In stock · sold in full boxes        |
| Room length [ ]  width [ ]  waste 10%|
| You need 12 boxes                    |
| [ Add boxes to cart ]                |
+--------------------------------------+

+--------------------------------------+
| Checkout                             |
| Billing address                      |
| Shipping address                     |
| GSTIN (optional)                     |
| Pincode    Delivery Rs 450           |
| ( ) COD  ( ) UPI on delivery         |
| ( ) Pay 30% now                      |
| [ Place order ]                      |
+--------------------------------------+
```

---

## 20. Quality

### 20.1 Security

- Email and password only. Firebase sends the reset email.
- Staff and customers are separate Auth users, separate collections, and separate claims.
- Rules are tested for: customer cannot read purchase price, customer cannot open ERP data, Website Manager cannot write stock, Delivery Staff cannot read other stops, stock cannot go negative, invoice counter cannot be edited except inside a bill transaction.
- Secrets stay on the adapter.
- Exports omit integration ciphertext unless the Owner chooses a full disaster-recovery file, which remains encrypted.

### 20.2 Audit

Record who created, edited, voided, confirmed, approved, exported, or restored: bills, stock adjustments, prices, users, integrations, and website publish changes.

### 20.3 Performance targets

| Action | Target on a normal broadband connection |
|---|---|
| Open a cached bill screen | Under 2 seconds |
| Save a bill | Under 2 seconds |
| Find an item by barcode | Under 1 second |
| Storefront product page | Under 3 seconds |

Targets are for about 10,000 variants. Beyond that, OmniBiz reviews Spark quotas before adding dealers' data.

### 20.4 Devices

Current Chrome, Edge, Firefox, and Safari. Android Chrome and iOS Safari for the PWA. Thermal printing uses the system print dialog. No native wrapper.

### 20.5 Errors

Messages say what failed and what to do next. Conflict, out of stock, pincode not served, discount over limit, and permission denied each have their own message. The offline banner stays until the queue is empty.

---

## 21. Acceptance

A version is done when a tester can complete its flows on a fresh Firebase project and on an upgraded copy of the previous version's data.

**Version 1.** Owner setup. Cashier bills a tile by barcode and by search, in Hindi and in English. Offline bill syncs, and a stock conflict is visible. Khata balance matches the bill minus the receipt. PDF prints on A4 and on 80 mm. A customer opening `/erp` sees the shop 404. `/erp/login` has no link on the shop.

**Version 2.** Purchase receipt changes on-hand and weighted average, including freight. Import preview rejects a bad row and imports the good rows. Label prints a Code 128, an EAN-13, and a QR. Export file restores into an empty project. Cashier cannot see final purchasing price.

**Version 3.** Published tile is browsable, area calculator rounds up to boxes, and an out-of-stock variant cannot be added. Retail account orders with COD. Trade account does not see dealer price until approval. Staff confirmation creates a `WEB` bill and reduces sellable stock. A second confirmation for the same last box fails. Gateway webhook marks the advance paid. Website Manager edits a banner and cannot edit the selling price.

**Version 4.** Pincode outside the list cannot check out. Own-vehicle-busy offers transporter. Delivery Staff uploads proof and cannot open the stock screen. Unpaid confirmed order releases stock on the next ERP open after 7 days. Return after the seal is opened is rejected under the default policy. A damage claim inside 3 days waits for Owner approval. Godown module off: bill has no location picker. Godown module on: bill can draw from the godown.

**Version 5.** Trial balance matches the bill and payment fixtures. AI proposal does not change stock until the Owner approves it. E-invoice adapter is off until configured and does not block billing.

---

## 22. Glossary

| English | Hindi label in the UI |
|---|---|
| Bill | बिल |
| Quotation | कोटेशन |
| Party | पार्टी |
| You'll get | आपको मिलेंगे |
| You'll give | आपको देने हैं |
| Item | आइटम |
| Stock | स्टॉक |
| Purchase | खरीद |
| Payment | भुगतान |
| Expense | खर्च |
| Out of stock | स्टॉक खत्म |
| Product line | प्रोडक्ट लाइन |
| Tiles & Slabs | टाइल्स और स्लैब |
| Sanitaryware | सैनिटरीवेयर |
| Faucets & CP | नल और सीपी फिटिंग |
| Tiles Adhesive | टाइल एडहेसिव |
| Other / General | अन्य |
| Website order | वेबसाइट ऑर्डर |
| Delivery | डिलीवरी |

---

## 23. Risks

| Risk | What we do |
|---|---|
| Spark daily quotas | Usage warning on the Owner home. Install guide tells OmniBiz when to move a dealer to Blaze. |
| No cron for the 7-day release | Release runs on ERP open and before every stock sale. A shop that never opens the ERP can stay reserved past 7 days until the next open. |
| Two web orders for one last box | Documented. Confirmation is first-come and fails cleanly. |
| ImageKit or Firebase free-tier changes | Figures marked verify are rechecked each release. |
| Secrets in the browser | Adapter-only. Rules tests cover purchase-price reads. |
| Offline invoice numbers | Final number is allocated only at sync. |
| Payment provider differences | Included adapters are Razorpay, Cashfree, and PhonePe. Another provider needs a developer adapter. |

---

## 24. Document control

| Version | Date | Note |
|---|---|---|
| 2.0 | 21 November 2026 | First DecorBiz PRD. Replaces BizOne v6.0 for this product. Private product of OmniBiz Technologies. Firestore, ImageKit, ERP at `/erp`, storefront at `/`, five production versions. |
