import { useState, useRef, useEffect, useCallback } from 'react'
import type { Department, Employee } from '../types'
import { departmentApi, employeeApi } from '../../../api/org'
import type { DepartmentDetailResponse } from '../../../api/org'

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
  isReordering,
  dragOverId,
  dragPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  dept: Department
  allDepts: Department[]
  employees: Employee[]
  expandedIds: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  isReordering: boolean
  dragOverId: string | null
  dragPosition: 'before' | 'after' | 'inside' | null
  onDragStart: (e: React.DragEvent, dept: Department) => void
  onDragOver: (e: React.DragEvent, dept: Department) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, dept: Department) => void
  onDragEnd: () => void
}) {
  const children = allDepts.filter((d) => d.parentId === dept.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(dept.id)
  const isSelected = selectedId === dept.id
  const memberCount = employees.filter((e) => e.departmentId === dept.id && e.status === 'active').length
  const level = getLevel(dept, allDepts)

  const isDragOver = dragOverId === dept.id

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors relative ${
          isSelected ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'
        } ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => !isReordering && onSelect(dept.id)}
        draggable={isReordering}
        onDragStart={(e) => isReordering && onDragStart(e, dept)}
        onDragOver={(e) => isReordering && onDragOver(e, dept)}
        onDragLeave={() => isReordering && onDragLeave()}
        onDrop={(e) => isReordering && onDrop(e, dept)}
        onDragEnd={() => isReordering && onDragEnd()}
      >
        {/* Drop indicators */}
        {isReordering && isDragOver && dragPosition === 'before' && (
          <div className="absolute left-2 right-2 top-0 h-[2px] bg-[#1D9E75] rounded-full" />
        )}
        {isReordering && isDragOver && dragPosition === 'after' && (
          <div className="absolute left-2 right-2 bottom-0 h-[2px] bg-[#1D9E75] rounded-full" />
        )}
        {isReordering && isDragOver && dragPosition === 'inside' && (
          <div className="absolute inset-0 border-2 border-[#1D9E75] rounded-lg pointer-events-none" />
        )}
        {isReordering && (
          <i className="fa-solid fa-grip-vertical text-[9px] text-gray-300 shrink-0" />
        )}
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
          isReordering={isReordering}
          dragOverId={dragOverId}
          dragPosition={dragPosition}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
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

function isDescendant(deptId: string, ancestorId: string, allDepts: Department[]): boolean {
  let current = allDepts.find((d) => d.id === deptId)
  while (current) {
    if (current.parentId === ancestorId) return true
    current = allDepts.find((d) => d.id === current!.parentId)
  }
  return false
}

export default function DepartmentTab({ departments, employees, onUpdateDepartments }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['ceo', 'management', 'dev', 'sales']))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; dept?: Department } | null>(null)
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formParentId, setFormParentId] = useState<string>('ceo')

  // Drag & drop reordering state
  const [isReordering, setIsReordering] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null)
  const dragRef = useRef<Department | null>(null)

  // API에서 가져온 부서 상세 정보
  const [deptDetail, setDeptDetail] = useState<DepartmentDetailResponse | null>(null)
  const [deptMembers, setDeptMembers] = useState<Employee[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const rootDepts = departments.filter((d) => d.parentId === null)
  const selectedDept = departments.find((d) => d.id === selectedId) || null
  const selectedMembers = selectedDept ? employees.filter((e) => e.departmentId === selectedDept.id && e.status === 'active') : []
  const selectedHead = selectedDept?.headId ? employees.find((e) => e.id === selectedDept.headId) : null
  const childDepts = selectedDept ? departments.filter((d) => d.parentId === selectedDept.id) : []

  // 부서 선택 시 detail API 호출
  const loadDetail = useCallback((deptId: string) => {
    const numId = Number(deptId)
    if (isNaN(numId)) return
    setDetailLoading(true)
    departmentApi.getDetail(numId).then(({ data }) => {
      setDeptDetail(data)
    }).catch(() => setDeptDetail(null)).finally(() => setDetailLoading(false))

    employeeApi.getList({ deptId: numId, size: 1000 }).then(({ data }) => {
      const list = Array.isArray(data) ? data : data.content || []
      setDeptMembers(list.map((e, i) => ({
        id: String(numId * 1000 + i),
        name: e.empName,
        email: '',
        phone: '',
        departmentId: deptId,
        departmentName: e.deptName,
        rankId: '',
        rankName: e.gradeName,
        positionId: null,
        positionName: e.titleName || null,
        joinDate: e.empHireDate,
        status: 'active' as const,
        profileColor: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      })))
    }).catch(() => setDeptMembers([]))
  }, [])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else { setDeptDetail(null); setDeptMembers([]) }
  }, [selectedId, loadDetail])

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
    setEditModal({ mode: 'create' })
  }

  const openEdit = () => {
    if (!selectedDept) return
    setFormName(selectedDept.name)
    setFormCode(selectedDept.code)
    setFormParentId(selectedDept.parentId || 'ceo')
    setIsReordering(true)
    // Expand all for better visibility
    const allIds = departments.map((d) => d.id)
    setExpandedIds(new Set(allIds))
  }

  const handleSubmit = async () => {
    if (!formName.trim() || !formCode.trim()) return
    if (editModal?.mode === 'create') {
      try {
        await departmentApi.create({
          parentDeptId: formParentId ? Number(formParentId) : null,
          deptName: formName.trim(),
          deptCode: formCode.trim().toUpperCase(),
        })
        // 트리 다시 로드
        const { data } = await departmentApi.getTree()
        const flatten = (nodes: typeof data, parentId: string | null = null): Department[] =>
          nodes.flatMap((n, i) => [
            { id: String(n.id), name: n.deptName, code: n.deptCode, parentId, headId: null, sortOrder: i + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ...flatten(n.children || [], String(n.id)),
          ])
        onUpdateDepartments(flatten(data))
      } catch (e) {
        alert('부서 등록에 실패했습니다.')
        return
      }
    }
    setEditModal(null)
  }

  const handleSaveReorder = () => {
    setIsReordering(false)
    setDragOverId(null)
    setDragPosition(null)
  }

  const handleCancelReorder = () => {
    setIsReordering(false)
    setDragOverId(null)
    setDragPosition(null)
  }

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, dept: Department) => {
    dragRef.current = dept
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dept.id)
  }

  const handleDragOver = (e: React.DragEvent, targetDept: Department) => {
    e.preventDefault()
    if (!dragRef.current || dragRef.current.id === targetDept.id) return
    // Don't allow dropping onto descendants
    if (isDescendant(targetDept.id, dragRef.current.id, departments)) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    if (y < height * 0.25) {
      setDragPosition('before')
    } else if (y > height * 0.75) {
      setDragPosition('after')
    } else {
      setDragPosition('inside')
    }
    setDragOverId(targetDept.id)
  }

  const handleDragLeave = () => {
    setDragOverId(null)
    setDragPosition(null)
  }

  const handleDrop = (_e: React.DragEvent, targetDept: Department) => {
    if (!dragRef.current || dragRef.current.id === targetDept.id) return
    if (isDescendant(targetDept.id, dragRef.current.id, departments)) return

    const dragged = dragRef.current
    let updated = [...departments]

    if (dragPosition === 'inside') {
      // Move as child of target
      const newSiblings = updated.filter((d) => d.parentId === targetDept.id)
      const maxSort = newSiblings.length > 0 ? Math.max(...newSiblings.map((s) => s.sortOrder)) : 0
      updated = updated.map((d) =>
        d.id === dragged.id
          ? { ...d, parentId: targetDept.id, sortOrder: maxSort + 1, updatedAt: new Date().toISOString() }
          : d,
      )
      // Expand target to show the moved department
      setExpandedIds((prev) => new Set([...prev, targetDept.id]))
    } else {
      // Move before or after target (same parent as target)
      const newParentId = targetDept.parentId
      const siblings = updated
        .filter((d) => d.parentId === newParentId && d.id !== dragged.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      const targetIndex = siblings.findIndex((d) => d.id === targetDept.id)
      const insertIndex = dragPosition === 'before' ? targetIndex : targetIndex + 1

      siblings.splice(insertIndex, 0, { ...dragged, parentId: newParentId })

      // Reassign sort orders
      const sortMap = new Map<string, number>()
      siblings.forEach((s, i) => sortMap.set(s.id, i + 1))

      updated = updated.map((d) => {
        if (d.id === dragged.id) {
          return { ...d, parentId: newParentId, sortOrder: sortMap.get(d.id) || d.sortOrder, updatedAt: new Date().toISOString() }
        }
        if (sortMap.has(d.id)) {
          return { ...d, sortOrder: sortMap.get(d.id)!, updatedAt: new Date().toISOString() }
        }
        return d
      })
    }

    onUpdateDepartments(updated)
    setDragOverId(null)
    setDragPosition(null)
    dragRef.current = null
  }

  const handleDragEnd = () => {
    setDragOverId(null)
    setDragPosition(null)
    dragRef.current = null
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

  // ── 부서명 인라인 수정 ──
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')

  const startEditName = () => {
    if (!selectedDept) return
    setTempName(selectedDept.name)
    setEditingName(true)
  }
  const saveName = () => {
    if (!selectedDept || !tempName.trim()) return
    onUpdateDepartments(departments.map((d) =>
      d.id === selectedDept.id ? { ...d, name: tempName.trim(), updatedAt: new Date().toISOString() } : d
    ))
    setEditingName(false)
  }
  const cancelEditName = () => {
    setEditingName(false)
  }

  // ── 부서장 지정 ──
  const handleChangeHead = (empId: string) => {
    if (!selectedDept) return
    onUpdateDepartments(departments.map((d) =>
      d.id === selectedDept.id ? { ...d, headId: empId || null, updatedAt: new Date().toISOString() } : d
    ))
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
          <div className="flex items-center gap-2">
            {isReordering ? (
              <>
                <button onClick={handleCancelReorder} className="text-[11px] text-gray-500 hover:underline">취소</button>
                <button onClick={handleSaveReorder} className="text-[11px] text-white bg-[#1D9E75] px-2.5 py-1 rounded-lg hover:opacity-90">완료</button>
              </>
            ) : (
              <button onClick={openCreate} className="text-[11px] text-[#1D9E75] hover:underline">+ 부서 등록</button>
            )}
          </div>
        </div>

        {isReordering && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <p className="text-[11px] text-blue-600">
              <i className="fa-solid fa-arrows-up-down text-[10px] mr-1" />
              부서를 드래그하여 위치를 변경하세요
            </p>
          </div>
        )}

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
              isReordering={isReordering}
              dragOverId={dragOverId}
              dragPosition={dragPosition}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* 우: 부서 상세 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
        {selectedDept ? (
          detailLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-[#1D9E75]" />
            </div>
          ) : (
            <div className="p-5">
              {/* 헤더 - 부서명 인라인 수정 */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEditName() }}
                        autoFocus
                        className="text-[16px] font-bold text-gray-800 border border-[#1D9E75] rounded-lg px-2 py-1 focus:outline-none w-[200px]"
                      />
                      <button onClick={saveName} className="w-7 h-7 rounded-lg bg-[#1D9E75] text-white flex items-center justify-center hover:opacity-90">
                        <i className="fa-solid fa-check text-[10px]" />
                      </button>
                      <button onClick={cancelEditName} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-50">
                        <i className="fa-solid fa-xmark text-[10px]" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h3 className="text-[16px] font-bold text-gray-800">{deptDetail?.deptName || selectedDept.name}</h3>
                      <button onClick={startEditName} className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-[#1D9E75] hover:bg-[#f0faf6] opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fa-solid fa-pen text-[9px]" />
                      </button>
                    </div>
                  )}
                  <p className="text-[12px] text-gray-400 mt-0.5">부서코드: {deptDetail?.deptCode || selectedDept.code}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={openEdit} className="px-3 py-1.5 text-[11px] border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    <i className="fa-solid fa-arrows-up-down text-[10px] mr-1" />순서 편집
                  </button>
                  <button onClick={handleDelete} className="px-3 py-1.5 text-[11px] border border-red-200 rounded-lg text-red-500 hover:bg-red-50">
                    <i className="fa-solid fa-trash text-[10px] mr-1" />삭제
                  </button>
                </div>
              </div>

              {/* 부서 정보 카드 */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-[11px] text-gray-400 mb-1.5">직책 보유자</p>
                  {deptDetail && deptDetail.titleHolders.length > 0 ? (
                    <div className="space-y-1.5">
                      {deptDetail.titleHolders.map((h) => (
                        <div key={h.empId} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                            {h.empName.charAt(0)}
                          </span>
                          <span className="text-[12px] text-gray-800">
                            <strong>{h.titleName}</strong>: {h.empName}
                            <span className="text-gray-400 ml-1">({h.gradeName})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-400">미지정</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-[11px] text-gray-400 mb-1">재직 인원</p>
                  <p className="text-[14px] font-semibold text-[#1D9E75]">{deptDetail?.activeCount ?? selectedMembers.length}명</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-[11px] text-gray-400 mb-1">하위 부서</p>
                  <p className="text-[14px] font-semibold text-gray-800">{deptDetail?.childDeptCount ?? childDepts.length}개</p>
                </div>
              </div>

              {/* 직급 분포 */}
              {deptMembers.length > 0 && (() => {
                const dist = deptMembers.reduce<Record<string, number>>((acc, e) => {
                  acc[e.rankName] = (acc[e.rankName] || 0) + 1
                  return acc
                }, {})
                return Object.keys(dist).length > 0 ? (
                  <div className="mb-5">
                    <h4 className="text-[13px] font-semibold text-gray-700 mb-2">직급 분포</h4>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(dist).map(([rank, count]) => (
                        <span key={rank} className="px-3 py-1 bg-[#f0faf6] text-[#1D9E75] rounded-full text-[12px]">
                          {rank} <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              {/* 소속 인원 목록 */}
              <div>
                <h4 className="text-[13px] font-semibold text-gray-700 mb-2">소속 인원</h4>
                {deptMembers.length === 0 ? (
                  <p className="text-[12px] text-gray-400 py-4 text-center">소속 인원이 없습니다</p>
                ) : (
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_80px_120px] px-4 py-2 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100">
                      <span>이름</span><span>직급</span><span>직책</span><span>입사일</span>
                    </div>
                    {deptMembers.map((emp) => (
                      <div key={emp.id} className="grid grid-cols-[1fr_80px_80px_120px] px-4 py-2.5 text-[12px] border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: emp.profileColor }}>
                            {emp.name.charAt(0)}
                          </span>
                          <span className="text-gray-800 font-medium">{emp.name}</span>
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
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <i className="fa-solid fa-sitemap text-4xl mb-3" />
            <p className="text-[13px]">좌측에서 부서를 선택하세요</p>
          </div>
        )}
      </div>

      {/* 부서 등록 모달 */}
      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setEditModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-bold text-gray-800 mb-4">부서 등록</h3>
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
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleSubmit} disabled={!formName.trim() || !formCode.trim()}
                className="px-4 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40">
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
