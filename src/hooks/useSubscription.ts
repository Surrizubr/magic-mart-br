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

interface StripeSyncResult {
  subscribed?: boolean;
  stripe_status?: string;
  customer_id?: string | null;
  subscription_end?: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>('inactive');
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(0);

  const applySubscriptionState = useCallback((profile: SubscriptionInfo | null) => {
    setInfo(profile);

    if (!profile || profile.stripe_status !== 'active' || !profile.subscription_end) {
      setDaysUntilExpiry(0);
      setStatus('inactive');
      return;
    }

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
  }, []);

  const fetchProfile = useCallback(async (): Promise<SubscriptionInfo | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('stripe_status, stripe_customer_id, subscription_end, display_name, user_id')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    return {
      stripe_status: (data as any).stripe_status || 'inactive',
      stripe_customer_id: (data as any).stripe_customer_id,
      subscription_end: (data as any).subscription_end,
      display_name: data.display_name,
      email: user.email || '',
    };
  }, [user]);

  const syncSubscriptionFromStripe = useCallback(async (): Promise<StripeSyncResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      return (data ?? null) as StripeSyncResult | null;
    } catch (error) {
      console.error('check-subscription failed', error);
      return null;
    }
  }, []);

  const checkSubscription = useCallback(async ({ forceSync = false }: { forceSync?: boolean } = {}) => {
    if (!user) {
      applySubscriptionState(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let profile = await fetchProfile();

      const shouldSyncWithStripe =
        forceSync ||
        !profile ||
        profile.stripe_status !== 'active' ||
        !profile.subscription_end ||
        new Date(profile.subscription_end).getTime() <= Date.now();

      if (shouldSyncWithStripe) {
        const stripeSync = await syncSubscriptionFromStripe();

        if (stripeSync?.subscribed) {
          profile = (await fetchProfile()) ?? {
            stripe_status: 'active',
            stripe_customer_id: stripeSync.customer_id ?? null,
            subscription_end: stripeSync.subscription_end ?? null,
            display_name: profile?.display_name ?? null,
            email: user.email || '',
          };
        } else if (!profile) {
          profile = {
            stripe_status: stripeSync?.stripe_status ?? 'inactive',
            stripe_customer_id: stripeSync?.customer_id ?? null,
            subscription_end: stripeSync?.subscription_end ?? null,
            display_name: null,
            email: user.email || '',
          };
        }
      }

      applySubscriptionState(profile);
    } catch {
      applySubscriptionState(null);
    } finally {
      setLoading(false);
    }
  }, [applySubscriptionState, fetchProfile, syncSubscriptionFromStripe, user]);

  // Handle checkout return — verify, then poll until profile shows active
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkoutStatus === 'success' && sessionId) {
      window.history.replaceState({}, '', window.location.pathname);
      (async () => {
        setLoading(true);
        try {
          await supabase.functions.invoke('verify-checkout', {
            body: { session_id: sessionId },
          });
        } catch (e) {
          console.error('verify-checkout failed', e);
        }

        // Poll up to 10x (20s) and reconcile profile from Stripe if webhook is delayed
        for (let i = 0; i < 10; i++) {
          const syncResult = await syncSubscriptionFromStripe();
          if (syncResult?.subscribed) break;
          await new Promise((r) => setTimeout(r, 2000));
        }

        await checkSubscription({ forceSync: true });
      })();
    } else if (checkoutStatus === 'cancel') {
      window.history.replaceState({}, '', window.location.pathname);
      void checkSubscription();
    }
  }, [checkSubscription, syncSubscriptionFromStripe, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success' && params.get('session_id')) return;

    void checkSubscription();
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
