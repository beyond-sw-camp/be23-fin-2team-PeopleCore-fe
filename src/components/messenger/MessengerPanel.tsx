import { useState, useRef, useCallback, useEffect } from 'react'
import MessengerPage from '../../pages/messenger/MessengerPage'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialUserId?: string | null
  initialUserName?: string | null
}

const MIN_W = 420
const MIN_H = 380
const DEFAULT_W = 820
const DEFAULT_H = 560

export default function MessengerPanel({ isOpen, onClose, initialUserId, initialUserName }: Props) {
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [initialized, setInitialized] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  // Center on first open
  useEffect(() => {
    if (isOpen && !initialized) {
      setPos({
        x: Math.max(0, (window.innerWidth - DEFAULT_W) / 2),
        y: Math.max(0, (window.innerHeight - DEFAULT_H) / 2 - 20),
      })
      setInitialized(true)
      setMinimized(false)
    }
  }, [isOpen, initialized])

  // Reset initialized when closed so next open re-centers
  useEffect(() => {
    if (!isOpen) setInitialized(false)
  }, [isOpen])

  // ── Drag ────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 40, dragRef.current.origY + dy)),
      })
    }
    const handleUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [pos])

  // ── Resize ──────────────────────────────────────────
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h }

    const handleMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const dx = ev.clientX - resizeRef.current.startX
      const dy = ev.clientY - resizeRef.current.startY
      setSize({
        w: Math.max(MIN_W, resizeRef.current.origW + dx),
        h: Math.max(MIN_H, resizeRef.current.origH + dy),
      })
    }
    const handleUp = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [size])

  if (!isOpen) return null

  // ── Minimized bar ──
  if (minimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[90] bg-[#1D9E75] text-white rounded-xl shadow-lg flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:opacity-95 transition-opacity select-none"
        onClick={() => setMinimized(false)}
      >
        <i className="fa-regular fa-comment-dots text-[16px]" />
        <span className="text-[13px] font-medium">메신저</span>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="ml-2 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
        >
          <i className="fa-solid fa-xmark text-[10px]" />
        </button>
      </div>
    )
  }

  // ── Full panel ──
  return (
    <div
      ref={panelRef}
      className="fixed z-[90] flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
      }}
    >
      {/* Title bar (draggable) */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-[#1D9E75] text-white shrink-0 cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <i className="fa-regular fa-comment-dots text-[14px]" />
          <span className="text-[13px] font-semibold">메신저</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center transition-colors"
            title="최소화"
          >
            <i className="fa-solid fa-minus text-[10px]" />
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center transition-colors"
            title="닫기"
          >
            <i className="fa-solid fa-xmark text-[11px]" />
          </button>
        </div>
      </div>

      {/* Messenger content */}
      <div className="flex-1 overflow-hidden">
        <MessengerPage
          embedded
          initialUserId={initialUserId}
          initialUserName={initialUserName}
        />
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeStart}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-300">
          <path d="M14 14L14 8M14 14L8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 14L14 11M14 14L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
