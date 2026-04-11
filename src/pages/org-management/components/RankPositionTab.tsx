import { useState, useRef } from 'react'
import type { Rank, Position, Department } from '../types'
import { gradeApi, titleApi } from '../../../api/org'
import AlertModal from '../../../components/common/AlertModal'

interface Props {
  ranks: Rank[]
  positions: Position[]
  departments: Department[]
  onUpdateRanks: (ranks: Rank[]) => void
  onUpdatePositions: (positions: Position[]) => void
}

// 직급 템플릿 카테고리
type TemplateCategory = 'office' | 'research' | 'tech' | 'medical'

const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: 'office', label: '사무직' },
  { key: 'research', label: '연구직' },
  { key: 'tech', label: '기술직' },
  { key: 'medical', label: '의료직' },
]

const RANK_TEMPLATES: Record<TemplateCategory, { name: string; code: string }[]> = {
  office: [
    { name: '회장', code: 'P010010' },
    { name: '부회장', code: 'P010020' },
    { name: '대표이사', code: 'P010030' },
    { name: '사장', code: 'P010040' },
    { name: '부사장', code: 'P010050' },
    { name: '전무', code: 'P010060' },
    { name: '상무', code: 'P010070' },
    { name: '이사', code: 'P010080' },
    { name: '부장', code: 'P010090' },
    { name: '차장', code: 'P010100' },
    { name: '과장', code: 'P010110' },
    { name: '대리', code: 'P010120' },
    { name: '주임', code: 'P010130' },
    { name: '사원', code: 'P010140' },
    { name: '인턴', code: 'P010150' },
  ],
  research: [
    { name: '수석연구원', code: 'P020010' },
    { name: '책임연구원', code: 'P020020' },
    { name: '선임연구원', code: 'P020030' },
    { name: '연구원', code: 'P020040' },
    { name: '연구보조원', code: 'P020050' },
  ],
  tech: [
    { name: '기술이사', code: 'P030010' },
    { name: '수석엔지니어', code: 'P030020' },
    { name: '책임엔지니어', code: 'P030030' },
    { name: '선임엔지니어', code: 'P030040' },
    { name: '엔지니어', code: 'P030050' },
    { name: '어시스턴트엔지니어', code: 'P030060' },
  ],
  medical: [
    { name: '과장(의사)', code: 'P040010' },
    { name: '전문의', code: 'P040020' },
    { name: '전공의', code: 'P040030' },
    { name: '수간호사', code: 'P040040' },
    { name: '간호사', code: 'P040050' },
    { name: '간호조무사', code: 'P040060' },
  ],
}

