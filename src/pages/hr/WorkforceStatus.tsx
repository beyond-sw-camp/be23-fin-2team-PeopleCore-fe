import { useState } from 'react'

const deptData = [
  { dept: '개발팀', total: 25, 사원: 8, 주임: 4, 대리: 6, 과장: 3, 차장: 2, 부장: 2, avgYears: 3.2 },
  { dept: '인사팀', total: 8, 사원: 2, 주임: 1, 대리: 2, 과장: 2, 차장: 0, 부장: 1, avgYears: 4.5 },
  { dept: '마케팅팀', total: 12, 사원: 4, 주임: 3, 대리: 2, 과장: 2, 차장: 0, 부장: 1, avgYears: 2.8 },
  { dept: '영업팀', total: 15, 사원: 5, 주임: 4, 대리: 3, 과장: 2, 차장: 0, 부장: 1, avgYears: 3.0 },
  { dept: '재무팀', total: 6, 사원: 1, 주임: 1, 대리: 1, 과장: 1, 차장: 1, 부장: 1, avgYears: 5.1 },
  { dept: '경영지원팀', total: 7, 사원: 2, 주임: 1, 대리: 2, 과장: 1, 차장: 0, 부장: 1, avgYears: 3.9 },
]

const monthlyData = [
  { month: '2024-01', hired: 3, resigned: 1 },
  { month: '2024-02', hired: 2, resigned: 0 },
  { month: '2024-03', hired: 5, resigned: 2 },
  { month: '2024-04', hired: 1, resigned: 1 },
  { month: '2024-05', hired: 4, resigned: 3 },
]

const expiringContracts = [
  { empId: 'PC2024003', name: '박지훈', department: '마케팅팀', type: '계약직', expiryDate: '2024-06-30', daysLeft: 17 },
  { empId: 'PC2024012', name: '김태희', department: '영업팀', type: '인턴', expiryDate: '2024-07-15', daysLeft: 32 },
  { empId: 'PC2024013', name: '이준호', department: '개발팀', type: '파견직', expiryDate: '2024-07-31', daysLeft: 48 },
]

export default function WorkforceStatus() {
  const [selectedDept, setSelectedDept] = useState('')
  const totalEmployees = deptData.reduce((sum, d) => sum + d.total, 0)
  const maxDeptSize = Math.max(...deptData.map(d => d.total))

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">인력 현황</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">인력 현황</h1>
        <p className="text-xs text-gray-400 mt-1">부서별 인원, 입퇴사 추이, 계약 만료 예정자를 한눈에 확인합니다. (emp-7, emp-8, emp-11)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">전체 재직 인원</div>
          <div className="text-2xl font-bold text-gray-900">{totalEmployees}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">이번 달 입사</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{monthlyData[monthlyData.length - 1].hired}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">이번 달 퇴사</div>
          <div className="text-2xl font-bold text-red-400">{monthlyData[monthlyData.length - 1].resigned}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">계약 만료 예정</div>
          <div className="text-2xl font-bold text-yellow-500">{expiringContracts.length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 부서별 인원 현황 */}
        <div className="col-span-8">
          <div className="card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">부서별 인원 현황</h3>
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none">
                <option value="">전체 부서</option>
                {deptData.map(d => <option key={d.dept} value={d.dept}>{d.dept}</option>)}
              </select>
            </div>
            {/* Bar Chart */}
            <div className="space-y-3 mb-5">
              {deptData.filter(d => !selectedDept || d.dept === selectedDept).map(d => (
                <div key={d.dept} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 text-right shrink-0">{d.dept}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="bg-[#1D9E75] h-full rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(d.total / maxDeptSize) * 100}%` }}>
                      <span className="text-xs text-white font-medium">{d.total}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-20">평균 {d.avgYears}년</span>
                </div>
              ))}
            </div>

            {/* Detail Table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">부서</th>
                  <th className="text-center py-2 font-medium text-gray-500">사원</th>
                  <th className="text-center py-2 font-medium text-gray-500">주임</th>
                  <th className="text-center py-2 font-medium text-gray-500">대리</th>
                  <th className="text-center py-2 font-medium text-gray-500">과장</th>
                  <th className="text-center py-2 font-medium text-gray-500">차장</th>
                  <th className="text-center py-2 font-medium text-gray-500">부장</th>
                  <th className="text-center py-2 font-medium text-gray-500">합계</th>
                </tr>
              </thead>
              <tbody>
                {deptData.filter(d => !selectedDept || d.dept === selectedDept).map(d => (
                  <tr key={d.dept} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-gray-700">{d.dept}</td>
                    <td className="py-2 text-center text-gray-600">{d.사원}</td>
                    <td className="py-2 text-center text-gray-600">{d.주임}</td>
                    <td className="py-2 text-center text-gray-600">{d.대리}</td>
                    <td className="py-2 text-center text-gray-600">{d.과장}</td>
                    <td className="py-2 text-center text-gray-600">{d.차장}</td>
                    <td className="py-2 text-center text-gray-600">{d.부장}</td>
                    <td className="py-2 text-center font-semibold text-gray-900">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 월별 입퇴사 추이 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">월별 인력 변동 추이</h3>
            <div className="flex items-end gap-6 h-40">
              {monthlyData.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-1 h-28 w-full justify-center">
                    <div className="w-5 bg-[#1D9E75] rounded-t-sm transition-all" style={{ height: `${(m.hired / 6) * 100}%` }}
                      title={`입사 ${m.hired}명`}></div>
                    <div className="w-5 bg-red-300 rounded-t-sm transition-all" style={{ height: `${(m.resigned / 6) * 100}%` }}
                      title={`퇴사 ${m.resigned}명`}></div>
                  </div>
                  <span className="text-[10px] text-gray-400">{m.month.split('-')[1]}월</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[#1D9E75] rounded-sm"></div>
                <span className="text-xs text-gray-500">입사</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-300 rounded-sm"></div>
                <span className="text-xs text-gray-500">퇴사</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계약 만료 예정자 */}
        <div className="col-span-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">계약 만료 예정자</h3>
              <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full font-medium">{expiringContracts.length}명</span>
            </div>
            <div className="space-y-3">
              {expiringContracts.map(emp => (
                <div key={emp.empId} className="p-3 border border-gray-100 rounded-lg hover:border-[#1D9E75] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      emp.daysLeft <= 30 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      D-{emp.daysLeft}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">부서</span>
                      <span className="text-gray-600">{emp.department}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">고용형태</span>
                      <span className="text-gray-600">{emp.type}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">만료일</span>
                      <span className="text-gray-600">{emp.expiryDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-gray-400">
              <i className="fas fa-info-circle mr-1"></i>
              만료 30일 전 자동 알림이 발송됩니다
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
