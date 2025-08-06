import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, Code, Share2, Heart, Eye, Download, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface CodeSnippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  user_id: string;
  is_public: boolean;
  like_count: number;
  view_count: number;
  fork_from?: string;
  created_at: string;
  updated_at: string;
}

interface CodeSnippetShareProps {
  onSnippetCreated?: (snippet: CodeSnippet) => void;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
];

export function CodeSnippetShare({ onSnippetCreated }: CodeSnippetShareProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    tags: [] as string[],
    is_public: true,
  });
  
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "코드 스니펫을 공유하려면 로그인이 필요합니다.",
      });
      return;
    }

    if (!formData.title.trim() || !formData.code.trim()) {
      toast({
        title: "필수 입력",
        description: "제목과 코드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('code_snippets')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          code: formData.code.trim(),
          language: formData.language,
          tags: formData.tags,
          user_id: user.id,
          is_public: formData.is_public,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "성공",
        description: "코드 스니펫이 성공적으로 공유되었습니다.",
      });

      // 폼 리셋
      setFormData({
        title: '',
        description: '',
        code: '',
        language: 'javascript',
        tags: [],
        is_public: true,
      });
      setTagInput('');
      setOpen(false);

      if (onSnippetCreated) {
        onSnippetCreated(data);
      }
    } catch (error) {
      console.error('Error creating code snippet:', error);
      toast({
        title: "오류",
        description: "코드 스니펫 공유 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Code className="h-4 w-4" />
          코드 공유
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>코드 스니펫 공유</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="코드 스니펫의 제목을 입력하세요"
              required
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="코드에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* 언어 선택 */}
          <div className="space-y-2">
            <Label>프로그래밍 언어</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="언어를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 코드 입력 */}
          <div className="space-y-2">
            <Label htmlFor="code">코드 *</Label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Textarea
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="코드를 입력하세요"
                  rows={12}
                  className="font-mono text-sm"
                  required
                />
              </div>
              
              {/* 미리보기 */}
              <div className="border rounded-md">
                <div className="bg-muted p-2 border-b text-sm font-medium">
                  미리보기
                </div>
                <div className="max-h-64 overflow-auto">
                  {formData.code ? (
                    <SyntaxHighlighter
                      language={formData.language}
                      style={theme === 'dark' ? oneDark : oneLight}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {formData.code}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="p-4 text-muted-foreground text-sm">
                      코드를 입력하면 미리보기가 표시됩니다
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <Label>태그 (최대 5개)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="태그를 입력하고 Enter를 누르세요"
                disabled={formData.tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim() || formData.tags.length >= 5}
              >
                추가
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 공개 설정 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
            />
            <Label htmlFor="is_public">
              공개 (다른 사용자들이 볼 수 있습니다)
            </Label>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '공유 중...' : '공유하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 코드 스니펫 카드 컴포넌트
interface CodeSnippetCardProps {
  snippet: CodeSnippet;
  onLike?: (snippetId: string) => void;
  onFork?: (snippet: CodeSnippet) => void;
}

export function CodeSnippetCard({ snippet, onLike, onFork }: CodeSnippetCardProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      toast({
        title: "복사됨",
        description: "코드가 클립보드에 복사되었습니다.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "오류",
        description: "복사에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{snippet.title}</CardTitle>
            {snippet.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {snippet.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="ml-2">
            {SUPPORTED_LANGUAGES.find(l => l.value === snippet.language)?.label || snippet.language}
          </Badge>
        </div>
        
        {snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {snippet.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="relative">
          <div className="max-h-64 overflow-auto border rounded">
            <SyntaxHighlighter
              language={snippet.language}
              style={theme === 'dark' ? oneDark : oneLight}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {snippet.code}
            </SyntaxHighlighter>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
            {copied ? '복사됨!' : '복사'}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{snippet.view_count}</span>
            </div>
            
            <button
              onClick={() => onLike?.(snippet.id)}
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4" />
              <span>{snippet.like_count}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFork?.(snippet)}
              className="h-6 px-2"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Fork
            </Button>
            
            <span className="text-xs">
              {new Date(snippet.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}