const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, "database", "botilleria.db");
const sqlPath = path.join(__dirname, "database", "init.sql");

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
const initSql = fs.readFileSync(sqlPath, "utf8");
db.exec(initSql);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function authUser(email, password, role) {
  return db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ? AND role = ?").get(email, password, role);
}

function dashboardStats() {
  const sales = db.prepare("SELECT COALESCE(SUM(total),0) as total_sales, COUNT(*) as sale_count, COALESCE(SUM(quantity),0) as total_units FROM sales").get();
  const receipts = db.prepare("SELECT COUNT(*) as count FROM receipts").get();
  const products = db.prepare("SELECT COUNT(*) as count FROM products").get();
  const users = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock <= min_stock").get();
  const vouchers = db.prepare("SELECT COUNT(*) as count FROM vouchers WHERE status = 'Pendiente'").get();

  return {
    totalSales: sales.total_sales || 0,
    saleCount: sales.sale_count || 0,
    totalUnits: sales.total_units || 0,
    receiptCount: receipts.count || 0,
    productCount: products.count || 0,
    userCount: users.count || 0,
    lowStockCount: lowStock.count || 0,
    pendingVouchers: vouchers.count || 0
  };
}

function getVoucherWithItems(voucherCode) {
  const voucher = db.prepare("SELECT * FROM vouchers WHERE voucher_code = ?").get(voucherCode);
  if (!voucher) return null;
  const items = db.prepare("SELECT * FROM voucher_items WHERE voucher_id = ? ORDER BY id ASC").all(voucher.id);
  return { ...voucher, items };
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-CL").format(Number(value || 0));
}

function voucherHtml(voucher, items) {
  const rows = items.map(item => `
    <tr>
      <td>${item.product}</td>
      <td>${item.quantity}</td>
      <td>$${formatMoney(item.unit_price)}</td>
      <td>$${formatMoney(item.total)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Baucher ${voucher.voucher_code}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
      .ticket { max-width: 720px; margin: 0 auto; border: 1px solid #ddd; border-radius: 16px; padding: 24px; }
      h1 { margin: 0 0 8px; color: #7b1e1e; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
      .code { display: inline-block; padding: 8px 12px; background: #f5e8e8; border-radius: 999px; color: #7b1e1e; font-weight: bold; }
      .totals { margin-top: 18px; font-size: 18px; font-weight: bold; }
      .note { margin-top: 20px; color: #666; }
    </style>
  </head>
  <body>
    <div class="ticket">
      <h1>Botillería La Central</h1>
      <p><strong>Baucher de venta preparada</strong></p>
      <p><span class="code">${voucher.voucher_code}</span></p>
      <p>Vendedor: ${voucher.seller}</p>
      <p>Fecha: ${voucher.created_at}</p>
      <p>Estado: ${voucher.status}</p>
      <table>
        <thead>
          <tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">Total voucher: $${formatMoney(voucher.total)}</div>
      <p class="note">Este baucher debe ser presentado en caja. El cajero lo busca o lo escanea por código para cobrar y emitir la boleta.</p>
    </div>
  </body>
  </html>`;
}

function receiptHtml(receipt, sale, items) {
  const rows = items.map(item => `
    <tr>
      <td>${item.product}</td>
      <td>${item.quantity}</td>
      <td>$${formatMoney(item.unit_price)}</td>
      <td>$${formatMoney(item.total)}</td>
    </tr>
  `).join("");

  const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
  const iva = Math.round(subtotal * 0.19 / 1.19);
  const neto = subtotal - iva;

  return `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Boleta ${receipt.id}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f7f7f7; padding: 24px; color: #222; }
      .boleta { max-width: 760px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 16px; padding: 28px; }
      h1 { margin: 0 0 6px; color: #7b1e1e; }
      .small { color: #666; margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
      .totals { margin-top: 18px; }
      .totals p { margin: 6px 0; }
      .final { font-size: 22px; font-weight: bold; color: #7b1e1e; }
      .stamp { margin-top: 20px; padding: 12px 14px; border-radius: 12px; background: #f5e8e8; color: #7b1e1e; display: inline-block; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="boleta">
      <h1>BOTILLERÍA LA CENTRAL</h1>
      <p class="small">Simulación de boleta electrónica chilena</p>
      <p class="small">Boleta N° ${receipt.id}</p>
      <p class="small">Fecha: ${receipt.created_at}</p>
      <p class="small">Cajero: ${sale.cashier}</p>
      <p class="small">Vendedor que preparó la venta: ${sale.seller || "No informado"}</p>
      <p class="small">Voucher origen: ${sale.voucher_code || "-"}</p>
      <table>
        <thead>
          <tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <p>Neto aproximado: $${formatMoney(neto)}</p>
        <p>IVA incluido aproximado: $${formatMoney(iva)}</p>
        <p class="final">TOTAL: $${formatMoney(receipt.amount)}</p>
      </div>
      <div class="stamp">Documento de simulación descargable</div>
    </div>
  </body>
  </html>`;
}

app.post("/api/login", (req, res) => {
  const { email, password, role } = req.body;
  const user = authUser(email, password, role);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Credenciales incorrectas" });
  }
  res.json({ ok: true, user });
});

