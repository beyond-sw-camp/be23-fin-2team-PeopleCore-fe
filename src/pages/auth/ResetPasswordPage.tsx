import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import LogoHeader from '../../components/auth/LogoHeader'
import StepIndicator from '../../components/auth/StepIndicator'
import VerificationStep from '../../components/auth/VerificationStep'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [email, setEmail] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  // Step 3 fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Masked email for step 2
  const [maskedEmail, setMaskedEmail] = useState('')

  const subtitles: Record<number, string> = {
    1: '이메일 인증을 통해 비밀번호를 재설정합니다',
    2: '이메일 인증코드를 입력해 주세요',
    3: '새로운 비밀번호를 입력해 주세요',
    4: '비밀번호가 성공적으로 변경되었습니다',
  }

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API call to send verification email
    const [local, domain] = email.split('@')
    const masked = local.slice(0, 4) + '****@' + domain
    setMaskedEmail(masked)
    setStep(2)
  }

  const handleVerify = () => {
    // TODO: API call to verify code
    setStep(3)
  }

  const handleResend = () => {
    // TODO: API call to resend email
  }

  const isPasswordValid = (pw: string) => {
    return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid(newPassword) || newPassword !== confirmPassword) return
    // TODO: API call to reset password
    setStep(4)
  }

  return (
    <AuthLayout>
      {step < 4 && (
        <button
          onClick={() => (step === 1 ? navigate('/login') : setStep(step - 1))}
          className="text-[var(--primary-color)] text-sm mb-4 inline-block "
        >
          &larr; {step === 1 ? '로그인으로' : '이전 단계'}
        </button>
      )}

      <LogoHeader title="비밀번호 재설정" subtitle={subtitles[step]} />
      <StepIndicator totalSteps={4} currentStep={step} />

      {/* Step 1: Input email + employee ID */}
      {step === 1 && (
        <form onSubmit={handleSendEmail} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="등록된 이메일"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
          />
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="사원번호"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
          />
          <button
            type="submit"
            disabled={!email || !employeeId}
            className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold text-base hover:bg-[var(--dark-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이메일 인증코드 발송
          </button>
        </form>
      )}

      {/* Step 2: Verify email code */}
      {step === 2 && (
        <VerificationStep
          maskedTarget={maskedEmail}
          onVerify={handleVerify}
          onResend={handleResend}
        />
      )}

      {/* Step 3: New password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
            />
            <ul className="text-xs text-gray-400 mt-2 space-y-0.5 pl-1">
              <li>&middot; 8자 이상, 영문/숫자/특수문자 포함</li>
              <li>&middot; 이전 비밀번호와 동일하면 사용 불가</li>
            </ul>
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호 확인"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
          />
          <button
            type="submit"
            disabled={!isPasswordValid(newPassword) || newPassword !== confirmPassword}
            className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold text-base hover:bg-[var(--dark-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            비밀번호 재설정
          </button>
        </form>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--primary-color)] flex items-center justify-center mb-6">
            <i className="fa-solid fa-check text-[var(--primary-color)] text-2xl"></i>
          </div>

          <div className="w-full bg-[#f0faf6] border border-[var(--light-color)] rounded-lg p-5 text-center mb-6">
            <p className="text-sm text-gray-700">비밀번호가 성공적으로 재설정되었습니다.</p>
            <p className="text-sm text-gray-700">새 비밀번호로 로그인해 주세요.</p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold text-base hover:bg-[var(--dark-color)] transition-colors"
          >
            로그인으로 돌아가기
          </button>
        </div>
      )}
    </AuthLayout>
  )
}
