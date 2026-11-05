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
