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

    const { content_type, content_id } = await req.json();

    if (!content_type || !content_id) {
      throw new Error("content_type and content_id are required");
    }

    if (!["news_article", "community_post"].includes(content_type)) {
      throw new Error("Invalid content_type. Must be 'news_article' or 'community_post'");
    }

    // Use the database function to increment view count
    const { error } = await supabaseClient.rpc('increment_view_count', {
      content_type,
      content_id
    });

    if (error) throw error;

    // Get the updated view count
    let selectQuery;
    if (content_type === "news_article") {
      selectQuery = supabaseClient
        .from("news_articles")
        .select("view_count")
        .eq("id", content_id)
        .single();
    } else {
      selectQuery = supabaseClient
        .from("community_posts")
        .select("view_count")
        .eq("id", content_id)
        .single();
    }

    const { data, error: selectError } = await selectQuery;
    if (selectError) throw selectError;

    return new Response(JSON.stringify({
      success: true,
      view_count: data?.view_count || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in track-views function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});