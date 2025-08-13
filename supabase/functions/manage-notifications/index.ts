import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const { action, ...data } = await req.json();
    const user_id = userData.user.id;

    if (action === "get") {
      const { limit = 20, offset = 0, unread_only = false } = data;

      let query = supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (unread_only) {
        query = query.eq("is_read", false);
      }

      const { data: notifications, error: selectError } = await query;

      if (selectError) throw selectError;

      // Get unread count
      const { count: unreadCount } = await supabaseClient
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("user_id", user_id)
        .eq("is_read", false);

      return new Response(JSON.stringify({
        success: true,
        notifications: notifications || [],
        unread_count: unreadCount || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "mark_read") {
      const { notification_id, mark_all = false } = data;

      if (mark_all) {
        // Mark all notifications as read for this user
        const { error: updateError } = await supabaseClient
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user_id)
          .eq("is_read", false);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          message: "All notifications marked as read"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } else {
        if (!notification_id) {
          throw new Error("notification_id is required when mark_all is false");
        }

        // Mark specific notification as read
        const { error: updateError } = await supabaseClient
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification_id)
          .eq("user_id", user_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          message: "Notification marked as read"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

    } else if (action === "delete") {
      const { notification_id, delete_all_read = false } = data;

      if (delete_all_read) {
        // Delete all read notifications for this user
        const { error: deleteError } = await supabaseClient
          .from("notifications")
          .delete()
          .eq("user_id", user_id)
          .eq("is_read", true);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({
          success: true,
          message: "All read notifications deleted"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } else {
        if (!notification_id) {
          throw new Error("notification_id is required when delete_all_read is false");
        }

        // Delete specific notification
        const { error: deleteError } = await supabaseClient
          .from("notifications")
          .delete()
          .eq("id", notification_id)
          .eq("user_id", user_id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({
          success: true,
          message: "Notification deleted"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

    } else if (action === "create") {
      const { type, title, content, data: notificationData } = data;

      if (!type || !title) {
        throw new Error("type and title are required for creating notifications");
      }

      const { data: newNotification, error: insertError } = await supabaseClient
        .from("notifications")
        .insert({
          user_id,
          type,
          title,
          content: content || "",
          data: notificationData || {}
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        success: true,
        notification: newNotification
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      throw new Error("Invalid action. Must be 'get', 'mark_read', 'delete', or 'create'");
    }

  } catch (error) {
    console.error("Error in manage-notifications function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});