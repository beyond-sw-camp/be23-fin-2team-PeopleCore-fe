import { useState } from 'react'
import type { Rank, Position, Department } from '../types'

interface Props {
  ranks: Rank[]
  positions: Position[]
  departments: Department[]
  onUpdateRanks: (ranks: Rank[]) => void
  onUpdatePositions: (positions: Position[]) => void
}

export default function RankPositionTab({ ranks, positions, departments, onUpdateRanks, onUpdatePositions }: Props) {
  const [activeSection, setActiveSection] = useState<'rank' | 'position'>('rank')

  // ── Rank state ──
  const [rankModal, setRankModal] = useState<{ mode: 'create' | 'edit'; rank?: Rank } | null>(null)
  const [rankName, setRankName] = useState('')
  const [rankLevel, setRankLevel] = useState(1)

  // ── Position state ──
  const [posModal, setPosModal] = useState<{ mode: 'create' | 'edit'; pos?: Position } | null>(null)
  const [posName, setPosName] = useState('')
  const [posDeptId, setPosDeptId] = useState<string>('')

  const sortedRanks = [...ranks].sort((a, b) => a.level - b.level)

  // ── Rank handlers ──
  const openRankCreate = () => { setRankName(''); setRankLevel(ranks.length + 1); setRankModal({ mode: 'create' }) }
  const openRankEdit = (rank: Rank) => { setRankName(rank.name); setRankLevel(rank.level); setRankModal({ mode: 'edit', rank }) }
  const handleRankSubmit = () => {
    if (!rankName.trim()) return
    if (rankModal?.mode === 'create') {
      onUpdateRanks([...ranks, { id: `r_${Date.now()}`, name: rankName.trim(), level: rankLevel, createdAt: new Date().toISOString() }])
    } else if (rankModal?.mode === 'edit' && rankModal.rank) {
      onUpdateRanks(ranks.map((r) => r.id === rankModal.rank!.id ? { ...r, name: rankName.trim(), level: rankLevel } : r))
    }
    setRankModal(null)
  }
  const handleRankDelete = (rank: Rank) => {
    if (confirm(`'${rank.name}' 직급을 삭제하시겠습니까?`)) {
      onUpdateRanks(ranks.filter((r) => r.id !== rank.id))
    }
  }

  // ── Position handlers ──
  const openPosCreate = () => { setPosName(''); setPosDeptId(''); setPosModal({ mode: 'create' }) }
  const openPosEdit = (pos: Position) => { setPosName(pos.name); setPosDeptId(pos.departmentId || ''); setPosModal({ mode: 'edit', pos }) }
  const handlePosSubmit = () => {
    if (!posName.trim()) return
    if (posModal?.mode === 'create') {
      onUpdatePositions([...positions, { id: `p_${Date.now()}`, name: posName.trim(), departmentId: posDeptId || null, createdAt: new Date().toISOString() }])
    } else if (posModal?.mode === 'edit' && posModal.pos) {
      onUpdatePositions(positions.map((p) => p.id === posModal.pos!.id ? { ...p, name: posName.trim(), departmentId: posDeptId || null } : p))
    }
    setPosModal(null)
  }
  const handlePosDelete = (pos: Position) => {
    if (confirm(`'${pos.name}' 직책을 삭제하시겠습니까?`)) {
      onUpdatePositions(positions.filter((p) => p.id !== pos.id))
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      {/* 섹션 탭 */}
      <div className="flex border-b border-gray-100">
        {(['rank', 'position'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`px-5 py-3 text-[13px] font-medium transition-colors relative ${
              activeSection === tab ? 'text-[#1D9E75]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'rank' ? '직급 체계' : '직책 체계'}
            {activeSection === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D9E75]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeSection === 'rank' ? (
          /* ── 직급 체계 ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-800">직급 체계</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">순서(Level) 1이 가장 높은 직급입니다</p>
              </div>
              <button onClick={openRankCreate}
                className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">
                <i className="fa-solid fa-plus text-[10px] mr-1" />직급 추가
              </button>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_120px] px-4 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100">
                <span>순서</span><span>직급명</span><span className="text-right">작업</span>
              </div>
              {sortedRanks.map((rank) => (
                <div key={rank.id} className="grid grid-cols-[60px_1fr_120px] px-4 py-2.5 text-[13px] border-b border-gray-50 last:border-0 hover:bg-gray-50 items-center">
                  <span className="text-gray-400 font-mono">{rank.level}</span>
                  <span className="text-gray-800 font-medium">{rank.name}</span>
                  <span className="flex justify-end gap-1">
                    <button onClick={() => openRankEdit(rank)} className="w-7 h-7 rounded hover:bg-blue-50 flex items-center justify-center text-blue-500">
                      <i className="fa-solid fa-pen text-[10px]" />
                    </button>
                    <button onClick={() => handleRankDelete(rank)} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center text-red-400">
                      <i className="fa-solid fa-trash text-[10px]" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── 직책 체계 ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-800">직책 체계</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">부서 미지정 시 전사 공통 직책으로 적용됩니다</p>
              </div>
              <button onClick={openPosCreate}
                className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">
                <i className="fa-solid fa-plus text-[10px] mr-1" />직책 추가
              </button>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_150px_120px] px-4 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100">
                <span>직책명</span><span>적용 부서</span><span className="text-right">작업</span>
              </div>
              {positions.map((pos) => (
                <div key={pos.id} className="grid grid-cols-[1fr_150px_120px] px-4 py-2.5 text-[13px] border-b border-gray-50 last:border-0 hover:bg-gray-50 items-center">
                  <span className="text-gray-800 font-medium">{pos.name}</span>
                  <span className="text-gray-500 text-[12px]">
                    {pos.departmentId ? departments.find((d) => d.id === pos.departmentId)?.name || '-' : '전사 공통'}
                  </span>
                  <span className="flex justify-end gap-1">
                    <button onClick={() => openPosEdit(pos)} className="w-7 h-7 rounded hover:bg-blue-50 flex items-center justify-center text-blue-500">
                      <i className="fa-solid fa-pen text-[10px]" />
                    </button>
                    <button onClick={() => handlePosDelete(pos)} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center text-red-400">
                      <i className="fa-solid fa-trash text-[10px]" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 직급 모달 */}
      {rankModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setRankModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[360px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-bold text-gray-800 mb-4">{rankModal.mode === 'create' ? '직급 추가' : '직급 수정'}</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">직급명</label>
                <input value={rankName} onChange={(e) => setRankName(e.target.value)} autoFocus placeholder="예: 대리"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">순서 (Level)</label>
                <input type="number" min={1} value={rankLevel} onChange={(e) => setRankLevel(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRankModal(null)} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleRankSubmit} disabled={!rankName.trim()}
                className="px-4 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40">
                {rankModal.mode === 'create' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 직책 모달 */}
      {posModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setPosModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[360px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-bold text-gray-800 mb-4">{posModal.mode === 'create' ? '직책 추가' : '직책 수정'}</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">직책명</label>
                <input value={posName} onChange={(e) => setPosName(e.target.value)} autoFocus placeholder="예: 팀장"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">적용 부서</label>
                <select value={posDeptId} onChange={(e) => setPosDeptId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]">
                  <option value="">전사 공통</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPosModal(null)} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handlePosSubmit} disabled={!posName.trim()}
                className="px-4 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40">
                {posModal.mode === 'create' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
