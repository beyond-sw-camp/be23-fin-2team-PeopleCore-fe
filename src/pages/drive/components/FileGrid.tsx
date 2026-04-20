import { useState, useRef, useCallback } from 'react'
import type { DriveFile, DriveFolder, DriveDragPayload } from '../types'
import { formatBytes, formatDate, FILE_TYPE_ICONS, DRIVE_DRAG_MIME } from '../types'

interface StorageInfo {
  totalSize: number
  trashSize: number
  maxStorage: number
}

interface FileGridProps {
  folders: DriveFolder[]
  files: DriveFile[]
  starredFolders: DriveFolder[]
  starredFiles: DriveFile[]
  breadcrumb: { id: string | null; name: string; dropTargetId?: string }[]
  searchQuery: string
  isHome: boolean
  storageInfo: StorageInfo
  onSearchChange: (q: string) => void
  onOpenFolder: (folderId: string) => void
  onNavigateBreadcrumb: (folderId: string | null) => void
  onCreateFolder: () => void
  onRenameFolder: (folder: DriveFolder) => void
  onDeleteFolder: (folder: DriveFolder) => void
  onToggleFolderStar: (folderId: string) => void
  onSetPermission: (folder: DriveFolder) => void
  onUploadFiles: (files: File[]) => void
  onDeleteFile: (file: DriveFile) => void
  onDownloadFile: (file: DriveFile) => void
  onPreviewFile: (file: DriveFile) => void
  onToggleFileStar: (fileId: string) => void
  onRestoreFile?: (file: DriveFile) => void
  onRestoreFolder?: (folder: DriveFolder) => void
  onPermanentDeleteFile?: (file: DriveFile) => void
  onPermanentDeleteFolder?: (folder: DriveFolder) => void
  onEmptyTrash?: () => void
  onMoveItems?: (payload: DriveDragPayload, targetFolderId: string) => void
  isTrash?: boolean
  isShared?: boolean
  onCreateSharedFolder?: () => void
  onViewFavorites?: () => void
  recentFiles: DriveFile[]
  onViewRecent?: () => void
}

