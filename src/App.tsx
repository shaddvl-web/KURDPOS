import React, { useState, useEffect, useCallback } from 'react';
import {
  Product, Category, Customer, Supplier, Sale, Purchase,
  Shift, Expense, User, StockMovement, HeldInvoice, Settings, CartItem, PaymentMethod
} from './types';
import { storage } from './utils/storage';
import { posSound } from './utils/audio';

// Components
import { HeaderBar, ActiveModule } from './components/HeaderBar';
import { PosScreen } from './components/PosScreen';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { PurchasesView } from './components/PurchasesView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { SalesView } from './components/SalesView';
import { ShiftsView } from './components/ShiftsView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { AiAssistantView } from './components/AiAssistantView';
import { UsersView } from './components/UsersView';
import { SettingsView } from './components/SettingsView';
import { SqliteDeviceView } from './components/SqliteDeviceView';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PWAInstallModal } from './components/PWAInstallModal';
import { saveToDeviceSqlite, loadFromDeviceSqlite } from './utils/sqliteDeviceSync';

// Modals
import { PaymentModal } from './components/PaymentModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { HeldInvoicesModal } from './components/HeldInvoicesModal';

export default function App() {
  // App navigation state
  const [activeModule, setActiveModule] = useState<ActiveModule>('pos');

  // Core Data States loaded from storage
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => storage.getSuppliers());
  const [sales, setSales] = useState<Sale[]>(() => storage.getSales());
  const [purchases, setPurchases] = useState<Purchase[]>(() => storage.getPurchases());
  const [shifts, setShifts] = useState<Shift[]>(() => storage.getShifts());
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.getExpenses());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => storage.getStockMovements());
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>(() => storage.getHeldInvoices());
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [currentShift, setCurrentShift] = useState<Shift>(() => storage.getCurrentShift());

  // POS Working Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-1');
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => posSound.isEnabled());

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // PWA Install State (Add to Home Screen)
  const pwaInstallState = usePWAInstall();

  // Sync sounds
  const handleToggleSound = () => {
    const next = !soundEnabled;
    posSound.setEnabled(next);
    setSoundEnabled(next);
    if (next) posSound.playBeep();
  };

  // Refresh data from storage
  const refreshAll = useCallback(() => {
    setProducts(storage.getProducts());
    setCategories(storage.getCategories());
    setCustomers(storage.getCustomers());
    setSuppliers(storage.getSuppliers());
    setSales(storage.getSales());
    setPurchases(storage.getPurchases());
    setShifts(storage.getShifts());
    setExpenses(storage.getExpenses());
    setUsers(storage.getUsers());
    setStockMovements(storage.getStockMovements());
    setHeldInvoices(storage.getHeldInvoices());
    setSettings(storage.getSettings());
    setCurrentUser(storage.getCurrentUser());
    setCurrentShift(storage.getCurrentShift());
  }, []);

  // 1. Auto-retrieve SQLite data from device on app open
  useEffect(() => {
    let isMounted = true;
    loadFromDeviceSqlite().then((deviceData) => {
      if (!isMounted) return;
      if (deviceData) {
        if (deviceData.products && deviceData.products.length > 0) {
          setProducts(deviceData.products);
          storage.saveProducts(deviceData.products);
        }
        if (deviceData.sales && deviceData.sales.length > 0) {
          setSales(deviceData.sales);
          storage.saveSales(deviceData.sales);
        }
        if (deviceData.customers && deviceData.customers.length > 0) {
          setCustomers(deviceData.customers);
          storage.saveCustomers(deviceData.customers);
        }
        if (deviceData.suppliers && deviceData.suppliers.length > 0) {
          setSuppliers(deviceData.suppliers);
          storage.saveSuppliers(deviceData.suppliers);
        }
        if (deviceData.expenses && deviceData.expenses.length > 0) {
          setExpenses(deviceData.expenses);
          storage.saveExpenses(deviceData.expenses);
        }
        if (deviceData.shifts && deviceData.shifts.length > 0) {
          setShifts(deviceData.shifts);
          storage.saveShifts(deviceData.shifts);
        }
        if (deviceData.purchases && deviceData.purchases.length > 0) {
          setPurchases(deviceData.purchases);
          storage.savePurchases(deviceData.purchases);
        }
        if (deviceData.settings) {
          setSettings(deviceData.settings);
          storage.saveSettings(deviceData.settings);
        }
      } else {
        // Automatically send initial data to device SQLite storage on first launch
        saveToDeviceSqlite({
          products,
          sales,
          expenses,
          customers,
          suppliers,
          shifts,
          purchases,
          auditLogs: [],
          settings,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Auto-save all data updates to device SQLite database
  useEffect(() => {
    saveToDeviceSqlite({
      products,
      sales,
      expenses,
      customers,
      suppliers,
      shifts,
      purchases,
      auditLogs: [],
      settings,
    });
  }, [products, sales, expenses, customers, suppliers, shifts, purchases, settings]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Help / Shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // F4: Complete Sale / Open Payment
      if (e.key === 'F4') {
        e.preventDefault();
        if (activeModule !== 'pos') {
          setActiveModule('pos');
        } else if (cart.length > 0) {
          setIsPaymentModalOpen(true);
          posSound.playClick();
        }
        return;
      }

      // F8: AI Assistant & Automation
      if (e.key === 'F8') {
        e.preventDefault();
        setActiveModule(prev => prev === 'ai_assistant' ? 'pos' : 'ai_assistant');
        posSound.playClick();
        return;
      }

      // F9: Hold current invoice
      if (e.key === 'F9') {
        e.preventDefault();
        if (activeModule === 'pos' && cart.length > 0) {
          handleHoldCurrentInvoice();
        }
        return;
      }

      // F10: Recall held invoice
      if (e.key === 'F10') {
        e.preventDefault();
        setIsHeldModalOpen(true);
        posSound.playClick();
        return;
      }

      // ESC: Close open modals
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(false);
        setIsShortcutsModalOpen(false);
        setIsHeldModalOpen(false);
        return;
      }

      // CTRL+N: Clear Cart
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (cart.length > 0 && confirm('ئایا دڵنیایت لە بەتاڵکردنەوەی سەبەتەی کڕین؟')) {
          setCart([]);
          setInvoiceDiscount(0);
          posSound.playClick();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModule, cart]);

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = settings.taxEnabled && settings.taxRate > 0
    ? Math.round((subtotal * settings.taxRate) / 100)
    : 0;
  const grandTotal = Math.max(0, subtotal - invoiceDiscount + taxAmount);

  // Complete Sale Handler
  const handleCompleteSale = (
    paymentMethod: PaymentMethod,
    paidAmount: number,
    changeAmount: number,
    notesOrDetails?: { cash?: number; card?: number } | string
  ) => {
    if (cart.length === 0) return;

    const customer = customers.find(c => c.id === selectedCustomerId);
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      invoiceNumber,
      shiftId: currentShift.id,
      cashierId: currentUser.id,
      cashierName: currentUser.nameKu,
      customerId: selectedCustomerId,
      customerName: customer?.name || 'کڕیاری گشتی',
      items: [...cart],
      subtotal,
      discount: invoiceDiscount,
      tax: taxAmount,
      grandTotal,
      paidAmount,
      changeAmount,
      paymentMethod,
      status: 'completed',
      createdAt: new Date().toISOString(),
      notes: typeof notesOrDetails === 'string' ? notesOrDetails : undefined,
      paymentDetails: typeof notesOrDetails === 'object' ? notesOrDetails : undefined,
    };

    // Save Sale to database
    storage.saveSale(newSale);

    // If paymentMethod is credit, increase customer debt balance
    if (paymentMethod === 'credit') {
      const debtIncrease = grandTotal - paidAmount;
      if (debtIncrease > 0) {
        storage.adjustCustomerBalance(selectedCustomerId, debtIncrease);
      }
    }

    // Refresh state
    refreshAll();

    // Reset current POS cart
    setCart([]);
    setInvoiceDiscount(0);
    setIsPaymentModalOpen(false);

    // Open Thermal Receipt modal immediately
    setReceiptSale(newSale);
    setIsReceiptModalOpen(true);
    posSound.playCashDrawer();
  };

  // Hold current invoice
  const handleHoldCurrentInvoice = () => {
    if (cart.length === 0) return;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const held: HeldInvoice = {
      id: 'held-' + Date.now(),
      items: [...cart],
      customerId: selectedCustomerId,
      customerName: customer?.name || 'کڕیاری گشتی',
      invoiceDiscount,
      holdTime: new Date().toISOString(),
    };

    storage.saveHeldInvoice(held);
    setCart([]);
    setInvoiceDiscount(0);
    refreshAll();
    posSound.playClick();
  };

  // Recall held invoice
  const handleRecallHeldInvoice = (held: HeldInvoice) => {
    setCart(held.items);
    setSelectedCustomerId(held.customerId || 'cust-1');
    setInvoiceDiscount(held.invoiceDiscount || 0);
    storage.deleteHeldInvoice(held.id);
    refreshAll();
    setActiveModule('pos');
    posSound.playSuccess();
  };

  // Delete held invoice
  const handleDeleteHeldInvoice = (id: string) => {
    storage.deleteHeldInvoice(id);
    refreshAll();
  };

  // Process Sales Return
  const handleProcessReturn = (
    saleId: string,
    returnedItems: { productId: string; quantity: number; refundAmount: number }[],
    reason: string
  ) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    // Increase stock for each returned item
    returnedItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const newStock = prod.stock + item.quantity;
        storage.saveProduct({ ...prod, stock: newStock });
        storage.recordStockMovement({
          id: 'mov-' + Date.now() + '-' + Math.random().toString().slice(-4),
          productId: prod.id,
          productNameKu: prod.nameKu,
          type: 'return',
          quantityChange: item.quantity,
          stockBefore: prod.stock,
          stockAfter: newStock,
          date: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.nameKu,
          notes: `گەڕاندنەوە لە وەصڵی ${sale.invoiceNumber}: ${reason}`,
        });
      }
    });

    const totalRefund = returnedItems.reduce((sum, it) => sum + it.refundAmount, 0);

    // If customer paid on credit, reduce debt; else record expense / refund
    if (sale.paymentMethod === 'credit') {
      storage.adjustCustomerBalance(sale.customerId, -totalRefund);
    } else {
      // Record an expense from the shift drawer for refund
      storage.saveExpense({
        id: 'exp-ref-' + Date.now(),
        title: `گەڕاندنەوەی پارە بۆ وەصڵی ${sale.invoiceNumber}`,
        category: 'گەڕاندنەوەی کاڵا',
        amount: totalRefund,
        paidFromShift: true,
        shiftId: currentShift.id,
        date: new Date().toISOString(),
        userName: currentUser.nameKu,
        notes: reason,
      });
    }

    refreshAll();
    alert(`گەڕاندنەوەی بڕی ${totalRefund.toLocaleString()} د.ع بە سەرکەوتوویی تەواوبوو و کاڵاکان گەڕانەوە بۆ ستۆک.`);
  };

  // Shift Management Handlers
  const handleCloseShift = (actualCash: number, notes: string) => {
    storage.closeShift(currentShift.id, actualCash, notes);
    refreshAll();
  };

  const handleOpenShift = (openingCash: number) => {
    storage.openNewShift(currentUser.id, currentUser.nameKu, openingCash);
    refreshAll();
  };

  // Product Management Handlers
  const handleSaveProduct = (prod: Product) => {
    storage.saveProduct(prod);
    refreshAll();
  };

  const handleDeleteProduct = (id: string) => {
    storage.deleteProduct(id);
    refreshAll();
  };

  const handleAdjustStock = (productId: string, newStock: number, reason: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const diff = newStock - prod.stock;
    storage.saveProduct({ ...prod, stock: newStock });
    storage.recordStockMovement({
      id: 'mov-' + Date.now(),
      productId: prod.id,
      productNameKu: prod.nameKu,
      type: 'adjustment',
      quantityChange: diff,
      stockBefore: prod.stock,
      stockAfter: newStock,
      date: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.nameKu,
      notes: reason,
    });
    refreshAll();
  };

  // Purchases Handlers
  const handleRecordPurchase = (purchase: Purchase) => {
    storage.savePurchase(purchase);

    // Automatically increase product stock and update cost price
    purchase.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      if (prod) {
        const newStock = prod.stock + it.quantity;
        storage.saveProduct({
          ...prod,
          stock: newStock,
          purchasePrice: it.purchasePrice,
        });
        storage.recordStockMovement({
          id: 'mov-' + Date.now() + '-' + Math.random().toString().slice(-4),
          productId: prod.id,
          productNameKu: prod.nameKu,
          type: 'purchase',
          quantityChange: it.quantity,
          stockBefore: prod.stock,
          stockAfter: newStock,
          date: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.nameKu,
          notes: `کڕین بە وەصڵی ${purchase.invoiceNumber} لە دابینکەر ${purchase.supplierName}`,
        });
      }
    });

    // If purchase has debt (total > paidAmount), update supplier balance
    const debt = purchase.total - purchase.paidAmount;
    if (debt > 0) {
      storage.adjustSupplierBalance(purchase.supplierId, debt);
    }

    refreshAll();
  };

  // Customer & Supplier Handlers
  const handleSaveCustomer = (cust: Customer) => {
    storage.saveCustomer(cust);
    refreshAll();
  };

  const handleCustomerPayment = (customerId: string, amount: number) => {
    storage.adjustCustomerBalance(customerId, -amount);
    // Add cash to active shift
    storage.saveExpense({
      id: 'exp-pay-' + Date.now(),
      title: 'وەرگرتنی قەرزی کڕیار',
      category: 'قەرز',
      amount: -amount, // negative expense = positive cash into shift
      paidFromShift: true,
      shiftId: currentShift.id,
      date: new Date().toISOString(),
      userName: currentUser.nameKu,
      notes: 'پارەی وەرگیراوی قەرز لە کڕیار',
    });
    refreshAll();
  };

  const handleSaveSupplier = (supp: Supplier) => {
    storage.saveSupplier(supp);
    refreshAll();
  };

  const handleSupplierPayment = (supplierId: string, amount: number) => {
    storage.adjustSupplierBalance(supplierId, -amount);
    // Record expense paid from shift
    storage.saveExpense({
      id: 'exp-sup-' + Date.now(),
      title: 'دانەوەی قەرزی دابینکەر',
      category: 'قەرز',
      amount,
      paidFromShift: true,
      shiftId: currentShift.id,
      date: new Date().toISOString(),
      userName: currentUser.nameKu,
      notes: 'پارەی دراو بە دابینکەر بۆ قەرز',
    });
    refreshAll();
  };

  // Settings & Database Backup Handlers
  const handleSaveSettings = (newSettings: Settings) => {
    storage.saveSettings(newSettings);
    refreshAll();
  };

  const handleExportDatabase = () => {
    const jsonStr = storage.exportDatabase();
    const element = document.createElement('a');
    const file = new Blob([jsonStr], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `kurdopos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    posSound.playSuccess();
  };

  const handleImportDatabase = (jsonString: string) => {
    storage.importDatabase(jsonString);
    refreshAll();
  };

  const handleResetDatabase = () => {
    if (confirm('ئایا دڵنیایت لە سڕینەوە و گەڕاندنەوەی هەموو داتابەیس بۆ باری سەرەتایی؟ ئەم کردارە ناگەڕێتەوە.')) {
      storage.resetToDefaults();
      refreshAll();
      setCart([]);
      posSound.playSuccess();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f0f2f5] text-slate-800 font-sans select-none" dir="rtl">
      {/* Top Header Windows Ribbon */}
      <HeaderBar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        currentUser={currentUser}
        currentShift={currentShift}
        settings={settings}
        onToggleSound={handleToggleSound}
        soundEnabled={soundEnabled}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        heldCount={heldInvoices.length}
        pwaState={pwaInstallState}
      />

      {/* Main Screen Body: Active Module View */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeModule === 'pos' && (
          <PosScreen
            products={products}
            categories={categories}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            cart={cart}
            onUpdateCart={setCart}
            invoiceDiscount={invoiceDiscount}
            onUpdateInvoiceDiscount={setInvoiceDiscount}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            onHoldInvoice={handleHoldCurrentInvoice}
            onOpenHeldModal={() => setIsHeldModalOpen(true)}
            heldCount={heldInvoices.length}
            settings={settings}
            currentShift={currentShift}
            currentUser={currentUser}
          />
        )}

        {activeModule === 'products' && (
          <ProductsView
            products={products}
            categories={categories}
            suppliers={suppliers}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeModule === 'inventory' && (
          <InventoryView
            products={products}
            stockMovements={stockMovements}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {activeModule === 'purchases' && (
          <PurchasesView
            purchases={purchases}
            suppliers={suppliers}
            products={products}
            onRecordPurchase={handleRecordPurchase}
          />
        )}

        {activeModule === 'customers' && (
          <CustomersView
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onCustomerPayment={handleCustomerPayment}
          />
        )}

        {activeModule === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            onSaveSupplier={handleSaveSupplier}
            onSupplierPayment={handleSupplierPayment}
          />
        )}

        {activeModule === 'sales' && (
          <SalesView
            sales={sales}
            onProcessReturn={handleProcessReturn}
            onReprintReceipt={(sale) => {
              setReceiptSale(sale);
              setIsReceiptModalOpen(true);
            }}
          />
        )}

        {activeModule === 'shifts' && (
          <ShiftsView
            currentShift={currentShift}
            previousShifts={shifts.filter(s => s.id !== currentShift.id)}
            sales={sales}
            expenses={expenses}
            currentUser={currentUser}
            onCloseShift={handleCloseShift}
            onOpenShift={handleOpenShift}
          />
        )}

        {activeModule === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            currentShift={currentShift}
            currentUser={currentUser}
            onAddExpense={(exp) => {
              storage.saveExpense(exp);
              refreshAll();
            }}
            onDeleteExpense={(id) => {
              storage.deleteExpense(id);
              refreshAll();
            }}
          />
        )}

        {activeModule === 'reports' && (
          <ReportsView
            sales={sales}
            purchases={purchases}
            expenses={expenses}
            products={products}
          />
        )}

        {activeModule === 'ai_assistant' && (
          <AiAssistantView
            products={products}
            sales={sales}
            expenses={expenses}
            customers={customers}
            suppliers={suppliers}
            purchases={purchases}
            currentShift={currentShift}
            settings={settings}
            onRefreshAll={refreshAll}
          />
        )}

        {activeModule === 'users' && (
          <UsersView
            users={users}
            currentUser={currentUser}
            onSaveUser={(u) => {
              storage.saveUser(u);
              refreshAll();
            }}
            onDeleteUser={(id) => {
              storage.deleteUser(id);
              refreshAll();
            }}
            onSwitchUser={(u) => {
              setCurrentUser(u);
              storage.setCurrentUser(u);
            }}
          />
        )}

        {activeModule === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onExportDatabase={handleExportDatabase}
            onImportDatabase={handleImportDatabase}
            onResetDatabase={handleResetDatabase}
          />
        )}

        {activeModule === 'sqlite_db' && (
          <SqliteDeviceView
            products={products}
            sales={sales}
            expenses={expenses}
            customers={customers}
            suppliers={suppliers}
            shifts={shifts}
            purchases={purchases}
            settings={settings}
            pwaState={pwaInstallState}
            onRestoreData={(restored) => {
              if (restored.products) {
                setProducts(restored.products);
                storage.saveProducts(restored.products);
              }
              if (restored.sales) {
                setSales(restored.sales);
                storage.saveSales(restored.sales);
              }
              if (restored.customers) {
                setCustomers(restored.customers);
                storage.saveCustomers(restored.customers);
              }
              if (restored.expenses) {
                setExpenses(restored.expenses);
                storage.saveExpenses(restored.expenses);
              }
              refreshAll();
            }}
          />
        )}
      </main>

      {/* Professional Windows POS Footer Status Bar */}
      <footer className="h-9 bg-slate-100 border-t border-slate-300 flex items-center justify-between px-3 shrink-0 text-slate-600 text-xs select-none">
        <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap text-[11px]">
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-2xs">F1</kbd>
            <span className="text-slate-600 font-medium">یارمەتی</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-2xs">F2</kbd>
            <span className="text-slate-600 font-medium">سکان / گەڕان</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-blue-600 text-white px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-2xs">F4</kbd>
            <span className="text-blue-900 font-bold">پارەدان</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-2xs">F7</kbd>
            <span className="text-slate-600 font-medium">داشکان</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-indigo-600 text-white px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-2xs">F8</kbd>
            <span className="text-indigo-900 font-bold">ڕاوێژکاری AI</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-2xs">F9</kbd>
            <span className="text-slate-600 font-medium">ڕاگرتنی وەصڵ</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-2xs">F10</kbd>
            <span className="text-slate-600 font-medium">وەصڵەکان</span>
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <button
            onClick={() => setActiveModule('sqlite_db')}
            className="flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 transition"
            title="داتابەیسی SQLite لەسەر دیڤایسەکەت کارایە و ئۆتۆماتیک هاوکاتە"
          >
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span>SQLite ناو دیڤایس (Synced)</span>
          </button>
          <span className="text-slate-400">|</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span>سیستەم چالاکە</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-slate-500 text-[10px]">v2.4.0 Pro</span>
        </div>
      </footer>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        grandTotal={grandTotal}
        onCompleteSale={handleCompleteSale}
        currencyRate={settings.currencyRate}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={setSelectedCustomerId}
      />

      {/* Thermal Receipt Modal (Printable & Preview) */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={receiptSale}
        settings={settings}
      />

      {/* Keyboard Shortcuts Modal (F1) */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Held Invoices Modal (F10) */}
      <HeldInvoicesModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        heldInvoices={heldInvoices}
        onRecall={handleRecallHeldInvoice}
        onDelete={handleDeleteHeldInvoice}
      />

      {/* PWA Direct In-App Install Prompt Modal */}
      <PWAInstallModal installState={pwaInstallState} />
    </div>
  );
}
