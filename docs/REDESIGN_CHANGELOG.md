# T-Cloud Eats — Redesign & Architecture Changelog

**Started:** 2026-11-26  
**Objective:** Modernize UI/UX (`#0A0B0F` / `#111318` / `#1F2430` / `#F26F21` minimal ERP & POS design system), decompose the 6,696-line `app/cashier/page.tsx` monolith, unify duplicate food costing & Google sync logic, add Hold/Park Order, `Ctrl+K` quick search, thermal 80mm/58mm print CSS, and full owner CRUD—while preserving 100% of existing features, `tce_` table isolation, offline safety, 1:00 AM shift rollover, `INV-YYMMDD-XXX` void reuse, `getBillHash`, 7-day receipt cleanup, and 3rd-party `subtotal`/`total` accounting conventions.

---

## Stage Tracker
- [x] **Stage 0:** Forensic Read-Only Audit Completed
- [x] **Stage 1:** Unified currency utility, consolidated Google Business Profile sync, `@media print` thermal CSS
- [x] **Stage 2:** Modularize `app/cashier/page.tsx` (`lib/cashier/types.ts`, `PosTerminalView.tsx`, `OrderLogsView.tsx`, `MenuManagerView.tsx`, `ShiftTallyView.tsx`, `CustomerCmsModal.tsx`, `ReceiptPrintModal.tsx`, `QuickSearchModal.tsx`) + Hold/Park & Recall Order, `Ctrl+K` Quick Search, 80mm/58mm Receipt & Kitchen KOT Modal
- [x] **Stage 3:** Unify `FoodCostingModule` + `InventoryRecipesView` into single DB-backed `UnifiedStockView.tsx` (`Live Stock & GRN`, `Recipes & BOM Costing`, `Wastage & Stock-Take`, `Market Order List`)
- [x] **Stage 4:** Unified `#0A0B0F` / `#111318` / `#1F2430` minimal ERP & POS design system across `/login`, `/cashier`, `/accounting`, `FoodCostingModule`, and `/bills/[id]`
- [x] **Stage 5:** Full `npm run build` & TypeScript verification + Preservation Checklist Sign-off
- [x] **Stage 6 (Single-Owner Unification):**
  - Removed workspace toggle from `/login` (direct login to unified `/cashier` workspace) and converted `/accounting` into a seamless redirect to `/cashier?tab=finance_reports`.
  - Enabled Single-Owner Frictionless Mode (`isAdminUnlocked = true`, `Owner Mode` badge, removed 4-digit PIN walls while keeping destructive confirmations).
  - Merged POS & SLFRS Finance into one 9-section unified sidebar (`POS`, `Orders`, `Tally`, `Menu`, `Stock`, `Finance`, `Ledger`, `Assets`, `Settings`) with `UnifiedStockView` and `UnifiedFinanceSection`.
- [x] **Stage 7 (Auto POS-to-Ledger Sync & Full Owner CRUD):**
  - Added automatic background `pos-sync` on `/cashier` mount, order placement (`handleConfirmPlaceOrder`), order status/void updates (`updateOrderStatus`), and Finance tab load (`UnifiedFinanceSection`), including automatic statutory reversal of voided/cancelled/ignored `POS_SALE` entries.
  - Replaced the manual "Sync POS to Ledger" CTA with a passive `Synced with POS` status pill + optional re-check icon.
  - Added full `Edit` / `Save` / `Cancel` / `Delete` controls (with `PUT`/`DELETE` APIs) for Ingredients (`UnifiedStockView` + Edit Ingredient drawer), Recipes, Fixed Assets (`FixedAssetsView`), Staff Payroll (`PayrollSettlementsView`), and Daily Shift Expenses (`ShiftTallyView`).