export default function FileGrid({
  folders,
  files,
  starredFolders,
  starredFiles,
  breadcrumb,
  searchQuery,
  isHome,
  storageInfo,
  onSearchChange,
  onOpenFolder,
  onNavigateBreadcrumb,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderStar,
  onSetPermission,
  onUploadFiles,
  onDeleteFile,
  onDownloadFile,
  onPreviewFile,
  onToggleFileStar,
  onRestoreFile,
  onRestoreFolder,
  onPermanentDeleteFile,
  onPermanentDeleteFolder,
  onEmptyTrash,
  onMoveItems,
  isTrash,
  isShared,
  onCreateSharedFolder,
  onViewFavorites,
  recentFiles,
  onViewRecent,
}: FileGridProps) {
  const [dragOver, setDragOver] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'folder' | 'file'; item: DriveFolder | DriveFile } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 다중 선택 (shift/ctrl/meta + 클릭으로 토글)
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  // 드롭 하이라이트용 (현재 hover 중인 폴더/브레드크럼 id)
  const [dropHoverId, setDropHoverId] = useState<string | null>(null)

  const clearSelection = useCallback(() => {
    setSelectedFolderIds(new Set())
    setSelectedFileIds(new Set())
  }, [])

  const isInternalDrag = (e: React.DragEvent) =>
    e.dataTransfer.types.includes(DRIVE_DRAG_MIME)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // 외부 파일 드래그만 업로드 오버레이 활성화 (내부 이동은 무시)
    if (!e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes(DRIVE_DRAG_MIME)) return
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes(DRIVE_DRAG_MIME)) return
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) onUploadFiles(droppedFiles)
  }, [onUploadFiles])

  // ── 내부 드래그 (폴더/파일 이동) ─────────────────────
  const buildDragPayload = (
    seedFolderId: string | null,
    seedFileId: string | null,
    sourceParentId: string | null,
  ): DriveDragPayload => {
    // 선택된 항목에 포함되어 있으면 선택 전체를, 아니면 시드만.
    const inSelectionFolder = seedFolderId !== null && selectedFolderIds.has(seedFolderId)
    const inSelectionFile = seedFileId !== null && selectedFileIds.has(seedFileId)
    const useSelection = inSelectionFolder || inSelectionFile
    const folderIds = useSelection
      ? Array.from(selectedFolderIds)
      : seedFolderId ? [seedFolderId] : []
    const fileIds = useSelection
      ? Array.from(selectedFileIds)
      : seedFileId ? [seedFileId] : []
    return { folderIds, fileIds, sourceParentId }
  }

  const handleFolderDragStart = (e: React.DragEvent, folder: DriveFolder) => {
    if (isTrash) { e.preventDefault(); return }
    const payload = buildDragPayload(folder.id, null, folder.parentId)
    e.dataTransfer.setData(DRIVE_DRAG_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleFileDragStart = (e: React.DragEvent, file: DriveFile) => {
    if (isTrash) { e.preventDefault(); return }
    const payload = buildDragPayload(null, file.id, file.folderId)
    e.dataTransfer.setData(DRIVE_DRAG_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropOnTarget = (e: React.DragEvent, targetFolderId: string) => {
    if (!isInternalDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
    setDropHoverId(null)
    const raw = e.dataTransfer.getData(DRIVE_DRAG_MIME)
    if (!raw) return
    try {
      const payload = JSON.parse(raw) as DriveDragPayload
      if (payload.folderIds.includes(targetFolderId)) return
      if (payload.sourceParentId === targetFolderId) return
      onMoveItems?.(payload, targetFolderId)
      clearSelection()
    } catch (err) {
      console.error('[FileGrid] drop payload parse 실패:', err)
    }
  }

  const handleDragOverTarget = (
    e: React.DragEvent,
    targetFolderId: string,
    sourceParentId?: string | null,
  ) => {
    if (!isInternalDrag(e)) return
    // 자기 자신/현재 부모 위로 드롭은 hover 표시 안 함 (시각 피드백 제거)
    const raw = e.dataTransfer.getData(DRIVE_DRAG_MIME) // dragover 중에는 보통 ''
    if (raw) {
      try {
        const payload = JSON.parse(raw) as DriveDragPayload
        if (payload.folderIds.includes(targetFolderId)) return
        if (payload.sourceParentId === targetFolderId) return
      } catch { /* ignore */ }
    }
    if (sourceParentId !== undefined && sourceParentId === targetFolderId) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (dropHoverId !== targetFolderId) setDropHoverId(targetFolderId)
  }

  const handleDragLeaveTarget = (targetFolderId: string) => {
    if (dropHoverId === targetFolderId) setDropHoverId(null)
  }

  const toggleFolderSelection = (folderId: string) => {
    setSelectedFileIds(new Set())
    setSelectedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFolderIds(new Set())
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) next.delete(fileId)
      else next.add(fileId)
      return next
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    if (selected.length > 0) onUploadFiles(selected)
    e.target.value = ''
  }

  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'file', item: DriveFolder | DriveFile) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type, item })
  }

  const sortedFolders = [...folders].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0))
  const { totalSize, trashSize, maxStorage } = storageInfo
  const usagePercent = Math.min((totalSize / maxStorage) * 100, 100)

  return (
    <div
      className={`flex-1 flex flex-col h-full overflow-hidden relative bg-[#f8fafb] ${dragOver ? 'ring-2 ring-[var(--primary-color)] ring-inset bg-[#f0faf6]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => setContextMenu(null)}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#f0faf6]/80 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <i className="fa-solid fa-cloud-arrow-up text-4xl text-[var(--primary-color)]" />
            <p className="text-[14px] font-medium text-[var(--primary-color)]">파일을 여기에 놓으세요</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {isHome ? (
          /* ── HOME VIEW ─────────────────────────────── */
          <div className="px-6 py-5">
            {/* Title */}
            <h2 className="text-[18px] font-bold text-gray-800 mb-5">홈</h2>

            {/* Storage summary card */}
            <div className="bg-white rounded-xl border border-sky-200 p-5 mb-6 flex gap-6">
              {/* Left: usage summary */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-cloud text-[var(--primary-color)] text-[16px]" />
                  <span className="text-[20px] font-bold text-[var(--primary-color)]">{formatBytes(totalSize)}</span>
                  <span className="text-[13px] text-gray-400">/ {formatBytes(maxStorage)}</span>
                </div>
                <p className="text-[12px] text-gray-500 mb-1">사용 중인 저장공간에 여유가 충분합니다.</p>
                <p className="text-[12px] text-gray-500 mb-3">안심하고 파일을 업로드하세요!</p>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-[var(--primary-color)] rounded-full transition-all"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                  <span>{formatBytes(totalSize)}</span>
                  <span>{formatBytes(maxStorage)}</span>
                </div>
              </div>

              {/* Right: breakdown icons */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <i className="fa-solid fa-cloud-arrow-up text-blue-500 text-[14px]" />
                  </div>
                  <span className="text-[11px] text-gray-500">업로드</span>
                  <span className="text-[13px] font-bold text-gray-800">{formatBytes(totalSize)}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <i className="fa-solid fa-trash-can text-orange-400 text-[14px]" />
                  </div>
                  <span className="text-[11px] text-gray-500">휴지통</span>
                  <span className="text-[13px] font-bold text-gray-800">{formatBytes(trashSize)}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <i className="fa-solid fa-code-branch text-purple-400 text-[14px]" />
                  </div>
                  <span className="text-[11px] text-gray-500">버전관리</span>
                  <span className="text-[13px] font-bold text-gray-800">{formatBytes(0)}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                    <i className="fa-solid fa-hard-drive text-teal-500 text-[14px]" />
                  </div>
                  <span className="text-[11px] text-gray-500">잔여용량</span>
                  <span className="text-[13px] font-bold text-gray-800">{formatBytes(maxStorage - totalSize)}</span>
                </div>
              </div>
            </div>

            {/* Starred / Important files & folders */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-gray-800">중요 파일/폴더</h3>
                {onViewFavorites && (
                  <button
                    onClick={onViewFavorites}
                    className="text-[12px] text-gray-400 hover:text-[var(--primary-color)] flex items-center gap-1"
                  >
                    더보기 <i className="fa-solid fa-chevron-right text-[9px]" />
                  </button>
                )}
              </div>
              {starredFolders.length === 0 && starredFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="fa-regular fa-star text-3xl mb-2" />
                  <p className="text-[12px]">즐겨찾기한 파일/폴더가 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {starredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[var(--primary-color)]/30 transition-all"
                      onClick={() => onOpenFolder(folder.id)}
                    >
                      <div className="flex items-start justify-between mb-8">
                        <i className="fa-solid fa-folder text-[32px] text-gray-300" />
                        <i className="fa-solid fa-star text-[14px] text-amber-400" />
                      </div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-folder text-[12px] text-gray-400" />
                        <span className="text-[13px] font-medium text-gray-800 truncate">{folder.name}</span>
                        <button className="ml-auto text-gray-300 hover:text-gray-500">
                          <i className="fa-solid fa-ellipsis-vertical text-[11px]" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">내 파일</p>
                    </div>
                  ))}
                  {starredFiles.map((file) => {
                    const typeConfig = FILE_TYPE_ICONS[file.type]
                    return (
                      <div
                        key={file.id}
                        className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[var(--primary-color)]/30 transition-all"
                        onClick={() => onPreviewFile(file)}
                      >
                        <div className="flex items-start justify-between mb-8">
                          <i className={`${typeConfig.icon} text-[32px]`} style={{ color: typeConfig.color }} />
                          <i className="fa-solid fa-star text-[14px] text-amber-400" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <i className={`${typeConfig.icon} text-[12px]`} style={{ color: typeConfig.color }} />
                          <span className="text-[13px] font-medium text-gray-800 truncate">{file.name}</span>
                          <button className="ml-auto text-gray-300 hover:text-gray-500">
                            <i className="fa-solid fa-ellipsis-vertical text-[11px]" />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400">{formatBytes(file.size)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent files */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-gray-800">최근 조회 파일</h3>
                {onViewRecent && (
                  <button
                    onClick={onViewRecent}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    <i className="fa-solid fa-rotate-right text-[12px]" />
                  </button>
                )}
              </div>
              {recentFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <i className="fa-regular fa-file text-4xl mb-3" />
                  <p className="text-[13px]">최근 조회한 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {recentFiles.map((file) => {
                    const typeConfig = FILE_TYPE_ICONS[file.type]
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => onPreviewFile(file)}
                      >
                        <i className={`${typeConfig.icon} text-[18px]`} style={{ color: typeConfig.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-800 truncate">{file.name}</p>
                          <p className="text-[11px] text-gray-400">{formatBytes(file.size)} &middot; {formatDate(file.updatedAt).split(' ')[0]}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDownloadFile(file) }}
                          className="w-7 h-7 rounded hover:bg-blue-50 flex items-center justify-center text-gray-300 hover:text-blue-500"
                        >
                          <i className="fa-solid fa-download text-[11px]" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── FOLDER / LIST VIEW ────────────────────── */
          <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-1.5 text-[13px]">
                {breadcrumb.map((item, idx) => {
                  const isLast = idx === breadcrumb.length - 1
                  const droppable = !isLast && !!item.dropTargetId && !isTrash
                  const isHover = droppable && dropHoverId === item.dropTargetId
                  return (
                    <span key={item.id ?? 'root'} className="flex items-center gap-1.5">
                      {idx > 0 && <i className="fa-solid fa-chevron-right text-[9px] text-gray-300" />}
                      <span
                        onClick={() => onNavigateBreadcrumb(item.id)}
                        onDragOver={droppable ? (e) => handleDragOverTarget(e, item.dropTargetId!) : undefined}
                        onDragLeave={droppable ? () => handleDragLeaveTarget(item.dropTargetId!) : undefined}
                        onDrop={droppable ? (e) => handleDropOnTarget(e, item.dropTargetId!) : undefined}
                        className={`cursor-pointer transition-colors px-1 rounded ${
                          isLast
                            ? 'text-gray-800 font-medium'
                            : 'text-gray-400 hover:text-[var(--primary-color)]'
                        } ${isHover ? 'bg-[#E1F5EE] text-[var(--primary-color)]' : ''}`}
                      >
                        {item.name}
                      </span>
                    </span>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="파일/폴더 검색"
                    className="w-48 border border-gray-200 rounded-lg pl-7 pr-3 py-[5px] text-[12px] focus:outline-none focus:border-[var(--primary-color)] bg-[#f9fafb]"
                  />
                </div>
                {!isTrash && !isShared && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-[5px] bg-[var(--primary-color)] text-white rounded-lg text-[12px] hover:opacity-90 transition-colors"
                    >
                      <i className="fa-solid fa-cloud-arrow-up text-[11px]" />
                      업로드
                    </button>
                    <button
                      onClick={onCreateFolder}
                      className="flex items-center gap-1.5 px-3 py-[5px] border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <i className="fa-solid fa-folder-plus text-[11px]" />
                      새 폴더
                    </button>
                  </>
                )}
                {isShared && breadcrumb.length > 1 && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-[5px] bg-[var(--primary-color)] text-white rounded-lg text-[12px] hover:opacity-90 transition-colors"
                    >
                      <i className="fa-solid fa-cloud-arrow-up text-[11px]" />
                      업로드
                    </button>
                    <button
                      onClick={onCreateSharedFolder}
                      className="flex items-center gap-1.5 px-3 py-[5px] border border-[var(--primary-color)] text-[var(--primary-color)] rounded-lg text-[12px] hover:bg-[#f0faf6] transition-colors"
                    >
                      <i className="fa-solid fa-folder-plus text-[11px]" />
                      새 폴더
                    </button>
                  </>
                )}
                {isTrash && onEmptyTrash && (
                  <button
                    onClick={onEmptyTrash}
                    className="flex items-center gap-1.5 px-3 py-[5px] bg-red-500 text-white rounded-lg text-[12px] hover:bg-red-600 transition-colors"
                  >
                    <i className="fa-solid fa-trash text-[11px]" />
                    휴지통 비우기
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {folders.length === 0 && files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <i className={`${isTrash ? 'fa-solid fa-trash-can' : isShared ? 'fa-solid fa-folder-open' : 'fa-solid fa-folder-open'} text-4xl mb-3`} />
                  <p className="text-[13px]">
                    {isTrash
                      ? '휴지통이 비어있습니다'
                      : isShared && breadcrumb.length <= 1
                        ? '왼쪽 목록에서 파일함을 선택하세요'
                        : isShared
                          ? '폴더가 없습니다'
                          : '파일이 없습니다'}
                  </p>
                  {!isTrash && (
                    <p className="text-[11px] mt-1">
                      {isShared && breadcrumb.length <= 1
                        ? '공용 파일함은 카테고리이며, 파일은 하위 파일함 안에서 관리합니다'
                        : isShared
                          ? '새 폴더를 만들어 팀원과 파일을 공유하세요'
                          : '파일을 업로드하거나 새 폴더를 만들어보세요'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Folders */}
                  {sortedFolders.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[12px] text-gray-400 font-medium mb-3">폴더</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {sortedFolders.map((folder) => {
                          const isSelected = selectedFolderIds.has(folder.id)
                          const isDropHover = dropHoverId === folder.id
                          return (
                            <div
                              key={folder.id}
                              draggable={!isTrash}
                              onDragStart={(e) => handleFolderDragStart(e, folder)}
                              onDragOver={!isTrash ? (e) => handleDragOverTarget(e, folder.id) : undefined}
                              onDragLeave={!isTrash ? () => handleDragLeaveTarget(folder.id) : undefined}
                              onDrop={!isTrash ? (e) => handleDropOnTarget(e, folder.id) : undefined}
                              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all group ${
                                isDropHover
                                  ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/40 bg-[#f0faf6]'
                                  : isSelected
                                    ? 'border-[var(--primary-color)] bg-[#E1F5EE]/40'
                                    : 'border-gray-100 hover:border-[var(--primary-color)]/30'
                              }`}
                              onClick={(e) => {
                                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                  e.stopPropagation()
                                  toggleFolderSelection(folder.id)
                                  return
                                }
                                if (isTrash) return
                                clearSelection()
                                onOpenFolder(folder.id)
                              }}
                              onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="relative">
                                  <i className="fa-solid fa-folder text-[28px] text-amber-400" />
                                  {folder.scope === 'shared' && (
                                    <i className="fa-solid fa-users text-[8px] text-white absolute -bottom-0.5 -right-1 bg-[var(--primary-color)] rounded-full p-[3px]" />
                                  )}
                                </div>
                                {folder.starred && <i className="fa-solid fa-star text-[11px] text-amber-400" />}
                              </div>
                              <p className="text-[13px] font-medium text-gray-800 truncate">{folder.name}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{folder.createdBy}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {files.length > 0 && (
                    <div>
                      <h4 className="text-[12px] text-gray-400 font-medium mb-3">파일</h4>
                      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-[1fr_100px_100px_120px_60px] px-4 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100">
                          <span>이름</span>
                          <span>크기</span>
                          <span>작성자</span>
                          <span>수정일</span>
                          <span className="text-center">작업</span>
                        </div>
                        {files.map((file) => {
                          const typeConfig = FILE_TYPE_ICONS[file.type]
                          const isSelected = selectedFileIds.has(file.id)
                          return (
                            <div
                              key={file.id}
                              draggable={!isTrash}
                              onDragStart={(e) => handleFileDragStart(e, file)}
                              className={`grid grid-cols-[1fr_100px_100px_120px_60px] px-4 py-2.5 text-[12px] border-b border-gray-50 last:border-0 cursor-pointer items-center group ${
                                isSelected ? 'bg-[#E1F5EE]/40' : 'hover:bg-gray-50'
                              }`}
                              onClick={(e) => {
                                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                  e.stopPropagation()
                                  toggleFileSelection(file.id)
                                  return
                                }
                                clearSelection()
                                onPreviewFile(file)
                              }}
                              onContextMenu={(e) => handleContextMenu(e, 'file', file)}
                            >
                              <span className="flex items-center gap-2.5 min-w-0">
                                <i className={`${typeConfig.icon} text-[16px]`} style={{ color: typeConfig.color }} />
                                <span className="truncate text-gray-800">{file.name}</span>
                                {file.starred && <i className="fa-solid fa-star text-[9px] text-amber-400 shrink-0" />}
                              </span>
                              <span className="text-gray-500">{formatBytes(file.size)}</span>
                              <span className="text-gray-500">{file.createdBy}</span>
                              <span className="text-gray-400">{formatDate(file.updatedAt).split(' ')[0]}</span>
                              <span className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isTrash ? (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onRestoreFile?.(file) }}
                                      className="w-6 h-6 rounded hover:bg-green-50 flex items-center justify-center text-green-500"
                                      title="복원"
                                    >
                                      <i className="fa-solid fa-rotate-left text-[11px]" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onPermanentDeleteFile?.(file) }}
                                      className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-red-500"
                                      title="영구 삭제"
                                    >
                                      <i className="fa-solid fa-trash-can text-[11px]" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onDownloadFile(file) }}
                                      className="w-6 h-6 rounded hover:bg-blue-50 flex items-center justify-center text-blue-500"
                                      title="다운로드"
                                    >
                                      <i className="fa-solid fa-download text-[11px]" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onDeleteFile(file) }}
                                      className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-red-400"
                                      title="삭제"
                                    >
                                      <i className="fa-solid fa-trash text-[11px]" />
                                    </button>
                                  </>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' ? (
            isTrash ? (
              <>
                <CtxItem icon="fa-solid fa-rotate-left" label="복원" onClick={() => { onRestoreFolder?.(contextMenu.item as DriveFolder); setContextMenu(null) }} />
                <CtxItem icon="fa-solid fa-trash-can" label="영구 삭제" danger onClick={() => { onPermanentDeleteFolder?.(contextMenu.item as DriveFolder); setContextMenu(null) }} />
              </>
            ) : (
              <>
                <CtxItem icon="fa-solid fa-folder-open" label="열기" onClick={() => { onOpenFolder((contextMenu.item as DriveFolder).id); setContextMenu(null) }} />
                <CtxItem icon="fa-solid fa-pen" label="이름 변경" onClick={() => { onRenameFolder(contextMenu.item as DriveFolder); setContextMenu(null) }} />
                <CtxItem
                  icon={`fa-${(contextMenu.item as DriveFolder).starred ? 'solid' : 'regular'} fa-star`}
                  label={(contextMenu.item as DriveFolder).starred ? '즐겨찾기 해제' : '즐겨찾기'}
                  onClick={() => { onToggleFolderStar((contextMenu.item as DriveFolder).id); setContextMenu(null) }}
                />
                <CtxItem icon="fa-solid fa-shield-halved" label="권한 설정" onClick={() => { onSetPermission(contextMenu.item as DriveFolder); setContextMenu(null) }} />
                <div className="border-t border-gray-100 my-1" />
                <CtxItem icon="fa-solid fa-trash" label="삭제" danger onClick={() => { onDeleteFolder(contextMenu.item as DriveFolder); setContextMenu(null) }} />
              </>
            )
          ) : (
            isTrash ? (
              <>
                <CtxItem icon="fa-solid fa-rotate-left" label="복원" onClick={() => { onRestoreFile?.(contextMenu.item as DriveFile); setContextMenu(null) }} />
                <CtxItem icon="fa-solid fa-trash-can" label="영구 삭제" danger onClick={() => { onPermanentDeleteFile?.(contextMenu.item as DriveFile); setContextMenu(null) }} />
              </>
            ) : (
              <>
                <CtxItem icon="fa-solid fa-eye" label="미리보기" onClick={() => { onPreviewFile(contextMenu.item as DriveFile); setContextMenu(null) }} />
                <CtxItem icon="fa-solid fa-download" label="다운로드" onClick={() => { onDownloadFile(contextMenu.item as DriveFile); setContextMenu(null) }} />
                <CtxItem
                  icon={`fa-${(contextMenu.item as DriveFile).starred ? 'solid' : 'regular'} fa-star`}
                  label={(contextMenu.item as DriveFile).starred ? '즐겨찾기 해제' : '즐겨찾기'}
                  onClick={() => { onToggleFileStar((contextMenu.item as DriveFile).id); setContextMenu(null) }}
                />
                <div className="border-t border-gray-100 my-1" />
                <CtxItem icon="fa-solid fa-trash" label="삭제" danger onClick={() => { onDeleteFile(contextMenu.item as DriveFile); setContextMenu(null) }} />
              </>
            )
          )}
        </div>
      )}
    </div>
  )
}

function CtxItem({ icon, label, danger, onClick }: { icon: string; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2 cursor-pointer text-[12px] transition-colors ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <i className={`${icon} text-[11px] w-4 text-center`} />
      <span>{label}</span>
    </div>
  )
}
