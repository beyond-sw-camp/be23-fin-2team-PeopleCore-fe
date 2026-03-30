import { useState, useEffect } from 'react'

interface VerificationStepProps {
  maskedTarget: string
  targetType: 'sms' | 'email'
  onVerify: (code: string) => void
  onResend: () => void
}

export default function VerificationStep({
  maskedTarget,
  targetType,
  onVerify,
  onResend,
}: VerificationStepProps) {
  const [code, setCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(300)

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')

  const handleResend = () => {
    setTimeLeft(300)
    setCode('')
    onResend()
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#f0faf6] border border-[var(--light-color)] rounded-lg p-4 text-center text-sm text-gray-700">
        <p className="font-medium">{maskedTarget} 으로</p>
        <p>인증코드를 발송했습니다.</p>
      </div>

      <input
        type="text"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="인증코드 6자리 입력"
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
      />

      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          유효시간 <span className="text-[var(--primary-color)]">{minutes}:{seconds}</span>
        </p>
        <button
          onClick={handleResend}
          className="text-sm text-gray-500 underline mt-1 hover:text-gray-700"
        >
          인증코드 재발송
        </button>
      </div>

      <button
        onClick={() => onVerify(code)}
        disabled={code.length !== 6 || timeLeft <= 0}
        className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold text-base hover:bg-[var(--dark-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        인증 확인
      </button>
    </div>
  )
}
