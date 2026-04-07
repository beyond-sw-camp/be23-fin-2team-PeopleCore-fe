import { useState } from 'react'

// ── 조직도와 동일한 데이터 ───────────────────────────────────────────
interface Department {
  id: string
  name: string
  children?: Department[]
}

interface Member {
  id: string
  name: string
  position: string
  rank: string
  email: string
  phone: string
  department: string
  departmentId: string
  profileColor: string
}

const departments: Department[] = [
  {
    id: 'ceo', name: 'PeopleCore',
    children: [
      { id: 'management', name: '경영지원본부', children: [
        { id: 'hr', name: '인사총무팀' },
        { id: 'finance', name: '재무회계팀' },
        { id: 'ga', name: '총무팀' },
      ]},
      { id: 'dev', name: '개발본부', children: [
        { id: 'frontend', name: '프론트엔드팀' },
        { id: 'backend', name: '백엔드팀' },
        { id: 'infra', name: '인프라팀' },
        { id: 'qa', name: 'QA팀' },
      ]},
      { id: 'sales', name: '영업본부', children: [
        { id: 'sales1', name: '영업1팀' },
        { id: 'sales2', name: '영업2팀' },
        { id: 'marketing', name: '마케팅팀' },
      ]},
    ],
  },
]

const members: Member[] = [
  { id: '1',  name: '김철수', position: '팀장',  rank: '부장', email: 'cskim@peoplecore.com',  phone: '010-1234-5678', department: '인사총무팀',   departmentId: 'hr',         profileColor: '#4CAF50' },
  { id: '2',  name: '이영희', position: '팀원',  rank: '대리', email: 'yhlee@peoplecore.com',  phone: '010-2345-6789', department: '인사총무팀',   departmentId: 'hr',         profileColor: '#2196F3' },
  { id: '3',  name: '박민수', position: '팀원',  rank: '사원', email: 'mspark@peoplecore.com', phone: '010-3456-7890', department: '인사총무팀',   departmentId: 'hr',         profileColor: '#FF9800' },
  { id: '4',  name: '정수연', position: '팀장',  rank: '부장', email: 'syjung@peoplecore.com', phone: '010-4567-8901', department: '재무회계팀',   departmentId: 'finance',    profileColor: '#9C27B0' },
  { id: '5',  name: '최동혁', position: '팀원',  rank: '과장', email: 'dhchoi@peoplecore.com', phone: '010-5678-9012', department: '재무회계팀',   departmentId: 'finance',    profileColor: '#F44336' },
  { id: '6',  name: '한지민', position: '팀장',  rank: '부장', email: 'jmhan@peoplecore.com',  phone: '010-6789-0123', department: '총무팀',       departmentId: 'ga',         profileColor: '#00BCD4' },
  { id: '7',  name: '강호진', position: '본부장', rank: '이사', email: 'hjkang@peoplecore.com', phone: '010-7890-1234', department: '경영지원본부', departmentId: 'management', profileColor: '#795548' },
  { id: '8',  name: '윤서준', position: '팀장',  rank: '부장', email: 'sjyoon@peoplecore.com', phone: '010-8901-2345', department: '프론트엔드팀', departmentId: 'frontend',   profileColor: '#E91E63' },
  { id: '9',  name: '임하은', position: '팀원',  rank: '대리', email: 'helim@peoplecore.com',  phone: '010-9012-3456', department: '프론트엔드팀', departmentId: 'frontend',   profileColor: '#3F51B5' },
  { id: '10', name: '송태현', position: '팀원',  rank: '사원', email: 'thsong@peoplecore.com', phone: '010-0123-4567', department: '프론트엔드팀', departmentId: 'frontend',   profileColor: '#009688' },
  { id: '11', name: '오민정', position: '팀장',  rank: '부장', email: 'mjoh@peoplecore.com',   phone: '010-1111-2222', department: '백엔드팀',     departmentId: 'backend',    profileColor: '#FF5722' },
  { id: '12', name: '배준호', position: '팀원',  rank: '과장', email: 'jhbae@peoplecore.com',  phone: '010-3333-4444', department: '백엔드팀',     departmentId: 'backend',    profileColor: '#607D8B' },
  { id: '13', name: '신예린', position: '본부장', rank: '이사', email: 'yrshin@peoplecore.com', phone: '010-5555-6666', department: '개발본부',     departmentId: 'dev',        profileColor: '#CDDC39' },
  { id: '14', name: '장우성', position: '팀장',  rank: '부장', email: 'wsjang@peoplecore.com', phone: '010-7777-8888', department: '영업1팀',      departmentId: 'sales1',     profileColor: '#FFC107' },
  { id: '15', name: '권나영', position: '팀장',  rank: '부장', email: 'nykwon@peoplecore.com', phone: '010-9999-0000', department: '마케팅팀',     departmentId: 'marketing',  profileColor: '#8BC34A' },
]

