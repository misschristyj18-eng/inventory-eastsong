# Eatsong Brew Tracker: all files

Create each file below at the exact path shown (headings), paste in its code, then follow README.md.

## `package.json`

```json
{
  "name": "eatsong-tracker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server/server.js",
    "dev": "node --watch server/server.js",
    "postinstall": "prisma generate --schema server/prisma/schema.prisma",
    "db:push": "prisma db push --schema server/prisma/schema.prisma",
    "db:seed": "tsx server/prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

## `.env.example`

```bash
# Neon PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
PORT=3000
```

## `.gitignore`

```bash
node_modules
.env
```

## `README.md`

~~~~markdown
# Eatsong Brew: Sales & Inventory Tracker

Mobile-first tracker built with vanilla HTML/CSS/JS, Express, and Prisma on Neon PostgreSQL.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and paste your Neon connection string into `DATABASE_URL`.
3. `npm run db:push`  (creates the tables)
4. `npm run db:seed`  (loads 14 drinks at 50 stock and Siomai/Siopao at 100 stock; **re-running wipes all data**)
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
~~~~

## `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Dashboard · Eatsong Brew</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main>
    <h1>Today at the café</h1>
    <div id="lowBanner" class="banner hidden" role="alert"></div>
    <div class="grid">
      <div class="card wide"><div class="label">Today's Sales</div><div class="value" id="sales">—</div></div>
      <div class="card"><div class="label">Transactions Today</div><div class="value" id="tx">—</div></div>
      <div class="card"><div class="label">Items Sold</div><div class="value" id="items">—</div></div>
      <div class="card wide"><div class="label">Siomai Left Today</div><div class="value" id="siomai">—</div></div>
    </div>
    <p id="err" class="msg error"></p>
  </main>
  <a href="sale.html" class="btn brown fab">＋ New Sale</a>
  <script src="js/main.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
```

## `sale.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>New Sale · Eatsong Brew</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main>
    <h1>New sale</h1>
    <div class="no-print">
      <label for="product">Product</label>
      <select id="product"></select>
      <label for="qty">Quantity</label>
      <div class="row">
        <input id="qty" type="number" inputmode="numeric" min="1" value="1">
        <button class="btn ghost" id="addBtn" type="button">Add to order</button>
      </div>
      <div class="totals" id="cartBox">
        <div id="cart"><p class="empty">No items yet. Pick a product and add it.</p></div>
        <div class="big"><span>Total</span><span id="total">₱0.00</span></div>
      </div>
      <label for="payment">Payment received (₱)</label>
      <input id="payment" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00">
      <div class="totals"><div><span>Change</span><strong id="change">₱0.00</strong></div></div>
      <p id="msg" class="msg error" role="alert"></p>
      <button class="btn brown block" id="saveBtn" type="button" style="margin-top:12px">Save sale</button>
    </div>

    <div class="modal hidden" id="receiptModal" role="dialog" aria-modal="true" aria-label="Receipt">
      <div class="modal-box">
        <div class="receipt" id="receipt"></div>
        <div class="row no-print" style="margin-top:16px">
          <button class="btn ghost" id="newBtn" type="button">New sale</button>
          <button class="btn brown" id="printBtn" type="button">Print receipt</button>
        </div>
      </div>
    </div>
  </main>
  <script src="js/main.js"></script>
  <script src="js/sale.js"></script>
</body>
</html>
```

## `inventory.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Stock · Eatsong Brew</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main>
    <h1>Stock management</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Size</th><th class="num">Price</th><th class="num">Stock</th><th class="no-print"></th></tr></thead>
        <tbody id="products"><tr><td colspan="5" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>
    <h2>Last 50 stock changes</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>When</th><th>Item</th><th>Type</th><th class="num">Qty</th><th>Notes</th></tr></thead>
        <tbody id="logs"></tbody>
      </table>
    </div>

    <div class="modal hidden" id="stockModal" role="dialog" aria-modal="true" aria-labelledby="stockTitle">
      <div class="modal-box">
        <h2 id="stockTitle" style="margin-top:0"></h2>
        <p id="stockHelp" style="font-size:.9rem"></p>
        <label for="stockQty">Quantity</label>
        <input id="stockQty" type="number" inputmode="numeric" step="1">
        <label for="stockNotes">Notes (optional)</label>
        <input id="stockNotes" type="text" maxlength="120">
        <p id="stockMsg" class="msg error" role="alert"></p>
        <div class="row" style="margin-top:12px">
          <button class="btn ghost" id="stockCancel" type="button">Cancel</button>
          <button class="btn brown" id="stockSave" type="button">Save</button>
        </div>
      </div>
    </div>
  </main>
  <script src="js/main.js"></script>
  <script src="js/inventory.js"></script>
