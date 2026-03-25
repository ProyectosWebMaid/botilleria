const user = requireRole("Cajero");
let currentVoucher = null;
let currentReceiptHtml = null;
let receiptWindow = null;

function selectedPaymentMethod() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : "Efectivo";
}

function chargeButton() {
  return document.getElementById("chargeVoucherBtn");
}

function statusBox() {
  return document.getElementById("voucherStatusBox");
}

function setStatusBox(kind, title, lines = []) {
  const box = statusBox();
  if (!box) return;
  box.className = kind === "success" ? "status-alert success" : "status-alert";
  box.style.display = "block";
  box.innerHTML = `
    <h4>${title}</h4>
    ${lines.map(line => `<p>${line}</p>`).join("")}
  `;
}

function clearStatusBox() {
  const box = statusBox();
  if (!box) return;
  box.style.display = "none";
  box.innerHTML = "";
  box.className = "status-alert";
}

function setChargeState(enabled, label) {
  const btn = chargeButton();
  btn.disabled = !enabled;
  btn.textContent = label;
}

function resetForNewSale() {
  currentVoucher = null;
  currentReceiptHtml = null;
  receiptWindow = null;

  const input = document.getElementById("voucherCodeInput");
  input.value = "";
  input.focus();

  document.getElementById("voucherLoaded").style.display = "none";
  document.getElementById("downloadReceiptBtn").style.display = "none";
  document.getElementById("printReceiptBtn").style.display = "none";
  document.getElementById("voucherMeta").textContent = "";
  document.getElementById("voucherItemsTable").innerHTML = "";
  document.getElementById("voucherTotal").textContent = "$0";
  clearStatusBox();
  setChargeState(true, "Cobrar y emitir boleta");
}

window.onReceiptWindowClosed = function () {
  renderCajero();
  resetForNewSale();
};

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

function renderVoucherUsageAlert(voucher) {
  const data = loadData();
  const info = getVoucherUsageInfo(data, voucher);

  if (voucher.status !== "Pendiente") {
    setChargeState(false, "⚠️ Voucher ya cobrado");
    setStatusBox("danger", "Este voucher ya fue cobrado", [
      `Voucher: <strong>${voucher.voucher_code}</strong>`,
      `Fecha de cobro: <strong>${info && info.date ? info.date : "No disponible"}</strong>`,
      `Cajero: <strong>${info && info.cashier ? info.cashier : "No disponible"}</strong>`,
      `Forma de pago: <strong>${info && info.paymentMethod ? info.paymentMethod : "No disponible"}</strong>`,
      `Total cobrado: <strong>${money(info && info.total ? info.total : voucher.total)}</strong>`
    ]);
    return;
  }

  setChargeState(true, "Cobrar y emitir boleta");
  setStatusBox("success", "Voucher listo para cobro", [
    `Voucher: <strong>${voucher.voucher_code}</strong>`,
    `Vendedor: <strong>${voucher.seller}</strong>`,
    `Total: <strong>${money(voucher.total)}</strong>`
  ]);
}

function lookupVoucher(inputCode) {
  const data = loadData();
  const digits = String(inputCode || "").replace(/\D/g, "").slice(-4);
  const voucher = findVoucherBySuffix(data, digits);
  if (!voucher) throw new Error("Voucher no encontrado.");

  currentVoucher = voucher;
  document.getElementById("voucherLoaded").style.display = "block";
  document.getElementById("voucherMeta").textContent =
    `Vendedor: ${voucher.seller} | Fecha: ${voucher.created_at} | Estado: ${voucher.status}`;

  document.getElementById("voucherItemsTable").innerHTML = voucher.items.map(item => `
    <tr><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.total)}</td></tr>
  `).join("");

  document.getElementById("voucherTotal").textContent = money(voucher.total);

  document.getElementById("downloadReceiptBtn").style.display = "none";
  document.getElementById("printReceiptBtn").style.display = "none";

  renderVoucherUsageAlert(voucher);

  if (voucher.status !== "Pendiente") {
    alert("⚠️ Este voucher ya fue cobrado. No se puede procesar nuevamente.");
  }
}

