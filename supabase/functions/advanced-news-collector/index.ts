import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced news sources for Vibe Coding trends
const VIBE_CODING_SOURCES = {
  primary: [
    { 
      name: "Thread", 
      api: "https://api.threads.net/v1/posts",
      keywords: ["vibe coding", "Windsurf", "Cursor", "Lovable", "Bolt.new", "AI coding"],
      priority: 1
    },
    { 
      name: "YouTube", 
      api: "https://www.googleapis.com/youtube/v3/search",
      keywords: ["vibe coding tutorial", "AI pair programming", "Windsurf IDE"],
      priority: 1
    },
    { 
      name: "n8dog", 
      api: "https://api.n8dog.com/posts",
      keywords: ["바이브코딩", "AI 개발", "자연어 프로그래밍"],
      priority: 1
    }
  ],
  secondary: [
    { 
      name: "GitHub Trending",
      api: "https://api.github.com/trending",
      topics: ["ai-coding", "natural-language-programming", "vibe-coding"],
      priority: 2
    },
    { 
      name: "Reddit",
      api: "https://www.reddit.com/r/programming/.json",
      subreddits: ["programming", "artificial", "MachineLearning"],
      priority: 2
    },
    { 
      name: "HackerNews",
      api: "https://hacker-news.firebaseio.com/v0/topstories.json",
      filter: ["AI", "coding", "developer", "tool"],
      priority: 2
    }
  ],
  tools: [
    { name: "Windsurf", url: "https://windsurf.com", priceApi: "https://windsurf.com/api/pricing" },
    { name: "Cursor", url: "https://cursor.sh", priceApi: "https://cursor.sh/api/pricing" },
    { name: "Lovable", url: "https://lovable.dev", priceApi: "https://lovable.dev/api/pricing" },
    { name: "Bolt.new", url: "https://bolt.new", priceApi: "https://bolt.new/api/pricing" },
    { name: "Vitara.ai", url: "https://vitara.ai", priceApi: "https://vitara.ai/api/pricing" },
    { name: "Devin", url: "https://devin.ai", priceApi: "https://devin.ai/api/pricing" }
  ]
};

interface EnhancedNewsItem {
  title: string;
  content: string;
  content_simplified?: string;
  summary: string;
  source_url: string;
  author?: string;
  published_at: string;
  tags: string[];
  thumbnail?: string;
  quality_score?: number;
  relevance_score?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  technical_terms?: { [key: string]: string };
  tools_mentioned?: string[];
  is_trending?: boolean;
  view_prediction?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting advanced news collection with AI processing...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    const githubToken = Deno.env.get('GITHUB_TOKEN');

    const collectedNews: EnhancedNewsItem[] = [];

    // 1. Collect from primary sources
    for (const source of VIBE_CODING_SOURCES.primary) {
      try {
        console.log(`Collecting from primary source: ${source.name}`);
        const items = await collectFromSource(source, { openAIApiKey, youtubeApiKey, githubToken });
        collectedNews.push(...items);
      } catch (error) {
        console.error(`Error collecting from ${source.name}:`, error);
      }
    }

    // 2. AI Processing and Enhancement
    const enhancedNews = await processWithAI(collectedNews, openAIApiKey);

    // 3. Quality Evaluation
    const qualityFilteredNews = await evaluateQuality(enhancedNews, openAIApiKey);

    // 4. Duplicate Detection with semantic similarity
    const uniqueNews = await removeDuplicates(qualityFilteredNews, supabase);

    // 5. Content Simplification for non-developers
    const simplifiedNews = await simplifyContent(uniqueNews, openAIApiKey);

    // 6. Save to database
    let savedCount = 0;
    for (const newsItem of simplifiedNews) {
      try {
        const { error } = await supabase
          .from('news_articles')
          .insert({
            title: newsItem.title,
            content: newsItem.content,
            content_simplified: newsItem.content_simplified,
            summary: newsItem.summary,
            source_url: newsItem.source_url,
            author: newsItem.author,
            published_at: newsItem.published_at,
            tags: newsItem.tags,
            thumbnail: newsItem.thumbnail,
            quality_score: newsItem.quality_score,
            relevance_score: newsItem.relevance_score,
            sentiment: newsItem.sentiment,
            technical_terms: newsItem.technical_terms,
            tools_mentioned: newsItem.tools_mentioned,
            is_trending: newsItem.is_trending,
            is_featured: newsItem.quality_score && newsItem.quality_score > 8,
            is_hidden: false
          });

        if (!error) {
          savedCount++;
          console.log(`Saved: ${newsItem.title}`);
        } else {
          console.error('Error saving news item:', error);
        }
      } catch (error) {
        console.error('Error processing news item:', error);
      }
    }

