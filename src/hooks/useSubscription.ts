import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SubStatus = 'active' | 'expiring' | 'inactive';

export interface SubscriptionInfo {
  stripe_status: string;
  stripe_customer_id: string | null;
  subscription_end: string | null;
  display_name: string | null;
  email: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>('inactive');
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(0);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setStatus('inactive');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_status, stripe_customer_id, subscription_end, display_name, user_id')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setStatus('inactive');
        setLoading(false);
        return;
      }

      const profile: SubscriptionInfo = {
        stripe_status: (data as any).stripe_status || 'inactive',
        stripe_customer_id: (data as any).stripe_customer_id,
        subscription_end: (data as any).subscription_end,
        display_name: data.display_name,
        email: user.email || '',
      };
      setInfo(profile);

      if (profile.stripe_status === 'active' && profile.subscription_end) {
        const now = new Date();
        const end = new Date(profile.subscription_end);
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysUntilExpiry(diffDays);

        if (diffDays <= 0) {
          setStatus('inactive');
        } else if (diffDays <= 30) {
          setStatus('expiring');
        } else {
          setStatus('active');
        }
      } else {
        setStatus('inactive');
      }
    } catch {
      setStatus('inactive');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle checkout return — verify, then poll until profile shows active
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkoutStatus === 'success' && sessionId) {
      window.history.replaceState({}, '', '/');
      (async () => {
        setLoading(true);
        try {
          await supabase.functions.invoke('verify-checkout', {
            body: { session_id: sessionId },
          });
        } catch (e) {
          console.error('verify-checkout failed', e);
        }

        // Poll up to 10x (20s) until stripe_status === 'active'
        for (let i = 0; i < 10; i++) {
          const { data } = await supabase
            .from('profiles')
            .select('stripe_status')
            .eq('user_id', user.id)
            .single();
          if ((data as any)?.stripe_status === 'active') break;
          await new Promise((r) => setTimeout(r, 2000));
        }
        await checkSubscription();
      })();
    } else if (checkoutStatus === 'cancel') {
      window.history.replaceState({}, '', '/');
    }
  }, [checkSubscription, user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const openCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        const w = window.open(data.url, '_blank');
        if (!w) window.location.href = data.url;
      }
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

  return { status, loading, info, daysUntilExpiry, openCheckout, openPortal, refresh: checkSubscription };
}
