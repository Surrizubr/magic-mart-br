import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { monthlySpending, categorySpending, mockHistory } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function ReportsPage() {
  const currentMonth = 187.50;
  const lastMonth = 530;
  const variation = ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1);

  // Top products
  const productCounts = mockHistory.reduce<Record<string, number>>((acc, h) => {
    acc[h.product_name] = (acc[h.product_name] || 0) + h.quantity;
    return acc;
  }, {});
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top stores
  const storeCounts = mockHistory.reduce<Record<string, number>>((acc, h) => {
    acc[h.store_name] = (acc[h.store_name] || 0) + 1;
    return acc;
  }, {});
  const topStores = Object.entries(storeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="pb-20">
      <PageHeader title="Relatórios" subtitle="Abril 2026" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-lg shadow-card p-3 text-center">
            <p className="text-xs text-muted-foreground">Gasto do mês</p>
            <p className="text-lg font-bold text-primary">R$ {currentMonth.toFixed(2)}</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-3 text-center">
            <p className="text-xs text-muted-foreground">vs. mês anterior</p>
            <p className={`text-lg font-bold ${Number(variation) < 0 ? 'text-primary' : 'text-destructive'}`}>{variation}%</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-card rounded-lg shadow-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Gastos por mês</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlySpending}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(160,10%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(v: number) => [`R$ ${v}`, 'Gasto']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="hsl(152, 60%, 42%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-lg shadow-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Por categoria</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categorySpending}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {categorySpending.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {categorySpending.map(c => (
              <div key={c.name} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
                <span className="text-[10px] text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div className="bg-card rounded-lg shadow-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Mais comprados</h3>
          {topProducts.map(([name, count], i) => (
            <div key={name} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary w-4">{i + 1}</span>
                <span className="text-sm text-card-foreground">{name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{count}×</span>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg shadow-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Lojas mais visitadas</h3>
          {topStores.map(([name, count], i) => (
            <div key={name} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary w-4">{i + 1}</span>
                <span className="text-sm text-card-foreground">{name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{count} visita(s)</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
