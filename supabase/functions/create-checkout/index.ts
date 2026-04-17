import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LIVE_PRICE_ID = "price_1TKgePRsLFesxj6Xo0fLdtGA";
const TEST_PRICE_ID = "price_1TMeFZRsLFesxj6XP8uecvEE";

function resolveCheckoutPriceId(secretKey: string) {
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  if (secretKey.startsWith("sk_test_")) {
    return TEST_PRICE_ID;
  }

  if (secretKey.startsWith("sk_live_")) {
    return LIVE_PRICE_ID;
  }

  throw new Error("Invalid STRIPE_SECRET_KEY format");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const priceId = resolveCheckoutPriceId(stripeKey);

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Not authenticated");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use getClaims for signing-keys compatibility
    const token = authHeader.replace("Bearer ", "");
    let userEmail: string | undefined;
    let userId: string | undefined;
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("getClaims failed, falling back to getUser", claimsError?.message);
      // Fallback to getUser
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user?.email) throw new Error("Not authenticated");
      userEmail = user.email;
      userId = user.id;
    } else {
      userEmail = claimsData.claims.email as string;
      userId = claimsData.claims.sub as string;
      if (!userEmail) throw new Error("No email in claims");
    }

    if (!userId) throw new Error("No user id in token");

    console.log("Authenticated user:", userEmail, userId);

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://magic-mart-br.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        user_email: userEmail,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          user_email: userEmail,
        },
      },
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-checkout error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
