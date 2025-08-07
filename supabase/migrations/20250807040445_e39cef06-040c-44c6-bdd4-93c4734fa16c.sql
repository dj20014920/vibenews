-- 사용자 포인트 및 레벨 테이블 (중복 확인 후 생성)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_levels') THEN
        CREATE TABLE user_levels (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE,
          level INTEGER DEFAULT 1,
          points INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 사용자 배지 테이블 (중복 확인 후 생성)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_badges') THEN
        CREATE TABLE user_badges (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          badge_id TEXT NOT NULL,
          badge_name TEXT NOT NULL,
          badge_description TEXT NOT NULL,
          badge_icon TEXT NOT NULL,
          badge_color TEXT NOT NULL,
          badge_category TEXT NOT NULL,
          badge_level INTEGER,
          earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, badge_id)
        );
    END IF;
END $$;

-- RLS 활성화 (중복 방지)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_levels') THEN
        ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view all user levels" ON user_levels
          FOR SELECT USING (true);

        CREATE POLICY "Users can manage own level" ON user_levels
          FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_badges') THEN
        ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view all user badges" ON user_badges
          FOR SELECT USING (true);

        CREATE POLICY "Users can manage own badges" ON user_badges
          FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;