# Eatsong Brew: Sales & Inventory Tracker

Mobile-first tracker built with vanilla HTML/CSS/JS, Express, and Prisma on Neon PostgreSQL.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and paste your Neon connection string into `DATABASE_URL`.
3. `npm run db:push` (creates the tables)
4. `npm run db:seed` (loads 14 drinks at 50 stock and Siomai/Siopao at 100 stock; re-running wipes all data)
5. `npm start` and open http://localhost:3000

## Pages
- `/` Dashboard · `/sale.html` New Sale · `/inventory.html` Stock · `/reports.html` Reports + Excel export

## API
- `GET /api/products`
- `POST /api/sales` `{ items: [{productId, quantity}], payment }` (one transaction: validates stock, creates sale, deducts stock, logs)
- `POST /api/stock` `{ productId, type: "stock_in" | "adjustment", quantity, notes }`
- `GET /api/reports?from=ISO&to=ISO`
- Also: `GET /api/dashboard`, `GET /api/inventory-log`

## Deploying
Any Node host works (Render, Railway, Fly). Set `DATABASE_URL`, build command `npm install`, start command `npm start`.
Note: there is no login. Add authentication before exposing this publicly.
