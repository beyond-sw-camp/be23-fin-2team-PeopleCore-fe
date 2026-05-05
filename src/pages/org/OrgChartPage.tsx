import { useState } from 'react'

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
  departmentId: string
  profileColor: string
}

const departments: Department[] = [
  {
    id: 'ceo',
    name: 'PeopleCore',
    children: [
      {
        id: 'management',
        name: '경영지원본부',
        children: [
          { id: 'hr', name: '인사총무팀' },
          { id: 'finance', name: '재무회계팀' },
          { id: 'ga', name: '총무팀' },
        ],
      },
      {
        id: 'dev',
        name: '개발본부',
        children: [
          { id: 'frontend', name: '프론트엔드팀' },
          { id: 'backend', name: '백엔드팀' },
          { id: 'infra', name: '인프라팀' },
          { id: 'qa', name: 'QA팀' },
        ],
      },
      {
        id: 'sales',
        name: '영업본부',
        children: [
          { id: 'sales1', name: '영업1팀' },
          { id: 'sales2', name: '영업2팀' },
          { id: 'marketing', name: '마케팅팀' },
        ],
      },
    ],
  },
]

const members: Member[] = [
  { id: '1', name: '김철수', position: '팀장', rank: '부장', email: 'cskim@peoplecore.com', phone: '010-1234-5678', departmentId: 'hr', profileColor: '#4CAF50' },
  { id: '2', name: '이영희', position: '팀원', rank: '대리', email: 'yhlee@peoplecore.com', phone: '010-2345-6789', departmentId: 'hr', profileColor: '#2196F3' },
  { id: '3', name: '박민수', position: '팀원', rank: '사원', email: 'mspark@peoplecore.com', phone: '010-3456-7890', departmentId: 'hr', profileColor: '#FF9800' },
  { id: '4', name: '정수연', position: '팀장', rank: '부장', email: 'syjung@peoplecore.com', phone: '010-4567-8901', departmentId: 'finance', profileColor: '#9C27B0' },
  { id: '5', name: '최동혁', position: '팀원', rank: '과장', email: 'dhchoi@peoplecore.com', phone: '010-5678-9012', departmentId: 'finance', profileColor: '#F44336' },
  { id: '6', name: '한지민', position: '팀장', rank: '부장', email: 'jmhan@peoplecore.com', phone: '010-6789-0123', departmentId: 'ga', profileColor: '#00BCD4' },
  { id: '7', name: '강호진', position: '본부장', rank: '이사', email: 'hjkang@peoplecore.com', phone: '010-7890-1234', departmentId: 'management', profileColor: '#795548' },
  { id: '8', name: '윤서준', position: '팀장', rank: '부장', email: 'sjyoon@peoplecore.com', phone: '010-8901-2345', departmentId: 'frontend', profileColor: '#E91E63' },
  { id: '9', name: '임하은', position: '팀원', rank: '대리', email: 'helim@peoplecore.com', phone: '010-9012-3456', departmentId: 'frontend', profileColor: '#3F51B5' },
  { id: '10', name: '송태현', position: '팀원', rank: '사원', email: 'thsong@peoplecore.com', phone: '010-0123-4567', departmentId: 'frontend', profileColor: '#009688' },
  { id: '11', name: '오민정', position: '팀장', rank: '부장', email: 'mjoh@peoplecore.com', phone: '010-1111-2222', departmentId: 'backend', profileColor: '#FF5722' },
  { id: '12', name: '배준호', position: '팀원', rank: '과장', email: 'jhbae@peoplecore.com', phone: '010-3333-4444', departmentId: 'backend', profileColor: '#607D8B' },
  { id: '13', name: '신예린', position: '본부장', rank: '이사', email: 'yrshin@peoplecore.com', phone: '010-5555-6666', departmentId: 'dev', profileColor: '#CDDC39' },
  { id: '14', name: '장우성', position: '팀장', rank: '부장', email: 'wsjang@peoplecore.com', phone: '010-7777-8888', departmentId: 'sales1', profileColor: '#FFC107' },
  { id: '15', name: '권나영', position: '팀장', rank: '부장', email: 'nykwon@peoplecore.com', phone: '010-9999-0000', departmentId: 'marketing', profileColor: '#8BC34A' },
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

function findDepartment(depts: Department[], id: string): Department | null {
  for (const dept of depts) {
    if (dept.id === id) return dept
    if (dept.children) {
      const found = findDepartment(dept.children, id)
      if (found) return found
    }
  }
  return null
}

function DeptTreeItem({
  dept,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: {
  dept: Department
  level: number
  selectedId: string
  expandedIds: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}) {
  const hasChildren = dept.children && dept.children.length > 0
  const isExpanded = expandedIds.has(dept.id)
  const isSelected = selectedId === dept.id

  const deptIds = getAllDescendantIds(dept)
  const memberCount = members.filter((m) => deptIds.includes(m.departmentId)).length

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-3 py-2 cursor-pointer rounded-md text-sm transition-colors ${
          isSelected
            ? 'bg-[var(--primary-color)] text-white'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => {
          onSelect(dept.id)
          if (hasChildren) onToggle(dept.id)
        }}
      >
        {hasChildren ? (
          <i
            className={`fa-solid fa-chevron-right text-[10px] transition-transform ${
              isExpanded ? 'rotate-90' : ''
            } ${isSelected ? 'text-white' : 'text-gray-400'}`}
          ></i>
        ) : (
          <span className="w-[10px]" />
        )}
        <i
          className={`fa-solid ${hasChildren ? 'fa-folder' : 'fa-users'} text-xs ${
            isSelected ? 'text-white' : 'text-[var(--primary-color)]'
          }`}
        ></i>
        <span className="flex-1 truncate">{dept.name}</span>
        <span
          className={`text-xs ${
            isSelected ? 'text-white/70' : 'text-gray-400'
          }`}
        >
          {memberCount}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {dept.children!.map((child) => (
            <DeptTreeItem
              key={child.id}
              dept={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const [selectedDeptId, setSelectedDeptId] = useState('ceo')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(['ceo', 'management', 'dev', 'sales'])
  )
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedDept = findDepartment(departments, selectedDeptId)
  const descendantIds = selectedDept ? getAllDescendantIds(selectedDept) : []
  const filteredMembers = members.filter((m) => {
    const inDept = descendantIds.includes(m.departmentId)
    if (!searchQuery) return inDept
    return (
      inDept &&
      (m.name.includes(searchQuery) ||
        m.email.includes(searchQuery) ||
        m.position.includes(searchQuery))
    )
  })

  const getDeptName = (deptId: string) => {
    const dept = findDepartment(departments, deptId)
    return dept?.name || ''
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Department Tree */}
      <div className="w-[280px] border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-800 mb-3">
            <i className="fa-solid fa-sitemap text-[var(--primary-color)] mr-2"></i>
            조직도
          </h2>
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 이메일 검색"
              className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {departments.map((dept) => (
            <DeptTreeItem
              key={dept.id}
              dept={dept}
              level={0}
              selectedId={selectedDeptId}
              expandedIds={expandedIds}
              onSelect={setSelectedDeptId}
              onToggle={toggleExpand}
            />
          ))}
        </div>
      </div>

      {/* Right: Member List */}
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {selectedDept?.name || '전체'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                총 <span className="text-[var(--primary-color)] font-medium">{filteredMembers.length}</span>명
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <i className="fa-solid fa-user-slash text-4xl mb-4"></i>
              <p className="text-sm">소속된 구성원이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: member.profileColor }}
                    >
                      {member.name.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{member.name}</span>
                        <span className="text-xs text-gray-500">{member.rank}</span>
                      </div>
                      <p className="text-sm text-[var(--primary-color)] mt-0.5">{member.position}</p>
                      <p className="text-xs text-gray-400 mt-1">{getDeptName(member.departmentId)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <i className="fa-solid fa-envelope w-4 text-center text-gray-400"></i>
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <i className="fa-solid fa-phone w-4 text-center text-gray-400"></i>
                      <span>{member.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
