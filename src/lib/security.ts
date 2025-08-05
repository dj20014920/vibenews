import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// 보안 상수
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15분
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 254,
  RATE_LIMIT_WINDOW: 60 * 1000, // 1분
  MAX_REQUESTS_PER_WINDOW: 10,
} as const;

// 금지된 패턴 (SQL 인젝션, XSS 등)
const SUSPICIOUS_PATTERNS = [
  /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/gi,
  /(javascript:|data:|vbscript:)/gi,
  /(on\w+\s*=)/gi,
  /(\b(select|insert|update|delete|drop|union|exec|execute)\b)/gi,
  /('|"|;|--|\|\||&&)/g,
  /(\<|\>)/g,
];

// 패스워드 강도 체크
export const checkPasswordStrength = (password: string) => {
  if (!password || password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    return {
      score: 0,
      message: `비밀번호는 최소 ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
      isValid: false,
    };
  }

  if (password.length > SECURITY_CONFIG.PASSWORD_MAX_LENGTH) {
    return {
      score: 0,
      message: `비밀번호는 최대 ${SECURITY_CONFIG.PASSWORD_MAX_LENGTH}자까지 가능합니다.`,
      isValid: false,
    };
  }

  let score = 0;
  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasLength: password.length >= 10,
    noSequential: !/(abc|123|qwe|456|789)/i.test(password),
    noRepeated: !/(.)\1{2,}/.test(password),
  };

  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  let message = '';
  let isValid = true;

  if (score < 4) {
    isValid = false;
    message = '비밀번호가 너무 약합니다. ';
    if (!checks.hasLower) message += '소문자, ';
    if (!checks.hasUpper) message += '대문자, ';
    if (!checks.hasNumber) message += '숫자, ';
    if (!checks.hasSymbol) message += '특수문자, ';
    message = message.slice(0, -2) + '를 포함해주세요.';
  } else if (score < 6) {
    message = '보통 강도의 비밀번호입니다.';
  } else {
    message = '강력한 비밀번호입니다.';
  }

  return { score, message, isValid, checks };
};

// 이메일 검증 (고급)
export const validateEmail = (email: string) => {
  if (!email) {
    return { isValid: false, message: '이메일을 입력해주세요.' };
  }

  if (email.length > SECURITY_CONFIG.EMAIL_MAX_LENGTH) {
    return { isValid: false, message: '이메일이 너무 깁니다.' };
  }

  // 기본 이메일 형식 검증
  if (!validator.isEmail(email)) {
    return { isValid: false, message: '올바른 이메일 형식이 아닙니다.' };
  }

  // 의심스러운 패턴 검사
  if (containsSuspiciousPatterns(email)) {
    return { isValid: false, message: '유효하지 않은 이메일 형식입니다.' };
  }

  // 일회용 이메일 도메인 검사 (일부)
  const disposableEmailDomains = [
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'yopmail.com', 'tempmail.org', 'temp-mail.org'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableEmailDomains.includes(domain)) {
    return { isValid: false, message: '일회용 이메일은 사용할 수 없습니다.' };
  }

  return { isValid: true, message: '유효한 이메일입니다.' };
};

// 닉네임 검증
export const validateNickname = (nickname: string) => {
  if (!nickname) {
    return { isValid: false, message: '닉네임을 입력해주세요.' };
  }

  if (nickname.length < SECURITY_CONFIG.NICKNAME_MIN_LENGTH) {
    return { isValid: false, message: `닉네임은 최소 ${SECURITY_CONFIG.NICKNAME_MIN_LENGTH}자 이상이어야 합니다.` };
  }

  if (nickname.length > SECURITY_CONFIG.NICKNAME_MAX_LENGTH) {
    return { isValid: false, message: `닉네임은 최대 ${SECURITY_CONFIG.NICKNAME_MAX_LENGTH}자까지 가능합니다.` };
  }

  // 의심스러운 패턴 검사
  if (containsSuspiciousPatterns(nickname)) {
    return { isValid: false, message: '유효하지 않은 닉네임입니다.' };
  }

  // 한글, 영문, 숫자만 허용
  if (!/^[가-힣a-zA-Z0-9_-]+$/.test(nickname)) {
    return { isValid: false, message: '닉네임은 한글, 영문, 숫자, _, -만 사용 가능합니다.' };
  }

  // 금지 단어 검사
  const bannedWords = ['admin', 'administrator', 'root', 'system', 'null', 'undefined'];
  if (bannedWords.some(word => nickname.toLowerCase().includes(word))) {
    return { isValid: false, message: '사용할 수 없는 닉네임입니다.' };
  }

  return { isValid: true, message: '유효한 닉네임입니다.' };
};

// 의심스러운 패턴 검사
export const containsSuspiciousPatterns = (input: string): boolean => {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
};

// 입력값 정제 (XSS 방지)
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // HTML 태그 제거 및 특수 문자 인코딩
  let sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  // 추가 정제
  sanitized = sanitized.trim();
  sanitized = sanitized.replace(/[<>]/g, '');
  
  return sanitized;
};

// Rate Limiting (클라이언트 사이드)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // 시간 창 밖의 시도들 제거
    const validAttempts = userAttempts.filter(
      time => now - time < SECURITY_CONFIG.RATE_LIMIT_WINDOW
    );
    
    if (validAttempts.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  getRemainingTime(key: string): number {
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    const remainingTime = SECURITY_CONFIG.RATE_LIMIT_WINDOW - (Date.now() - oldestAttempt);
    return Math.max(0, remainingTime);
  }
}

export const rateLimiter = new RateLimiter();

// 계정 잠금 관리
class AccountLockManager {
  private lockouts: Map<string, { attempts: number; lockedUntil?: number }> = new Map();

  recordFailedAttempt(email: string): { isLocked: boolean; remainingAttempts: number; lockoutTime?: number } {
    const record = this.lockouts.get(email) || { attempts: 0 };
    record.attempts++;
    
    if (record.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
      this.lockouts.set(email, record);
      return { 
        isLocked: true, 
        remainingAttempts: 0, 
        lockoutTime: SECURITY_CONFIG.LOCKOUT_DURATION 
      };
    }
    
    this.lockouts.set(email, record);
    return { 
      isLocked: false, 
      remainingAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - record.attempts 
    };
  }

  isLocked(email: string): { isLocked: boolean; remainingTime?: number } {
    const record = this.lockouts.get(email);
    if (!record || !record.lockedUntil) {
      return { isLocked: false };
    }
    
    const now = Date.now();
    if (now >= record.lockedUntil) {
      // 잠금 해제
      this.lockouts.delete(email);
      return { isLocked: false };
    }
    
    return { 
      isLocked: true, 
      remainingTime: record.lockedUntil - now 
    };
  }

  clearFailedAttempts(email: string): void {
    this.lockouts.delete(email);
  }
}

export const accountLockManager = new AccountLockManager();

// 디바이스 핑거프린팅 (간단한 버전)
export const getDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 10, 10);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');
  
  // 간단한 해시 함수
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  
  return Math.abs(hash).toString(36);
};

// 비밀번호 보안 점수 계산
export const calculateSecurityScore = (password: string): number => {
  const strength = checkPasswordStrength(password);
  return Math.min(100, (strength.score / 7) * 100);
};