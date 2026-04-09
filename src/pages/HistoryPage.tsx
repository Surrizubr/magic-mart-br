import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { getHistory } from '@/data/mockData';
import { MapPin, ScanLine, Clock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categoryColors: Record<string, string> = {
  'Grãos': 'bg-accent text-accent-foreground',
  'Laticínios': 'bg-accent text-accent-foreground',
  'Bebidas': 'bg-orange-50 text-orange-700',
  'Frutas': 'bg-green-50 text-green-700',
  'Carnes': 'bg-orange-50 text-orange-700',
  'Limpeza': 'bg-blue-50 text-blue-700',
  'Higiene': 'bg-pink-50 text-pink-700',
  'Padaria': 'bg-amber-50 text-amber-700',
  'Alimentos': 'bg-accent text-accent-foreground',
  'Hortifruti': 'bg-green-50 text-green-700',
};

const categoryIcons: Record<string, string> = {
  'Padaria': '🍞', 'Alimentos': '🛒', 'Higiene': '♥', 'Limpeza': '✨',
  'Bebidas': '🥤', 'Grãos': '🛒', 'Laticínios': '🧀', 'Carnes': '🥩',
  'Frutas': '🍎', 'Hortifruti': '🥬',
};

interface HistoryPageProps {
  onNavigateToScanner?: () => void;
  onBack?: () => void;
}

export function HistoryPage({ onNavigateToScanner, onBack }: HistoryPageProps) {
  const history = getHistory();
  const totalMonth = history.reduce((sum, h) => sum + h.total_price, 0);

  const grouped = history.reduce<Record<string, typeof history>>((acc, h) => {
    (acc[h.purchase_date] ||= []).push(h);
    return acc;
  }, {});

  return (
    <div className="pb-20">
      <PageHeader
        title="Histórico"
        subtitle="Suas compras anteriores"
        onBack={onBack}
        action={
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> Abr 2026
          </button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4">
        {/* Scanner button */}
        {onNavigateToScanner && (
          <Button onClick={onNavigateToScanner} className="w-full gradient-primary text-primary-foreground border-0 h-10">
            <ScanLine className="w-4 h-4 mr-2" /> Scanner Cupom
          </Button>
        )}

        {/* Total */}
        <div className="bg-accent/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary">Total do mês</p>
            <p className="text-xs text-muted-foreground">Abril De 2026</p>
          </div>
          <p className="text-2xl font-bold text-primary">R$ {totalMonth.toFixed(2)}</p>
        </div>

        {/* Grouped by date */}
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
          const dayTotal = items.reduce((s, i) => s + i.total_price, 0);
          const byStore = items.reduce<Record<string, typeof items>>((acc, i) => {
            (acc[i.store_name] ||= []).push(i);
            return acc;
          }, {});

          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-foreground">
                  {new Date(date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </p>
                <p className="text-sm text-muted-foreground">R$ {dayTotal.toFixed(2)}</p>
              </div>

              {Object.entries(byStore).map(([store, storeItems]) => {
                const storeTotal = storeItems.reduce((s, i) => s + i.total_price, 0);
                return (
                  <div key={store} className="mb-3">
                    {/* Store header */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-foreground uppercase">{store}</span>
                        <button className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-2">
                          Editar endereço <Pencil className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">R$ {storeTotal.toFixed(2)}</span>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {storeItems.map(item => {
                        const catColor = categoryColors[item.category] || 'bg-accent text-accent-foreground';
                        const catIcon = categoryIcons[item.category] || '🛒';
                        return (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catColor} flex items-center gap-1`}>
                                  {catIcon} {item.category}
                                </span>
                                <span className="text-xs text-muted-foreground">{item.quantity} un</span>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-foreground">R$ {item.total_price.toFixed(2)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
