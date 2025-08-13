-- Fix signup failure due to FK pointing to public.users before it exists
-- Change FK on user_preferences.user_id to reference auth.users(id)

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Optional: ensure an index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
