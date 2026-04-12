import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { getStock } from '@/data/mockData';
import { Plus, Minus, Search, Pencil, ShoppingCart, Brain } from 'lucide-react';
import { StockItem } from '@/types';
import { recalculateAllConsumptionRates } from '@/lib/consumptionCalculator';

type StatusFilter = 'all' | 'critical' | 'low' | 'ok';

const statusConfig = {
  critical: { label: 'Crítico', dot: 'bg-destructive', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  low: { label: 'Baixo', dot: 'bg-warning', class: 'bg-warning/10 text-warning-foreground border-warning/20' },
  ok: { label: 'OK', dot: 'bg-primary', class: 'bg-accent text-accent-foreground border-primary/20' },
  expired: { label: 'Vencido', dot: 'bg-muted-foreground', class: 'bg-muted text-muted-foreground border-border' },
};

const categoryIcons: Record<string, string> = {
  'Laticínios': '🧀', 'Grãos': '🛒', 'Bebidas': '🥤', 'Temperos': '🧄',
  'Limpeza': '✨', 'Carnes': '🥩', 'Frutas': '🍎', 'Alimentos': '🛒',
  'Higiene': '♥', 'Hortifruti': '🥬', 'Padaria': '🍞',
};

interface StockPageProps {
  onBack?: () => void;
}

export function StockPage({ onBack }: StockPageProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [stock, setStock] = useState<StockItem[]>(() => {
    recalculateAllConsumptionRates();
    return getStock();
  });
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState('');

  useEffect(() => {
    localStorage.setItem('stock_items', JSON.stringify(stock));
  }, [stock]);

  const filtered = stock.filter(s => {
    if (search && !s.product_name.toLowerCase().includes(search.toLowerCase()) &&
        !s.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'all' && s.status !== filter) return false;
    return true;
  });

  const updateQty = (id: string, delta: number) => {
    setStock(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s));
  };

  const zeroQty = (id: string) => {
    setStock(prev => prev.map(s => s.id === id ? { ...s, quantity: 0 } : s));
  };

  const deleteItem = (id: string) => {
    setStock(prev => prev.filter(s => s.id !== id));
  };

  const filters: { id: StatusFilter; label: string; dot?: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'critical', label: 'Crítico', dot: 'bg-destructive' },
    { id: 'low', label: 'Baixo', dot: 'bg-warning' },
    { id: 'ok', label: 'OK', dot: 'bg-primary' },
  ];

  return (
    <div className="pb-20">
      <PageHeader
        title="Estoque"
        subtitle={`${stock.length} produtos`}
        onBack={onBack}
        action={
          <button className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-elevated">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por produto ou categoria..."
            className="w-full bg-card rounded-xl border border-border pl-9 pr-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 ring-primary/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {filtered.map((s, i) => {
            const cfg = statusConfig[s.status];
            const daysLeft = s.daily_consumption_rate > 0 ? Math.ceil(s.quantity / s.daily_consumption_rate) : 99;
            const emoji = categoryIcons[s.category] || '🛒';
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{s.product_name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.class}`}>
                        {cfg.label}
                      </span>
                      <button className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground flex items-center gap-1`}>
                        {emoji} {s.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.quantity} {s.unit}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">· comprado 0d atrás</p>
                    <p className="text-[11px] font-medium text-warning mt-0.5">· ~{daysLeft}d restantes</p>
                    {(s as any).learned_consumption && (
                      <p className="text-[10px] text-primary mt-0.5 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        Consumo aprendido ({(s as any).purchase_count} compras, ~{(s as any).avg_duration_days}d por ciclo)
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(s.id, -1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4 text-secondary-foreground" />
                      </button>
                      <div className="text-center">
                        {editingQtyId === s.id ? (
                          <input
                            type="number"
                            autoFocus
                            value={editingQtyValue}
                            onChange={e => setEditingQtyValue(e.target.value)}
                            onBlur={() => {
                              const val = parseInt(editingQtyValue, 10);
                              if (!isNaN(val) && val >= 0) {
                                setStock(prev => prev.map(item => item.id === s.id ? { ...item, quantity: val } : item));
                              }
                              setEditingQtyId(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="w-12 text-lg font-bold text-foreground text-center bg-transparent border-b-2 border-primary outline-none"
                          />
                        ) : (
                          <span
                            className="text-lg font-bold text-foreground cursor-pointer"
                            onClick={() => { setEditingQtyId(s.id); setEditingQtyValue(String(s.quantity)); }}
                          >
                            {s.quantity}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-1">{s.unit}</span>
                      </div>
                      <button
                        onClick={() => updateQty(s.id, 1)}
                        className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">mín: {s.min_quantity} {s.unit}</p>
                    <div className="flex gap-2">
                      <button onClick={() => zeroQty(s.id)} className="text-[10px] text-primary font-medium">Zerar</button>
                      <button onClick={() => deleteItem(s.id)} className="text-[10px] text-destructive font-medium">Excluir</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
