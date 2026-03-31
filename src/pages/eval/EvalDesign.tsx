import { useState } from 'react'

interface EvalSeason {
  id: number
  name: string
  year: number
  half: string
  startDate: string
  endDate: string
  status: '준비중' | '진행중' | '완료'
  targetCount: number
}

interface EvalItem {
  id: number
  category: string
  name: string
  type: '정량' | '정성'
  weight: number
}

interface PeerMapping {
  evaluatee: string
  evaluators: string[]
  department: string
}

const mockSeasons: EvalSeason[] = [
  { id: 1, name: '2024년 상반기 정기평가', year: 2024, half: '상반기', startDate: '2024-06-01', endDate: '2024-06-30', status: '진행중', targetCount: 73 },
  { id: 2, name: '2023년 하반기 정기평가', year: 2023, half: '하반기', startDate: '2023-12-01', endDate: '2023-12-31', status: '완료', targetCount: 68 },
  { id: 3, name: '2024년 하반기 정기평가', year: 2024, half: '하반기', startDate: '2024-12-01', endDate: '2024-12-31', status: '준비중', targetCount: 0 },
]

const mockItems: EvalItem[] = [
  { id: 1, category: '업무 성과', name: 'KPI 달성률', type: '정량', weight: 30 },
  { id: 2, category: '업무 성과', name: '프로젝트 기여도', type: '정성', weight: 20 },
  { id: 3, category: '역량', name: '직무 전문성', type: '정성', weight: 15 },
  { id: 4, category: '역량', name: '문제 해결력', type: '정성', weight: 10 },
  { id: 5, category: '조직 기여', name: '협업·소통', type: '정성', weight: 15 },
  { id: 6, category: '조직 기여', name: '리더십/팔로워십', type: '정성', weight: 10 },
]

const evalWeights = { self: 20, peer: 30, manager: 50 }

const gradeDistribution = [
  { grade: 'S', label: '탁월', ratio: 10, color: '#1D9E75' },
  { grade: 'A', label: '우수', ratio: 20, color: '#3B82F6' },
  { grade: 'B', label: '보통', ratio: 40, color: '#F59E0B' },
  { grade: 'C', label: '미흡', ratio: 20, color: '#F97316' },
  { grade: 'D', label: '부진', ratio: 10, color: '#EF4444' },
]

const mockPeerMappings: PeerMapping[] = [
  { evaluatee: '김민수', department: '개발팀', evaluators: ['한승우', '윤재혁', '박지훈'] },
  { evaluatee: '이서연', department: '인사팀', evaluators: ['오나영', '정하은'] },
  { evaluatee: '박지훈', department: '마케팅팀', evaluators: ['최유진', '김민수', '이서연'] },
  { evaluatee: '최유진', department: '영업팀', evaluators: ['박지훈', '정하은'] },
  { evaluatee: '한승우', department: '개발팀', evaluators: ['김민수', '윤재혁'] },
]

