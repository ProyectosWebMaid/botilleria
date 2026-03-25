requireRole("Administrador");

function renderAdmin() {
  const data = loadData();
  const s = stats(data);
  document.getElementById("dashSales").textContent = money(s.totalSales);
  document.getElementById("dashReceipts").textContent = s.receiptCount;
  document.getElementById("dashProducts").textContent = s.productCount;
  document.getElementById("dashUsers").textContent = s.userCount;
  document.getElementById("dashPending").textContent = s.pendingVouchers;

  document.getElementById("productTable").innerHTML = data.products.map(item => `
    <tr><td>${item.name}</td><td>${money(item.price)}</td><td>${item.stock}</td><td><button class="btn secondary small" data-del="${item.id}">Eliminar</button></td></tr>
  `).join("");

  document.getElementById("stockTable").innerHTML = data.products.map(item => `
    <tr><td>${item.name}</td><td>${item.stock}</td><td>${item.min_stock}</td><td><button class="btn primary small" data-add="${item.id}">+5</button></td></tr>
  `).join("");

  document.getElementById("receiptTable").innerHTML = data.receipts.slice().reverse().map(receipt => {
    const voucher = data.vouchers.find(v => v.id === receipt.voucher_id);
    const html = buildReceiptHtml(receipt, voucher || { seller: "-", voucher_code: "-", items: [] }, "-");
    const url = downloadHtml(`boleta-${receipt.id}.html`, html);
    return `<tr><td>${receipt.id}</td><td>${receipt.created_at}</td><td>${money(receipt.amount)}</td><td>${receipt.status}</td><td><a class="btn secondary small" href="${url}" download="boleta-${receipt.id}.html">Descargar</a></td></tr>`;
  }).join("");

  document.getElementById("userTable").innerHTML = data.users.map(user => `
    <tr><td>${user.name}</td><td>${user.email}</td><td>${user.role}</td></tr>
  `).join("");

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.del);
      const current = loadData();
      current.products = current.products.filter(item => item.id !== id);
      saveData(current);
      renderAdmin();
    };
  });

  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.add);
      const current = loadData();
      const item = current.products.find(p => p.id === id);
      if (item) item.stock += 5;
      saveData(current);
      renderAdmin();
    };
  });
}

document.getElementById("productForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = loadData();
  data.products.push({
    id: nextId(data.products),
    name: document.getElementById("productName").value.trim(),
    price: Number(document.getElementById("productPrice").value),
    barcode: document.getElementById("productBarcode").value.trim(),
    stock: Number(document.getElementById("productStock").value),
    min_stock: Number(document.getElementById("productMinStock").value)
  });
  saveData(data);
  e.target.reset();
  renderAdmin();
});

document.getElementById("userForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = loadData();
  data.users.push({
    id: nextId(data.users),
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    password: "123456",
    role: document.getElementById("userRole").value
  });
  saveData(data);
  alert("Usuario creado con contraseña temporal 123456");
  e.target.reset();
  renderAdmin();
});

document.getElementById("resetDataBtn").onclick = () => {
  if (confirm("¿Reiniciar todos los datos de la demo?")) {
    resetData();
    renderAdmin();
  }
};

renderAdmin();
