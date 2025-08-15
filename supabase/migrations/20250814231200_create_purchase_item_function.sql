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
