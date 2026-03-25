const STORAGE_KEYS = {
  user: "botilleriaUser",
  data: "botilleriaData",
};

const DEFAULT_DATA = {
  products: [
    { id: 1, name: "Whisky Johnnie Walker", price: 22990, barcode: "7801111111111", stock: 8, minStock: 3 },
    { id: 2, name: "Pack Cervezas Cristal", price: 5990, barcode: "7802222222222", stock: 24, minStock: 8 },
    { id: 3, name: "Vino Cabernet", price: 6500, barcode: "7803333333333", stock: 12, minStock: 4 },
    { id: 4, name: "Ron Havana Club", price: 13990, barcode: "7804444444444", stock: 5, minStock: 3 },
    { id: 5, name: "Red Bull", price: 1990, barcode: "7805555555555", stock: 6, minStock: 10 }
  ],
  users: [
    { id: 1, name: "Admin Principal", email: "admin@lacentral.cl", role: "Administrador" },
    { id: 2, name: "Caja 1", email: "cajero@lacentral.cl", role: "Cajero" },
    { id: 3, name: "Supervisor Local", email: "supervisor@lacentral.cl", role: "Supervisor" }
  ],
  sales: [
    { id: 1, productId: 1, product: "Whisky Johnnie Walker", quantity: 1, total: 22990, cashier: "Caja 1", paymentMethod: "Tarjeta", date: "2025-10-10 12:31" },
    { id: 2, productId: 2, product: "Pack Cervezas Cristal", quantity: 2, total: 11980, cashier: "Caja 1", paymentMethod: "Efectivo", date: "2025-10-10 13:04" },
    { id: 3, productId: 3, product: "Vino Cabernet", quantity: 1, total: 6500, cashier: "Caja 1", paymentMethod: "Transferencia", date: "2025-10-10 13:20" }
  ],
  receipts: [
    { id: 321, saleId: 1, amount: 22990, status: "Emitida", date: "2025-10-10" },
    { id: 322, saleId: 2, amount: 11980, status: "Emitida", date: "2025-10-10" },
    { id: 323, saleId: 3, amount: 6500, status: "Pendiente", date: "2025-10-10" }
  ],
  cash: {
    opening: 50000
  }
};

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEYS.data);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(DEFAULT_DATA));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  try {
    const parsed = JSON.parse(raw);
    return { ...JSON.parse(JSON.stringify(DEFAULT_DATA)), ...parsed };
  } catch (error) {
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(DEFAULT_DATA));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(data));
}

function formatCurrency(value) {
  return "$" + Number(value || 0).toLocaleString("es-CL");
}

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => Number(item.id) || 0)) + 1 : 1;
}

function todayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function dateOnly() {
  return todayString().slice(0, 10);
}

function ensureData() {
  return loadData();
}