export default function RankPositionTab({ ranks, positions, departments, onUpdateRanks, onUpdatePositions }: Props) {
  const [activeSection, setActiveSection] = useState<'rank' | 'position'>('rank')

  // ── Rank state ──
  const [rankModal, setRankModal] = useState<{ mode: 'create' | 'edit'; rank?: Rank } | null>(null)
  const [rankName, setRankName] = useState('')

  // ── Rank reorder state ──
  const [isReordering, setIsReordering] = useState(false)
  const [reorderList, setReorderList] = useState<Rank[]>([])
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragIdxRef = useRef<number | null>(null)

  // ── Alert modal state ──
  const [alertState, setAlertState] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null)

  // ── Template category state ──
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('office')

  // ── Position state ──
  const [posModal, setPosModal] = useState<{ mode: 'create' | 'edit'; pos?: Position } | null>(null)
  const [posName, setPosName] = useState('')
  const [posDeptId, setPosDeptId] = useState<string>('')

  const sortedRanks = [...ranks].sort((a, b) => a.level - b.level)

  // ── Rank handlers ──
  const openRankCreate = () => {
    setRankName('')
    setRankModal({ mode: 'create' })
  }
  const openRankEdit = (rank: Rank) => {
    setRankName(rank.name)
    setRankModal({ mode: 'edit', rank })
  }
  const handleRankSubmit = async () => {
    if (!rankName.trim()) return
    try {
      if (rankModal?.mode === 'create') {
        const nextOrder = ranks.length > 0 ? Math.max(...ranks.map((r) => r.level)) + 1 : 1
        const { data } = await gradeApi.create({ gradeName: rankName.trim(), gradeCode: rankName.trim(), gradeOrder: nextOrder })
        const newRank: Rank = { id: String(data.gradeId ?? `r_${Date.now()}`), name: rankName.trim(), level: nextOrder, createdAt: new Date().toISOString() }
        onUpdateRanks([...ranks, newRank])
      } else if (rankModal?.mode === 'edit' && rankModal.rank) {
        await gradeApi.update(Number(rankModal.rank.id), { gradeName: rankName.trim() })
        onUpdateRanks(ranks.map((r) => r.id === rankModal.rank!.id ? { ...r, name: rankName.trim() } : r))
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : '직급 저장에 실패했습니다.')
      setAlertState({ type: 'error', title: '직급 저장 실패', message: msg })
    }
    setRankModal(null)
  }
  const handleRankDelete = async (rank: Rank) => {
    if (!confirm(`'${rank.name}' 직급을 삭제하시겠습니까?`)) return
    try {
      await gradeApi.delete(Number(rank.id))
      onUpdateRanks(ranks.filter((r) => r.id !== rank.id))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : '직급 삭제에 실패했습니다.')
      setAlertState({ type: 'error', title: '직급 삭제 실패', message: msg })
    }
  }

  // ── Reorder handlers ──
  const startReorder = () => {
    setReorderList([...sortedRanks])
    setIsReordering(true)
  }
  const cancelReorder = () => {
    setIsReordering(false)
    setReorderList([])
    setDragOverIdx(null)
    dragIdxRef.current = null
  }
  const finishReorder = async () => {
    const updated = reorderList.map((r, i) => ({ ...r, level: i + 1 }))
    onUpdateRanks(ranks.map((r) => {
      const found = updated.find((u) => u.id === r.id)
      return found ? { ...r, level: found.level } : r
    }))
    try {
      await gradeApi.updateOrder(updated.map((r) => Number(r.id)))
    } catch { /* 로컬은 이미 반영됨 */ }
    setIsReordering(false)
    setReorderList([])
    setDragOverIdx(null)
    dragIdxRef.current = null
  }

  const handleReorderDragStart = (idx: number) => {
    dragIdxRef.current = idx
  }
  const handleReorderDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdxRef.current === null || dragIdxRef.current === idx) {
      setDragOverIdx(null)
      return
    }
    setDragOverIdx(idx)
  }
  const handleReorderDrop = (idx: number) => {
    const fromIdx = dragIdxRef.current
    if (fromIdx === null || fromIdx === idx) return
    const list = [...reorderList]
    const [moved] = list.splice(fromIdx, 1)
    list.splice(idx, 0, moved)
    setReorderList(list)
    setDragOverIdx(null)
    dragIdxRef.current = null
  }
  const handleReorderDragEnd = () => {
    setDragOverIdx(null)
    dragIdxRef.current = null
  }

  // ── Position handlers ──
  const openPosCreate = () => { setPosName(''); setPosDeptId(''); setPosModal({ mode: 'create' }) }
  const openPosEdit = (pos: Position) => { setPosName(pos.name); setPosDeptId(pos.departmentId || ''); setPosModal({ mode: 'edit', pos }) }
  const handlePosSubmit = async () => {
    if (!posName.trim()) return
    try {
      if (posModal?.mode === 'create') {
        const { data } = await titleApi.create({ titleName: posName.trim(), deptId: posDeptId ? Number(posDeptId) : null })
        onUpdatePositions([...positions, { id: String(data.titleId ?? `p_${Date.now()}`), name: posName.trim(), departmentId: posDeptId || null, createdAt: new Date().toISOString() }])
      } else if (posModal?.mode === 'edit' && posModal.pos) {
        await titleApi.update(Number(posModal.pos.id), { titleName: posName.trim(), deptId: posDeptId ? Number(posDeptId) : null })
        onUpdatePositions(positions.map((p) => p.id === posModal.pos!.id ? { ...p, name: posName.trim(), departmentId: posDeptId || null } : p))
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '직책 저장에 실패했습니다.'
      setAlertState({ type: 'error', title: '직책 저장 실패', message: msg })
    }
    setPosModal(null)
  }
  const handlePosDelete = async (pos: Position) => {
    if (!confirm(`'${pos.name}' 직책을 삭제하시겠습니까?`)) return
    try {
      await titleApi.delete(Number(pos.id))
      onUpdatePositions(positions.filter((p) => p.id !== pos.id))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '직책 삭제에 실패했습니다.'
      setAlertState({ type: 'error', title: '직책 삭제 실패', message: msg })
    }
  }

  const displayRanks = isReordering ? reorderList : sortedRanks

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      {/* 섹션 탭 */}
      <div className="flex border-b border-gray-100">
        {(['rank', 'position'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { if (!isReordering) setActiveSection(tab) }}
            className={`px-5 py-3 text-[13px] font-medium transition-colors relative ${
              activeSection === tab ? 'text-[#1D9E75]' : 'text-gray-500 hover:text-gray-700'
            } ${isReordering && tab !== 'rank' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {tab === 'rank' ? '직급 체계' : '직책 체계'}
            {activeSection === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D9E75]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeSection === 'rank' ? (
          /* ── 직급 체계 ── */
          <div className="flex gap-5 h-full">
            {/* 좌: 직급 목록 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-[14px] font-bold text-gray-800">직급 목록</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">핵심 분류체계로 여러 화면에서 멤버의 기본정보로 사용합니다</p>
                </div>
                <div className="flex items-center gap-2">
                  {isReordering ? (
                    <>
                      <button onClick={cancelReorder}
                        className="px-3 py-1.5 text-[12px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                        취소
                      </button>
                      <button onClick={finishReorder}
                        className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">
                        <i className="fa-solid fa-check text-[10px] mr-1" />완료
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={startReorder} disabled={sortedRanks.length < 2}
                        className="px-3 py-1.5 text-[12px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        <i className="fa-solid fa-arrows-up-down text-[10px] mr-1" />순서 바꾸기
                      </button>
                      <button onClick={openRankCreate}
                        className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">
                        <i className="fa-solid fa-plus text-[10px] mr-1" />추가
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isReordering && (
                <div className="px-3 py-2 bg-blue-50 rounded-lg mb-3">
                  <p className="text-[11px] text-blue-600">
                    <i className="fa-solid fa-grip-vertical text-[10px] mr-1" />
                    드래그하여 직급 순서를 변경하세요. 위쪽이 높은 직급입니다.
                  </p>
                </div>
              )}

              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className={`grid ${isReordering ? 'grid-cols-[32px_40px_1fr_80px]' : 'grid-cols-[40px_1fr_80px_100px]'} px-4 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100`}>
                  {isReordering && <span />}
                  <span>순서</span><span>명칭</span><span>코드</span>
                  {!isReordering && <span className="text-right">작업</span>}
                </div>
                {displayRanks.map((rank, idx) => (
                  <div
                    key={rank.id}
                    draggable={isReordering}
                    onDragStart={() => isReordering && handleReorderDragStart(idx)}
                    onDragOver={(e) => isReordering && handleReorderDragOver(e, idx)}
                    onDrop={() => isReordering && handleReorderDrop(idx)}
                    onDragEnd={handleReorderDragEnd}
                    className={`grid ${isReordering ? 'grid-cols-[32px_40px_1fr_80px]' : 'grid-cols-[40px_1fr_80px_100px]'} px-4 py-2.5 text-[13px] border-b border-gray-50 last:border-0 items-center transition-colors relative ${
                      isReordering
                        ? 'cursor-grab active:cursor-grabbing hover:bg-gray-50'
                        : 'hover:bg-gray-50'
                    } ${dragOverIdx === idx ? 'bg-[#f0faf6]' : ''}`}
                  >
                    {dragOverIdx === idx && (
                      <div className="absolute left-2 right-2 top-0 h-[2px] bg-[#1D9E75] rounded-full" />
                    )}
                    {isReordering && (
                      <span className="flex items-center justify-center text-gray-300">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <circle cx="3" cy="2" r="1.2" />
                          <circle cx="3" cy="6" r="1.2" />
                          <circle cx="3" cy="10" r="1.2" />
                          <circle cx="7" cy="2" r="1.2" />
                          <circle cx="7" cy="6" r="1.2" />
                          <circle cx="7" cy="10" r="1.2" />
                        </svg>
                      </span>
                    )}
                    <span className="text-gray-400 font-mono">{isReordering ? idx + 1 : rank.level}</span>
                    <span className="text-gray-800 font-medium">{rank.name}</span>
                    <span className="text-gray-400 font-mono text-[11px]">{String(isReordering ? idx + 1 : rank.level).padStart(3, '0')}</span>
                    {!isReordering && (
                      <span className="flex justify-end gap-1">
                        <button onClick={() => openRankEdit(rank)} className="w-7 h-7 rounded hover:bg-blue-50 flex items-center justify-center text-blue-500">
                          <i className="fa-solid fa-pen text-[10px]" />
                        </button>
                        <button onClick={() => handleRankDelete(rank)} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center text-red-400">
                          <i className="fa-solid fa-trash text-[10px]" />
                        </button>
                      </span>
                    )}
                  </div>
                ))}
                {displayRanks.length === 0 && (
                  <div className="px-4 py-8 text-center text-[12px] text-gray-400">
                    우측 템플릿에서 직급을 추가하거나<br />직접 추가 버튼을 눌러주세요
                  </div>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-gray-200 shrink-0 self-stretch" />

            {/* 우: 직급 템플릿 */}
            <div className="w-[240px] shrink-0">
              <div className="mb-4">
                <h4 className="text-[14px] font-bold text-gray-800">템플릿</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">클릭하여 직급 목록에 추가합니다</p>
              </div>

              {/* 카테고리 드롭다운 */}
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as TemplateCategory)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] mb-3 focus:outline-none focus:border-[#1D9E75] bg-white"
              >
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>

              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_80px] px-4 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100">
                  <span>명칭</span><span>코드</span>
                </div>
                {RANK_TEMPLATES[templateCategory].map((tmpl) => {
                  const alreadyAdded = ranks.some((r) => r.name === tmpl.name)
                  return (
                    <div
                      key={tmpl.code}
                      onClick={async () => {
                        if (alreadyAdded || isReordering) return
                        const nextLevel = ranks.length > 0 ? Math.max(...ranks.map((r) => r.level)) + 1 : 1
                        try {
                          const { data } = await gradeApi.create({ gradeName: tmpl.name, gradeCode: tmpl.code, gradeOrder: nextLevel })
                          onUpdateRanks([...ranks, {
                            id: String(data.gradeId ?? `r_${Date.now()}_${tmpl.code}`),
                            name: tmpl.name,
                            level: nextLevel,
                            createdAt: new Date().toISOString(),
                          }])
                        } catch (err: unknown) {
                          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '직급 추가에 실패했습니다.'
                          setAlertState({ type: 'error', title: '직급 추가 실패', message: msg })
                        }
                      }}
                      className={`grid grid-cols-[1fr_80px] px-4 py-2.5 text-[13px] border-b border-gray-50 last:border-0 items-center transition-colors ${
                        alreadyAdded || isReordering
                          ? 'bg-gray-50 text-gray-300 cursor-default'
                          : 'hover:bg-[#f0faf6] cursor-pointer group'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {alreadyAdded ? (
                          <i className="fa-solid fa-check text-[10px] text-[#1D9E75]" />
                        ) : (
                          <i className={`fa-solid fa-plus text-[10px] ${isReordering ? 'text-gray-300' : 'text-gray-300 group-hover:text-[#1D9E75]'} transition-colors`} />
                        )}
                        <span className={alreadyAdded ? 'text-gray-400' : 'text-gray-800'}>{tmpl.name}</span>
                      </span>
                      <span className="text-gray-400 font-mono text-[11px]">{tmpl.code}</span>
                    </div>
                  )
                })}
              </div>
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

      {/* 알림 모달 */}
      <AlertModal
        isOpen={!!alertState}
        type={alertState?.type}
        title={alertState?.title}
        message={alertState?.message || ''}
        onClose={() => setAlertState(null)}
      />

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
