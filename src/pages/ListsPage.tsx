import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { mockLists } from '@/data/mockData';
import { Plus, ShoppingCart, CheckCircle2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShoppingList, ShoppingListItem, StockItem } from '@/types';
import { ListDetailPage } from './ListDetailPage';
import { toast } from 'sonner';

type Filter = 'active' | 'completed' | 'archived';

export function ListsPage() {
  const [filter, setFilter] = useState<Filter>('active');
  const [showNewList, setShowNewList] = useState(false);
  const [newName, setNewName] = useState('');
  const [lists, setLists] = useState<ShoppingList[]>(mockLists);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  const filtered = lists.filter(l => {
    if (filter === 'active') return l.status === 'active';
    if (filter === 'completed') return l.status === 'completed';
    return l.status === 'archived';
  });

  const createList = () => {
    if (!newName.trim()) return;
    const newList: ShoppingList = {
      id: Date.now().toString(), name: newName.trim(), status: 'active',
      total_items: 0, checked_items: 0, estimated_total: 0, actual_total: 0,
      created_at: new Date().toISOString().slice(0, 10), items: [],
    };
    setLists(prev => [newList, ...prev]);
    setNewName('');
    setShowNewList(false);
  };

  const handleFinishShopping = (updatedList: ShoppingList, checkedItems: ShoppingListItem[]) => {
    setLists(prev => prev.map(l => l.id === updatedList.id ? updatedList : l));
    const existingStock: StockItem[] = JSON.parse(localStorage.getItem('stock_items') || '[]');
    checkedItems.forEach(item => {
      const existing = existingStock.find(s => s.product_name.toLowerCase() === item.product_name.toLowerCase());
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        existingStock.push({
          id: `stock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          product_name: item.product_name, category: item.category,
          quantity: item.quantity, unit: item.unit, min_quantity: 1,
          daily_consumption_rate: 0.1, status: 'ok',
          last_price: item.estimated_price || item.actual_price,
        });
      }
    });
    localStorage.setItem('stock_items', JSON.stringify(existingStock));
    const history = JSON.parse(localStorage.getItem('purchase_history') || '[]');
    checkedItems.forEach(item => {
      history.push({
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        product_name: item.product_name, category: item.category,
        quantity: item.quantity, price: item.actual_price || item.estimated_price,
        total_price: (item.actual_price || item.estimated_price) * item.quantity,
        store_name: 'Compra manual', purchase_date: new Date().toISOString().slice(0, 10),
        list_id: updatedList.id,
      });
    });
    localStorage.setItem('purchase_history', JSON.stringify(history));
    setSelectedList(null);
  };

  const handleUpdateList = (updatedList: ShoppingList) => {
    setLists(prev => prev.map(l => l.id === updatedList.id ? updatedList : l));
  };

  if (selectedList) {
    const current = lists.find(l => l.id === selectedList.id) || selectedList;
    return (
      <ListDetailPage
        list={current}
        onBack={() => setSelectedList(null)}
        onUpdateList={handleUpdateList}
        onFinishShopping={handleFinishShopping}
      />
    );
  }

  const filters: { id: Filter; label: string; icon?: typeof ShoppingCart }[] = [
    { id: 'active', label: 'Ativas', icon: ShoppingCart },
    { id: 'completed', label: 'Concluídas', icon: CheckCircle2 },
    { id: 'archived', label: 'Arquivo', icon: Archive },
  ];

  return (
    <div className="pb-20">
      <PageHeader
        title="Listas de Compras"
        subtitle="Organize suas compras"
        action={
          <button onClick={() => setShowNewList(true)} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-elevated">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          {filters.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* New List Form */}
        <AnimatePresence>
          {showNewList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nome da lista..."
                  className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 ring-primary/30"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && createList()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={createList} className="gradient-primary text-primary-foreground border-0">
                    Criar Lista
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewList(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lists */}
        <motion.div layout className="space-y-3">
          {filtered.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedList(l)}
              className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{l.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.checked_items}/{l.total_items} itens</p>
                </div>
              </div>
              <div className="mt-3 w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full gradient-primary transition-all"
                  style={{ width: `${l.total_items ? (l.checked_items / l.total_items) * 100 : 0}%` }}
                />
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma lista encontrada</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
