import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { LoginPage } from '@/pages/LoginPage';
import { TrialBanner } from '@/components/TrialBanner';
import { PremiumBanner } from '@/components/PremiumBanner';
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
  const { user, loading: authLoading } = useAuth();
  const { status, daysLeft, openCheckout } = useSubscription();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<{ date?: string; store?: string }>({});

  // Show loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const goHome = () => setActiveTab('home');
  const isTrial = status === 'trial';
  const showBanners = status === 'trial' || status === 'expired';

  const navigateToHistoryFiltered = (date: string, store: string) => {
    setHistoryFilter({ date, store });
    setActiveTab('history');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage daysLeft={daysLeft} isTrial={isTrial} onNavigate={setActiveTab} onOpenMenu={() => setMenuOpen(true)} />;
      case 'lists': return <ListsPage onBack={goHome} />;
      case 'stock': return <StockPage onBack={goHome} />;
      case 'savings': return <SavingsPage onBack={goHome} onNavigateToHistory={navigateToHistoryFiltered} />;
      case 'history': return <HistoryPage onNavigateToScanner={() => setActiveTab('scanner')} onBack={() => { setHistoryFilter({}); goHome(); }} filterDate={historyFilter.date} filterStore={historyFilter.store} />;
      case 'reports': return <ReportsPage onBack={goHome} onNavigate={(tab) => setActiveTab(tab as TabId)} />;
      case 'scanner': return <ScannerPage onBack={goHome} />;
      case 'shopping': return <ShoppingPage onNavigate={setActiveTab} onBack={goHome} />;
      case 'share': return <SharePage onBack={goHome} />;
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

      {/* Banners inline at the bottom of content, before bottom nav padding */}
      {showBanners && activeTab === 'home' && (
        <div className="pb-20 px-0">
          <PremiumBanner onUpgrade={openCheckout} />
          {isTrial && <TrialBanner daysLeft={daysLeft} onUpgrade={openCheckout} />}
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={(tab) => { if (tab !== 'history') setHistoryFilter({}); setActiveTab(tab); }} />
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default Index;
