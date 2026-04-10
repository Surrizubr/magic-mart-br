import { Clock } from 'lucide-react';

interface TrialBannerProps {
  daysLeft: number;
  onUpgrade: () => void;
}

export function TrialBanner({ daysLeft, onUpgrade }: TrialBannerProps) {
  return (
    <button
      onClick={onUpgrade}
      className="mx-4 mb-2 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 w-[calc(100%-2rem)] text-left"
    >
      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-amber-800">
          <span className="font-semibold">{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</span> restante{daysLeft !== 1 ? 's' : ''} do período de teste
        </p>
        <p className="text-[10px] text-amber-600 mt-0.5">Toque para assinar o Premium</p>
      </div>
    </button>
  );
}