- [x] **Stage 8 (Kitchen Setup, Classification & Idempotent Seed):**
  - Enforced 4-bucket separation (`Fixed Assets 1500`, `Kitchen Smallwares 6400`, `Cleaning & Hygiene 6500`, `Monthly OpEx & Payroll 6000`): non-food smallwares & cleaning items are filtered out of `Recipes & Costing` ingredient pickers and auto-routed to `6400`/`6500` on Purchase GRN.
  - Created and executed `scripts/seed_kitchen_setup.js` + `POST /api/accounting/seed-template` ("Load Kitchen Setup Template" button in Settings) seeding 19 Fixed Assets, Promotional Boards (`6600`), 22 Kitchen Smallwares (`unit_cost = 0`), 4 Cleaning items (`unit_cost = 0`), and active employee `Thushan Indika` (`120,000.00 LKR` basic salary, EPF/ETF/APIT enabled).
  - Added editable `Cost (LKR)` to `FixedAssetsView` Edit drawer and recurring monthly overhead quick-presets (`Salary`, `Light Bill`, `Water Bill`, `LP Gas Refill`, `Internet & Tel`, `Kitchen Rent`) to `LedgerView` and `ShiftTallyView`.
- [x] **Stage 9 (UI Simplification, Everyday & Dish Sales Counter, Merge Dishes):**
  - Decluttered `PosTerminalView` menu tiles to **Dish Name + Price only** with a clean cart-quantity badge, and reduced border noise across `SalesAnalyticsView`, `ShiftTallyView`, and `UnifiedFinanceSection`.
  - Built `GET /api/accounting/sales-analytics` + `SalesAnalyticsView` (Sunday–Saturday breakdown with 1:00 AM business-day cutoff, daily date rows, Dish-by-Dish Sales Counter with weekday distribution, search/category filter, and CSV export), accessible in both **Finance** and **Tally**.
  - Built `POST /api/menu/merge` + `MergeDishesModal` (accessible in **Menu** and **Dish Sales Counter**) to merge 2+ dish variants into a unified name/price, preserve `tce_recipes` links, and optionally unify historical `tce_orders.items` titles without altering order totals or ledger journals.
- [x] **Stage 10 (Keyboard-First POS Navigation & Cashier Hotkeys):**
  - Added 2D arrow-key product grid navigation (`PosTerminalView.tsx`, dynamic CSS column calculation, `ring-2 ring-emerald-400/80`, auto-scroll, `Enter` add + pulse, `+/-` qty, `[/]` category cycling).
  - Added `Tab` zone switching (`GRID` <-> `CART`), Cart item navigation (`ArrowUp`/`ArrowDown`, `+/-`, `Backspace`/`Delete`), and `F4` / `Alt+O` Order Logs navigation (`OrderLogsView.tsx` row focus, `Enter` receipt, `Backspace`/`Esc` back to POS).
  - Added cashier hotkeys (`/` or `Ctrl+K` quick search with `Enter` top-match select, `F2` / `Ctrl+Enter` checkout, `F8` / `F9` park & recall, `Ctrl+P` print in `ReceiptPrintModal`, arrow/Enter/Esc/Backspace modal navigation, and `? Keys` legend pill) guarded by `isEditable` input safety checks.

## Preservation Checklist Sign-Off
- `tce_` Table Isolation: Verified — all DB queries target `tce_*` tables only.
- 1:00 AM Rollover & `INV-YYMMDD-XXX` Void Reuse: Preserved in `app/cashier/page.tsx` and `lib/cashier/types.ts`.
- 3-Char E-Bill Hash (`getBillHash`): Preserved in `app/bills/[id]/page.tsx`, `app/cashier/page.tsx`, and `components/cashier/ReceiptPrintModal.tsx`.
- Offline-First 5s Timeout & `syncedToDb` Guard: Preserved in `app/cashier/page.tsx` and `ReceiptPrintModal.tsx`.
- 7-Day Receipt Cleanup & 3rd-Party `subtotal`/`total` Convention: Preserved.

---

## Detailed Change Log

### Stage 1 (In Progress)
- Created `docs/REDESIGN_CHANGELOG.md`.
