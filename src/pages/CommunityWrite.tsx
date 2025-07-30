import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CommunityWrite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newTool, setNewTool] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 체크
  if (!user) {
    return (
      <div className="container-custom py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">로그인 필요</h2>
            <p className="text-muted-foreground mb-4">
              글을 작성하려면 로그인이 필요합니다.
            </p>
            <Button asChild>
              <Link to="/auth">로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addTool = () => {
    if (newTool.trim() && !toolsUsed.includes(newTool.trim()) && toolsUsed.length < 5) {
      setToolsUsed([...toolsUsed, newTool.trim()]);
      setNewTool("");
    }
  };

  const removeTool = (toolToRemove: string) => {
    setToolsUsed(toolsUsed.filter(tool => tool !== toolToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        tags,
        tools_used: toolsUsed,
        author_id: isAnonymous ? null : user.id,
        anonymous_author_id: isAnonymous ? `익명_${user.id.slice(0, 8)}` : null,
        is_anonymous: isAnonymous,
      };

      const { data, error } = await supabase
        .from('community_posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "글 작성 완료",
        description: "커뮤니티에 글이 성공적으로 작성되었습니다.",
      });

      navigate(`/community/post/${data.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "작성 실패",
        description: "글 작성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedTags = ["AI", "코딩", "개발", "도구", "팁", "질문", "후기", "프로젝트"];
  const suggestedTools = ["Cursor", "Windsurf", "Lovable", "ChatGPT", "GitHub Copilot", "Bolt.new", "Claude"];

  if (isPreview) {
    return (
      <div className="container-custom py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setIsPreview(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            편집으로 돌아가기
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "작성 중..." : "글 발행"}
          </Button>
        </div>

        {/* 미리보기 */}
        <Card className="content-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {isAnonymous ? "익" : user?.user_metadata?.nickname?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-medium">
                    {isAnonymous ? "익명 사용자" : user?.user_metadata?.nickname || "사용자"}
                  </p>
                  <p className="text-xs text-muted-foreground">방금 전</p>
                </div>
              </div>
            </div>
            
            <CardTitle className="text-2xl">{title}</CardTitle>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="prose max-w-none">
                <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
              </div>
              
              {toolsUsed.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">사용한 도구:</p>
                  <div className="flex flex-wrap gap-2">
                    {toolsUsed.map((tool, index) => (
                      <Badge key={index} variant="outline">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/community">
            <ArrowLeft className="h-4 w-4 mr-2" />
            커뮤니티로 돌아가기
          </Link>
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            미리보기
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "작성 중..." : "글 발행"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 글 작성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 익명 옵션 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="anonymous" className="text-sm">
              익명으로 작성 (닉네임이 표시되지 않습니다)
            </Label>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="글 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              placeholder="내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}자
            </p>
          </div>

          {/* 태그 */}
          <div className="space-y-3">
            <Label>태그 (최대 5개)</Label>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="태그 입력 후 Enter"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                maxLength={20}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 추천 태그 */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">추천 태그:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      if (!tags.includes(tag) && tags.length < 5) {
                        setTags([...tags, tag]);
                      }
                    }}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 선택된 태그 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 사용 도구 */}
          <div className="space-y-3">
            <Label>사용한 도구 (최대 5개)</Label>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="도구명 입력 후 Enter"
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTool();
                  }
                }}
                maxLength={20}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTool}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 추천 도구 */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">추천 도구:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTools.map((tool) => (
                  <Badge
                    key={tool}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      if (!toolsUsed.includes(tool) && toolsUsed.length < 5) {
                        setToolsUsed([...toolsUsed, tool]);
                      }
                    }}
                  >
                    + {tool}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 선택된 도구 */}
            {toolsUsed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {toolsUsed.map((tool) => (
                  <Badge key={tool} variant="outline" className="cursor-pointer">
                    {tool}
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => removeTool(tool)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 작성 가이드 */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">📝 작성 가이드</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 다른 개발자들에게 도움이 되는 경험이나 팁을 공유해주세요</li>
              <li>• 질문할 때는 구체적인 상황과 시도해본 방법을 함께 적어주세요</li>
              <li>• 태그를 적절히 활용하면 더 많은 사람들이 볼 수 있어요</li>
              <li>• 사용한 도구를 표시하면 비슷한 환경의 개발자들에게 도움이 됩니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityWrite;