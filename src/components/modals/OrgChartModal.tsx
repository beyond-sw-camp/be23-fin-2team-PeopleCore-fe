import { useState, useRef, useCallback, useEffect } from 'react'
import { departmentApi } from '../../api/org'
import type { OrgChartNode } from '../../api/org'
import { resolveProfileImageUrl } from '../../utils/profileImage'

interface Department {
  id: string
  name: string
  children?: Department[]
}

interface Member {
  id: string
  empNum: string
  name: string
  position: string // titleName (직책)
  rank: string // gradeName (직급)
  email: string
  phone: string
  department: string
  departmentId: string
  profileColor: string
  profileImageUrl: string | null
}

const PROFILE_COLORS = ['#4CAF50','#2196F3','#FF9800','#9C27B0','#F44336','#00BCD4','#795548','#E91E63','#3F51B5','#009688','#FF5722','#607D8B','#CDDC39','#FFC107','#8BC34A']

function getAllDescendantIds(dept: Department): string[] {
  const ids = [dept.id]
  if (dept.children) {
    for (const child of dept.children) {
      ids.push(...getAllDescendantIds(child))
    }
  }
  return ids
}

function DeptTreeItem({
  dept,
  level,
  expandedIds,
  onToggle,
  selectedMemberId,
  onSelectMember,
  members,
}: {
  dept: Department
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  selectedMemberId: string | null
  onSelectMember: (member: Member) => void
  members: Member[]
}) {
  const hasChildren = dept.children && dept.children.length > 0
  const isExpanded = expandedIds.has(dept.id)

  const deptIds = getAllDescendantIds(dept)
  const count = members.filter((m) => deptIds.includes(m.departmentId)).length
  const directMembers = members.filter((m) => m.departmentId === dept.id)

  return (
    <div>
      {/* Department row */}
      <div
        data-dept-id={dept.id}
        className="flex items-center gap-1.5 py-[6px] cursor-pointer text-[13px] transition-colors text-gray-600 hover:bg-gray-50 select-none"
        style={{ paddingLeft: `${8 + level * 18}px`, paddingRight: '8px' }}
        onClick={() => onToggle(dept.id)}
      >
        {hasChildren || directMembers.length > 0 ? (
          <i
            className={`fa-solid fa-chevron-right text-[9px] transition-transform w-3 ${
              isExpanded ? 'rotate-90' : ''
            } text-gray-400`}
          />
        ) : (
          <span className="w-3" />
        )}
        <span className="flex-1 truncate font-medium">{dept.name}</span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <i className="fa-solid fa-user text-[9px]" />
          {count}
        </span>
      </div>

      {/* Members first, then children departments */}
      {isExpanded && (
        <div>
          {/* Members directly in this department */}
          {directMembers.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-2.5 py-[5px] cursor-pointer transition-colors text-[12px] ${
                selectedMemberId === member.id
                  ? 'bg-[#eaf6f0]'
                  : 'hover:bg-gray-50'
              }`}
              style={{ paddingLeft: `${26 + level * 18}px`, paddingRight: '8px' }}
              onClick={() => onSelectMember(member)}
              data-emp-id={member.id}
            >
              {(() => {
                const src = resolveProfileImageUrl(member.profileImageUrl)
                return src ? (
                  <img src={src} alt={member.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: member.profileColor }}
                  >
                    {member.name.slice(-2)}
                  </div>
                )
              })()}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-800 text-[12px]">{member.name}</span>
                  <span className="text-[10px] text-gray-400">{member.rank}</span>
                </div>
              </div>
            </div>
          ))}
          {/* Children departments */}
          {hasChildren &&
            dept.children!.map((child) => (
              <DeptTreeItem
                key={child.id}
                dept={child}
                level={level + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                selectedMemberId={selectedMemberId}
                onSelectMember={onSelectMember}
                members={members}
              />
            ))}
        </div>
      )}
    </div>
  )
}

interface OrgChartModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenMessenger?: (userId: string, userName: string) => void
  initialEmpId?: string
  initialDeptId?: string
}

function findDeptAncestors(depts: Department[], targetId: string, path: string[] = []): string[] | null {
  for (const dept of depts) {
    const current = [...path, dept.id]
    if (dept.id === targetId) return current
    if (dept.children) {
      const found = findDeptAncestors(dept.children, targetId, current)
      if (found) return found
    }
  }
  return null
}

const MIN_WIDTH = 320
const MAX_WIDTH = 600
const MIN_HEIGHT = 400
const MAX_HEIGHT_OFFSET = 64

export default function OrgChartModal({ isOpen, onClose, onOpenMessenger, initialEmpId, initialDeptId }: OrgChartModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [size, setSize] = useState({ width: 360, height: 550 })
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  // API에서 조직도 데이터 로드 (부서 + 사원 한 번에)
  useEffect(() => {
    if (!isOpen) return

    departmentApi.getTreeWithMembers().then(({ data }) => {
      let memberIndex = 0

      const convertTree = (nodes: OrgChartNode[]): Department[] =>
        nodes.map(n => {
          const id = String(n.id)
          return { id, name: n.deptName, children: n.children?.length ? convertTree(n.children) : undefined }
        })

      const collectMembers = (nodes: OrgChartNode[]): Member[] => {
        const result: Member[] = []
        for (const n of nodes) {
          for (const m of n.members) {
            result.push({
              id: String(m.empId),
              empNum: m.empNum || '',
              name: m.empName,
              position: m.titleName || '팀원',
              rank: m.gradeName,
              email: m.empEmail || '',
              phone: m.empPhone || '',
              department: n.deptName,
              departmentId: String(n.id),
              profileColor: PROFILE_COLORS[memberIndex++ % PROFILE_COLORS.length],
              profileImageUrl: m.profileImageUrl,
            })
          }
          if (n.children?.length) {
            result.push(...collectMembers(n.children))
          }
        }
        return result
      }

      const companyName = localStorage.getItem('companyName') || 'PeopleCore'
      const tree = convertTree(data)
      setDepartments([{ id: 'company-root', name: companyName, children: tree }])

      const rootIds = new Set(['company-root', ...tree.map(d => d.id)])
      setExpandedIds(rootIds)

      setMembers(collectMembers(data))
    }).catch(() => {})
  }, [isOpen])

  // 검색 결과에서 진입: 특정 사원/부서 초기 선택 + 해당 위치로 스크롤
  useEffect(() => {
    if (!isOpen || departments.length === 0) return
    let scrollSelector: string | null = null
    if (initialEmpId) {
      const member = members.find((m) => m.id === initialEmpId)
      if (member) {
        const ancestors = findDeptAncestors(departments, member.departmentId)
        if (ancestors) setExpandedIds((prev) => new Set([...prev, ...ancestors]))
        setSelectedMember(member)
        scrollSelector = `[data-emp-id="${CSS.escape(member.id)}"]`
      }
    } else if (initialDeptId) {
      const ancestors = findDeptAncestors(departments, initialDeptId)
      if (ancestors) setExpandedIds((prev) => new Set([...prev, ...ancestors]))
      setSelectedMember(null)
      scrollSelector = `[data-dept-id="${CSS.escape(initialDeptId)}"]`
    }
    if (scrollSelector) {
      const sel = scrollSelector
      requestAnimationFrame(() => {
        const el = document.querySelector(sel) as HTMLElement | null
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
     
  }, [isOpen, departments, members, initialEmpId, initialDeptId])

  const handleMouseDown = useCallback((edge: 'right' | 'top' | 'corner') => (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.width
    const startH = size.height
    dragRef.current = { startX, startY, startW, startH }

    const maxHeight = window.innerHeight - MAX_HEIGHT_OFFSET

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      let newW = dragRef.current.startW
      let newH = dragRef.current.startH

      if (edge === 'right' || edge === 'corner') {
        newW = dragRef.current.startW + (ev.clientX - dragRef.current.startX)
      }
      if (edge === 'top' || edge === 'corner') {
        newH = dragRef.current.startH - (ev.clientY - dragRef.current.startY)
      }

      setSize({
        width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newW)),
        height: Math.max(MIN_HEIGHT, Math.min(maxHeight, newH)),
      })
    }

    const onMouseUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [size])

  if (!isOpen) return null

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filter departments/members by search
  const filteredMembers = searchQuery
    ? members.filter(
        (m) =>
          m.name.includes(searchQuery) ||
          m.empNum.includes(searchQuery) ||
          m.position.includes(searchQuery) ||
          m.rank.includes(searchQuery) ||
          m.department.includes(searchQuery) ||
          m.phone.includes(searchQuery) ||
          m.email.includes(searchQuery)
      )
    : null

  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Left-bottom: Org tree panel */}
      <div
        className="fixed left-[196px] bottom-0 z-50 bg-white rounded-tr-2xl shadow-2xl border border-gray-200 flex flex-col"
        style={{ width: `${size.width}px`, height: `${size.height}px` }}
      >
        {/* Resize handles */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize hover:bg-[var(--primary-color)]/10 transition-colors rounded-t-2xl"
          onMouseDown={handleMouseDown('top')}
        />
        <div
          className="absolute top-0 right-0 bottom-0 w-1.5 cursor-e-resize hover:bg-[var(--primary-color)]/10 transition-colors rounded-r-2xl"
          onMouseDown={handleMouseDown('right')}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-10"
          onMouseDown={handleMouseDown('corner')}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 className="text-[14px] font-bold text-gray-800">조직도</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-gray-100 shrink-0">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 직위, 직책, 직급, 부서, 전화, 아이디"
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-[6px] text-[12px] focus:outline-none focus:border-[var(--primary-color)] bg-[#f9fafb]"
            />
          </div>
        </div>

        {/* Tree or search results */}
        <div className="overflow-y-auto flex-1 py-1 min-h-0" onMouseDown={() => { (document.activeElement as HTMLElement)?.blur() }}>
          {filteredMembers ? (
            // Search results
            filteredMembers.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-gray-400">
                검색 결과가 없습니다.
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-2.5 py-[5px] px-4 cursor-pointer transition-colors text-[12px] ${
                    selectedMember?.id === member.id
                      ? 'bg-[#eaf6f0]'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMember(member)}
                >
                  {(() => {
                    const src = resolveProfileImageUrl(member.profileImageUrl)
                    return src ? (
                      <img src={src} alt={member.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: member.profileColor }}
                      >
                        {member.name.slice(-2)}
                      </div>
                    )
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-800">{member.name}</span>
                      <span className="text-[10px] text-gray-400">{member.rank}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{member.department}</p>
                  </div>
                </div>
              ))
            )
          ) : (
            // Tree view
            departments.map((dept) => (
              <DeptTreeItem
                key={dept.id}
                dept={dept}
                level={0}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                selectedMemberId={selectedMember?.id || null}
                onSelectMember={setSelectedMember}
                members={members}
              />
            ))
          )}
        </div>
      </div>

      {/* Member detail popup - positioned next to tree panel */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-[45]"
          onClick={() => setSelectedMember(null)}
        />
      )}
      {selectedMember && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden flex"
          style={{ left: `${196 + size.width + 12}px`, bottom: '20px', width: '620px', maxHeight: '520px' }}
          onClick={(e) => e.stopPropagation()}
        >
            {/* Left column: Profile + Attendance */}
            <div className="w-[300px] border-r border-gray-100 flex flex-col">
              {/* Profile section */}
              <div className="flex flex-col items-center pt-8 pb-4 px-6">
                <div className="relative">
                  {(() => {
                    const src = resolveProfileImageUrl(selectedMember.profileImageUrl)
                    return src ? (
                      <img
                        src={src}
                        alt={selectedMember.name}
                        className="w-[100px] h-[100px] rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div
                        className="w-[100px] h-[100px] rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md"
                        style={{ backgroundColor: selectedMember.profileColor }}
                      >
                        {selectedMember.name.slice(-2)}
                      </div>
                    )
                  })()}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-gray-500 text-white text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    퇴근
                  </div>
                </div>
                <h3 className="text-[16px] font-bold text-gray-800 mt-5">
                  {selectedMember.name} {selectedMember.rank}
                </h3>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {selectedMember.department} {selectedMember.position}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">{selectedMember.email || '-'}</p>
              </div>

              {/* Attendance section */}
              <div className="mx-5 mt-2 mb-4 bg-[#f9fafb] rounded-xl p-4">
                <p className="text-[12px] font-medium text-gray-700 mb-3">{dateStr}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded">출근</span>
                    <span className="text-[13px] text-gray-600 ml-auto">09:33</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded">퇴근</span>
                    <span className="text-[13px] text-gray-600 ml-auto">18:00</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 py-4 mt-auto border-t border-gray-100">
                <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-[var(--primary-color)] transition-colors">
                  <i className="fa-regular fa-envelope text-[18px]" />
                  <span className="text-[11px]">메일 쓰기</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-[var(--primary-color)] transition-colors">
                  <i className="fa-regular fa-calendar text-[18px]" />
                  <span className="text-[11px]">일정 보기</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 text-gray-500 hover:text-[var(--primary-color)] transition-colors"
                  onClick={() => {
                    onOpenMessenger?.(selectedMember.id, selectedMember.name)
                  }}
                >
                  <i className="fa-regular fa-comment-dots text-[18px]" />
                  <span className="text-[11px]">메신저</span>
                </button>
              </div>
            </div>

            {/* Right column: Detail info */}
            <div className="flex-1 flex flex-col">
              {/* Close button */}
              <div className="flex justify-end px-4 pt-3">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              {/* Info fields */}
              <div className="px-6 py-4 space-y-5 flex-1 overflow-y-auto">
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">부서/직책</p>
                  <p className="text-[13px] text-gray-800">
                    {selectedMember.department} {selectedMember.position}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">직위</p>
                  <p className="text-[13px] text-gray-800">{selectedMember.rank}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">사원번호</p>
                  <p className="text-[13px] text-gray-800">{selectedMember.empNum || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">직급</p>
                  <p className="text-[13px] text-gray-800">{selectedMember.rank}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">이메일</p>
                  <p className="text-[13px] text-gray-800">{selectedMember.email || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">휴대전화</p>
                  <p className="text-[13px] text-gray-800">{selectedMember.phone || '-'}</p>
                </div>
              </div>
            </div>
          </div>
      )}
    </>
  )
}
