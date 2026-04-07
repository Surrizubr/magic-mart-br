import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const weekData = [0.85, 0.92, 0.78, 0.65, 0.88, 0.95, 0.72]; // price index

const monthData = Array.from({ length: 31 }, (_, i) => 0.6 + Math.random() * 0.4);

function getColor(value: number) {
  if (value < 0.7) return 'bg-primary/80';
  if (value < 0.8) return 'bg-primary/50';
  if (value < 0.9) return 'bg-warning/50';
  return 'bg-destructive/30';
}

export function SavingsPage() {
  const bestDay = weekDays[weekData.indexOf(Math.min(...weekData))];
  const savings = ((1 - Math.min(...weekData)) * 100).toFixed(0);

  return (
    <div className="pb-20">
      <PageHeader title="Dias Mais Baratos" subtitle="Baseado no seu histórico" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-5"
      >
        {/* Savings Card */}
        <div className="gradient-primary rounded-lg p-4 text-primary-foreground text-center">
          <p className="text-sm opacity-90">Economia potencial estimada</p>
          <p className="text-3xl font-bold mt-1">até {savings}%</p>
          <p className="text-xs opacity-80 mt-1">Comprando nas {bestDay}s</p>
        </div>

        {/* Weekly Heatmap */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Por dia da semana</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
                <div className={`w-full aspect-square rounded-md ${getColor(weekData[i])} flex items-center justify-center`}>
                  <span className="text-[10px] font-bold text-foreground">{(weekData[i] * 100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-primary/80" /><span className="text-[10px] text-muted-foreground">Barato</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-destructive/30" /><span className="text-[10px] text-muted-foreground">Caro</span></div>
          </div>
        </div>

        {/* Monthly Heatmap */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Por dia do mês</h2>
          <div className="grid grid-cols-7 gap-1">
            {monthData.map((val, i) => (
              <div key={i} className={`aspect-square rounded-sm ${getColor(val)} flex items-center justify-center`}>
                <span className="text-[9px] font-bold text-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
