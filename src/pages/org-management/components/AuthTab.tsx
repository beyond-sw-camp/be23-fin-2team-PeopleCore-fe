import { useState } from 'react'
import type { Role, PermissionHistory } from '../types'
import { MENUS } from '../types'

interface Props {
  roles: Role[]
  permissionHistory: PermissionHistory[]
  onUpdateRoles: (roles: Role[]) => void
  onAddHistory: (entry: PermissionHistory) => void
}

const SCOPE_LABELS: Record<Role['infoAccessScope'], string> = {
  all: '전체',
  department: '소속 부서',
  team: '소속 팀',
  self: '본인만',
}

export default function AuthTab({ roles, permissionHistory, onUpdateRoles, onAddHistory }: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; role?: Role } | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formMenus, setFormMenus] = useState<string[]>([])
  const [formScope, setFormScope] = useState<Role['infoAccessScope']>('self')
  const [showHistory, setShowHistory] = useState(false)

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null

  const openCreate = () => {
    setFormName(''); setFormDesc(''); setFormMenus(['dashboard']); setFormScope('self')
    setEditModal({ mode: 'create' })
  }

  const openEdit = (role: Role) => {
    setFormName(role.name); setFormDesc(role.description); setFormMenus([...role.menuPermissions]); setFormScope(role.infoAccessScope)
    setEditModal({ mode: 'edit', role })
  }

  const handleToggleMenu = (key: string) => {
    setFormMenus((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  const handleSubmit = () => {
    if (!formName.trim()) return
    if (editModal?.mode === 'create') {
      const newRole: Role = {
        id: `role_${Date.now()}`, name: formName.trim(), description: formDesc.trim(),
        menuPermissions: formMenus, infoAccessScope: formScope,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      onUpdateRoles([...roles, newRole])
      onAddHistory({
        id: `ph_${Date.now()}`, roleId: newRole.id, roleName: newRole.name, action: 'create',
        detail: `'${newRole.name}' 역할 생성`, changedBy: '김철수', changedAt: new Date().toISOString(),
      })
    } else if (editModal?.mode === 'edit' && editModal.role) {
      onUpdateRoles(roles.map((r) =>
        r.id === editModal.role!.id
          ? { ...r, name: formName.trim(), description: formDesc.trim(), menuPermissions: formMenus, infoAccessScope: formScope, updatedAt: new Date().toISOString() }
          : r,
      ))
      onAddHistory({
        id: `ph_${Date.now()}`, roleId: editModal.role.id, roleName: formName.trim(), action: 'update',
        detail: `'${formName.trim()}' 역할 권한 수정`, changedBy: '김철수', changedAt: new Date().toISOString(),
      })
    }
    setEditModal(null)
  }

  const handleDelete = (role: Role) => {
    if (confirm(`'${role.name}' 역할을 삭제하시겠습니까?`)) {
      onUpdateRoles(roles.filter((r) => r.id !== role.id))
      onAddHistory({
        id: `ph_${Date.now()}`, roleId: role.id, roleName: role.name, action: 'delete',
        detail: `'${role.name}' 역할 삭제`, changedBy: '김철수', changedAt: new Date().toISOString(),
      })
      if (selectedRoleId === role.id) setSelectedRoleId(null)
    }
  }

  const formatDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="flex gap-5 h-full">
      {/* 좌: Role 목록 */}
      <div className="w-[260px] bg-white rounded-xl border border-gray-200 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h4 className="text-[13px] font-bold text-gray-800">역할(Role) 목록</h4>
          <button onClick={openCreate} className="text-[11px] text-[#1D9E75] hover:underline">+ 추가</button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                selectedRoleId === role.id ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'
              }`}
            >
              <div>
                <p className={`text-[13px] ${selectedRoleId === role.id ? 'font-semibold' : 'text-gray-700'}`}>{role.name}</p>
                <p className="text-[10px] text-gray-400">{role.description}</p>
              </div>
              <span className="text-[10px] text-gray-400">{role.menuPermissions.length}메뉴</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <button onClick={() => setShowHistory(true)} className="w-full text-[11px] text-gray-500 hover:text-[#1D9E75] text-left">
            <i className="fa-solid fa-clock-rotate-left text-[10px] mr-1" />변경 이력 보기
          </button>
        </div>
      </div>

      {/* 우: Role 상세 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
        {selectedRole ? (
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[16px] font-bold text-gray-800">{selectedRole.name}</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">{selectedRole.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selectedRole)} className="px-3 py-1.5 text-[11px] border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  <i className="fa-solid fa-pen text-[10px] mr-1" />수정
                </button>
                <button onClick={() => handleDelete(selectedRole)} className="px-3 py-1.5 text-[11px] border border-red-200 rounded-lg text-red-500 hover:bg-red-50">
                  <i className="fa-solid fa-trash text-[10px] mr-1" />삭제
                </button>
              </div>
            </div>

            {/* 메뉴 접근 권한 */}
            <div className="mb-5">
              <h4 className="text-[13px] font-semibold text-gray-700 mb-2">메뉴 접근 권한</h4>
              <div className="flex flex-wrap gap-2">
                {MENUS.map((m) => {
                  const allowed = selectedRole.menuPermissions.includes(m.key)
                  return (
                    <span key={m.key} className={`px-3 py-1.5 rounded-full text-[12px] ${
                      allowed ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'bg-gray-100 text-gray-400 line-through'
                    }`}>
                      {m.label}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* 정보 열람 범위 */}
            <div>
              <h4 className="text-[13px] font-semibold text-gray-700 mb-2">정보 열람 범위</h4>
              <div className="flex gap-3">
                {(Object.keys(SCOPE_LABELS) as Role['infoAccessScope'][]).map((scope) => (
                  <div key={scope} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
                    selectedRole.infoAccessScope === scope
                      ? 'border-[#1D9E75] bg-[#f0faf6]'
                      : 'border-gray-100 opacity-40'
                  }`}>
                    <i className={`text-[12px] ${selectedRole.infoAccessScope === scope ? 'text-[#1D9E75]' : 'text-gray-400'} ${
                      scope === 'all' ? 'fa-solid fa-globe' : scope === 'department' ? 'fa-solid fa-building' : scope === 'team' ? 'fa-solid fa-users' : 'fa-solid fa-user'
                    }`} />
                    <span className="text-[12px]">{SCOPE_LABELS[scope]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <i className="fa-solid fa-shield-halved text-4xl mb-3" />
            <p className="text-[13px]">좌측에서 역할을 선택하세요</p>
          </div>
        )}
      </div>

      {/* 역할 생성/수정 모달 */}
      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setEditModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[min(480px,calc(100vw-24px))] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-[14px] font-bold text-gray-800">{editModal.mode === 'create' ? '역할 추가' : '역할 수정'}</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">역할명</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus placeholder="예: 인사담당자"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">설명</label>
                <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="역할 설명"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1.5 block">메뉴 접근 권한</label>
                <div className="grid grid-cols-3 gap-2">
                  {MENUS.map((m) => (
                    <label key={m.key} className="flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={formMenus.includes(m.key)} onChange={() => handleToggleMenu(m.key)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]" />
                      <span className="text-[12px] text-gray-700">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1.5 block">정보 열람 범위</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(SCOPE_LABELS) as [Role['infoAccessScope'], string][]).map(([scope, label]) => (
                    <label key={scope} className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                      formScope === scope ? 'border-[#1D9E75] bg-[#f0faf6]' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="scope" checked={formScope === scope} onChange={() => setFormScope(scope)}
                        className="text-[#1D9E75] focus:ring-[#1D9E75]" />
                      <span className="text-[12px]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleSubmit} disabled={!formName.trim()}
                className="px-4 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40">
                {editModal.mode === 'create' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 변경 이력 모달 */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[min(520px,calc(100vw-24px))] max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-[14px] font-bold text-gray-800">권한 변경 이력</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {permissionHistory.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-8">변경 이력이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {[...permissionHistory].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).map((h) => (
                    <div key={h.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        h.action === 'create' ? 'bg-green-50 text-green-500' : h.action === 'delete' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-500'
                      }`}>
                        <i className={`text-[10px] ${h.action === 'create' ? 'fa-solid fa-plus' : h.action === 'delete' ? 'fa-solid fa-trash' : 'fa-solid fa-pen'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-gray-800">{h.detail}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{h.changedBy} · {formatDate(h.changedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
