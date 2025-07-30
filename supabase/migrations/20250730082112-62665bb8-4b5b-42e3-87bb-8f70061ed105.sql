-- Storage 버킷 생성 (보안 고려)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('post-images', 'post-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('news-images', 'news-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- 아바타 이미지 정책 (보안 강화)
CREATE POLICY "Public avatar access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND array_length(string_to_array(name, '/'), 1) = 2
);

CREATE POLICY "Users can update own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 게시글 이미지 정책 (악성 업로드 방지)
CREATE POLICY "Public post image access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own post images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own post images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 뉴스 이미지 정책 (관리자만 업로드)
CREATE POLICY "Public news image access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'news-images');

CREATE POLICY "Admins can upload news images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'news-images' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage news images" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'news-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- 보안 로깅 함수
CREATE OR REPLACE FUNCTION public.log_file_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    details,
    severity
  ) VALUES (
    auth.uid(),
    'file_upload',
    jsonb_build_object(
      'bucket', NEW.bucket_id,
      'file_name', NEW.name,
      'file_size', NEW.metadata->>'size',
      'mime_type', NEW.metadata->>'mimetype'
    ),
    'info'
  );
  RETURN NEW;
END;
$$;

-- 파일 업로드 트리거
CREATE TRIGGER file_upload_log
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_file_upload();

-- 더미 뉴스 데이터 삽입 (이미지 포함)
INSERT INTO public.news_articles (
  title,
  content,
  content_simplified,
  summary,
  source_url,
  thumbnail,
  author,
  tags,
  published_at,
  view_count,
  like_count
) VALUES 
(
  'Cursor IDE가 AI 코딩 혁신을 이끌다',
  'Cursor IDE가 최신 업데이트를 통해 AI 기반 코딩 경험을 한층 더 발전시켰습니다. 새로운 기능에는 실시간 코드 제안, 자동 리팩토링, 그리고 컨텍스트 인식 디버깅이 포함됩니다. 이러한 혁신적인 기능들은 개발자들의 생산성을 획기적으로 향상시키고 있으며, 특히 대규모 프로젝트에서 그 효과가 두드러지게 나타나고 있습니다.',
  'Cursor라는 코딩 도구가 AI 기술을 사용해서 프로그래밍을 더 쉽게 만들어주는 새로운 기능들을 추가했습니다. 이제 컴퓨터가 자동으로 코드를 제안해주고, 에러도 찾아서 고쳐줍니다.',
  'Cursor IDE의 AI 기반 새로운 기능들이 개발자 생산성을 크게 향상시키고 있습니다.',
  'https://cursor.com/updates',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop&crop=entropy&auto=format',
  'Tech Reporter',
  ARRAY['Cursor', 'AI', 'IDE', 'Productivity'],
  NOW() - INTERVAL '2 hours',
  1247,
  89
),
(
  'Lovable, 노코드 웹 개발의 새로운 표준을 제시하다',
  'Lovable이 React 기반 웹 애플리케이션을 코드 없이도 빠르게 개발할 수 있는 혁신적인 플랫폼으로 주목받고 있습니다. 사용자는 자연어 프롬프트만으로 복잡한 웹 애플리케이션을 구축할 수 있으며, 생성된 코드는 업계 표준을 준수합니다. 이는 비개발자도 전문적인 웹사이트를 만들 수 있게 해주는 게임 체인저입니다.',
  'Lovable이라는 도구는 코딩을 몰라도 웹사이트를 만들 수 있게 해줍니다. 말로 설명하면 컴퓨터가 알아서 웹사이트를 만들어주는 신기한 기술입니다.',
  'Lovable이 자연어로 웹 애플리케이션을 개발할 수 있는 노코드 플랫폼으로 화제가 되고 있습니다.',
  'https://lovable.dev/announcement',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop&crop=entropy&auto=format',
  'Innovation Weekly',
  ARRAY['Lovable', 'No-Code', 'Web Development', 'React'],
  NOW() - INTERVAL '5 hours',
  892,
  67
),
(
  'GitHub Copilot, 기업용 보안 기능 대폭 강화',
  'GitHub이 Copilot의 기업용 버전에서 보안 기능을 대폭 강화했다고 발표했습니다. 새로운 보안 검사 기능은 생성된 코드에서 잠재적인 보안 취약점을 실시간으로 감지하고 경고합니다. 또한 기업의 코딩 표준과 정책을 자동으로 적용하여 일관성 있는 코드베이스를 유지할 수 있게 합니다.',
  'GitHub Copilot이 회사에서 사용할 때 더 안전하게 만들어졌습니다. 이제 위험한 코드가 만들어지면 미리 알려주고, 회사 규칙에 맞는 코드만 만들어줍니다.',
  'GitHub Copilot 기업용 버전이 향상된 보안 기능과 정책 준수 기능을 도입했습니다.',
  'https://github.blog/copilot-enterprise-security',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&crop=entropy&auto=format',
  'GitHub Team',
  ARRAY['GitHub Copilot', 'Security', 'Enterprise', 'AI'],
  NOW() - INTERVAL '1 day',
  2341,
  156
),
(
  'Devin AI 에이전트, 실제 소프트웨어 프로젝트 완성 성과',
  'Cognition Labs의 Devin AI 에이전트가 실제 소프트웨어 개발 프로젝트를 end-to-end로 완성하는 놀라운 성과를 보여주었습니다. Devin은 요구사항 분석부터 코딩, 테스팅, 배포까지 전체 개발 과정을 자율적으로 수행했으며, 이는 AI가 단순한 코딩 도우미를 넘어 완전한 개발 파트너로 진화했음을 시사합니다.',
  'Devin이라는 AI가 사람 개발자처럼 혼자서 프로그램을 처음부터 끝까지 완성했습니다. 이는 AI가 단순히 도와주는 것이 아니라 진짜 개발자처럼 일할 수 있다는 것을 보여줍니다.',
  'Devin AI 에이전트가 완전한 소프트웨어 개발 프로젝트를 자율적으로 완성하는 획기적인 성과를 달성했습니다.',
  'https://cognition-labs.com/devin-breakthrough',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop&crop=entropy&auto=format',
  'AI Research Today',
  ARRAY['Devin', 'AI Agent', 'Autonomous Development', 'Innovation'],
  NOW() - INTERVAL '3 days',
  3456,
  234
);

