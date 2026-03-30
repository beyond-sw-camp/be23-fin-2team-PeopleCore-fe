import { useState } from 'react'

interface GradeRecord {
  empId: string
  name: string
  department: string
  rank: string
  totalScore: number
  autoGrade: string
  finalGrade: string | null
  adjusted: boolean
  note: string
}

const mockGrades: GradeRecord[] = [
  { empId: 'PC2024002', name: '이서연', department: '인사팀', rank: '과장', totalScore: 90.4, autoGrade: 'S', finalGrade: 'S', adjusted: false, note: '' },
  { empId: 'PC2024001', name: '김민수', department: '개발팀', rank: '대리', totalScore: 82.4, autoGrade: 'A', finalGrade: 'A', adjusted: false, note: '' },
  { empId: 'PC2024008', name: '윤재혁', department: '개발팀', rank: '부장', totalScore: 88.0, autoGrade: 'A', finalGrade: 'S', adjusted: true, note: '팀 리더십 우수' },
  { empId: 'PC2024005', name: '정하은', department: '재무팀', rank: '차장', totalScore: 88.4, autoGrade: 'A', finalGrade: 'A', adjusted: false, note: '' },
  { empId: 'PC2024007', name: '오나영', department: '경영지원팀', rank: '대리', totalScore: 80.0, autoGrade: 'B', finalGrade: 'B', adjusted: false, note: '' },
  { empId: 'PC2024004', name: '최유진', department: '영업팀', rank: '주임', totalScore: 74.2, autoGrade: 'B', finalGrade: 'B', adjusted: false, note: '' },
  { empId: 'PC2024003', name: '박지훈', department: '마케팅팀', rank: '사원', totalScore: 68.5, autoGrade: 'C', finalGrade: 'C', adjusted: false, note: '' },
  { empId: 'PC2024006', name: '한승우', department: '개발팀', rank: '사원', totalScore: 62.0, autoGrade: 'C', finalGrade: null, adjusted: false, note: '' },
]

const distributionTarget = { S: 10, A: 20, B: 40, C: 20, D: 10 }

