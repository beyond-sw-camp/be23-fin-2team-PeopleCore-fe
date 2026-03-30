import { useState } from 'react'

interface RetirementRequest {
  id: number
  empId: string
  name: string
  department: string
  rank: string
  hireDate: string
  resignDate: string
  reason: string
  status: '신청' | '결재중' | '처리완료'
  checklist: { label: string; done: boolean }[]
}

const mockRetirements: RetirementRequest[] = [
  {
    id: 1, empId: 'PC2024009', name: '장현우', department: '영업팀', rank: '과장',
    hireDate: '2019-03-04', resignDate: '2024-06-30', reason: '개인 사유', status: '신청',
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: false },
      { label: '시스템 계정 회수', done: false },
      { label: '업무 인수인계서 제출', done: false },
      { label: '잔여 연차 정산', done: false },
      { label: '퇴직금 정산', done: false },
    ]
  },
  {
    id: 2, empId: 'PC2024010', name: '송미래', department: '마케팅팀', rank: '대리',
    hireDate: '2021-07-12', resignDate: '2024-05-31', reason: '이직', status: '결재중',
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: true },
      { label: '시스템 계정 회수', done: false },
      { label: '업무 인수인계서 제출', done: true },
      { label: '잔여 연차 정산', done: false },
      { label: '퇴직금 정산', done: false },
    ]
  },
  {
    id: 3, empId: 'PC2024011', name: '강태영', department: '개발팀', rank: '사원',
    hireDate: '2023-01-09', resignDate: '2024-04-30', reason: '계약 만료', status: '처리완료',
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: true },
      { label: '시스템 계정 회수', done: true },
      { label: '업무 인수인계서 제출', done: true },
      { label: '잔여 연차 정산', done: true },
      { label: '퇴직금 정산', done: true },
    ]
  },
]

export default function RetirementManagement() {
  const [selected, setSelected] = useState<RetirementRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = mockRetirements.filter(r => !filterStatus || r.status === filterStatus)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">퇴직 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">퇴직 관리</h1>
          <p className="text-xs text-gray-400 mt-1">퇴직 신청 접수 및 처리, 퇴직 프로세스 체크리스트를 관리합니다. (emp-10, emp-17)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">신청 대기</div>
          <div className="text-2xl font-bold text-yellow-500">{mockRetirements.filter(r => r.status === '신청').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">결재 진행 중</div>
          <div className="text-2xl font-bold text-blue-500">{mockRetirements.filter(r => r.status === '결재중').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">처리 완료</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{mockRetirements.filter(r => r.status === '처리완료').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
      </div>

      <div className="flex gap-5">
        {/* List */}
        <div className="flex-1">
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
                <i className="fas fa-search text-gray-400 text-xs"></i>
                <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
                <option value="">전체 상태</option>
                <option value="신청">신청</option>
                <option value="결재중">결재중</option>
                <option value="처리완료">처리완료</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">퇴직 예정일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사유</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">상세</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ret => (
                  <tr key={ret.id} className={`border-b border-gray-50 cursor-pointer transition-colors ${selected?.id === ret.id ? 'bg-[#f2faf6]' : 'hover:bg-gray-50/50'}`}
                    onClick={() => setSelected(ret)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{ret.empId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{ret.name}</td>
                    <td className="px-4 py-3 text-gray-600">{ret.department}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{ret.resignDate}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{ret.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ret.status === '신청' ? 'bg-yellow-50 text-yellow-600' :
                        ret.status === '결재중' ? 'bg-blue-50 text-blue-600' :
                        'bg-[#eaf6f0] text-[#1D9E75]'
                      }`}>{ret.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Sidebar */}
        {selected && (
          <div className="w-80 shrink-0">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">퇴직 처리 현황</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">성명</span>
                  <span className="text-gray-900 font-medium">{selected.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">부서 / 직급</span>
                  <span className="text-gray-600">{selected.department} / {selected.rank}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">입사일</span>
                  <span className="text-gray-600">{selected.hireDate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">퇴직 예정일</span>
                  <span className="text-gray-600">{selected.resignDate}</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-gray-900 mb-3">퇴직 체크리스트</div>
              <div className="space-y-2">
                {selected.checklist.map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${item.done ? 'bg-[#f2faf6] border-[#c8e8d8]' : 'border-gray-100'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border-2 ${item.done ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                      {item.done && <i className="fas fa-check text-white text-[8px]"></i>}
                    </div>
                    <span className={`text-xs flex-1 ${item.done ? 'text-[#1D9E75]' : 'text-gray-600'}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-400 mt-3">
                완료: {selected.checklist.filter(c => c.done).length} / {selected.checklist.length}
              </div>

              {selected.status === '신청' && (
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-[#1D9E75] text-white py-2 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors">결재 승인</button>
                  <button className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-xs font-medium hover:border-red-300 hover:text-red-500 transition-all">반려</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