-- 더미 커뮤니티 게시글 삽입 (이미지 포함)
INSERT INTO public.community_posts (
  author_id,
  title,
  content,
  content_simplified,
  tags,
  tools_used,
  view_count,
  like_count,
  comment_count
) VALUES 
(
  '00000000-0000-0000-0000-000000000000', -- 임시 사용자 ID
  'Cursor와 VS Code, 어느 것이 더 나을까요?',
  '최근 Cursor IDE로 갈아타려고 고민 중입니다. VS Code에서 GitHub Copilot을 사용해왔는데, Cursor의 AI 기능이 정말 그렇게 좋은지 궁금합니다. 실제로 사용해보신 분들의 경험담을 듣고 싶어요. 특히 대규모 프로젝트에서의 성능이나 안정성은 어떤지, 그리고 학습 곡선은 얼마나 되는지 알고 싶습니다.',
  'Cursor라는 새로운 코딩 도구와 기존의 VS Code 중에서 어떤 것이 더 좋은지 궁금합니다. 실제 사용 경험이 있으신 분들의 의견을 듣고 싶어요.',
  ARRAY['Cursor', 'VS Code', 'IDE', 'Comparison'],
  ARRAY['Cursor', 'VS Code', 'GitHub Copilot'],
  234,
  45,
  12
),
(
  '00000000-0000-0000-0000-000000000000',
  'Lovable로 첫 웹앱 만들어봤는데 놀랍네요!',
  '프로그래밍 완전 초보인데 Lovable로 간단한 할 일 관리 앱을 만들어봤습니다. 정말 신기하게도 자연어로 설명하니까 알아서 코드를 생성해주더라고요. 물론 완벽하지는 않지만, 이정도면 정말 대단한 것 같아요. 앞으로 더 복잡한 기능도 추가해보려고 합니다. 노코드 플랫폼의 미래가 밝아 보입니다.',
  '코딩을 모르는 초보자가 Lovable이라는 도구로 웹사이트를 만들어본 후기입니다. 말로만 설명해도 웹사이트가 만들어져서 정말 신기했어요.',
  ARRAY['Lovable', 'No-Code', 'Beginner', 'Web App'],
  ARRAY['Lovable'],
  156,
  28,
  8
),
(
  '00000000-0000-0000-0000-000000000000',
  'AI 코딩 도구 보안 이슈, 정말 안전한가요?',
  '회사에서 GitHub Copilot이나 Cursor 같은 AI 도구 사용을 검토 중인데, 보안 팀에서 우려를 표하고 있습니다. 특히 코드가 외부 서버로 전송되는 것과 관련해서 민감한 정보가 유출될 가능성을 걱정하고 있어요. 실제로 기업 환경에서 이런 도구들을 안전하게 사용하려면 어떤 점들을 고려해야 할까요?',
  'AI 코딩 도구들이 회사의 중요한 정보를 안전하게 보호할 수 있는지에 대한 질문입니다. 보안 전문가들의 의견을 듣고 싶어요.',
  ARRAY['Security', 'AI Tools', 'Enterprise', 'Privacy'],
  ARRAY['GitHub Copilot', 'Cursor', 'Enterprise Security'],
  89,
  15,
  6
),
(
  '00000000-0000-0000-0000-000000000000',
  'Windsurf 써보신 분 계신가요? 후기 궁금해요',
  'Windsurf라는 새로운 IDE에 대해 들어봤는데, 아직 사용해본 사람이 많지 않은 것 같아요. Cursor의 강력한 대안이 될 수 있을까요? 특히 멀티 파일 편집이나 프로젝트 전체 컨텍스트 이해 능력이 어느 정도인지 궁금합니다. 가격대는 좀 비싸지만 그만한 가치가 있는지 알고 싶어요.',
  'Windsurf라는 코딩 도구를 사용해본 분들의 경험담을 듣고 싶습니다. 다른 도구들과 비교해서 어떤 점이 좋은지 궁금해요.',
  ARRAY['Windsurf', 'IDE', 'Review', 'Comparison'],
  ARRAY['Windsurf', 'Cursor'],
  67,
  9,
  4
);