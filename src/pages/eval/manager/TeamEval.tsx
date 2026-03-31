import { useState } from 'react'

type EvalGrade = 'S' | 'A' | 'B' | 'C' | 'D' | null

interface TeamMember {
  id: number
  name: string
  dept: string
  position: string
  taskSummary: string
  evalSubmitted: boolean
}

interface EvalForm {
  grade: EvalGrade
  comment: string
  feedback: string
}

const evalGradeColors: Record<string, { bg: string; text: string }> = {
  S: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  A: { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
  B: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  C: { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]' },
  D: { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]' },
}

const mockMembers: TeamMember[] = [
  { id: 1, name: '김민수', dept: '개발팀', position: '선임', taskSummary: '업무 5건 · 승인 3건 · 반려 1건 · 대기 1건', evalSubmitted: false },
  { id: 2, name: '이서연', dept: '개발팀', position: '책임', taskSummary: '업무 3건 · 승인 3건', evalSubmitted: false },
  { id: 3, name: '박준호', dept: '개발팀', position: '사원', taskSummary: '업무 3건 · 자기평가 미제출', evalSubmitted: false },
  { id: 4, name: '최유진', dept: '개발팀', position: '선임', taskSummary: '업무 4건 · 승인 4건', evalSubmitted: false },
]

export default function TeamEval() {
  const [members] = useState<TeamMember[]>(mockMembers)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [evalForm, setEvalForm] = useState<EvalForm>({ grade: null, comment: '', feedback: '' })

  const selected = members.find(m => m.id === selectedId)

  const handleSelect = (id: number) => {
    setSelectedId(id)
    setEvalForm({ grade: null, comment: '', feedback: '' })
  }

  const isFormComplete = evalForm.grade !== null && evalForm.comment.trim() && evalForm.feedback.trim()

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(팀장) &gt; 팀원 평가</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">상위자 평가 및 피드백 작성</h1>
        <p className="text-[13px] text-[#8a9490]">팀원에 대한 종합 평가 등급(S~D)을 부여하고 코멘트와 피드백을 작성합니다.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 팀원 목록 */}
        <div className="col-span-4">
          <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
              <h3 className="text-[13px] font-semibold text-[#1a2b23]">팀원 목록</h3>
            </div>
            <div className="divide-y divide-[#f0f2f1]">
              {members.map(m => (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedId === m.id ? 'bg-[#eaf6f0]' : 'hover:bg-[#fafbfa]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="text-[13px] font-medium text-[#1a2b23]">{m.name}</div>
                      <div className="text-[11px] text-[#8a9490]">{m.position}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      m.evalSubmitted ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#f5f5f5] text-[#8a9490]'
                    }`}>
                      {m.evalSubmitted ? '평가 완료' : '미평가'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#b0b8b4]">{m.taskSummary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 평가 입력 */}
        <div className="col-span-8">
          {selected ? (
            <div className="space-y-4">
              {/* 팀원 정보 */}
              <div className="bg-white border border-[#e0e5e3] rounded-lg p-4">
                <div className="text-[16px] font-semibold text-[#1a2b23]">{selected.name}</div>
                <div className="text-[12px] text-[#8a9490]">{selected.dept} · {selected.position}</div>
                <div className="text-[11px] text-[#b0b8b4] mt-1">{selected.taskSummary}</div>
              </div>

              {/* 안내 */}
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3 text-[12px] text-[#1e40af]">
                팀원의 달성도 승인/반려는 「팀원 달성도 검토」 페이지에서 진행하세요. 이 화면에서는 종합 평가 등급과 피드백만 작성합니다.
              </div>

              {/* 평가 등급 */}
              <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
                <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">상위자 평가</h3>

                <div className="mb-5">
                  <label className="block text-[12px] font-medium text-[#5a6b62] mb-2">평가 등급</label>
                  <div className="flex gap-2">
                    {(['S', 'A', 'B', 'C', 'D'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => setEvalForm({ ...evalForm, grade: g })}
                        className={`w-14 h-11 rounded-lg text-[14px] font-bold border cursor-pointer transition-colors ${
                          evalForm.grade === g
                            ? `${evalGradeColors[g].bg} ${evalGradeColors[g].text} border-current`
                            : 'bg-white text-[#d0d8d4] border-[#e0e5e3] hover:border-[#8a9490]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">평가 코멘트</label>
                  <textarea
                    value={evalForm.comment}
                    onChange={e => setEvalForm({ ...evalForm, comment: e.target.value })}
                    className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none focus:border-[#2e9e6e] focus:outline-none"
                    rows={3}
                    placeholder="평가 등급에 대한 근거를 작성하세요 (잘한 점, 개선점 등)"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">피드백</label>
                  <textarea
                    value={evalForm.feedback}
                    onChange={e => setEvalForm({ ...evalForm, feedback: e.target.value })}
                    className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none focus:border-[#2e9e6e] focus:outline-none"
                    rows={3}
                    placeholder="팀원에게 전달할 피드백을 작성하세요 (성장 방향, 기대 사항 등)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">임시 저장</button>
                <button
                  className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
                    isFormComplete ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
                  }`}
                  disabled={!isFormComplete}
                >
                  평가 제출
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
              <div className="text-[#d0d8d4] text-[40px] mb-3">📝</div>
              <div className="text-[14px] text-[#8a9490]">좌측에서 평가할 팀원을 선택하세요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