</body>
</html>
```

## `reports.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Reports · Eatsong Brew</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
</head>
<body>
  <main>
    <h1>Sales reports</h1>
    <div class="no-print">
      <div class="row">
        <div><label for="from">From</label><input id="from" type="date"></div>
        <div><label for="to">To</label><input id="to" type="date"></div>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn" id="runBtn" type="button">Show sales</button>
        <button class="btn brown" id="exportBtn" type="button">Export to Excel</button>
        <button class="btn ghost" id="printBtn" type="button">Print</button>
      </div>
      <p id="msg" class="msg error" role="alert"></p>
    </div>
    <p class="print-only" id="printTitle" style="font-weight:800;margin:8px 0"></p>
    <div class="card" style="margin:14px 0"><div class="label">Total for period</div><div class="value" id="sum">₱0.00</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Items</th><th class="num">Total</th><th class="num">Paid</th><th class="num">Change</th></tr></thead>
        <tbody id="rows"><tr><td colspan="5" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>
  </main>
  <script src="js/main.js"></script>
  <script src="js/reports.js"></script>
</body>
</html>
```

## `css/style.css`

```css
:root{
  --bg:#E5F3F0; --cream:#FDF6ED; --text:#5D4037; --teal:#74C7C4; --brown:#B76E42;
  --teal-dark:#4aa6a3; --line:#d3e6e1; --danger:#c0392b; --warn:#fff3cd;
  --radius:16px;
  --ui:'Nunito','Poppins',system-ui,sans-serif; --serif:'Playfair Display',Georgia,serif;
}
*{box-sizing:border-box;margin:0}
html{-webkit-text-size-adjust:100%}
body{font-family:var(--ui);background:var(--bg);color:var(--text);font-size:16px;line-height:1.45;
  padding-bottom:calc(84px + env(safe-area-inset-bottom));min-height:100vh}
