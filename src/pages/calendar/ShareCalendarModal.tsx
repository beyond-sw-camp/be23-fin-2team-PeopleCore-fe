import { useState, useEffect } from 'react'
import type { SharedCalendar } from './types'
import { COLORS } from './types'
import { interestCalendarApi } from '../../api/calendar'
import { departmentApi } from '../../api/org'
import type { OrgChartNode } from '../../api/org'

interface ShareCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  onRequest: (calendar: SharedCalendar) => void
}

interface Department {
  id: string
  name: string
  children?: Department[]
}

interface Member {
  id: string
  empId: number
  name: string
  rank: string
  position: string
  departmentId: string
  departmentName: string
  profileColor: string
}

const PROFILE_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
  '#00BCD4', '#795548', '#E91E63', '#3F51B5', '#009688',
  '#FF5722', '#607D8B', '#CDDC39', '#FFC107', '#8BC34A',
]

function getAllDescendantIds(dept: Department): string[] {
  const ids = [dept.id]
  if (dept.children) {
    for (const child of dept.children) {
      ids.push(...getAllDescendantIds(child))
    }
  }
  return ids
}

// ── 트리 노드 컴포넌트 ──
function DeptTreeItem({
  dept,
  level,
  expandedIds,
  onToggle,
  members,
  requestedIds,
  onRequest,
}: {
  dept: Department
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  members: Member[]
  requestedIds: Set<number>
  onRequest: (member: Member) => void
}) {
  const hasChildren = dept.children && dept.children.length > 0
  const isExpanded = expandedIds.has(dept.id)

  const deptIds = getAllDescendantIds(dept)
  const count = members.filter(m => deptIds.includes(m.departmentId)).length
  const directMembers = members.filter(m => m.departmentId === dept.id)

  return (
    <div>
      {/* 부서 행 */}
      <div
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

      {isExpanded && (
        <div>
          {/* 해당 부서 직속 사원들 */}
          {directMembers.map(member => {
            const isRequested = requestedIds.has(member.empId)
            return (
              <div
                key={member.id}
                className="group flex items-center gap-2.5 py-[5px] transition-colors text-[12px] hover:bg-gray-50"
                style={{ paddingLeft: `${26 + level * 18}px`, paddingRight: '8px' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: member.profileColor }}
                >
                  {member.name.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-800 text-[12px]">{member.name}</span>
                    <span className="text-[10px] text-gray-400">{member.rank}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">
                    {member.departmentName}·{member.position}
                  </p>
                </div>
                {isRequested ? (
                  <span className="text-[10px] text-gray-400 px-2 py-1 shrink-0">신청완료</span>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); onRequest(member) }}
                    className="opacity-0 group-hover:opacity-100 text-[11px] text-[#2e9e6e] font-medium px-2.5 py-1 rounded bg-[#f0f9f6] hover:bg-[#e0f3ec] transition-all shrink-0"
                  >
                    신청
                  </button>
                )}
              </div>
            )
          })}
          {/* 하위 부서 */}
          {hasChildren &&
            dept.children!.map(child => (
              <DeptTreeItem
                key={child.id}
                dept={child}
                level={level + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                members={members}
                requestedIds={requestedIds}
                onRequest={onRequest}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export default function ShareCalendarModal({ isOpen, onClose, onRequest }: ShareCalendarModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [searchText, setSearchText] = useState('')
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const myEmpId = Number(localStorage.getItem('empId') || '0')

  // 조직도 + 사원 로드
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    departmentApi.getTreeWithMembers()
      .then(({ data }) => {
        let memberIndex = 0

        const convertTree = (nodes: OrgChartNode[]): Department[] =>
          nodes.map(n => ({
            id: String(n.id),
            name: n.deptName,
            children: n.children?.length ? convertTree(n.children) : undefined,
          }))

        const collectMembers = (nodes: OrgChartNode[]): Member[] => {
          const result: Member[] = []
          for (const n of nodes) {
            for (const m of n.members) {
              if (m.empId === myEmpId) continue   // 본인 제외
              result.push({
                id: String(m.empId),
                empId: m.empId,
                name: m.empName,
                rank: m.gradeName || '',
                position: m.titleName || '팀원',
                departmentId: String(n.id),
                departmentName: n.deptName,
                profileColor: PROFILE_COLORS[memberIndex++ % PROFILE_COLORS.length],
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
      })
      .catch(err => console.warn('조직도 로드 실패:', err))
      .finally(() => setLoading(false))
  }, [isOpen, myEmpId])

  // 이미 신청/등록된 대상 조회
  useEffect(() => {
    if (!isOpen) return
    setRequestedIds(new Set())
    setErrorMsg(null)
    Promise.all([
      interestCalendarApi.getSentRequests(0, 100).catch(() => ({ content: [] })),
      interestCalendarApi.getList().catch(() => []),
    ]).then(([sentRes, interestList]) => {
      const ids = new Set<number>()
      sentRes.content
        .filter(req => req.shareStatus === 'PENDING' || req.shareStatus === 'APPROVED')
        .forEach(req => ids.add(req.toEmpId))
      interestList.forEach(ic => ids.add(ic.targetEmpId))
      setRequestedIds(ids)
    })
  }, [isOpen])

  if (!isOpen) return null

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRequest = (member: Member) => {
    if (requestedIds.has(member.empId)) return
    setErrorMsg(null)

    // 즉시 가드 추가 — 빠른 더블클릭 방지
    setRequestedIds(prev => new Set(prev).add(member.empId))

    interestCalendarApi.requestShare({ targetEmpId: member.empId })
      .then(() => {
        const colorIdx = Math.floor(Math.random() * COLORS.length)
        const newCal: SharedCalendar = {
          id: 'sub-' + member.empId,
          name: `${member.name} 일정`,
          type: 'subscribed',
          color: COLORS[colorIdx],
          visible: false,
          owner: member.name,
          status: 'pending',
        }
        onRequest(newCal)
        onClose()
      })
      .catch(err => {
        const msg = err?.response?.data?.message || '이미 신청했거나 처리할 수 없는 요청입니다.'
        setErrorMsg(msg)
        // 실패가 진짜 중복 에러면 그대로 두고, 다른 실패면 가드 롤백
        const isDuplicate = err?.response?.status === 409 || /이미 신청|중복/.test(msg)
        if (!isDuplicate) {
          setRequestedIds(prev => {
            const next = new Set(prev)
            next.delete(member.empId)
            return next
          })
        }
      })
  }

  // 검색 필터링
  const filteredMembers = searchText
    ? members.filter(m =>
        m.name.includes(searchText) ||
        m.rank.includes(searchText) ||
        m.position.includes(searchText) ||
        m.departmentName.includes(searchText))
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[420px] max-h-[75vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-[15px] font-bold text-gray-900">관심 캘린더 추가</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* 안내 + 검색 */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <p className="text-xs text-gray-500 mb-3">
            상대방에게 캘린더 공유 요청을 보냅니다. 승인되면 일정을 열람할 수 있습니다.
          </p>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="이름, 직위, 직책, 직급, 부서"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#2e9e6e] focus:outline-none bg-[#f9fafb]"
              autoFocus
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-1 mb-0 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg shrink-0">
            {errorMsg}
          </div>
        )}

        {/* 트리 또는 검색 결과 */}
        <div className="flex-1 overflow-y-auto py-1 min-h-0">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-xs">불러오는 중...</div>
          ) : filteredMembers ? (
            // 검색 결과
            filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">검색 결과가 없습니다</div>
            ) : (
              filteredMembers.map(member => {
                const isRequested = requestedIds.has(member.empId)
                return (
                  <div
                    key={member.id}
                    className="group flex items-center gap-2.5 py-[5px] px-6 transition-colors text-[12px] hover:bg-gray-50"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: member.profileColor }}
                    >
                      {member.name.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-800">{member.name}</span>
                        <span className="text-[10px] text-gray-400">{member.rank}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">
                        {member.departmentName}·{member.position}
                      </p>
                    </div>
                    {isRequested ? (
                      <span className="text-[10px] text-gray-400 px-2 py-1 shrink-0">신청완료</span>
                    ) : (
                      <button
                        onClick={() => handleRequest(member)}
                        className="opacity-0 group-hover:opacity-100 text-[11px] text-[#2e9e6e] font-medium px-2.5 py-1 rounded bg-[#f0f9f6] hover:bg-[#e0f3ec] transition-all shrink-0"
                      >
                        신청
                      </button>
                    )}
                  </div>
                )
              })
            )
          ) : (
            // 트리 뷰
            departments.map(dept => (
              <DeptTreeItem
                key={dept.id}
                dept={dept}
                level={0}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                members={members}
                requestedIds={requestedIds}
                onRequest={handleRequest}
              />
            ))
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-gray-200 shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
