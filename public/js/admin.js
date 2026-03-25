requireRole("Administrador");

async function loadDashboard() {
  const data = await api("/api/dashboard");
  document.getElementById("dashSales").textContent = money(data.totalSales);
  document.getElementById("dashReceipts").textContent = data.receiptCount;
  document.getElementById("dashProducts").textContent = data.productCount;
  document.getElementById("dashUsers").textContent = data.userCount;
  const pending = document.getElementById("dashPendingVouchers");
  if (pending) pending.textContent = data.pendingVouchers;
}

async function loadProducts() {
  const items = await api("/api/products");
  const productTable = document.getElementById("productTable");
  const stockTable = document.getElementById("stockTable");

  productTable.innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${money(item.price)}</td>
      <td>${item.stock}</td>
      <td><button class="btn secondary small" onclick="deleteProduct(${item.id})">Eliminar</button></td>
    </tr>
  `).join("");

  stockTable.innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.stock}</td>
      <td>${item.min_stock}</td>
      <td><button class="btn primary small" onclick="restockProduct(${item.id})">+5</button></td>
    </tr>
  `).join("");
}

async function loadReceipts() {
  const items = await api("/api/receipts");
  document.getElementById("receiptTable").innerHTML = items.map(item => `
    <tr>
      <td>${item.id}</td>
      <td>${item.created_at}</td>
      <td>${money(item.amount)}</td>
      <td>${item.status}</td>
      <td><button class="btn secondary small" onclick="toggleReceipt(${item.id})">Cambiar</button></td>
    </tr>
  `).join("");
}

async function loadUsers() {
  const items = await api("/api/users");
  document.getElementById("userTable").innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.email}</td>
      <td>${item.role}</td>
    </tr>
  `).join("");
}

async function deleteProduct(id) {
  await api(`/api/products/${id}`, { method: "DELETE" });
  refreshAdmin();
}

async function restockProduct(id) {
  await api(`/api/products/${id}/restock`, { method: "POST", body: JSON.stringify({ amount: 5 }) });
  refreshAdmin();
}

async function toggleReceipt(id) {
  await api(`/api/receipts/${id}/toggle`, { method: "PATCH" });
  refreshAdmin();
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await api("/api/products", {
    method: "POST",
    body: JSON.stringify({
      name: document.getElementById("productName").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      barcode: document.getElementById("productBarcode").value.trim(),
      stock: Number(document.getElementById("productStock").value),
      minStock: Number(document.getElementById("productMinStock").value)
    })
  });
  e.target.reset();
  refreshAdmin();
});

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const result = await api("/api/users", {
    method: "POST",
    body: JSON.stringify({
      name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      role: document.getElementById("userRole").value
    })
  });
  alert(`Usuario creado. Contraseña temporal: ${result.password}`);
  e.target.reset();
  refreshAdmin();
});

async function refreshAdmin() {
  await Promise.all([loadDashboard(), loadProducts(), loadReceipts(), loadUsers()]);
}
refreshAdmin();
