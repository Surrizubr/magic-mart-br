import { motion } from 'framer-motion';
import { getStock, getLists, getHistory } from '@/data/mockData';
import { Plus, ShoppingCart, ScanLine, Share2, Calendar, AlertTriangle, ArrowRight, ChevronRight, ListChecks, Settings, Trash2, Archive } from 'lucide-react';
import { useState } from 'react';
import { TabId, ShoppingList, StockItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { SwipeableRow } from '@/components/SwipeableRow';
import { addToReminderList } from '@/lib/reminderList';
import { computeDaysLeft, deriveStatus, sortByCriticality } from '@/lib/stockHelpers';
import { toast } from 'sonner';

interface HomePageProps {
  displayName?: string;
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

export function HomePage({ displayName, onNavigate, onOpenMenu }: HomePageProps) {
  const { currency, formatCurrency: fc } = useLanguage();
  const [stockState, setStockState] = useState<StockItem[]>(() => getStock());
  const [listsState, setListsState] = useState<ShoppingList[]>(() => getLists());
  const history = getHistory();
  // Sort by criticality (least days left first), only items with <= 3 days
  const criticalStock = sortByCriticality(
    stockState
      .map(s => ({ ...s, status: deriveStatus(s) }))
      .filter(s => s.status === 'critical')
  );
  const activeLists = listsState.filter(l => l.status === 'active' || l.status === 'shopping');
  const totalMonth = history.reduce((sum, h) => sum + h.total_price, 0);

  const handleDeleteList = (id: string) => {
    setListsState(prev => {
      const updated = prev.filter(l => l.id !== id);
      localStorage.setItem('shopping_lists', JSON.stringify(updated));
      return updated;
    });
    toast.success('Lista excluída.');
  };

  const handleArchiveList = (id: string) => {
    setListsState(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, status: 'archived' as const } : l);
      localStorage.setItem('shopping_lists', JSON.stringify(updated));
      return updated;
    });
    toast.success('Lista arquivada.');
  };

  const handleDeleteAlert = (id: string) => {
    setStockState(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('stock_items', JSON.stringify(updated));
      return updated;
    });
    toast.success('Alerta removido.');
  };

  const handleAddAlertToReminder = (s: StockItem) => {
    addToReminderList({ product_name: s.product_name, category: s.category, unit: s.unit, last_price: s.last_price });
    setStockState(prev => {
      const updated = prev.filter(x => x.id !== s.id);
      localStorage.setItem('stock_items', JSON.stringify(updated));
      return updated;
    });
    toast.success('Adicionado à lista de compras.');
  };
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
            <button onClick={onOpenMenu} className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center hover:opacity-90 transition-opacity">
              <Settings className="w-6 h-6 text-primary-foreground" />
            </button>
            <div>
              <p className="text-sm text-muted-foreground">Olá, {displayName || 'Usuário'} 👋</p>
              <h1 className="text-xl font-bold text-foreground">Magicmart AI</h1>
              <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div variants={container} initial="hidden" animate="show" className="px-4 space-y-5">
        {/* Stats Row */}
        <motion.div variants={item} className="flex gap-3">
          <button onClick={() => onNavigate('stock')} className="flex-1 bg-card rounded-xl border border-border p-3 text-center hover:bg-accent/50 transition-colors">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estoque</p>
            <p className="text-2xl font-bold text-foreground">{stockState.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Itens</p>
          </button>
          <button onClick={() => onNavigate('lists')} className="flex-1 bg-card rounded-xl border border-primary/30 p-3 text-center hover:bg-accent/50 transition-colors">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Listas</p>
            <p className="text-2xl font-bold text-primary">{activeLists.length}</p>
            <p className="text-[10px] text-primary uppercase">Ativas</p>
          </button>
          <button onClick={() => onNavigate('history')} className="flex-1 bg-card rounded-xl border border-border p-3 text-center hover:bg-accent/50 transition-colors">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Histórico</p>
            <p className="text-xl font-bold text-foreground">{fc(totalMonth)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Mês Atual</p>
          </button>
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
            onClick={() => onNavigate('shopping')}
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
            onClick={() => onNavigate('share')}
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
            className="w-full rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: 'hsl(48, 100%, 90%)' }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-800">Dias de compras mais baratos</span>
            </div>
            <ArrowRight className="w-4 h-4 text-yellow-700" />
          </button>
        </motion.div>

        {/* Listas Ativas */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Listas Ativas</h2>
            <button onClick={() => onNavigate('lists')} className="text-xs text-primary font-medium flex items-center gap-0.5">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {activeLists.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">Nenhuma lista ativa</p>
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2" style={{ scrollbarWidth: 'thin' }}>
              {activeLists.slice(0, 5).map(l => (
                <SwipeableRow
                  key={l.id}
                  onSwipeLeft={() => handleDeleteList(l.id)}
                  onSwipeRight={() => handleArchiveList(l.id)}
                  rightIcon={<Archive className="w-5 h-5 text-primary-foreground" />}
                >
                  <button
                    onClick={() => onNavigate('lists')}
                    className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ListChecks className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.items.length} itens · {fc(l.estimated_total)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                </SwipeableRow>
              ))}
            </div>
          )}
        </motion.div>

        {/* Alertas */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Alertas</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => onNavigate('stock')} className="text-xs text-primary font-medium flex items-center gap-0.5">
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
              {criticalStock.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {criticalStock.length}
                </span>
              )}
            </div>
          </div>
          {criticalStock.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">Estoque em dia ✅</p>
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2" style={{ scrollbarWidth: 'thin' }}>
              {criticalStock.slice(0, 5).map(s => {
                const daysLeft = computeDaysLeft(s);
                const isCritical = daysLeft <= 3;
                return (
                  <SwipeableRow
                    key={s.id}
                    onSwipeLeft={() => handleDeleteAlert(s.id)}
                    onSwipeRight={() => handleAddAlertToReminder(s)}
                    rightIcon={<ShoppingCart className="w-5 h-5 text-primary-foreground" />}
                  >
                    <div className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCritical ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                          <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-destructive' : 'text-warning'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground uppercase">{s.product_name}</p>
                          <p className={`text-xs font-semibold ${isCritical ? 'text-destructive' : 'text-warning'}`}>~{daysLeft} dias restantes</p>
                          <p className="text-xs text-muted-foreground">Estoque: {s.quantity} {s.unit}</p>
                        </div>
                      </div>
                    </div>
                  </SwipeableRow>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
