# inventory-eastsong

Inventory and sales tracker app.

## Repository setup

This repository is currently stored as a ZIP archive and should be unpacked before deployment.

Recommended folder layout:

```text
inventory-eastsong/
  README.md
  .gitignore
  .env.example
  package.json
  inventory.html
  sale.html
  reports.html
  css/
    style.css
  js/
    main.js
    inventory.js
    sale.js
    reports.js
  server/
    server.js
    prisma/
      schema.prisma
      seed.ts
```

## GitHub rules

- Do not commit `.env` files.
- Never commit secrets, database credentials, or service tokens.
- Use `.env.example` as the template for required environment variables.
- Keep frontend and backend code separated.
- Keep deployment-specific config out of source control when possible.
- Add clear instructions in the README.

## Environment template

Create a local `.env` from `.env.example` before running the app.

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
PORT=3000
NODE_ENV=development
```

## Neon setup

1. Create a PostgreSQL database in Neon.
2. Copy the connection string.
3. Set the value in Vercel as `DATABASE_URL`.
4. If Prisma is used, run:

```bash
npx prisma generate
npx prisma db push
```

Or, if using migrations:

```bash
npx prisma migrate deploy
```

## Vercel setup

1. Import the GitHub repository into Vercel.
2. Add the environment variables:
   - `DATABASE_URL`
   - `PORT`
   - `NODE_ENV`
3. Deploy the app.

## Notes

The project archive (`eatsong-tracker.zip`) appears to contain a Node/Prisma app with static HTML files. Before deployment, the archive should be extracted locally and the source files should be committed to the repository rather than left in a ZIP archive.

This repository is now prepared with the standard GitHub hygiene files for safe deployment to Neon and Vercel.
