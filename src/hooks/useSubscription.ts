import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubStatus = 'loading' | 'new' | 'active' | 'expiring' | 'expired';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  subscription_end: string | null;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubStatus>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(0);

  const checkSubscription = useCallback(async () => {
    const profileId = localStorage.getItem('magicmart_profile_id');
    
    if (!profileId) {
      setStatus('new');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, subscription_end')
        .eq('id', profileId)
        .single() as { data: any; error: any };

      if (error || !data) {
        localStorage.removeItem('magicmart_profile_id');
        localStorage.removeItem('magicmart_email');
        localStorage.removeItem('magicmart_name');
        setStatus('new');
        return;
      }

      const userProfile: UserProfile = {
        id: data.id,
        email: data.user_id,
        display_name: data.display_name || '',
        subscription_end: data.subscription_end,
      };
      setProfile(userProfile);

      if (!data.subscription_end) {
        setStatus('expired');
        return;
      }

      const now = new Date();
      const end = new Date(data.subscription_end);
      const diffMs = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setDaysUntilExpiry(diffDays);

      if (diffDays <= 0) {
        setStatus('expired');
      } else if (diffDays <= 30) {
        setStatus('expiring');
      } else {
        setStatus('active');
      }
    } catch {
      setStatus('new');
    }
  }, []);

  // Handle checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkoutStatus === 'success' && sessionId) {
      // Clean URL
      window.history.replaceState({}, '', '/');
      
      // Verify checkout session
      supabase.functions.invoke('verify-checkout', {
        body: { session_id: sessionId },
      }).then(({ data, error }) => {
        if (!error && data?.ok) {
          localStorage.setItem('magicmart_profile_id', data.profile_id);
          localStorage.setItem('magicmart_email', data.email);
          localStorage.setItem('magicmart_name', data.display_name);
          checkSubscription();
        }
      });
    } else if (checkoutStatus === 'cancel') {
      window.history.replaceState({}, '', '/');
    }
  }, [checkSubscription]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const openCheckout = async () => {
    try {
      const email = localStorage.getItem('magicmart_email');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: email ? { email } : {},
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
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

  return { status, profile, daysUntilExpiry, openCheckout, openPortal, refresh: checkSubscription };
}
