import { useState, useEffect } from 'react'
import { departmentApi } from '../../api/org'
import type { OrgChartNode } from '../../api/org'
import { resolveProfileImageUrl } from '../../utils/profileImage'
import type { Invitee } from './types'

interface InviteeSelectModalProps {
  isOpen: boolean
  initialSelected: Invitee[]
  onClose: () => void
  onConfirm: (invitees: Invitee[]) => void
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
  profileImageUrl: string | null
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

function DeptTreeItem({
  dept,
  level,
  expandedIds,
  onToggle,
  members,
  selectedIds,
  onToggleMember,
}: {
  dept: Department
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  members: Member[]
  selectedIds: Set<number>
  onToggleMember: (member: Member) => void
}) {
  const hasChildren = dept.children && dept.children.length > 0
  const isExpanded = expandedIds.has(dept.id)

  const deptIds = getAllDescendantIds(dept)
  const count = members.filter(m => deptIds.includes(m.departmentId)).length
  const directMembers = members.filter(m => m.departmentId === dept.id)

  return (
    <div>
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
          {directMembers.map(member => {
            const isSelected = selectedIds.has(member.empId)
            return (
              <div
                key={member.id}
                onClick={() => onToggleMember(member)}
                className={`group flex items-center gap-2.5 py-[5px] cursor-pointer transition-colors text-[12px] ${
                  isSelected ? 'bg-[#f0f9f6]' : 'hover:bg-gray-50'
                }`}
                style={{ paddingLeft: `${26 + level * 18}px`, paddingRight: '8px' }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleMember(member)}
                  onClick={e => e.stopPropagation()}
                  className="w-3.5 h-3.5 accent-[#2e9e6e] shrink-0"
                />
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
            )
          })}
          {hasChildren &&
            dept.children!.map(child => (
              <DeptTreeItem
                key={child.id}
                dept={child}
                level={level + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                members={members}
                selectedIds={selectedIds}
                onToggleMember={onToggleMember}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export default function InviteeSelectModal({ isOpen, initialSelected, onClose, onConfirm }: InviteeSelectModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [searchText, setSearchText] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  const myEmpId = Number(localStorage.getItem('empId') || '0')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setSearchText('')
    setSelectedIds(new Set(initialSelected.map(i => Number(i.id)).filter(n => !Number.isNaN(n))))

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
              if (m.empId === myEmpId) continue
              result.push({
                id: String(m.empId),
                empId: m.empId,
                name: m.empName,
                rank: m.gradeName || '',
                position: m.titleName || '팀원',
                departmentId: String(n.id),
                departmentName: n.deptName,
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
      })
      .catch(err => console.warn('조직도 로드 실패:', err))
      .finally(() => setLoading(false))
  }, [isOpen, myEmpId, initialSelected])

  if (!isOpen) return null

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleMember = (member: Member) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(member.empId)) next.delete(member.empId)
      else next.add(member.empId)
      return next
    })
  }

  const handleConfirm = () => {
    const selected = members.filter(m => selectedIds.has(m.empId))
    const invitees: Invitee[] = selected.map(m => ({
      id: String(m.empId),
      name: m.name,
      department: m.departmentName,
      status: 'pending',
    }))
    onConfirm(invitees)
    onClose()
  }

  const removeSelected = (empId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(empId)
      return next
    })
  }

  const filteredMembers = searchText
    ? members.filter(m =>
        m.name.includes(searchText) ||
        m.rank.includes(searchText) ||
        m.position.includes(searchText) ||
        m.departmentName.includes(searchText))
    : null

  const selectedMembers = members.filter(m => selectedIds.has(m.empId))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(420px,calc(100vw-24px))] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-[15px] font-bold text-gray-900">참석자 선택</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0">
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

        {selectedMembers.length > 0 && (
          <div className="px-6 py-2 border-b border-gray-100 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map(m => (
                <span key={m.empId} className="inline-flex items-center gap-1 text-[11px] bg-[#f0f9f6] text-[#2e9e6e] px-2 py-1 rounded-full">
                  {m.name}
                  <button onClick={() => removeSelected(m.empId)} className="hover:text-red-400">
                    <i className="fas fa-times text-[9px]" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1 min-h-0">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-xs">불러오는 중...</div>
          ) : filteredMembers ? (
            filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">검색 결과가 없습니다</div>
            ) : (
              filteredMembers.map(member => {
                const isSelected = selectedIds.has(member.empId)
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member)}
                    className={`flex items-center gap-2.5 py-[5px] px-6 cursor-pointer transition-colors text-[12px] ${
                      isSelected ? 'bg-[#f0f9f6]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMember(member)}
                      onClick={e => e.stopPropagation()}
                      className="w-3.5 h-3.5 accent-[#2e9e6e] shrink-0"
                    />
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
                    </div>
                  </div>
                )
              })
            )
          ) : (
            departments.map(dept => (
              <DeptTreeItem
                key={dept.id}
                dept={dept}
                level={0}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                members={members}
                selectedIds={selectedIds}
                onToggleMember={toggleMember}
              />
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">{selectedMembers.length}명 선택됨</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 text-sm font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
