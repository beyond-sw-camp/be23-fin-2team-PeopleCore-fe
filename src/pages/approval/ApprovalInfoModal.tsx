import { useState, useRef, useEffect, type ReactNode } from 'react'
import { type OrgMember } from './approvalTypes'
import { useAuth } from '../../contexts/AuthContext'
import { departmentApi } from '../../api/org'
import type { ApprovalLineResponse } from '../../api/approval'
import { attendanceApi } from '../../api/attendance'
import AlertModal from '../../components/common/AlertModal'

interface SavedApprovalLine {
  name: string
  members: OrgMember[]
}

interface SavedGroup {
  name: string
  members: OrgMember[]
}

/* ── Props ── */
interface ApprovalInfoModalProps {
  isOpen: boolean
  onClose: () => void
  approvers: OrgMember[]
  ccList: OrgMember[]
  viewers: OrgMember[]
  onSave: (approvers: OrgMember[], ccList: OrgMember[], viewers: OrgMember[]) => void
  readOnly?: boolean
  approvalLines?: ApprovalLineResponse[]
  /** 양식 코드 — ATTENDANCE_MODIFY일 때 HR 사원 뱃지 + 필수 검증 */
  formCode?: string
}

type TabKey = '결재선' | '참조자' | '열람자'

interface OrgDepartment {
  name: string
  deptId: number
  members: OrgMember[]
}

/**
 * 결재선 lineStep 정규화.
 * - 인접한 lineStep 값이 같으면 같은 묶음(병렬), 다르면 다음 단계(순차).
 * - lineStep 이 비어있는 멤버는 임시로 인덱스+1 을 부여해 모두 분리된 단계로 시작.
 * - 결과는 1부터 시작하는 dense 한 step 으로 재할당.
 */
function reflowApproverSteps(list: OrgMember[]): OrgMember[] {
  const seeded = list.map((m, i) => (m.lineStep != null ? m : { ...m, lineStep: i + 1 }))
  let cur = 0
  let prev: number | null = null
  return seeded.map((m) => {
    if (prev === null || m.lineStep !== prev) cur += 1
    prev = m.lineStep ?? null
    return { ...m, lineStep: cur }
  })
}

