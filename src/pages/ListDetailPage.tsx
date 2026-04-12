import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingList, ShoppingListItem } from '@/types';
import { ArrowLeft, Plus, ShoppingCart, CheckCircle, Trash2, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ListDetailPageProps {
  list: ShoppingList;
  onBack: () => void;
  onUpdateList: (list: ShoppingList) => void;
  onFinishShopping: (list: ShoppingList, checkedItems: ShoppingListItem[], storeName: string) => void;
}

export function ListDetailPage({ list, onBack, onUpdateList, onFinishShopping }: ListDetailPageProps) {
  const { currency, formatCurrency: fc } = useLanguage();
  const [items, setItems] = useState<ShoppingListItem[]>(list.items);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('un');
  const [newPrice, setNewPrice] = useState('');
  const [shoppingMode, setShoppingMode] = useState(list.status === 'shopping');
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    const updatedList: ShoppingList = {
      ...list,
      items,
      total_items: items.length,
      checked_items: items.filter(i => i.is_checked).length,
    };
    onUpdateList(updatedList);
  }, [items]);

  const sorted = useMemo(() => {
    if (!shoppingMode) return items;
    const unchecked = items.filter(i => !i.is_checked);
    const checked = items.filter(i => i.is_checked);
    return [...unchecked, ...checked];
  }, [items, shoppingMode]);

  const toggleItem = (id: string) => {
    if (!shoppingMode) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: !i.is_checked } : i));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Item removido.');
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

  const handleConcluir = () => {
    setShoppingMode(true);
    const updatedList: ShoppingList = {
      ...list,
      items,
      total_items: items.length,
      checked_items: 0,
      status: 'shopping',
    };
    onUpdateList(updatedList);
    toast.info('Selecione os itens comprados e clique em "Encerrar Compras".');
  };

  const handleEncerrarClick = () => {
    const checkedItems = items.filter(i => i.is_checked);
    if (checkedItems.length === 0) {
      toast.warning('Selecione pelo menos um item antes de encerrar.');
      return;
    }
    setShowStoreDialog(true);
  };

  const handleGeoLocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const road = addr.road || addr.pedestrian || addr.street || '';
          const number = addr.house_number || '';
          const shop = addr.shop || addr.supermarket || addr.building || addr.commercial || '';
          let name = '';
          if (shop) name = shop + ' - ';
          name += road;
          if (number) name += ', ' + number;
          if (!name.trim()) name = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          setStoreName(name.trim());
          toast.success('Localização obtida!');
        } catch {
          setStoreName(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
          toast.info('Coordenadas salvas (sem acesso à internet para nome da rua).');
        }
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        toast.error('Não foi possível obter localização.');
      },
      { enableHighAccuracy: true }
    );
  };

  const confirmEncerrar = () => {
    if (!storeName.trim()) {
      toast.error('Informe o local de compras.');
      return;
    }
    const checkedItems = items.filter(i => i.is_checked);
    const uncheckedItems = items.filter(i => !i.is_checked);

    onFinishShopping(list, checkedItems, storeName.trim());
    setShowStoreDialog(false);
    setStoreName('');

    if (uncheckedItems.length === 0) {
      const updatedList: ShoppingList = {
        ...list,
        items: [],
        total_items: 0,
        checked_items: 0,
        status: 'completed',
      };
      onUpdateList(updatedList);
      toast.success('Compras encerradas! Lista concluída.');
      onBack();
    } else {
      const resetItems = uncheckedItems.map(i => ({ ...i, is_checked: false }));
      const updatedList: ShoppingList = {
        ...list,
        items: resetItems,
        total_items: resetItems.length,
        checked_items: 0,
        status: 'shopping',
      };
      setItems(resetItems);
      onUpdateList(updatedList);
      toast.success(`${checkedItems.length} item(ns) adicionado(s) ao estoque. ${uncheckedItems.length} item(ns) permanecem na lista.`);
    }
  };

  const checkedCount = items.filter(i => i.is_checked).length;

  return (
    <div className="pb-20">
      <PageHeader
        title={list.name}
        subtitle={shoppingMode ? `${checkedCount}/${items.length} selecionados` : `${items.length} itens`}
        onBack={onBack}
      />

      <div className="p-4 space-y-3">
        {/* Add item button - always visible */}
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
                className={`bg-card rounded-lg shadow-card p-3 flex items-center gap-3 ${shoppingMode ? 'cursor-pointer' : ''} transition-opacity ${
                  item.is_checked && shoppingMode ? 'opacity-50' : ''
                }`}
              >
                {shoppingMode && (
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={() => toggleItem(item.id)}
                    onClick={e => e.stopPropagation()}
                    className="shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-card-foreground ${item.is_checked && shoppingMode ? 'line-through' : ''}`}>
                    {item.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit}
                    {item.estimated_price > 0 && ` · ${fc(item.estimated_price)}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground mr-1">{item.category}</span>
                <button
                  onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                  className="shrink-0 w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Lista vazia. Adicione itens acima.</p>
          )}
        </div>

        {/* Concluir Lista - only for non-shopping lists */}
        {items.length > 0 && !shoppingMode && (
          <Button
            onClick={handleConcluir}
            className="w-full gradient-primary text-primary-foreground border-0 h-12 text-base font-semibold"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Concluir Lista ({items.length} item{items.length !== 1 ? 's' : ''})
          </Button>
        )}

        {/* Encerrar Compras - shopping mode */}
        {shoppingMode && (
          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">
              ⚠️ Ao encerrar, os itens selecionados serão transferidos para o estoque.
            </p>
            <Button
              onClick={handleEncerrarClick}
              className="w-full bg-amber-600 hover:bg-amber-700 text-primary-foreground border-0 h-12 text-base font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Encerrar Compras ({checkedCount}/{items.length})
            </Button>
          </div>
        )}

        {/* Store location dialog */}
        <AnimatePresence>
          {showStoreDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
              onClick={() => setShowStoreDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-card rounded-xl border border-border p-5 w-full max-w-sm space-y-4 shadow-xl"
              >
                <h3 className="text-base font-bold text-card-foreground">Local de Compras</h3>
                <p className="text-xs text-muted-foreground">Informe onde você fez as compras:</p>
                <input
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="Ex: Supermercado Extra"
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 ring-primary/30"
                  autoFocus
                />
                <button
                  onClick={handleGeoLocation}
                  disabled={geoLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium w-full justify-center"
                >
                  {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {geoLoading ? 'Obtendo endereço...' : 'Usar minha localização'}
                </button>
                <div className="flex gap-2 pt-1">
                  <Button onClick={confirmEncerrar} className="flex-1 gradient-primary text-primary-foreground border-0">
                    Confirmar
                  </Button>
                  <Button variant="ghost" onClick={() => setShowStoreDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
