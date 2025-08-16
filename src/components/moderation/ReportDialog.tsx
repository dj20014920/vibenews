import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag } from 'lucide-react';

interface ReportDialogProps {
  trigger?: React.ReactNode;
  targetType: 'post' | 'article' | 'comment' | 'user';
  targetId: string;
  targetUserId?: string;
}

const REPORT_REASONS = {
  post: [
    { value: 'spam', label: '스팸/광고' },
    { value: 'inappropriate', label: '부적절한 내용' },
    { value: 'harassment', label: '괴롭힘' },
    { value: 'fake', label: '허위 정보' },
    { value: 'copyright', label: '저작권 침해' },
    { value: 'other', label: '기타' },
  ],
  article: [
    { value: 'misinformation', label: '잘못된 정보' },
    { value: 'spam', label: '스팸/광고' },
    { value: 'inappropriate', label: '부적절한 내용' },
    { value: 'copyright', label: '저작권 침해' },
    { value: 'other', label: '기타' },
  ],
  comment: [
    { value: 'spam', label: '스팸/광고' },
    { value: 'inappropriate', label: '부적절한 내용' },
    { value: 'harassment', label: '괴롭힘/욕설' },
    { value: 'offtopic', label: '주제와 무관' },
    { value: 'other', label: '기타' },
  ],
  user: [
    { value: 'harassment', label: '괴롭힘' },
    { value: 'spam', label: '스팸 행위' },
    { value: 'impersonation', label: '사칭' },
    { value: 'inappropriate', label: '부적절한 행동' },
    { value: 'other', label: '기타' },
  ],
};

export const ReportDialog: React.FC<ReportDialogProps> = ({
  trigger,
  targetType,
  targetId,
  targetUserId
}) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const { requireAuth } = usePermissions();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!requireAuth('report')) return;
    
    if (!reason) {
      toast({
        title: "신고 사유를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // reports 테이블에 신고 데이터 삽입
      const reportData = {
        reporter_id: user!.id,
        content_id: targetType === 'user' ? targetUserId : targetId,
        content_type: targetType === 'article' ? 'news' : targetType,
        reason,
        description: details.trim() || null
      };

      const { error } = await supabase
        .from('reports')
        .insert(reportData);

      if (error) {
        throw error;
      }

      toast({
        title: "신고 완료",
        description: "신고가 성공적으로 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.",
      });

    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "신고 실패",
        description: "신고를 접수하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reasons = REPORT_REASONS[targetType] || REPORT_REASONS.post;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            신고
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Flag className="h-5 w-5 mr-2" />
            신고하기
          </DialogTitle>
          <DialogDescription>
            부적절한 콘텐츠를 신고해주세요. 관리자가 검토 후 조치할 예정입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>신고 사유</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reasons.map((reasonOption) => (
                <div key={reasonOption.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reasonOption.value} id={reasonOption.value} />
                  <Label htmlFor={reasonOption.value} className="text-sm">
                    {reasonOption.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">상세 내용 (선택사항)</Label>
            <Textarea
              id="details"
              placeholder="신고 사유에 대한 구체적인 설명을 입력해주세요..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            variant="destructive"
          >
            {submitting ? '신고 중...' : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};