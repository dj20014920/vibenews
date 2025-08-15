import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define schemas for validation
const createPostSchema = z.object({
  title: z.string().min(3, "제목은 3자 이상이어야 합니다.").max(200, "제목은 200자를 초과할 수 없습니다."),
  content: z.string().min(10, "내용은 10자 이상이어야 합니다."),
  tags: z.array(z.string().max(25, "각 태그는 25자를 초과할 수 없습니다.")).max(10, "태그는 최대 10개까지 추가할 수 있습니다.").optional().default([]),
  tools_used: z.array(z.string().max(30, "도구 이름은 30자를 초과할 수 없습니다.")).max(10, "도구는 최대 10개까지 추가할 수 있습니다.").optional().default([]),
  is_anonymous: z.boolean().optional().default(false),
  anonymous_author_name: z.string().max(30, "익명 이름은 30자를 초과할 수 없습니다.").optional(),
});

const updatePostSchema = z.object({
  post_id: z.string().uuid("유효한 post_id가 아닙니다."),
  title: z.string().min(3, "제목은 3자 이상이어야 합니다.").max(200, "제목은 200자를 초과할 수 없습니다.").optional(),
  content: z.string().min(10, "내용은 10자 이상이어야 합니다.").optional(),
  tags: z.array(z.string().max(25, "각 태그는 25자를 초과할 수 없습니다.")).max(10, "태그는 최대 10개까지 추가할 수 있습니다.").optional(),
  tools_used: z.array(z.string().max(30, "도구 이름은 30자를 초과할 수 없습니다.")).max(10, "도구는 최대 10개까지 추가할 수 있습니다.").optional(),
});

const deletePostSchema = z.object({
  post_id: z.string().uuid("유효한 post_id가 아닙니다."),
});

const getPostSchema = z.object({
  post_id: z.string().uuid("유효한 post_id가 아닙니다."),
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
      const validatedData = createPostSchema.parse(data);

      const postData: any = {
        ...validatedData,
        author_id: user_id,
        anonymous_author_name: validatedData.is_anonymous ? (validatedData.anonymous_author_name || `익명_${Math.random().toString(36).substr(2, 6)}`) : null,
        anonymous_author_id: validatedData.is_anonymous ? `anonymous_${Math.random().toString(36).substr(2, 8)}` : null
      };

      const { data: newPost, error: insertError } = await supabaseClient
        .from("community_posts")
        .insert(postData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger content quality evaluation
      try {
        await supabaseClient.functions.invoke('content-quality-evaluator', {
          body: {
            content_id: newPost.id,
            content_type: 'community_post',
            title: newPost.title,
            content: newPost.content,
            tags: newPost.tags
          }
        });
      } catch (evaluationError) {
        console.error("Failed to trigger content quality evaluation:", evaluationError);
        // Don't fail post creation due to evaluation error
      }

      return new Response(JSON.stringify({
        success: true,
        post: newPost
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "update") {
      const validatedData = updatePostSchema.parse(data);
      const { post_id, ...updateData } = validatedData;

      const GRACE_PERIOD_MINUTES = 5;

      // First, verify ownership to provide a clear 403 Forbidden error if needed.
      const { data: ownerCheck, error: ownerError } = await supabaseClient
        .from("community_posts")
        .select("author_id")
        .eq("id", post_id)
        .single();

      if (ownerError) throw ownerError;
      if (!ownerCheck) {
        return new Response(JSON.stringify({ success: false, error: "Post not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (ownerCheck.author_id !== user_id) {
        return new Response(JSON.stringify({ success: false, error: "You can only update your own posts" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // **ATOMIC UPDATE LOGIC**
      // The conditions for editing are now in the WHERE clause of the UPDATE statement itself,
      // preventing a race condition between checking and updating.
      const gracePeriodCutoff = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000).toISOString();
      const finalUpdateData = { ...updateData, updated_at: new Date().toISOString() };

      const { data: updatedPost, error: updateError } = await supabaseClient
        .from("community_posts")
        .update(finalUpdateData)
        .eq("id", post_id)
        .eq("author_id", user_id) // Re-verify ownership within the atomic operation
        .or(`comment_count.eq.0,created_at.gte.${gracePeriodCutoff}`) // The core logic: editable if no comments OR within grace period.
        .select()
        .single();

      if (updateError) throw updateError;

      // If updatedPost is null and there's no error, it means the WHERE clause didn't match
      // (i.e., the post is not editable anymore).
      if (!updatedPost) {
        throw new Error(`댓글이 달렸거나 수정 유예 기간(${GRACE_PERIOD_MINUTES}분)이 지나 수정할 수 없습니다.`);
      }

      return new Response(JSON.stringify({
        success: true,
        post: updatedPost
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "delete") {
      const { post_id } = deletePostSchema.parse(data);

      // Check if user owns the post
      const { data: existingPost } = await supabaseClient
        .from("community_posts")
        .select("author_id")
        .eq("id", post_id)
        .single();

      if (!existingPost || existingPost.author_id !== user_id) {
        throw new Error("You can only delete your own posts");
      }

      const { error: deleteError } = await supabaseClient
        .from("community_posts")
        .delete()
        .eq("id", post_id);

      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({
        success: true,
        message: "Post deleted successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "get") {
      const { post_id } = getPostSchema.parse(data);

      const { data: post, error: selectError } = await supabaseClient
        .from("community_posts")
        .select("*")
        .eq("id", post_id)
        .eq("is_hidden", false)
        .single();

      if (selectError) throw selectError;

      if (!post) {
        throw new Error("Post not found");
      }

      // Increment view count
      await supabaseClient.rpc('increment_view_count', {
        content_type: 'community_post',
        content_id: post_id
      });

      return new Response(JSON.stringify({
        success: true,
        post
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      throw new Error("Invalid action. Must be 'create', 'update', 'delete', or 'get'");
    }

  } catch (error) {
    console.error("Error in manage-posts function:", error);
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