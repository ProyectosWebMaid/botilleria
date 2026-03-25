requireRole("Supervisor");

async function loadSupervisor() {
  const data = await api("/api/supervisor");
  document.getElementById("supLow").textContent = data.stats.lowStockCount;
  document.getElementById("supReceipt").textContent = data.stats.receiptCount;
  document.getElementById("supSales").textContent = money(data.stats.totalSales);
  document.getElementById("supProducts").textContent = data.stats.productCount;

  document.getElementById("supervisorStock").innerHTML = data.lowStock.map(item => `
    <tr><td>${item.name}</td><td>${item.stock}</td><td>${item.min_stock}</td></tr>
  `).join("") || `<tr><td colspan="3">Sin stock crítico.</td></tr>`;

  document.getElementById("supervisorReceipts").innerHTML = data.receipts.map(item => `
    <tr><td>${item.id}</td><td>${item.created_at}</td><td>${item.status}</td></tr>
  `).join("");

  document.getElementById("supervisorReport").innerHTML = `
    <tr><td>Ventas acumuladas</td><td>${money(data.stats.totalSales)}</td></tr>
    <tr><td>Boletas emitidas</td><td>${data.stats.receiptCount}</td></tr>
    <tr><td>Voucher pendientes</td><td>${data.stats.pendingVouchers}</td></tr>
    <tr><td>Productos con stock bajo</td><td>${data.stats.lowStockCount}</td></tr>
  `;
}
loadSupervisor();
