import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Spam detection configuration
const SPAM_CONFIG = {
  // Thresholds for different signals
  thresholds: {
    spam_score: 0.7,        // Above this is considered spam
    quality_score: 0.3,     // Below this is low quality
    toxicity_score: 0.7,    // Above this is toxic
    duplicate_ratio: 0.8,   // Above this is duplicate
    link_density: 0.3,      // Above this is link spam
    keyword_density: 0.4    // Above this is keyword stuffing
  },
  // Weights for composite scoring
  weights: {
    content_analysis: 0.25,
    pattern_matching: 0.20,
    behavioral_signals: 0.20,
    reputation: 0.15,
    ml_prediction: 0.20
  },
  // Spam patterns and keywords
  patterns: {
    spam_keywords: [
      'buy now', 'click here', 'limited offer', 'act now', 'free money',
      'guaranteed', 'no risk', 'winner', 'congratulations', 'urgent',
      'make money fast', 'work from home', 'earn extra cash', 'get rich',
      'casino', 'viagra', 'pills', 'weight loss', 'crypto pump'
    ],
    toxic_keywords: [
      // Moderated list - would include inappropriate terms in production
      'hate', 'violence', 'harassment', 'discrimination'
    ],
    suspicious_patterns: [
      /\b(?:https?:\/\/)?bit\.ly\//gi,  // URL shorteners
      /\b(?:https?:\/\/)?tinyurl\.com\//gi,
      /[A-Z]{5,}/g,  // Excessive caps
      /(.)\1{4,}/g,  // Repeated characters
      /\d{10,}/g,    // Long number sequences
      /[!?]{3,}/g,   // Excessive punctuation
    ],
    quality_indicators: [
      'tutorial', 'guide', 'documentation', 'review', 'comparison',
      'windsurf', 'cursor', 'vibe coding', 'development', 'programming'
    ]
  }
};

interface SpamCheckRequest {
  content: {
    title?: string;
    body: string;
    url?: string;
    tags?: string[];
    author_id?: string;
    metadata?: any;
  };
  context?: {
    user_history?: {
      total_posts: number;
      spam_count: number;
      quality_score: number;
      account_age_days: number;
    };
    similar_content?: {
      count: number;
      ids: string[];
    };
    ip_address?: string;
    user_agent?: string;
  };
  options?: {
    check_ai_generated?: boolean;
    check_plagiarism?: boolean;
    check_toxicity?: boolean;
    strict_mode?: boolean;
  };
}

interface SpamCheckResponse {
  success: boolean;
  is_spam: boolean;
  is_low_quality: boolean;
  should_review: boolean;
  scores: {
    spam_score: number;
    quality_score: number;
    toxicity_score: number;
    authenticity_score: number;
    overall_score: number;
  };
  signals: {
    content_signals: {
      keyword_density: number;
      link_density: number;
      caps_ratio: number;
      punctuation_ratio: number;
      average_word_length: number;
      sentence_complexity: number;
    };
    pattern_signals: {
      spam_keyword_count: number;
      toxic_keyword_count: number;
      suspicious_pattern_matches: number;
      quality_indicator_count: number;
    };
    behavioral_signals: {
      posting_frequency: number;
      previous_spam_ratio: number;
      account_reputation: number;
      similarity_to_spam: number;
    };
    ml_signals?: {
      ai_generated_probability: number;
      plagiarism_score: number;
      toxicity_categories: string[];
    };
  };
  recommendations: {
    action: 'approve' | 'review' | 'reject' | 'quarantine';
    reasons: string[];
    improvements?: string[];
    moderation_notes?: string;
  };
  performance: {
    check_time_ms: number;
    checks_performed: string[];
  };
}

