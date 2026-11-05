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
