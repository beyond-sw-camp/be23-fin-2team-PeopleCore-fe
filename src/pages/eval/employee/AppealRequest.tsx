import { useState } from 'react'

interface Appeal {
  id: number
  season: string
  grade: string
  appealDate: string
  reason: string
  status: '심사중' | '승인' | '기각' | '작성중'
  hrComment?: string
}

const mockAppeals: Appeal[] = [
  {
    id: 1,
    season: '2025년 상반기',
    grade: 'B',
    appealDate: '2025-08-05',
    reason: '동료평가 점수가 실제 협업 기여도에 비해 과소 반영되었다고 판단됩니다. 프로젝트 X에서 핵심 모듈을 전담 개발하였으나 이 부분이 충분히 반영되지 않았습니다.',
    status: '기각',
    hrComment: '동료평가 결과는 복수의 평가자 점수를 종합한 것으로, 개별 프로젝트 기여도만으로 조정하기 어렵습니다.',
  },
]

export default function AppealRequest() {
  const [appeals] = useState<Appeal[]>(mockAppeals)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reason: '' })

  const currentGrade = 'A'
  const currentSeason = '2025년 하반기'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 이의신청</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">이의신청</h1>
          <p className="text-[13px] text-[#8a9490]">평가 결과에 동의하지 않을 경우 사유를 작성하여 이의를 제기합니다.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
        >
          이의신청 작성
        </button>
      </div>

      {/* 현재 평가 결과 요약 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-6 text-[13px]">
        <div><span className="text-[#8a9490]">현재 주기:</span> <span className="font-medium text-[#1a2b23]">{currentSeason}</span></div>
        <div><span className="text-[#8a9490]">최종 등급:</span> <span className="font-bold text-[#2e9e6e] text-[16px]">{currentGrade}</span></div>
      </div>

      {/* 이의신청 작성 폼 */}
      {showForm && (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
          <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">이의신청 작성</h3>
          <div className="mb-4">
            <label className="block text-[12px] text-[#5a6b62] mb-1">이의신청 사유</label>
            <textarea
              value={form.reason}
              onChange={e => setForm({ reason: e.target.value })}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none"
              rows={5}
              placeholder="평가 결과에 대한 이의 사유를 구체적으로 작성하세요. (근거 자료, 구체적 사실 등을 포함해 주세요)"
            />
            <div className="text-[11px] text-[#8a9490] mt-1">{form.reason.length}/500자</div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
            <button
              className={`rounded-lg px-4 py-2 text-[13px] font-medium border-none cursor-pointer transition-colors ${
                form.reason.trim().length > 0 ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
              }`}
              disabled={form.reason.trim().length === 0}
            >
              제출
            </button>
          </div>
        </div>
      )}

      {/* 이의신청 이력 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">이의신청 이력</h3>
        </div>
        {appeals.length > 0 ? (
          <div className="divide-y divide-[#f0f2f1]">
            {appeals.map(appeal => (
              <div key={appeal.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-[#1a2b23]">{appeal.season}</span>
                    <span className="text-[12px] text-[#8a9490]">등급: {appeal.grade}</span>
                    <span className="text-[12px] text-[#8a9490]">{appeal.appealDate}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    appeal.status === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                    appeal.status === '기각' ? 'bg-[#fef2f2] text-[#ef4444]' :
                    appeal.status === '심사중' ? 'bg-[#fef3cd] text-[#f59e0b]' :
                    'bg-[#f5f5f5] text-[#8a9490]'
                  }`}>{appeal.status}</span>
                </div>
                <div className="bg-[#f8faf9] rounded-lg p-3 mb-3">
                  <div className="text-[12px] font-medium text-[#5a6b62] mb-1">신청 사유</div>
                  <div className="text-[13px] text-[#3a4b42]">{appeal.reason}</div>
                </div>
                {appeal.hrComment && (
                  <div className="bg-[#fef2f2] rounded-lg p-3">
                    <div className="text-[12px] font-medium text-[#ef4444] mb-1">HR 답변</div>
                    <div className="text-[13px] text-[#3a4b42]">{appeal.hrComment}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-[14px] text-[#8a9490]">이의신청 이력이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
