import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToolPricing {
  tool_name: string;
  free_tier: {
    available: boolean;
    limits: string[];
    features: string[];
  };
  paid_plans: {
    name: string;
    price_monthly: number;
    price_yearly?: number;
    currency: string;
    features: string[];
    limits: string[];
    recommended_for: string;
  }[];
  enterprise_plan?: {
    available: boolean;
    contact_sales: boolean;
    starting_price?: number;
  };
  last_updated: string;
  price_changes?: {
    date: string;
    type: 'increase' | 'decrease' | 'new_plan' | 'plan_removed';
    details: string;
  }[];
}

// Vibe Coding Tools to Track
const TOOLS_TO_TRACK = [
  {
    name: 'Windsurf',
    website: 'https://windsurf.com',
    pricing_url: 'https://windsurf.com/pricing',
    api_endpoint: null,
    scraping_selectors: {
      plans: '.pricing-card',
      price: '.price-amount',
      features: '.feature-list li'
    }
  },
  {
    name: 'Cursor',
    website: 'https://cursor.sh',
    pricing_url: 'https://cursor.sh/pricing',
    api_endpoint: null,
    scraping_selectors: {
      plans: '.pricing-tier',
      price: '.tier-price',
      features: '.tier-features li'
    }
  },
  {
    name: 'Lovable',
    website: 'https://lovable.dev',
    pricing_url: 'https://lovable.dev/pricing',
    api_endpoint: 'https://api.lovable.dev/v1/pricing',
    scraping_selectors: null
  },
  {
    name: 'Bolt.new',
    website: 'https://bolt.new',
    pricing_url: 'https://bolt.new/pricing',
    api_endpoint: null,
    scraping_selectors: {
      plans: '.price-card',
      price: '.price-value',
      features: '.features-list li'
    }
  },
  {
    name: 'Vitara.ai',
    website: 'https://vitara.ai',
    pricing_url: 'https://vitara.ai/pricing',
    api_endpoint: null,
    scraping_selectors: {
      plans: '.pricing-box',
      price: '.price',
      features: '.feature-item'
    }
  },
  {
    name: 'GitHub Copilot',
    website: 'https://github.com',
    pricing_url: 'https://github.com/features/copilot',
    api_endpoint: 'https://api.github.com/copilot/pricing',
    scraping_selectors: null
  },
  {
    name: 'Devin',
    website: 'https://devin.ai',
    pricing_url: 'https://devin.ai/pricing',
    api_endpoint: null,
    scraping_selectors: {
      plans: '.plan-card',
      price: '.plan-price',
      features: '.plan-features li'
    }
  },
  {
    name: 'Replit AI',
    website: 'https://replit.com',
    pricing_url: 'https://replit.com/pricing',
    api_endpoint: null,
    scraping_selectors: {
      plans: '.pricing-card',
      price: '.price',
      features: '.features li'
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, tool_name } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'track_all') {
      // Track all tools
      console.log('Starting price tracking for all tools...');
      const results = await trackAllTools(supabase);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Price tracking completed for ${results.length} tools`,
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'track_single' && tool_name) {
      // Track single tool
      console.log(`Tracking price for ${tool_name}...`);
      const tool = TOOLS_TO_TRACK.find(t => t.name === tool_name);
      
      if (!tool) {
        throw new Error(`Tool ${tool_name} not found`);
      }
      
      const pricing = await trackToolPricing(tool, supabase);
      
      return new Response(
        JSON.stringify({
          success: true,
          pricing
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'compare') {
      // Get comparison data
      const comparison = await getComparisonData(supabase);
      
      return new Response(
        JSON.stringify({
          success: true,
          comparison
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'get_recommendations') {
      const { budget, features, experience_level } = await req.json();
      const recommendations = await getRecommendations(supabase, { budget, features, experience_level });
      
      return new Response(
        JSON.stringify({
          success: true,
          recommendations
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in tool price tracking:', error);
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

async function trackAllTools(supabase: any): Promise<ToolPricing[]> {
  const results: ToolPricing[] = [];
  
  for (const tool of TOOLS_TO_TRACK) {
    try {
      const pricing = await trackToolPricing(tool, supabase);
      results.push(pricing);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error tracking ${tool.name}:`, error);
    }
  }
  
  return results;
}

