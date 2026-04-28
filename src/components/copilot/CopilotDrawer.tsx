import { useEffect } from 'react'
import CopilotPanel from './CopilotPanel'

interface Props {
  open: boolean
  onClose: () => void
}

/** 우측 슬라이드 drawer. ESC 또는 backdrop 클릭으로 닫힘. */
export default function CopilotDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-150" onClick={onClose} />
      {/* panel */}
      <div className="absolute top-0 right-0 h-full w-[420px] max-w-[90vw] shadow-2xl animate-in slide-in-from-right duration-200">
        <CopilotPanel className="h-full" onClose={onClose} />
      </div>
    </div>
  )
}
