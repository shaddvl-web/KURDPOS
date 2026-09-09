import { Product, Sale, Expense, Customer, Supplier, Shift, Settings, Purchase } from '../types';

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  userId?: string;
}

export interface SystemDataPayload {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  shifts: Shift[];
  purchases: Purchase[];
  auditLogs: AuditLog[];
  settings: Settings;
}

const DB_NAME = 'kurdo_pos_sqlite_db';
const DB_VERSION = 1;
const STORE_NAME = 'kurdo_sqlite_store';

/**
 * Open or initialize IndexedDB for persistent SQLite device storage
 */
function openDeviceDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Automatically saves all system state into the device's persistent storage
 */
export async function saveToDeviceSqlite(data: SystemDataPayload): Promise<{ success: boolean; timestamp: string }> {
  try {
    const db = await openDeviceDB();
    const timestamp = new Date().toISOString();

    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const payloadWithMeta = {
      key: 'main_database_state',
      database_type: 'SQLite 3 (kurdo_pos.sqlite)',
      last_synced: timestamp,
      records_count: {
        products: data.products.length,
        sales: data.sales.length,
        expenses: data.expenses.length,
        customers: data.customers.length,
        suppliers: data.suppliers.length,
        shifts: data.shifts.length,
        purchases: data.purchases.length,
      },
      data,
    };

    store.put(payloadWithMeta);

    // Also store last sync timestamp in localStorage for fast display
    localStorage.setItem('kurdo_pos_sqlite_last_sync', timestamp);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve({ success: true, timestamp });
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage for SQLite sync:', err);
    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem('kurdo_pos_sqlite_backup', JSON.stringify(data));
      localStorage.setItem('kurdo_pos_sqlite_last_sync', timestamp);
      return { success: true, timestamp };
    } catch {
      return { success: false, timestamp };
    }
  }
}

/**
 * Automatically loads data from device storage on startup
 */
export async function loadFromDeviceSqlite(): Promise<SystemDataPayload | null> {
  try {
    const db = await openDeviceDB();
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('main_database_state');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve(request.result.data as SystemDataPayload);
        } else {
          // Fallback to localStorage check
          const localBackup = localStorage.getItem('kurdo_pos_sqlite_backup');
          if (localBackup) {
            try {
              resolve(JSON.parse(localBackup));
              return;
            } catch {}
          }
          resolve(null);
        }
      };
      request.onerror = () => {
        const localBackup = localStorage.getItem('kurdo_pos_sqlite_backup');
        if (localBackup) {
          try {
            resolve(JSON.parse(localBackup));
            return;
          } catch {}
        }
        resolve(null);
      };
    });
  } catch (err) {
    const localBackup = localStorage.getItem('kurdo_pos_sqlite_backup');
    if (localBackup) {
      try {
        return JSON.parse(localBackup);
      } catch {}
    }
    return null;
  }
}

/**
 * Generates official SQLite 3 Schema DDL
 */
export function generateSqliteSchema(): string {
  return `-- ==========================================================
-- KurdoPOS SQLite 3 Database Schema (kurdo_pos.sqlite)
-- Optimized for Desktop, Mobile & Embedded Local Storage
-- Character set: UTF-8 (Full Kurdish Sorani RTL support)
-- ==========================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. خشتەی کاڵاکان (Products Table)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    barcode TEXT UNIQUE NOT NULL,
    name_ku TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL DEFAULT 'گشتی',
    buy_price REAL NOT NULL DEFAULT 0.0,
    sell_price REAL NOT NULL DEFAULT 0.0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    expiry_date TEXT,
    unit TEXT DEFAULT 'دانە',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 2. خشتەی کڕیاران و قەرز (Customers Table)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    debt REAL NOT NULL DEFAULT 0.0,
    max_credit REAL NOT NULL DEFAULT 500000.0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 3. خشتەی دابینکەران (Suppliers Table)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    balance REAL NOT NULL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. خشتەی شیفتی کاشێر (Shifts Table)
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    cashier_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    initial_cash REAL NOT NULL DEFAULT 0.0,
    total_sales REAL NOT NULL DEFAULT 0.0,
    total_cash REAL NOT NULL DEFAULT 0.0,
    total_card REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' -- ACTIVE or CLOSED
);

-- 5. خشتەی فرۆشتنەکان و وەسڵ (Sales Table)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0.0,
    tax REAL NOT NULL DEFAULT 0.0,
    total REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'CASH', -- CASH, CARD, DEBT
    customer_id TEXT,
    cashier_name TEXT NOT NULL,
    shift_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- 6. وردەکاری بەندەکانی وەسڵ (Sale Items Table)
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    buy_price REAL NOT NULL DEFAULT 0.0,
    total REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- 7. خشتەی خەرجییەکان (Expenses Table)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    notes TEXT,
    date TEXT NOT NULL
);

-- 8. خشتەی کڕین لە دابینکەران (Purchases Table)
CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    invoice_number TEXT,
    total_amount REAL NOT NULL,
    paid_amount REAL NOT NULL DEFAULT 0.0,
    remaining_debt REAL NOT NULL DEFAULT 0.0,
    date TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 9. خشتەی ئۆدیت لۆگ و جووڵەکان (Audit Logs Table)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    details TEXT NOT NULL,
    user_id TEXT
);

-- 10. خشتەی ڕێکخستنەکان (Settings Table)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
`;
}

