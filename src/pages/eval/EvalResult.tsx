import { useState } from 'react'

interface AppealRecord {
  id: number
  empId: string
  name: string
  department: string
  currentGrade: string
  requestedGrade: string
  reason: string
  managerResponse: string
  status: '접수' | '검토중' | '기각' | '인용'
  date: string
}

const mockAppeals: AppealRecord[] = [
  { id: 1, empId: 'PC2024003', name: '박지훈', department: '마케팅팀', currentGrade: 'C', requestedGrade: 'B', reason: '프로젝트 기여도 미반영', managerResponse: '', status: '접수', date: '2024-07-03' },
  { id: 2, empId: 'PC2024004', name: '최유진', department: '영업팀', currentGrade: 'B', requestedGrade: 'A', reason: '매출 목표 120% 달성', managerResponse: '검토 중', status: '검토중', date: '2024-07-02' },
  { id: 3, empId: 'PC2024006', name: '한승우', department: '개발팀', currentGrade: 'C', requestedGrade: 'B', reason: '신규 프로젝트 투입으로 목표 변경', managerResponse: '타당성 인정', status: '인용', date: '2024-07-01' },
]

const yearlyHistory = [
  { year: '2024 상', grade: 'A', score: 82.4 },
  { year: '2023 하', grade: 'B', score: 76.0 },
  { year: '2023 상', grade: 'A', score: 84.2 },
  { year: '2022 하', grade: 'B', score: 78.5 },
  { year: '2022 상', grade: 'S', score: 91.0 },
]

const gradeColors: Record<string, string> = { S: '#1D9E75', A: '#3B82F6', B: '#F59E0B', C: '#F97316', D: '#EF4444' }

const deptResults = [
  { dept: '개발팀', S: 2, A: 1, B: 0, C: 1, avg: 78.1 },
  { dept: '인사팀', S: 1, A: 0, B: 0, C: 0, avg: 90.4 },
  { dept: '마케팅팀', S: 0, A: 0, B: 0, C: 1, avg: 68.5 },
  { dept: '영업팀', S: 0, A: 0, B: 1, C: 0, avg: 74.2 },
  { dept: '재무팀', S: 0, A: 1, B: 0, C: 0, avg: 88.4 },
  { dept: '경영지원팀', S: 0, A: 0, B: 1, C: 0, avg: 80.0 },
]

