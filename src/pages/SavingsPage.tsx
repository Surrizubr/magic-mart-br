import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const weekData = [0, 0, 0, 1, 1, 1, 1]; // 0 = no purchases, 1 = has purchases

const monthData = Array.from({ length: 31 }, (_, i) => {
  if (i < 4) return { day: i + 1, level: i === 0 ? 0 : Math.floor(Math.random() * 3) + 1 };
  return { day: i + 1, level: 0 };
});

// Colors: 0=muito barato(dark green), 1=barato(light green), 2=normal(yellow), 3=caro(orange), 4=muito caro(red)
function getLevelColor(level: number) {
  switch (level) {
    case 0: return 'bg-primary/20'; // no data / muito barato
    case 1: return 'bg-destructive/60'; // caro (has purchase)
    case 2: return 'bg-warning/60'; // normal
    case 3: return 'bg-primary/40'; // barato
    default: return 'bg-primary/20';
  }
}

function getWeekColor(val: number) {
  if (val === 0) return 'bg-primary/30'; // sem compra = barato
  return 'bg-warning'; // com compra = normal/caro
}

export function SavingsPage() {
  return (
    <div className="pb-20">
      <PageHeader
        title="Dias Mais Baratos"
        subtitle="Análise de preços por dia"
        left={
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
          </button>
        }
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
            <div className="w-4 h-4 rounded bg-orange-400" />
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
            <span>Toque em um dia para ver os locais visitados</span>
          </div>
        </div>

        {/* Monthly Heatmap */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Dias do Mês</h3>
          <div className="grid grid-cols-7 gap-2">
            {monthData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
                <div className={`w-full aspect-square rounded-lg ${getLevelColor(d.level)} flex items-center justify-center`}>
                  {d.level > 0 && <span className="text-[10px] font-bold text-foreground">{d.level}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
