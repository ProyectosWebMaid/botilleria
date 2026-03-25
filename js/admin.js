protectPage("Administrador");
const adminData = ensureData();

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderAdminDashboard() {
  const data = loadData();
  const totalSales = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  setText("adminSalesTotal", formatCurrency(totalSales));
  setText("adminReceiptCount", String(data.receipts.length));
  setText("adminProductCount", String(data.products.length));
  setText("adminUserCount", String(data.users.length));

  const salesTable = document.getElementById("adminSalesTable");
  if (salesTable) {
    salesTable.innerHTML = data.sales.slice().reverse().slice(0, 6).map((sale) => `
      <tr>
        <td>${sale.date}</td>
        <td>${sale.product}</td>
        <td>${sale.cashier}</td>
        <td>${formatCurrency(sale.total)}</td>
      </tr>
    `).join("");
  }
}

function renderProducts() {
  const data = loadData();
  const list = document.getElementById("productList");
  if (!list) return;
  list.innerHTML = data.products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${product.barcode}</td>
      <td>${product.stock}</td>
      <td><button class="btn secondary small" data-delete-product="${product.id}">Eliminar</button></td>
    </tr>
  `).join("") || `<tr><td colspan="5">No hay productos cargados.</td></tr>`;

  list.querySelectorAll("[data-delete-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.deleteProduct);
      const current = loadData();
      current.products = current.products.filter((item) => item.id !== id);
      saveData(current);
      renderAllAdmin();
      renderAllSupervisor();
      renderAllCajero();
    });
  });
}

function bindProductForm() {
  const form = document.getElementById("productForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = loadData();
    const product = {
      id: nextId(data.products),
      name: document.getElementById("productName").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      barcode: document.getElementById("productBarcode").value.trim(),
      stock: Number(document.getElementById("productStock").value),
      minStock: Number(document.getElementById("productMinStock").value || 1),
    };
    if (!product.name || !product.price) {
      alert("Completa nombre y precio.");
      return;
    }
    data.products.push(product);
    saveData(data);
    form.reset();
    renderAllAdmin();
    renderAllSupervisor();
    renderAllCajero();
  });
}

function renderStock() {
  const data = loadData();
  const table = document.getElementById("stockList");
  if (!table) return;
  table.innerHTML = data.products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>${product.stock}</td>
      <td>${product.minStock}</td>
      <td>${product.stock <= product.minStock ? "Bajo" : "Normal"}</td>
      <td><button class="btn primary small" data-restock="${product.id}">+5</button></td>
    </tr>
  `).join("");

  table.querySelectorAll("[data-restock]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.restock);
      const current = loadData();
      const product = current.products.find((item) => item.id === id);
      if (product) product.stock += 5;
      saveData(current);
      renderAllAdmin();
      renderAllSupervisor();
      renderAllCajero();
    });
  });
}

function renderReceipts() {
  const data = loadData();
  const table = document.getElementById("receiptList");
  if (!table) return;
  table.innerHTML = data.receipts.slice().reverse().map((receipt) => `
    <tr>
      <td>${receipt.id}</td>
      <td>${receipt.date}</td>
      <td>${formatCurrency(receipt.amount)}</td>
      <td>${receipt.status}</td>
      <td><button class="btn secondary small" data-toggle-receipt="${receipt.id}">${receipt.status === "Emitida" ? "Marcar pendiente" : "Emitir"}</button></td>
    </tr>
  `).join("");

  table.querySelectorAll("[data-toggle-receipt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.toggleReceipt);
      const current = loadData();
      const receipt = current.receipts.find((item) => item.id === id);
      if (receipt) receipt.status = receipt.status === "Emitida" ? "Pendiente" : "Emitida";
      saveData(current);
      renderAllAdmin();
      renderAllSupervisor();
    });
  });
}

function renderUsers() {
  const data = loadData();
  const list = document.getElementById("userList");
  if (!list) return;
  list.innerHTML = data.users.map((user) => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td><button class="btn secondary small" data-delete-user="${user.id}">Eliminar</button></td>
    </tr>
  `).join("");

  list.querySelectorAll("[data-delete-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.deleteUser);
      const current = loadData();
      current.users = current.users.filter((item) => item.id !== id || item.email === "admin@lacentral.cl");
      saveData(current);
      renderAllAdmin();
    });
  });
}

function bindUserForm() {
  const form = document.getElementById("userForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = loadData();
    const user = {
      id: nextId(data.users),
      name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      role: document.getElementById("userRole").value,
    };
    if (!user.name || !user.email) {
      alert("Completa nombre y correo.");
      return;
    }
    data.users.push(user);
    saveData(data);
    form.reset();
    renderAllAdmin();
  });
}

function renderReports() {
  const data = loadData();
  const totalSales = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalQty = data.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const lowStock = data.products.filter((item) => item.stock <= item.minStock).length;
  setText("reportSales", formatCurrency(totalSales));
  setText("reportReceipts", String(data.receipts.length));
  setText("reportUnits", String(totalQty));
  setText("reportLowStock", String(lowStock));
}

function renderAllAdmin() {
  renderAdminDashboard();
  renderProducts();
  renderStock();
  renderReceipts();
  renderUsers();
  renderReports();
}

bindProductForm();
bindUserForm();
renderAllAdmin();
