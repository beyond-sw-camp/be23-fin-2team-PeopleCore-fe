import { useState, useCallback, useEffect } from 'react'
import type { DriveFile, DriveFolder, DriveView, PermissionLevel, PermissionTarget, ActivityItem, FileBox, DriveDragPayload } from './types'
import DriveSidebar from './components/DriveSidebar'
import FileGrid from './components/FileGrid'
import ActivityLog from './components/ActivityLog'
import { FolderModal, PermissionModal, FilePreviewModal, ConfirmModal, SharedFolderModal, FileBoxModal, COMPANY_ROOT_DEPT_ID } from './components/DriveModals'
import { folderApi, fileApi, uploadFile, trashApi, activityApi, favoriteApi } from '../../api/filevault'
import type { FolderType } from '../../api/filevault'
import { capabilityApi, FILE_CAPABILITIES } from '../../api/capability'
import { toFileBox, toDriveFolder, toDriveFile } from './adapters'
import { useAuth } from '../../contexts/AuthContext'

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
  const { user } = useAuth()
  const currentEmpId = user ? Number(user.empId) : undefined

  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [fileBoxes, setFileBoxes] = useState<FileBox[]>([])
  const [personalRootId, setPersonalRootId] = useState<string | null>(null)
  const [fileBoxTypes, setFileBoxTypes] = useState<Record<string, FolderType>>({})
  const [myCapabilities, setMyCapabilities] = useState<Set<string>>(new Set())
  const [loadedFolderIds, setLoadedFolderIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<DriveView>('home')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [currentFileBoxId, setCurrentFileBoxId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  // ── 휴지통 로드 ─────────────────────────────────────
  const loadTrash = useCallback(async () => {
    try {
      const { data } = await trashApi.list()
      const trashFolderIds = new Set(data.folders.map((f) => String(f.folderId)))
      const trashFileIds = new Set(data.files.map((f) => String(f.fileId)))
      const folderScope = (type: FolderType): 'personal' | 'shared' =>
        type === 'PERSONAL' ? 'personal' : 'shared'

      setFolders((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const updated = prev.map((f) => (trashFolderIds.has(f.id) ? { ...f, deleted: true } : f))
        const newOnes = data.folders
          .filter((f) => !existingIds.has(String(f.folderId)))
          .map((f) => ({ ...toDriveFolder(f, folderScope(f.type)), deleted: true }))
        return [...updated, ...newOnes]
      })
      setFiles((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const trashFolderMap = new Map(data.folders.map((f) => [f.folderId, f]))
        const updated = prev.map((f) => (trashFileIds.has(f.id) ? { ...f, deleted: true } : f))
        const newOnes = data.files
          .filter((f) => !existingIds.has(String(f.fileId)))
          .map((f) => {
            const parent = trashFolderMap.get(f.folderId)
            const scope = parent ? folderScope(parent.type) : 'personal'
            return { ...toDriveFile(f, scope, currentEmpId), deleted: true }
          })
        return [...updated, ...newOnes]
      })
    } catch (e) {
      console.error('[DrivePage] 휴지통 로드 실패:', e)
    }
  }, [currentEmpId])

  // ── 폴더 내용 lazy 로드 ─────────────────────────────
  const loadFolderContents = useCallback(async (folderId: string, scope: 'personal' | 'shared', fileBoxId?: string) => {
    if (loadedFolderIds.has(folderId)) return
    try {
      const numericId = Number(folderId)
      const [childrenRes, filesRes] = await Promise.all([
        folderApi.listChildren(numericId),
        fileApi.listByFolder(numericId),
      ])
      const newFolders = childrenRes.data.map((f) => toDriveFolder(f, scope, fileBoxId))
      const newFiles = filesRes.data.map((f) => toDriveFile(f, scope, currentEmpId))
      setFolders((prev) => {
        const existing = new Set(prev.map((p) => p.id))
        return [...prev, ...newFolders.filter((f) => !existing.has(f.id))]
      })
      setFiles((prev) => {
        const existing = new Set(prev.map((p) => p.id))
        return [...prev, ...newFiles.filter((f) => !existing.has(f.id))]
      })
      setLoadedFolderIds((prev) => new Set(prev).add(folderId))
    } catch (e) {
      console.error('[DrivePage] 폴더 내용 로드 실패:', e)
    }
  }, [loadedFolderIds, currentEmpId])

  // ── 마운트 시 루트 로드 ─────────────────────────────
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const [personalRes, companyRes, deptRes, capsRes] = await Promise.all([
          folderApi.listRoot('PERSONAL'),
          folderApi.listRoot('COMPANY'),
          folderApi.listRoot('DEPT'),
          capabilityApi.myCapabilities(),
        ])
        if (cancelled) return

        setMyCapabilities(new Set(capsRes.data))

        let personalRoot = personalRes.data.find((f) => f.parentFolderId === null)
        if (!personalRoot) {
          const { data } = await folderApi.ensurePersonal()
          if (cancelled) return
          personalRoot = data
        }
        const sharedRoots = [...companyRes.data, ...deptRes.data]
        const boxes = sharedRoots.map(toFileBox)

        setPersonalRootId(String(personalRoot.folderId))
        setFileBoxes(boxes)
        setFileBoxTypes(Object.fromEntries(sharedRoots.map((f) => [String(f.folderId), f.type])))

        const [childrenRes, filesRes] = await Promise.all([
          folderApi.listChildren(personalRoot.folderId),
          fileApi.listByFolder(personalRoot.folderId),
        ])
        if (cancelled) return
        setFolders(childrenRes.data.map((f) => toDriveFolder(f, 'personal')))
        setFiles(filesRes.data.map((f) => toDriveFile(f, 'personal', currentEmpId)))
        setLoadedFolderIds(new Set([String(personalRoot.folderId)]))
      } catch (e) {
        console.error('[DrivePage] 초기 로드 실패:', e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.empId])

  // ── 활동 이력 로드 ──────────────────────────────────
  // 서버가 모든 변경 작업을 감사 로그(BEFORE_COMMIT)에 자동 기록하므로
  // FE는 변경 직후 refreshActivities() 만 호출해 다시 가져오기만 하면 된다.
  const refreshActivities = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await activityApi.list(100)
      setActivities(data.map((res) => ({
        id: String(res.id),
        action: res.action,
        targetName: res.targetName,
        location: res.location,
        timestamp: res.createdAt,
        user: res.userName,
      })))
    } catch (e) {
      console.error('[DrivePage] 활동 이력 조회 실패:', e)
    }
  }, [user])

  useEffect(() => {
    refreshActivities()
  }, [refreshActivities])

  const loadFavorites = useCallback(async () => {
    try {
      const { data } = await favoriteApi.list()
      setFolders((prev) => {
        const byId = new Map(prev.map((f) => [f.id, f]))
        for (const f of data.folders) {
          const id = String(f.folderId)
          const scope: 'personal' | 'shared' = f.type === 'PERSONAL' ? 'personal' : 'shared'
          const existing = byId.get(id)
          if (existing) byId.set(id, { ...existing, starred: true })
          else byId.set(id, { ...toDriveFolder(f, scope), starred: true })
        }
        return Array.from(byId.values())
      })
      setFiles((prev) => {
        const byId = new Map(prev.map((f) => [f.id, f]))
        for (const f of data.files) {
          const id = String(f.fileId)
          const existing = byId.get(id)
          if (existing) byId.set(id, { ...existing, starred: true })
          else byId.set(id, { ...toDriveFile(f, 'personal', currentEmpId), starred: true })
        }
        return Array.from(byId.values())
      })
    } catch (e) {
      console.error('[DrivePage] 즐겨찾기 로드 실패:', e)
    }
  }, [currentEmpId])

  const handleChangeView = (view: DriveView) => {
    setCurrentView(view)
    setCurrentFolderId(null)
    setCurrentFileBoxId(null)
    setSearchQuery('')
    if (view === 'trash') loadTrash()
    if (view === 'favorites') loadFavorites()
  }

  const handleOpenFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    const scope = folder?.scope === 'shared' ? 'shared' : 'personal'
    setCurrentFolderId(folderId)
    setCurrentView(scope === 'shared' ? 'shared' : 'my-drive')
    setSearchQuery('')
    loadFolderContents(folderId, scope, folder?.fileBoxId)
  }

  const handleOpenFileBox = (fileBoxId: string) => {
    setCurrentView('shared')
    setCurrentFileBoxId(fileBoxId)
    setCurrentFolderId(null)
    setSearchQuery('')
    loadFolderContents(fileBoxId, 'shared', fileBoxId)
  }

  const getBreadcrumb = useCallback((): { id: string | null; name: string; dropTargetId?: string }[] => {
    const isSharedView = currentView === 'shared'
    const rootName = isSharedView ? '공용 파일함' : '내 파일'
    const rootDropTarget = isSharedView ? undefined : (personalRootId ?? undefined)
    const crumbs: { id: string | null; name: string; dropTargetId?: string }[] = [
      { id: null, name: rootName, dropTargetId: rootDropTarget },
    ]
    if (isSharedView && currentFileBoxId) {
      const box = fileBoxes.find((b) => b.id === currentFileBoxId)
      if (box) crumbs.push({ id: `filebox:${box.id}`, name: box.name, dropTargetId: box.id })
    }
    if (!currentFolderId) return crumbs
    const buildPath = (folderId: string): { id: string; name: string; dropTargetId: string }[] => {
      const folder = folders.find((f) => f.id === folderId)
      if (!folder) return []
      const item = { id: folder.id, name: folder.name, dropTargetId: folder.id }
      if (folder.parentId) return [...buildPath(folder.parentId), item]
      return [item]
    }
    return [...crumbs, ...buildPath(currentFolderId)]
  }, [currentFolderId, currentView, currentFileBoxId, fileBoxes, folders, personalRootId])

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

  // ── 드래그 앤 드롭 이동 ─────────────────────────────
  // 폴더/파일을 다른 폴더(또는 파일함 루트)로 이동.
  // 낙관적 업데이트 → 실패 시 스냅샷으로 롤백 → refreshActivities()
  const handleMoveItems = useCallback(async (
    payload: DriveDragPayload,
    targetFolderId: string,
  ) => {
    if (payload.folderIds.length === 0 && payload.fileIds.length === 0) return
    if (payload.folderIds.includes(targetFolderId)) return // 자기 자신 위로
    if (payload.sourceParentId === targetFolderId) return // 현재 부모 위로

    // 타겟의 scope/fileBoxId 결정
    const targetIsFileBox = fileBoxes.some((b) => b.id === targetFolderId)
    let newScope: 'personal' | 'shared'
    let newFileBoxId: string | undefined
    if (targetIsFileBox) {
      newScope = 'shared'
      newFileBoxId = targetFolderId
    } else if (targetFolderId === personalRootId) {
      newScope = 'personal'
      newFileBoxId = undefined
    } else {
      const targetFolder = folders.find((f) => f.id === targetFolderId)
      if (!targetFolder) return
      newScope = targetFolder.scope ?? 'personal'
      newFileBoxId = targetFolder.fileBoxId
    }

    // 롤백용 스냅샷
    const snapshotFolders = folders
    const snapshotFiles = files

    // 이동 대상 폴더 + 그 하위 폴더(스코프/파일함 갱신용)
    const movingTree = new Set<string>(payload.folderIds)
    let added = true
    while (added) {
      added = false
      for (const f of folders) {
        if (f.parentId && movingTree.has(f.parentId) && !movingTree.has(f.id)) {
          movingTree.add(f.id)
          added = true
        }
      }
    }

    // 낙관적 업데이트
    setFolders((prev) => prev.map((f) => {
      if (payload.folderIds.includes(f.id)) {
        return { ...f, parentId: targetFolderId, scope: newScope, fileBoxId: newFileBoxId }
      }
      if (movingTree.has(f.id)) {
        return { ...f, scope: newScope, fileBoxId: newFileBoxId }
      }
      return f
    }))
    setFiles((prev) => prev.map((f) => {
      if (payload.fileIds.includes(f.id)) {
        return { ...f, folderId: targetFolderId, scope: newScope }
      }
      if (movingTree.has(f.folderId)) {
        return { ...f, scope: newScope }
      }
      return f
    }))

    const numericTarget = Number(targetFolderId)
    const errors: unknown[] = []
    for (const fid of payload.folderIds) {
      try { await folderApi.move(Number(fid), numericTarget) }
      catch (e) { errors.push(e) }
    }
    for (const fid of payload.fileIds) {
      try { await fileApi.move(Number(fid), numericTarget) }
      catch (e) { errors.push(e) }
    }
    if (errors.length > 0) {
      console.error('[DrivePage] 이동 실패 — 롤백:', errors)
      setFolders(snapshotFolders)
      setFiles(snapshotFiles)
    }
    refreshActivities()
  }, [folders, files, fileBoxes, personalRootId, refreshActivities])

  // ── Folder ops ──────────────────────────────────────
  const resolveParentForCreate = (): { parentId: number; type: FolderType; scope: 'personal' | 'shared'; fileBoxId?: string } | null => {
    // 현재 폴더 안이면 그 폴더 기준
    if (currentFolderId) {
      const parent = folders.find((f) => f.id === currentFolderId)
      if (!parent) return null
      const rootType = parent.fileBoxId ? fileBoxTypes[parent.fileBoxId] : 'PERSONAL'
      return { parentId: Number(currentFolderId), type: rootType, scope: parent.scope ?? 'personal', fileBoxId: parent.fileBoxId }
    }
    // 파일함 안이면 그 파일함 기준
    if (currentFileBoxId) {
      const type = fileBoxTypes[currentFileBoxId] ?? 'COMPANY'
      return { parentId: Number(currentFileBoxId), type, scope: 'shared', fileBoxId: currentFileBoxId }
    }
    // 홈 = 개인 루트
    if (personalRootId) {
      return { parentId: Number(personalRootId), type: 'PERSONAL', scope: 'personal' }
    }
    return null
  }

  const handleCreateFolder = async (name: string) => {
    const ctx = resolveParentForCreate()
    if (!ctx) return
    try {
      const { data } = await folderApi.create({ name, type: ctx.type, parentFolderId: ctx.parentId })
      setFolders((prev) => [...prev, toDriveFolder(data, ctx.scope, ctx.fileBoxId)])
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 폴더 생성 실패:', e)
    } finally {
      setModal({ type: 'none' })
    }
  }

  const handleRenameFolder = async (name: string) => {
    if (modal.type !== 'rename-folder') return
    const target = modal.folder
    try {
      await folderApi.rename(Number(target.id), name)
      setFolders((prev) => prev.map((f) => (f.id === target.id ? { ...f, name, updatedAt: new Date().toISOString() } : f)))
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 폴더 이름 변경 실패:', e)
    } finally {
      setModal({ type: 'none' })
    }
  }

  const handleDeleteFolder = (folder: DriveFolder) => {
    setModal({
      type: 'confirm', title: '폴더 삭제',
      message: `'${folder.name}' 폴더를 삭제하시겠습니까?\n폴더 내 파일은 휴지통으로 이동됩니다.`,
      confirmLabel: '삭제', danger: true,
      onConfirm: async () => {
        try {
          await folderApi.softDelete(Number(folder.id))
          setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, deleted: true } : f)))
          setFiles((prev) => prev.map((f) => (f.folderId === folder.id ? { ...f, deleted: true } : f)))
          refreshActivities()
        } catch (e) {
          console.error('[DrivePage] 폴더 삭제 실패:', e)
        } finally {
          setModal({ type: 'none' })
        }
      },
    })
  }

  const handleToggleFolderStar = async (folderId: string) => {
    const prev = folders.find((f) => f.id === folderId)?.starred ?? false
    setFolders((p) => p.map((f) => (f.id === folderId ? { ...f, starred: !prev } : f)))
    try {
      const { data } = await favoriteApi.toggle({ targetType: 'folder', targetId: Number(folderId) })
      setFolders((p) => p.map((f) => (f.id === folderId ? { ...f, starred: data.starred } : f)))
    } catch (e) {
      console.error('[DrivePage] 폴더 즐겨찾기 토글 실패:', e)
      setFolders((p) => p.map((f) => (f.id === folderId ? { ...f, starred: prev } : f)))
    }
  }

  const handleSetPermission = (folderId: string, permission: PermissionLevel) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, permission } : f)))
    setModal({ type: 'none' })
  }

  // ── Shared folder ops ───────────────────────────────
  const handleCreateSharedFolder = async (name: string, _targets: PermissionTarget[]) => {
    // Phase 1: permissionTargets는 저장하지 않음 (capability 기반으로 BE에서 관리)
    const ctx = resolveParentForCreate()
    if (!ctx || ctx.scope !== 'shared') return
    try {
      const { data } = await folderApi.create({ name, type: ctx.type, parentFolderId: ctx.parentId })
      setFolders((prev) => [...prev, toDriveFolder(data, 'shared', ctx.fileBoxId)])
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 공용 폴더 생성 실패:', e)
    } finally {
      setModal({ type: 'none' })
    }
  }

  // ── FileBox ops ────────────────────────────────────
  const handleCreateFileBox = async (name: string, targets: PermissionTarget[]) => {
    const isCompanyWide = targets.some(
      (t) => t.type === 'department' && t.id === COMPANY_ROOT_DEPT_ID,
    )
    const deptTargets = targets.filter(
      (t) => t.type === 'department' && t.id !== COMPANY_ROOT_DEPT_ID,
    )
    const type: FolderType = isCompanyWide ? 'COMPANY' : 'DEPT'
    const deptId =
      !isCompanyWide && deptTargets.length === 1 ? Number(deptTargets[0].id) : undefined
    try {
      const { data } = await folderApi.create({ name, type, parentFolderId: null, deptId })
      const box = { ...toFileBox(data), permissionTargets: targets, isSystemDefault: false }
      setFileBoxes((prev) => [...prev, box])
      setFileBoxTypes((prev) => ({ ...prev, [String(data.folderId)]: data.type }))
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 파일함 생성 실패:', e)
    } finally {
      setModal({ type: 'none' })
    }
  }

  const handleEditFileBox = (name: string, targets: PermissionTarget[]) => {
    if (modal.type !== 'edit-filebox') return
    if (modal.fileBox.isSystemDefault) {
      console.warn('[DrivePage] 시스템 기본 파일함은 수정할 수 없습니다.')
      setModal({ type: 'none' })
      return
    }
    setFileBoxes((prev) => prev.map((b) =>
      b.id === modal.fileBox.id
        ? { ...b, name, permissionTargets: targets, updatedAt: new Date().toISOString() }
        : b
    ))
    setModal({ type: 'none' })
  }

  const handleDeleteFileBox = (box: FileBox) => {
    if (box.isSystemDefault) {
      console.warn('[DrivePage] 시스템 기본 파일함은 삭제할 수 없습니다.')
      return
    }
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
        setModal({ type: 'none' })
      },
    })
  }

  // ── File ops ────────────────────────────────────────
  const resolveUploadTarget = (): { folderId: number; scope: 'personal' | 'shared' } | null => {
    if (currentFolderId) {
      const parent = folders.find((f) => f.id === currentFolderId)
      return parent ? { folderId: Number(currentFolderId), scope: parent.scope ?? 'personal' } : null
    }
    if (currentFileBoxId) {
      return { folderId: Number(currentFileBoxId), scope: 'shared' }
    }
    if (personalRootId) {
      return { folderId: Number(personalRootId), scope: 'personal' }
    }
    return null
  }

  const handleUploadFiles = async (uploadedFiles: File[]) => {
    const target = resolveUploadTarget()
    if (!target) return
    for (const f of uploadedFiles) {
      try {
        const created = await uploadFile(target.folderId, f)
        setFiles((prev) => [...prev, toDriveFile(created, target.scope, currentEmpId)])
        refreshActivities()
      } catch (e) {
        console.error('[DrivePage] 파일 업로드 실패:', f.name, e)
      }
    }
  }

  const handleDeleteFile = async (file: DriveFile) => {
    try {
      await fileApi.softDelete(Number(file.id))
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, deleted: true } : f)))
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 파일 삭제 실패:', e)
    }
  }

  const handleDownloadFile = async (file: DriveFile) => {
    try {
      const { data } = await fileApi.generateDownloadUrl(Number(file.id))
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer')
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 파일 다운로드 실패:', e)
    }
  }

  const handleToggleFileStar = async (fileId: string) => {
    const prev = files.find((f) => f.id === fileId)?.starred ?? false
    setFiles((p) => p.map((f) => (f.id === fileId ? { ...f, starred: !prev } : f)))
    try {
      const { data } = await favoriteApi.toggle({ targetType: 'file', targetId: Number(fileId) })
      setFiles((p) => p.map((f) => (f.id === fileId ? { ...f, starred: data.starred } : f)))
    } catch (e) {
      console.error('[DrivePage] 파일 즐겨찾기 토글 실패:', e)
      setFiles((p) => p.map((f) => (f.id === fileId ? { ...f, starred: prev } : f)))
    }
  }

  const handleRestoreFile = async (file: DriveFile) => {
    try {
      await fileApi.restore(Number(file.id))
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, deleted: false } : f)))
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 파일 복원 실패:', e)
    }
  }

  const handleRestoreFolder = async (folder: DriveFolder) => {
    try {
      await folderApi.restore(Number(folder.id))
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, deleted: false } : f)))
      refreshActivities()
    } catch (e) {
      console.error('[DrivePage] 폴더 복원 실패:', e)
    }
  }

  const handlePermanentDeleteFile = (file: DriveFile) => {
    setModal({
      type: 'confirm', title: '영구 삭제',
      message: `'${file.name}' 파일이 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '삭제', danger: true,
      onConfirm: async () => {
        try {
          await fileApi.permanentDelete(Number(file.id))
          setFiles((prev) => prev.filter((f) => f.id !== file.id))
          refreshActivities()
        } catch (e) {
          console.error('[DrivePage] 파일 영구 삭제 실패:', e)
        } finally {
          setModal({ type: 'none' })
        }
      },
    })
  }

  const handlePermanentDeleteFolder = (folder: DriveFolder) => {
    setModal({
      type: 'confirm', title: '영구 삭제',
      message: `'${folder.name}' 폴더가 영구 삭제됩니다.\n하위 파일과 폴더도 모두 삭제되며 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '삭제', danger: true,
      onConfirm: async () => {
        try {
          await folderApi.permanentDelete(Number(folder.id))
          setFolders((prev) => prev.filter((f) => f.id !== folder.id && f.parentId !== folder.id))
          setFiles((prev) => prev.filter((f) => f.folderId !== folder.id))
          refreshActivities()
        } catch (e) {
          console.error('[DrivePage] 폴더 영구 삭제 실패:', e)
        } finally {
          setModal({ type: 'none' })
        }
      },
    })
  }

  const handleEmptyTrash = () => {
    setModal({
      type: 'confirm', title: '휴지통 비우기',
      message: '휴지통의 모든 파일과 폴더가 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.',
      confirmLabel: '비우기', danger: true,
      onConfirm: async () => {
        try {
          await trashApi.empty()
          setFiles((prev) => prev.filter((f) => !f.deleted))
          setFolders((prev) => prev.filter((f) => !f.deleted))
        } catch (e) {
          console.error('[DrivePage] 휴지통 비우기 실패:', e)
        } finally {
          setModal({ type: 'none' })
        }
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
      displayFolders = folders.filter((f) => !f.deleted && f.scope === 'shared' && f.parentId === currentFileBoxId)
      displayFiles = files.filter((f) => !f.deleted && f.folderId === currentFileBoxId)
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
    displayFolders = folders.filter((f) => !f.deleted && f.scope === 'personal' && f.parentId === personalRootId)
    displayFiles = files.filter((f) => !f.deleted && f.scope === 'personal' && f.folderId === personalRootId)
  } else if (currentView === 'my-drive' && !currentFolderId) {
    displayFolders = folders.filter((f) => !f.deleted && f.scope === 'personal' && f.parentId === personalRootId)
    displayFiles = files.filter((f) => !f.deleted && f.scope === 'personal' && f.folderId === personalRootId)
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <i className="fa-solid fa-spinner fa-spin mr-2" /> 파일함 로딩 중...
      </div>
    )
  }

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
        onMoveItems={handleMoveItems}
        canCreateFileBox={
          myCapabilities.has(FILE_CAPABILITIES.CREATE_DEPT_FOLDER) ||
          myCapabilities.has(FILE_CAPABILITIES.WRITE_COMPANY_FOLDER)
        }
        canManageFileBox={
          myCapabilities.has(FILE_CAPABILITIES.MANAGE_DEPT_FOLDER) ||
          myCapabilities.has(FILE_CAPABILITIES.MANAGE_SUBTREE_DEPT_FOLDER) ||
          myCapabilities.has(FILE_CAPABILITIES.WRITE_COMPANY_FOLDER)
        }
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
        onMoveItems={handleMoveItems}
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
