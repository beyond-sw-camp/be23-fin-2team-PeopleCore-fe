import { useState } from 'react'

interface Contract {
  id: number
  empId: string
  name: string
  department: string
  rank: string
  year: string
  salary: string
  signStatus: '미발송' | '서명대기' | '서명완료'
  sentDate: string | null
  signedDate: string | null
}

const mockContracts: Contract[] = [
  { id: 1, empId: 'PC2024001', name: '김민수', department: '개발팀', rank: '대리', year: '2024', salary: '48,000,000', signStatus: '서명완료', sentDate: '2024-01-05', signedDate: '2024-01-08' },
  { id: 2, empId: 'PC2024002', name: '이서연', department: '인사팀', rank: '과장', year: '2024', salary: '58,000,000', signStatus: '서명완료', sentDate: '2024-01-05', signedDate: '2024-01-06' },
  { id: 3, empId: 'PC2024003', name: '박지훈', department: '마케팅팀', rank: '사원', year: '2024', salary: '36,000,000', signStatus: '서명대기', sentDate: '2024-01-10', signedDate: null },
  { id: 4, empId: 'PC2024004', name: '최유진', department: '영업팀', rank: '주임', year: '2024', salary: '42,000,000', signStatus: '서명대기', sentDate: '2024-01-10', signedDate: null },
  { id: 5, empId: 'PC2024005', name: '정하은', department: '재무팀', rank: '차장', year: '2024', salary: '72,000,000', signStatus: '서명완료', sentDate: '2024-01-03', signedDate: '2024-01-04' },
  { id: 6, empId: 'PC2024006', name: '한승우', department: '개발팀', rank: '사원', year: '2024', salary: '30,000,000', signStatus: '미발송', sentDate: null, signedDate: null },
  { id: 7, empId: 'PC2024008', name: '윤재혁', department: '개발팀', rank: '부장', year: '2024', salary: '90,000,000', signStatus: '서명완료', sentDate: '2024-01-03', signedDate: '2024-01-03' },
]

export default function SalaryContract() {
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = mockContracts.filter(c => !filterStatus || c.signStatus === filterStatus)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">연봉 계약 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">연봉 계약 관리</h1>
          <p className="text-xs text-gray-400 mt-1">사원별 연봉 계약서를 생성·발송하고 전자서명 현황을 관리합니다. (emp-18)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            <i className="fas fa-paper-plane text-xs"></i>
            일괄 발송
          </button>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-plus text-xs"></i>
            계약서 생성
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">전체</div>
          <div className="text-2xl font-bold text-gray-900">{mockContracts.length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">미발송</div>
          <div className="text-2xl font-bold text-gray-400">{mockContracts.filter(c => c.signStatus === '미발송').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">서명 대기</div>
          <div className="text-2xl font-bold text-yellow-500">{mockContracts.filter(c => c.signStatus === '서명대기').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">서명 완료</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{mockContracts.filter(c => c.signStatus === '서명완료').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">연봉 계약서 생성</span>
          </div>
          <div className="grid grid-cols-3 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">대상 사원 <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="이름 또는 사번 검색" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">계약 연도 <span className="text-red-400">*</span></label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                <option>2024</option>
                <option>2025</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">연봉 (원) <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="예) 48,000,000" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <button onClick={() => setShowCreate(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
            <button className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">생성 및 발송</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 상태</option>
            <option value="미발송">미발송</option>
            <option value="서명대기">서명대기</option>
            <option value="서명완료">서명완료</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">계약연도</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">연봉</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발송일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">서명일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.empId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.department}</td>
                <td className="px-4 py-3 text-gray-600">{c.rank}</td>
                <td className="px-4 py-3 text-gray-600">{c.year}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">{c.salary}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.sentDate || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.signedDate || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.signStatus === '미발송' ? 'bg-gray-100 text-gray-500' :
                    c.signStatus === '서명대기' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-[#eaf6f0] text-[#1D9E75]'
                  }`}>{c.signStatus}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {c.signStatus === '미발송' && (
                    <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">발송</button>
                  )}
                  {c.signStatus === '서명대기' && (
                    <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">재발송</button>
                  )}
                  {c.signStatus === '서명완료' && (
                    <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                      <i className="fas fa-download mr-1"></i>다운로드
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
