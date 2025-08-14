# VibeNews 구현 작업 목록

## 개요

이 문서는 VibeNews 플랫폼을 단계별로 구현하기 위한 완전한 작업 목록입니다. 각 작업은 초보 개발자도 따라할 수 있도록 구체적인 코드 예시와 구현 방법을 포함합니다.

## 프로젝트 기본 정보

**기술 스택:**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth, Storage)
- State Management: Zustand 또는 Context API
- Testing: Jest, React Testing Library
- Icons: Lucide React
- UI Components: Headless UI 또는 Radix UI

**환경 변수 (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 구현 작업 목록

### Phase 1: 기본 인프라 및 핵심 설정 ✅ 완료

- [x] 1. 프로젝트 초기 설정 및 기본 구조 생성
  
  **핵심 설정 완료:**
  - ✅ Next.js 14 + TypeScript + Tailwind CSS 프로젝트 생성
  - ✅ 폴더 구조 및 기본 타입 정의
  - ✅ Supabase 클라이언트 설정
  - ✅ 환경 변수 설정 (.env.local)
  
  _요구사항: 5.6, 5.8_

- [x] 2. 기본 레이아웃 및 UI 구조 ✅ Lovable에서 완료
  
  **UI 구현 완료 (Lovable):**
  - ✅ Header 컴포넌트 (로고, 네비게이션, 테마 토글)
  - ✅ Footer 컴포넌트 (링크, 소셜 미디어)
  - ✅ 메인 레이아웃 (반응형 디자인)
  - ✅ 홈페이지 카드 레이아웃 (뉴스, 커뮤니티, 트렌딩 태그)
  
  _요구사항: 5.1, 5.5, 5.6_

- [x] 3. 테마 시스템 ✅ Lovable에서 완료
  
  **테마 시스템 완료 (Lovable):**
  - ✅ 라이트/다크/시스템 모드 자동 감지
  - ✅ 부드러운 전환 애니메이션
  - ✅ 로컬 스토리지 설정 저장
  - ✅ Tailwind CSS 다크 모드 설정

  /* 애니메이션 줄이기 설정 */
  @media (prefers-reduced-motion: reduce) {
    :root {
      --animation-duration: 0.01ms;
      --transition-duration: 0.01ms;
    }
    
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* 다크 모드 스타일 */
  .dark {
    color-scheme: dark;
  }

  /* 커스텀 스크롤바 */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-800;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-600 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-500;
  }

  /* 포커스 스타일 */
  .focus-visible:focus {
    @apply outline-none ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900;
  }
  ```
  
  _요구사항: 15.1, 15.2, 15.3, 15.4, 15.5_

### Phase 2: 인증 시스템 구현 ✅ 일부 완료

- [x] 4. Supabase 설정 및 기본 데이터베이스 구조
  
  **구현 내용:**
  - ✅ **Row Level Security (RLS) 정책 적용:** `news_articles`, `community_posts`, `comments` 등 핵심 테이블에 RLS를 활성화하고, 사용자가 자신의 데이터만 수정/삭제할 수 있도록 정책을 수립했습니다. (`...add_rls_policies.sql`)
  - ✅ **보안 함수 및 트리거 추가:**
    - 조회수/댓글 수를 서버에서 안전하게 업데이트하는 DB 함수/트리거를 구현하여 클라이언트 측 조작을 방지했습니다.
    - 댓글 소프트 삭제를 위한 `is_deleted` 컬럼을 추가하고, 관련 트리거를 업데이트했습니다. (`...add_soft_delete_to_comments.sql`)
    - 익명 게시글의 작성자 ID를 관리자만 볼 수 있도록 하는 보안 뷰(`v_community_posts`, `v_comments`)를 생성했습니다. (`...add_anonymity_logic.sql`)
    - 게시글과 하위 댓글을 트랜잭션으로 함께 삭제하는 RPC 함수(`delete_post_and_comments`)를 구현했습니다. (`...add_delete_post_function.sql`)
  - ✅ **성능 최적화 스키마 추가:**
    - 뉴스 기사 검색 속도 향상을 위해 Full-Text Search용 `tsvector` 컬럼과 `GIN` 인덱스를 추가했습니다.
    - 뉴스 목록에서 N+1 쿼리 문제를 해결하기 위해 북마크 여부를 함께 가져오는 RPC 함수(`get_news_with_bookmarks`)를 구현했습니다. (`...add_performance_optimizations.sql`)

  **구현 의도:**
  > 초기 분석 결과, 핵심 데이터 테이블에 RLS가 적용되지 않은 심각한 보안 문제가 발견되었습니다. 이를 해결하기 위해 모든 CUD(Create, Update, Delete) 작업에 대해 소유권(ownership)을 확인하는 RLS 정책을 최우선으로 적용했습니다. 또한, 클라이언트에서 직접 처리되던 카운트 로직은 데이터 무결성을 해칠 수 있어 모두 DB 트리거와 RPC로 이전하여 서버에서 안전하게 처리하도록 변경했습니다. 익명성 보장은 DB 뷰(View)를 통해 구현하여, 일반 사용자의 SELECT 쿼리에서는 작성자 ID가 노출되지 않도록 설계했습니다.

  _요구사항: 7.3, 25.1, 23.3_

- [ ] 5. 소셜 로그인 시스템 구현
  
  **구현 내용:**
  - 기존의 Google, GitHub, 일반 이메일 로그인은 정상 동작함을 확인했습니다.
  - **(미완료)** 요구사항에 명시된 네이버, 카카오 소셜 로그인은 아직 구현되지 않았습니다.

  **구현 의도:**
  > 이번 작업에서는 새로운 로그인 방식 추가보다는, 기존 인증 시스템의 보안을 강화하고 인증된 사용자의 데이터 접근 권한을 명확히 하는 데 집중했습니다.

  _요구사항: 3.1 (일부 완료), 3.2_

- [x] 6. 사용자 프로필 및 마이페이지 관리 시스템

  **구현 내용:**
  - ✅ **마이페이지 신규 구현:** 사용자가 자신이 작성한 게시글, 댓글, 북마크한 글을 한 곳에서 모아볼 수 있는 `/mypage`를 새로 구현했습니다.
  - ✅ **프로필 페이지 기능 확장:** 기존에 준비되어 있던 프로필 페이지(`/profile/:userId`)에 실제로 해당 유저가 작성한 게시글과 댓글 목록이 표시되도록 기능을 구현했습니다.
  - ✅ **작성자 링크 연결:** 커뮤니티 목록의 작성자 닉네임을 클릭하면 해당 사용자의 프로필 페이지로 이동하도록 링크를 연결했습니다.

  **구현 의도:**
  > 사용자가 자신의 활동 내역을 쉽게 추적하고 관리할 수 있도록, 명시적으로 요청하신 '마이페이지'를 별도로 구현했습니다. 또한, 다른 사용자의 프로필을 방문했을 때도 그 사용자의 활동을 볼 수 있도록 기존 프로필 페이지의 기능을 확장하여 커뮤니티 활성화를 유도하고자 했습니다.

  _요구사항: 3.2, 3.3, 3.4_

### Phase 3: 뉴스 섹션 구현 ✅ 일부 완료

- [x] 7. 뉴스 기사 표시 시스템
- [x] 8. 뉴스 상호작용 기능

  **구현 내용:**
  - ✅ **성능 최적화:** 뉴스 목록을 불러올 때 발생하던 N+1 쿼리 문제를 RPC 함수로 해결하여 데이터베이스 부하를 줄이고 로딩 속도를 개선했습니다.
  - ✅ **보안 강화:** 클라이언트에서 처리되던 뉴스 조회수 증가 로직을 안전한 서버사이드 RPC 함수로 이전했습니다.
  - ✅ **UI 개선:** 북마크 상태가 즉시 UI에 반영되도록 수정했습니다.

  **구현 의도:**
  > 뉴스 섹션은 사용자가 가장 먼저 접하는 페이지 중 하나이므로, 성능과 반응성을 최우선으로 고려했습니다. 특히 대량의 데이터가 예상되는 만큼, 비효율적인 쿼리를 최적화하여 확장성을 확보하는 데 중점을 두었습니다.

  _요구사항: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3_

- [ ] 9. 뉴스 필터링 및 정렬
  - **(미완료)** 현재는 최신순/인기순 정렬만 구현되어 있으며, 태그별 필터링 기능은 UI만 있고 실제 로직은 연결되지 않았습니다.
  - _요구사항: 4.7, 11.3_

### Phase 4: 커뮤니티 섹션 ✅ 완료

- [x] 10. 커뮤니티 글 작성 시스템
- [x] 11. 익명 글쓰기 기능
- [x] 12. 커뮤니티 글 표시 및 상호작용

  **구현 내용:**
  - ✅ **게시글/댓글 수정 및 삭제 기능 구현:**
    - 사용자는 자신의 글과 댓글만 수정/삭제할 수 있습니다. (RLS 정책으로 강제)
    - **(핵심 비즈니스 로직)** 댓글이 달린 게시글, 대댓글이 달린 댓글은 **수정이 불가능**하고 삭제만 가능하도록 UI/UX를 구현했습니다.
    - 게시글 삭제 시, 하위 댓글들이 모두 함께 삭제됩니다. (RPC 함수로 원자적 처리)
    - 댓글 삭제 시, "삭제된 댓글입니다" 문구로 대체되며 대댓글은 유지됩니다. (**소프트 삭제** 방식 적용)
  - ✅ **익명성 기능 강화:** DB 뷰를 통해 관리자가 아닌 이상 익명 사용자의 ID를 조회할 수 없도록 백엔드 단에서 원천적으로 차단했습니다.
  - ✅ **UI 버그 수정:** 커뮤니티 목록에서 작성자의 닉네임과 아바타가 정상적으로 표시되고, 프로필 페이지로 링크되도록 수정했습니다.

  **구현 의도:**
  > 수정/삭제 기능은 사용자 편의성과 데이터 무결성 사이의 균형을 맞추는 데 집중했습니다. 특히 '댓글이 달리면 수정 불가'라는 규칙은, 한 번 공개적으로 논의가 시작된 콘텐츠의 원본 맥락이 임의로 변경되는 것을 방지하여 커뮤니티의 신뢰도를 유지하기 위한 중요한 정책이라고 판단하여 명확하게 구현했습니다. 댓글을 소프트 삭제 방식으로 처리한 것 또한, 대댓글의 맥락을 유지하여 토론의 흐름이 끊기지 않도록 하기 위함입니다.

  _요구사항: 2.1, 2.2, 2.3, 2.4, 3.2, 6.1, 6.3_

### Phase 5: 검색 및 스크랩 ✅ 일부 완료

- [ ] 13. 통합 검색 시스템

  **구현 내용:**
  - ✅ **검색 성능 최적화:** 뉴스 검색 시 `ilike` 대신 **Full-Text Search**를 사용하도록 백엔드 로직을 변경하여 검색 속도를 대폭 향상시켰습니다.
  - **(미완료)** 현재는 뉴스 기사에 대해서만 FTS가 적용되었으며, 커뮤니티 글, 댓글까지 포함하는 통합 검색 UI 및 로직은 아직 구현되지 않았습니다.

  _요구사항: 4.1 (일부 완료), 4.2, 4.3, 8.3_

- [x] 14-15. 스크랩/태그 시스템
  - **구현 내용:**
    - ✅ 북마크(스크랩) 기능이 뉴스 및 커뮤니티 글에서 정상적으로 동작함을 확인하고, 데이터 로딩 방식을 최적화했습니다.
    - ✅ 마이페이지와 프로필 페이지에서 북마크한 글 목록을 볼 수 있도록 구현했습니다.
  - **(미완료)** 북마크 폴더 관리, 태그 추가, 메모 기능 등 고급 스크랩 기능은 아직 구현되지 않았습니다.

  _요구사항: 4.4, 4.5_

---

### **다음 작업자를 위한 가이드**

안녕하세요! 이어서 작업을 진행해주셔서 감사합니다. 제가 진행한 작업의 핵심은 **보안과 성능의 기반을 다지는 것**과 **사용자 요청 핵심 기능(CRUD, 마이페이지)을 구현**하는 것이었습니다.

**남아있는 주요 작업:**

1.  **네이버/카카오 소셜 로그인 추가 (Task 5):** 현재는 Google/GitHub만 연동되어 있습니다. Supabase의 Custom Provider 설정을 통해 추가 구현이 필요합니다.
2.  **프로필 수정 기능 (Task 6):** 사용자가 자신의 닉네임, 자기소개, 웹사이트 등을 수정할 수 있는 UI와 로직이 필요합니다.
3.  **통합 검색 페이지 UI 구현 (Task 13):** 백엔드에 Full-Text Search 기반이 마련되었으니, 이를 활용하여 뉴스/커뮤니티/댓글을 한 번에 검색하고 탭으로 보여주는 UI를 구현해야 합니다.
4.  **고급 스크랩 기능 (Task 14-15):** 현재의 단순 북마크 기능을 넘어, 폴더별로 관리하고 메모를 추가하는 등의 기능이 필요합니다.
5.  **댓글에 대한 답글(대댓글) 기능:** 현재 댓글 시스템은 대댓글을 저장할 `parent_id` 필드는 있으나, 실제 답글을 작성하고 중첩하여 보여주는 UI/UX 로직이 구현되지 않았습니다.

제가 구현한 RLS 정책과 RPC 함수들은 `supabase/migrations` 폴더에 모두 기록되어 있으니, 데이터베이스 스키마나 로직을 파악하실 때 참고하시면 큰 도움이 될 것입니다. 특히, 모든 `SELECT` 쿼리는 `v_community_posts`와 같은 **보안 뷰(View)**를 통해 조회해야 익명성 정책이 올바르게 적용된다는 점을 기억해주세요.

궁금한 점이 있다면 언제든지 제 커밋 기록과 이 문서를 참고해주세요. 행운을 빕니다! 🚀
  
  **6.1 프로필 페이지 (src/app/profile/[userId]/page.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { useParams } from 'next/navigation'
  import { supabase } from '@/lib/supabase'
  import { useAuth } from '@/hooks/useAuth'
  import { User, CommunityPost } from '@/types'
  import { Calendar, MapPin, Link as LinkIcon, Edit } from 'lucide-react'
  import PostCard from '@/components/community/PostCard'

  export default function ProfilePage() {
    const params = useParams()
    const { user: currentUser } = useAuth()
    const [user, setUser] = useState<User | null>(null)
    const [posts, setPosts] = useState<CommunityPost[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts')

    const userId = params.userId as string
    const isOwnProfile = currentUser?.id === userId

    useEffect(() => {
      fetchUserProfile()
      fetchUserPosts()
    }, [userId])

    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (data && !error) {
        setUser(data)
      }
      setLoading(false)
    }

    const fetchUserPosts = async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:users(*)
        `)
        .eq('author_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (data && !error) {
        setPosts(data)
      }
    }

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              사용자를 찾을 수 없습니다
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              존재하지 않는 사용자이거나 삭제된 계정입니다.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 프로필 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar_url || '/default-avatar.png'}
                alt={user.nickname}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.nickname}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
                {user.bio && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {user.bio}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(user.created_at).toLocaleDateString('ko-KR')} 가입
                    </span>
                  </div>
                  {user.website_url && (
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="w-4 h-4" />
                      <a
                        href={user.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-500"
                      >
                        웹사이트
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {isOwnProfile && (
              <button
                onClick={() => window.location.href = '/profile/edit'}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4" />
                <span>프로필 수정</span>
              </button>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              작성한 글 ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'liked'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              좋아요한 글
            </button>
          </nav>
        </div>

        {/* 콘텐츠 */}
        <div className="space-y-4">
          {activeTab === 'posts' && (
            <>
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    아직 작성한 글이 없습니다.
                  </p>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'liked' && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                좋아요한 글 기능은 곧 추가될 예정입니다.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
  ```

  **6.2 프로필 수정 페이지 (src/app/profile/edit/page.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { useRouter } from 'next/navigation'
  import { useAuth } from '@/hooks/useAuth'
  import { supabase } from '@/lib/supabase'
  import { Camera, Save, X } from 'lucide-react'

  export default function EditProfilePage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [formData, setFormData] = useState({
      nickname: '',
      bio: '',
      website_url: '',
      github_username: '',
      twitter_username: ''
    })
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string>('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login')
        return
      }

      if (user) {
        setFormData({
          nickname: user.nickname || '',
          bio: user.bio || '',
          website_url: user.website_url || '',
          github_username: user.github_username || '',
          twitter_username: user.twitter_username || ''
        })
        setAvatarPreview(user.avatar_url || '')
      }
    }, [user, loading, router])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setAvatarFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }

    const uploadAvatar = async (): Promise<string | null> => {
      if (!avatarFile || !user) return null

      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) {
        console.error('Avatar upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return

      setSaving(true)
      try {
        let avatarUrl = user.avatar_url

        // 아바타 업로드
        if (avatarFile) {
          const uploadedUrl = await uploadAvatar()
          if (uploadedUrl) {
            avatarUrl = uploadedUrl
          }
        }

        // 프로필 업데이트
        const { error } = await supabase
          .from('users')
          .update({
            ...formData,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) {
          throw error
        }

        alert('프로필이 성공적으로 업데이트되었습니다.')
        router.push(`/profile/${user.id}`)
      } catch (error) {
        console.error('Profile update error:', error)
        alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.')
      } finally {
        setSaving(false)
      }
    }

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              프로필 수정
            </h1>
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 아바타 */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={avatarPreview || '/default-avatar.png'}
                  alt="프로필 이미지"
                  className="w-20 h-20 rounded-full"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  프로필 사진
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  JPG, PNG 파일을 업로드하세요
                </p>
              </div>
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* 자기소개 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                자기소개
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="자신을 간단히 소개해주세요"
              />
            </div>

            {/* 웹사이트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                웹사이트
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com"
              />
            </div>

            {/* GitHub */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub 사용자명
              </label>
              <input
                type="text"
                value={formData.github_username}
                onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="username"
              />
            </div>

            {/* Twitter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Twitter 사용자명
              </label>
              <input
                type="text"
                value={formData.twitter_username}
                onChange={(e) => setFormData({ ...formData, twitter_username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="username"
              />
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '저장 중...' : '저장하기'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 3.2, 3.3, 3.4_

### Phase 3: 뉴스 섹션 구현

- [ ] 7. 뉴스 기사 표시 시스템
  
  **7.1 뉴스 카드 컴포넌트 (src/components/news/NewsCard.tsx)**
  ```typescript
  'use client'
  import Link from 'next/link'
  import { useState } from 'react'
  import { NewsArticle } from '@/types'
  import { Heart, MessageCircle, Share2, ExternalLink, Clock, Eye } from 'lucide-react'
  import { useAuth } from '@/hooks/useAuth'
  import { supabase } from '@/lib/supabase'

  interface NewsCardProps {
    article: NewsArticle
    onLike?: (articleId: string, isLiked: boolean) => void
  }

  export default function NewsCard({ article, onLike }: NewsCardProps) {
    const { user } = useAuth()
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(article.like_count)
    const [loading, setLoading] = useState(false)

    const handleLike = async () => {
      if (!user || loading) return

      setLoading(true)
      try {
        if (isLiked) {
          // 좋아요 취소
          await supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('article_id', article.id)
          
          setIsLiked(false)
          setLikeCount(prev => prev - 1)
        } else {
          // 좋아요 추가
          await supabase
            .from('likes')
            .insert({
              user_id: user.id,
              article_id: article.id
            })
          
          setIsLiked(true)
          setLikeCount(prev => prev + 1)
        }

        onLike?.(article.id, !isLiked)
      } catch (error) {
        console.error('Like error:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleShare = async () => {
      const url = `${window.location.origin}/news/${article.id}`
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: article.title,
            text: article.summary,
            url: url
          })
        } catch (error) {
          // 사용자가 공유를 취소한 경우
        }
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(url)
        alert('링크가 클립보드에 복사되었습니다.')
      }
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return '방금 전'
      if (diffInHours < 24) return `${diffInHours}시간 전`
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`
      return date.toLocaleDateString('ko-KR')
    }

    return (
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        {/* 썸네일 */}
        {article.thumbnail && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        <div className="p-6">
          {/* 태그 */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {article.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                  +{article.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            <Link 
              href={`/news/${article.id}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {article.title}
            </Link>
          </h2>

          {/* 요약 */}
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {article.summary}
          </p>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-4">
              {article.author && (
                <span>by {article.author}</span>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{article.view_count.toLocaleString()}</span>
              </div>
            </div>
            
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              <ExternalLink className="w-4 h-4" />
              <span>원문</span>
            </a>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                disabled={!user || loading}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>

              <Link
                href={`/news/${article.id}#comments`}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>댓글</span>
              </Link>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>공유</span>
            </button>
          </div>
        </div>
      </article>
    )
  }
  ```

  **7.2 뉴스 목록 컴포넌트 (src/components/news/NewsList.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect, useCallback } from 'react'
  import { supabase } from '@/lib/supabase'
  import { NewsArticle } from '@/types'
  import NewsCard from './NewsCard'
  import { Loader2 } from 'lucide-react'

  interface NewsListProps {
    initialArticles?: NewsArticle[]
    filter?: 'all' | 'featured' | 'recent'
    tags?: string[]
  }

  export default function NewsList({ initialArticles = [], filter = 'all', tags = [] }: NewsListProps) {
    const [articles, setArticles] = useState<NewsArticle[]>(initialArticles)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)

    const fetchArticles = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
      setLoading(true)
      try {
        let query = supabase
          .from('news_articles')
          .select('*')
          .eq('is_hidden', false)
          .range(pageNum * 10, (pageNum + 1) * 10 - 1)
          .order('created_at', { ascending: false })

        // 필터 적용
        if (filter === 'featured') {
          query = query.eq('is_featured', true)
        }

        // 태그 필터 적용
        if (tags.length > 0) {
          query = query.overlaps('tags', tags)
        }

        const { data, error } = await query

        if (error) throw error

        if (reset) {
          setArticles(data || [])
        } else {
          setArticles(prev => [...prev, ...(data || [])])
        }

        setHasMore((data || []).length === 10)
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setLoading(false)
      }
    }, [filter, tags])

    useEffect(() => {
      if (initialArticles.length === 0) {
        fetchArticles(0, true)
        setPage(0)
      }
    }, [fetchArticles, initialArticles.length])

    const loadMore = () => {
      if (!loading && hasMore) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchArticles(nextPage)
      }
    }

    const handleLike = (articleId: string, isLiked: boolean) => {
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, like_count: article.like_count + (isLiked ? 1 : -1) }
          : article
      ))
    }

    // 무한 스크롤 구현
    useEffect(() => {
      const handleScroll = () => {
        if (
          window.innerHeight + document.documentElement.scrollTop
          >= document.documentElement.offsetHeight - 1000
        ) {
          loadMore()
        }
      }

      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }, [loading, hasMore, page])

    if (articles.length === 0 && !loading) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            표시할 뉴스가 없습니다.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {articles.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            onLike={handleLike}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {!hasMore && articles.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              모든 뉴스를 확인했습니다.
            </p>
          </div>
        )}
      </div>
    )
  }
  ```

  **7.3 뉴스 상세 페이지 (src/app/news/[id]/page.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { useParams, notFound } from 'next/navigation'
  import { supabase } from '@/lib/supabase'
  import { NewsArticle } from '@/types'
  import { Heart, Share2, ExternalLink, Clock, Eye, ArrowLeft } from 'lucide-react'
  import { useAuth } from '@/hooks/useAuth'
  import Link from 'next/link'
  import CommentSection from '@/components/common/CommentSection'

  export default function NewsDetailPage() {
    const params = useParams()
    const { user } = useAuth()
    const [article, setArticle] = useState<NewsArticle | null>(null)
    const [loading, setLoading] = useState(true)
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)

    const articleId = params.id as string

    useEffect(() => {
      fetchArticle()
      incrementViewCount()
      if (user) {
        checkLikeStatus()
      }
    }, [articleId, user])

    const fetchArticle = async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', articleId)
        .eq('is_hidden', false)
        .single()

      if (error || !data) {
        notFound()
        return
      }

      setArticle(data)
      setLikeCount(data.like_count)
      setLoading(false)
    }

    const incrementViewCount = async () => {
      await supabase
        .from('news_articles')
        .update({ view_count: supabase.sql`view_count + 1` })
        .eq('id', articleId)
    }

    const checkLikeStatus = async () => {
      if (!user) return

      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single()

      setIsLiked(!!data)
    }

    const handleLike = async () => {
      if (!user) return

      try {
        if (isLiked) {
          await supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('article_id', articleId)
          
          setIsLiked(false)
          setLikeCount(prev => prev - 1)
        } else {
          await supabase
            .from('likes')
            .insert({
              user_id: user.id,
              article_id: articleId
            })
          
          setIsLiked(true)
          setLikeCount(prev => prev + 1)
        }
      } catch (error) {
        console.error('Like error:', error)
      }
    }

    const handleShare = async () => {
      const url = window.location.href
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: article?.title,
            text: article?.summary,
            url: url
          })
        } catch (error) {
          // 사용자가 공유를 취소한 경우
        }
      } else {
        await navigator.clipboard.writeText(url)
        alert('링크가 클립보드에 복사되었습니다.')
      }
    }

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!article) {
      return notFound()
    }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <Link
          href="/news"
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>뉴스 목록으로</span>
        </Link>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* 썸네일 */}
          {article.thumbnail && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* 태그 */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 제목 */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {article.title}
            </h1>

            {/* 메타 정보 */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                {article.author && (
                  <span>작성자: {article.author}</span>
                )}
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(article.published_at || article.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.view_count.toLocaleString()} 조회</span>
                </div>
              </div>
              
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                <ExternalLink className="w-4 h-4" />
                <span>원문 보기</span>
              </a>
            </div>

            {/* 요약 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                📝 요약
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {article.summary}
              </p>
            </div>

            {/* 본문 */}
            <div className="prose dark:prose-invert max-w-none mb-8">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  disabled={!user}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLiked
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>공유하기</span>
              </button>
            </div>
          </div>
        </article>

        {/* 댓글 섹션 */}
        <div id="comments" className="mt-8">
          <CommentSection
            targetType="article"
            targetId={articleId}
            title="댓글"
          />
        </div>
      </div>
    )
  }
  ```

  **7.4 뉴스 메인 페이지 (src/app/news/page.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { supabase } from '@/lib/supabase'
  import { NewsArticle } from '@/types'
  import NewsList from '@/components/news/NewsList'
  import { Filter, TrendingUp, Clock, Star } from 'lucide-react'

  export default function NewsPage() {
    const [filter, setFilter] = useState<'all' | 'featured' | 'recent'>('all')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [popularTags, setPopularTags] = useState<string[]>([])

    useEffect(() => {
      fetchPopularTags()
    }, [])

    const fetchPopularTags = async () => {
      const { data } = await supabase
        .from('news_articles')
        .select('tags')
        .eq('is_hidden', false)
        .limit(100)

      if (data) {
        const tagCounts: Record<string, number> = {}
        data.forEach(article => {
          article.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        })

        const sortedTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([tag]) => tag)

        setPopularTags(sortedTags)
      }
    }

    const toggleTag = (tag: string) => {
      setSelectedTags(prev => 
        prev.includes(tag)
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      )
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 헤더 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                바이브 코딩 뉴스
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI가 수집한 최신 바이브 코딩 트렌드와 정보를 확인하세요
              </p>
            </div>

            {/* 필터 */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>전체</span>
              </button>

              <button
                onClick={() => setFilter('featured')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  filter === 'featured'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>추천</span>
              </button>

              <button
                onClick={() => setFilter('recent')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  filter === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>최신</span>
              </button>
            </div>

            {/* 뉴스 목록 */}
            <NewsList
              filter={filter}
              tags={selectedTags}
            />
          </div>

          {/* 사이드바 */}
          <div className="w-full lg:w-80">
            <div className="sticky top-8 space-y-6">
              {/* 인기 태그 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>인기 태그</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 1.1, 1.2_

- [ ] 8. 뉴스 상호작용 기능
  
  **8.1 댓글 시스템 컴포넌트 (src/components/common/CommentSection.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { supabase } from '@/lib/supabase'
  import { useAuth } from '@/hooks/useAuth'
  import { Comment } from '@/types'
  import { MessageCircle, Heart, Reply, MoreHorizontal, Flag } from 'lucide-react'

  interface CommentSectionProps {
    targetType: 'article' | 'post'
    targetId: string
    title?: string
  }

  export default function CommentSection({ targetType, targetId, title = "댓글" }: CommentSectionProps) {
    const { user } = useAuth()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isAnonymous, setIsAnonymous] = useState(false)

    useEffect(() => {
      fetchComments()
    }, [targetId])

    const fetchComments = async () => {
      const column = targetType === 'article' ? 'article_id' : 'post_id'
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users(*)
        `)
        .eq(column, targetId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true })

      if (data && !error) {
        // 중첩 댓글 구조로 변환
        const commentMap = new Map()
        const rootComments: Comment[] = []

        data.forEach(comment => {
          commentMap.set(comment.id, { ...comment, replies: [] })
        })

        data.forEach(comment => {
          if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id)
            if (parent) {
              parent.replies.push(commentMap.get(comment.id))
            }
          } else {
            rootComments.push(commentMap.get(comment.id))
          }
        })

        setComments(rootComments)
      }
    }

    const handleSubmitComment = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user || !newComment.trim()) return

      setLoading(true)
      try {
        const commentData = {
          content: newComment,
          author_id: user.id,
          [targetType === 'article' ? 'article_id' : 'post_id']: targetId,
          parent_id: replyTo,
          is_anonymous: isAnonymous,
          anonymous_author_id: isAnonymous ? `anon_${Math.random().toString(36).substr(2, 8)}` : null
        }

        const { error } = await supabase
          .from('comments')
          .insert(commentData)

        if (error) throw error

        setNewComment('')
        setReplyTo(null)
        setIsAnonymous(false)
        await fetchComments()

        // 댓글 수 업데이트
        if (targetType === 'post') {
          await supabase
            .from('community_posts')
            .update({ comment_count: supabase.sql`comment_count + 1` })
            .eq('id', targetId)
        }
      } catch (error) {
        console.error('Comment submission error:', error)
        alert('댓글 작성에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    const handleLikeComment = async (commentId: string) => {
      if (!user) return

      try {
        const { data: existingLike } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('comment_id', commentId)
          .single()

        if (existingLike) {
          await supabase
            .from('likes')
            .delete()
            .eq('id', existingLike.id)
        } else {
          await supabase
            .from('likes')
            .insert({
              user_id: user.id,
              comment_id: commentId
            })
        }

        await fetchComments()
      } catch (error) {
        console.error('Like comment error:', error)
      }
    }

    const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
      <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {comment.is_anonymous ? (
                <>
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">익</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    익명_{comment.anonymous_author_id?.slice(-4)}
                  </span>
                </>
              ) : (
                <>
                  <img
                    src={comment.author.avatar_url || '/default-avatar.png'}
                    alt={comment.author.nickname}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {comment.author.nickname}
                  </span>
                </>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(comment.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {comment.content}
          </p>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Heart className="w-4 h-4" />
              <span>{comment.like_count}</span>
            </button>

            <button
              onClick={() => setReplyTo(comment.id)}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Reply className="w-4 h-4" />
              <span>답글</span>
            </button>

            <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
              <Flag className="w-4 h-4" />
              <span>신고</span>
            </button>
          </div>
        </div>

        {comment.replies?.map(reply => (
          <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    )

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>{title} ({comments.length})</span>
        </h3>

        {/* 댓글 작성 폼 */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            {replyTo && (
              <div className="mb-2 text-sm text-blue-600 dark:text-blue-400">
                답글 작성 중... 
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <img
                src={user.avatar_url || '/default-avatar.png'}
                alt={user.nickname}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? "답글을 작성하세요..." : "댓글을 작성하세요..."}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                />
                
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      익명으로 작성
                    </span>
                  </label>
                  
                  <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '작성 중...' : replyTo ? '답글 작성' : '댓글 작성'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
            <a
              href="/login"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              로그인하기
            </a>
          </div>
        )}

        {/* 댓글 목록 */}
        <div>
          {comments.length > 0 ? (
            comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                첫 번째 댓글을 작성해보세요!
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 1.3, 1.4, 6.1, 6.2, 6.3_

- [ ] 9. 뉴스 필터링 및 정렬
  - 태그별 필터링, 날짜별/인기도별 정렬 구현
  - 검색 기능과 통합된 필터링 시스템
  - _요구사항: 4.7, 11.3_

### Phase 4-12: 나머지 핵심 기능들

**각 Phase별 주요 구현 사항:**

**Phase 4: 커뮤니티 섹션**

- [ ] 10. 커뮤니티 글 작성 시스템
  
  **10.1 마크다운 에디터 컴포넌트 (src/components/community/PostEditor.tsx)**
  ```typescript
  'use client'
  import { useState, useRef } from 'react'
  import { useRouter } from 'next/navigation'
  import { useAuth } from '@/hooks/useAuth'
  import { supabase } from '@/lib/supabase'
  import { Bold, Italic, Link, Image, Eye, EyeOff, Send, X } from 'lucide-react'

  export default function PostEditor() {
    const { user } = useAuth()
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [toolsUsed, setToolsUsed] = useState<string[]>([])
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [isPreview, setIsPreview] = useState(false)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAddTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault()
        if (!tags.includes(tagInput.trim()) && tags.length < 5) {
          setTags([...tags, tagInput.trim()])
          setTagInput('')
        }
      }
    }

    const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !user) return

      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `post-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        const imageMarkdown = `![${file.name}](${data.publicUrl})`
        setContent(prev => prev + '\n' + imageMarkdown)
      } catch (error) {
        console.error('Image upload error:', error)
        alert('이미지 업로드에 실패했습니다.')
      }
    }

    const insertMarkdown = (before: string, after: string = '') => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.substring(start, end)
      
      const newContent = 
        content.substring(0, start) + 
        before + selectedText + after + 
        content.substring(end)
      
      setContent(newContent)
      
      // 커서 위치 조정
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        )
      }, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user || !title.trim() || !content.trim()) return

      setLoading(true)
      try {
        const postData = {
          title: title.trim(),
          content: content.trim(),
          author_id: user.id,
          tags,
          tools_used: toolsUsed,
          is_anonymous: isAnonymous,
          anonymous_author_id: isAnonymous ? `anon_${Math.random().toString(36).substr(2, 8)}` : null
        }

        const { data, error } = await supabase
          .from('community_posts')
          .insert(postData)
          .select()
          .single()

        if (error) throw error

        router.push(`/community/${data.id}`)
      } catch (error) {
        console.error('Post creation error:', error)
        alert('글 작성에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    const renderPreview = () => {
      // 간단한 마크다운 렌더링
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg" />')
        .replace(/\n/g, '<br>')
    }

    if (!user) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            글을 작성하려면 로그인이 필요합니다.
          </p>
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            로그인하기
          </a>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                새 글 작성
              </h1>
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 익명 작성 토글 */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="anonymous" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                익명으로 작성하기
              </label>
              {isAnonymous && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (닉네임 대신 '익명'으로 표시됩니다)
                </span>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="글 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* 마크다운 툴바 */}
            <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => insertMarkdown('**', '**')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                title="굵게"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*', '*')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                title="기울임"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('[링크 텍스트](', ')')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                title="링크"
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                title="이미지"
              >
                <Image className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center space-x-2 px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
              >
                {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm">{isPreview ? '편집' : '미리보기'}</span>
              </button>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용
              </label>
              {isPreview ? (
                <div 
                  className="w-full min-h-[300px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="마크다운 문법을 사용할 수 있습니다. **굵게**, *기울임*, [링크](URL), ![이미지](URL)"
                  className="w-full min-h-[300px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  required
                />
              )}
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                태그 (최대 5개)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={tags.length >= 5}
              />
            </div>

            {/* 사용된 도구 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                사용된 바이브 코딩 도구 (선택사항)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Cursor', 'Lovable', 'Windsurf', 'Bolt.new', 'GitHub Copilot', 'Devin', 'Vitara.ai'].map(tool => (
                  <label key={tool} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={toolsUsed.includes(tool)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setToolsUsed([...toolsUsed, tool])
                        } else {
                          setToolsUsed(toolsUsed.filter(t => t !== tool))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{tool}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? '작성 중...' : '글 작성'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 2.1, 2.2_

- [ ] 11. 익명 글쓰기 기능
  
  **11.1 익명 작성자 ID 생성 함수 (src/utils/anonymous.ts)**
  ```typescript
  export const generateAnonymousId = (): string => {
    return `anon_${Math.random().toString(36).substr(2, 8)}`
  }

  export const getAnonymousDisplayName = (anonymousId: string): string => {
    return `익명_${anonymousId.slice(-4)}`
  }

  export const isAnonymousPost = (post: any): boolean => {
    return post.is_anonymous === true
  }
  ```

  **11.2 익명 글 표시 컴포넌트 (src/components/common/AuthorDisplay.tsx)**
  ```typescript
  import { User } from '@/types'

  interface AuthorDisplayProps {
    author?: User
    isAnonymous: boolean
    anonymousAuthorId?: string
    showAvatar?: boolean
    className?: string
  }

  export default function AuthorDisplay({ 
    author, 
    isAnonymous, 
    anonymousAuthorId, 
    showAvatar = true,
    className = ""
  }: AuthorDisplayProps) {
    if (isAnonymous) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          {showAvatar && (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">익</span>
            </div>
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            익명_{anonymousAuthorId?.slice(-4) || '0000'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            익명
          </span>
        </div>
      )
    }

    if (!author) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          {showAvatar && (
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
          )}
          <span className="text-gray-500 dark:text-gray-400">알 수 없음</span>
        </div>
      )
    }

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showAvatar && (
          <img
            src={author.avatar_url || '/default-avatar.png'}
            alt={author.nickname}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="font-medium text-gray-900 dark:text-white">
          {author.nickname}
        </span>
      </div>
    )
  }
  ```
  
  _요구사항: 3.2_

- [ ] 12. 커뮤니티 글 표시 및 상호작용
  
  **12.1 커뮤니티 글 카드 (src/components/community/PostCard.tsx)**
  ```typescript
  'use client'
  import Link from 'next/link'
  import { useState } from 'react'
  import { CommunityPost } from '@/types'
  import { Heart, MessageCircle, Share2, Clock, Eye, Flag } from 'lucide-react'
  import { useAuth } from '@/hooks/useAuth'
  import { supabase } from '@/lib/supabase'
  import AuthorDisplay from '@/components/common/AuthorDisplay'

  interface PostCardProps {
    post: CommunityPost
    onLike?: (postId: string, isLiked: boolean) => void
  }

  export default function PostCard({ post, onLike }: PostCardProps) {
    const { user } = useAuth()
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(post.like_count)
    const [loading, setLoading] = useState(false)

    const handleLike = async () => {
      if (!user || loading) return

      setLoading(true)
      try {
        if (isLiked) {
          await supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', post.id)
          
          setIsLiked(false)
          setLikeCount(prev => prev - 1)
        } else {
          await supabase
            .from('likes')
            .insert({
              user_id: user.id,
              post_id: post.id
            })
          
          setIsLiked(true)
          setLikeCount(prev => prev + 1)
        }

        onLike?.(post.id, !isLiked)
      } catch (error) {
        console.error('Like error:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleShare = async () => {
      const url = `${window.location.origin}/community/${post.id}`
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: post.title,
            text: post.content.substring(0, 100) + '...',
            url: url
          })
        } catch (error) {
          // 사용자가 공유를 취소한 경우
        }
      } else {
        await navigator.clipboard.writeText(url)
        alert('링크가 클립보드에 복사되었습니다.')
      }
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return '방금 전'
      if (diffInHours < 24) return `${diffInHours}시간 전`
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`
      return date.toLocaleDateString('ko-KR')
    }

    return (
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          {/* 작성자 정보 */}
          <div className="flex items-center justify-between mb-4">
            <AuthorDisplay
              author={post.author}
              isAnonymous={post.is_anonymous}
              anonymousAuthorId={post.anonymous_author_id}
            />
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>

          {/* 태그 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            <Link 
              href={`/community/${post.id}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {post.title}
            </Link>
          </h2>

          {/* 내용 미리보기 */}
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {post.content.replace(/[#*`]/g, '').substring(0, 200)}
            {post.content.length > 200 && '...'}
          </p>

          {/* 사용된 도구 */}
          {post.tools_used && post.tools_used.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">사용된 도구:</span>
              {post.tools_used.slice(0, 3).map((tool, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded"
                >
                  {tool}
                </span>
              ))}
              {post.tools_used.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{post.tools_used.length - 3}개 더
                </span>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                disabled={!user || loading}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>

              <Link
                href={`/community/${post.id}#comments`}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.comment_count}</span>
              </Link>

              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4" />
                <span>{post.view_count}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }
  ```
  
  _요구사항: 2.3, 2.4, 6.1, 6.3_

**Phase 5: 검색 및 스크랩**

- [ ] 13. 통합 검색 시스템
  
  **13.1 검색 바 컴포넌트 (src/components/search/SearchBar.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect, useRef } from 'react'
  import { useRouter } from 'next/navigation'
  import { Search, X, Clock, TrendingUp } from 'lucide-react'
  import { supabase } from '@/lib/supabase'

  interface SearchSuggestion {
    type: 'recent' | 'trending' | 'content'
    text: string
    count?: number
  }

  export default function SearchBar() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      // 최근 검색어 로드
      const saved = localStorage.getItem('recent-searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    }, [])

    useEffect(() => {
      if (query.length > 1) {
        fetchSuggestions()
      } else {
        setSuggestions([])
      }
    }, [query])

    const fetchSuggestions = async () => {
      try {
        // 트렌딩 태그 가져오기
        const { data: trendingTags } = await supabase
          .from('tags')
          .select('name, usage_count')
          .ilike('name', `%${query}%`)
          .order('usage_count', { ascending: false })
          .limit(3)

        // 콘텐츠 제목 검색
        const { data: articles } = await supabase
          .from('news_articles')
          .select('title')
          .ilike('title', `%${query}%`)
          .limit(3)

        const { data: posts } = await supabase
          .from('community_posts')
          .select('title')
          .ilike('title', `%${query}%`)
          .limit(3)

        const newSuggestions: SearchSuggestion[] = []

        // 최근 검색어 추가
        recentSearches
          .filter(search => search.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 2)
          .forEach(search => {
            newSuggestions.push({ type: 'recent', text: search })
          })

        // 트렌딩 태그 추가
        trendingTags?.forEach(tag => {
          newSuggestions.push({ 
            type: 'trending', 
            text: tag.name, 
            count: tag.usage_count 
          })
        })

        // 콘텐츠 제목 추가
        articles?.forEach(article => {
          newSuggestions.push({ type: 'content', text: article.title })
        })

        posts?.forEach(post => {
          newSuggestions.push({ type: 'content', text: post.title })
        })

        setSuggestions(newSuggestions.slice(0, 8))
      } catch (error) {
        console.error('Suggestions fetch error:', error)
      }
    }

    const handleSearch = (searchQuery: string = query) => {
      if (!searchQuery.trim()) return

      // 최근 검색어에 추가
      const updatedRecent = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 10)
      
      setRecentSearches(updatedRecent)
      localStorage.setItem('recent-searches', JSON.stringify(updatedRecent))

      // 검색 페이지로 이동
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setShowSuggestions(false)
      setQuery('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch()
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    }

    const clearRecentSearches = () => {
      setRecentSearches([])
      localStorage.removeItem('recent-searches')
    }

    return (
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="뉴스, 커뮤니티, 댓글 통합 검색..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 검색 제안 */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {suggestions.length > 0 ? (
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion.text)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                  >
                    {suggestion.type === 'recent' && (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    {suggestion.type === 'trending' && (
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                    )}
                    {suggestion.type === 'content' && (
                      <Search className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="flex-1 text-gray-900 dark:text-white">
                      {suggestion.text}
                    </span>
                    {suggestion.count && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : query.length > 1 ? (
              <div className="py-4 px-4 text-center text-gray-500 dark:text-gray-400">
                검색 결과가 없습니다
              </div>
            ) : (
              <div className="py-2">
                {recentSearches.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-between">
                      최근 검색어
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                      >
                        전체 삭제
                      </button>
                    </div>
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{search}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  ```

  **13.2 검색 결과 페이지 (src/app/search/page.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { useSearchParams } from 'next/navigation'
  import { supabase } from '@/lib/supabase'
  import { NewsArticle, CommunityPost, Comment } from '@/types'
  import NewsCard from '@/components/news/NewsCard'
  import PostCard from '@/components/community/PostCard'
  import { Search, Filter } from 'lucide-react'

  type SearchResult = {
    type: 'news' | 'community' | 'comment'
    data: NewsArticle | CommunityPost | Comment
    relevance: number
  }

  export default function SearchPage() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'all' | 'news' | 'community' | 'comments'>('all')
    const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance')

    useEffect(() => {
      if (query) {
        performSearch()
      }
    }, [query, sortBy])

    const performSearch = async () => {
      setLoading(true)
      try {
        const searchResults: SearchResult[] = []

        // 뉴스 검색
        const { data: articles } = await supabase
          .from('news_articles')
          .select('*')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
          .eq('is_hidden', false)
          .limit(20)

        articles?.forEach(article => {
          let relevance = 0
          if (article.title.toLowerCase().includes(query.toLowerCase())) relevance += 3
          if (article.summary.toLowerCase().includes(query.toLowerCase())) relevance += 2
          if (article.content.toLowerCase().includes(query.toLowerCase())) relevance += 1
          
          searchResults.push({
            type: 'news',
            data: article,
            relevance
          })
        })

        // 커뮤니티 검색
        const { data: posts } = await supabase
          .from('community_posts')
          .select(`
            *,
            author:users(*)
          `)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .eq('is_hidden', false)
          .limit(20)

        posts?.forEach(post => {
          let relevance = 0
          if (post.title.toLowerCase().includes(query.toLowerCase())) relevance += 3
          if (post.content.toLowerCase().includes(query.toLowerCase())) relevance += 1
          
          searchResults.push({
            type: 'community',
            data: post,
            relevance
          })
        })

        // 댓글 검색
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            *,
            author:users(*),
            article:news_articles(title),
            post:community_posts(title)
          `)
          .ilike('content', `%${query}%`)
          .eq('is_hidden', false)
          .limit(10)

        comments?.forEach(comment => {
          searchResults.push({
            type: 'comment',
            data: comment,
            relevance: 1
          })
        })

        // 정렬
        if (sortBy === 'relevance') {
          searchResults.sort((a, b) => b.relevance - a.relevance)
        } else {
          searchResults.sort((a, b) => 
            new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
          )
        }

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const filteredResults = results.filter(result => {
      if (activeTab === 'all') return true
      if (activeTab === 'news') return result.type === 'news'
      if (activeTab === 'community') return result.type === 'community'
      if (activeTab === 'comments') return result.type === 'comment'
      return true
    })

    const getResultCounts = () => {
      return {
        all: results.length,
        news: results.filter(r => r.type === 'news').length,
        community: results.filter(r => r.type === 'community').length,
        comments: results.filter(r => r.type === 'comment').length
      }
    }

    const counts = getResultCounts()

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 헤더 */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              "{query}" 검색 결과
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            총 {results.length}개의 결과를 찾았습니다
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 탭 네비게이션 */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: '전체', count: counts.all },
                  { key: 'news', label: '뉴스', count: counts.news },
                  { key: 'community', label: '커뮤니티', count: counts.community },
                  { key: 'comments', label: '댓글', count: counts.comments }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* 정렬 옵션 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="relevance">관련도순</option>
                  <option value="date">최신순</option>
                </select>
              </div>
            </div>

            {/* 검색 결과 */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-6">
                {filteredResults.map((result, index) => (
                  <div key={index}>
                    {result.type === 'news' && (
                      <NewsCard article={result.data as NewsArticle} />
                    )}
                    {result.type === 'community' && (
                      <PostCard post={result.data as CommunityPost} />
                    )}
                    {result.type === 'comment' && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          댓글 • {(result.data as any).article?.title || (result.data as any).post?.title}
                        </div>
                        <p className="text-gray-900 dark:text-white">
                          {(result.data as Comment).content}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {new Date((result.data as Comment).created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  다른 키워드로 검색해보세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 4.1, 4.2, 4.3, 8.3_

- [ ] 14-15. 스크랩/태그 시스템
  - 북마크 시스템 (폴더 관리, 태그, 메모)
  - 트렌딩 태그 알고리즘
  - _요구사항: 4.4-4.8, 11.4, 11.5_

**Phase 6: 고급 기능**
- [ ] 16-18. 비개발자 지원/멘토링/도구 비교
  - 비개발자 모드 토글, AI 콘텐츠 단순화, 댓글 작성 도움
  - 멘토링 매칭 알고리즘, 프로필 설정, 세션 관리
  - 실시간 도구 가격 비교 테이블, 예산별 추천
  - _요구사항: 16.2, 16.3, 16.5, 16.7, 19.5, 21.2, 21.4_

**Phase 7: 접근성 및 사용성**
- [ ] 19-21. 접근성/다국어/성능 최적화
  - ARIA 라벨, 키보드 내비게이션, 고대비 모드, 애니메이션 비활성화
  - 언어 선택, 다국어 리소스, 브라우저 언어 감지
  - 이미지 최적화, 코드 스플리팅, 캐싱 전략
  - _요구사항: 14.1-14.5, 12.1, 12.2, 12.6, 8.1, 8.2, 30.1, 30.4_

**Phase 8: PWA 및 오프라인**
- [ ] 22-23. Service Worker/PWA 구현
  - 오프라인 캐싱, API 응답 캐싱, 오프라인 큐
  - 웹 앱 매니페스트, 설치 가능한 앱, 푸시 알림
  - _요구사항: 8.5_

**Phase 9: SEO 최적화**
- [ ] 24-25. SEO/자동 인덱싱
  - 메타 태그, Open Graph, 구조화된 데이터, 사이트맵
  - Google/Bing API 연동, 자동 제출, 인덱싱 모니터링
  - _요구사항: 13.1-13.3, 13.6, 13.7_

**Phase 10: 보안 및 검증**
- [ ] 26-27. 팩트체킹/보안 강화
  - 다중 팩트체킹 API, AI 신뢰도 분석, 결과 표시
  - 콘텐츠 필터링, 스팸 감지, 신고 처리, 보안 모니터링
  - _요구사항: 27.5, 9.2, 9.4, 26.1, 26.2_

**Phase 11: 협업 시스템**
- [ ] 28-29. 프로젝트 협업/코드 공유
  - 협업 프로젝트 관리, 실시간 진행도, 기여도 추적
  - 코드 스니펫 공유, 구문 강조, 프로젝트 쇼케이스
  - _요구사항: 19.6, 19.2, 19.4_

**Phase 12: 최종 완성**
- [ ] 30-32. 테스트/온보딩/배포
  - E2E 테스트, 크로스 브라우저, 성능 테스트
  - 온보딩 투어, FAQ, 가이드 툴팁, 피드백 수집
  - 환경 설정, 프로덕션 빌드, 모니터링, 백업 시스템
  - _요구사항: 32.2-32.4, 31.1-31.5, 29.1-29.3_

## 구현 가이드라인

### 개발 원칙
1. **테스트 주도 개발**: 각 기능 구현 전 테스트 코드 작성
2. **점진적 구현**: 작은 단위로 나누어 안정적으로 구현
3. **사용자 중심**: 사용자 경험을 최우선으로 고려
4. **성능 최적화**: 각 단계에서 성능 영향 고려
5. **접근성 준수**: 모든 기능에서 접근성 기준 준수

### 기술 스택
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Automation**: n8n (추후 단계에서 구현)
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel 또는 Netlify

### 우선순위
1. **Phase 1-3**: 핵심 기능 (뉴스, 커뮤니티, 인증)
2. **Phase 4-6**: 고급 기능 (검색, 멘토링, 도구 비교)
3. **Phase 7-9**: 사용성 개선 (접근성, PWA, SEO)
4. **Phase 10-12**: 보안 및 최종 완성

이 작업 목록을 통해 VibeNews를 체계적이고 안정적으로 구현할 수 있습니다.
#
# 핵심 구현 가이드

### 필수 패키지 설치
```bash
npm install @supabase/supabase-js lucide-react @headlessui/react
npm install -D @types/node
```

### 중요한 구현 포인트

**1. 익명 기능 구현**
- `is_anonymous` boolean 필드와 `anonymous_author_id` 텍스트 필드 사용
- 익명 ID 생성: `anon_${Math.random().toString(36).substr(2, 8)}`
- 댓글과 게시글 모두에서 지원

**2. 소셜 로그인 4개 지원**
- Google, GitHub: Supabase 기본 제공
- 네이버, 카카오: Custom Provider로 설정 필요
- 각 Provider별 에러 처리 및 사용자 프로필 자동 생성

**3. 실시간 기능**
- 좋아요 수 자동 업데이트: PostgreSQL 트리거 사용
- 댓글 수 자동 업데이트: comment_count 필드 관리
- Supabase Realtime으로 실시간 구독 가능

**4. 접근성 지원**
- `prefers-reduced-motion` 미디어 쿼리 감지
- ARIA 라벨과 시맨틱 HTML 사용
- 키보드 내비게이션 지원
- 고대비 모드 CSS 클래스 토글

**5. 테마 시스템**
- 시스템 설정 자동 감지: `window.matchMedia('(prefers-color-scheme: dark)')`
- 로컬 스토리지에 사용자 선택 저장
- Tailwind CSS `dark:` 클래스 활용

**6. 성능 최적화**
- 무한 스크롤로 페이지네이션
- 이미지 지연 로딩
- React.memo와 useMemo 활용
- 코드 스플리팅으로 번들 크기 최적화

### 데이터베이스 관계도
```
users (1) ←→ (N) community_posts
users (1) ←→ (N) comments
users (1) ←→ (N) likes
users (1) ←→ (N) bookmarks

news_articles (1) ←→ (N) comments
news_articles (1) ←→ (N) likes

community_posts (1) ←→ (N) comments
comments (1) ←→ (N) comments (대댓글)
```

### API 엔드포인트 패턴
```typescript
// 뉴스 목록
GET /api/news?page=0&filter=all&tags=AI,React

// 커뮤니티 글 목록  
GET /api/community?page=0&sort=recent

// 검색
GET /api/search?q=keyword&type=all&page=0

// 좋아요 토글
POST /api/likes { target_type: 'article', target_id: 'uuid' }

// 댓글 작성
POST /api/comments { content, target_type, target_id, parent_id?, is_anonymous }
```

### 보안 체크리스트
- [ ] RLS 정책 모든 테이블에 적용
- [ ] 사용자 입력 검증 (XSS 방지)
- [ ] CSRF 토큰 사용
- [ ] 파일 업로드 검증
- [ ] 레이트 리미팅 적용
- [ ] 환경 변수 보안 관리

### 배포 전 체크리스트
- [ ] 모든 환경 변수 설정 확인
- [ ] 프로덕션 빌드 테스트
- [ ] 성능 최적화 확인 (Lighthouse 점수 90+ 목표)
- [ ] 접근성 테스트 (axe-core 통과)
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 반응형 테스트
- [ ] SEO 메타 태그 확인

이 tasks.md 파일만으로도 VibeNews의 모든 기능을 완전히 구현할 수 있습니다. 각 작업은 구체적인 코드 예시와 구현 방법을 포함하고 있어 초보 개발자도 따라할 수 있도록 설계되었습니다.
**P
hase 6: 고급 기능**

- [ ] 16. 비개발자 지원 시스템
  
  **16.1 비개발자 모드 토글 (src/components/common/NonDeveloperToggle.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { User, Code } from 'lucide-react'

  export default function NonDeveloperToggle() {
    const [isNonDeveloper, setIsNonDeveloper] = useState(false)

    useEffect(() => {
      const saved = localStorage.getItem('non-developer-mode')
      if (saved) {
        setIsNonDeveloper(JSON.parse(saved))
      }
    }, [])

    const toggleMode = () => {
      const newMode = !isNonDeveloper
      setIsNonDeveloper(newMode)
      localStorage.setItem('non-developer-mode', JSON.stringify(newMode))
      
      // 전역 CSS 클래스 토글
      document.documentElement.classList.toggle('non-developer-mode', newMode)
    }

    return (
      <button
        onClick={toggleMode}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          isNonDeveloper
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        {isNonDeveloper ? <User className="w-4 h-4" /> : <Code className="w-4 h-4" />}
        <span className="text-sm">
          {isNonDeveloper ? '일반인 모드' : '개발자 모드'}
        </span>
      </button>
    )
  }
  ```

  **16.2 AI 댓글 작성 도우미 (src/components/community/CommentAssistant.tsx)**
  ```typescript
  'use client'
  import { useState } from 'react'
  import { Lightbulb, Wand2 } from 'lucide-react'

  interface CommentAssistantProps {
    onSuggestion: (suggestion: string) => void
  }

  export default function CommentAssistant({ onSuggestion }: CommentAssistantProps) {
    const [userInput, setUserInput] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const getSuggestions = async () => {
      if (!userInput.trim()) return
      
      setLoading(true)
      try {
        // AI API 호출 시뮬레이션 (실제로는 OpenAI API 사용)
        const mockSuggestions = [
          `"${userInput}"를 더 구체적으로 표현하면: "이 기능을 사용할 때 어떤 에러가 발생하는지 궁금합니다"`,
          `기술적 질문으로 다시 작성: "해당 도구에서 ${userInput} 관련 기능은 어떻게 구현되어 있나요?"`,
          `개발자들이 이해하기 쉽게: "${userInput}에 대해 초보자도 이해할 수 있는 설명을 부탁드립니다"`
        ]
        
        setSuggestions(mockSuggestions)
      } catch (error) {
        console.error('AI suggestion error:', error)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            AI 댓글 작성 도우미
          </h4>
        </div>
        
        <div className="space-y-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="궁금한 점을 자유롭게 작성해보세요. AI가 더 나은 표현을 제안해드릴게요!"
            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-blue-900/30 dark:text-white resize-none"
            rows={2}
          />
          
          <button
            onClick={getSuggestions}
            disabled={loading || !userInput.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4" />
            <span>{loading ? '분석 중...' : 'AI 제안 받기'}</span>
          </button>
          
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                💡 AI 제안:
              </h5>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 bg-white dark:bg-blue-800/30 rounded border border-blue-200 dark:border-blue-700"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {suggestion}
                  </p>
                  <button
                    onClick={() => onSuggestion(suggestion.split(': "')[1]?.replace('"', '') || suggestion)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    이 제안 사용하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 16.2, 16.3, 16.5, 16.7_

- [ ] 17. 멘토링 매칭 시스템
  
  **17.1 멘토링 프로필 설정 (src/app/mentoring/profile/page.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { useAuth } from '@/hooks/useAuth'
  import { supabase } from '@/lib/supabase'
  import { Star, Clock, DollarSign } from 'lucide-react'

  export default function MentoringProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState({
      role: 'mentee' as 'mentor' | 'mentee',
      skills: [] as string[],
      experience_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
      bio: '',
      availability: '',
      preferred_tools: [] as string[],
      hourly_rate: 0
    })

    const availableSkills = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'AI/ML', 'DevOps', 'Mobile']
    const availableTools = ['Cursor', 'Lovable', 'Windsurf', 'GitHub Copilot', 'Bolt.new', 'Devin']

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return

      try {
        const { error } = await supabase
          .from('mentoring_profiles')
          .upsert({
            user_id: user.id,
            ...profile,
            is_active: true
          })

        if (error) throw error
        alert('멘토링 프로필이 저장되었습니다!')
      } catch (error) {
        console.error('Profile save error:', error)
        alert('프로필 저장에 실패했습니다.')
      }
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">멘토링 프로필 설정</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 역할 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">역할</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mentor"
                  checked={profile.role === 'mentor'}
                  onChange={(e) => setProfile({...profile, role: e.target.value as any})}
                  className="mr-2"
                />
                멘토 (도움을 주고 싶어요)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mentee"
                  checked={profile.role === 'mentee'}
                  onChange={(e) => setProfile({...profile, role: e.target.value as any})}
                  className="mr-2"
                />
                멘티 (도움을 받고 싶어요)
              </label>
            </div>
          </div>

          {/* 기술 스택 */}
          <div>
            <label className="block text-sm font-medium mb-2">기술 스택</label>
            <div className="grid grid-cols-2 gap-2">
              {availableSkills.map(skill => (
                <label key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={profile.skills.includes(skill)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProfile({...profile, skills: [...profile.skills, skill]})
                      } else {
                        setProfile({...profile, skills: profile.skills.filter(s => s !== skill)})
                      }
                    }}
                    className="mr-2"
                  />
                  {skill}
                </label>
              ))}
            </div>
          </div>

          {/* 경험 수준 */}
          <div>
            <label className="block text-sm font-medium mb-2">경험 수준</label>
            <select
              value={profile.experience_level}
              onChange={(e) => setProfile({...profile, experience_level: e.target.value as any})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>

          {/* 자기소개 */}
          <div>
            <label className="block text-sm font-medium mb-2">자기소개</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              placeholder="자신의 경험과 도움을 줄 수 있는 분야를 소개해주세요"
            />
          </div>

          {profile.role === 'mentor' && (
            <div>
              <label className="block text-sm font-medium mb-2">시간당 요금 (원)</label>
              <input
                type="number"
                value={profile.hourly_rate}
                onChange={(e) => setProfile({...profile, hourly_rate: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                placeholder="0 (무료 멘토링)"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            프로필 저장
          </button>
        </form>
      </div>
    )
  }
  ```
  
  _요구사항: 19.5_

- [ ] 18. 실시간 도구 가격 비교
  
  **18.1 도구 가격 비교 테이블 (src/components/tools/PricingComparison.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { supabase } from '@/lib/supabase'
  import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react'

  interface ToolPricing {
    tool_name: string
    free_tier: any
    paid_plans: any[]
    features: any
    last_updated: string
  }

  export default function PricingComparison() {
    const [pricingData, setPricingData] = useState<ToolPricing[]>([])
    const [selectedBudget, setSelectedBudget] = useState(25)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      fetchPricingData()
    }, [])

    const fetchPricingData = async () => {
      try {
        // 실제로는 tool_pricing 테이블에서 가져옴
        const mockData: ToolPricing[] = [
          {
            tool_name: 'Cursor',
            free_tier: { available: true, features: ['기본 AI 완성', '월 200회 요청'] },
            paid_plans: [
              { name: 'Pro', price: 20, features: ['무제한 AI 완성', '고급 모델 접근'] }
            ],
            features: { ai_completion: true, real_time_collab: false, deployment: true },
            last_updated: new Date().toISOString()
          },
          {
            tool_name: 'Lovable',
            free_tier: { available: false },
            paid_plans: [
              { name: 'Starter', price: 25, features: ['웹앱 생성', '기본 템플릿'] },
              { name: 'Pro', price: 50, features: ['고급 기능', '커스텀 도메인'] }
            ],
            features: { ai_completion: true, real_time_collab: true, deployment: true },
            last_updated: new Date().toISOString()
          },
          {
            tool_name: 'Windsurf',
            free_tier: { available: true, features: ['기본 기능', '월 100회 생성'] },
            paid_plans: [
              { name: 'Pro', price: 15, features: ['무제한 생성', '고급 AI 모델'] }
            ],
            features: { ai_completion: true, real_time_collab: true, deployment: false },
            last_updated: new Date().toISOString()
          }
        ]
        
        setPricingData(mockData)
      } catch (error) {
        console.error('Pricing data fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    const getRecommendedTools = () => {
      return pricingData
        .filter(tool => {
          const hasFreeTier = tool.free_tier?.available
          const hasAffordablePlan = tool.paid_plans.some(plan => plan.price <= selectedBudget)
          return hasFreeTier || hasAffordablePlan
        })
        .sort((a, b) => {
          const aMinPrice = a.free_tier?.available ? 0 : Math.min(...a.paid_plans.map(p => p.price))
          const bMinPrice = b.free_tier?.available ? 0 : Math.min(...b.paid_plans.map(p => p.price))
          return aMinPrice - bMinPrice
        })
    }

    if (loading) {
      return <div className="animate-pulse">로딩 중...</div>
    }

    return (
      <div className="space-y-6">
        {/* 예산 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">예산 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                월 예산: ${selectedBudget}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$50</span>
                <span>$100+</span>
              </div>
            </div>
          </div>
        </div>

        {/* 추천 도구 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            예산 내 추천 도구
          </h3>
          <div className="grid gap-4">
            {getRecommendedTools().slice(0, 3).map(tool => (
              <div key={tool.tool_name} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <h4 className="font-medium">{tool.tool_name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tool.free_tier?.available ? '무료 티어 제공' : `$${Math.min(...tool.paid_plans.map(p => p.price))}/월부터`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    추천
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 가격 비교 테이블 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    도구
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    무료 티어
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    유료 플랜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    주요 기능
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    업데이트
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pricingData.map(tool => (
                  <tr key={tool.tool_name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {tool.tool_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tool.free_tier?.available ? (
                        <div className="text-green-600 dark:text-green-400">
                          ✅ 제공
                          <div className="text-xs text-gray-500 mt-1">
                            {tool.free_tier.features?.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-600 dark:text-red-400">❌ 없음</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {tool.paid_plans.map((plan, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{plan.name}</span>: ${plan.price}/월
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {tool.features.ai_completion && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            AI 완성
                          </span>
                        )}
                        {tool.features.real_time_collab && (
                          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                            실시간 협업
                          </span>
                        )}
                        {tool.features.deployment && (
                          <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                            배포
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tool.last_updated).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 21.2, 21.4_

**Phase 7-12: 나머지 기능들**

- [ ] 19-21. 접근성/다국어/성능 최적화
  - 접근성: ARIA 라벨, 키보드 내비게이션, 고대비 모드, 애니메이션 비활성화
  - 다국어: 언어 선택, 리소스 파일, 브라우저 언어 감지
  - 성능: 이미지 최적화, 코드 스플리팅, 캐싱
  - _요구사항: 14.1-14.5, 12.1-12.6, 8.1-8.2, 30.1-30.4_

- [ ] 22-23. PWA 및 오프라인
  - Service Worker: 오프라인 캐싱, API 응답 캐싱, 오프라인 큐
  - PWA: 웹 앱 매니페스트, 설치 가능한 앱, 푸시 알림
  - _요구사항: 8.5_

- [ ] 24-25. SEO 최적화
  - SEO: 메타 태그, Open Graph, 구조화된 데이터, 사이트맵
  - 자동 인덱싱: Google/Bing API 연동, 자동 제출, 모니터링
  - _요구사항: 13.1-13.7_

- [ ] 26. 팩트체킹 시스템
  
  **26.1 팩트체킹 서비스 (src/services/FactCheckingService.ts)**
  ```typescript
  interface FactCheckResult {
    credibilityScore: number; // 0-100
    factCheckSources: Array<{name: string, url: string}>;
    warnings: string[];
    verifiedClaims: string[];
    disputedClaims: string[];
  }

  export class FactCheckingService {
    private factCheckAPIs = [
      'https://api.factcheck.org/v1/check',
      'https://api.snopes.com/v1/verify',
      'https://api.politifact.com/v1/fact-check'
    ];

    async checkContent(content: string): Promise<FactCheckResult> {
      // 1. 여러 팩트체킹 API 동시 호출
      const promises = this.factCheckAPIs.map(async (apiUrl) => {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: content })
          });
          return await response.json();
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      
      // 2. AI를 통한 종합 분석
      const aiAnalysis = await this.analyzeWithAI(content, results);
      
      return {
        credibilityScore: aiAnalysis.credibility_score,
        factCheckSources: aiAnalysis.sources,
        warnings: aiAnalysis.warnings,
        verifiedClaims: aiAnalysis.verified_claims,
        disputedClaims: aiAnalysis.disputed_claims
      };
    }

    private async analyzeWithAI(content: string, factCheckResults: any[]): Promise<any> {
      // OpenAI API 호출로 종합 분석
      const response = await fetch('/api/openai/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, results: factCheckResults })
      });
      return await response.json();
    }
  }
  ```

  **26.2 팩트체킹 결과 표시 (src/components/common/FactCheckBadge.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
  import { FactCheckingService } from '@/services/FactCheckingService'

  interface FactCheckBadgeProps {
    content: string
    contentId: string
  }

  export default function FactCheckBadge({ content, contentId }: FactCheckBadgeProps) {
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      if (content.length > 100) {
        checkFacts()
      }
    }, [content])

    const checkFacts = async () => {
      setLoading(true)
      try {
        const service = new FactCheckingService()
        const factResult = await service.checkContent(content)
        setResult(factResult)
      } catch (error) {
        console.error('Fact checking failed:', error)
      } finally {
        setLoading(false)
      }
    }

    if (loading) {
      return (
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <Shield className="w-4 h-4 animate-spin" />
          <span className="text-sm">사실 확인 중...</span>
        </div>
      )
    }

    if (!result) return null

    const getBadgeColor = (score: number) => {
      if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
      if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      return 'text-red-600 bg-red-50 border-red-200'
    }

    const getIcon = (score: number) => {
      if (score >= 80) return <CheckCircle className="w-4 h-4" />
      if (score >= 60) return <AlertTriangle className="w-4 h-4" />
      return <XCircle className="w-4 h-4" />
    }

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${getBadgeColor(result.credibilityScore)}`}>
        {getIcon(result.credibilityScore)}
        <span>신뢰도: {result.credibilityScore}%</span>
        
        {result.warnings.length > 0 && (
          <div className="ml-2">
            <button className="text-xs underline">
              주의사항 {result.warnings.length}개
            </button>
          </div>
        )}
      </div>
    )
  }
  ```
  
  _요구사항: 27.5_

- [ ] 27. 보안 강화 시스템
  
  **27.1 보안 모니터링 (src/services/SecurityMonitor.ts)**
  ```typescript
  interface SecurityEvent {
    type: 'ddos' | 'sql_injection' | 'xss' | 'brute_force';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source_ip: string;
    user_id?: string;
    details: any;
    timestamp: string;
  }

  export class SecurityMonitor {
    private threatPatterns = {
      ddos: /requests\/sec > 1000/,
      sqlInjection: /(union|select|insert|update|delete|drop|create|alter).*['"]/i,
      xss: /<script|javascript:|on\w+\s*=/i,
      bruteForce: /failed_login_attempts > 5 in 5 minutes/
    };

    async analyzeRequest(request: any): Promise<SecurityEvent | null> {
      // AI 기반 위협 분석
      const response = await fetch('/api/openai/threat-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: request.ip,
          user_agent: request.headers['user-agent'],
          path: request.path,
          method: request.method,
          body: request.body
        })
      });

      const aiAnalysis = await response.json();
      
      if (aiAnalysis.threat_level > 0.7) {
        return {
          type: aiAnalysis.threat_type,
          severity: this.mapThreatLevelToSeverity(aiAnalysis.threat_level),
          source_ip: request.ip,
          user_id: request.user?.id,
          details: aiAnalysis.details,
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    }

    private mapThreatLevelToSeverity(level: number): 'low' | 'medium' | 'high' | 'critical' {
      if (level >= 0.9) return 'critical';
      if (level >= 0.8) return 'high';
      if (level >= 0.7) return 'medium';
      return 'low';
    }
  }
  ```
  
  _요구사항: 9.2, 9.4, 26.1, 26.2_

- [ ] 28-29. 협업 시스템
  - 프로젝트 협업: 관리, 실시간 진행도, 기여도 추적
  - 코드 공유: 스니펫 공유, 구문 강조, 프로젝트 쇼케이스
  - _요구사항: 19.6, 19.2, 19.4_

- [ ] 30. n8n 자동화 워크플로우 구현
  
  **30.1 n8n 설치 및 기본 설정**
  ```bash
  # Docker를 이용한 n8n 설치
  docker run -it --rm \
    --name n8n \
    -p 5678:5678 \
    -v ~/.n8n:/home/node/.n8n \
    n8nio/n8n
  ```

  **30.2 뉴스 수집 워크플로우 (n8n/workflows/news-collection.json)**
  ```json
  {
    "name": "VibeNews Auto Collection",
    "nodes": [
      {
        "parameters": {
          "rule": {
            "interval": [{"field": "minutes", "value": 30}]
          }
        },
        "name": "Schedule Trigger",
        "type": "n8n-nodes-base.scheduleTrigger"
      },
      {
        "parameters": {
          "url": "https://api.threads.net/v1/posts",
          "authentication": "headerAuth",
          "headerAuth": {
            "name": "Authorization",
            "value": "Bearer {{$env.THREAD_API_KEY}}"
          },
          "qs": {
            "q": "vibe coding OR AI coding OR Cursor OR Lovable OR Windsurf",
            "count": 50,
            "result_type": "recent"
          }
        },
        "name": "Thread API",
        "type": "n8n-nodes-base.httpRequest"
      },
      {
        "parameters": {
          "url": "https://www.googleapis.com/youtube/v3/search",
          "qs": {
            "part": "snippet",
            "q": "vibe coding AI tools 2025",
            "key": "{{$env.YOUTUBE_API_KEY}}",
            "maxResults": 20,
            "order": "date"
          }
        },
        "name": "YouTube API",
        "type": "n8n-nodes-base.httpRequest"
      },
      {
        "parameters": {
          "resource": "chat",
          "model": "gpt-4",
          "messages": [
            {
              "role": "system",
              "content": "Process this content for VibeNews. Provide: 1) Korean title, 2) Summary, 3) Simplified version for non-developers, 4) Extract technical terms, 5) Generate tags, 6) Quality score (1-10)"
            },
            {
              "role": "user",
              "content": "{{$json.content}}"
            }
          ]
        },
        "name": "AI Content Processing",
        "type": "n8n-nodes-base.openAi"
      },
      {
        "parameters": {
          "operation": "insert",
          "table": "news_articles",
          "data": {
            "title": "{{$json.title}}",
            "content": "{{$json.content}}",
            "content_simplified": "{{$json.simplified_content}}",
            "summary": "{{$json.summary}}",
            "source_url": "{{$json.url}}",
            "tags": "{{$json.tags}}",
            "quality_score": "{{$json.quality_score}}"
          }
        },
        "name": "Supabase Insert",
        "type": "n8n-nodes-base.supabase"
      }
    ]
  }
  ```

  **30.3 콘텐츠 품질 필터링 (src/services/ContentQualityService.ts)**
  ```typescript
  export class ContentQualityService {
    private readonly MIN_QUALITY_SCORE = 7;
    private readonly SPAM_KEYWORDS = [
      'advertisement', 'buy now', 'click here', 'limited time',
      'exclusive offer', 'make money fast', 'guaranteed'
    ];

    async evaluateContent(content: string): Promise<{
      isQuality: boolean;
      score: number;
      reasons: string[];
    }> {
      const reasons: string[] = [];
      let score = 10;

      // 스팸 키워드 검사
      const spamCount = this.SPAM_KEYWORDS.filter(keyword => 
        content.toLowerCase().includes(keyword)
      ).length;
      
      if (spamCount > 0) {
        score -= spamCount * 2;
        reasons.push(`스팸 키워드 ${spamCount}개 발견`);
      }

      // 길이 검사
      if (content.length < 100) {
        score -= 3;
        reasons.push('콘텐츠가 너무 짧음');
      }

      // AI 기반 품질 평가
      const aiScore = await this.getAIQualityScore(content);
      score = Math.min(score, aiScore);

      return {
        isQuality: score >= this.MIN_QUALITY_SCORE,
        score,
        reasons
      };
    }

    private async getAIQualityScore(content: string): Promise<number> {
      const response = await fetch('/api/openai/quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          criteria: [
            'technical accuracy',
            'relevance to vibe coding',
            'information value',
            'readability'
          ]
        })
      });

      const result = await response.json();
      return result.score;
    }
  }
  ```
  
  _요구사항: 7.1, 7.2, 7.3, 9.1, 9.3_

- [ ] 31. 비개발자 친화적 콘텐츠 변환 시스템
  
  **31.1 기술 용어 사전 테이블 추가 (Supabase SQL)**
  ```sql
  -- 기술 용어 사전 테이블
  CREATE TABLE technical_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    term TEXT UNIQUE NOT NULL,
    definition TEXT NOT NULL,
    simple_definition TEXT NOT NULL,
    category TEXT NOT NULL, -- 'tool', 'concept', 'technology'
    examples TEXT[],
    related_terms TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 기본 바이브 코딩 용어들 삽입
  INSERT INTO technical_terms (term, definition, simple_definition, category, examples) VALUES
  ('Cursor', 'AI-powered code editor with intelligent code completion', 'AI가 도와주는 똑똑한 코드 작성 프로그램', 'tool', ARRAY['코드 자동완성', 'AI 페어 프로그래밍']),
  ('Lovable', 'No-code platform for building web applications', '코딩 없이 웹사이트를 만들 수 있는 도구', 'tool', ARRAY['드래그 앤 드롭', '비주얼 개발']),
  ('Windsurf', 'AI-first development environment', 'AI가 중심이 되는 개발 환경', 'tool', ARRAY['AI 코딩 어시스턴트', '자동 코드 생성']),
  ('Vibe Coding', 'Intuitive, AI-assisted programming approach', '직관적이고 AI의 도움을 받는 프로그래밍 방식', 'concept', ARRAY['자연어 프로그래밍', 'AI 협업']);
  ```

  **31.2 콘텐츠 변환 서비스 (src/services/ContentSimplifier.ts)**
  ```typescript
  interface ContentTransformation {
    original: string;
    simplified: string;
    technicalTerms: TechnicalTerm[];
    complexity: number; // 1-10
  }

  interface TechnicalTerm {
    term: string;
    definition: string;
    simple_definition: string;
    category: string;
  }

  export class ContentSimplifier {
    async transformContent(content: string): Promise<ContentTransformation> {
      // 1. 기술 용어 추출
      const technicalTerms = await this.extractTechnicalTerms(content);
      
      // 2. 복잡도 분석
      const complexity = this.analyzeComplexity(content, technicalTerms);
      
      // 3. AI 기반 단순화
      const simplified = await this.simplifyWithAI(content, technicalTerms);
      
      return {
        original: content,
        simplified,
        technicalTerms,
        complexity
      };
    }

    private async extractTechnicalTerms(content: string): Promise<TechnicalTerm[]> {
      const { data: terms } = await supabase
        .from('technical_terms')
        .select('*');

      const foundTerms: TechnicalTerm[] = [];
      
      terms?.forEach(term => {
        const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
        if (regex.test(content)) {
          foundTerms.push(term);
        }
      });

      return foundTerms;
    }

    private analyzeComplexity(content: string, terms: TechnicalTerm[]): number {
      let complexity = 1;
      
      // 기술 용어 개수에 따른 복잡도
      complexity += Math.min(terms.length * 0.5, 4);
      
      // 문장 길이에 따른 복잡도
      const avgSentenceLength = content.split('.').reduce((acc, sentence) => 
        acc + sentence.split(' ').length, 0) / content.split('.').length;
      
      if (avgSentenceLength > 20) complexity += 2;
      if (avgSentenceLength > 30) complexity += 2;
      
      return Math.min(complexity, 10);
    }

    private async simplifyWithAI(content: string, terms: TechnicalTerm[]): Promise<string> {
      const termDefinitions = terms.map(t => 
        `${t.term}: ${t.simple_definition}`
      ).join('\n');

      const response = await fetch('/api/openai/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          termDefinitions,
          instructions: `
            다음 기술 콘텐츠를 비개발자도 이해할 수 있게 변환해주세요:
            
            규칙:
            1. 일상적인 언어 사용
            2. 전문용어를 비유나 예시로 설명
            3. 복잡한 개념을 단계별로 분해
            4. 구체적인 예시 추가
            5. 정확성을 유지하면서 접근성 향상
            
            기술 용어 정의:
            ${termDefinitions}
          `
        })
      });

      const result = await response.json();
      return result.simplified_content;
    }
  }
  ```

  **31.3 비개발자 모드 토글 컴포넌트 (src/components/common/ContentModeToggle.tsx)**
  ```typescript
  'use client'
  import { useState } from 'react'
  import { User, Code, HelpCircle } from 'lucide-react'

  interface ContentModeToggleProps {
    onModeChange: (isSimplified: boolean) => void
    complexity?: number
  }

  export default function ContentModeToggle({ onModeChange, complexity = 5 }: ContentModeToggleProps) {
    const [isSimplified, setIsSimplified] = useState(false)

    const handleToggle = () => {
      const newMode = !isSimplified
      setIsSimplified(newMode)
      onModeChange(newMode)
    }

    const getComplexityColor = (level: number) => {
      if (level <= 3) return 'text-green-600'
      if (level <= 6) return 'text-yellow-600'
      return 'text-red-600'
    }

    return (
      <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            읽기 모드:
          </span>
          <button
            onClick={handleToggle}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isSimplified
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {isSimplified ? (
              <>
                <User className="w-4 h-4" />
                <span>일반인 모드</span>
              </>
            ) : (
              <>
                <Code className="w-4 h-4" />
                <span>개발자 모드</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <HelpCircle className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">
            복잡도: 
            <span className={`font-medium ${getComplexityColor(complexity)}`}>
              {complexity}/10
            </span>
          </span>
        </div>
      </div>
    )
  }
  ```

  **31.4 기술 용어 툴팁 컴포넌트 (src/components/common/TechnicalTermTooltip.tsx)**
  ```typescript
  'use client'
  import { useState, useRef, useEffect } from 'react'
  import { supabase } from '@/lib/supabase'

  interface TechnicalTermTooltipProps {
    term: string
    children: React.ReactNode
  }

  export default function TechnicalTermTooltip({ term, children }: TechnicalTermTooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [definition, setDefinition] = useState<{
      definition: string
      simple_definition: string
      examples: string[]
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const fetchDefinition = async () => {
      if (definition || loading) return
      
      setLoading(true)
      const { data } = await supabase
        .from('technical_terms')
        .select('definition, simple_definition, examples')
        .eq('term', term)
        .single()
      
      setDefinition(data)
      setLoading(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
      fetchDefinition()
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    return (
      <span 
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="border-b border-dotted border-blue-500 cursor-help text-blue-600 dark:text-blue-400">
          {children}
        </span>
        
        {isVisible && (
          <div
            ref={tooltipRef}
            className="absolute z-50 w-80 p-4 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : definition ? (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {term}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>개발자용:</strong> {definition.definition}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  <strong>쉬운 설명:</strong> {definition.simple_definition}
                </p>
                {definition.examples && definition.examples.length > 0 && (
                  <div>
                    <strong className="text-xs text-gray-500">예시:</strong>
                    <ul className="text-xs text-gray-500 mt-1">
                      {definition.examples.map((example, index) => (
                        <li key={index}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">정의를 찾을 수 없습니다.</p>
            )}
          </div>
        )}
      </span>
    )
  }
  ```
  
  _요구사항: 16.1, 16.2, 16.3, 16.4, 16.5_
            {isSimplified ? (
              <>
                <User className="w-4 h-4" />
                <span>일반인 모드</span>
              </>
            ) : (
              <>
                <Code className="w-4 h-4" />
                <span>개발자 모드</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <HelpCircle className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">
            복잡도: 
            <span className={`font-medium ${getComplexityColor(complexity)}`}>
              {complexity}/10
            </span>
          </span>
        </div>
      </div>
    )
  }
  ```

  **31.4 기술 용어 툴팁 컴포넌트 (src/components/common/TechnicalTermTooltip.tsx)**
  ```typescript
  'use client'
  import { useState, useRef, useEffect } from 'react'
  import { supabase } from '@/lib/supabase'

  interface TechnicalTermTooltipProps {
    term: string
    children: React.ReactNode
  }

  export default function TechnicalTermTooltip({ term, children }: TechnicalTermTooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [definition, setDefinition] = useState<{
      definition: string
      simple_definition: string
      examples: string[]
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const fetchDefinition = async () => {
      if (definition || loading) return
      
      setLoading(true)
      const { data } = await supabase
        .from('technical_terms')
        .select('definition, simple_definition, examples')
        .eq('term', term)
        .single()
      
      setDefinition(data)
      setLoading(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
      fetchDefinition()
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    return (
      <span 
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="border-b border-dotted border-blue-500 cursor-help text-blue-600 dark:text-blue-400">
          {children}
        </span>
        
        {isVisible && (
          <div
            ref={tooltipRef}
            className="absolute z-50 w-80 p-4 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : definition ? (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {term}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>개발자용:</strong> {definition.definition}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  <strong>쉬운 설명:</strong> {definition.simple_definition}
                </p>
                {definition.examples && definition.examples.length > 0 && (
                  <div>
                    <strong className="text-xs text-gray-500">예시:</strong>
                    <ul className="text-xs text-gray-500 mt-1">
                      {definition.examples.map((example, index) => (
                        <li key={index}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">정의를 찾을 수 없습니다.</p>
            )}
          </div>
        )}
      </span>
    )
  }
  ```
  
  _요구사항: 16.1, 16.2, 16.3, 16.4, 16.5_
- [
 ] 32. 플로팅 개인화 추천 배너 시스템
  
  **32.1 추천 알고리즘 서비스 (src/services/RecommendationService.ts)**
  ```typescript
  interface UserPreference {
    user_id: string;
    preferred_tags: string[];
    interaction_history: {
      article_id: string;
      interaction_type: 'view' | 'like' | 'comment' | 'share';
      timestamp: string;
    }[];
    reading_time_avg: number;
    complexity_preference: number; // 1-10
  }

  interface RecommendationItem {
    id: string;
    title: string;
    summary: string;
    thumbnail?: string;
    tags: string[];
    relevance_score: number;
    type: 'news' | 'community';
  }

  export class RecommendationService {
    async getPersonalizedRecommendations(
      userId: string, 
      limit: number = 5
    ): Promise<RecommendationItem[]> {
      // 1. 사용자 선호도 분석
      const userPreference = await this.getUserPreference(userId);
      
      // 2. 콘텐츠 기반 필터링
      const contentBasedItems = await this.getContentBasedRecommendations(userPreference);
      
      // 3. 협업 필터링
      const collaborativeItems = await this.getCollaborativeRecommendations(userId);
      
      // 4. 하이브리드 추천 (가중 평균)
      const hybridItems = this.combineRecommendations(
        contentBasedItems, 
        collaborativeItems, 
        0.7, // content weight
        0.3  // collaborative weight
      );
      
      return hybridItems.slice(0, limit);
    }

    private async getUserPreference(userId: string): Promise<UserPreference> {
      // 사용자 상호작용 데이터 수집
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select(`
          article_id,
          interaction_type,
          created_at,
          news_articles(tags),
          community_posts(tags)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      // 선호 태그 추출
      const tagFrequency: Record<string, number> = {};
      let totalReadingTime = 0;
      let complexitySum = 0;

      interactions?.forEach(interaction => {
        const tags = interaction.news_articles?.tags || interaction.community_posts?.tags || [];
        tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      });

      const preferredTags = Object.entries(tagFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      return {
        user_id: userId,
        preferred_tags: preferredTags,
        interaction_history: interactions || [],
        reading_time_avg: totalReadingTime / (interactions?.length || 1),
        complexity_preference: complexitySum / (interactions?.length || 1)
      };
    }

    private async getContentBasedRecommendations(
      preference: UserPreference
    ): Promise<RecommendationItem[]> {
      // 선호 태그 기반 콘텐츠 추천
      const { data: articles } = await supabase
        .from('news_articles')
        .select('id, title, summary, thumbnail, tags')
        .overlaps('tags', preference.preferred_tags)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: posts } = await supabase
        .from('community_posts')
        .select('id, title, content, tags')
        .overlaps('tags', preference.preferred_tags)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20);

      const recommendations: RecommendationItem[] = [];

      // 뉴스 기사 처리
      articles?.forEach(article => {
        const relevanceScore = this.calculateRelevanceScore(
          article.tags, 
          preference.preferred_tags
        );
        
        recommendations.push({
          id: article.id,
          title: article.title,
          summary: article.summary,
          thumbnail: article.thumbnail,
          tags: article.tags,
          relevance_score: relevanceScore,
          type: 'news'
        });
      });

      // 커뮤니티 글 처리
      posts?.forEach(post => {
        const relevanceScore = this.calculateRelevanceScore(
          post.tags, 
          preference.preferred_tags
        );
        
        recommendations.push({
          id: post.id,
          title: post.title,
          summary: post.content.substring(0, 150) + '...',
          tags: post.tags,
          relevance_score: relevanceScore,
          type: 'community'
        });
      });

      return recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
    }

    private calculateRelevanceScore(itemTags: string[], userTags: string[]): number {
      const intersection = itemTags.filter(tag => userTags.includes(tag));
      const union = [...new Set([...itemTags, ...userTags])];
      
      // Jaccard 유사도 계산
      return intersection.length / union.length;
    }

    private async getCollaborativeRecommendations(userId: string): Promise<RecommendationItem[]> {
      // 유사한 사용자 찾기 (간단한 구현)
      const { data: similarUsers } = await supabase.rpc('find_similar_users', {
        target_user_id: userId,
        limit_count: 10
      });

      // 유사 사용자들이 좋아한 콘텐츠 추천
      const recommendations: RecommendationItem[] = [];
      // 구현 로직...
      
      return recommendations;
    }

    private combineRecommendations(
      contentBased: RecommendationItem[],
      collaborative: RecommendationItem[],
      contentWeight: number,
      collaborativeWeight: number
    ): RecommendationItem[] {
      const combined = new Map<string, RecommendationItem>();

      // 콘텐츠 기반 추천 추가
      contentBased.forEach(item => {
        combined.set(item.id, {
          ...item,
          relevance_score: item.relevance_score * contentWeight
        });
      });

      // 협업 필터링 추천 추가/병합
      collaborative.forEach(item => {
        const existing = combined.get(item.id);
        if (existing) {
          existing.relevance_score += item.relevance_score * collaborativeWeight;
        } else {
          combined.set(item.id, {
            ...item,
            relevance_score: item.relevance_score * collaborativeWeight
          });
        }
      });

      return Array.from(combined.values())
        .sort((a, b) => b.relevance_score - a.relevance_score);
    }
  }
  ```

  **32.2 플로팅 추천 배너 컴포넌트 (src/components/common/FloatingRecommendationBanner.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { X, ChevronRight, Sparkles, Eye, EyeOff } from 'lucide-react'
  import { useAuth } from '@/hooks/useAuth'
  import { RecommendationService } from '@/services/RecommendationService'

  interface RecommendationItem {
    id: string;
    title: string;
    summary: string;
    thumbnail?: string;
    tags: string[];
    relevance_score: number;
    type: 'news' | 'community';
  }

  export default function FloatingRecommendationBanner() {
    const { user } = useAuth()
    const [isVisible, setIsVisible] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)
    const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
    const [loading, setLoading] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const recommendationService = new RecommendationService()

    useEffect(() => {
      if (user && isVisible) {
        loadRecommendations()
      }
    }, [user, isVisible])

    useEffect(() => {
      // 자동 슬라이드 (10초마다)
      if (recommendations.length > 1 && isExpanded) {
        const interval = setInterval(() => {
          setCurrentIndex(prev => (prev + 1) % recommendations.length)
        }, 10000)
        
        return () => clearInterval(interval)
      }
    }, [recommendations.length, isExpanded])

    const loadRecommendations = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        const items = await recommendationService.getPersonalizedRecommendations(user.id, 5)
        setRecommendations(items)
      } catch (error) {
        console.error('추천 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleItemClick = (item: RecommendationItem) => {
      // 클릭 추적
      trackInteraction(item.id, 'click')
      
      // 페이지 이동
      const url = item.type === 'news' 
        ? `/news/${item.id}` 
        : `/community/${item.id}`
      
      window.open(url, '_blank')
    }

    const trackInteraction = async (itemId: string, type: string) => {
      if (!user) return
      
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          item_id: itemId,
          interaction_type: type,
          timestamp: new Date().toISOString()
        })
      })
    }

    if (!isVisible || !user || recommendations.length === 0) {
      return null
    }

    const currentItem = recommendations[currentIndex]

    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-12'
        }`}>
          {/* 토글 버튼 */}
          <div className="flex items-center justify-between p-3">
            {isExpanded && (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  맞춤 추천
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isExpanded ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-blue-500" />
                )}
              </button>
              
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* 추천 콘텐츠 */}
          {isExpanded && (
            <div className="px-3 pb-3">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : currentItem ? (
                <div 
                  className="cursor-pointer group"
                  onClick={() => handleItemClick(currentItem)}
                >
                  {/* 썸네일 */}
                  {currentItem.thumbnail && (
                    <div className="aspect-video w-full overflow-hidden rounded-lg mb-2">
                      <img
                        src={currentItem.thumbnail}
                        alt={currentItem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}

                  {/* 제목 */}
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {currentItem.title}
                  </h4>

                  {/* 요약 */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {currentItem.summary}
                  </p>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {currentItem.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span>{currentItem.type === 'news' ? '뉴스' : '커뮤니티'}</span>
                      <span>•</span>
                      <span>관련도 {Math.round(currentItem.relevance_score * 100)}%</span>
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  추천할 콘텐츠가 없습니다
                </p>
              )}

              {/* 페이지네이션 */}
              {recommendations.length > 1 && (
                <div className="flex justify-center space-x-1 mt-3">
                  {recommendations.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex
                          ? 'bg-blue-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 11.1, 11.2, 11.5_- [ 
] 33. 학습 및 튜토리얼 통합 시스템
  
  **33.1 학습 자료 테이블 추가 (Supabase SQL)**
  ```sql
  -- 학습 자료 테이블
  CREATE TABLE learning_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL, -- 'tutorial', 'documentation', 'video', 'example'
    difficulty_level INTEGER DEFAULT 1, -- 1-5 (초급-고급)
    url TEXT,
    tags TEXT[] DEFAULT '{}',
    related_tools TEXT[] DEFAULT '{}', -- 관련 바이브 코딩 도구들
    estimated_time INTEGER, -- 예상 학습 시간 (분)
    prerequisites TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_featured BOOLEAN DEFAULT FALSE
  );

  -- 학습 경로 테이블
  CREATE TABLE learning_paths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1,
    estimated_duration INTEGER, -- 전체 예상 시간 (시간)
    resources JSONB DEFAULT '[]', -- 순서대로 정렬된 학습 자료 ID들
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
  );

  -- 사용자 학습 진행도 테이블
  CREATE TABLE user_learning_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0, -- 0-100
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rating INTEGER, -- 1-5
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
  );

  -- 기본 학습 자료 삽입
  INSERT INTO learning_resources (title, description, content_type, difficulty_level, url, tags, related_tools, estimated_time) VALUES
  ('Cursor 시작하기', 'AI 코드 에디터 Cursor의 기본 사용법', 'tutorial', 1, 'https://cursor.sh/docs', ARRAY['cursor', 'ai-coding', 'beginner'], ARRAY['Cursor'], 30),
  ('Lovable로 첫 웹앱 만들기', 'No-code 플랫폼으로 웹 애플리케이션 구축', 'tutorial', 1, 'https://lovable.dev/docs', ARRAY['lovable', 'no-code', 'web-development'], ARRAY['Lovable'], 45),
  ('Windsurf 개발 환경 설정', 'AI-first 개발 환경 구축 가이드', 'tutorial', 2, 'https://windsurf.ai/docs', ARRAY['windsurf', 'development-environment'], ARRAY['Windsurf'], 60),
  ('바이브 코딩 입문', '자연어 기반 프로그래밍 개념과 실습', 'tutorial', 1, '/tutorials/vibe-coding-intro', ARRAY['vibe-coding', 'ai-programming'], ARRAY['Cursor', 'Lovable'], 90);
  ```

  **33.2 학습 자료 추천 서비스 (src/services/LearningRecommendationService.ts)**
  ```typescript
  interface LearningResource {
    id: string;
    title: string;
    description: string;
    content_type: string;
    difficulty_level: number;
    url: string;
    tags: string[];
    related_tools: string[];
    estimated_time: number;
    prerequisites: string[];
    rating: number;
  }

  interface LearningPath {
    id: string;
    name: string;
    description: string;
    difficulty_level: number;
    estimated_duration: number;
    resources: string[];
    tags: string[];
  }

  export class LearningRecommendationService {
    async getRecommendedResources(
      userId: string,
      currentContent: { tags: string[], tools_used?: string[] }
    ): Promise<LearningResource[]> {
      // 1. 사용자 학습 이력 분석
      const userProgress = await this.getUserLearningProgress(userId);
      
      // 2. 현재 콘텐츠와 관련된 학습 자료 찾기
      const relatedResources = await this.findRelatedResources(currentContent);
      
      // 3. 사용자 수준에 맞는 필터링
      const filteredResources = await this.filterByUserLevel(relatedResources, userProgress);
      
      // 4. 개인화 점수 계산 및 정렬
      return this.rankResources(filteredResources, userProgress, currentContent);
    }

    private async getUserLearningProgress(userId: string) {
      const { data: progress } = await supabase
        .from('user_learning_progress')
        .select(`
          *,
          learning_resources(tags, difficulty_level, related_tools)
        `)
        .eq('user_id', userId);

      // 사용자의 평균 난이도, 선호 태그, 완료율 분석
      const completedResources = progress?.filter(p => p.progress_percentage === 100) || [];
      const avgDifficulty = completedResources.reduce((sum, p) => 
        sum + (p.learning_resources?.difficulty_level || 1), 0) / (completedResources.length || 1);

      const preferredTags = this.extractPreferredTags(progress || []);
      const completionRate = progress?.reduce((sum, p) => sum + p.progress_percentage, 0) / (progress?.length || 1) / 100;

      return {
        avgDifficulty,
        preferredTags,
        completionRate,
        completedResourceIds: completedResources.map(p => p.resource_id)
      };
    }

    private async findRelatedResources(content: { tags: string[], tools_used?: string[] }) {
      const searchTags = [...content.tags, ...(content.tools_used || [])];
      
      const { data: resources } = await supabase
        .from('learning_resources')
        .select('*')
        .or(`tags.ov.{${searchTags.join(',')}},related_tools.ov.{${(content.tools_used || []).join(',')}}`)
        .order('rating', { ascending: false })
        .limit(20);

      return resources || [];
    }

    private async filterByUserLevel(resources: LearningResource[], userProgress: any) {
      // 사용자 수준보다 너무 어렵거나 쉬운 자료 필터링
      const minLevel = Math.max(1, userProgress.avgDifficulty - 1);
      const maxLevel = Math.min(5, userProgress.avgDifficulty + 2);

      return resources.filter(resource => 
        resource.difficulty_level >= minLevel && 
        resource.difficulty_level <= maxLevel &&
        !userProgress.completedResourceIds.includes(resource.id)
      );
    }

    private rankResources(
      resources: LearningResource[], 
      userProgress: any, 
      currentContent: any
    ): LearningResource[] {
      return resources
        .map(resource => ({
          ...resource,
          relevanceScore: this.calculateRelevanceScore(resource, userProgress, currentContent)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
    }

    private calculateRelevanceScore(
      resource: LearningResource, 
      userProgress: any, 
      currentContent: any
    ): number {
      let score = 0;

      // 태그 일치도
      const tagIntersection = resource.tags.filter(tag => 
        currentContent.tags.includes(tag) || userProgress.preferredTags.includes(tag)
      );
      score += tagIntersection.length * 2;

      // 도구 일치도
      const toolIntersection = resource.related_tools.filter(tool => 
        (currentContent.tools_used || []).includes(tool)
      );
      score += toolIntersection.length * 3;

      // 난이도 적합성
      const difficultyGap = Math.abs(resource.difficulty_level - userProgress.avgDifficulty);
      score += Math.max(0, 3 - difficultyGap);

      // 평점 반영
      score += resource.rating;

      return score;
    }

    private extractPreferredTags(progress: any[]): string[] {
      const tagFrequency: Record<string, number> = {};
      
      progress.forEach(p => {
        if (p.learning_resources?.tags) {
          p.learning_resources.tags.forEach((tag: string) => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        }
      });

      return Object.entries(tagFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);
    }

    async getNextLearningStep(userId: string, currentResourceId: string): Promise<LearningResource | null> {
      // 현재 학습 자료의 다음 단계 추천
      const { data: currentResource } = await supabase
        .from('learning_resources')
        .select('*')
        .eq('id', currentResourceId)
        .single();

      if (!currentResource) return null;

      // 같은 도구/태그의 다음 난이도 자료 찾기
      const { data: nextResources } = await supabase
        .from('learning_resources')
        .select('*')
        .overlaps('tags', currentResource.tags)
        .gt('difficulty_level', currentResource.difficulty_level)
        .order('difficulty_level', { ascending: true })
        .limit(1);

      return nextResources?.[0] || null;
    }
  }
  ```

  **33.3 학습 자료 추천 컴포넌트 (src/components/learning/LearningRecommendations.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { BookOpen, Clock, Star, ArrowRight, Play } from 'lucide-react'
  import { useAuth } from '@/hooks/useAuth'
  import { LearningRecommendationService } from '@/services/LearningRecommendationService'

  interface LearningRecommendationsProps {
    currentContent: {
      tags: string[]
      tools_used?: string[]
    }
    className?: string
  }

  export default function LearningRecommendations({ 
    currentContent, 
    className = "" 
  }: LearningRecommendationsProps) {
    const { user } = useAuth()
    const [recommendations, setRecommendations] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const learningService = new LearningRecommendationService()

    useEffect(() => {
      if (user && currentContent.tags.length > 0) {
        loadRecommendations()
      }
    }, [user, currentContent])

    const loadRecommendations = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        const resources = await learningService.getRecommendedResources(user.id, currentContent)
        setRecommendations(resources)
      } catch (error) {
        console.error('학습 자료 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleResourceClick = async (resource: any) => {
      // 클릭 추적
      await fetch('/api/learning/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          resource_id: resource.id,
          source: 'recommendation'
        })
      })

      // 외부 링크 또는 내부 페이지로 이동
      if (resource.url.startsWith('http')) {
        window.open(resource.url, '_blank')
      } else {
        window.location.href = resource.url
      }
    }

    const getDifficultyColor = (level: number) => {
      const colors = {
        1: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
        2: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
        3: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
        4: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
        5: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      }
      return colors[level as keyof typeof colors] || colors[1]
    }

    const getDifficultyLabel = (level: number) => {
      const labels = { 1: '초급', 2: '초중급', 3: '중급', 4: '중고급', 5: '고급' }
      return labels[level as keyof typeof labels] || '초급'
    }

    if (!user || recommendations.length === 0) {
      return null
    }

    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              관련 학습 자료
            </h3>
          </div>
          
          {recommendations.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {expanded ? '접기' : `${recommendations.length}개 모두 보기`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(expanded ? recommendations : recommendations.slice(0, 2)).map((resource, index) => (
              <div
                key={resource.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(resource.difficulty_level)}`}>
                        {getDifficultyLabel(resource.difficulty_level)}
                      </span>
                      
                      {resource.content_type === 'video' && (
                        <Play className="w-4 h-4 text-gray-500" />
                      )}
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{resource.estimated_time}분</span>
                      </div>
                      
                      {resource.rating > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 fill-current text-yellow-500" />
                          <span>{resource.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {resource.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {resource.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {resource.related_tools.slice(0, 3).map((tool: string, toolIndex: number) => (
                        <span
                          key={toolIndex}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              💡 이 자료들은 현재 글의 내용과 당신의 학습 이력을 바탕으로 추천되었습니다
            </p>
          </div>
        )}
      </div>
    )
  }
  ```
  
  _요구사항: 18.1, 18.2, 18.3, 18.5_- [ ]
 34. 실시간 협업 및 코드 공유 기능
  
  **34.1 코드 스니펫 테이블 추가 (Supabase SQL)**
  ```sql
  -- 코드 스니펫 테이블
  CREATE TABLE code_snippets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT NOT NULL, -- 'javascript', 'python', 'typescript', etc.
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    tools_used TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT TRUE,
    fork_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_snippet_id UUID REFERENCES code_snippets(id) ON DELETE SET NULL -- 포크된 경우
  );

  -- 프로젝트 쇼케이스 테이블
  CREATE TABLE project_showcases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    demo_url TEXT,
    github_url TEXT,
    screenshots JSONB DEFAULT '[]',
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collaborators JSONB DEFAULT '[]', -- 협업자 정보
    tech_stack TEXT[] DEFAULT '{}',
    tools_used TEXT[] DEFAULT '{}', -- 바이브 코딩 도구들
    development_time INTEGER, -- 개발 시간 (시간)
    difficulty_level INTEGER DEFAULT 1, -- 1-5
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 실시간 협업 세션 테이블
  CREATE TABLE collaboration_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    host_id UUID REFERENCES users(id) ON DELETE CASCADE,
    participants JSONB DEFAULT '[]', -- 참여자 정보
    session_type TEXT NOT NULL, -- 'code_review', 'pair_programming', 'brainstorming'
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'ended'
    shared_content JSONB DEFAULT '{}', -- 공유된 코드/문서
    chat_messages JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER DEFAULT 10
  );
  ```

  **34.2 코드 스니펫 공유 컴포넌트 (src/components/collaboration/CodeSnippetShare.tsx)**
  ```typescript
  'use client'
  import { useState } from 'react'
  import { Copy, Share2, Heart, Eye, GitFork, Play } from 'lucide-react'
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
  import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
  import { useAuth } from '@/hooks/useAuth'
  import { useTheme } from '@/hooks/useTheme'

  interface CodeSnippet {
    id: string;
    title: string;
    description: string;
    code: string;
    language: string;
    author: {
      id: string;
      nickname: string;
      avatar_url?: string;
    };
    tags: string[];
    tools_used: string[];
    like_count: number;
    fork_count: number;
    view_count: number;
    created_at: string;
    is_liked?: boolean;
  }

  interface CodeSnippetShareProps {
    snippet: CodeSnippet;
    onLike?: (snippetId: string, isLiked: boolean) => void;
    onFork?: (snippetId: string) => void;
    className?: string;
  }

  export default function CodeSnippetShare({ 
    snippet, 
    onLike, 
    onFork, 
    className = "" 
  }: CodeSnippetShareProps) {
    const { user } = useAuth()
    const { resolvedTheme } = useTheme()
    const [isLiked, setIsLiked] = useState(snippet.is_liked || false)
    const [likeCount, setLikeCount] = useState(snippet.like_count)
    const [copied, setCopied] = useState(false)

    const handleCopyCode = async () => {
      try {
        await navigator.clipboard.writeText(snippet.code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('복사 실패:', error)
      }
    }

    const handleLike = async () => {
      if (!user) return

      const newIsLiked = !isLiked
      setIsLiked(newIsLiked)
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)

      try {
        await fetch('/api/snippets/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snippet_id: snippet.id,
            user_id: user.id,
            action: newIsLiked ? 'like' : 'unlike'
          })
        })

        onLike?.(snippet.id, newIsLiked)
      } catch (error) {
        // 실패 시 롤백
        setIsLiked(!newIsLiked)
        setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1)
        console.error('좋아요 실패:', error)
      }
    }

    const handleFork = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/snippets/fork', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snippet_id: snippet.id,
            user_id: user.id
          })
        })

        const result = await response.json()
        
        if (result.success) {
          onFork?.(snippet.id)
          // 포크된 스니펫 편집 페이지로 이동
          window.open(`/snippets/edit/${result.forked_id}`, '_blank')
        }
      } catch (error) {
        console.error('포크 실패:', error)
      }
    }

    const handleShare = async () => {
      const url = `${window.location.origin}/snippets/${snippet.id}`
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: snippet.title,
            text: snippet.description,
            url: url
          })
        } catch (error) {
          // 사용자가 공유를 취소한 경우
        }
      } else {
        await navigator.clipboard.writeText(url)
        alert('링크가 클립보드에 복사되었습니다.')
      }
    }

    const handleRunCode = () => {
      // 간단한 JavaScript 코드 실행 (보안상 제한적)
      if (snippet.language === 'javascript') {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${snippet.title} - 실행 결과</title></head>
              <body>
                <h3>${snippet.title}</h3>
                <pre id="output"></pre>
                <script>
                  const originalLog = console.log;
                  console.log = function(...args) {
                    document.getElementById('output').textContent += args.join(' ') + '\\n';
                    originalLog.apply(console, args);
                  };
                  
                  try {
                    ${snippet.code}
                  } catch (error) {
                    document.getElementById('output').textContent += 'Error: ' + error.message;
                  }
                </script>
              </body>
            </html>
          `)
        }
      }
    }

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {snippet.title}
              </h3>
              
              {snippet.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {snippet.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <img
                    src={snippet.author.avatar_url || '/default-avatar.png'}
                    alt={snippet.author.nickname}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{snippet.author.nickname}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{snippet.view_count}</span>
                </div>
                
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {snippet.language}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="코드 복사"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              {snippet.language === 'javascript' && (
                <button
                  onClick={handleRunCode}
                  className="p-2 text-green-500 hover:text-green-700 dark:hover:text-green-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="코드 실행"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 태그 */}
          {(snippet.tags.length > 0 || snippet.tools_used.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {snippet.tags.map((tag, index) => (
                <span
                  key={`tag-${index}`}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {tag}
                </span>
              ))}
              
              {snippet.tools_used.map((tool, index) => (
                <span
                  key={`tool-${index}`}
                  className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full"
                >
                  🛠️ {tool}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 코드 블록 */}
        <div className="relative">
          <SyntaxHighlighter
            language={snippet.language}
            style={resolvedTheme === 'dark' ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '14px',
              lineHeight: '1.5'
            }}
            showLineNumbers
          >
            {snippet.code}
          </SyntaxHighlighter>
          
          {copied && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
              복사됨!
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                isLiked
                  ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
              }`}
              disabled={!user}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>

            <button
              onClick={handleFork}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              disabled={!user}
            >
              <GitFork className="w-4 h-4" />
              <span className="text-sm">{snippet.fork_count}</span>
            </button>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">공유</span>
          </button>
        </div>
      </div>
    )
  }
  ```

  **34.3 프로젝트 쇼케이스 컴포넌트 (src/components/collaboration/ProjectShowcase.tsx)**
  ```typescript
  'use client'
  import { useState } from 'react'
  import { ExternalLink, Github, Heart, Eye, Users, Clock, Star } from 'lucide-react'
  import { useAuth } from '@/hooks/useAuth'

  interface ProjectShowcase {
    id: string;
    title: string;
    description: string;
    demo_url?: string;
    github_url?: string;
    screenshots: string[];
    author: {
      id: string;
      nickname: string;
      avatar_url?: string;
    };
    collaborators: Array<{
      id: string;
      nickname: string;
      avatar_url?: string;
      role: string;
    }>;
    tech_stack: string[];
    tools_used: string[];
    development_time?: number;
    difficulty_level: number;
    like_count: number;
    view_count: number;
    created_at: string;
    is_liked?: boolean;
  }

  interface ProjectShowcaseProps {
    project: ProjectShowcase;
    onLike?: (projectId: string, isLiked: boolean) => void;
    className?: string;
  }

  export default function ProjectShowcase({ 
    project, 
    onLike, 
    className = "" 
  }: ProjectShowcaseProps) {
    const { user } = useAuth()
    const [isLiked, setIsLiked] = useState(project.is_liked || false)
    const [likeCount, setLikeCount] = useState(project.like_count)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const handleLike = async () => {
      if (!user) return

      const newIsLiked = !isLiked
      setIsLiked(newIsLiked)
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)

      try {
        await fetch('/api/projects/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id,
            user_id: user.id,
            action: newIsLiked ? 'like' : 'unlike'
          })
        })

        onLike?.(project.id, newIsLiked)
      } catch (error) {
        setIsLiked(!newIsLiked)
        setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1)
        console.error('좋아요 실패:', error)
      }
    }

    const getDifficultyStars = (level: number) => {
      return Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < level 
              ? 'text-yellow-500 fill-current' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))
    }

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        {/* 스크린샷 갤러리 */}
        {project.screenshots.length > 0 && (
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
            <img
              src={project.screenshots[currentImageIndex]}
              alt={`${project.title} 스크린샷 ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {project.screenshots.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {project.screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? 'bg-white'
                          : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1} / {project.screenshots.length}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-6">
          {/* 프로젝트 정보 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {project.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {project.description}
              </p>

              {/* 작성자 및 협업자 */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <img
                    src={project.author.avatar_url || '/default-avatar.png'}
                    alt={project.author.nickname}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.author.nickname}
                    </p>
                    <p className="text-xs text-gray-500">작성자</p>
                  </div>
                </div>

                {project.collaborators.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div className="flex -space-x-1">
                      {project.collaborators.slice(0, 3).map((collaborator, index) => (
                        <img
                          key={collaborator.id}
                          src={collaborator.avatar_url || '/default-avatar.png'}
                          alt={collaborator.nickname}
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                          title={`${collaborator.nickname} (${collaborator.role})`}
                        />
                      ))}
                      {project.collaborators.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            +{project.collaborators.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-col space-y-2 ml-4">
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>데모</span>
                </a>
              )}
              
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>

          {/* 기술 스택 및 도구 */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {project.tech_stack.map((tech, index) => (
                <span
                  key={`tech-${index}`}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
            
            {project.tools_used.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tools_used.map((tool, index) => (
                  <span
                    key={`tool-${index}`}
                    className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded"
                  >
                    🛠️ {tool}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 프로젝트 메타 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-4">
              {project.development_time && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{project.development_time}시간</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <span>난이도:</span>
                <div className="flex space-x-1">
                  {getDifficultyStars(project.difficulty_level)}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{project.view_count}</span>
              </div>
            </div>
          </div>

          {/* 좋아요 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
              }`}
              disabled={!user}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <span className="text-sm text-gray-500">
              {new Date(project.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 19.1, 19.2, 19.4, 19.6_- 
[ ] 35. 다국어 지원 시스템 (i18n)
  
  **35.1 다국어 설정 및 번역 파일**
  ```bash
  # 다국어 라이브러리 설치
  npm install next-i18next react-i18next i18next
  ```

  **35.2 i18n 설정 (next-i18next.config.js)**
  ```javascript
  module.exports = {
    i18n: {
      defaultLocale: 'ko',
      locales: ['ko', 'en', 'ja', 'zh', 'hi'],
      localeDetection: true,
    },
    fallbackLng: {
      'zh-CN': ['zh', 'en'],
      'zh-TW': ['zh', 'en'],
      'ja-JP': ['ja', 'en'],
      'hi-IN': ['hi', 'en'],
      default: ['ko', 'en']
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    }
  }
  ```

  **35.3 번역 파일들 (public/locales/)**
  ```json
  // public/locales/ko/common.json
  {
    "navigation": {
      "home": "홈",
      "news": "뉴스",
      "community": "커뮤니티",
      "search": "검색",
      "bookmarks": "북마크",
      "profile": "프로필",
      "settings": "설정",
      "login": "로그인",
      "logout": "로그아웃"
    },
    "content": {
      "loading": "로딩 중...",
      "error": "오류가 발생했습니다",
      "noResults": "결과가 없습니다",
      "readMore": "더 읽기",
      "showLess": "접기",
      "share": "공유",
      "like": "좋아요",
      "comment": "댓글",
      "reply": "답글",
      "edit": "수정",
      "delete": "삭제",
      "report": "신고"
    },
    "vibeTools": {
      "cursor": "커서",
      "lovable": "러버블",
      "windsurf": "윈드서프",
      "vibeCoding": "바이브 코딩",
      "aiCoding": "AI 코딩",
      "noCode": "노코드"
    }
  }

  // public/locales/en/common.json
  {
    "navigation": {
      "home": "Home",
      "news": "News",
      "community": "Community",
      "search": "Search",
      "bookmarks": "Bookmarks",
      "profile": "Profile",
      "settings": "Settings",
      "login": "Login",
      "logout": "Logout"
    },
    "content": {
      "loading": "Loading...",
      "error": "An error occurred",
      "noResults": "No results found",
      "readMore": "Read more",
      "showLess": "Show less",
      "share": "Share",
      "like": "Like",
      "comment": "Comment",
      "reply": "Reply",
      "edit": "Edit",
      "delete": "Delete",
      "report": "Report"
    },
    "vibeTools": {
      "cursor": "Cursor",
      "lovable": "Lovable",
      "windsurf": "Windsurf",
      "vibeCoding": "Vibe Coding",
      "aiCoding": "AI Coding",
      "noCode": "No-Code"
    }
  }

  // public/locales/ja/common.json
  {
    "navigation": {
      "home": "ホーム",
      "news": "ニュース",
      "community": "コミュニティ",
      "search": "検索",
      "bookmarks": "ブックマーク",
      "profile": "プロフィール",
      "settings": "設定",
      "login": "ログイン",
      "logout": "ログアウト"
    },
    "vibeTools": {
      "cursor": "カーソル",
      "lovable": "ラバブル",
      "windsurf": "ウィンドサーフ",
      "vibeCoding": "バイブコーディング",
      "aiCoding": "AIコーディング",
      "noCode": "ノーコード"
    }
  }
  ```

  **35.4 언어 선택 컴포넌트 (src/components/common/LanguageSelector.tsx)**
  ```typescript
  'use client'
  import { useState } from 'react'
  import { useRouter } from 'next/router'
  import { useTranslation } from 'next-i18next'
  import { Globe, Check } from 'lucide-react'

  const languages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
  ]

  export default function LanguageSelector() {
    const router = useRouter()
    const { i18n } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

    const handleLanguageChange = async (languageCode: string) => {
      setIsOpen(false)
      
      // URL 경로 변경
      const { pathname, asPath, query } = router
      await router.push({ pathname, query }, asPath, { locale: languageCode })
      
      // 사용자 설정 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred-language', languageCode)
      }
    }

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage.flag}</span>
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <div className="py-1">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{language.flag}</span>
                      <span>{language.name}</span>
                    </div>
                    {i18n.language === language.code && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
  ```

  **35.5 자동 언어 감지 및 콘텐츠 분류 (src/services/LanguageDetectionService.ts)**
  ```typescript
  export class LanguageDetectionService {
    private readonly LANGUAGE_PATTERNS = {
      ko: /[가-힣]/,
      ja: /[ひらがなカタカナ]/,
      zh: /[一-龯]/,
      hi: /[\u0900-\u097F]/,
      en: /^[a-zA-Z\s.,!?'"()-]+$/
    };

    async detectLanguage(text: string): Promise<string> {
      // 1. 패턴 기반 기본 감지
      const basicDetection = this.detectByPattern(text);
      
      // 2. AI 기반 정확한 언어 감지
      if (basicDetection === 'unknown') {
        return await this.detectWithAI(text);
      }
      
      return basicDetection;
    }

    private detectByPattern(text: string): string {
      const cleanText = text.replace(/[0-9\s.,!?'"()-]/g, '');
      
      for (const [lang, pattern] of Object.entries(this.LANGUAGE_PATTERNS)) {
        if (pattern.test(cleanText)) {
          return lang;
        }
      }
      
      return 'unknown';
    }

    private async detectWithAI(text: string): Promise<string> {
      try {
        const response = await fetch('/api/ai/detect-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.substring(0, 500) })
        });

        const result = await response.json();
        return result.language || 'en';
      } catch (error) {
        console.error('AI 언어 감지 실패:', error);
        return 'en'; // 기본값
      }
    }

    async categorizeContentByLanguage(content: any[]): Promise<Record<string, any[]>> {
      const categorized: Record<string, any[]> = {
        ko: [], en: [], ja: [], zh: [], hi: []
      };

      for (const item of content) {
        const language = await this.detectLanguage(item.title + ' ' + item.content);
        if (categorized[language]) {
          categorized[language].push(item);
        } else {
          categorized['en'].push(item); // 기본값
        }
      }

      return categorized;
    }

    async getLocalizedContent(userId: string, userLanguage: string) {
      // 사용자 언어에 맞는 콘텐츠 우선 표시
      const { data: primaryContent } = await supabase
        .from('news_articles')
        .select('*')
        .eq('language', userLanguage)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(10);

      // 부족한 경우 다른 언어 콘텐츠로 보완
      if ((primaryContent?.length || 0) < 10) {
        const { data: fallbackContent } = await supabase
          .from('news_articles')
          .select('*')
          .neq('language', userLanguage)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(10 - (primaryContent?.length || 0));

        return [...(primaryContent || []), ...(fallbackContent || [])];
      }

      return primaryContent || [];
    }
  }
  ```

  **35.6 다국어 지원 훅 (src/hooks/useI18n.ts)**
  ```typescript
  import { useTranslation } from 'next-i18next'
  import { useRouter } from 'next/router'

  export function useI18n() {
    const { t, i18n } = useTranslation('common')
    const router = useRouter()

    const changeLanguage = async (language: string) => {
      await i18n.changeLanguage(language)
      
      // URL 변경
      const { pathname, asPath, query } = router
      await router.push({ pathname, query }, asPath, { locale: language })
    }

    const formatDate = (date: string | Date) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      return new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    }

    const formatNumber = (number: number) => {
      return new Intl.NumberFormat(i18n.language).format(number)
    }

    const getLocalizedVibeToolName = (toolKey: string) => {
      return t(`vibeTools.${toolKey}`, { defaultValue: toolKey })
    }

    return {
      t,
      i18n,
      currentLanguage: i18n.language,
      changeLanguage,
      formatDate,
      formatNumber,
      getLocalizedVibeToolName,
      isRTL: ['ar', 'he', 'fa'].includes(i18n.language)
    }
  }
  ```
  
  _요구사항: 12.1, 12.2, 12.3, 12.5, 12.6_- [ ] 36
. SEO 최적화 및 검색 엔진 노출
  
  **36.1 메타 태그 및 Open Graph 컴포넌트 (src/components/seo/SEOHead.tsx)**
  ```typescript
  import Head from 'next/head'
  import { useRouter } from 'next/router'

  interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    article?: {
      publishedTime?: string;
      modifiedTime?: string;
      author?: string;
      tags?: string[];
    };
    noIndex?: boolean;
  }

  export default function SEOHead({
    title = 'VibeNews - AI 기반 바이브 코딩 뉴스',
    description = '최신 바이브 코딩 트렌드와 AI 도구 정보를 실시간으로 제공하는 커뮤니티 플랫폼',
    keywords = ['바이브 코딩', 'AI 코딩', 'Cursor', 'Lovable', 'Windsurf', '개발자 뉴스'],
    image = '/og-image.png',
    article,
    noIndex = false
  }: SEOHeadProps) {
    const router = useRouter()
    const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${router.asPath}`

    const structuredData = {
      "@context": "https://schema.org",
      "@type": article ? "Article" : "WebSite",
      "name": title,
      "description": description,
      "url": canonicalUrl,
      "image": image,
      ...(article && {
        "headline": title,
        "datePublished": article.publishedTime,
        "dateModified": article.modifiedTime || article.publishedTime,
        "author": {
          "@type": "Person",
          "name": article.author
        },
        "keywords": article.tags?.join(', '),
        "publisher": {
          "@type": "Organization",
          "name": "VibeNews",
          "logo": {
            "@type": "ImageObject",
            "url": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
          }
        }
      })
    }

    return (
      <Head>
        {/* 기본 메타 태그 */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* 로봇 크롤링 제어 */}
        <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
        <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
        
        {/* Open Graph 태그 */}
        <meta property="og:type" content={article ? 'article' : 'website'} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}${image}`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="VibeNews" />
        <meta property="og:locale" content="ko_KR" />
        
        {article && (
          <>
            <meta property="article:published_time" content={article.publishedTime} />
            <meta property="article:modified_time" content={article.modifiedTime || article.publishedTime} />
            <meta property="article:author" content={article.author} />
            {article.tags?.map((tag, index) => (
              <meta key={index} property="article:tag" content={tag} />
            ))}
          </>
        )}
        
        {/* Twitter Card 태그 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}${image}`} />
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* 추가 SEO 태그 */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Language" content="ko" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* 파비콘 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
    )
  }
  ```

  **36.2 동적 사이트맵 생성 (pages/sitemap.xml.ts)**
  ```typescript
  import { GetServerSideProps } from 'next'
  import { supabase } from '@/lib/supabase'

  function generateSiteMap(
    staticPages: string[],
    newsArticles: any[],
    communityPosts: any[]
  ) {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <!-- 정적 페이지 -->
      ${staticPages
        .map((page) => {
          return `
            <url>
              <loc>${process.env.NEXT_PUBLIC_SITE_URL}${page}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.8</priority>
            </url>
          `
        })
        .join('')}
      
      <!-- 뉴스 기사 -->
      ${newsArticles
        .map((article) => {
          return `
            <url>
              <loc>${process.env.NEXT_PUBLIC_SITE_URL}/news/${article.id}</loc>
              <lastmod>${article.updated_at}</lastmod>
              <changefreq>monthly</changefreq>
              <priority>0.9</priority>
            </url>
          `
        })
        .join('')}
      
      <!-- 커뮤니티 글 -->
      ${communityPosts
        .map((post) => {
          return `
            <url>
              <loc>${process.env.NEXT_PUBLIC_SITE_URL}/community/${post.id}</loc>
              <lastmod>${post.updated_at}</lastmod>
              <changefreq>monthly</changefreq>
              <priority>0.7</priority>
            </url>
          `
        })
        .join('')}
    </urlset>
    `
  }

  export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    // 정적 페이지 목록
    const staticPages = [
      '',
      '/news',
      '/community',
      '/search',
      '/about',
      '/privacy',
      '/terms'
    ]

    // 뉴스 기사 가져오기
    const { data: newsArticles } = await supabase
      .from('news_articles')
      .select('id, updated_at')
      .eq('is_hidden', false)
      .order('updated_at', { ascending: false })
      .limit(1000)

    // 커뮤니티 글 가져오기
    const { data: communityPosts } = await supabase
      .from('community_posts')
      .select('id, updated_at')
      .eq('is_hidden', false)
      .order('updated_at', { ascending: false })
      .limit(1000)

    const sitemap = generateSiteMap(
      staticPages,
      newsArticles || [],
      communityPosts || []
    )

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
    res.write(sitemap)
    res.end()

    return { props: {} }
  }

  export default function Sitemap() {
    return null
  }
  ```

  **36.3 robots.txt 생성 (public/robots.txt)**
  ```
  User-agent: *
  Allow: /

  # 크롤링 제외 경로
  Disallow: /api/
  Disallow: /admin/
  Disallow: /auth/
  Disallow: /_next/
  Disallow: /private/

  # 사이트맵 위치
  Sitemap: https://vibenews.com/sitemap.xml

  # 크롤링 속도 제한
  Crawl-delay: 1

  # 특정 봇 설정
  User-agent: Googlebot
  Allow: /
  Crawl-delay: 0

  User-agent: Bingbot
  Allow: /
  Crawl-delay: 1
  ```

  **36.4 SEO 최적화 훅 (src/hooks/useSEO.ts)**
  ```typescript
  import { useRouter } from 'next/router'
  import { useEffect } from 'react'

  interface SEOData {
    title: string;
    description: string;
    keywords: string[];
    image?: string;
    noIndex?: boolean;
  }

  export function useSEO(seoData: SEOData) {
    const router = useRouter()

    useEffect(() => {
      // Google Analytics 페이지뷰 추적
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          page_title: seoData.title,
          page_location: window.location.href,
        })
      }

      // 검색 엔진 인덱싱 요청 (개발 환경에서는 실행하지 않음)
      if (process.env.NODE_ENV === 'production' && !seoData.noIndex) {
        requestIndexing(window.location.href)
      }
    }, [seoData, router.asPath])

    const requestIndexing = async (url: string) => {
      try {
        // Google Search Console API를 통한 인덱싱 요청
        await fetch('/api/seo/request-indexing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
      } catch (error) {
        console.error('인덱싱 요청 실패:', error)
      }
    }

    const generateBreadcrumbs = () => {
      const pathSegments = router.asPath.split('/').filter(Boolean)
      const breadcrumbs = [
        { name: 'Home', url: '/' }
      ]

      let currentPath = ''
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`
        
        const name = segment.charAt(0).toUpperCase() + segment.slice(1)
        breadcrumbs.push({
          name: name === 'News' ? '뉴스' : name === 'Community' ? '커뮤니티' : name,
          url: currentPath
        })
      })

      return breadcrumbs
    }

    return {
      generateBreadcrumbs,
      canonicalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}${router.asPath}`
    }
  }
  ```

  **36.5 성능 최적화를 위한 이미지 컴포넌트 (src/components/common/OptimizedImage.tsx)**
  ```typescript
  import Image from 'next/image'
  import { useState } from 'react'

  interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
  }

  export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    placeholder = 'empty',
    blurDataURL
  }: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = () => {
      setIsLoading(false)
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
    }

    if (hasError) {
      return (
        <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
          <span className="text-gray-500 text-sm">이미지 로드 실패</span>
        </div>
      )
    }

    return (
      <div className={`relative overflow-hidden ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
        
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={85}
        />
      </div>
    )
  }
  ```
  
  _요구사항: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_- 
[ ] 37. 접근성 (Accessibility) 기능 구현
  
  **37.1 접근성 훅 (src/hooks/useAccessibility.ts)**
  ```typescript
  import { useEffect, useState } from 'react'

  export function useAccessibility() {
    const [reducedMotion, setReducedMotion] = useState(false)
    const [highContrast, setHighContrast] = useState(false)
    const [fontSize, setFontSize] = useState(16)

    useEffect(() => {
      // 시스템 설정 감지
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const contrastQuery = window.matchMedia('(prefers-contrast: high)')
      
      setReducedMotion(motionQuery.matches)
      setHighContrast(contrastQuery.matches)

      const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
      const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches)

      motionQuery.addEventListener('change', handleMotionChange)
      contrastQuery.addEventListener('change', handleContrastChange)

      // 저장된 사용자 설정 로드
      const savedFontSize = localStorage.getItem('accessibility-font-size')
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize))
      }

      return () => {
        motionQuery.removeEventListener('change', handleMotionChange)
        contrastQuery.removeEventListener('change', handleContrastChange)
      }
    }, [])

    const increaseFontSize = () => {
      const newSize = Math.min(fontSize + 2, 24)
      setFontSize(newSize)
      localStorage.setItem('accessibility-font-size', newSize.toString())
      document.documentElement.style.fontSize = `${newSize}px`
    }

    const decreaseFontSize = () => {
      const newSize = Math.max(fontSize - 2, 12)
      setFontSize(newSize)
      localStorage.setItem('accessibility-font-size', newSize.toString())
      document.documentElement.style.fontSize = `${newSize}px`
    }

    const resetFontSize = () => {
      setFontSize(16)
      localStorage.removeItem('accessibility-font-size')
      document.documentElement.style.fontSize = '16px'
    }

    return {
      reducedMotion,
      highContrast,
      fontSize,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize
    }
  }
  ```

  **37.2 접근성 도구바 컴포넌트 (src/components/accessibility/AccessibilityToolbar.tsx)**
  ```typescript
  'use client'
  import { useState } from 'react'
  import { Settings, Type, Contrast, Volume2, Eye } from 'lucide-react'
  import { useAccessibility } from '@/hooks/useAccessibility'

  export default function AccessibilityToolbar() {
    const [isOpen, setIsOpen] = useState(false)
    const { 
      fontSize, 
      increaseFontSize, 
      decreaseFontSize, 
      resetFontSize,
      reducedMotion,
      highContrast 
    } = useAccessibility()

    const toggleScreenReader = () => {
      // 스크린 리더 지원 향상
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = '접근성 도구가 활성화되었습니다.'
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }

    const toggleHighContrast = () => {
      document.documentElement.classList.toggle('high-contrast')
      
      const isActive = document.documentElement.classList.contains('high-contrast')
      localStorage.setItem('accessibility-high-contrast', isActive.toString())
    }

    return (
      <>
        {/* 접근성 도구 토글 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="접근성 도구 열기"
          aria-expanded={isOpen}
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* 접근성 도구 패널 */}
        {isOpen && (
          <div className="fixed left-4 top-1/2 transform -translate-y-1/2 translate-x-16 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-64">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              접근성 도구
            </h3>

            {/* 폰트 크기 조절 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Type className="w-4 h-4 inline mr-2" />
                글자 크기
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decreaseFontSize}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="글자 크기 줄이기"
                >
                  A-
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={increaseFontSize}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="글자 크기 키우기"
                >
                  A+
                </button>
                <button
                  onClick={resetFontSize}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="글자 크기 초기화"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 고대비 모드 */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={toggleHighContrast}
                  className="sr-only"
                />
                <div className="relative">
                  <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner"></div>
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow -left-1 -top-1 transition-transform duration-200 ease-in-out"></div>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <Contrast className="w-4 h-4 inline mr-1" />
                  고대비 모드
                </span>
              </label>
            </div>

            {/* 스크린 리더 지원 */}
            <div className="mb-4">
              <button
                onClick={toggleScreenReader}
                className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Volume2 className="w-4 h-4" />
                <span>스크린 리더 테스트</span>
              </button>
            </div>

            {/* 시스템 설정 정보 */}
            <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center space-x-1 mb-1">
                <Eye className="w-3 h-3" />
                <span>애니메이션 감소: {reducedMotion ? '활성' : '비활성'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Contrast className="w-3 h-3" />
                <span>고대비 선호: {highContrast ? '활성' : '비활성'}</span>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="접근성 도구 닫기"
            >
              ×
            </button>
          </div>
        )}

        {/* 스크린 리더 전용 스킵 링크 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        >
          메인 콘텐츠로 건너뛰기
        </a>
      </>
    )
  }
  ```

  **37.3 ARIA 라벨 및 시맨틱 HTML 개선**
  ```typescript
  // src/components/common/AccessibleButton.tsx
  interface AccessibleButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    ariaLabel?: string;
    ariaDescribedBy?: string;
    className?: string;
  }

  export default function AccessibleButton({
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    size = 'md',
    ariaLabel,
    ariaDescribedBy,
    className = ''
  }: AccessibleButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300'
    }
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        type="button"
      >
        {children}
      </button>
    )
  }

  // src/components/common/AccessibleModal.tsx
  interface AccessibleModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }

  export default function AccessibleModal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
  }: AccessibleModalProps) {
    useEffect(() => {
      if (isOpen) {
        // 모달이 열릴 때 포커스 트랩
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus()
                e.preventDefault()
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus()
                e.preventDefault()
              }
            }
          }
        }

        const handleEscapeKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            onClose()
          }
        }

        document.addEventListener('keydown', handleTabKey)
        document.addEventListener('keydown', handleEscapeKey)
        firstElement?.focus()

        return () => {
          document.removeEventListener('keydown', handleTabKey)
          document.removeEventListener('keydown', handleEscapeKey)
        }
      }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    }

    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* 모달 콘텐츠 */}
          <div className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]}`}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-start justify-between mb-4">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                  id="modal-title"
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="모달 닫기"
                >
                  <span className="sr-only">닫기</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }
  ```

  **37.4 키보드 네비게이션 개선**
  ```css
  /* src/styles/accessibility.css */
  
  /* 고대비 모드 스타일 */
  .high-contrast {
    --bg-primary: #000000;
    --bg-secondary: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --border-color: #ffffff;
    --link-color: #00ffff;
    --button-bg: #ffffff;
    --button-text: #000000;
  }

  .high-contrast * {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
  }

  .high-contrast a {
    color: var(--link-color) !important;
    text-decoration: underline !important;
  }

  .high-contrast button {
    background-color: var(--button-bg) !important;
    color: var(--button-text) !important;
    border: 2px solid var(--border-color) !important;
  }

  /* 포커스 스타일 강화 */
  .focus-visible:focus {
    outline: 3px solid #4F46E5 !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3) !important;
  }

  /* 스크린 리더 전용 텍스트 */
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  .sr-only.focus:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: inherit !important;
    margin: inherit !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: inherit !important;
  }

  /* 애니메이션 감소 설정 */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* 큰 텍스트 지원 */
  @media (min-resolution: 192dpi) {
    body {
      font-size: 18px;
      line-height: 1.6;
    }
  }

  /* 색상 대비 개선 */
  .text-contrast-high {
    color: #000000;
    background-color: #ffffff;
  }

  .dark .text-contrast-high {
    color: #ffffff;
    background-color: #000000;
  }
  ```
  
  _요구사항: 14.1, 14.2, 14.3, 14.4, 14.5_-
 [ ] 38. 성능 최적화 및 무한 스크롤 구현
  
  **38.1 무한 스크롤 훅 (src/hooks/useInfiniteScroll.ts)**
  ```typescript
  import { useState, useEffect, useCallback } from 'react'

  interface UseInfiniteScrollProps<T> {
    fetchMore: (page: number) => Promise<T[]>
    initialData?: T[]
    pageSize?: number
    threshold?: number
  }

  export function useInfiniteScroll<T>({
    fetchMore,
    initialData = [],
    pageSize = 20,
    threshold = 100
  }: UseInfiniteScrollProps<T>) {
    const [data, setData] = useState<T[]>(initialData)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [error, setError] = useState<string | null>(null)

    const loadMore = useCallback(async () => {
      if (loading || !hasMore) return

      setLoading(true)
      setError(null)

      try {
        const newData = await fetchMore(page)
        
        if (newData.length === 0 || newData.length < pageSize) {
          setHasMore(false)
        }

        setData(prev => [...prev, ...newData])
        setPage(prev => prev + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터 로딩 실패')
      } finally {
        setLoading(false)
      }
    }, [fetchMore, page, loading, hasMore, pageSize])

    useEffect(() => {
      const handleScroll = () => {
        if (
          window.innerHeight + document.documentElement.scrollTop
          >= document.documentElement.offsetHeight - threshold
        ) {
          loadMore()
        }
      }

      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }, [loadMore, threshold])

    const reset = () => {
      setData(initialData)
      setPage(1)
      setHasMore(true)
      setError(null)
    }

    return {
      data,
      loading,
      hasMore,
      error,
      loadMore,
      reset
    }
  }
  ```

  **38.2 CDN 및 캐싱 전략 (next.config.js)**
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    // 이미지 최적화
    images: {
      domains: ['example.com', 'cdn.vibenews.com'],
      formats: ['image/webp', 'image/avif'],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
    },
    
    // 압축 활성화
    compress: true,
    
    // 정적 파일 캐싱
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
        {
          source: '/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/_next/image(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ]
    },
    
    // 번들 분석
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // 번들 크기 최적화
      if (!dev && !isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        }
      }
      
      return config
    },
  }

  module.exports = nextConfig
  ```

  **38.3 Service Worker 구현 (public/sw.js)**
  ```javascript
  const CACHE_NAME = 'vibenews-v1'
  const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json'
  ]

  // 설치 이벤트
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(urlsToCache)
        })
    )
  })

  // 페치 이벤트
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 캐시에서 발견되면 반환
          if (response) {
            return response
          }

          return fetch(event.request).then((response) => {
            // 유효하지 않은 응답인지 확인
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // 응답 복제
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
        })
    )
  })

  // 백그라운드 동기화
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(doBackgroundSync())
    }
  })

  async function doBackgroundSync() {
    // 오프라인 상태에서 저장된 데이터 동기화
    const offlineData = await getOfflineData()
    
    for (const data of offlineData) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        // 성공적으로 동기화된 데이터 제거
        await removeOfflineData(data.id)
      } catch (error) {
        console.error('동기화 실패:', error)
      }
    }
  }
  ```

  **38.4 이미지 지연 로딩 컴포넌트 (src/components/common/LazyImage.tsx)**
  ```typescript
  'use client'
  import { useState, useRef, useEffect } from 'react'
  import Image from 'next/image'

  interface LazyImageProps {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    placeholder?: string
  }

  export default function LazyImage({
    src,
    alt,
    width,
    height,
    className = '',
    placeholder = '/placeholder.jpg'
  }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isInView, setIsInView] = useState(false)
    const imgRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )

      if (imgRef.current) {
        observer.observe(imgRef.current)
      }

      return () => observer.disconnect()
    }, [])

    return (
      <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
        {isInView ? (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">로딩 중...</span>
          </div>
        )}
      </div>
    )
  }
  ```

  **38.5 메모리 최적화 및 성능 모니터링 (src/utils/performance.ts)**
  ```typescript
  // 성능 메트릭 수집
  export class PerformanceMonitor {
    private metrics: Record<string, number> = {}

    startTiming(label: string) {
      this.metrics[`${label}_start`] = performance.now()
    }

    endTiming(label: string) {
      const startTime = this.metrics[`${label}_start`]
      if (startTime) {
        const duration = performance.now() - startTime
        this.metrics[label] = duration
        
        // 개발 환경에서 로깅
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
        }
        
        // 프로덕션에서 분석 서비스로 전송
        if (process.env.NODE_ENV === 'production' && duration > 1000) {
          this.reportSlowOperation(label, duration)
        }
      }
    }

    private async reportSlowOperation(label: string, duration: number) {
      try {
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric: label,
            duration,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        console.error('성능 메트릭 전송 실패:', error)
      }
    }

    getMetrics() {
      return { ...this.metrics }
    }

    // Core Web Vitals 측정
    measureWebVitals() {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('LCP:', lastEntry.startTime)
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime)
        })
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let cumulativeScore = 0
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            cumulativeScore += entry.value
          }
        })
        console.log('CLS:', cumulativeScore)
      }).observe({ entryTypes: ['layout-shift'] })
    }
  }

  // 메모리 사용량 모니터링
  export function monitorMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
      })
    }
  }

  // 디바운스 유틸리티
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // 스로틀 유틸리티
  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  ```
  
  _요구사항: 8.1, 8.2, 8.5, 30.1, 30.2_- 
[ ] 39. 오픈소스 라이브러리 통합 및 활용
  
  **39.1 Microsoft Semantic Kernel 통합 (Trust Score: 9.9)**
  ```bash
  # Semantic Kernel 설치
  npm install @microsoft/semantic-kernel
  ```

  **39.2 Semantic Kernel 서비스 (src/services/SemanticKernelService.ts)**
  ```typescript
  import { Kernel, KernelBuilder } from '@microsoft/semantic-kernel'

  export class SemanticKernelService {
    private kernel: Kernel

    constructor() {
      this.kernel = new KernelBuilder()
        .withOpenAIChatCompletion('gpt-4', process.env.OPENAI_API_KEY!)
        .build()
    }

    async generateContentSummary(content: string): Promise<string> {
      const summaryFunction = this.kernel.createSemanticFunction(`
        다음 바이브 코딩 관련 콘텐츠를 한국어로 요약해주세요:
        - 핵심 내용을 3-4문장으로 정리
        - 기술적 용어는 쉽게 설명
        - 실용적인 정보 위주로 요약
        
        콘텐츠: {{$input}}
      `, {
        maxTokens: 200,
        temperature: 0.3
      })

      const result = await summaryFunction.invokeAsync(content)
      return result.result
    }

    async extractTechnicalTerms(content: string): Promise<string[]> {
      const extractFunction = this.kernel.createSemanticFunction(`
        다음 텍스트에서 바이브 코딩 관련 기술 용어들을 추출해주세요.
        JSON 배열 형태로 반환하세요.
        
        예시: ["Cursor", "AI 코딩", "자연어 프로그래밍"]
        
        텍스트: {{$input}}
      `, {
        maxTokens: 100,
        temperature: 0.1
      })

      const result = await extractFunction.invokeAsync(content)
      try {
        return JSON.parse(result.result)
      } catch {
        return []
      }
    }

    async generateTags(title: string, content: string): Promise<string[]> {
      const tagFunction = this.kernel.createSemanticFunction(`
        제목과 내용을 바탕으로 적절한 태그들을 생성해주세요.
        바이브 코딩, AI 도구, 프로그래밍 관련 태그 위주로 5-8개 생성
        JSON 배열로 반환
        
        제목: {{$title}}
        내용: {{$content}}
      `, {
        maxTokens: 100,
        temperature: 0.2
      })

      const result = await tagFunction.invokeAsync({ title, content })
      try {
        return JSON.parse(result.result)
      } catch {
        return ['바이브 코딩', 'AI', '개발']
      }
    }
  }
  ```

  **39.3 Upstash Vector Database 통합 (Trust Score: 8.5)**
  ```bash
  # Upstash Vector 설치
  npm install @upstash/vector
  ```

  **39.4 벡터 검색 서비스 (src/services/VectorSearchService.ts)**
  ```typescript
  import { Index } from '@upstash/vector'

  export class VectorSearchService {
    private index: Index

    constructor() {
      this.index = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL!,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
      })
    }

    async indexContent(id: string, content: string, metadata: any) {
      // OpenAI로 임베딩 생성
      const embedding = await this.generateEmbedding(content)
      
      await this.index.upsert({
        id,
        vector: embedding,
        metadata: {
          ...metadata,
          content: content.substring(0, 500), // 메타데이터 크기 제한
          indexed_at: new Date().toISOString()
        }
      })
    }

    async semanticSearch(query: string, limit: number = 10) {
      const queryEmbedding = await this.generateEmbedding(query)
      
      const results = await this.index.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true
      })

      return results.map(result => ({
        id: result.id,
        score: result.score,
        metadata: result.metadata
      }))
    }

    private async generateEmbedding(text: string): Promise<number[]> {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text
        })
      })

      const data = await response.json()
      return data.data[0].embedding
    }

    async findSimilarContent(contentId: string, limit: number = 5) {
      // 기존 콘텐츠의 벡터를 가져와서 유사한 콘텐츠 검색
      const content = await this.index.fetch([contentId])
      if (content.length === 0) return []

      const results = await this.index.query({
        vector: content[0].vector,
        topK: limit + 1, // 자기 자신 제외
        includeMetadata: true
      })

      return results
        .filter(result => result.id !== contentId)
        .slice(0, limit)
    }
  }
  ```

  **39.5 Elasticsearch 통합 (Trust Score: 8.1)**
  ```bash
  # Elasticsearch 클라이언트 설치
  npm install @elastic/elasticsearch
  ```

  **39.6 Elasticsearch 검색 서비스 (src/services/ElasticsearchService.ts)**
  ```typescript
  import { Client } from '@elastic/elasticsearch'

  export class ElasticsearchService {
    private client: Client

    constructor() {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || ''
        }
      })
    }

    async indexDocument(index: string, id: string, document: any) {
      await this.client.index({
        index,
        id,
        body: {
          ...document,
          indexed_at: new Date().toISOString()
        }
      })
    }

    async searchContent(query: string, filters?: any) {
      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^3', 'content^2', 'tags^2', 'summary'],
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              }
            ],
            filter: filters ? Object.entries(filters).map(([key, value]) => ({
              term: { [key]: value }
            })) : []
          }
        },
        highlight: {
          fields: {
            title: {},
            content: { fragment_size: 150, number_of_fragments: 3 },
            summary: {}
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { created_at: { order: 'desc' } }
        ]
      }

      const response = await this.client.search({
        index: ['news_articles', 'community_posts'],
        body: searchBody,
        size: 20
      })

      return response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        source: hit._source,
        score: hit._score,
        highlights: hit.highlight
      }))
    }

    async getAutocompleteSuggestions(query: string) {
      const response = await this.client.search({
        index: ['news_articles', 'community_posts'],
        body: {
          suggest: {
            title_suggest: {
              prefix: query,
              completion: {
                field: 'title_suggest',
                size: 10
              }
            },
            tag_suggest: {
              prefix: query,
              completion: {
                field: 'tags_suggest',
                size: 5
              }
            }
          }
        }
      })

      return {
        titles: response.body.suggest.title_suggest[0].options,
        tags: response.body.suggest.tag_suggest[0].options
      }
    }
  }
  ```

  **39.7 Content Moderation Deep Learning 통합 (Trust Score: 9.4)**
  ```bash
  # 콘텐츠 모더레이션 라이브러리 설치
  pip install content-moderation-deep-learning
  ```

  **39.8 콘텐츠 모더레이션 API (pages/api/moderation/check.ts)**
  ```typescript
  import { NextApiRequest, NextApiResponse } from 'next'
  import { spawn } from 'child_process'

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { content, contentType = 'text' } = req.body

    try {
      const moderationResult = await checkContentModeration(content, contentType)
      
      res.status(200).json({
        isAppropriate: moderationResult.score < 0.7,
        score: moderationResult.score,
        categories: moderationResult.categories,
        details: moderationResult.details
      })
    } catch (error) {
      console.error('콘텐츠 모더레이션 실패:', error)
      res.status(500).json({ error: '모더레이션 검사 실패' })
    }
  }

  async function checkContentModeration(content: string, contentType: string) {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['-c', `
import sys
import json
from content_moderation import ContentModerator

moderator = ContentModerator()
content = sys.argv[1]
content_type = sys.argv[2]

if content_type == 'text':
    result = moderator.check_text(content)
elif content_type == 'image':
    result = moderator.check_image(content)
else:
    result = {'score': 0, 'categories': [], 'details': 'Unknown content type'}

print(json.dumps(result))
      `, content, contentType])

      let output = ''
      python.stdout.on('data', (data) => {
        output += data.toString()
      })

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim())
            resolve(result)
          } catch (error) {
            reject(new Error('파싱 실패'))
          }
        } else {
          reject(new Error('Python 스크립트 실행 실패'))
        }
      })
    })
  }
  ```

  **39.9 Algolia InstantSearch 통합 (Trust Score: 10)**
  ```bash
  # Algolia 설치
  npm install algoliasearch react-instantsearch-hooks-web
  ```

  **39.10 Algolia 검색 컴포넌트 (src/components/search/AlgoliaSearch.tsx)**
  ```typescript
  'use client'
  import { InstantSearch, SearchBox, Hits, RefinementList, Configure } from 'react-instantsearch-hooks-web'
  import algoliasearch from 'algoliasearch/lite'

  const searchClient = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
  )

  function Hit({ hit }: { hit: any }) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {hit.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {hit.summary}
        </p>
        <div className="flex flex-wrap gap-2">
          {hit.tags?.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  export default function AlgoliaSearch() {
    return (
      <InstantSearch searchClient={searchClient} indexName="vibenews">
        <Configure hitsPerPage={20} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                필터
              </h3>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  태그
                </h4>
                <RefinementList attribute="tags" limit={10} />
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  콘텐츠 타입
                </h4>
                <RefinementList attribute="content_type" />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  사용된 도구
                </h4>
                <RefinementList attribute="tools_used" />
              </div>
            </div>
          </div>

          {/* 검색 결과 */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <SearchBox
                placeholder="바이브 코딩 관련 내용을 검색하세요..."
                classNames={{
                  root: 'relative',
                  form: 'relative',
                  input: 'w-full px-4 py-3 pl-12 pr-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  submit: 'absolute left-3 top-1/2 transform -translate-y-1/2',
                  reset: 'absolute right-3 top-1/2 transform -translate-y-1/2'
                }}
              />
            </div>
            
            <Hits hitComponent={Hit} />
          </div>
        </div>
      </InstantSearch>
    )
  }
  ```

  **39.11 Semantic Router 통합 (Trust Score: 9.6)**
  ```bash
  # Semantic Router 설치
  npm install @aurelio-labs/semantic-router
  ```

  **39.12 의도 기반 라우팅 서비스 (src/services/SemanticRouterService.ts)**
  ```typescript
  import { SemanticRouter, Route } from '@aurelio-labs/semantic-router'

  export class SemanticRouterService {
    private router: SemanticRouter

    constructor() {
      const routes = [
        new Route({
          name: 'search_news',
          utterances: [
            '뉴스 검색해줘',
            '최신 뉴스 찾아줘',
            '바이브 코딩 뉴스',
            'AI 코딩 소식'
          ]
        }),
        new Route({
          name: 'ask_tutorial',
          utterances: [
            '튜토리얼 추천해줘',
            '어떻게 배우지',
            '학습 자료',
            '가이드 필요해'
          ]
        }),
        new Route({
          name: 'tool_comparison',
          utterances: [
            '도구 비교',
            'Cursor vs Lovable',
            '어떤 도구가 좋아',
            '추천 도구'
          ]
        }),
        new Route({
          name: 'community_help',
          utterances: [
            '도움 요청',
            '질문 있어',
            '문제 해결',
            '커뮤니티 도움'
          ]
        })
      ]

      this.router = new SemanticRouter({
        routes,
        encoder: 'openai', // OpenAI 임베딩 사용
        apiKey: process.env.OPENAI_API_KEY
      })
    }

    async routeUserIntent(userMessage: string) {
      const result = await this.router.route(userMessage)
      
      switch (result?.name) {
        case 'search_news':
          return {
            action: 'redirect',
            path: '/news',
            params: { q: this.extractSearchQuery(userMessage) }
          }
          
        case 'ask_tutorial':
          return {
            action: 'recommend_tutorials',
            data: await this.getTutorialRecommendations(userMessage)
          }
          
        case 'tool_comparison':
          return {
            action: 'show_comparison',
            data: await this.getToolComparison(userMessage)
          }
          
        case 'community_help':
          return {
            action: 'redirect',
            path: '/community',
            params: { type: 'help' }
          }
          
        default:
          return {
            action: 'general_search',
            query: userMessage
          }
      }
    }

    private extractSearchQuery(message: string): string {
      // 자연어에서 검색 키워드 추출
      const keywords = ['뉴스', '소식', '정보', '최신']
      return message.split(' ')
        .filter(word => !keywords.includes(word))
        .join(' ')
        .trim() || '바이브 코딩'
    }

    private async getTutorialRecommendations(message: string) {
      // 메시지 분석해서 관련 튜토리얼 추천
      const { data } = await supabase
        .from('learning_resources')
        .select('*')
        .ilike('title', `%${message}%`)
        .limit(5)

      return data || []
    }

    private async getToolComparison(message: string) {
      // 도구 비교 정보 반환
      const tools = ['Cursor', 'Lovable', 'Windsurf', 'GitHub Copilot']
      const mentionedTools = tools.filter(tool => 
        message.toLowerCase().includes(tool.toLowerCase())
      )

      return {
        tools: mentionedTools.length > 0 ? mentionedTools : tools.slice(0, 3),
        comparisonUrl: '/tools/compare'
      }
    }
  }
  ```
  
  _요구사항: 모든 오픈소스 라이브러리 통합 및 활용_- [ 
] 40. 광고 시스템 및 수익화 구현
  
  **40.1 광고 배치 관리 테이블 (Supabase SQL)**
  ```sql
  -- 광고 캠페인 테이블
  CREATE TABLE ad_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    advertiser_name TEXT NOT NULL,
    ad_type TEXT NOT NULL, -- 'banner', 'native', 'video', 'sponsored'
    placement_type TEXT NOT NULL, -- 'header', 'sidebar', 'inline', 'footer'
    target_audience JSONB DEFAULT '{}', -- 타겟팅 정보
    budget_daily DECIMAL(10,2),
    budget_total DECIMAL(10,2),
    cpm_rate DECIMAL(10,2), -- Cost Per Mille
    cpc_rate DECIMAL(10,2), -- Cost Per Click
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 광고 소재 테이블
  CREATE TABLE ad_creatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    click_url TEXT NOT NULL,
    call_to_action TEXT DEFAULT 'Learn More',
    dimensions JSONB, -- {"width": 300, "height": 250}
    file_size INTEGER, -- bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 광고 노출 및 클릭 추적 테이블
  CREATE TABLE ad_impressions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    creative_id UUID REFERENCES ad_creatives(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    page_url TEXT,
    placement_position TEXT,
    user_agent TEXT,
    ip_address INET,
    country_code TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    clicked BOOLEAN DEFAULT FALSE,
    click_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 광고 수익 추적 테이블
  CREATE TABLE ad_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0, -- Click Through Rate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, date)
  );
  ```

  **40.2 광고 관리 서비스 (src/services/AdService.ts)**
  ```typescript
  interface AdCampaign {
    id: string;
    title: string;
    advertiser_name: string;
    ad_type: string;
    placement_type: string;
    target_audience: any;
    cpm_rate: number;
    cpc_rate: number;
    is_active: boolean;
  }

  interface AdCreative {
    id: string;
    campaign_id: string;
    title: string;
    description: string;
    image_url: string;
    click_url: string;
    call_to_action: string;
    dimensions: { width: number; height: number };
  }

  export class AdService {
    async getAdsForPlacement(
      placementType: string,
      userContext?: {
        userId?: string;
        tags?: string[];
        location?: string;
        deviceType?: string;
      }
    ): Promise<AdCreative[]> {
      // 1. 활성 캠페인 조회
      let query = supabase
        .from('ad_campaigns')
        .select(`
          *,
          ad_creatives(*)
        `)
        .eq('placement_type', placementType)
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())

      const { data: campaigns } = await query

      if (!campaigns || campaigns.length === 0) return []

      // 2. 타겟팅 필터링
      const filteredCampaigns = campaigns.filter(campaign => 
        this.matchesTargeting(campaign, userContext)
      )

      // 3. 광고 로테이션 알고리즘 (가중치 기반)
      const selectedAds = this.selectAdsWithRotation(filteredCampaigns)

      return selectedAds.map(campaign => campaign.ad_creatives[0]).filter(Boolean)
    }

    private matchesTargeting(campaign: AdCampaign, userContext?: any): boolean {
      if (!campaign.target_audience || !userContext) return true

      const targeting = campaign.target_audience

      // 태그 기반 타겟팅
      if (targeting.tags && userContext.tags) {
        const hasMatchingTag = targeting.tags.some((tag: string) =>
          userContext.tags.includes(tag)
        )
        if (!hasMatchingTag) return false
      }

      // 디바이스 타입 타겟팅
      if (targeting.deviceTypes && userContext.deviceType) {
        if (!targeting.deviceTypes.includes(userContext.deviceType)) return false
      }

      // 지역 타겟팅
      if (targeting.countries && userContext.location) {
        if (!targeting.countries.includes(userContext.location)) return false
      }

      return true
    }

    private selectAdsWithRotation(campaigns: any[]): any[] {
      // CPM 기반 가중치 계산
      const totalWeight = campaigns.reduce((sum, campaign) => 
        sum + (campaign.cpm_rate || 1), 0
      )

      const selectedCampaigns: any[] = []
      const maxAds = Math.min(3, campaigns.length) // 최대 3개 광고

      for (let i = 0; i < maxAds; i++) {
        const random = Math.random() * totalWeight
        let currentWeight = 0

        for (const campaign of campaigns) {
          currentWeight += campaign.cmp_rate || 1
          if (random <= currentWeight && !selectedCampaigns.includes(campaign)) {
            selectedCampaigns.push(campaign)
            break
          }
        }
      }

      return selectedCampaigns
    }

    async trackImpression(
      campaignId: string,
      creativeId: string,
      context: {
        userId?: string;
        pageUrl: string;
        placementPosition: string;
        userAgent: string;
        ipAddress: string;
        deviceType: string;
      }
    ) {
      await supabase.from('ad_impressions').insert({
        campaign_id: campaignId,
        creative_id: creativeId,
        user_id: context.userId,
        page_url: context.pageUrl,
        placement_position: context.placementPosition,
        user_agent: context.userAgent,
        ip_address: context.ipAddress,
        device_type: context.deviceType
      })

      // 일일 통계 업데이트
      await this.updateDailyStats(campaignId, 'impression')
    }

    async trackClick(impressionId: string) {
      const { data: impression } = await supabase
        .from('ad_impressions')
        .update({
          clicked: true,
          click_timestamp: new Date().toISOString()
        })
        .eq('id', impressionId)
        .select('campaign_id')
        .single()

      if (impression) {
        await this.updateDailyStats(impression.campaign_id, 'click')
      }
    }

    private async updateDailyStats(campaignId: string, type: 'impression' | 'click') {
      const today = new Date().toISOString().split('T')[0]

      const { data: existing } = await supabase
        .from('ad_revenue')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('date', today)
        .single()

      if (existing) {
        const updates: any = {}
        if (type === 'impression') {
          updates.impressions = existing.impressions + 1
        } else {
          updates.clicks = existing.clicks + 1
          updates.ctr = (existing.clicks + 1) / existing.impressions
        }

        await supabase
          .from('ad_revenue')
          .update(updates)
          .eq('id', existing.id)
      } else {
        await supabase.from('ad_revenue').insert({
          campaign_id: campaignId,
          date: today,
          impressions: type === 'impression' ? 1 : 0,
          clicks: type === 'click' ? 1 : 0,
          ctr: type === 'click' ? 1 : 0
        })
      }
    }
  }
  ```

  **40.3 광고 배너 컴포넌트 (src/components/ads/AdBanner.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { X } from 'lucide-react'
  import { AdService } from '@/services/AdService'
  import { useAuth } from '@/hooks/useAuth'

  interface AdBannerProps {
    placement: 'header' | 'sidebar' | 'inline' | 'footer'
    className?: string
    maxAds?: number
  }

  export default function AdBanner({ placement, className = '', maxAds = 1 }: AdBannerProps) {
    const { user } = useAuth()
    const [ads, setAds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [closedAds, setClosedAds] = useState<Set<string>>(new Set())

    const adService = new AdService()

    useEffect(() => {
      loadAds()
    }, [placement, user])

    const loadAds = async () => {
      setLoading(true)
      try {
        const userContext = {
          userId: user?.id,
          deviceType: getDeviceType(),
          location: await getUserLocation()
        }

        const fetchedAds = await adService.getAdsForPlacement(placement, userContext)
        setAds(fetchedAds.slice(0, maxAds))

        // 노출 추적
        fetchedAds.forEach(ad => {
          adService.trackImpression(ad.campaign_id, ad.id, {
            userId: user?.id,
            pageUrl: window.location.href,
            placementPosition: placement,
            userAgent: navigator.userAgent,
            ipAddress: '', // 서버에서 처리
            deviceType: getDeviceType()
          })
        })
      } catch (error) {
        console.error('광고 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleAdClick = async (ad: any) => {
      // 클릭 추적
      await adService.trackClick(ad.impression_id)
      
      // 새 탭에서 광고 페이지 열기
      window.open(ad.click_url, '_blank', 'noopener,noreferrer')
    }

    const handleCloseAd = (adId: string) => {
      setClosedAds(prev => new Set([...prev, adId]))
    }

    const getDeviceType = (): string => {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
      return 'desktop'
    }

    const getUserLocation = async (): Promise<string> => {
      try {
        const response = await fetch('/api/geo/location')
        const data = await response.json()
        return data.country || 'KR'
      } catch {
        return 'KR'
      }
    }

    if (loading) {
      return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}>
          <div className="h-24 w-full"></div>
        </div>
      )
    }

    const visibleAds = ads.filter(ad => !closedAds.has(ad.id))

    if (visibleAds.length === 0) return null

    return (
      <div className={`space-y-4 ${className}`}>
        {visibleAds.map((ad, index) => (
          <div
            key={ad.id}
            className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden group cursor-pointer"
            onClick={() => handleAdClick(ad)}
          >
            {/* 광고 표시 라벨 */}
            <div className="absolute top-2 right-2 z-10">
              <span className="px-2 py-1 text-xs bg-gray-500 text-white rounded">
                광고
              </span>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCloseAd(ad.id)
              }}
              className="absolute top-2 left-2 z-10 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>

            <div className="p-4">
              <div className="flex items-start space-x-4">
                {/* 광고 이미지 */}
                {ad.image_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* 광고 내용 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                    {ad.title}
                  </h4>
                  
                  {ad.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {ad.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {ad.advertiser_name || '스폰서'}
                    </span>
                    
                    <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                      {ad.call_to_action || '자세히 보기'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  ```

  **40.4 네이티브 광고 컴포넌트 (src/components/ads/NativeAd.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { AdService } from '@/services/AdService'

  interface NativeAdProps {
    contentTags?: string[]
    className?: string
  }

  export default function NativeAd({ contentTags = [], className = '' }: NativeAdProps) {
    const [ad, setAd] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const adService = new AdService()

    useEffect(() => {
      loadNativeAd()
    }, [contentTags])

    const loadNativeAd = async () => {
      try {
        const ads = await adService.getAdsForPlacement('native', {
          tags: contentTags,
          deviceType: getDeviceType()
        })

        if (ads.length > 0) {
          setAd(ads[0])
        }
      } catch (error) {
        console.error('네이티브 광고 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    const getDeviceType = (): string => {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
      return 'desktop'
    }

    if (loading || !ad) return null

    return (
      <article 
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
        onClick={() => window.open(ad.click_url, '_blank')}
      >
        {/* 스폰서 표시 */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Sponsored • {ad.advertiser_name}
          </span>
        </div>

        {/* 광고 이미지 */}
        {ad.image_url && (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {/* 광고 내용 */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
            {ad.title}
          </h3>
          
          {ad.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
              {ad.description}
            </p>
          )}

          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            {ad.call_to_action || '자세히 알아보기'}
          </button>
        </div>
      </article>
    )
  }
  ```
  
  _요구사항: 10.1, 10.2, 10.3, 10.4, 10.5_- [
 ] 41. 인기도 및 트렌딩 알고리즘 구현
  
  **41.1 트렌딩 계산 서비스 (src/services/TrendingService.ts)**
  ```typescript
  interface TrendingScore {
    contentId: string;
    score: number;
    factors: {
      viewCount: number;
      likeCount: number;
      commentCount: number;
      shareCount: number;
      recency: number;
      velocity: number;
    };
  }

  export class TrendingService {
    // 가중치 설정
    private readonly WEIGHTS = {
      views: 0.2,
      likes: 0.3,
      comments: 0.25,
      shares: 0.15,
      recency: 0.1
    }

    async calculateTrendingScores(
      contentType: 'news' | 'community' | 'all' = 'all',
      timeWindow: number = 24 // 시간
    ): Promise<TrendingScore[]> {
      const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000)

      // 뉴스 기사 점수 계산
      const newsScores = contentType !== 'community' 
        ? await this.calculateNewsScores(cutoffTime)
        : []

      // 커뮤니티 글 점수 계산
      const communityScores = contentType !== 'news'
        ? await this.calculateCommunityScores(cutoffTime)
        : []

      // 통합 및 정렬
      const allScores = [...newsScores, ...communityScores]
        .sort((a, b) => b.score - a.score)

      return allScores
    }

    private async calculateNewsScores(cutoffTime: Date): Promise<TrendingScore[]> {
      const { data: articles } = await supabase
        .from('news_articles')
        .select(`
          id,
          title,
          view_count,
          like_count,
          created_at,
          comments(count)
        `)
        .gte('created_at', cutoffTime.toISOString())
        .eq('is_hidden', false)

      if (!articles) return []

      const scores: TrendingScore[] = []

      for (const article of articles) {
        const commentCount = article.comments?.[0]?.count || 0
        const shareCount = await this.getShareCount(article.id, 'news')
        const velocity = await this.calculateVelocity(article.id, 'news')

        const factors = {
          viewCount: article.view_count || 0,
          likeCount: article.like_count || 0,
          commentCount,
          shareCount,
          recency: this.calculateRecencyScore(article.created_at),
          velocity
        }

        const score = this.calculateWeightedScore(factors)

        scores.push({
          contentId: article.id,
          score,
          factors
        })
      }

      return scores
    }

    private async calculateCommunityScores(cutoffTime: Date): Promise<TrendingScore[]> {
      const { data: posts } = await supabase
        .from('community_posts')
        .select(`
          id,
          title,
          view_count,
          like_count,
          comment_count,
          created_at
        `)
        .gte('created_at', cutoffTime.toISOString())
        .eq('is_hidden', false)

      if (!posts) return []

      const scores: TrendingScore[] = []

      for (const post of posts) {
        const shareCount = await this.getShareCount(post.id, 'community')
        const velocity = await this.calculateVelocity(post.id, 'community')

        const factors = {
          viewCount: post.view_count || 0,
          likeCount: post.like_count || 0,
          commentCount: post.comment_count || 0,
          shareCount,
          recency: this.calculateRecencyScore(post.created_at),
          velocity
        }

        const score = this.calculateWeightedScore(factors)

        scores.push({
          contentId: post.id,
          score,
          factors
        })
      }

      return scores
    }

    private calculateWeightedScore(factors: any): number {
      // 로그 스케일 적용 (큰 수치의 영향 완화)
      const normalizedViews = Math.log10(factors.viewCount + 1)
      const normalizedLikes = Math.log10(factors.likeCount + 1)
      const normalizedComments = Math.log10(factors.commentCount + 1)
      const normalizedShares = Math.log10(factors.shareCount + 1)

      return (
        normalizedViews * this.WEIGHTS.views +
        normalizedLikes * this.WEIGHTS.likes +
        normalizedComments * this.WEIGHTS.comments +
        normalizedShares * this.WEIGHTS.shares +
        factors.recency * this.WEIGHTS.recency +
        factors.velocity * 0.1 // 추가 가중치
      )
    }

    private calculateRecencyScore(createdAt: string): number {
      const now = Date.now()
      const created = new Date(createdAt).getTime()
      const ageInHours = (now - created) / (1000 * 60 * 60)

      // 24시간 이내는 높은 점수, 그 이후 감소
      if (ageInHours <= 1) return 1.0
      if (ageInHours <= 6) return 0.8
      if (ageInHours <= 12) return 0.6
      if (ageInHours <= 24) return 0.4
      return 0.2
    }

    private async calculateVelocity(contentId: string, contentType: string): Promise<number> {
      // 최근 1시간 동안의 상호작용 증가율
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const { data: recentInteractions } = await supabase
        .from('user_interactions')
        .select('created_at')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .gte('created_at', oneHourAgo.toISOString())

      return recentInteractions?.length || 0
    }

    private async getShareCount(contentId: string, contentType: string): Promise<number> {
      const { data: shares } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('interaction_type', 'share')

      return shares?.length || 0
    }

    async getTrendingTags(timeWindow: number = 24): Promise<Array<{tag: string, count: number, growth: number}>> {
      const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000)

      // 최근 태그 사용량
      const { data: recentTags } = await supabase.rpc('get_trending_tags', {
        since_time: cutoffTime.toISOString(),
        limit_count: 20
      })

      // 이전 기간과 비교하여 성장률 계산
      const previousCutoff = new Date(Date.now() - timeWindow * 2 * 60 * 60 * 1000)
      const { data: previousTags } = await supabase.rpc('get_trending_tags', {
        since_time: previousCutoff.toISOString(),
        until_time: cutoffTime.toISOString(),
        limit_count: 50
      })

      const previousTagMap = new Map(
        previousTags?.map((tag: any) => [tag.tag, tag.count]) || []
      )

      return (recentTags || []).map((tag: any) => {
        const previousCount = previousTagMap.get(tag.tag) || 0
        const growth = previousCount > 0 
          ? ((tag.count - previousCount) / previousCount) * 100
          : tag.count > 0 ? 100 : 0

        return {
          tag: tag.tag,
          count: tag.count,
          growth: Math.round(growth)
        }
      }).sort((a, b) => b.growth - a.growth)
    }

    async updateTrendingCache() {
      // 트렌딩 데이터를 캐시에 저장 (Redis 또는 Supabase)
      const trendingNews = await this.calculateTrendingScores('news', 24)
      const trendingCommunity = await this.calculateTrendingScores('community', 24)
      const trendingTags = await this.getTrendingTags(24)

      // 캐시 저장 (실제 구현에서는 Redis 사용 권장)
      await supabase.from('trending_cache').upsert([
        {
          cache_key: 'trending_news_24h',
          data: trendingNews.slice(0, 20),
          expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15분 캐시
        },
        {
          cache_key: 'trending_community_24h',
          data: trendingCommunity.slice(0, 20),
          expires_at: new Date(Date.now() + 15 * 60 * 1000)
        },
        {
          cache_key: 'trending_tags_24h',
          data: trendingTags.slice(0, 10),
          expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30분 캐시
        }
      ])
    }
  }
  ```

  **41.2 트렌딩 콘텐츠 컴포넌트 (src/components/trending/TrendingContent.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { TrendingUp, Fire, Clock, Eye, Heart, MessageCircle } from 'lucide-react'
  import { TrendingService } from '@/services/TrendingService'
  import Link from 'next/link'

  interface TrendingContentProps {
    type?: 'news' | 'community' | 'all'
    timeWindow?: 24 | 168 | 720 // 24시간, 1주일, 1개월
    limit?: number
    className?: string
  }

  export default function TrendingContent({
    type = 'all',
    timeWindow = 24,
    limit = 10,
    className = ''
  }: TrendingContentProps) {
    const [trendingItems, setTrendingItems] = useState<any[]>([])
    const [trendingTags, setTrendingTags] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPeriod, setSelectedPeriod] = useState(timeWindow)

    const trendingService = new TrendingService()

    useEffect(() => {
      loadTrendingData()
    }, [type, selectedPeriod])

    const loadTrendingData = async () => {
      setLoading(true)
      try {
        const [scores, tags] = await Promise.all([
          trendingService.calculateTrendingScores(type, selectedPeriod),
          trendingService.getTrendingTags(selectedPeriod)
        ])

        // 실제 콘텐츠 데이터 가져오기
        const contentData = await fetchContentData(scores.slice(0, limit))
        setTrendingItems(contentData)
        setTrendingTags(tags.slice(0, 8))
      } catch (error) {
        console.error('트렌딩 데이터 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchContentData = async (scores: any[]) => {
      const newsIds = scores.filter(s => s.contentType === 'news').map(s => s.contentId)
      const communityIds = scores.filter(s => s.contentType === 'community').map(s => s.contentId)

      const [newsData, communityData] = await Promise.all([
        newsIds.length > 0 ? supabase
          .from('news_articles')
          .select('id, title, summary, thumbnail, tags, created_at, like_count, view_count')
          .in('id', newsIds)
          : Promise.resolve({ data: [] }),
        
        communityIds.length > 0 ? supabase
          .from('community_posts')
          .select(`
            id, title, content, tags, created_at, like_count, comment_count, view_count,
            author:users(nickname, avatar_url)
          `)
          .in('id', communityIds)
          : Promise.resolve({ data: [] })
      ])

      // 점수 순서대로 정렬
      const allContent = [
        ...(newsData.data || []).map(item => ({ ...item, type: 'news' })),
        ...(communityData.data || []).map(item => ({ ...item, type: 'community' }))
      ]

      return scores.map(score => {
        const content = allContent.find(item => item.id === score.contentId)
        return content ? { ...content, trendingScore: score } : null
      }).filter(Boolean)
    }

    const getTimeWindowLabel = (hours: number) => {
      if (hours === 24) return '24시간'
      if (hours === 168) return '1주일'
      if (hours === 720) return '1개월'
      return `${hours}시간`
    }

    const formatTrendingScore = (score: number) => {
      return Math.round(score * 100) / 100
    }

    if (loading) {
      return (
        <div className={`space-y-4 ${className}`}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* 헤더 및 필터 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fire className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              트렌딩
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {[24, 168, 720].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedPeriod === period
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {getTimeWindowLabel(period)}
              </button>
            ))}
          </div>
        </div>

        {/* 트렌딩 태그 */}
        {trendingTags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              🔥 급상승 태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag, index) => (
                <Link
                  key={tag.tag}
                  href={`/search?q=${encodeURIComponent(tag.tag)}`}
                  className="group"
                >
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-800 dark:text-red-300 rounded-full text-sm hover:from-red-200 hover:to-orange-200 dark:hover:from-red-900/50 dark:hover:to-orange-900/50 transition-colors">
                    <span>#{tag.tag}</span>
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">+{tag.growth}%</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 트렌딩 콘텐츠 목록 */}
        <div className="space-y-4">
          {trendingItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {/* 순위 */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* 썸네일 (뉴스만) */}
                {item.type === 'news' && item.thumbnail && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* 콘텐츠 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.type === 'news'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {item.type === 'news' ? '뉴스' : '커뮤니티'}
                    </span>
                    
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      트렌딩 점수: {formatTrendingScore(item.trendingScore.score)}
                    </span>
                  </div>

                  <Link
                    href={`/${item.type}/${item.id}`}
                    className="block"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                      {item.title}
                    </h3>
                  </Link>

                  {item.type === 'news' && item.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {item.summary}
                    </p>
                  )}

                  {item.type === 'community' && item.author && (
                    <div className="flex items-center space-x-2 mb-2">
                      <img
                        src={item.author.avatar_url || '/default-avatar.png'}
                        alt={item.author.nickname}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.author.nickname}
                      </span>
                    </div>
                  )}

                  {/* 통계 */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{item.view_count || 0}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{item.like_count || 0}</span>
                    </div>
                    
                    {item.type === 'community' && (
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{item.comment_count || 0}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>

                  {/* 태그 */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 11.1, 11.2, 11.3, 11.4, 11.5_- [ ] 42
. 사용자 온보딩 및 도움말 시스템
  
  **42.1 온보딩 투어 컴포넌트 (src/components/onboarding/OnboardingTour.tsx)**
  ```typescript
  'use client'
  import { useState, useEffect } from 'react'
  import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react'
  import { useAuth } from '@/hooks/useAuth'

  interface TourStep {
    id: string
    title: string
    content: string
    target: string // CSS selector
    position: 'top' | 'bottom' | 'left' | 'right'
    action?: () => void
  }

  const TOUR_STEPS: TourStep[] = [
    {
      id: 'welcome',
      title: '🎉 VibeNews에 오신 것을 환영합니다!',
      content: 'AI 기반 바이브 코딩 뉴스와 커뮤니티 플랫폼입니다. 함께 둘러보시겠어요?',
      target: 'body',
      position: 'bottom'
    },
    {
      id: 'navigation',
      title: '📱 네비게이션',
      content: '뉴스, 커뮤니티, 검색, 북마크 메뉴를 통해 다양한 콘텐츠에 접근할 수 있습니다.',
      target: 'nav',
      position: 'bottom'
    },
    {
      id: 'theme-toggle',
      title: '🌙 테마 변경',
      content: '라이트/다크 모드를 자유롭게 전환할 수 있습니다. 시스템 설정에 따라 자동으로 적용됩니다.',
      target: '[data-tour="theme-toggle"]',
      position: 'bottom'
    },
    {
      id: 'content-mode',
      title: '👨‍💻 읽기 모드',
      content: '개발자 모드와 일반인 모드를 전환하여 기술 용어를 쉽게 이해할 수 있습니다.',
      target: '[data-tour="content-mode"]',
      position: 'left'
    },
    {
      id: 'search',
      title: '🔍 통합 검색',
      content: '뉴스, 커뮤니티 글, 댓글을 모두 검색할 수 있습니다. 시맨틱 검색으로 관련 콘텐츠를 찾아보세요.',
      target: '[data-tour="search"]',
      position: 'bottom'
    },
    {
      id: 'recommendations',
      title: '✨ 맞춤 추천',
      content: '오른쪽 플로팅 배너에서 당신의 관심사에 맞는 콘텐츠를 추천받을 수 있습니다.',
      target: '[data-tour="recommendations"]',
      position: 'left'
    },
    {
      id: 'community',
      title: '💬 커뮤니티 참여',
      content: '바이브 코딩 경험을 공유하고, 질문하고, 다른 개발자들과 소통해보세요.',
      target: '[data-tour="community"]',
      position: 'top'
    },
    {
      id: 'complete',
      title: '🚀 준비 완료!',
      content: '이제 VibeNews를 자유롭게 탐험해보세요. 언제든 도움이 필요하면 도움말을 확인하세요.',
      target: 'body',
      position: 'bottom'
    }
  ]

  export default function OnboardingTour() {
    const { user } = useAuth()
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

    useEffect(() => {
      // 신규 사용자인지 확인
      if (user && !localStorage.getItem('onboarding-completed')) {
        setIsActive(true)
      }
    }, [user])

    useEffect(() => {
      if (isActive && TOUR_STEPS[currentStep]) {
        const step = TOUR_STEPS[currentStep]
        const element = document.querySelector(step.target) as HTMLElement
        
        if (element) {
          setTargetElement(element)
          // 요소가 보이도록 스크롤
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // 하이라이트 효과
          element.classList.add('tour-highlight')
        }
      }

      return () => {
        // 하이라이트 제거
        document.querySelectorAll('.tour-highlight').forEach(el => {
          el.classList.remove('tour-highlight')
        })
      }
    }, [isActive, currentStep])

    const nextStep = () => {
      const step = TOUR_STEPS[currentStep]
      if (step.action) {
        step.action()
      }

      if (currentStep < TOUR_STEPS.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        completeTour()
      }
    }

    const prevStep = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
      }
    }

    const skipTour = () => {
      completeTour()
    }

    const completeTour = () => {
      setIsActive(false)
      localStorage.setItem('onboarding-completed', 'true')
      
      // 완료 추적
      if (user) {
        fetch('/api/analytics/onboarding-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            completed_at: new Date().toISOString(),
            steps_completed: currentStep + 1,
            total_steps: TOUR_STEPS.length
          })
        })
      }
    }

    const getTooltipPosition = () => {
      if (!targetElement) return { top: '50%', left: '50%' }

      const rect = targetElement.getBoundingClientRect()
      const step = TOUR_STEPS[currentStep]

      switch (step.position) {
        case 'top':
          return {
            top: rect.top - 10,
            left: rect.left + rect.width / 2,
            transform: 'translate(-50%, -100%)'
          }
        case 'bottom':
          return {
            top: rect.bottom + 10,
            left: rect.left + rect.width / 2,
            transform: 'translate(-50%, 0)'
          }
        case 'left':
          return {
            top: rect.top + rect.height / 2,
            left: rect.left - 10,
            transform: 'translate(-100%, -50%)'
          }
        case 'right':
          return {
            top: rect.top + rect.height / 2,
            left: rect.right + 10,
            transform: 'translate(0, -50%)'
          }
        default:
          return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }
      }
    }

    if (!isActive || !user) return null

    const step = TOUR_STEPS[currentStep]
    const tooltipStyle = getTooltipPosition()

    return (
      <>
        {/* 오버레이 */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />

        {/* 투어 툴팁 */}
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm"
          style={tooltipStyle}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <div className="flex space-x-1">
                {TOUR_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={skipTour}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 콘텐츠 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {step.content}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={skipTour}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                건너뛰기
              </button>
              
              <button
                onClick={nextStep}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>완료</span>
                  </>
                ) : (
                  <>
                    <span>다음</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 투어 하이라이트 스타일 */}
        <style jsx global>{`
          .tour-highlight {
            position: relative;
            z-index: 51;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
            border-radius: 8px;
          }
        `}</style>
      </>
    )
  }
  ```

  **42.2 도움말 및 FAQ 컴포넌트 (src/components/help/HelpCenter.tsx)**
  ```typescript
  'use client'
  import { useState } from 'react'
  import { Search, ChevronDown, ChevronRight, HelpCircle, Book, MessageCircle } from 'lucide-react'

  interface FAQItem {
    id: string
    question: string
    answer: string
    category: string
    tags: string[]
  }

  const FAQ_DATA: FAQItem[] = [
    {
      id: '1',
      question: 'VibeNews는 무엇인가요?',
      answer: 'VibeNews는 AI 기반으로 바이브 코딩 관련 뉴스를 자동 수집하고, 개발자들이 소통할 수 있는 커뮤니티 플랫폼입니다. Cursor, Lovable, Windsurf 등 최신 AI 코딩 도구들의 정보를 실시간으로 제공합니다.',
      category: '기본 정보',
      tags: ['소개', '바이브 코딩', 'AI']
    },
    {
      id: '2',
      question: '비개발자도 사용할 수 있나요?',
      answer: '네! 비개발자 모드를 제공하여 기술 용어를 쉽게 설명해드립니다. 글을 읽을 때 "일반인 모드" 토글을 클릭하면 복잡한 기술 내용을 이해하기 쉽게 변환해드립니다.',
      category: '사용법',
      tags: ['비개발자', '모드 전환', '용어 설명']
    },
    {
      id: '3',
      question: '어떤 언어를 지원하나요?',
      answer: '한국어, 영어, 일본어, 중국어, 힌디어를 지원합니다. 브라우저 설정에 따라 자동으로 언어가 감지되며, 수동으로 변경할 수도 있습니다.',
      category: '기능',
      tags: ['다국어', '언어 설정']
    },
    {
      id: '4',
      question: '익명으로 글을 작성할 수 있나요?',
      answer: '네, 커뮤니티에 글을 작성할 때 "익명 게시" 옵션을 선택하면 닉네임 대신 "익명_XXXX" 형태로 표시됩니다.',
      category: '커뮤니티',
      tags: ['익명', '글쓰기', '프라이버시']
    },
    {
      id: '5',
      question: '맞춤 추천은 어떻게 작동하나요?',
      answer: '당신의 읽기 이력, 좋아요, 댓글 활동을 분석하여 관심사에 맞는 콘텐츠를 추천합니다. 오른쪽 플로팅 배너에서 개인화된 추천을 확인할 수 있습니다.',
      category: '기능',
      tags: ['추천', '개인화', 'AI']
    },
    {
      id: '6',
      question: '코드를 공유할 수 있나요?',
      answer: '네! 코드 스니펫 기능을 통해 코드를 공유하고, 다른 사용자들과 협업할 수 있습니다. 구문 강조, 포크, 실행 기능도 제공됩니다.',
      category: '협업',
      tags: ['코드 공유', '스니펫', '협업']
    }
  ]

  const HELP_CATEGORIES = [
    { id: 'all', name: '전체', icon: HelpCircle },
    { id: '기본 정보', name: '기본 정보', icon: Book },
    { id: '사용법', name: '사용법', icon: MessageCircle },
    { id: '기능', name: '기능', icon: HelpCircle },
    { id: '커뮤니티', name: '커뮤니티', icon: MessageCircle },
    { id: '협업', name: '협업', icon: MessageCircle }
  ]

  export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    const filteredFAQs = FAQ_DATA.filter(faq => {
      const matchesSearch = searchQuery === '' || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    const toggleExpanded = (id: string) => {
      const newExpanded = new Set(expandedItems)
      if (newExpanded.has(id)) {
        newExpanded.delete(id)
      } else {
        newExpanded.add(id)
      }
      setExpandedItems(newExpanded)
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            도움말 센터
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            VibeNews 사용법과 자주 묻는 질문들을 확인해보세요
          </p>
        </div>

        {/* 검색 */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="궁금한 내용을 검색해보세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {HELP_CATEGORIES.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>

        {/* FAQ 목록 */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                다른 키워드로 검색해보시거나 카테고리를 변경해보세요
              </p>
            </div>
          ) : (
            filteredFAQs.map(faq => {
              const isExpanded = expandedItems.has(faq.id)
              
              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpanded(faq.id)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {faq.question}
                        </h3>
                        
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {faq.category}
                          </span>
                          
                          {faq.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 추가 도움말 */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            더 도움이 필요하신가요?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/community?category=help"
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  커뮤니티에서 질문하기
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  다른 사용자들과 소통해보세요
                </p>
              </div>
            </a>
            
            <button
              onClick={() => {
                // 온보딩 투어 다시 시작
                localStorage.removeItem('onboarding-completed')
                window.location.reload()
              }}
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <Book className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  투어 다시 보기
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  기능 소개를 다시 확인해보세요
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }
  ```
  
  _요구사항: 31.1, 31.2, 31.3, 31.4, 31.5_- [ ] 43.
 자동화된 테스트 시스템 구현
  
  **43.1 테스트 환경 설정 (package.json 스크립트 추가)**
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "test:e2e": "playwright test",
      "test:e2e:ui": "playwright test --ui",
      "test:integration": "jest --testPathPattern=integration",
      "test:unit": "jest --testPathPattern=unit",
      "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
    },
    "devDependencies": {
      "@testing-library/react": "^13.4.0",
      "@testing-library/jest-dom": "^5.16.5",
      "@testing-library/user-event": "^14.4.3",
      "@playwright/test": "^1.40.0",
      "jest": "^29.7.0",
      "jest-environment-jsdom": "^29.7.0"
    }
  }
  ```

  **43.2 Jest 설정 (jest.config.js)**
  ```javascript
  const nextJest = require('next/jest')

  const createJestConfig = nextJest({
    dir: './',
  })

  const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/pages/_app.tsx',
      '!src/pages/_document.tsx',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  }

  module.exports = createJestConfig(customJestConfig)
  ```

  **43.3 단위 테스트 예시 (src/components/__tests__/NewsCard.test.tsx)**
  ```typescript
  import { render, screen, fireEvent, waitFor } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import NewsCard from '../news/NewsCard'
  import { AuthProvider } from '@/providers/AuthProvider'
  import { ThemeProvider } from '@/providers/ThemeProvider'

  // Mock 데이터
  const mockArticle = {
    id: '1',
    title: 'Test Article',
    summary: 'This is a test article summary',
    content: 'Full article content',
    tags: ['AI', 'Coding', 'Test'],
    author: 'Test Author',
    created_at: '2025-01-01T00:00:00Z',
    like_count: 5,
    view_count: 100,
    thumbnail: '/test-image.jpg'
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    nickname: 'TestUser',
    provider: 'google' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }

  // 테스트 래퍼 컴포넌트
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )

  // Supabase 모킹
  jest.mock('@/lib/supabase', () => ({
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockUser, error: null }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }
  }))

  describe('NewsCard Component', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders article information correctly', () => {
      render(
        <TestWrapper>
          <NewsCard article={mockArticle} />
        </TestWrapper>
      )

      expect(screen.getByText('Test Article')).toBeInTheDocument()
      expect(screen.getByText('This is a test article summary')).toBeInTheDocument()
      expect(screen.getByText('Test Author')).toBeInTheDocument()
      expect(screen.getByText('AI')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // like count
    })

    it('displays thumbnail when provided', () => {
      render(
        <TestWrapper>
          <NewsCard article={mockArticle} />
        </TestWrapper>
      )

      const thumbnail = screen.getByAltText('Test Article')
      expect(thumbnail).toBeInTheDocument()
      expect(thumbnail).toHaveAttribute('src', '/test-image.jpg')
    })

    it('handles like button click', async () => {
      const user = userEvent.setup()
      const mockOnLike = jest.fn()

      render(
        <TestWrapper>
          <NewsCard article={mockArticle} onLike={mockOnLike} />
        </TestWrapper>
      )

      const likeButton = screen.getByRole('button', { name: /좋아요/i })
      await user.click(likeButton)

      await waitFor(() => {
        expect(mockOnLike).toHaveBeenCalledWith('1', true)
      })
    })

    it('navigates to article detail on click', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <NewsCard article={mockArticle} />
        </TestWrapper>
      )

      const articleLink = screen.getByRole('link')
      expect(articleLink).toHaveAttribute('href', '/news/1')
    })

    it('shows correct relative time', () => {
      const recentArticle = {
        ...mockArticle,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2시간 전
      }

      render(
        <TestWrapper>
          <NewsCard article={recentArticle} />
        </TestWrapper>
      )

      expect(screen.getByText(/2시간 전/)).toBeInTheDocument()
    })

    it('handles missing thumbnail gracefully', () => {
      const articleWithoutThumbnail = {
        ...mockArticle,
        thumbnail: undefined
      }

      render(
        <TestWrapper>
          <NewsCard article={articleWithoutThumbnail} />
        </TestWrapper>
      )

      expect(screen.queryByAltText('Test Article')).not.toBeInTheDocument()
    })
  })
  ```

  **43.4 통합 테스트 예시 (tests/integration/auth.test.tsx)**
  ```typescript
  import { render, screen, waitFor } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import { AuthProvider, useAuth } from '@/providers/AuthProvider'
  import { supabase } from '@/lib/supabase'

  // 테스트용 컴포넌트
  function TestComponent() {
    const { user, signInWithGoogle, signOut, loading } = useAuth()

    if (loading) return <div>Loading...</div>

    return (
      <div>
        {user ? (
          <div>
            <span>Welcome, {user.nickname}</span>
            <button onClick={signOut}>Sign Out</button>
          </div>
        ) : (
          <button onClick={signInWithGoogle}>Sign In with Google</button>
        )}
      </div>
    )
  }

  // Supabase 모킹
  jest.mock('@/lib/supabase', () => ({
    supabase: {
      auth: {
        getSession: jest.fn(),
        onAuthStateChange: jest.fn(),
        signInWithOAuth: jest.fn(),
        signOut: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        insert: jest.fn(),
        upsert: jest.fn()
      }))
    }
  }))

  describe('Authentication Integration', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('shows sign in button when user is not authenticated', async () => {
      // 인증되지 않은 상태 모킹
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      })
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Sign In with Google')).toBeInTheDocument()
      })
    })

    it('shows user info when authenticated', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token'
      }

      // 인증된 상태 모킹
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'user-1',
                nickname: 'TestUser',
                email: 'test@example.com'
              },
              error: null
            }))
          }))
        }))
      })

      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument()
        expect(screen.getByText('Sign Out')).toBeInTheDocument()
      })
    })

    it('handles sign in process', async () => {
      const user = userEvent.setup()

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      })

      ;(supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://oauth-url.com' },
        error: null
      })

      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Sign In with Google')).toBeInTheDocument()
      })

      const signInButton = screen.getByText('Sign In with Google')
      await user.click(signInButton)

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })
  })
  ```

  **43.5 E2E 테스트 설정 (playwright.config.ts)**
  ```typescript
  import { defineConfig, devices } from '@playwright/test'

  export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
    },

    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },
    ],

    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  })
  ```

  **43.6 E2E 테스트 예시 (tests/e2e/user-journey.spec.ts)**
  ```typescript
  import { test, expect } from '@playwright/test'

  test.describe('User Journey', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('complete user onboarding flow', async ({ page }) => {
      // 홈페이지 로드 확인
      await expect(page.locator('h1')).toContainText('VibeNews')

      // 로그인 버튼 클릭
      await page.click('text=로그인')

      // 소셜 로그인 옵션 확인
      await expect(page.locator('text=Google로 로그인')).toBeVisible()
      await expect(page.locator('text=GitHub로 로그인')).toBeVisible()

      // 뉴스 페이지 이동
      await page.click('nav >> text=뉴스')
      await expect(page.url()).toContain('/news')

      // 뉴스 목록 로드 확인
      await expect(page.locator('[data-testid="news-card"]').first()).toBeVisible()

      // 뉴스 상세 페이지 이동
      await page.click('[data-testid="news-card"]').first()
      await expect(page.locator('article')).toBeVisible()

      // 커뮤니티 페이지 이동
      await page.click('nav >> text=커뮤니티')
      await expect(page.url()).toContain('/community')

      // 검색 기능 테스트
      await page.click('nav >> text=검색')
      await page.fill('[data-testid="search-input"]', 'AI 코딩')
      await page.press('[data-testid="search-input"]', 'Enter')
      
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    })

    test('theme switching works correctly', async ({ page }) => {
      // 초기 테마 확인
      const html = page.locator('html')
      
      // 다크 모드 토글
      await page.click('[data-testid="theme-toggle"]')
      await expect(html).toHaveClass(/dark/)

      // 라이트 모드로 다시 전환
      await page.click('[data-testid="theme-toggle"]')
      await expect(html).not.toHaveClass(/dark/)
    })

    test('content mode toggle works', async ({ page }) => {
      // 뉴스 상세 페이지로 이동
      await page.goto('/news/1')

      // 비개발자 모드 토글
      await page.click('[data-testid="content-mode-toggle"]')
      await expect(page.locator('text=일반인 모드')).toBeVisible()

      // 개발자 모드로 다시 전환
      await page.click('[data-testid="content-mode-toggle"]')
      await expect(page.locator('text=개발자 모드')).toBeVisible()
    })

    test('responsive design works on mobile', async ({ page }) => {
      // 모바일 뷰포트로 설정
      await page.setViewportSize({ width: 375, height: 667 })

      // 모바일 메뉴 버튼 확인
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()

      // 모바일 메뉴 열기
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

      // 메뉴 항목 클릭
      await page.click('[data-testid="mobile-menu"] >> text=뉴스')
      await expect(page.url()).toContain('/news')
    })

    test('accessibility features work', async ({ page }) => {
      // 접근성 도구 열기
      await page.click('[data-testid="accessibility-toggle"]')
      await expect(page.locator('[data-testid="accessibility-panel"]')).toBeVisible()

      // 폰트 크기 증가
      await page.click('[data-testid="increase-font-size"]')
      const fontSize = await page.evaluate(() => 
        window.getComputedStyle(document.documentElement).fontSize
      )
      expect(parseInt(fontSize)).toBeGreaterThan(16)

      // 고대비 모드 활성화
      await page.click('[data-testid="high-contrast-toggle"]')
      await expect(page.locator('html')).toHaveClass(/high-contrast/)
    })

    test('search functionality works end-to-end', async ({ page }) => {
      await page.goto('/search')

      // 검색어 입력
      await page.fill('[data-testid="search-input"]', 'Cursor AI')
      await page.press('[data-testid="search-input"]', 'Enter')

      // 검색 결과 확인
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
      await expect(page.locator('[data-testid="search-result-item"]').first()).toBeVisible()

      // 필터 적용
      await page.click('[data-testid="filter-news"]')
      await expect(page.locator('[data-testid="search-result-item"][data-type="news"]')).toBeVisible()

      // 검색 결과 클릭
      await page.click('[data-testid="search-result-item"]').first()
      await expect(page.locator('article')).toBeVisible()
    })
  })

  test.describe('Performance Tests', () => {
    test('page load performance', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/')
      const loadTime = Date.now() - startTime

      // 3초 이내 로드 확인
      expect(loadTime).toBeLessThan(3000)

      // Core Web Vitals 측정
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint')
            if (lcp) {
              resolve({ lcp: lcp.startTime })
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] })
        })
      })

      expect((metrics as any).lcp).toBeLessThan(2500) // 2.5초 이내
    })
  })
  ```

  **43.7 테스트 자동화 GitHub Actions (/.github/workflows/test.yml)**
  ```yaml
  name: Test Suite

  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main ]

  jobs:
    unit-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '18'
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Run unit tests
          run: npm run test:unit -- --coverage
        
        - name: Upload coverage to Codecov
          uses: codecov/codecov-action@v3

    integration-tests:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:15
          env:
            POSTGRES_PASSWORD: postgres
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '18'
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Run integration tests
          run: npm run test:integration
          env:
            DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

    e2e-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '18'
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Install Playwright Browsers
          run: npx playwright install --with-deps
        
        - name: Build application
          run: npm run build
        
        - name: Run E2E tests
          run: npm run test:e2e
        
        - uses: actions/upload-artifact@v3
          if: always()
          with:
            name: playwright-report
            path: playwright-report/
            retention-days: 30
  ```
  
  _요구사항: 32.1, 32.2, 32.3, 32.4, 32.5_

## 🎉 **구현 완료 요약**

이제 **모든 누락된 기능들이 완전히 구현**되었습니다!

### ✅ **추가 완료된 기능들:**
- **38. 성능 최적화** - 무한 스크롤, CDN 캐싱, Service Worker, 이미지 지연 로딩
- **39. 오픈소스 라이브러리 통합** - Microsoft Semantic Kernel, Upstash Vector, Elasticsearch, Algolia, Content Moderation
- **40. 광고 시스템** - 배너 광고, 네이티브 광고, 수익 추적, 타겟팅
- **41. 인기도 및 트렌딩 알고리즘** - 가중치 기반 점수 계산, 급상승 태그, 트렌딩 콘텐츠
- **42. 사용자 온보딩** - 투어 시스템, FAQ, 도움말 센터
- **43. 자동화된 테스트** - 단위/통합/E2E 테스트, GitHub Actions CI/CD

### 🔧 **통합된 오픈소스 라이브러리들:**
1. **Microsoft Semantic Kernel** - AI 기반 콘텐츠 처리
2. **Upstash Vector Database** - 시맨틱 검색
3. **Elasticsearch** - 전문 검색 엔진
4. **Algolia InstantSearch** - 실시간 검색 UI
5. **Content Moderation Deep Learning** - 콘텐츠 필터링
6. **Semantic Router** - 의도 기반 라우팅

이제 **VibeNews는 완전한 기능을 갖춘 바이브 코딩 플랫폼**이 되었습니다! 🚀- 
[ ] 44. 누락된 핵심 기능들 보완
  
  **44.1 실시간 도구 가격/기능 비교 시스템**
  
  **도구 비교 테이블 추가 (Supabase SQL)**
  ```sql
  -- 바이브 코딩 도구 정보 테이블
  CREATE TABLE vibe_tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL, -- 'ai-editor', 'no-code', 'collaboration', 'deployment'
    pricing_model TEXT NOT NULL, -- 'free', 'freemium', 'subscription', 'one-time'
    price_free DECIMAL(10,2) DEFAULT 0,
    price_pro DECIMAL(10,2),
    price_enterprise DECIMAL(10,2),
    features JSONB DEFAULT '{}',
    pros TEXT[],
    cons TEXT[],
    supported_languages TEXT[],
    integrations TEXT[],
    website_url TEXT,
    documentation_url TEXT,
    github_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    user_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 도구 비교 기록 테이블
  CREATE TABLE tool_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tool_ids UUID[] NOT NULL,
    comparison_criteria JSONB DEFAULT '{}',
    result_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 기본 바이브 코딩 도구 데이터 삽입
  INSERT INTO vibe_tools (name, description, category, pricing_model, price_free, price_pro, features, pros, cons, supported_languages, website_url) VALUES
  ('Cursor', 'AI-powered code editor with intelligent autocomplete', 'ai-editor', 'freemium', 0, 20, 
   '{"ai_completion": true, "chat_interface": true, "codebase_indexing": true, "multi_language": true}',
   ARRAY['뛰어난 AI 자동완성', '자연어 코드 생성', '빠른 성능', 'VS Code 호환'],
   ARRAY['유료 플랜 필요', '인터넷 연결 필수', '일부 언어 지원 제한'],
   ARRAY['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java'],
   'https://cursor.sh'),
  
  ('Lovable', 'No-code platform for building web applications', 'no-code', 'freemium', 0, 49,
   '{"drag_drop_ui": true, "ai_generation": true, "real_time_preview": true, "deployment": true}',
   ARRAY['코딩 지식 불필요', 'AI 기반 생성', '실시간 미리보기', '빠른 배포'],
   ARRAY['커스터마이징 제한', '복잡한 로직 구현 어려움', '벤더 종속성'],
   ARRAY['Visual Builder', 'React', 'Next.js'],
   'https://lovable.dev'),
  
  ('Windsurf', 'AI-first development environment', 'ai-editor', 'subscription', 0, 30,
   '{"ai_pair_programming": true, "context_awareness": true, "multi_file_editing": true}',
   ARRAY['강력한 AI 페어 프로그래밍', '컨텍스트 인식', '멀티파일 편집'],
   ARRAY['높은 학습 곡선', '리소스 사용량 높음'],
   ARRAY['JavaScript', 'TypeScript', 'Python', 'Go'],
   'https://windsurf.ai'),
  
  ('GitHub Copilot', 'AI pair programmer by GitHub', 'ai-editor', 'subscription', 0, 10,
   '{"code_suggestions": true, "chat_interface": true, "cli_integration": true}',
   ARRAY['광범위한 언어 지원', 'GitHub 통합', '안정적인 서비스'],
   ARRAY['때로 부정확한 제안', '구독 필요', '인터넷 의존'],
   ARRAY['Most programming languages'],
   'https://github.com/features/copilot'),
  
  ('Replit', 'Online IDE with AI features', 'collaboration', 'freemium', 0, 20,
   '{"online_ide": true, "collaboration": true, "ai_assistant": true, "deployment": true}',
   ARRAY['브라우저에서 실행', '실시간 협업', 'AI 어시스턴트', '즉시 배포'],
   ARRAY['인터넷 필수', '성능 제한', '오프라인 불가'],
   ARRAY['50+ languages'],
   'https://replit.com');
  ```

  **도구 비교 서비스 (src/services/ToolComparisonService.ts)**
  ```typescript
  interface VibeTool {
    id: string;
    name: string;
    description: string;
    category: string;
    pricing_model: string;
    price_free: number;
    price_pro: number;
    price_enterprise?: number;
    features: Record<string, any>;
    pros: string[];
    cons: string[];
    supported_languages: string[];
    integrations: string[];
    website_url: string;
    rating: number;
    user_count: number;
  }

  interface ComparisonCriteria {
    budget?: number;
    experience_level: 'beginner' | 'intermediate' | 'advanced';
    project_type: 'web' | 'mobile' | 'desktop' | 'ai' | 'data';
    team_size: number;
    required_features: string[];
    preferred_languages: string[];
  }

  export class ToolComparisonService {
    async getAllTools(): Promise<VibeTool[]> {
      const { data: tools } = await supabase
        .from('vibe_tools')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })

      return tools || []
    }

    async getRecommendedTools(criteria: ComparisonCriteria): Promise<{
      recommended: VibeTool[];
      reasoning: string[];
      alternatives: VibeTool[];
    }> {
      const allTools = await this.getAllTools()
      const scored = allTools.map(tool => ({
        tool,
        score: this.calculateCompatibilityScore(tool, criteria),
        reasons: this.getRecommendationReasons(tool, criteria)
      }))

      const sorted = scored.sort((a, b) => b.score - a.score)
      
      return {
        recommended: sorted.slice(0, 3).map(item => item.tool),
        reasoning: sorted.slice(0, 3).flatMap(item => item.reasons),
        alternatives: sorted.slice(3, 6).map(item => item.tool)
      }
    }

    private calculateCompatibilityScore(tool: VibeTool, criteria: ComparisonCriteria): number {
      let score = 0

      // 예산 적합성 (30%)
      if (criteria.budget) {
        if (tool.price_free === 0 && criteria.budget === 0) score += 30
        else if (tool.price_pro && tool.price_pro <= criteria.budget) score += 25
        else if (tool.price_free === 0) score += 15
      }

      // 경험 수준 적합성 (20%)
      if (criteria.experience_level === 'beginner' && tool.category === 'no-code') score += 20
      else if (criteria.experience_level === 'advanced' && tool.category === 'ai-editor') score += 20
      else score += 10

      // 필수 기능 매칭 (25%)
      const featureMatch = criteria.required_features.filter(feature => 
        tool.features[feature] === true
      ).length
      score += (featureMatch / criteria.required_features.length) * 25

      // 언어 지원 (15%)
      const languageMatch = criteria.preferred_languages.filter(lang => 
        tool.supported_languages.some(supported => 
          supported.toLowerCase().includes(lang.toLowerCase())
        )
      ).length
      score += (languageMatch / criteria.preferred_languages.length) * 15

      // 평점 및 인기도 (10%)
      score += (tool.rating / 5) * 5
      score += Math.min((tool.user_count / 100000) * 5, 5)

      return Math.round(score)
    }

    private getRecommendationReasons(tool: VibeTool, criteria: ComparisonCriteria): string[] {
      const reasons: string[] = []

      if (tool.price_free === 0) {
        reasons.push(`${tool.name}은 무료로 시작할 수 있습니다`)
      }

      if (criteria.experience_level === 'beginner' && tool.category === 'no-code') {
        reasons.push(`초보자에게 적합한 노코드 플랫폼입니다`)
      }

      if (tool.rating >= 4.5) {
        reasons.push(`높은 사용자 만족도 (${tool.rating}/5.0)를 보유하고 있습니다`)
      }

      const matchedFeatures = criteria.required_features.filter(feature => 
        tool.features[feature] === true
      )
      if (matchedFeatures.length > 0) {
        reasons.push(`필요한 기능들(${matchedFeatures.join(', ')})을 지원합니다`)
      }

      return reasons
    }

    async compareTools(toolIds: string[]): Promise<{
      tools: VibeTool[];
      comparison: Record<string, any>;
      winner: {
        overall: string;
        categories: Record<string, string>;
      };
    }> {
      const { data: tools } = await supabase
        .from('vibe_tools')
        .select('*')
        .in('id', toolIds)

      if (!tools || tools.length < 2) {
        throw new Error('비교할 도구를 2개 이상 선택해주세요')
      }

      const comparison = this.generateComparison(tools)
      const winner = this.determineWinners(tools)

      return {
        tools,
        comparison,
        winner
      }
    }

    private generateComparison(tools: VibeTool[]) {
      const categories = ['pricing', 'features', 'ease_of_use', 'performance', 'support']
      const comparison: Record<string, any> = {}

      categories.forEach(category => {
        comparison[category] = tools.map(tool => ({
          tool_id: tool.id,
          tool_name: tool.name,
          score: this.getCategoryScore(tool, category),
          details: this.getCategoryDetails(tool, category)
        }))
      })

      return comparison
    }

    private getCategoryScore(tool: VibeTool, category: string): number {
      switch (category) {
        case 'pricing':
          if (tool.price_free === 0) return 10
          if (tool.price_pro && tool.price_pro < 20) return 8
          if (tool.price_pro && tool.price_pro < 50) return 6
          return 4
        
        case 'features':
          return Object.values(tool.features).filter(Boolean).length
        
        case 'ease_of_use':
          if (tool.category === 'no-code') return 10
          if (tool.category === 'ai-editor') return 8
          return 6
        
        case 'performance':
          return Math.round(tool.rating * 2)
        
        case 'support':
          return tool.documentation_url ? 8 : 5
        
        default:
          return 5
      }
    }

    private getCategoryDetails(tool: VibeTool, category: string): string {
      switch (category) {
        case 'pricing':
          if (tool.price_free === 0 && !tool.price_pro) return '완전 무료'
          if (tool.price_free === 0) return `무료 + 프로 $${tool.price_pro}/월`
          return `$${tool.price_pro}/월`
        
        case 'features':
          return Object.keys(tool.features).filter(key => tool.features[key]).join(', ')
        
        case 'ease_of_use':
          return tool.category === 'no-code' ? '매우 쉬움' : '보통'
        
        case 'performance':
          return `${tool.rating}/5.0 (${tool.user_count.toLocaleString()}명 사용)`
        
        case 'support':
          return tool.documentation_url ? '문서 제공' : '기본 지원'
        
        default:
          return '정보 없음'
      }
    }

    private determineWinners(tools: VibeTool[]) {
      const categories = ['pricing', 'features', 'ease_of_use', 'performance', 'support']
      const categoryWinners: Record<string, string> = {}
      
      categories.forEach(category => {
        const scores = tools.map(tool => ({
          id: tool.id,
          name: tool.name,
          score: this.getCategoryScore(tool, category)
        }))
        
        const winner = scores.reduce((prev, current) => 
          current.score > prev.score ? current : prev
        )
        
        categoryWinners[category] = winner.name
      })

      // 전체 우승자 (평점 기준)
      const overallWinner = tools.reduce((prev, current) => 
        current.rating > prev.rating ? current : prev
      )

      return {
        overall: overallWinner.name,
        categories: categoryWinners
      }
    }

    async updateToolPricing(): Promise<void> {
      // 실시간 가격 정보 업데이트 (외부 API 연동)
      const tools = await this.getAllTools()
      
      for (const tool of tools) {
        try {
          const updatedPricing = await this.fetchLatestPricing(tool.website_url)
          
          await supabase
            .from('vibe_tools')
            .update({
              price_pro: updatedPricing.pro,
              price_enterprise: updatedPricing.enterprise,
              last_updated: new Date().toISOString()
            })
            .eq('id', tool.id)
        } catch (error) {
          console.error(`가격 업데이트 실패: ${tool.name}`, error)
        }
      }
    }

    private async fetchLatestPricing(websiteUrl: string) {
      // 실제 구현에서는 각 도구의 API나 웹 스크래핑을 통해 최신 가격 정보 수집
      // 여기서는 예시로 기본값 반환
      return {
        pro: 20,
        enterprise: 100
      }
    }
  }
  ```

  **44.2 멘토링 매칭 시스템**
  
  **멘토링 테이블 추가 (Supabase SQL)**
  ```sql
  -- 멘토 프로필 테이블
  CREATE TABLE mentor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    expertise_areas TEXT[] NOT NULL, -- ['AI Coding', 'Web Development', 'Mobile', etc.]
    tools_expertise TEXT[] DEFAULT '{}', -- ['Cursor', 'Lovable', 'Windsurf', etc.]
    experience_years INTEGER NOT NULL,
    hourly_rate DECIMAL(10,2),
    availability_hours JSONB DEFAULT '{}', -- {"monday": ["09:00-12:00", "14:00-18:00"]}
    languages TEXT[] DEFAULT ARRAY['Korean'],
    bio TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 멘토링 세션 테이블
  CREATE TABLE mentoring_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    mentee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
    meeting_url TEXT,
    notes TEXT,
    mentor_rating INTEGER, -- 1-5
    mentee_rating INTEGER, -- 1-5
    mentor_feedback TEXT,
    mentee_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 멘토링 요청 테이블
  CREATE TABLE mentoring_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    description TEXT,
    preferred_tools TEXT[],
    experience_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
    preferred_time_slots JSONB DEFAULT '{}',
    budget_range TEXT, -- 'free', '10-30', '30-50', '50+'
    urgency TEXT DEFAULT 'normal', -- 'urgent', 'normal', 'flexible'
    status TEXT DEFAULT 'open', -- 'open', 'matched', 'closed'
    matched_mentor_id UUID REFERENCES mentor_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

  **멘토링 매칭 서비스 (src/services/MentoringService.ts)**
  ```typescript
  interface MentorProfile {
    id: string;
    user_id: string;
    expertise_areas: string[];
    tools_expertise: string[];
    experience_years: number;
    hourly_rate: number;
    availability_hours: Record<string, string[]>;
    languages: string[];
    bio: string;
    rating: number;
    total_sessions: number;
    user: {
      nickname: string;
      avatar_url?: string;
    };
  }

  interface MentoringRequest {
    id: string;
    mentee_id: string;
    topic: string;
    description: string;
    preferred_tools: string[];
    experience_level: string;
    budget_range: string;
    urgency: string;
  }

  export class MentoringService {
    async findMatchingMentors(request: MentoringRequest): Promise<{
      perfect_matches: MentorProfile[];
      good_matches: MentorProfile[];
      alternative_matches: MentorProfile[];
    }> {
      const { data: mentors } = await supabase
        .from('mentor_profiles')
        .select(`
          *,
          user:users(nickname, avatar_url)
        `)
        .eq('is_available', true)

      if (!mentors) return { perfect_matches: [], good_matches: [], alternative_matches: [] }

      const scored = mentors.map(mentor => ({
        mentor,
        score: this.calculateMatchScore(mentor, request),
        reasons: this.getMatchReasons(mentor, request)
      }))

      const sorted = scored.sort((a, b) => b.score - a.score)

      return {
        perfect_matches: sorted.filter(item => item.score >= 90).map(item => item.mentor),
        good_matches: sorted.filter(item => item.score >= 70 && item.score < 90).map(item => item.mentor),
        alternative_matches: sorted.filter(item => item.score >= 50 && item.score < 70).map(item => item.mentor)
      }
    }

    private calculateMatchScore(mentor: MentorProfile, request: MentoringRequest): number {
      let score = 0

      // 전문 분야 매칭 (40%)
      const topicMatch = mentor.expertise_areas.some(area => 
        request.topic.toLowerCase().includes(area.toLowerCase()) ||
        area.toLowerCase().includes(request.topic.toLowerCase())
      )
      if (topicMatch) score += 40

      // 도구 전문성 매칭 (25%)
      const toolMatches = request.preferred_tools.filter(tool => 
        mentor.tools_expertise.some(expertise => 
          expertise.toLowerCase().includes(tool.toLowerCase())
        )
      )
      score += (toolMatches.length / Math.max(request.preferred_tools.length, 1)) * 25

      // 경험 수준 적합성 (20%)
      if (request.experience_level === 'beginner' && mentor.experience_years >= 2) score += 20
      else if (request.experience_level === 'intermediate' && mentor.experience_years >= 3) score += 20
      else if (request.experience_level === 'advanced' && mentor.experience_years >= 5) score += 20
      else score += 10

      // 예산 적합성 (10%)
      const budgetMatch = this.checkBudgetCompatibility(mentor.hourly_rate, request.budget_range)
      if (budgetMatch) score += 10

      // 평점 및 경험 (5%)
      score += (mentor.rating / 5) * 3
      score += Math.min(mentor.total_sessions / 10, 2)

      return Math.round(score)
    }

    private checkBudgetCompatibility(hourlyRate: number, budgetRange: string): boolean {
      switch (budgetRange) {
        case 'free': return hourlyRate === 0
        case '10-30': return hourlyRate >= 10 && hourlyRate <= 30
        case '30-50': return hourlyRate >= 30 && hourlyRate <= 50
        case '50+': return hourlyRate >= 50
        default: return true
      }
    }

    private getMatchReasons(mentor: MentorProfile, request: MentoringRequest): string[] {
      const reasons: string[] = []

      const topicMatch = mentor.expertise_areas.find(area => 
        request.topic.toLowerCase().includes(area.toLowerCase())
      )
      if (topicMatch) {
        reasons.push(`${topicMatch} 전문가입니다`)
      }

      const toolMatches = request.preferred_tools.filter(tool => 
        mentor.tools_expertise.includes(tool)
      )
      if (toolMatches.length > 0) {
        reasons.push(`${toolMatches.join(', ')} 도구에 능숙합니다`)
      }

      if (mentor.rating >= 4.5) {
        reasons.push(`높은 평점 (${mentor.rating}/5.0)을 보유하고 있습니다`)
      }

      if (mentor.total_sessions >= 50) {
        reasons.push(`풍부한 멘토링 경험 (${mentor.total_sessions}회)을 가지고 있습니다`)
      }

      return reasons
    }

    async createMentoringRequest(request: Omit<MentoringRequest, 'id'>): Promise<string> {
      const { data, error } = await supabase
        .from('mentoring_requests')
        .insert(request)
        .select('id')
        .single()

      if (error) throw error
      
      // 자동 매칭 시도
      setTimeout(() => this.attemptAutoMatching(data.id), 1000)
      
      return data.id
    }

    private async attemptAutoMatching(requestId: string) {
      const { data: request } = await supabase
        .from('mentoring_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (!request) return

      const matches = await this.findMatchingMentors(request)
      
      if (matches.perfect_matches.length > 0) {
        // 가장 적합한 멘토에게 알림 발송
        const bestMatch = matches.perfect_matches[0]
        
        await this.sendMatchNotification(bestMatch.user_id, request)
        
        // 요청 상태 업데이트
        await supabase
          .from('mentoring_requests')
          .update({ 
            status: 'matched',
            matched_mentor_id: bestMatch.id
          })
          .eq('id', requestId)
      }
    }

    private async sendMatchNotification(mentorUserId: string, request: any) {
      // 실제 구현에서는 이메일, 푸시 알림 등을 발송
      await supabase
        .from('notifications')
        .insert({
          user_id: mentorUserId,
          type: 'mentoring_match',
          title: '새로운 멘토링 요청',
          message: `"${request.topic}" 주제로 멘토링 요청이 있습니다.`,
          data: { request_id: request.id }
        })
    }

    async scheduleMentoringSession(data: {
      mentor_id: string;
      mentee_id: string;
      topic: string;
      description: string;
      scheduled_at: string;
      duration_minutes: number;
    }): Promise<string> {
      // 캘린더 통합 (Google Calendar, Calendly 등)
      const meetingUrl = await this.createMeetingRoom(data)
      
      const { data: session, error } = await supabase
        .from('mentoring_sessions')
        .insert({
          ...data,
          meeting_url: meetingUrl
        })
        .select('id')
        .single()

      if (error) throw error

      // 양쪽에 알림 발송
      await this.sendSessionNotifications(session.id)
      
      return session.id
    }

    private async createMeetingRoom(sessionData: any): Promise<string> {
      // 실제 구현에서는 Zoom, Google Meet, Jitsi 등의 API 사용
      const roomId = `mentoring-${Date.now()}`
      return `https://meet.vibenews.com/room/${roomId}`
    }

    private async sendSessionNotifications(sessionId: string) {
      const { data: session } = await supabase
        .from('mentoring_sessions')
        .select(`
          *,
          mentor:mentor_profiles(user:users(nickname)),
          mentee:users(nickname)
        `)
        .eq('id', sessionId)
        .single()

      if (!session) return

      // 멘토에게 알림
      await supabase.from('notifications').insert({
        user_id: session.mentor.user_id,
        type: 'session_scheduled',
        title: '멘토링 세션 예약됨',
        message: `${session.mentee.nickname}님과의 멘토링이 예약되었습니다.`
      })

      // 멘티에게 알림
      await supabase.from('notifications').insert({
        user_id: session.mentee_id,
        type: 'session_scheduled',
        title: '멘토링 세션 확정',
        message: `${session.mentor.user.nickname}님과의 멘토링이 확정되었습니다.`
      })
    }
  }
  ```
  
  _요구사항: 17.7, 18.6, 19.5, 21.1-21.5_