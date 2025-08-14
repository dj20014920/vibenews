import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { ListTodo } from 'lucide-react'

const toolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  category: z.enum(['IDE', 'CLI', 'SaaS']),
  popularity_sources: z.object({}).passthrough().optional(),
});

const toolsSchema = z.array(toolSchema);

const placeholderJson = JSON.stringify([
  {
    "name": "Cursor",
    "description": "AI-first code editor.",
    "url": "https://cursor.sh/",
    "logo_url": "https://cursor.sh/favicon.ico",
    "category": "IDE",
    "popularity_sources": { "twitter": "https://twitter.com/cursor_ide" }
  },
  {
    "name": "Warp",
    "description": "The terminal for the 21st century.",
    "url": "https://www.warp.dev/",
    "logo_url": "https://www.warp.dev/favicon.ico",
    "category": "CLI",
    "popularity_sources": {}
  }
], null, 2);


export const ToolsManager = () => {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState(placeholderJson);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Parse JSON
      const parsedJson = JSON.parse(jsonInput);

      // 2. Validate with Zod
      const validatedTools = toolsSchema.parse(parsedJson);

      // 3. Call Supabase function
      const { error } = await supabase.functions.invoke('sync-managed-tools', {
        body: { tools: validatedTools }
      });

      if (error) throw new Error(error.message);

      toast({
        title: "성공",
        description: `${validatedTools.length}개의 도구 목록을 성공적으로 동기화했습니다.`,
      });

    } catch (error) {
      console.error("Tool sync error:", error);
      const errorMessage = error instanceof z.ZodError
        ? `JSON 데이터 유효성 검사 실패: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        : error instanceof SyntaxError
          ? "잘못된 JSON 형식입니다. 형식을 확인해주세요."
          : error.message;

      toast({
        title: "동기화 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          도구 목록 관리
        </CardTitle>
        <CardDescription>
          아래 텍스트 영역에 JSON 형식으로 도구 목록을 입력하고 동기화하세요. 기존 목록을 모두 덮어씁니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tools-json">도구 목록 JSON</Label>
          <Textarea
            id="tools-json"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={15}
            placeholder="Enter tools JSON here..."
            className="font-mono text-sm"
          />
        </div>
        <Button onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? "동기화 중..." : "도구 목록 동기화"}
        </Button>
      </CardContent>
    </Card>
  );
};
