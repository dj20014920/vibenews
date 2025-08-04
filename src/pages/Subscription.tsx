import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Star, Zap, Check, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PaymentSelector } from '@/components/subscription/PaymentSelector';

export default function Subscription() {
  const { user } = useAuth();
  const { status, checkSubscriptionStatus } = useSubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user, checkSubscriptionStatus]);

  const plans = [
    {
      id: '4f4ad161-81dd-44e1-969b-8f95411322fb',
      name: 'Basic',
      price: 9900,
      priceYearly: 99000,
      description: '개인 개발자를 위한 기본 플랜',
      icon: <Star className="h-6 w-6" />,
      features: [
        '광고 제거',
        '기본 AI 설명',
        '북마크 폴더 10개',
        '월 100회 AI 요청',
        '기본 지원'
      ],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: '32886db6-00e3-48f5-9169-7e5346538c04',
      name: 'Premium',
      price: 19900,
      priceYearly: 199000,
      description: '전문 개발자를 위한 프리미엄 플랜',
      icon: <Crown className="h-6 w-6" />,
      features: [
        '모든 Basic 기능',
        '고급 AI 설명',
        '무제한 북마크 폴더',
        '월 1000회 AI 요청',
        '우선 지원',
        '새 기능 미리보기'
      ],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      popular: true,
    },
    {
      id: 'f1b8d41d-1b7a-4fdb-a048-f5ed9da2a1f3',
      name: 'Enterprise',
      price: 49900,
      priceYearly: 499000,
      description: '팀과 기업을 위한 엔터프라이즈 플랜',
      icon: <Zap className="h-6 w-6" />,
      features: [
        '모든 Premium 기능',
        '팀 관리',
        'API 액세스',
        '무제한 AI 요청',
        '전담 지원',
        '커스텀 통합'
      ],
      color: 'text-gold-600',
      bgColor: 'bg-gold-50',
      borderColor: 'border-gold-200',
    },
  ];

  const handlePlanSelect = (planId: string) => {
    if (!user) {
      // 로그인이 필요하다는 메시지 표시
      return;
    }
    setSelectedPlanId(planId);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    checkSubscriptionStatus();
  };

  if (!user) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">구독이 필요합니다</h1>
        <p className="text-muted-foreground mb-8">
          프리미엄 기능을 이용하시려면 로그인이 필요합니다.
        </p>
        <Button asChild>
          <a href="/auth">로그인하기</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container-custom py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-gradient">구독 플랜</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI 코딩의 미래를 함께 만들어가세요. 당신에게 맞는 플랜을 선택하세요.
          </p>
        </div>

        {/* Current Subscription Status */}
        {status.is_subscribed && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-gold-500" />
                현재 구독
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{status.subscription_tier} 플랜</p>
                  <p className="text-sm text-muted-foreground">
                    {status.subscription_end && `${status.days_remaining}일 남음`}
                  </p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  활성
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">결제 진행</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPayment(false)}
                  >
                    ✕
                  </Button>
                </div>
                <PaymentSelector
                  planId={selectedPlanId}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                  인기
                </div>
              )}
              
              <CardHeader className="text-center space-y-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${plan.bgColor}`}>
                  <div className={plan.color}>
                    {plan.icon}
                  </div>
                </div>
                
                <div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </div>
                
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    ₩{plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/월</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    연간 결제 시 ₩{plan.priceYearly.toLocaleString()}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={status.current_subscription?.plan_id === plan.id}
                >
                  {status.current_subscription?.plan_id === plan.id ? (
                    '현재 플랜'
                  ) : (
                    <>
                      플랜 선택하기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">자주 묻는 질문</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">언제든지 취소할 수 있나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  네, 언제든지 구독을 취소할 수 있습니다. 취소 후에도 현재 결제 기간이 끝날 때까지 모든 기능을 이용할 수 있습니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">플랜을 변경할 수 있나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경사항은 즉시 적용됩니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">무료 체험이 있나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  모든 사용자는 가입 시 7일 무료 체험을 받을 수 있습니다. 체험 기간 동안 모든 Premium 기능을 사용해보세요.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">팀 할인이 있나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  5명 이상의 팀의 경우 Enterprise 플랜에서 특별 할인을 제공합니다. 자세한 내용은 문의해주세요.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}