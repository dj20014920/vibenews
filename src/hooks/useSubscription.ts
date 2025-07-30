import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SubscriptionStatus {
  is_subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  days_remaining: number;
  provider: string | null;
  current_subscription: any;
  all_subscriptions: any[];
  features: string[];
}

export interface PaymentProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  supported_countries: string[];
  is_global: boolean;
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: "stripe",
    name: "Stripe",
    icon: "💳",
    description: "국제 카드 결제 (글로벌 표준)",
    supported_countries: ["global"],
    is_global: true,
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: "🅿️",
    description: "페이팔 결제 (글로벌)",
    supported_countries: ["global"],
    is_global: true,
  },
  {
    id: "kakaopay",
    name: "카카오페이",
    icon: "💛",
    description: "카카오페이 간편결제",
    supported_countries: ["KR"],
    is_global: false,
  },
  {
    id: "toss",
    name: "토스페이먼츠",
    icon: "💙",
    description: "토스 간편결제",
    supported_countries: ["KR"],
    is_global: false,
  },
];

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<SubscriptionStatus>({
    is_subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    days_remaining: 0,
    provider: null,
    current_subscription: null,
    all_subscriptions: [],
    features: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 구독 상태 확인
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setStatus({
        is_subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        days_remaining: 0,
        provider: null,
        current_subscription: null,
        all_subscriptions: [],
        features: [],
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("subscription-status", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      setStatus(data);
      console.log("[SUBSCRIPTION] Status updated:", data);
    } catch (err) {
      console.error("[SUBSCRIPTION] Error checking status:", err);
      setError(err instanceof Error ? err.message : "구독 상태 확인 실패");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Stripe 결제 시작
  const startStripeCheckout = useCallback(async () => {
    if (!user) {
      toast({ title: "로그인 필요", description: "결제를 위해 로그인이 필요합니다." });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // 새 탭에서 Stripe 결제 페이지 열기
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("[SUBSCRIPTION] Stripe checkout error:", err);
      toast({
        title: "결제 오류",
        description: "Stripe 결제를 시작할 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // KakaoPay 결제 시작
  const startKakaoPayCheckout = useCallback(async () => {
    if (!user) {
      toast({ title: "로그인 필요", description: "결제를 위해 로그인이 필요합니다." });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("kakaopay-checkout", {
        body: { action: "ready" },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // KakaoPay 결제 페이지로 리다이렉트
      if (data.next_redirect_pc_url) {
        // PC 환경
        window.open(data.next_redirect_pc_url, "_blank");
      } else if (data.next_redirect_mobile_url) {
        // 모바일 환경
        window.location.href = data.next_redirect_mobile_url;
      }

      // tid를 로컬 스토리지에 저장 (승인 시 필요)
      localStorage.setItem("kakaopay_tid", data.tid);
    } catch (err) {
      console.error("[SUBSCRIPTION] KakaoPay checkout error:", err);
      toast({
        title: "결제 오류",
        description: "카카오페이 결제를 시작할 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Toss 결제 확인
  const confirmTossPayment = useCallback(async (paymentKey: string, orderId: string, amount: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("toss-checkout", {
        body: { 
          action: "confirm",
          paymentKey,
          orderId,
          amount,
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "결제 완료",
        description: "토스 결제가 성공적으로 완료되었습니다.",
      });

      // 구독 상태 새로고침
      checkSubscriptionStatus();
      return data;
    } catch (err) {
      console.error("[SUBSCRIPTION] Toss payment confirmation error:", err);
      toast({
        title: "결제 오류",
        description: "토스 결제 확인에 실패했습니다.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, toast, checkSubscriptionStatus]);

  // PayPal 구독 생성
  const createPayPalSubscription = useCallback(async () => {
    if (!user) {
      toast({ title: "로그인 필요", description: "결제를 위해 로그인이 필요합니다." });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", {
        body: { action: "create-subscription" },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // PayPal 승인 페이지로 리다이렉트
      if (data.approval_url) {
        window.open(data.approval_url, "_blank");
      }

      return data;
    } catch (err) {
      console.error("[SUBSCRIPTION] PayPal subscription error:", err);
      toast({
        title: "결제 오류",
        description: "PayPal 구독을 시작할 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 결제사별 결제 시작 함수
  const startPayment = useCallback(async (provider: string) => {
    switch (provider) {
      case "stripe":
        return startStripeCheckout();
      case "kakaopay":
        return startKakaoPayCheckout();
      case "paypal":
        return createPayPalSubscription();
      default:
        toast({
          title: "지원되지 않는 결제사",
          description: `${provider} 결제는 아직 지원되지 않습니다.`,
          variant: "destructive",
        });
    }
  }, [startStripeCheckout, startKakaoPayCheckout, createPayPalSubscription, toast]);

  // 구독 취소
  const cancelSubscription = useCallback(async (subscriptionId: string, provider: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // 구독 상태를 cancelled로 업데이트
      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          status: "cancelled",
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "구독 취소",
        description: "구독이 취소되었습니다. 현재 기간 종료 시까지 이용 가능합니다.",
      });

      // 구독 상태 새로고침
      checkSubscriptionStatus();
    } catch (err) {
      console.error("[SUBSCRIPTION] Cancel error:", err);
      toast({
        title: "취소 실패",
        description: "구독 취소에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, checkSubscriptionStatus]);

  // 컴포넌트 마운트 시 구독 상태 확인
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  // 10초마다 자동 새로고침 (선택적)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkSubscriptionStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [user, checkSubscriptionStatus]);

  return {
    status,
    loading,
    error,
    checkSubscriptionStatus,
    startPayment,
    startStripeCheckout,
    startKakaoPayCheckout,
    confirmTossPayment,
    createPayPalSubscription,
    cancelSubscription,
    providers: PAYMENT_PROVIDERS,
  };
};