function getAllDescendantIds(dept: Department): string[] {
  const ids = [dept.id]
  if (dept.children) {
    for (const child of dept.children) ids.push(...getAllDescendantIds(child))
  }
  return ids
}

// ── 인사 이력 데이터 ─────────────────────────────────────────────────
interface HistoryRecord {
  id: number
  memberId: string
  changeStatus: '입사' | '퇴사' | '직위변경' | '부서변경' | '보직변경'
  deptBefore: string
  deptAfter: string
  gradeBefore: string
  gradeAfter: string
  titleBefore: string
  titleAfter: string
  changeReason: string
  managerName: string
  updatedAt: string
  orderNo: string
}

const mockHistories: HistoryRecord[] = [
  // 김철수 (id:1)
  { id: 1,  memberId: '1', changeStatus: '입사',    deptBefore: '',        deptAfter: '인사총무팀', gradeBefore: '',    gradeAfter: '사원', titleBefore: '',    titleAfter: '팀원',  changeReason: '신규 입사',          managerName: '관리자', updatedAt: '2015-03-02', orderNo: 'HR-2015-001' },
  { id: 2,  memberId: '1', changeStatus: '직위변경', deptBefore: '인사총무팀', deptAfter: '인사총무팀', gradeBefore: '사원',  gradeAfter: '주임', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2016-01-01', orderNo: 'HR-2016-002' },
  { id: 3,  memberId: '1', changeStatus: '직위변경', deptBefore: '인사총무팀', deptAfter: '인사총무팀', gradeBefore: '주임',  gradeAfter: '대리', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2018-01-01', orderNo: 'HR-2018-003' },
  { id: 4,  memberId: '1', changeStatus: '직위변경', deptBefore: '인사총무팀', deptAfter: '인사총무팀', gradeBefore: '대리',  gradeAfter: '과장', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2020-07-01', orderNo: 'HR-2020-004' },
  { id: 5,  memberId: '1', changeStatus: '직위변경', deptBefore: '인사총무팀', deptAfter: '인사총무팀', gradeBefore: '과장',  gradeAfter: '차장', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2022-01-01', orderNo: 'HR-2022-005' },
  { id: 6,  memberId: '1', changeStatus: '직위변경', deptBefore: '인사총무팀', deptAfter: '인사총무팀', gradeBefore: '차장',  gradeAfter: '부장', titleBefore: '팀원', titleAfter: '팀장',  changeReason: '승진 + 팀장 발령',   managerName: '관리자', updatedAt: '2024-01-01', orderNo: 'HR-2024-006' },
  // 이영희 (id:2)
  { id: 7,  memberId: '2', changeStatus: '입사',    deptBefore: '',        deptAfter: '인사총무팀', gradeBefore: '',    gradeAfter: '사원', titleBefore: '',    titleAfter: '팀원',  changeReason: '신규 입사',          managerName: '관리자', updatedAt: '2020-07-06', orderNo: 'HR-2020-010' },
  { id: 8,  memberId: '2', changeStatus: '직위변경', deptBefore: '인사총무팀', deptAfter: '인사총무팀', gradeBefore: '사원',  gradeAfter: '주임', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2021-07-01', orderNo: 'HR-2021-011' },
  { id: 9,  memberId: '2', changeStatus: '직위변경', deptBefore: '인사총무팀', deptAfter: '인사총무팀', gradeBefore: '주임',  gradeAfter: '대리', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2023-01-01', orderNo: 'HR-2023-012' },
  // 윤서준 (id:8)
  { id: 10, memberId: '8', changeStatus: '입사',    deptBefore: '',        deptAfter: '백엔드팀',   gradeBefore: '',    gradeAfter: '사원', titleBefore: '',    titleAfter: '팀원',  changeReason: '신규 입사',          managerName: '관리자', updatedAt: '2014-03-03', orderNo: 'HR-2014-001' },
  { id: 11, memberId: '8', changeStatus: '부서변경', deptBefore: '백엔드팀',  deptAfter: '프론트엔드팀', gradeBefore: '대리', gradeAfter: '대리', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '조직 개편',          managerName: '관리자', updatedAt: '2017-07-01', orderNo: 'HR-2017-008' },
  { id: 12, memberId: '8', changeStatus: '직위변경', deptBefore: '프론트엔드팀', deptAfter: '프론트엔드팀', gradeBefore: '대리', gradeAfter: '과장', titleBefore: '팀원', titleAfter: '팀원', changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2019-01-01', orderNo: 'HR-2019-009' },
  { id: 13, memberId: '8', changeStatus: '직위변경', deptBefore: '프론트엔드팀', deptAfter: '프론트엔드팀', gradeBefore: '과장', gradeAfter: '차장', titleBefore: '팀원', titleAfter: '팀원', changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2021-01-01', orderNo: 'HR-2021-010' },
  { id: 14, memberId: '8', changeStatus: '직위변경', deptBefore: '프론트엔드팀', deptAfter: '프론트엔드팀', gradeBefore: '차장', gradeAfter: '부장', titleBefore: '팀원', titleAfter: '팀장', changeReason: '승진 + 팀장 발령',   managerName: '관리자', updatedAt: '2023-07-01', orderNo: 'HR-2023-011' },
  // 오민정 (id:11)
  { id: 15, memberId: '11', changeStatus: '입사',    deptBefore: '',        deptAfter: '인프라팀',   gradeBefore: '',    gradeAfter: '사원', titleBefore: '',    titleAfter: '팀원',  changeReason: '신규 입사',          managerName: '관리자', updatedAt: '2013-03-04', orderNo: 'HR-2013-001' },
  { id: 16, memberId: '11', changeStatus: '부서변경', deptBefore: '인프라팀', deptAfter: '백엔드팀',   gradeBefore: '과장', gradeAfter: '과장', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '조직 개편',          managerName: '관리자', updatedAt: '2018-01-01', orderNo: 'HR-2018-015' },
  { id: 17, memberId: '11', changeStatus: '직위변경', deptBefore: '백엔드팀',  deptAfter: '백엔드팀',   gradeBefore: '과장', gradeAfter: '차장', titleBefore: '팀원', titleAfter: '팀원',  changeReason: '정기 승진',          managerName: '관리자', updatedAt: '2020-07-01', orderNo: 'HR-2020-016' },
  { id: 18, memberId: '11', changeStatus: '직위변경', deptBefore: '백엔드팀',  deptAfter: '백엔드팀',   gradeBefore: '차장', gradeAfter: '부장', titleBefore: '팀원', titleAfter: '팀장',  changeReason: '승진 + 팀장 발령',   managerName: '관리자', updatedAt: '2022-07-01', orderNo: 'HR-2022-017' },
]

const TYPE_STYLE: Record<string, string> = {
  '입사':    'bg-[#eaf6f0] text-[#1D9E75]',
  '퇴사':    'bg-red-50 text-red-500',
  '직위변경': 'bg-purple-50 text-purple-600',
  '부서변경': 'bg-blue-50 text-blue-600',
  '보직변경': 'bg-yellow-50 text-yellow-600',
}

function changeDetail(h: HistoryRecord): string {
  switch (h.changeStatus) {
    case '입사':    return `${h.deptAfter} / ${h.gradeAfter}`
    case '퇴사':    return `${h.deptBefore} / ${h.gradeBefore}`
    case '직위변경': return `${h.gradeBefore} → ${h.gradeAfter}`
    case '부서변경': return `${h.deptBefore} → ${h.deptAfter}`
    case '보직변경': return `${h.titleBefore} → ${h.titleAfter}`
  }
}

// ── 조직도 트리 아이템 (OrgChartModal과 동일 구조) ────────────────────
function DeptTreeItem({
  dept, level, expandedIds, onToggle, selectedMemberId, onSelectMember,
}: {
  dept: Department
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  selectedMemberId: string | null
  onSelectMember: (member: Member) => void
}) {
  const hasChildren = dept.children && dept.children.length > 0
  const isExpanded = expandedIds.has(dept.id)
  const deptIds = getAllDescendantIds(dept)
  const count = members.filter(m => deptIds.includes(m.departmentId)).length
  const directMembers = members.filter(m => m.departmentId === dept.id)

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-[6px] cursor-pointer text-[13px] transition-colors text-gray-600 hover:bg-gray-50"
        style={{ paddingLeft: `${8 + level * 18}px`, paddingRight: '8px' }}
        onClick={() => onToggle(dept.id)}
      >
        {hasChildren || directMembers.length > 0 ? (
          <i className={`fa-solid fa-chevron-right text-[9px] transition-transform w-3 ${isExpanded ? 'rotate-90' : ''} text-gray-400`} />
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
          {directMembers.map(member => (
            <div
              key={member.id}
              className={`flex items-center gap-2 py-[5px] cursor-pointer transition-colors text-[12px] ${
                selectedMemberId === member.id ? 'bg-[#eaf6f0]' : 'hover:bg-gray-50'
              }`}
              style={{ paddingLeft: `${26 + level * 18}px`, paddingRight: '8px' }}
              onClick={() => onSelectMember(member)}
            >
              <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${selectedMemberId === member.id ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
              <span className="font-medium text-gray-800">{member.name}</span>
              <span className="text-[10px] text-gray-400">{member.rank}</span>
            </div>
          ))}
          {hasChildren && dept.children!.map(child => (
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

// ── 메인 페이지 ──────────────────────────────────────────────────────
export default function HRHistory() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(['ceo', 'management', 'dev', 'sales'])
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [filterType, setFilterType] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredMembers = searchQuery
    ? members.filter(m =>
        m.name.includes(searchQuery) ||
        m.rank.includes(searchQuery) ||
        m.department.includes(searchQuery)
      )
    : null

  const histories = selectedMember
    ? mockHistories
        .filter(h => h.memberId === selectedMember.id && (!filterType || h.changeStatus === filterType))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    : []

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
          {/* 검색 */}
          <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="이름, 직위, 부서"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-[6px] text-[12px] focus:outline-none focus:border-[#1D9E75] bg-gray-50"
              />
            </div>
          </div>

          {/* 트리 or 검색결과 */}
          <div className="flex-1 overflow-y-auto py-1">
            {filteredMembers ? (
              filteredMembers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">검색 결과 없음</p>
              ) : filteredMembers.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center gap-2 py-[6px] px-3 cursor-pointer transition-colors text-[12px] ${
                    selectedMember?.id === member.id ? 'bg-[#eaf6f0]' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => { setSelectedMember(member); setFilterType('') }}
                >
                  <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${selectedMember?.id === member.id ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
                  <span className="font-medium text-gray-800">{member.name}</span>
                  <span className="text-[10px] text-gray-400">{member.rank}</span>
                  <span className="text-[10px] text-gray-300 ml-auto truncate">{member.department}</span>
                </div>
              ))
            ) : (
              departments.map(dept => (
                <DeptTreeItem
                  key={dept.id}
                  dept={dept}
                  level={0}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                  selectedMemberId={selectedMember?.id || null}
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
                    <span className="text-base font-bold text-gray-900">{selectedMember.name}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{selectedMember.department} · {selectedMember.rank}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    총 {mockHistories.filter(h => h.memberId === selectedMember.id).length}건
                  </span>
                </div>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none"
                >
                  <option value="">전체 유형</option>
                  <option value="입사">입사</option>
                  <option value="퇴사">퇴사</option>
                  <option value="직위변경">직위변경</option>
                  <option value="부서변경">부서변경</option>
                  <option value="보직변경">보직변경</option>
                </select>
              </div>

              {/* 타임라인 */}
              <div className="flex-1 overflow-y-auto card p-5">
                {histories.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10">조회된 이력이 없습니다</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                    {histories.map((h, idx) => (
                      <div key={h.id} className="flex gap-4 relative">
                        <div className={`w-[15px] h-[15px] rounded-full border-2 shrink-0 mt-3.5 z-10 ${
                          idx === 0 ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300 bg-white'
                        }`} />
                        <div className={`flex-1 mb-4 border rounded-xl p-4 ${
                          idx === 0 ? 'border-[#1D9E75]/30 bg-[#f7fdf9]' : 'border-gray-100 bg-white'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[h.changeStatus]}`}>
                                {h.changeStatus}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">{h.orderNo}</span>
                            </div>
                            <span className="text-xs text-gray-400">{h.updatedAt}</span>
                          </div>

                          <p className="text-sm font-medium text-gray-800 mb-2">{changeDetail(h)}</p>

                          <div className="grid grid-cols-3 gap-2 text-xs border-t border-gray-100 pt-2">
                            <div>
                              <span className="text-gray-400">부서 </span>
                              {h.deptBefore && h.deptAfter && h.deptBefore !== h.deptAfter
                                ? <span>{h.deptBefore} → <span className="text-[#1D9E75] font-medium">{h.deptAfter}</span></span>
                                : <span className="text-gray-600">{h.deptAfter || h.deptBefore || '-'}</span>
                              }
                            </div>
                            <div>
                              <span className="text-gray-400">직위 </span>
                              {h.gradeBefore && h.gradeAfter && h.gradeBefore !== h.gradeAfter
                                ? <span>{h.gradeBefore} → <span className="text-[#1D9E75] font-medium">{h.gradeAfter}</span></span>
                                : <span className="text-gray-600">{h.gradeAfter || h.gradeBefore || '-'}</span>
                              }
                            </div>
                            <div>
                              <span className="text-gray-400">보직 </span>
                              {h.titleBefore && h.titleAfter && h.titleBefore !== h.titleAfter
                                ? <span>{h.titleBefore} → <span className="text-[#1D9E75] font-medium">{h.titleAfter}</span></span>
                                : <span className="text-gray-600">{h.titleAfter || h.titleBefore || '-'}</span>
                              }
                            </div>
                          </div>

                          {h.changeReason && (
                            <p className="text-xs text-gray-400 mt-2">사유: {h.changeReason}</p>
                          )}
                        </div>
                      </div>
                    ))}
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
