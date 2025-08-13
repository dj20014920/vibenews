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

    const { content_type, content_id, action } = await req.json();

    if (!content_type || !content_id || !action) {
      throw new Error("Missing required fields: content_type, content_id, action");
    }

    if (!["like", "unlike"].includes(action)) {
      throw new Error("Action must be 'like' or 'unlike'");
    }

    if (!["news_article", "community_post", "comment"].includes(content_type)) {
      throw new Error("Invalid content_type");
    }

    const user_id = userData.user.id;

    if (action === "like") {
      // Check if already liked
      const { data: existingLike } = await supabaseClient
        .from("likes")
        .select("id")
        .eq("user_id", user_id)
        .eq(content_type === "news_article" ? "article_id" : 
           content_type === "community_post" ? "post_id" : "comment_id", content_id)
        .single();

      if (existingLike) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Already liked" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert like
      const likeData: any = { user_id };
      if (content_type === "news_article") likeData.article_id = content_id;
      else if (content_type === "community_post") likeData.post_id = content_id;
      else if (content_type === "comment") likeData.comment_id = content_id;

      const { error: insertError } = await supabaseClient
        .from("likes")
        .insert(likeData);

      if (insertError) throw insertError;

      // Create notification for author
      try {
        if (content_type === "news_article") {
          // News articles don't have user authors, skip notification
        } else if (content_type === "community_post") {
          const { data: post } = await supabaseClient
            .from("community_posts")
            .select("author_id, title")
            .eq("id", content_id)
            .single();

          if (post?.author_id && post.author_id !== user_id) {
            await supabaseClient.from("notifications").insert({
              user_id: post.author_id,
              type: "like",
              title: "게시글에 좋아요를 받았습니다",
              content: `"${post.title}" 게시글에 좋아요를 받았습니다.`,
              data: { content_type, content_id, from_user: user_id }
            });
          }
        } else if (content_type === "comment") {
          const { data: comment } = await supabaseClient
            .from("comments")
            .select("author_id, content")
            .eq("id", content_id)
            .single();

          if (comment?.author_id && comment.author_id !== user_id) {
            await supabaseClient.from("notifications").insert({
              user_id: comment.author_id,
              type: "like",
              title: "댓글에 좋아요를 받았습니다",
              content: `댓글에 좋아요를 받았습니다: "${comment.content.substring(0, 50)}..."`,
              data: { content_type, content_id, from_user: user_id }
            });
          }
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
        // Don't fail the like operation due to notification error
      }

    } else if (action === "unlike") {
      // Remove like
      const whereClause: any = { user_id };
      if (content_type === "news_article") whereClause.article_id = content_id;
      else if (content_type === "community_post") whereClause.post_id = content_id;
      else if (content_type === "comment") whereClause.comment_id = content_id;

      const { error: deleteError } = await supabaseClient
        .from("likes")
        .delete()
        .match(whereClause);

      if (deleteError) throw deleteError;
    }

    // Get updated like count
    let likeCountQuery = supabaseClient
      .from("likes")
      .select("id", { count: "exact" });

    if (content_type === "news_article") {
      likeCountQuery = likeCountQuery.eq("article_id", content_id);
    } else if (content_type === "community_post") {
      likeCountQuery = likeCountQuery.eq("post_id", content_id);
    } else if (content_type === "comment") {
      likeCountQuery = likeCountQuery.eq("comment_id", content_id);
    }

    const { count: likeCount } = await likeCountQuery;

    return new Response(JSON.stringify({
      success: true,
      liked: action === "like",
      like_count: likeCount || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in like-content function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});