.app-header{background:var(--cream);text-align:center;padding:14px 16px 12px;border-bottom:3px solid var(--teal);position:sticky;top:0;z-index:20}
.brand{font-family:var(--serif);font-weight:700;font-size:1.55rem;letter-spacing:.14em}
.tagline{font-family:var(--serif);font-style:italic;font-size:.9rem;color:var(--brown)}
main{max-width:720px;margin:0 auto;padding:16px}
h1{font-family:var(--serif);font-size:1.4rem;margin:4px 0 14px}
h2{font-size:1.05rem;margin:18px 0 8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:#fff;border-radius:var(--radius);padding:14px 16px;border:1px solid var(--line)}
.card .label{font-size:.82rem;color:var(--brown);font-weight:700}
.card .value{font-family:var(--serif);font-size:1.7rem;font-weight:700;margin-top:2px}
.card.wide{grid-column:1/-1}
.banner{background:var(--warn);border-left:6px solid var(--brown);border-radius:12px;padding:12px 14px;margin:14px 0;font-size:.95rem}
.banner.hidden,.hidden{display:none!important}
.banner ul{padding-left:18px;margin-top:4px}
label{display:block;font-weight:700;font-size:.9rem;margin:12px 0 4px}
input,select,textarea{width:100%;font:inherit;color:var(--text);background:#fff;border:2px solid var(--line);border-radius:12px;padding:12px;min-height:48px}
input:focus,select:focus,textarea:focus,button:focus-visible,a:focus-visible{outline:3px solid var(--teal);outline-offset:1px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:48px;padding:0 20px;border:0;border-radius:999px;
  font:inherit;font-weight:800;background:var(--teal);color:#2f2a28;cursor:pointer;text-decoration:none}
.btn:active{transform:scale(.98)}
.btn.brown{background:var(--brown);color:#fff}
.btn.ghost{background:#fff;border:2px solid var(--teal)}
.btn.small{min-height:40px;padding:0 14px;font-size:.88rem}
.btn.block{width:100%}
.btn:disabled{opacity:.5}
.fab{position:fixed;right:16px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:30;min-height:60px;padding:0 26px;font-size:1.1rem;box-shadow:0 6px 16px rgba(93,64,55,.3)}
.bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;background:var(--cream);border-top:2px solid var(--teal);padding-bottom:env(safe-area-inset-bottom)}
.bottom-nav a{flex:1;text-align:center;padding:9px 0 8px;color:var(--text);text-decoration:none;font-size:.75rem;font-weight:700;min-height:56px}
.bottom-nav a span{display:block;font-size:1.35rem;line-height:1.2}
.bottom-nav a.active{color:var(--brown);box-shadow:inset 0 3px 0 var(--brown)}
.table-wrap{overflow-x:auto;background:#fff;border-radius:var(--radius);border:1px solid var(--line)}
table{width:100%;border-collapse:collapse;font-size:.92rem}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--cream);font-size:.82rem}
td.num,th.num{text-align:right;white-space:nowrap}
tr:last-child td{border-bottom:0}
.low{color:var(--danger);font-weight:800}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.row>*{flex:1}
.totals{background:#fff;border-radius:var(--radius);padding:14px 16px;margin-top:14px;border:1px solid var(--line)}
.totals div{display:flex;justify-content:space-between;padding:3px 0}
.totals .big{font-family:var(--serif);font-size:1.5rem;font-weight:700}
.cart-item{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px dashed var(--line)}
.msg{margin-top:10px;font-weight:700}
.msg.error{color:var(--danger)}
.modal{position:fixed;inset:0;background:rgba(60,40,30,.55);z-index:60;display:flex;align-items:flex-end;justify-content:center}
.modal-box{background:#fff;width:100%;max-width:440px;border-radius:20px 20px 0 0;padding:20px;max-height:92vh;overflow:auto}
@media(min-width:600px){.modal{align-items:center}.modal-box{border-radius:20px}}
.receipt{font-family:'Courier New',monospace;font-size:.9rem}
.receipt h3{font-family:var(--serif);text-align:center;letter-spacing:.12em}
.receipt .c{text-align:center}
.receipt .ln{display:flex;justify-content:space-between;gap:8px}
.receipt hr{border:0;border-top:1px dashed #999;margin:8px 0}
.toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translateX(-50%);background:var(--text);color:#fff;padding:10px 18px;border-radius:999px;z-index:80;font-weight:700}
.empty{padding:24px;text-align:center;color:var(--brown)}
.print-only{display:none}

/* ---------- PRINT ---------- */
@media print{
  body{background:#fff;color:#000;padding:0}
  .app-header,.bottom-nav,.fab,.no-print,.toast{display:none!important}
  .print-only{display:block}
  .table-wrap{border:0;overflow:visible}
  th{background:#eee!important;-webkit-print-color-adjust:exact}
  /* receipt printing: show only the receipt */
  body.print-receipt main>*:not(.modal){display:none!important}
  body.print-receipt .modal{position:static;background:none;display:block}
  body.print-receipt .modal-box{max-width:80mm;padding:0;margin:0 auto;border-radius:0;max-height:none;overflow:visible}
}
```

## `js/main.js`

```javascript
/* Shared helpers: API wrapper, formatting, header + bottom nav */
const API = ""; // same origin; set to e.g. "http://localhost:3000" if hosting the frontend separately

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error((data && data.error) || "Something went wrong. Please try again.");
  return data;
}

const peso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDateTime = (d) => new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const productLabel = (p) => p.name + (p.size ? " " + p.size : "");
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel) => document.querySelector(sel);

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function renderChrome(active) {
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = '<div class="brand">EATSONG BREW</div><div class="tagline">Eat. Sip. Stay.</div>';
  document.body.prepend(header);

  const links = [
    ["index.html", "dashboard", "🏠", "Home"],
    ["sale.html", "sale", "☕", "Sale"],
    ["inventory.html", "inventory", "📦", "Stock"],
    ["reports.html", "reports", "📊", "Reports"],
  ];
  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "Main");
  nav.innerHTML = links.map(([href, id, icon, label]) =>
    `<a href="${href}" class="${id === active ? "active" : ""}"${id === active ? ' aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${label}</a>`).join("");
  document.body.appendChild(nav);
}
```

## `js/dashboard.js`

```javascript
renderChrome("dashboard");

(async function load() {
  try {
    const d = await api("/api/dashboard?since=" + encodeURIComponent(startOfToday().toISOString()));
    $("#sales").textContent = peso(d.totalSales);
    $("#tx").textContent = d.transactions;
    $("#items").textContent = d.itemsSold;
    $("#siomai").textContent = d.siomaiLeft == null ? "n/a" : d.siomaiLeft + " pcs";
    if (d.lowStock.length) {
      const b = $("#lowBanner");
      b.innerHTML = `<strong>Low stock</strong><ul>${d.lowStock.map((p) => `<li>${esc(productLabel(p))}: ${p.currentStock} left</li>`).join("")}</ul>`;
      b.classList.remove("hidden");
    }
  } catch (e) {
    $("#err").textContent = e.message;
  }
})();
```

## `js/sale.js`

```javascript
renderChrome("sale");

let products = [];
let cart = []; // { productId, label, unitPrice, quantity }

const sel = $("#product"), qty = $("#qty"), pay = $("#payment");
const total = () => cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

async function init() {
  try {
    products = await api("/api/products");
    const opt = (p) => `<option value="${p.id}"${p.currentStock <= 0 ? " disabled" : ""}>${esc(productLabel(p))} — ${peso(p.sellingPrice)} (${p.currentStock} left)</option>`;
    const group = (name, cat) => {
      const list = products.filter((p) => p.category === cat);
      return list.length ? `<optgroup label="${name}">${list.map(opt).join("")}</optgroup>` : "";
    };
    sel.innerHTML = group("Drinks", "Drink") + group("Food", "Food");
  } catch (e) { $("#msg").textContent = e.message; }
}

function render() {
  $("#cart").innerHTML = cart.length
    ? cart.map((i, idx) => `<div class="cart-item"><span>${i.quantity} × ${esc(i.label)}</span>
        <span>${peso(i.unitPrice * i.quantity)} <button class="btn small ghost" data-rm="${idx}" aria-label="Remove ${esc(i.label)}">✕</button></span></div>`).join("")
    : '<p class="empty">No items yet. Pick a product and add it.</p>';
  $("#total").textContent = peso(total());
  const p = parseFloat(pay.value);
  $("#change").textContent = peso(!isNaN(p) && p >= total() ? p - total() : 0);
}

$("#addBtn").onclick = () => {
  const p = products.find((x) => x.id === sel.value);
  const q = parseInt(qty.value, 10);
  $("#msg").textContent = "";
  if (!p || !(q > 0)) { $("#msg").textContent = "Choose a product and a quantity of 1 or more."; return; }
  const inCart = cart.filter((i) => i.productId === p.id).reduce((s, i) => s + i.quantity, 0);
  if (inCart + q > p.currentStock) { $("#msg").textContent = `Only ${p.currentStock} ${p.unit}(s) of ${productLabel(p)} in stock.`; return; }
  const existing = cart.find((i) => i.productId === p.id);
  if (existing) existing.quantity += q;
  else cart.push({ productId: p.id, label: productLabel(p), unitPrice: p.sellingPrice, quantity: q });
  qty.value = 1;
  render();
};

$("#cart").addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rm]");
  if (rm) { cart.splice(+rm.dataset.rm, 1); render(); }
});
pay.addEventListener("input", render);

$("#saveBtn").onclick = async () => {
  const msg = $("#msg");
  msg.textContent = "";
  if (!cart.length) { msg.textContent = "Add at least one item first."; return; }
  const p = pay.value === "" ? null : parseFloat(pay.value);
  if (p != null && p < total()) { msg.textContent = "Payment is less than the total."; return; }
  const btn = $("#saveBtn");
  btn.disabled = true;
  try {
    const sale = await api("/api/sales", { method: "POST", body: { items: cart.map(({ productId, quantity }) => ({ productId, quantity })), payment: p } });
    showReceipt(sale);
  } catch (e) {
    msg.textContent = e.message;
  } finally { btn.disabled = false; }
};

function showReceipt(s) {
  const ln = (a, b) => `<div class="ln"><span>${a}</span><span>${b}</span></div>`;
  $("#receipt").innerHTML = `
    <h3>EATSONG BREW</h3><div class="c">Eat. Sip. Stay.</div><hr>
    <div class="c">${fmtDateTime(s.createdAt)}<br>Receipt #${esc(s.id.slice(-6).toUpperCase())}</div><hr>
    ${s.items.map((i) => ln(`${i.quantity} × ${esc(productLabel(i))}`, peso(i.lineTotal))).join("")}<hr>
    ${ln("<strong>TOTAL</strong>", `<strong>${peso(s.totalAmount)}</strong>`)}
    ${s.payment != null ? ln("Payment", peso(s.payment)) + ln("Change", peso(s.change)) : ""}<hr>
    <div class="c">Thank you! See you again.</div>`;
  $("#receiptModal").classList.remove("hidden");
}

$("#printBtn").onclick = () => {
  document.body.classList.add("print-receipt");
  window.print();
  document.body.classList.remove("print-receipt");
};
$("#newBtn").onclick = () => location.reload();

init().then(render);
```

## `js/inventory.js`

```javascript
renderChrome("inventory");

let products = [], current = null, mode = "stock_in";
const modal = $("#stockModal");

async function load() {
  try {
    const [p, logs] = await Promise.all([api("/api/products"), api("/api/inventory-log")]);
    products = p;
    $("#products").innerHTML = p.map((x) => `<tr>
      <td>${esc(x.name)}</td><td>${esc(x.size || "—")}</td><td class="num">${peso(x.sellingPrice)}</td>
      <td class="num ${x.currentStock <= x.lowStockThreshold ? "low" : ""}">${x.currentStock}</td>
      <td class="no-print"><div class="row" style="flex-wrap:nowrap">
        <button class="btn small" data-in="${x.id}">Stock in</button>
        <button class="btn small ghost" data-adj="${x.id}">Adjust</button></div></td></tr>`).join("")
      || '<tr><td colspan="5" class="empty">No products yet. Run the seed script.</td></tr>';
    $("#logs").innerHTML = logs.map((l) => `<tr><td>${fmtDateTime(l.createdAt)}</td><td>${esc(productLabel(l))}</td>
      <td>${esc(l.type.replace("_", " "))}</td><td class="num">${l.quantity > 0 ? "+" : ""}${l.quantity}</td><td>${esc(l.notes || "")}</td></tr>`).join("")
      || '<tr><td colspan="5" class="empty">No stock changes yet.</td></tr>';
  } catch (e) {
    $("#products").innerHTML = `<tr><td colspan="5" class="msg error">${esc(e.message)}</td></tr>`;
  }
}

function openModal(id, m) {
  current = products.find((p) => p.id === id); mode = m;
  $("#stockTitle").textContent = (m === "stock_in" ? "Stock in: " : "Adjust: ") + productLabel(current);
  $("#stockHelp").textContent = m === "stock_in"
    ? `Current stock: ${current.currentStock}. Enter how many ${current.unit}s you received.`
    : `Current stock: ${current.currentStock}. Enter a positive or negative number (e.g. -3 for spoilage).`;
  $("#stockQty").value = ""; $("#stockNotes").value = ""; $("#stockMsg").textContent = "";
  modal.classList.remove("hidden");
  $("#stockQty").focus();
}

$("#products").addEventListener("click", (e) => {
  const a = e.target.closest("button");
  if (!a) return;
  if (a.dataset.in) openModal(a.dataset.in, "stock_in");
  if (a.dataset.adj) openModal(a.dataset.adj, "adjustment");
});
$("#stockCancel").onclick = () => modal.classList.add("hidden");
$("#stockSave").onclick = async () => {
  const btn = $("#stockSave");
  btn.disabled = true;
  try {
    await api("/api/stock", { method: "POST", body: { productId: current.id, type: mode, quantity: $("#stockQty").value, notes: $("#stockNotes").value } });
    modal.classList.add("hidden");
    toast("Stock updated");
    load();
  } catch (e) { $("#stockMsg").textContent = e.message; }
  finally { btn.disabled = false; }
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.add("hidden"); });

load();
```

## `js/reports.js`

```javascript
renderChrome("reports");

const fromEl = $("#from"), toEl = $("#to");
let sales = [];

const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
fromEl.value = toEl.value = iso(new Date());

async function load() {
  $("#msg").textContent = "";
  if (!fromEl.value || !toEl.value || fromEl.value > toEl.value) { $("#msg").textContent = "Choose a valid date range."; return; }
  // local-day boundaries, converted to UTC for the API
  const from = new Date(fromEl.value + "T00:00:00").toISOString();
  const to = new Date(toEl.value + "T23:59:59.999").toISOString();
  try {
    sales = await api(`/api/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    const itemsText = (s) => s.items.map((i) => `${i.quantity}× ${productLabel(i)}`).join(", ");
    $("#rows").innerHTML = sales.map((s) => `<tr><td>${fmtDateTime(s.createdAt)}</td><td>${esc(itemsText(s))}</td>
      <td class="num">${peso(s.totalAmount)}</td><td class="num">${s.payment == null ? "—" : peso(s.payment)}</td>
      <td class="num">${s.change == null ? "—" : peso(s.change)}</td></tr>`).join("")
      || '<tr><td colspan="5" class="empty">No sales in this range.</td></tr>';
    $("#sum").textContent = peso(sales.reduce((t, s) => t + s.totalAmount, 0));
    $("#printTitle").textContent = `Eatsong Brew sales: ${fromEl.value} to ${toEl.value}`;
  } catch (e) { $("#msg").textContent = e.message; }
}

$("#runBtn").onclick = load;
$("#printBtn").onclick = () => window.print();
$("#exportBtn").onclick = () => {
  if (!sales.length) { $("#msg").textContent = "Nothing to export. Show sales first."; return; }
  if (typeof XLSX === "undefined") { $("#msg").textContent = "Excel library didn't load. Check your connection."; return; }
  const rows = sales.map((s) => ({
    Date: new Date(s.createdAt).toLocaleString("en-PH"),
    Receipt: s.id.slice(-6).toUpperCase(),
    Items: s.items.map((i) => `${i.quantity}x ${productLabel(i)}`).join(", "),
    Total: s.totalAmount, Payment: s.payment, Change: s.change,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 50 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  XLSX.writeFile(wb, `eatsong-sales_${fromEl.value}_to_${toEl.value}.xlsx`);
};

load();
```

## `server/server.js`

```javascript
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const ROOT = path.join(__dirname, "..");

app.use(cors());
app.use(express.json());

// Serve only public frontend files (never .env or server code)
app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));
["index", "sale", "inventory", "reports"].forEach((p) => {
  const file = path.join(ROOT, p + ".html");
  app.get(p === "index" ? ["/", "/index.html"] : "/" + p + ".html", (_, res) => res.sendFile(file));
});

const num = (d) => (d == null ? null : Number(d));
const fail = (status, message) => Object.assign(new Error(message), { status });
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    if (!e.status) console.error(e);
    res.status(e.status || 500).json({ error: e.status ? e.message : "Server error" });
  });
const fmtProduct = (p) => ({ ...p, sellingPrice: num(p.sellingPrice) });

// GET /api/products
app.get("/api/products", wrap(async (req, res) => {
  const where = req.query.all ? {} : { isActive: true };
  const products = await prisma.product.findMany({ where, orderBy: [{ category: "asc" }, { name: "asc" }, { size: "asc" }] });
  res.json(products.map(fmtProduct));
}));

// POST /api/sales  { items: [{productId, quantity}], payment }
app.post("/api/sales", wrap(async (req, res) => {
  const { items, payment } = req.body;
  if (!Array.isArray(items) || !items.length) throw fail(400, "Add at least one item.");

  const merged = {};
  for (const i of items) {
    const q = parseInt(i.quantity, 10);
    if (!i.productId || !(q > 0)) throw fail(400, "Invalid item or quantity.");
    merged[i.productId] = (merged[i.productId] || 0) + q;
  }

  // One transaction: validate stock, create sale, deduct stock, write logs. All or nothing.
  const sale = await prisma.$transaction(async (tx) => {
    const lines = [];
    let total = 0;
    for (const [productId, quantity] of Object.entries(merged)) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) throw fail(404, "Product not found.");
      const upd = await tx.product.updateMany({
        where: { id: productId, currentStock: { gte: quantity } },
        data: { currentStock: { decrement: quantity } },
      });
      if (upd.count === 0) throw fail(409, `Not enough stock for ${product.name}${product.size ? " " + product.size : ""} (${product.currentStock} left).`);
      const unitPrice = Number(product.sellingPrice);
      const lineTotal = +(unitPrice * quantity).toFixed(2);
      total += lineTotal;
      lines.push({ productId, quantity, unitPrice, lineTotal });
    }
    total = +total.toFixed(2);
    const pay = payment === "" || payment == null ? null : Number(payment);
    if (pay != null && (isNaN(pay) || pay < total)) throw fail(400, "Payment is less than the total.");

    const created = await tx.sale.create({
      data: { totalAmount: total, payment: pay, change: pay == null ? null : +(pay - total).toFixed(2), items: { create: lines } },
      include: { items: { include: { product: true } } },
    });
    await tx.inventoryLog.createMany({
      data: lines.map((l) => ({ productId: l.productId, type: "sale", quantity: -l.quantity, notes: `Sale #${created.id.slice(-6).toUpperCase()}` })),
    });
    return created;
  });

  res.status(201).json(fmtSale(sale));
}));

