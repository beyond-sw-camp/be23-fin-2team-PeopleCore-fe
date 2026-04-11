import { useState } from 'react'

type GoalType = 'KPI' | 'OKR'
type AchievementLevel = '우수' | '양호' | '보통' | '부족' | '미흡'

interface ResultData {
  season: string
  finalGrade: string | null
  managerGrade: string | null
  feedback: {
    comment: string
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

const mockResult: ResultData = {
  season: '2025년 하반기',
  finalGrade: 'A',
  managerGrade: 'A',
  feedback: {
    comment: '업무 목표를 체계적으로 수립하고 달성하는 능력이 뛰어남. 특히 신규 고객 유치에서 기대 이상의 성과. 세미나 미달성은 아쉬우나 전반적으로 우수한 실적.',
    feedback: '향후 리더십 역량 개발에 집중하면 더욱 성장할 수 있을 것. 팀 내 지식 공유를 좀 더 적극적으로 진행하면 좋겠음.',
  },
  goals: [
    { goalType: 'KPI', category: '업무성과', title: '신규 고객 유치', grade: '상', targetValue: 20, targetUnit: '건', actualValue: 23, achievementRate: 115, approved: true },
    { goalType: 'KPI', category: '업무성과', title: '고객 만족도 유지', grade: '중', targetValue: 90, targetUnit: '%', actualValue: 91, achievementRate: 101, approved: true },
  ],
  status: '결과확정',
}

const gradeTextColors: Record<string, string> = {
  S: 'text-[#7c3aed]', A: 'text-[#2e9e6e]', B: 'text-[#3b82f6]', C: 'text-[#f59e0b]', D: 'text-[#ef4444]',
}

// const achievementColors: Record<AchievementLevel, { bg: string; text: string }> = {
//   '우수': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
//   '양호': { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
//   '보통': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
//   '부족': { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]' },
//   '미흡': { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]' },
// }

const taskGradeColors: Record<string, { bg: string; text: string }> = {
  '상': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '중': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '하': { bg: 'bg-[#f8faf9]', text: 'text-[#8a9490]' },
}

// const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
//   KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
//   OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
// }

const rateColor = (rate: number) => {
  if (rate >= 100) return 'text-[#7c3aed]'
  if (rate >= 80) return 'text-[#2e9e6e]'
  if (rate >= 60) return 'text-[#f59e0b]'
  return 'text-[#ef4444]'
}

export default function MyResult() {
  const [result] = useState<ResultData>(mockResult)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 평가결과 조회</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">본인 평가 결과 확인</h1>
        <p className="text-[13px] text-[#8a9490]">HR이 공개한 본인의 최종 등급과 팀장 피드백을 확인합니다.</p>
      </div>

      {/* 평가 기간 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-6 text-[13px]">
        <div><span className="text-[#8a9490]">평가 주기:</span> <span className="font-medium text-[#1a2b23]">{result.season}</span></div>
        <div>
          <span className="text-[#8a9490]">진행 상태:</span>
          <span className={`ml-1 px-2 py-0.5 rounded text-[11px] font-medium ${
            result.status === '결과확정' ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef3cd] text-[#f59e0b]'
          }`}>{result.status}</span>
        </div>
      </div>

      {/* 등급 요약 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
          <div className="text-[11px] text-[#8a9490] mb-2">최종 등급</div>
          {result.finalGrade ? (
            <div className={`text-[40px] font-bold ${gradeTextColors[result.finalGrade]}`}>{result.finalGrade}</div>
          ) : (
            <div className="text-[20px] text-[#d0d8d4]">미확정</div>
          )}
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex flex-col items-center justify-center">
          <div className="text-[11px] text-[#8a9490] mb-2">상위자 평가 등급</div>
          {result.managerGrade ? (
            <div className={`text-[40px] font-bold ${gradeTextColors[result.managerGrade]}`}>{result.managerGrade}</div>
          ) : (
            <div className="text-[20px] text-[#d0d8d4]">미평가</div>
          )}
        </div>
      </div>

      {/* 업무별 달성도 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">업무별 달성도</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e5e3]">
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">구분</th>
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">목표</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">업무 등급</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">달성도</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">승인</th>
            </tr>
          </thead>
          <tbody>
            {result.goals.map((g, i) => (
              <tr key={i} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
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
                  <div>
                    <span className={`font-bold text-[14px] ${rateColor(g.achievementRate || 0)}`}>{g.achievementRate}%</span>
                    <div className="text-[10px] text-[#8a9490]">{g.actualValue}/{g.targetValue}{g.targetUnit}</div>
                  </div>
                </td>
                <td className="px-5 py-3 text-center">
                  {g.approved ? (
                    <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">승인</span>
                  ) : (
                    <span className="bg-[#f5f5f5] text-[#8a9490] px-2 py-0.5 rounded text-[11px]">대기</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 팀장 피드백 */}
      {result.feedback ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
          <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">팀장 피드백</h3>
          <div className="space-y-4">
            <div>
              <div className="text-[12px] font-medium text-[#2e9e6e] mb-1">평가 코멘트</div>
              <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{result.feedback.comment}</div>
            </div>
            <div>
              <div className="text-[12px] font-medium text-[#3b82f6] mb-1">피드백</div>
              <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{result.feedback.feedback}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
          <div className="text-[#d0d8d4] text-[32px] mb-3">🔒</div>
          <div className="text-[14px] font-medium text-[#5a6b62] mb-1">평가 결과 공개 전입니다</div>
          <div className="text-[12px] text-[#8a9490]">최종 등급 확정 및 결과 공개 후 팀장 피드백을 확인할 수 있습니다.</div>
        </div>
      )}
    </div>
  )
}
