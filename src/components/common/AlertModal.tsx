import { useEffect } from 'react'

interface AlertModalProps {
  isOpen: boolean
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose: () => void
}

const ICON_MAP = {
  success: { icon: 'fa-solid fa-circle-check', color: 'text-[#1D9E75]', bg: 'bg-[#E1F5EE]' },
  error: { icon: 'fa-solid fa-circle-xmark', color: 'text-red-500', bg: 'bg-red-50' },
  warning: { icon: 'fa-solid fa-triangle-exclamation', color: 'text-amber-500', bg: 'bg-amber-50' },
  info: { icon: 'fa-solid fa-circle-info', color: 'text-blue-500', bg: 'bg-blue-50' },
}

export default function AlertModal({ isOpen, type = 'info', title, message, onClose }: AlertModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const { icon, color, bg } = ICON_MAP[type]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[340px] p-6 flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center mb-4`}>
          <i className={`${icon} text-2xl ${color}`} />
        </div>
        {title && <h3 className="text-[15px] font-bold text-gray-800 mb-1">{title}</h3>}
        <p className="text-[13px] text-gray-500 whitespace-pre-line leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 px-8 py-2 text-[13px] font-medium text-white bg-[#1D9E75] rounded-lg hover:opacity-90 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  )
}
