import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const purchaseItemSchema = z.object({
  item_id: z.string().uuid("Invalid item ID"),
});

serve(async (req) => {
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
    if (!authHeader) {
      throw new Error("User not authenticated");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { action, ...data } = await req.json();

    if (action === "list-items") {
      const { data: items, error } = await supabaseClient
        .from("store_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, items }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (action === "purchase-item") {
      const { item_id } = purchaseItemSchema.parse(data);

      const { data: rpcData, error: rpcError } = await supabaseClient.rpc("purchase_item_tx", {
        p_user_id: user.id,
        p_item_id: item_id,
      });

      if (rpcError) throw rpcError;

      const result = rpcData as { success: boolean; error?: string; new_points?: number };

      if (!result.success) {
        // The transaction failed, throw an error with the message from the DB function
        throw new Error(result.error || "Purchase failed due to an unknown reason.");
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error("Invalid action. Must be 'list-items' or 'purchase-item'");
    }

  } catch (error) {
    const errorMessage = error instanceof z.ZodError
      ? error.errors.map(e => e.message).join(', ')
      : error.message;

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
