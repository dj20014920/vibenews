-- Insert a sample news article for initial real data
INSERT INTO public.news_articles (
  title,
  summary,
  content,
  source_url,
  tags,
  author,
  published_at,
  thumbnail,
  is_featured,
  is_hidden
) VALUES (
  '테스트 뉴스: VibeNews 초기 게시물',
  'VibeNews에서 제공하는 테스트 뉴스입니다. 실데이터 연동 확인용으로 생성되었습니다.',
  '이 기사는 시스템 점검 및 데이터 연동 테스트를 위해 작성되었습니다. 기능 확인 후 언제든지 삭제 가능합니다.',
  'https://example.com/vibenews-test',
  ARRAY['AI','테스트','VibeNews'],
  'VibeNews Bot',
  now(),
  NULL,
  false,
  false
);