async function trackToolPricing(tool: any, supabase: any): Promise<ToolPricing> {
  let pricingData: ToolPricing;
  
  if (tool.api_endpoint) {
    // Try API first
    pricingData = await fetchPricingFromAPI(tool);
  } else if (tool.scraping_selectors) {
    // Fallback to web scraping
    pricingData = await scrapePricingData(tool);
  } else {
    // Use hardcoded/known data
    pricingData = getKnownPricing(tool.name);
  }
  
  // Check for price changes
  const { data: existingPricing } = await supabase
    .from('tool_pricing')
    .select('*')
    .eq('tool_name', tool.name)
    .single();
  
  if (existingPricing) {
    const changes = detectPriceChanges(existingPricing, pricingData);
    if (changes.length > 0) {
      pricingData.price_changes = changes;
      
      // Notify users of price changes
      await notifyPriceChanges(tool.name, changes, supabase);
    }
  }
  
  // Save to database
  const { error } = await supabase
    .from('tool_pricing')
    .upsert({
      tool_name: pricingData.tool_name,
      free_tier: pricingData.free_tier,
      paid_plans: pricingData.paid_plans,
      enterprise_plan: pricingData.enterprise_plan,
      last_updated: new Date().toISOString(),
      price_changes: pricingData.price_changes || []
    });
  
  if (error) {
    console.error(`Error saving pricing for ${tool.name}:`, error);
  }
  
  return pricingData;
}

