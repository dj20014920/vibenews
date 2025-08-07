import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Lock, User, Mail } from "lucide-react";
import { 
  validateEmail, 
  validateNickname, 
  checkPasswordStrength, 
  sanitizeInput,
  rateLimiter,
  accountLockManager,
  getDeviceFingerprint,
  SECURITY_CONFIG
} from "@/lib/security";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedAuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (email: string, password: string, nickname?: string) => Promise<{ error: Error | null }>;
  isLoading: boolean;
}

export const EnhancedAuthForm = ({ mode, onSubmit, isLoading }: EnhancedAuthFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState({
    email: { isValid: true, message: "" },
    nickname: { isValid: true, message: "" },
    password: { isValid: true, message: "", score: 0, checks: {
      hasLower: false, hasUpper: false, hasNumber: false, hasSymbol: false,
      hasLength: false, noSequential: false, noRepeated: false
    }},
  });
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTime, setRateLimitTime] = useState(0);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const { toast } = useToast();

  // 디바이스 핑거프린트 생성
  useEffect(() => {
    const fingerprint = getDeviceFingerprint();
    setDeviceFingerprint(fingerprint);
  }, []);

  // Rate limit 체크
  const checkRateLimit = () => {
    const key = `auth_${formData.email}_${deviceFingerprint}`;
    const isAllowed = rateLimiter.isAllowed(key);
    
    if (!isAllowed) {
      const remainingTime = rateLimiter.getRemainingTime(key);
      setIsRateLimited(true);
      setRateLimitTime(remainingTime);
      
      setTimeout(() => {
        setIsRateLimited(false);
        setRateLimitTime(0);
      }, remainingTime);
      
      return false;
    }
    
    return true;
  };

  // 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // 실시간 검증
    if (name === 'email') {
      const emailValidation = validateEmail(sanitizedValue);
      setValidation(prev => ({
        ...prev,
        email: emailValidation
      }));
    } else if (name === 'nickname') {
      const nicknameValidation = validateNickname(sanitizedValue);
      setValidation(prev => ({
        ...prev,
        nickname: nicknameValidation
      }));
    } else if (name === 'password') {
      const passwordValidation = checkPasswordStrength(sanitizedValue);
      setValidation(prev => ({
        ...prev,
        password: passwordValidation
      }));
    }
  };

  // 보안 알림 전송
  const sendSecurityAlert = async (alertType: string, additionalData?: any) => {
    try {
      const response = await supabase.functions.invoke('enhanced-auth-emails', {
        body: {
          type: 'security-alert',
          user_email: formData.email,
          alert_type: alertType,
          device_info: navigator.userAgent,
          location: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: new Date().toISOString(),
          ip_address: 'client-side', // 실제 IP는 edge function에서 추출
          fingerprint: deviceFingerprint,
          ...additionalData,
        }
      });
      
      if (response.error) {
        console.error('Failed to send security alert:', response.error);
      }
    } catch (error) {
      console.error('Error sending security alert:', error);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting 체크
    if (!checkRateLimit()) {
      toast({
        title: "요청 제한",
        description: `너무 많은 시도입니다. ${Math.ceil(rateLimitTime / 1000)}초 후 다시 시도해주세요.`,
        variant: "destructive",
      });
      return;
    }

    // 계정 잠금 체크 (로그인 시)
    if (mode === 'signin') {
      const lockStatus = accountLockManager.isLocked(formData.email);
      if (lockStatus.isLocked) {
        const remainingMinutes = Math.ceil((lockStatus.remainingTime || 0) / (1000 * 60));
        toast({
          title: "계정 잠금",
          description: `계정이 잠금되었습니다. ${remainingMinutes}분 후 다시 시도해주세요.`,
          variant: "destructive",
        });
        await sendSecurityAlert('account_locked');
        return;
      }
    }

    // 최종 검증
    const emailCheck = validateEmail(formData.email);
    const passwordCheck = checkPasswordStrength(formData.password);
    const nicknameCheck = mode === 'signup' ? validateNickname(formData.nickname) : { isValid: true };

    if (!emailCheck.isValid || !passwordCheck.isValid || !nicknameCheck.isValid) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 올바르게 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await onSubmit(
        formData.email, 
        formData.password, 
        mode === 'signup' ? formData.nickname : undefined
      );

      if (result.error) {
        // 로그인 실패 시 처리
        if (mode === 'signin') {
          const lockInfo = accountLockManager.recordFailedAttempt(formData.email);
          
          if (lockInfo.isLocked) {
            await sendSecurityAlert('account_locked');
            toast({
              title: "계정 잠금",
              description: "로그인 시도가 너무 많아 계정이 잠금되었습니다.",
              variant: "destructive",
            });
          } else {
            await sendSecurityAlert('failed_login', {
              remaining_attempts: lockInfo.remainingAttempts,
              error_message: result.error.message,
            });
            toast({
              title: "로그인 실패",
              description: `로그인에 실패했습니다. 남은 시도 횟수: ${lockInfo.remainingAttempts}회`,
              variant: "destructive",
            });
          }
        }
      } else {
        // 성공 시 실패 시도 초기화
        if (mode === 'signin') {
          accountLockManager.clearFailedAttempts(formData.email);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score < 4) return "bg-destructive";
    if (score < 6) return "bg-warning";
    return "bg-success";
  };

  const getPasswordStrengthText = (score: number) => {
    if (score < 4) return "약함";
    if (score < 6) return "보통";
    return "강함";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 닉네임 (회원가입시에만) */}
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="nickname">닉네임</Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="nickname"
              name="nickname"
              type="text"
              placeholder="개발자123"
              value={formData.nickname}
              onChange={handleInputChange}
              className={`pl-10 ${!validation.nickname.isValid ? 'border-destructive' : ''}`}
              required={mode === 'signup'}
              maxLength={SECURITY_CONFIG.NICKNAME_MAX_LENGTH}
            />
          </div>
          {!validation.nickname.isValid && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {validation.nickname.message}
            </div>
          )}
        </div>
      )}

      {/* 이메일 */}
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleInputChange}
            className={`pl-10 ${!validation.email.isValid ? 'border-destructive' : ''}`}
            required
            maxLength={SECURITY_CONFIG.EMAIL_MAX_LENGTH}
          />
          {validation.email.isValid && formData.email && (
            <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-success" />
          )}
        </div>
        {!validation.email.isValid && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {validation.email.message}
          </div>
        )}
      </div>

      {/* 비밀번호 */}
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={mode === 'signup' ? "8자 이상, 대소문자, 숫자, 특수문자 포함" : "••••••••"}
            value={formData.password}
            onChange={handleInputChange}
            className={`pl-10 pr-10 ${!validation.password.isValid ? 'border-destructive' : ''}`}
            required
            maxLength={SECURITY_CONFIG.PASSWORD_MAX_LENGTH}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* 비밀번호 강도 표시 (회원가입시에만) */}
        {mode === 'signup' && formData.password && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress 
                  value={(validation.password.score / 7) * 100} 
                  className="h-2"
                />
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  validation.password.score < 4 ? 'border-destructive text-destructive' :
                  validation.password.score < 6 ? 'border-warning text-warning' :
                  'border-success text-success'
                }`}
              >
                {getPasswordStrengthText(validation.password.score)}
              </Badge>
            </div>
            
            {/* 비밀번호 요구사항 체크리스트 */}
            <div className="text-xs space-y-1">
              <div className={`flex items-center gap-2 ${validation.password.checks.hasLower ? 'text-success' : 'text-muted-foreground'}`}>
                <CheckCircle className="h-3 w-3" />
                소문자 포함
              </div>
              <div className={`flex items-center gap-2 ${validation.password.checks.hasUpper ? 'text-success' : 'text-muted-foreground'}`}>
                <CheckCircle className="h-3 w-3" />
                대문자 포함
              </div>
              <div className={`flex items-center gap-2 ${validation.password.checks.hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
                <CheckCircle className="h-3 w-3" />
                숫자 포함
              </div>
              <div className={`flex items-center gap-2 ${validation.password.checks.hasSymbol ? 'text-success' : 'text-muted-foreground'}`}>
                <CheckCircle className="h-3 w-3" />
                특수문자 포함
              </div>
            </div>
          </div>
        )}

        {!validation.password.isValid && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {validation.password.message}
          </div>
        )}
      </div>

      {/* Rate Limiting 경고 */}
      {isRateLimited && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            요청 제한: {Math.ceil(rateLimitTime / 1000)}초 후 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 보안 정보 */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium">보안 정보</span>
        </div>
        <ul className="space-y-1">
          <li>• 모든 데이터는 암호화되어 전송됩니다</li>
          <li>• 의심스러운 활동 시 보안 알림을 발송합니다</li>
          <li>• 로그인 실패 {SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}회 시 계정이 잠금됩니다</li>
          <li>• 디바이스 핑거프린트: {deviceFingerprint.substring(0, 8)}...</li>
        </ul>
      </div>

      <Button 
        type="submit" 
        className="w-full btn-gradient" 
        disabled={isLoading || isRateLimited || !validation.email.isValid || !validation.password.isValid || (mode === 'signup' && !validation.nickname.isValid)}
      >
        {isLoading ? (
          mode === 'signin' ? "로그인 중..." : "회원가입 중..."
        ) : (
          mode === 'signin' ? "보안 로그인" : "보안 회원가입"
        )}
      </Button>
    </form>
  );
};