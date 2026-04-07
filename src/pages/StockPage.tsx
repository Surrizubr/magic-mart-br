import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { mockStock } from '@/data/mockData';
import { Plus, Minus, Search } from 'lucide-react';
import { StockItem } from '@/types';

type StatusFilter = 'all' | 'critical' | 'low' | 'ok';

const statusConfig = {
  critical: { label: 'Crítico', emoji: '🔴', class: 'bg-destructive/10 text-destructive' },
  low: { label: 'Baixo', emoji: '🟡', class: 'bg-warning-bg text-warning-foreground' },
  ok: { label: 'OK', emoji: '🟢', class: 'bg-accent text-accent-foreground' },
  expired: { label: 'Vencido', emoji: '⚫', class: 'bg-muted text-muted-foreground' },
};

export function StockPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [stock, setStock] = useState<StockItem[]>(mockStock);

  const filtered = stock.filter(s => {
    if (search && !s.product_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'all' && s.status !== filter) return false;
    return true;
  });

  const updateQty = (id: string, delta: number) => {
    setStock(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s));
  };

  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'critical', label: '🔴 Crítico' },
    { id: 'low', label: '🟡 Baixo' },
    { id: 'ok', label: '🟢 OK' },
  ];

  return (
    <div className="pb-20">
      <PageHeader
        title="Estoque"
        subtitle={`${stock.length} produtos`}
        action={
          <button className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary-foreground" />
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
            placeholder="Buscar produto..."
            className="w-full bg-card rounded-lg shadow-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 ring-primary/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-2">
          {filtered.map((s, i) => {
            const cfg = statusConfig[s.status];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-lg shadow-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-card-foreground">{s.product_name}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.class}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.category} · Mín: {s.min_quantity} · R$ {s.last_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(s.id, -1)}
                      className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"
                    >
                      <Minus className="w-3.5 h-3.5 text-secondary-foreground" />
                    </button>
                    <span className="text-sm font-bold text-foreground w-6 text-center">{s.quantity}</span>
                    <button
                      onClick={() => updateQty(s.id, 1)}
                      className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary-foreground" />
                    </button>
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
