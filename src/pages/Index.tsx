import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { status, daysLeft, startTrial } = useSubscription();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (status === 'not_started') {
    return <TrialWelcome onStartTrial={startTrial} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage daysLeft={daysLeft} isTrial={status === 'trial'} onNavigate={setActiveTab} onOpenMenu={() => setMenuOpen(true)} />;
      case 'lists': return <ListsPage />;
      case 'stock': return <StockPage />;
      case 'savings': return <SavingsPage />;
      case 'history': return <HistoryPage onNavigateToScanner={() => setActiveTab('scanner')} />;
      case 'reports': return <ReportsPage />;
      case 'scanner': return <ScannerPage />;
      case 'shopping': return <ShoppingPage onNavigate={setActiveTab} />;
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
