const sellerUser = requireRole("Vendedor");
let sellerCart = [];

function renderSellerCart() {
  const tbody = document.getElementById("sellerCartTable");
  const total = sellerCart.reduce((sum, item) => sum + Number(item.total), 0);
  document.getElementById("sellerCartTotal").textContent = money(total);
  tbody.innerHTML = sellerCart.map((item, index) => `
    <tr>
      <td>${item.productName}</td>
      <td>${item.quantity}</td>
      <td>${money(item.total)}</td>
      <td><button class="btn secondary small" data-remove="${index}">Quitar</button></td>
    </tr>
  `).join("") || `<tr><td colspan="4">Aún no hay productos en el voucher.</td></tr>`;

  tbody.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sellerCart.splice(Number(btn.dataset.remove), 1);
      renderSellerCart();
    });
  });
}

async function loadSellerProducts() {
  const products = await api("/api/products");
  const select = document.getElementById("sellerProduct");
  select.innerHTML = products.map(item =>
    `<option value="${item.id}" data-price="${item.price}">${item.name} - ${money(item.price)} (${item.stock} stock)</option>`
  ).join("");
}

async function loadSellerVouchers() {
  const vouchers = await api("/api/vouchers");
  const tbody = document.getElementById("sellerVoucherTable");
  tbody.innerHTML = vouchers.map(item => `
    <tr>
      <td>${item.voucher_code}</td>
      <td>${item.created_at}</td>
      <td>${money(item.total)}</td>
      <td>${item.status}</td>
      <td><a class="btn secondary small" href="/api/vouchers/${item.voucher_code}/download">Descargar</a></td>
    </tr>
  `).join("");
}

document.getElementById("sellerItemForm").addEventListener("submit", async (e) => {
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
});

document.getElementById("generateVoucherBtn").addEventListener("click", async () => {
  if (!sellerCart.length) {
    alert("Agrega productos antes de emitir el baucher.");
    return;
  }
  try {
    const result = await api("/api/vouchers", {
      method: "POST",
      body: JSON.stringify({
        seller: sellerUser ? sellerUser.email : "vendedor@lacentral.cl",
        items: sellerCart.map(item => ({ productId: item.productId, quantity: item.quantity }))
      })
    });
    document.getElementById("downloadVoucherBtn").href = result.downloadUrl;
    document.getElementById("downloadVoucherBtn").style.display = "inline-block";
    document.getElementById("sellerNotice").textContent = `Baucher emitido: ${result.voucherCode}. Ahora el cajero puede cobrarlo usando ese código.`;
    document.getElementById("sellerNotice").style.display = "block";
    sellerCart = [];
    renderSellerCart();
    await loadSellerVouchers();
  } catch (error) {
    alert(error.message);
  }
});

renderSellerCart();
loadSellerProducts();
loadSellerVouchers();
