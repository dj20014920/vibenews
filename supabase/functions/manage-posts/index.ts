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
      const { title, content, tags = [], tools_used = [], is_anonymous = false, anonymous_author_name } = data;

      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      const postData: any = {
        title,
        content,
        tags,
        tools_used,
        author_id: user_id,
        is_anonymous,
        anonymous_author_name: is_anonymous ? (anonymous_author_name || `익명_${Math.random().toString(36).substr(2, 6)}`) : null,
        anonymous_author_id: is_anonymous ? `anonymous_${Math.random().toString(36).substr(2, 8)}` : null
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
      const { post_id, title, content, tags, tools_used } = data;

      if (!post_id) {
        throw new Error("post_id is required for update");
      }

      // Check if user owns the post
      const { data: existingPost } = await supabaseClient
        .from("community_posts")
        .select("author_id")
        .eq("id", post_id)
        .single();

      if (!existingPost || existingPost.author_id !== user_id) {
        throw new Error("You can only update your own posts");
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (tags !== undefined) updateData.tags = tags;
      if (tools_used !== undefined) updateData.tools_used = tools_used;

      const { data: updatedPost, error: updateError } = await supabaseClient
        .from("community_posts")
        .update(updateData)
        .eq("id", post_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        post: updatedPost
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "delete") {
      const { post_id } = data;

      if (!post_id) {
        throw new Error("post_id is required for deletion");
      }

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
      const { post_id } = data;

      if (!post_id) {
        throw new Error("post_id is required");
      }

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
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});