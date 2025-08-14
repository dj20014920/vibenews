import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  type?: 'all' | 'news' | 'community' | 'comment';
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'popularity';
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token (optional for search)
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader);
      userId = user?.id;
    }

    const { 
      query, 
      type = 'all', 
      tags = [], 
      sortBy = 'relevance', 
      limit = 20, 
      offset = 0 
    }: SearchRequest = await req.json();

    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const searchTerm = query.trim().toLowerCase();
    console.log(`Searching for: "${searchTerm}" (type: ${type}, sortBy: ${sortBy})`);

    let newsResults: any[] = [];
    let communityResults: any[] = [];
    let commentResults: any[] = [];

    // Search news articles
    if (type === 'all' || type === 'news') {
      let newsQuery = supabase
        .from('news_articles')
        .select(`
          id,
          title,
          summary,
          content,
          thumbnail,
          tags,
          author,
          published_at,
          created_at,
          view_count,
          like_count,
          source_url
        `)
        .eq('is_hidden', false);

      // Text search in title, summary, and content
      newsQuery = newsQuery.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);

      // Tag filtering
      if (tags.length > 0) {
        newsQuery = newsQuery.overlaps('tags', tags);
      }

      // Sorting
      switch (sortBy) {
        case 'date':
          newsQuery = newsQuery.order('published_at', { ascending: false });
          break;
        case 'popularity':
          newsQuery = newsQuery.order('view_count', { ascending: false });
          break;
        default:
          // For relevance, we'll sort by creation date for now
          // In a real app, you'd use full-text search ranking
          newsQuery = newsQuery.order('created_at', { ascending: false });
      }

      const { data: news, error: newsError } = await newsQuery
        .range(offset, offset + limit - 1);

      if (newsError) {
        console.error('News search error:', newsError);
      } else {
        newsResults = news || [];
        // Add highlight snippets
        newsResults = newsResults.map(article => ({
          ...article,
          type: 'news',
          snippet: generateSnippet(article.content || article.summary, searchTerm),
          relevance_score: calculateRelevanceScore(article, searchTerm)
        }));
      }
    }

    // Search community posts
    if (type === 'all' || type === 'community') {
      let communityQuery = supabase
        .from('community_posts')
        .select(`
          id,
          title,
          content,
          content_simplified,
          tags,
          tools_used,
          author_id,
          is_anonymous,
          anonymous_author_id,
          created_at,
          updated_at,
          view_count,
          like_count,
          comment_count,
          is_featured,
          is_pinned
        `)
        .eq('is_hidden', false);

      // Text search in title and content
      communityQuery = communityQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);

      // Tag filtering
      if (tags.length > 0) {
        communityQuery = communityQuery.overlaps('tags', tags);
      }

      // Sorting
      switch (sortBy) {
        case 'date':
          communityQuery = communityQuery.order('created_at', { ascending: false });
          break;
        case 'popularity':
          communityQuery = communityQuery.order('like_count', { ascending: false });
          break;
        default:
          communityQuery = communityQuery.order('created_at', { ascending: false });
      }

      const { data: posts, error: postsError } = await communityQuery
        .range(offset, offset + limit - 1);

      if (postsError) {
        console.error('Community search error:', postsError);
      } else {
        communityResults = posts || [];
        // Add highlight snippets and fetch author info
        communityResults = await Promise.all(
          communityResults.map(async (post) => {
            let authorName = '익명';
            
            if (!post.is_anonymous && post.author_id) {
              const { data: author } = await supabase
                .from('users')
                .select('nickname')
                .eq('id', post.author_id)
                .single();
              
              authorName = author?.nickname || '사용자';
            } else if (post.anonymous_author_id) {
              authorName = `익명${post.anonymous_author_id.slice(-4)}`;
            }

            return {
              ...post,
              type: 'community',
              author_name: authorName,
              snippet: generateSnippet(post.content, searchTerm),
              relevance_score: calculateRelevanceScore(post, searchTerm)
            };
          })
        );
      }
    }

    // Search comments
    if (type === 'all' || type === 'comment') {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          author_id,
          is_anonymous,
          anonymous_author_id,
          article:news_articles(id, title),
          post:community_posts(id, title)
        `)
        .eq('is_hidden', false)
        .ilike('content', `%${searchTerm}%`)
        .range(offset, offset + limit - 1);

      if (commentsError) {
        console.error('Comment search error:', commentsError);
      } else {
        commentResults = (comments || []).map(comment => {
          const parent = comment.article || comment.post;
          const parentType = comment.article ? 'news' : 'community';
          return {
            ...comment,
            type: 'comment',
            parent_title: parent?.title,
            parent_url: `/${parentType}/${parent?.id}#comment-${comment.id}`,
            snippet: generateSnippet(comment.content, searchTerm),
            relevance_score: calculateRelevanceScore(comment, searchTerm)
          }
        });
      }
    }

    // Combine and sort results
    let allResults = [...newsResults, ...communityResults, ...commentResults];

    if (sortBy === 'relevance') {
      allResults.sort((a, b) => b.relevance_score - a.relevance_score);
    }

    // Apply final limit if searching all types
    if (type === 'all') {
      allResults = allResults.slice(0, limit);
    }

    // Save search history if user is authenticated
    if (userId) {
      await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          query: searchTerm,
          results_count: allResults.length
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: allResults,
        total_count: allResults.length,
        query: searchTerm,
        type,
        sort_by: sortBy,
        has_more: allResults.length === limit
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in search-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateSnippet(content: string, searchTerm: string, maxLength = 200): string {
  if (!content) return '';
  
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerTerm);
  
  if (index === -1) {
    return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
  
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, start + maxLength);
  
  let snippet = content.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet += '...';
  
  // Highlight search term
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  snippet = snippet.replace(regex, '<mark>$1</mark>');
  
  return snippet;
}

function calculateRelevanceScore(item: any, searchTerm: string): number {
  let score = 0;
  const lowerTerm = searchTerm.toLowerCase();
  
  // Title matches are more important
  if (item.title?.toLowerCase().includes(lowerTerm)) {
    score += 10;
    if (item.title.toLowerCase().startsWith(lowerTerm)) {
      score += 5;
    }
  }
  
  // Content matches are most important for comments
  if (item.content?.toLowerCase().includes(lowerTerm)) {
    score += item.type === 'comment' ? 15 : 5;
  }
  
  if (item.summary?.toLowerCase().includes(lowerTerm)) {
    score += 3;
  }
  
  // Tag matches
  if (item.tags?.some((tag: string) => tag.toLowerCase().includes(lowerTerm))) {
    score += 8;
  }
  
  // Popularity boost
  score += Math.min(item.like_count || 0, 10) * 0.1;
  score += Math.min(item.view_count || 0, 100) * 0.01;
  
  return score;
}