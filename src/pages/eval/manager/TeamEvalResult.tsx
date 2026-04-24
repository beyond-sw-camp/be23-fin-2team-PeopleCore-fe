import { useState, useEffect, useMemo } from 'react'
import {
  fetchTeamResultSeasons,
  fetchTeamResults,
  type MySeasonOptionDto,
  type TeamMemberResultDto,
} from '../../../api/managerEvaluation'
import { fetchRules } from '../../../api/evalRules'

// ─── 타입 ─────────────────────────────────────────
interface GradeDef {
  id: string        // 등급 식별자 ("S" 등)
  label: string     // 표시명
}

// ─── 색상 팔레트 (등급 순위 기반) ─────────────────
const COLOR_PALETTE = [
  { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]', border: 'border-[#7c3aed]' },
  { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]', border: 'border-[#2e9e6e]' },
  { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]' },
  { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]' },
  { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]', border: 'border-[#ef4444]' },
  { bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#64748b]' },
  { bg: 'bg-[#fff7ed]', text: 'text-[#ea580c]', border: 'border-[#ea580c]' },
  { bg: 'bg-[#ecfeff]', text: 'text-[#0891b2]', border: 'border-[#0891b2]' },
]
const FALLBACK_COLOR = { bg: 'bg-[#f5f5f5]', text: 'text-[#8a9490]', border: 'border-[#8a9490]' }

// ─── 컴포넌트 ─────────────────────────────────────
export default function TeamEvalResult() {
  const [seasons, setSeasons] = useState<MySeasonOptionDto[]>([])
  const [seasonId, setSeasonId] = useState<number | null>(null)
  const [grades, setGrades] = useState<GradeDef[]>([])
  const [gradeFilter, setGradeFilter] = useState<string>('ALL')
  const [teamResult, setTeamResult] = useState<TeamMemberResultDto[]>([])
  const [selectedMember, setSelectedMember] = useState<TeamMemberResultDto | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingResult, setLoadingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 시즌 + 회사 규칙(등급 정의) 병렬 로드
  useEffect(() => {
    Promise.all([fetchTeamResultSeasons(), fetchRules()])
      .then(([seasonList, rules]) => {
        setSeasons(seasonList)
        const gradeDefs: GradeDef[] = rules?.grades?.map(g => ({ id: g.id, label: g.label })) ?? []
        setGrades(gradeDefs)
        if (seasonList.length > 0) setSeasonId(seasonList[0].seasonId)
        else setLoading(false)
      })
      .catch(e => {
        console.error('[TeamEvalResult] initial load failed', e)
        setError(e?.response?.data?.message || '시즌/규칙 목록을 불러오지 못했습니다.')
        setLoading(false)
      })
  }, [])

  // seasonId 변경 시 결과 재조회 (전체를 한 번에 받아서 요약/필터 모두 클라이언트에서 처리)
  useEffect(() => {
    if (seasonId === null) return
    setLoadingResult(true)
    setError(null)
    fetchTeamResults(seasonId)
      .then(list => setTeamResult(list))
      .catch(e => {
        console.error('[TeamEvalResult] results failed', e)
        setError(e?.response?.data?.message || '팀원 결과를 불러오지 못했습니다.')
        setTeamResult([])
      })
      .finally(() => {
        setLoadingResult(false)
        setLoading(false)
      })
  }, [seasonId])

  // 시즌 변경 시 등급 필터 초기화
  useEffect(() => { setGradeFilter('ALL') }, [seasonId])

  // 화면에 보여줄 목록 — gradeFilter 기준 클라이언트 필터링 (요약은 전체 기준 유지)
  const visibleResult = useMemo(() => {
    if (gradeFilter === 'ALL') return teamResult
    return teamResult.filter(m => m.finalGradeId === gradeFilter)
  }, [teamResult, gradeFilter])

  // 등급 id → 메타 (label, color, rank)
  const gradeMap = useMemo(() => {
    const map = new Map<string, { def: GradeDef; color: typeof COLOR_PALETTE[number]; rank: number }>()
    grades.forEach((g, i) => {
      map.set(g.id, {
        def: g,
        color: COLOR_PALETTE[i] ?? FALLBACK_COLOR,
        rank: i,
      })
    })
    return map
  }, [grades])

  // 팀 요약 — 등급별 인원수 (현재 로드된 teamResult 기준)
  const summary = useMemo(() => {
    const counts = new Map<string, number>()
    grades.forEach(g => counts.set(g.id, 0))
    teamResult.forEach(m => {
      if (m.finalGradeId) counts.set(m.finalGradeId, (counts.get(m.finalGradeId) ?? 0) + 1)
    })
    return { counts, total: teamResult.length }
  }, [teamResult, grades])

  // 공개 전 판정 — IN_PROGRESS 이고 결과 비어있으면 "결과공개기간 아닙니다"
  const selectedSeason = seasons.find(s => s.seasonId === seasonId)
  const isLocked = !loadingResult && teamResult.length === 0 && gradeFilter === 'ALL' && selectedSeason?.status === 'IN_PROGRESS'

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(평가자) &gt; 팀원 평가 결과</div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 평가 결과</h1>
          <p className="text-[13px] text-[#8a9490]">확정된 평가 결과를 확인하고 면담을 진행하세요.</p>
        </div>
        <select
          value={seasonId ?? ''}
          onChange={e => setSeasonId(Number(e.target.value))}
          disabled={seasons.length === 0}
          className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          {seasons.length === 0
            ? <option>시즌 없음</option>
            : seasons.map(s => (
                <option key={s.seasonId} value={s.seasonId}>
                  {s.name} {s.status === 'FINALIZED' ? '· 결과확정' : '· 평가중'}
                </option>
              ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {seasons.length === 0 ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-16 text-center">
          <div className="text-[60px] mb-4">📋</div>
          <div className="text-[16px] font-semibold text-[#1a2b23] mb-2">참여한 시즌이 없습니다</div>
          <div className="text-[13px] text-[#8a9490]">평가자로 지정된 뒤 시즌이 진행되면 결과가 표시됩니다.</div>
        </div>
      ) : loadingResult ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center text-[14px] text-[#8a9490]">
          <i className="fas fa-spinner fa-spin mr-2" /> 결과 로딩 중...
        </div>
      ) : isLocked ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-16 text-center">
          <i className="fas fa-lock text-[32px] text-[#d0d8d4] mb-4"></i>
          <div className="text-[15px] font-medium text-[#5a6b62] mb-2">결과 공개 기간이 아닙니다</div>
          <div className="text-[12px] text-[#8a9490]">상위자 평가가 종료되고 자동 산정이 시작되면 결과가 공개됩니다.</div>
        </div>
      ) : (
        <>
          {/* 팀 요약 — 5개 이하 동적 grid, 6개 이상 가로 스크롤 */}
          {grades.length === 0 ? (
            <div className="text-[12px] text-[#8a9490] mb-4">등급 체계가 설정되지 않았습니다.</div>
          ) : grades.length <= 5 ? (
            <div
              className="grid gap-3 mb-6"
              style={{ gridTemplateColumns: `repeat(${grades.length + 1}, minmax(0, 1fr))` }}
            >
              <SummaryBox label="전체" count={summary.total} />
              {grades.map(g => (
                <SummaryBox
                  key={g.id}
                  label={g.label}
                  count={summary.counts.get(g.id) ?? 0}
                  color={gradeMap.get(g.id)?.color}
                />
              ))}
            </div>
          ) : (
            <div className="mb-6 overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                <div className="w-[120px] shrink-0">
                  <SummaryBox label="전체" count={summary.total} />
                </div>
                {grades.map(g => (
                  <div key={g.id} className="w-[120px] shrink-0">
                    <SummaryBox
                      label={g.label}
                      count={summary.counts.get(g.id) ?? 0}
                      color={gradeMap.get(g.id)?.color}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 필터 */}
          {grades.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[12px] text-[#5a6b62]">최종등급 필터:</span>
              <button
                onClick={() => setGradeFilter('ALL')}
                className={`px-3 py-1 rounded text-[12px] font-medium transition-colors border ${
                  gradeFilter === 'ALL'
                    ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                    : 'bg-white text-[#5a6b62] border-[#e0e5e3] hover:border-[#1D9E75]'
                }`}
              >전체</button>
              {grades.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGradeFilter(g.id)}
                  className={`px-3 py-1 rounded text-[12px] font-medium transition-colors border ${
                    gradeFilter === g.id
                      ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                      : 'bg-white text-[#5a6b62] border-[#e0e5e3] hover:border-[#1D9E75]'
                  }`}
                >{g.label}</button>
              ))}
            </div>
          )}

          {/* 결과 카드 그리드 — gradeFilter 로 필터링된 visibleResult 기준 */}
          {visibleResult.length === 0 ? (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center text-gray-400 text-[13px]">
              해당 조건에 맞는 팀원이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibleResult.map(m => {
                const adjusted = m.autoGradeId !== m.finalGradeId
                return (
                  <button
                    key={m.empId}
                    type="button"
                    onClick={() => setSelectedMember(m)}
                    className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-left hover:border-[#1D9E75] hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[15px] font-semibold text-[#1a2b23]">{m.empName}</div>
                        <div className="text-[11px] text-[#8a9490] mt-0.5">{m.position}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {adjusted && <span className="text-[10px] text-[#f59e0b]" title="조정됨">▾</span>}
                        {m.finalGradeId && <GradeChip gradeId={m.finalGradeId} gradeMap={gradeMap} size="lg" bold />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] flex-wrap">
                      {m.managerGradeId && (
                        <>
                          <GradeFlow label="부여" gradeId={m.managerGradeId} gradeMap={gradeMap} />
                          <span className="text-gray-300">→</span>
                        </>
                      )}
                      {m.autoGradeId && (
                        <>
                          <GradeFlow label="최초" gradeId={m.autoGradeId} gradeMap={gradeMap} muted />
                          <span className="text-gray-300">→</span>
                        </>
                      )}
                      {m.finalGradeId && (
                        <GradeFlow label="최종" gradeId={m.finalGradeId} gradeMap={gradeMap} bold />
                      )}
                    </div>

                    {m.managerComment && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 line-clamp-1">
                        💬 {m.managerComment}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-4 p-3 bg-[#f2faf6] border border-[#d4ecdd] rounded-md text-[11px] text-gray-600">
            ▾ 표시는 최초 부여 등급과 최종 등급이 다른 경우 (강제배분 또는 HR 보정으로 조정됨).
            카드를 클릭하면 상세 코멘트를 확인할 수 있습니다.
          </div>
        </>
      )}

      {selectedMember && (
        <DetailModal member={selectedMember} gradeMap={gradeMap} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}


// ─── 요약 박스 ────────────────────────────────────
function SummaryBox({ label, count, color }: {
  label: string
  count: number
  color?: typeof COLOR_PALETTE[number]
}) {
  const isDefault = !color
  return (
    <div
      className={`rounded-lg p-3 text-center border ${
        isDefault ? 'bg-white border-[#e0e5e3]' : `${color.bg} ${color.border}`
      }`}
    >
      <div
        className={`text-[11px] mb-1 truncate ${
          isDefault ? 'text-[#8a9490]' : `${color.text} font-semibold`
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[20px] font-bold truncate ${isDefault ? 'text-[#1a2b23]' : color.text}`}
      >
        {count}명
      </div>
    </div>
  )
}


// ─── 등급 칩 ──────────────────────────────────────
type GradeMap = Map<string, { def: GradeDef; color: typeof COLOR_PALETTE[number]; rank: number }>

function GradeChip({ gradeId, gradeMap, muted, bold, size = 'md' }: {
  gradeId: string
  gradeMap: GradeMap
  muted?: boolean
  bold?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const meta = gradeMap.get(gradeId)
  const color = meta?.color ?? FALLBACK_COLOR
  const label = meta?.def.label ?? gradeId
  const sizeCls =
    size === 'sm' ? 'px-1.5 py-0.5 text-[10px] min-w-[22px]' :
    size === 'lg' ? 'px-3 py-1 text-[14px] min-w-[32px]' :
                    'px-2.5 py-0.5 text-[12px] min-w-[26px]'
  return (
    <span
      className={`inline-block text-center rounded ${sizeCls} ${color.bg} ${color.text} ${bold ? 'font-bold' : 'font-medium'} ${muted ? 'opacity-60' : ''}`}
    >
      {label}
    </span>
  )
}

function GradeFlow({ label, gradeId, gradeMap, muted, bold }: {
  label: string
  gradeId: string
  gradeMap: GradeMap
  muted?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#8a9490]">{label}</span>
      <GradeChip gradeId={gradeId} gradeMap={gradeMap} size="sm" muted={muted} bold={bold} />
    </div>
  )
}


// ─── 상세 모달 ────────────────────────────────────
function DetailModal({ member, gradeMap, onClose }: {
  member: TeamMemberResultDto
  gradeMap: GradeMap
  onClose: () => void
}) {
  const adjusted = member.autoGradeId !== member.finalGradeId
  const labelOf = (id: string | null) => (id ? gradeMap.get(id)?.def.label ?? id : '-')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#1a2b23]">{member.empName}</h2>
            <p className="text-[12px] text-[#8a9490]">{member.position}</p>
          </div>
          <button onClick={onClose} className="text-[20px] text-gray-400 hover:text-gray-600 leading-none">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <GradeStep label="본인이 준 등급" gradeId={member.managerGradeId} gradeMap={gradeMap} />
          <GradeStep label="최초 부여 등급" gradeId={member.autoGradeId} gradeMap={gradeMap} muted />
          <GradeStep label="최종 등급" gradeId={member.finalGradeId} gradeMap={gradeMap} bold />
        </div>

        {adjusted && member.autoGradeId && member.finalGradeId && (
          <div className="mb-4 p-2 bg-[#fffbeb] border border-[#fde68a] rounded text-[11px] text-[#92400e]">
            최초 부여 등급({labelOf(member.autoGradeId)})이 강제배분/보정으로 <strong>{labelOf(member.finalGradeId)}</strong> 으로 조정됨
          </div>
        )}

        <div className="border-t border-[#e0e5e3] pt-4 space-y-3">
          <div>
            <div className="text-[12px] text-[#5a6b62] mb-1 font-medium flex items-center gap-1.5">
              <i className="fas fa-lock text-[10px] text-gray-400"></i>
              평가 코멘트
              <span className="text-[10px] font-normal text-gray-400">(내부용 · 사원 비공개)</span>
            </div>
            <div className="text-[13px] text-[#1a2b23] leading-relaxed min-h-[48px] bg-[#f8faf9] border border-[#e0e5e3] rounded-md p-3">
              {member.managerComment || <span className="text-gray-400">작성된 코멘트가 없습니다.</span>}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#5a6b62] mb-1 font-medium flex items-center gap-1.5">
              <i className="fas fa-comment text-[10px] text-[#1D9E75]"></i>
              피드백
              <span className="text-[10px] font-normal text-gray-400">(사원 공개)</span>
            </div>
            <div className="text-[13px] text-[#1a2b23] leading-relaxed min-h-[48px] bg-[#f2faf6] border border-[#d4ecdd] rounded-md p-3">
              {member.managerFeedback || <span className="text-gray-400">작성된 피드백이 없습니다.</span>}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-[#1D9E75] text-white border-none rounded-lg text-[13px] cursor-pointer hover:bg-[#0F6E56]">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}


function GradeStep({ label, gradeId, gradeMap, muted, bold }: {
  label: string
  gradeId: string | null
  gradeMap: GradeMap
  muted?: boolean
  bold?: boolean
}) {
  const meta = gradeId ? gradeMap.get(gradeId) : null
  const color = meta?.color ?? FALLBACK_COLOR
  const text = meta?.def.label ?? (gradeId ?? '-')
  return (
    <div className={`rounded-md border p-3 text-center ${meta ? color.bg : 'bg-white'} ${meta ? color.border : 'border-[#e0e5e3]'}`}>
      <div className="text-[11px] text-[#8a9490] mb-1">{label}</div>
      <div className={`text-[22px] ${meta ? color.text : 'text-[#d0d8d4]'} ${bold ? 'font-bold' : 'font-semibold'} ${muted ? 'opacity-60' : ''}`}>
        {text}
      </div>
    </div>
  )
}
