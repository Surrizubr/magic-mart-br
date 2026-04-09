import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Globe, Settings, Info, LogOut, RotateCcw, Trash2, Sun, Moon, Type, ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useLanguage, Lang } from '@/contexts/LanguageContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SubMenu = null | 'themes' | 'languages' | 'preferences' | 'about';

interface AppMenuProps {
  open: boolean;
  onClose: () => void;
}

export function AppMenu({ open, onClose }: AppMenuProps) {
  const { theme, setTheme, largeText, setLargeText } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { stockExpiryDays, setStockExpiryDays } = usePreferences();
  const [subMenu, setSubMenu] = useState<SubMenu>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    onClose();
  };

  const handleReset = () => {
    localStorage.removeItem('stock_items');
    localStorage.removeItem('purchase_history');
    localStorage.removeItem('shopping_lists');
    setConfirmReset(false);
    onClose();
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    // In a real app, call an edge function to delete the user
    await supabase.auth.signOut();
    setConfirmDelete(false);
    navigate('/login');
    onClose();
  };

  const menuItems = [
    { id: 'themes' as SubMenu, icon: Palette, label: t('themes'), desc: t('themeDesc') },
    { id: 'languages' as SubMenu, icon: Globe, label: t('languages'), desc: t('langDesc') },
    { id: 'preferences' as SubMenu, icon: Settings, label: t('preferences'), desc: t('prefDesc') },
    { id: 'about' as SubMenu, icon: Info, label: t('about'), desc: t('aboutDesc') },
  ];

  const dangerItems = [
    { icon: LogOut, label: t('logout'), desc: t('logoutDesc'), action: handleLogout, danger: false },
    { icon: RotateCcw, label: t('resetAll'), desc: t('resetDesc'), action: () => setConfirmReset(true), danger: true },
    { icon: Trash2, label: t('deleteAccount'), desc: t('deleteDesc'), action: () => setConfirmDelete(true), danger: true },
  ];

  const renderSubMenu = () => {
    switch (subMenu) {
      case 'themes':
        return (
          <div className="space-y-2">
            {([['light', Sun, t('light')], ['dark', Moon, t('dark')]] as [ThemeMode, any, string][]).map(([val, Icon, label]) => (
              <button
                key={val}
                onClick={() => setTheme(val)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${theme === val ? 'bg-primary/10 border border-primary/30' : 'bg-card border border-border'}`}
              >
                <Icon className={`w-5 h-5 ${theme === val ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${theme === val ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                {theme === val && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            ))}
            <button
              onClick={() => setLargeText(!largeText)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${largeText ? 'bg-primary/10 border border-primary/30' : 'bg-card border border-border'}`}
            >
              <Type className={`w-5 h-5 ${largeText ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${largeText ? 'text-primary' : 'text-foreground'}`}>{t('largeText')}</span>
              {largeText && <Check className="w-4 h-4 text-primary ml-auto" />}
            </button>
          </div>
        );

      case 'languages':
        return (
          <div className="space-y-2">
            {([['pt', '🇧🇷', 'Português'], ['en', '🇺🇸', 'English'], ['es', '🇪🇸', 'Español']] as [Lang, string, string][]).map(([val, flag, label]) => (
              <button
                key={val}
                onClick={() => setLang(val)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${lang === val ? 'bg-primary/10 border border-primary/30' : 'bg-card border border-border'}`}
              >
                <span className="text-lg">{flag}</span>
                <span className={`text-sm font-medium ${lang === val ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                {lang === val && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground mb-1">{t('stockExpiry')}</p>
              <p className="text-xs text-muted-foreground mb-3">{stockExpiryDays} {t('days')}</p>
              <input
                type="range"
                min={2}
                max={120}
                value={stockExpiryDays}
                onChange={(e) => setStockExpiryDays(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>2 {t('days')}</span>
                <span>120 {t('days')}</span>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
              <span className="text-2xl">🌿</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">Magicmart AI</h3>
            <p className="text-sm text-muted-foreground">{t('developedBy')}</p>
            <p className="text-xs text-muted-foreground">{t('termsText')}</p>
            <div className="flex flex-col gap-1">
              <a href="https://idapps.com.br/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                https://idapps.com.br/privacy
              </a>
              <a href="https://idapps.com.br/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                https://idapps.com.br/terms
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  {subMenu ? (
                    <button onClick={() => setSubMenu(null)} className="p-1">
                      <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                  ) : (
                    <h2 className="text-lg font-bold text-foreground">{t('menu')}</h2>
                  )}
                  <button onClick={onClose} className="p-1">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {subMenu ? (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                      {menuItems.find(m => m.id === subMenu)?.label}
                    </h3>
                    {renderSubMenu()}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSubMenu(item.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
                      >
                        <item.icon className="w-5 h-5 text-primary" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}

                    <div className="border-t border-border my-3" />

                    {dangerItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          item.danger
                            ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
                            : 'bg-card border-border hover:bg-accent'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${item.danger ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div className="text-left flex-1">
                          <p className={`text-sm font-medium ${item.danger ? 'text-destructive' : 'text-foreground'}`}>{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('resetAll')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmReset')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteAccount')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
