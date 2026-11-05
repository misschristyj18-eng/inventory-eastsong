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
