import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingList, ShoppingListItem } from '@/types';
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface ListDetailPageProps {
  list: ShoppingList;
  onBack: () => void;
  onUpdateList: (list: ShoppingList) => void;
  onFinishShopping: (list: ShoppingList, checkedItems: ShoppingListItem[]) => void;
}

export function ListDetailPage({ list, onBack, onUpdateList, onFinishShopping }: ListDetailPageProps) {
  const [items, setItems] = useState<ShoppingListItem[]>(list.items);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('un');
  const [newPrice, setNewPrice] = useState('');

  const sorted = useMemo(() => {
    const unchecked = items.filter(i => !i.is_checked);
    const checked = items.filter(i => i.is_checked);
    return [...unchecked, ...checked];
  }, [items]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: !i.is_checked } : i));
  };

  const addItem = () => {
    if (!newProduct.trim()) return;
    const newItem: ShoppingListItem = {
      id: Date.now().toString(),
      list_id: list.id,
      product_name: newProduct.trim(),
      category: 'Geral',
      quantity: parseFloat(newQty) || 1,
      unit: newUnit,
      estimated_price: parseFloat(newPrice) || 0,
      actual_price: 0,
      is_checked: false,
    };
    setItems(prev => [newItem, ...prev]);
    setNewProduct('');
    setNewQty('1');
    setNewPrice('');
    setShowAddItem(false);
  };

  const handleFinish = () => {
    const checked = items.filter(i => i.is_checked);
    const unchecked = items.filter(i => !i.is_checked);

    if (checked.length === 0) {
      toast.error('Selecione ao menos um item para encerrar.');
      return;
    }

    const updatedList: ShoppingList = {
      ...list,
      items: unchecked,
      total_items: unchecked.length,
      checked_items: 0,
      status: unchecked.length === 0 ? 'completed' : 'active',
    };

    onFinishShopping(updatedList, checked);
    toast.success(`${checked.length} item(ns) movido(s) para estoque!`);
  };

  const checkedCount = items.filter(i => i.is_checked).length;

  return (
    <div className="pb-20">
      <PageHeader
        title={list.name}
        subtitle={`${checkedCount}/${items.length} itens`}
        action={
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
          </button>
        }
      />

      <div className="p-4 space-y-3">
        {/* Add item button */}
        <Button size="sm" onClick={() => setShowAddItem(true)} className="gradient-primary text-primary-foreground border-0 w-full">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Item
        </Button>

        {/* Add item form */}
        <AnimatePresence>
          {showAddItem && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-lg shadow-card p-4 space-y-3">
                <input
                  value={newProduct}
                  onChange={e => setNewProduct(e.target.value)}
                  placeholder="Nome do produto..."
                  className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 ring-primary/30"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                />
                <div className="flex gap-2">
                  <input
                    value={newQty}
                    onChange={e => setNewQty(e.target.value)}
                    placeholder="Qtd"
                    type="number"
                    className="w-16 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 ring-primary/30"
                  />
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 ring-primary/30"
                  >
                    <option value="un">un</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                  </select>
                  <input
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="Preço"
                    type="number"
                    step="0.01"
                    className="w-24 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 ring-primary/30"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addItem} className="gradient-primary text-primary-foreground border-0">Adicionar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddItem(false)}>Cancelar</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items list */}
        <div className="space-y-1.5">
          <AnimatePresence>
            {sorted.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                onClick={() => toggleItem(item.id)}
                className={`bg-card rounded-lg shadow-card p-3 flex items-center gap-3 cursor-pointer transition-opacity ${
                  item.is_checked ? 'opacity-50' : ''
                }`}
              >
                <Checkbox
                  checked={item.is_checked}
                  onCheckedChange={() => toggleItem(item.id)}
                  onClick={e => e.stopPropagation()}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-card-foreground ${item.is_checked ? 'line-through' : ''}`}>
                    {item.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit}
                    {item.estimated_price > 0 && ` · R$ ${item.estimated_price.toFixed(2)}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{item.category}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Lista vazia. Adicione itens acima.</p>
          )}
        </div>

        {/* Finish shopping */}
        {items.length > 0 && (
          <Button
            onClick={handleFinish}
            className="w-full gradient-primary text-primary-foreground border-0 h-12 text-base font-semibold"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Encerrar Compras ({checkedCount} item{checkedCount !== 1 ? 's' : ''})
          </Button>
        )}
      </div>
    </div>
  );
}
