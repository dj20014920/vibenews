import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentQuality {
  relevance_score: number;
  technical_depth: number;
  credibility_score: number;
  trending_potential: number;
  developer_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  overall_score: number;
  quality_issues: string[];
  recommended_tags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content_id, content_type, title, content, source_url } = await req.json();
    
    console.log(`Starting quality evaluation for ${content_type}: ${content_id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // AI 품질 평가 프롬프트
    const evaluationPrompt = `
당신은 개발자 커뮤니티의 콘텐츠 품질 평가 전문가입니다. 다음 콘텐츠를 평가해주세요:

제목: ${title}
내용: ${content.substring(0, 2000)}...
출처: ${source_url}

다음 기준으로 0-100점 사이로 평가하고 JSON 형태로 응답해주세요:

1. relevance_score: 개발자들에게 얼마나 관련성이 있는가?
2. technical_depth: 기술적 깊이와 유용성
3. credibility_score: 신뢰성과 정확성
4. trending_potential: 트렌딩될 가능성
5. developer_level: 대상 개발자 수준 (beginner/intermediate/advanced/expert)
6. overall_score: 전체적인 품질 점수
7. quality_issues: 품질 문제점들 (배열)
8. recommended_tags: 추천 태그들 (배열)

응답 형식:
{
  "relevance_score": 85,
  "technical_depth": 70,
  "credibility_score": 90,
  "trending_potential": 75,
  "developer_level": "intermediate",
  "overall_score": 80,
  "quality_issues": ["문법 오류", "출처 불명확"],
  "recommended_tags": ["React", "Frontend", "JavaScript"]
}
`;

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 개발자 콘텐츠 품질 평가 전문가입니다. 정확하고 객관적인 평가를 제공하세요.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    const aiResponse = await response.json();
    const qualityData: ContentQuality = JSON.parse(aiResponse.choices[0].message.content);

    // 품질 점수가 낮으면 콘텐츠 숨김 처리
    const shouldHide = qualityData.overall_score < 60 || qualityData.relevance_score < 50;

    // 데이터베이스 업데이트
    if (content_type === 'news_article') {
      const { error } = await supabase
        .from('news_articles')
        .update({
          is_hidden: shouldHide,
          tags: qualityData.recommended_tags,
          // 품질 점수를 별도 필드에 저장하거나 메타데이터로 저장
        })
        .eq('id', content_id);

      if (error) throw error;
    } else if (content_type === 'community_post') {
      const { error } = await supabase
        .from('community_posts')
        .update({
          is_hidden: shouldHide,
          tags: qualityData.recommended_tags,
        })
        .eq('id', content_id);

      if (error) throw error;
    }

    // 평가 결과 로깅
    const { error: logError } = await supabase
      .from('content_quality_evaluations')
      .insert({
        content_id,
        content_type,
        relevance_score: qualityData.relevance_score,
        technical_depth: qualityData.technical_depth,
        credibility_score: qualityData.credibility_score,
        trending_potential: qualityData.trending_potential,
        developer_level: qualityData.developer_level,
        overall_score: qualityData.overall_score,
        quality_issues: qualityData.quality_issues,
        recommended_tags: qualityData.recommended_tags,
        auto_hidden: shouldHide
      });

    if (logError) {
      console.error('Error logging quality evaluation:', logError);
    }

    console.log(`Quality evaluation completed. Score: ${qualityData.overall_score}, Hidden: ${shouldHide}`);

    return new Response(
      JSON.stringify({
        success: true,
        quality_data: qualityData,
        action_taken: shouldHide ? 'hidden' : 'approved',
        message: `콘텐츠 품질 평가 완료. 전체 점수: ${qualityData.overall_score}점`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in content quality evaluation:', error);
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