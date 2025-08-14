import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Schema for a single tool object
const toolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  category: z.enum(['IDE', 'CLI', 'SaaS']),
  popularity_sources: z.object({}).passthrough().optional(),
});

// Schema for the incoming request body
const requestSchema = z.object({
  tools: z.array(toolSchema),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Authenticate user and check for admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("User not authenticated");

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      throw new Error("Permission denied. Admin role required.");
    }

    // 2. Validate incoming JSON data
    const body = await req.json();
    const { tools } = requestSchema.parse(body);

    // 3. Perform the sync operation within a transaction
    const { error: transactionError } = await supabase.rpc('sync_managed_tools', {
      tools_data: tools
    });

    if (transactionError) throw transactionError;

    return new Response(
      JSON.stringify({ success: true, message: `${tools.length} tools synced successfully.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof z.ZodError
      ? error.errors.map(e => e.message).join(', ')
      : error.message;

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: error instanceof z.ZodError || error.message.startsWith("Permission denied") ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
