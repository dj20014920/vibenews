import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Analytics and trending configuration
const ANALYTICS_CONFIG = {
  // Time windows for trending calculation
  timeWindows: {
    realtime: 1,      // 1 hour
    daily: 24,        // 24 hours
    weekly: 168,      // 7 days
    monthly: 720      // 30 days
  },
  // Weights for trending score calculation
  trendingWeights: {
    views: 0.15,
    likes: 0.25,
    comments: 0.20,
    shares: 0.15,
    saves: 0.10,
    recency: 0.15
  },
  // Decay factors for time-based scoring
  decayFactors: {
    hourly: 0.95,
    daily: 0.90,
    weekly: 0.80
  },
  // Thresholds for trending qualification
  thresholds: {
    minViews: 10,
    minEngagement: 0.05,  // 5% engagement rate
    minScore: 0.3
  },
  // Categories for analytics
  categories: [
    'news',
    'tutorials',
    'reviews',
    'discussions',
    'tools',
    'projects'
  ]
};

interface AnalyticsRequest {
  type: 'content' | 'user' | 'platform' | 'custom';
  timeframe?: {
    start: string;
    end: string;
  };
  filters?: {
    category?: string[];
    tags?: string[];
    source?: string[];
    user_segment?: string;
  };
  metrics?: string[];  // Specific metrics to calculate
  groupBy?: string[];  // Dimensions to group by
  options?: {
    include_trending?: boolean;
    include_predictions?: boolean;
    include_comparisons?: boolean;
    limit?: number;
  };
}

interface TrendingRequest {
  timeWindow: 'realtime' | 'daily' | 'weekly' | 'monthly';
  category?: string;
  limit?: number;
  options?: {
    include_rising?: boolean;
    include_viral?: boolean;
    personalized?: boolean;
    user_id?: string;
  };
}

interface AnalyticsResponse {
  success: boolean;
  timeframe: {
    start: string;
    end: string;
    duration_hours: number;
  };
  metrics: {
    overview: {
      total_views: number;
      total_engagement: number;
      total_users: number;
      total_content: number;
      avg_session_duration: number;
      bounce_rate: number;
    };
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      engagement_rate: number;
    };
    growth: {
      views_change: number;
      users_change: number;
      content_change: number;
      engagement_change: number;
    };
    performance: {
      top_content: any[];
      top_authors: any[];
      top_tags: any[];
      top_sources: any[];
    };
  };
  trends?: {
    hourly: any[];
    daily: any[];
    categories: any;
  };
  predictions?: {
    next_day_views: number;
    next_week_trend: 'up' | 'down' | 'stable';
    growth_forecast: number;
  };
  comparisons?: {
    vs_previous_period: any;
    vs_average: any;
  };
}

interface TrendingResponse {
  success: boolean;
  timeWindow: string;
  trending: TrendingItem[];
  rising?: TrendingItem[];
  viral?: TrendingItem[];
  metadata: {
    total_items: number;
    calculation_time: string;
    algorithm_version: string;
  };
}

interface TrendingItem {
  id: string;
  title: string;
  type: string;
  category?: string;
  url?: string;
  score: number;
  rank: number;
  trend_direction: 'up' | 'down' | 'stable';
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
    velocity: number;  // Rate of change
  };
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  created_at: string;
  trending_since?: string;
}

// Calculate trending score for content
function calculateTrendingScore(
  metrics: any,
  ageHours: number,
  config = ANALYTICS_CONFIG
): number {
  const weights = config.trendingWeights;
  
  // Normalize metrics (0-1 scale)
  const normalizedViews = Math.min(1, Math.log10(metrics.views + 1) / 4); // log scale
  const normalizedLikes = Math.min(1, metrics.likes / 100);
  const normalizedComments = Math.min(1, metrics.comments / 50);
  const normalizedShares = Math.min(1, metrics.shares / 20);
  const normalizedSaves = Math.min(1, metrics.saves / 30);
  
  // Calculate recency score (exponential decay)
  let recencyScore = 1.0;
  if (ageHours < 1) {
    recencyScore = 1.0;
  } else if (ageHours < 24) {
    recencyScore = Math.pow(config.decayFactors.hourly, ageHours);
  } else if (ageHours < 168) {
    recencyScore = Math.pow(config.decayFactors.daily, ageHours / 24);
  } else {
    recencyScore = Math.pow(config.decayFactors.weekly, ageHours / 168);
  }
  
  // Calculate weighted score
  const score = 
    (normalizedViews * weights.views) +
    (normalizedLikes * weights.likes) +
    (normalizedComments * weights.comments) +
    (normalizedShares * weights.shares) +
    (normalizedSaves * weights.saves) +
    (recencyScore * weights.recency);
  
  // Apply velocity boost (rapid growth)
  const velocity = calculateVelocity(metrics);
  const velocityBoost = Math.min(1.5, 1 + (velocity * 0.5));
  
  return Math.min(1.0, score * velocityBoost);
}

