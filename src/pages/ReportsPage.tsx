import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { monthlySpending, categorySpending, getHistory } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, BarChart3, ShoppingCart, Clock, Calendar } from 'lucide-react';

const CATEGORY_COLORS = [
  'hsl(152, 60%, 42%)',  // Alimentos - green
  'hsl(38, 90%, 50%)',   // Carnes - orange
  'hsl(210, 70%, 50%)',  // Limpeza - blue
  'hsl(340, 60%, 55%)',  // Laticínios - pink
  'hsl(270, 50%, 55%)',  // Higiene - purple
  'hsl(0, 70%, 50%)',    // Bebidas - red
  'hsl(190, 70%, 45%)',  // Hortifruti - teal
  'hsl(25, 80%, 55%)',   // Padaria - dark orange
  'hsl(160, 50%, 50%)',  // Outros - mint
];

interface ReportsPageProps {
  onBack?: () => void;
}

export function ReportsPage({ onBack }: ReportsPageProps) {
  const history = getHistory();
  const currentMonth = history.reduce((sum, h) => sum + h.total_price, 0);

  const productCounts = history.reduce<Record<string, number>>((acc, h) => {
    acc[h.product_name] = (acc[h.product_name] || 0) + h.quantity;
    return acc;
  }, {});
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const storeVisits = history.reduce<Record<string, number>>((acc, h) => {
    acc[h.store_name] = (acc[h.store_name] || 0) + 1;
    return acc;
  }, {});
  const totalVisits = Object.values(storeVisits).reduce((a, b) => a + b, 0);

  const enrichedCategories = categorySpending.map((c, i) => ({
    ...c,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    percent: ((c.value / categorySpending.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1),
  }));

  return (
    <div className="pb-20">
      <PageHeader
        title="Relatórios"
        subtitle="Análise de consumo"
        onBack={onBack}
        action={
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-medium">
            <Calendar className="w-3.5 h-3.5" /> Abr 2026
          </button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border border-border p-4">
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">R$ {currentMonth.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Este Mês</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <BarChart3 className="w-5 h-5 text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">R$ {currentMonth.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Média/Mês</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <ShoppingCart className="w-5 h-5 text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">{totalVisits}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Idas ao Mercado</p>
            <p className="text-[10px] text-primary font-medium mt-0.5">ver detalhes →</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <Clock className="w-5 h-5 text-muted-foreground mb-2" />
            <p className="text-xl font-bold text-foreground">--</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inflação Estimada</p>
          </div>
        </div>

        {/* Monthly Evolution Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-1">Evolução Mensal</h3>
          <p className="text-xs text-muted-foreground mb-3">Últimos {monthlySpending.length} meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySpending}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(160,10%,45%)' }} axisLine={true} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(160,10%,45%)' }}
                axisLine={true}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(v: number) => [`R$ ${v}`, 'Gasto']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(152, 60%, 42%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-4">Gastos por Categoria</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={enrichedCategories}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {enrichedCategories.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {enrichedCategories.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.fill }} />
                  <span className="text-sm text-foreground">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{c.percent}%</span>
                  <span className="text-sm text-muted-foreground">R$ {c.value.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Mais Comprados</h3>
          {topProducts.map(([name, count], i) => (
            <div key={name} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary bg-accent w-6 h-6 rounded flex items-center justify-center">{i + 1}</span>
                <span className="text-sm font-medium text-foreground uppercase">{name}</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{count}x</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
