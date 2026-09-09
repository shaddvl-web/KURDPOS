import {
  Product, Category, Customer, Supplier, User, Settings, Shift,
  Sale, Return, Purchase, Expense, HeldInvoice, StockMovement, AuditLog, CartItem
} from '../types';
import {
  INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS, INITIAL_USERS, INITIAL_SETTINGS, INITIAL_SHIFT
} from './initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'kurdo_pos_products',
  CATEGORIES: 'kurdo_pos_categories',
  CUSTOMERS: 'kurdo_pos_customers',
  SUPPLIERS: 'kurdo_pos_suppliers',
  USERS: 'kurdo_pos_users',
  SETTINGS: 'kurdo_pos_settings',
  SALES: 'kurdo_pos_sales',
  RETURNS: 'kurdo_pos_returns',
  PURCHASES: 'kurdo_pos_purchases',
  EXPENSES: 'kurdo_pos_expenses',
  SHIFTS: 'kurdo_pos_shifts',
  CURRENT_SHIFT: 'kurdo_pos_current_shift',
  HELD_INVOICES: 'kurdo_pos_held_invoices',
  STOCK_MOVEMENTS: 'kurdo_pos_stock_movements',
  AUDIT_LOGS: 'kurdo_pos_audit_logs',
  CURRENT_USER: 'kurdo_pos_current_user',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const posStorage = {
  // Current user
  getCurrentUser(): User {
    return getItem<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[1]); // Default cashier
  },
  setCurrentUser(user: User): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit('بەکارهێنەر گۆڕدرا', `بەکارهێنەر چووە ژوورەوە وەک: ${user.nameKu}`, user);
  },

  // Settings
  getSettings(): Settings {
    return getItem<Settings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: Settings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    this.logAudit('ڕێکخستنەکان نوێکرانەوە', 'گۆڕانکاری لە زانیاری مارکێت یان سیستم کرا');
  },

  // Products
  getProducts(): Product[] {
    return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  saveProduct(product: Product): void {
    const products = this.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      const old = products[existingIndex];
      products[existingIndex] = product;
      // Record stock movement if stock adjusted manually
      if (old.stock !== product.stock) {
        this.recordStockMovement({
          productId: product.id,
          productNameKu: product.nameKu,
          type: product.stock > old.stock ? 'adjustment_in' : 'adjustment_out',
          quantityChange: product.stock - old.stock,
          stockBefore: old.stock,
          stockAfter: product.stock,
          notes: 'دەستکاریکردنی ڕاستەوخۆ لە زانیاری کاڵا',
        });
      }
      this.logAudit('دەستکاری کاڵا', `کاڵا دەستکاریکرا: ${product.nameKu}`);
    } else {
      products.unshift(product);
      this.recordStockMovement({
        productId: product.id,
        productNameKu: product.nameKu,
        type: 'adjustment_in',
        quantityChange: product.stock,
        stockBefore: 0,
        stockAfter: product.stock,
        notes: 'زیادکردنی سەرەتایی کاڵای نوێ',
      });
      this.logAudit('زیادکردنی کاڵا', `کاڵای نوێ دروستکرا: ${product.nameKu}`);
    }
    setItem(STORAGE_KEYS.PRODUCTS, products);
  },
  deleteProduct(productId: string): void {
    const products = this.getProducts();
    const target = products.find(p => p.id === productId);
    const filtered = products.filter(p => p.id !== productId);
    setItem(STORAGE_KEYS.PRODUCTS, filtered);
    if (target) {
      this.logAudit('سڕینەوەی کاڵا', `کاڵا سڕایەوە: ${target.nameKu} (بارکۆد: ${target.barcode})`);
    }
  },

  // Categories
  getCategories(): Category[] {
    return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategory(cat: Category): void {
    const cats = this.getCategories();
    const idx = cats.findIndex(c => c.id === cat.id);
    if (idx >= 0) cats[idx] = cat;
    else cats.push(cat);
    setItem(STORAGE_KEYS.CATEGORIES, cats);
  },

  // Customers
  getCustomers(): Customer[] {
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  saveCustomer(cust: Customer): void {
    const custs = this.getCustomers();
    const idx = custs.findIndex(c => c.id === cust.id);
    if (idx >= 0) custs[idx] = cust;
    else custs.unshift(cust);
    setItem(STORAGE_KEYS.CUSTOMERS, custs);
    this.logAudit('کڕیار', `زانیاری کڕیار پاشەکەوتکرا: ${cust.name}`);
  },
  updateCustomerBalance(customerId: string, amountChange: number): void {
    const custs = this.getCustomers();
    const cust = custs.find(c => c.id === customerId);
    if (cust) {
      cust.currentBalance += amountChange;
      setItem(STORAGE_KEYS.CUSTOMERS, custs);
    }
  },

  // Suppliers
  getSuppliers(): Supplier[] {
    return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },
  saveSupplier(sup: Supplier): void {
    const sups = this.getSuppliers();
    const idx = sups.findIndex(s => s.id === sup.id);
    if (idx >= 0) sups[idx] = sup;
    else sups.unshift(sup);
    setItem(STORAGE_KEYS.SUPPLIERS, sups);
    this.logAudit('دابینکەر', `زانیاری دابینکەر پاشەکەوتکرا: ${sup.name}`);
  },
  updateSupplierBalance(supplierId: string, amountChange: number): void {
    const sups = this.getSuppliers();
    const sup = sups.find(s => s.id === supplierId);
    if (sup) {
      sup.currentBalance += amountChange;
      setItem(STORAGE_KEYS.SUPPLIERS, sups);
    }
  },

  // Users
  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  saveUser(u: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(x => x.id === u.id);
    if (idx >= 0) users[idx] = u;
    else users.push(u);
    setItem(STORAGE_KEYS.USERS, users);
  },

  // Sales
  getSales(): Sale[] {
    return getItem<Sale[]>(STORAGE_KEYS.SALES, []);
  },
  recordSale(sale: Sale): void {
    const sales = this.getSales();
    sales.unshift(sale);
    setItem(STORAGE_KEYS.SALES, sales);

    // Update product stock & movements
    const products = this.getProducts();
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const stockBefore = prod.stock;
        prod.stock = Math.max(0, prod.stock - item.quantity);
        this.recordStockMovement({
          productId: prod.id,
          productNameKu: prod.nameKu,
          type: 'sale',
          quantityChange: -item.quantity,
          stockBefore,
          stockAfter: prod.stock,
          referenceId: sale.invoiceNumber,
          notes: `فرۆشتن لە وەصڵی ${sale.invoiceNumber}`,
        });
      }
    });
    setItem(STORAGE_KEYS.PRODUCTS, products);

    // Update customer debt if credit sale
    if (sale.paymentMethod === 'credit' && sale.customerId) {
      this.updateCustomerBalance(sale.customerId, sale.grandTotal - (sale.paidAmount || 0));
    }

    // Update active shift stats
    const shift = this.getCurrentShift();
    if (shift && shift.status === 'open') {
      if (sale.paymentMethod === 'cash') {
        shift.cashSales += sale.paidAmount;
      } else if (sale.paymentMethod === 'card') {
        shift.cardSales += sale.paidAmount;
      } else if (sale.paymentMethod === 'mixed' && sale.paymentDetails) {
        shift.cashSales += sale.paymentDetails.cash || 0;
        shift.cardSales += sale.paymentDetails.card || 0;
      } else if (sale.paymentMethod === 'credit') {
        shift.creditSales += sale.grandTotal;
      }
      this.saveCurrentShift(shift);
    }

    this.logAudit('فرۆشتن', `وەصڵی ژمارە ${sale.invoiceNumber} تەواوکرا بە بڕی ${sale.grandTotal.toLocaleString()} د.ع`);
  },

  // Returns
  getReturns(): Return[] {
    return getItem<Return[]>(STORAGE_KEYS.RETURNS, []);
  },
  recordReturn(ret: Return): void {
    const returns = this.getReturns();
    returns.unshift(ret);
    setItem(STORAGE_KEYS.RETURNS, returns);

    // Restock products & log movements
    const products = this.getProducts();
    ret.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const stockBefore = prod.stock;
        prod.stock += item.quantity;
        this.recordStockMovement({
          productId: prod.id,
          productNameKu: prod.nameKu,
          type: 'return',
          quantityChange: item.quantity,
          stockBefore,
          stockAfter: prod.stock,
          referenceId: ret.returnNumber,
          notes: `گەڕاندنەوە لە وەصڵی ${ret.invoiceNumber}`,
        });
      }
    });
    setItem(STORAGE_KEYS.PRODUCTS, products);

    // Update original sale returned status
    const sales = this.getSales();
    const origSale = sales.find(s => s.id === ret.saleId);
    if (origSale) {
      origSale.status = 'returned_partial';
      ret.items.forEach(retItem => {
        const saleItem = origSale.items.find(i => i.productId === retItem.productId);
        if (saleItem) {
          saleItem.returnedQty = (saleItem.returnedQty || 0) + retItem.quantity;
        }
      });
      setItem(STORAGE_KEYS.SALES, sales);
    }

    // Update active shift returns
    const shift = this.getCurrentShift();
    if (shift && shift.status === 'open') {
      shift.returns += ret.totalRefund;
      this.saveCurrentShift(shift);
    }

    this.logAudit('گەڕاندنەوەی کاڵا', `گەڕاندنەوە بۆ وەصڵی ${ret.invoiceNumber} بە بڕی ${ret.totalRefund.toLocaleString()} د.ع`);
  },

  // Purchases
  getPurchases(): Purchase[] {
    return getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  },
  recordPurchase(purchase: Purchase): void {
    const purchases = this.getPurchases();
    purchases.unshift(purchase);
    setItem(STORAGE_KEYS.PURCHASES, purchases);

    // Add to stock & update cost price
    const products = this.getProducts();
    purchase.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const stockBefore = prod.stock;
        prod.stock += item.quantity;
        prod.purchasePrice = item.purchasePrice; // update purchase price
        this.recordStockMovement({
          productId: prod.id,
          productNameKu: prod.nameKu,
          type: 'purchase',
          quantityChange: item.quantity,
          stockBefore,
          stockAfter: prod.stock,
          referenceId: purchase.invoiceNumber,
          notes: `داغڵکردنی کڕین لە دابینکەر: ${purchase.supplierName}`,
        });
      }
    });
    setItem(STORAGE_KEYS.PRODUCTS, products);

    // Record supplier debt if not fully paid
    const remainingDebt = purchase.total - purchase.paidAmount;
    if (remainingDebt > 0 && purchase.supplierId) {
      this.updateSupplierBalance(purchase.supplierId, remainingDebt);
    }

    this.logAudit('داغڵکردنی کڕین', `کڕین لە دابینکەر ${purchase.supplierName} بە بڕی ${purchase.total.toLocaleString()} د.ع`);
  },

  // Expenses
  getExpenses(): Expense[] {
    return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  },
  recordExpense(exp: Expense): void {
    const expenses = this.getExpenses();
    expenses.unshift(exp);
    setItem(STORAGE_KEYS.EXPENSES, expenses);

    // Update shift expenses
    const shift = this.getCurrentShift();
    if (shift && shift.status === 'open') {
      shift.expenses += exp.amount;
      this.saveCurrentShift(shift);
    }

    this.logAudit('خەرجی نوێ', `خەرجی ${exp.category}: ${exp.amount.toLocaleString()} د.ع (${exp.title || exp.description || ''})`);
  },
  saveExpense(exp: Expense): void {
    this.recordExpense(exp);
  },
  deleteExpense(id: string): void {
    const list = this.getExpenses().filter(e => e.id !== id);
    setItem(STORAGE_KEYS.EXPENSES, list);
  },
  deleteUser(id: string): void {
    const list = this.getUsers().filter(u => u.id !== id);
    setItem(STORAGE_KEYS.USERS, list);
  },
  saveSale(sale: Sale): void {
    this.recordSale(sale);
  },
  savePurchase(p: Purchase): void {
    this.recordPurchase(p);
  },
  adjustCustomerBalance(customerId: string, diff: number): void {
    this.updateCustomerBalance(customerId, diff);
  },
  adjustSupplierBalance(supplierId: string, diff: number): void {
    this.updateSupplierBalance(supplierId, diff);
  },
  closeShift(shiftId: string, actualCash: number, notes: string): Shift {
    return this.closeCurrentShift(actualCash, notes);
  },
  exportDatabase(): string {
    return this.exportFullBackup();
  },
  importDatabase(jsonString: string): boolean {
    return this.importFullBackup(jsonString);
  },
  resetToDefaults(): void {
    this.resetToDefault();
  },

  // Held Invoices
  getHeldInvoices(): HeldInvoice[] {
    return getItem<HeldInvoice[]>(STORAGE_KEYS.HELD_INVOICES, []);
  },
  saveHeldInvoice(invoice: HeldInvoice): void {
    const list = this.getHeldInvoices();
    list.unshift(invoice);
    setItem(STORAGE_KEYS.HELD_INVOICES, list);
    this.logAudit('ڕاگرتنی وەصڵ', `وەصڵ ڕاگیرا بە کاتی ${new Date().toLocaleTimeString('ckb-IQ')}`);
  },
  deleteHeldInvoice(id: string): void {
    const list = this.getHeldInvoices().filter(i => i.id !== id);
    setItem(STORAGE_KEYS.HELD_INVOICES, list);
  },

  // Shifts
  getShifts(): Shift[] {
    return getItem<Shift[]>(STORAGE_KEYS.SHIFTS, []);
  },
  getCurrentShift(): Shift {
    return getItem<Shift>(STORAGE_KEYS.CURRENT_SHIFT, INITIAL_SHIFT);
  },
  saveCurrentShift(shift: Shift): void {
    setItem(STORAGE_KEYS.CURRENT_SHIFT, shift);
  },
  openNewShift(arg1: any, arg2?: any, arg3?: any): Shift {
    let openingCash = 0;
    let notes = 'دەستپێکی شیفتی نوێ';
    const user = this.getCurrentUser();
    let cashierId = user.id;
    let cashierName = user.nameKu;

    if (typeof arg1 === 'number') {
      openingCash = arg1;
      if (typeof arg2 === 'string') notes = arg2;
    } else if (typeof arg3 === 'number') {
      cashierId = String(arg1);
      cashierName = String(arg2);
      openingCash = arg3;
    }

    const newShift: Shift = {
      id: 'shift-' + Date.now().toString().slice(-6),
      cashierId,
      cashierName,
      startTime: new Date().toISOString(),
      openingCash,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0,
      expenses: 0,
      returns: 0,
      status: 'open',
      notes,
    };
    this.saveCurrentShift(newShift);
    this.logAudit('کردنەوەی شیفت', `شیفتی نوێ کرایەوە لەلایەن ${cashierName} بە پارەی دەستپێک: ${openingCash.toLocaleString()} د.ع`);
    return newShift;
  },
  closeCurrentShift(actualCash: number, notes?: string): Shift {
    const shift = this.getCurrentShift();
    const expected = shift.openingCash + shift.cashSales - shift.expenses - shift.returns;
    const diff = actualCash - expected;

    shift.endTime = new Date().toISOString();
    shift.closingCash = actualCash;
    shift.expectedCash = expected;
    shift.difference = diff;
    shift.status = 'closed';
    if (notes) shift.notes = (shift.notes ? shift.notes + ' | ' : '') + notes;

    const allShifts = this.getShifts();
    allShifts.unshift(shift);
    setItem(STORAGE_KEYS.SHIFTS, allShifts);
    this.saveCurrentShift(shift);

    this.logAudit('داخستنی شیفت', `شیفت داخرا. پارەی چاوەڕوانکراو: ${expected.toLocaleString()}، کرداری: ${actualCash.toLocaleString()}، جیاوازی: ${diff.toLocaleString()}`);
    return shift;
  },

  // Stock movements
  getStockMovements(): StockMovement[] {
    return getItem<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  },
  recordStockMovement(data: Partial<StockMovement> & { productId: string; productNameKu: string; type: any; quantityChange: number; stockBefore: number; stockAfter: number; notes: string }): void {
    const user = this.getCurrentUser();
    const movements = this.getStockMovements();
    const m: StockMovement = {
      ...data,
      id: data.id || ('mov-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5)),
      date: data.date || new Date().toISOString(),
      userId: data.userId || user.id,
      userName: data.userName || user.nameKu,
    };
    movements.unshift(m);
    // Keep max 500 movements in browser storage
    setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements.slice(0, 500));
  },

  // Audit logs
  getAuditLogs(): AuditLog[] {
    return getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },
  logAudit(actionKu: string, details: string, userOverride?: User): void {
    const user = userOverride || this.getCurrentUser();
    const logs = this.getAuditLogs();
    const log: AuditLog = {
      id: 'log-' + Date.now(),
      date: new Date().toISOString(),
      userId: user.id,
      userName: user.nameKu,
      action: actionKu,
      actionKu,
      details,
      ip: '127.0.0.1 (Local POS Terminal)',
    };
    logs.unshift(log);
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 400));
  },

  // Batch Setters for Persistence Sync
  setProducts(products: Product[]): void {
    setItem(STORAGE_KEYS.PRODUCTS, products);
  },
  saveProducts(products: Product[]): void {
    setItem(STORAGE_KEYS.PRODUCTS, products);
  },
  setSales(sales: Sale[]): void {
    setItem(STORAGE_KEYS.SALES, sales);
  },
  saveSales(sales: Sale[]): void {
    setItem(STORAGE_KEYS.SALES, sales);
  },
  setCustomers(customers: Customer[]): void {
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
  },
  saveCustomers(customers: Customer[]): void {
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
  },
  setSuppliers(suppliers: Supplier[]): void {
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  },
  saveSuppliers(suppliers: Supplier[]): void {
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  },
  setExpenses(expenses: Expense[]): void {
    setItem(STORAGE_KEYS.EXPENSES, expenses);
  },
  saveExpenses(expenses: Expense[]): void {
    setItem(STORAGE_KEYS.EXPENSES, expenses);
  },
  setShifts(shifts: Shift[]): void {
    setItem(STORAGE_KEYS.SHIFTS, shifts);
  },
  saveShifts(shifts: Shift[]): void {
    setItem(STORAGE_KEYS.SHIFTS, shifts);
  },
  setPurchases(purchases: Purchase[]): void {
    setItem(STORAGE_KEYS.PURCHASES, purchases);
  },
  savePurchases(purchases: Purchase[]): void {
    setItem(STORAGE_KEYS.PURCHASES, purchases);
  },

  // Full Database Backup & Restore
  exportFullBackup(): string {
    const backup = {
      meta: {
        app: 'KurdoPOS Supermarket System',
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
      },
      products: this.getProducts(),
      categories: this.getCategories(),
      customers: this.getCustomers(),
      suppliers: this.getSuppliers(),
      users: this.getUsers(),
      settings: this.getSettings(),
      sales: this.getSales(),
      returns: this.getReturns(),
      purchases: this.getPurchases(),
      expenses: this.getExpenses(),
      shifts: this.getShifts(),
      currentShift: this.getCurrentShift(),
      stockMovements: this.getStockMovements(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) setItem(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.categories) setItem(STORAGE_KEYS.CATEGORIES, data.categories);
      if (data.customers) setItem(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.suppliers) setItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
      if (data.users) setItem(STORAGE_KEYS.USERS, data.users);
      if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.sales) setItem(STORAGE_KEYS.SALES, data.sales);
      if (data.returns) setItem(STORAGE_KEYS.RETURNS, data.returns);
      if (data.purchases) setItem(STORAGE_KEYS.PURCHASES, data.purchases);
      if (data.expenses) setItem(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.shifts) setItem(STORAGE_KEYS.SHIFTS, data.shifts);
      if (data.currentShift) setItem(STORAGE_KEYS.CURRENT_SHIFT, data.currentShift);
      if (data.stockMovements) setItem(STORAGE_KEYS.STOCK_MOVEMENTS, data.stockMovements);
      if (data.auditLogs) setItem(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);
      this.logAudit('گێڕانەوەی باکئاپ', 'داتابەیس بە سەرکەوتوویی لە باکئاپەوە گەڕێندرایەوە');
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },

  resetToDefault(): void {
    localStorage.clear();
    setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setItem(STORAGE_KEYS.CURRENT_SHIFT, INITIAL_SHIFT);
    this.logAudit('ڕێکخستنەوەی کارگە', 'داتابەیس گەڕێندرایەوە دۆخی بنەڕەتی');
  }
};

export const storage = posStorage;

