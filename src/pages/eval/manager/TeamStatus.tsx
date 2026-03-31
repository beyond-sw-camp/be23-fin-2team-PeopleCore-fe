import { useState } from 'react'

interface TeamMemberStatus {
  id: number
  name: string
  dept: string
  position: string
  selfEval: { status: '미제출' | '제출완료'; score: number | null; date: string | null }
  peerEval: { status: '미제출' | '제출완료' | '부분완료'; completed: number; total: number }
  goalStatus: '승인' | '대기' | '반려'
}

const mockData: TeamMemberStatus[] = [
  {
    id: 1, name: '김민수', dept: '개발팀', position: '선임',
    selfEval: { status: '제출완료', score: 4.2, date: '2026-03-15' },
    peerEval: { status: '제출완료', completed: 3, total: 3 },
    goalStatus: '승인',
  },
  {
    id: 2, name: '이서연', dept: '개발팀', position: '책임',
    selfEval: { status: '제출완료', score: 4.5, date: '2026-03-14' },
    peerEval: { status: '부분완료', completed: 2, total: 3 },
    goalStatus: '승인',
  },
  {
    id: 3, name: '박준호', dept: '개발팀', position: '사원',
    selfEval: { status: '미제출', score: null, date: null },
    peerEval: { status: '미제출', completed: 0, total: 3 },
    goalStatus: '대기',
  },
  {
    id: 4, name: '최유진', dept: '개발팀', position: '선임',
    selfEval: { status: '제출완료', score: 4.0, date: '2026-03-16' },
    peerEval: { status: '제출완료', completed: 3, total: 3 },
    goalStatus: '승인',
  },
  {
    id: 5, name: '정하늘', dept: '개발팀', position: '사원',
    selfEval: { status: '미제출', score: null, date: null },
    peerEval: { status: '부분완료', completed: 1, total: 3 },
    goalStatus: '승인',
  },
]

export default function TeamStatus() {
  const [data] = useState<TeamMemberStatus[]>(mockData)
  const [filter, setFilter] = useState<'all' | 'pending' | 'complete'>('all')

  const filtered = data.filter(d => {
    if (filter === 'pending') return d.selfEval.status === '미제출' || d.peerEval.status !== '제출완료'
    if (filter === 'complete') return d.selfEval.status === '제출완료' && d.peerEval.status === '제출완료'
    return true
  })

  const selfCompleted = data.filter(d => d.selfEval.status === '제출완료').length
  const peerCompleted = data.filter(d => d.peerEval.status === '제출완료').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(팀장) &gt; 팀원 평가 현황</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 평가 현황 조회</h1>
        <p className="text-[13px] text-[#8a9490]">팀원의 자기평가·동료평가 제출 현황과 점수를 조회합니다.</p>
      </div>

      {/* 현황 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 팀원</div>
          <div className="text-[24px] font-bold text-[#1a2b23]">{data.length}</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">자기평가 완료</div>
          <div className="text-[24px] font-bold text-[#2e9e6e]">{selfCompleted}/{data.length}</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">동료평가 완료</div>
          <div className="text-[24px] font-bold text-[#3b82f6]">{peerCompleted}/{data.length}</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 완료율</div>
          <div className="text-[24px] font-bold text-[#8b5cf6]">
            {Math.round(((selfCompleted + peerCompleted) / (data.length * 2)) * 100)}%
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all' as const, label: '전체' },
          { key: 'pending' as const, label: '미완료' },
          { key: 'complete' as const, label: '완료' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-[13px] border cursor-pointer transition-colors ${
              filter === f.key
                ? 'bg-[#2e9e6e] text-white border-[#2e9e6e]'
                : 'bg-white text-[#5a6b62] border-[#e0e5e3] hover:border-[#2e9e6e]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-[#e0e5e3]">
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">이름</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">직급</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">목표 상태</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">자기평가</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">자기평가 점수</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">동료평가</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">제출일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => (
              <tr key={member.id} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-5 py-3">
                  <div className="font-medium text-[#1a2b23]">{member.name}</div>
                  <div className="text-[11px] text-[#8a9490]">{member.dept}</div>
                </td>
                <td className="px-5 py-3 text-center text-[#5a6b62]">{member.position}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    member.goalStatus === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                    member.goalStatus === '반려' ? 'bg-[#fef2f2] text-[#ef4444]' :
                    'bg-[#fef3cd] text-[#f59e0b]'
                  }`}>{member.goalStatus}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    member.selfEval.status === '제출완료' ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef3cd] text-[#f59e0b]'
                  }`}>{member.selfEval.status}</span>
                </td>
                <td className="px-5 py-3 text-center font-medium">
                  {member.selfEval.score !== null ? (
                    <span className="text-[#1a2b23]">{member.selfEval.score}</span>
                  ) : (
                    <span className="text-[#d0d8d4]">-</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      member.peerEval.status === '제출완료' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                      member.peerEval.status === '부분완료' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                      'bg-[#fef3cd] text-[#f59e0b]'
                    }`}>{member.peerEval.completed}/{member.peerEval.total}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-center text-[#5a6b62]">
                  {member.selfEval.date || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
