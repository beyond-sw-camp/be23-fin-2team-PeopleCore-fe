import { useState } from 'react'

interface StageStatus {
  stage: string
  status: '대기' | '진행중' | '마감'
  startDate: string
  endDate: string
  submitted: number
  total: number
}

interface GoalStatus {
  empId: string
  name: string
  department: string
  goalCount: number
  status: '등록완료' | '미등록' | '임시저장'
}

const mockStages: StageStatus[] = [
  { stage: '목표 등록', status: '마감', startDate: '2024-06-01', endDate: '2024-06-07', submitted: 73, total: 73 },
  { stage: '자기평가', status: '진행중', startDate: '2024-06-08', endDate: '2024-06-15', submitted: 45, total: 73 },
  { stage: '동료평가', status: '대기', startDate: '2024-06-16', endDate: '2024-06-22', submitted: 0, total: 73 },
  { stage: '상위자평가', status: '대기', startDate: '2024-06-23', endDate: '2024-06-30', submitted: 0, total: 73 },
]

const mockGoals: GoalStatus[] = [
  { empId: 'PC2024001', name: '김민수', department: '개발팀', goalCount: 4, status: '등록완료' },
  { empId: 'PC2024002', name: '이서연', department: '인사팀', goalCount: 3, status: '등록완료' },
  { empId: 'PC2024003', name: '박지훈', department: '마케팅팀', goalCount: 0, status: '미등록' },
  { empId: 'PC2024004', name: '최유진', department: '영업팀', goalCount: 2, status: '임시저장' },
  { empId: 'PC2024005', name: '정하은', department: '재무팀', goalCount: 5, status: '등록완료' },
  { empId: 'PC2024006', name: '한승우', department: '개발팀', goalCount: 0, status: '미등록' },
  { empId: 'PC2024007', name: '오나영', department: '경영지원팀', goalCount: 3, status: '등록완료' },
  { empId: 'PC2024008', name: '윤재혁', department: '개발팀', goalCount: 4, status: '등록완료' },
]

const evalProgress = [
  { type: '자기평가', submitted: 45, total: 73 },
  { type: '동료평가', submitted: 12, total: 73 },
  { type: '상위자평가', submitted: 0, total: 73 },
]

export default function EvalOperation() {
  const [tab, setTab] = useState<'schedule' | 'goals' | 'monitor'>('schedule')

  const tabs = [
    { key: 'schedule', label: '일정·단계 관리' },
    { key: 'goals', label: '목표 등록 현황' },
    { key: 'monitor', label: '평가 입력 모니터링' },
  ] as const

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 운영</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 운영</h1>
          <p className="text-xs text-gray-400 mt-1">평가 일정 관리, 단계별 오픈/마감, 현황 모니터링을 수행합니다. (eval-6 ~ eval-10)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            <i className="fas fa-bell text-xs"></i>미제출 독촉
          </button>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-bullhorn text-xs"></i>일정 공지
          </button>
        </div>
      </div>

      {/* Season Selector */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#eaf6f0] flex items-center justify-center">
              <i className="fas fa-calendar-check text-[#1D9E75]"></i>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">2024년 상반기 정기평가</div>
              <div className="text-xs text-gray-400">2024-06-01 ~ 2024-06-30</div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-[#eaf6f0] text-[#1D9E75] rounded-full font-medium">진행중</span>
          </div>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none">
            <option>2024년 상반기 정기평가</option>
            <option>2023년 하반기 정기평가</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 일정·단계 관리 ── */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          {mockStages.map((s, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    s.status === '마감' ? 'bg-[#1D9E75] text-white' :
                    s.status === '진행중' ? 'bg-[#1D9E75] text-white shadow-[0_0_0_3px_#d0ede2]' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {s.status === '마감' ? <i className="fas fa-check text-[10px]"></i> : i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{s.stage}</div>
                    <div className="text-xs text-gray-400">{s.startDate} ~ {s.endDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <div className="text-xs text-gray-400">제출 현황</div>
                    <div className="text-sm font-semibold text-gray-900">{s.submitted} / {s.total}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    s.status === '마감' ? 'bg-gray-100 text-gray-500' :
                    s.status === '진행중' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>{s.status}</span>
                  {s.status === '대기' && (
                    <button className="text-xs px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg hover:bg-[#0F6E56] transition-colors">오픈</button>
                  )}
                  {s.status === '진행중' && (
                    <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-red-300 hover:text-red-500 transition-all">마감</button>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#1D9E75] h-full rounded-full transition-all" style={{ width: `${(s.submitted / s.total) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 목표 등록 현황 ── */}
      {tab === 'goals' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="card p-4">
              <div className="text-xs text-gray-400 mb-1">등록 완료</div>
              <div className="text-2xl font-bold text-[#1D9E75]">{mockGoals.filter(g => g.status === '등록완료').length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-400 mb-1">미등록</div>
              <div className="text-2xl font-bold text-red-400">{mockGoals.filter(g => g.status === '미등록').length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-400 mb-1">임시 저장</div>
              <div className="text-2xl font-bold text-yellow-500">{mockGoals.filter(g => g.status === '임시저장').length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">목표 수</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
                </tr>
              </thead>
              <tbody>
                {mockGoals.map(g => (
                  <tr key={g.empId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{g.empId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                    <td className="px-4 py-3 text-gray-600">{g.department}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{g.goalCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        g.status === '등록완료' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                        g.status === '미등록' ? 'bg-red-50 text-red-500' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>{g.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g.status === '미등록' && (
                        <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">
                          <i className="fas fa-bell mr-1"></i>독촉
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 평가 입력 모니터링 ── */}
      {tab === 'monitor' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {evalProgress.map(ep => (
              <div key={ep.type} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">{ep.type}</span>
                  <span className="text-xs text-gray-400">{ep.submitted}/{ep.total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
                  <div className="bg-[#1D9E75] h-full rounded-full transition-all" style={{ width: `${(ep.submitted / ep.total) * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#1D9E75] font-medium">{Math.round((ep.submitted / ep.total) * 100)}% 완료</span>
                  <span className="text-red-400">미제출 {ep.total - ep.submitted}명</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-900">미제출자 목록</span>
              <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors">
                <i className="fas fa-bell text-[10px]"></i>일괄 독촉 발송
              </button>
            </div>
            <div className="space-y-2">
              {mockGoals.filter(g => g.status !== '등록완료').map(g => (
                <div key={g.empId} className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg hover:border-[#1D9E75] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
                      {g.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{g.name}</div>
                      <div className="text-xs text-gray-400">{g.department} · {g.empId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      g.status === '미등록' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                    }`}>{g.status}</span>
                    <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">독촉</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
