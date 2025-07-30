import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendingScore {
  content_id: string;
  content_type: string;
  trending_score: number;
  velocity_score: number;
  engagement_score: number;
  recency_score: number;
  quality_score: number;
  calculated_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = 'calculate_all' } = await req.json();
    
    console.log(`Starting trending algorithm calculation: ${action}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 뉴스 기사 트렌딩 계산
    const { data: newsArticles, error: newsError } = await supabase
      .from('news_articles')
      .select(`
        id, title, view_count, like_count, published_at, created_at,
        comments:comments(count)
      `)
      .eq('is_hidden', false)
      .gte('published_at', sevenDaysAgo.toISOString());

    if (newsError) throw newsError;

    // 커뮤니티 포스트 트렌딩 계산
    const { data: communityPosts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        id, title, view_count, like_count, comment_count, created_at
      `)
      .eq('is_hidden', false)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (postsError) throw postsError;

    const trendingScores: TrendingScore[] = [];

    // 뉴스 기사 점수 계산
    for (const article of newsArticles || []) {
      const score = calculateTrendingScore({
        view_count: article.view_count || 0,
        like_count: article.like_count || 0,
        comment_count: article.comments?.[0]?.count || 0,
        created_at: article.published_at || article.created_at,
        content_type: 'news_article'
      });

      trendingScores.push({
        content_id: article.id,
        content_type: 'news_article',
        ...score,
        calculated_at: now.toISOString()
      });
    }

    // 커뮤니티 포스트 점수 계산
    for (const post of communityPosts || []) {
      const score = calculateTrendingScore({
        view_count: post.view_count || 0,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at,
        content_type: 'community_post'
      });

      trendingScores.push({
        content_id: post.id,
        content_type: 'community_post',
        ...score,
        calculated_at: now.toISOString()
      });
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
  const quality_multiplier = like_count > 0 ? (like_count / (like_count + view_count * 0.01)) : 0.5;
  const quality_score = base_quality_score * Math.min(quality_multiplier * 2, 1.5);

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