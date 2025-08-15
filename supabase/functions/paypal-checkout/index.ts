import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";
const PAYPAL_BASE_URL = Deno.env.get("PAYPAL_BASE_URL") ?? "https://api.sandbox.paypal.com";
const PAYPAL_PLAN_ID = Deno.env.get("PAYPAL_PLAN_ID") ?? "";

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('[PAYPAL-CHECKOUT] Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
}

serve(async (req) => {
  console.log(`[PAYPAL-CHECKOUT] ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;

    // Get PayPal access token
    const getAccessToken = async () => {
      const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const data = await response.json();
      return data.access_token;
    };

    if (action === "create-subscription") {
      const accessToken = await getAccessToken();
      
      // Get plan information
      const { data: planData } = await supabaseClient
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!planData) throw new Error("No active plan found");

      // Create PayPal subscription
      const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          plan_id: PAYPAL_PLAN_ID,
          start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
          quantity: "1",
          shipping_amount: {
            currency_code: "USD",
            value: "0.00"
          },
          subscriber: {
            name: {
              given_name: user.email?.split('@')[0] || "User",
              surname: "Subscriber"
            },
            email_address: user.email,
          },
          application_context: {
            brand_name: Deno.env.get("PAYPAL_BRAND_NAME") ?? "VibeNews",
            locale: "en-US",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            payment_method: {
              payer_selected: "PAYPAL",
              payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
            },
            return_url: `${req.headers.get("origin")}/subscription/paypal/success`,
            cancel_url: `${req.headers.get("origin")}/subscription/paypal/cancel`
          }
        }),
      });

      const subscriptionData = await subscriptionResponse.json();
      console.log(`[PAYPAL-CHECKOUT] Subscription created:`, subscriptionData);

      if (subscriptionData.id) {
        return new Response(JSON.stringify({
          subscription_id: subscriptionData.id,
          approval_url: subscriptionData.links.find((link: any) => link.rel === "approve")?.href,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        throw new Error("PayPal subscription creation failed");
      }

    } else if (action === "activate-subscription") {
      const { subscription_id } = data;
      const accessToken = await getAccessToken();

      // Get subscription details from PayPal
      const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscription_id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const subscriptionData = await subscriptionResponse.json();
      console.log(`[PAYPAL-CHECKOUT] Subscription details:`, subscriptionData);

      if (subscriptionData.status === "ACTIVE") {
        // Get plan information
        const { data: planData } = await supabaseClient
          .from("plans")
          .select("*")
          .eq("is_active", true)
          .single();

        // Create subscription record
        await supabaseClient.from("subscriptions").insert({
          user_id: user.id,
          provider: "paypal",
          provider_subscription_id: subscription_id,
          provider_customer_id: subscriptionData.subscriber?.email_address || user.email,
          plan_id: planData?.id,
          status: "active",
          amount: planData?.amount || 4900,
          currency: planData?.currency || "KRW",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(subscriptionData.billing_info?.next_billing_time || Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            paypal_plan_id: subscriptionData.plan_id,
          },
        });

        return new Response(JSON.stringify({
          success: true,
          subscription_id,
          status: subscriptionData.status,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        throw new Error(`PayPal subscription not active: ${subscriptionData.status}`);
      }
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error(`[PAYPAL-CHECKOUT] Error:`, error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});