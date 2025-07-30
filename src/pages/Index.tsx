import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">VibeNews</h2>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground">VibeNews에 오신 것을 환영합니다</h1>
          <p className="text-xl text-muted-foreground">깔끔하고 현대적인 뉴스 플랫폼을 시작해보세요!</p>
          <div className="mt-8 p-6 bg-card rounded-lg border shadow-sm max-w-md mx-auto">
            <p className="text-muted-foreground">테마 토글을 사용해 라이트/다크 모드를 전환하거나 시스템 설정을 따를 수 있습니다.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
