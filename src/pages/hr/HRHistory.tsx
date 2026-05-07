import { useState, useEffect } from 'react'
import { departmentApi } from '../../api/org'
import type { OrgChartNode, OrgChartMember } from '../../api/org'
import { hrOrderApi } from '../../api/hrOrder'

// 인사이력 9종 (백엔드 OrderType 확장 예정)
type ExtendedOrderType =
  | 'HIRE'
  | 'PROMOTION'
  | 'TRANSFER'
  | 'TITLE_CHANGE'
  | 'EMP_TYPE_CHANGE'
  | 'ROLE_CHANGE'
  | 'CONTRACT_END_CHANGE'
  | 'RETIREMENT_TYPE_CHANGE'
  | 'RESIGN'

interface HistoryItem {
  orderId: number
  orderType: ExtendedOrderType
  effectiveDate: string
  detailChange: { targetType: string; beforeName: string; afterName: string }[]
}

const ORDER_TYPE_LABELS: Record<ExtendedOrderType, string> = {
  HIRE:                   '입사',
  PROMOTION:              '승진',
  TRANSFER:               '전보',
  TITLE_CHANGE:           '보직변경',
  EMP_TYPE_CHANGE:        '고용형태',
  ROLE_CHANGE:            '권한',
  CONTRACT_END_CHANGE:    '계약만료',
  RETIREMENT_TYPE_CHANGE: '퇴직연금',
  RESIGN:                 '퇴직',
}

// 카테고리: 인사발령(발령장 발행) / 인사 정보(발령장 없음)
const ORDER_GROUP_TYPES: ExtendedOrderType[] = ['HIRE', 'PROMOTION', 'TRANSFER', 'TITLE_CHANGE', 'RESIGN']
const INFO_GROUP_TYPES: ExtendedOrderType[] = ['EMP_TYPE_CHANGE', 'ROLE_CHANGE', 'CONTRACT_END_CHANGE', 'RETIREMENT_TYPE_CHANGE']

const TYPE_STYLE = (type: ExtendedOrderType) =>
  ORDER_GROUP_TYPES.includes(type)
    ? 'bg-[#eaf6f0] text-[#1D9E75]'
    : 'bg-gray-100 text-gray-500'

