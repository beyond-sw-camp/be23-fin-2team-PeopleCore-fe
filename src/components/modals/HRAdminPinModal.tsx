import { useState, useRef, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
}

const CORRECT_PIN = '1234' // TODO: 실제 서버 검증으로 교체

export default function HRAdminPinModal({ isOpen, onClose, onVerified }: Props) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', ''])
      setError(false)
      setShaking(false)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    setError(false)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // 4자리 모두 입력되면 자동 검증
    if (index === 3 && value) {
      const fullPin = newPin.join('')
      if (fullPin.length === 4) {
        if (fullPin === CORRECT_PIN) {
          onClose()
          setTimeout(() => onVerified(), 100)
        } else {
          setError(true)
          setShaking(true)
          setTimeout(() => {
            setShaking(false)
            setPin(['', '', '', ''])
            inputRefs.current[0]?.focus()
          }, 500)
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      const newPin = pasted.split('')
      setPin(newPin)
      inputRefs.current[3]?.focus()

      if (pasted === CORRECT_PIN) {
        setTimeout(() => { onClose(); setTimeout(() => onVerified(), 100) }, 100)
      } else {
        setError(true)
        setShaking(true)
        setTimeout(() => {
          setShaking(false)
          setPin(['', '', '', ''])
          inputRefs.current[0]?.focus()
        }, 500)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[360px] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 아이콘 */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#f0faf6] flex items-center justify-center">
            <i className="fa-solid fa-shield-halved text-[24px] text-[#1D9E75]" />
          </div>
        </div>

        {/* 타이틀 */}
        <h3 className="text-[16px] font-bold text-gray-800 text-center mb-1">인사통합 관리</h3>
        <p className="text-[12px] text-gray-400 text-center mb-6">최고권한자 비밀번호를 입력해주세요</p>

        {/* PIN 입력 */}
        <div
          className={`flex justify-center gap-3 mb-4 ${shaking ? 'animate-shake' : ''}`}
          onPaste={handlePaste}
        >
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-[20px] font-bold rounded-xl border-2 outline-none transition-all ${
                error
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : digit
                    ? 'border-[#1D9E75] bg-[#f0faf6] text-gray-800'
                    : 'border-gray-200 bg-gray-50 text-gray-800 focus:border-[#1D9E75] focus:bg-white'
              }`}
            />
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-[12px] text-red-500 text-center mb-4">
            <i className="fa-solid fa-circle-exclamation text-[10px] mr-1" />
            비밀번호가 일치하지 않습니다
          </p>
        )}

        {/* 버튼 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[13px] text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}
