import { SEO } from "@/components/seo/SEO";
import { GuestPrompt } from "@/components/auth/ProtectedAction";
import { InfiniteNewsList } from "@/components/news/InfiniteNewsList";

const News = () => {
  return (
    <div className="container-custom py-8 space-y-6">
      <SEO
        title="AI 코딩 뉴스 - 최신 트렌드 무한스크롤 | VibeNews"
        description="AI 코딩 도구와 개발 트렌드 뉴스를 무한스크롤로 빠르게 탐색하세요. 좋아요/스크랩 지원."
        canonicalUrl={`${window.location.origin}/news`}
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">바이브 코딩 뉴스</h1>
        <p className="text-muted-foreground">최신 AI 코딩 도구와 개발 트렌드를 확인하세요</p>
      </div>

      <GuestPrompt 
        message="뉴스에 좋아요, 댓글, 스크랩하려면 회원가입하세요"
        actionText="무료 회원가입"
      />

      <InfiniteNewsList sortBy="latest" />
    </div>
  );
};

export default News;