// Analyze content for spam signals
function analyzeContent(content: string, title?: string): any {
  const fullText = `${title || ''} ${content}`.toLowerCase();
  const words = fullText.split(/\s+/).filter(w => w.length > 0);
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate various metrics
  const totalChars = fullText.length;
  const totalWords = words.length;
  
  // Keyword density for spam terms
  let spamKeywordCount = 0;
  SPAM_CONFIG.patterns.spam_keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = fullText.match(regex);
    if (matches) {
      spamKeywordCount += matches.length;
    }
  });
  const keywordDensity = totalWords > 0 ? spamKeywordCount / totalWords : 0;
  
  // Link density
  const linkPattern = /https?:\/\/[^\s]+/g;
  const links = fullText.match(linkPattern) || [];
  const linkDensity = totalWords > 0 ? links.length / totalWords : 0;
  
  // Caps ratio
  const upperCaseChars = (content.match(/[A-Z]/g) || []).length;
  const letterChars = (content.match(/[a-zA-Z]/g) || []).length;
  const capsRatio = letterChars > 0 ? upperCaseChars / letterChars : 0;
  
  // Punctuation ratio
  const punctuationChars = (content.match(/[!?.,;:]/g) || []).length;
  const punctuationRatio = totalChars > 0 ? punctuationChars / totalChars : 0;
  
  // Average word length
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = totalWords > 0 ? totalWordLength / totalWords : 0;
  
  // Sentence complexity (average words per sentence)
  const sentenceComplexity = sentences.length > 0 ? totalWords / sentences.length : 0;
  
  // Toxic keyword check
  let toxicKeywordCount = 0;
  SPAM_CONFIG.patterns.toxic_keywords.forEach(keyword => {
    if (fullText.includes(keyword)) {
      toxicKeywordCount++;
    }
  });
  
  // Suspicious pattern matches
  let suspiciousPatternMatches = 0;
  SPAM_CONFIG.patterns.suspicious_patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      suspiciousPatternMatches += matches.length;
    }
  });
  
  // Quality indicators
  let qualityIndicatorCount = 0;
  SPAM_CONFIG.patterns.quality_indicators.forEach(indicator => {
    if (fullText.includes(indicator)) {
      qualityIndicatorCount++;
    }
  });
  
  return {
    content_signals: {
      keyword_density: keywordDensity,
      link_density: linkDensity,
      caps_ratio: capsRatio,
      punctuation_ratio: punctuationRatio,
      average_word_length: avgWordLength,
      sentence_complexity: sentenceComplexity
    },
    pattern_signals: {
      spam_keyword_count: spamKeywordCount,
      toxic_keyword_count: toxicKeywordCount,
      suspicious_pattern_matches: suspiciousPatternMatches,
      quality_indicator_count: qualityIndicatorCount
    },
    metrics: {
      total_words: totalWords,
      total_sentences: sentences.length,
      total_links: links.length
    }
  };
}

// Check content with OpenAI for AI generation and quality
async function checkWithAI(content: string, title?: string, apiKey?: string): Promise<any> {
  if (!apiKey) {
    return null;
  }
  
  try {
    const prompt = `Analyze the following content for spam, quality, and AI generation detection.

Title: ${title || 'N/A'}
Content: ${content.substring(0, 2000)}

Please analyze and provide scores (0-1) for:
1. spam_probability: How likely this is spam content
2. ai_generated_probability: How likely this was generated by AI
3. quality_score: Overall content quality (1 = high quality, 0 = low quality)
4. toxicity_score: Level of toxic or inappropriate content
5. authenticity_score: How authentic and original the content appears

Also identify:
- Main topic/category
- Any toxic categories present
- Recommended action (approve/review/reject)
- Improvement suggestions

Respond in JSON format.`;

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
            content: 'You are a content moderation expert specializing in spam detection, content quality assessment, and AI-generated content detection. Focus on vibe coding, development tools, and tech content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
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
    console.error('AI check error:', error);
    return null;
  }
}

