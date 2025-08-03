import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TossPaymentWidgetProps {
  planId: string;
  onSuccess?: (data: any) => void;
  onFail?: (error: any) => void;
  className?: string;
}

export function TossPaymentWidget({ planId, onSuccess, onFail, className }: TossPaymentWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const paymentWidgetRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 토스페이먼츠 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment-widget';
    script.async = true;
    script.onload = initializeWidget;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initializeWidget = async () => {
    try {
      if (!window.PaymentWidget) {
        throw new Error('토스페이먼츠 위젯을 로드할 수 없습니다.');
      }

      // 클라이언트 키는 환경에 따라 설정
      const clientKey = process.env.NODE_ENV === 'production' 
        ? 'live_ck_your_live_client_key' 
        : 'test_ck_your_test_client_key';

      const paymentWidget = window.PaymentWidget(clientKey, window.PaymentWidget.ANONYMOUS);
      
      // 결제 방법 위젯 렌더링
      const paymentMethodWidget = paymentWidget.renderPaymentMethods(
        paymentWidgetRef.current,
        { value: 0, currency: 'KRW' }
      );

      // 약관 동의 위젯
      paymentWidget.renderAgreement('#agreement');

      setIsReady(true);
      setLoading(false);
    } catch (error) {
      console.error('토스페이먼츠 위젯 초기화 실패:', error);
      setLoading(false);
      toast({
        title: "초기화 오류",
        description: "결제 위젯을 초기화하는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!isReady || !user) {
      toast({
        title: "오류",
        description: "결제 위젯이 준비되지 않았거나 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 구독 플랜 정보 조회
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      // 결제 요청 생성
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('toss-checkout', {
        body: {
          planId,
          userId: user.id,
          amount: plan.price_monthly,
          currency: plan.currency,
          orderName: `${plan.name} 플랜 구독`,
          successUrl: `${window.location.origin}/subscription/success`,
          failUrl: `${window.location.origin}/subscription/fail`,
        },
      });

      if (paymentError) throw paymentError;

      // 토스페이먼츠 결제 요청
      await window.PaymentWidget.requestPayment({
        orderId: paymentData.orderId,
        orderName: `${plan.name} 플랜 구독`,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
        customerEmail: user.email,
        customerName: user.email?.split('@')[0] || 'User',
      });

    } catch (error) {
      console.error('토스 결제 실패:', error);
      onFail?.(error);
      toast({
        title: "결제 실패",
        description: "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">결제 위젯 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 결제 방법 선택 */}
      <div ref={paymentWidgetRef} />
      
      {/* 약관 동의 */}
      <div id="agreement" />
      
      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        disabled={!isReady}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isReady ? '결제하기' : '결제 준비 중...'}
      </button>
      
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• 안전한 토스페이먼츠 시스템을 통해 결제됩니다</p>
        <p>• 결제 정보는 암호화되어 안전하게 처리됩니다</p>
        <p>• 언제든지 구독을 취소할 수 있습니다</p>
      </div>
    </div>
  );
}

// 토스페이먼츠 타입 정의
declare global {
  interface Window {
    PaymentWidget: any;
  }
}