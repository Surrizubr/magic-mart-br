import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { RenewalBanner } from '@/components/RenewalBanner';
import { BottomNav } from '@/components/BottomNav';
import { AppMenu } from '@/components/AppMenu';
import { HomePage } from '@/pages/HomePage';
import { ListsPage } from '@/pages/ListsPage';
import { StockPage } from '@/pages/StockPage';
import { SavingsPage } from '@/pages/SavingsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ScannerPage } from '@/pages/ScannerPage';
import { ShoppingPage } from '@/pages/ShoppingPage';
import { SharePage } from '@/pages/SharePage';
import { TabId } from '@/types';

const Index = () => {
  const { info } = useSubscription();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const savedTab = sessionStorage.getItem('active_tab');
    const validTabs: TabId[] = ['home', 'lists', 'stock', 'savings', 'history', 'reports', 'scanner', 'shopping', 'share'];
    return validTabs.includes(savedTab as TabId) ? (savedTab as TabId) : 'home';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<{ date?: string; store?: string }>({});

  useEffect(() => {
    sessionStorage.setItem('active_tab', activeTab);
  }, [activeTab]);

  const goHome = () => setActiveTab('home');

  const navigateToHistoryFiltered = (date: string, store: string) => {
    setHistoryFilter({ date, store });
    setActiveTab('history');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage displayName={info?.display_name || undefined} onNavigate={setActiveTab} onOpenMenu={() => setMenuOpen(true)} />;
      case 'lists': return <ListsPage onBack={goHome} />;
      case 'stock': return <StockPage onBack={goHome} />;
      case 'savings': return <SavingsPage onBack={goHome} onNavigateToHistory={navigateToHistoryFiltered} />;
      case 'history': return <HistoryPage onNavigateToScanner={() => setActiveTab('scanner')} onBack={() => { setHistoryFilter({}); goHome(); }} filterDate={historyFilter.date} filterStore={historyFilter.store} />;
      case 'reports': return <ReportsPage onBack={goHome} onNavigate={(tab) => setActiveTab(tab as TabId)} />;
      case 'scanner': return <ScannerPage onBack={goHome} onNavigateToHistory={navigateToHistoryFiltered} onOpenMenu={() => setMenuOpen(true)} />;
      case 'shopping': return <ShoppingPage onNavigate={setActiveTab} onBack={goHome} />;
      case 'share': return <SharePage onBack={goHome} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <RenewalBanner />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={(tab) => { if (tab !== 'history') setHistoryFilter({}); setActiveTab(tab); }} />
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default Index;
