requireRole("Supervisor");

function renderSupervisor() {
  const data = loadData();
  const s = stats(data);
  document.getElementById("supLow").textContent = s.lowStockCount;
  document.getElementById("supReceipt").textContent = s.receiptCount;
  document.getElementById("supSales").textContent = money(s.totalSales);
  document.getElementById("supProducts").textContent = s.productCount;

  document.getElementById("supervisorStock").innerHTML = data.products
    .filter(item => item.stock <= item.min_stock)
    .map(item => `<tr><td>${item.name}</td><td>${item.stock}</td><td>${item.min_stock}</td></tr>`)
    .join("") || `<tr><td colspan="3">Sin stock crítico.</td></tr>`;

  document.getElementById("supervisorReceipts").innerHTML = data.receipts.slice().reverse().map(item => `
    <tr><td>${item.id}</td><td>${item.created_at}</td><td>${item.status}</td></tr>
  `).join("");

  document.getElementById("supervisorReport").innerHTML = `
    <tr><td>Ventas acumuladas</td><td>${money(s.totalSales)}</td></tr>
    <tr><td>Boletas emitidas</td><td>${s.receiptCount}</td></tr>
    <tr><td>Voucher pendientes</td><td>${s.pendingVouchers}</td></tr>
    <tr><td>Productos con stock bajo</td><td>${s.lowStockCount}</td></tr>
  `;
}

renderSupervisor();
