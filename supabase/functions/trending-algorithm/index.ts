import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendingScore {
  content_id: string;
  content_type: string;
  trending_score: number;
  hot_score: number;
  velocity_score: number;
  engagement_score: number;
  recency_score: number;
  quality_score: number;
  calculated_at: string;
}

const processContentType = async (
  supabase: SupabaseClient,
  contentType: 'news_article' | 'community_post',
  now: Date,
  sevenDaysAgo: Date
): Promise<TrendingScore[]> => {
  const isNews = contentType === 'news_article';
  const tableName = isNews ? 'news_articles' : 'community_posts';
  const dateColumn = isNews ? 'published_at' : 'created_at';
  const commentLinkColumn = isNews ? 'article_id' : 'post_id';

  const { data: posts, error } = await supabase
    .from(tableName)
    .select(`id, view_count, like_count, ${dateColumn}, created_at`)
    .eq('is_hidden', false)
    .gte(dateColumn, sevenDaysAgo.toISOString());

  if (error) throw error;

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const scores: TrendingScore[] = [];

  for (const post of posts || []) {
    // Get recent activity
    const { count: recent_likes } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq(commentLinkColumn, post.id)
      .gte('created_at', twentyFourHoursAgo.toISOString());

    const { count: recent_comments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq(commentLinkColumn, post.id)
      .gte('created_at', twentyFourHoursAgo.toISOString());

    const { count: total_comments } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq(commentLinkColumn, post.id);

    const hotScore = calculateHotScore({
      created_at: post[dateColumn] || post.created_at,
      recent_likes: recent_likes || 0,
      recent_comments: recent_comments || 0,
    });

    const trendingScore = calculateTrendingScore({
      view_count: post.view_count || 0,
      like_count: post.like_count || 0,
      comment_count: total_comments || 0,
      created_at: post[dateColumn] || post.created_at,
      content_type: contentType
    });

    scores.push({
      content_id: post.id,
      content_type: contentType,
      hot_score: hotScore,
      ...trendingScore,
      calculated_at: now.toISOString()
    });
  }

  return scores;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType = 'all' } = await req.json(); // 'all', 'news', 'community'
    
    console.log(`Starting trending algorithm calculation for: ${contentType}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let trendingScores: TrendingScore[] = [];

    if (contentType === 'all' || contentType === 'news') {
      const newsScores = await processContentType(supabase, 'news_article', now, sevenDaysAgo);
      trendingScores.push(...newsScores);
    }

    if (contentType === 'all' || contentType === 'community') {
      const communityScores = await processContentType(supabase, 'community_post', now, sevenDaysAgo);
      trendingScores.push(...communityScores);
    }

    // 기존 트렌딩 스코어 삭제
    await supabase
      .from('trending_scores')
      .delete()
      .lt('calculated_at', twentyFourHoursAgo.toISOString());

    // 새로운 트렌딩 스코어 저장
    if (trendingScores.length > 0) {
      const { error: insertError } = await supabase
        .from('trending_scores')
        .upsert(trendingScores, {
          onConflict: 'content_id,content_type'
        });

      if (insertError) {
        console.error('Error inserting trending scores:', insertError);
      }
    }

    console.log(`Trending calculation completed. Processed ${trendingScores.length} items.`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: trendingScores.length,
        top_trending: trendingScores
          .sort((a, b) => b.trending_score - a.trending_score)
          .slice(0, 10),
        top_hot: trendingScores
          .sort((a, b) => b.hot_score - a.hot_score)
          .slice(0, 10),
        message: `트렌딩 알고리즘 계산 완료. ${trendingScores.length}개 콘텐츠 처리됨`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in trending algorithm:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateHotScore({
  created_at,
  recent_likes,
  recent_comments
}: {
  created_at: string;
  recent_likes: number;
  recent_comments: number;
}) {
  const now = new Date();
  const contentDate = new Date(created_at);
  const hoursAgo = Math.max(1, (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60)); // Prevent division by zero

  const rawScore = (recent_likes * 5) + (recent_comments * 10);

  // Gravity formula for time decay
  const gravity = 1.8;
  const hotScore = rawScore / Math.pow(hoursAgo + 2, gravity);

  return Math.round(hotScore * 100) / 100;
}

function calculateTrendingScore({
  view_count,
  like_count,
  comment_count,
  created_at,
  content_type
}: {
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  content_type: string;
}) {
  const now = new Date();
  const contentDate = new Date(created_at);
  const hoursAgo = (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60);

  // 1. 참여도 점수 (Engagement Score)
  const engagement_score = (
    (like_count * 3) +        // 좋아요 가중치 3
    (comment_count * 5) +     // 댓글 가중치 5
    (view_count * 0.1)        // 조회수 가중치 0.1
  );

  // 2. 속도 점수 (Velocity Score) - 시간당 참여도
  const velocity_score = hoursAgo > 0 ? engagement_score / hoursAgo : engagement_score;

  // 3. 신선도 점수 (Recency Score) - 시간에 따른 감소
  let recency_score: number;
  if (hoursAgo <= 2) {
    recency_score = 100;  // 2시간 이내 최고점
  } else if (hoursAgo <= 24) {
    recency_score = 100 - ((hoursAgo - 2) * 2); // 24시간까지 점진적 감소
  } else if (hoursAgo <= 168) { // 7일
    recency_score = 56 - ((hoursAgo - 24) * 0.3); // 7일까지 천천히 감소
  } else {
    recency_score = 10; // 7일 이후 최소값
  }

  // 4. 품질 점수 (Quality Score) - 컨텐츠 타입별 기본 점수
  const base_quality_score = content_type === 'news_article' ? 80 : 70;
  const quality_multiplier = like_count > 0 && view_count > 0 ? (like_count / view_count) * 10 : 0.5;
  const quality_score = base_quality_score * Math.min(quality_multiplier, 1.5);

  // 5. 최종 트렌딩 점수 계산
  const trending_score = (
    (engagement_score * 0.4) +     // 참여도 40%
    (velocity_score * 0.3) +       // 속도 30%
    (recency_score * 0.2) +        // 신선도 20%
    (quality_score * 0.1)          // 품질 10%
  );

  return {
    trending_score: Math.round(trending_score * 100) / 100,
    velocity_score: Math.round(velocity_score * 100) / 100,
    engagement_score: Math.round(engagement_score * 100) / 100,
    recency_score: Math.round(recency_score * 100) / 100,
    quality_score: Math.round(quality_score * 100) / 100
  };
}