const fmtSale = (s) => ({
  id: s.id, createdAt: s.createdAt, totalAmount: num(s.totalAmount), payment: num(s.payment), change: num(s.change),
  items: s.items.map((i) => ({ name: i.product.name, size: i.product.size, quantity: i.quantity, unitPrice: num(i.unitPrice), lineTotal: num(i.lineTotal) })),
});

// POST /api/stock  { productId, type: "stock_in"|"adjustment", quantity, notes }
// stock_in adds a positive quantity; adjustment takes a signed quantity (+/-).
app.post("/api/stock", wrap(async (req, res) => {
  const { productId, type, notes } = req.body;
  const quantity = parseInt(req.body.quantity, 10);
  if (!productId || !["stock_in", "adjustment"].includes(type)) throw fail(400, "Invalid request.");
  if (!quantity || (type === "stock_in" && quantity < 0)) throw fail(400, "Enter a valid quantity.");

  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id: productId } });
    if (!p) throw fail(404, "Product not found.");
    if (p.currentStock + quantity < 0) throw fail(409, "Stock can't go below zero.");
    const updated = await tx.product.update({ where: { id: productId }, data: { currentStock: { increment: quantity } } });
    await tx.inventoryLog.create({ data: { productId, type, quantity, notes: notes || null } });
    return updated;
  });
  res.json(fmtProduct(product));
}));