function openReceiptPage(receiptHtml) {
  receiptWindow = window.open("", "_blank");
  if (!receiptWindow) {
    alert("El navegador bloqueó la ventana de la boleta.");
    return false;
  }

  const finalHtml = receiptHtml.replace(
    "</body>",
    `<script>
      window.addEventListener("beforeunload", function () {
        try {
          if (window.opener && !window.opener.closed && window.opener.onReceiptWindowClosed) {
            window.opener.onReceiptWindowClosed();
          }
        } catch (e) {}
      });
    <\/script></body>`
  );

  receiptWindow.document.open();
  receiptWindow.document.write(finalHtml);
  receiptWindow.document.close();
  receiptWindow.focus();
  return true;
}

const voucherInput = document.getElementById("voucherCodeInput");
voucherInput.addEventListener("input", () => {
  const digits = voucherInput.value.replace(/\D/g, "").slice(-4);
  voucherInput.value = digits;
  if (digits.length === 4) {
    try {
      lookupVoucher(digits);
    } catch (error) {
      clearStatusBox();
      setChargeState(true, "Cobrar y emitir boleta");
    }
  } else {
    clearStatusBox();
    setChargeState(true, "Cobrar y emitir boleta");
  }
});

document.getElementById("voucherLookupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    lookupVoucher(document.getElementById("voucherCodeInput").value.replace(/\D/g, "").slice(-4));
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
  const suffix = String(voucherSuffixNumber(pending.voucher_code) || 0).padStart(4, "0");
  document.getElementById("voucherCodeInput").value = suffix;
  lookupVoucher(suffix);
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

  const data = loadData();
  const freshVoucher = data.vouchers.find(item => item.id === currentVoucher.id);

  if (!freshVoucher) {
    alert("El voucher ya no existe.");
    resetForNewSale();
    return;
  }

  if (freshVoucher.status !== "Pendiente") {
    currentVoucher = freshVoucher;
    alert("⚠️ Este voucher ya fue cobrado. No se puede procesar nuevamente.");
    renderVoucherUsageAlert(freshVoucher);
    document.getElementById("voucherMeta").textContent =
      `Vendedor: ${freshVoucher.seller} | Fecha: ${freshVoucher.created_at} | Estado: ${freshVoucher.status}`;
    return;
  }

  const paymentMethod = selectedPaymentMethod();

  for (const item of freshVoucher.items) {
    const product = data.products.find(p => p.id === item.product_id);
    if (!product || product.stock < item.quantity) {
      alert(`Stock insuficiente para ${item.product}.`);
      return;
    }
  }

  freshVoucher.items.forEach(item => {
    const product = data.products.find(p => p.id === item.product_id);
    product.stock -= item.quantity;
    data.sales.push({
      id: nextId(data.sales),
      voucher_code: freshVoucher.voucher_code,
      seller: freshVoucher.seller,
      product_id: item.product_id,
      product: item.product,
      quantity: item.quantity,
      total: item.total,
      cashier: user.email,
      payment_method: paymentMethod,
      created_at: nowString()
    });
  });

  freshVoucher.status = "Cobrado";

  const receipt = {
    id: data.receipts.length ? Math.max(...data.receipts.map(item => item.id)) + 1 : 321,
    voucher_id: freshVoucher.id,
    amount: freshVoucher.total,
    status: "Emitida",
    created_at: dateOnly(),
    payment_method: paymentMethod
  };
  data.receipts.push(receipt);
  saveData(data);

  currentVoucher = freshVoucher;
  currentReceiptHtml = buildReceiptHtml(receipt, freshVoucher, user.email, paymentMethod);

  const opened = openReceiptPage(currentReceiptHtml);
  if (!opened) return;

  renderVoucherUsageAlert(freshVoucher);
  renderCajero();
});

document.getElementById("downloadReceiptBtn").addEventListener("click", () => {
  alert("Ahora la boleta se abre en una página nueva al cobrar. Desde ahí puedes imprimirla o guardarla.");
});

document.getElementById("printReceiptBtn").addEventListener("click", () => {
  if (!receiptWindow || receiptWindow.closed) {
    alert("Primero debes emitir la boleta para abrirla.");
    return;
  }
  receiptWindow.focus();
  receiptWindow.print();
});

renderCajero();
