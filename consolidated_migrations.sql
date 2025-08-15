-- This is a consolidated script of all database migrations
-- that could not be applied automatically due to environmental constraints.
-- Please run this script manually against your Supabase database in the SQL Editor.
-- Apply the scripts in the order they appear here.

-- Migration 1: 20250814042400_add_hot_score.sql
-- Adds the hot_score column to the trending_scores table for the improved trending algorithm.
-- -----------------------------------------------------------------------------

ALTER TABLE public.trending_scores
ADD COLUMN IF NOT EXISTS hot_score REAL DEFAULT 0;

COMMENT ON COLUMN public.trending_scores.hot_score IS 'Score based on recent activity (likes, comments in the last 24h) with a time decay gravity factor.';

CREATE INDEX IF NOT EXISTS idx_trending_scores_hot_score ON public.trending_scores (hot_score DESC);


-- Migration 2: 20250814225020_create_gamification_store.sql
-- Creates the tables for the gamification point store and seeds it with initial items.
-- -----------------------------------------------------------------------------

-- Create a table for items available in the store
CREATE TABLE store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    price INT NOT NULL CHECK (price >= 0),
    item_type TEXT NOT NULL, -- e.g., 'NICKNAME_COLOR', 'PROFILE_BADGE', 'POST_EFFECT'
    metadata JSONB, -- For storing item-specific data like a hex color code or an image URL
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT DEFAULT 0
);

-- Add comments to the table and columns
COMMENT ON TABLE store_items IS 'Items available for purchase with points in the gamification store.';
COMMENT ON COLUMN store_items.price IS 'The cost of the item in user points.';
COMMENT ON COLUMN store_items.item_type IS 'A category for the item, used to determine how to apply its effect.';
COMMENT ON COLUMN store_items.metadata IS 'Flexible data storage for item attributes, e.g., {"color": "#FF5733"}.';


-- Create a table to track which items users have purchased
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT false, -- To track if the item's effect is currently enabled by the user
    UNIQUE (user_id, item_id) -- A user can only own one of each item type
);

-- Add comments to the table and columns
COMMENT ON TABLE user_inventory IS 'Tracks items purchased by users from the store.';
COMMENT ON COLUMN user_inventory.is_active IS 'Indicates if the user has this item effect currently active.';


-- Enable Row Level Security
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_items
CREATE POLICY "Allow all users to view active store items"
ON store_items
FOR SELECT
USING (is_active = true);

-- RLS Policies for user_inventory
CREATE POLICY "Allow users to view their own inventory"
ON user_inventory
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own inventory items (activate/deactivate)"
ON user_inventory
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Create some default items in the store
INSERT INTO store_items (name, description, price, item_type, metadata) VALUES
('Fiery Red Nickname', 'Make your name stand out in a blazing red color!', 500, 'NICKNAME_COLOR', '{"color": "#E74C3C"}'),
('Cool Blue Nickname', 'A calm and cool blue color for your nickname.', 500, 'NICKNAME_COLOR', '{"color": "#3498DB"}'),
('Genesis Badge', 'A special badge for early supporters of the platform.', 1000, 'PROFILE_BADGE', '{"badge_name": "Genesis", "badge_icon": "ShieldCheck"}'),
('100 Club Badge', 'Awarded to users who have written over 100 posts.', 0, 'PROFILE_BADGE', '{"badge_name": "100 Club", "badge_icon": "Feather"}');


-- Migration 3: 20250814231200_create_purchase_item_function.sql
-- Creates the PostgreSQL function to handle item purchases in a single, atomic transaction.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION purchase_item_tx(p_user_id UUID, p_item_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  item_price INT;
  user_points INT;
  already_owned BOOLEAN;
BEGIN
  -- 1. Get item price
  SELECT price INTO item_price FROM public.store_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  -- 2. Check if user already owns the item
  SELECT EXISTS (
    SELECT 1 FROM public.user_inventory WHERE user_id = p_user_id AND item_id = p_item_id
  ) INTO already_owned;
  IF already_owned THEN
    RAISE EXCEPTION 'You already own this item';
  END IF;

  -- 3. Get user's current points and lock the row for this transaction
  SELECT points INTO user_points FROM public.user_levels WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    -- If user has no record in user_levels, they have 0 points.
    -- This case should ideally not happen if a user_levels row is created on signup.
    user_points := 0;
  END IF;

  -- 4. Check if user has enough points
  IF user_points < item_price THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- 5. Deduct points from user
  UPDATE public.user_levels SET points = points - item_price WHERE user_id = p_user_id;

  -- 6. Add item to user's inventory
  INSERT INTO public.user_inventory (user_id, item_id, is_active)
  VALUES (p_user_id, p_item_id, false);

  -- 7. Return success
  RETURN json_build_object('success', true, 'new_points', user_points - item_price);
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will cause the transaction to rollback automatically.
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
