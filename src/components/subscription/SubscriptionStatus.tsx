import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Building, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: any; // JSON 타입으로 수정
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  payment_provider: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  subscription_plans: SubscriptionPlan;
}

export function SubscriptionStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      // 구독 플랜 정보 로드
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // 사용자 구독 정보 로드
      if (user) {
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans (*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (subError && subError.code !== 'PGRST116') {
          throw subError;
        }
        
        setSubscription(subData);
      }
    } catch (error) {
      console.error('구독 정보 로드 실패:', error);
      toast({
        title: "오류",
        description: "구독 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    setRefreshing(true);
    await loadSubscriptionData();
    setRefreshing(false);
    toast({
      title: "새로고침 완료",
      description: "구독 상태가 업데이트되었습니다.",
    });
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      case 'premium':
        return <Crown className="w-5 h-5 text-purple-500" />;
      case 'enterprise':
        return <Building className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlanBadgeColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'enterprise':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency,
    }).format(price / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 현재 구독 상태 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">현재 구독</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSubscriptionStatus}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getPlanIcon(subscription.subscription_plans.name)}
                <div>
                  <h3 className="font-semibold text-lg">{subscription.subscription_plans.name} 플랜</h3>
                  <p className="text-sm text-muted-foreground">{subscription.subscription_plans.description}</p>
                </div>
                <Badge className={getPlanBadgeColor(subscription.subscription_plans.name)}>
                  활성
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">시작일:</span>
                  <p className="text-muted-foreground">{formatDate(subscription.start_date)}</p>
                </div>
                <div>
                  <span className="font-medium">만료일:</span>
                  <p className="text-muted-foreground">{formatDate(subscription.end_date)}</p>
                </div>
                <div>
                  <span className="font-medium">결제 방식:</span>
                  <p className="text-muted-foreground">{subscription.payment_provider}</p>
                </div>
                <div>
                  <span className="font-medium">자동 갱신:</span>
                  <p className="text-muted-foreground">{subscription.auto_renew ? '활성' : '비활성'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">포함된 기능:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {(Array.isArray(subscription.subscription_plans.features) ? subscription.subscription_plans.features : []).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">활성 구독이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                프리미엄 기능을 이용하려면 구독을 시작하세요.
              </p>
              <Button>구독 시작하기</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사용 가능한 구독 플랜 */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${
            subscription?.plan_id === plan.id 
              ? 'border-primary shadow-lg' 
              : 'hover:shadow-md transition-shadow'
          }`}>
            {subscription?.plan_id === plan.id && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className={getPlanBadgeColor(plan.name)}>
                  현재 플랜
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getPlanIcon(plan.name)}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {formatPrice(plan.price_monthly, plan.currency)}
                  <span className="text-sm font-normal text-muted-foreground">/월</span>
                </div>
                {plan.price_yearly && (
                  <div className="text-sm text-muted-foreground">
                    연간: {formatPrice(plan.price_yearly, plan.currency)}
                    <span className="text-green-600 ml-1">
                      ({Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% 할인)
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 mb-6">
                {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={subscription?.plan_id === plan.id ? "outline" : "default"}
                disabled={subscription?.plan_id === plan.id}
              >
                {subscription?.plan_id === plan.id 
                  ? '현재 플랜' 
                  : `${plan.name} 시작하기`
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}