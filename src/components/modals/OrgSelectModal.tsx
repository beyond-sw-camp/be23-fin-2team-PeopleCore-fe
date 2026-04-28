import { useState, useEffect } from 'react'
import { departmentApi, employeeApi } from '../../api/org'
import type { DepartmentTreeResponse, EmployeeListItem } from '../../api/org'

interface Dept {
  id: string
  name: string
  children?: Dept[]
}

interface OrgSelectModalProps {
  isOpen: boolean
  title?: string
  excludeEmpId?: number
  onClose: () => void
  onSelect: (emp: EmployeeListItem) => void
}

const COLORS = ['#4CAF50','#2196F3','#FF9800','#9C27B0','#F44336','#00BCD4','#795548','#E91E63','#3F51B5','#009688']

function getAllIds(dept: Dept): string[] {
  const ids = [dept.id]
  if (dept.children) dept.children.forEach((c) => ids.push(...getAllIds(c)))
  return ids
}

export default function OrgSelectModal({ isOpen, title = '사원 선택', excludeEmpId, onClose, onSelect }: OrgSelectModalProps) {
  const [depts, setDepts] = useState<Dept[]>([])
  const [employees, setEmployees] = useState<(EmployeeListItem & { deptId: string })[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const deptNameToId: Record<string, string> = {}

    departmentApi.getTree().then(({ data }) => {
      const convert = (nodes: DepartmentTreeResponse[]): Dept[] =>
        nodes.map((n) => {
          const id = String(n.id)
          deptNameToId[n.deptName] = id
          return { id, name: n.deptName, children: n.children?.length ? convert(n.children) : undefined }
        })

      const companyName = localStorage.getItem('companyName') || 'PeopleCore'
      const tree = convert(data)
      setDepts([{ id: 'root', name: companyName, children: tree }])
      setExpandedIds(new Set(['root', ...tree.map((d) => d.id)]))

      employeeApi.getList({ size: 1000 }).then(({ data: empData }) => {
        const list = Array.isArray(empData) ? empData : empData.content || []
        setEmployees(list.map((e) => ({ ...e, deptId: deptNameToId[e.deptName] || '' })))
      }).catch(() => {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // 선택된 부서 + 하위 부서의 사원 필터
  const visibleEmps = employees.filter((e) => {
    if (excludeEmpId != null && e.empId === excludeEmpId) return false
    if (search) return e.empName.includes(search)
    if (!selectedDeptId) return true
    const dept = findDept(depts, selectedDeptId)
    if (!dept) return true
    const ids = getAllIds(dept)
    return ids.includes(e.deptId)
  })

  function findDept(list: Dept[], id: string): Dept | null {
    for (const d of list) {
      if (d.id === id) return d
      if (d.children) { const f = findDept(d.children, id); if (f) return f }
    }
    return null
  }

  const renderTree = (list: Dept[], depth = 0) =>
    list.map((dept) => {
      const isExpanded = expandedIds.has(dept.id)
      const hasChildren = dept.children && dept.children.length > 0
      const isSelected = selectedDeptId === dept.id
      const count = employees.filter((e) => getAllIds(dept).includes(e.deptId)).length

      return (
        <div key={dept.id}>
          <div
            className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer text-[12px] rounded transition-colors select-none ${
              isSelected ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => { setSelectedDeptId(dept.id); setSearch('') }}
          >
            <span className="w-3 text-[9px] text-gray-400 shrink-0" onClick={(e) => { e.stopPropagation(); toggleExpand(dept.id) }}>
              {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
            </span>
            <i className="fas fa-folder text-[10px] text-gray-400" />
            <span className="truncate">{dept.name}</span>
            <span className="text-[10px] text-gray-400 ml-auto shrink-0">{count}</span>
          </div>
          {isExpanded && hasChildren && renderTree(dept.children!, depth + 1)}
        </div>
      )
    })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(750px,calc(100vw-24px))] h-[550px] flex flex-col">
        {/* 헤더 */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">로딩 중...</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* 왼쪽: 조직도 트리 */}
            <div className="w-[240px] shrink-0 border-r border-gray-200 overflow-y-auto p-2">
              {renderTree(depts)}
            </div>

            {/* 오른쪽: 사원 목록 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름으로 검색"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {visibleEmps.length === 0 ? (
                  <div className="text-center text-gray-400 text-[12px] py-10">사원이 없습니다.</div>
                ) : visibleEmps.map((emp, i) => (
                  <div key={emp.empId ?? i}
                    onClick={() => onSelect(emp)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0FBF7] cursor-pointer transition-colors border-b border-gray-50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                      {emp.empName.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-900">{emp.empName}</div>
                      <div className="text-[11px] text-gray-400">{emp.deptName} · {emp.gradeName}{emp.titleName ? ` · ${emp.titleName}` : ''}</div>
                    </div>
                    <button className="text-[11px] text-[#1D9E75] border border-[#1D9E75] rounded px-2 py-0.5 hover:bg-[#1D9E75] hover:text-white transition-colors shrink-0">
                      선택
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
