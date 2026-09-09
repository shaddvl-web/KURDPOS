import { posStorage } from './storage';
import { posSound } from './audio';
import { AiAction, Product, Customer, Supplier, Expense } from '../types';

export interface ActionExecutionResult {
  success: boolean;
  messageKu: string;
  details?: any;
}

export function parseAiResponseForAction(text: string): {
  cleanedText: string;
  action?: AiAction;
} {
  const actionRegex = /```(?:action|json)\s*(\{[\s\S]*?"type"\s*:\s*"[\s\S]*?\})\s*```/i;
  const match = text.match(actionRegex);

  if (!match) {
    return { cleanedText: text };
  }

  try {
    const rawJson = match[1];
    const parsed = JSON.parse(rawJson);

    if (parsed && parsed.type) {
      const cleanedText = text.replace(match[0], '').trim();
      return {
        cleanedText,
        action: {
          type: parsed.type,
          params: parsed.params || {},
          descriptionKu: parsed.descriptionKu || getActionDefaultDescription(parsed.type, parsed.params),
        },
      };
    }
  } catch (err) {
    console.warn('Failed to parse AI action json:', err);
  }

  return { cleanedText: text };
}

function getActionDefaultDescription(type: string, params: any): string {
  switch (type) {
    case 'adjust_stock':
      return `نوێکردنەوەی بڕی کۆگا بۆ ${params.productName || 'کاڵا'} (${params.quantityChange > 0 ? '+' : ''}${params.quantityChange})`;
    case 'record_expense':
      return `تۆمارکردنی خەرجی: ${params.title || params.category} بە بڕی ${(params.amount || 0).toLocaleString()} د.ع`;
    case 'add_product':
      return `زیادکردنی کاڵای نوێ: ${params.nameKu}`;
    case 'update_product_price':
      return `گۆڕینی نرخی ${params.productName || 'کاڵا'}`;
    case 'add_customer':
      return `زیادکردنی کڕیاری نوێ: ${params.name}`;
    case 'record_customer_payment':
      return `وەرگرتنی قەرز لە کڕیار ${params.customerName}: ${(params.amount || 0).toLocaleString()} د.ع`;
    case 'record_supplier_payment':
      return `دانەوەی قەرزی دابینکەر ${params.supplierName}: ${(params.amount || 0).toLocaleString()} د.ع`;
    case 'add_supplier':
      return `زیادکردنی دابینکەری نوێ: ${params.name}`;
    default:
      return 'ئەنجامدانی فەرمانی سیستەم';
  }
}

