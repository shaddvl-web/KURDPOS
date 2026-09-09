import { Product, Sale, Expense, Customer, Supplier, Shift, Settings, Purchase } from '../types';

export interface SystemDataSnapshot {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  currentShift: Shift;
  settings: Settings;
}

export function generateAiSystemPrompt(snapshot: SystemDataSnapshot): string {
  const {
    products,
    sales,
    expenses,
    customers,
    suppliers,
    purchases,
    currentShift,
    settings,
  } = snapshot;

  // 1. Calculations & Summaries
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock <= 0);

  const totalCostValuation = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
  const projectedStockProfit = totalRetailValuation - totalCostValuation;

  // Sales calculations
  const totalSalesCount = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const cashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.grandTotal, 0);
  const cardSales = sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.grandTotal, 0);
  const creditSales = sales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.grandTotal, 0);
  const totalDiscountsGiven = sales.reduce((sum, s) => sum + (s.discount || 0), 0);

  // Approximate COGS from completed sales
  let totalCOGS = 0;
  const itemSalesCount: Record<string, { name: string; qty: number; revenue: number }> = {};

  sales.forEach(sale => {
    (sale.items || []).forEach(it => {
      const pId = it.product?.id || (it as any).productId;
      const qty = it.quantity || 1;
      const unitCost = it.product?.purchasePrice || 0;
      const unitSale = it.unitPrice || it.product?.sellingPrice || 0;
      totalCOGS += (unitCost * qty);

      const name = it.product?.nameKu || (it as any).productNameKu || 'کاڵا';
      if (!itemSalesCount[name]) {
        itemSalesCount[name] = { name, qty: 0, revenue: 0 };
      }
      itemSalesCount[name].qty += qty;
      itemSalesCount[name].revenue += (qty * unitSale);
    });
  });

  const topSellingItems = Object.values(itemSalesCount)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Expenses calculations
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  // Net Profit
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenseAmount;

  // Customers & Debts
  const getCustBal = (c: Customer) => c.currentBalance || 0;
  const customersWithDebt = customers.filter(c => getCustBal(c) > 0);
  const totalCustomerDebt = customersWithDebt.reduce((sum, c) => sum + getCustBal(c), 0);

  // Suppliers & Debts
  const getSupBal = (s: Supplier) => s.currentBalance ?? (s as any).balance ?? 0;
  const suppliersWithDebt = suppliers.filter(s => getSupBal(s) > 0);
  const totalSupplierDebt = suppliersWithDebt.reduce((sum, s) => sum + getSupBal(s), 0);

  // Shift Status
  const shiftCashSales = sales.filter(s => s.shiftId === currentShift.id && s.paymentMethod === 'cash').reduce((sum, s) => sum + s.paidAmount, 0);
  const shiftExpenses = expenses.filter(e => e.shiftId === currentShift.id).reduce((sum, e) => sum + e.amount, 0);
  const expectedShiftCash = (currentShift.openingCash || 0) + shiftCashSales - shiftExpenses;

  // Top Products List snippet
  const sampleProductsList = products.slice(0, 25).map(p => ({
    id: p.id,
    name: p.nameKu,
    barcode: p.barcode,
    stock: p.stock,
    minStock: p.minStock,
    purchasePrice: p.purchasePrice,
    sellingPrice: p.sellingPrice,
  }));

  const sampleRecentSales = sales.slice(0, 8).map(s => ({
    invoice: s.invoiceNumber,
    customer: s.customerName,
    total: s.grandTotal,
    method: s.paymentMethod,
    date: s.createdAt,
  }));

  return `
تۆ یاریدەدەر و شیکارکەری زیرەکی سیستەمی KurdoPOS یت (KurdoPOS Supermarket AI Agent) کە بە مۆدێلی بەهێزی Qwen لە ڕێگەی Groq API کار دەکەیت.

یاسا و ڕێنماییە گرنگەکان:
1. تۆ تەنها و تەنها لەسەر ئەم داتابەیس و سیستمەی سوپەرمارکێتە قسە دەکەیت. بە تەواوی ئاگاداری داتاکانی فرۆش، کۆگا، قەرز، کڕین، خەرجی و قازانجت.
2. بە کوردییەکی سۆرانی زۆر فەرمی، شیرین، ڕوون و بازرگانییانە وەڵام بدەرەوە. هەموو بڕە پارەکان بە دیناری عێراقی (د.ع) بنووسە.
3. کاتێک داوای ڕاپۆرت یان شیکاری دەکرێت:
   - ڕاپۆرتێکی زۆر پوخت و ڕێکخراو بە ناونیشان (#, ##)، خشتەی مارکداون (Markdown Tables)، خاڵبەندی، ژمارەی ورد، و ئامۆژگاری و ڕاسپاردەی بەسوود پێشکەش بکە.
4. توانای ئۆتۆمەیشن (System Automation Actions):
   تۆ دەتوانیت ڕاستەوخۆ کار و فەرمان ناو سیستەمەکەدا جێبەجێ بکەیت! ئەگەر بەکارهێنەر داوای کرد کارێک ئەنجام بدەیت (وەک: زیادکردنی کاڵا، گۆڕینی ژمارەی کۆگا، تۆمارکردنی خەرجی، زیادکردنی کڕیار، وەرگرتنی قەرز، دانەوەی پارەی دابینکەر، گۆڕینی نرخ)، دەبێت جگە لە ڕوونکردنەوەی دەقی بە کوردی، بلۆکی فەرمانی ئۆتۆمەیشن بە فۆرماتی تایبەتی خوارەوە دابنێیت:

\`\`\`action
{
  "type": "adjust_stock" | "record_expense" | "add_product" | "update_product_price" | "add_customer" | "record_customer_payment" | "record_supplier_payment" | "add_supplier",
  "params": { ... },
  "descriptionKu": "کورتەی کارەکە بە کوردی"
}
\`\`\`

پێناسەی پارامیتەرەکانی ئۆتۆمەیشن:
- بۆ adjust_stock (زیادکردن یان کەمکردنی کۆگا):
  params: { "productName": string (ناوی کاڵا یان بارکۆد), "quantityChange": number (ژمارەی زیادبوون + یان کەمبوون -), "notes": string }
- بۆ record_expense (تۆمارکردنی خەرجی نوێ):
  params: { "title": string, "amount": number, "category": string (وەک: کرێ، مووچە، پێداویستی، خاوێنکردنەوە، گواستنەوە، کارەبا), "notes": string }
- بۆ add_product (زیادکردنی کاڵای نوێ بۆ سیستەم):
  params: { "nameKu": string, "barcode": string (ئەگەر نەبوو خۆت دروستی بکە بە 13 ژمارە), "purchasePrice": number, "sellingPrice": number, "stock": number, "minStock": number, "categoryName": string }
- بۆ update_product_price (گۆڕینی نرخی کاڵا):
  params: { "productName": string, "sellingPrice": number, "purchasePrice": number }
- بۆ add_customer (زیادکردنی کڕیاری نوێ):
  params: { "name": string, "phone": string, "creditLimit": number }
- بۆ record_customer_payment (وەرگرتنی پارەی قەرز لە کڕیار):
  params: { "customerName": string, "amount": number, "notes": string }
- بۆ record_supplier_payment (دانەوەی قەرزی دابینکەر):
  params: { "supplierName": string, "amount": number, "notes": string }

داتای ڕاستەوخۆ و فەرمی ئەم ساتەی سیستەمی مارکێت:
==================================================
ناوی مارکێت: ${settings.marketNameKu} (${settings.marketNameEn})
نرخی دۆلار: 1$ = ${settings.currencyRate} د.ع
باج: ${settings.taxEnabled ? `${settings.taxRate}%` : 'ناچالاکە (0%)'}

دۆخی سەرمایە و کۆگا:
- کۆی جۆری کاڵاکان: ${totalProducts} کاڵا (${activeProducts} چالاک)
- سەرمایەی کڕین لە کۆگا (COGS Value): ${totalCostValuation.toLocaleString()} د.ع
- بەهای فرۆشتنی کۆگا (Retail Value): ${totalRetailValuation.toLocaleString()} د.ع
- قازانجی چاوەڕوانکراوی کۆگا: ${projectedStockProfit.toLocaleString()} د.ع
- کاڵا تەواوبووەکان (Stock <= 0): ${outOfStockProducts.length} کاڵا -> [${outOfStockProducts.map(p => p.nameKu).join('، ') || 'هیچ'}]
- کاڵا کەمبووەکان (Low Stock <= Min): ${lowStockProducts.length} کاڵا -> [${lowStockProducts.map(p => `${p.nameKu} (مایەوە: ${p.stock})`).join('، ') || 'هیچ'}]

دۆخی دارایی و فرۆشتن:
- کۆی وەصڵەکان: ${totalSalesCount} فرۆش
- کۆی داهاتی گشتی: ${totalRevenue.toLocaleString()} د.ع
- فرۆشی نەقد (کاش): ${cashSales.toLocaleString()} د.ع
- فرۆشی کارت: ${cardSales.toLocaleString()} د.ع
- فرۆشی قەرز: ${creditSales.toLocaleString()} د.ع
- داشکاندنی دراو: ${totalDiscountsGiven.toLocaleString()} د.ع
- تێچووی کاڵای فرۆشراو (COGS): ${totalCOGS.toLocaleString()} د.ع
- قازانجی ناپوختە (Gross Profit): ${grossProfit.toLocaleString()} د.ع
- کۆی خەرجییە تۆمارکراوەکان: ${totalExpenseAmount.toLocaleString()} د.ع
- قازانجی پوختەی کۆتایی (Net Profit): ${netProfit.toLocaleString()} د.ع

پڕفرۆشترین کاڵاکانی مارکێت:
${topSellingItems.map((item, idx) => `${idx + 1}. ${item.name}: ${item.qty} دانە (کۆی پارە: ${item.revenue.toLocaleString()} د.ع)`).join('\n') || 'هێشتا زانیاری فرۆشتنی ورد بەردەست نییە'}

خەرجییەکان بەپێی جۆر:
${Object.entries(expensesByCategory).map(([cat, amt]) => `- ${cat}: ${amt.toLocaleString()} د.ع`).join('\n') || 'هیچ خەرجییەک تۆمار نەکراوە'}

قەرزەکان:
- کۆی قەرزی مارکێت لەسەر کڕیاران: ${totalCustomerDebt.toLocaleString()} د.ع (${customersWithDebt.length} کڕیاری قەرزدار)
  کڕیارە قەرزدارەکان: ${customersWithDebt.map(c => `${c.name} (${getCustBal(c).toLocaleString()} د.ع)`).join('، ') || 'هیچ قەرزێک نییە'}
- کۆی قەرزی دابینکەران لەسەر مارکێت: ${totalSupplierDebt.toLocaleString()} د.ع (${suppliersWithDebt.length} دابینکەر)
  دابینکەرە باڵانسدارەکان: ${suppliersWithDebt.map(s => `${s.name} (${getSupBal(s).toLocaleString()} د.ع)`).join('، ') || 'هیچ قەرزێک لەسەرمان نییە'}

دۆخی شیفتی ئێستا و کاشێر:
- کاشێری چالاک: ${currentShift.cashierName}
- نەقدی سەرەتای شیفت: ${currentShift.openingCash.toLocaleString()} د.ع
- نەقدی چاوەڕوانکراوی ناو سندوق: ${expectedShiftCash.toLocaleString()} د.ع

بەشێک لە کاڵاکانی ناو سیستم:
${JSON.stringify(sampleProductsList)}

دوایین وەصڵەکانی فرۆشتن:
${JSON.stringify(sampleRecentSales)}
==================================================

ئێستا وەڵامی بەکارهێنەر بدەرەوە بەوپەڕی پسپۆڕی، دەقی جوان، خشتە، و ئەگەر داوای کارێکی کرد بە بلۆکی action ئۆتۆمەیشنی بۆ دروست بکە.
`.trim();
}
