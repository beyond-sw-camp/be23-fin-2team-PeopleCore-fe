import { useState, useEffect } from 'react'
import {
  fetchMySeasons,
  fetchMyResult,
  type MySeasonOptionDto,
  type MyEvalResultDto,
  type MyResultGoal,
} from '../../../api/evalGrade'

type GradeKo = '상' | '중' | '하'
type LevelKo = '우수' | '양호' | '보통' | '부족' | '미흡'

const gradeBackendToKo: Record<'HIGH' | 'MID' | 'LOW', GradeKo> = {
  HIGH: '상',
  MID: '중',
  LOW: '하',
}

const levelBackendToKo: Record<string, LevelKo> = {
  EXCELLENT: '우수',
  GOOD: '양호',
  AVERAGE: '보통',
  POOR: '부족',
  INADEQUATE: '미흡',
}

const gradeTextColors: Record<string, string> = {
  S: 'text-[#7c3aed]', A: 'text-[#2e9e6e]', B: 'text-[#3b82f6]', C: 'text-[#f59e0b]', D: 'text-[#ef4444]',
}

const achievementColors: Record<LevelKo, { bg: string; text: string }> = {
  '우수': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '양호': { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
  '보통': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '부족': { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]' },
  '미흡': { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]' },
}

const taskGradeColors: Record<GradeKo, { bg: string; text: string }> = {
  '상': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '중': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '하': { bg: 'bg-[#f8faf9]', text: 'text-[#8a9490]' },
}

const rateColor = (rate: number) => {
  if (rate >= 100) return 'text-[#7c3aed]'
  if (rate >= 80) return 'text-[#2e9e6e]'
  if (rate >= 60) return 'text-[#f59e0b]'
  return 'text-[#ef4444]'
}

export default function MyResult() {
  const [seasons, setSeasons] = useState<MySeasonOptionDto[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [result, setResult] = useState<MyEvalResultDto | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingResult, setLoadingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 시즌 드롭다운 로드
  useEffect(() => {
    fetchMySeasons()
      .then(list => {
        setSeasons(list)
        if (list.length > 0) setSelectedSeasonId(list[0].seasonId)
        else setLoading(false)   // 시즌 없으면 여기서 로딩 해제
      })
      .catch(e => {
        console.error('[MyResult] seasons failed', e)
        setError(e?.response?.data?.message || '시즌 목록을 불러오지 못했습니다.')
        setLoading(false)
      })
  }, [])

  // seasonId 변경 시 결과 로드
  useEffect(() => {
    if (selectedSeasonId === null) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingResult(true)
    setError(null)
    fetchMyResult(selectedSeasonId)
      .then(r => setResult(r))
      .catch(e => {
        console.error('[MyResult] result failed', e)
        setError(e?.response?.data?.message || '평가결과를 불러오지 못했습니다.')
        setResult(null)
      })
      .finally(() => {
        setLoadingResult(false)
        setLoading(false)
      })
  }, [selectedSeasonId])

  const statusKo = result?.status === 'FINALIZED' ? '결과확정' : '평가중'
  const hasAnyResult = result && (
    result.managerGrade != null || result.autoGrade != null || result.finalGrade != null
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 평가결과 조회</div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">본인 평가 결과 확인</h1>
          <p className="text-[13px] text-[#8a9490]">HR이 공개한 본인의 최종 등급과 평가자 피드백을 확인합니다.</p>
        </div>
        <select
          value={selectedSeasonId ?? ''}
          onChange={e => setSelectedSeasonId(Number(e.target.value))}
          disabled={seasons.length === 0}
          className="border border-[#e0e5e3] rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#2e9e6e] min-w-[180px] disabled:bg-gray-50 disabled:text-gray-400"
        >
          {seasons.length === 0
            ? <option>시즌 없음</option>
            : seasons.map(s => (
                <option key={s.seasonId} value={s.seasonId}>
                  {s.name} {s.status === 'FINALIZED' ? '· 확정' : '· 진행중'}
                </option>
              ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {loadingResult ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center text-[14px] text-[#8a9490]">
          <i className="fas fa-spinner fa-spin mr-2" /> 결과 로딩 중...
        </div>
      ) : seasons.length === 0 || !result ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-16 flex flex-col items-center justify-center text-center">
          <div className="text-[60px] mb-4">📋</div>
          <div className="text-[16px] font-semibold text-[#1a2b23] mb-2">조회 가능한 평가가 없습니다</div>
          <div className="text-[13px] text-[#8a9490]">참여한 평가 시즌이 없습니다.</div>
        </div>
      ) : !hasAnyResult ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-16 flex flex-col items-center justify-center text-center">
          <div className="text-[60px] mb-4">🔒</div>
          <div className="text-[16px] font-semibold text-[#1a2b23] mb-2">결과조회 기간이 아닙니다</div>
          <div className="text-[13px] text-[#8a9490]">평가가 진행 중입니다. 결과가 공개되면 여기서 확인할 수 있습니다.</div>
        </div>
      ) : (
        <>
          {/* 진행 상태 */}
          <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-6 text-[13px]">
            <div>
              <span className="text-[#8a9490]">진행 상태:</span>
              <span className={`ml-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                statusKo === '결과확정' ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef3cd] text-[#f59e0b]'
              }`}>{statusKo}</span>
            </div>
            {result.finalizedAt && (
              <div>
                <span className="text-[#8a9490]">확정일시:</span>
                <span className="ml-1 text-[#1a2b23] font-medium">{result.finalizedAt.replace('T', ' ').slice(0, 16)}</span>
              </div>
            )}
          </div>

          {/* 등급 요약 - 상위자 → 자동산정 → 최종 순서 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
              <div className="text-[11px] text-[#8a9490] mb-2">상위자 평가 등급</div>
              {result.managerGrade ? (
                <div className={`text-[40px] font-bold ${gradeTextColors[result.managerGrade] ?? 'text-[#1a2b23]'}`}>{result.managerGrade}</div>
              ) : (
                <div className="text-[20px] text-[#d0d8d4]">미평가</div>
              )}
              <div className="text-[10px] text-[#8a9490] mt-1">평가자가 부여한 등급</div>
            </div>
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
              <div className="text-[11px] text-[#8a9490] mb-2">예정 등급</div>
              {result.autoGrade ? (
                <div className={`text-[40px] font-bold ${gradeTextColors[result.autoGrade] ?? 'text-[#1a2b23]'}`}>{result.autoGrade}</div>
              ) : (
                <div className="text-[20px] text-[#d0d8d4]">미산정</div>
              )}
              <div className="text-[10px] text-[#8a9490] mt-1 text-center">평가 과정에 의해 변경될 가능성이 있습니다</div>
            </div>
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
              <div className="text-[11px] text-[#8a9490] mb-2">최종 등급</div>
              {result.finalGrade ? (
                <div className={`text-[40px] font-bold ${gradeTextColors[result.finalGrade] ?? 'text-[#1a2b23]'}`}>{result.finalGrade}</div>
              ) : (
                <div className="text-[20px] text-[#d0d8d4]">미확정</div>
              )}
              <div className="text-[10px] text-[#8a9490] mt-1">보정 반영 · 확정 등급</div>
            </div>
          </div>

          {/* 업무별 달성도 - 상위자평가 완료 후 노출 */}
          {result.managerGrade && result.goals.length > 0 && (
            <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
                <h3 className="text-[14px] font-semibold text-[#1a2b23]">업무별 달성도</h3>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e0e5e3]">
                    <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[60px]">유형</th>
                    <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">구분</th>
                    <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">목표</th>
                    <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">업무 등급</th>
                    <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">달성도</th>
                  </tr>
                </thead>
                <tbody>
                  {result.goals.map((g: MyResultGoal, i: number) => {
                    const gradeKo = gradeBackendToKo[g.grade]
                    const selfLevelKo = g.selfLevel ? levelBackendToKo[g.selfLevel] : null
                    const rate = g.achievementRate
                    return (
                      <tr key={i} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            g.goalType === 'KPI' ? 'bg-[#eff6ff] text-[#3b82f6]' : 'bg-[#faf5ff] text-[#7c3aed]'
                          }`}>{g.goalType}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{g.category}</span>
                        </td>
                        <td className="px-5 py-3 text-[#1a2b23]">{g.title}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`${taskGradeColors[gradeKo].bg} ${taskGradeColors[gradeKo].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                            {gradeKo}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {g.goalType === 'KPI' ? (
                            rate !== null ? (
                              <div>
                                <span className={`font-bold text-[14px] ${rateColor(rate)}`}>{rate}%</span>
                                <div className="text-[10px] text-[#8a9490]">
                                  {g.actualValue ?? '—'}/{g.targetValue ?? '-'}{g.targetUnit ?? ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#8a9490]">미제출</span>
                            )
                          ) : selfLevelKo ? (
                            <span className={`${achievementColors[selfLevelKo].text} font-bold text-[14px]`}>
                              {selfLevelKo}
                            </span>
                          ) : (
                            <span className="text-[12px] text-[#8a9490]">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 평가자 피드백 - 상위자평가 완료 시 노출 */}
          {result.feedback && (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">평가자 피드백</h3>
              <div>
                <div className="text-[12px] font-medium text-[#3b82f6] mb-1">피드백</div>
                <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3 whitespace-pre-wrap">{result.feedback}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
