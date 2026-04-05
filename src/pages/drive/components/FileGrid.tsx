import { useState, useRef, useCallback } from 'react'
import type { DriveFile, DriveFolder } from '../types'
import { formatBytes, formatDate, FILE_TYPE_ICONS, FILE_ACCEPT_TYPES } from '../types'

interface StorageInfo {
  totalSize: number
  trashSize: number
  maxStorage: number
}

interface FileGridProps {
  folders: DriveFolder[]
  files: DriveFile[]
  starredFolders: DriveFolder[]
  breadcrumb: { id: string | null; name: string }[]
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    const validExts = ['hwp', 'doc', 'docx', 'xls', 'xlsx', 'pdf']
    const validFiles = droppedFiles.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || ''
      return validExts.includes(ext)
    })
    if (validFiles.length > 0) onUploadFiles(validFiles)
    if (validFiles.length < droppedFiles.length) {
      alert(`${droppedFiles.length - validFiles.length}개 파일이 지원하지 않는 형식이어서 제외되었습니다.\n(지원 형식: hwp, doc, docx, xls, xlsx, pdf)`)
    }
  }, [onUploadFiles])

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
            <p className="text-[11px] text-gray-400">hwp, doc, docx, xls, xlsx, pdf</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_ACCEPT_TYPES}
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
              {starredFolders.length === 0 ? (
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
                {breadcrumb.map((item, idx) => (
                  <span key={item.id ?? 'root'} className="flex items-center gap-1.5">
                    {idx > 0 && <i className="fa-solid fa-chevron-right text-[9px] text-gray-300" />}
                    <span
                      onClick={() => onNavigateBreadcrumb(item.id)}
                      className={`cursor-pointer transition-colors ${
                        idx === breadcrumb.length - 1
                          ? 'text-gray-800 font-medium'
                          : 'text-gray-400 hover:text-[var(--primary-color)]'
                      }`}
                    >
                      {item.name}
                    </span>
                  </span>
                ))}
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
                {isShared && (
                  <>
                    {breadcrumb.length > 1 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-[5px] bg-[var(--primary-color)] text-white rounded-lg text-[12px] hover:opacity-90 transition-colors"
                      >
                        <i className="fa-solid fa-cloud-arrow-up text-[11px]" />
                        업로드
                      </button>
                    )}
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
                  <p className="text-[13px]">{isTrash ? '휴지통이 비어있습니다' : isShared ? '폴더가 없습니다' : '파일이 없습니다'}</p>
                  {!isTrash && (
                    <p className="text-[11px] mt-1">{isShared ? '새 폴더를 만들어 팀원과 파일을 공유하세요' : '파일을 업로드하거나 새 폴더를 만들어보세요'}</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Folders */}
                  {sortedFolders.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[12px] text-gray-400 font-medium mb-3">폴더</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {sortedFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[var(--primary-color)]/30 transition-all group"
                            onClick={() => !isTrash && onOpenFolder(folder.id)}
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
                        ))}
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
                          return (
                            <div
                              key={file.id}
                              className="grid grid-cols-[1fr_100px_100px_120px_60px] px-4 py-2.5 text-[12px] border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer items-center group"
                              onClick={() => onPreviewFile(file)}
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
