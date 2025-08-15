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
