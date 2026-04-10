import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubStatus = 'loading' | 'trial' | 'active' | 'expired' | 'no_trial';

const TRIAL_DAYS = 7;

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>('loading');
  const [daysLeft, setDaysLeft] = useState(0);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setStatus('loading');
      return;
    }

    // Check Stripe subscription
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data?.subscribed) {
        setStatus('active');
        setSubscriptionEnd(data.subscription_end);
        return;
      }
    } catch {
      // Continue to trial check
    }

    // Check trial based on profile's trial_started_at
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_started_at')
        .eq('user_id', user.id)
        .single();

      if (profile?.trial_started_at) {
        const start = new Date(profile.trial_started_at);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = TRIAL_DAYS - diff;
        if (remaining > 0) {
          setStatus('trial');
          setDaysLeft(remaining);
          return;
        }
        setStatus('expired');
        return;
      }
    } catch {
      // Fallback
    }

    setStatus('trial');
    setDaysLeft(TRIAL_DAYS);
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const openCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Checkout error:', err);
    }
  };

  const openPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Portal error:', err);
    }
  };

  return { status, daysLeft, subscriptionEnd, openCheckout, openPortal, refresh: checkSubscription };
}
