import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

const resolveUserIdFromEmail = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string | null,
) => {
  if (!email) return null;

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;

  const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  return match?.id ?? null;
};

const syncProfileSubscription = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  payload: {
    userId: string;
    customerId: string | null;
    stripeStatus: string;
    subscriptionEnd: string | null;
    email?: string | null;
  },
) => {
  const { userId, customerId, stripeStatus, subscriptionEnd, email } = payload;
  const profilePayload = {
    stripe_status: stripeStatus,
    stripe_customer_id: customerId,
    subscription_end: subscriptionEnd,
  };

  const { data: profiles, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (lookupError) throw lookupError;

  if (profiles && profiles.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profilePayload)
      .eq('user_id', userId);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      user_id: userId,
      display_name: email ? email.split('@')[0] : null,
      ...profilePayload,
    });

  if (insertError) throw insertError;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Event received", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
      const customerEmail = session.customer_details?.email ?? session.customer_email ?? session.metadata?.user_email ?? null;
      let userId = session.metadata?.user_id ?? session.client_reference_id ?? null;

      logStep("Checkout completed", { email: customerEmail, customerId, userId });

      if (!userId) {
        userId = await resolveUserIdFromEmail(supabaseAdmin, customerEmail);
      }

      if (userId && session.subscription) {
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const stripeStatus = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) ? 'active' : 'inactive';
        const subscriptionEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await syncProfileSubscription(supabaseAdmin, {
          userId,
          customerId,
          stripeStatus,
          subscriptionEnd,
          email: customerEmail,
        });

        logStep("Profile synced from checkout session", { userId, stripeStatus, subscriptionEnd });
      } else {
        logStep("Could not resolve user for checkout session", { customerEmail, customerId, userId });
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      const stripeStatus = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) ? 'active' : 'inactive';
      const subscriptionEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      let userId = subscription.metadata?.user_id ?? null;

      logStep("Subscription event", { customerId, status: subscription.status, subscriptionEnd, userId });

      if (!userId) {
        const { data: profiles, error: profileLookupError } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (profileLookupError) throw profileLookupError;
        userId = profiles?.[0]?.user_id ?? null;
      }

      if (!userId) {
        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = !customer.deleted ? customer.email ?? null : null;
        userId = await resolveUserIdFromEmail(supabaseAdmin, customerEmail);
      }

      if (userId) {
        await syncProfileSubscription(supabaseAdmin, {
          userId,
          customerId,
          stripeStatus,
          subscriptionEnd,
        });
        logStep("Profile updated", { userId, stripeStatus });
      } else {
        logStep("No profile matched subscription event", { customerId });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
