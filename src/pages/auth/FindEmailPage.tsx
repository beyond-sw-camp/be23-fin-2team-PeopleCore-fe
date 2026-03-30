import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import LogoHeader from '../../components/auth/LogoHeader'
import StepIndicator from '../../components/auth/StepIndicator'
import VerificationStep from '../../components/auth/VerificationStep'

export default function FindEmailPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [employeeId, setEmployeeId] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')

  // Result
  const [maskedPhone, setMaskedPhone] = useState('')
  const [foundEmail, setFoundEmail] = useState('')

  const subtitles: Record<number, string> = {
    1: 'SMS를 통해 계정 이메일을 확인합니다',
    2: 'SMS 인증코드를 입력해 주세요',
    3: '본인 인증이 완료되었습니다',
  }

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API call to send SMS
    const masked = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1-****-$2')
    setMaskedPhone(masked)
    setStep(2)
  }

  const handleVerify = (_code: string) => {
    // TODO: API call to verify code
    setFoundEmail('hong****@company.com')
    setStep(3)
  }

  const handleResend = () => {
    // TODO: API call to resend SMS
  }

  return (
    <AuthLayout>
      {step < 3 && (
        <button
          onClick={() => (step === 1 ? navigate('/login') : setStep(step - 1))}
          className="text-[var(--primary-color)] text-sm mb-4 inline-block "
        >
          &larr; {step === 1 ? '로그인으로' : '이전 단계'}
        </button>
      )}

      <LogoHeader title="이메일 찾기" subtitle={subtitles[step]} />
      <StepIndicator totalSteps={3} currentStep={step} />

      {/* Step 1: Input personal info */}
      {step === 1 && (
        <form onSubmit={handleSendSms} className="space-y-4">
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="사원번호"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
          />
          <input
            type="text"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value.replace(/\D/g, ''))}
            maxLength={8}
            placeholder="생년월일 (YYYYMMDD)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            maxLength={11}
            placeholder="휴대폰 번호 (- 없이 입력)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
          />
          <button
            type="submit"
            disabled={!employeeId || !name || birthDate.length !== 8 || phone.length < 10}
            className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold text-base hover:bg-[var(--dark-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SMS 인증코드 발송
          </button>
        </form>
      )}

      {/* Step 2: Verify SMS code */}
      {step === 2 && (
        <VerificationStep
          maskedTarget={maskedPhone}
          targetType="sms"
          onVerify={handleVerify}
          onResend={handleResend}
        />
      )}

      {/* Step 3: Show result */}
      {step === 3 && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--primary-color)] flex items-center justify-center mb-6">
            <i className="fa-solid fa-check text-[var(--primary-color)] text-2xl"></i>
          </div>

          <div className="w-full bg-[#f0faf6] border border-[var(--light-color)] rounded-lg p-5 text-center mb-6">
            <p className="text-xs text-gray-500 mb-1">찾은 이메일</p>
            <p className="text-lg font-bold text-gray-800">{foundEmail}</p>
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
