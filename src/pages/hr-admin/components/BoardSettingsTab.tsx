import { useState } from 'react'

/* ── 타입 ── */
interface BoardConfig {
  id: number
  name: string
  code: string
  type: 'company' | 'dept'
  deptName: string
  isAnonymous: boolean
  isActive: boolean
  canWrite: 'all' | 'admin' | 'dept'
  canComment: boolean
  hasLike: boolean
}

/* ── Mock 데이터 ── */
const INIT_BOARDS: BoardConfig[] = [
  { id: 1, name: '전사 게시판', code: 'COMPANY_BOARD', type: 'company', deptName: '전사', isAnonymous: false, isActive: true, canWrite: 'admin', canComment: true, hasLike: true },
  { id: 3, name: '자유 게시판', code: 'FREE_BOARD', type: 'company', deptName: '전사', isAnonymous: false, isActive: true, canWrite: 'all', canComment: true, hasLike: true },
  { id: 4, name: '동호회 소식', code: 'CLUB_NEWS', type: 'company', deptName: '전사', isAnonymous: false, isActive: true, canWrite: 'all', canComment: true, hasLike: true },
  { id: 10, name: '익명게시', code: 'DEPT_ANON', type: 'dept', deptName: '경영', isAnonymous: true, isActive: true, canWrite: 'dept', canComment: true, hasLike: true },
  { id: 11, name: '개발게시판', code: 'DEPT_DEV', type: 'dept', deptName: '경영', isAnonymous: false, isActive: true, canWrite: 'dept', canComment: true, hasLike: true },
  { id: 12, name: 'CS', code: 'DEPT_CS', type: 'dept', deptName: '경영', isAnonymous: false, isActive: true, canWrite: 'dept', canComment: true, hasLike: false },
]

const WRITE_PERM_LABEL: Record<string, string> = { all: '전체', admin: '관리자만', dept: '해당 부서' }

