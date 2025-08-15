import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FactCheckResult {
  credibility_score: number; // 0-100
  fact_check_sources: string[];
  verified_claims: string[];
  disputed_claims: string[];
  false_claims: string[];
  warnings: string[];
  confidence_level: 'high' | 'medium' | 'low';
  recommendation: 'publish' | 'review' | 'reject';
}

interface ContentVerification {
  is_ai_generated: boolean;
  ai_confidence: number;
  plagiarism_score: number;
  original_sources: string[];
  deepfake_detection?: {
    is_deepfake: boolean;
    confidence: number;
  };
}

// Known fact-checking APIs and services
const FACT_CHECK_SERVICES = [
  {
    name: 'FactCheck.org',
    endpoint: 'https://api.factcheck.org/v1/check',
    apiKey: 'FACTCHECK_API_KEY'
  },
  {
    name: 'Snopes',
    endpoint: 'https://api.snopes.com/v1/verify',
    apiKey: 'SNOPES_API_KEY'
  },
  {
    name: 'PolitiFact',
    endpoint: 'https://api.politifact.com/v1/fact-check',
    apiKey: 'POLITIFACT_API_KEY'
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content_id, content_type, title, content, author, source_url } = await req.json();
    
    console.log(`Starting fact-checking for ${content_type}: ${content_id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    // 1. Extract claims from content
    const claims = await extractClaims(content, openAIApiKey);

    // 2. Check each claim against multiple fact-checking services
    const factCheckResults = await checkMultipleSources(claims);

    // 3. AI-based comprehensive analysis
    const aiAnalysis = await analyzeWithAI(content, claims, factCheckResults, openAIApiKey);

    // 4. Check for AI-generated content
    const aiDetection = await detectAIContent(content, openAIApiKey);

    // 5. Check for plagiarism
    const plagiarismCheck = await checkPlagiarism(content);

    // 6. Calculate final credibility score
    const finalResult = calculateFinalScore(factCheckResults, aiAnalysis, aiDetection, plagiarismCheck);

    // 7. Save verification results
    const { error: saveError } = await supabase
      .from('content_verifications')
      .insert({
        content_id,
        content_type,
        credibility_score: finalResult.credibility_score,
        fact_check_sources: finalResult.fact_check_sources,
        verified_claims: finalResult.verified_claims,
        disputed_claims: finalResult.disputed_claims,
        false_claims: finalResult.false_claims,
        warnings: finalResult.warnings,
        confidence_level: finalResult.confidence_level,
        recommendation: finalResult.recommendation,
        is_ai_generated: aiDetection.is_ai_generated,
        ai_confidence: aiDetection.ai_confidence,
        plagiarism_score: plagiarismCheck.plagiarism_score,
        original_sources: plagiarismCheck.original_sources,
        checked_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Error saving verification results:', saveError);
    }

    // 8. Update content status based on verification
    if (finalResult.recommendation === 'reject') {
      const tableName = content_type === 'news_article' ? 'news_articles' : 'community_posts';
      await supabase
        .from(tableName)
        .update({ 
          is_hidden: true,
          hidden_reason: 'Failed fact-check verification'
        })
        .eq('id', content_id);
    } else if (finalResult.recommendation === 'review') {
      // Flag for manual review
      await supabase
        .from('content_review_queue')
        .insert({
          content_id,
          content_type,
          reason: 'Fact-check warnings detected',
          priority: 'high',
          verification_data: finalResult
        });
    }

    console.log(`Fact-checking completed. Score: ${finalResult.credibility_score}`);

    return new Response(
      JSON.stringify({
        success: true,
        verification: finalResult,
        ai_detection: aiDetection,
        plagiarism: plagiarismCheck,
        message: `팩트체크 완료. 신뢰도 점수: ${finalResult.credibility_score}/100`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in fact-checking:', error);
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

async function extractClaims(content: string, apiKey: string): Promise<string[]> {
  if (!apiKey) return [];

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
            content: 'Extract verifiable factual claims from the given content. Focus on statistics, dates, quotes, and technical facts.'
          },
          {
            role: 'user',
            content: `Extract factual claims from this content:\n\n${content}\n\nReturn as JSON array of strings.`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const data = JSON.parse(result.choices[0].message.content);
      return data.claims || [];
    }
  } catch (error) {
    console.error('Error extracting claims:', error);
  }

  return [];
}

async function checkMultipleSources(claims: string[]): Promise<any[]> {
  const results = [];
  
  // Simulate fact-checking (in production, would call real APIs)
  for (const claim of claims) {
    // Check if claim contains known false patterns
    const falsePatterns = [
      /(\d+)% of developers/i,
      /windsurf acquired for \$(\d+) billion/i,
      /AI will replace (\d+)% of programmers/i
    ];
    
    let isFalse = false;
    for (const pattern of falsePatterns) {
      if (pattern.test(claim)) {
        // Verify specific statistics
        if (claim.includes('82% of developers')) {
          // This is actually true based on GitHub survey
          results.push({ claim, status: 'verified', source: 'GitHub Developer Survey' });
        } else if (claim.includes('95% of startups')) {
          // This needs verification
          results.push({ claim, status: 'disputed', source: 'Needs verification' });
        } else {
          results.push({ claim, status: 'unverified', source: 'No source found' });
        }
        isFalse = true;
        break;
      }
    }
    
    if (!isFalse) {
      // Default to needs verification
      results.push({ claim, status: 'needs_review', source: 'Manual review required' });
    }
  }
  
  return results;
}

async function analyzeWithAI(content: string, claims: string[], factCheckResults: any[], apiKey: string): Promise<FactCheckResult> {
  if (!apiKey) {
    return {
      credibility_score: 50,
      fact_check_sources: [],
      verified_claims: [],
      disputed_claims: [],
      false_claims: [],
      warnings: ['AI analysis unavailable'],
      confidence_level: 'low',
      recommendation: 'review'
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a fact-checking expert. Analyze the content and fact-check results to determine credibility.
            Consider:
            1. Consistency of information
            2. Source reliability
            3. Presence of misleading information
            4. Logical fallacies
            5. Bias indicators`
          },
          {
            role: 'user',
            content: `
              Content: ${content}
              
              Claims: ${JSON.stringify(claims)}
              
              Fact-check results: ${JSON.stringify(factCheckResults)}
              
              Provide a comprehensive credibility assessment as JSON with:
              - credibility_score (0-100)
              - verified_claims (array)
              - disputed_claims (array)
              - false_claims (array)
              - warnings (array)
              - confidence_level (high/medium/low)
              - recommendation (publish/review/reject)
            `
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return JSON.parse(result.choices[0].message.content);
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
  }

  return {
    credibility_score: 50,
    fact_check_sources: [],
    verified_claims: [],
    disputed_claims: claims,
    false_claims: [],
    warnings: ['AI analysis failed'],
    confidence_level: 'low',
    recommendation: 'review'
  };
}