// Calculate engagement velocity (rate of change)
function calculateVelocity(metrics: any): number {
  // Simplified velocity calculation
  // In production, this would compare current metrics with historical data
  const recentEngagement = metrics.recent_likes + metrics.recent_comments + metrics.recent_shares;
  const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
  
  if (totalEngagement === 0) return 0;
  
  // High velocity if recent engagement is a large portion of total
  const velocityRatio = recentEngagement / totalEngagement;
  return Math.min(1.0, velocityRatio * 2); // Scale up for sensitivity
}

// Identify rising content (rapid growth)
function identifyRisingContent(items: any[], timeWindow: number): any[] {
  return items.filter(item => {
    const velocity = calculateVelocity(item.metrics);
    const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
    
    // Rising criteria:
    // 1. High velocity (>0.5)
    // 2. Recent content (within timeWindow)
    // 3. Minimum engagement threshold met
    return velocity > 0.5 && 
           ageHours <= timeWindow &&
           item.metrics.views >= ANALYTICS_CONFIG.thresholds.minViews;
  }).sort((a, b) => {
    const velocityA = calculateVelocity(a.metrics);
    const velocityB = calculateVelocity(b.metrics);
    return velocityB - velocityA;
  });
}

// Identify viral content (exceptional performance)
function identifyViralContent(items: any[]): any[] {
  return items.filter(item => {
    const engagementRate = (item.metrics.likes + item.metrics.comments + item.metrics.shares) / 
                          Math.max(1, item.metrics.views);
    
    // Viral criteria:
    // 1. Very high engagement rate (>20%)
    // 2. High absolute numbers
    // 3. High share rate
    return engagementRate > 0.2 &&
           item.metrics.views > 1000 &&
           item.metrics.shares > 50;
  }).sort((a, b) => {
    const engagementA = (a.metrics.likes + a.metrics.comments + a.metrics.shares) / Math.max(1, a.metrics.views);
    const engagementB = (b.metrics.likes + b.metrics.comments + b.metrics.shares) / Math.max(1, b.metrics.views);
    return engagementB - engagementA;
  });
}

// Calculate platform-wide metrics
async function calculatePlatformMetrics(
  supabase: any,
  timeframe: { start: string; end: string }
): Promise<any> {
  // Get content metrics
  const { data: contentData, error: contentError } = await supabase
    .from('news')
    .select('id, view_count, like_count, comment_count, share_count, save_count, created_at')
    .gte('created_at', timeframe.start)
    .lte('created_at', timeframe.end);
  
  if (contentError) throw contentError;
  
  // Get user activity metrics
  const { data: userData, error: userError } = await supabase
    .from('user_activities')
    .select('user_id, activity_type, created_at')
    .gte('created_at', timeframe.start)
    .lte('created_at', timeframe.end);
  
  if (userError) throw userError;
  
  // Calculate overview metrics
  const totalViews = contentData.reduce((sum: number, item: any) => sum + (item.view_count || 0), 0);
  const totalLikes = contentData.reduce((sum: number, item: any) => sum + (item.like_count || 0), 0);
  const totalComments = contentData.reduce((sum: number, item: any) => sum + (item.comment_count || 0), 0);
  const totalShares = contentData.reduce((sum: number, item: any) => sum + (item.share_count || 0), 0);
  const totalSaves = contentData.reduce((sum: number, item: any) => sum + (item.save_count || 0), 0);
  
  const uniqueUsers = new Set(userData.map((activity: any) => activity.user_id)).size;
  const totalEngagement = totalLikes + totalComments + totalShares + totalSaves;
  const engagementRate = totalViews > 0 ? totalEngagement / totalViews : 0;
  
  // Calculate growth (would need historical data in production)
  // For now, using mock calculations
  const previousPeriodMultiplier = 0.85; // Assume 15% growth
  
  return {
    overview: {
      total_views: totalViews,
      total_engagement: totalEngagement,
      total_users: uniqueUsers,
      total_content: contentData.length,
      avg_session_duration: 180, // Mock: 3 minutes average
      bounce_rate: 0.35 // Mock: 35% bounce rate
    },
    engagement: {
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      saves: totalSaves,
      engagement_rate: engagementRate
    },
    growth: {
      views_change: 0.15, // 15% growth
      users_change: 0.12, // 12% growth
      content_change: 0.08, // 8% growth
      engagement_change: 0.18 // 18% growth
    }
  };
}

