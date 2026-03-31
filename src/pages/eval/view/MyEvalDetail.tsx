import { useState } from 'react'

type AchievementLevel = '우수' | '양호' | '보통' | '부족' | '미흡'
type ApprovalStatus = '승인' | '반려' | '대기'

interface GoalEval {
  id: number
  category: string
  title: string
  grade: '상' | '중' | '하'
  selfLevel: AchievementLevel
  selfDetail: string
  selfEvidence: string
  approvalStatus: ApprovalStatus
}

interface EvalData {
  season: string
  employee: { name: string; dept: string; position: string; empId: string }
  goals: GoalEval[]
  managerEval: {
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | null
    comment: string
    feedback: string
    submitted: boolean
  }
  status: '자기평가 미제출' | '자기평가 제출' | '팀장평가 완료' | '결과확정'
}

const achievementColors: Record<AchievementLevel, { bg: string; text: string }> = {
  '우수': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '양호': { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
  '보통': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '부족': { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]' },
  '미흡': { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]' },
}

const gradeColors: Record<string, { bg: string; text: string }> = {
  '상': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '중': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '하': { bg: 'bg-[#f8faf9]', text: 'text-[#8a9490]' },
  S: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  A: { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
  B: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  C: { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]' },
  D: { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]' },
}

const mockData: EvalData = {
  season: '2026년 상반기',
  employee: { name: '김민수', dept: '개발팀', position: '선임', empId: 'PC2024001' },
  goals: [
    { id: 1, category: '업무성과', title: '신규 고객 유치 20건 달성', grade: '상', selfLevel: '우수', selfDetail: '신규 고객 23건 유치 달성. 목표 대비 115% 초과 달성. Q2에만 12건 집중 유치.', selfEvidence: 'CRM 실적 리포트, 영업 주간보고', approvalStatus: '승인' },
    { id: 2, category: '업무성과', title: '고객 만족도 90% 이상 유지', grade: '중', selfLevel: '양호', selfDetail: '고객 만족도 91.2% 달성. CS 응대 매뉴얼 개정하고 응대 시간 30% 단축.', selfEvidence: 'CS 만족도 설문 결과', approvalStatus: '승인' },
    { id: 3, category: '역량개발', title: 'AWS 자격증 취득', grade: '하', selfLevel: '양호', selfDetail: 'AWS SAA 자격증 취득 완료. 시험 점수 820점.', selfEvidence: 'AWS 합격 증명서', approvalStatus: '승인' },
    { id: 4, category: '역량개발', title: '사내 세미나 발표 2회', grade: '하', selfLevel: '부족', selfDetail: '세미나 1회 진행 완료. 2차는 일정 조율 중.', selfEvidence: '세미나 발표 자료', approvalStatus: '승인' },
    { id: 5, category: '조직기여', title: '신규 입사자 온보딩 지원', grade: '중', selfLevel: '양호', selfDetail: '신규 입사자 2명 온보딩 멘토링 수행. 1개월 내 독립 업무 수행 가능 수준.', selfEvidence: '온보딩 체크리스트, 멘티 피드백', approvalStatus: '승인' },
  ],
  managerEval: {
    grade: 'A',
    comment: '업무 목표를 체계적으로 수립하고 달성하는 능력이 뛰어남. 특히 신규 고객 유치에서 기대 이상의 성과. 세미나 미달성 부분은 아쉬우나 전반적으로 우수한 실적.',
    feedback: '향후 리더십 역량 개발에 집중하면 더욱 성장할 수 있을 것으로 기대. 팀 내 지식 공유를 좀 더 적극적으로 진행하면 좋겠음.',
    submitted: true,
  },
  status: '팀장평가 완료',
}

const seasons = ['2026년 상반기', '2025년 하반기', '2025년 상반기']

export default function MyEvalDetail() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0])
  const [activeTab, setActiveTab] = useState<'self' | 'manager'>('self')
  const [data] = useState<EvalData>(mockData)

  const approvedCount = data.goals.filter(g => g.approvalStatus === '승인').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">
        성과관리 · 조회 &gt; <span className="text-[#2e9e6e] font-medium">본인 평가 조회</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23]">본인 평가 조회</h1>
          <p className="text-[13px] text-[#8a9490] mt-1">사원의 자기평가 내용과 팀장 평가를 확인합니다</p>
        </div>
        <select
          value={selectedSeason}
          onChange={e => setSelectedSeason(e.target.value)}
          className="border border-[#e0e5e3] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#2e9e6e]"
        >
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* 사원 정보 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2e9e6e] flex items-center justify-center text-white text-xl font-bold">
            {data.employee.name.charAt(0)}
          </div>
          <div>
            <div className="text-[18px] font-bold text-[#1a2b23]">{data.employee.name}</div>
            <div className="text-[13px] text-[#8a9490]">{data.employee.dept} · {data.employee.position} · {data.employee.empId}</div>
          </div>
          <div className="ml-auto flex items-center gap-6">
            <div className="text-center">
              <div className="text-[11px] text-[#8a9490]">팀장 등급</div>
              {data.managerEval.grade ? (
                <span className={`text-[24px] font-bold ${gradeColors[data.managerEval.grade].text}`}>
                  {data.managerEval.grade}
                </span>
              ) : (
                <span className="text-[16px] text-[#d0d8d4]">미평가</span>
              )}
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[#8a9490]">달성도 승인</div>
              <div className="text-[16px] font-bold text-[#2e9e6e]">{approvedCount}/{data.goals.length}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[#8a9490]">진행 상태</div>
              <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${
                data.status === '결과확정' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                data.status === '팀장평가 완료' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                data.status === '자기평가 제출' ? 'bg-[#fef3cd] text-[#f59e0b]' :
                'bg-[#f5f5f5] text-[#8a9490]'
              }`}>{data.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-5 bg-[#f0f2f1] rounded-lg p-1 w-fit">
        {[
          { key: 'self' as const, label: '자기평가' },
          { key: 'manager' as const, label: '상위자 평가' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white text-[#2e9e6e] shadow-sm'
                : 'text-[#8a9490] hover:text-[#5a6b62]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 자기평가 탭 */}
      {activeTab === 'self' && (
        <div className="space-y-4">
          {data.goals.map(goal => (
            <div key={goal.id} className={`bg-white border rounded-lg p-5 ${
              goal.approvalStatus === '승인' ? 'border-[#2e9e6e]' :
              goal.approvalStatus === '반려' ? 'border-[#fca5a5]' :
              'border-[#e0e5e3]'
            }`}>
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{goal.category}</span>
                  <span className={`${gradeColors[goal.grade].bg} ${gradeColors[goal.grade].text} px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                    등급 {goal.grade}
                  </span>
                  <span className="text-[14px] font-medium text-[#1a2b23]">{goal.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-[12px] font-medium border ${
                    achievementColors[goal.selfLevel].bg} ${achievementColors[goal.selfLevel].text
                  }`}>
                    달성도: {goal.selfLevel}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    goal.approvalStatus === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                    goal.approvalStatus === '반려' ? 'bg-[#fef2f2] text-[#ef4444]' :
                    'bg-[#fef3cd] text-[#f59e0b]'
                  }`}>{goal.approvalStatus}</span>
                </div>
              </div>

              {/* 달성 내용 */}
              <div className="mb-2">
                <div className="text-[11px] font-medium text-[#5a6b62] mb-1">달성 내용</div>
                <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{goal.selfDetail}</div>
              </div>

              {/* 실적 근거 */}
              {goal.selfEvidence && (
                <div>
                  <div className="text-[11px] font-medium text-[#5a6b62] mb-1">실적 근거</div>
                  <div className="text-[12px] text-[#8a9490] bg-[#f8faf9] rounded-lg p-2">{goal.selfEvidence}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 상위자 평가 탭 */}
      {activeTab === 'manager' && (
        <>
          {data.managerEval.submitted ? (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              {/* 등급 */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#f0f2f1]">
                <div>
                  <div className="text-[11px] text-[#8a9490] mb-1">상위자 평가 등급</div>
                  {data.managerEval.grade && (
                    <span className={`text-[32px] font-bold ${gradeColors[data.managerEval.grade].text}`}>
                      {data.managerEval.grade}
                    </span>
                  )}
                </div>
              </div>

              {/* 코멘트 */}
              <div className="mb-4">
                <div className="text-[12px] font-medium text-[#5a6b62] mb-1">평가 코멘트</div>
                <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{data.managerEval.comment}</div>
              </div>

              {/* 피드백 */}
              <div>
                <div className="text-[12px] font-medium text-[#5a6b62] mb-1">피드백</div>
                <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{data.managerEval.feedback}</div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
              <div className="text-[#d0d8d4] text-[32px] mb-3">🔒</div>
              <div className="text-[14px] font-medium text-[#5a6b62] mb-1">상위자 평가가 아직 제출되지 않았습니다</div>
              <div className="text-[12px] text-[#8a9490]">팀장이 평가를 완료한 후 확인할 수 있습니다.</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
