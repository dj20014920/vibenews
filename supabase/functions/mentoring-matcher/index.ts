import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MentorProfile {
  user_id: string;
  role: 'mentor' | 'mentee' | 'both';
  skills: string[];
  experience_level: string;
  preferred_tools: string[];
  languages: string[];
  availability: string;
  hourly_rate?: number;
  average_rating?: number;
  total_sessions: number;
}

interface MentorMatch {
  mentor_id: string;
  mentee_id: string;
  match_score: number;
  matching_skills: string[];
  matching_tools: string[];
  compatibility_reasons: string[];
  recommended_topics: string[];
}

interface CollaborationRequest {
  requester_id: string;
  project_title: string;
  required_skills: string[];
  project_type: string;
  commitment_level: string;
  tools_used: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    switch (action) {
      case 'find_mentor':
        return await findMentor(params, supabase, openAIApiKey);
      
      case 'create_match':
        return await createMatch(params, supabase);
      
      case 'find_collaborators':
        return await findCollaborators(params, supabase, openAIApiKey);
      
      case 'schedule_session':
        return await scheduleSession(params, supabase);
      
      case 'rate_session':
        return await rateSession(params, supabase);
      
      case 'get_recommendations':
        return await getPersonalizedRecommendations(params, supabase, openAIApiKey);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in mentoring matcher:', error);
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

async function findMentor(params: any, supabase: any, apiKey: string) {
  const { mentee_id, skills_needed, tools, language, topic, budget } = params;
  
  console.log(`Finding mentor for mentee ${mentee_id}`);
  
  // 1. Get mentee profile
  const { data: menteeProfile } = await supabase
    .from('mentoring_profiles')
    .select('*')
    .eq('user_id', mentee_id)
    .single();
  
  // 2. Get potential mentors
  let query = supabase
    .from('mentoring_profiles')
    .select('*, users!user_id(*)')
    .in('role', ['mentor', 'both'])
    .eq('is_active', true);
  
  // Apply budget filter if specified
  if (budget !== undefined && budget !== null) {
    if (budget === 0) {
      query = query.is('hourly_rate', null);
    } else {
      query = query.or(`hourly_rate.lte.${budget},hourly_rate.is.null`);
    }
  }
  
  const { data: mentors, error } = await query;
  
  if (error) throw error;
  
  // 3. Calculate match scores using AI
  const scoredMentors = await calculateMatchScores(
    menteeProfile,
    mentors,
    { skills_needed, tools, language, topic },
    apiKey
  );
  
  // 4. Sort by match score
  scoredMentors.sort((a, b) => b.match_score - a.match_score);
  
  // 5. Get top 5 matches
  const topMatches = scoredMentors.slice(0, 5);
  
  // 6. Generate personalized recommendations for each match
  const recommendations = await generateMatchRecommendations(topMatches, topic, apiKey);
  
  return new Response(
    JSON.stringify({
      success: true,
      matches: recommendations,
      total_found: scoredMentors.length
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function calculateMatchScores(
  mentee: any,
  mentors: MentorProfile[],
  criteria: any,
  apiKey: string
): Promise<MentorMatch[]> {
  const matches: MentorMatch[] = [];
  
  for (const mentor of mentors) {
    // Basic scoring algorithm
    let score = 0;
    const reasons: string[] = [];
    const matchingSkills: string[] = [];
    const matchingTools: string[] = [];
    
    // Skill matching (40% weight)
    if (criteria.skills_needed && mentor.skills) {
      const skillMatches = criteria.skills_needed.filter((skill: string) => 
        mentor.skills.includes(skill)
      );
      matchingSkills.push(...skillMatches);
      const skillScore = (skillMatches.length / criteria.skills_needed.length) * 40;
      score += skillScore;
      
      if (skillMatches.length > 0) {
        reasons.push(`Matches ${skillMatches.length}/${criteria.skills_needed.length} required skills`);
      }
    }
    
    // Tool matching (30% weight)
    if (criteria.tools && mentor.preferred_tools) {
      const toolMatches = criteria.tools.filter((tool: string) => 
        mentor.preferred_tools.includes(tool)
      );
      matchingTools.push(...toolMatches);
      const toolScore = (toolMatches.length / criteria.tools.length) * 30;
      score += toolScore;
      
      if (toolMatches.length > 0) {
        reasons.push(`Expert in ${toolMatches.join(', ')}`);
      }
    }
    
    // Language matching (15% weight)
    if (criteria.language && mentor.languages) {
      if (mentor.languages.includes(criteria.language)) {
        score += 15;
        reasons.push(`Speaks ${criteria.language}`);
      }
    }
    
    // Rating bonus (10% weight)
    if (mentor.average_rating) {
      const ratingScore = (mentor.average_rating / 5) * 10;
      score += ratingScore;
      reasons.push(`${mentor.average_rating.toFixed(1)}⭐ rating`);
    }
    
    // Experience bonus (5% weight)
    if (mentor.total_sessions > 10) {
      score += 5;
      reasons.push(`${mentor.total_sessions} mentoring sessions completed`);
    }
    
    // AI-enhanced compatibility check
    if (apiKey && criteria.topic) {
      const aiScore = await calculateAICompatibility(mentee, mentor, criteria.topic, apiKey);
      score = (score * 0.7) + (aiScore * 0.3); // 30% weight for AI scoring
    }
    
    matches.push({
      mentor_id: mentor.user_id,
      mentee_id: mentee?.user_id || '',
      match_score: Math.round(score),
      matching_skills: matchingSkills,
      matching_tools: matchingTools,
      compatibility_reasons: reasons,
      recommended_topics: generateTopicRecommendations(matchingSkills, matchingTools)
    });
  }
  
  return matches;
}

async function calculateAICompatibility(
  mentee: any,
  mentor: any,
  topic: string,
  apiKey: string
): Promise<number> {
  if (!apiKey) return 50;
  
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
            content: 'Evaluate mentor-mentee compatibility based on profiles and return a score 0-100.'
          },
          {
            role: 'user',
            content: `
              Mentee Profile:
              - Skills: ${mentee?.skills?.join(', ') || 'Not specified'}
              - Experience: ${mentee?.experience_level || 'Not specified'}
              - Goals: Learn about ${topic}
              
              Mentor Profile:
              - Skills: ${mentor.skills.join(', ')}
              - Experience: ${mentor.experience_level}
              - Specialties: ${mentor.preferred_tools?.join(', ')}
              - Sessions: ${mentor.total_sessions}
              - Rating: ${mentor.average_rating || 'New'}
              
              Return compatibility score (0-100) as JSON: {"score": <number>}
            `
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const data = JSON.parse(result.choices[0].message.content);
      return data.score || 50;
    }
  } catch (error) {
    console.error('AI compatibility check failed:', error);
  }
  
  return 50;
}

async function generateMatchRecommendations(
  matches: MentorMatch[],
  topic: string,
  apiKey: string
): Promise<any[]> {
  const recommendations = [];
  
  for (const match of matches) {
    const recommendation = {
      ...match,
      suggested_first_session: generateFirstSessionTopic(match, topic),
      estimated_sessions_needed: estimateSessionsNeeded(topic, match.matching_skills),
      learning_path: generateLearningPath(topic, match.matching_skills, match.matching_tools)
    };
    
    recommendations.push(recommendation);
  }
  
  return recommendations;
}

function generateFirstSessionTopic(match: MentorMatch, topic: string): string {
  if (match.matching_skills.length > 0) {
    return `Introduction to ${topic} focusing on ${match.matching_skills[0]}`;
  }
  return `Getting started with ${topic} - Assessment and goal setting`;
}

function estimateSessionsNeeded(topic: string, matchingSkills: string[]): number {
  // Simple estimation based on topic complexity
  const complexTopics = ['machine learning', 'system design', 'blockchain', 'ai'];
  const isComplex = complexTopics.some(t => topic.toLowerCase().includes(t));
  
  const baseSession = isComplex ? 8 : 4;
  const reduction = Math.min(matchingSkills.length * 0.5, 2);
  
  return Math.max(2, Math.round(baseSession - reduction));
}

function generateLearningPath(topic: string, skills: string[], tools: string[]): string[] {
  const path = [];
  
  // Basic structure
  path.push(`1. Introduction and assessment`);
  path.push(`2. Fundamentals of ${topic}`);
  
  if (tools.length > 0) {
    path.push(`3. Hands-on with ${tools[0]}`);
  }
  
  if (skills.length > 0) {
    path.push(`4. Deep dive into ${skills[0]}`);
  }
  
  path.push(`5. Real-world project`);
  path.push(`6. Best practices and optimization`);
  
  return path;
}

function generateTopicRecommendations(skills: string[], tools: string[]): string[] {
  const topics = [];
  
  if (skills.includes('React')) {
    topics.push('Building modern web applications');
  }
  if (skills.includes('AI')) {
    topics.push('Implementing AI features');
  }
  if (tools.includes('Cursor')) {
    topics.push('AI-assisted programming techniques');
  }
  if (tools.includes('Windsurf')) {
    topics.push('Advanced IDE workflows');
  }
  
  // Default topics
  if (topics.length === 0) {
    topics.push('Code review and best practices');
    topics.push('Project architecture planning');
  }
  
  return topics;
}

async function createMatch(params: any, supabase: any) {
  const { mentor_id, mentee_id, topic, description, preferred_schedule } = params;
  
  // Check for existing pending match
  const { data: existingMatch } = await supabase
    .from('mentoring_matches')
    .select('*')
    .eq('mentor_id', mentor_id)
    .eq('mentee_id', mentee_id)
    .eq('status', 'pending')
    .single();
  
  if (existingMatch) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'A pending request already exists with this mentor'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Create new match request
  const { data: newMatch, error } = await supabase
    .from('mentoring_matches')
    .insert({
      mentor_id,
      mentee_id,
      topic,
      description,
      preferred_schedule,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Send notification to mentor
  await supabase
    .from('notifications')
    .insert({
      user_id: mentor_id,
      type: 'mentoring_request',
      title: 'New Mentoring Request',
      message: `You have a new mentoring request for: ${topic}`,
      data: { match_id: newMatch.id }
    });
  
  return new Response(
    JSON.stringify({
      success: true,
      match: newMatch,
      message: 'Mentoring request sent successfully'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function findCollaborators(params: any, supabase: any, apiKey: string) {
  const { project_id, required_skills, project_type, tools_used } = params;
  
  // Get users with matching skills
  const { data: profiles } = await supabase
    .from('mentoring_profiles')
    .select('*, users!user_id(*)')
    .overlaps('skills', required_skills)
    .eq('is_active', true);
  
  // Score and rank potential collaborators
  const collaborators = profiles.map((profile: any) => {
    let score = 0;
    const reasons = [];
    
    // Skill match
    const matchingSkills = required_skills.filter((skill: string) => 
      profile.skills.includes(skill)
    );
    score += matchingSkills.length * 20;
    
    if (matchingSkills.length > 0) {
      reasons.push(`Has ${matchingSkills.length} required skills`);
    }
    
    // Tool experience
    if (tools_used && profile.preferred_tools) {
      const matchingTools = tools_used.filter((tool: string) => 
        profile.preferred_tools.includes(tool)
      );
      score += matchingTools.length * 15;
      
      if (matchingTools.length > 0) {
        reasons.push(`Experienced with ${matchingTools.join(', ')}`);
      }
    }
    
    // Experience level bonus
    if (profile.experience_level === 'expert') score += 10;
    if (profile.experience_level === 'advanced') score += 7;
    
    return {
      user_id: profile.user_id,
      user: profile.users,
      score,
      reasons,
      skills: profile.skills,
      experience_level: profile.experience_level
    };
  });
  
  // Sort by score
  collaborators.sort((a, b) => b.score - a.score);
  
  return new Response(
    JSON.stringify({
      success: true,
      collaborators: collaborators.slice(0, 10),
      total_found: collaborators.length
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function scheduleSession(params: any, supabase: any) {
  const { match_id, session_date, duration_minutes, session_type, notes } = params;
  
  // Verify match exists and is accepted
  const { data: match } = await supabase
    .from('mentoring_matches')
    .select('*')
    .eq('id', match_id)
    .eq('status', 'accepted')
    .single();
  
  if (!match) {
    throw new Error('Match not found or not accepted');
  }
  
  // Create session
  const { data: session, error } = await supabase
    .from('mentoring_sessions')
    .insert({
      match_id,
      session_date,
      duration_minutes: duration_minutes || 60,
      session_type: session_type || 'video',
      notes,
      status: 'scheduled'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Send notifications
  await Promise.all([
    supabase.from('notifications').insert({
      user_id: match.mentor_id,
      type: 'session_scheduled',
      title: 'Session Scheduled',
      message: `Mentoring session scheduled for ${new Date(session_date).toLocaleString()}`,
      data: { session_id: session.id }
    }),
    supabase.from('notifications').insert({
      user_id: match.mentee_id,
      type: 'session_scheduled',
      title: 'Session Scheduled',
      message: `Your mentoring session is scheduled for ${new Date(session_date).toLocaleString()}`,
      data: { session_id: session.id }
    })
  ]);
  
  return new Response(
    JSON.stringify({
      success: true,
      session,
      message: 'Session scheduled successfully'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function rateSession(params: any, supabase: any) {
  const { session_id, rating, feedback, user_id } = params;
  
  // Get session details
  const { data: session } = await supabase
    .from('mentoring_sessions')
    .select('*, mentoring_matches!match_id(*)')
    .eq('id', session_id)
    .single();
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  const isMentor = session.mentoring_matches.mentor_id === user_id;
  const isMentee = session.mentoring_matches.mentee_id === user_id;
  
  if (!isMentor && !isMentee) {
    throw new Error('Unauthorized to rate this session');
  }
  
  // Update session with rating
  const updateData: any = {
    rating,
    feedback
  };
  
  if (isMentor) {
    updateData.mentor_notes = feedback;
  } else {
    updateData.mentee_notes = feedback;
  }
  
  const { error: updateError } = await supabase
    .from('mentoring_sessions')
    .update(updateData)
    .eq('id', session_id);
  
  if (updateError) throw updateError;
  
  // Update mentor's average rating if mentee is rating
  if (isMentee && rating) {
    const { data: allSessions } = await supabase
      .from('mentoring_sessions')
      .select('rating')
      .eq('match_id', session.match_id)
      .not('rating', 'is', null);
    
    const totalRatings = allSessions.length;
    const sumRatings = allSessions.reduce((sum, s) => sum + s.rating, 0);
    const avgRating = sumRatings / totalRatings;
    
    await supabase
      .from('mentoring_profiles')
      .update({
        average_rating: avgRating,
        total_sessions: totalRatings
      })
      .eq('user_id', session.mentoring_matches.mentor_id);
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Session rated successfully'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function getPersonalizedRecommendations(params: any, supabase: any, apiKey: string) {
  const { user_id } = params;
  
  // Get user's profile and history
  const { data: profile } = await supabase
    .from('mentoring_profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();
  
  const { data: pastMatches } = await supabase
    .from('mentoring_matches')
    .select('*')
    .or(`mentor_id.eq.${user_id},mentee_id.eq.${user_id}`)
    .eq('status', 'completed');
  
  // Generate AI recommendations
  if (apiKey) {
    const recommendations = await generateAIRecommendations(profile, pastMatches, apiKey);
    
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
  
  // Fallback to basic recommendations
  return new Response(
    JSON.stringify({
      success: true,
      recommendations: {
        suggested_mentors: [],
        suggested_topics: ['Web Development', 'AI Programming', 'System Design'],
        suggested_tools: ['Cursor', 'Windsurf', 'GitHub Copilot']
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function generateAIRecommendations(profile: any, history: any[], apiKey: string) {
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
            content: 'Generate personalized learning recommendations based on user profile and history.'
          },
          {
            role: 'user',
            content: `
              User Profile:
              - Skills: ${profile?.skills?.join(', ') || 'None'}
              - Experience: ${profile?.experience_level || 'Beginner'}
              - Past Sessions: ${history.length}
              
              Generate recommendations as JSON:
              {
                "next_skills_to_learn": [],
                "recommended_mentors_type": [],
                "suggested_projects": [],
                "learning_resources": []
              }
            `
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return JSON.parse(result.choices[0].message.content);
    }
  } catch (error) {
    console.error('AI recommendations failed:', error);
  }
  
  return {
    next_skills_to_learn: ['Advanced React', 'TypeScript', 'Testing'],
    recommended_mentors_type: ['Senior Developer', 'AI Specialist'],
    suggested_projects: ['Build a chat app', 'Create an AI tool'],
    learning_resources: ['Documentation', 'Video tutorials', 'Practice exercises']
  };
}