// Get top performing content
async function getTopContent(
  supabase: any,
  timeframe: { start: string; end: string },
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .gte('created_at', timeframe.start)
    .lte('created_at', timeframe.end)
    .order('view_count', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data.map((item: any, index: number) => ({
    rank: index + 1,
    id: item.id,
    title: item.title,
    type: item.type,
    metrics: {
      views: item.view_count || 0,
      likes: item.like_count || 0,
      comments: item.comment_count || 0,
      shares: item.share_count || 0,
      engagement_rate: item.view_count > 0 
        ? ((item.like_count || 0) + (item.comment_count || 0) + (item.share_count || 0)) / item.view_count
        : 0
    },
    url: item.url,
    created_at: item.created_at
  }));
}

// Get trending content with AI predictions
async function getTrendingWithAI(
  items: any[],
  apiKey?: string
): Promise<any> {
  if (!apiKey || items.length === 0) {
    return null;
  }
  
  try {
    const itemSummary = items.slice(0, 10).map(item => ({
      title: item.title,
      metrics: item.metrics,
      age_hours: (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60)
    }));
    
    const prompt = `Analyze these trending items and predict future trends:

${JSON.stringify(itemSummary, null, 2)}

Based on the metrics and patterns, provide:
1. Which topics/themes are likely to trend next
2. Predicted engagement levels for the next 24 hours
3. Content recommendations for creators
4. Emerging patterns or shifts in user interest

Respond in JSON format with keys: predictions, recommendations, emerging_topics`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst specializing in content trends and user engagement patterns for a vibe coding platform.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
    
  } catch (error) {
    console.error('AI prediction error:', error);
    return null;
  }
}

// Handle analytics requests
async function handleAnalytics(
  req: AnalyticsRequest,
  supabase: any
): Promise<AnalyticsResponse> {
  const { type, timeframe, filters, options = {} } = req;
  
  // Set default timeframe if not provided
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
  const actualTimeframe = timeframe || {
    start: defaultStart.toISOString(),
    end: now.toISOString()
  };
  
  // Calculate platform metrics
  const metrics = await calculatePlatformMetrics(supabase, actualTimeframe);
  
  // Get top performing content
  const topContent = await getTopContent(supabase, actualTimeframe, options.limit || 10);
  
  // Get top authors
  const { data: topAuthors } = await supabase
    .from('users')
    .select('id, username, avatar_url, total_views, total_likes')
    .order('total_views', { ascending: false })
    .limit(10);
  
  // Get top tags
  const { data: topTags } = await supabase
    .from('tag_analytics')
    .select('tag, count, trend')
    .gte('date', actualTimeframe.start)
    .order('count', { ascending: false })
    .limit(10);
  
  // Calculate duration
  const durationMs = new Date(actualTimeframe.end).getTime() - new Date(actualTimeframe.start).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  
  // Prepare performance metrics
  const performance = {
    top_content: topContent,
    top_authors: topAuthors || [],
    top_tags: topTags || [],
    top_sources: [] // Would need source analytics table
  };
  
  // Add trends if requested
  let trends;
  if (options.include_trending) {
    // Get hourly trend data (mock for now)
    const hourlyTrends = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      views: Math.floor(Math.random() * 1000 + 500),
      engagement: Math.floor(Math.random() * 100 + 20)
    }));
    
    trends = {
      hourly: hourlyTrends,
      daily: [], // Would need daily aggregation
      categories: {} // Would need category breakdown
    };
  }
  
  // Add predictions if requested
  let predictions;
  if (options.include_predictions) {
    predictions = {
      next_day_views: Math.floor(metrics.overview.total_views * 1.15), // 15% growth prediction
      next_week_trend: 'up' as const,
      growth_forecast: 0.15
    };
  }
  
  // Add comparisons if requested
  let comparisons;
  if (options.include_comparisons) {
    comparisons = {
      vs_previous_period: {
        views_change: '+15%',
        engagement_change: '+18%',
        users_change: '+12%'
      },
      vs_average: {
        views: '+8%',
        engagement: '+10%',
        duration: '-5%'
      }
    };
  }
  
  return {
    success: true,
    timeframe: {
      start: actualTimeframe.start,
      end: actualTimeframe.end,
      duration_hours: durationHours
    },
    metrics: {
      ...metrics,
      performance
    },
    trends,
    predictions,
    comparisons
  };
}

