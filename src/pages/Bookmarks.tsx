import { Bookmark as BookmarkIcon } from "lucide-react"

export default function Bookmarks() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">북마크</h1>
        <p className="text-muted-foreground">
          저장한 뉴스와 게시글을 확인하세요
        </p>
      </div>

      <div className="text-center py-12">
        <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">저장된 북마크가 없습니다</h3>
        <p className="text-muted-foreground">
          관심 있는 뉴스나 게시글을 북마크하여 나중에 다시 볼 수 있습니다
        </p>
      </div>
    </div>
  )
}