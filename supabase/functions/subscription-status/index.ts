import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`[SUBSCRIPTION-STATUS] ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    console.log(`[SUBSCRIPTION-STATUS] Checking status for user: ${user.id}`);

    // Get user's active subscriptions with plan details
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from("subscriptions")
      .select(`
        *,
        plans (
          name,
          description,
          features
        )
      `)
      .eq("user_id", user.id)
      .in("status", ["active", "past_due"])
      .order("created_at", { ascending: false });

    if (subsError) {
      console.error(`[SUBSCRIPTION-STATUS] Error fetching subscriptions:`, subsError);
      throw new Error("Failed to fetch subscriptions");
    }

    // Check if any subscription is currently active
    const now = new Date();
    const activeSubscriptions = subscriptions?.filter(sub => {
      const periodEnd = new Date(sub.current_period_end || 0);
      return sub.status === "active" && periodEnd > now;
    }) || [];

    const hasActiveSubscription = activeSubscriptions.length > 0;
    const currentSubscription = activeSubscriptions[0] || null;

    // Calculate subscription details
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let daysRemaining = 0;

    if (currentSubscription) {
      subscriptionTier = currentSubscription.plans?.name || "Basic";
      subscriptionEnd = currentSubscription.current_period_end;
      daysRemaining = Math.ceil((new Date(subscriptionEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    console.log(`[SUBSCRIPTION-STATUS] User has ${activeSubscriptions.length} active subscription(s)`);

    return new Response(JSON.stringify({
      is_subscribed: hasActiveSubscription,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      days_remaining: daysRemaining,
      provider: currentSubscription?.provider || null,
      current_subscription: currentSubscription,
      all_subscriptions: subscriptions,
      features: currentSubscription?.plans?.features || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[SUBSCRIPTION-STATUS] Error:`, error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      is_subscribed: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});