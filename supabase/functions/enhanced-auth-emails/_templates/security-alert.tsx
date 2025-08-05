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
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface SecurityAlertEmailProps {
  user_email: string;
  alert_type: 'failed_login' | 'account_locked' | 'suspicious_activity' | 'password_reset';
  device_info?: string;
  location?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export const SecurityAlertEmail = ({
  user_email,
  alert_type,
  device_info,
  location,
  timestamp,
  ip_address,
  user_agent,
}: SecurityAlertEmailProps) => {
  const getAlertTitle = () => {
    switch (alert_type) {
      case 'failed_login': return '⚠️ 로그인 실패 알림';
      case 'account_locked': return '🔒 계정 잠금 알림';
      case 'suspicious_activity': return '🚨 의심스러운 활동 감지';
      case 'password_reset': return '🔑 비밀번호 재설정 요청';
      default: return '🔐 보안 알림';
    }
  };

  const getAlertMessage = () => {
    switch (alert_type) {
      case 'failed_login':
        return '귀하의 계정으로 로그인 시도가 실패했습니다. 본인의 시도가 아니라면 즉시 비밀번호를 변경해주세요.';
      case 'account_locked':
        return '계정 보안을 위해 일시적으로 잠금 처리되었습니다. 15분 후 다시 시도하거나 비밀번호를 재설정해주세요.';
      case 'suspicious_activity':
        return '평소와 다른 위치나 디바이스에서 접근이 감지되었습니다. 본인의 접근이 맞다면 안전하며, 그렇지 않다면 즉시 조치해주세요.';
      case 'password_reset':
        return '비밀번호 재설정이 요청되었습니다. 본인의 요청이 아니라면 계정이 침해되었을 수 있습니다.';
      default:
        return '계정에 보안 관련 활동이 감지되었습니다.';
    }
  };

  const getRecommendedActions = () => {
    switch (alert_type) {
      case 'failed_login':
        return [
          '비밀번호가 유출되었을 가능성을 확인해주세요',
          '강력한 비밀번호로 변경하는 것을 권장합니다',
          '2단계 인증을 활성화해주세요',
        ];
      case 'account_locked':
        return [
          '15분 후 다시 로그인을 시도해주세요',
          '비밀번호를 정확히 입력했는지 확인해주세요',
          '필요시 비밀번호를 재설정해주세요',
        ];
      case 'suspicious_activity':
        return [
          '본인의 접근이 맞는지 확인해주세요',
          '알 수 없는 접근이라면 즉시 비밀번호를 변경해주세요',
          '계정에서 모든 디바이스를 로그아웃해주세요',
        ];
      case 'password_reset':
        return [
          '본인이 요청하지 않았다면 이 이메일을 무시해주세요',
          '계정 보안을 강화해주세요',
          '의심스럽다면 지원팀에 연락해주세요',
        ];
      default:
        return [
          '계정 보안을 점검해주세요',
          '비밀번호를 변경하는 것을 권장합니다',
        ];
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getAlertTitle()} - VibeNews 계정 보안 알림</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🔐 VibeNews 보안 알림</Heading>
          </Section>

          <Hr style={hr} />

          {/* Alert Content */}
          <Section style={content}>
            <Section style={alertBox}>
              <Heading style={alertTitle}>{getAlertTitle()}</Heading>
              <Text style={alertMessage}>
                {getAlertMessage()}
              </Text>
            </Section>

            {/* Incident Details */}
            <Section style={detailsSection}>
              <Heading style={h3}>📋 접근 정보</Heading>
              <Text style={detailText}>
                <strong>계정:</strong> {user_email}<br/>
                <strong>발생 시간:</strong> {new Date(timestamp).toLocaleString('ko-KR')}<br/>
                {ip_address && <><strong>IP 주소:</strong> {ip_address}<br/></>}
                {location && <><strong>위치:</strong> {location}<br/></>}
                {device_info && <><strong>디바이스:</strong> {device_info}<br/></>}
                {user_agent && <><strong>브라우저:</strong> {user_agent.substring(0, 100)}...<br/></>}
              </Text>
            </Section>

            {/* Recommended Actions */}
            <Section style={actionsSection}>
              <Heading style={h3}>🛡️ 권장 조치 사항</Heading>
              {getRecommendedActions().map((action, index) => (
                <Text key={index} style={actionItem}>
                  • {action}
                </Text>
              ))}
            </Section>

            {/* Quick Actions */}
            <Section style={buttonSection}>
              <Row>
                <Column style={buttonCol}>
                  <Link href="https://vibenews.kr/settings/security" style={primaryButton}>
                    보안 설정
                  </Link>
                </Column>
                <Column style={buttonCol}>
                  <Link href="https://vibenews.kr/auth/reset-password" style={secondaryButton}>
                    비밀번호 변경
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* Important Notice */}
            <Section style={noticeSection}>
              <Text style={noticeText}>
                ⚠️ <strong>중요:</strong> 본인이 수행하지 않은 작업이라면 계정이 침해되었을 수 있습니다. 
                즉시 비밀번호를 변경하고 <Link href="mailto:security@vibenews.kr" style={link}>security@vibenews.kr</Link>로 신고해주세요.
              </Text>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              이 이메일은 계정 보안을 위해 자동 발송되었습니다.<br/>
              <Link href="https://vibenews.kr/help/security" style={footerLink}>보안 도움말</Link> | 
              <Link href="mailto:security@vibenews.kr" style={footerLink}>보안팀 연락</Link>
            </Text>
            <Text style={footerCopyright}>
              © 2024 VibeNews Security Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SecurityAlertEmail;

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
  textAlign: 'center' as const,
};

const h1 = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
};

const content = {
  padding: '0 40px',
};

const alertBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #fca5a5',
  borderRadius: '8px',
  padding: '24px',
  margin: '20px 0',
};

const alertTitle = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const alertMessage = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const detailsSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const h3 = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const detailText = {
  color: '#4b5563',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
  fontFamily: 'monospace',
};

const actionsSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const actionItem = {
  color: '#0c4a6e',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.5',
};

const buttonSection = {
  margin: '32px 0',
};

const buttonCol = {
  width: '50%',
  paddingRight: '8px',
  textAlign: 'center' as const,
};

const primaryButton = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0',
  width: '90%',
};

const secondaryButton = {
  backgroundColor: '#6b7280',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0',
  width: '90%',
};

const noticeSection = {
  backgroundColor: '#fffbeb',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0',
};

const noticeText = {
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '1.6',
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
  lineHeight: '1.5',
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
  color: '#dc2626',
  textDecoration: 'none',
  fontWeight: '600',
};