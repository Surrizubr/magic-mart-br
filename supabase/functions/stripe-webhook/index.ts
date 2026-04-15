import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
      const customerEmail = session.customer_details?.email;
      const customerId = session.customer as string;
      logStep("Checkout completed", { email: customerEmail, customerId });

      if (customerEmail) {
        // Find user by email in auth
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = users?.users?.find(u => u.email === customerEmail);

        if (authUser) {
          // Get subscription details
          const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
          let subscriptionEnd = null;
          if (subscriptions.data.length > 0) {
            subscriptionEnd = new Date(subscriptions.data[0].current_period_end * 1000).toISOString();
          }

          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_status: 'active',
              stripe_customer_id: customerId,
              subscription_end: subscriptionEnd,
            })
            .eq('user_id', authUser.id);

          if (error) logStep("Error updating profile", { error: error.message });
          else logStep("Profile updated to active", { userId: authUser.id });
        } else {
          logStep("No auth user found for email", { email: customerEmail });
        }
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

      logStep("Subscription event", { customerId, status, subscriptionEnd });

      // Find profile by stripe_customer_id
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId);

      if (profiles && profiles.length > 0) {
        const stripeStatus = (status === 'active' || status === 'trialing') ? 'active' : 'inactive';
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_status: stripeStatus,
            subscription_end: subscriptionEnd,
          })
          .eq('stripe_customer_id', customerId);
        logStep("Profile updated", { stripeStatus });
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