// GET /api/inventory-log  (last 50 changes)
app.get("/api/inventory-log", wrap(async (req, res) => {
  const logs = await prisma.inventoryLog.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { product: true } });
  res.json(logs.map((l) => ({ id: l.id, createdAt: l.createdAt, type: l.type, quantity: l.quantity, notes: l.notes, name: l.product.name, size: l.product.size })));
}));

// GET /api/dashboard?since=ISO
app.get("/api/dashboard", wrap(async (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : new Date(new Date().setHours(0, 0, 0, 0));
  const [sales, items, products] = await Promise.all([
    prisma.sale.aggregate({ where: { createdAt: { gte: since } }, _sum: { totalAmount: true }, _count: true }),
    prisma.saleItem.aggregate({ where: { sale: { createdAt: { gte: since } } }, _sum: { quantity: true } }),
    prisma.product.findMany({ where: { isActive: true } }),
  ]);
  const siomai = products.find((p) => p.name.toLowerCase() === "siomai");
  res.json({
    totalSales: num(sales._sum.totalAmount) || 0,
    transactions: sales._count,
    itemsSold: items._sum.quantity || 0,
    siomaiLeft: siomai ? siomai.currentStock : null,
    lowStock: products.filter((p) => p.currentStock <= p.lowStockThreshold)
      .map((p) => ({ id: p.id, name: p.name, size: p.size, currentStock: p.currentStock })),
  });
}));

