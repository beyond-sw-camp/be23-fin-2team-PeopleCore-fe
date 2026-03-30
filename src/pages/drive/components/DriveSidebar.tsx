import type { DriveView, DriveFile } from '../types'
import { formatBytes } from '../types'

interface DriveSidebarProps {
  currentView: DriveView
  onChangeView: (view: DriveView) => void
  files: DriveFile[]
}

const NAV_ITEMS: { view: DriveView; label: string }[] = [
  { view: 'home', label: '파일함 홈' },
  { view: 'favorites', label: '즐겨찾기' },
  { view: 'my-drive', label: '내 파일' },
  { view: 'trash', label: '휴지통' },
]

export default function DriveSidebar({ currentView, onChangeView, files }: DriveSidebarProps) {
  const activeFiles = files.filter((f) => !f.deleted)
  const totalSize = activeFiles.reduce((sum, f) => sum + f.size, 0)
  const trashSize = files.filter((f) => f.deleted).reduce((sum, f) => sum + f.size, 0)
  const maxStorage = 5 * 1024 * 1024 * 1024 // 5GB

  return (
    <div className="w-[200px] bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
      {/* Title */}
      <div className="px-5 pt-5 pb-5 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-gray-800">파일함</h2>
        <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
          <i className="fa-solid fa-ellipsis-vertical text-[12px]" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`px-3 py-2.5 rounded-lg cursor-pointer text-[14px] transition-colors ${
              currentView === item.view
                ? 'text-[var(--primary-color)] font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 border-t border-gray-200" />

      {/* Storage Usage */}
      <div className="px-4 pb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] text-gray-500">서비스 총 사용량</span>
        </div>
        <div className="mb-2.5">
          <span className="text-[16px] font-bold text-[var(--primary-color)]">{formatBytes(totalSize)}</span>
          <span className="text-[11px] text-gray-400"> / {formatBytes(maxStorage)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3.5">
          <div
            className="h-full bg-[var(--primary-color)] rounded-full transition-all"
            style={{ width: `${Math.min((totalSize / maxStorage) * 100, 100)}%` }}
          />
        </div>

        {/* Breakdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-500">업로드</span>
            </span>
            <span className="text-gray-700">{formatBytes(totalSize)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-500">휴지통</span>
            </span>
            <span className="text-gray-700">{formatBytes(trashSize)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-gray-500">버전관리</span>
            </span>
            <span className="text-gray-700">{formatBytes(0)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-500">잔여용량</span>
            </span>
            <span className="text-gray-700">{formatBytes(maxStorage - totalSize)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
