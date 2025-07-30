-- 더미 커뮤니티 게시글 삽입 (author_id를 NULL로 설정하여 익명 글로 처리)
INSERT INTO public.community_posts (
  author_id,
  anonymous_author_id,
  title,
  content,
  content_simplified,
  tags,
  tools_used,
  view_count,
  like_count,
  comment_count,
  is_anonymous
) VALUES 
(
  NULL,
  'AI_Developer_001',
  'Cursor와 VS Code, 어느 것이 더 나을까요?',
  '최근 Cursor IDE로 갈아타려고 고민 중입니다. VS Code에서 GitHub Copilot을 사용해왔는데, Cursor의 AI 기능이 정말 그렇게 좋은지 궁금합니다. 실제로 사용해보신 분들의 경험담을 듣고 싶어요. 특히 대규모 프로젝트에서의 성능이나 안정성은 어떤지, 그리고 학습 곡선은 얼마나 되는지 알고 싶습니다.',
  'Cursor라는 새로운 코딩 도구와 기존의 VS Code 중에서 어떤 것이 더 좋은지 궁금합니다. 실제 사용 경험이 있으신 분들의 의견을 듣고 싶어요.',
  ARRAY['Cursor', 'VS Code', 'IDE', 'Comparison'],
  ARRAY['Cursor', 'VS Code', 'GitHub Copilot'],
  234,
  45,
  12,
  true
),
(
  NULL,
  'NoCode_Enthusiast',
  'Lovable로 첫 웹앱 만들어봤는데 놀랍네요!',
  '프로그래밍 완전 초보인데 Lovable로 간단한 할 일 관리 앱을 만들어봤습니다. 정말 신기하게도 자연어로 설명하니까 알아서 코드를 생성해주더라고요. 물론 완벽하지는 않지만, 이정도면 정말 대단한 것 같아요. 앞으로 더 복잡한 기능도 추가해보려고 합니다. 노코드 플랫폼의 미래가 밝아 보입니다.',
  '코딩을 모르는 초보자가 Lovable이라는 도구로 웹사이트를 만들어본 후기입니다. 말로만 설명해도 웹사이트가 만들어져서 정말 신기했어요.',
  ARRAY['Lovable', 'No-Code', 'Beginner', 'Web App'],
  ARRAY['Lovable'],
  156,
  28,
  8,
  true
),
(
  NULL,
  'Security_Expert',
  'AI 코딩 도구 보안 이슈, 정말 안전한가요?',
  '회사에서 GitHub Copilot이나 Cursor 같은 AI 도구 사용을 검토 중인데, 보안 팀에서 우려를 표하고 있습니다. 특히 코드가 외부 서버로 전송되는 것과 관련해서 민감한 정보가 유출될 가능성을 걱정하고 있어요. 실제로 기업 환경에서 이런 도구들을 안전하게 사용하려면 어떤 점들을 고려해야 할까요?',
  'AI 코딩 도구들이 회사의 중요한 정보를 안전하게 보호할 수 있는지에 대한 질문입니다. 보안 전문가들의 의견을 듣고 싶어요.',
  ARRAY['Security', 'AI Tools', 'Enterprise', 'Privacy'],
  ARRAY['GitHub Copilot', 'Cursor', 'Enterprise Security'],
  89,
  15,
  6,
  true
),
(
  NULL,
  'Tech_Reviewer',
  'Windsurf 써보신 분 계신가요? 후기 궁금해요',
  'Windsurf라는 새로운 IDE에 대해 들어봤는데, 아직 사용해본 사람이 많지 않은 것 같아요. Cursor의 강력한 대안이 될 수 있을까요? 특히 멀티 파일 편집이나 프로젝트 전체 컨텍스트 이해 능력이 어느 정도인지 궁금합니다. 가격대는 좀 비싸지만 그만한 가치가 있는지 알고 싶어요.',
  'Windsurf라는 코딩 도구를 사용해본 분들의 경험담을 듣고 싶습니다. 다른 도구들과 비교해서 어떤 점이 좋은지 궁금해요.',
  ARRAY['Windsurf', 'IDE', 'Review', 'Comparison'],
  ARRAY['Windsurf', 'Cursor'],
  67,
  9,
  4,
  true
);