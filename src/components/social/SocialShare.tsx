import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Link2, 
  Download,
  Mail,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SocialShareProps {
  contentId: string;
  contentType: 'news_article' | 'community_post' | 'code_snippet';
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  className?: string;
}

export const SocialShare = ({ 
  contentId, 
  contentType, 
  title, 
  description, 
  url, 
  imageUrl,
  className = "" 
}: SocialShareProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const currentUrl = url || window.location.href;
  const shareText = `${title}${description ? ` - ${description}` : ''}`;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);

  const trackShare = async (platform: string) => {
    try {
      // 공유 기록 저장
      await supabase
        .from('social_shares')
        .insert({
          user_id: user?.id,
          content_id: contentId,
          content_type: contentType,
          platform: platform,
          share_url: currentUrl
        });

      // 사용자 상호작용 기록
      if (user) {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            content_id: contentId,
            content_type: contentType,
            interaction_type: 'share',
            interaction_data: { platform }
          });
      }
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const shareToFacebook = async () => {
    await trackShare('facebook');
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = async () => {
    await trackShare('twitter');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToKakaoTalk = async () => {
    await trackShare('kakaotalk');
    
    // KakaoTalk Web API 사용 (실제 구현 시 Kakao SDK 필요)
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description || '',
          imageUrl: imageUrl || '',
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
          },
        },
        buttons: [
          {
            title: '웹으로 보기',
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl,
            },
          },
        ],
      });
    } else {
      // Kakao SDK가 없는 경우 URL 스키마 사용
      const kakaoUrl = `kakaolink://send?msg=${encodedText}&url=${encodedUrl}`;
      window.location.href = kakaoUrl;
    }
  };

  const shareToWhatsApp = async () => {
    await trackShare('whatsapp');
    const whatsappUrl = `https://wa.me/?text=${encodedText} ${encodedUrl}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToTelegram = async () => {
    await trackShare('telegram');
    const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    window.open(telegramUrl, '_blank');
  };

  const shareByEmail = async () => {
    await trackShare('email');
    const emailSubject = encodeURIComponent(`공유: ${title}`);
    const emailBody = encodeURIComponent(`${shareText}\n\n${currentUrl}`);
    const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    window.location.href = mailtoUrl;
  };

  const copyToClipboard = async () => {
    setIsLoading(true);
    try {
      await navigator.clipboard.writeText(currentUrl);
      await trackShare('clipboard');
      
      toast({
        title: "링크 복사 완료",
        description: "링크가 클립보드에 복사되었습니다.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        await trackShare('clipboard');
        toast({
          title: "링크 복사 완료",
          description: "링크가 클립보드에 복사되었습니다.",
        });
      } catch (err) {
        toast({
          title: "복사 실패",
          description: "링크 복사에 실패했습니다.",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    } finally {
      setIsLoading(false);
    }
  };

  const generateShareImage = async () => {
    setIsLoading(true);
    try {
      // 공유용 이미지 생성 (실제로는 서버 사이드 또는 Canvas API 사용)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 1200;
        canvas.height = 630;
        
        // 배경
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 제목
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        
        // 텍스트 줄바꿈 처리
        const words = title.split(' ');
        let line = '';
        let y = 200;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > 1000 && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += 60;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
        
        // 설명
        if (description) {
          ctx.fillStyle = '#666666';
          ctx.font = '32px Arial';
          ctx.fillText(description.slice(0, 100) + '...', canvas.width / 2, y + 100);
        }
        
        // 로고/브랜드
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('AI 개발자 커뮤니티', canvas.width / 2, canvas.height - 50);
        
        // 이미지를 Blob으로 변환
        canvas.toBlob(async (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `share-image-${contentId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            await trackShare('image_download');
            
            toast({
              title: "이미지 다운로드 완료",
              description: "공유용 이미지가 다운로드되었습니다.",
            });
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('Error generating share image:', error);
      toast({
        title: "이미지 생성 실패",
        description: "공유 이미지 생성에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const useNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: currentUrl,
        });
        await trackShare('native');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-1" />
          공유
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* 기본 공유 옵션 */}
        <DropdownMenuItem onClick={copyToClipboard} disabled={isLoading}>
          <Copy className="mr-2 h-4 w-4" />
          링크 복사
        </DropdownMenuItem>
        
        {navigator.share && (
          <>
            <DropdownMenuItem onClick={useNativeShare}>
              <Share2 className="mr-2 h-4 w-4" />
              기본 공유
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* 소셜 미디어 */}
        <DropdownMenuItem onClick={shareToFacebook}>
          <Facebook className="mr-2 h-4 w-4 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToTwitter}>
          <Twitter className="mr-2 h-4 w-4 text-blue-400" />
          Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToKakaoTalk}>
          <MessageCircle className="mr-2 h-4 w-4 text-yellow-500" />
          KakaoTalk
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* 메신저 */}
        <DropdownMenuItem onClick={shareToWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToTelegram}>
          <MessageCircle className="mr-2 h-4 w-4 text-blue-500" />
          Telegram
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* 기타 */}
        <DropdownMenuItem onClick={shareByEmail}>
          <Mail className="mr-2 h-4 w-4" />
          이메일로 공유
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={generateShareImage} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          공유 이미지 생성
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};