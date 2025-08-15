import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Search configuration
const SEARCH_CONFIG = {
  // ML relevance weights
  weights: {
    title_match: 0.35,
    content_match: 0.25,
    tag_match: 0.15,
    recency: 0.10,
    popularity: 0.10,
    user_preference: 0.05
  },
  // Boost factors for specific contexts
  boosts: {
    exact_match: 2.0,
    phrase_match: 1.5,
    trending_topic: 1.3,
    verified_source: 1.2,
    user_language: 1.1
  },
  // Search options
  options: {
    max_results: 100,
    min_score: 0.1,
    enable_fuzzy: true,
    enable_synonyms: true,
    enable_stemming: true
  }
};

// Synonym mappings for vibe coding terms
const SYNONYMS = {
  'vibe coding': ['vibes coding', 'vibe-coding', 'vibe development'],
  'windsurf': ['windsurf ide', 'codeium windsurf'],
  'cursor': ['cursor ide', 'cursor editor', 'cursor.sh'],
  'ai coding': ['ai development', 'ai programming', 'ai-assisted coding'],
  'copilot': ['github copilot', 'code copilot', 'ai copilot'],
  'ide': ['editor', 'development environment', 'code editor'],
  'tutorial': ['guide', 'lesson', 'course', 'walkthrough'],
  'review': ['comparison', 'analysis', 'evaluation']
};

interface SearchRequest {
  query: string;
  filters?: {
    type?: string[];
    tags?: string[];
    date_from?: string;
    date_to?: string;
    min_score?: number;
    language?: string;
    source?: string[];
  };
  options?: {
    page?: number;
    limit?: number;
    sort_by?: 'relevance' | 'date' | 'popularity';
    include_similar?: boolean;
    personalized?: boolean;
  };
  user_context?: {
    user_id?: string;
    preferences?: string[];
    history?: string[];
    location?: string;
  };
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  url?: string;
  tags: string[];
  score: number;
  relevance_breakdown: {
    title_score: number;
    content_score: number;
    tag_score: number;
    recency_score: number;
    popularity_score: number;
    personalization_score: number;
  };
  highlights: {
    title?: string[];
    content?: string[];
    tags?: string[];
  };
  metadata: any;
  created_at: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  expanded_query?: string;
  total_results: number;
  results: SearchResult[];
  facets?: {
    types: { [key: string]: number };
    tags: { [key: string]: number };
    sources: { [key: string]: number };
  };
  suggestions?: string[];
  related_searches?: string[];
  performance: {
    search_time_ms: number;
    scoring_time_ms: number;
    total_time_ms: number;
  };
}

// Expand query with synonyms and variations
function expandQuery(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/);
  const expanded = new Set<string>([query.toLowerCase()]);
  
  // Add original terms
  terms.forEach(term => expanded.add(term));
  
  // Add synonyms
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (query.toLowerCase().includes(key)) {
      synonyms.forEach(syn => {
        expanded.add(query.toLowerCase().replace(key, syn));
      });
    }
    // Check if any synonym matches the query
    synonyms.forEach(syn => {
      if (query.toLowerCase().includes(syn)) {
        expanded.add(query.toLowerCase().replace(syn, key));
      }
    });
  }
  
  // Add stemmed versions (simple stemming)
  const stemmedTerms = terms.map(term => {
    // Remove common suffixes
    return term.replace(/ing$|ed$|s$|er$|est$|ly$/, '');
  });
  stemmedTerms.forEach(term => expanded.add(term));
  
  // Add fuzzy variations (for typo tolerance)
  if (SEARCH_CONFIG.options.enable_fuzzy) {
    // This would typically use a more sophisticated fuzzy matching algorithm
    // For now, we'll just handle common typos
    const fuzzyVariations = generateFuzzyVariations(query.toLowerCase());
    fuzzyVariations.forEach(variation => expanded.add(variation));
  }
  
  return Array.from(expanded);
}

