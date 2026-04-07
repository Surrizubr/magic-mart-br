import { useState, useEffect } from 'react';
import { SubscriptionStatus } from '@/types';

const TRIAL_DAYS = 7;
const FIRST_OPEN_KEY = 'app_first_open';
const TRIAL_STARTED_KEY = 'app_trial_started';

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>('not_started');
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    const firstOpen = localStorage.getItem(FIRST_OPEN_KEY);
    if (!firstOpen) {
      setStatus('not_started');
      return;
    }

    const trialStarted = localStorage.getItem(TRIAL_STARTED_KEY);
    if (trialStarted) {
      const start = new Date(trialStarted);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = TRIAL_DAYS - diff;
      if (remaining > 0) {
        setStatus('trial');
        setDaysLeft(remaining);
        return;
      }
      setStatus('login_required');
      return;
    }

    setStatus('not_started');
  };

  const startTrial = () => {
    const now = new Date().toISOString();
    localStorage.setItem(FIRST_OPEN_KEY, now);
    localStorage.setItem(TRIAL_STARTED_KEY, now);
    setStatus('trial');
    setDaysLeft(TRIAL_DAYS);
  };

  const skipToApp = () => {
    // For demo: go directly to active
    startTrial();
  };

  return { status, daysLeft, startTrial, skipToApp };
}
