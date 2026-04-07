import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { mockHistory } from '@/data/mockData';
import { MapPin } from 'lucide-react';

export function HistoryPage() {
  const totalMonth = mockHistory.reduce((sum, h) => sum + h.total_price, 0);

  // Group by date
  const grouped = mockHistory.reduce<Record<string, typeof mockHistory>>((acc, h) => {
    (acc[h.purchase_date] ||= []).push(h);
    return acc;
  }, {});

  return (
    <div className="pb-20">
      <PageHeader title="Histórico" subtitle="Abril 2026" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4">
        {/* Total */}
        <div className="bg-card rounded-lg shadow-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Total do mês</p>
          <p className="text-2xl font-bold text-primary">R$ {totalMonth.toFixed(2)}</p>
        </div>

        {/* Grouped */}
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
          const dayTotal = items.reduce((s, i) => s + i.total_price, 0);
          const byStore = items.reduce<Record<string, typeof items>>((acc, i) => {
            (acc[i.store_name] ||= []).push(i);
            return acc;
          }, {});

          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">{new Date(date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                <p className="text-xs text-muted-foreground">R$ {dayTotal.toFixed(2)}</p>
              </div>

              {Object.entries(byStore).map(([store, storeItems]) => (
                <div key={store} className="bg-card rounded-lg shadow-card p-3 mb-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-card-foreground">{store}</span>
                  </div>
                  <div className="space-y-1">
                    {storeItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-card-foreground">{item.product_name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">×{item.quantity}</span>
                          <span className="font-medium text-card-foreground">R$ {item.total_price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
