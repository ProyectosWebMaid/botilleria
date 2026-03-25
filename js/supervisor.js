protectPage("Supervisor");

function setSupervisorText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderSupervisorSummary() {
  const data = loadData();
  const lowStockItems = data.products.filter((item) => item.stock <= item.minStock);
  const totalSales = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  setSupervisorText("supLowStock", String(lowStockItems.length));
  setSupervisorText("supReceipts", String(data.receipts.length));
  setSupervisorText("supSales", formatCurrency(totalSales));
  setSupervisorText("supAlerts", String(lowStockItems.length));

  const alertList = document.getElementById("supervisorAlerts");
  if (alertList) {
    alertList.innerHTML = lowStockItems.map((item) => `<li>${item.name}: ${item.stock} unidades</li>`).join("") || "<li>Sin alertas críticas.</li>";
  }

  const stockTable = document.getElementById("supervisorStockTable");
  if (stockTable) {
    stockTable.innerHTML = data.products.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.stock}</td>
        <td>${item.stock <= item.minStock ? "Bajo" : "Normal"}</td>
      </tr>
    `).join("");
  }

  const receiptTable = document.getElementById("supervisorReceiptTable");
  if (receiptTable) {
    receiptTable.innerHTML = data.receipts.slice().reverse().map((receipt) => `
      <tr>
        <td>${receipt.id}</td>
        <td>${receipt.date}</td>
        <td>${receipt.status}</td>
      </tr>
    `).join("");
  }

  const reportTable = document.getElementById("supervisorReportTable");
  if (reportTable) {
    const units = data.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    reportTable.innerHTML = `
      <tr><td>Ventas supervisadas</td><td>${formatCurrency(totalSales)}</td></tr>
      <tr><td>Boletas revisadas</td><td>${data.receipts.length}</td></tr>
      <tr><td>Unidades vendidas</td><td>${units}</td></tr>
      <tr><td>Productos con stock bajo</td><td>${lowStockItems.length}</td></tr>
    `;
  }
}

function renderAllSupervisor() {
  renderSupervisorSummary();
}

renderAllSupervisor();