// Calculate behavioral signals based on user history
function calculateBehavioralSignals(context?: any): any {
  const signals = {
    posting_frequency: 0,
    previous_spam_ratio: 0,
    account_reputation: 0.5,
    similarity_to_spam: 0
  };
  
  if (!context) {
    return signals;
  }
  
  // Posting frequency (posts per day)
  if (context.user_history) {
    const { total_posts, spam_count, quality_score, account_age_days } = context.user_history;
    
    // Calculate posting frequency
    if (account_age_days > 0) {
      const postsPerDay = total_posts / account_age_days;
      // High frequency might indicate spam
      if (postsPerDay > 10) {
        signals.posting_frequency = 0.9;
      } else if (postsPerDay > 5) {
        signals.posting_frequency = 0.6;
      } else if (postsPerDay > 2) {
        signals.posting_frequency = 0.3;
      } else {
        signals.posting_frequency = 0.1;
      }
    }
    
    // Previous spam ratio
    if (total_posts > 0) {
      signals.previous_spam_ratio = spam_count / total_posts;
    }
    
    // Account reputation
    if (account_age_days < 1) {
      signals.account_reputation = 0.2; // New account
    } else if (account_age_days < 7) {
      signals.account_reputation = 0.4; // Recent account
    } else if (account_age_days < 30) {
      signals.account_reputation = 0.6; // Relatively new
    } else {
      signals.account_reputation = 0.8; // Established account
    }
    
    // Adjust reputation based on quality score
    if (quality_score !== undefined) {
      signals.account_reputation = (signals.account_reputation + quality_score) / 2;
    }
  }
  
  // Check similarity to known spam
  if (context.similar_content) {
    const { count } = context.similar_content;
    if (count > 5) {
      signals.similarity_to_spam = 0.9;
    } else if (count > 2) {
      signals.similarity_to_spam = 0.6;
    } else if (count > 0) {
      signals.similarity_to_spam = 0.3;
    }
  }
  
  return signals;
}

// Calculate overall spam and quality scores
function calculateScores(
  contentAnalysis: any,
  behavioralSignals: any,
  aiAnalysis?: any
): any {
  const weights = SPAM_CONFIG.weights;
  const thresholds = SPAM_CONFIG.thresholds;
  
  // Content-based spam score
  let contentSpamScore = 0;
  const { content_signals, pattern_signals } = contentAnalysis;
  
  // High keyword density indicates spam
  if (content_signals.keyword_density > thresholds.keyword_density) {
    contentSpamScore += 0.3;
  } else {
    contentSpamScore += content_signals.keyword_density;
  }
  
  // High link density indicates spam
  if (content_signals.link_density > thresholds.link_density) {
    contentSpamScore += 0.3;
  } else {
    contentSpamScore += content_signals.link_density;
  }
  
  // Excessive caps
  if (content_signals.caps_ratio > 0.3) {
    contentSpamScore += 0.2;
  }
  
  // Suspicious patterns
  if (pattern_signals.suspicious_pattern_matches > 0) {
    contentSpamScore += Math.min(0.3, pattern_signals.suspicious_pattern_matches * 0.1);
  }
  
  // Spam keywords
  if (pattern_signals.spam_keyword_count > 0) {
    contentSpamScore += Math.min(0.4, pattern_signals.spam_keyword_count * 0.1);
  }
  
  contentSpamScore = Math.min(1.0, contentSpamScore);
  
  // Pattern-based spam score
  let patternSpamScore = 0;
  if (pattern_signals.spam_keyword_count > 2) {
    patternSpamScore = 0.8;
  } else if (pattern_signals.spam_keyword_count > 0) {
    patternSpamScore = 0.4;
  }
  
  if (pattern_signals.suspicious_pattern_matches > 3) {
    patternSpamScore = Math.max(patternSpamScore, 0.7);
  }
  
  // Behavioral spam score
  let behavioralSpamScore = 0;
  behavioralSpamScore += behavioralSignals.posting_frequency * 0.3;
  behavioralSpamScore += behavioralSignals.previous_spam_ratio * 0.3;
  behavioralSpamScore += behavioralSignals.similarity_to_spam * 0.4;
  
  // Reputation score (inverse of spam)
  const reputationScore = behavioralSignals.account_reputation;
  
  // Quality score
  let qualityScore = 0.5; // Default neutral
  
  // Positive quality indicators
  if (pattern_signals.quality_indicator_count > 0) {
    qualityScore += Math.min(0.3, pattern_signals.quality_indicator_count * 0.1);
  }
  
  // Good content structure
  if (content_signals.sentence_complexity > 5 && content_signals.sentence_complexity < 25) {
    qualityScore += 0.1;
  }
  
  // Reasonable word length
  if (content_signals.average_word_length > 3 && content_signals.average_word_length < 10) {
    qualityScore += 0.1;
  }
  
  // Deduct for spam signals
  qualityScore -= contentSpamScore * 0.5;
  qualityScore = Math.max(0, Math.min(1.0, qualityScore));
  
  // Toxicity score
  let toxicityScore = 0;
  if (pattern_signals.toxic_keyword_count > 0) {
    toxicityScore = Math.min(1.0, pattern_signals.toxic_keyword_count * 0.3);
  }
  
  // ML-based scores (if available)
  let mlSpamScore = 0.5;
  let authenticityScore = 0.5;
  
  if (aiAnalysis) {
    mlSpamScore = aiAnalysis.spam_probability || 0.5;
    authenticityScore = 1 - (aiAnalysis.ai_generated_probability || 0.5);
    
    // Update quality score with AI assessment
    if (aiAnalysis.quality_score !== undefined) {
      qualityScore = (qualityScore + aiAnalysis.quality_score) / 2;
    }
    
    // Update toxicity score with AI assessment
    if (aiAnalysis.toxicity_score !== undefined) {
      toxicityScore = (toxicityScore + aiAnalysis.toxicity_score) / 2;
    }
  }
  
  // Calculate weighted overall spam score
  const overallSpamScore = 
    (contentSpamScore * weights.content_analysis) +
    (patternSpamScore * weights.pattern_matching) +
    (behavioralSpamScore * weights.behavioral_signals) +
    ((1 - reputationScore) * weights.reputation) +
    (mlSpamScore * weights.ml_prediction);
  
  return {
    spam_score: Math.min(1.0, overallSpamScore),
    quality_score: qualityScore,
    toxicity_score: toxicityScore,
    authenticity_score: authenticityScore,
    overall_score: (1 - overallSpamScore) * qualityScore * authenticityScore
  };
}

