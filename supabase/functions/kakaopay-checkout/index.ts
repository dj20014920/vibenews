import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Required environment variables:
// - KAKAO_ADMIN_KEY: Your KakaoPay Admin Key (e.g., "KakaoAK 1234567890abcdef")
// - KAKAO_CID: Your KakaoPay CID. Use "TC0ONETIME" for testing.

serve(async (req) => {
  console.log(`[KAKAOPAY-CHECKOUT] ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KAKAO_ADMIN_KEY = Deno.env.get("KAKAO_ADMIN_KEY");
    const KAKAO_CID = Deno.env.get("KAKAO_CID") ?? "TC0ONETIME";

    if (!KAKAO_ADMIN_KEY) {
      throw new Error("KAKAO_ADMIN_KEY environment variable is not set.");
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

    if (action === "ready") {
      // Get plan information
      const { data: planData } = await supabaseClient
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!planData) throw new Error("No active plan found");

      const partner_order_id = `VIBENEWS-${user.id.substring(0, 8)}-${Date.now()}`;

      // KakaoPay ready request
      const readyResponse = await fetch("https://kapi.kakao.com/v1/payment/ready", {
        method: "POST",
        headers: {
          "Authorization": KAKAO_ADMIN_KEY,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        body: new URLSearchParams({
          cid: KAKAO_CID,
          partner_order_id,
          partner_user_id: user.id,
          item_name: planData.name,
          quantity: "1",
          total_amount: planData.amount.toString(),
          vat_amount: "0",
          tax_free_amount: "0",
          approval_url: `${req.headers.get("origin")}/subscription/kakaopay/success`,
          fail_url: `${req.headers.get("origin")}/subscription/kakaopay/fail`,
          cancel_url: `${req.headers.get("origin")}/subscription/kakaopay/cancel`,
        }),
      });

      const readyData = await readyResponse.json();
      console.log(`[KAKAOPAY-CHECKOUT] Ready response:`, readyData);

      if (readyData.tid) {
        // Store the tid and partner_order_id for the approval step
        const { error: insertError } = await supabaseClient
          .from("payment_transactions")
          .insert({
            id: readyData.tid,
            provider: 'kakaopay',
            user_id: user.id,
            partner_order_id: partner_order_id,
            status: 'pending',
            amount: planData.amount,
            plan_id: planData.id
          });

        if (insertError) {
          console.error("Error saving transaction:", insertError);
          throw new Error("Failed to save payment transaction.");
        }

        return new Response(JSON.stringify({
          tid: readyData.tid,
          partner_order_id: partner_order_id, // Return to client
          next_redirect_pc_url: readyData.next_redirect_pc_url,
          next_redirect_mobile_url: readyData.next_redirect_mobile_url,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        throw new Error(`KakaoPay ready failed: ${readyData.msg}`);
      }

    } else if (action === "approve") {
      const { tid, pg_token } = data;
      if (!tid || !pg_token) {
        throw new Error("tid and pg_token are required for approval.");
      }

      // Retrieve the transaction details
      const { data: transactionData, error: transactionError } = await supabaseClient
        .from("payment_transactions")
        .select("partner_order_id")
        .eq("id", tid)
        .eq("user_id", user.id)
        .single();
      
      if (transactionError || !transactionData) {
        throw new Error("Invalid or expired transaction ID.");
      }

      const { partner_order_id } = transactionData;

      // KakaoPay approve request
      const approveResponse = await fetch("https://kapi.kakao.com/v1/payment/approve", {
        method: "POST",
        headers: {
          "Authorization": KAKAO_ADMIN_KEY,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        body: new URLSearchParams({
          cid: KAKAO_CID,
          tid,
          partner_order_id,
          partner_user_id: user.id,
          pg_token,
        }),
      });

      const approveData = await approveResponse.json();
      console.log(`[KAKAOPAY-CHECKOUT] Approve response:`, approveData);

      if (approveData.aid) {
        // Get plan information
        const { data: planData } = await supabaseClient
          .from("plans")
          .select("*")
          .eq("is_active", true)
          .single();

        const planDurationDays = planData?.duration_days || 30;

        // Create subscription record
        await supabaseClient.from("subscriptions").insert({
          user_id: user.id,
          provider: "kakaopay",
          provider_subscription_id: tid,
          provider_customer_id: user.id,
          plan_id: planData?.id,
          status: "active",
          amount: approveData.amount.total,
          currency: approveData.amount.currency,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Update transaction status
        await supabaseClient
          .from("payment_transactions")
          .update({ status: 'completed', provider_payment_id: approveData.aid })
          .eq('id', tid);

        return new Response(JSON.stringify({
          success: true,
          aid: approveData.aid,
          amount: approveData.amount,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        throw new Error(`KakaoPay approval failed: ${approveData.msg}`);
      }
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error(`[KAKAOPAY-CHECKOUT] Error:`, error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});