import { useEffect, useState } from 'react'
import { departmentApi, type OrgChartNode } from '../../api/org'
import { resolveProfileImageUrl } from '../../utils/profileImage'

interface Department {
  id: string
  name: string
  children?: Department[]
}

interface Member {
  id: string
  name: string
  position: string         // titleName (직책)
  rank: string             // gradeName (직급)
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
  members,
}: {
  dept: Department
  level: number
  selectedId: string
  expandedIds: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  members: Member[]
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
              members={members}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<string>('company-root')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['company-root']))
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    departmentApi.getTreeWithMembers().then(({ data }) => {
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
            result.push({
              id: String(m.empId),
              name: m.empName,
              position: m.titleName || '팀원',
              rank: m.gradeName,
              departmentId: String(n.id),
              profileColor: PROFILE_COLORS[memberIndex++ % PROFILE_COLORS.length],
              profileImageUrl: m.profileImageUrl,
            })
          }
          if (n.children?.length) result.push(...collectMembers(n.children))
        }
        return result
      }

      const companyName = localStorage.getItem('companyName') || 'PeopleCore'
      const tree = convertTree(data)
      setDepartments([{ id: 'company-root', name: companyName, children: tree }])
      setMembers(collectMembers(data))
      // 루트 + 1단계 부서까지 펼친 상태로 시작
      setExpandedIds(new Set(['company-root', ...tree.map(d => d.id)]))
    }).catch(() => { /* ignore */ })
  }, [])

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
        m.position.includes(searchQuery) ||
        m.rank.includes(searchQuery))
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
              placeholder="이름, 직책, 직급 검색"
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
              members={members}
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
              {filteredMembers.map((member) => {
                const profileSrc = resolveProfileImageUrl(member.profileImageUrl)
                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      {profileSrc ? (
                        <img
                          src={profileSrc}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ backgroundColor: member.profileColor }}
                        >
                          {member.name.slice(-2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{member.name}</span>
                          <span className="text-xs text-gray-500">{member.rank}</span>
                        </div>
                        <p className="text-sm text-[var(--primary-color)] mt-0.5">{member.position}</p>
                        <p className="text-xs text-gray-400 mt-1">{getDeptName(member.departmentId)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
