import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// APIKEYTODO: Replace with actual KakaoPay admin key
const KAKAO_ADMIN_KEY = "KakaoAK 1234567890abcdef"; // APIKEYTODO

serve(async (req) => {
  console.log(`[KAKAOPAY-CHECKOUT] ${req.method} request received`);

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

    if (action === "ready") {
      // Get plan information
      const { data: planData } = await supabaseClient
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!planData) throw new Error("No active plan found");

      // KakaoPay ready request
      const readyResponse = await fetch("https://kapi.kakao.com/v1/payment/ready", {
        method: "POST",
        headers: {
          "Authorization": KAKAO_ADMIN_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          cid: "TC0ONETIME", // Test CID (APIKEYTODO: Replace with actual CID)
          partner_order_id: `order_${user.id}_${Date.now()}`,
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
        return new Response(JSON.stringify({
          tid: readyData.tid,
          next_redirect_pc_url: readyData.next_redirect_pc_url,
          next_redirect_mobile_url: readyData.next_redirect_mobile_url,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        throw new Error("KakaoPay ready failed");
      }

    } else if (action === "approve") {
      const { tid, pg_token } = data;
      
      // KakaoPay approve request
      const approveResponse = await fetch("https://kapi.kakao.com/v1/payment/approve", {
        method: "POST",
        headers: {
          "Authorization": KAKAO_ADMIN_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          cid: "TC0ONETIME", // APIKEYTODO: Replace with actual CID
          tid,
          partner_order_id: `order_${user.id}`,
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

        // Create subscription record
        await supabaseClient.from("subscriptions").insert({
          user_id: user.id,
          provider: "kakaopay",
          provider_subscription_id: tid,
          provider_customer_id: user.id,
          plan_id: planData?.id,
          status: "active",
          amount: planData?.amount || 4900,
          currency: planData?.currency || "KRW",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

        return new Response(JSON.stringify({
          success: true,
          aid: approveData.aid,
          amount: approveData.amount,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        throw new Error("KakaoPay approval failed");
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