import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Globe, MapPin } from "lucide-react";
import { useSubscription, PAYMENT_PROVIDERS } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface PaymentSelectorProps {
  onPaymentStart?: (provider: string) => void;
}

export const PaymentSelector = ({ onPaymentStart }: PaymentSelectorProps) => {
  const { loading, startPayment } = useSubscription();
  const [selectedProvider, setSelectedProvider] = useState<string>("stripe");

  const handlePayment = async () => {
    await startPayment(selectedProvider);
    onPaymentStart?.(selectedProvider);
  };

  const getProviderRegion = (provider: any) => {
    if (provider.is_global) {
      return { label: "글로벌", icon: Globe, variant: "secondary" as const };
    } else {
      return { label: "한국", icon: MapPin, variant: "outline" as const };
    }
  };

  return (
    <div className="space-y-6">
      {/* 플랜 정보 */}
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">프리미엄 월간 구독</CardTitle>
          <CardDescription>개발자를 위한 최고의 도구와 콘텐츠</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold text-primary">
            ₩4,900
            <span className="text-lg font-normal text-muted-foreground">/월</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              프리미엄 콘텐츠 무제한 액세스
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              광고 없는 깨끗한 경험
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              우선 고객 지원
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결제 수단 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            결제 수단 선택
          </CardTitle>
          <CardDescription>
            편리한 결제 수단을 선택해주세요. 모든 결제는 안전하게 보호됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PAYMENT_PROVIDERS.map((provider) => {
            const region = getProviderRegion(provider);
            const RegionIcon = region.icon;
            
            return (
              <div
                key={provider.id}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all",
                  selectedProvider === provider.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{provider.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{provider.name}</h3>
                      <Badge variant={region.variant} className="text-xs">
                        <RegionIcon className="h-3 w-3 mr-1" />
                        {region.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                </div>
                
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all",
                  selectedProvider === provider.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}>
                  {selectedProvider === provider.id && (
                    <Check className="h-2 w-2 text-primary-foreground m-0.5" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Separator />

      {/* 결제 버튼 */}
      <div className="space-y-4">
        <Button
          onClick={handlePayment}
          disabled={loading}
          size="lg"
          className="w-full text-lg py-6"
        >
          {loading ? (
            "결제 준비 중..."
          ) : (
            `${PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name}로 결제하기`
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          결제 시 <strong>이용약관</strong> 및 <strong>개인정보처리방침</strong>에 동의하게 됩니다.
          <br />
          언제든지 구독을 취소할 수 있으며, 취소 시 현재 결제 기간 종료까지 서비스를 이용할 수 있습니다.
        </p>
      </div>
    </div>
  );
};