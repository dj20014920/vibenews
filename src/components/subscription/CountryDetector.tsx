import { useEffect, useState } from 'react';

export const useCountryDetector = () => {
  const [userCountry, setUserCountry] = useState<string>('KR');

  useEffect(() => {
    detectUserCountry();
  }, []);

  const detectUserCountry = async () => {
    try {
      // 브라우저 언어 설정으로 국가 추정
      const language = navigator.language || navigator.languages?.[0];
      const countryCode = language?.split('-')[1] || 'KR';
      setUserCountry(countryCode.toUpperCase());
    } catch (error) {
      console.error('국가 감지 실패:', error);
      setUserCountry('KR');
    }
  };

  const getRecommendedProvider = () => {
    // 국가별 추천 결제 방식
    const countryProviderMap: Record<string, string> = {
      'KR': 'toss',
      'JP': 'paypay',
      'NL': 'ideal',
      'US': 'stripe',
      'GB': 'stripe',
      'DE': 'klarna',
      'FR': 'stripe',
      'CA': 'stripe',
      'AU': 'stripe',
    };

    return countryProviderMap[userCountry] || 'stripe';
  };

  return {
    userCountry,
    getRecommendedProvider,
  };
};