import { useState } from 'react'

interface PeerTarget {
  id: number
  name: string
  dept: string
  position: string
  completed: boolean
}

interface EvalCriteria {
  id: number
  label: string
  score: number | null
  comment: string
}

const mockPeers: PeerTarget[] = [
  { id: 1, name: '김민수', dept: '개발팀', position: '선임', completed: true },
  { id: 2, name: '이서연', dept: '개발팀', position: '책임', completed: false },
  { id: 3, name: '박준호', dept: 'QA팀', position: '선임', completed: false },
]

const defaultCriteria: EvalCriteria[] = [
  { id: 1, label: '협업 능력', score: null, comment: '' },
  { id: 2, label: '커뮤니케이션', score: null, comment: '' },
  { id: 3, label: '업무 전문성', score: null, comment: '' },
  { id: 4, label: '문제 해결력', score: null, comment: '' },
]

const scoreLabels: Record<number, string> = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'D' }

export default function PeerEvalInput() {
  const [peers] = useState<PeerTarget[]>(mockPeers)
  const [selectedPeer, setSelectedPeer] = useState<PeerTarget | null>(null)
  const [criteria, setCriteria] = useState<EvalCriteria[]>(defaultCriteria)

  const handlePeerSelect = (peer: PeerTarget) => {
    setSelectedPeer(peer)
    setCriteria(defaultCriteria.map(c => ({ ...c, score: null, comment: '' })))
  }

  const handleScoreChange = (id: number, score: number) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, score } : c))
  }

  const handleCommentChange = (id: number, comment: string) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, comment } : c))
  }

  const allFilled = criteria.every(c => c.score !== null && c.comment.trim().length > 0)
  const completedCount = peers.filter(p => p.completed).length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 동료평가</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">동료평가 입력 및 제출</h1>
        <p className="text-[13px] text-[#8a9490]">지정된 동료에 대해 항목별 점수와 코멘트를 입력하고 제출합니다. 결과는 등급 산정 시 가중치로 반영됩니다.</p>
      </div>

      {/* 진행 현황 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-6">
        <div className="text-[13px] text-[#5a6b62]">
          진행 현황: <span className="font-bold text-[#2e9e6e]">{completedCount}</span> / {peers.length}명 완료
        </div>
        <div className="flex-1 bg-[#e0e5e3] rounded-full h-2">
          <div className="bg-[#2e9e6e] h-2 rounded-full transition-all" style={{ width: `${(completedCount / peers.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 동료 목록 */}
        <div className="col-span-4">
          <div className="bg-white border border-[#e0e5e3] rounded-lg p-4">
            <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-3">평가 대상자</h3>
            <div className="space-y-2">
              {peers.map(peer => (
                <div
                  key={peer.id}
                  onClick={() => !peer.completed && handlePeerSelect(peer)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPeer?.id === peer.id
                      ? 'border-[#2e9e6e] bg-[#eaf6f0]'
                      : peer.completed
                      ? 'border-[#e0e5e3] bg-[#f8faf9] opacity-60 cursor-default'
                      : 'border-[#e0e5e3] hover:border-[#2e9e6e]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-medium text-[#1a2b23]">{peer.name}</div>
                      <div className="text-[11px] text-[#8a9490]">{peer.dept} · {peer.position}</div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded ${
                      peer.completed ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef3cd] text-[#f59e0b]'
                    }`}>
                      {peer.completed ? '완료' : '미완료'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 평가 입력 */}
        <div className="col-span-8">
          {selectedPeer ? (
            <div className="space-y-4">
              <div className="bg-white border border-[#e0e5e3] rounded-lg p-4">
                <h3 className="text-[14px] font-semibold text-[#1a2b23]">{selectedPeer.name} 동료평가</h3>
                <p className="text-[12px] text-[#8a9490] mt-1">{selectedPeer.dept} · {selectedPeer.position}</p>
              </div>

              {criteria.map(c => (
                <div key={c.id} className="bg-white border border-[#e0e5e3] rounded-lg p-5">
                  <div className="text-[14px] font-medium text-[#1a2b23] mb-3">{c.label}</div>
                  <div className="flex gap-2 mb-3">
                    {[5, 4, 3, 2, 1].map(score => (
                      <button
                        key={score}
                        onClick={() => handleScoreChange(c.id, score)}
                        className={`w-12 h-10 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
                          c.score === score
                            ? 'bg-[#2e9e6e] text-white border-[#2e9e6e]'
                            : 'bg-white text-[#5a6b62] border-[#e0e5e3] hover:border-[#2e9e6e]'
                        }`}
                      >
                        {scoreLabels[score]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={c.comment}
                    onChange={e => handleCommentChange(c.id, e.target.value)}
                    className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none"
                    rows={2}
                    placeholder="평가 코멘트를 작성하세요"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3">
                <button className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">임시 저장</button>
                <button
                  className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
                    allFilled ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
                  }`}
                  disabled={!allFilled}
                >
                  평가 제출
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
              <div className="text-[#d0d8d4] text-[40px] mb-3">📝</div>
              <div className="text-[14px] text-[#8a9490]">좌측에서 평가할 동료를 선택하세요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