export function executeAiAction(
  action: AiAction,
  onRefresh: () => void
): ActionExecutionResult {
  try {
    switch (action.type) {
      case 'adjust_stock': {
        const { productName, productId, barcode, quantityChange, notes } = action.params;
        const products = posStorage.getProducts();
        const prod = products.find(p =>
          (productId && p.id === productId) ||
          (barcode && p.barcode === barcode) ||
          (productName && (p.nameKu.toLowerCase().includes(productName.toLowerCase()) || p.nameEn.toLowerCase().includes(productName.toLowerCase())))
        );

        if (!prod) {
          posSound.playError();
          return {
            success: false,
            messageKu: `کاڵا بە ناوی (${productName || barcode || productId}) نەدۆزرایەوە لە کۆگادا!`,
          };
        }

        const delta = Number(quantityChange);
        if (isNaN(delta) || delta === 0) {
          posSound.playError();
          return { success: false, messageKu: 'بڕی ژمارەی کۆگا بە دروستی دیاری نەکراوە!' };
        }

        const oldStock = prod.stock;
        const newStock = Math.max(0, oldStock + delta);
        prod.stock = newStock;
        posStorage.saveProduct(prod);

        posStorage.recordStockMovement({
          productId: prod.id,
          productNameKu: prod.nameKu,
          type: delta > 0 ? 'adjustment_in' : 'adjustment_out',
          quantityChange: delta,
          stockBefore: oldStock,
          stockAfter: newStock,
          notes: notes || 'گۆڕانکاری لە ڕێگەی ئۆتۆمەیشنی AI',
        });

        posSound.playSuccess();
        onRefresh();

        return {
          success: true,
          messageKu: `کۆگای کاڵای (${prod.nameKu}) لە ${oldStock} گۆڕدرا بۆ ${newStock} (${delta > 0 ? `+${delta}` : delta} دانە).`,
          details: { product: prod, oldStock, newStock },
        };
      }

      case 'record_expense': {
        const { title, amount, category, notes } = action.params;
        const numAmount = Math.abs(Number(amount));
        if (isNaN(numAmount) || numAmount <= 0) {
          posSound.playError();
          return { success: false, messageKu: 'بڕی خەرجی دەبێت ژمارەیەکی دروست و زیاتر لە سفر بێت!' };
        }

        const shift = posStorage.getCurrentShift();
        const user = posStorage.getCurrentUser();

        const newExp: Expense = {
          id: 'exp-' + Date.now(),
          title: title || 'خەرجی گشتی',
          amount: numAmount,
          category: category || 'گشتی',
          date: new Date().toISOString(),
          shiftId: shift.id,
          cashierId: user.id,
          cashierName: user.nameKu,
          userName: user.nameKu,
          notes: notes || 'تۆمارکرا لەلایەن یاریدەدەری زیرەک (AI)',
        };

        posStorage.saveExpense(newExp);
        posSound.playSuccess();
        onRefresh();

        return {
          success: true,
          messageKu: `خەرجی نوێ تۆمارکرا: "${newExp.title}" بە بڕی ${numAmount.toLocaleString()} د.ع لە پۆلی (${newExp.category}).`,
          details: newExp,
        };
      }

      case 'add_product': {
        const { nameKu, nameEn, barcode, purchasePrice, sellingPrice, stock, minStock, categoryName } = action.params;
        if (!nameKu) {
          posSound.playError();
          return { success: false, messageKu: 'ناوی کاڵا پێویستە بۆ زیادکردن!' };
        }

        const categories = posStorage.getCategories();
        let cat = categories.find(c => categoryName && c.nameKu.includes(categoryName));
        if (!cat) cat = categories[0];

        const pPrice = Number(purchasePrice) || 0;
        const sPrice = Number(sellingPrice) || Math.round(pPrice * 1.25);
        const initStock = Number(stock) || 0;

        const newProd: Product = {
          id: 'prod-' + Date.now(),
          barcode: barcode || ('290' + Math.floor(1000000000 + Math.random() * 9000000000)),
          sku: 'SKU-' + Date.now().toString().slice(-5),
          nameKu,
          nameEn: nameEn || nameKu,
          categoryId: cat ? cat.id : 'cat-1',
          unit: 'دانە',
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          wholesalePrice: Math.round(sPrice * 0.9),
          stock: initStock,
          minStock: Number(minStock) || 5,
          maxStock: 500,
          taxRate: 0,
          active: true,
          createdAt: new Date().toISOString(),
        };

        posStorage.saveProduct(newProd);
        posSound.playSuccess();
        onRefresh();

        return {
          success: true,
          messageKu: `کاڵای نوێ بە سەرکەوتوویی زیادکرا: "${newProd.nameKu}" (بارکۆد: ${newProd.barcode}) بە نرخی فرۆشتنی ${sPrice.toLocaleString()} د.ع و بڕی سەرەتایی ${initStock}.`,
          details: newProd,
        };
      }

      case 'update_product_price': {
        const { productName, productId, barcode, sellingPrice, purchasePrice } = action.params;
        const products = posStorage.getProducts();
        const prod = products.find(p =>
          (productId && p.id === productId) ||
          (barcode && p.barcode === barcode) ||
          (productName && (p.nameKu.includes(productName) || p.nameEn.toLowerCase().includes(productName.toLowerCase())))
        );

        if (!prod) {
          posSound.playError();
          return { success: false, messageKu: `کاڵا بە ناوی (${productName}) نەدۆزرایەوە بۆ گۆڕینی نرخ!` };
        }

        let updatedKu = '';
        if (typeof sellingPrice === 'number' && sellingPrice > 0) {
          prod.sellingPrice = sellingPrice;
          updatedKu += `نرخی فرۆشتن: ${sellingPrice.toLocaleString()} د.ع `;
        }
        if (typeof purchasePrice === 'number' && purchasePrice > 0) {
          prod.purchasePrice = purchasePrice;
          updatedKu += `نرخی کڕین: ${purchasePrice.toLocaleString()} د.ع `;
        }

        posStorage.saveProduct(prod);
        posSound.playSuccess();
        onRefresh();

        return {
          success: true,
          messageKu: `نرخی کاڵای (${prod.nameKu}) نوێکرایەوە -> ${updatedKu}`,
          details: prod,
        };
      }

      case 'add_customer': {
        const { name, phone, creditLimit, address } = action.params;
        if (!name) {
          posSound.playError();
          return { success: false, messageKu: 'ناوی کڕیار دیاری نەکراوە!' };
        }

        const newCust: Customer = {
          id: 'cust-' + Date.now(),
          code: 'CUST-' + Date.now().toString().slice(-4),
          name,
          phone: phone || '',
          address: address || '',
          openingBalance: 0,
          currentBalance: 0,
          creditLimit: Number(creditLimit) || 500000,
          active: true,
          createdAt: new Date().toISOString(),
        };

        posStorage.saveCustomer(newCust);
        posSound.playSuccess();
        onRefresh();

        return {
          success: true,
          messageKu: `کڕیاری نوێ تۆمارکرا: "${newCust.name}" بە سنووری قەرزی ${(newCust.creditLimit).toLocaleString()} د.ع.`,
          details: newCust,
        };
      }

      case 'record_customer_payment': {
        const { customerName, customerId, amount, notes } = action.params;
        const customers = posStorage.getCustomers();
        const cust = customers.find(c =>
          (customerId && c.id === customerId) ||
          (customerName && c.name.includes(customerName))
        );

        if (!cust) {
          posSound.playError();
          return { success: false, messageKu: `کڕیار بە ناوی (${customerName}) نەدۆزرایەوە!` };
        }

        const payment = Math.abs(Number(amount));
        if (isNaN(payment) || payment <= 0) {
          posSound.playError();
          return { success: false, messageKu: 'بڕی پارەدانی قەرز دیاری نەکراوە!' };
        }

        posStorage.adjustCustomerBalance(cust.id, -payment);
        posStorage.logAudit('وەرگرتنی قەرز', `وەرگرتنی بڕی ${payment.toLocaleString()} د.ع لە کڕیار ${cust.name} (${notes || 'لەلایەن AI'})`);
        posSound.playCashDrawer();
        onRefresh();

        return {
          success: true,
          messageKu: `بڕی ${payment.toLocaleString()} د.ع لە قەرزی کڕیار (${cust.name}) داشکا. باڵانسی نوێ: ${Math.max(0, cust.currentBalance - payment).toLocaleString()} د.ع.`,
          details: { customer: cust, payment },
        };
      }

      case 'record_supplier_payment': {
        const { supplierName, supplierId, amount, notes } = action.params;
        const suppliers = posStorage.getSuppliers();
        const sup = suppliers.find(s =>
          (supplierId && s.id === supplierId) ||
          (supplierName && (s.name.includes(supplierName) || s.company.includes(supplierName)))
        );

        if (!sup) {
          posSound.playError();
          return { success: false, messageKu: `دابینکەر بە ناوی (${supplierName}) نەدۆزرایەوە!` };
        }

        const payment = Math.abs(Number(amount));
        if (isNaN(payment) || payment <= 0) {
          posSound.playError();
          return { success: false, messageKu: 'بڕی پارەی دانراو دیاری نەکراوە!' };
        }

        posStorage.adjustSupplierBalance(sup.id, -payment);
        posStorage.logAudit('دانەوەی قەرزی دابینکەر', `دانەوەی بڕی ${payment.toLocaleString()} د.ع بۆ دابینکەر ${sup.name} (${notes || 'لەلایەن AI'})`);
        posSound.playCashDrawer();
        onRefresh();

        const currentSupBal = sup.currentBalance ?? (sup as any).balance ?? 0;

        return {
          success: true,
          messageKu: `بڕی ${payment.toLocaleString()} د.ع درایە دابینکەر (${sup.name}). قەرزی ماوە: ${Math.max(0, currentSupBal - payment).toLocaleString()} د.ع.`,
          details: { supplier: sup, payment },
        };
      }

      case 'add_supplier': {
        const { name, company, phone, address } = action.params;
        if (!name) {
          posSound.playError();
          return { success: false, messageKu: 'ناوی دابینکەر دیاری نەکراوە!' };
        }

        const newSup: Supplier = {
          id: 'sup-' + Date.now(),
          name,
          company: company || name,
          phone: phone || '',
          address: address || '',
          openingBalance: 0,
          currentBalance: 0,
          createdAt: new Date().toISOString(),
        };

        posStorage.saveSupplier(newSup);
        posSound.playSuccess();
        onRefresh();

        return {
          success: true,
          messageKu: `دابینکەری نوێ تۆمارکرا: "${newSup.name}" (${newSup.company}).`,
          details: newSup,
        };
      }

      default:
        return { success: false, messageKu: `جۆری فەرمانی نادیار: ${(action as any).type}` };
    }
  } catch (err: any) {
    console.error('Execution error for AI action:', err);
    posSound.playError();
    return {
      success: false,
      messageKu: `هەڵە لە جێبەجێکردنی فەرمانەکە: ${err.message || 'هەڵەی نەزانراو'}`,
    };
  }
}
