import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HelpCircle, BookOpen, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TermDetectorProps {
  content: string;
  contentId: string;
  contentType: 'news' | 'community';
  className?: string;
}

export function TermDetector({ content, contentId, contentType, className }: TermDetectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [detectedTerms, setDetectedTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const techTermPatterns = [
    /\b(JavaScript|TypeScript|Python|React|Node\.js|API|Database|Docker|AWS)\b/gi,
  ];

  useEffect(() => {
    const allTerms: Set<string> = new Set();
    techTermPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => allTerms.add(match));
      }
    });
    setDetectedTerms(Array.from(allTerms).slice(0, 5));
  }, [content]);

  const fetchExplanations = async () => {
    if (!user || detectedTerms.length === 0) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-explanation', {
        body: {
          terms: detectedTerms,
          contentType,
          contentId,
          userLevel: 'beginner'
        }
      });

      if (error) throw error;
      
      toast({
        title: "용어 설명 완료",
        description: `${detectedTerms.length}개 용어의 설명을 생성했습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "용어 설명 생성에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (detectedTerms.length === 0) return null;

  return (
    <div className={`bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-blue-900 dark:text-blue-100">
          기술 용어 감지됨 ({detectedTerms.length}개)
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {detectedTerms.map((term) => (
          <Badge key={term} variant="outline" className="text-xs">
            <HelpCircle className="w-3 h-3 mr-1" />
            {term}
          </Badge>
        ))}
      </div>

      {user && (
        <Button
          size="sm"
          onClick={fetchExplanations}
          disabled={loading}
          className="ml-auto"
        >
          {loading ? '생성 중...' : 'AI 설명 생성'}
        </Button>
      )}
    </div>
  );
}