    // 7. Update trending tags
    await updateTrendingTags(simplifiedNews, supabase);

    console.log(`Advanced news collection completed. Saved ${savedCount} high-quality articles.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `뉴스 수집 완료. ${savedCount}개의 고품질 기사를 저장했습니다.`,
        stats: {
          collected: collectedNews.length,
          quality_filtered: qualityFilteredNews.length,
          unique: uniqueNews.length,
          saved: savedCount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in advanced news collection:', error);
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

async function collectFromSource(source: any, apiKeys: any): Promise<EnhancedNewsItem[]> {
  const items: EnhancedNewsItem[] = [];
  
  try {
    if (source.name === 'YouTube' && apiKeys.youtubeApiKey) {
      const searchQuery = source.keywords.join(' OR ');
      const response = await fetch(
        `${source.api}?part=snippet&q=${encodeURIComponent(searchQuery)}&maxResults=10&order=date&type=video&key=${apiKeys.youtubeApiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        for (const item of data.items) {
          items.push({
            title: item.snippet.title,
            content: item.snippet.description,
            summary: item.snippet.description.substring(0, 200),
            source_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            author: item.snippet.channelTitle,
            published_at: item.snippet.publishedAt,
            tags: ['YouTube', 'Video', ...source.keywords],
            thumbnail: item.snippet.thumbnails.high.url,
            tools_mentioned: detectTools(item.snippet.title + ' ' + item.snippet.description)
          });
        }
      }
    } else if (source.name === 'GitHub Trending' && apiKeys.githubToken) {
      // Collect trending repositories
      for (const topic of source.topics) {
        const response = await fetch(
          `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&order=desc`,
          {
            headers: {
              'Authorization': `token ${apiKeys.githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          for (const repo of data.items.slice(0, 5)) {
            items.push({
              title: `${repo.name}: ${repo.description}`,
              content: repo.description || 'No description',
              summary: repo.description?.substring(0, 200) || 'GitHub repository',
              source_url: repo.html_url,
              author: repo.owner.login,
              published_at: repo.created_at,
              tags: ['GitHub', topic, ...repo.topics || []],
              thumbnail: repo.owner.avatar_url,
              tools_mentioned: detectTools(repo.description || '')
            });
          }
        }
      }
    } else if (source.name === 'Reddit') {
      // Collect from Reddit
      for (const subreddit of source.subreddits) {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/search.json?q=AI+coding+OR+vibe+coding&sort=new&limit=10`
        );
        
        if (response.ok) {
          const data = await response.json();
          for (const post of data.data.children) {
            const postData = post.data;
            if (postData.selftext || postData.url) {
              items.push({
                title: postData.title,
                content: postData.selftext || postData.url,
                summary: (postData.selftext || postData.title).substring(0, 200),
                source_url: `https://reddit.com${postData.permalink}`,
                author: postData.author,
                published_at: new Date(postData.created_utc * 1000).toISOString(),
                tags: ['Reddit', subreddit, 'Community'],
                thumbnail: postData.thumbnail !== 'self' ? postData.thumbnail : undefined,
                tools_mentioned: detectTools(postData.title + ' ' + (postData.selftext || ''))
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error in collectFromSource for ${source.name}:`, error);
  }
  
  return items;
}

async function processWithAI(items: EnhancedNewsItem[], apiKey: string): Promise<EnhancedNewsItem[]> {
  if (!apiKey) return items;
  
  const processedItems: EnhancedNewsItem[] = [];
  
  for (const item of items) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Analyze this vibe coding news item and enhance it with quality metrics, sentiment, and relevance scoring.'
            },
            {
              role: 'user',
              content: `
                Analyze this news item:
                Title: ${item.title}
                Content: ${item.content}
                
                Return JSON with:
                - quality_score (1-10)
                - relevance_score (1-10 for vibe coding relevance)
                - sentiment (positive/neutral/negative)
                - improved_summary (200 chars max)
                - extracted_tags (array of relevant tags)
                - is_trending (boolean)
                - view_prediction (estimated views in first week)
              `
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        const enhancement = JSON.parse(aiResponse.choices[0].message.content);
        
        processedItems.push({
          ...item,
          quality_score: enhancement.quality_score,
          relevance_score: enhancement.relevance_score,
          sentiment: enhancement.sentiment,
          summary: enhancement.improved_summary || item.summary,
          tags: [...new Set([...item.tags, ...enhancement.extracted_tags])],
          is_trending: enhancement.is_trending,
          view_prediction: enhancement.view_prediction
        });
      } else {
        processedItems.push(item);
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
      processedItems.push(item);
    }
  }
  
  return processedItems;
}

async function evaluateQuality(items: EnhancedNewsItem[], apiKey: string): Promise<EnhancedNewsItem[]> {
  // Filter by quality score
  return items.filter(item => {
    const qualityThreshold = 6;
    const relevanceThreshold = 5;
    
    return (
      (!item.quality_score || item.quality_score >= qualityThreshold) &&
      (!item.relevance_score || item.relevance_score >= relevanceThreshold)
    );
  });
}

async function removeDuplicates(items: EnhancedNewsItem[], supabase: any): Promise<EnhancedNewsItem[]> {
  const uniqueItems: EnhancedNewsItem[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  
  for (const item of items) {
    // Check URL uniqueness
    if (seenUrls.has(item.source_url)) continue;
    
    // Check title similarity (simple approach)
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenTitles.has(normalizedTitle)) continue;
    
    // Check database for existing
    const { data: existing } = await supabase
      .from('news_articles')
      .select('id')
      .eq('source_url', item.source_url)
      .single();
    
    if (!existing) {
      uniqueItems.push(item);
      seenUrls.add(item.source_url);
      seenTitles.add(normalizedTitle);
    }
  }
  
  return uniqueItems;
}

async function simplifyContent(items: EnhancedNewsItem[], apiKey: string): Promise<EnhancedNewsItem[]> {
  if (!apiKey) return items;
  
  const simplifiedItems: EnhancedNewsItem[] = [];
  
  for (const item of items) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Simplify technical content for non-developers while maintaining accuracy.'
            },
            {
              role: 'user',
              content: `
                Simplify this technical content for general audience:
                ${item.content}
                
                Return JSON with:
                - simplified_content (easy to understand version)
                - technical_terms (object with term: explanation pairs)
              `
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        const simplification = JSON.parse(aiResponse.choices[0].message.content);
        
        simplifiedItems.push({
          ...item,
          content_simplified: simplification.simplified_content,
          technical_terms: simplification.technical_terms
        });
      } else {
        simplifiedItems.push(item);
      }
    } catch (error) {
      console.error('Error simplifying content:', error);
      simplifiedItems.push(item);
    }
  }
  
  return simplifiedItems;
}

function detectTools(text: string): string[] {
  const tools: string[] = [];
  const toolNames = VIBE_CODING_SOURCES.tools.map(t => t.name.toLowerCase());
  const textLower = text.toLowerCase();
  
  for (const toolName of toolNames) {
    if (textLower.includes(toolName)) {
      tools.push(toolName);
    }
  }
  
  // Also check for variations
  if (textLower.includes('cursor') || textLower.includes('cursor.sh')) tools.push('Cursor');
  if (textLower.includes('windsurf')) tools.push('Windsurf');
  if (textLower.includes('lovable')) tools.push('Lovable');
  if (textLower.includes('bolt.new') || textLower.includes('bolt new')) tools.push('Bolt.new');
  if (textLower.includes('vitara')) tools.push('Vitara.ai');
  if (textLower.includes('devin')) tools.push('Devin');
  
  return [...new Set(tools)];
}

async function updateTrendingTags(items: EnhancedNewsItem[], supabase: any): Promise<void> {
  const tagCounts = new Map<string, number>();
  
  // Count tags
  for (const item of items) {
    for (const tag of item.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  
  // Update database
  for (const [tag, count] of tagCounts.entries()) {
    try {
      const { data: existing } = await supabase
        .from('tags')
        .select('usage_count')
        .eq('name', tag)
        .single();
      
      if (existing) {
        await supabase
          .from('tags')
          .update({ usage_count: existing.usage_count + count })
          .eq('name', tag);
      } else {
        await supabase
          .from('tags')
          .insert({
            name: tag,
            usage_count: count,
            category: categorizeTag(tag)
          });
      }
    } catch (error) {
      console.error(`Error updating tag ${tag}:`, error);
    }
  }
}

function categorizeTag(tag: string): string {
  const toolTags = ['Cursor', 'Windsurf', 'Lovable', 'Bolt.new', 'Vitara.ai', 'Devin'];
  const techTags = ['AI', 'Machine Learning', 'React', 'TypeScript', 'API'];
  
  if (toolTags.includes(tag)) return 'tool';
  if (techTags.includes(tag)) return 'technology';
  return 'general';
}