// GET /api/reports?from=ISO&to=ISO
app.get("/api/reports", wrap(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setHours(0, 0, 0, 0));
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });
  res.json(sales.map(fmtSale));
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Eatsong Brew tracker running at http://localhost:${PORT}`));
```

## `server/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id                String         @id @default(cuid())
  name              String
  category          String         @default("Drink") // Drink, Food
  size              String? // e.g., "12oz", "16oz", or null
  unit              String         @default("cup") // cup, piece
  sellingPrice      Decimal        @db.Decimal(10, 2)
  currentStock      Int            @default(0)
  lowStockThreshold Int            @default(10)
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())
  saleItems         SaleItem[]
  inventoryLogs     InventoryLog[]
}

model Sale {
  id          String     @id @default(cuid())
  createdAt   DateTime   @default(now())
  totalAmount Decimal    @db.Decimal(10, 2)
  payment     Decimal?   @db.Decimal(10, 2)
  change      Decimal?   @db.Decimal(10, 2)
  items       SaleItem[]
}

model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  productId String
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)
  lineTotal Decimal @db.Decimal(10, 2)
  sale      Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
}

model InventoryLog {
  id        String   @id @default(cuid())
  productId String
  type      String // "stock_in" | "sale" | "adjustment"
  quantity  Int // positive = in, negative = out
  notes     String?
  createdAt DateTime @default(now())
  product   Product  @relation(fields: [productId], references: [id])
}
```

## `server/prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

