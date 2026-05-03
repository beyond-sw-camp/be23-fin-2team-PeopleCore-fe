import { useState, useRef } from 'react'
import type { Rank, Position } from '../types'
import { gradeApi, titleApi } from '../../../api/org'
import AlertModal from '../../../components/common/AlertModal'

interface Props {
  ranks: Rank[]
  positions: Position[]
  onUpdateRanks: (ranks: Rank[]) => void
  onUpdatePositions: (positions: Position[]) => void
}

// 직급/직책 템플릿 카테고리 (직급/직책 공통 분류)
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

// 직책 템플릿 — 전사 공통 직책 (조직 운영 직책)
const POSITION_TEMPLATES: Record<TemplateCategory, { name: string; code: string }[]> = {
  office: [
    { name: '대표', code: 'T010010' },
    { name: '센터장', code: 'T010020' },
    { name: '본부장', code: 'T010030' },
    { name: '실장', code: 'T010040' },
    { name: '사업부장', code: 'T010050' },
    { name: '팀장', code: 'T010060' },
    { name: '파트장', code: 'T010070' },
    { name: '그룹장', code: 'T010080' },
    { name: '셀장', code: 'T010090' },
    { name: 'PM', code: 'T010100' },
    { name: 'PL', code: 'T010110' },
  ],
  research: [
    { name: '연구소장', code: 'T020010' },
    { name: '랩장', code: 'T020020' },
    { name: '그룹리더', code: 'T020030' },
    { name: 'PI', code: 'T020040' },
  ],
  tech: [
    { name: 'CTO', code: 'T030010' },
    { name: '기술본부장', code: 'T030020' },
    { name: '아키텍트', code: 'T030030' },
    { name: 'TL (Tech Lead)', code: 'T030040' },
    { name: '스쿼드 리더', code: 'T030050' },
  ],
  medical: [
    { name: '병원장', code: 'T040010' },
    { name: '진료부장', code: 'T040020' },
    { name: '과장', code: 'T040030' },
    { name: '간호부장', code: 'T040040' },
    { name: '파트장', code: 'T040050' },
  ],
}

