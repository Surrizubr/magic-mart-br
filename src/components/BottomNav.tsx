import { Home, ShoppingCart, Package, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { TabId } from '@/types';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'lists', label: 'Listas', icon: ShoppingCart },
  { id: 'stock', label: 'Estoque', icon: Package },
  { id: 'savings', label: 'Economizar', icon: DollarSign },
  { id: 'history', label: 'Histórico', icon: Clock },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