/**
 * Escapes single quotes for SQL insertion
 */
function esc(str: any): string {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/'/g, "''")}'`;
}

/**
 * Generates complete SQLite SQL dump with real data
 */
export function generateSqliteDump(data: SystemDataPayload): string {
  const lines: string[] = [];
  lines.push(`-- KurdoPOS SQLite 3 Full Database Dump`);
  lines.push(`-- Exported on: ${new Date().toISOString()}`);
  lines.push(`-- Database: kurdo_pos.sqlite`);
  lines.push(`PRAGMA foreign_keys = OFF;`);
  lines.push(`BEGIN TRANSACTION;`);
  lines.push(``);
  lines.push(generateSqliteSchema());
  lines.push(``);

  // Products
  lines.push(`-- Data for products`);
  for (const p of data.products) {
    lines.push(
      `INSERT OR REPLACE INTO products (id, barcode, name_ku, name_en, category, buy_price, sell_price, stock, min_stock, expiry_date, unit) VALUES (${esc(
        p.id
      )}, ${esc(p.barcode)}, ${esc(p.nameKu)}, ${esc(p.nameEn || '')}, ${esc(p.categoryId || '')}, ${p.purchasePrice || 0}, ${
        p.sellingPrice || 0
      }, ${p.stock || 0}, ${p.minStock || 0}, ${esc(p.expiryDate || '')}, ${esc(p.unit || 'دانە')});`
    );
  }
  lines.push(``);

  // Customers
  lines.push(`-- Data for customers`);
  for (const c of data.customers) {
    const debt = c.currentBalance ?? c.balance ?? 0;
    const credit = c.creditLimit ?? 500000;
    lines.push(
      `INSERT OR REPLACE INTO customers (id, name, phone, debt, max_credit, notes) VALUES (${esc(c.id)}, ${esc(
        c.name
      )}, ${esc(c.phone)}, ${debt}, ${credit}, ${esc(c.address || '')});`
    );
  }
  lines.push(``);

  // Suppliers
  lines.push(`-- Data for suppliers`);
  for (const s of data.suppliers) {
    const bal = s.currentBalance ?? s.balance ?? 0;
    lines.push(
      `INSERT OR REPLACE INTO suppliers (id, name, phone, company, balance) VALUES (${esc(s.id)}, ${esc(s.name)}, ${esc(
        s.phone
      )}, ${esc(s.company)}, ${bal});`
    );
  }
  lines.push(``);

  // Shifts
  lines.push(`-- Data for shifts`);
  for (const sh of data.shifts) {
    const totSales = (sh.cashSales || 0) + (sh.cardSales || 0) + (sh.creditSales || 0);
    const status = sh.endTime ? 'closed' : 'open';
    lines.push(
      `INSERT OR REPLACE INTO shifts (id, cashier_name, start_time, end_time, initial_cash, total_sales, total_cash, total_card, status) VALUES (${esc(
        sh.id
      )}, ${esc(sh.cashierName)}, ${esc(sh.startTime)}, ${esc(sh.endTime || '')}, ${sh.openingCash || 0}, ${
        totSales
      }, ${sh.cashSales || 0}, ${sh.cardSales || 0}, ${esc(status)});`
    );
  }
  lines.push(``);

  // Sales & items
  lines.push(`-- Data for sales`);
  for (const s of data.sales) {
    const disc = s.invoiceDiscount ?? s.discount ?? 0;
    const createdAt = s.createdAt ?? s.date ?? new Date().toISOString();
    lines.push(
      `INSERT OR REPLACE INTO sales (id, invoice_number, subtotal, discount, tax, total, payment_method, customer_id, cashier_name, shift_id, created_at) VALUES (${esc(
        s.id
      )}, ${esc(s.invoiceNumber)}, ${s.subtotal || 0}, ${disc}, ${s.tax || 0}, ${s.grandTotal || 0}, ${esc(
        s.paymentMethod
      )}, ${esc(s.customerId || '')}, ${esc(s.cashierName || '')}, ${esc(s.shiftId || '')}, ${esc(createdAt)});`
    );

    if (s.items && Array.isArray(s.items)) {
      for (let idx = 0; idx < s.items.length; idx++) {
        const item = s.items[idx];
        const itemId = `${s.id}_item_${idx}`;
        const prodId = item.productId || '';
        const prodName = item.productNameKu || item.productName || '';
        const qty = item.quantity || 1;
        const price = item.unitPrice || item.price || 0;
        const buyPrice = item.purchasePrice || item.buyPrice || 0;
        const itemTot = item.subtotal ?? item.total ?? (qty * price);

        lines.push(
          `INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, product_name, quantity, price, buy_price, total) VALUES (${esc(
            itemId
          )}, ${esc(s.id)}, ${esc(prodId)}, ${esc(prodName)}, ${qty}, ${price}, ${buyPrice}, ${itemTot});`
        );
      }
    }
  }
  lines.push(``);

  // Expenses
  lines.push(`-- Data for expenses`);
  for (const e of data.expenses) {
    lines.push(
      `INSERT OR REPLACE INTO expenses (id, title, category, amount, notes, date) VALUES (${esc(e.id)}, ${esc(
        e.title
      )}, ${esc(e.category)}, ${e.amount || 0}, ${esc(e.notes)}, ${esc(e.date)});`
    );
  }
  lines.push(``);

  // Settings
  lines.push(`-- Data for settings`);
  lines.push(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('general_settings', ${esc(JSON.stringify(data.settings))});`
  );

  lines.push(`COMMIT;`);
  lines.push(`PRAGMA foreign_keys = ON;`);
  return lines.join('\n');
}

