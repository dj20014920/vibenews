import React from 'react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Globe, Building } from 'lucide-react';

interface PaymentProvider {
  id: string;
  name: string;
  display_name: string;
  country_codes: string[];
  currencies: string[];
  payment_types: string[];
}

interface PaymentProviderCardProps {
  provider: PaymentProvider;
  isRecommended: boolean;
}

const getProviderIcon = (providerName: string) => {
  switch (providerName.toLowerCase()) {
    case 'toss':
      return <Smartphone className="w-5 h-5 text-blue-500" />;
    case 'stripe':
      return <CreditCard className="w-5 h-5 text-purple-500" />;
    case 'paypal':
      return <Globe className="w-5 h-5 text-blue-600" />;
    case 'paypay':
      return <Smartphone className="w-5 h-5 text-red-500" />;
    case 'ideal':
      return <Building className="w-5 h-5 text-orange-500" />;
    case 'klarna':
      return <CreditCard className="w-5 h-5 text-pink-500" />;
    default:
      return <CreditCard className="w-5 h-5 text-gray-500" />;
  }
};

export function PaymentProviderCard({ provider, isRecommended }: PaymentProviderCardProps) {
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <RadioGroupItem value={provider.name} id={provider.name} />
      <Label htmlFor={provider.name} className="flex-1 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getProviderIcon(provider.name)}
            <div>
              <p className="font-medium">{provider.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {provider.currencies.join(', ')} 지원
              </p>
            </div>
          </div>
          {isRecommended && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              추천
            </Badge>
          )}
        </div>
      </Label>
    </div>
  );
}