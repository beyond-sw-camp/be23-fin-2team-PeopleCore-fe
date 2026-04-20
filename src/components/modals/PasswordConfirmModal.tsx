import { useState, useEffect, useRef } from 'react'
import { authApi } from '../../api/auth'

interface Props {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

// 민감 액션(단계 개폐, 기간 추가 등) 전 현재 유저 비밀번호 재확인용 모달
export default function PasswordConfirmModal({
  open,
  title = '본인 확인',
  description = '이 작업을 진행하려면 비밀번호를 입력하세요.',
  confirmLabel = '확인',
  onConfirm,
  onClose,
}: Props) {
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPassword('')
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    if (!password) {
      setError('비밀번호를 입력하세요.')
      return
    }
    setVerifying(true)
    setError(null)
    try {
      const { data } = await authApi.verifyPassword(password)
      if (!data.valid) {
        setError('비밀번호가 일치하지 않습니다.')
        return
      }
      await onConfirm()
      onClose()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err?.response?.data?.message ?? err?.message ?? '확인에 실패했습니다.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl">
        <div className="text-center mb-4">
          <div className="text-[32px] mb-2">🔐</div>
          <h3 className="text-[17px] font-semibold text-[#1a2b23] mb-1">{title}</h3>
          <p className="text-[12px] text-[#8a9490]">{description}</p>
        </div>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="비밀번호"
          disabled={verifying}
          className="w-full border border-[#e0e5e3] rounded-lg px-3 py-2.5 text-[13px] mb-2 disabled:bg-gray-50"
        />
        {error && <p className="text-[12px] text-[#ef4444] mb-2">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            disabled={verifying}
            className="flex-1 border border-[#e0e5e3] bg-white rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50"
          >취소</button>
          <button
            onClick={handleSubmit}
            disabled={verifying}
            className="flex-1 bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] disabled:opacity-50"
          >{verifying ? '확인 중...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
