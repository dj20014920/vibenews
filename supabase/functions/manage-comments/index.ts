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

    if (action === "create") {
      const { content_type, content_id, content, parent_id, is_anonymous, anonymous_author_name } = data;

      if (!content_type || !content_id || !content) {
        throw new Error("Missing required fields for comment creation");
      }

      if (!["news_article", "community_post"].includes(content_type)) {
        throw new Error("Invalid content_type");
      }

      const commentData: any = {
        content,
        author_id: user_id,
        parent_id: parent_id || null,
        is_anonymous: is_anonymous || false,
        anonymous_author_name: is_anonymous ? (anonymous_author_name || `익명_${Math.random().toString(36).substr(2, 6)}`) : null,
        anonymous_author_id: is_anonymous ? `anonymous_${Math.random().toString(36).substr(2, 8)}` : null
      };

      if (content_type === "news_article") {
        commentData.article_id = content_id;
      } else if (content_type === "community_post") {
        commentData.post_id = content_id;
      }

      const { data: newComment, error: insertError } = await supabaseClient
        .from("comments")
        .insert(commentData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Create notification for content author (if applicable)
      try {
        if (content_type === "community_post") {
          const { data: post } = await supabaseClient
            .from("community_posts")
            .select("author_id, title")
            .eq("id", content_id)
            .single();

          if (post?.author_id && post.author_id !== user_id) {
            await supabaseClient.from("notifications").insert({
              user_id: post.author_id,
              type: "comment",
              title: "새 댓글이 달렸습니다",
              content: `"${post.title}" 게시글에 새 댓글이 달렸습니다.`,
              data: { content_type, content_id, comment_id: newComment.id, from_user: user_id }
            });
          }
        }

        // If it's a reply, notify parent comment author
        if (parent_id) {
          const { data: parentComment } = await supabaseClient
            .from("comments")
            .select("author_id")
            .eq("id", parent_id)
            .single();

          if (parentComment?.author_id && parentComment.author_id !== user_id) {
            await supabaseClient.from("notifications").insert({
              user_id: parentComment.author_id,
              type: "reply",
              title: "댓글에 답글이 달렸습니다",
              content: "회원님의 댓글에 답글이 달렸습니다.",
              data: { content_type, content_id, comment_id: newComment.id, parent_id, from_user: user_id }
            });
          }
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      return new Response(JSON.stringify({
        success: true,
        comment: newComment
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "update") {
      const { comment_id, content } = data;

      if (!comment_id || !content) {
        throw new Error("Missing comment_id or content for update");
      }

      // Check if user owns the comment
      const { data: existingComment } = await supabaseClient
        .from("comments")
        .select("author_id")
        .eq("id", comment_id)
        .single();

      if (!existingComment || existingComment.author_id !== user_id) {
        throw new Error("You can only update your own comments");
      }

      const { data: updatedComment, error: updateError } = await supabaseClient
        .from("comments")
        .update({ 
          content, 
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", comment_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        comment: updatedComment
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "delete") {
      const { comment_id } = data;

      if (!comment_id) {
        throw new Error("Missing comment_id for deletion");
      }

      // Check if user owns the comment
      const { data: existingComment } = await supabaseClient
        .from("comments")
        .select("author_id")
        .eq("id", comment_id)
        .single();

      if (!existingComment || existingComment.author_id !== user_id) {
        throw new Error("You can only delete your own comments");
      }

      const { error: deleteError } = await supabaseClient
        .from("comments")
        .delete()
        .eq("id", comment_id);

      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({
        success: true,
        message: "Comment deleted successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "get") {
      const { content_type, content_id, limit = 50, offset = 0 } = data;

      if (!content_type || !content_id) {
        throw new Error("Missing content_type or content_id for getting comments");
      }

      let query = supabaseClient
        .from("comments")
        .select("*")
        .eq("is_hidden", false)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (content_type === "news_article") {
        query = query.eq("article_id", content_id);
      } else if (content_type === "community_post") {
        query = query.eq("post_id", content_id);
      } else {
        throw new Error("Invalid content_type");
      }

      const { data: comments, error: selectError } = await query;

      if (selectError) throw selectError;

      return new Response(JSON.stringify({
        success: true,
        comments: comments || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      throw new Error("Invalid action. Must be 'create', 'update', 'delete', or 'get'");
    }

  } catch (error) {
    console.error("Error in manage-comments function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});