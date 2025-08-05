import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Img,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
  user_email: string;
  auth_method: 'email' | 'google' | 'github';
  user_nickname?: string;
  device_info?: string;
  location?: string;
}

export const WelcomeEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
  auth_method,
  user_nickname,
  device_info,
  location,
}: WelcomeEmailProps) => {
  const confirmationUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
  
  const getAuthMethodName = () => {
    switch (auth_method) {
      case 'google': return 'Google';
      case 'github': return 'GitHub';
      default: return '이메일';
    }
  };

  const getAuthMethodIcon = () => {
    switch (auth_method) {
      case 'google': return '🔗';
      case 'github': return '⚡';
      default: return '📧';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>VibeNews에 오신 것을 환영합니다! 이메일 인증을 완료해주세요.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column>
                <Img
                  src="https://zcgkygxcyuupexiyrvdz.supabase.co/storage/v1/object/public/assets/vibenews-logo.png"
                  width="40"
                  height="40"
                  alt="VibeNews"
                  style={logo}
                />
              </Column>
              <Column style={headerText}>
                <Heading style={h1}>VibeNews</Heading>
                <Text style={tagline}>바이브 코딩 트렌드의 모든 것</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h2}>
              {getAuthMethodIcon()} {user_nickname || user_email}님, 환영합니다!
            </Heading>
            
            <Text style={text}>
              <strong>{getAuthMethodName()}</strong>로 VibeNews에 가입해주셔서 감사합니다. 
              계정을 활성화하려면 아래 버튼을 클릭해주세요.
            </Text>

            {/* Verification Button */}
            <Section style={buttonContainer}>
              <Link href={confirmationUrl} style={button}>
                이메일 인증하기
              </Link>
            </Section>

            <Text style={smallText}>
              또는 아래 인증 코드를 직접 입력하세요:
            </Text>
            <Section style={codeContainer}>
              <Text style={code}>{token}</Text>
            </Section>

            {/* Security Info */}
            <Section style={securityInfo}>
              <Heading style={h3}>🔒 보안 정보</Heading>
              <Text style={securityText}>
                <strong>인증 방식:</strong> {getAuthMethodName()}<br/>
                <strong>등록 시간:</strong> {new Date().toLocaleString('ko-KR')}<br/>
                {device_info && <><strong>디바이스:</strong> {device_info}<br/></>}
                {location && <><strong>위치:</strong> {location}<br/></>}
              </Text>
              <Text style={warningText}>
                ⚠️ 본인이 가입하지 않았다면 이 이메일을 무시하고 즉시 
                <Link href="mailto:security@vibenews.kr" style={link}>security@vibenews.kr</Link>로 신고해주세요.
              </Text>
            </Section>

            {/* Features Preview */}
            <Section style={featuresSection}>
              <Heading style={h3}>🚀 이제 이런 기능들을 사용할 수 있어요!</Heading>
              <Row>
                <Column style={featureCol}>
                  <Text style={featureTitle}>📰 개인 맞춤 뉴스</Text>
                  <Text style={featureDesc}>AI가 분석한 개발 트렌드</Text>
                </Column>
                <Column style={featureCol}>
                  <Text style={featureTitle}>💬 커뮤니티</Text>
                  <Text style={featureDesc}>개발자들과 소통하기</Text>
                </Column>
              </Row>
              <Row>
                <Column style={featureCol}>
                  <Text style={featureTitle}>🔖 스크랩</Text>
                  <Text style={featureDesc}>중요한 정보 저장하기</Text>
                </Column>
                <Column style={featureCol}>
                  <Text style={featureTitle}>📊 트렌드 분석</Text>
                  <Text style={featureDesc}>실시간 기술 동향 파악</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://vibenews.kr" style={footerLink}>VibeNews</Link> | 
              <Link href="https://vibenews.kr/privacy" style={footerLink}>개인정보처리방침</Link> | 
              <Link href="https://vibenews.kr/terms" style={footerLink}>이용약관</Link>
            </Text>
            <Text style={footerCopyright}>
              © 2024 VibeNews. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '20px 40px',
};

const logo = {
  borderRadius: '8px',
};

const headerText = {
  paddingLeft: '12px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.2',
};

const tagline = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0 0 0',
};

const content = {
  padding: '0 40px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '32px 0 16px 0',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '24px 0 12px 0',
};

const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0',
};

const smallText = {
  color: '#6b7280',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '24px 0 8px 0',
};

const codeContainer = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '16px 0 32px 0',
};

const code = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  fontFamily: 'monospace',
  margin: '0',
  letterSpacing: '2px',
};

const securityInfo = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0',
};

const securityText = {
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 12px 0',
};

const warningText = {
  color: '#dc2626',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '12px 0 0 0',
  fontWeight: '500',
};

const featuresSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0',
};

const featureCol = {
  width: '50%',
  paddingRight: '16px',
  paddingBottom: '16px',
};

const featureTitle = {
  color: '#0c4a6e',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const featureDesc = {
  color: '#075985',
  fontSize: '12px',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const footer = {
  padding: '32px 40px 20px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0 0 8px 0',
};

const footerLink = {
  color: '#3b82f6',
  textDecoration: 'none',
  margin: '0 8px',
};

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
};