app.get("/api/dashboard", (req, res) => {
  res.json(dashboardStats());
});

app.get("/api/products", (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
  res.json(rows);
});

app.post("/api/products", (req, res) => {
  const { name, price, barcode, stock, minStock } = req.body;
  if (!name || !price) return res.status(400).json({ ok: false, message: "Faltan datos" });
  const result = db.prepare("INSERT INTO products (name, price, barcode, stock, min_stock) VALUES (?, ?, ?, ?, ?)").run(
    name, Number(price), barcode || "", Number(stock || 0), Number(minStock || 1)
  );
  res.json({ ok: true, id: result.lastInsertRowid });
});

app.delete("/api/products/:id", (req, res) => {
  db.prepare("DELETE FROM products WHERE id = ?").run(Number(req.params.id));
  res.json({ ok: true });
});

app.post("/api/products/:id/restock", (req, res) => {
  const amount = Number(req.body.amount || 5);
  db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(amount, Number(req.params.id));
  res.json({ ok: true });
});

app.get("/api/users", (req, res) => {
  const rows = db.prepare("SELECT id, name, email, role FROM users ORDER BY id DESC").all();
  res.json(rows);
});

app.post("/api/users", (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) return res.status(400).json({ ok: false, message: "Faltan datos" });
  const password = "123456";
  const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, password, role);
  res.json({ ok: true, id: result.lastInsertRowid, password });
});

app.get("/api/sales", (req, res) => {
  const rows = db.prepare("SELECT * FROM sales ORDER BY id DESC").all();
  res.json(rows);
});

app.get("/api/receipts", (req, res) => {
  const rows = db.prepare("SELECT * FROM receipts ORDER BY id DESC").all();
  res.json(rows);
});

app.patch("/api/receipts/:id/toggle", (req, res) => {
  const receipt = db.prepare("SELECT * FROM receipts WHERE id = ?").get(Number(req.params.id));
  if (!receipt) return res.status(404).json({ ok: false, message: "Boleta no encontrada" });
  const nextStatus = receipt.status === "Emitida" ? "Pendiente" : "Emitida";
  db.prepare("UPDATE receipts SET status = ? WHERE id = ?").run(nextStatus, receipt.id);
  res.json({ ok: true, status: nextStatus });
});

app.get("/api/vouchers", (req, res) => {
  const vouchers = db.prepare("SELECT * FROM vouchers ORDER BY id DESC").all();
  res.json(vouchers);
});

app.post("/api/vouchers", (req, res) => {
  const { seller, items } = req.body;
  if (!seller || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ ok: false, message: "Debes enviar vendedor e items." });
  }

  const voucherCode = "VCH-" + Date.now().toString().slice(-8);
  const createdAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  let total = 0;
  const preparedItems = items.map((row) => {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(row.productId));
    if (!product) throw new Error("Producto no encontrado");
    const quantity = Number(row.quantity || 1);
    if (quantity <= 0) throw new Error("Cantidad inválida");
    const lineTotal = Number(product.price) * quantity;
    total += lineTotal;
    return {
      productId: product.id,
      product: product.name,
      quantity,
      unitPrice: Number(product.price),
      total: lineTotal
    };
  });

  const result = db.prepare("INSERT INTO vouchers (voucher_code, seller, total, status, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(voucherCode, seller, total, "Pendiente", createdAt);

  const insertItem = db.prepare("INSERT INTO voucher_items (voucher_id, product_id, product, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)");
  const transaction = db.transaction((rows) => {
    rows.forEach((row) => insertItem.run(result.lastInsertRowid, row.productId, row.product, row.quantity, row.unitPrice, row.total));
  });
  transaction(preparedItems);

  res.json({
    ok: true,
    voucherId: result.lastInsertRowid,
    voucherCode,
    total,
    downloadUrl: `/api/vouchers/${voucherCode}/download`
  });
});

