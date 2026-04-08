import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialWelcome } from '@/components/TrialWelcome';
import { BottomNav } from '@/components/BottomNav';
import { HomePage } from '@/pages/HomePage';
import { ListsPage } from '@/pages/ListsPage';
import { StockPage } from '@/pages/StockPage';
import { SavingsPage } from '@/pages/SavingsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ScannerPage } from '@/pages/ScannerPage';
import { TabId } from '@/types';

const Index = () => {
  const { status, daysLeft, startTrial } = useSubscription();
  const [activeTab, setActiveTab] = useState<TabId>('home');

  if (status === 'not_started') {
    return <TrialWelcome onStartTrial={startTrial} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage daysLeft={daysLeft} isTrial={status === 'trial'} onNavigate={setActiveTab} />;
      case 'lists': return <ListsPage />;
      case 'stock': return <StockPage />;
      case 'savings': return <SavingsPage />;
      case 'history': return <HistoryPage onNavigateToScanner={() => setActiveTab('scanner')} />;
      case 'reports': return <ReportsPage />;
      case 'scanner': return <ScannerPage />;
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
    </div>
  );
};

export default Index;
