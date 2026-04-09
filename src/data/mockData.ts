import { ShoppingList, StockItem, PurchaseHistory } from '@/types';

const defaultLists: ShoppingList[] = [
  {
    id: '1', name: 'Compras da semana', status: 'active',
    total_items: 12, checked_items: 5, estimated_total: 187.50, actual_total: 0,
    created_at: '2026-04-05', items: [
      { id: '1a', list_id: '1', product_name: 'Arroz 5kg', category: 'Grãos', quantity: 1, unit: 'un', estimated_price: 22.90, actual_price: 0, is_checked: true },
      { id: '1b', list_id: '1', product_name: 'Feijão 1kg', category: 'Grãos', quantity: 2, unit: 'un', estimated_price: 8.50, actual_price: 0, is_checked: true },
      { id: '1c', list_id: '1', product_name: 'Leite integral', category: 'Laticínios', quantity: 6, unit: 'un', estimated_price: 5.49, actual_price: 0, is_checked: false },
      { id: '1d', list_id: '1', product_name: 'Banana prata', category: 'Frutas', quantity: 1, unit: 'kg', estimated_price: 7.90, actual_price: 0, is_checked: true },
      { id: '1e', list_id: '1', product_name: 'Café 500g', category: 'Bebidas', quantity: 1, unit: 'un', estimated_price: 18.90, actual_price: 0, is_checked: false },
    ],
  },
  {
    id: '2', name: 'Churrasco sábado', status: 'active',
    total_items: 8, checked_items: 0, estimated_total: 245.00, actual_total: 0,
    created_at: '2026-04-06', items: [],
  },
  {
    id: '3', name: 'Compras março', status: 'completed',
    total_items: 20, checked_items: 20, estimated_total: 380.00, actual_total: 367.42,
    created_at: '2026-03-15', items: [],
  },
];

const defaultStock: StockItem[] = [
  { id: 's1', product_name: 'Arroz 5kg', category: 'Grãos', quantity: 1, unit: 'un', min_quantity: 2, daily_consumption_rate: 0.14, status: 'low', last_price: 22.90 },
  { id: 's2', product_name: 'Feijão 1kg', category: 'Grãos', quantity: 0, unit: 'un', min_quantity: 1, daily_consumption_rate: 0.1, status: 'critical', last_price: 8.50 },
  { id: 's3', product_name: 'Leite integral', category: 'Laticínios', quantity: 3, unit: 'un', min_quantity: 2, daily_consumption_rate: 1, status: 'ok', last_price: 5.49 },
  { id: 's4', product_name: 'Café 500g', category: 'Bebidas', quantity: 1, unit: 'un', min_quantity: 1, daily_consumption_rate: 0.07, status: 'ok', last_price: 18.90 },
  { id: 's5', product_name: 'Azeite 500ml', category: 'Temperos', quantity: 0, unit: 'un', min_quantity: 1, daily_consumption_rate: 0.03, status: 'critical', last_price: 32.90 },
  { id: 's6', product_name: 'Papel higiênico', category: 'Limpeza', quantity: 4, unit: 'un', min_quantity: 6, daily_consumption_rate: 0.5, status: 'low', last_price: 19.90 },
];

const defaultHistory: PurchaseHistory[] = [
  { id: 'h1', product_name: 'Arroz 5kg', category: 'Grãos', quantity: 1, price: 22.90, total_price: 22.90, store_name: 'Supermercado Extra', purchase_date: '2026-04-03' },
  { id: 'h2', product_name: 'Feijão 1kg', category: 'Grãos', quantity: 2, price: 8.50, total_price: 17.00, store_name: 'Supermercado Extra', purchase_date: '2026-04-03' },
  { id: 'h3', product_name: 'Leite integral', category: 'Laticínios', quantity: 6, price: 5.49, total_price: 32.94, store_name: 'Atacadão', purchase_date: '2026-04-01' },
  { id: 'h4', product_name: 'Café 500g', category: 'Bebidas', quantity: 1, price: 18.90, total_price: 18.90, store_name: 'Atacadão', purchase_date: '2026-04-01' },
  { id: 'h5', product_name: 'Banana prata', category: 'Frutas', quantity: 2, price: 7.90, total_price: 15.80, store_name: 'Feira livre', purchase_date: '2026-03-28' },
  { id: 'h6', product_name: 'Carne moída', category: 'Carnes', quantity: 1, price: 32.90, total_price: 32.90, store_name: 'Supermercado Extra', purchase_date: '2026-03-25' },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

export function getStock(): StockItem[] {
  return loadFromStorage('stock_items', defaultStock);
}

export function getLists(): ShoppingList[] {
  return loadFromStorage('shopping_lists', defaultLists);
}

export function getHistory(): PurchaseHistory[] {
  return loadFromStorage('purchase_history', defaultHistory);
}

export function resetAllData() {
  localStorage.removeItem('stock_items');
  localStorage.removeItem('purchase_history');
  localStorage.removeItem('shopping_lists');
  localStorage.removeItem('savings_data');
  localStorage.removeItem('cheapest_days');
  // Set empty arrays so reload shows clean state
  localStorage.setItem('stock_items', '[]');
  localStorage.setItem('purchase_history', '[]');
  localStorage.setItem('shopping_lists', '[]');
}

// Keep backward-compatible exports for pages that import them directly
export const mockLists = defaultLists;
export const mockStock = defaultStock;
export const mockHistory = defaultHistory;

export const monthlySpending = [
  { month: 'Out', value: 620 },
  { month: 'Nov', value: 580 },
  { month: 'Dez', value: 710 },
  { month: 'Jan', value: 550 },
  { month: 'Fev', value: 490 },
  { month: 'Mar', value: 530 },
  { month: 'Abr', value: 187 },
];

export const categorySpending = [
  { name: 'Grãos', value: 39.90, fill: 'hsl(152, 60%, 42%)' },
  { name: 'Laticínios', value: 32.94, fill: 'hsl(200, 60%, 50%)' },
  { name: 'Bebidas', value: 18.90, fill: 'hsl(38, 90%, 50%)' },
  { name: 'Frutas', value: 15.80, fill: 'hsl(340, 60%, 50%)' },
  { name: 'Carnes', value: 32.90, fill: 'hsl(0, 60%, 50%)' },
  { name: 'Limpeza', value: 19.90, fill: 'hsl(270, 50%, 55%)' },
];