// Handle trending requests
async function handleTrending(
  req: TrendingRequest,
  supabase: any
): Promise<TrendingResponse> {
  const { timeWindow, category, limit = 20, options = {} } = req;
  
  // Calculate time range based on window
  const now = new Date();
  const hoursAgo = ANALYTICS_CONFIG.timeWindows[timeWindow];
  const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  
  // Build query
  let query = supabase
    .from('news')
    .select('*, users!inner(id, username, avatar_url)')
    .gte('created_at', startTime.toISOString());
  
  if (category) {
    query = query.eq('category', category);
  }
  
  // Get content from time window
  const { data: content, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Calculate trending scores
  const scoredItems = content.map((item: any) => {
    const ageHours = (now.getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
    const metrics = {
      views: item.view_count || 0,
      likes: item.like_count || 0,
      comments: item.comment_count || 0,
      shares: item.share_count || 0,
      saves: item.save_count || 0,
      recent_likes: item.recent_likes || 0,
      recent_comments: item.recent_comments || 0,
      recent_shares: item.recent_shares || 0
    };
    
    const score = calculateTrendingScore(metrics, ageHours);
    const velocity = calculateVelocity(metrics);
    const engagementRate = metrics.views > 0 
      ? (metrics.likes + metrics.comments + metrics.shares) / metrics.views
      : 0;
    
    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (velocity > 0.6) trendDirection = 'up';
    else if (velocity < 0.3) trendDirection = 'down';
    
    return {
      id: item.id,
      title: item.title,
      type: item.type || 'article',
      category: item.category,
      url: item.url,
      score,
      metrics: {
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        engagement_rate: engagementRate,
        velocity
      },
      trend_direction: trendDirection,
      tags: item.tags || [],
      author: {
        id: item.users.id,
        name: item.users.username,
        avatar: item.users.avatar_url
      },
      created_at: item.created_at,
      age_hours: ageHours
    };
  });
  
  // Filter by minimum score threshold
  const qualifiedItems = scoredItems.filter(item => 
    item.score >= ANALYTICS_CONFIG.thresholds.minScore &&
    item.metrics.views >= ANALYTICS_CONFIG.thresholds.minViews
  );
  
  // Sort by score and assign ranks
  const trending = qualifiedItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      trending_since: new Date(now.getTime() - item.age_hours * 60 * 60 * 1000).toISOString()
    }));
  
  // Identify rising content if requested
  let rising;
  if (options.include_rising) {
    rising = identifyRisingContent(scoredItems, hoursAgo)
      .slice(0, Math.floor(limit / 2))
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  }
  
  // Identify viral content if requested
  let viral;
  if (options.include_viral) {
    viral = identifyViralContent(scoredItems)
      .slice(0, Math.floor(limit / 4))
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  }
  
  // Personalize if requested
  if (options.personalized && options.user_id) {
    // Get user preferences
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('preferred_tags, preferred_categories')
      .eq('user_id', options.user_id)
      .single();
    
    if (userPrefs) {
      // Boost scores for content matching user preferences
      trending.forEach(item => {
        let boost = 1.0;
        
        if (userPrefs.preferred_categories?.includes(item.category)) {
          boost *= 1.2;
        }
        
        if (userPrefs.preferred_tags?.some((tag: string) => item.tags.includes(tag))) {
          boost *= 1.1;
        }
        
        item.score *= boost;
      });
      
      // Re-sort after personalization
      trending.sort((a, b) => b.score - a.score);
      trending.forEach((item, index) => {
        item.rank = index + 1;
      });
    }
  }
  
  return {
    success: true,
    timeWindow,
    trending,
    rising,
    viral,
    metadata: {
      total_items: qualifiedItems.length,
      calculation_time: new Date().toISOString(),
      algorithm_version: '2.0'
    }
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let response;
    
    switch (path) {
      case 'analytics':
        const analyticsReq: AnalyticsRequest = await req.json();
        response = await handleAnalytics(analyticsReq, supabase);
        break;
        
      case 'trending':
        const trendingReq: TrendingRequest = await req.json();
        response = await handleTrending(trendingReq, supabase);
        break;
        
      default:
        throw new Error(`Unknown endpoint: ${path}`);
    }
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Analytics error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});