import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { mockLists, mockStock } from '@/data/mockData';
import { Plus, CheckCircle2, Archive } from 'lucide-react';
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
    // Update the list (remove checked items)
    setLists(prev => prev.map(l => l.id === updatedList.id ? updatedList : l));

    // Save checked items to stock via localStorage
    const existingStock: StockItem[] = JSON.parse(localStorage.getItem('stock_items') || '[]');
    checkedItems.forEach(item => {
      const existing = existingStock.find(s => s.product_name.toLowerCase() === item.product_name.toLowerCase());
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        existingStock.push({
          id: `stock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          product_name: item.product_name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          min_quantity: 1,
          daily_consumption_rate: 0.1,
          status: 'ok',
          last_price: item.estimated_price || item.actual_price,
        });
      }
    });
    localStorage.setItem('stock_items', JSON.stringify(existingStock));

    // Save to history
    const history = JSON.parse(localStorage.getItem('purchase_history') || '[]');
    checkedItems.forEach(item => {
      history.push({
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        price: item.actual_price || item.estimated_price,
        total_price: (item.actual_price || item.estimated_price) * item.quantity,
        store_name: 'Compra manual',
        purchase_date: new Date().toISOString().slice(0, 10),
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

  const filters: { id: Filter; label: string }[] = [
    { id: 'active', label: 'Ativas' },
    { id: 'completed', label: 'Concluídas' },
    { id: 'archived', label: 'Arquivadas' },
  ];

  return (
    <div className="pb-20">
      <PageHeader
        title="Listas"
        subtitle={`${lists.filter(l => l.status === 'active').length} ativa(s)`}
        action={
          <Button size="sm" onClick={() => setShowNewList(true)} className="gradient-primary text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-1" /> Nova
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
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
              <div className="bg-card rounded-lg shadow-card p-4 space-y-3">
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
        <motion.div layout className="space-y-2">
          {filtered.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedList(l)}
              className="bg-card rounded-lg shadow-card p-4 cursor-pointer hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-card-foreground">{l.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.created_at}</p>
                </div>
                <div className="flex items-center gap-2">
                  {l.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  {l.status === 'archived' && <Archive className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{l.checked_items}/{l.total_items} itens</span>
                  <span>R$ {l.estimated_total.toFixed(2)}</span>
                </div>
                <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-primary"
                    style={{ width: `${l.total_items ? (l.checked_items / l.total_items) * 100 : 0}%` }}
                  />
                </div>
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
