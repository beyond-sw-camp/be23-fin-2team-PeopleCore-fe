import { useState, useRef } from 'react'

/* ── 조직도 부서 목록 (공유) ── */
export const PICKER_DEPARTMENTS = [
  { name: '경영', members: ['강희계 부장', '권시정 차장', '김인재 차장', '박지현 과장', '이수진 대리', '정하은 사원'] },
  { name: '개발', members: ['박서준 팀장', '이민호 과장', '최예린 대리', '한도윤 사원'] },
  { name: '인사', members: ['송미래 팀장', '윤서연 과장', '장현우 대리'] },
]

/* ── 공유 타입 ── */
export interface PersonalFolder {
  id: number; name: string; createdAt: string; docCount: number; shared: number
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
      <div className="relative bg-white rounded-xl shadow-xl w-[440px] flex flex-col">
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
export function OrgPickerModal({ onClose, onSelect, title = '조직도' }: { onClose: () => void; onSelect: (name: string) => void; title?: string }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(PICKER_DEPARTMENTS.map((d) => [d.name, true]))
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[340px] max-h-[500px] flex flex-col">
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
          {PICKER_DEPARTMENTS.map((dept) => {
            const filtered = dept.members.filter((m) => !search || m.includes(search))
            if (search && filtered.length === 0) return null
            return (
              <div key={dept.name}>
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
                    key={m}
                    className="flex items-center gap-2 py-1.5 pl-6 pr-2 cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors"
                    onClick={() => onSelect(m.split(' ')[0])}
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 shrink-0">
                      <i className="fas fa-user" />
                    </div>
                    <span className="text-gray-800">{m}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── 부재 추가 모달 ── */
export function AddAbsenceModal({ isOpen, onClose, onConfirm }: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { startDate: string; endDate: string; reason: string; delegate: string }) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')
  const [delegate, setDelegate] = useState('')
  const [orgPickerOpen, setOrgPickerOpen] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[600px] flex flex-col">
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
                <span className="text-[13px] text-gray-800">{delegate}</span>
                <button onClick={() => setDelegate('')} className="text-gray-400 hover:text-red-400 text-[11px]">
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
            onSelect={(name) => { setDelegate(name); setOrgPickerOpen(false) }}
          />
        )}
      </div>
    </div>
  )
}

/* ── 전자결재 환경 설정 모달 ── */
export function ApprovalSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('기본 설정')
  const [writeMode, setWriteMode] = useState('일반 작성')
  const [imageDisplay, setImageDisplay] = useState('thumbnail')
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const signInputRef = useRef<HTMLInputElement>(null)

  // 부재/위임 목록
  const [absences, setAbsences] = useState([
    { id: 1, startDate: '2025-08-27', endDate: '2025-08-27', delegate: '임고단', reason: '연차', active: true },
    { id: 2, startDate: '2025-06-23', endDate: '2025-06-23', delegate: '강희계', reason: 'dfgfdgfd', active: true },
  ])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [addAbsenceOpen, setAddAbsenceOpen] = useState(false)

  if (!isOpen) return null

  const tabs = ['기본 설정', '부재/위임 설정']

  const toggleAll = () => {
    if (absences.every((a) => checkedIds.has(a.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(absences.map((a) => a.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleDeleteAbsences = () => {
    setAbsences((prev) => prev.filter((a) => !checkedIds.has(a.id)))
    setCheckedIds(new Set())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[700px] max-h-[85vh] flex flex-col">
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
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setSignatureUrl(url)
                    }
                    e.target.value = ''
                  }}
                />
                <div className="flex items-start gap-4">
                  <div className="inline-block border border-gray-300 rounded-lg p-4 text-center min-w-[100px]">
                    <div className="text-[11px] text-gray-500 mb-2">직위</div>
                    <div className="w-16 h-16 mx-auto rounded-full border-2 border-red-400 flex items-center justify-center mb-2 overflow-hidden">
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="서명" className="w-full h-full object-cover" />
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
                        onClick={() => setSignatureUrl(null)}
                        className="px-3 py-1.5 text-[12px] border border-gray-300 rounded hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <i className="fas fa-trash-alt text-[10px] mr-1" /> 서명 삭제
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400">100 x 100 pixel 권장</p>
                  </div>
                </div>
              </div>

              {/* 결재 작성 방식 */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-6">
                  <span className="text-[13px] font-semibold text-gray-900 w-28">결재 작성 방식</span>
                  <select
                    value={writeMode}
                    onChange={(e) => setWriteMode(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                  >
                    <option>일반 작성</option>
                    <option>간편 작성</option>
                  </select>
                </div>
              </div>

              {/* 첨부 이미지 설정 */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-start gap-6">
                  <span className="text-[13px] font-semibold text-gray-900 w-28 pt-0.5">첨부 이미지 설정</span>
                  <div className="space-y-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="radio" name="imgDisplay" value="thumbnail" checked={imageDisplay === 'thumbnail'} onChange={() => setImageDisplay('thumbnail')} className="accent-[#1D9E75] mt-0.5" />
                      <div>
                        <span className="text-[12px] text-gray-900 font-medium">기본 사이즈로 표시</span>
                        <span className="text-[11px] text-gray-400 ml-1">(썸네일로 표시합니다. 100 x 100 pixel)</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="radio" name="imgDisplay" value="original" checked={imageDisplay === 'original'} onChange={() => setImageDisplay('original')} className="accent-[#1D9E75] mt-0.5" />
                      <div>
                        <span className="text-[12px] text-gray-900 font-medium">원본 사이즈로 표시</span>
                        <span className="text-[11px] text-gray-400 ml-1">(원본 크기로 표시합니다. 파일이 여러 개인 경우, 속도저하가 발생할 수 있습니다.)</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="radio" name="imgDisplay" value="filename" checked={imageDisplay === 'filename'} onChange={() => setImageDisplay('filename')} className="accent-[#1D9E75] mt-0.5" />
                      <div>
                        <span className="text-[12px] text-gray-900 font-medium">파일명으로 표시</span>
                        <span className="text-[11px] text-gray-400 ml-1">(파일 이름만 표시합니다.)</span>
                      </div>
                    </label>
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
                      <input type="checkbox" checked={absences.length > 0 && absences.every((a) => checkedIds.has(a.id))} onChange={toggleAll} className="accent-[#1D9E75]" />
                    </th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">부재 시작</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">부재 종료</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">대결자</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium">부재 사유</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">사용 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-300 text-[13px]">등록된 부재/위임 설정이 없습니다.</td></tr>
                  ) : (
                    absences.map((a) => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={checkedIds.has(a.id)} onChange={() => toggleOne(a.id)} className="accent-[#1D9E75]" />
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{a.startDate || '-'}</td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{a.endDate || '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600 whitespace-nowrap">{a.delegate || '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600">{a.reason || '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600 whitespace-nowrap">{a.active ? '사용' : '미사용'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <AddAbsenceModal
                isOpen={addAbsenceOpen}
                onClose={() => setAddAbsenceOpen(false)}
                onConfirm={(a) => {
                  setAbsences((prev) => [...prev, { id: Date.now(), ...a, active: true }])
                  setAddAbsenceOpen(false)
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
      <div className="relative bg-white rounded-xl shadow-xl w-[900px] max-h-[85vh] min-h-[500px] flex flex-col">
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
  onConfirm: (targetName: string) => void
}) {
  const [target, setTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(PICKER_DEPARTMENTS.map((d) => [d.name, true]))
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[460px] max-h-[600px] flex flex-col">
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
          {PICKER_DEPARTMENTS.map((dept) => {
            const filtered = dept.members.filter((m) => !search || m.includes(search))
            if (search && filtered.length === 0) return null
            return (
              <div key={dept.name}>
                <div
                  className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
                  onClick={() => setExpanded((prev) => ({ ...prev, [dept.name]: !prev[dept.name] }))}
                >
                  <span className="text-[10px] text-gray-500 w-3">{expanded[dept.name] ? '▼' : '▶'}</span>
                  <span className="font-semibold text-gray-700">{dept.name}</span>
                  <span className="text-gray-400 text-[11px] ml-1">{dept.members.length}</span>
                </div>
                {expanded[dept.name] && filtered.map((m) => {
                  const name = m.split(' ')[0]
                  return (
                    <div
                      key={m}
                      className={`flex items-center gap-2 py-1.5 pl-6 pr-2 cursor-pointer rounded transition-colors ${
                        target === name ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setTarget(name)}
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 shrink-0">
                        <i className="fas fa-user" />
                      </div>
                      <span>{m}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* 선택된 대상 + 버튼 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-[12px] text-gray-500">
            {target ? <>이관 대상자: <span className="font-semibold text-gray-900">{target}</span></> : '사원을 선택하세요'}
          </div>
          <div className="flex gap-2">
            <button
              disabled={!target}
              onClick={() => { if (target) onConfirm(target) }}
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
  const [enabled, setEnabled] = useState(true)
  const [rules, setRules] = useState<{ id: number; name: string; condition: string; folder: string }[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [reordering, setReordering] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const toggleAll = () => {
    if (rules.every((r) => checkedIds.has(r.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(rules.map((r) => r.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const [addRuleOpen, setAddRuleOpen] = useState(false)

  const moveRule = (from: number, to: number) => {
    if (to < 0 || to >= rules.length) return
    const updated = [...rules]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    setRules(updated)
  }

  const handleDelete = () => {
    setRules((prev) => prev.filter((r) => !checkedIds.has(r.id)))
    setCheckedIds(new Set())
  }

  return (
    <div>
      {/* 자동분류 규칙 on/off */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[13px] font-semibold text-blue-700">자동분류 규칙</span>
        <label className="flex items-center gap-1 text-[12px] text-gray-700 cursor-pointer">
          <input type="radio" name="autoClassify" checked={enabled} onChange={() => setEnabled(true)} className="accent-[#1D9E75]" />
          적용함
        </label>
        <label className="flex items-center gap-1 text-[12px] text-gray-700 cursor-pointer">
          <input type="radio" name="autoClassify" checked={!enabled} onChange={() => setEnabled(false)} className="accent-[#1D9E75]" />
          적용하지 않음
        </label>
      </div>

      {/* 저장/취소 */}
      <div className="flex justify-center gap-2 mb-6 border-b border-gray-100 pb-6">
        <button className="px-6 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">저장</button>
        <button className="px-6 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
      </div>

      {/* 툴바 */}
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
            <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">분류 조건</th>
            <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">보관문서함</th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr><td colSpan={4} className="py-16 text-center text-gray-300 text-[13px]">분류규칙이 없습니다.</td></tr>
          ) : (
            rules.map((r, idx) => (
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
                <td className="px-3 py-2.5 text-gray-800">{r.name}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{r.condition || '-'}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{r.folder || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {addRuleOpen && (
        <AutoClassifyRuleModal
          onClose={() => setAddRuleOpen(false)}
          onConfirm={(rule) => {
            const conditions: string[] = []
            if (rule.title) conditions.push(`제목: "${rule.title}"`)
            if (rule.formName) conditions.push(`양식: "${rule.formName}"`)
            if (rule.author) conditions.push(`기안자: "${rule.author}"`)
            if (rule.dept) conditions.push(`부서: "${rule.dept}"`)
            setRules((prev) => [...prev, {
              id: Date.now(),
              name: `${rule.sourceBox} 자동분류`,
              condition: conditions.join(', ') || '-',
              folder: rule.targetFolder,
            }])
            setAddRuleOpen(false)
          }}
        />
      )}
    </div>
  )
}

/* ── 자동분류 규칙 추가 모달 ── */
export function AutoClassifyRuleModal({ onClose, onConfirm }: {
  onClose: () => void
  onConfirm: (rule: { sourceBox: string; title: string; formName: string; author: string; dept: string; targetFolder: string }) => void
}) {
  const [sourceBox, setSourceBox] = useState('기안 문서함')
  const [useTitle, setUseTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [useForm, setUseForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [useAuthor, setUseAuthor] = useState(false)
  const [author, setAuthor] = useState('')
  const [useDept, setUseDept] = useState(false)
  const [dept, setDept] = useState('')
  const [targetFolder, setTargetFolder] = useState('테스트')

  const folders = ['테스트', '체험용 폴더']
  const boxes = ['기안 문서함', '결재 문서함', '수신 문서함', '참조/열람 문서함']

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[400px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">자동분류</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 소스 문서함 */}
          <div className="flex items-center gap-2 text-[13px]">
            <select value={sourceBox} onChange={(e) => setSourceBox(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none bg-[#1D9E75] text-white">
              {boxes.map((b) => <option key={b} value={b}>{b}</option>)}
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
            <select value={targetFolder} onChange={(e) => setTargetFolder(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
              {folders.map((f) => <option key={f} value={f}>{f}</option>)}
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
            onClick={() => onConfirm({
              sourceBox,
              title: useTitle ? title : '',
              formName: useForm ? formName : '',
              author: useAuthor ? author : '',
              dept: useDept ? dept : '',
              targetFolder,
            })}
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
