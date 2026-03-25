const STORAGE_KEY = "botilleriaGithubPagesData";
const SESSION_KEY = "botilleriaGithubPagesUser";

const DEFAULT_DATA = {
  users: [
    { id: 1, name: "Admin Principal", email: "admin@lacentral.cl", password: "123456", role: "Administrador" },
    { id: 2, name: "Caja 1", email: "cajero@lacentral.cl", password: "123456", role: "Cajero" },
    { id: 3, name: "Supervisor Local", email: "supervisor@lacentral.cl", password: "123456", role: "Supervisor" },
    { id: 4, name: "Vendedor 1", email: "vendedor@lacentral.cl", password: "123456", role: "Vendedor" }
  ],
  products: [
    { id: 1, name: "Whisky Johnnie Walker", price: 22990, barcode: "7801111111111", stock: 8, min_stock: 3 },
    { id: 2, name: "Pack Cervezas Cristal", price: 5990, barcode: "7802222222222", stock: 24, min_stock: 8 },
    { id: 3, name: "Vino Cabernet", price: 6500, barcode: "7803333333333", stock: 12, min_stock: 4 },
    { id: 4, name: "Ron Havana Club", price: 13990, barcode: "7804444444444", stock: 5, min_stock: 3 },
    { id: 5, name: "Red Bull", price: 1990, barcode: "7805555555555", stock: 6, min_stock: 10 }
  ],
  vouchers: [
    {
      id: 1,
      voucher_code: "VCH-10000001",
      seller: "vendedor@lacentral.cl",
      total: 28980,
      status: "Pendiente",
      created_at: "2025-10-10 12:20",
      items: [
        { product_id: 1, product: "Whisky Johnnie Walker", quantity: 1, unit_price: 22990, total: 22990 },
        { product_id: 3, product: "Vino Cabernet", quantity: 1, unit_price: 6500, total: 6500 }
      ]
    }
  ],
  sales: [
    { id: 1, voucher_code: "VCH-99990001", seller: "vendedor@lacentral.cl", product_id: 2, product: "Pack Cervezas Cristal", quantity: 2, total: 11980, cashier: "cajero@lacentral.cl", payment_method: "Cobro en caja", created_at: "2025-10-10 13:04" }
  ],
  receipts: [
    { id: 321, voucher_id: 1, amount: 28980, status: "Pendiente", created_at: "2025-10-10" }
  ]
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return clone(DEFAULT_DATA);
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return clone(DEFAULT_DATA);
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetData() {
  saveData(clone(DEFAULT_DATA));
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function requireRole(expectedRole) {
  const user = getSession();
  if (!user || user.role !== expectedRole) {
    window.location.href = "../index.html";
    return null;
  }
  const welcomeText = document.getElementById("welcomeText");
  if (welcomeText) welcomeText.textContent = `Bienvenido/a ${user.email} - Rol asignado: ${user.role}`;
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => {
    clearSession();
    window.location.href = "../index.html";
  };
  return user;
}

function money(value) {
  return "$" + Number(value || 0).toLocaleString("es-CL");
}

function nextId(items, field = "id") {
  return items.length ? Math.max(...items.map(item => Number(item[field]) || 0)) + 1 : 1;
}

function nowString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

function dateOnly() {
  return nowString().slice(0, 10);
}

function stats(data) {
  return {
    totalSales: data.sales.reduce((sum, item) => sum + Number(item.total), 0),
    saleCount: data.sales.length,
    totalUnits: data.sales.reduce((sum, item) => sum + Number(item.quantity), 0),
    receiptCount: data.receipts.length,
    productCount: data.products.length,
    userCount: data.users.length,
    lowStockCount: data.products.filter(item => item.stock <= item.min_stock).length,
    pendingVouchers: data.vouchers.filter(item => item.status === "Pendiente").length
  };
}

function buildVoucherHtml(voucher) {
  const rows = voucher.items.map(item => `
    <tr><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.unit_price)}</td><td>${money(item.total)}</td></tr>
  `).join("");
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${voucher.voucher_code}</title><style>
  body{font-family:Arial,sans-serif;padding:24px;color:#222}.ticket{max-width:720px;margin:0 auto;border:1px solid #ddd;border-radius:16px;padding:24px}
  h1{margin:0 0 8px;color:#7b1e1e}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:10px;border-bottom:1px solid #eee}
  .code{display:inline-block;padding:8px 12px;background:#f5e8e8;border-radius:999px;color:#7b1e1e;font-weight:bold}.totals{margin-top:18px;font-size:18px;font-weight:bold}
  </style></head><body><div class="ticket"><h1>Botillería La Central</h1><p><strong>Baucher de venta preparada</strong></p><p><span class="code">${voucher.voucher_code}</span></p><p>Vendedor: ${voucher.seller}</p><p>Fecha: ${voucher.created_at}</p><p>Estado: ${voucher.status}</p><table><thead><tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="totals">Total voucher: ${money(voucher.total)}</div></div></body></html>`;
}

function buildReceiptHtml(receipt, voucher, cashierEmail) {
  const rows = voucher.items.map(item => `
    <tr><td>${item.product}</td><td>${item.quantity}</td><td>${money(item.unit_price)}</td><td>${money(item.total)}</td></tr>
  `).join("");
  const subtotal = voucher.items.reduce((sum, item) => sum + Number(item.total), 0);
  const iva = Math.round(subtotal * 0.19 / 1.19);
  const neto = subtotal - iva;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Boleta ${receipt.id}</title><style>
  body{font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;color:#222}.boleta{max-width:760px;margin:0 auto;background:white;border:1px solid #ddd;border-radius:16px;padding:28px}
  h1{margin:0 0 6px;color:#7b1e1e}.small{color:#666;margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:10px;border-bottom:1px solid #eee}
  .totals{margin-top:18px}.totals p{margin:6px 0}.final{font-size:22px;font-weight:bold;color:#7b1e1e}.stamp{margin-top:20px;padding:12px 14px;border-radius:12px;background:#f5e8e8;color:#7b1e1e;display:inline-block;font-weight:bold}
  </style></head><body><div class="boleta"><h1>BOTILLERÍA LA CENTRAL</h1><p class="small">Simulación de boleta electrónica chilena</p><p class="small">Boleta N° ${receipt.id}</p><p class="small">Fecha: ${receipt.created_at}</p><p class="small">Cajero: ${cashierEmail}</p><p class="small">Vendedor: ${voucher.seller}</p><p class="small">Voucher origen: ${voucher.voucher_code}</p><table><thead><tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><p>Neto aproximado: ${money(neto)}</p><p>IVA incluido aproximado: ${money(iva)}</p><p class="final">TOTAL: ${money(receipt.amount)}</p></div><div class="stamp">Documento de simulación descargable</div></div></body></html>`;
}

function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  return URL.createObjectURL(blob);
}
