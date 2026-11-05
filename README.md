# Eatsong Brew: Sales & Inventory Tracker

Mobile-first sales and inventory tracker built with vanilla HTML/CSS/JS, Express, Prisma, and Neon PostgreSQL. It can run locally or deploy to Vercel.

## Local setup
1. Install Node.js 18 or newer, then run `npm install`.
2. Copy `.env.example` to `.env`. In Neon, copy the **pooled** connection string (hostname includes `-pooler`) into `DATABASE_URL`, and the **direct** connection string into `DIRECT_URL`.
3. Run `npm run db:push` to create the tables.
4. Run `npm run db:seed` to load 14 drinks at 50 stock and Siomai/Siopao at 100 stock. **Re-running the seed deletes all existing sales, inventory logs, and products.**
5. Run `npm start` and open http://localhost:3000.

## Deploy to Vercel + Neon
1. Create a Neon project and database. Copy its pooled connection string for runtime and its direct connection string for schema changes. Keep both private.
2. In Vercel, import this GitHub repository. Leave the Root Directory as `./` and use the default Node.js build settings.
3. In **Project → Settings → Environment Variables**, set `DATABASE_URL` to Neon’s pooled connection string and `DIRECT_URL` to Neon’s direct connection string for Production (and Preview if desired). Both should include `sslmode=require`.
4. Before first deployment, create the database tables and seed the products once. From a trusted local terminal, set the two Neon variables in `.env`, then run `npm run db:push` and `npm run db:seed`. Do not run the seed script on every deploy; it wipes existing data.
5. Deploy or redeploy the Vercel project. Vercel serves the static HTML/CSS/JS and routes `/api/*` to the Express function in `api/[...path].js`.

The repository is configured for Vercel, but it cannot be connected to your Vercel or Neon accounts from GitHub. Add the database variables in the Vercel dashboard and import/deploy the repository there. Never commit `.env` or paste database credentials into source code.

## Pages
- `/` Dashboard · `/sale.html` New Sale · `/inventory.html` Stock · `/reports.html` Reports + Excel export

## API
- `GET /api/products`
- `POST /api/sales` `{ items: [{productId, quantity}], payment }` (one transaction: validates stock, creates sale, deducts stock, logs)
- `POST /api/stock` `{ productId, type: "stock_in" | "adjustment", quantity, notes }`
- `GET /api/reports?from=ISO&to=ISO`
- Also: `GET /api/dashboard`, `GET /api/inventory-log`

## Important security note
There is no login or authorization. Do not expose this app publicly with real inventory or sales data until authentication and access controls have been added. The API currently allows cross-origin requests locally; configure access controls before public use.
