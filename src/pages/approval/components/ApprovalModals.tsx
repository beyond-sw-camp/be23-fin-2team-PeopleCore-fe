import { useState, useRef, useEffect, useCallback } from 'react'
import type { PersonalFolder } from './approvalTypes'
import { departmentApi } from '../../../api/org'
import { approvalApi, type ApprovalDelegationResponse, type AutoClassifyRuleResponse } from '../../../api/approval'
import SignatureImage from '../../../components/common/SignatureImage'

/* ── 조직도 멤버 타입 ── */
interface PickerMember {
  empId: number
  empNum: string
  name: string
  grade: string
  title: string
  deptName: string
}

interface PickerDepartment {
  deptId: number
  name: string
  members: PickerMember[]
}

/* ── 필드 설정 모달 (공용) ── */
export function FieldSettingsModal({ isOpen, fields, visibleFields, onClose, onSave }: {
  isOpen: boolean
  fields: { key: string; label: string; desc: string }[]
  visibleFields: string[]
  onClose: () => void
  onSave: (fields: string[]) => void
}) {
  const [selected, setSelected] = useState(visibleFields)

  if (!isOpen) return null

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(440px,calc(100vw-24px))] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">필드 목록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="divide-y divide-gray-100">
          {fields.map((field) => (
            <div key={field.key} className="flex items-start gap-3 px-6 py-3">
              <input
                type="checkbox"
                checked={selected.includes(field.key)}
                onChange={() => toggle(field.key)}
                className="accent-[#3b82f6] mt-0.5 w-4 h-4"
              />
              <div>
                <div className="text-[13px] font-semibold text-gray-800">{field.label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{field.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={() => onSave(selected)} className="px-5 py-1.5 bg-[#3b82f6] text-white text-[13px] font-medium rounded-md hover:bg-[#2563eb] transition-colors">
            확인
          </button>
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 조직도 선택 모달 (대결자용) ── */
export function OrgPickerModal({ onClose, onSelect, title = '조직도' }: {
  onClose: () => void
  onSelect: (member: PickerMember) => void
  title?: string
}) {
  const [search, setSearch] = useState('')
  const [departments, setDepartments] = useState<PickerDepartment[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // API에서 조직도 로딩 (with-members 사용)
  useEffect(() => {
    departmentApi.getTreeWithMembers()
      .then(({ data: tree }) => {
        const depts: PickerDepartment[] = []

        function flatten(node: import('../../../api/org').OrgChartNode) {
          const members: PickerMember[] = node.members.map((m) => ({
            empId: m.empId,
            empNum: String(m.empId),
            name: m.empName,
            grade: m.gradeName,
            title: m.titleName ?? '',
            deptName: node.deptName,
          }))
          if (members.length > 0) {
            depts.push({ deptId: node.id, name: node.deptName, members })
          }
          for (const child of node.children ?? []) {
            flatten(child)
          }
        }

        for (const node of tree) {
          flatten(node)
        }

        setDepartments(depts)
        const exp: Record<string, boolean> = {}
        depts.forEach((d) => { exp[d.name] = true })
        setExpanded(exp)
      })
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(340px,calc(100vw-24px))] max-h-[500px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        <div className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mr-2 shrink-0">
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 검색"
              className="flex-1 text-[12px] outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 text-[12px]">
          {loading ? (
            <div className="text-center text-gray-400 py-8">조직도 로딩 중...</div>
          ) : departments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">조직도 데이터가 없습니다.</div>
          ) : (
            departments.map((dept) => {
              const filtered = dept.members.filter((m) =>
                !search || m.name.includes(search) || m.grade.includes(search)
              )
              if (search && filtered.length === 0) return null
              return (
                <div key={dept.deptId}>
                  <div
                    className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
                    onClick={() => setExpanded((prev) => ({ ...prev, [dept.name]: !prev[dept.name] }))}
                  >
                    <span className="text-[10px] text-gray-500 w-3">{expanded[dept.name] ? '▼' : '▶'}</span>
                    <span className="font-semibold text-gray-700">{dept.name}</span>
                    <span className="text-gray-400 text-[11px] ml-1">{dept.members.length}</span>
                  </div>
                  {expanded[dept.name] && filtered.map((m) => (
                    <div
                      key={m.empId}
                      className="flex items-center gap-2 py-1.5 pl-6 pr-2 cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors"
                      onClick={() => onSelect(m)}
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 shrink-0">
                        <i className="fas fa-user" />
                      </div>
                      <span className="text-gray-800">{m.name} {m.grade}</span>
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 대결자 정보 ── */
export interface DelegateInfo {
  empId: number
  name: string
  deptName: string
  grade: string
  title: string
}

/* ── 부재 추가 모달 ── */
export function AddAbsenceModal({ isOpen, onClose, onConfirm }: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    startDate: string; endDate: string; reason: string
    delegate: DelegateInfo | null
  }) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')
  const [delegate, setDelegate] = useState<DelegateInfo | null>(null)
  const [orgPickerOpen, setOrgPickerOpen] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(600px,calc(100vw-24px))] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">부재 추가</h2>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* 부재 기간 */}
          <div className="flex items-center">
            <span className="w-24 text-[13px] font-semibold text-blue-700 shrink-0">부재 기간</span>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
              <span className="text-gray-400">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
            </div>
          </div>

          {/* 부재 사유 */}
          <div className="flex items-start border-t border-gray-100 pt-5">
            <span className="w-24 text-[13px] font-semibold text-blue-700 shrink-0 pt-1">부재 사유</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
            />
          </div>

          {/* 대결자 */}
          <div className="flex items-center border-t border-gray-100 pt-5">
            <span className="w-24 text-[13px] font-semibold text-blue-700 shrink-0">대결자</span>
            {delegate ? (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-800">{delegate.name} {delegate.grade}</span>
                <span className="text-[11px] text-gray-400">{delegate.deptName}</span>
                <button onClick={() => setDelegate(null)} className="text-gray-400 hover:text-red-400 text-[11px]">
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOrgPickerOpen(true)}
                className="text-[12px] text-blue-600 hover:text-blue-800 transition-colors"
              >
                + 대결자 선택
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => onConfirm({ startDate, endDate, reason, delegate })}
            className="px-6 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors"
          >
            확인
          </button>
          <button onClick={onClose} className="px-6 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>

        {/* 대결자 선택 조직도 모달 */}
        {orgPickerOpen && (
          <OrgPickerModal
            onClose={() => setOrgPickerOpen(false)}
            onSelect={(member) => {
              setDelegate({
                empId: member.empId,
                name: member.name,
                deptName: member.deptName,
                grade: member.grade,
                title: member.title,
              })
              setOrgPickerOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

/* ── 전자결재 환경 설정 모달 ── */
export function ApprovalSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('기본 설정')
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const signInputRef = useRef<HTMLInputElement>(null)

  // 부재/위임 목록 (API 연동)
  const [delegations, setDelegations] = useState<ApprovalDelegationResponse[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [addAbsenceOpen, setAddAbsenceOpen] = useState(false)

  // 서명 + 위임 로딩
  useEffect(() => {
    if (!isOpen) return
    // 서명 조회
    approvalApi.getMySignature()
      .then(({ data }) => { if (data.fileUrl) setSignatureUrl(data.fileUrl) })
      .catch(() => {})
    // 위임 목록 조회
    approvalApi.getDelegations()
      .then(({ data }) => setDelegations(data))
      .catch(() => {})
  }, [isOpen])

  const handleSignatureUpload = async (file: File) => {
    try {
      const { data } = await approvalApi.uploadMySignature(file)
      setSignatureUrl(data.fileUrl)
    } catch {
      alert('서명 업로드에 실패했습니다.')
    }
  }

  const handleSignatureDelete = async () => {
    try {
      await approvalApi.deleteMySignature()
      setSignatureUrl(null)
    } catch {
      alert('서명 삭제에 실패했습니다.')
    }
  }

  if (!isOpen) return null

  const tabs = ['기본 설정', '부재/위임 설정']

  const toggleAll = () => {
    if (delegations.every((a) => checkedIds.has(a.appDeleId))) setCheckedIds(new Set())
    else setCheckedIds(new Set(delegations.map((a) => a.appDeleId)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleDeleteAbsences = async () => {
    try {
      await Promise.all(Array.from(checkedIds).map((id) => approvalApi.deleteDelegation(id)))
      setDelegations((prev) => prev.filter((a) => !checkedIds.has(a.appDeleId)))
      setCheckedIds(new Set())
    } catch {
      alert('위임 삭제에 실패했습니다.')
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      await approvalApi.toggleDelegation(id)
      setDelegations((prev) => prev.map((a) => a.appDeleId === id ? { ...a, isActive: !a.isActive } : a))
    } catch {
      alert('상태 변경에 실패했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(700px,calc(100vw-24px))] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">결재환경설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-[13px] transition-colors ${
                activeTab === t ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === '기본 설정' && (
            <div className="space-y-8">
              {/* 서명관리 */}
              <div>
                <h3 className="text-[13px] font-semibold text-blue-700 mb-4">서명관리</h3>
                <input
                  ref={signInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleSignatureUpload(file)
                    e.target.value = ''
                  }}
                />
                <div className="flex items-start gap-4">
                  <div className="inline-block border border-gray-300 rounded-lg p-4 text-center min-w-[100px]">
                    <div className="text-[11px] text-gray-500 mb-2">직위</div>
                    <div className="w-16 h-16 mx-auto rounded-full border-2 border-red-400 flex items-center justify-center mb-2 overflow-hidden">
                      {signatureUrl ? (
                        <SignatureImage url={signatureUrl} alt="서명" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-red-400 text-[12px] font-bold">승인</span>
                      )}
                    </div>
                    <div className="text-[12px] text-gray-700">이름</div>
                    <div className="text-[11px] text-gray-400 mt-1">결재일</div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => signInputRef.current?.click()}
                      className="px-3 py-1.5 text-[12px] border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <i className="fas fa-upload text-[10px] mr-1" /> 서명 업로드
                    </button>
                    {signatureUrl && (
                      <button
                        onClick={handleSignatureDelete}
                        className="px-3 py-1.5 text-[12px] border border-gray-300 rounded hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <i className="fas fa-trash-alt text-[10px] mr-1" /> 서명 삭제
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400">110 x 80 pixel 권장</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === '부재/위임 설정' && (
            <div>
              {/* 부재 추가 / 삭제 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-[12px]">
                  <button onClick={() => setAddAbsenceOpen(true)} className="flex items-center gap-1 text-gray-600 hover:text-[#1D9E75] transition-colors">
                    <i className="fas fa-plus text-[10px]" /> 부재 추가
                  </button>
                  <button
                    onClick={handleDeleteAbsences}
                    disabled={checkedIds.size === 0}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-trash-alt text-[10px]" /> 삭제
                  </button>
                </div>
                <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
                  <option>20</option><option>10</option><option>50</option>
                </select>
              </div>

              {/* 테이블 */}
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2.5 text-gray-500 font-medium w-10">
                      <input type="checkbox" checked={delegations.length > 0 && delegations.every((a) => checkedIds.has(a.appDeleId))} onChange={toggleAll} className="accent-[#1D9E75]" />
                    </th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">부재 시작</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">부재 종료</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">대결자</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium">부재 사유</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">사용 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {delegations.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-300 text-[13px]">등록된 부재/위임 설정이 없습니다.</td></tr>
                  ) : (
                    delegations.map((a) => (
                      <tr key={a.appDeleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={checkedIds.has(a.appDeleId)} onChange={() => toggleOne(a.appDeleId)} className="accent-[#1D9E75]" />
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{a.startAt || '-'}</td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{a.endAt || '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600 whitespace-nowrap">{a.deleName ? `${a.deleName} ${a.deleGrade}` : '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600">{a.reason || '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(a.appDeleId)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${a.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${a.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <AddAbsenceModal
                isOpen={addAbsenceOpen}
                onClose={() => setAddAbsenceOpen(false)}
                onConfirm={async (a) => {
                  if (!a.delegate) { alert('대결자를 선택하세요.'); return }
                  try {
                    await approvalApi.createDelegation({
                      empDeptName: '',
                      empGrade: '',
                      empTitle: '',
                      appDeleEmpId: a.delegate.empId,
                      deleName: a.delegate.name,
                      deleDeptName: a.delegate.deptName,
                      deleGrade: a.delegate.grade,
                      deleTitle: a.delegate.title,
                      appDeleStartAt: a.startDate,
                      appDeleEndAt: a.endDate,
                      appDeleReason: a.reason,
                    })
                    const { data } = await approvalApi.getDelegations()
                    setDelegations(data)
                    setAddAbsenceOpen(false)
                  } catch {
                    alert('위임 등록에 실패했습니다.')
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-6 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">저장</button>
          <button onClick={onClose} className="px-6 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
        </div>
      </div>
    </div>
  )
}

/* ── 개인 문서함 관리 모달 ── */
export function PersonalBoxSettingsModal({ isOpen, onClose, folders, onFoldersChange }: {
  isOpen: boolean; onClose: () => void
  folders: PersonalFolder[]; onFoldersChange: (folders: PersonalFolder[]) => void
}) {
  const [activeTab, setActiveTab] = useState('문서함')
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [reordering, setReordering] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  if (!isOpen) return null

  const toggleAll = () => {
    if (folders.every((f) => checkedIds.has(f.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(folders.map((f) => f.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleAdd = () => {
    const name = prompt('문서함 이름을 입력하세요')
    if (!name) return
    if (folders.some((f) => f.name === name)) {
      alert('이미 같은 이름의 문서함이 존재합니다.')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    onFoldersChange([...folders, { id: Date.now(), name, createdAt: today, docCount: 0, shared: 0 }])
  }

  const handleDelete = () => {
    onFoldersChange(folders.filter((f) => !checkedIds.has(f.id)))
    setCheckedIds(new Set())
  }

  const startEdit = (id: number, name: string) => { setEditingId(id); setEditName(name) }
  const saveEdit = (id: number) => {
    if (editName && !folders.some((f) => f.id !== id && f.name === editName)) {
      onFoldersChange(folders.map((f) => f.id === id ? { ...f, name: editName } : f))
    }
    setEditingId(null)
  }

  const moveRow = (from: number, to: number) => {
    if (to < 0 || to >= folders.length) return
    const updated = [...folders]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    onFoldersChange(updated)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDrop = (idx: number) => {
    if (dragIdx !== null && dragIdx !== idx) {
      moveRow(dragIdx, idx)
    }
    setDragIdx(null)
    setDragOverIdx(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(900px,calc(100vw-24px))] max-h-[85vh] min-h-[500px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">개인 문서함 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex border-b border-gray-200 px-6">
          {['문서함', '자동분류'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-[13px] transition-colors ${activeTab === t ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === '문서함' ? (
            <div>
              <div className="flex items-center gap-4 text-[12px] text-gray-600 mb-4">
                <button
                  onClick={() => setReordering(!reordering)}
                  className={`flex items-center gap-1 transition-colors ${reordering ? 'text-[#1D9E75] font-semibold' : 'hover:text-[#1D9E75]'}`}
                >
                  <i className={`fas ${reordering ? 'fa-check' : 'fa-sort'} text-[10px]`} />
                  {reordering ? '순서 바꾸기 완료' : '순서 바꾸기'}
                </button>
                {!reordering && (
                  <>
                    <button onClick={handleAdd} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
                      <i className="fas fa-plus text-[10px]" /> 추가
                    </button>
                    <button onClick={handleDelete} disabled={checkedIds.size === 0}
                      className="flex items-center gap-1 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <i className="fas fa-trash-alt text-[10px]" /> 삭제
                    </button>
                    <button
                      disabled={checkedIds.size === 0}
                      onClick={() => setTransferOpen(true)}
                      className="flex items-center gap-1 hover:text-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-exchange-alt text-[10px]" /> 문서함 이관
                    </button>
                  </>
                )}
              </div>

              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {reordering && <th className="px-3 py-2.5 text-gray-500 font-medium w-16">순서</th>}
                    {!reordering && (
                      <th className="px-3 py-2.5 text-gray-500 font-medium w-10">
                        <input type="checkbox" checked={folders.length > 0 && folders.every((f) => checkedIds.has(f.id))} onChange={toggleAll} className="accent-[#1D9E75]" />
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-gray-500 font-medium">문서함 이름</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">생성일</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">문서 개수</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">설정</th>
                  </tr>
                </thead>
                <tbody>
                  {folders.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-300 text-[13px]">문서함이 없습니다.</td></tr>
                  ) : (
                    folders.map((f, idx) => (
                      <tr
                        key={f.id}
                        className={`border-b transition-colors ${
                          reordering && dragOverIdx === idx && dragIdx !== idx
                            ? 'border-t-2 border-t-[#1D9E75] bg-[#f0fdf8]'
                            : 'border-gray-100 hover:bg-gray-50'
                        } ${reordering ? 'cursor-grab' : ''} ${reordering && dragIdx === idx ? 'opacity-40' : ''}`}
                        draggable={reordering}
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                      >
                        {reordering ? (
                          <td className="px-3 py-2.5">
                            <i className="fas fa-grip-vertical text-[12px] text-gray-400 cursor-grab" />
                          </td>
                        ) : (
                          <td className="px-3 py-2.5">
                            <input type="checkbox" checked={checkedIds.has(f.id)} onChange={() => toggleOne(f.id)} className="accent-[#1D9E75]" />
                          </td>
                        )}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {editingId === f.id ? (
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => saveEdit(f.id)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(f.id) }}
                                autoFocus className="border border-[#1D9E75] rounded px-2 py-0.5 text-[12px] outline-none w-40" />
                            ) : (
                              <>
                                <span className="text-gray-800">{f.name}</span>
                                {!reordering && (
                                  <button onClick={() => startEdit(f.id, f.name)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <i className="fas fa-pen text-[9px]" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500 whitespace-nowrap">{f.createdAt}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{f.docCount}</td>
                        <td className="px-3 py-2.5 text-right"><span className="text-[11px] text-gray-500">공유 {f.shared}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {transferOpen && (
                <TransferModal
                  folderNames={folders.filter((f) => checkedIds.has(f.id)).map((f) => f.name)}
                  onClose={() => setTransferOpen(false)}
                  onConfirm={(targetName) => {
                    alert(`"${folders.filter((f) => checkedIds.has(f.id)).map((f) => f.name).join(', ')}" 문서함을 ${targetName}에게 이관했습니다.`)
                    onFoldersChange(folders.filter((f) => !checkedIds.has(f.id)))
                    setCheckedIds(new Set())
                    setTransferOpen(false)
                  }}
                />
              )}
            </div>
          ) : (
            <AutoClassifyTab />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 문서함 이관 모달 ── */
export function TransferModal({ folderNames, onClose, onConfirm }: {
  folderNames: string[]
  onClose: () => void
  onConfirm: (targetName: string, targetEmpId?: number) => void
}) {
  const [target, setTarget] = useState<{ name: string; empId: number } | null>(null)
  const [search, setSearch] = useState('')
  const [departments, setDepartments] = useState<PickerDepartment[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    departmentApi.getTreeWithMembers()
      .then(({ data: tree }) => {
        const depts: PickerDepartment[] = []
        function flatten(node: import('../../../api/org').OrgChartNode) {
          const members: PickerMember[] = node.members.map((m) => ({
            empId: m.empId, empNum: String(m.empId), name: m.empName,
            grade: m.gradeName, title: m.titleName ?? '', deptName: node.deptName,
          }))
          if (members.length > 0) depts.push({ deptId: node.id, name: node.deptName, members })
          for (const child of node.children ?? []) flatten(child)
        }
        for (const node of tree) flatten(node)
        setDepartments(depts)
        const exp: Record<string, boolean> = {}
        depts.forEach((d) => { exp[d.name] = true })
        setExpanded(exp)
      })
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(460px,calc(100vw-24px))] max-h-[600px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">문서함 이관</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 text-[12px] text-gray-600">
          이관 대상: <span className="font-semibold text-gray-900">{folderNames.join(', ')}</span>
        </div>

        {/* 검색 */}
        <div className="px-6 py-2 border-b border-gray-200">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mr-2 shrink-0">
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 검색"
              className="flex-1 text-[12px] outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* 조직도 */}
        <div className="flex-1 overflow-y-auto p-3 text-[12px]">
          {loading ? (
            <div className="text-center text-gray-400 py-8">로딩 중...</div>
          ) : (
            departments.map((dept) => {
              const filtered = dept.members.filter((m) => !search || m.name.includes(search) || m.grade.includes(search))
              if (search && filtered.length === 0) return null
              return (
                <div key={dept.deptId}>
                  <div
                    className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
                    onClick={() => setExpanded((prev) => ({ ...prev, [dept.name]: !prev[dept.name] }))}
                  >
                    <span className="text-[10px] text-gray-500 w-3">{expanded[dept.name] ? '▼' : '▶'}</span>
                    <span className="font-semibold text-gray-700">{dept.name}</span>
                    <span className="text-gray-400 text-[11px] ml-1">{dept.members.length}</span>
                  </div>
                  {expanded[dept.name] && filtered.map((m) => (
                    <div
                      key={m.empId}
                      className={`flex items-center gap-2 py-1.5 pl-6 pr-2 cursor-pointer rounded transition-colors ${
                        target?.empId === m.empId ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setTarget({ name: m.name, empId: m.empId })}
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 shrink-0">
                        <i className="fas fa-user" />
                      </div>
                      <span>{m.name} {m.grade}</span>
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* 선택된 대상 + 버튼 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-[12px] text-gray-500">
            {target ? <>이관 대상자: <span className="font-semibold text-gray-900">{target.name}</span></> : '사원을 선택하세요'}
          </div>
          <div className="flex gap-2">
            <button
              disabled={!target}
              onClick={() => { if (target) onConfirm(target.name, target.empId) }}
              className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              이관
            </button>
            <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 자동분류 탭 ── */
export function AutoClassifyTab() {
  const [rules, setRules] = useState<AutoClassifyRuleResponse[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [reordering, setReordering] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [personalFolders, setPersonalFolders] = useState<{ id: number; name: string }[]>([])

  const loadRules = useCallback(() => {
    return approvalApi.getAutoClassifyRules()
      .then(({ data }) => setRules(data))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { void loadRules() }, [loadRules])

  // 개인 문서함 목록 로딩 (자동분류 대상 폴더) — 모달 열 때마다 최신 조회
  const loadFolders = useCallback(() => {
    approvalApi.getPersonalFolders()
      .then(({ data }) => setPersonalFolders(data.map((f) => ({ id: f.id, name: f.name }))))
      .catch(() => { /* ignore */ })
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  const toggleAll = () => {
    if (rules.every((r) => checkedIds.has(r.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(rules.map((r) => r.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const [addRuleOpen, setAddRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoClassifyRuleResponse | null>(null)

  // 규칙 추가/수정 모달 열릴 때 폴더 목록 갱신
  useEffect(() => {
    if (addRuleOpen || editingRule) loadFolders()
  }, [addRuleOpen, editingRule, loadFolders])

  const moveRule = (from: number, to: number) => {
    if (to < 0 || to >= rules.length) return
    const updated = [...rules]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    setRules(updated)
  }

  const handleDelete = async () => {
    try {
      await Promise.all(Array.from(checkedIds).map((id) => approvalApi.deleteAutoClassifyRule(id)))
      setCheckedIds(new Set())
      setLoading(true); loadRules()
    } catch {
      alert('규칙 삭제에 실패했습니다.')
    }
  }

  const toggleActive = async (id: number) => {
    try {
      await approvalApi.toggleAutoClassifyRule(id)
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r))
    } catch {
      alert('상태 변경��� 실패했습니다.')
    }
  }

  const handleReorderDone = async () => {
    const orderList = rules.map((r, idx) => ({ id: r.id, sortOrder: idx + 1 }))
    try {
      await approvalApi.reorderAutoClassifyRules(orderList)
      setReordering(false)
      setLoading(true); loadRules()
    } catch {
      alert('순서 변경에 실패했습니다.')
    }
  }

  return (
    <div>
      {/* 툴바 */}
      <div className="flex items-center gap-4 text-[12px] text-gray-600 mb-4">
        <button
          onClick={() => { if (reordering) handleReorderDone(); else setReordering(true) }}
          className={`flex items-center gap-1 transition-colors ${reordering ? 'text-[#1D9E75] font-semibold' : 'hover:text-[#1D9E75]'}`}
        >
          <i className={`fas ${reordering ? 'fa-check' : 'fa-sort'} text-[10px]`} />
          {reordering ? '순서 바꾸기 완료' : '순서 바꾸기'}
        </button>
        {!reordering && (
          <>
            <button onClick={() => setAddRuleOpen(true)} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
              <i className="fas fa-plus text-[10px]" /> 추가
            </button>
            <button onClick={handleDelete} disabled={checkedIds.size === 0}
              className="flex items-center gap-1 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <i className="fas fa-trash-alt text-[10px]" /> 삭제
            </button>
          </>
        )}
      </div>

      {/* 테이블 */}
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            {reordering
              ? <th className="px-3 py-2.5 text-gray-500 font-medium w-12">순서</th>
              : <th className="px-3 py-2.5 text-gray-500 font-medium w-10"><input type="checkbox" checked={rules.length > 0 && rules.every((r) => checkedIds.has(r.id))} onChange={toggleAll} className="accent-[#1D9E75]" /></th>
            }
            <th className="px-3 py-2.5 text-gray-500 font-medium">분류규칙</th>
            <th className="px-3 py-2.5 text-gray-500 font-medium text-center whitespace-nowrap">대상</th>
            <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">분류 조건</th>
            <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">보관문서함</th>
            <th className="px-3 py-2.5 text-gray-500 font-medium text-center whitespace-nowrap w-16">활성</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-[13px]">로딩 중...</td></tr>
          ) : rules.length === 0 ? (
            <tr><td colSpan={6} className="py-16 text-center text-gray-300 text-[13px]">분류규칙이 없습니다.</td></tr>
          ) : (
            rules.map((r, idx) => {
              const condParts: string[] = []
              if (r.conditions.titleContains) condParts.push(`제목: "${r.conditions.titleContains}"`)
              if (r.conditions.formName) condParts.push(`양식: "${r.conditions.formName}"`)
              if (r.conditions.drafterName) condParts.push(`기안자: "${r.conditions.drafterName}"`)
              if (r.conditions.drafterDept) condParts.push(`부서: "${r.conditions.drafterDept}"`)
              const condStr = condParts.join(', ') || '-'
              return (
              <tr
                key={r.id}
                className={`border-b transition-colors ${
                  reordering && dragOverIdx === idx && dragIdx !== idx
                    ? 'border-t-2 border-t-[#1D9E75] bg-[#f0fdf8]'
                    : 'border-gray-100 hover:bg-gray-50'
                } ${reordering ? 'cursor-grab' : ''} ${reordering && dragIdx === idx ? 'opacity-40' : ''}`}
                draggable={reordering}
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
                onDrop={() => { if (dragIdx !== null && dragIdx !== idx) moveRule(dragIdx, idx); setDragIdx(null); setDragOverIdx(null) }}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
              >
                {reordering
                  ? <td className="px-3 py-2.5"><i className="fas fa-grip-vertical text-[12px] text-gray-400" /></td>
                  : <td className="px-3 py-2.5"><input type="checkbox" checked={checkedIds.has(r.id)} onChange={() => toggleOne(r.id)} className="accent-[#1D9E75]" /></td>
                }
                <td className="px-3 py-2.5 text-gray-800">
                  <button onClick={() => !reordering && setEditingRule(r)} className="hover:text-[#1D9E75] hover:underline transition-colors text-left">
                    {r.ruleName}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-500">{r.sourceBox === 'SENT' ? '발신' : '수신'}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{condStr}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{r.targetFolderName || '-'}</td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={() => toggleActive(r.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${r.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                </td>
              </tr>
              )
            })
          )}
        </tbody>
      </table>

      {addRuleOpen && (
        <AutoClassifyRuleModal
          folders={personalFolders}
          onClose={() => setAddRuleOpen(false)}
          onConfirm={async (rule) => {
            try {
              await approvalApi.createAutoClassifyRule({
                ruleName: rule.ruleName ?? `${rule.sourceBox} 자동분류`,
                sourceBox: rule.sourceBox === '발신 문서함' ? 'SENT' : 'INBOX',
                conditions: {
                  titleContains: rule.title || null,
                  formName: rule.formName || null,
                  drafterDept: rule.dept || null,
                  drafterName: rule.author || null,
                },
                targetFolderId: rule.targetFolderId ?? 0,
                isActive: true,
              })
              setLoading(true); loadRules()
              setAddRuleOpen(false)
            } catch {
              alert('규칙 생성에 실패했습니다.')
            }
          }}
        />
      )}

      {editingRule && (
        <AutoClassifyRuleModal
          folders={personalFolders}
          initialData={editingRule}
          onClose={() => setEditingRule(null)}
          onConfirm={async (rule) => {
            try {
              await approvalApi.updateAutoClassifyRule(editingRule.id, {
                ruleName: rule.ruleName ?? `${rule.sourceBox} 자동분류`,
                sourceBox: rule.sourceBox === '발신 문서함' ? 'SENT' : 'INBOX',
                conditions: {
                  titleContains: rule.title || null,
                  formName: rule.formName || null,
                  drafterDept: rule.dept || null,
                  drafterName: rule.author || null,
                },
                targetFolderId: rule.targetFolderId ?? 0,
                isActive: editingRule.isActive,
              })
              setLoading(true); loadRules()
              setEditingRule(null)
            } catch {
              alert('규칙 수정에 실패했습니다.')
            }
          }}
        />
      )}
    </div>
  )
}

/* ── 자동분류 규칙 추가 모달 ── */
const SOURCE_BOXES = ['발신 문서함', '수신 문서함'] as const

export function AutoClassifyRuleModal({ folders, onClose, onConfirm, initialData }: {
  folders: { id: number; name: string }[]
  onClose: () => void
  onConfirm: (rule: { sourceBox: string; title: string; formName: string; author: string; dept: string; targetFolder: string; targetFolderId?: number; ruleName?: string }) => void
  initialData?: AutoClassifyRuleResponse
}) {
  const isEdit = !!initialData
  const [ruleName, setRuleName] = useState(initialData?.ruleName ?? '')
  const [sourceBox, setSourceBox] = useState(
    initialData ? (initialData.sourceBox === 'SENT' ? '발신 문서함' : '수신 문서함') : (SOURCE_BOXES[0] as string)
  )
  const [useTitle, setUseTitle] = useState(!!initialData?.conditions.titleContains)
  const [title, setTitle] = useState(initialData?.conditions.titleContains ?? '')
  const [useForm, setUseForm] = useState(!!initialData?.conditions.formName)
  const [formName, setFormName] = useState(initialData?.conditions.formName ?? '')
  const [useAuthor, setUseAuthor] = useState(!!initialData?.conditions.drafterName)
  const [author, setAuthor] = useState(initialData?.conditions.drafterName ?? '')
  const [useDept, setUseDept] = useState(!!initialData?.conditions.drafterDept)
  const [dept, setDept] = useState(initialData?.conditions.drafterDept ?? '')
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(initialData?.targetFolderId ?? folders[0]?.id ?? null)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(400px,calc(100vw-24px))] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">{isEdit ? '자동분류 수정' : '자동분류'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 규칙명 */}
          <div>
            <label className="text-[12px] text-gray-700 font-semibold mb-1.5 block">규칙명</label>
            <input type="text" value={ruleName} onChange={(e) => setRuleName(e.target.value)}
              placeholder="예: 채용 관련 문서 자동분류"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
          </div>

          {/* 소스 문서함 */}
          <div className="flex items-center gap-2 text-[13px]">
            <select value={sourceBox} onChange={(e) => setSourceBox(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none bg-white text-gray-700">
              {SOURCE_BOXES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="text-gray-700">의 문서에</span>
          </div>

          {/* 제목 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useTitle} onChange={() => setUseTitle(!useTitle)} className="accent-[#1D9E75]" />
              제목이
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!useTitle}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 양식명 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useForm} onChange={() => setUseForm(!useForm)} className="accent-[#1D9E75]" />
              양식명이
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} disabled={!useForm}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 기안자 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useAuthor} onChange={() => setUseAuthor(!useAuthor)} className="accent-[#1D9E75]" />
              기안자가
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={!useAuthor}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 기안부서 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useDept} onChange={() => setUseDept(!useDept)} className="accent-[#1D9E75]" />
              기안부서가
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} disabled={!useDept}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 보관 문서함 */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[12px] font-semibold text-gray-700">해당 문서를 다음 문서함에 분류</span>
            <select value={selectedFolderId ?? ''} onChange={(e) => setSelectedFolderId(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
              {folders.length === 0
                ? <option value="" disabled>문서함이 없습니다</option>
                : folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {/* 안내 */}
          <div className="text-[11px] text-gray-400 space-y-1 pt-2">
            <p>※ 문서의 진행 상태가 완료된 것만 분류됩니다.</p>
            <p>※ 이미 수동으로 분류된 문서는 자동분류에 포함되지 않습니다.</p>
          </div>
        </div>

        <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => {
              const targetFolder = folders.find((f) => f.id === selectedFolderId)
              onConfirm({
                sourceBox,
                ruleName: ruleName || undefined,
                title: useTitle ? title : '',
                formName: useForm ? formName : '',
                author: useAuthor ? author : '',
                dept: useDept ? dept : '',
                targetFolder: targetFolder?.name ?? '',
                targetFolderId: targetFolder?.id,
              })
            }}
            className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors"
          >
            확인
          </button>
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