// Generate fuzzy variations for typo tolerance
function generateFuzzyVariations(query: string): string[] {
  const variations: string[] = [];
  
  // Common typo patterns for vibe coding terms
  const typoMap: { [key: string]: string[] } = {
    'windsurf': ['winsurf', 'windserf', 'windsuf'],
    'cursor': ['curser', 'cursur', 'curso'],
    'vibe': ['vibe', 'vibes', 'vib'],
    'coding': ['codeing', 'coing', 'codin']
  };
  
  for (const [correct, typos] of Object.entries(typoMap)) {
    if (query.includes(correct)) {
      typos.forEach(typo => {
        variations.push(query.replace(correct, typo));
      });
    }
    // Check if query contains a typo
    typos.forEach(typo => {
      if (query.includes(typo)) {
        variations.push(query.replace(typo, correct));
      }
    });
  }
  
  return variations;
}

// Calculate relevance score using ML-inspired approach
function calculateRelevanceScore(
  item: any,
  query: string,
  expandedQueries: string[],
  userContext?: any
): { score: number; breakdown: any; highlights: any } {
  const weights = SEARCH_CONFIG.weights;
  const boosts = SEARCH_CONFIG.boosts;
  
  let breakdown = {
    title_score: 0,
    content_score: 0,
    tag_score: 0,
    recency_score: 0,
    popularity_score: 0,
    personalization_score: 0
  };
  
  let highlights = {
    title: [] as string[],
    content: [] as string[],
    tags: [] as string[]
  };
  
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);
  
  // Title matching
  if (item.title) {
    const titleLower = item.title.toLowerCase();
    
    // Exact match
    if (titleLower === queryLower) {
      breakdown.title_score = 1.0 * boosts.exact_match;
    }
    // Phrase match
    else if (titleLower.includes(queryLower)) {
      breakdown.title_score = 0.8 * boosts.phrase_match;
      highlights.title.push(query);
    }
    // Term matching
    else {
      let termMatches = 0;
      queryTerms.forEach(term => {
        if (titleLower.includes(term)) {
          termMatches++;
          highlights.title.push(term);
        }
      });
      breakdown.title_score = (termMatches / queryTerms.length) * 0.6;
      
      // Check expanded queries
      expandedQueries.forEach(expanded => {
        if (titleLower.includes(expanded) && breakdown.title_score < 0.5) {
          breakdown.title_score = 0.5;
        }
      });
    }
  }
  
  // Content matching
  if (item.content) {
    const contentLower = item.content.toLowerCase();
    const contentPreview = item.content.substring(0, 500);
    
    // Exact match
    if (contentLower.includes(queryLower)) {
      breakdown.content_score = 0.7 * boosts.phrase_match;
      // Extract context around match
      const matchIndex = contentLower.indexOf(queryLower);
      const contextStart = Math.max(0, matchIndex - 50);
      const contextEnd = Math.min(item.content.length, matchIndex + queryLower.length + 50);
      highlights.content.push(item.content.substring(contextStart, contextEnd));
    }
    // Term matching
    else {
      let termMatches = 0;
      let matchedTerms: string[] = [];
      queryTerms.forEach(term => {
        if (contentLower.includes(term)) {
          termMatches++;
          matchedTerms.push(term);
        }
      });
      breakdown.content_score = (termMatches / queryTerms.length) * 0.5;
      
      // Extract highlights for matched terms
      matchedTerms.slice(0, 3).forEach(term => {
        const matchIndex = contentLower.indexOf(term);
        if (matchIndex !== -1) {
          const contextStart = Math.max(0, matchIndex - 30);
          const contextEnd = Math.min(item.content.length, matchIndex + term.length + 30);
          highlights.content.push(item.content.substring(contextStart, contextEnd));
        }
      });
    }
  }
  
  // Tag matching
  if (item.tags && Array.isArray(item.tags)) {
    const tagsLower = item.tags.map((t: string) => t.toLowerCase());
    let tagMatches = 0;
    
    queryTerms.forEach(term => {
      tagsLower.forEach(tag => {
        if (tag.includes(term) || term.includes(tag)) {
          tagMatches++;
          highlights.tags.push(tag);
        }
      });
    });
    
    // Check for exact tag matches
    if (tagsLower.includes(queryLower)) {
      breakdown.tag_score = 1.0;
    } else {
      breakdown.tag_score = Math.min(1.0, tagMatches * 0.3);
    }
  }
  
  // Recency score (newer content scores higher)
  if (item.created_at || item.published_at) {
    const itemDate = new Date(item.created_at || item.published_at);
    const now = new Date();
    const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 1) {
      breakdown.recency_score = 1.0; // Today
    } else if (daysDiff < 7) {
      breakdown.recency_score = 0.8; // This week
    } else if (daysDiff < 30) {
      breakdown.recency_score = 0.6; // This month
    } else if (daysDiff < 90) {
      breakdown.recency_score = 0.4; // Last 3 months
    } else if (daysDiff < 365) {
      breakdown.recency_score = 0.2; // This year
    } else {
      breakdown.recency_score = 0.1; // Older
    }
  }
  
  // Popularity score (based on views, likes, comments)
  if (item.view_count || item.like_count || item.comment_count) {
    const views = item.view_count || 0;
    const likes = item.like_count || 0;
    const comments = item.comment_count || 0;
    
    // Normalize popularity (logarithmic scale)
    const popularityRaw = views + (likes * 10) + (comments * 5);
    breakdown.popularity_score = Math.min(1.0, Math.log10(popularityRaw + 1) / 4);
  }
  
  // Personalization score (based on user preferences and history)
  if (userContext) {
    let personalizationFactors = 0;
    let totalFactors = 0;
    
    // Check if content matches user preferences
    if (userContext.preferences && item.tags) {
      const matchingPrefs = userContext.preferences.filter((pref: string) =>
        item.tags.some((tag: string) => tag.toLowerCase().includes(pref.toLowerCase()))
      );
      if (matchingPrefs.length > 0) {
        personalizationFactors += matchingPrefs.length / userContext.preferences.length;
        totalFactors++;
      }
    }
    
    // Check if content is in user's language
    if (userContext.language && item.language) {
      if (item.language === userContext.language) {
        personalizationFactors += 1;
        totalFactors++;
      }
    }
    
    // Check if content is from sources user interacts with
    if (userContext.history && item.source) {
      const sourcesInHistory = userContext.history.filter((h: any) => h.source === item.source);
      if (sourcesInHistory.length > 0) {
        personalizationFactors += Math.min(1.0, sourcesInHistory.length / 10);
        totalFactors++;
      }
    }
    
    if (totalFactors > 0) {
      breakdown.personalization_score = personalizationFactors / totalFactors;
    }
  }
  
  // Apply boosts
  if (item.is_trending) {
    Object.keys(breakdown).forEach(key => {
      breakdown[key as keyof typeof breakdown] *= boosts.trending_topic;
    });
  }
  
  if (item.is_verified || item.source_verified) {
    Object.keys(breakdown).forEach(key => {
      breakdown[key as keyof typeof breakdown] *= boosts.verified_source;
    });
  }
  
  // Calculate weighted total score
  const totalScore = 
    (breakdown.title_score * weights.title_match) +
    (breakdown.content_score * weights.content_match) +
    (breakdown.tag_score * weights.tag_match) +
    (breakdown.recency_score * weights.recency) +
    (breakdown.popularity_score * weights.popularity) +
    (breakdown.personalization_score * weights.user_preference);
  
  return {
    score: Math.min(1.0, totalScore),
    breakdown,
    highlights
  };
}

