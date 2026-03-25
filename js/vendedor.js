const sellerUser = requireRole("Vendedor");
let sellerCart = [];

function renderSellerCart() {
  const tbody = document.getElementById("sellerCartTable");
  const total = sellerCart.reduce((sum, item) => sum + Number(item.total), 0);
  document.getElementById("sellerCartTotal").textContent = money(total);
  tbody.innerHTML = sellerCart.map((item, index) => `
    <tr><td>${item.productName}</td><td>${item.quantity}</td><td>${money(item.total)}</td><td><button class="btn secondary small" data-remove="${index}">Quitar</button></td></tr>
  `).join("") || `<tr><td colspan="4">Aún no hay productos en el voucher.</td></tr>`;

  tbody.querySelectorAll("[data-remove]").forEach(btn => {
    btn.onclick = () => {
      sellerCart.splice(Number(btn.dataset.remove), 1);
      renderSellerCart();
    };
  });
}

function loadSellerProducts(selectedId = null) {
  const products = loadData().products;
  document.getElementById("sellerProduct").innerHTML = products.map(item =>
    `<option value="${item.id}" data-price="${item.price}" data-barcode="${item.barcode || ""}" ${selectedId === item.id ? "selected" : ""}>${item.name} - ${money(item.price)} (${item.stock} stock)</option>`
  ).join("");
}

function loadSellerVouchers() {
  const data = loadData();
  document.getElementById("sellerVoucherTable").innerHTML = data.vouchers.slice().reverse().map(item => {
    const url = downloadHtml(`${item.voucher_code}.html`, buildVoucherHtml(item));
    return `<tr><td>${item.voucher_code}</td><td>${item.created_at}</td><td>${money(item.total)}</td><td>${item.status}</td><td><a class="btn secondary small" href="${url}" download="${item.voucher_code}.html">Descargar</a></td></tr>`;
  }).join("");
}


document.getElementById("sellerBarcodeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = loadData();
  const query = document.getElementById("sellerBarcodeInput").value.trim();
  const product = findProductByBarcodeOrName(data, query);
  const notice = document.getElementById("sellerNotice");
  if (!product) {
    notice.textContent = "No se encontró un producto con ese código o nombre.";
    notice.style.display = "block";
    return;
  }
  loadSellerProducts(product.id);
  notice.textContent = `Producto encontrado: ${product.name} (${money(product.price)}).`;
  notice.style.display = "block";
});

document.getElementById("sellerItemForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const select = document.getElementById("sellerProduct");
  const option = select.options[select.selectedIndex];
  const quantity = Number(document.getElementById("sellerQty").value || 1);
  const price = Number(option.dataset.price);
  sellerCart.push({
    productId: Number(select.value),
    productName: option.textContent.split(" - ")[0],
    quantity,
    unitPrice: price,
    total: price * quantity
  });
  renderSellerCart();
  e.target.reset();
  loadSellerProducts();
document.getElementById("sellerNotice").style.display = "none";
});

document.getElementById("generateVoucherBtn").addEventListener("click", () => {
  if (!sellerCart.length) return alert("Agrega productos antes de emitir el baucher.");
  const data = loadData();
  const voucherCode = "VCH-" + String(Date.now()).slice(-8);
  const voucher = {
    id: nextId(data.vouchers),
    voucher_code: voucherCode,
    seller: sellerUser.email,
    total: sellerCart.reduce((sum, item) => sum + Number(item.total), 0),
    status: "Pendiente",
    created_at: nowString(),
    items: sellerCart.map(item => ({
      product_id: item.productId,
      product: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total
    }))
  };
  data.vouchers.push(voucher);
  saveData(data);

  const url = downloadHtml(`${voucher.voucher_code}.html`, buildVoucherHtml(voucher));
  const link = document.getElementById("downloadVoucherBtn");
  link.href = url;
  link.download = `${voucher.voucher_code}.html`;
  link.style.display = "inline-block";

  const notice = document.getElementById("sellerNotice");
  notice.textContent = `Baucher emitido: ${voucher.voucher_code}. Ahora el cajero puede cobrarlo usando ese código.`;
  notice.style.display = "block";

  sellerCart = [];
  renderSellerCart();
  loadSellerVouchers();
});

renderSellerCart();
loadSellerProducts();
document.getElementById("sellerNotice").style.display = "none";
loadSellerVouchers();
