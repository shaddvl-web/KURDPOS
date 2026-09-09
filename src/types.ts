export type PaymentMethod = 'cash' | 'card' | 'mixed' | 'credit';

export type Role = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'inventory' | 'accountant';

export interface User {
  id: string;
  username: string;
  nameKu: string;
  nameEn: string;
  role: Role;
  phone: string;
  active: boolean;
  pin?: string;
  avatar?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  nameKu: string;
  nameEn: string;
  icon: string;
  color: string;
}

export interface Brand {
  id: string;
  nameKu: string;
  nameEn: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  nameKu: string;
  nameEn: string;
  categoryId: string;
  brandId?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  discountPrice?: number;
  stock: number;
  minStock: number;
  maxStock: number;
  supplierId?: string;
  image?: string;
  expiryDate?: string;
  batchNumber?: string;
  taxRate: number; // percentage, e.g. 0 or 5
  active: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // discount amount per unit
  total: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  openingBalance: number;
  currentBalance: number; // positive = customer owes money (debt)
  balance?: number;
  creditLimit: number;
  active?: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code?: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address: string;
  openingBalance: number;
  currentBalance: number; // positive = we owe supplier (debt)
  balance?: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productBarcode: string;
  productNameKu: string;
  productNameEn: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discount: number;
  subtotal: number;
  total?: number;
  returnedQty?: number;
  product?: Product;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date?: string;
  createdAt?: string;
  shiftId?: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: (SaleItem | any)[];
  subtotal: number;
  itemDiscountTotal?: number;
  invoiceDiscount?: number;
  discount?: number;
  tax?: number;
  taxAmount?: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    cash?: number;
    card?: number;
  };
  status: 'completed' | 'credit' | 'suspended' | 'cancelled' | 'returned_partial' | 'returned_full';
  notes?: string;
}

export interface ReturnItem {
  productId: string;
  productNameKu: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}

export interface Return {
  id: string;
  returnNumber: string;
  saleId: string;
  invoiceNumber: string;
  date: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  items: ReturnItem[];
  totalRefund: number;
  reason: string;
}

export interface PurchaseItem {
  productId: string;
  productNameKu: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  notes?: string;
}

export interface Expense {
  id: string;
  expenseNumber?: string;
  title?: string;
  category: string; // rent, electricity, salary, etc.
  amount: number;
  date: string;
  description?: string;
  employeeName?: string;
  paidFromShift?: boolean;
  shiftId?: string;
  cashierId?: string;
  cashierName?: string;
  userName?: string;
  notes?: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  userName?: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  cashSales: number;
  totalSalesCash?: number;
  cardSales: number;
  creditSales: number;
  expenses: number;
  returns: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface HeldInvoice {
  id: string;
  holdTime: string;
  customerName: string;
  customerId?: string;
  items: CartItem[];
  invoiceDiscount: number;
  note?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productNameKu: string;
  type: 'sale' | 'purchase' | 'return' | 'adjustment_in' | 'adjustment_out' | 'damaged' | 'adjustment';
  quantityChange: number; // positive or negative
  stockBefore: number;
  stockAfter: number;
  referenceId?: string;
  date: string;
  notes: string;
  userId: string;
  userName: string;
}

export interface AuditLog {
  id: string;
  date: string;
  userId: string;
  userName: string;
  action: string;
  actionKu: string;
  details: string;
  ip: string;
}

export interface Settings {
  marketNameKu: string;
  marketNameEn: string;
  phone: string;
  address: string;
  taxNumber?: string;
  currency: string; // IQD, USD
  currencyRate: number; // e.g. 1 USD = 1530 IQD
  taxEnabled: boolean;
  taxRate: number; // e.g. 0%
  invoicePrefix?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptFooterKu?: string;
  receiptFooterEn?: string;
  showLogoOnReceipt?: boolean;
  showBarcodeOnReceipt?: boolean;
  lowStockThreshold?: number;
  soundEnabled?: boolean;
  darkMode?: boolean;
  language?: 'ckb' | 'en' | 'ar';
  printReceiptOnSale?: boolean;
}

export type AiActionType =
  | 'adjust_stock'
  | 'record_expense'
  | 'add_product'
  | 'update_product_price'
  | 'add_customer'
  | 'record_customer_payment'
  | 'record_supplier_payment'
  | 'add_supplier';

export interface AiAction {
  type: AiActionType;
  params: Record<string, any>;
  descriptionKu: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  thinking?: string;
  action?: AiAction;
  actionExecuted?: boolean;
  isError?: boolean;
}

