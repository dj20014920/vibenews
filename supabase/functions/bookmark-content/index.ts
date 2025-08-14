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

    const { content_type, content_id, action, folder_name, notes, tags } = await req.json();

    if (!content_type || !content_id || !action) {
      throw new Error("Missing required fields: content_type, content_id, action");
    }

    if (!["bookmark", "unbookmark"].includes(action)) {
      throw new Error("Action must be 'bookmark' or 'unbookmark'");
    }

    if (!["news_article", "community_post"].includes(content_type)) {
      throw new Error("Content type must be 'news_article' or 'community_post'");
    }

    const user_id = userData.user.id;

    if (action === "bookmark") {
      // Check if already bookmarked
      const { data: existingBookmark } = await supabaseClient
        .from("bookmarks")
        .select("id")
        .eq("user_id", user_id)
        .eq(content_type === "news_article" ? "article_id" : "post_id", content_id)
        .single();

      if (existingBookmark) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Already bookmarked" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert bookmark
      const bookmarkData: any = { 
        user_id,
        folder_name: folder_name || "default",
        notes: notes || null,
        tags: tags || []
      };
      
      if (content_type === "news_article") {
        bookmarkData.article_id = content_id;
      } else if (content_type === "community_post") {
        bookmarkData.post_id = content_id;
      }

      const { error: insertError } = await supabaseClient
        .from("bookmarks")
        .insert(bookmarkData);

      if (insertError) throw insertError;

    } else if (action === "unbookmark") {
      // Remove bookmark
      const whereClause: any = { user_id };
      if (content_type === "news_article") {
        whereClause.article_id = content_id;
      } else if (content_type === "community_post") {
        whereClause.post_id = content_id;
      }

      const { error: deleteError } = await supabaseClient
        .from("bookmarks")
        .delete()
        .match(whereClause);

      if (deleteError) throw deleteError;
    }

    // Check if currently bookmarked
    const { data: currentBookmark } = await supabaseClient
      .from("bookmarks")
      .select("id, folder_name, notes, tags")
      .eq("user_id", user_id)
      .eq(content_type === "news_article" ? "article_id" : "post_id", content_id)
      .single();

    return new Response(JSON.stringify({
      success: true,
      bookmarked: !!currentBookmark,
      bookmark_info: currentBookmark || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in bookmark-content function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});