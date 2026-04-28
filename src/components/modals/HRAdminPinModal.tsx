import { useEffect, useRef, useState } from 'react'
import { hrAdminPinApi } from '../../api/hrAdminPin'
import { useHrAdminSession } from '../../contexts/HrAdminSessionContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
}

type Mode = 'loading' | 'verify' | 'setup-password' | 'setup-pin' | 'setup-confirm'

export default function HRAdminPinModal({ isOpen, onClose, onVerified }: Props) {
  const { startSession } = useHrAdminSession()
  const [mode, setMode] = useState<Mode>('loading')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([])
  const pwdRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setPassword('')
    setPin(['', '', '', ''])
    setConfirmPin(['', '', '', ''])
    setError(null)
    setShaking(false)
    setSubmitting(false)
    setMode('loading')

    hrAdminPinApi.status()
      .then(({ data }) => {
        setMode(data.hasPin ? 'verify' : 'setup-password')
      })
      .catch(() => {
        setMode('verify') // fallback
      })
  }, [isOpen])

  useEffect(() => {
    if (mode === 'verify') setTimeout(() => pinRefs.current[0]?.focus(), 100)
    if (mode === 'setup-password') setTimeout(() => pwdRef.current?.focus(), 100)
    if (mode === 'setup-pin') setTimeout(() => pinRefs.current[0]?.focus(), 100)
    if (mode === 'setup-confirm') setTimeout(() => confirmRefs.current[0]?.focus(), 100)
  }, [mode])

  if (!isOpen) return null

  const shake = (msg: string, onShakeEnd?: () => void) => {
    setError(msg)
    setShaking(true)
    setTimeout(() => {
      setShaking(false)
      onShakeEnd?.()
    }, 500)
  }

  const onDigitChange = (
    arr: string[],
    setArr: (a: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    idx: number,
    value: string,
    onComplete: (full: string) => void,
  ) => {
    if (!/^\d*$/.test(value)) return
    const next = [...arr]
    next[idx] = value.slice(-1)
    setArr(next)
    setError(null)
    if (value && idx < 3) refs.current[idx + 1]?.focus()
    if (idx === 3 && value) {
      const full = next.join('')
      if (full.length === 4) onComplete(full)
    }
  }

  const onDigitKeyDown = (
    arr: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    idx: number,
    e: React.KeyboardEvent,
  ) => {
    if (e.key === 'Backspace' && !arr[idx] && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'Escape') onClose()
  }

  const handleVerify = async (fullPin: string) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const { data } = await hrAdminPinApi.verify(fullPin)
      startSession(data.hrAdminToken, data.expiresInSeconds)
      onClose()
      setTimeout(() => onVerified(), 100)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const code = e?.response?.data?.code
      const msg = code === 'HR_ADMIN_PIN_MISMATCH'
        ? 'PIN이 일치하지 않습니다'
        : e?.response?.data?.message || '인증에 실패했습니다'
      shake(msg, () => { setPin(['', '', '', '']); pinRefs.current[0]?.focus() })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = () => {
    if (!password) {
      setError('비밀번호를 입력해주세요')
      return
    }
    setError(null)
    setMode('setup-pin')
  }

  const handleSetupPinComplete = (fullPin: string) => {
    void fullPin
    setMode('setup-confirm')
  }

  const handleConfirmComplete = async (fullConfirm: string) => {
    const first = pin.join('')
    if (first !== fullConfirm) {
      shake('PIN이 일치하지 않습니다', () => {
        setPin(['', '', '', ''])
        setConfirmPin(['', '', '', ''])
        setMode('setup-pin')
      })
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      await hrAdminPinApi.set(password, first)
      // 설정 후 곧바로 verify로 전환해 로그인 비밀번호 재입력 없이 스코프 토큰 발급
      const { data } = await hrAdminPinApi.verify(first)
      startSession(data.hrAdminToken, data.expiresInSeconds)
      onClose()
      setTimeout(() => onVerified(), 100)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const code = e?.response?.data?.code
      const msg = code === 'INVALID_CREDENTIALS'
        ? '비밀번호가 일치하지 않습니다'
        : e?.response?.data?.message || '설정에 실패했습니다'
      shake(msg, () => {
        setPin(['', '', '', ''])
        setConfirmPin(['', '', '', ''])
        setMode('setup-password')
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderPinRow = (
    arr: string[],
    setArr: (a: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (full: string) => void,
  ) => (
    <div className={`flex justify-center gap-3 mb-4 ${shaking ? 'animate-shake' : ''}`}>
      {arr.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onDigitChange(arr, setArr, refs, i, e.target.value, onComplete)}
          onKeyDown={(e) => onDigitKeyDown(arr, refs, i, e)}
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
  )

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[min(380px,calc(100vw-24px))] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#f0faf6] flex items-center justify-center">
            <i className="fa-solid fa-shield-halved text-[24px] text-[#1D9E75]" />
          </div>
        </div>

        <h3 className="text-[16px] font-bold text-gray-800 text-center mb-1">인사통합 관리</h3>

        {mode === 'loading' && (
          <p className="text-[12px] text-gray-400 text-center py-8">확인 중…</p>
        )}

        {mode === 'verify' && (
          <>
            <p className="text-[12px] text-gray-400 text-center mb-6">PIN 4자리를 입력해주세요</p>
            {renderPinRow(pin, setPin, pinRefs, handleVerify)}
          </>
        )}

        {mode === 'setup-password' && (
          <>
            <div className="text-center mb-5">
              <p className="text-[12px] text-amber-600 mb-1">
                <i className="fa-solid fa-circle-info mr-1" />
                PIN이 설정되지 않았습니다
              </p>
              <p className="text-[12px] text-gray-400">로그인 비밀번호로 본인 확인 후 PIN을 설정해주세요</p>
            </div>
            <input
              ref={pwdRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit() }}
              placeholder="로그인 비밀번호"
              className="w-full h-11 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-[13px] outline-none focus:border-[#1D9E75] focus:bg-white mb-3"
            />
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-2.5 text-[13px] text-white bg-[#1D9E75] rounded-xl hover:bg-[#167d5d] transition-colors mb-2"
            >
              다음
            </button>
          </>
        )}

        {mode === 'setup-pin' && (
          <>
            <p className="text-[12px] text-gray-400 text-center mb-6">사용할 PIN 4자리를 입력해주세요</p>
            {renderPinRow(pin, setPin, pinRefs, handleSetupPinComplete)}
          </>
        )}

        {mode === 'setup-confirm' && (
          <>
            <p className="text-[12px] text-gray-400 text-center mb-6">PIN을 한 번 더 입력해주세요</p>
            {renderPinRow(confirmPin, setConfirmPin, confirmRefs, handleConfirmComplete)}
          </>
        )}

        {error && (
          <p className="text-[12px] text-red-500 text-center mb-4">
            <i className="fa-solid fa-circle-exclamation text-[10px] mr-1" />
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 text-[13px] text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
