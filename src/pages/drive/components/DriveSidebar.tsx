import { useState, useRef, useEffect } from 'react'
import type { DriveView, DriveFile, FileBox, DriveDragPayload } from '../types'
import { formatBytes, DRIVE_DRAG_MIME } from '../types'

interface DriveSidebarProps {
  currentView: DriveView
  onChangeView: (view: DriveView) => void
  files: DriveFile[]
  fileBoxes: FileBox[]
  currentFileBoxId: string | null
  onOpenFileBox: (fileBoxId: string) => void
  onCreateFileBox: () => void
  onEditFileBox: (fileBox: FileBox) => void
  onDeleteFileBox: (fileBox: FileBox) => void
  onMoveItems?: (payload: DriveDragPayload, targetFolderId: string) => void
  canCreateFileBox?: boolean
  canManageFileBox?: boolean
}

const MAIN_NAV: { view: DriveView; label: string }[] = [
  { view: 'home', label: '파일함 홈' },
  { view: 'favorites', label: '즐겨찾기' },
]

const UTIL_NAV: { view: DriveView; label: string }[] = [
  { view: 'trash', label: '휴지통' },
]

export default function DriveSidebar({ currentView, onChangeView, files, fileBoxes, currentFileBoxId, onOpenFileBox, onCreateFileBox, onEditFileBox, onDeleteFileBox, onMoveItems, canCreateFileBox = false, canManageFileBox = false }: DriveSidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [dropHoverBoxId, setDropHoverBoxId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const activeFiles = files.filter((f) => !f.deleted)
  const totalSize = activeFiles.reduce((sum, f) => sum + f.size, 0)
  const trashSize = files.filter((f) => f.deleted).reduce((sum, f) => sum + f.size, 0)
  const maxStorage = 5 * 1024 * 1024 * 1024 // 5GB

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    if (menuOpenId) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

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
        {/* 내 파일 */}
        <div
          onClick={() => onChangeView('my-drive')}
          className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
            currentView === 'my-drive'
              ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
              : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
          }`}
        >
          내 파일
        </div>
        {/* 공용 파일함 (카테고리 헤더 — 선택 불가, 하위 전사/부서 파일함만 진입점) */}
        <div className="group/shared flex items-center justify-between py-1.5 px-2 text-[12px] rounded transition-colors text-[#6b7280]">
          <span className="flex-1 font-medium select-none">공용 파일함</span>
          {canCreateFileBox && (
            <button
              onClick={(e) => { e.stopPropagation(); onCreateFileBox() }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-[#1D9E75] hover:bg-[#E1F5EE] opacity-0 group-hover/shared:opacity-100 transition-opacity"
              title="새 파일함 만들기"
            >
              <i className="fa-solid fa-plus text-[10px]" />
            </button>
          )}
        </div>
        {/* 파일함 하위 목록 */}
        {fileBoxes.map((box) => {
          const droppable = !box.isSystemDefault && !!onMoveItems
          const isDropHover = droppable && dropHoverBoxId === box.id
          const handleBoxDragOver = (e: React.DragEvent) => {
            if (!droppable) return
            if (!e.dataTransfer.types.includes(DRIVE_DRAG_MIME)) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            if (dropHoverBoxId !== box.id) setDropHoverBoxId(box.id)
          }
          const handleBoxDragLeave = () => {
            if (dropHoverBoxId === box.id) setDropHoverBoxId(null)
          }
          const handleBoxDrop = (e: React.DragEvent) => {
            if (!droppable) return
            if (!e.dataTransfer.types.includes(DRIVE_DRAG_MIME)) return
            e.preventDefault()
            setDropHoverBoxId(null)
            const raw = e.dataTransfer.getData(DRIVE_DRAG_MIME)
            if (!raw) return
            try {
              const payload = JSON.parse(raw) as DriveDragPayload
              if (payload.folderIds.includes(box.id)) return
              if (payload.sourceParentId === box.id) return
              onMoveItems!(payload, box.id)
            } catch (err) {
              console.error('[DriveSidebar] drop payload parse 실패:', err)
            }
          }
          return (
          <div
            key={box.id}
            onDragOver={droppable ? handleBoxDragOver : undefined}
            onDragLeave={droppable ? handleBoxDragLeave : undefined}
            onDrop={droppable ? handleBoxDrop : undefined}
            className={`group/box relative flex items-center justify-between py-1.5 pl-5 pr-1 text-[12px] cursor-pointer rounded transition-colors ${
              isDropHover
                ? 'text-[#1D9E75] font-medium bg-[#E1F5EE] ring-2 ring-[#1D9E75]/40'
                : currentView === 'shared' && currentFileBoxId === box.id
                  ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                  : 'text-gray-500 hover:text-[#000000] hover:bg-[#E1F5EE]'
            }`}
            onClick={() => onOpenFileBox(box.id)}
          >
            <span className="truncate flex-1 flex items-center gap-1">
              {box.name}
              {box.isSystemDefault && (
                <i className="fa-solid fa-lock text-[9px] text-gray-300" title="시스템 기본 파일함" />
              )}
            </span>
            {canManageFileBox && !box.isSystemDefault && (
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === box.id ? null : box.id) }}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover/box:opacity-100 transition-opacity shrink-0"
                title="더보기"
              >
                <i className="fa-solid fa-ellipsis text-[10px]" />
              </button>
            )}
            {canManageFileBox && !box.isSystemDefault && menuOpenId === box.id && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                  onClick={() => { setMenuOpenId(null); onEditFileBox(box) }}
                >
                  <i className="fa-solid fa-pen text-[10px] text-gray-400 w-3.5 text-center" />
                  <span>수정</span>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50 cursor-pointer"
                  onClick={() => { setMenuOpenId(null); onDeleteFileBox(box) }}
                >
                  <i className="fa-solid fa-trash text-[10px] w-3.5 text-center" />
                  <span>삭제</span>
                </div>
              </div>
            )}
          </div>
          )
        })}
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