// Generate recommendations based on scores
function generateRecommendations(
  scores: any,
  signals: any,
  aiAnalysis?: any
): any {
  const thresholds = SPAM_CONFIG.thresholds;
  const reasons: string[] = [];
  const improvements: string[] = [];
  let action: 'approve' | 'review' | 'reject' | 'quarantine' = 'approve';
  let moderationNotes = '';
  
  // Determine action based on scores
  if (scores.spam_score > thresholds.spam_score) {
    action = 'reject';
    reasons.push('High spam probability detected');
  } else if (scores.toxicity_score > thresholds.toxicity_score) {
    action = 'reject';
    reasons.push('Toxic or inappropriate content detected');
  } else if (scores.quality_score < thresholds.quality_score) {
    action = 'review';
    reasons.push('Low quality content');
  } else if (scores.spam_score > 0.5) {
    action = 'review';
    reasons.push('Moderate spam signals detected');
  } else if (scores.authenticity_score < 0.3) {
    action = 'review';
    reasons.push('Possible AI-generated or plagiarized content');
  }
  
  // Add specific reasons based on signals
  if (signals.pattern_signals.spam_keyword_count > 2) {
    reasons.push(`Contains ${signals.pattern_signals.spam_keyword_count} spam keywords`);
    improvements.push('Remove promotional language and spam keywords');
  }
  
  if (signals.content_signals.link_density > 0.2) {
    reasons.push('Excessive links detected');
    improvements.push('Reduce the number of links in the content');
  }
  
  if (signals.content_signals.caps_ratio > 0.3) {
    reasons.push('Excessive use of capital letters');
    improvements.push('Use proper capitalization');
  }
  
  if (signals.pattern_signals.suspicious_pattern_matches > 0) {
    reasons.push('Suspicious patterns detected');
    improvements.push('Avoid using URL shorteners and excessive punctuation');
  }
  
  if (signals.behavioral_signals.similarity_to_spam > 0.5) {
    reasons.push('Content similar to known spam');
    improvements.push('Create more original and unique content');
  }
  
  if (signals.behavioral_signals.posting_frequency > 0.7) {
    reasons.push('High posting frequency detected');
    improvements.push('Reduce posting frequency to avoid spam detection');
  }
  
  // Add AI analysis recommendations
  if (aiAnalysis) {
    if (aiAnalysis.recommended_action) {
      moderationNotes = `AI recommendation: ${aiAnalysis.recommended_action}`;
    }
    if (aiAnalysis.improvement_suggestions) {
      improvements.push(...aiAnalysis.improvement_suggestions);
    }
    if (aiAnalysis.toxic_categories && aiAnalysis.toxic_categories.length > 0) {
      reasons.push(`Toxic categories: ${aiAnalysis.toxic_categories.join(', ')}`);
    }
  }
  
  // Add positive feedback for good content
  if (action === 'approve' && scores.quality_score > 0.7) {
    moderationNotes = 'High quality content detected';
    if (signals.pattern_signals.quality_indicator_count > 2) {
      moderationNotes += '. Contains valuable vibe coding related content.';
    }
  }
  
  return {
    action,
    reasons,
    improvements: improvements.length > 0 ? improvements : undefined,
    moderation_notes: moderationNotes || undefined
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  const checksPerformed: string[] = [];
  
  try {
    const request: SpamCheckRequest = await req.json();
    const { content, context, options = {} } = request;
    
    if (!content || !content.body) {
      throw new Error('Content body is required');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Analyze content
    checksPerformed.push('content_analysis');
    const contentAnalysis = analyzeContent(content.body, content.title);
    
    // Calculate behavioral signals
    checksPerformed.push('behavioral_analysis');
    const behavioralSignals = calculateBehavioralSignals(context);
    
    // AI-based checks if requested
    let aiAnalysis = null;
    if (options.check_ai_generated || options.check_plagiarism || options.check_toxicity) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey) {
        checksPerformed.push('ai_analysis');
        aiAnalysis = await checkWithAI(content.body, content.title, openaiKey);
      }
    }
    
    // Calculate scores
    const scores = calculateScores(contentAnalysis, behavioralSignals, aiAnalysis);
    
    // Determine if spam or low quality
    const isSpam = scores.spam_score > SPAM_CONFIG.thresholds.spam_score;
    const isLowQuality = scores.quality_score < SPAM_CONFIG.thresholds.quality_score;
    const shouldReview = !isSpam && (
      scores.spam_score > 0.5 ||
      scores.toxicity_score > 0.5 ||
      scores.authenticity_score < 0.5 ||
      isLowQuality
    );
    
    // Generate recommendations
    const recommendations = generateRecommendations(scores, {
      ...contentAnalysis,
      behavioral_signals: behavioralSignals
    }, aiAnalysis);
    
    // Log spam check for analytics and training
    await supabase.from('spam_checks').insert({
      content_hash: await hashContent(content.body),
      spam_score: scores.spam_score,
      quality_score: scores.quality_score,
      is_spam: isSpam,
      is_low_quality: isLowQuality,
      action_taken: recommendations.action,
      user_id: content.author_id,
      created_at: new Date().toISOString()
    });
    
    // Prepare ML signals if AI analysis was performed
    const mlSignals = aiAnalysis ? {
      ai_generated_probability: aiAnalysis.ai_generated_probability || 0,
      plagiarism_score: aiAnalysis.plagiarism_score || 0,
      toxicity_categories: aiAnalysis.toxic_categories || []
    } : undefined;
    
    const response: SpamCheckResponse = {
      success: true,
      is_spam: isSpam,
      is_low_quality: isLowQuality,
      should_review: shouldReview,
      scores,
      signals: {
        content_signals: contentAnalysis.content_signals,
        pattern_signals: contentAnalysis.pattern_signals,
        behavioral_signals: behavioralSignals,
        ml_signals: mlSignals
      },
      recommendations,
      performance: {
        check_time_ms: Date.now() - startTime,
        checks_performed: checksPerformed
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
    console.error('Spam check error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        is_spam: false,
        is_low_quality: false,
        should_review: true,
        scores: {
          spam_score: 0,
          quality_score: 0.5,
          toxicity_score: 0,
          authenticity_score: 0.5,
          overall_score: 0.5
        },
        signals: {},
        recommendations: {
          action: 'review',
          reasons: ['Error during spam check']
        },
        performance: {
          check_time_ms: Date.now() - startTime,
          checks_performed: checksPerformed
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

// Helper function to hash content for duplicate detection
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}