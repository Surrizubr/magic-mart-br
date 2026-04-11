import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { getHistory } from '@/data/mockData';
import { AlertTriangle, Info, MapPin, X, ChevronRight } from 'lucide-react';
import { PurchaseHistory } from '@/types';

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getLevelColor(level: number) {
  switch (level) {
    case 0: return 'bg-primary/20';
    case 1: return 'bg-destructive/60';
    case 2: return 'bg-warning/60';
    case 3: return 'bg-primary/40';
    default: return 'bg-primary/20';
  }
}

function getWeekColor(val: number) {
  if (val === 0) return 'bg-primary/30';
  return 'bg-warning';
}

interface SavingsPageProps {
  onBack?: () => void;
  onNavigateToHistory?: (date: string, store: string) => void;
}

export function SavingsPage({ onBack, onNavigateToHistory }: SavingsPageProps) {
  const history = getHistory();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Derive weekly heatmap from history (count purchases per weekday)
  const weekData = [0, 0, 0, 0, 0, 0, 0];
  history.forEach(h => {
    const d = new Date(h.purchase_date);
    const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
    weekData[day]++;
  });

  // Group history by day of month
  const dayPurchases: Record<number, PurchaseHistory[]> = {};
  history.forEach(h => {
    const d = new Date(h.purchase_date);
    const day = d.getDate();
    (dayPurchases[day] ||= []).push(h);
  });

  // Derive monthly heatmap
  const monthData = Array.from({ length: 31 }, (_, i) => {
    const items = dayPurchases[i + 1] || [];
    const count = items.length;
    let level = 0;
    if (count >= 3) level = 1;
    else if (count === 2) level = 2;
    else if (count === 1) level = 3;
    return { day: i + 1, level, count };
  });

  // Get stores for selected day
  const selectedDayStores = selectedDay
    ? Object.entries(
        (dayPurchases[selectedDay] || []).reduce<Record<string, { total: number; count: number; date: string }>>((acc, h) => {
          if (!acc[h.store_name]) {
            acc[h.store_name] = { total: 0, count: 0, date: h.purchase_date };
          }
          acc[h.store_name].total += h.total_price;
          acc[h.store_name].count += 1;
          return acc;
        }, {})
      )
    : [];

  const handleDayClick = (day: number) => {
    const items = dayPurchases[day];
    if (items && items.length > 0) {
      setSelectedDay(day);
    }
  };

  const handleStoreClick = (store: string) => {
    if (!selectedDay || !onNavigateToHistory) return;
    const items = dayPurchases[selectedDay];
    if (items && items.length > 0) {
      onNavigateToHistory(items[0].purchase_date, store);
    }
    setSelectedDay(null);
  };

  return (
    <div className="pb-20">
      <PageHeader
        title="Dias Mais Baratos"
        subtitle="Análise de preços por dia"
        onBack={onBack}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-5"
      >
        {/* Savings Card */}
        <div className="bg-accent/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🐷</span>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Economia Potencial</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">R$</span>
                <span className="text-sm text-muted-foreground">Necessário mais dados históricos</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-1.5 text-xs text-primary">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>Valor estimado. A economia real depende de disponibilidade, localização e variações de preço entre lojas.</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-primary/80" />
            <span className="text-xs text-muted-foreground">Muito barato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-primary/40" />
            <span className="text-xs text-muted-foreground">Barato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-warning" />
            <span className="text-xs text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-destructive/40" />
            <span className="text-xs text-muted-foreground">Caro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-destructive/60" />
            <span className="text-xs text-muted-foreground">Muito caro</span>
          </div>
        </div>

        {/* Weekly Heatmap */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Dias da Semana</h3>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">{day}</span>
                <div className={`w-full aspect-square rounded-lg ${getWeekColor(weekData[i])} flex items-center justify-center`}>
                  {weekData[i] > 0 && <span className="text-xs font-bold text-foreground">{weekData[i]}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>Baseado no seu histórico de compras</span>
          </div>
        </div>

        {/* Monthly Heatmap */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Dias do Mês</h3>
          <div className="grid grid-cols-7 gap-2">
            {monthData.map((d, i) => (
              <button
                key={i}
                onClick={() => handleDayClick(d.day)}
                className="flex flex-col items-center gap-1 group"
                disabled={d.count === 0}
              >
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
                <div className={`w-full aspect-square rounded-lg ${getLevelColor(d.level)} flex items-center justify-center transition-transform ${d.count > 0 ? 'cursor-pointer group-hover:scale-110 group-active:scale-95' : ''}`}>
                  {d.count > 0 && <span className="text-[10px] font-bold text-foreground">{d.count}</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>Toque em um dia com compras para ver os locais visitados</span>
          </div>
        </div>
      </motion.div>

      {/* Store Popup */}
      <AnimatePresence>
        {selectedDay !== null && selectedDayStores.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-40"
              onClick={() => setSelectedDay(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
            >
              <div className="bg-card rounded-t-2xl border-t border-border shadow-elevated p-4 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Dia {selectedDay}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDayStores.length} local(is) visitado(s)
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-secondary-foreground" />
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedDayStores.map(([store, info]) => (
                    <button
                      key={store}
                      onClick={() => handleStoreClick(store)}
                      className="w-full flex items-center gap-3 bg-secondary/50 hover:bg-secondary rounded-xl p-3 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{store}</p>
                        <p className="text-xs text-muted-foreground">
                          {info.count} {info.count === 1 ? 'item' : 'itens'} · R$ {info.total.toFixed(2)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
