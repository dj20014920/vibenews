import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calendar, Check, CreditCard, Crown, RefreshCw, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface SubscriptionStatusProps {
  showPaymentOptions?: boolean;
  onManageSubscription?: () => void;
}

export const SubscriptionStatus = ({ 
  showPaymentOptions = false, 
  onManageSubscription 
}: SubscriptionStatusProps) => {
  const { status, loading, checkSubscriptionStatus, cancelSubscription } = useSubscription();

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const getStatusBadge = () => {
    if (!status.is_subscribed) {
      return (
        <Badge variant="secondary" className="gap-1">
          <X className="h-3 w-3" />
          구독 없음
        </Badge>
      );
    }

    if (status.days_remaining <= 3) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          곧 만료
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="gap-1">
        <Check className="h-3 w-3" />
        활성
      </Badge>
    );
  };

  const getProviderIcon = (provider: string | null) => {
    switch (provider) {
      case "stripe": return "💳";
      case "paypal": return "🅿️";
      case "kakaopay": return "💛";
      case "toss": return "💙";
      default: return "💳";
    }
  };

  const getProviderName = (provider: string | null) => {
    switch (provider) {
      case "stripe": return "Stripe";
      case "paypal": return "PayPal";
      case "kakaopay": return "카카오페이";
      case "toss": return "토스페이먼츠";
      default: return "알 수 없음";
    }
  };

  if (loading && !status.current_subscription) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          구독 상태 확인 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 메인 구독 상태 카드 */}
      <Card className={status.is_subscribed ? "border-primary/20" : "border-muted"}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {status.is_subscribed ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              )}
              {status.is_subscribed ? "프리미엄 구독자" : "무료 사용자"}
            </CardTitle>
            <CardDescription>
              {status.is_subscribed
                ? `현재 ${status.subscription_tier} 플랜을 이용 중입니다`
                : "프리미엄 구독으로 더 많은 기능을 이용해보세요"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={checkSubscriptionStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        {status.is_subscribed && (
          <CardContent className="space-y-4">
            {/* 구독 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">결제 수단</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getProviderIcon(status.provider)}</span>
                  <span className="font-medium">{getProviderName(status.provider)}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">다음 결제일</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {status.subscription_end 
                      ? formatDistanceToNow(new Date(status.subscription_end), { 
                          addSuffix: true, 
                          locale: ko 
                        })
                      : "정보 없음"
                    }
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">남은 일수</p>
                <span className="font-medium text-2xl">
                  {status.days_remaining}
                  <span className="text-sm font-normal text-muted-foreground ml-1">일</span>
                </span>
              </div>
            </div>

            {/* 구독 기능 */}
            {status.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">포함된 기능</p>
                <div className="flex flex-wrap gap-2">
                  {status.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* 구독 관리 버튼 */}
            <div className="flex gap-2">
              {onManageSubscription && (
                <Button 
                  variant="outline" 
                  onClick={onManageSubscription}
                  className="flex-1"
                >
                  구독 관리
                </Button>
              )}
              
              {status.current_subscription && (
                <Button
                  variant="outline"
                  onClick={() => cancelSubscription(
                    status.current_subscription.id, 
                    status.provider || "unknown"
                  )}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  구독 취소
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 무료 사용자에게 프리미엄 안내 */}
      {!status.is_subscribed && showPaymentOptions && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              프리미엄으로 업그레이드
            </CardTitle>
            <CardDescription>
              더 많은 도구와 콘텐츠를 unlimited로 이용해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                프리미엄 콘텐츠 무제한
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                광고 없는 경험
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                우선 고객 지원
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                독점 도구 액세스
              </div>
            </div>
            
            <Button className="w-full" size="lg">
              지금 구독하기 - ₩4,900/월
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 전체 구독 내역 (개발자 정보) */}
      {status.all_subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">구독 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.all_subscriptions.map((sub, index) => (
                <div key={index} className="flex justify-between items-center text-xs p-2 bg-muted rounded">
                  <span>
                    {getProviderIcon(sub.provider)} {getProviderName(sub.provider)} - {sub.status}
                  </span>
                  <span className="text-muted-foreground">
                    {sub.created_at && formatDistanceToNow(new Date(sub.created_at), { locale: ko })} 전
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};