import { useState, useCallback, useEffect, useRef } from 'react'
import type { DriveFile, DriveFolder, DriveView, ActivityItem, FileBox, DriveDragPayload } from './types'
import DriveSidebar from './components/DriveSidebar'
import FileGrid from './components/FileGrid'
import ActivityLog from './components/ActivityLog'
import { FolderModal, FilePreviewModal, ConfirmModal, AlertModal, SharedFolderModal, FileBoxModal } from './components/DriveModals'
import FileBoxAclPage from './components/FileBoxAclPage'
import { folderApi, fileApi, uploadFile, trashApi, activityApi, favoriteApi } from '../../api/filevault'
import type { FolderType } from '../../api/filevault'
import { adminCapabilityApi, fileBoxAclApi, type MyFileBoxAcl } from '../../api/filebox-permission'
import { toFileBox, toDriveFolder, toDriveFile } from './adapters'
import { useAuth } from '../../contexts/AuthContext'

type ModalState =
  | { type: 'none' }
  | { type: 'create-folder' }
  | { type: 'rename-folder'; folder: DriveFolder }
  | { type: 'preview'; file: DriveFile }
  | { type: 'create-shared-folder' }
  | { type: 'create-filebox' }
  | { type: 'edit-filebox'; fileBox: FileBox }
  | { type: 'confirm'; title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }
  | { type: 'alert'; title: string; message: string }

const extractErrorMessage = (e: unknown, fallback: string): string =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

// 404/410 — 다른 사용자가 이미 삭제했거나 이동한 대상에 대한 작업.
// 409 + OPTIMISTIC_LOCK_CONFLICT — 동시 rename/move 중 다른 트랜잭션이 먼저 커밋(@Version 충돌).
// 셋 모두 "내가 보고 있던 상태가 이미 낡음" 이라는 점에서 동일하게 처리 — 알림 + refetch.
const isStaleItemError = (e: unknown): boolean => {
  const resp = (e as { response?: { status?: number; data?: { code?: string } } })?.response
  if (!resp) return false
  if (resp.status === 404 || resp.status === 410) return true
  if (resp.status === 409 && resp.data?.code === 'OPTIMISTIC_LOCK_CONFLICT') return true
  return false
}

// 403 — Owner가 방금 내 ACL을 회수/축소했을 때의 신호. 캐시된 myAclByBox 가 실제 서버 상태와 어긋났음을 뜻하므로
// 알림 + ACL 재조회 + refetch 트리거에 사용된다.
const isForbiddenError = (e: unknown): boolean => {
  const status = (e as { response?: { status?: number } })?.response?.status
  return status === 403
}