app.get("/api/vouchers/:code", (req, res) => {
  const voucher = getVoucherWithItems(req.params.code);
  if (!voucher) return res.status(404).json({ ok: false, message: "Voucher no encontrado" });
  res.json(voucher);
});

app.get("/api/vouchers/:code/download", (req, res) => {
  const voucher = getVoucherWithItems(req.params.code);
  if (!voucher) return res.status(404).send("Voucher no encontrado");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${voucher.voucher_code}.html"`);
  res.send(voucherHtml(voucher, voucher.items));
});

app.post("/api/cashier/checkout-voucher", (req, res) => {
  const { voucherCode, cashier } = req.body;
  const voucher = getVoucherWithItems(voucherCode);
  if (!voucher) return res.status(404).json({ ok: false, message: "Voucher no encontrado" });
  if (voucher.status !== "Pendiente") return res.status(400).json({ ok: false, message: "Este voucher ya fue cobrado." });

  for (const item of voucher.items) {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.product_id);
    if (!product || product.stock < item.quantity) {
      return res.status(400).json({ ok: false, message: `Stock insuficiente para ${item.product}` });
    }
  }

  const createdAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  const createSale = db.prepare("INSERT INTO sales (voucher_code, seller, product_id, product, quantity, total, cashier, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

  const tx = db.transaction(() => {
    voucher.items.forEach((item) => {
      createSale.run(voucher.voucher_code, voucher.seller, item.product_id, item.product, item.quantity, item.total, cashier || "Caja 1", "Cobro en caja", createdAt);
      db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(item.quantity, item.product_id);
    });
    db.prepare("UPDATE vouchers SET status = 'Cobrado' WHERE id = ?").run(voucher.id);
  });
  tx();

  const nextReceipt = db.prepare("SELECT COALESCE(MAX(id), 320) + 1 as next_id FROM receipts").get().next_id;
  const dateOnly = new Date().toISOString().slice(0, 10);
  db.prepare("INSERT INTO receipts (id, voucher_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)").run(nextReceipt, voucher.id, voucher.total, "Emitida", dateOnly);

  res.json({
    ok: true,
    receiptId: nextReceipt,
    total: voucher.total,
    downloadUrl: `/api/receipts/${nextReceipt}/download`
  });
});

app.get("/api/receipts/:id/download", (req, res) => {
  const receipt = db.prepare("SELECT * FROM receipts WHERE id = ?").get(Number(req.params.id));
  if (!receipt) return res.status(404).send("Boleta no encontrada");
  const voucher = db.prepare("SELECT * FROM vouchers WHERE id = ?").get(receipt.voucher_id);
  const items = voucher ? db.prepare("SELECT * FROM voucher_items WHERE voucher_id = ? ORDER BY id ASC").all(voucher.id) : [];
  const sale = db.prepare("SELECT * FROM sales WHERE voucher_code = ? ORDER BY id DESC LIMIT 1").get(voucher ? voucher.voucher_code : "");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="boleta-${receipt.id}.html"`);
  res.send(receiptHtml(receipt, sale || {}, items));
});

app.get("/api/supervisor", (req, res) => {
  const lowStock = db.prepare("SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC").all();
  const receipts = db.prepare("SELECT * FROM receipts ORDER BY id DESC LIMIT 20").all();
  const vouchers = db.prepare("SELECT * FROM vouchers ORDER BY id DESC LIMIT 20").all();
  res.json({
    stats: dashboardStats(),
    lowStock,
    receipts,
    vouchers
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
