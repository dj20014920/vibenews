import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 임시 뉴스 소스들 (나중에 확장 가능)
const newsSources = [
  {
    name: "TechCrunch",
    rss: "https://techcrunch.com/feed/",
    category: "tech"
  },
  {
    name: "GitHub Blog",
    rss: "https://github.blog/feed/",
    category: "development"
  },
  {
    name: "Dev.to",
    rss: "https://dev.to/feed",
    category: "development"
  }
];

interface NewsItem {
  title: string;
  content: string;
  summary: string;
  source_url: string;
  author?: string;
  published_at: string;
  tags: string[];
  thumbnail?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting news collection process...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const collectedNews: NewsItem[] = [];

    // 각 뉴스 소스에서 데이터 수집 (임시 구현)
    for (const source of newsSources) {
      try {
        console.log(`Collecting from ${source.name}...`);
        
        // RSS 피드 파싱 (간단한 임시 구현)
        const response = await fetch(source.rss);
        const rssText = await response.text();
        
        // 간단한 RSS 파싱 (임시)
        const items = parseSimpleRSS(rssText, source);
        collectedNews.push(...items);
        
        console.log(`Collected ${items.length} items from ${source.name}`);
      } catch (error) {
        console.error(`Error collecting from ${source.name}:`, error);
      }
    }

    // 데이터베이스에 저장
    let savedCount = 0;
    for (const newsItem of collectedNews) {
      try {
        // 중복 체크 (URL 기준)
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .eq('source_url', newsItem.source_url)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('news_articles')
            .insert({
              title: newsItem.title,
              content: newsItem.content,
              summary: newsItem.summary,
              source_url: newsItem.source_url,
              author: newsItem.author,
              published_at: newsItem.published_at,
              tags: newsItem.tags,
              thumbnail: newsItem.thumbnail,
              is_hidden: false
            });

          if (!error) {
            savedCount++;
          } else {
            console.error('Error saving news item:', error);
          }
        }
      } catch (error) {
        console.error('Error processing news item:', error);
      }
    }

    console.log(`News collection completed. Saved ${savedCount} new articles.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `뉴스 수집 완료. ${savedCount}개의 새로운 기사를 저장했습니다.`,
        collected: collectedNews.length,
        saved: savedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in news collection:', error);
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

// 간단한 RSS 파싱 함수 (임시 구현)
function parseSimpleRSS(rssText: string, source: { name: string; category: string }): NewsItem[] {
  const items: NewsItem[] = [];
  
  try {
    // 매우 간단한 RSS 파싱 (정규식 사용)
    const itemMatches = rssText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (let i = 0; i < Math.min(itemMatches.length, 5); i++) { // 최대 5개만
      const item = itemMatches[i];
      
      const title = extractTag(item, 'title') || 'No Title';
      const link = extractTag(item, 'link') || extractTag(item, 'guid') || '';
      const description = extractTag(item, 'description') || extractTag(item, 'content:encoded') || '';
      const pubDate = extractTag(item, 'pubDate') || new Date().toISOString();
      const author = extractTag(item, 'author') || extractTag(item, 'dc:creator') || source.name;
      
      if (link && title) {
        items.push({
          title: cleanText(title),
          content: cleanText(description),
          summary: cleanText(description).substring(0, 200) + '...',
          source_url: link,
          author: cleanText(author),
          published_at: parseDate(pubDate),
          tags: [source.category, 'auto-collected'],
          thumbnail: extractImageFromContent(description)
        });
      }
    }
  } catch (error) {
    console.error('Error parsing RSS:', error);
  }
  
  return items;
}

function extractTag(text: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&[a-zA-Z0-9#]+;/g, ' ') // HTML 엔티티 제거
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractImageFromContent(content: string): string | undefined {
  const imgMatch = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  return imgMatch ? imgMatch[1] : undefined;
}