import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const updateRoleSchema = z.object({
  target_user_id: z.string().uuid("Invalid target user ID"),
  new_role: z.enum(["admin", "user", "moderator"], {
    errorMap: () => ({ message: "Invalid role specified." }),
  }),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use the service role key to perform admin-level operations.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the authenticated user who is making the request.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("User not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("User not authenticated");

    // **SECURITY CHECK**: Verify the CALLER is an admin before proceeding.
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc("is_admin", {
      p_user_id: user.id,
    });

    if (adminCheckError) throw adminCheckError;
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Permission denied. Admin role required." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, ...data } = await req.json();

    if (action === "list-users") {
      const { data: users, error } = await supabaseClient
        .from("users")
        .select("id, email, nickname, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (action === "update-role") {
      const { target_user_id, new_role } = updateRoleSchema.parse(data);

      // Prevent an admin from accidentally removing their own admin status.
      if (target_user_id === user.id && new_role !== 'admin') {
        throw new Error("Admins cannot revoke their own admin status.");
      }

      const { data: updatedUser, error } = await supabaseClient
        .from("users")
        .update({ role: new_role })
        .eq("id", target_user_id)
        .select("id, nickname, role")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, updatedUser }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error("Invalid action. Must be 'list-users' or 'update-role'");
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