// Extract facets from search results
function extractFacets(results: any[]): any {
  const facets = {
    types: {} as { [key: string]: number },
    tags: {} as { [key: string]: number },
    sources: {} as { [key: string]: number }
  };
  
  results.forEach(result => {
    // Count types
    if (result.type) {
      facets.types[result.type] = (facets.types[result.type] || 0) + 1;
    }
    
    // Count tags
    if (result.tags && Array.isArray(result.tags)) {
      result.tags.forEach((tag: string) => {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      });
    }
    
    // Count sources
    if (result.source) {
      facets.sources[result.source] = (facets.sources[result.source] || 0) + 1;
    }
  });
  
  // Sort facets by count
  Object.keys(facets).forEach(facetType => {
    const sorted = Object.entries(facets[facetType as keyof typeof facets])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 for each facet
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    facets[facetType as keyof typeof facets] = sorted;
  });
  
  return facets;
}

// Generate search suggestions based on query and results
function generateSuggestions(query: string, results: any[]): string[] {
  const suggestions = new Set<string>();
  
  // Add related searches based on common patterns
  const patterns = [
    `${query} tutorial`,
    `${query} guide`,
    `${query} vs`,
    `${query} review`,
    `${query} comparison`,
    `best ${query}`,
    `how to ${query}`,
    `${query} tips`,
    `${query} examples`,
    `${query} documentation`
  ];
  
  patterns.forEach(pattern => {
    if (pattern.length < 50) { // Reasonable length limit
      suggestions.add(pattern);
    }
  });
  
  // Extract suggestions from top results
  const topTags = new Set<string>();
  results.slice(0, 10).forEach(result => {
    if (result.tags && Array.isArray(result.tags)) {
      result.tags.forEach((tag: string) => {
        if (tag !== query && tag.length > 2) {
          topTags.add(tag);
        }
      });
    }
  });
  
  // Combine query with top tags
  Array.from(topTags).slice(0, 5).forEach(tag => {
    suggestions.add(`${query} ${tag}`);
  });
  
  return Array.from(suggestions).slice(0, 10);
}

