import { useState, useCallback } from 'react'
import type { DriveFile, DriveFolder, DriveView, PermissionLevel, PermissionTarget, ActivityItem, FileBox } from './types'
import { getFileType } from './types'
import { mockFolders, mockFiles, mockActivities, mockFileBoxes } from './mockData'
import DriveSidebar from './components/DriveSidebar'
import FileGrid from './components/FileGrid'
import ActivityLog from './components/ActivityLog'
import { FolderModal, PermissionModal, FilePreviewModal, ConfirmModal, SharedFolderModal, FileBoxModal } from './components/DriveModals'

type ModalState =
  | { type: 'none' }
  | { type: 'create-folder' }
  | { type: 'rename-folder'; folder: DriveFolder }
  | { type: 'permission'; folder: DriveFolder }
  | { type: 'preview'; file: DriveFile }
  | { type: 'create-shared-folder' }
  | { type: 'create-filebox' }
  | { type: 'edit-filebox'; fileBox: FileBox }
  | { type: 'confirm'; title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }

const MAX_STORAGE = 5 * 1024 * 1024 * 1024 // 5GB

export default function DrivePage() {
  const [folders, setFolders] = useState<DriveFolder[]>(mockFolders)
  const [files, setFiles] = useState<DriveFile[]>(mockFiles)
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities)
  const [fileBoxes, setFileBoxes] = useState<FileBox[]>(mockFileBoxes)
  const [currentView, setCurrentView] = useState<DriveView>('home')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [currentFileBoxId, setCurrentFileBoxId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  const handleChangeView = (view: DriveView) => {
    setCurrentView(view)
    setCurrentFolderId(null)
    setCurrentFileBoxId(null)
    setSearchQuery('')
  }

  const handleOpenFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    setCurrentFolderId(folderId)
    setCurrentView(folder?.scope === 'shared' ? 'shared' : 'my-drive')
    setSearchQuery('')
  }

  const handleOpenFileBox = (fileBoxId: string) => {
    setCurrentView('shared')
    setCurrentFileBoxId(fileBoxId)
    setCurrentFolderId(null)
    setSearchQuery('')
  }

  const getBreadcrumb = useCallback((): { id: string | null; name: string }[] => {
    const rootName = currentView === 'shared' ? '공용 파일함' : '내 파일'
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: rootName }]
    if (currentView === 'shared' && currentFileBoxId) {
      const box = fileBoxes.find((b) => b.id === currentFileBoxId)
      if (box) crumbs.push({ id: `filebox:${box.id}`, name: box.name })
    }
    if (!currentFolderId) return crumbs
    const buildPath = (folderId: string): { id: string; name: string }[] => {
      const folder = folders.find((f) => f.id === folderId)
      if (!folder) return []
      if (folder.parentId) return [...buildPath(folder.parentId), { id: folder.id, name: folder.name }]
      return [{ id: folder.id, name: folder.name }]
    }
    return [...crumbs, ...buildPath(currentFolderId)]
  }, [currentFolderId, currentView, currentFileBoxId, fileBoxes, folders])

  const handleNavigateBreadcrumb = (folderId: string | null) => {
    if (folderId === null) {
      // 루트로 돌아감 (공용 파일함 or 내 파일)
      setCurrentFolderId(null)
      setCurrentFileBoxId(null)
    } else if (folderId.startsWith('filebox:')) {
      // 파일함 레벨로 돌아감
      setCurrentFolderId(null)
      setCurrentFileBoxId(folderId.replace('filebox:', ''))
    } else {
      setCurrentFolderId(folderId)
    }
  }

  const addActivity = (action: ActivityItem['action'], targetName: string, location: string) => {
    setActivities((prev) => [
      { id: `a_${Date.now()}`, action, targetName, location, timestamp: new Date().toISOString(), user: '김철수' },
      ...prev,
    ])
  }

  const getCurrentFolderName = () => {
    if (!currentFolderId) return '내 파일'
    return folders.find((f) => f.id === currentFolderId)?.name || '내 파일'
  }

  // ── Folder ops ──────────────────────────────────────
  const handleCreateFolder = (name: string) => {
    const newFolder: DriveFolder = {
      id: `folder_${Date.now()}`, name, parentId: currentFolderId,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      createdBy: '김철수', starred: false, deleted: false, permission: 'private', permissionTargets: [],
    }
    setFolders((prev) => [...prev, newFolder])
    addActivity('create_folder', name, getCurrentFolderName())
    setModal({ type: 'none' })
  }

  const handleRenameFolder = (name: string) => {
    if (modal.type !== 'rename-folder') return
    setFolders((prev) => prev.map((f) => (f.id === modal.folder.id ? { ...f, name, updatedAt: new Date().toISOString() } : f)))
    addActivity('rename', name, getCurrentFolderName())
    setModal({ type: 'none' })
  }

  const handleDeleteFolder = (folder: DriveFolder) => {
    setModal({
      type: 'confirm', title: '폴더 삭제',
      message: `'${folder.name}' 폴더를 삭제하시겠습니까?\n폴더 내 파일은 휴지통으로 이동됩니다.`,
      confirmLabel: '삭제', danger: true,
      onConfirm: () => {
        setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, deleted: true } : f)))
        setFiles((prev) => prev.map((f) => (f.folderId === folder.id ? { ...f, deleted: true } : f)))
        addActivity('delete_folder', folder.name, getCurrentFolderName())
        setModal({ type: 'none' })
      },
    })
  }

  const handleToggleFolderStar = (folderId: string) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, starred: !f.starred } : f)))
  }

  const handleSetPermission = (folderId: string, permission: PermissionLevel) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, permission } : f)))
    setModal({ type: 'none' })
  }

  // ── Shared folder ops ───────────────────────────────
  const handleCreateSharedFolder = (name: string, targets: PermissionTarget[]) => {
    const newFolder: DriveFolder = {
      id: `shared_${Date.now()}`, name, parentId: currentFolderId,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      createdBy: '김철수', starred: false, deleted: false,
      permission: 'public', permissionTargets: targets, scope: 'shared',
      ...(currentFileBoxId && { fileBoxId: currentFileBoxId }),
    }
    setFolders((prev) => [...prev, newFolder])
    const boxName = fileBoxes.find((b) => b.id === currentFileBoxId)?.name || '공용 파일함'
    addActivity('create_folder', name, boxName)
    setModal({ type: 'none' })
  }

  // ── FileBox ops ────────────────────────────────────
  const handleCreateFileBox = (name: string, targets: PermissionTarget[]) => {
    const newBox: FileBox = {
      id: `filebox_${Date.now()}`, name,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      createdBy: '김철수', permissionTargets: targets, deleted: false,
    }
    setFileBoxes((prev) => [...prev, newBox])
    addActivity('create_folder', name, '공용 파일함')
    setModal({ type: 'none' })
  }

  const handleEditFileBox = (name: string, targets: PermissionTarget[]) => {
    if (modal.type !== 'edit-filebox') return
    setFileBoxes((prev) => prev.map((b) =>
      b.id === modal.fileBox.id
        ? { ...b, name, permissionTargets: targets, updatedAt: new Date().toISOString() }
        : b
    ))
    addActivity('rename', name, '공용 파일함')
    setModal({ type: 'none' })
  }

  const handleDeleteFileBox = (box: FileBox) => {
    setModal({
      type: 'confirm', title: '파일함 삭제',
      message: `'${box.name}' 파일함을 삭제하시겠습니까?\n파일함 내 모든 폴더와 파일이 휴지통으로 이동됩니다.`,
      confirmLabel: '삭제', danger: true,
      onConfirm: () => {
        setFileBoxes((prev) => prev.filter((b) => b.id !== box.id))
        setFolders((prev) => prev.map((f) => (f.fileBoxId === box.id ? { ...f, deleted: true } : f)))
        setFiles((prev) => prev.map((f) => {
          const folder = folders.find((fo) => fo.id === f.folderId)
          return folder?.fileBoxId === box.id ? { ...f, deleted: true } : f
        }))
        if (currentFileBoxId === box.id) {
          setCurrentFileBoxId(null)
        }
        addActivity('delete_folder', box.name, '공용 파일함')
        setModal({ type: 'none' })
      },
    })
  }

  // ── File ops ────────────────────────────────────────
  const handleUploadFiles = (uploadedFiles: File[]) => {
    const parentFolder = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null
    const scope = parentFolder?.scope === 'shared' ? 'shared' as const : undefined
    const newFiles: DriveFile[] = uploadedFiles.map((f) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name, type: getFileType(f.name), size: f.size,
      folderId: currentFolderId || 'root',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      createdBy: '김철수', starred: false, deleted: false, permission: 'owner',
      ...(scope && { scope }),
    }))
    setFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach((f) => addActivity('upload', f.name, getCurrentFolderName()))
  }

  const handleDeleteFile = (file: DriveFile) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, deleted: true } : f)))
    addActivity('delete', file.name, getCurrentFolderName())
  }

  const handleDownloadFile = (file: DriveFile) => {
    addActivity('download', file.name, getCurrentFolderName())
  }

  const handleToggleFileStar = (fileId: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, starred: !f.starred } : f)))
  }

  const handleRestoreFile = (file: DriveFile) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, deleted: false } : f)))
    addActivity('restore', file.name, '휴지통')
  }

  const handleRestoreFolder = (folder: DriveFolder) => {
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, deleted: false } : f)))
    addActivity('restore', folder.name, '휴지통')
  }

  const handlePermanentDeleteFile = (file: DriveFile) => {
    setModal({
      type: 'confirm', title: '영구 삭제',
      message: `'${file.name}' 파일이 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '삭제', danger: true,
      onConfirm: () => {
        setFiles((prev) => prev.filter((f) => f.id !== file.id))
        addActivity('permanent_delete', file.name, '휴지통')
        setModal({ type: 'none' })
      },
    })
  }

  const handlePermanentDeleteFolder = (folder: DriveFolder) => {
    setModal({
      type: 'confirm', title: '영구 삭제',
      message: `'${folder.name}' 폴더가 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '삭제', danger: true,
      onConfirm: () => {
        setFolders((prev) => prev.filter((f) => f.id !== folder.id))
        addActivity('permanent_delete', folder.name, '휴지통')
        setModal({ type: 'none' })
      },
    })
  }

  const handleEmptyTrash = () => {
    setModal({
      type: 'confirm', title: '휴지통 비우기',
      message: '휴지통의 모든 파일과 폴더가 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.',
      confirmLabel: '비우기', danger: true,
      onConfirm: () => {
        setFiles((prev) => prev.filter((f) => !f.deleted))
        setFolders((prev) => prev.filter((f) => !f.deleted))
        setModal({ type: 'none' })
      },
    })
  }

  // ── Displayed items ─────────────────────────────────
  const isHome = currentView === 'home' && !currentFolderId
  const isTrash = currentView === 'trash'
  const isShared = currentView === 'shared'

  let displayFolders: DriveFolder[] = []
  let displayFiles: DriveFile[] = []

  if (isTrash) {
    displayFolders = folders.filter((f) => f.deleted)
    displayFiles = files.filter((f) => f.deleted)
  } else if (isShared) {
    if (currentFolderId) {
      displayFolders = folders.filter((f) => !f.deleted && f.scope === 'shared' && f.parentId === currentFolderId)
      displayFiles = files.filter((f) => !f.deleted && f.scope === 'shared' && f.folderId === currentFolderId)
    } else if (currentFileBoxId) {
      displayFolders = folders.filter((f) => !f.deleted && f.scope === 'shared' && f.fileBoxId === currentFileBoxId && f.parentId === null)
      displayFiles = []
    } else {
      // 파일함 목록 뷰 — 폴더/파일은 보여주지 않음
      displayFolders = []
      displayFiles = []
    }
  } else if (currentView === 'favorites') {
    displayFolders = folders.filter((f) => !f.deleted && f.starred)
    displayFiles = files.filter((f) => !f.deleted && f.starred)
  } else if (currentView === 'recent') {
    displayFiles = [...files].filter((f) => !f.deleted)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20)
  } else if (isHome) {
    displayFolders = folders.filter((f) => !f.deleted && f.parentId === null)
  } else {
    displayFolders = folders.filter((f) => !f.deleted && f.parentId === currentFolderId)
    displayFiles = files.filter((f) => !f.deleted && f.folderId === currentFolderId)
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    displayFolders = displayFolders.filter((f) => f.name.toLowerCase().includes(q))
    displayFiles = displayFiles.filter((f) => f.name.toLowerCase().includes(q))
  }

  const starredFolders = folders.filter((f) => !f.deleted && f.starred)
  const recentFiles = [...files].filter((f) => !f.deleted)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)
  const totalSize = files.filter((f) => !f.deleted).reduce((s, f) => s + f.size, 0)
  const trashSize = files.filter((f) => f.deleted).reduce((s, f) => s + f.size, 0)

  const viewTitles: Record<DriveView, string> = {
    home: '홈', favorites: '즐겨찾기', 'my-drive': '내 파일',
    shared: '공용 파일함', trash: '휴지통', recent: '최근 열람', 'recent-updated': '최근 수정',
  }

  const breadcrumb = currentView === 'my-drive' || currentView === 'shared' || currentFolderId
    ? getBreadcrumb()
    : [{ id: null, name: viewTitles[currentView] }]

  return (
    <div className="flex h-full overflow-hidden">
      <DriveSidebar
        currentView={currentView}
        onChangeView={handleChangeView}
        files={files}
        fileBoxes={fileBoxes.filter((b) => !b.deleted)}
        currentFileBoxId={currentFileBoxId}
        onOpenFileBox={handleOpenFileBox}
        onCreateFileBox={() => setModal({ type: 'create-filebox' })}
        onEditFileBox={(box) => setModal({ type: 'edit-filebox', fileBox: box })}
        onDeleteFileBox={handleDeleteFileBox}
      />

      <FileGrid
        folders={displayFolders}
        files={displayFiles}
        starredFolders={starredFolders}
        breadcrumb={breadcrumb}
        searchQuery={searchQuery}
        isHome={isHome}
        storageInfo={{ totalSize, trashSize, maxStorage: MAX_STORAGE }}
        onSearchChange={setSearchQuery}
        onOpenFolder={handleOpenFolder}
        onNavigateBreadcrumb={handleNavigateBreadcrumb}
        onCreateFolder={() => setModal({ type: 'create-folder' })}
        onRenameFolder={(folder) => setModal({ type: 'rename-folder', folder })}
        onDeleteFolder={handleDeleteFolder}
        onToggleFolderStar={handleToggleFolderStar}
        onSetPermission={(folder) => setModal({ type: 'permission', folder })}
        onUploadFiles={handleUploadFiles}
        onDeleteFile={handleDeleteFile}
        onDownloadFile={handleDownloadFile}
        onPreviewFile={(file) => setModal({ type: 'preview', file })}
        onToggleFileStar={handleToggleFileStar}
        onRestoreFile={handleRestoreFile}
        onRestoreFolder={handleRestoreFolder}
        onPermanentDeleteFile={handlePermanentDeleteFile}
        onPermanentDeleteFolder={handlePermanentDeleteFolder}
        onEmptyTrash={handleEmptyTrash}
        isTrash={isTrash}
        isShared={isShared}
        onCreateSharedFolder={() => setModal({ type: 'create-shared-folder' })}
        onViewFavorites={() => handleChangeView('favorites')}
        recentFiles={recentFiles}
        onViewRecent={() => handleChangeView('recent')}
      />

      <ActivityLog activities={activities} />

      {modal.type === 'create-filebox' && (
        <FileBoxModal onClose={() => setModal({ type: 'none' })} onSubmit={handleCreateFileBox} />
      )}
      {modal.type === 'edit-filebox' && (
        <FileBoxModal mode="edit" fileBox={modal.fileBox} onClose={() => setModal({ type: 'none' })} onSubmit={handleEditFileBox} />
      )}
      {modal.type === 'create-shared-folder' && (
        <SharedFolderModal onClose={() => setModal({ type: 'none' })} onSubmit={handleCreateSharedFolder} />
      )}
      {modal.type === 'create-folder' && (
        <FolderModal mode="create" onClose={() => setModal({ type: 'none' })} onSubmit={handleCreateFolder} />
      )}
      {modal.type === 'rename-folder' && (
        <FolderModal mode="rename" folder={modal.folder} onClose={() => setModal({ type: 'none' })} onSubmit={handleRenameFolder} />
      )}
      {modal.type === 'permission' && (
        <PermissionModal folder={modal.folder} onClose={() => setModal({ type: 'none' })} onSave={handleSetPermission} />
      )}
      {modal.type === 'preview' && (
        <FilePreviewModal file={modal.file} onClose={() => setModal({ type: 'none' })} onDownload={handleDownloadFile} />
      )}
      {modal.type === 'confirm' && (
        <ConfirmModal
          title={modal.title} message={modal.message} confirmLabel={modal.confirmLabel}
          danger={modal.danger} onClose={() => setModal({ type: 'none' })} onConfirm={modal.onConfirm}
        />
      )}
    </div>
  )
}