export default function EvalResult() {
  const [tab, setTab] = useState<'result' | 'incentive' | 'notify' | 'appeal' | 'history'>('result')

  const tabs = [
    { key: 'result', label: '결과 조회' },
    { key: 'incentive', label: '급여 연동' },
    { key: 'notify', label: '결과 통보' },
    { key: 'appeal', label: '이의신청' },
    { key: 'history', label: '연도별 이력' },
  ] as const

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 결과 처리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 결과 처리</h1>
          <p className="text-xs text-gray-400 mt-1">결과 조회, 급여 연동, 결과 통보, 이의신청, 리포트를 관리합니다. (eval-19 ~ eval-24)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            <i className="fas fa-file-pdf text-xs"></i>리포트 출력
          </button>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
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

      {/* ── 결과 조회 ── */}
      {tab === 'result' && (
        <>
          <div className="grid grid-cols-5 gap-3 mb-4">
            {Object.entries(gradeColors).map(([grade, color]) => {
              const total = deptResults.reduce((s, d) => s + (d[grade as keyof typeof d] as number || 0), 0)
              return (
                <div key={grade} className="card p-3 text-center">
                  <div className="text-lg font-bold" style={{ color }}>{grade}</div>
                  <div className="text-xl font-bold text-gray-900">{total}<span className="text-xs font-normal text-gray-400">명</span></div>
                </div>
              )
            })}
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">S</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">A</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">B</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">C</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">평균 점수</th>
                </tr>
              </thead>
              <tbody>
                {deptResults.map(d => (
                  <tr key={d.dept} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.dept}</td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: gradeColors.S }}>{d.S || '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: gradeColors.A }}>{d.A || '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: gradeColors.B }}>{d.B || '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: gradeColors.C }}>{d.C || '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-700 font-medium">{d.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 급여/인센티브 연동 ── */}
      {tab === 'incentive' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">등급별 인센티브 환산</span>
              <span className="text-xs text-gray-400 ml-2">eval-20</span>
            </div>
            <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-paper-plane text-[10px]"></i>급여 모듈 전달
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">등급</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">인원</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">기본 인센티브율</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">1인 평균</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">합계</th>
              </tr>
            </thead>
            <tbody>
              {[
                { grade: 'S', count: 3, rate: '200%', avg: '6,000,000', total: '18,000,000' },
                { grade: 'A', count: 2, rate: '150%', avg: '4,500,000', total: '9,000,000' },
                { grade: 'B', count: 2, rate: '100%', avg: '3,000,000', total: '6,000,000' },
                { grade: 'C', count: 1, rate: '50%', avg: '1,500,000', total: '1,500,000' },
              ].map(r => (
                <tr key={r.grade} className="border-b border-gray-50">
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: gradeColors[r.grade] + '15', color: gradeColors[r.grade] }}>{r.grade}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{r.count}명</td>
                  <td className="px-4 py-3 text-center text-gray-700">{r.rate}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">{r.avg}원</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-gray-900">{r.total}원</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700 text-sm">총 인센티브</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[#1D9E75]">34,500,000원</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── 결과 통보 ── */}
      {tab === 'notify' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">평가 결과 일괄 통보</span>
              <span className="text-xs text-gray-400 ml-2">eval-21</span>
            </div>
            <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-bullhorn text-xs"></i>일괄 공개
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">최종 등급과 팀장 피드백을 동시에 대상자에게 공개합니다.</p>
          <div className="space-y-2">
            {[
              { label: '평가 등급 공개', desc: '확정된 S/A/B/C 등급을 본인에게 공개', checked: true },
              { label: '팀장 피드백 공개', desc: '상위자 평가의 서술형 피드백을 동시 공개', checked: true },
              { label: '동료평가 점수 공개', desc: '동료평가 평균 점수를 본인에게 공개 (익명)', checked: false },
              { label: '이의신청 기간 안내', desc: '이의신청 접수 기간 및 방법 안내 포함', checked: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-lg">
                <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 ${item.checked ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                  {item.checked && <i className="fas fa-check text-white text-[9px]"></i>}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 이의신청 ── */}
      {tab === 'appeal' && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="card p-4">
              <div className="text-xs text-gray-400 mb-1">전체</div>
              <div className="text-2xl font-bold text-gray-900">{mockAppeals.length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-400 mb-1">접수/검토중</div>
              <div className="text-2xl font-bold text-yellow-500">{mockAppeals.filter(a => a.status === '접수' || a.status === '검토중').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-400 mb-1">인용</div>
              <div className="text-2xl font-bold text-[#1D9E75]">{mockAppeals.filter(a => a.status === '인용').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-400 mb-1">기각</div>
              <div className="text-2xl font-bold text-red-400">{mockAppeals.filter(a => a.status === '기각').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">현재등급</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">요청등급</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사유</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">처리</th>
                </tr>
              </thead>
              <tbody>
                {mockAppeals.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: gradeColors[a.currentGrade] + '15', color: gradeColors[a.currentGrade] }}>{a.currentGrade}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: gradeColors[a.requestedGrade] + '15', color: gradeColors[a.requestedGrade] }}>{a.requestedGrade}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.status === '접수' ? 'bg-yellow-50 text-yellow-600' :
                        a.status === '검토중' ? 'bg-blue-50 text-blue-600' :
                        a.status === '인용' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                        'bg-red-50 text-red-500'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(a.status === '접수' || a.status === '검토중') && (
                        <div className="flex gap-1.5 justify-center">
                          <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">인용</button>
                          <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-red-300 hover:text-red-500 transition-all">기각</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 연도별 이력 ── */}
      {tab === 'history' && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-900">평가 이력 추이</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-48">
                  <i className="fas fa-search text-gray-400 text-xs"></i>
                  <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 검색" />
                </div>
              </div>

              {/* Chart area */}
              <div className="flex items-end gap-6 h-48 mb-4">
                {yearlyHistory.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <span className="text-xs font-bold mb-1" style={{ color: gradeColors[h.grade] }}>{h.grade}</span>
                    <span className="text-[10px] text-gray-400 mb-1">{h.score}</span>
                    <div className="w-full rounded-t-md transition-all" style={{ height: `${(h.score / 100) * 100}%`, backgroundColor: gradeColors[h.grade], minHeight: '20px' }}></div>
                    <span className="text-[10px] text-gray-400 mt-2">{h.year}</span>
                  </div>
                ))}
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-medium text-gray-500">평가 시즌</th>
                    <th className="text-center py-2 font-medium text-gray-500">등급</th>
                    <th className="text-center py-2 font-medium text-gray-500">종합점수</th>
                    <th className="text-center py-2 font-medium text-gray-500">변동</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyHistory.map((h, i) => {
                    const prev = yearlyHistory[i + 1]
                    const diff = prev ? h.score - prev.score : 0
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">{h.year}</td>
                        <td className="py-2 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: gradeColors[h.grade] + '15', color: gradeColors[h.grade] }}>{h.grade}</span>
                        </td>
                        <td className="py-2 text-center font-medium text-gray-900">{h.score}</td>
                        <td className="py-2 text-center">
                          {diff !== 0 && (
                            <span className={diff > 0 ? 'text-[#1D9E75]' : 'text-red-400'}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-span-4">
            <div className="card p-5">
              <span className="text-sm font-semibold text-gray-900 mb-3 block">등급 분포 이력</span>
              <div className="space-y-3">
                {Object.entries(gradeColors).map(([grade, color]) => {
                  const count = yearlyHistory.filter(h => h.grade === grade).length
                  return (
                    <div key={grade} className="flex items-center gap-3">
                      <span className="text-sm font-bold w-6 text-center" style={{ color }}>{grade}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(count / yearlyHistory.length) * 100}%`, backgroundColor: color }}></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8">{count}회</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
