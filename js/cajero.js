protectPage("Cajero");

function setCajeroText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderCajeroStats() {
  const data = loadData();
  const totalSales = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  const units = data.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const cashTotal = data.cash.opening + totalSales;
  setCajeroText("cajeroSalesTotal", formatCurrency(totalSales));
  setCajeroText("cajeroReceiptsTotal", String(data.receipts.length));
  setCajeroText("cajeroUnitsTotal", String(units));
  setCajeroText("cajeroCashTotal", formatCurrency(cashTotal));

  const productSelect = document.getElementById("saleProduct");
  if (productSelect) {
    const currentValue = productSelect.value;
    productSelect.innerHTML = data.products
      .filter((item) => item.stock > 0)
      .map((product) => `<option value="${product.id}">${product.name} - ${formatCurrency(product.price)} (${product.stock} stock)</option>`)
      .join("");
    if (currentValue) productSelect.value = currentValue;
  }

  const history = document.getElementById("cashierHistory");
  if (history) {
    history.innerHTML = data.sales.slice().reverse().map((sale) => `
      <tr>
        <td>${sale.date}</td>
        <td>${sale.product}</td>
        <td>${sale.quantity}</td>
        <td>${sale.paymentMethod}</td>
        <td>${formatCurrency(sale.total)}</td>
      </tr>
    `).join("");
  }

  const receiptList = document.getElementById("cashierReceipts");
  if (receiptList) {
    receiptList.innerHTML = data.receipts.slice().reverse().map((receipt) => `
      <tr>
        <td>${receipt.id}</td>
        <td>${receipt.date}</td>
        <td>${formatCurrency(receipt.amount)}</td>
        <td>${receipt.status}</td>
      </tr>
    `).join("");
  }

  const cashTable = document.getElementById("cashSummary");
  if (cashTable) {
    const efectivo = data.sales.filter((sale) => sale.paymentMethod === "Efectivo").reduce((sum, sale) => sum + sale.total, 0);
    const tarjeta = data.sales.filter((sale) => sale.paymentMethod === "Tarjeta").reduce((sum, sale) => sum + sale.total, 0);
    const transferencia = data.sales.filter((sale) => sale.paymentMethod === "Transferencia").reduce((sum, sale) => sum + sale.total, 0);
    cashTable.innerHTML = `
      <tr><td>Apertura de caja</td><td>${formatCurrency(data.cash.opening)}</td></tr>
      <tr><td>Ventas efectivo</td><td>${formatCurrency(efectivo)}</td></tr>
      <tr><td>Ventas tarjeta</td><td>${formatCurrency(tarjeta)}</td></tr>
      <tr><td>Ventas transferencia</td><td>${formatCurrency(transferencia)}</td></tr>
    `;
  }
}

function bindSaleForm() {
  const form = document.getElementById("saleForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = loadData();
    const productId = Number(document.getElementById("saleProduct").value);
    const quantity = Number(document.getElementById("saleQuantity").value || 1);
    const paymentMethod = document.getElementById("salePayment").value;
    const product = data.products.find((item) => item.id === productId);

    if (!product) {
      alert("Selecciona un producto.");
      return;
    }
    if (quantity <= 0 || quantity > product.stock) {
      alert("Cantidad inválida o sin stock suficiente.");
      return;
    }

    product.stock -= quantity;
    const sale = {
      id: nextId(data.sales),
      productId: product.id,
      product: product.name,
      quantity,
      total: product.price * quantity,
      cashier: "Caja 1",
      paymentMethod,
      date: todayString(),
    };
    data.sales.push(sale);
    data.receipts.push({
      id: data.receipts.length ? Math.max(...data.receipts.map((item) => item.id)) + 1 : 1,
      saleId: sale.id,
      amount: sale.total,
      status: "Emitida",
      date: dateOnly(),
    });
    saveData(data);
    form.reset();
    renderAllCajero();
    if (typeof renderAllAdmin === "function") renderAllAdmin();
    if (typeof renderAllSupervisor === "function") renderAllSupervisor();
    alert("Venta registrada correctamente.");
  });
}

function renderAllCajero() {
  renderCajeroStats();
}

bindSaleForm();
renderAllCajero();
