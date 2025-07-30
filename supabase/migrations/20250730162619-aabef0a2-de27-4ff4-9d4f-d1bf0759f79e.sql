-- Add anonymous support to existing tables
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS anonymous_author_name text;

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS anonymous_author_name text;

-- Add nested comment support with parent_id (already exists but ensure it's there)
-- parent_id already exists in comments table

-- Update reports table to handle different report types
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'content',
ADD COLUMN IF NOT EXISTS report_details jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auto_hidden boolean DEFAULT false;

-- Add user profile enhancements
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  website_url text,
  github_username text,
  twitter_username text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.user_profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own profile" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user follow system
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_follows
CREATE POLICY "Users can manage own follows" 
ON public.user_follows FOR ALL 
USING (auth.uid() = follower_id);

CREATE POLICY "Anyone can view follows" 
ON public.user_follows FOR SELECT 
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON public.user_profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);