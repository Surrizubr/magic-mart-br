import { StockItem, PurchaseHistory } from '@/types';

/**
 * Computes how many days are left for a stock item based on:
 *  - current quantity
 *  - daily consumption rate (learned from purchase history)
 *  - days elapsed since last purchase (so the value decreases day by day)
 */
export function computeDaysLeft(item: StockItem & { last_purchase_date?: string }): number {
  const rate = item.daily_consumption_rate || 0;
  if (rate <= 0) return 99;

  // Effective remaining quantity = quantity - (days since last purchase * rate)
  let effectiveQty = item.quantity;
  if (item.last_purchase_date) {
    const last = new Date(item.last_purchase_date).getTime();
    if (!isNaN(last)) {
      const daysElapsed = Math.max(0, (Date.now() - last) / (1000 * 60 * 60 * 24));
      effectiveQty = item.quantity - daysElapsed * rate;
    }
  }

  if (effectiveQty <= 0) return 0;
  return Math.max(0, Math.ceil(effectiveQty / rate));
}

/**
 * Derives stock status from days left and minimum quantity.
 * critical: 0-3 days left
 * low: 4-7 days left or below min_quantity
 * ok: otherwise
 */
export function deriveStatus(item: StockItem & { last_purchase_date?: string }): StockItem['status'] {
  const days = computeDaysLeft(item);
  if (days <= 3) return 'critical';
  if (days <= 7 || item.quantity <= item.min_quantity) return 'low';
  return 'ok';
}

/**
 * Updates all stock items in localStorage with fresh status based on
 * computed days left. Called on app start and once per day.
 */
export function refreshStockStatuses(): StockItem[] {
  const stock: (StockItem & { last_purchase_date?: string })[] =
    JSON.parse(localStorage.getItem('stock_items') || '[]');
  if (stock.length === 0) return stock;

  let changed = false;
  stock.forEach(item => {
    const newStatus = deriveStatus(item);
    if (item.status !== newStatus) {
      item.status = newStatus;
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('stock_items', JSON.stringify(stock));
  }
  localStorage.setItem('stock_last_refresh', new Date().toISOString().split('T')[0]);
  return stock;
}

/**
 * Sets last_purchase_date on stock items based on the most recent purchase
 * found in history. Should be called whenever history changes.
 */
export function syncLastPurchaseDates(): void {
  const stock: (StockItem & { last_purchase_date?: string })[] =
    JSON.parse(localStorage.getItem('stock_items') || '[]');
  const history: PurchaseHistory[] =
    JSON.parse(localStorage.getItem('purchase_history') || '[]');
  if (stock.length === 0) return;

  let changed = false;
  stock.forEach(item => {
    const matches = history
      .filter(h => h.product_name.toLowerCase() === item.product_name.toLowerCase())
      .map(h => h.purchase_date)
      .sort()
      .reverse();
    if (matches.length > 0 && item.last_purchase_date !== matches[0]) {
      item.last_purchase_date = matches[0];
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('stock_items', JSON.stringify(stock));
  }
}

/**
 * Returns a human-readable string for "comprado X dias atrás".
 */
export function daysSincePurchase(item: StockItem & { last_purchase_date?: string }): number | null {
  if (!item.last_purchase_date) return null;
  const last = new Date(item.last_purchase_date).getTime();
  if (isNaN(last)) return null;
  return Math.max(0, Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24)));
}

/**
 * Sort stock items by criticality (least days left first).
 */
export function sortByCriticality<T extends StockItem & { last_purchase_date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => computeDaysLeft(a) - computeDaysLeft(b));
}
