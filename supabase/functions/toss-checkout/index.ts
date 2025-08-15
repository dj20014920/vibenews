import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Required environment variables:
// - TOSS_SECRET_KEY: Your Toss Payments Secret Key (e.g., "test_sk_...")

serve(async (req) => {
  console.log(`[TOSS-CHECKOUT] ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY");
    if (!TOSS_SECRET_KEY) {
      throw new Error("TOSS_SECRET_KEY environment variable is not set.");
    }

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

    if (action === "confirm") {
      const { paymentKey, orderId } = data; // Amount is removed from client data
      if (!paymentKey || !orderId) {
        throw new Error("paymentKey and orderId are required.");
      }

      // **SECURITY FIX**: Get the amount from the database, not the client.
      const { data: transactionData, error: transactionError } = await supabaseClient
        .from("payment_transactions")
        .select("amount, plan_id")
        .eq("partner_order_id", orderId)
        .eq("user_id", user.id)
        .single();

      if (transactionError || !transactionData) {
        throw new Error("Invalid or expired orderId.");
      }
      
      const serverVerifiedAmount = transactionData.amount;

      // Toss Payments confirm
      const confirmResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: serverVerifiedAmount,
        }),
      });

      const confirmData = await confirmResponse.json();
      console.log(`[TOSS-CHECKOUT] Confirm response:`, confirmData);

      if (confirmData.status === "DONE") {
        // Get plan information
        const { data: planData } = await supabaseClient
          .from("plans")
          .select("duration_days")
          .eq("id", transactionData.plan_id)
          .single();

        const planDurationDays = planData?.duration_days || 30;

        // Create subscription record
        await supabaseClient.from("subscriptions").insert({
          user_id: user.id,
          provider: "toss",
          provider_subscription_id: confirmData.paymentKey,
          provider_customer_id: confirmData.customerKey || user.id,
          plan_id: transactionData.plan_id,
          status: "active",
          amount: confirmData.totalAmount,
          currency: confirmData.currency || "KRW",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            orderId: confirmData.orderId,
            method: confirmData.method,
          },
        });

        // Update transaction status
        await supabaseClient
          .from("payment_transactions")
          .update({ status: 'completed', provider_payment_id: confirmData.paymentKey })
          .eq('partner_order_id', orderId);

        return new Response(JSON.stringify({
          success: true,
          paymentKey: confirmData.paymentKey,
          orderId: confirmData.orderId,
          totalAmount: confirmData.totalAmount,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Update transaction status to 'failed'
        await supabaseClient
          .from("payment_transactions")
          .update({ status: 'failed', metadata: { errorCode: confirmData.code, errorMessage: confirmData.message } })
          .eq('partner_order_id', orderId);
        throw new Error(`Toss payment failed: ${confirmData.message}`);
      }
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error(`[TOSS-CHECKOUT] Error:`, error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});