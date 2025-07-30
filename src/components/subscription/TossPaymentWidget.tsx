import { useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    TossPayments: any;
  }
}

interface TossPaymentWidgetProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const TossPaymentWidget = ({ onSuccess, onError }: TossPaymentWidgetProps) => {
  const { confirmTossPayment } = useSubscription();
  const { toast } = useToast();
  const widgetRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Toss Payments 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment-widget";
    script.async = true;
    script.onload = initializeTossWidget;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeTossWidget = async () => {
    try {
      // APIKEYTODO: Replace with actual Toss client key
      const clientKey = "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"; // APIKEYTODO
      
      if (window.TossPayments) {
        const tossPayments = window.TossPayments(clientKey);
        
        // 결제 위젯 생성
        widgetRef.current = tossPayments.payment({
          customerKey: `customer_${Date.now()}`, // 고유한 고객 키
        });

        // 결제 금액과 주문 정보 설정
        const amount = 4900; // ₩4,900
        const orderId = `order_${Date.now()}`;

        // 결제 위젯 렌더링
        await widgetRef.current.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        });

        // 이용약관 렌더링
        await widgetRef.current.renderAgreement({
          selector: "#toss-agreement",
        });

        // 결제 버튼 이벤트 핸들러
        const requestPayment = async () => {
          try {
            const response = await widgetRef.current.requestPayment({
              orderId,
              orderName: "프리미엄 월간 구독",
              customerName: "구독자",
              customerEmail: "subscriber@example.com", // APIKEYTODO: 실제 사용자 이메일 사용
              successUrl: `${window.location.origin}/subscription/toss/success`,
              failUrl: `${window.location.origin}/subscription/toss/fail`,
            });

            // 결제 성공 처리
            if (response.paymentKey) {
              await confirmTossPayment(response.paymentKey, orderId, amount);
              onSuccess?.();
            }
          } catch (error) {
            console.error("Toss payment error:", error);
            toast({
              title: "결제 오류",
              description: "토스 결제에 실패했습니다.",
              variant: "destructive",
            });
            onError?.(error);
          }
        };

        // 결제 버튼 생성
        if (containerRef.current) {
          const payButton = document.createElement("button");
          payButton.textContent = "토스로 결제하기";
          payButton.className = "w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors";
          payButton.onclick = requestPayment;
          
          const buttonContainer = document.createElement("div");
          buttonContainer.className = "mt-4";
          buttonContainer.appendChild(payButton);
          
          containerRef.current.appendChild(buttonContainer);
        }
      }
    } catch (error) {
      console.error("Failed to initialize Toss widget:", error);
      toast({
        title: "초기화 오류",
        description: "토스 결제 위젯을 초기화할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div ref={containerRef} className="space-y-4">
      <div id="toss-payment-methods" className="border rounded-lg p-4"></div>
      <div id="toss-agreement" className="border rounded-lg p-4"></div>
    </div>
  );
};