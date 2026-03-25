const user = requireRole("Cajero");
let currentVoucher = null;
let currentReceiptUrl = null;
let currentReceiptHtml = null;

function selectedPaymentMethod() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : "Efectivo";
}

function resetForNewSale() {
  currentVoucher = null;
  currentReceiptUrl = null;
  currentReceiptHtml = null;

  const input = document.getElementById("voucherCodeInput");
  input.value = "";
  input.focus();

  document.getElementById("voucherLoaded").style.display = "none";
  document.getElementById("downloadReceiptBtn").style.display = "none";
  document.getElementById("printReceiptBtn").style.display = "none";
}

function renderCajero() {
  const data = loadData();
  const s = stats(data);

  document.getElementById("salesTotal").textContent = money(s.totalSales);
  document.getElementById("receiptCount").textContent = s.receiptCount;
  document.getElementById("unitCount").textContent = s.totalUnits;
  document.getElementById("pendingVoucherCount").textContent = s.pendingVouchers;

  document.getElementById("cashierReceipts").innerHTML = data.receipts.slice().reverse().map(receipt => {
    const voucher = data.vouchers.find(v => v.id === receipt.voucher_id);
    const paymentMethod = receipt.payment_method || "Efectivo";
    const html = buildReceiptHtml(
      receipt,
      voucher || { seller: "-", voucher_code: "-", items: [] },
      user.email,
      paymentMethod
    );
    const url = downloadHtml(`boleta-${receipt.id}.html`, html);
    return `
      <tr>
        <td>${receipt.id}</td>
        <td>${receipt.created_at}</td>
        <td>${money(receipt.amount)}</td>
        <td>${receipt.status}</td>
        <td><a class="btn secondary small" href="${url}" download="boleta-${receipt.id}.html">Descargar</a></td>
      </tr>
    `;
  }).join("");

  document.getElementById("saleHistory").innerHTML = data.sales.slice().reverse().map(item => `
    <tr>
      <td>${item.created_at}</td>
      <td>${item.voucher_code || "-"}</td>
      <td>${item.product}</td>
      <td>${item.quantity}</td>
      <td>${money(item.total)}</td>
    </tr>
  `).join("");

  const totalCaja = data.sales.reduce((sum, item) => sum + Number(item.total), 0);
  document.getElementById("cashTable").innerHTML = `
    <tr><td>Ventas cobradas en caja</td><td>${money(totalCaja)}</td></tr>
    <tr><td>Voucher pendientes</td><td>${s.pendingVouchers}</td></tr>
    <tr><td>Boletas emitidas</td><td>${s.receiptCount}</td></tr>
  `;
}

function lookupVoucher(code) {
  const data = loadData();
  const voucher = data.vouchers.find(item => item.voucher_code === code);
  if (!voucher) throw new Error("Voucher no encontrado.");

  currentVoucher = voucher;
  document.getElementById("voucherLoaded").style.display = "block";
  document.getElementById("voucherMeta").textContent =
    `Vendedor: ${voucher.seller} | Fecha: ${voucher.created_at} | Estado: ${voucher.status}`;

  document.getElementById("voucherItemsTable").innerHTML = voucher.items.map(item => `
    <tr><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.total)}</td></tr>
  `).join("");

  document.getElementById("voucherTotal").textContent = money(voucher.total);

  if (voucher.status !== "Pendiente") {
    document.getElementById("downloadReceiptBtn").style.display = "none";
    document.getElementById("printReceiptBtn").style.display = "none";
  }
}

document.getElementById("voucherLookupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    lookupVoucher(document.getElementById("voucherCodeInput").value.trim());
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("scanVisualBtn").addEventListener("click", () => {
  const data = loadData();
  const pending = data.vouchers.find(item => item.status === "Pendiente");
  if (!pending) {
    alert("No hay voucher pendientes para simular escaneo.");
    return;
  }
  document.getElementById("voucherCodeInput").value = pending.voucher_code;
  lookupVoucher(pending.voucher_code);
});

document.querySelectorAll(".payment-option").forEach((label) => {
  label.addEventListener("click", () => {
    document.querySelectorAll(".payment-option").forEach(item => item.classList.remove("active"));
    label.classList.add("active");
    const radio = label.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  });
});

document.getElementById("chargeVoucherBtn").addEventListener("click", () => {
  if (!currentVoucher) {
    alert("Primero busca un voucher.");
    return;
  }
  if (currentVoucher.status !== "Pendiente") {
    alert("Este voucher ya fue cobrado.");
    return;
  }

  const data = loadData();
  const paymentMethod = selectedPaymentMethod();

  for (const item of currentVoucher.items) {
    const product = data.products.find(p => p.id === item.product_id);
    if (!product || product.stock < item.quantity) {
      alert(`Stock insuficiente para ${item.product}.`);
      return;
    }
  }

  currentVoucher.items.forEach(item => {
    const product = data.products.find(p => p.id === item.product_id);
    product.stock -= item.quantity;
    data.sales.push({
      id: nextId(data.sales),
      voucher_code: currentVoucher.voucher_code,
      seller: currentVoucher.seller,
      product_id: item.product_id,
      product: item.product,
      quantity: item.quantity,
      total: item.total,
      cashier: user.email,
      payment_method: paymentMethod,
      created_at: nowString()
    });
  });

  currentVoucher.status = "Cobrado";

  const receipt = {
    id: data.receipts.length ? Math.max(...data.receipts.map(item => item.id)) + 1 : 321,
    voucher_id: currentVoucher.id,
    amount: currentVoucher.total,
    status: "Emitida",
    created_at: dateOnly(),
    payment_method: paymentMethod
  };
  data.receipts.push(receipt);
  saveData(data);

  currentReceiptHtml = buildReceiptHtml(receipt, currentVoucher, user.email, paymentMethod);
  currentReceiptUrl = downloadHtml(`boleta-${receipt.id}.html`, currentReceiptHtml);

  const downloadLink = document.getElementById("downloadReceiptBtn");
  downloadLink.href = currentReceiptUrl;
  downloadLink.download = `boleta-${receipt.id}.html`;
  downloadLink.style.display = "inline-block";

  const printBtn = document.getElementById("printReceiptBtn");
  printBtn.style.display = "inline-block";

  alert(`Cobro realizado. Boleta N° ${receipt.id} emitida para entregar al cliente.`);

  renderCajero();

  setTimeout(() => {
    if (downloadLink.href) {
      downloadLink.click();
    }
  }, 150);

  setTimeout(() => {
    resetForNewSale();
  }, 300);
});

document.getElementById("downloadReceiptBtn").addEventListener("click", () => {
  if (!currentReceiptUrl) {
    alert("Primero debes emitir una boleta.");
  }
});

document.getElementById("printReceiptBtn").addEventListener("click", () => {
  if (!currentReceiptHtml) {
    alert("Primero debes emitir una boleta.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("El navegador bloqueó la ventana de impresión.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(currentReceiptHtml);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
});

renderCajero();