export default function ApprovalInfoModal({
  isOpen,
  onClose,
  approvers: initApprovers,
  ccList: initCcList,
  viewers: initViewers,
  onSave,
  readOnly = false,
  approvalLines: approvalLinesData = [],
  formCode,
}: ApprovalInfoModalProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('결재선')
  const [approvers, setApprovers] = useState<OrgMember[]>(() => reflowApproverSteps(initApprovers))
  const [ccList, setCcList] = useState<OrgMember[]>(initCcList)
  const [viewers, setViewers] = useState<OrgMember[]>(initViewers)
  const [search, setSearch] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({})
  const [companyExpanded, setCompanyExpanded] = useState(true)

  // API에서 조직도 로딩
  const [orgDepartments, setOrgDepartments] = useState<OrgDepartment[]>([])
  const [orgLoading, setOrgLoading] = useState(true)

  // 저장된 결재선 / 그룹 (localStorage 연동)
  const [savedLines, setSavedLines] = useState<SavedApprovalLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('savedApprovalLines') || '[]') } catch { return [] }
  })
  const [savedCcGroups, setSavedCcGroups] = useState<SavedGroup[]>(() => {
    try { return JSON.parse(localStorage.getItem('savedCcGroups') || '[]') } catch { return [] }
  })
  const [savedViewerGroups, setSavedViewerGroups] = useState<SavedGroup[]>(() => {
    try { return JSON.parse(localStorage.getItem('savedViewerGroups') || '[]') } catch { return [] }
  })

  const [leftTab, setLeftTab] = useState<'org' | 'saved'>('org')
  const dragMemberRef = useRef<OrgMember | null>(null)
  const [isDropTarget, setIsDropTarget] = useState(false)
  // 결재선 행간 순서 변경용 - sidebar-add 드래그(dragMemberRef)와 구분
  const reorderIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const currentUser: OrgMember = {
    id: user?.empId ?? '0',
    empId: Number(user?.empId ?? 0),
    name: user?.empName ?? '사용자',
    position: '',
    department: '',
  }

  // 조직도 데이터 로딩 (departments/tree/with-members 사용)
  useEffect(() => {
    if (!isOpen) return
    departmentApi.getTreeWithMembers()
      .then(({ data: tree }) => {
        const departments: OrgDepartment[] = []

        function flatten(node: import('../../api/org').OrgChartNode) {
          const members: OrgMember[] = node.members.map((m) => ({
            id: String(m.empId),
            empId: m.empId,
            name: m.empName,
            position: m.gradeName,
            department: node.deptName,
            deptId: node.id,
            grade: m.gradeName,
            title: m.titleName ?? undefined,
          }))
          if (members.length > 0) {
            departments.push({ name: node.deptName, deptId: node.id, members })
          }
          for (const child of node.children ?? []) {
            flatten(child)
          }
        }

        for (const node of tree) {
          flatten(node)
        }

        setOrgDepartments(departments)
        const expanded: Record<string, boolean> = {}
        departments.forEach((d) => { expanded[d.name] = true })
        setExpandedDepts(expanded)
      })
      .catch(() => setOrgDepartments([]))
      .finally(() => setOrgLoading(false))
  }, [isOpen])

  // 결재선에 HR(HR_ADMIN/HR_SUPER_ADMIN) 포함 필수인 양식 — 백엔드 validateHrApproverIncluded()와 동일 스코프
  const isHrRequired = formCode === 'ATTENDANCE_MODIFY' || formCode === 'VACATION_GRANT_REQUEST'
  const [hrMemberIds, setHrMemberIds] = useState<Set<number>>(new Set())
  const [showHrAlert, setShowHrAlert] = useState(false)
  useEffect(() => {
    if (!isOpen || !isHrRequired) return
    attendanceApi.getAttendanceModifyHrMembers()
      .then((res) => setHrMemberIds(new Set(res.hrMembers.map((m) => m.empId))))
      .catch(() => setHrMemberIds(new Set()))
  }, [isOpen, isHrRequired])

  if (!isOpen) return null

  const toggleDept = (name: string) =>
    setExpandedDepts((prev) => ({ ...prev, [name]: !prev[name] }))

  const matchesSearch = (m: OrgMember) =>
    !search || m.name.includes(search) || m.position.includes(search) || m.department.includes(search)

  /* ── 사람 추가/삭제 ── */
  const addPerson = (member: OrgMember) => {
    // 자기 자신은 결재자로 추가 불가
    if (tab === '결재선' && String(member.empId) === String(currentUser.empId)) return
    // 중복 방지 (결재선·참조자·열람자 전체에서 확인)
    const allSelected = [...approvers, ...ccList, ...viewers]
    if (allSelected.find((a) => a.id === member.id)) return

    if (tab === '결재선') {
      setApprovers((prev) => {
        const nextStep = (prev.reduce((mx, m) => Math.max(mx, m.lineStep ?? 0), 0)) + 1
        return reflowApproverSteps([...prev, { ...member, lineStep: nextStep }])
      })
    }
    else if (tab === '참조자') setCcList((prev) => [...prev, member])
    else setViewers((prev) => [...prev, member])
  }

  const removePerson = (id: string) => {
    if (tab === '결재선') setApprovers((prev) => reflowApproverSteps(prev.filter((a) => a.id !== id)))
    else if (tab === '참조자') setCcList((prev) => prev.filter((a) => a.id !== id))
    else setViewers((prev) => prev.filter((a) => a.id !== id))
  }

  /* ── 묶음(병렬 그룹) 토글 / 일괄 프리셋 ── */
  const mergeWithPrev = (idx: number) => {
    if (idx <= 0) return
    setApprovers((prev) => {
      const next = prev.map((m, i) =>
        i === idx ? { ...m, lineStep: prev[idx - 1].lineStep } : m,
      )
      return reflowApproverSteps(next)
    })
  }
  const splitFromPrev = (idx: number) => {
    if (idx <= 0) return
    setApprovers((prev) => {
      // idx 와 그 뒤에 같은 묶음으로 묶여있던 모든 행을 새 단계로 분리
      const oldStep = prev[idx].lineStep
      const maxStep = prev.reduce((mx, m) => Math.max(mx, m.lineStep ?? 0), 0)
      const next = prev.map((m, i) =>
        i >= idx && m.lineStep === oldStep ? { ...m, lineStep: maxStep + 1 } : m,
      )
      return reflowApproverSteps(next)
    })
  }
  const applyAllSequential = () =>
    setApprovers((prev) => prev.map((m, i) => ({ ...m, lineStep: i + 1 })))
  const applyAllParallel = () =>
    setApprovers((prev) => prev.map((m) => ({ ...m, lineStep: 1 })))

  // 라디오 표시용 — 모든 결재자가 같은 step 이면 병렬, 모두 다른 step 이면 순차, 그 외엔 사용자정의(둘 다 미선택)
  const consensusPreset: '순차합의' | '병렬합의' | null = (() => {
    if (approvers.length <= 1) return '순차합의'
    const steps = approvers.map((m) => m.lineStep ?? 0)
    if (steps.every((s) => s === steps[0])) return '병렬합의'
    if (new Set(steps).size === steps.length) return '순차합의'
    return null
  })()

  /* ── 저장 ── */
  const handleSaveLine = () => {
    if (approvers.length === 0) { alert('결재선에 사람을 추가한 후 저장하세요.'); return }
    const name = prompt('결재선 이름을 입력하세요')
    if (!name) return
    const updated = [...savedLines, { name, members: [...approvers] }]
    setSavedLines(updated)
    localStorage.setItem('savedApprovalLines', JSON.stringify(updated))
    alert(`"${name}" 결재선이 저장되었습니다.`)
  }

  const handleSaveGroup = () => {
    const list = tab === '참조자' ? ccList : viewers
    if (list.length === 0) { alert('사람을 추가한 후 저장하세요.'); return }
    const name = prompt('그룹 이름을 입력하세요')
    if (!name) return
    const group = { name, members: [...list] }
    if (tab === '참조자') {
      const updated = [...savedCcGroups, group]
      setSavedCcGroups(updated)
      localStorage.setItem('savedCcGroups', JSON.stringify(updated))
    } else {
      const updated = [...savedViewerGroups, group]
      setSavedViewerGroups(updated)
      localStorage.setItem('savedViewerGroups', JSON.stringify(updated))
    }
    alert(`"${name}" 그룹이 저장되었습니다.`)
  }

  const loadSavedLine = (line: SavedApprovalLine) => setApprovers(reflowApproverSteps([...line.members]))
  const loadSavedGroup = (group: SavedGroup) => {
    if (tab === '참조자') setCcList([...group.members])
    else setViewers([...group.members])
  }

  const currentList = tab === '결재선' ? approvers : tab === '참조자' ? ccList : viewers
  const hasUnsaved = true

  const handleDragStart = (member: OrgMember) => {
    dragMemberRef.current = member
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDropTarget(true)
  }

  const handleDragLeave = () => setIsDropTarget(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDropTarget(false)
    if (dragMemberRef.current) {
      addPerson(dragMemberRef.current)
      dragMemberRef.current = null
    }
  }

  /* ── 결재선 행 드래그 순서 변경 ── */
  const handleApproverRowDragStart = (e: React.DragEvent, idx: number) => {
    reorderIndexRef.current = idx
    dragMemberRef.current = null
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleApproverRowDragOver = (e: React.DragEvent, idx: number) => {
    if (reorderIndexRef.current === null) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(idx)
  }

  const handleApproverRowDrop = (e: React.DragEvent, targetIdx: number) => {
    if (reorderIndexRef.current === null) return
    e.preventDefault()
    e.stopPropagation()
    const from = reorderIndexRef.current
    reorderIndexRef.current = null
    setDragOverIndex(null)
    if (from === targetIdx) return
    setApprovers((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(targetIdx, 0, moved)
      return reflowApproverSteps(next)
    })
  }

  const handleApproverRowDragEnd = () => {
    reorderIndexRef.current = null
    setDragOverIndex(null)
  }

  const savedItems = tab === '결재선' ? savedLines : tab === '참조자' ? savedCcGroups : savedViewerGroups

  const orgTreeContent = (
    <div className="flex-1 overflow-y-auto p-2 text-[12px]">
      {orgLoading ? (
        <div className="text-center text-gray-400 py-8">조직도 로딩 중...</div>
      ) : (
        <>
          <div
            className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
            onClick={() => setCompanyExpanded(!companyExpanded)}
          >
            <span className="text-[10px] text-gray-500 w-3">{companyExpanded ? '▼' : '▶'}</span>
            <span className="font-semibold text-gray-800">PeopleCore</span>
            <span className="text-gray-400 text-[11px] ml-1">
              {orgDepartments.reduce((s, d) => s + d.members.length, 0)}
            </span>
          </div>

          {companyExpanded && (
            <div className="ml-3">
              {orgDepartments.map((dept) => {
                const filteredMembers = dept.members.filter(matchesSearch)
                if (search && filteredMembers.length === 0) return null
                return (
                  <div key={dept.deptId}>
                    <div
                      className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
                      onClick={() => toggleDept(dept.name)}
                    >
                      <span className="text-[10px] text-gray-500 w-3">
                        {expandedDepts[dept.name] ? '▼' : '▶'}
                      </span>
                      <span className="font-semibold text-gray-700">{dept.name}</span>
                      <span className="text-gray-400 text-[11px] ml-1">{dept.members.length}</span>
                    </div>
                    {expandedDepts[dept.name] &&
                      (search ? filteredMembers : dept.members).map((m) => {
                        const isSelf = String(m.empId) === String(currentUser.empId)
                        const isAlreadySelected = [...approvers, ...ccList, ...viewers].some((a) => a.id === m.id)
                        const isDisabled = (tab === '결재선' && isSelf) || isAlreadySelected
                        const isHr = isHrRequired && hrMemberIds.has(m.empId)
                        return (
                          <div
                            key={m.id}
                            className={`flex items-center gap-2 py-1.5 pl-6 pr-2 rounded transition-colors ${
                              isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:bg-gray-50'
                            }`}
                            draggable={!isDisabled}
                            onDragStart={() => !isDisabled && handleDragStart(m)}
                            onClick={() => !isDisabled && addPerson(m)}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                              isAlreadySelected ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-200 text-gray-500'
                            }`}>
                              <i className={isAlreadySelected ? 'fas fa-check' : 'fas fa-user'} />
                            </div>
                            <div className="leading-tight flex-1">
                              <div className="font-medium text-gray-800">
                                {m.name} {m.position}
                                {isHr && <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 font-semibold">{m.department}</span>}
                              </div>
                              <div className="text-[10px] text-gray-400">PeopleCore·{m.department}</div>
                            </div>
                            {isSelf && <span className="text-[9px] text-gray-400">본인</span>}
                            {isAlreadySelected && <span className="text-[9px] text-[#1D9E75]">선택됨</span>}
                          </div>
                        )
                      })}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )

  const savedListContent = (
    <div className="flex-1 overflow-y-auto p-3 text-[12px]">
      {savedItems.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          저장된 {tab === '결재선' ? '결재선' : '그룹'}이 없습니다.
        </div>
      ) : (
        savedItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-2 cursor-pointer rounded hover:bg-gray-50 transition-colors"
            onClick={() => tab === '결재선' ? loadSavedLine(item as SavedApprovalLine) : loadSavedGroup(item as SavedGroup)}
          >
            <span className="text-gray-700">{item.name}</span>
            <span className="text-gray-400 text-[11px]">{item.members.length}명</span>
          </div>
        ))
      )}
    </div>
  )

  /* ── readOnly: 한 화면에 결재자/참조자/열람자 전부 표시 ── */
  const statusLabel = (line?: ApprovalLineResponse) => {
    if (!line) return { text: '-', cls: 'text-gray-300' }
    switch (line.approvalLineStatus) {
      case 'APPROVED': return { text: '승인', cls: 'text-[#1D9E75] font-semibold' }
      case 'REJECTED': return { text: '반려', cls: 'text-red-500 font-semibold' }
      case 'DELEGATED': return { text: '전결', cls: 'text-[#1D9E75] font-semibold' }
      case 'PENDING': return { text: '대기', cls: 'text-gray-400' }
      case 'CANCELED': return { text: '취소', cls: 'text-gray-400 line-through' }
      default: return { text: line.approvalLineStatus, cls: 'text-gray-400' }
    }
  }

  // 결재 의견 행 스타일 — approvalLineStatus와 같은 라인의 lineComment 매핑
  const commentMeta = (line: ApprovalLineResponse) => {
    switch (line.approvalLineStatus) {
      case 'APPROVED': return { label: '승인 의견', wrap: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' }
      case 'REJECTED': return { label: '반려 사유', wrap: 'bg-red-50 border-red-100', text: 'text-red-600' }
      case 'DELEGATED': return { label: '전결 의견', wrap: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' }
      default: return null
    }
  }

  const formatTime = (dt: string | null | undefined) => dt ? dt.replace('T', ' ').slice(0, 16) : '-'

  if (readOnly) {
    const approverLines = approvalLinesData.filter((l) => l.approvalRole === 'APPROVER')
    const ccLines = approvalLinesData.filter((l) => l.approvalRole === 'REFERENCE')
    const viewerLines = approvalLinesData.filter((l) => l.approvalRole === 'VIEWER')

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-[580px] max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-[16px] font-bold text-gray-900">결재 정보</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* 결재선 */}
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-2">결재선</h3>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">구분</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">이름</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">부서</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">상태</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-medium">처리일시</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-3 py-2.5 text-[11px] text-[#1D9E75] font-semibold">기안</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{currentUser.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{currentUser.department}</td>
                    <td className="px-3 py-2.5 text-center text-[11px] text-gray-400">기안자</td>
                    <td className="px-3 py-2.5 text-right text-[11px] text-gray-400">-</td>
                  </tr>
                  {approverLines.length > 0 ? approverLines.flatMap((line) => {
                    const s = statusLabel(line)
                    const cm = commentMeta(line)
                    const hasComment = !!cm && !!line.lineComment
                    return [
                      <tr key={`row-${line.lineId}`} className={hasComment ? '' : 'border-b border-gray-100'}>
                        <td className="px-3 py-2.5 text-[11px] text-yellow-600 font-semibold">승인</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">{line.empName} <span className="text-gray-400 font-normal">{line.empGrade}</span></td>
                        <td className="px-3 py-2.5 text-gray-600">{line.empDeptName}</td>
                        <td className={`px-3 py-2.5 text-center text-[11px] ${s.cls}`}>{s.text}</td>
                        <td className={`px-3 py-2.5 text-right text-[11px] ${line.approvalLineStatus === 'REJECTED' ? 'text-red-500' : line.approvalLineStatus === 'CANCELED' ? 'text-gray-400 line-through' : 'text-gray-400'}`}>{formatTime(line.lineProcessedAt)}</td>
                      </tr>,
                      hasComment ? (
                        <tr key={`cmt-${line.lineId}`} className="border-b border-gray-100">
                          <td colSpan={5} className="px-3 pb-2.5">
                            <div className={`rounded-md border px-3 py-2 ${cm!.wrap}`}>
                              <div className={`text-[10px] font-semibold mb-0.5 ${cm!.text}`}>{cm!.label}</div>
                              <div className="text-[12px] text-gray-700 whitespace-pre-wrap break-words">{line.lineComment}</div>
                            </div>
                          </td>
                        </tr>
                      ) : null,
                    ]
                  }) : approvers.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="px-3 py-2.5 text-[11px] text-yellow-600 font-semibold">승인</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{m.name} <span className="text-gray-400 font-normal">{m.position}</span></td>
                      <td className="px-3 py-2.5 text-gray-600">{m.department}</td>
                      <td className="px-3 py-2.5 text-center text-[11px] text-gray-400">대기</td>
                      <td className="px-3 py-2.5 text-right text-[11px] text-gray-400">-</td>
                    </tr>
                  ))}
                  {approverLines.length === 0 && approvers.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-300 text-[12px]">결재자 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 참조자 */}
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-2">참조자</h3>
              {ccLines.length === 0 && ccList.length === 0 ? (
                <p className="text-[12px] text-gray-300 py-3 text-center">참조자 없음</p>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">이름</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">부서</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">확인일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ccLines.length > 0 ? ccLines.map((line) => (
                      <tr key={line.lineId} className="border-b border-gray-100">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{line.empName} <span className="text-gray-400 font-normal">{line.empGrade}</span></td>
                        <td className="px-3 py-2.5 text-gray-600">{line.empDeptName}</td>
                        <td className="px-3 py-2.5 text-right text-[11px] text-gray-400">{formatTime(line.lineProcessedAt)}</td>
                      </tr>
                    )) : ccList.map((m) => (
                      <tr key={m.id} className="border-b border-gray-100">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{m.name} <span className="text-gray-400 font-normal">{m.position}</span></td>
                        <td className="px-3 py-2.5 text-gray-600">{m.department}</td>
                        <td className="px-3 py-2.5 text-right text-[11px] text-gray-400">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 열람자 */}
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-2">열람자</h3>
              {viewerLines.length === 0 && viewers.length === 0 ? (
                <p className="text-[12px] text-gray-300 py-3 text-center">열람자 없음</p>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">이름</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">부서</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">열람일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewerLines.length > 0 ? viewerLines.map((line) => (
                      <tr key={line.lineId} className="border-b border-gray-100">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{line.empName} <span className="text-gray-400 font-normal">{line.empGrade}</span></td>
                        <td className="px-3 py-2.5 text-gray-600">{line.empDeptName}</td>
                        <td className="px-3 py-2.5 text-right text-[11px] text-gray-400">{formatTime(line.lineProcessedAt)}</td>
                      </tr>
                    )) : viewers.map((m) => (
                      <tr key={m.id} className="border-b border-gray-100">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{m.name} <span className="text-gray-400 font-normal">{m.position}</span></td>
                        <td className="px-3 py-2.5 text-gray-600">{m.department}</td>
                        <td className="px-3 py-2.5 text-right text-[11px] text-gray-400">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex justify-end px-6 py-4 border-t border-gray-200">
            <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── 편집 모드: 기존 탭 방식 ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-[860px] max-h-[90vh] min-h-[400px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">결재 정보</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        {/* 탭 + 미저장 경고 */}
        <div className="flex items-center justify-between px-6 pt-3">
          <div className="flex gap-4 text-[13px]">
            {(['결재선', '참조자', '열람자'] as TabKey[]).map((t) => {
              const isActive = tab === t
              const hasRequired = t === '결재선' ? approvers.length > 0 : t === '참조자' ? ccList.length > 0 : viewers.length > 0
              return (
                <button
                  key={t}
                  onClick={() => { setTab(t); setLeftTab('org'); setSearch('') }}
                  className={`pb-1 transition-colors ${isActive ? 'text-gray-900 font-bold border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {hasRequired && <span className="text-red-500 mr-0.5">*</span>}
                  {t}
                </button>
              )
            })}
          </div>
          {hasUnsaved && (
            <span className="text-[11px] text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5">
              * 저장되지 않은 정보가 있습니다.
            </span>
          )}
        </div>

        {/* 본문 */}
        <div className="flex flex-col md:flex-row px-4 sm:px-6 py-3 gap-4 flex-1 min-h-0 md:h-[450px] md:flex-none">
          {/* 왼쪽: 조직도 / 저장목록 */}
          <div className="w-full md:w-[280px] md:max-h-none max-h-[35vh] border border-gray-200 rounded-lg flex flex-col shrink-0">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setLeftTab('org')}
                className={`flex-1 py-2 text-[12px] font-medium transition-colors ${
                  leftTab === 'org' ? 'text-gray-900 bg-gray-50' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                조직도
              </button>
              <button
                onClick={() => setLeftTab('saved')}
                className={`flex-1 py-2 text-[12px] font-medium transition-colors ${
                  leftTab === 'saved' ? 'text-gray-900 bg-gray-50' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === '결재선' ? '나의 결재선' : '개인 그룹'}
              </button>
            </div>

            {leftTab === 'org' && (
              <div className="flex items-center border-b border-gray-200 px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mr-2 shrink-0">
                  <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
                  <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="이름, 직위, 직책, 직급, 부서"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-[11px] outline-none bg-transparent placeholder-gray-400"
                />
              </div>
            )}

            {leftTab === 'org' ? orgTreeContent : savedListContent}
          </div>

          {/* 오른쪽: 선택된 사람 테이블 (드롭 영역) */}
          <div
            className={`flex-1 border rounded-lg flex flex-col overflow-hidden transition-colors ${
              isDropTarget ? 'border-[#1D9E75] bg-[#f0fdf8]' : 'border-gray-200'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {tab === '결재선' ? (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-gray-500 font-medium w-12">타입</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">이름</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">부서</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium">상태</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium w-10">
                        <i className="fas fa-trash-alt text-gray-400" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="bg-yellow-50 px-4 py-1.5 text-[11px] font-semibold text-yellow-700 border-b border-yellow-100">
                        신청
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5"><span className="text-[10px] text-gray-400">&raquo;</span></td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{currentUser.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{currentUser.department}</td>
                      <td className="px-4 py-2.5 text-right"><span className="text-[11px] text-[#1D9E75] font-semibold">기안</span></td>
                      <td />
                    </tr>
                    {approvers.length === 0 ? (
                      <>
                        <tr>
                          <td colSpan={5} className="bg-yellow-50 px-4 py-1.5 text-[11px] font-semibold text-yellow-700 border-b border-yellow-100">
                            승인
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-300 text-[12px]">
                            <span className="text-gray-400">&raquo;</span> 드래그하여 결재선을 추가할 수 있습니다.
                          </td>
                        </tr>
                      </>
                    ) : (
                      approvers.flatMap((m, idx) => {
                        const isFirstInBundle = idx === 0 || approvers[idx - 1].lineStep !== m.lineStep
                        const isParallelBundle =
                          (idx > 0 && approvers[idx - 1].lineStep === m.lineStep) ||
                          (idx < approvers.length - 1 && approvers[idx + 1].lineStep === m.lineStep)
                        const rows: ReactNode[] = []
                        if (isFirstInBundle) {
                          rows.push(
                            <tr key={`step-${m.lineStep}-${m.id}`}>
                              <td colSpan={5} className="bg-yellow-50 px-4 py-1.5 text-[11px] font-semibold text-yellow-700 border-b border-yellow-100">
                                <span>{m.lineStep}단계 승인</span>
                                {isParallelBundle && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-700 font-semibold">병렬</span>
                                )}
                              </td>
                            </tr>,
                          )
                        }
                        const sameAsPrev = idx > 0 && approvers[idx - 1].lineStep === m.lineStep
                        rows.push(
                          <tr
                            key={m.id}
                            draggable={!readOnly}
                            onDragStart={(e) => !readOnly && handleApproverRowDragStart(e, idx)}
                            onDragOver={(e) => !readOnly && handleApproverRowDragOver(e, idx)}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => !readOnly && handleApproverRowDrop(e, idx)}
                            onDragEnd={handleApproverRowDragEnd}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${!readOnly ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === idx ? 'bg-emerald-50' : ''}`}
                          >
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1D9E75] text-white text-[10px] font-semibold">{m.lineStep}</span>
                            </td>
                            <td className="px-4 py-2.5 font-medium text-gray-800">
                              {!readOnly && <i className="fas fa-grip-vertical text-gray-300 mr-2 text-[10px]" />}
                              {m.name} {m.position}
                              {isHrRequired && hrMemberIds.has(m.empId) && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 font-semibold">{m.department}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">{m.department}</td>
                            <td className="px-4 py-2.5 text-right">
                              {idx > 0 && !readOnly ? (
                                sameAsPrev ? (
                                  <button
                                    onClick={() => splitFromPrev(idx)}
                                    title="이전 단계와 분리"
                                    className="text-[10px] text-gray-500 hover:text-[#1D9E75] border border-gray-200 hover:border-[#1D9E75] rounded px-1.5 py-0.5 transition-colors"
                                  >
                                    <i className="fas fa-arrow-down mr-1" />다음 단계로
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => mergeWithPrev(idx)}
                                    title="이전 단계와 병렬로 묶기"
                                    className="text-[10px] text-gray-500 hover:text-[#1D9E75] border border-gray-200 hover:border-[#1D9E75] rounded px-1.5 py-0.5 transition-colors"
                                  >
                                    <i className="fas fa-arrow-up mr-1" />이전과 병렬
                                  </button>
                                )
                              ) : (
                                <span className="text-[11px] text-gray-400">결재 예정</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button onClick={() => removePerson(m.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <i className="fas fa-times" />
                              </button>
                            </td>
                          </tr>,
                        )
                        return rows
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">이름</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">부서</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium">확인시간</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium w-10">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-300 text-[12px]">
                          <span className="text-gray-400">&raquo;</span> 드래그하여 항목을 추가할 수 있습니다.
                        </td>
                      </tr>
                    ) : (
                      currentList.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{m.name} {m.position}</td>
                          <td className="px-4 py-2.5 text-gray-600">{m.department}</td>
                          <td className="px-4 py-2.5 text-right text-gray-400">-</td>
                          <td className="px-4 py-2.5 text-right">
                            <button onClick={() => removePerson(m.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                              <i className="fas fa-times" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 하단 옵션 */}
            <div className="border-t border-gray-200 px-4 py-2.5 flex items-center gap-3">
              {tab === '결재선' ? (
                <>
                  <button onClick={handleSaveLine} className="text-[11px] bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors">
                    개인 결재선으로 저장
                  </button>
                  <span className="text-[12px] text-gray-500 ml-auto">합의방식 일괄 적용 :</span>
                  <label className="flex items-center gap-1 text-[12px] text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="consensus"
                      checked={consensusPreset === '순차합의'}
                      onChange={applyAllSequential}
                      className="accent-[#1D9E75]"
                      disabled={approvers.length === 0}
                    />
                    전체 순차
                  </label>
                  <label className="flex items-center gap-1 text-[12px] text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="consensus"
                      checked={consensusPreset === '병렬합의'}
                      onChange={applyAllParallel}
                      className="accent-[#1D9E75]"
                      disabled={approvers.length === 0}
                    />
                    전체 병렬
                  </label>
                </>
              ) : (
                <button onClick={handleSaveGroup} className="text-[11px] bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors">
                  개인 그룹으로 저장
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (isHrRequired && approvers.length > 0 && !approvers.some((a) => hrMemberIds.has(a.empId))) {
                setShowHrAlert(true)
                return
              }
              onSave(approvers, ccList, viewers)
            }}
            className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors"
          >
            확인
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={showHrAlert}
        type="warning"
        title="결재선 확인"
        message={'결재선에 인사 담당자(HR_ADMIN 이상 권한)가\n1명 이상 포함되어야 합니다.'}
        onClose={() => setShowHrAlert(false)}
      />
    </div>
  )
}