export default function BoardSettingsTab() {
  const [boards, setBoards] = useState<BoardConfig[]>(INIT_BOARDS)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // 추가 폼
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState<'company' | 'dept'>('company')
  const [newDept, setNewDept] = useState('전사')

  const selected = boards.find((b) => b.id === selectedId) ?? null

  const addBoard = () => {
    if (!newName.trim() || !newCode.trim()) return
    setBoards((p) => [...p, {
      id: Date.now(),
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      type: newType,
      deptName: newType === 'company' ? '전사' : newDept,
      isAnonymous: false,
      isActive: true,
      canWrite: 'all',
      canComment: true,
      hasLike: true,
    }])
    setNewName('')
    setNewCode('')
    setNewType('company')
    setNewDept('전사')
    setAddOpen(false)
  }

  const deleteBoard = (id: number) => {
    setBoards((p) => p.filter((b) => b.id !== id))
    if (selectedId === id) setSelectedId(null)
    setDeleteConfirmId(null)
  }

  const updateBoard = (id: number, patch: Partial<BoardConfig>) => {
    setBoards((p) => p.map((b) => b.id === id ? { ...b, ...patch } : b))
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">게시판 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">게시판을 추가/삭제하고 게시판별 권한을 설정합니다.</p>

      <div className="border border-gray-200 rounded-xl p-5 min-h-[500px]">
        <div className="flex gap-6">
          {/* 왼쪽: 게시판 목록 */}
          <div className="w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-[13px] font-semibold text-gray-800">게시판 목록</h5>
              <button onClick={() => setAddOpen(true)} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors text-[#1D9E75] font-medium">+ 추가</button>
            </div>

            {/* 추가 폼 */}
            {addOpen && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="게시판 이름" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" autoFocus />
                <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="게시판 코드 (예: NOTICE)" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-[12px] cursor-pointer">
                    <input type="radio" name="newType" checked={newType === 'company'} onChange={() => setNewType('company')} className="accent-[#1D9E75]" /> 전사
                  </label>
                  <label className="flex items-center gap-1 text-[12px] cursor-pointer">
                    <input type="radio" name="newType" checked={newType === 'dept'} onChange={() => setNewType('dept')} className="accent-[#1D9E75]" /> 부서
                  </label>
                  {newType === 'dept' && (
                    <select value={newDept} onChange={(e) => setNewDept(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none">
                      <option>경영</option><option>개발</option><option>인사</option>
                    </select>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={addBoard} className="px-3 py-1 text-[11px] bg-[#1D9E75] text-white rounded hover:bg-[#178a65] transition-colors font-medium">확인</button>
                  <button onClick={() => { setAddOpen(false); setNewName(''); setNewCode('') }} className="px-3 py-1 text-[11px] border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors">취소</button>
                </div>
              </div>
            )}

            {/* 전사 게시판 */}
            <div className="mb-2">
              <div className="text-[11px] text-gray-400 font-semibold px-2 py-1">전사 게시판</div>
              {boards.filter((b) => b.type === 'company').map((b) => (
                <div key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={`flex items-center justify-between py-1.5 px-3 rounded cursor-pointer transition-colors text-[12px] ${selectedId === b.id ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-1.5">
                    {!b.isActive && <i className="fas fa-eye-slash text-[9px] text-gray-400" />}
                    <span>{b.name}</span>
                    {b.isAnonymous && <span className="text-[9px] bg-gray-200 text-gray-500 px-1 rounded">익명</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(b.id) }} className="text-gray-300 hover:text-red-500 text-[10px]"><i className="fas fa-trash-alt" /></button>
                </div>
              ))}
            </div>

            {/* 부서 게시판 */}
            <div>
              <div className="text-[11px] text-gray-400 font-semibold px-2 py-1">부서 게시판</div>
              {boards.filter((b) => b.type === 'dept').map((b) => (
                <div key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={`flex items-center justify-between py-1.5 px-3 rounded cursor-pointer transition-colors text-[12px] ${selectedId === b.id ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-1.5">
                    {!b.isActive && <i className="fas fa-eye-slash text-[9px] text-gray-400" />}
                    <span>{b.name}</span>
                    <span className="text-[10px] text-gray-400">({b.deptName})</span>
                    {b.isAnonymous && <span className="text-[9px] bg-gray-200 text-gray-500 px-1 rounded">익명</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(b.id) }} className="text-gray-300 hover:text-red-500 text-[10px]"><i className="fas fa-trash-alt" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 선택된 게시판 권한 설정 */}
          <div className="flex-1">
            {!selected ? (
              <div className="text-[13px] text-gray-400 text-center py-20">왼쪽에서 게시판을 선택하세요.</div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-[14px] font-bold text-gray-800">{selected.name} 설정</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${selected.isActive ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-100 text-gray-500'}`}>
                    {selected.isActive ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h5 className="text-[12px] font-semibold text-gray-700 mb-2">기본 정보</h5>
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">게시판 이름</span>
                      <input value={selected.name} onChange={(e) => updateBoard(selected.id, { name: e.target.value })} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none flex-1" />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">게시판 코드</span>
                      <input value={selected.code} onChange={(e) => updateBoard(selected.id, { code: e.target.value })} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-40 font-mono" />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">유형</span>
                      <span className="text-[12px] text-gray-800">{selected.type === 'company' ? '전사' : `부서 (${selected.deptName})`}</span>
                    </div>
                  </div>

                  {/* 권한 설정 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h5 className="text-[12px] font-semibold text-gray-700 mb-2">권한 설정</h5>

                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">글 작성 권한</span>
                      <select value={selected.canWrite} onChange={(e) => updateBoard(selected.id, { canWrite: e.target.value as BoardConfig['canWrite'] })}
                        className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
                        <option value="all">전체</option>
                        <option value="admin">관리자만</option>
                        <option value="dept">해당 부서</option>
                      </select>
                      <span className="text-[11px] text-gray-400">{WRITE_PERM_LABEL[selected.canWrite]}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">댓글 허용</span>
                      <button onClick={() => updateBoard(selected.id, { canComment: !selected.canComment })}
                        className={`px-3 py-1 text-[11px] border rounded transition-colors ${selected.canComment ? 'border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE] font-medium' : 'border-gray-300 text-gray-500'}`}>
                        {selected.canComment ? '허용' : '비허용'}
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">좋아요 기능</span>
                      <button onClick={() => updateBoard(selected.id, { hasLike: !selected.hasLike })}
                        className={`px-3 py-1 text-[11px] border rounded transition-colors ${selected.hasLike ? 'border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE] font-medium' : 'border-gray-300 text-gray-500'}`}>
                        {selected.hasLike ? '사용' : '미사용'}
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">익명 게시</span>
                      <button onClick={() => updateBoard(selected.id, { isAnonymous: !selected.isAnonymous })}
                        className={`px-3 py-1 text-[11px] border rounded transition-colors ${selected.isAnonymous ? 'border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE] font-medium' : 'border-gray-300 text-gray-500'}`}>
                        {selected.isAnonymous ? '사용' : '미사용'}
                      </button>
                    </div>
                  </div>

                  {/* 운영 설정 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h5 className="text-[12px] font-semibold text-gray-700 mb-2">운영 설정</h5>

                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-500 w-24 shrink-0">게시판 활성화</span>
                      <button onClick={() => updateBoard(selected.id, { isActive: !selected.isActive })}
                        className={`px-4 py-1.5 text-[12px] border rounded-lg transition-colors ${selected.isActive ? 'border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE] font-medium' : 'border-gray-300 text-gray-500'}`}>
                        {selected.isActive ? '활성' : '비활성'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-[360px]">
            <h3 className="text-[14px] font-bold text-gray-900 mb-2">게시판 삭제</h3>
            <p className="text-[12px] text-gray-600 mb-5">
              <strong>{boards.find((b) => b.id === deleteConfirmId)?.name}</strong> 게시판을 삭제하시겠습니까?<br />
              <span className="text-red-500">삭제 시 해당 게시판의 모든 게시글이 함께 삭제됩니다.</span>
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => deleteBoard(deleteConfirmId)} className="px-4 py-1.5 bg-red-500 text-white text-[12px] font-medium rounded-lg hover:bg-red-600 transition-colors">삭제</button>
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-1.5 border border-gray-300 text-gray-600 text-[12px] font-medium rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
