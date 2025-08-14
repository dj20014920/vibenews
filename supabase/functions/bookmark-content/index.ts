import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const bookmarkSchema = z.object({
  content_type: z.enum(["news_article", "community_post"]),
  content_id: z.string().uuid(),
  action: z.enum(["bookmark", "unbookmark"]),
  folder_name: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(25)).max(20).optional(),
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const body = await req.json();
    const { content_type, content_id, action, folder_name, notes, tags } = bookmarkSchema.parse(body);

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
    const errorMessage = error instanceof z.ZodError
      ? error.errors.map(e => e.message).join(', ')
      : error.message;

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      status: 400, // Bad Request for validation errors
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});