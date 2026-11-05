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
const esc = (s) => String(s ?? "").replace(/[&<>\"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
