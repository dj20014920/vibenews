import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExplanationRequest {
  terms: string[];
  contentType: 'news' | 'community';
  contentId: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
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

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    const { terms, contentType, contentId, userLevel = 'beginner' }: ExplanationRequest = await req.json();

    if (!terms || terms.length === 0) {
      throw new Error('Terms are required');
    }

    console.log(`Generating AI explanations for terms: ${terms.join(', ')} (Level: ${userLevel})`);

    // Check for existing explanations in tech_glossary
    const { data: existingTerms } = await supabase
      .from('tech_glossary')
      .select('term, definition, explanation_simple, explanation_detailed, difficulty_level')
      .in('term', terms)
      .eq('is_active', true);

    const existingTermsMap = new Map(existingTerms?.map(term => [term.term.toLowerCase(), term]) || []);
    const newTerms = terms.filter(term => !existingTermsMap.has(term.toLowerCase()));

    let generatedExplanations: any[] = [];

    // Generate explanations for new terms using OpenAI
    if (newTerms.length > 0) {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `You are a technical expert who explains programming and technology concepts to developers of different skill levels.

For each term provided, generate explanations in the following JSON format:
{
  "term": "exact term name",
  "definition": "concise 1-2 sentence definition",
  "explanation_simple": "beginner-friendly explanation with examples",
  "explanation_detailed": "comprehensive explanation for intermediate/advanced users",
  "difficulty_level": 1-5 (1=beginner, 5=expert),
  "category": "programming category (e.g., 'frontend', 'backend', 'database', 'devops')",
  "related_terms": ["array", "of", "related", "terms"],
  "usage_examples": [
    {
      "title": "example title",
      "code": "code example if applicable",
      "description": "explanation of example"
    }
  ]
}

Respond with an array of these objects for all terms.`;

      const userPrompt = `Explain these technical terms for ${userLevel} level developers: ${newTerms.join(', ')}

Make sure explanations are:
- Clear and accurate
- Appropriate for ${userLevel} level
- Include practical examples
- Use Korean language for explanations`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message}`);
      }

      const aiResponse = await response.json();
      const explanationText = aiResponse.choices[0].message.content;

      try {
        generatedExplanations = JSON.parse(explanationText);
        
        // Save new terms to glossary
        if (generatedExplanations.length > 0) {
          const termsToInsert = generatedExplanations.map(exp => ({
            term: exp.term,
            definition: exp.definition,
            explanation_simple: exp.explanation_simple,
            explanation_detailed: exp.explanation_detailed,
            difficulty_level: exp.difficulty_level || 1,
            category: exp.category || 'general',
            related_terms: exp.related_terms || [],
            usage_examples: exp.usage_examples || [],
            created_by: user.id,
          }));

          const { error: insertError } = await supabase
            .from('tech_glossary')
            .insert(termsToInsert);

          if (insertError) {
            console.error('Error saving terms to glossary:', insertError);
          } else {
            console.log(`Saved ${termsToInsert.length} new terms to glossary`);
          }
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback: create basic explanations
        generatedExplanations = newTerms.map(term => ({
          term,
          definition: `${term}에 대한 기술적 정의`,
          explanation_simple: `${term}는 프로그래밍에서 사용되는 중요한 개념입니다.`,
          explanation_detailed: `${term}에 대한 자세한 설명이 필요합니다.`,
          difficulty_level: 1,
          category: 'general',
          related_terms: [],
          usage_examples: []
        }));
      }
    }

    // Combine existing and generated explanations
    const allExplanations = [
      ...Array.from(existingTermsMap.values()),
      ...generatedExplanations
    ];

    // Filter explanations based on user level
    const levelMapping = { beginner: 1, intermediate: 3, advanced: 5 };
    const userLevelNum = levelMapping[userLevel];
    
    const filteredExplanations = allExplanations.map(exp => {
      const explanation = userLevelNum <= 2 ? exp.explanation_simple : exp.explanation_detailed;
      return {
        term: exp.term,
        definition: exp.definition,
        explanation: explanation || exp.explanation_simple,
        difficulty_level: exp.difficulty_level,
        category: exp.category,
        related_terms: exp.related_terms,
        usage_examples: exp.usage_examples
      };
    });

    // Save explanation request history
    const { error: historyError } = await supabase
      .from('ai_explanation_requests')
      .insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        terms_explained: terms,
        explanation_generated: JSON.stringify(filteredExplanations)
      });

    if (historyError) {
      console.error('Error saving explanation history:', historyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        explanations: filteredExplanations,
        user_level: userLevel,
        total_terms: terms.length,
        new_terms_generated: generatedExplanations.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-explanation function:', error);
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