export default function RankPositionTab({ ranks, positions, onUpdateRanks, onUpdatePositions }: Props) {
  const [activeSection, setActiveSection] = useState<'rank' | 'position'>('rank')

  // ── Rank state ──
  const [rankModal, setRankModal] = useState<{ mode: 'create' | 'edit'; rank?: Rank } | null>(null)
  const [rankName, setRankName] = useState('')

  // ── Rank reorder state ──
  const [isReordering, setIsReordering] = useState(false)
  const [reorderList, setReorderList] = useState<Rank[]>([])
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragIdxRef = useRef<number | null>(null)

  // ── Position reorder state ──
  const [isReorderingPos, setIsReorderingPos] = useState(false)
  const [posReorderList, setPosReorderList] = useState<Position[]>([])
  const [posDragOverIdx, setPosDragOverIdx] = useState<number | null>(null)
  const posDragIdxRef = useRef<number | null>(null)

  // ── Alert modal state ──
  const [alertState, setAlertState] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null)

  // ── Template category state ──
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('office')

  // ── Position state ──
  const [posModal, setPosModal] = useState<{ mode: 'create' | 'edit'; pos?: Position } | null>(null)
  const [posName, setPosName] = useState('')

  const sortedRanks = [...ranks].sort((a, b) => a.level - b.level)
  const sortedPositions = [...positions].sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER
    const bo = b.order ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return (a.code || '').localeCompare(b.code || '')
  })

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

  // ── Reorder handlers (직급 전용) ──
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

  // ── Position reorder handlers ──
  const startPosReorder = () => {
    setPosReorderList([...sortedPositions])
    setIsReorderingPos(true)
  }
  const cancelPosReorder = () => {
    setIsReorderingPos(false)
    setPosReorderList([])
    setPosDragOverIdx(null)
    posDragIdxRef.current = null
  }
  const finishPosReorder = async () => {
    const updated = posReorderList.map((p, i) => ({ ...p, order: i + 1 }))
    onUpdatePositions(positions.map((p) => {
      const found = updated.find((u) => u.id === p.id)
      return found ? { ...p, order: found.order } : p
    }))
    try {
      await titleApi.updateOrder(updated.map((p) => Number(p.id)))
    } catch { /* 로컬은 이미 반영됨 */ }
    setIsReorderingPos(false)
    setPosReorderList([])
    setPosDragOverIdx(null)
    posDragIdxRef.current = null
  }

  const handlePosReorderDragStart = (idx: number) => {
    posDragIdxRef.current = idx
  }
  const handlePosReorderDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (posDragIdxRef.current === null || posDragIdxRef.current === idx) {
      setPosDragOverIdx(null)
      return
    }
    setPosDragOverIdx(idx)
  }
  const handlePosReorderDrop = (idx: number) => {
    const fromIdx = posDragIdxRef.current
    if (fromIdx === null || fromIdx === idx) return
    const list = [...posReorderList]
    const [moved] = list.splice(fromIdx, 1)
    list.splice(idx, 0, moved)
    setPosReorderList(list)
    setPosDragOverIdx(null)
    posDragIdxRef.current = null
  }
  const handlePosReorderDragEnd = () => {
    setPosDragOverIdx(null)
    posDragIdxRef.current = null
  }

  // ── Position handlers ──
  const openPosCreate = () => { setPosName(''); setPosModal({ mode: 'create' }) }
  const openPosEdit = (pos: Position) => { setPosName(pos.name); setPosModal({ mode: 'edit', pos }) }
  const handlePosSubmit = async () => {
    if (!posName.trim()) return
    try {
      if (posModal?.mode === 'create') {
        const nextOrder = positions.length > 0 ? Math.max(...positions.map((p) => p.order ?? 0)) + 1 : 1
        const { data } = await titleApi.create({ titleName: posName.trim() })
        onUpdatePositions([...positions, {
          id: String(data.titleId ?? `p_${Date.now()}`),
          name: posName.trim(),
          code: data.titleCode,
          order: data.titleOrder ?? nextOrder,
          createdAt: new Date().toISOString(),
        }])
      } else if (posModal?.mode === 'edit' && posModal.pos) {
        await titleApi.update(Number(posModal.pos.id), { titleName: posName.trim() })
        onUpdatePositions(positions.map((p) => p.id === posModal.pos!.id ? { ...p, name: posName.trim() } : p))
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

  const handlePosTemplateClick = async (tmpl: { name: string; code: string }) => {
    if (positions.some((p) => p.name === tmpl.name)) return
    try {
      const nextOrder = positions.length > 0 ? Math.max(...positions.map((p) => p.order ?? 0)) + 1 : 1
      const { data } = await titleApi.create({ titleName: tmpl.name, titleCode: tmpl.code })
      onUpdatePositions([...positions, {
        id: String(data.titleId ?? `p_${Date.now()}_${tmpl.code}`),
        name: tmpl.name,
        code: data.titleCode || tmpl.code,
        order: data.titleOrder ?? nextOrder,
        createdAt: new Date().toISOString(),
      }])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '직책 추가에 실패했습니다.'
      setAlertState({ type: 'error', title: '직책 추가 실패', message: msg })
    }
  }

  const displayRanks = isReordering ? reorderList : sortedRanks
  const displayPositions = isReorderingPos ? posReorderList : sortedPositions
  const anyReordering = isReordering || isReorderingPos

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      {/* 섹션 탭 */}
      <div className="flex border-b border-gray-100">
        {(['rank', 'position'] as const).map((tab) => {
          const lockedByOtherSection = anyReordering && (
            (tab === 'position' && isReordering) || (tab === 'rank' && isReorderingPos)
          )
          return (
            <button
              key={tab}
              onClick={() => { if (!lockedByOtherSection) setActiveSection(tab) }}
              className={`px-5 py-3 text-[13px] font-medium transition-colors relative ${
                activeSection === tab ? 'text-[#1D9E75]' : 'text-gray-500 hover:text-gray-700'
              } ${lockedByOtherSection ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {tab === 'rank' ? '직급 체계' : '직책 체계'}
              {activeSection === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D9E75]" />}
            </button>
          )
        })}
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
          /* ── 직책 체계 (직급과 동일한 레이아웃) ── */
          <div className="flex gap-5 h-full">
            {/* 좌: 직책 목록 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-[14px] font-bold text-gray-800">직책 목록</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">전사 공통 직책으로, 부서와 무관하게 사원에 부여합니다</p>
                </div>
                <div className="flex items-center gap-2">
                  {isReorderingPos ? (
                    <>
                      <button onClick={cancelPosReorder}
                        className="px-3 py-1.5 text-[12px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                        취소
                      </button>
                      <button onClick={finishPosReorder}
                        className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">
                        <i className="fa-solid fa-check text-[10px] mr-1" />완료
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={startPosReorder} disabled={sortedPositions.length < 2}
                        className="px-3 py-1.5 text-[12px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        <i className="fa-solid fa-arrows-up-down text-[10px] mr-1" />순서 바꾸기
                      </button>
                      <button onClick={openPosCreate}
                        className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">
                        <i className="fa-solid fa-plus text-[10px] mr-1" />추가
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isReorderingPos && (
                <div className="px-3 py-2 bg-blue-50 rounded-lg mb-3">
                  <p className="text-[11px] text-blue-600">
                    <i className="fa-solid fa-grip-vertical text-[10px] mr-1" />
                    드래그하여 직책 순서를 변경하세요. 위쪽이 상위 직책입니다.
                  </p>
                </div>
              )}

              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className={`grid ${isReorderingPos ? 'grid-cols-[32px_40px_1fr_80px]' : 'grid-cols-[1fr_100px_100px]'} px-4 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100`}>
                  {isReorderingPos && <span />}
                  {isReorderingPos && <span>순서</span>}
                  <span>명칭</span><span>코드</span>
                  {!isReorderingPos && <span className="text-right">작업</span>}
                </div>
                {displayPositions.map((pos, idx) => {
                  const isSystemDefault = pos.code === '000' || pos.name === '미배정'
                  return (
                    <div
                      key={pos.id}
                      draggable={isReorderingPos && !isSystemDefault}
                      onDragStart={() => isReorderingPos && !isSystemDefault && handlePosReorderDragStart(idx)}
                      onDragOver={(e) => isReorderingPos && handlePosReorderDragOver(e, idx)}
                      onDrop={() => isReorderingPos && handlePosReorderDrop(idx)}
                      onDragEnd={handlePosReorderDragEnd}
                      className={`grid ${isReorderingPos ? 'grid-cols-[32px_40px_1fr_80px]' : 'grid-cols-[1fr_100px_100px]'} px-4 py-2.5 text-[13px] border-b border-gray-50 last:border-0 items-center transition-colors relative ${
                        isReorderingPos
                          ? (isSystemDefault ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-gray-50')
                          : 'hover:bg-gray-50'
                      } ${posDragOverIdx === idx ? 'bg-[#f0faf6]' : ''}`}
                    >
                      {posDragOverIdx === idx && (
                        <div className="absolute left-2 right-2 top-0 h-[2px] bg-[#1D9E75] rounded-full" />
                      )}
                      {isReorderingPos && (
                        <span className="flex items-center justify-center text-gray-300">
                          {!isSystemDefault && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                              <circle cx="3" cy="2" r="1.2" />
                              <circle cx="3" cy="6" r="1.2" />
                              <circle cx="3" cy="10" r="1.2" />
                              <circle cx="7" cy="2" r="1.2" />
                              <circle cx="7" cy="6" r="1.2" />
                              <circle cx="7" cy="10" r="1.2" />
                            </svg>
                          )}
                        </span>
                      )}
                      {isReorderingPos && <span className="text-gray-400 font-mono">{idx + 1}</span>}
                      <span className="flex items-center gap-2">
                        <span className="text-gray-800 font-medium">{pos.name}</span>
                        {isSystemDefault && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] text-gray-500 bg-gray-100 rounded border border-gray-200"
                            title="시스템 기본 직책으로, 수정·삭제할 수 없습니다"
                          >
                            시스템 기본
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400 font-mono text-[11px]">{pos.code || '-'}</span>
                      {!isReorderingPos && (
                        <span className="flex justify-end gap-1">
                          <button
                            onClick={() => !isSystemDefault && openPosEdit(pos)}
                            disabled={isSystemDefault}
                            className="w-7 h-7 rounded flex items-center justify-center text-blue-500 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <i className="fa-solid fa-pen text-[10px]" />
                          </button>
                          <button
                            onClick={() => !isSystemDefault && handlePosDelete(pos)}
                            disabled={isSystemDefault}
                            className="w-7 h-7 rounded flex items-center justify-center text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <i className="fa-solid fa-trash text-[10px]" />
                          </button>
                        </span>
                      )}
                    </div>
                  )
                })}
                {displayPositions.length === 0 && (
                  <div className="px-4 py-8 text-center text-[12px] text-gray-400">
                    우측 템플릿에서 직책을 추가하거나<br />직접 추가 버튼을 눌러주세요
                  </div>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-gray-200 shrink-0 self-stretch" />

            {/* 우: 직책 템플릿 */}
            <div className="w-[240px] shrink-0">
              <div className="mb-4">
                <h4 className="text-[14px] font-bold text-gray-800">템플릿</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">클릭하여 직책 목록에 추가합니다</p>
              </div>

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
                {POSITION_TEMPLATES[templateCategory].map((tmpl) => {
                  const alreadyAdded = positions.some((p) => p.name === tmpl.name)
                  const disabled = alreadyAdded || isReorderingPos
                  return (
                    <div
                      key={tmpl.code}
                      onClick={() => { if (!disabled) handlePosTemplateClick(tmpl) }}
                      className={`grid grid-cols-[1fr_80px] px-4 py-2.5 text-[13px] border-b border-gray-50 last:border-0 items-center transition-colors ${
                        disabled
                          ? 'bg-gray-50 text-gray-300 cursor-default'
                          : 'hover:bg-[#f0faf6] cursor-pointer group'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {alreadyAdded ? (
                          <i className="fa-solid fa-check text-[10px] text-[#1D9E75]" />
                        ) : (
                          <i className={`fa-solid fa-plus text-[10px] ${isReorderingPos ? 'text-gray-300' : 'text-gray-300 group-hover:text-[#1D9E75]'} transition-colors`} />
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
        )}
      </div>

      {/* 직급 모달 */}
      {rankModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setRankModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[min(360px,calc(100vw-24px))] p-6" onClick={(e) => e.stopPropagation()}>
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
          <div className="relative bg-white rounded-xl shadow-2xl w-[min(360px,calc(100vw-24px))] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-bold text-gray-800 mb-4">{posModal.mode === 'create' ? '직책 추가' : '직책 수정'}</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">직책명</label>
                <input value={posName} onChange={(e) => setPosName(e.target.value)} autoFocus placeholder="예: 팀장"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
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
