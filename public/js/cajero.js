const user = requireRole("Cajero");
let currentVoucher = null;

async function loadCajero() {
  const [dashboard, sales, receipts, vouchers] = await Promise.all([
    api("/api/dashboard"),
    api("/api/sales"),
    api("/api/receipts"),
    api("/api/vouchers")
  ]);

  document.getElementById("salesTotal").textContent = money(dashboard.totalSales);
  document.getElementById("receiptCount").textContent = dashboard.receiptCount;
  document.getElementById("unitCount").textContent = dashboard.totalUnits;
  document.getElementById("pendingVoucherCount").textContent = dashboard.pendingVouchers;

  document.getElementById("cashierReceipts").innerHTML = receipts.map(item => `
    <tr>
      <td>${item.id}</td>
      <td>${item.created_at}</td>
      <td>${money(item.amount)}</td>
      <td>${item.status}</td>
      <td><a class="btn secondary small" href="/api/receipts/${item.id}/download">Descargar</a></td>
    </tr>
  `).join("");

  document.getElementById("saleHistory").innerHTML = sales.map(item => `
    <tr><td>${item.created_at}</td><td>${item.voucher_code || "-"}</td><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.total)}</td></tr>
  `).join("");

  const efectivo = sales.filter(item => item.payment_method === "Cobro en caja").reduce((a,b) => a + Number(b.total), 0);
  document.getElementById("cashTable").innerHTML = `
    <tr><td>Ventas cobradas en caja</td><td>${money(efectivo)}</td></tr>
    <tr><td>Voucher pendientes</td><td>${dashboard.pendingVouchers}</td></tr>
    <tr><td>Boletas emitidas</td><td>${dashboard.receiptCount}</td></tr>
  `;
}

async function lookupVoucher(code) {
  const voucher = await api(`/api/vouchers/${encodeURIComponent(code)}`);
  currentVoucher = voucher;
  document.getElementById("voucherLoaded").style.display = "block";
  document.getElementById("voucherMeta").textContent = `Vendedor: ${voucher.seller} | Fecha: ${voucher.created_at} | Estado: ${voucher.status}`;
  document.getElementById("voucherItemsTable").innerHTML = voucher.items.map(item => `
    <tr><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.total)}</td></tr>
  `).join("");
  document.getElementById("voucherTotal").textContent = money(voucher.total);
  document.getElementById("downloadReceiptBtn").style.display = "none";
}

document.getElementById("voucherLookupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await lookupVoucher(document.getElementById("voucherCodeInput").value.trim());
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("chargeVoucherBtn").addEventListener("click", async () => {
  if (!currentVoucher) {
    alert("Primero busca un voucher.");
    return;
  }
  try {
    const result = await api("/api/cashier/checkout-voucher", {
      method: "POST",
      body: JSON.stringify({
        voucherCode: currentVoucher.voucher_code,
        cashier: user ? user.email : "cajero@lacentral.cl"
      })
    });
    const btn = document.getElementById("downloadReceiptBtn");
    btn.href = result.downloadUrl;
    btn.style.display = "inline-block";
    alert(`Cobro realizado. Boleta N° ${result.receiptId} emitida.`);
    await loadCajero();
    await lookupVoucher(currentVoucher.voucher_code).catch(() => {
      document.getElementById("voucherLoaded").style.display = "none";
      currentVoucher = null;
    });
  } catch (error) {
    alert(error.message);
  }
});

loadCajero();
