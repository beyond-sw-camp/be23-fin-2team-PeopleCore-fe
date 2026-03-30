interface MenuSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  menuVisibility: Record<string, boolean>
  onToggle: (key: string) => void
}

const MENU_ITEMS = [
  { key: 'dashboard', label: '대시보드', locked: true },
  { key: 'board', label: '게시판', locked: false },
  { key: 'approval', label: '전자결재', locked: false },
  { key: 'attendance', label: '근태', locked: false },
  { key: 'performance', label: '성과', locked: false },
  { key: 'salary', label: '급여', locked: false },
  { key: 'mail', label: '메일', locked: false },
  { key: 'org', label: '조직도', locked: false },
]

export default function MenuSettingsModal({ isOpen, onClose, menuVisibility, onToggle }: MenuSettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[360px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-base">메뉴 표시 설정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">사이드바에 표시할 메뉴를 선택하세요.</p>
        <div className="space-y-3">
          {MENU_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{item.label}</span>
              <div
                className={`toggle-switch ${menuVisibility[item.key] ? 'on' : ''}`}
                style={item.locked ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
                onClick={() => !item.locked && onToggle(item.key)}
              />
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-[#1D9E75] text-white text-sm font-medium rounded-lg hover:bg-[#0F6E56] transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  )
}
