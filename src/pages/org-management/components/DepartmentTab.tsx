import { useState } from 'react'
import type { Department, Employee } from '../types'

interface Props {
  departments: Department[]
  employees: Employee[]
  onUpdateDepartments: (departments: Department[]) => void
}

// ── 부서 트리 노드 ────────────────────────────────────
function DeptNode({
  dept,
  allDepts,
  employees,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
}: {
  dept: Department
  allDepts: Department[]
  employees: Employee[]
  expandedIds: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const children = allDepts.filter((d) => d.parentId === dept.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(dept.id)
  const isSelected = selectedId === dept.id
  const memberCount = employees.filter((e) => e.departmentId === dept.id && e.status === 'active').length
  const level = getLevel(dept, allDepts)

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(dept.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(dept.id) }}
            className="w-5 h-5 flex items-center justify-center text-gray-400 shrink-0"
          >
            <i className={`fa-solid fa-chevron-right text-[9px] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <i className={`fa-solid fa-building text-[11px] ${isSelected ? 'text-[#1D9E75]' : 'text-gray-400'}`} />
        <span className={`text-[13px] flex-1 truncate ${isSelected ? 'font-semibold' : 'text-gray-700'}`}>{dept.name}</span>
        <span className="text-[10px] text-gray-400 shrink-0">{memberCount}명</span>
      </div>
      {isExpanded && children.map((child) => (
        <DeptNode
          key={child.id}
          dept={child}
          allDepts={allDepts}
          employees={employees}
          expandedIds={expandedIds}
          selectedId={selectedId}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function getLevel(dept: Department, all: Department[]): number {
  let level = 0
  let current = dept
  while (current.parentId) {
    level++
    const parent = all.find((d) => d.id === current.parentId)
    if (!parent) break
    current = parent
  }
  return level
}

export default function DepartmentTab({ departments, employees, onUpdateDepartments }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['ceo', 'management', 'dev', 'sales']))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; dept?: Department } | null>(null)
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formParentId, setFormParentId] = useState<string>('ceo')
  const [formSortOrder, setFormSortOrder] = useState(1)

  const rootDepts = departments.filter((d) => d.parentId === null)
  const selectedDept = departments.find((d) => d.id === selectedId) || null
  const selectedMembers = selectedDept ? employees.filter((e) => e.departmentId === selectedDept.id && e.status === 'active') : []
  const selectedHead = selectedDept?.headId ? employees.find((e) => e.id === selectedDept.headId) : null
  const childDepts = selectedDept ? departments.filter((d) => d.parentId === selectedDept.id) : []

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreate = () => {
    setFormName('')
    setFormCode('')
    setFormParentId(selectedId || 'ceo')
    setFormSortOrder(childDepts.length + 1)
    setEditModal({ mode: 'create' })
  }

  const openEdit = () => {
    if (!selectedDept) return
    setFormName(selectedDept.name)
    setFormCode(selectedDept.code)
    setFormParentId(selectedDept.parentId || 'ceo')
    setFormSortOrder(selectedDept.sortOrder)
    setEditModal({ mode: 'edit', dept: selectedDept })
  }

  const handleSubmit = () => {
    if (!formName.trim() || !formCode.trim()) return
    if (editModal?.mode === 'create') {
      const newDept: Department = {
        id: `dept_${Date.now()}`, name: formName.trim(), code: formCode.trim().toUpperCase(),
        parentId: formParentId, headId: null, sortOrder: formSortOrder,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      onUpdateDepartments([...departments, newDept])
    } else if (editModal?.mode === 'edit' && editModal.dept) {
      onUpdateDepartments(departments.map((d) =>
        d.id === editModal.dept!.id
          ? { ...d, name: formName.trim(), code: formCode.trim().toUpperCase(), parentId: formParentId, sortOrder: formSortOrder, updatedAt: new Date().toISOString() }
          : d,
      ))
    }
    setEditModal(null)
  }

  const handleDelete = () => {
    if (!selectedDept) return
    const memberCount = employees.filter((e) => e.departmentId === selectedDept.id && e.status === 'active').length
    if (memberCount > 0) {
      alert(`${selectedDept.name}에 소속 인원(${memberCount}명)이 있어 삭제할 수 없습니다.\n소속 인원을 먼저 이동해주세요.`)
      return
    }
    if (childDepts.length > 0) {
      alert(`${selectedDept.name}에 하위 부서가 있어 삭제할 수 없습니다.\n하위 부서를 먼저 정리해주세요.`)
      return
    }
    if (confirm(`'${selectedDept.name}' 부서를 삭제하시겠습니까?`)) {
      onUpdateDepartments(departments.filter((d) => d.id !== selectedDept.id))
      setSelectedId(null)
    }
  }

  // 직급 분포
  const rankDistribution = selectedMembers.reduce<Record<string, number>>((acc, e) => {
    acc[e.rankName] = (acc[e.rankName] || 0) + 1
    return acc
  }, {})

  return (
    <div className="flex gap-5 h-full">
      {/* 좌: 부서 트리 */}
      <div className="w-[280px] bg-white rounded-xl border border-gray-200 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h4 className="text-[13px] font-bold text-gray-800">조직 구조</h4>
          <button onClick={openCreate} className="text-[11px] text-[#1D9E75] hover:underline">+ 부서 등록</button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-1">
          {rootDepts.map((dept) => (
            <DeptNode
              key={dept.id}
              dept={dept}
              allDepts={departments}
              employees={employees}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={handleToggle}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </div>

      {/* 우: 부서 상세 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
        {selectedDept ? (
          <div className="p-5">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[16px] font-bold text-gray-800">{selectedDept.name}</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">부서코드: {selectedDept.code}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={openEdit} className="px-3 py-1.5 text-[11px] border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  <i className="fa-solid fa-pen text-[10px] mr-1" />수정
                </button>
                <button onClick={handleDelete} className="px-3 py-1.5 text-[11px] border border-red-200 rounded-lg text-red-500 hover:bg-red-50">
                  <i className="fa-solid fa-trash text-[10px] mr-1" />삭제
                </button>
              </div>
            </div>

            {/* 부서 정보 카드 */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[11px] text-gray-400 mb-1">부서장</p>
                <p className="text-[14px] font-semibold text-gray-800">
                  {selectedHead ? `${selectedHead.name} ${selectedHead.rankName}` : '미지정'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[11px] text-gray-400 mb-1">재직 인원</p>
                <p className="text-[14px] font-semibold text-[#1D9E75]">{selectedMembers.length}명</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[11px] text-gray-400 mb-1">하위 부서</p>
                <p className="text-[14px] font-semibold text-gray-800">{childDepts.length}개</p>
              </div>
            </div>

            {/* 직급 분포 */}
            {Object.keys(rankDistribution).length > 0 && (
              <div className="mb-5">
                <h4 className="text-[13px] font-semibold text-gray-700 mb-2">직급 분포</h4>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(rankDistribution).map(([rank, count]) => (
                    <span key={rank} className="px-3 py-1 bg-[#f0faf6] text-[#1D9E75] rounded-full text-[12px]">
                      {rank} <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 소속 인원 목록 */}
            <div>
              <h4 className="text-[13px] font-semibold text-gray-700 mb-2">소속 인원</h4>
              {selectedMembers.length === 0 ? (
                <p className="text-[12px] text-gray-400 py-4 text-center">소속 인원이 없습니다</p>
              ) : (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_80px_120px] px-4 py-2 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100">
                    <span>이름</span><span>직급</span><span>직책</span><span>입사일</span>
                  </div>
                  {selectedMembers.map((emp) => (
                    <div key={emp.id} className="grid grid-cols-[1fr_80px_80px_120px] px-4 py-2.5 text-[12px] border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: emp.profileColor }}>
                          {emp.name.charAt(0)}
                        </span>
                        <span className="text-gray-800 font-medium">{emp.name}</span>
                        {emp.id === selectedDept.headId && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px]">부서장</span>
                        )}
                      </span>
                      <span className="text-gray-600">{emp.rankName}</span>
                      <span className="text-gray-600">{emp.positionName || '-'}</span>
                      <span className="text-gray-400">{emp.joinDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <i className="fa-solid fa-sitemap text-4xl mb-3" />
            <p className="text-[13px]">좌측에서 부서를 선택하세요</p>
          </div>
        )}
      </div>

      {/* 부서 등록/수정 모달 */}
      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setEditModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-bold text-gray-800 mb-4">
              {editModal.mode === 'create' ? '부서 등록' : '부서 수정'}
            </h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">부서명</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="부서명" autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">부서코드</label>
                <input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="예: HR, FIN"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75] uppercase" />
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">상위부서</label>
                <select value={formParentId} onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]">
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">정렬순서</label>
                <input type="number" min={1} value={formSortOrder} onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleSubmit} disabled={!formName.trim() || !formCode.trim()}
                className="px-4 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40">
                {editModal.mode === 'create' ? '등록' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
