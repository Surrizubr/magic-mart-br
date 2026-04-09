import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialWelcome } from '@/components/TrialWelcome';
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
import { TabId } from '@/types';

const Index = () => {
  const { status, daysLeft, startTrial } = useSubscription();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  if (status === 'not_started') {
    return <TrialWelcome onStartTrial={startTrial} />;
  }

  const goHome = () => setActiveTab('home');

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage daysLeft={daysLeft} isTrial={status === 'trial'} onNavigate={setActiveTab} onOpenMenu={() => setMenuOpen(true)} />;
      case 'lists': return <ListsPage onBack={goHome} />;
      case 'stock': return <StockPage onBack={goHome} />;
      case 'savings': return <SavingsPage onBack={goHome} />;
      case 'history': return <HistoryPage onNavigateToScanner={() => setActiveTab('scanner')} onBack={goHome} />;
      case 'reports': return <ReportsPage onBack={goHome} />;
      case 'scanner': return <ScannerPage onBack={goHome} />;
      case 'shopping': return <ShoppingPage onNavigate={setActiveTab} onBack={goHome} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
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
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default Index;
