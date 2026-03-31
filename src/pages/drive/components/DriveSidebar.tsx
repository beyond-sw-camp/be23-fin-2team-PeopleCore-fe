import type { DriveView, DriveFile } from '../types'
import { formatBytes } from '../types'

interface DriveSidebarProps {
  currentView: DriveView
  onChangeView: (view: DriveView) => void
  files: DriveFile[]
}

const MAIN_NAV: { view: DriveView; label: string }[] = [
  { view: 'home', label: '파일함 홈' },
  { view: 'favorites', label: '즐겨찾기' },
]

const FILE_NAV: { view: DriveView; label: string }[] = [
  { view: 'my-drive', label: '내 파일' },
  { view: 'shared', label: '공용 파일함' },
]

const UTIL_NAV: { view: DriveView; label: string }[] = [
  { view: 'trash', label: '휴지통' },
]

export default function DriveSidebar({ currentView, onChangeView, files }: DriveSidebarProps) {
  const activeFiles = files.filter((f) => !f.deleted)
  const totalSize = activeFiles.reduce((sum, f) => sum + f.size, 0)
  const trashSize = files.filter((f) => f.deleted).reduce((sum, f) => sum + f.size, 0)
  const maxStorage = 5 * 1024 * 1024 * 1024 // 5GB

  return (
    <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 h-full overflow-y-auto">
      {/* Title */}
      <div className="p-4 border-b border-[#d1d5db]">
        <h2 className="text-[15px] font-bold text-[#000000]">파일함</h2>
      </div>

      {/* 메인 */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-[12px] font-semibold text-[#000000] mb-1 block">메인</span>
        {MAIN_NAV.map((item) => (
          <div
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
              currentView === item.view
                ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* 파일 관리 */}
      <div className="px-4 pt-3 pb-2">
        <span className="text-[12px] font-semibold text-[#000000] mb-1 block">파일 관리</span>
        {FILE_NAV.map((item) => (
          <div
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
              currentView === item.view
                ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* 기타 */}
      <div className="px-4 pt-3 pb-2">
        <span className="text-[12px] font-semibold text-[#000000] mb-1 block">기타</span>
        {UTIL_NAV.map((item) => (
          <div
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
              currentView === item.view
                ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Storage Usage */}
      <div className="px-4 pt-3 pb-4 mt-auto">
        <span className="text-[12px] font-semibold text-[#000000] mb-2 block">저장 공간</span>
        <div className="mb-1.5">
          <span className="text-[13px] font-bold text-[#1D9E75]">{formatBytes(totalSize)}</span>
          <span className="text-[11px] text-gray-400"> / {formatBytes(maxStorage)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all"
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
