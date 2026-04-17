import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let email: string | null = null;
    let userId: string | null = null;

    const { data: claimsData, error: claimsError } = await supabaseAuthClient.auth.getClaims(token);
    if (!claimsError && claimsData?.claims) {
      email = (claimsData.claims.email as string) ?? null;
      userId = (claimsData.claims.sub as string) ?? null;
    } else {
      const { data: userData, error: userError } = await supabaseAuthClient.auth.getUser(token);
      if (userError || !userData.user) {
        throw new Error("Unauthorized: invalid token");
      }

      email = userData.user.email ?? null;
      userId = userData.user.id;
    }

    if (!email) throw new Error("User email not available in token");
    logStep("User authenticated", { userId, email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });

    let stripeStatus = "inactive";
    let customerId: string | null = null;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });

      const activeSubscription = subscriptions.data.find((subscription) =>
        ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
      );

      if (activeSubscription) {
        stripeStatus = "active";
        subscriptionEnd = new Date(activeSubscription.current_period_end * 1000).toISOString();

        const rawProduct = activeSubscription.items.data[0]?.price.product;
        productId = typeof rawProduct === "string"
          ? rawProduct
          : rawProduct?.id ?? null;

        logStep("Active subscription found", {
          customerId,
          subscriptionId: activeSubscription.id,
          subscriptionEnd,
          productId,
        });
      } else {
        logStep("No active subscription found", { customerId, subscriptions: subscriptions.data.length });
      }
    } else {
      logStep("No customer found");
    }

    const profilePayload = {
      stripe_status: stripeStatus,
      stripe_customer_id: customerId,
      subscription_end: subscriptionEnd,
    };

    const { data: existingProfiles, error: profileLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (profileLookupError) {
      throw profileLookupError;
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(profilePayload)
        .eq("user_id", userId);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          display_name: email.split("@")[0],
          ...profilePayload,
        });

      if (insertError) throw insertError;
    }

    logStep("Profile synced", { userId, stripeStatus, customerId, subscriptionEnd });

    return new Response(JSON.stringify({
      subscribed: stripeStatus === "active",
      stripe_status: stripeStatus,
      customer_id: customerId,
      product_id: productId,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
