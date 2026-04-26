import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGradeDetail, type EvalGradeDetailDto } from '../../../api/evalGrade'

interface Props {
  id: string   // URL param — gradeId (number as string)
  onBack?: () => void  // 탭 기반 페이지에서 호출 시 — URL 변경 없이 목록으로
}

const gradeColors: Record<string, string> = {
  S: 'bg-[#1D9E75]/10 text-[#1D9E75]',
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-yellow-100 text-yellow-700',
  C: 'bg-orange-100 text-orange-700',
  D: 'bg-red-100 text-red-700',
}

const gradeAccent: Record<string, string> = {
  S: '#7c3aed',
  A: '#2e9e6e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
}

// 백엔드 enum → 프론트 라벨 매핑
const taskGradeLabel: Record<string, string> = {
  HIGH: '상',
  MID: '중',
  LOW: '하',
}

const achievementLabel: Record<string, string> = {
  EXCELLENT: '우수',
  GOOD: '양호',
  AVERAGE: '보통',
  POOR: '부족',
  INADEQUATE: '미흡',
}

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 16)
}

export default function EvalResultDetail({ id, onBack }: Props) {
  const navigate = useNavigate()
  const goBack = () => {
    if (onBack) onBack()
    else navigate('/eval/result/view')
  }
  const gradeId = Number(id)
  const [detail, setDetail] = useState<EvalGradeDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState<'self' | 'manager' | null>(null)

  useEffect(() => {
    if (!Number.isFinite(gradeId)) {
      setError('잘못된 접근입니다.')
      setLoading(false)
      return
    }
    setLoading(true)
    fetchGradeDetail(gradeId)
      .then(d => setDetail(d))
      .catch((e: any) => {
        console.error('[EvalResultDetail] fetch failed', e)
        setError(e?.response?.data?.message || '상세 정보를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [gradeId])

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto py-20 text-center text-sm text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="max-w-[900px] mx-auto py-20 text-center">
        <div className="text-[48px] mb-4">🔍</div>
        <div className="text-[15px] text-gray-700 mb-1 font-medium">{error ?? '해당 결과를 찾을 수 없습니다'}</div>
        <div className="text-[12px] text-gray-400 mb-6">gradeId: {id}</div>
        <button
          onClick={goBack}
          className="px-5 py-2.5 bg-[#1D9E75] text-white rounded-lg text-[13px] hover:bg-[#0F6E56]"
        >
          ← 목록으로
        </button>
      </div>
    )
  }

  const d = detail
  const weightedSum = d.itemScores.reduce((s, it) => s + (it.score ?? 0) * it.weight / 100, 0)
  const adjustSum = d.adjustments.reduce((s, a) => s + a.points, 0)
  const accent = d.finalGrade ? gradeAccent[d.finalGrade] ?? '#8a9490' : '#8a9490'

  const hasZScore = d.teamAvg != null && d.companyAvg != null

  // 실제로 렌더될 섹션만 모아서 순차 번호 부여 (조건부 섹션 스킵 시 번호 건너뛰지 않도록)
  const visibleSteps: string[] = []
  if (d.goals && d.goals.length > 0) visibleSteps.push('goals')
  visibleSteps.push('items')
  visibleSteps.push('total')
  if (hasZScore) visibleSteps.push('zscore')
  if (d.autoGrade) visibleSteps.push('autoGrade')
  if (d.calibrations.length > 0) visibleSteps.push('calibration')
  if (d.lockedAt) visibleSteps.push('locked')
  const stepOf = (key: string) => visibleSteps.indexOf(key) + 1

  return (
    <div className="max-w-[900px] mx-auto">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-4">
        <button
          onClick={goBack}
          className="hover:text-[#1D9E75] flex items-center gap-1"
        >
          <span>←</span>
          <span>평가 결과 조회</span>
        </button>
        <span>/</span>
        <span className="text-gray-700 font-medium">{d.empName} 상세</span>
      </div>

      {/* 히어로 헤더 */}
      <div
        className="rounded-2xl p-7 mb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}15 0%, ${accent}05 60%, transparent 100%)`,
          border: `1px solid ${accent}30`,
        }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5" style={{ backgroundColor: accent }} />

        <div className="flex items-center justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-gray-500 bg-white/70 px-2 py-0.5 rounded">{d.empNum}</span>
              <span className="text-[11px] text-gray-500">{d.seasonName}</span>
            </div>
            <h1 className="text-[24px] font-bold text-gray-900 mb-1">{d.empName}</h1>
            <div className="text-[13px] text-gray-600">{d.deptName} · {d.position}</div>
          </div>

          {d.finalGrade && (
            <div className="text-right">
              <div className="text-[11px] text-gray-500 mb-1">최종 등급</div>
              <span className={`text-[20px] px-4 py-1.5 rounded-lg font-bold ${gradeColors[d.finalGrade] ?? 'bg-gray-100 text-gray-700'}`}>
                {d.finalGrade}
              </span>
            </div>
          )}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <SummaryCard label="종합점수" value={d.rawScore?.toFixed(1) ?? '-'} unit="점" />
          <SummaryCard label="보정 점수" value={d.adjustedScore?.toFixed(1) ?? '-'} unit="점" highlight={accent} />
          <SummaryCard label="자동 등급" value={d.autoGrade ?? '-'} badge={d.autoGrade ? (gradeColors[d.autoGrade] ?? '') : ''} />
        </div>
      </div>

      {/* 액션 바 */}
      <div className="mb-5">
        <div className="text-[12px] text-gray-500">
          평가 프로세스를 시간 순서대로 표시합니다
        </div>
      </div>

      <div className="relative">
        {/* 타임라인 세로선 */}
        <div className="absolute left-[18px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#1D9E75] via-gray-200 to-transparent" />

        <div className="space-y-3">
          {d.goals && d.goals.length > 0 && (
            <Section step={stepOf('goals')} title="목표 등록" subtitle="사원이 등록한 목표 목록 (KPI/OKR · 업무등급 · 비율)">
              <div className="space-y-2">
                {d.goals.map((g, i) => {
                  const gradeKo = taskGradeLabel[g.grade] ?? g.grade
                  return (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        g.goalType === 'KPI' ? 'bg-[#eff6ff] text-[#3b82f6]' : 'bg-[#faf5ff] text-[#7c3aed]'
                      }`}>
                        {g.goalType}
                      </span>
                      <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{g.category}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        gradeKo === '상' ? 'bg-[#faf5ff] text-[#7c3aed]' :
                        gradeKo === '중' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                        'bg-gray-100 text-gray-500'
                      }`}>{gradeKo}</span>
                      <div className="flex-1 text-[13px] text-gray-800 font-medium truncate">{g.title}</div>
                      {g.targetValue != null && (
                        <span className="text-[11px] text-gray-500">{g.targetValue}{g.targetUnit}</span>
                      )}
                      <span className="text-[13px] font-bold text-[#1D9E75]">{g.ratio}%</span>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          <Section step={stepOf('items')} title="평가 입력 내역" subtitle="사원·상위자가 제출한 원 점수">
            <div className="space-y-2">
              {d.itemScores.map(it => {
                const isSelf = it.itemId === 'self'
                const isManager = it.itemId === 'manager'
                const hasDetail = (isSelf && d.selfEvalEntries && d.selfEvalEntries.length > 0)
                  || (isManager && d.managerEvalEntry)
                const clickable = hasDetail
                return (
                  <div
                    key={it.itemId}
                    onClick={clickable ? () => setModalOpen(isSelf ? 'self' : 'manager') : undefined}
                    className={`bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 transition-all ${
                      clickable ? 'cursor-pointer hover:border-[#1D9E75] hover:shadow-sm group' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-gray-800">{it.itemName}</div>
                      <div className="text-[11px] text-gray-400">가중치 {it.weight}%</div>
                    </div>
                    {it.score != null
                      ? <span className="text-[16px] font-bold text-gray-800">{it.score}<span className="text-[11px] text-gray-400 ml-0.5">점</span></span>
                      : <span className="text-[12px] text-gray-400">미제출</span>}
                    {clickable && (
                      <span className="text-[18px] text-gray-300 group-hover:text-[#1D9E75] transition-colors">›</span>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          <Section step={stepOf('total')} title="종합점수 산출" subtitle="가중 평균 + 가감 항목 적용">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="space-y-1.5">
                {d.itemScores.map(it => (
                  <FormulaRow key={it.itemId}
                    label={`${it.itemName} × ${it.weight}%`}
                    value={it.score != null ? (it.score * it.weight / 100).toFixed(1) : '-'}
                  />
                ))}
                {d.adjustments.map((a, i) => (
                  <FormulaRow key={i}
                    label={a.name}
                    value={a.points >= 0 ? `+${a.points}` : `${a.points}`}
                    color={a.points >= 0 ? '#2e9e6e' : '#ef4444'}
                  />
                ))}
              </div>
              <div className="border-t border-dashed border-gray-200 mt-3 pt-3 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-gray-700">원점수 합계</span>
                <span className="text-[16px] font-bold text-gray-900">{(weightedSum + adjustSum).toFixed(1)}</span>
              </div>
            </div>
          </Section>

          {hasZScore && (
            <Section step={stepOf('zscore')} title="Z-score 편향 보정" subtitle="팀장 관대·엄격 차이 통계적 제거">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <StatBox label="팀 평균 / 표편" value={`${d.teamAvg ?? '-'} / ${d.teamStd ?? '-'}`} />
                  <StatBox label="전사 평균 / 표편" value={`${d.companyAvg ?? '-'} / ${d.companyStd ?? '-'}`} />
                </div>
                <div className="bg-gradient-to-r from-[#eaf6f0] to-transparent rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#1a2b23]">보정 후 최종 점수</span>
                  <span className="text-[16px] font-bold text-[#1D9E75]">{d.adjustedScore?.toFixed(1) ?? '-'}</span>
                </div>
              </div>
            </Section>
          )}

          {d.autoGrade && (
            <Section step={stepOf('autoGrade')} title="등급 산정" subtitle="강제배분 비율에 따른 자동 배정">
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">보정 후 점수 기반</div>
                  <div className="text-[14px] font-semibold text-gray-700">자동 등급 산정 완료</div>
                </div>
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-[22px] shadow-md"
                  style={{ backgroundColor: gradeAccent[d.autoGrade] ?? '#8a9490' }}
                >
                  {d.autoGrade}
                </span>
              </div>
            </Section>
          )}

          {d.calibrations.length > 0 && (
            <Section step={stepOf('calibration')} title="보정 이력" subtitle="평가조정회의 결과 Slot 교환 기록">
              <div className="space-y-2">
                {d.calibrations.map((c, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <GradeChip grade={c.fromGrade} />
                      <span className="text-gray-300">→</span>
                      <GradeChip grade={c.toGrade} highlight />
                      <div className="flex-1" />
                      <span className="text-[11px] text-gray-400">{fmtDate(c.date)}</span>
                    </div>

                    {c.actor && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#f2faf6] border border-[#d4ecdd] rounded-md">
                        <div className="w-6 h-6 rounded-full bg-[#1D9E75] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {c.actor.replace(/^HR\s*/, '').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-400">보정자</div>
                          <div className="text-[12px] font-semibold text-[#1a2b23]">{c.actor}</div>
                        </div>
                      </div>
                    )}

                    <div className="text-[12px] text-gray-600 leading-relaxed bg-gray-50 rounded-md px-3 py-2">
                      <span className="text-gray-400 mr-1">사유:</span>{c.reason}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {d.lockedAt && (
            <Section step={stepOf('locked')} title="최종 확정" subtitle="HR 최종 잠금 · 급여 연동 준비 완료">
              <div className="bg-gradient-to-r from-[#1D9E75]/10 to-transparent border border-[#1D9E75]/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1D9E75] text-white flex items-center justify-center text-[18px]">🔒</div>
                <div>
                  <div className="text-[12px] font-semibold text-gray-800">잠금 완료</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{fmtDate(d.lockedAt)}</div>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* 자기평가 상세 모달 */}
      {modalOpen === 'self' && d.selfEvalEntries.length > 0 && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(null)}>
          <div className="bg-white rounded-2xl max-w-[720px] w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">자기평가 상세</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">목표별 사원이 제출한 실적 · 달성 내용 · 근거자료</p>
              </div>
              <button onClick={() => setModalOpen(null)} className="text-gray-400 hover:text-gray-700 text-[20px] bg-transparent border-none cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {d.selfEvalEntries.map((e, i) => {
                const gradeKo = taskGradeLabel[e.grade] ?? e.grade
                const achievementKo = e.achievementLevel ? (achievementLabel[e.achievementLevel] ?? e.achievementLevel) : null
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        e.goalType === 'KPI' ? 'bg-[#eff6ff] text-[#3b82f6]' : 'bg-[#faf5ff] text-[#7c3aed]'
                      }`}>{e.goalType}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        gradeKo === '상' ? 'bg-[#faf5ff] text-[#7c3aed]' :
                        gradeKo === '중' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                        'bg-gray-100 text-gray-500'
                      }`}>{gradeKo}</span>
                      <span className="text-[14px] text-gray-800 font-semibold flex-1">{e.title}</span>
                      {e.goalType === 'KPI' && e.actualValue != null && (
                        <span className="text-[12px] text-gray-600 whitespace-nowrap">
                          실적 <span className="font-bold text-gray-900">{e.actualValue}{e.targetUnit}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          목표 {e.targetValue}{e.targetUnit}
                        </span>
                      )}
                      {e.goalType === 'OKR' && achievementKo && (
                        <span className="text-[12px] text-gray-600 whitespace-nowrap">달성 <span className="font-bold text-gray-900">{achievementKo}</span></span>
                      )}
                    </div>
                    <div className="text-[12px] text-gray-400 mb-1">달성 상세</div>
                    <div className="text-[12px] text-gray-700 bg-gray-50 rounded-md px-3 py-2 leading-relaxed mb-3">
                      {e.achievementDetail}
                    </div>
                    {e.files.length > 0 && (
                      <>
                        <div className="text-[12px] text-gray-400 mb-1">📎 근거자료</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {e.files.map((f, fi) => (
                            <a
                              key={fi}
                              href={f.fileUrl ?? '#'}
                              download
                              className="text-[11px] text-[#1D9E75] hover:underline bg-[#f2faf6] border border-[#1D9E75]/20 px-2.5 py-1 rounded"
                            >
                              ⬇ {f.fileName}
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 상위자평가 상세 모달 */}
      {modalOpen === 'manager' && d.managerEvalEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(null)}>
          <div className="bg-white rounded-2xl max-w-[560px] w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">상위자평가 상세</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">팀장이 부여한 등급 · 코멘트 · 피드백</p>
              </div>
              <button onClick={() => setModalOpen(null)} className="text-gray-400 hover:text-gray-700 text-[20px] bg-transparent border-none cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {d.managerEvalEntry.grade && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg px-4 py-3">
                  <span className="text-[12px] text-gray-500">부여 등급</span>
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-[20px] shadow-sm"
                    style={{ backgroundColor: gradeAccent[d.managerEvalEntry.grade] ?? '#8a9490' }}
                  >
                    {d.managerEvalEntry.grade}
                  </span>
                </div>
              )}
              {d.managerEvalEntry.comment && (
                <div>
                  <div className="text-[12px] text-gray-500 mb-1.5 flex items-center gap-1.5">
                    평가 코멘트
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">HR 내부</span>
                  </div>
                  <div className="text-[13px] text-gray-700 bg-gray-50 rounded-md px-4 py-3 leading-relaxed">
                    {d.managerEvalEntry.comment}
                  </div>
                </div>
              )}
              {d.managerEvalEntry.feedback && (
                <div>
                  <div className="text-[12px] text-gray-500 mb-1.5 flex items-center gap-1.5">
                    피드백
                    <span className="text-[10px] text-[#1D9E75] bg-[#f2faf6] px-1.5 py-0.5 rounded">사원 공개</span>
                  </div>
                  <div className="text-[13px] text-gray-700 bg-[#f2faf6]/50 rounded-md px-4 py-3 leading-relaxed">
                    {d.managerEvalEntry.feedback}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비 */}
      <div className="flex justify-center mt-8 mb-6">
        <button
          onClick={goBack}
          className="px-5 py-2.5 border border-gray-200 bg-white rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 hover:border-[#1D9E75] hover:text-[#1D9E75]"
        >
          ← 목록으로 돌아가기
        </button>
      </div>
    </div>
  )
}

// ─── 부분 컴포넌트 ─────────────────────────────────

function Section({ step, title, subtitle, children }: {
  step: number; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="relative pl-12">
      <div className="absolute left-0 top-0 w-[38px] h-[38px] rounded-full bg-white border-2 border-[#1D9E75] flex items-center justify-center text-[13px] font-bold text-[#1D9E75] shadow-sm z-10">
        {step}
      </div>
      <div className="pb-6">
        <div className="mb-2">
          <h3 className="text-[14px] font-bold text-gray-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, unit, highlight, badge }: {
  label: string; value: string; unit?: string; highlight?: string; badge?: string
}) {
  return (
    <div className="bg-white/80 backdrop-blur border border-gray-100 rounded-xl p-3">
      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      {badge ? (
        <span className={`inline-block px-3 py-1 rounded-full text-[18px] font-bold ${badge}`}>{value}</span>
      ) : (
        <div className="flex items-baseline gap-1">
          <span
            className="text-[22px] font-bold"
            style={{ color: highlight || '#1a2b23' }}
          >
            {value}
          </span>
          {unit && <span className="text-[11px] text-gray-400">{unit}</span>}
        </div>
      )}
    </div>
  )
}

function FormulaRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] text-gray-600">{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: color || '#1a2b23' }}>
        {value}
      </span>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-gray-800">{value}</div>
    </div>
  )
}

function GradeChip({ grade, highlight }: { grade: string; highlight?: boolean }) {
  const color = gradeAccent[grade] || '#8a9490'
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[14px] font-black"
      style={{
        backgroundColor: highlight ? color : `${color}15`,
        color: highlight ? 'white' : color,
        boxShadow: highlight ? `0 2px 8px ${color}50` : 'none',
      }}
    >
      {grade}
    </span>
  )
}
