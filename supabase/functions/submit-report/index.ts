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

    const { 
      content_type, 
      content_id, 
      reason, 
      report_details = {}, 
      reported_user_id = null 
    } = await req.json();

    if (!content_type || !content_id || !reason) {
      throw new Error("content_type, content_id, and reason are required");
    }

    const validContentTypes = ["news_article", "community_post", "comment"];
    if (!validContentTypes.includes(content_type)) {
      throw new Error(`Invalid content_type. Must be one of: ${validContentTypes.join(", ")}`);
    }

    const user_id = userData.user.id;

    // Check if user has already reported this content
    const whereClause: any = {
      reporter_id: user_id,
      reason
    };

    if (content_type === "news_article") {
      whereClause.article_id = content_id;
    } else if (content_type === "community_post") {
      whereClause.post_id = content_id;
    } else if (content_type === "comment") {
      whereClause.comment_id = content_id;
    }

    const { data: existingReport } = await supabaseClient
      .from("reports")
      .select("id")
      .match(whereClause)
      .single();

    if (existingReport) {
      return new Response(JSON.stringify({
        success: false,
        message: "You have already reported this content"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the report
    const reportData: any = {
      reporter_id: user_id,
      reason,
      report_details,
      reported_user_id,
      report_type: "content"
    };

    if (content_type === "news_article") {
      reportData.article_id = content_id;
    } else if (content_type === "community_post") {
      reportData.post_id = content_id;
    } else if (content_type === "comment") {
      reportData.comment_id = content_id;
    }

    const { data: newReport, error: insertError } = await supabaseClient
      .from("reports")
      .insert(reportData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Check if this content should be auto-hidden
    // (The trigger function will handle this automatically)

    // Create notification for moderators
    try {
      // Get all moderators and admins
      const { data: moderators } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "moderator"]);

      if (moderators && moderators.length > 0) {
        const notifications = moderators.map(mod => ({
          user_id: mod.user_id,
          type: "moderation",
          title: "새로운 신고가 접수되었습니다",
          content: `${content_type}에 대한 새로운 신고가 접수되었습니다. 사유: ${reason}`,
          data: { 
            report_id: newReport.id,
            content_type,
            content_id,
            reason 
          }
        }));

        await supabaseClient
          .from("notifications")
          .insert(notifications);
      }
    } catch (notificationError) {
      console.error("Failed to create moderator notifications:", notificationError);
      // Don't fail the report submission due to notification error
    }

    return new Response(JSON.stringify({
      success: true,
      report: newReport,
      message: "Report submitted successfully. Our team will review it shortly."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in submit-report function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});