// Generate related searches based on query analysis
function generateRelatedSearches(query: string, results: any[]): string[] {
  const related = new Set<string>();
  
  // Extract entities and topics from results
  const entities = new Set<string>();
  const topics = new Set<string>();
  
  results.slice(0, 20).forEach(result => {
    // Extract from titles
    if (result.title) {
      const titleWords = result.title.split(/\s+/)
        .filter((word: string) => word.length > 3 && !query.toLowerCase().includes(word.toLowerCase()));
      titleWords.slice(0, 3).forEach((word: string) => entities.add(word));
    }
    
    // Extract from tags
    if (result.tags && Array.isArray(result.tags)) {
      result.tags.forEach((tag: string) => {
        if (!query.toLowerCase().includes(tag.toLowerCase())) {
          topics.add(tag);
        }
      });
    }
  });
  
  // Generate related searches
  Array.from(entities).slice(0, 3).forEach(entity => {
    related.add(entity);
  });
  
  Array.from(topics).slice(0, 3).forEach(topic => {
    related.add(topic);
  });
  
  // Add specific vibe coding related searches
  if (query.toLowerCase().includes('vibe')) {
    related.add('Windsurf IDE');
    related.add('Cursor editor');
    related.add('AI coding tools');
  }
  
  if (query.toLowerCase().includes('windsurf')) {
    related.add('Windsurf vs Cursor');
    related.add('Windsurf pricing');
    related.add('Windsurf tutorials');
  }
  
  if (query.toLowerCase().includes('cursor')) {
    related.add('Cursor vs Windsurf');
    related.add('Cursor AI features');
    related.add('Cursor pricing');
  }
  
  return Array.from(related).slice(0, 8);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    const searchRequest: SearchRequest = await req.json();
    const { query, filters = {}, options = {}, user_context } = searchRequest;
    
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Expand query for better matching
    const expandedQueries = expandQuery(query);
    const searchStartTime = Date.now();
    
    // Build search query
    let searchQuery = supabase
      .from('news')
      .select('*');
    
    // Apply filters
    if (filters.type && filters.type.length > 0) {
      searchQuery = searchQuery.in('type', filters.type);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      searchQuery = searchQuery.contains('tags', filters.tags);
    }
    
    if (filters.date_from) {
      searchQuery = searchQuery.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      searchQuery = searchQuery.lte('created_at', filters.date_to);
    }
    
    if (filters.source && filters.source.length > 0) {
      searchQuery = searchQuery.in('source', filters.source);
    }
    
    if (filters.language) {
      searchQuery = searchQuery.eq('language', filters.language);
    }
    
    // Perform full-text search using tsvector
    const textSearchQuery = expandedQueries.join(' | '); // OR search for expanded terms
    searchQuery = searchQuery.textSearch('search_vector', textSearchQuery);
    
    // Execute search
    const { data: searchResults, error: searchError } = await searchQuery
      .limit(SEARCH_CONFIG.options.max_results);
    
    if (searchError) {
      throw searchError;
    }
    
    const searchEndTime = Date.now();
    const scoringStartTime = Date.now();
    
    // Calculate relevance scores and enhance results
    const scoredResults: SearchResult[] = (searchResults || []).map(item => {
      const { score, breakdown, highlights } = calculateRelevanceScore(
        item,
        query,
        expandedQueries,
        user_context
      );
      
      return {
        id: item.id,
        type: item.type || 'article',
        title: item.title,
        content: item.content || item.description || '',
        url: item.url,
        tags: item.tags || [],
        score,
        relevance_breakdown: breakdown,
        highlights,
        metadata: {
          source: item.source,
          author: item.author,
          language: item.language,
          view_count: item.view_count,
          like_count: item.like_count,
          comment_count: item.comment_count
        },
        created_at: item.created_at
      };
    });
    
    // Filter by minimum score
    const minScore = filters.min_score || SEARCH_CONFIG.options.min_score;
    const filteredResults = scoredResults.filter(r => r.score >= minScore);
    
    // Sort results
    const sortBy = options.sort_by || 'relevance';
    const sortedResults = filteredResults.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popularity':
          return (b.metadata.view_count || 0) - (a.metadata.view_count || 0);
        case 'relevance':
        default:
          return b.score - a.score;
      }
    });
    
    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = sortedResults.slice(startIndex, endIndex);
    
    const scoringEndTime = Date.now();
    
    // Search for similar content if requested
    if (options.include_similar && paginatedResults.length > 0) {
      const topResult = paginatedResults[0];
      const similarQuery = supabase
        .from('news')
        .select('*')
        .contains('tags', topResult.tags.slice(0, 3))
        .neq('id', topResult.id)
        .limit(5);
      
      const { data: similarResults } = await similarQuery;
      
      if (similarResults && similarResults.length > 0) {
        // Add similar results with lower scores
        similarResults.forEach(item => {
          const { score, breakdown, highlights } = calculateRelevanceScore(
            item,
            query,
            expandedQueries,
            user_context
          );
          
          // Add as similar result with reduced score
          const similarResult: SearchResult = {
            id: item.id,
            type: item.type || 'article',
            title: item.title,
            content: item.content || item.description || '',
            url: item.url,
            tags: item.tags || [],
            score: score * 0.7, // Reduce score for similar results
            relevance_breakdown: breakdown,
            highlights,
            metadata: {
              ...item,
              is_similar: true
            },
            created_at: item.created_at
          };
          
          paginatedResults.push(similarResult);
        });
      }
    }
    
    // Extract facets
    const facets = extractFacets(sortedResults);
    
    // Generate suggestions and related searches
    const suggestions = generateSuggestions(query, sortedResults);
    const relatedSearches = generateRelatedSearches(query, sortedResults);
    
    // Log search query for analytics
    await supabase.from('search_logs').insert({
      query,
      expanded_query: expandedQueries.join(' | '),
      filters,
      result_count: sortedResults.length,
      user_id: user_context?.user_id,
      created_at: new Date().toISOString()
    });
    
    const endTime = Date.now();
    
    // Prepare response
    const response: SearchResponse = {
      success: true,
      query,
      expanded_query: expandedQueries.length > 1 ? expandedQueries.join(' | ') : undefined,
      total_results: sortedResults.length,
      results: paginatedResults,
      facets,
      suggestions,
      related_searches: relatedSearches,
      performance: {
        search_time_ms: searchEndTime - searchStartTime,
        scoring_time_ms: scoringEndTime - scoringStartTime,
        total_time_ms: endTime - startTime
      }
    };
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Search error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        query: '',
        total_results: 0,
        results: [],
        performance: {
          search_time_ms: 0,
          scoring_time_ms: 0,
          total_time_ms: Date.now() - startTime
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});