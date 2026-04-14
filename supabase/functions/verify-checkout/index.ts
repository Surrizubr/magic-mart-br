import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["customer", "subscription"],
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ ok: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerEmail = session.customer_details?.email || session.customer_email || "";
    const customerName = session.customer_details?.name || "";
    const firstName = customerName.split(" ")[0] || customerEmail.split("@")[0];

    // Calculate subscription_end: 1 year from now
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if profile exists for this email
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", customerEmail)
      .maybeSingle();

    let profileId: string;

    if (existing) {
      // Update existing profile
      await supabaseAdmin
        .from("profiles")
        .update({
          display_name: firstName,
          subscription_end: subscriptionEnd.toISOString(),
        })
        .eq("id", existing.id);
      profileId = existing.id;
    } else {
      // Create new profile
      const { data: newProfile, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: customerEmail,
          display_name: firstName,
          subscription_end: subscriptionEnd.toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;
      profileId = newProfile.id;
    }

    return new Response(JSON.stringify({
      ok: true,
      profile_id: profileId,
      email: customerEmail,
      display_name: firstName,
      subscription_end: subscriptionEnd.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
