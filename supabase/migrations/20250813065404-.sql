-- 먼저 user_preferences 테이블에서 잘못된 외래키 제약조건이 있는지 확인하고 수정
-- user_preferences 테이블이 auth.users를 참조하지 않고 public.users를 참조하도록 수정

-- 1. 기존 트리거가 auth.users에 연결되어 있는지 확인하고 public.users로 변경
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. public.users 테이블에 새 사용자 생성 시 user_preferences 생성하는 트리거 추가
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. public.users 테이블에 트리거 생성
CREATE TRIGGER on_public_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- 4. user_preferences 테이블에 올바른 외래키 제약조건이 있는지 확인
-- 만약 잘못된 제약조건이 있다면 삭제하고 올바른 것으로 교체

-- 기존 잘못된 외래키 제약조건 확인 및 삭제
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- user_preferences에서 auth.users를 참조하는 제약조건 찾기
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'user_preferences' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND ccu.table_schema = 'auth';
    
    -- 찾은 제약조건이 있으면 삭제
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_preferences DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END
$$;

-- 5. user_preferences에 public.users를 참조하는 올바른 외래키 제약조건 추가
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;