export default function EvalGrading() {
  const [tab, setTab] = useState<'auto' | 'distribution' | 'calibration' | 'confirm'>('auto')
  const [isLocked, setIsLocked] = useState(false)

  const gradeCounts: Record<string, number> = {}
  mockGrades.forEach(g => {
    const grade = g.finalGrade || g.autoGrade
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1
  })
  const total = mockGrades.length

  const gradeColors: Record<string, string> = { S: '#1D9E75', A: '#3B82F6', B: '#F59E0B', C: '#F97316', D: '#EF4444' }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">등급 산정/보정</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">등급 산정 / 보정</h1>
          <p className="text-xs text-gray-400 mt-1">등급 자동 산정, 분포 조회, 보정(Calibration), 최종 확정을 처리합니다. (eval-15 ~ eval-18)</p>
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
          <option>2024년 상반기 정기평가</option>
          <option>2023년 하반기 정기평가</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: 'auto', label: '등급 자동 산정' },
          { key: 'distribution', label: '부서별 분포' },
          { key: 'calibration', label: '등급 보정' },
          { key: 'confirm', label: '최종 확정' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 등급 자동 산정 ── */}
      {tab === 'auto' && (
        <>
          <div className="card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm font-semibold text-gray-900">등급 산정 기준</span>
                <span className="text-xs text-gray-400 ml-2">자기평가 20% + 동료평가 30% + 상위자평가 50%</span>
              </div>
              <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors">
                <i className="fas fa-calculator text-[10px]"></i>등급 재산정
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(distributionTarget).map(([grade, target]) => {
                const actual = gradeCounts[grade] || 0
                const actualPct = Math.round((actual / total) * 100)
                const over = actualPct > target
                return (
                  <div key={grade} className={`p-3 rounded-lg border text-center ${over ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                    <div className="text-lg font-bold" style={{ color: gradeColors[grade] }}>{grade}</div>
                    <div className="text-xl font-bold text-gray-900">{actual}<span className="text-xs font-normal text-gray-400">명</span></div>
                    <div className="text-xs mt-1">
                      <span className={over ? 'text-red-500 font-medium' : 'text-gray-400'}>{actualPct}%</span>
                      <span className="text-gray-300 mx-1">/</span>
                      <span className="text-gray-400">{target}%</span>
                    </div>
                    {over && <div className="text-[10px] text-red-500 mt-0.5">초과</div>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">종합점수</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">자동등급</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">확정등급</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">보정</th>
                </tr>
              </thead>
              <tbody>
                {mockGrades.map(g => (
                  <tr key={g.empId} className={`border-b border-gray-50 transition-colors ${g.adjusted ? 'bg-yellow-50/50' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{g.empId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                    <td className="px-4 py-3 text-gray-600">{g.department}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{g.totalScore}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: gradeColors[g.autoGrade] + '15', color: gradeColors[g.autoGrade] }}>{g.autoGrade}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g.finalGrade ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: gradeColors[g.finalGrade] + '15', color: gradeColors[g.finalGrade] }}>{g.finalGrade}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g.adjusted && (
                        <span className="text-[10px] px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full font-medium">
                          <i className="fas fa-exchange-alt mr-0.5"></i>{g.note}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 부서별 분포 ── */}
      {tab === 'distribution' && (
        <div className="space-y-4">
          {['개발팀', '인사팀', '마케팅팀', '영업팀', '재무팀', '경영지원팀'].map(dept => {
            const deptRecords = mockGrades.filter(g => g.department === dept)
            if (deptRecords.length === 0) return null
            const deptGradeCounts: Record<string, number> = {}
            deptRecords.forEach(g => {
              const grade = g.finalGrade || g.autoGrade
              deptGradeCounts[grade] = (deptGradeCounts[grade] || 0) + 1
            })
            return (
              <div key={dept} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{dept}</span>
                    <span className="text-xs text-gray-400">{deptRecords.length}명</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {Object.entries(gradeColors).map(([grade, color]) => {
                    const count = deptGradeCounts[grade] || 0
                    const pct = deptRecords.length > 0 ? Math.round((count / deptRecords.length) * 100) : 0
                    const over = pct > (distributionTarget[grade as keyof typeof distributionTarget] || 0)
                    return (
                      <div key={grade} className={`flex-1 p-2.5 rounded-lg border text-center ${over ? 'border-red-200' : 'border-gray-100'}`}>
                        <div className="text-xs font-bold" style={{ color }}>{grade}</div>
                        <div className="text-sm font-bold text-gray-900">{count}명</div>
                        <div className={`text-[10px] ${over ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{pct}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 등급 보정 ── */}
      {tab === 'calibration' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">등급 보정 (Calibration)</span>
              <span className="text-xs text-gray-400 ml-2">eval-17</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">예외 케이스(부서 이동자, 동점자 등)를 수동 조정합니다. 전사 분포가 실시간으로 업데이트됩니다.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">점수</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">자동등급</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">보정등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사유</th>
              </tr>
            </thead>
            <tbody>
              {mockGrades.map(g => (
                <tr key={g.empId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                  <td className="px-4 py-3 text-gray-600">{g.department}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{g.totalScore}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: gradeColors[g.autoGrade] + '15', color: gradeColors[g.autoGrade] }}>{g.autoGrade}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select className="border border-gray-200 rounded-md px-2 py-1 text-xs text-center outline-none focus:border-[#1D9E75] w-16" defaultValue={g.finalGrade || g.autoGrade}>
                      <option>S</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-[#1D9E75] w-full" placeholder="보정 사유" defaultValue={g.note} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
            <button className="bg-[#1D9E75] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">보정 저장</button>
          </div>
        </div>
      )}

      {/* ── 최종 확정 ── */}
      {tab === 'confirm' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">최종 등급 확정 및 잠금</span>
              <span className="text-xs text-gray-400 ml-2">eval-18</span>
            </div>
            {!isLocked ? (
              <button onClick={() => setIsLocked(true)}
                className="flex items-center gap-1.5 bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                <i className="fas fa-lock text-xs"></i>최종 확정 및 잠금
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-medium">
                  <i className="fas fa-lock mr-1"></i>확정 완료 · 수정 불가
                </span>
                <button onClick={() => setIsLocked(false)}
                  className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-red-300 hover:text-red-500 transition-all">
                  <i className="fas fa-unlock mr-1"></i>잠금 해제 (HR)
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">확정 후에는 수정이 불가합니다. 이의신청 인용 시 HR 권한으로만 잠금 해제가 가능합니다.</p>

          <div className="grid grid-cols-5 gap-3 mb-5">
            {Object.entries(gradeColors).map(([grade, color]) => {
              const count = gradeCounts[grade] || 0
              return (
                <div key={grade} className="p-3 rounded-lg border border-gray-100 text-center">
                  <div className="text-lg font-bold" style={{ color }}>{grade}</div>
                  <div className="text-xl font-bold text-gray-900">{count}<span className="text-xs font-normal text-gray-400">명</span></div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            {mockGrades.map(g => (
              <div key={g.empId} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${isLocked ? 'border-gray-100 bg-gray-50' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">{g.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{g.name}</div>
                    <div className="text-xs text-gray-400">{g.department} · {g.rank}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">{g.totalScore}점</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: gradeColors[g.finalGrade || g.autoGrade] + '15', color: gradeColors[g.finalGrade || g.autoGrade] }}>
                    {g.finalGrade || g.autoGrade}
                  </span>
                  {g.adjusted && <i className="fas fa-exchange-alt text-yellow-500 text-[10px]" title="보정됨"></i>}
                  {isLocked && <i className="fas fa-lock text-gray-300 text-[10px]"></i>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
