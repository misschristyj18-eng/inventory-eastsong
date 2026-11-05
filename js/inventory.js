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