const TARGET_LABELS: Record<string, string> = {
  DEPARTMENT:      '부서',
  GRADE:           '직급',
  TITLE:           '직책',
  EMP_TYPE:        '고용형태',
  ROLE:            '권한',
  CONTRACT_END:    '계약 만료일',
  RETIREMENT_TYPE: '퇴직연금',
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
  const [categoryFilter, setCategoryFilter] = useState<'' | 'ORDER'>('')
  const [typeFilter, setTypeFilter] = useState<ExtendedOrderType | ''>('')

  const [histories, setHistories] = useState<HistoryItem[]>([])
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

  // 사원 선택 시 이력 로드 (백엔드 GET /hr-order/history/{empId} 호출)
  useEffect(() => {
    if (!selectedMember) { setHistories([]); return }
    let cancelled = false
    setHistoryLoading(true)
    hrOrderApi.getHistory(selectedMember.empId)
      .then(({ data }) => {
        if (cancelled) return
        const mapped: HistoryItem[] = data.map(d => ({
          orderId: d.orderId ?? 0,
          orderType: d.orderType as ExtendedOrderType,
          effectiveDate: d.effectiveDate,
          detailChange: d.detailChange,
        }))
        setHistories(mapped)
      })
      .catch(e => {
        if (cancelled) return
        console.error('인사 이력 조회 실패', e)
        setHistories([])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedMember?.empId])

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
    // 인사 정보 그룹(EMP_TYPE_CHANGE/ROLE_CHANGE/CONTRACT_END_CHANGE/RETIREMENT_TYPE_CHANGE)은 인사이력에서 제외
    .filter(h => !INFO_GROUP_TYPES.includes(h.orderType))
    .filter(h => {
      if (typeFilter) return h.orderType === typeFilter
      if (categoryFilter === 'ORDER') return ORDER_GROUP_TYPES.includes(h.orderType)
      return true
    })
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))

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
        <div className="w-[230px] flex flex-col card overflow-hidden shrink-0">
          <div className="px-3 py-3 border-b border-gray-100 shrink-0">
            <div className="text-[11px] font-medium text-gray-400 mb-2 px-1">조직도</div>
            <div className="relative">
              <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="이름, 직급, 부서"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-[7px] text-[12px] focus:outline-none focus:border-[#1D9E75] bg-gray-50/70"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1.5">
            {filteredMembers ? (
              filteredMembers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">검색 결과 없음</p>
              ) : filteredMembers.map(member => (
                <div
                  key={member.empId}
                  className={`flex items-center gap-2 py-[7px] px-3 cursor-pointer transition-colors text-[12px] border-l-2 ${
                    selectedMember?.empId === member.empId
                      ? 'bg-[#eaf6f0] border-[#1D9E75]'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                  onClick={() => { setSelectedMember(member); setCategoryFilter(''); setTypeFilter('') }}
                >
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
                  onSelectMember={m => { setSelectedMember(m); setCategoryFilter(''); setTypeFilter('') }}
                />
              ))
            )}
          </div>
        </div>

        {/* ── 오른쪽: 이력 타임라인 ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedMember ? (
            <div className="flex-1 card flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
                  <i className="fas fa-user-clock text-gray-300 text-xl"></i>
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">사원을 선택해주세요</p>
                <p className="text-xs text-gray-400">왼쪽 조직도에서 사원을 클릭하면 인사 이력이 표시됩니다</p>
              </div>
            </div>
          ) : (
            <>
              {/* 헤더 카드 */}
              <div className="card px-5 py-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-base font-semibold text-gray-900">{selectedMember.empName}</span>
                    <span className="text-xs text-gray-400">{selectedMember.deptName} · {selectedMember.gradeName}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    총 <span className="text-[#1D9E75] font-semibold">{histories.length}</span>건의 이력
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end max-w-[60%]">
                  {categoryFilter && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {ORDER_GROUP_TYPES.map(key => {
                        const active = typeFilter === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setTypeFilter(active ? '' : key)}
                            className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                              active
                                ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]'
                            }`}
                          >
                            {ORDER_TYPE_LABELS[key]}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <select
                    value={categoryFilter}
                    onChange={e => {
                      setCategoryFilter(e.target.value as '' | 'ORDER')
                      setTypeFilter('')
                    }}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-[#1D9E75] bg-white"
                  >
                    <option value="">전체 유형</option>
                    <option value="ORDER">인사발령</option>
                  </select>
                </div>
              </div>

              {/* 타임라인 */}
              <div className="flex-1 overflow-y-auto card p-5">
                {historyLoading ? (
                  <p className="text-xs text-gray-400 text-center py-10">로딩 중...</p>
                ) : filteredHistories.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10">조회된 이력이 없습니다</p>
                ) : (
                  <div className="relative">
                    {filteredHistories.map((h, idx, arr) => {
                      const typeLabel = ORDER_TYPE_LABELS[h.orderType]
                      return (
                        <div key={h.orderId} className="flex gap-4 relative">
                          {/* 동그라미 위쪽 라인 (첫 row 제외) */}
                          {idx > 0 && (
                            <div className="absolute left-[7px] top-0 h-[22px] w-px bg-gray-200" />
                          )}
                          {/* 동그라미 아래쪽 라인 (마지막 row 제외, mb 영역까지 연장) */}
                          {idx < arr.length - 1 && (
                            <div className="absolute left-[7px] top-[22px] -bottom-3 w-px bg-gray-200" />
                          )}
                          <div className={`w-[15px] h-[15px] rounded-full border-2 shrink-0 mt-3.5 z-10 ${
                            idx === 0 ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300 bg-white'
                          }`} />
                          <div className={`flex-1 mb-3 border rounded-xl p-4 transition-shadow hover:shadow-sm ${
                            idx === 0 ? 'border-[#1D9E75]/30 bg-[#f7fdf9]' : 'border-gray-100 bg-white'
                          }`}>
                            {/* 상단: 배지 + 날짜 */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_STYLE(h.orderType)}`}>
                                {typeLabel}
                              </span>
                              <span className="text-xs text-gray-400">{h.effectiveDate}</span>
                            </div>

                            {/* 본문: 단일 변경은 강조, 다중은 리스트 */}
                            {h.detailChange.length === 1 ? (
                              (() => {
                                const d = h.detailChange[0]
                                const hasBefore = d.beforeName && d.beforeName !== '-' && d.beforeName !== d.afterName
                                return (
                                  <div>
                                    <div className="text-[11px] text-gray-400 mb-1.5">
                                      {TARGET_LABELS[d.targetType] ?? d.targetType}
                                    </div>
                                    {hasBefore ? (
                                      <div className="flex items-center gap-2.5 text-sm">
                                        <span className="text-gray-400">{d.beforeName}</span>
                                        <span className="text-[#1D9E75]/70 text-xs">→</span>
                                        <span className="text-gray-800">{d.afterName}</span>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-800">{d.afterName}</div>
                                    )}
                                  </div>
                                )
                              })()
                            ) : (
                              <div className="space-y-2">
                                {h.detailChange.map(d => {
                                  const hasBefore = d.beforeName && d.beforeName !== '-' && d.beforeName !== d.afterName
                                  return (
                                    <div key={d.targetType} className="flex items-center text-sm">
                                      <span className="text-[11px] text-gray-400 w-20 shrink-0">
                                        {TARGET_LABELS[d.targetType] ?? d.targetType}
                                      </span>
                                      {hasBefore ? (
                                        <span className="flex items-center gap-2">
                                          <span className="text-gray-400">{d.beforeName}</span>
                                          <span className="text-[#1D9E75]/70 text-xs">→</span>
                                          <span className="text-gray-800">{d.afterName}</span>
                                        </span>
                                      ) : (
                                        <span className="text-gray-800">{d.afterName}</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
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
