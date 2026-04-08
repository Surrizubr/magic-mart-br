import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { TrialBanner } from '@/components/TrialBanner';
import { mockLists, mockStock } from '@/data/mockData';
import { ScanLine, ListPlus, Package, Users, Clock, PiggyBank, AlertTriangle, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { TabId } from '@/types';

interface HomePageProps {
  daysLeft: number;
  isTrial: boolean;
  onNavigate: (tab: TabId) => void;
}

const statsData = [
  { label: 'Gasto do mês', value: 'R$ 187,50', icon: '💰' },
  { label: 'Itens estoque', value: '6', icon: '📦' },
  { label: 'Listas ativas', value: '2', icon: '📋' },
  { label: 'Variação mês', value: '-8%', icon: '📈' },
];

const quickActions = [
  { label: 'Nova Lista', icon: ListPlus, tab: 'lists' as TabId },
  { label: 'Estoque', icon: Package, tab: 'stock' as TabId },
  { label: 'Scanner', icon: ScanLine, tab: 'scanner' as TabId },
  { label: 'Família', icon: Users, tab: 'home' as TabId },
  { label: 'Histórico', icon: Clock, tab: 'history' as TabId },
  { label: 'Economizar', icon: PiggyBank, tab: 'savings' as TabId },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function HomePage({ daysLeft, isTrial, onNavigate }: HomePageProps) {
  const criticalStock = mockStock.filter(s => s.status === 'critical' || s.status === 'low');
  const activeLists = mockLists.filter(l => l.status === 'active');
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(mockStock.map(s => [s.id, s.quantity]))
  );

  return (
    <div className="pb-20">
      <PageHeader
        title="Olá, Usuário 👋"
        subtitle="Seu resumo de hoje"
        action={
          <button onClick={() => onNavigate('scanner')} className="h-9 px-3 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            <ScanLine className="w-4 h-4" /> Escanear
          </button>
        }
      />

      <motion.div variants={container} initial="hidden" animate="show" className="p-4 space-y-5">
        {/* Stats */}
        <motion.div variants={item} className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {statsData.map((s, i) => (
            <div key={i} className="min-w-[130px] bg-card rounded-lg shadow-card p-3 shrink-0">
              <span className="text-lg">{s.icon}</span>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              <p className="text-base font-bold text-card-foreground">{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-foreground mb-2">Ações Rápidas</h2>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() => onNavigate(a.tab)}
                className="bg-card rounded-lg shadow-card p-3 flex flex-col items-center gap-1.5 hover:shadow-elevated transition-shadow"
              >
                <a.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-card-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        {criticalStock.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-warning" /> Alertas de Reposição
            </h2>
            <div className="space-y-2">
              {criticalStock.map(s => (
                <div key={s.id} className="bg-card rounded-lg shadow-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{s.product_name}</p>
                    <p className="text-xs text-muted-foreground">{s.category} · {s.quantity} {s.unit}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    s.status === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning-bg text-warning-foreground'
                  }`}>
                    {s.status === 'critical' ? 'Crítico' : 'Baixo'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Stock */}
        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-foreground mb-2">Estoque Rápido</h2>
          <div className="space-y-2">
            {criticalStock.slice(0, 3).map(s => (
              <div key={s.id} className="bg-card rounded-lg shadow-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{s.product_name}</p>
                  <p className="text-xs text-muted-foreground">Mín: {s.min_quantity} {s.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantities(q => ({ ...q, [s.id]: Math.max(0, (q[s.id] || 0) - 1) }))}
                    className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Minus className="w-3.5 h-3.5 text-secondary-foreground" />
                  </button>
                  <span className="text-sm font-bold text-foreground w-6 text-center">{quantities[s.id]}</span>
                  <button
                    onClick={() => setQuantities(q => ({ ...q, [s.id]: (q[s.id] || 0) + 1 }))}
                    className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trial Banner */}
        {isTrial && <TrialBanner daysLeft={daysLeft} />}

        {/* Active Lists */}
        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-foreground mb-2">Listas Ativas</h2>
          <div className="space-y-2">
            {activeLists.map(l => (
              <button key={l.id} onClick={() => onNavigate('lists')} className="w-full bg-card rounded-lg shadow-card p-3 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-card-foreground">{l.name}</p>
                  <span className="text-xs text-muted-foreground">{l.checked_items}/{l.total_items}</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-primary transition-all"
                    style={{ width: `${l.total_items ? (l.checked_items / l.total_items) * 100 : 0}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
