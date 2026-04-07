import { Clock } from 'lucide-react';

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  return (
    <div className="mx-4 mb-4 p-3 rounded-lg bg-warning-bg border border-warning/30 flex items-center gap-2">
      <Clock className="w-4 h-4 text-warning shrink-0" />
      <p className="text-xs text-warning-foreground">
        <span className="font-semibold">{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</span> restante{daysLeft !== 1 ? 's' : ''} do período de teste
      </p>
    </div>
  );
}
