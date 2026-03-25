const user = requireRole("Cajero");
let currentVoucher = null;

function renderCajero() {
  const data = loadData();
  const s = stats(data);

  document.getElementById("salesTotal").textContent = money(s.totalSales);
  document.getElementById("receiptCount").textContent = s.receiptCount;
  document.getElementById("unitCount").textContent = s.totalUnits;
  document.getElementById("pendingVoucherCount").textContent = s.pendingVouchers;

  document.getElementById("cashierReceipts").innerHTML = data.receipts.slice().reverse().map(receipt => {
    const voucher = data.vouchers.find(v => v.id === receipt.voucher_id);
    const html = buildReceiptHtml(receipt, voucher || { seller: "-", voucher_code: "-", items: [] }, user.email);
    const url = downloadHtml(`boleta-${receipt.id}.html`, html);
    return `<tr><td>${receipt.id}</td><td>${receipt.created_at}</td><td>${money(receipt.amount)}</td><td>${receipt.status}</td><td><a class="btn secondary small" href="${url}" download="boleta-${receipt.id}.html">Descargar</a></td></tr>`;
  }).join("");

  document.getElementById("saleHistory").innerHTML = data.sales.slice().reverse().map(item => `
    <tr><td>${item.created_at}</td><td>${item.voucher_code || "-"}</td><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.total)}</td></tr>
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
  document.getElementById("voucherMeta").textContent = `Vendedor: ${voucher.seller} | Fecha: ${voucher.created_at} | Estado: ${voucher.status}`;
  document.getElementById("voucherItemsTable").innerHTML = voucher.items.map(item => `
    <tr><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.total)}</td></tr>
  `).join("");
  document.getElementById("voucherTotal").textContent = money(voucher.total);
  document.getElementById("downloadReceiptBtn").style.display = "none";
}

document.getElementById("voucherLookupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    lookupVoucher(document.getElementById("voucherCodeInput").value.trim());
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("chargeVoucherBtn").addEventListener("click", () => {
  if (!currentVoucher) return alert("Primero busca un voucher.");
  if (currentVoucher.status !== "Pendiente") return alert("Este voucher ya fue cobrado.");

  const data = loadData();

  for (const item of currentVoucher.items) {
    const product = data.products.find(p => p.id === item.product_id);
    if (!product || product.stock < item.quantity) {
      return alert(`Stock insuficiente para ${item.product}.`);
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
      payment_method: "Cobro en caja",
      created_at: nowString()
    });
  });

  currentVoucher.status = "Cobrado";

  const receipt = {
    id: data.receipts.length ? Math.max(...data.receipts.map(item => item.id)) + 1 : 321,
    voucher_id: currentVoucher.id,
    amount: currentVoucher.total,
    status: "Emitida",
    created_at: dateOnly()
  };
  data.receipts.push(receipt);
  saveData(data);

  const html = buildReceiptHtml(receipt, currentVoucher, user.email);
  const url = downloadHtml(`boleta-${receipt.id}.html`, html);
  const link = document.getElementById("downloadReceiptBtn");
  link.href = url;
  link.download = `boleta-${receipt.id}.html`;
  link.style.display = "inline-block";

  alert(`Cobro realizado. Boleta N° ${receipt.id} emitida.`);
  renderCajero();
  lookupVoucher(currentVoucher.voucher_code);
});

renderCajero();
