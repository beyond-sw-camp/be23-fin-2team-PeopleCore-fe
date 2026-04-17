import { useState, useEffect } from 'react'
import { departmentApi } from '../../api/org'
import type { OrgChartNode, OrgChartMember } from '../../api/org'
import { hrOrderApi } from '../../api/hrOrder'
import type { HrOrderHistoryItem, OrderType } from '../../api/hrOrder'

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  PROMOTION: '승진',
  TRANSFER: '전보',
  TITLE_CHANGE: '보직변경',
}

const TYPE_STYLE: Record<string, string> = {
  '승진':    'bg-purple-50 text-purple-600',
  '전보':    'bg-blue-50 text-blue-600',
  '보직변경': 'bg-yellow-50 text-yellow-600',
}

interface SelectedMember extends OrgChartMember {
  deptName: string
}

function getAllMemberCount(node: OrgChartNode): number {
  let count = node.members?.length || 0
  if (node.children) {
    for (const child of node.children) count += getAllMemberCount(child)
  }
  return count
}

// ── 조직도 트리 아이템 ──
function DeptTreeItem({
  dept, level, expandedIds, onToggle, selectedMemberId, onSelectMember,
}: {
  dept: OrgChartNode
  level: number
  expandedIds: Set<number>
  onToggle: (id: number) => void
  selectedMemberId: number | null
  onSelectMember: (member: SelectedMember) => void
}) {
  const hasChildren = (dept.children && dept.children.length > 0) || (dept.members && dept.members.length > 0)
  const isExpanded = expandedIds.has(dept.id)
  const count = getAllMemberCount(dept)

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-[6px] cursor-pointer text-[13px] transition-colors text-gray-600 hover:bg-gray-50"
        style={{ paddingLeft: `${8 + level * 18}px`, paddingRight: '8px' }}
        onClick={() => onToggle(dept.id)}
      >
        {hasChildren ? (
          <i className={`fa-solid fa-chevron-right text-[9px] transition-transform w-3 ${isExpanded ? 'rotate-90' : ''} text-gray-400`} />
        ) : (
          <span className="w-3" />
        )}
        <span className="flex-1 truncate font-medium">{dept.deptName}</span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <i className="fa-solid fa-user text-[9px]" />
          {count}
        </span>
      </div>

      {isExpanded && (
        <div>
          {dept.members?.map(member => (
            <div
              key={member.empId}
              className={`flex items-center gap-2 py-[5px] cursor-pointer transition-colors text-[12px] ${
                selectedMemberId === member.empId ? 'bg-[#eaf6f0]' : 'hover:bg-gray-50'
              }`}
              style={{ paddingLeft: `${26 + level * 18}px`, paddingRight: '8px' }}
              onClick={() => onSelectMember({ ...member, deptName: dept.deptName })}
            >
              <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${selectedMemberId === member.empId ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
              <span className="font-medium text-gray-800">{member.empName}</span>
              <span className="text-[10px] text-gray-400">{member.gradeName}</span>
            </div>
          ))}
          {dept.children?.map(child => (
            <DeptTreeItem
              key={child.id}
              dept={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              selectedMemberId={selectedMemberId}
              onSelectMember={onSelectMember}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ──
export default function HRHistory() {
  const [deptTree, setDeptTree] = useState<OrgChartNode[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null)
  const [filterType, setFilterType] = useState<OrderType | ''>('')

  const [histories, setHistories] = useState<HrOrderHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // 조직도 로드
  useEffect(() => {
    departmentApi.getTreeWithMembers()
      .then(({ data }) => {
        setDeptTree(data)
        const topIds = new Set<number>()
        for (const node of data) {
          topIds.add(node.id)
          node.children?.forEach(c => topIds.add(c.id))
        }
        setExpandedIds(topIds)
      })
      .catch(e => console.error('조직도 로드 실패', e))
  }, [])

  // 사원 선택 시 이력 로드
  useEffect(() => {
    if (!selectedMember) { setHistories([]); return }
    setHistoryLoading(true)
    hrOrderApi.getHistory(selectedMember.empId)
      .then(({ data }) => setHistories(data))
      .catch(e => { console.error('이력 조회 실패', e); setHistories([]) })
      .finally(() => setHistoryLoading(false))
  }, [selectedMember?.empId])

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 트리에서 모든 멤버를 평탄화 (검색용)
  const flatMembers: SelectedMember[] = []
  const collectMembers = (nodes: OrgChartNode[]) => {
    for (const node of nodes) {
      node.members?.forEach(m => flatMembers.push({ ...m, deptName: node.deptName }))
      if (node.children) collectMembers(node.children)
    }
  }
  collectMembers(deptTree)

  const filteredMembers = searchQuery
    ? flatMembers.filter(m =>
        m.empName.includes(searchQuery) ||
        m.gradeName.includes(searchQuery) ||
        m.deptName.includes(searchQuery)
      )
    : null

  const filteredHistories = histories
    .filter(h => !filterType || h.orderType === filterType)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))

  // detailChange에서 targetType별 변경 추출
  const getChange = (h: HrOrderHistoryItem, type: string) =>
    h.detailChange.find(d => d.targetType === type)

  const changeDetail = (h: HrOrderHistoryItem): string => {
    return h.detailChange.map(d => {
      const label = d.targetType === 'DEPARTMENT' ? '부서' : d.targetType === 'GRADE' ? '직급' : '직책'
      return `${label}: ${d.beforeName} → ${d.afterName}`
    }).join(', ')
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-6 pb-4">
        <div className="text-xs text-gray-400 mb-1">
          사원 관리 › <span className="text-[#1D9E75] font-medium">인사 이력</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">인사 이력</h1>
        <p className="text-xs text-gray-400 mt-1">사원별 입사부터 현재까지의 모든 인사 변동 이력을 조회합니다.</p>
      </div>

      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-4">

        {/* ── 왼쪽: 조직도 트리 패널 ── */}
        <div className="w-[220px] flex flex-col card overflow-hidden shrink-0">
          <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="이름, 직급, 부서"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-[6px] text-[12px] focus:outline-none focus:border-[#1D9E75] bg-gray-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {filteredMembers ? (
              filteredMembers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">검색 결과 없음</p>
              ) : filteredMembers.map(member => (
                <div
                  key={member.empId}
                  className={`flex items-center gap-2 py-[6px] px-3 cursor-pointer transition-colors text-[12px] ${
                    selectedMember?.empId === member.empId ? 'bg-[#eaf6f0]' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => { setSelectedMember(member); setFilterType('') }}
                >
                  <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${selectedMember?.empId === member.empId ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
                  <span className="font-medium text-gray-800">{member.empName}</span>
                  <span className="text-[10px] text-gray-400">{member.gradeName}</span>
                  <span className="text-[10px] text-gray-300 ml-auto truncate">{member.deptName}</span>
                </div>
              ))
            ) : (
              deptTree.map(dept => (
                <DeptTreeItem
                  key={dept.id}
                  dept={dept}
                  level={0}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                  selectedMemberId={selectedMember?.empId || null}
                  onSelectMember={m => { setSelectedMember(m); setFilterType('') }}
                />
              ))
            )}
          </div>
        </div>

        {/* ── 오른쪽: 이력 타임라인 ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedMember ? (
            <div className="flex-1 card flex items-center justify-center">
              <div className="text-center text-gray-400">
                <i className="fas fa-user-clock text-3xl mb-3 block"></i>
                <p className="text-sm">왼쪽 조직도에서 사원을 선택하면<br />인사 이력을 확인할 수 있습니다</p>
              </div>
            </div>
          ) : (
            <>
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div>
                    <span className="text-base font-bold text-gray-900">{selectedMember.empName}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{selectedMember.deptName} · {selectedMember.gradeName}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    총 {histories.length}건
                  </span>
                </div>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as OrderType | '')}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none"
                >
                  <option value="">전체 유형</option>
                  {(Object.entries(ORDER_TYPE_LABELS) as [OrderType, string][]).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* 타임라인 */}
              <div className="flex-1 overflow-y-auto card p-5">
                {historyLoading ? (
                  <p className="text-xs text-gray-400 text-center py-10">로딩 중...</p>
                ) : filteredHistories.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10">조회된 이력이 없습니다</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                    {filteredHistories.map((h, idx) => {
                      const typeLabel = ORDER_TYPE_LABELS[h.orderType]
                      const deptChange = getChange(h, 'DEPARTMENT')
                      const gradeChange = getChange(h, 'GRADE')
                      const titleChange = getChange(h, 'TITLE')

                      return (
                        <div key={h.orderId} className="flex gap-4 relative">
                          <div className={`w-[15px] h-[15px] rounded-full border-2 shrink-0 mt-3.5 z-10 ${
                            idx === 0 ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300 bg-white'
                          }`} />
                          <div className={`flex-1 mb-4 border rounded-xl p-4 ${
                            idx === 0 ? 'border-[#1D9E75]/30 bg-[#f7fdf9]' : 'border-gray-100 bg-white'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[typeLabel] ?? 'bg-gray-50 text-gray-500'}`}>
                                  {typeLabel}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">HR-{h.orderId}</span>
                              </div>
                              <span className="text-xs text-gray-400">{h.effectiveDate}</span>
                            </div>

                            <p className="text-sm font-medium text-gray-800 mb-2">{changeDetail(h)}</p>

                            <div className="grid grid-cols-3 gap-2 text-xs border-t border-gray-100 pt-2">
                              <div>
                                <span className="text-gray-400">부서 </span>
                                {deptChange && deptChange.beforeName !== deptChange.afterName
                                  ? <span>{deptChange.beforeName} <span className="text-gray-400">&rarr;</span> <span className="text-[#1D9E75] font-medium">{deptChange.afterName}</span></span>
                                  : <span className="text-gray-600">{deptChange?.afterName ?? '-'}</span>
                                }
                              </div>
                              <div>
                                <span className="text-gray-400">직급 </span>
                                {gradeChange && gradeChange.beforeName !== gradeChange.afterName
                                  ? <span>{gradeChange.beforeName} <span className="text-gray-400">&rarr;</span> <span className="text-[#1D9E75] font-medium">{gradeChange.afterName}</span></span>
                                  : <span className="text-gray-600">{gradeChange?.afterName ?? '-'}</span>
                                }
                              </div>
                              <div>
                                <span className="text-gray-400">보직 </span>
                                {titleChange && titleChange.beforeName !== titleChange.afterName
                                  ? <span>{titleChange.beforeName} <span className="text-gray-400">&rarr;</span> <span className="text-[#1D9E75] font-medium">{titleChange.afterName}</span></span>
                                  : <span className="text-gray-600">{titleChange?.afterName ?? '-'}</span>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