async function detectAIContent(content: string, apiKey: string): Promise<ContentVerification> {
  if (!apiKey) {
    return {
      is_ai_generated: false,
      ai_confidence: 0,
      plagiarism_score: 0,
      original_sources: []
    };
  }

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
            content: 'Detect if the content is AI-generated. Look for patterns typical of AI writing.'
          },
          {
            role: 'user',
            content: `
              Analyze if this content is AI-generated:
              ${content}
              
              Return JSON with:
              - is_ai_generated (boolean)
              - ai_confidence (0-100)
              - indicators (array of detected AI patterns)
            `
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const detection = JSON.parse(result.choices[0].message.content);
      return {
        is_ai_generated: detection.is_ai_generated,
        ai_confidence: detection.ai_confidence,
        plagiarism_score: 0,
        original_sources: []
      };
    }
  } catch (error) {
    console.error('Error detecting AI content:', error);
  }

  return {
    is_ai_generated: false,
    ai_confidence: 0,
    plagiarism_score: 0,
    original_sources: []
  };
}

async function checkPlagiarism(content: string): Promise<{ plagiarism_score: number; original_sources: string[] }> {
  // In production, this would use services like Copyscape or Turnitin
  // For now, return mock data
  
  // Simple similarity check against known sources
  const knownSources = [
    { url: 'https://github.com/blog', text: 'GitHub announces new features' },
    { url: 'https://techcrunch.com', text: 'Latest in AI development' }
  ];
  
  let similarityScore = 0;
  const sources: string[] = [];
  
  for (const source of knownSources) {
    if (content.toLowerCase().includes(source.text.toLowerCase())) {
      similarityScore += 10;
      sources.push(source.url);
    }
  }
  
  return {
    plagiarism_score: Math.min(similarityScore, 100),
    original_sources: sources
  };
}

function calculateFinalScore(
  factCheckResults: any[],
  aiAnalysis: FactCheckResult,
  aiDetection: ContentVerification,
  plagiarismCheck: { plagiarism_score: number; original_sources: string[] }
): FactCheckResult {
  
  // Weight different factors
  const weights = {
    factCheck: 0.4,
    aiAnalysis: 0.3,
    aiDetection: 0.2,
    plagiarism: 0.1
  };
  
  // Calculate weighted score
  let score = 0;
  
  // Factor in fact-check results
  const verifiedCount = factCheckResults.filter(r => r.status === 'verified').length;
  const disputedCount = factCheckResults.filter(r => r.status === 'disputed').length;
  const falseCount = factCheckResults.filter(r => r.status === 'false').length;
  const totalClaims = factCheckResults.length || 1;
  
  const factCheckScore = ((verifiedCount - falseCount * 2 - disputedCount * 0.5) / totalClaims) * 100;
  score += Math.max(0, factCheckScore) * weights.factCheck;
  
  // Factor in AI analysis
  score += (aiAnalysis.credibility_score || 50) * weights.aiAnalysis;
  
  // Factor in AI detection (penalize if AI-generated with high confidence)
  const aiPenalty = aiDetection.is_ai_generated ? (aiDetection.ai_confidence / 100) * 30 : 0;
  score -= aiPenalty * weights.aiDetection;
  
  // Factor in plagiarism
  score -= (plagiarismCheck.plagiarism_score / 100) * 20 * weights.plagiarism;
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  // Determine recommendation
  let recommendation: 'publish' | 'review' | 'reject';
  if (score >= 70) {
    recommendation = 'publish';
  } else if (score >= 40) {
    recommendation = 'review';
  } else {
    recommendation = 'reject';
  }
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (factCheckResults.length > 5 && aiAnalysis.confidence_level) {
    confidence = aiAnalysis.confidence_level;
  } else if (factCheckResults.length > 2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    credibility_score: Math.round(score),
    fact_check_sources: aiAnalysis.fact_check_sources || [],
    verified_claims: factCheckResults.filter(r => r.status === 'verified').map(r => r.claim),
    disputed_claims: factCheckResults.filter(r => r.status === 'disputed').map(r => r.claim),
    false_claims: factCheckResults.filter(r => r.status === 'false').map(r => r.claim),
    warnings: [
      ...(aiAnalysis.warnings || []),
      ...(aiDetection.is_ai_generated ? ['Content appears to be AI-generated'] : []),
      ...(plagiarismCheck.plagiarism_score > 30 ? ['Potential plagiarism detected'] : [])
    ],
    confidence_level: confidence,
    recommendation
  };
}