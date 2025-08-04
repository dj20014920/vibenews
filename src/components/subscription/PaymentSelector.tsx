import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { PaymentProviderCard } from './PaymentProviderCard';
import { useCountryDetector } from './CountryDetector';

interface PaymentProvider {
  id: string;
  name: string;
  display_name: string;
  country_codes: string[];
  currencies: string[];
  payment_types: string[];
}

interface PaymentSelectorProps {
  planId: string;
  onPaymentSuccess?: () => void;
  className?: string;
}

export function PaymentSelector({ planId, onPaymentSuccess, className }: PaymentSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userCountry, getRecommendedProvider } = useCountryDetector();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPaymentProviders();
  }, []);

  const loadPaymentProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .eq('is_active', true)
        .contains('payment_types', ['subscription']);

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('결제 제공자 로드 실패:', error);
      toast({
        title: "오류",
        description: "결제 방법을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const getAvailableProviders = () => {
    return providers.filter(provider => 
      provider.country_codes.includes(userCountry) ||
      provider.country_codes.includes('US') // Stripe/PayPal은 대부분 국가 지원
    );
  };

  const handlePaymentStart = async () => {
    if (!selectedProvider || !user) {
      toast({
        title: "오류",
        description: "결제 방법을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // 선택된 결제 제공자에 따라 다른 Edge Function 호출
      let functionName = '';
      switch (selectedProvider) {
        case 'toss':
          functionName = 'toss-checkout';
          break;
        case 'stripe':
          functionName = 'stripe-checkout';
          break;
        case 'paypal':
          functionName = 'paypal-checkout';
          break;
        default:
          throw new Error('지원하지 않는 결제 방식입니다.');
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          planId,
          countryCode: userCountry,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // 새 탭에서 결제 페이지 열기
        window.open(data.url, '_blank');
        
        toast({
          title: "결제 창 열림",
          description: "새 탭에서 결제를 진행해주세요.",
        });

        // 결제 완료 확인을 위한 폴링 시작
        startPaymentStatusPolling();
      }
    } catch (error) {
      console.error('결제 시작 실패:', error);
      toast({
        title: "결제 오류",
        description: "결제를 시작하는데 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const startPaymentStatusPolling = () => {
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .single();

        if (data) {
          clearInterval(interval);
          toast({
            title: "결제 완료",
            description: "구독이 성공적으로 활성화되었습니다!",
          });
          onPaymentSuccess?.();
        }
      } catch (error) {
        // 아직 결제가 완료되지 않음
      }
    }, 3000);

    // 5분 후 폴링 중단
    setTimeout(() => clearInterval(interval), 300000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availableProviders = getAvailableProviders();
  const recommendedProvider = getRecommendedProvider();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>결제 방법 선택</CardTitle>
        <p className="text-sm text-muted-foreground">
          안전하고 편리한 결제 방법을 선택하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
          {availableProviders.map((provider) => (
            <PaymentProviderCard
              key={provider.id}
              provider={provider}
              isRecommended={provider.name === recommendedProvider}
            />
          ))}
        </RadioGroup>

        {availableProviders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              현재 지역에서 사용 가능한 결제 방법이 없습니다.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              고객 지원팀에 문의해주세요.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4">
          <Button
            onClick={handlePaymentStart}
            disabled={!selectedProvider || processing || availableProviders.length === 0}
            className="w-full"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                결제 처리 중...
              </>
            ) : (
              '결제 시작하기'
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            결제 진행 시 새 탭에서 안전한 결제 페이지로 이동합니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
}