export default function EvalDesign() {
  const [tab, setTab] = useState<'season' | 'items' | 'distribution' | 'peer'>('season')
  const [showCreateSeason, setShowCreateSeason] = useState(false)

  const tabs = [
    { key: 'season', label: '평가 주기/일정', desc: 'eval-1' },
    { key: 'items', label: '평가 항목·가중치', desc: 'eval-2' },
    { key: 'distribution', label: '강제배분/대상자', desc: 'eval-3, eval-4' },
    { key: 'peer', label: '동료평가 지정', desc: 'eval-5' },
  ] as const

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 설계</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 설계</h1>
          <p className="text-xs text-gray-400 mt-1">평가 주기·항목·가중치·강제배분·동료평가를 설정합니다. (eval-1 ~ eval-5)</p>
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

      {/* ── 평가 주기/일정 ── */}
      {tab === 'season' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowCreateSeason(!showCreateSeason)}
              className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-plus text-xs"></i>평가 시즌 생성
            </button>
          </div>

          {showCreateSeason && (
            <div className="card p-5 mb-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">평가 시즌 생성</span>
              </div>
              <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">평가명 <span className="text-red-400">*</span></label>
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="예) 2024년 상반기 정기평가" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">평가 주기 <span className="text-red-400">*</span></label>
                  <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                    <option>상반기</option>
                    <option>하반기</option>
                    <option>연간</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">연도 <span className="text-red-400">*</span></label>
                  <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                    <option>2024</option>
                    <option>2025</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">평가 시작일 <span className="text-red-400">*</span></label>
                  <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">평가 종료일 <span className="text-red-400">*</span></label>
                  <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setShowCreateSeason(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
                <button className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">생성</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {mockSeasons.map(s => (
              <div key={s.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      s.status === '진행중' ? 'bg-[#eaf6f0]' : s.status === '준비중' ? 'bg-yellow-50' : 'bg-gray-100'
                    }`}>
                      <i className={`fas fa-calendar-alt ${
                        s.status === '진행중' ? 'text-[#1D9E75]' : s.status === '준비중' ? 'text-yellow-500' : 'text-gray-400'
                      }`}></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.startDate} ~ {s.endDate}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-3">
                      <div className="text-xs text-gray-400">대상 인원</div>
                      <div className="text-sm font-semibold text-gray-900">{s.targetCount}명</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      s.status === '진행중' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                      s.status === '준비중' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{s.status}</span>
                    <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                      <i className="fas fa-cog mr-1"></i>관리
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 평가 항목·가중치 ── */}
      {tab === 'items' && (
        <>
          {/* 평가 비중 */}
          <div className="card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-900">평가 유형별 비중</span>
              <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                <i className="fas fa-edit mr-1"></i>수정
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '자기평가', value: evalWeights.self, icon: 'fa-user' },
                { label: '동료평가', value: evalWeights.peer, icon: 'fa-users' },
                { label: '상위자평가', value: evalWeights.manager, icon: 'fa-user-tie' },
              ].map(w => (
                <div key={w.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-[#eaf6f0] flex items-center justify-center">
                    <i className={`fas ${w.icon} text-[#1D9E75] text-sm`}></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{w.label}</div>
                    <div className="text-lg font-bold text-gray-900">{w.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 평가 항목 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-900">평가 항목 목록</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">총 가중치: {mockItems.reduce((s, i) => s + i.weight, 0)}%</span>
                <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors">
                  <i className="fas fa-plus text-[10px]"></i>항목 추가
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">카테고리</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">항목명</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">유형</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">가중치</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
                </tr>
              </thead>
              <tbody>
                {mockItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.type === '정량' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>{item.type}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-[#1D9E75] h-full rounded-full" style={{ width: `${item.weight * 2}%` }}></div>
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8">{item.weight}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-gray-400 hover:text-[#1D9E75] text-xs mr-2"><i className="fas fa-edit"></i></button>
                      <button className="text-gray-400 hover:text-red-400 text-xs"><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 강제배분 / 대상자 ── */}
      {tab === 'distribution' && (
        <>
          {/* 강제배분 */}
          <div className="card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm font-semibold text-gray-900">강제배분 설정</span>
                <span className="text-[10px] text-gray-400 ml-2">eval-4</span>
              </div>
              <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                <i className="fas fa-edit mr-1"></i>수정
              </button>
            </div>
            <div className="flex items-end gap-3 h-40">
              {gradeDistribution.map(g => (
                <div key={g.grade} className="flex-1 flex flex-col items-center">
                  <span className="text-xs font-semibold text-gray-700 mb-1">{g.ratio}%</span>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${g.ratio * 2.5}%`, backgroundColor: g.color, minHeight: '20px' }}></div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-bold" style={{ color: g.color }}>{g.grade}</div>
                    <div className="text-[10px] text-gray-400">{g.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 대상자 확정 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm font-semibold text-gray-900">평가 대상자 확정</span>
                <span className="text-[10px] text-gray-400 ml-2">eval-3</span>
              </div>
              <div className="flex gap-2">
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none">
                  <option>2024년 상반기 정기평가</option>
                  <option>2024년 하반기 정기평가</option>
                </select>
                <button className="bg-[#1D9E75] text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors">대상자 확정</button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {[
                { dept: '개발팀', count: 25 },
                { dept: '인사팀', count: 8 },
                { dept: '마케팅팀', count: 12 },
                { dept: '영업팀', count: 15 },
                { dept: '재무팀', count: 6 },
                { dept: '경영지원팀', count: 7 },
              ].map(d => (
                <div key={d.dept} className="p-3 border border-gray-100 rounded-lg text-center hover:border-[#1D9E75] transition-colors cursor-pointer">
                  <div className="text-xs text-gray-400">{d.dept}</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{d.count}<span className="text-xs font-normal text-gray-400">명</span></div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">재직 상태 기준 자동 추출 · 수습/휴직자 별도 설정 가능</span>
              <span className="text-sm font-semibold text-[#1D9E75]">총 73명</span>
            </div>
          </div>
        </>
      )}

      {/* ── 동료평가 대상자 지정 ── */}
      {tab === 'peer' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">동료평가 대상자·평가자 매핑</span>
              <span className="text-[10px] text-gray-400 ml-2">eval-5</span>
            </div>
            <div className="flex gap-2">
              <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                <i className="fas fa-random mr-1"></i>자동 배정
              </button>
              <button className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors">
                <i className="fas fa-plus mr-1"></i>수동 지정
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">피평가자</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평가자</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">인원</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
              </tr>
            </thead>
            <tbody>
              {mockPeerMappings.map((m, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.evaluatee}</td>
                  <td className="px-4 py-3 text-gray-600">{m.department}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.evaluators.map((e, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{e}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{m.evaluators.length}명</td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-gray-400 hover:text-[#1D9E75] text-xs"><i className="fas fa-edit"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
