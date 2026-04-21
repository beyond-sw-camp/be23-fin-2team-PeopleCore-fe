import { useState } from 'react'

type GoalType = 'KPI' | 'OKR'
type AchievementLevel = '우수' | '양호' | '보통' | '부족' | '미흡'

interface ResultData {
  autoGrade: string | null
  finalGrade: string | null
  managerGrade: string | null
  feedback: {
    feedback: string
  } | null
  goals: {
    goalType: GoalType
    category: string
    title: string
    grade: '상' | '중' | '하'
    // KPI
    targetValue?: number
    targetUnit?: string
    actualValue?: number
    achievementRate?: number
    // OKR
    selfLevel?: AchievementLevel
    approved: boolean
  }[]
  status: '평가중' | '결과확정'
}

interface SeasonOption {
  seasonId: number
  name: string
}

// 드롭다운 시즌 목록 (최신순)
const mockSeasons: SeasonOption[] = [
  { seasonId: 4, name: '2025년 하반기' },
  { seasonId: 3, name: '2025년 상반기' },
  { seasonId: 2, name: '2024년 하반기' },
  { seasonId: 1, name: '2024년 상반기' },
]

// 시즌별 결과 데이터 (mock)
const mockResultsBySeasonId: Record<number, ResultData> = {
  4: {
    autoGrade: 'B',
    finalGrade: 'A',
    managerGrade: 'A',
    feedback: {
      feedback: '향후 리더십 역량 개발에 집중하면 더욱 성장할 수 있을 것. 팀 내 지식 공유를 좀 더 적극적으로 진행하면 좋겠음.',
    },
    goals: [
      { goalType: 'KPI', category: '업무성과', title: '신규 고객 유치', grade: '상', targetValue: 20, targetUnit: '건', actualValue: 23, achievementRate: 115, approved: true },
      { goalType: 'KPI', category: '업무성과', title: '고객 만족도 유지', grade: '중', targetValue: 90, targetUnit: '%', actualValue: 91, achievementRate: 101, approved: true },
      { goalType: 'OKR', category: '역량개발', title: 'AWS 자격증 취득', grade: '하', selfLevel: '양호', approved: true },
    ],
    status: '결과확정',
  },
  3: {
    // 진행중 - 상위자평가만 끝남
    autoGrade: null,
    finalGrade: null,
    managerGrade: 'A',
    feedback: {
      feedback: '상반기 수고 많으셨습니다. 하반기 성장 기대합니다.',
    },
    goals: [
      { goalType: 'KPI', category: '업무성과', title: '매출 목표', grade: '상', targetValue: 100, targetUnit: '백만원', actualValue: 98, achievementRate: 98, approved: true },
    ],
    status: '평가중',
  },
  2: {
    autoGrade: 'A',
    finalGrade: 'A',
    managerGrade: 'A',
    feedback: { feedback: '성실한 한 해였습니다.' },
    goals: [
      { goalType: 'KPI', category: '업무성과', title: '고객 유지율', grade: '중', targetValue: 85, targetUnit: '%', actualValue: 88, achievementRate: 104, approved: true },
    ],
    status: '결과확정',
  },
  1: {
    // 결과 조회 기간 아님 (완전 빈 상태)
    autoGrade: null,
    finalGrade: null,
    managerGrade: null,
    feedback: null,
    goals: [],
    status: '평가중',
  },
}

const gradeTextColors: Record<string, string> = {
  S: 'text-[#7c3aed]', A: 'text-[#2e9e6e]', B: 'text-[#3b82f6]', C: 'text-[#f59e0b]', D: 'text-[#ef4444]',
}

const achievementColors: Record<AchievementLevel, { bg: string; text: string }> = {
  '우수': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '양호': { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
  '보통': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '부족': { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]' },
  '미흡': { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]' },
}

const taskGradeColors: Record<string, { bg: string; text: string }> = {
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
  // 기본: 가장 최근 시즌 (배열 첫 번째)
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(mockSeasons[0].seasonId)
  const result = mockResultsBySeasonId[selectedSeasonId]

  // 해당 시즌에 단계 중 하나라도 진행됐는지
  const hasAnyResult = result && (
    result.managerGrade != null || result.autoGrade != null || result.finalGrade != null
  )

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 평가결과 조회</div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">본인 평가 결과 확인</h1>
          <p className="text-[13px] text-[#8a9490]">HR이 공개한 본인의 최종 등급과 팀장 피드백을 확인합니다.</p>
        </div>
        <select
          value={selectedSeasonId}
          onChange={e => setSelectedSeasonId(Number(e.target.value))}
          className="border border-[#e0e5e3] rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#2e9e6e] min-w-[180px]"
        >
          {mockSeasons.map(s => (
            <option key={s.seasonId} value={s.seasonId}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* 빈 상태 - 해당 시즌에 아무 결과 없으면 */}
      {!hasAnyResult ? (
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
                result.status === '결과확정' ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef3cd] text-[#f59e0b]'
              }`}>{result.status}</span>
            </div>
          </div>

          {/* 등급 요약 - 상위자 → 자동산정 → 최종 순서 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
              <div className="text-[11px] text-[#8a9490] mb-2">상위자 평가 등급</div>
              {result.managerGrade ? (
                <div className={`text-[40px] font-bold ${gradeTextColors[result.managerGrade]}`}>{result.managerGrade}</div>
              ) : (
                <div className="text-[20px] text-[#d0d8d4]">미평가</div>
              )}
              <div className="text-[10px] text-[#8a9490] mt-1">팀장이 부여한 등급</div>
            </div>
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
              <div className="text-[11px] text-[#8a9490] mb-2">예정 등급</div>
              {result.autoGrade ? (
                <div className={`text-[40px] font-bold ${gradeTextColors[result.autoGrade]}`}>{result.autoGrade}</div>
              ) : (
                <div className="text-[20px] text-[#d0d8d4]">미산정</div>
              )}
              <div className="text-[10px] text-[#8a9490] mt-1 text-center">평가 과정에 의해 변경될 가능성이 있습니다</div>
            </div>
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
              <div className="text-[11px] text-[#8a9490] mb-2">최종 등급</div>
              {result.finalGrade ? (
                <div className={`text-[40px] font-bold ${gradeTextColors[result.finalGrade]}`}>{result.finalGrade}</div>
              ) : (
                <div className="text-[20px] text-[#d0d8d4]">미확정</div>
              )}
              <div className="text-[10px] text-[#8a9490] mt-1">보정 반영 · 확정 등급</div>
            </div>
          </div>

          {/* 업무별 달성도 - 상위자평가 완료 후 노출 */}
          {result.managerGrade && (
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
                  {result.goals.map((g, i) => (
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
                        <span className={`${taskGradeColors[g.grade].bg} ${taskGradeColors[g.grade].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                          {g.grade}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {g.goalType === 'KPI' ? (
                          <div>
                            <span className={`font-bold text-[14px] ${rateColor(g.achievementRate || 0)}`}>{g.achievementRate}%</span>
                            <div className="text-[10px] text-[#8a9490]">{g.actualValue}/{g.targetValue}{g.targetUnit}</div>
                          </div>
                        ) : g.selfLevel ? (
                          <span className={`${achievementColors[g.selfLevel].text} font-bold text-[14px]`}>
                            {g.selfLevel}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#8a9490]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 팀장 피드백 - 상위자평가 완료 시 함께 노출 */}
          {result.feedback && (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">팀장 피드백</h3>
              <div>
                <div className="text-[12px] font-medium text-[#3b82f6] mb-1">피드백</div>
                <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{result.feedback.feedback}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