// 탭이 활성 상태일 때만 주기적으로 재조회하는 간격 (ms).
// 백그라운드 탭에서는 정지 — visibilitychange 이벤트로 제어.
const VISIBLE_POLL_INTERVAL_MS = 10_000

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
  const [isLoading, setIsLoading] = useState(true)
  const [isFileBoxAdmin, setIsFileBoxAdmin] = useState(false)
  const [myAclByBox, setMyAclByBox] = useState<Record<string, MyFileBoxAcl>>({})
  const [currentView, setCurrentView] = useState<DriveView>('home')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [currentFileBoxId, setCurrentFileBoxId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  // rename API in-flight인 폴더 ID. polling/네비게이션 refetch가 서버 스냅샷으로
  // 로컬 이름을 덮어쓰지 않도록 merge 시 이 Set의 항목은 로컬 이름 유지.
  const renamingFolderIdsRef = useRef<Set<string>>(new Set())

  // 드래그 이동 중 per-item API 호출이 루프 중인 동안의 카운터. 0보다 크면 polling을
  // 일시정지해서 낙관적 상태가 서버 스냅샷으로 되돌려지는 깜빡임을 방지.
  const inflightMoveCountRef = useRef(0)

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

  // 폴더 진입 시 항상 최신 내용을 재조회 (stale 방지).
  // 기존 캐시는 starred 오버레이만 보존하고 children/files는 서버 응답으로 교체.
  const loadFolderContents = useCallback(async (folderId: string, scope: 'personal' | 'shared', fileBoxId?: string) => {
    try {
      const numericId = Number(folderId)
      const [childrenRes, filesRes] = await Promise.all([
        folderApi.listChildren(numericId),
        fileApi.listByFolder(numericId),
      ])
      setFolders((prev) => {
        const starredIds = new Set(prev.filter((f) => f.starred).map((f) => f.id))
        const localById = new Map(prev.map((p) => [p.id, p]))
        const keep = prev.filter((f) => f.parentId !== folderId)
        const fresh = childrenRes.data.map((f) => {
          const adapted = toDriveFolder(f, scope, fileBoxId)
          const withStar = starredIds.has(adapted.id) ? { ...adapted, starred: true } : adapted
          if (renamingFolderIdsRef.current.has(adapted.id)) {
            const local = localById.get(adapted.id)
            if (local) return { ...withStar, name: local.name }
          }
          return withStar
        })
        return [...keep, ...fresh]
      })
      setFiles((prev) => {
        const starredIds = new Set(prev.filter((f) => f.starred).map((f) => f.id))
        const keep = prev.filter((f) => f.folderId !== folderId)
        const fresh = filesRes.data.map((f) => {
          const adapted = toDriveFile(f, scope, currentEmpId)
          return starredIds.has(adapted.id) ? { ...adapted, starred: true } : adapted
        })
        return [...keep, ...fresh]
      })
    } catch (e) {
      console.error('[DrivePage] 폴더 내용 로드 실패:', e)
    }
  }, [currentEmpId])

  // 서버의 즐겨찾기 목록으로 로컬 starred 상태를 재동기화.
  // 목록에 없는 항목은 starred=false로 리셋 — 다른 사용자가 삭제/해제한 즐겨찾기가
  // favorites 뷰에서 사라지도록 함.
  const loadFavorites = useCallback(async () => {
    try {
      const { data } = await favoriteApi.list()
      const starredFolderIds = new Set(data.folders.map((f) => String(f.folderId)))
      const starredFileIds = new Set(data.files.map((f) => String(f.fileId)))
      setFolders((prev) => {
        const byId = new Map(prev.map((f) => [f.id, { ...f, starred: starredFolderIds.has(f.id) }]))
        for (const f of data.folders) {
          const id = String(f.folderId)
          if (!byId.has(id)) {
            const scope: 'personal' | 'shared' = f.type === 'PERSONAL' ? 'personal' : 'shared'
            byId.set(id, { ...toDriveFolder(f, scope), starred: true })
          }
        }
        return Array.from(byId.values())
      })
      setFiles((prev) => {
        const byId = new Map(prev.map((f) => [f.id, { ...f, starred: starredFileIds.has(f.id) }]))
        for (const f of data.files) {
          const id = String(f.fileId)
          if (!byId.has(id)) {
            byId.set(id, { ...toDriveFile(f, 'personal', currentEmpId), starred: true })
          }
        }
        return Array.from(byId.values())
      })
    } catch (e) {
      console.error('[DrivePage] 즐겨찾기 로드 실패:', e)
    }
  }, [currentEmpId])

  // ── 마운트 시 루트 로드 ─────────────────────────────
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const [personalRes, companyRes, deptRes, capRes] = await Promise.all([
          folderApi.listRoot('PERSONAL'),
          folderApi.listRoot('COMPANY'),
          folderApi.listRoot('DEPT'),
          adminCapabilityApi.me().catch(() => ({ data: { isAdmin: false } })),
        ])
        if (cancelled) return
        setIsFileBoxAdmin(capRes.data.isAdmin)

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
        loadFavorites()
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

  // refetchVisible이 매 렌더마다 재바인딩되지 않도록, 현재 뷰 상태를 ref에 싣는다.
  // setInterval 핸들러가 항상 최신 뷰 맥락을 읽을 수 있도록 하기 위함.
  const viewRef = useRef<{
    currentView: DriveView
    currentFolderId: string | null
    currentFileBoxId: string | null
    personalRootId: string | null
    folders: DriveFolder[]
  }>({ currentView: 'home', currentFolderId: null, currentFileBoxId: null, personalRootId: null, folders: [] })
  viewRef.current = { currentView, currentFolderId, currentFileBoxId, personalRootId, folders }

  const showStaleAlert = useCallback(() => {
    setModal({
      type: 'alert',
      title: '이미 변경된 항목',
      message: '다른 사용자가 이미 이 항목을 삭제했거나 이동한 것 같습니다. 목록을 최신 상태로 새로고침합니다.',
    })
  }, [])

  // 403 처리 — 캐시된 내 ACL이 낡아서 실패한 케이스. 알림 + 현재 파일함 ACL 즉시 재조회.
  // polling을 기다리지 않고 즉각 UI(쓰기/삭제 버튼 노출)를 바로잡는다.
  const handleAclForbidden = useCallback(async () => {
    const snap = viewRef.current
    const activeBoxId = snap.currentFileBoxId
      ?? (snap.currentFolderId
        ? snap.folders.find((f) => f.id === snap.currentFolderId)?.fileBoxId
        : null)
    if (activeBoxId) {
      try {
        const { data } = await fileBoxAclApi.me(Number(activeBoxId))
        setMyAclByBox((prev) => ({ ...prev, [activeBoxId]: data }))
      } catch (e) {
        console.error('[DrivePage] ACL 재조회 실패:', e)
      }
    }
    setModal({
      type: 'alert',
      title: '권한이 변경되었습니다',
      message: '이 파일함에 대한 권한이 변경된 것 같습니다. 화면을 최신 상태로 갱신합니다.',
    })
  }, [])

  // 탭 활성 시 주기적으로 호출되는 재조회 — 루트 파일함 목록과 현재 보고 있는 폴더 내용을 갱신한다.
  // 휴지통/즐겨찾기/최근 뷰는 자체 로드 경로가 있어 여기선 건너뛴다.
  const refetchVisible = useCallback(async () => {
    if (!user) return
    // 드래그 이동 중에는 낙관적 상태와 서버 스냅샷이 교차해 깜빡임이 생기므로 skip.
    if (inflightMoveCountRef.current > 0) return
    const snap = viewRef.current
    try {
      const [personalRes, companyRes, deptRes] = await Promise.all([
        folderApi.listRoot('PERSONAL'),
        folderApi.listRoot('COMPANY'),
        folderApi.listRoot('DEPT'),
      ])
      const personalRoot = personalRes.data.find((f) => f.parentFolderId === null)
      const nextPersonalRootId = personalRoot ? String(personalRoot.folderId) : snap.personalRootId
      if (personalRoot) setPersonalRootId(nextPersonalRootId)
      const sharedRoots = [...companyRes.data, ...deptRes.data]
      setFileBoxes(sharedRoots.map(toFileBox))
      setFileBoxTypes(Object.fromEntries(sharedRoots.map((f) => [String(f.folderId), f.type])))

      // 즐겨찾기 뷰는 서버 favorites 목록을 재조회해서 다른 사용자가 삭제/해제한
      // 항목이 사라지도록 함. 현재 열린 폴더 내용은 별도로 보지 않는 뷰라 스킵.
      if (snap.currentView === 'favorites') {
        await loadFavorites()
        return
      }
      const refetchContentViews: DriveView[] = ['home', 'my-drive', 'shared']
      if (!refetchContentViews.includes(snap.currentView)) return
      const targetId = snap.currentFolderId ?? snap.currentFileBoxId ?? nextPersonalRootId
      if (!targetId) return

      const currentFolderIsShared =
        snap.currentFolderId != null &&
        snap.folders.find((f) => f.id === snap.currentFolderId)?.scope === 'shared'
      const scope: 'personal' | 'shared' =
        snap.currentFileBoxId != null || currentFolderIsShared ? 'shared' : 'personal'
      const fileBoxIdContext = snap.currentFileBoxId
        ?? (snap.currentFolderId
          ? snap.folders.find((f) => f.id === snap.currentFolderId)?.fileBoxId
          : undefined)

      const [childrenRes, filesRes] = await Promise.all([
        folderApi.listChildren(Number(targetId)),
        fileApi.listByFolder(Number(targetId)),
      ])

      setFolders((prev) => {
        const starredIds = new Set(prev.filter((f) => f.starred).map((f) => f.id))
        const localById = new Map(prev.map((p) => [p.id, p]))
        const keep = prev.filter((f) => f.parentId !== targetId)
        const fresh = childrenRes.data.map((f) => {
          const adapted = toDriveFolder(f, scope, fileBoxIdContext)
          const withStar = starredIds.has(adapted.id) ? { ...adapted, starred: true } : adapted
          if (renamingFolderIdsRef.current.has(adapted.id)) {
            const local = localById.get(adapted.id)
            if (local) return { ...withStar, name: local.name }
          }
          return withStar
        })
        return [...keep, ...fresh]
      })
      setFiles((prev) => {
        const starredIds = new Set(prev.filter((f) => f.starred).map((f) => f.id))
        const keep = prev.filter((f) => f.folderId !== targetId)
        const fresh = filesRes.data.map((f) => {
          const adapted = toDriveFile(f, scope, currentEmpId)
          return starredIds.has(adapted.id) ? { ...adapted, starred: true } : adapted
        })
        return [...keep, ...fresh]
      })
    } catch (e) {
      console.error('[DrivePage] refetch 실패:', e)
    }
    // 다른 사용자의 활동도 activity log에 반영되도록 polling마다 함께 갱신.
    refreshActivities()
    // 현재 열려있는 공용 파일함이 있으면 내 ACL도 갱신 — Owner가 권한을 추가/회수해도
    // 별도 새로고침 없이 쓰기·삭제 버튼 상태가 반영된다.
    const activeBoxId = snap.currentFileBoxId
      ?? (snap.currentFolderId
        ? snap.folders.find((f) => f.id === snap.currentFolderId)?.fileBoxId
        : null)
    if (activeBoxId) {
      try {
        const { data } = await fileBoxAclApi.me(Number(activeBoxId))
        setMyAclByBox((prev) => ({ ...prev, [activeBoxId]: data }))
      } catch (e) {
        console.error('[DrivePage] ACL 재조회 실패:', e)
      }
    }
  }, [user, currentEmpId, loadFavorites, refreshActivities])

  // 탭이 visible일 때만 주기적 polling — 백그라운드에선 타이머 정지, 복귀 시 즉시 1회 호출.
  useEffect(() => {
    if (!user) return
    let timer: number | undefined
    const start = () => {
      if (timer != null) return
      timer = window.setInterval(() => {
        if (document.visibilityState === 'visible') refetchVisible()
      }, VISIBLE_POLL_INTERVAL_MS)
    }
    const stop = () => {
      if (timer != null) {
        window.clearInterval(timer)
        timer = undefined
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchVisible()
        start()
      } else {
        stop()
      }
    }
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user, refetchVisible])

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
    if (!myAclByBox[fileBoxId]) {
      fileBoxAclApi.me(Number(fileBoxId))
        .then(({ data }) => setMyAclByBox((prev) => ({ ...prev, [fileBoxId]: data })))
        .catch((e) => console.error('[DrivePage] 파일함 ACL 조회 실패:', e))
    }
  }

  const activeFileBoxId = currentFileBoxId
    ?? (currentFolderId ? folders.find((f) => f.id === currentFolderId)?.fileBoxId ?? null : null)
  const currentBoxAcl: MyFileBoxAcl | null = activeFileBoxId ? myAclByBox[activeFileBoxId] ?? null : null
  const canWriteShared = !!currentBoxAcl && (currentBoxAcl.isOwner || currentBoxAcl.canWrite)
  const canDeleteShared = !!currentBoxAcl && (currentBoxAcl.isOwner || currentBoxAcl.canDelete)

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
    inflightMoveCountRef.current++
    try {
      for (const fid of payload.folderIds) {
        try { await folderApi.move(Number(fid), numericTarget) }
        catch (e) { errors.push(e) }
      }
      for (const fid of payload.fileIds) {
        try { await fileApi.move(Number(fid), numericTarget) }
        catch (e) { errors.push(e) }
      }
    } finally {
      inflightMoveCountRef.current--
    }
    if (errors.length > 0) {
      console.error('[DrivePage] 이동 실패 — 롤백:', errors)
      setFolders(snapshotFolders)
      setFiles(snapshotFiles)
      if (errors.some(isStaleItemError)) {
        showStaleAlert()
        refetchVisible()
      } else if (errors.some(isForbiddenError)) {
        handleAclForbidden()
      }
    }
    refreshActivities()
  }, [folders, files, fileBoxes, personalRootId, refreshActivities, showStaleAlert, refetchVisible, handleAclForbidden])

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
      setModal({ type: 'none' })
    } catch (e) {
      console.error('[DrivePage] 폴더 생성 실패:', e)
      setModal({
        type: 'alert',
        title: '폴더 생성 실패',
        message: extractErrorMessage(e, '폴더를 생성하지 못했습니다.'),
      })
    }
  }

  const handleRenameFolder = async (name: string) => {
    if (modal.type !== 'rename-folder') return
    const target = modal.folder
    renamingFolderIdsRef.current.add(target.id)
    try {
      await folderApi.rename(Number(target.id), name)
      setFolders((prev) => prev.map((f) => (f.id === target.id ? { ...f, name, updatedAt: new Date().toISOString() } : f)))
      refreshActivities()
      setModal({ type: 'none' })
    } catch (e) {
      console.error('[DrivePage] 폴더 이름 변경 실패:', e)
      if (isStaleItemError(e)) {
        setFolders((prev) => prev.filter((f) => f.id !== target.id))
        setFiles((prev) => prev.filter((f) => f.folderId !== target.id))
        showStaleAlert()
        refetchVisible()
      } else if (isForbiddenError(e)) {
        handleAclForbidden()
      } else {
        setModal({
          type: 'alert',
          title: '이름 변경 실패',
          message: extractErrorMessage(e, '폴더 이름을 변경하지 못했습니다.'),
        })
      }
    } finally {
      renamingFolderIdsRef.current.delete(target.id)
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
          setModal({ type: 'none' })
        } catch (e) {
          if (isStaleItemError(e)) {
            setFolders((prev) => prev.filter((f) => f.id !== folder.id))
            setFiles((prev) => prev.filter((f) => f.folderId !== folder.id))
            showStaleAlert()
            refetchVisible()
          } else if (isForbiddenError(e)) {
            setModal({ type: 'none' })
            handleAclForbidden()
          } else {
            console.error('[DrivePage] 폴더 삭제 실패:', e)
            setModal({ type: 'none' })
          }
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

  const handleCreateSharedFolder = async (name: string) => {
    const ctx = resolveParentForCreate()
    if (!ctx || ctx.scope !== 'shared') return
    try {
      const { data } = await folderApi.create({ name, type: ctx.type, parentFolderId: ctx.parentId })
      setFolders((prev) => [...prev, toDriveFolder(data, 'shared', ctx.fileBoxId)])
      refreshActivities()
      setModal({ type: 'none' })
    } catch (e) {
      console.error('[DrivePage] 공용 폴더 생성 실패:', e)
      if (isForbiddenError(e)) {
        setModal({ type: 'none' })
        handleAclForbidden()
      } else {
        setModal({
          type: 'alert',
          title: '폴더 생성 실패',
          message: extractErrorMessage(e, '폴더를 생성하지 못했습니다.'),
        })
      }
    }
  }

  const handleCreateFileBox = async (name: string) => {
    try {
      const { data } = await folderApi.create({ name, type: 'COMPANY', parentFolderId: null })
      const box = { ...toFileBox(data), isSystemDefault: false }
      setFileBoxes((prev) => [...prev, box])
      setFileBoxTypes((prev) => ({ ...prev, [String(data.folderId)]: data.type }))
      refreshActivities()
      setModal({ type: 'none' })
    } catch (e) {
      console.error('[DrivePage] 파일함 생성 실패:', e)
      setModal({
        type: 'alert',
        title: '파일함 생성 실패',
        message: extractErrorMessage(e, '파일함을 생성하지 못했습니다.'),
      })
    }
  }

  const handleEditFileBox = (name: string) => {
    if (modal.type !== 'edit-filebox') return
    if (modal.fileBox.isSystemDefault) {
      console.warn('[DrivePage] 시스템 기본 파일함은 수정할 수 없습니다.')
      setModal({ type: 'none' })
      return
    }
    setFileBoxes((prev) => prev.map((b) =>
      b.id === modal.fileBox.id
        ? { ...b, name, updatedAt: new Date().toISOString() }
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
      onConfirm: async () => {
        try {
          await folderApi.softDelete(Number(box.id))
          setFileBoxes((prev) => prev.filter((b) => b.id !== box.id))
          setFolders((prev) => prev.map((f) => (f.fileBoxId === box.id ? { ...f, deleted: true } : f)))
          setFiles((prev) => prev.map((f) => {
            const folder = folders.find((fo) => fo.id === f.folderId)
            return folder?.fileBoxId === box.id ? { ...f, deleted: true } : f
          }))
          if (currentFileBoxId === box.id) {
            setCurrentFileBoxId(null)
          }
          refreshActivities()
          setModal({ type: 'none' })
        } catch (e) {
          if (isStaleItemError(e)) {
            setFileBoxes((prev) => prev.filter((b) => b.id !== box.id))
            if (currentFileBoxId === box.id) setCurrentFileBoxId(null)
            showStaleAlert()
            refetchVisible()
          } else {
            console.error('[DrivePage] 파일함 삭제 실패:', e)
            setModal({ type: 'none' })
          }
        }
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
    let forbiddenShown = false
    for (const f of uploadedFiles) {
      try {
        const created = await uploadFile(target.folderId, f)
        setFiles((prev) => [...prev, toDriveFile(created, target.scope, currentEmpId)])
        refreshActivities()
      } catch (e) {
        console.error('[DrivePage] 파일 업로드 실패:', f.name, e)
        if (isForbiddenError(e) && !forbiddenShown) {
          forbiddenShown = true
          handleAclForbidden()
          break
        }
      }
    }
  }

  const handleDeleteFile = async (file: DriveFile) => {
    try {
      await fileApi.softDelete(Number(file.id))
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, deleted: true } : f)))
      refreshActivities()
    } catch (e) {
      if (isStaleItemError(e)) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id))
        showStaleAlert()
        refetchVisible()
      } else if (isForbiddenError(e)) {
        handleAclForbidden()
      } else {
        console.error('[DrivePage] 파일 삭제 실패:', e)
      }
    }
  }

  const handleDownloadFile = async (file: DriveFile) => {
    try {
      const { data } = await fileApi.generateDownloadUrl(Number(file.id))
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer')
      refreshActivities()
    } catch (e) {
      if (isStaleItemError(e)) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id))
        showStaleAlert()
        refetchVisible()
      } else if (isForbiddenError(e)) {
        handleAclForbidden()
      } else {
        console.error('[DrivePage] 파일 다운로드 실패:', e)
      }
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
  const starredFiles = files.filter((f) => !f.deleted && f.starred)
  const recentFiles = [...files].filter((f) => !f.deleted)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)
  const totalSize = files.filter((f) => !f.deleted).reduce((s, f) => s + f.size, 0)
  const trashSize = files.filter((f) => f.deleted).reduce((s, f) => s + f.size, 0)

  const viewTitles: Record<DriveView, string> = {
    home: '홈', favorites: '즐겨찾기', 'my-drive': '내 파일',
    shared: '공용 파일함', trash: '휴지통', recent: '최근 열람', 'recent-updated': '최근 수정',
    'acl-manage': '파일함 권한 관리',
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

  const ownsAnyFileBox = fileBoxes.some(
    (b) => !b.deleted && !b.isSystemDefault && b.createdBy === String(currentEmpId),
  )
  const canViewAclTab = isFileBoxAdmin || ownsAnyFileBox

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
        canCreateFileBox={isFileBoxAdmin}
        canManageFileBox={isFileBoxAdmin}
        canViewAclTab={canViewAclTab}
      />

      {currentView === 'acl-manage' && canViewAclTab ? (
        <FileBoxAclPage
          fileBoxes={fileBoxes}
          currentUserEmpId={currentEmpId}
        />
      ) : (
      <FileGrid
        folders={displayFolders}
        files={displayFiles}
        starredFolders={starredFolders}
        starredFiles={starredFiles}
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
        sharedWriteLocked={isShared && !canWriteShared}
        sharedDeleteLocked={isShared && !canDeleteShared}
        onCreateSharedFolder={() => setModal({ type: 'create-shared-folder' })}
        onViewFavorites={() => handleChangeView('favorites')}
        recentFiles={recentFiles}
        onViewRecent={() => handleChangeView('recent')}
      />
      )}

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
      {modal.type === 'preview' && (
        <FilePreviewModal file={modal.file} onClose={() => setModal({ type: 'none' })} onDownload={handleDownloadFile} />
      )}
      {modal.type === 'confirm' && (
        <ConfirmModal
          title={modal.title} message={modal.message} confirmLabel={modal.confirmLabel}
          danger={modal.danger} onClose={() => setModal({ type: 'none' })} onConfirm={modal.onConfirm}
        />
      )}
      {modal.type === 'alert' && (
        <AlertModal
          title={modal.title}
          message={modal.message}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </div>
  )
}