const drinks: [string, string, number][] = [
  ["Iced Latte", "12oz", 49], ["Iced Latte", "16oz", 59],
  ["Salted Caramel", "12oz", 69], ["Salted Caramel", "16oz", 79],
  ["Mocha", "12oz", 69], ["Mocha", "16oz", 79],
  ["Dark Choco", "12oz", 45], ["Dark Choco", "16oz", 55],
  ["Oreo Choco", "12oz", 59], ["Oreo Choco", "16oz", 69],
  ["Oreo C'n Cream", "12oz", 59],
  ["Black Coffee", "16oz", 45],
  ["Coffee Matcha", "16oz", 79],
  ["Milky Matcha", "16oz", 69],
];

async function main() {
  await prisma.inventoryLog.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();

  for (const [name, size, price] of drinks) {
    const p = await prisma.product.create({
      data: { name, size, category: "Drink", unit: "cup", sellingPrice: price, currentStock: 50, lowStockThreshold: 10 },
    });
    await prisma.inventoryLog.create({ data: { productId: p.id, type: "stock_in", quantity: 50, notes: "Initial stock" } });
  }
  const food: [string, number][] = [["Siomai", 8], ["Siopao", 25]];
  for (const [name, price] of food) {
    const p = await prisma.product.create({
      data: { name, size: null, category: "Food", unit: "piece", sellingPrice: price, currentStock: 100, lowStockThreshold: 20 },
    });
    await prisma.inventoryLog.create({ data: { productId: p.id, type: "stock_in", quantity: 100, notes: "Initial stock" } });
  }
  console.log("Seeded 16 products.");
}

main().finally(() => prisma.$disconnect());
```

