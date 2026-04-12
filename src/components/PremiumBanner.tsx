import { Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PremiumBannerProps {
  onUpgrade: () => void;
}

export function PremiumBanner({ onUpgrade }: PremiumBannerProps) {
  const { currency } = useLanguage();
  return (
    <button
      onClick={onUpgrade}
      className="mx-4 mb-2 p-3 rounded-xl gradient-primary flex items-center gap-3 w-[calc(100%-2rem)] text-left shadow-md"
    >
      <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
        <Crown className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-primary-foreground">Premium</p>
        <p className="text-[11px] text-primary-foreground/80">
          Acesso completo por {currency} 49,90/ano
        </p>
      </div>
      <span className="text-xs font-bold text-primary-foreground bg-primary-foreground/20 px-2 py-1 rounded-full">
        Assinar
      </span>
    </button>
  );
}
