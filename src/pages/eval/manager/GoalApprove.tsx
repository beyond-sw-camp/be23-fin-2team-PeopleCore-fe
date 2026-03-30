import { useState } from 'react'

interface TeamMemberGoal {
  id: number
  employeeName: string
  dept: string
  position: string
  goalCount: number
  submittedDate: string
  status: '대기' | '승인' | '반려'
  goals: { title: string; category: string }[]
  rejectReason?: string
}

const mockData: TeamMemberGoal[] = [
  {
    id: 1, employeeName: '김민수', dept: '개발팀', position: '선임', goalCount: 4,
    submittedDate: '2026-01-15', status: '대기',
    goals: [
      { title: '신규 기능 개발 3건', category: '업무성과' },
      { title: 'API 응답시간 30% 개선', category: '업무성과' },
      { title: 'Kubernetes 자격증 취득', category: '역량개발' },
      { title: '코드 리뷰 참여율 100%', category: '조직기여' },
    ],
  },
  {
    id: 2, employeeName: '이서연', dept: '개발팀', position: '책임', goalCount: 3,
    submittedDate: '2026-01-14', status: '대기',
    goals: [
      { title: '시스템 아키텍처 개선', category: '업무성과' },
      { title: '팀 기술 교육 월 1회', category: '조직기여' },
      { title: 'MSA 전환 프로젝트 리드', category: '업무성과' },
    ],
  },
  {
    id: 3, employeeName: '박준호', dept: '개발팀', position: '사원', goalCount: 3,
    submittedDate: '2026-01-16', status: '반려',
    goals: [
      { title: '버그 수정 월 10건', category: '업무성과' },
      { title: 'React 학습', category: '역량개발' },
      { title: '문서 정리', category: '조직기여' },
    ],
    rejectReason: '목표가 너무 추상적입니다. 구체적인 달성 기준을 추가하여 재제출 바랍니다.',
  },
]

export default function GoalApprove() {
  const [data] = useState<TeamMemberGoal[]>(mockData)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const selected = data.find(d => d.id === selectedId)
  const pendingCount = data.filter(d => d.status === '대기').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(팀장) &gt; 목표 관리</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 목표 승인</h1>
        <p className="text-[13px] text-[#8a9490]">팀원이 등록한 목표를 검토하고 승인 또는 반려합니다. 반려 시 사유를 입력하며 직원은 수정 후 재제출합니다.</p>
      </div>

      {/* 현황 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체</div>
          <div className="text-[24px] font-bold text-[#1a2b23]">{data.length}</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">승인 대기</div>
          <div className="text-[24px] font-bold text-[#f59e0b]">{pendingCount}</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">완료</div>
          <div className="text-[24px] font-bold text-[#2e9e6e]">{data.filter(d => d.status !== '대기').length}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 팀원 목록 */}
        <div className="col-span-5">
          <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f8faf9] border-b border-[#e0e5e3]">
                  <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">이름</th>
                  <th className="text-center px-4 py-3 font-medium text-[#5a6b62]">목표</th>
                  <th className="text-center px-4 py-3 font-medium text-[#5a6b62]">상태</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`border-b border-[#f0f2f1] cursor-pointer transition-colors ${
                      selectedId === item.id ? 'bg-[#eaf6f0]' : 'hover:bg-[#fafbfa]'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1a2b23]">{item.employeeName}</div>
                      <div className="text-[11px] text-[#8a9490]">{item.position}</div>
                    </td>
                    <td className="px-4 py-3 text-center">{item.goalCount}건</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.status === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                        item.status === '반려' ? 'bg-[#fef2f2] text-[#ef4444]' :
                        'bg-[#fef3cd] text-[#f59e0b]'
                      }`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 보기 */}
        <div className="col-span-7">
          {selected ? (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#1a2b23]">{selected.employeeName}의 목표</h3>
                  <p className="text-[12px] text-[#8a9490]">{selected.dept} · {selected.position} · 제출일: {selected.submittedDate}</p>
                </div>
                {selected.status === '대기' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="border border-[#ef4444] text-[#ef4444] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#fef2f2]"
                    >
                      반려
                    </button>
                    <button className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]">
                      승인
                    </button>
                  </div>
                )}
              </div>

              {selected.rejectReason && (
                <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 mb-4">
                  <div className="text-[12px] font-medium text-[#ef4444] mb-1">반려 사유</div>
                  <div className="text-[13px] text-[#3a4b42]">{selected.rejectReason}</div>
                </div>
              )}

              <div className="space-y-3">
                {selected.goals.map((goal, i) => (
                  <div key={i} className="border border-[#e0e5e3] rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{goal.category}</span>
                      <span className="text-[13px] font-medium text-[#1a2b23]">{goal.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
              <div className="text-[#d0d8d4] text-[40px] mb-3">📋</div>
              <div className="text-[14px] text-[#8a9490]">좌측에서 팀원을 선택하세요</div>
            </div>
          )}
        </div>
      </div>

      {/* 반려 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px]">
            <h3 className="text-[16px] font-semibold text-[#1a2b23] mb-4">반려 사유 입력</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none mb-4"
              rows={4}
              placeholder="반려 사유를 입력하세요"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowRejectModal(false); setRejectReason('') }} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer">취소</button>
              <button className="bg-[#ef4444] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#dc2626]">반려 확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
