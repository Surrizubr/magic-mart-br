export interface ShoppingList {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  total_items: number;
  checked_items: number;
  estimated_total: number;
  actual_total: number;
  created_at: string;
  items: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  actual_price: number;
  is_checked: boolean;
}

export interface StockItem {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  expiry_date?: string;
  daily_consumption_rate: number;
  status: 'ok' | 'low' | 'critical' | 'expired';
  last_price: number;
}

export interface PurchaseHistory {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  price: number;
  total_price: number;
  store_name: string;
  store_lat?: number;
  store_lng?: number;
  purchase_date: string;
  list_id?: string;
}

export type SubscriptionStatus = 'not_started' | 'trial' | 'login_required' | 'inactive' | 'active';

export type TabId = 'home' | 'lists' | 'stock' | 'savings' | 'history' | 'reports' | 'scanner' | 'shopping' | 'share';
