import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const createCommentSchema = z.object({
  content_type: z.enum(["news_article", "community_post"]),
  content_id: z.string().uuid("유효한 콘텐츠 ID가 아닙니다."),
  content: z.string().min(1, "댓글 내용은 비워둘 수 없습니다.").max(5000, "댓글은 5000자를 초과할 수 없습니다."),
  parent_id: z.string().uuid("유효한 부모 댓글 ID가 아닙니다.").optional().nullable(),
  is_anonymous: z.boolean().optional().default(false),
  anonymous_author_name: z.string().max(30, "익명 이름은 30자를 초과할 수 없습니다.").optional(),
});

const updateCommentSchema = z.object({
  comment_id: z.string().uuid("유효한 댓글 ID가 아닙니다."),
  content: z.string().min(1, "댓글 내용은 비워둘 수 없습니다.").max(5000, "댓글은 5000자를 초과할 수 없습니다."),
});

const deleteCommentSchema = z.object({
  comment_id: z.string().uuid("유효한 댓글 ID가 아닙니다."),
});

const getCommentsSchema = z.object({
  content_type: z.enum(["news_article", "community_post"]),
  content_id: z.string().uuid("유효한 콘텐츠 ID가 아닙니다."),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
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
    const { action, ...data } = body;
    const user_id = userData.user.id;

    if (action === "create") {
      const validatedData = createCommentSchema.parse(data);
      const { content_type, content_id, content, parent_id, is_anonymous, anonymous_author_name } = validatedData;

      const commentData: any = {
        content,
        author_id: user_id,
        parent_id,
        is_anonymous,
        anonymous_author_name: is_anonymous ? (anonymous_author_name || `익명_${Math.random().toString(36).substr(2, 6)}`) : null,
        anonymous_author_id: is_anonymous ? `anonymous_${Math.random().toString(36).substr(2, 8)}` : null
      };

      if (content_type === "news_article") {
        commentData.article_id = content_id;
      } else { // community_post
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
      const { comment_id, content } = updateCommentSchema.parse(data);

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
      const { comment_id } = deleteCommentSchema.parse(data);

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
      const { content_type, content_id, limit, offset } = getCommentsSchema.parse(data);

      let query = supabaseClient
        .from("comments")
        .select("*")
        .eq("is_hidden", false)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (content_type === "news_article") {
        query = query.eq("article_id", content_id);
      } else { // community_post
        query = query.eq("post_id", content_id);
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