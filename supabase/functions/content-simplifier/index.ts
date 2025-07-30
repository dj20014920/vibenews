import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentSimplification {
  simplified_title: string;
  simplified_content: string;
  simplified_summary: string;
  technical_terms_explained: { [key: string]: string };
  reading_level: 'elementary' | 'middle' | 'high' | 'college';
  simplification_notes: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content_id, content_type, title, content, summary, target_level } = await req.json();
    
    console.log(`Starting content simplification for ${content_type}: ${content_id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // 콘텐츠 단순화 프롬프트
    const simplificationPrompt = `
당신은 기술 콘텐츠를 비개발자도 이해할 수 있게 변환하는 전문가입니다.
다음 개발자용 콘텐츠를 ${target_level || '일반인'} 수준으로 단순화해주세요:

원본 제목: ${title}
원본 내용: ${content}
원본 요약: ${summary}

요구사항:
1. 기술 용어를 쉬운 말로 설명
2. 복잡한 개념을 일상적인 예시로 설명
3. 전문적인 내용을 이해하기 쉽게 구조화
4. 핵심 메시지는 유지하되 접근성 향상

JSON 형태로 응답해주세요:
{
  "simplified_title": "이해하기 쉬운 제목",
  "simplified_content": "단순화된 본문",
  "simplified_summary": "단순화된 요약",
  "technical_terms_explained": {
    "API": "프로그램들이 서로 소통하는 방법",
    "React": "웹사이트를 만드는 도구"
  },
  "reading_level": "middle",
  "simplification_notes": ["어떤 부분을 어떻게 단순화했는지"]
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
            content: '당신은 기술 콘텐츠를 일반인이 이해할 수 있게 변환하는 전문가입니다. 정확성을 유지하면서도 쉽게 설명하세요.'
          },
          {
            role: 'user',
            content: simplificationPrompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const aiResponse = await response.json();
    const simplificationData: ContentSimplification = JSON.parse(aiResponse.choices[0].message.content);

    // 데이터베이스에 단순화된 버전 저장
    if (content_type === 'news_article') {
      const { error } = await supabase
        .from('news_articles')
        .update({
          content_simplified: simplificationData.simplified_content,
        })
        .eq('id', content_id);

      if (error) throw error;
    } else if (content_type === 'community_post') {
      const { error } = await supabase
        .from('community_posts')
        .update({
          content_simplified: simplificationData.simplified_content,
        })
        .eq('id', content_id);

      if (error) throw error;
    }

    // 단순화 로그 저장
    const { error: logError } = await supabase
      .from('content_simplifications')
      .insert({
        content_id,
        content_type,
        original_title: title,
        simplified_title: simplificationData.simplified_title,
        original_summary: summary,
        simplified_summary: simplificationData.simplified_summary,
        technical_terms_explained: simplificationData.technical_terms_explained,
        reading_level: simplificationData.reading_level,
        simplification_notes: simplificationData.simplification_notes,
        target_level: target_level || 'general'
      });

    if (logError) {
      console.error('Error logging content simplification:', logError);
    }

    console.log(`Content simplification completed for ${content_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        simplification_data: simplificationData,
        message: `콘텐츠 단순화 완료. 독해 수준: ${simplificationData.reading_level}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in content simplification:', error);
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