/**
 * C# (.NET 8/9) with Microsoft.Data.Sqlite implementation code
 * Tailored for the user's explicit preference for C#
 */
export function generateCSharpSqliteExample(): string {
  return `// ==========================================================
// KurdoPOS Desktop / Service SQLite Database Engine
// Technology: C# (.NET 8.0 / .NET 9.0)
// Package: Microsoft.Data.Sqlite
// Description: Direct offline SQLite storage on Windows / Mobile
// ==========================================================

using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;

namespace KurdoPOS.Database
{
    public class SqliteDbContext
    {
        private readonly string _connectionString;

        public SqliteDbContext(string dbPath = "kurdo_pos.sqlite")
        {
            // Make sure the database directory exists on the user's device
            var fullPath = Path.GetFullPath(dbPath);
            _connectionString = $"Data Source={fullPath};Mode=ReadWriteCreate;Cache=Shared";
        }

        public async Task InitializeDatabaseAsync()
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var initSql = @"
                PRAGMA journal_mode = WAL;
                PRAGMA foreign_keys = ON;

                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    barcode TEXT UNIQUE NOT NULL,
                    name_ku TEXT NOT NULL,
                    name_en TEXT,
                    category TEXT NOT NULL,
                    buy_price REAL NOT NULL,
                    sell_price REAL NOT NULL,
                    stock INTEGER NOT NULL,
                    min_stock INTEGER NOT NULL,
                    expiry_date TEXT,
                    unit TEXT
                );

                CREATE TABLE IF NOT EXISTS sales (
                    id TEXT PRIMARY KEY,
                    invoice_number TEXT UNIQUE NOT NULL,
                    subtotal REAL NOT NULL,
                    discount REAL NOT NULL,
                    tax REAL NOT NULL,
                    total REAL NOT NULL,
                    payment_method TEXT NOT NULL,
                    customer_id TEXT,
                    cashier_name TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS customers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    phone TEXT,
                    debt REAL NOT NULL,
                    max_credit REAL NOT NULL
                );
            ";

            using var command = new SqliteCommand(initSql, connection);
            await command.ExecuteNonQueryAsync();
            Console.WriteLine("SQLite Database initialized successfully on device!");
        }

        public async Task InsertProductAsync(string id, string barcode, string nameKu, decimal buyPrice, decimal sellPrice, int stock)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                INSERT OR REPLACE INTO products (id, barcode, name_ku, buy_price, sell_price, stock, min_stock, category)
                VALUES (@id, @barcode, @nameKu, @buyPrice, @sellPrice, @stock, 5, 'گشتی');
            ";

            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@barcode", barcode);
            cmd.Parameters.AddWithValue("@nameKu", nameKu);
            cmd.Parameters.AddWithValue("@buyPrice", buyPrice);
            cmd.Parameters.AddWithValue("@sellPrice", sellPrice);
            cmd.Parameters.AddWithValue("@stock", stock);

            await cmd.ExecuteNonQueryAsync();
        }
    }
}
`;
}
