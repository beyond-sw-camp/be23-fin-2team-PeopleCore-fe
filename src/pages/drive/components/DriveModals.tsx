import { useEffect, useState } from 'react'
import type { DriveFolder, DriveFile, PermissionLevel, PermissionTarget, FileBox } from '../types'
import { FILE_TYPE_ICONS, formatBytes, formatDate } from '../types'
import { departmentApi } from '../../../api/org'
import type { OrgChartNode } from '../../../api/org'

// 가상 "회사 전체" 루트 노드의 부서 ID. 실제 부서 ID는 IDENTITY로 1 이상이라 충돌 없음.
export const COMPANY_ROOT_DEPT_ID = '0'

function flattenMembers(node: OrgChartNode): OrgChartNode['members'] {
  const list = [...node.members]
  for (const child of node.children ?? []) {
    list.push(...flattenMembers(child))
  }
  return list
}

// ── Folder Create / Rename Modal ───────────────────────
export function FolderModal({
  mode,
  folder,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'rename'
  folder?: DriveFolder
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(folder?.name || '')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">
          {mode === 'create' ? '새 폴더 만들기' : '폴더 이름 변경'}
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="폴더 이름"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--primary-color)] mb-5"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onSubmit(name.trim())
          }}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={() => name.trim() && onSubmit(name.trim())}
            disabled={!name.trim()}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            {mode === 'create' ? '만들기' : '변경'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Permission Modal ───────────────────────────────────
export function PermissionModal({
  folder,
  onClose,
  onSave,
}: {
  folder: DriveFolder
  onClose: () => void
  onSave: (folderId: string, permission: PermissionLevel) => void
}) {
  const [level, setLevel] = useState<PermissionLevel>(folder.permission)

  const options: { value: PermissionLevel; label: string; desc: string; icon: string }[] = [
    { value: 'private', label: '나만', desc: '본인만 접근 가능', icon: 'fa-solid fa-lock' },
    { value: 'team', label: '팀', desc: '같은 팀원만 접근 가능', icon: 'fa-solid fa-users' },
    { value: 'department', label: '부서', desc: '같은 부서원만 접근 가능', icon: 'fa-solid fa-building' },
    { value: 'public', label: '전체', desc: '모든 사용자 접근 가능', icon: 'fa-solid fa-globe' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[14px] font-bold text-gray-800 mb-1">폴더 권한 설정</h3>
        <p className="text-[12px] text-gray-400 mb-4">'{folder.name}' 폴더의 접근 권한을 설정합니다.</p>

        <div className="space-y-2 mb-5">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setLevel(opt.value)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                level === opt.value
                  ? 'border-[var(--primary-color)] bg-[#f0faf6]'
                  : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                level === opt.value ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <i className={`${opt.icon} text-[12px]`} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-800">{opt.label}</p>
                <p className="text-[11px] text-gray-400">{opt.desc}</p>
              </div>
              {level === opt.value && (
                <i className="fa-solid fa-check text-[var(--primary-color)] ml-auto" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={() => onSave(folder.id, level)}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// ── File Preview Modal ─────────────────────────────────
export function FilePreviewModal({
  file,
  onClose,
  onDownload,
}: {
  file: DriveFile
  onClose: () => void
  onDownload: (file: DriveFile) => void
}) {
  const typeConfig = FILE_TYPE_ICONS[file.type]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <i className={`${typeConfig.icon} text-[20px]`} style={{ color: typeConfig.color }} />
            <div>
              <h3 className="text-[14px] font-bold text-gray-800">{file.name}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatBytes(file.size)} &middot; {file.createdBy} &middot; {formatDate(file.updatedAt)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center py-16 px-8 bg-gray-50 min-h-[300px]">
          <div className="text-center">
            <i className={`${typeConfig.icon} text-6xl mb-4`} style={{ color: typeConfig.color }} />
            <p className="text-[14px] text-gray-600 font-medium">{file.name}</p>
            <p className="text-[12px] text-gray-400 mt-2">
              미리보기가 지원되지 않는 파일 형식입니다.
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              파일을 다운로드하여 확인하세요.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span><i className="fa-solid fa-shield-halved mr-1" /> {file.permission === 'owner' ? '소유자' : file.permission === 'edit' ? '편집 가능' : '읽기 전용'}</span>
          </div>
          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg text-[12px] hover:opacity-90"
          >
            <i className="fa-solid fa-download text-[11px]" />
            다운로드
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Modal ──────────────────────────────────────
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[340px] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[14px] font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-[12px] text-gray-500 mb-5 whitespace-pre-line">{message}</p>
        <div className="flex justify-center gap-2">
          <button onClick={onClose} className="px-5 py-2 text-[12px] text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-[12px] text-white rounded-lg ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--primary-color)] hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 실제 조직도 트리 노드 (재귀) ─────────────────────────
function OrgTreeNodeView({
  node,
  level,
  expandedIds,
  onToggle,
  selectedTargets,
  onToggleTarget,
  ancestorSelected = false,
}: {
  node: OrgChartNode
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  selectedTargets: PermissionTarget[]
  onToggleTarget: (target: PermissionTarget) => void
  ancestorSelected?: boolean
}) {
  const deptIdStr = String(node.id)
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(deptIdStr)
  const directMembers = node.members
  const memberCount = flattenMembers(node).length
  const isDeptSelected = selectedTargets.some((t) => t.type === 'department' && t.id === deptIdStr)
  // 본인 또는 조상 부서 중 하나라도 선택되면 사실상 선택된 것으로 간주
  const effectiveDeptSelected = isDeptSelected || ancestorSelected
  // 조상이 선택된 경우 본인 체크박스는 잠금
  const lockedByAncestor = ancestorSelected

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 cursor-pointer hover:bg-gray-50 rounded"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={() => onToggle(deptIdStr)} className="w-5 h-5 flex items-center justify-center text-gray-400">
            <i className={`fa-solid fa-chevron-right text-[9px] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <input
          type="checkbox"
          checked={effectiveDeptSelected}
          disabled={lockedByAncestor}
          onChange={() =>
            onToggleTarget({ type: 'department', id: deptIdStr, name: node.deptName, level: 'view' })
          }
          className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer disabled:opacity-50"
        />
        <i className="fa-solid fa-building text-[11px] text-gray-400" />
        <span
          className="text-[12px] text-gray-700 select-none flex-1"
          onClick={() => hasChildren && onToggle(deptIdStr)}
        >
          {node.deptName}
        </span>
        <span className="text-[10px] text-gray-400 mr-2">{memberCount}명</span>
      </div>

      {isExpanded && (
        <>
          {directMembers.map((member) => {
            const memberIdStr = String(member.empId)
            const isSelected = selectedTargets.some((t) => t.type === 'user' && t.id === memberIdStr)
            const positionLabel = member.titleName ?? member.gradeName
            return (
              <div
                key={memberIdStr}
                className="flex items-center gap-1.5 py-1 hover:bg-gray-50 rounded"
                style={{ paddingLeft: `${(level + 1) * 16 + 28}px` }}
              >
                <input
                  type="checkbox"
                  checked={isSelected || effectiveDeptSelected}
                  disabled={effectiveDeptSelected}
                  onChange={() =>
                    onToggleTarget({ type: 'user', id: memberIdStr, name: member.empName, level: 'view' })
                  }
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer disabled:opacity-50"
                />
                <i className="fa-solid fa-user text-[10px] text-gray-300" />
                <span className="text-[12px] text-gray-700">{member.empName}</span>
                <span className="text-[10px] text-gray-400">{positionLabel}</span>
              </div>
            )
          })}
          {hasChildren &&
            node.children!.map((child) => (
              <OrgTreeNodeView
                key={child.id}
                node={child}
                level={level + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                selectedTargets={selectedTargets}
                onToggleTarget={onToggleTarget}
                ancestorSelected={effectiveDeptSelected}
              />
            ))}
        </>
      )}
    </div>
  )
}

function useOrgTree(open: boolean) {
  const [tree, setTree] = useState<OrgChartNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    departmentApi.getTreeWithMembers()
      .then(({ data }) => {
        if (cancelled) return
        // 실제 부서 트리를 "회사 전체" 가상 루트로 감싼다
        const wrapped: OrgChartNode[] = [{
          id: Number(COMPANY_ROOT_DEPT_ID),
          deptName: '회사 전체',
          deptCode: 'COMPANY',
          members: [],
          children: data,
        }]
        setTree(wrapped)
        // 회사 루트와 그 직속 부서들은 기본으로 펼침
        const initialExpanded = new Set<string>([COMPANY_ROOT_DEPT_ID])
        data.forEach((n) => initialExpanded.add(String(n.id)))
        setExpandedIds(initialExpanded)
      })
      .catch((e) => console.error('[DriveModals] 조직도 조회 실패:', e))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return { tree, loading, expandedIds, toggle }
}

export function FileBoxModal({
  mode = 'create',
  fileBox,
  onClose,
  onSubmit,
}: {
  mode?: 'create' | 'edit'
  fileBox?: FileBox
  onClose: () => void
  onSubmit: (name: string, targets: PermissionTarget[]) => void
}) {
  const [name, setName] = useState(fileBox?.name || '')
  const [targets, setTargets] = useState<PermissionTarget[]>(fileBox?.permissionTargets || [])
  const { tree, loading, expandedIds, toggle: handleToggleExpand } = useOrgTree(true)

  const handleToggleTarget = (target: PermissionTarget) => {
    setTargets((prev) => {
      const exists = prev.find((t) => t.type === target.type && t.id === target.id)
      if (exists) return prev.filter((t) => !(t.type === target.type && t.id === target.id))
      return [...prev, target]
    })
  }

  const handleChangeLevel = (target: PermissionTarget, level: 'view' | 'edit') => {
    setTargets((prev) =>
      prev.map((t) => (t.type === target.type && t.id === target.id ? { ...t, level } : t)),
    )
  }

  const handleRemoveTarget = (target: PermissionTarget) => {
    setTargets((prev) => prev.filter((t) => !(t.type === target.type && t.id === target.id)))
  }

  const canSubmit = name.trim() && targets.length > 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-800">{mode === 'edit' ? '파일함 수정' : '새 파일함 만들기'}</h3>
          <p className="text-[12px] text-gray-400 mt-1">{mode === 'edit' ? '파일함 정보를 수정합니다.' : '파일함을 생성하고 접근 대상을 지정하세요.'}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">파일함 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 개발팀 파일함"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--primary-color)]"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">접근 대상 선택</label>
            <div className="border border-gray-200 rounded-lg max-h-[220px] overflow-y-auto py-1">
              {loading ? (
                <div className="text-center text-[12px] text-gray-400 py-6">조직도 불러오는 중...</div>
              ) : tree.length === 0 ? (
                <div className="text-center text-[12px] text-gray-400 py-6">조직도가 없습니다.</div>
              ) : (
                tree.map((node) => (
                  <OrgTreeNodeView
                    key={node.id}
                    node={node}
                    level={0}
                    expandedIds={expandedIds}
                    onToggle={handleToggleExpand}
                    selectedTargets={targets}
                    onToggleTarget={handleToggleTarget}
                  />
                ))
              )}
            </div>
          </div>

          {targets.length > 0 && (
            <div>
              <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
                선택된 대상 <span className="text-[var(--primary-color)]">{targets.length}</span>
              </label>
              <div className="space-y-1.5">
                {targets.map((target) => (
                  <div
                    key={`${target.type}-${target.id}`}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <i className={`text-[11px] text-gray-400 ${target.type === 'department' ? 'fa-solid fa-building' : 'fa-solid fa-user'}`} />
                    <span className="text-[12px] text-gray-700 flex-1">{target.name}</span>
                    <select
                      value={target.level}
                      onChange={(e) => handleChangeLevel(target, e.target.value as 'view' | 'edit')}
                      className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:border-[var(--primary-color)]"
                    >
                      <option value="view">열람</option>
                      <option value="edit">편집</option>
                    </select>
                    <button
                      onClick={() => handleRemoveTarget(target)}
                      className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400"
                    >
                      <i className="fa-solid fa-xmark text-[9px]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={() => canSubmit && onSubmit(name.trim(), targets)}
            disabled={!canSubmit}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            {mode === 'edit' ? '저장' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SharedFolderModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (name: string, targets: PermissionTarget[]) => void
}) {
  const [name, setName] = useState('')
  const [targets, setTargets] = useState<PermissionTarget[]>([])
  const { tree, loading, expandedIds, toggle: handleToggleExpand } = useOrgTree(true)

  const handleToggleTarget = (target: PermissionTarget) => {
    setTargets((prev) => {
      const exists = prev.find((t) => t.type === target.type && t.id === target.id)
      if (exists) return prev.filter((t) => !(t.type === target.type && t.id === target.id))
      return [...prev, target]
    })
  }

  const handleChangeLevel = (target: PermissionTarget, level: 'view' | 'edit') => {
    setTargets((prev) =>
      prev.map((t) => (t.type === target.type && t.id === target.id ? { ...t, level } : t)),
    )
  }

  const handleRemoveTarget = (target: PermissionTarget) => {
    setTargets((prev) => prev.filter((t) => !(t.type === target.type && t.id === target.id)))
  }

  const canSubmit = name.trim() && targets.length > 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-800">새 공용 폴더</h3>
          <p className="text-[12px] text-gray-400 mt-1">폴더를 생성하고 조직도에서 공유 대상을 선택하세요.</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Folder name */}
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">폴더 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="공용 폴더 이름을 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--primary-color)]"
              autoFocus
            />
          </div>

          {/* Org tree picker */}
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">공유 대상 선택</label>
            <div className="border border-gray-200 rounded-lg max-h-[220px] overflow-y-auto py-1">
              {loading ? (
                <div className="text-center text-[12px] text-gray-400 py-6">조직도 불러오는 중...</div>
              ) : tree.length === 0 ? (
                <div className="text-center text-[12px] text-gray-400 py-6">조직도가 없습니다.</div>
              ) : (
                tree.map((node) => (
                  <OrgTreeNodeView
                    key={node.id}
                    node={node}
                    level={0}
                    expandedIds={expandedIds}
                    onToggle={handleToggleExpand}
                    selectedTargets={targets}
                    onToggleTarget={handleToggleTarget}
                  />
                ))
              )}
            </div>
          </div>

          {/* Selected targets */}
          {targets.length > 0 && (
            <div>
              <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
                선택된 대상 <span className="text-[var(--primary-color)]">{targets.length}</span>
              </label>
              <div className="space-y-1.5">
                {targets.map((target) => (
                  <div
                    key={`${target.type}-${target.id}`}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <i className={`text-[11px] text-gray-400 ${target.type === 'department' ? 'fa-solid fa-building' : 'fa-solid fa-user'}`} />
                    <span className="text-[12px] text-gray-700 flex-1">{target.name}</span>
                    <select
                      value={target.level}
                      onChange={(e) => handleChangeLevel(target, e.target.value as 'view' | 'edit')}
                      className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:border-[var(--primary-color)]"
                    >
                      <option value="view">열람</option>
                      <option value="edit">편집</option>
                    </select>
                    <button
                      onClick={() => handleRemoveTarget(target)}
                      className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400"
                    >
                      <i className="fa-solid fa-xmark text-[9px]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={() => canSubmit && onSubmit(name.trim(), targets)}
            disabled={!canSubmit}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  )
}