async function fetchPricingFromAPI(tool: any): Promise<ToolPricing> {
  try {
    const response = await fetch(tool.api_endpoint);
    
    if (response.ok) {
      const data = await response.json();
      
      // Transform API response to our format
      return {
        tool_name: tool.name,
        free_tier: data.free_tier || { available: false, limits: [], features: [] },
        paid_plans: data.plans || [],
        enterprise_plan: data.enterprise || { available: false, contact_sales: true },
        last_updated: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error(`API fetch failed for ${tool.name}:`, error);
  }
  
  // Fallback to known data
  return getKnownPricing(tool.name);
}

async function scrapePricingData(tool: any): Promise<ToolPricing> {
  try {
    const response = await fetch(tool.pricing_url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const plans: any[] = [];
    
    $(tool.scraping_selectors.plans).each((i, elem) => {
      const $elem = $(elem);
      const priceText = $elem.find(tool.scraping_selectors.price).text();
      const features: string[] = [];
      
      $elem.find(tool.scraping_selectors.features).each((j, feat) => {
        features.push($(feat).text().trim());
      });
      
      const price = extractPrice(priceText);
      if (price !== null) {
        plans.push({
          name: $elem.find('.plan-name').text() || `Plan ${i + 1}`,
          price_monthly: price,
          currency: 'USD',
          features,
          limits: [],
          recommended_for: ''
        });
      }
    });
    
    return {
      tool_name: tool.name,
      free_tier: plans.some(p => p.price_monthly === 0) 
        ? { available: true, limits: [], features: plans.find(p => p.price_monthly === 0)?.features || [] }
        : { available: false, limits: [], features: [] },
      paid_plans: plans.filter(p => p.price_monthly > 0),
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Scraping failed for ${tool.name}:`, error);
    return getKnownPricing(tool.name);
  }
}

function getKnownPricing(toolName: string): ToolPricing {
  // Hardcoded known pricing data (as of July 2025)
  const knownPricing: { [key: string]: ToolPricing } = {
    'Windsurf': {
      tool_name: 'Windsurf',
      free_tier: {
        available: true,
        limits: ['Limited requests', 'Basic features'],
        features: ['AI code completion', 'Basic IDE features']
      },
      paid_plans: [
        {
          name: 'Pro',
          price_monthly: 15,
          price_yearly: 144,
          currency: 'USD',
          features: ['Unlimited AI requests', 'Advanced features', 'Priority support'],
          limits: [],
          recommended_for: 'Professional developers'
        }
      ],
      enterprise_plan: {
        available: true,
        contact_sales: true
      },
      last_updated: new Date().toISOString()
    },
    'Cursor': {
      tool_name: 'Cursor',
      free_tier: {
        available: true,
        limits: ['2000 completions/month'],
        features: ['AI pair programming', 'VS Code compatible']
      },
      paid_plans: [
        {
          name: 'Pro',
          price_monthly: 20,
          price_yearly: 192,
          currency: 'USD',
          features: ['Unlimited completions', 'GPT-4 access', 'Advanced features'],
          limits: [],
          recommended_for: 'Active developers'
        }
      ],
      last_updated: new Date().toISOString()
    },
    'Lovable': {
      tool_name: 'Lovable',
      free_tier: {
        available: true,
        limits: ['3 projects', 'Basic features'],
        features: ['Visual development', 'Basic deployments']
      },
      paid_plans: [
        {
          name: 'Starter',
          price_monthly: 25,
          currency: 'USD',
          features: ['Unlimited projects', 'Custom domains', 'Advanced features'],
          limits: [],
          recommended_for: 'Small teams'
        },
        {
          name: 'Pro',
          price_monthly: 49,
          currency: 'USD',
          features: ['Everything in Starter', 'Team collaboration', 'Priority support'],
          limits: [],
          recommended_for: 'Growing teams'
        }
      ],
      last_updated: new Date().toISOString()
    },
    'Bolt.new': {
      tool_name: 'Bolt.new',
      free_tier: {
        available: true,
        limits: ['Limited usage'],
        features: ['Web app creation', 'Basic templates']
      },
      paid_plans: [
        {
          name: 'Pro',
          price_monthly: 20,
          currency: 'USD',
          features: ['Unlimited usage', 'Custom templates', 'Advanced features'],
          limits: [],
          recommended_for: 'Web developers'
        }
      ],
      last_updated: new Date().toISOString()
    },
    'GitHub Copilot': {
      tool_name: 'GitHub Copilot',
      free_tier: {
        available: false,
        limits: [],
        features: []
      },
      paid_plans: [
        {
          name: 'Individual',
          price_monthly: 10,
          price_yearly: 100,
          currency: 'USD',
          features: ['AI pair programming', 'Multi-language support', 'IDE integration'],
          limits: [],
          recommended_for: 'Individual developers'
        },
        {
          name: 'Business',
          price_monthly: 19,
          currency: 'USD',
          features: ['Everything in Individual', 'Organization management', 'Policy controls'],
          limits: [],
          recommended_for: 'Teams and organizations'
        }
      ],
      enterprise_plan: {
        available: true,
        contact_sales: true,
        starting_price: 39
      },
      last_updated: new Date().toISOString()
    }
  };
  
  return knownPricing[toolName] || {
    tool_name: toolName,
    free_tier: { available: false, limits: [], features: [] },
    paid_plans: [],
    last_updated: new Date().toISOString()
  };
}

function extractPrice(priceText: string): number | null {
  const match = priceText.match(/\$?(\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : null;
}

function detectPriceChanges(existing: any, updated: ToolPricing): any[] {
  const changes: any[] = [];
  
  // Compare paid plans
  for (const updatedPlan of updated.paid_plans) {
    const existingPlan = existing.paid_plans?.find((p: any) => p.name === updatedPlan.name);
    
    if (existingPlan) {
      if (existingPlan.price_monthly !== updatedPlan.price_monthly) {
        changes.push({
          date: new Date().toISOString(),
          type: updatedPlan.price_monthly > existingPlan.price_monthly ? 'increase' : 'decrease',
          details: `${updatedPlan.name} plan: $${existingPlan.price_monthly} → $${updatedPlan.price_monthly}`
        });
      }
    } else {
      changes.push({
        date: new Date().toISOString(),
        type: 'new_plan',
        details: `New plan added: ${updatedPlan.name} at $${updatedPlan.price_monthly}/month`
      });
    }
  }
  
  // Check for removed plans
  if (existing.paid_plans) {
    for (const existingPlan of existing.paid_plans) {
      const stillExists = updated.paid_plans.find(p => p.name === existingPlan.name);
      if (!stillExists) {
        changes.push({
          date: new Date().toISOString(),
          type: 'plan_removed',
          details: `Plan removed: ${existingPlan.name}`
        });
      }
    }
  }
  
  return changes;
}

async function notifyPriceChanges(toolName: string, changes: any[], supabase: any): Promise<void> {
  // Save price change notifications
  for (const change of changes) {
    await supabase
      .from('price_change_notifications')
      .insert({
        tool_name: toolName,
        change_type: change.type,
        details: change.details,
        notified_at: new Date().toISOString()
      });
  }
  
  // In production, this would also send emails/push notifications to subscribed users
  console.log(`Price changes detected for ${toolName}:`, changes);
}

async function getComparisonData(supabase: any): Promise<any> {
  const { data: pricingData, error } = await supabase
    .from('tool_pricing')
    .select('*')
    .order('tool_name');
  
  if (error) {
    throw error;
  }
  
  // Format for comparison table
  return {
    tools: pricingData,
    comparison_matrix: generateComparisonMatrix(pricingData),
    best_value: findBestValue(pricingData),
    feature_comparison: compareFeatures(pricingData)
  };
}

async function getRecommendations(supabase: any, criteria: any): Promise<any> {
  const { budget, features, experience_level } = criteria;
  
  const { data: pricingData } = await supabase
    .from('tool_pricing')
    .select('*');
  
  const recommendations = [];
  
  for (const tool of pricingData) {
    let score = 0;
    let reasons = [];
    
    // Check budget fit
    const affordablePlans = tool.paid_plans.filter((p: any) => p.price_monthly <= budget);
    if (affordablePlans.length > 0 || (tool.free_tier?.available && budget === 0)) {
      score += 30;
      reasons.push('Within budget');
    }
    
    // Check features match
    if (features && features.length > 0) {
      const toolFeatures = [
        ...(tool.free_tier?.features || []),
        ...tool.paid_plans.flatMap((p: any) => p.features)
      ];
      
      const matchedFeatures = features.filter((f: string) => 
        toolFeatures.some((tf: string) => tf.toLowerCase().includes(f.toLowerCase()))
      );
      
      score += (matchedFeatures.length / features.length) * 40;
      if (matchedFeatures.length > 0) {
        reasons.push(`Matches ${matchedFeatures.length}/${features.length} requested features`);
      }
    }
    
    // Check experience level match
    if (experience_level) {
      const levelMap: { [key: string]: string[] } = {
        'beginner': ['Lovable', 'Bolt.new'],
        'intermediate': ['Cursor', 'GitHub Copilot', 'Vitara.ai'],
        'advanced': ['Windsurf', 'Cursor', 'Devin']
      };
      
      if (levelMap[experience_level]?.includes(tool.tool_name)) {
        score += 30;
        reasons.push(`Good for ${experience_level} level`);
      }
    }
    
    if (score > 0) {
      recommendations.push({
        tool_name: tool.tool_name,
        score,
        reasons,
        recommended_plan: affordablePlans[0] || tool.free_tier
      });
    }
  }
  
  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);
  
  return recommendations.slice(0, 5);
}

function generateComparisonMatrix(pricingData: any[]): any {
  const features = new Set<string>();
  
  // Collect all unique features
  for (const tool of pricingData) {
    if (tool.free_tier?.features) {
      tool.free_tier.features.forEach((f: string) => features.add(f));
    }
    for (const plan of tool.paid_plans || []) {
      plan.features?.forEach((f: string) => features.add(f));
    }
  }
  
  // Create matrix
  const matrix: any = {};
  for (const tool of pricingData) {
    matrix[tool.tool_name] = {};
    for (const feature of features) {
      const hasInFree = tool.free_tier?.features?.includes(feature);
      const hasInPaid = tool.paid_plans?.some((p: any) => p.features?.includes(feature));
      matrix[tool.tool_name][feature] = hasInFree ? 'free' : hasInPaid ? 'paid' : 'no';
    }
  }
  
  return matrix;
}

function findBestValue(pricingData: any[]): any {
  const valueScores = pricingData.map(tool => {
    const featuresCount = (tool.free_tier?.features?.length || 0) + 
                         (tool.paid_plans?.[0]?.features?.length || 0);
    const lowestPrice = tool.free_tier?.available ? 0 : 
                        Math.min(...tool.paid_plans?.map((p: any) => p.price_monthly) || [999]);
    
    return {
      tool_name: tool.tool_name,
      value_score: featuresCount / (lowestPrice + 1), // +1 to avoid division by zero
      lowest_price: lowestPrice,
      features_count: featuresCount
    };
  });
  
  valueScores.sort((a, b) => b.value_score - a.value_score);
  
  return {
    best_free: pricingData.find(t => t.free_tier?.available),
    best_value: valueScores[0],
    best_budget: valueScores.find(v => v.lowest_price > 0 && v.lowest_price <= 15),
    best_premium: valueScores.find(v => v.lowest_price > 30)
  };
}

function compareFeatures(pricingData: any[]): any {
  return {
    ai_models: {
      'GPT-4': ['Cursor', 'Windsurf'],
      'Claude': ['Cursor'],
      'Custom': ['Devin', 'Vitara.ai']
    },
    ide_support: {
      'VS Code': ['Cursor', 'GitHub Copilot'],
      'Web-based': ['Lovable', 'Bolt.new', 'Replit AI'],
      'Standalone': ['Windsurf', 'Devin']
    },
    collaboration: {
      'Real-time': ['Replit AI', 'Lovable'],
      'Async': ['GitHub Copilot', 'Cursor'],
      'Team features': ['Lovable', 'GitHub Copilot Business']
    }
  };
}