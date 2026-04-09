import { motion } from 'framer-motion';
import { mockLists, mockStock, mockHistory } from '@/data/mockData';
import { Plus, ShoppingCart, ScanLine, Share2, Calendar, AlertTriangle, ArrowRight, ChevronRight, Menu } from 'lucide-react';
import { useState } from 'react';
import { TabId } from '@/types';

interface HomePageProps {
  daysLeft: number;
  isTrial: boolean;
  onNavigate: (tab: TabId) => void;
  onOpenMenu?: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function HomePage({ daysLeft, isTrial, onNavigate, onOpenMenu }: HomePageProps) {
  const criticalStock = mockStock.filter(s => s.status === 'critical' || s.status === 'low');
  const activeLists = mockLists.filter(l => l.status === 'active');
  const totalMonth = mockHistory.reduce((sum, h) => sum + h.total_price, 0);
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="pb-20">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-4 pt-4 pb-3"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground text-lg">🌿</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Olá, Usuário 👋</p>
              <h1 className="text-xl font-bold text-foreground">Magicmart AI</h1>
              <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
            </div>
          </div>
          <button onClick={onOpenMenu} className="p-2 rounded-xl bg-card border border-border hover:bg-accent transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.header>

      <motion.div variants={container} initial="hidden" animate="show" className="px-4 space-y-5">
        {/* Stats Row */}
        <motion.div variants={item} className="flex gap-3">
          <div className="flex-1 bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estoque</p>
            <p className="text-2xl font-bold text-foreground">{mockStock.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Itens</p>
          </div>
          <div className="flex-1 bg-card rounded-xl border border-primary/30 p-3 text-center">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Listas</p>
            <p className="text-2xl font-bold text-primary">{activeLists.length}</p>
            <p className="text-[10px] text-primary uppercase">Ativas</p>
          </div>
          <div className="flex-1 bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Histórico</p>
            <p className="text-xl font-bold text-foreground">R$ {totalMonth.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Mês Atual</p>
          </div>
        </motion.div>

        {/* Action Cards - 2x2 grid */}
        <motion.div variants={item} className="grid grid-cols-5 gap-3">
          {/* Nova Lista - larger */}
          <button
            onClick={() => onNavigate('lists')}
            className="col-span-2 gradient-primary rounded-xl p-4 text-left"
          >
            <Plus className="w-6 h-6 text-primary-foreground mb-4" />
            <p className="text-sm font-bold text-primary-foreground">Nova Lista</p>
            <p className="text-xs text-primary-foreground/80">Criar lista de compras</p>
          </button>
          {/* Fazer Mercado */}
          <button
            onClick={() => onNavigate('lists')}
            className="col-span-3 bg-card rounded-xl border border-border p-4 text-left"
          >
            <ShoppingCart className="w-6 h-6 text-primary mb-4" />
            <p className="text-sm font-bold text-foreground">Fazer Mercado</p>
            <p className="text-xs text-muted-foreground">Adicionar produtos na cesta</p>
          </button>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('scanner')}
            className="bg-card rounded-xl border border-border p-4 text-left"
          >
            <ScanLine className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-sm font-bold text-foreground">Escanear</p>
            <p className="text-xs text-muted-foreground">Nota fiscal</p>
          </button>
          <button
            onClick={() => {}}
            className="bg-card rounded-xl border border-border p-4 text-left"
          >
            <Share2 className="w-6 h-6 text-primary mb-2" />
            <p className="text-sm font-bold text-foreground">Compartilhar</p>
            <p className="text-xs text-muted-foreground">Listas ativas</p>
          </button>
        </motion.div>

        {/* Dias mais baratos banner */}
        <motion.div variants={item}>
          <button
            onClick={() => onNavigate('savings')}
            className="w-full bg-accent rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Dias de compras mais baratos</span>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </button>
        </motion.div>

        {/* Alerts */}
        {criticalStock.length > 0 && (
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Alertas</h2>
              <div className="flex items-center gap-2">
                <button className="text-xs text-muted-foreground">Limpar</button>
                <button className="text-xs text-primary font-medium flex items-center gap-0.5">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </button>
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {criticalStock.length}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {criticalStock.map(s => {
                const daysLeft = s.daily_consumption_rate > 0 ? Math.ceil(s.quantity / s.daily_consumption_rate) : 99;
                return (
                  <div key={s.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground uppercase">{s.product_name}</p>
                        <p className="text-xs font-semibold text-warning">~{daysLeft} dias restantes</p>
                        <p className="text-xs text-muted-foreground">
                          Estoque: {s.quantity} {s.unit} · Última compra: 03/04/2026
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
