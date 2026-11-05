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
