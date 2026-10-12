# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Two surfaces: the **admin console**, a Laravel + Inertia React web app in the browser (`backend/`), and the **cashier till**, a Wails v3 desktop app on macOS and Windows (`desktopapp/`). Both are desktop-sized; no mobile use.

## Users

- **Owner/admin**: runs the shop. Opens the admin dashboard several times a day, often in the gaps between serving customers, to see how trade is going and what needs action: credit to chase and stock to reorder. The dashboard is the default page after an admin signs in to the web console.
- **Cashier**: works the POS screen all day at the counter: rings up sales, picks customers, takes cash, card, bank transfer or credit, and prints thermal receipts.
- **Other staff roles**: admins can create custom roles (e.g. Storekeeper) as sets of permissions: which admin pages a role opens, whether it can use the cashier screen, and actions such as discounts, credit sales, cancelling bills, recording payments, changing stock or prices, and deleting records. Admin always has every permission. Permissions are enforced on the server (Laravel domain actions), not only hidden in the UI.

## Product Purpose

A point-of-sale and back-office app for Kulatissa Hardware, a single hardware store in Tissamaharama, Sri Lanka. It replaces paper bill books and memory: every sale, customer credit balance, and stock level is in one place. Success on the admin side means the owner can tell within seconds how today is going and what needs attention.

## Operating Context

- A shop counter in a busy hardware store. Glances are short and get interrupted.
- Currency is Sri Lankan rupees, shown as `Rs. 12,345` with no decimals.
- Customers can buy on credit. Outstanding credit is a real cash-flow concern that the owner follows up personally.
- Products belong to category **groups** (each with an assigned colour in the frontends' `features/products/constants.ts`) and have stock counts. Low-stock and very-low levels are configurable in Settings (defaults: low at 20 or fewer, very low at 5 or fewer).
- Orders have statuses PENDING / ISSUED / COMPLETED / CANCELLED. Cancelled orders are excluded from every sales figure.
- Receipts print on thermal printers (ESC/POS).

## Capabilities and Constraints

- All data and business rules live in the Laravel backend (PostgreSQL). The admin console is part of it; the till is a thin client that calls its POS API, keeps a synced in-memory copy of the catalogue, and prints receipts locally (ESC/POS).
- The admin console covers Dashboard, Reports, Customers, Orders, Inventory, Catalog, Users and Settings (including registering tills). The till is the cashier screen only.
- Sales figures are computed from the bills themselves (units sold this week/month, last 30 days), so labels mean what they say.

## Brand Commitments

- Name: "Kulatissa Hardware". The app icon is the brand mark (KH monogram with the Sinhala name කුලතිස්ස; source `build/appicon.swift`, described in DESIGN.md's Overview).
- The admin console may take a new visual direction. The POS/cashier screens keep their current look unless a later decision changes that.

## Evidence on Hand

- Demo data only (`backend/database/seeders/DemoSeeder.php`: the original catalogue plus generated sales). No real sales figures, testimonials or imagery. The store phone and registration number are placeholders until entered in Settings.

## Product Principles

1. **Answer "how's today?" first.** The first glance shows today's trade against a meaningful reference.
2. **Surface what needs action.** Credit to collect and stock to reorder are named items, not just counts.
3. **Honest numbers.** Figures follow the documented business rules. Labels never claim a time window the data doesn't have.
4. **Built for interrupted glances.** Large, scannable figures, stable layout, no hunting.
