import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface RetirementRequest {
  id: number
  empId: string
  name: string
  department: string
  rank: string
  hireDate: string
  resignDate: string
  reason: string
  status: '대기' | '처리중' | '처리완료'
  checklist: { label: string; done: boolean }[]
}

const mockRetirements: RetirementRequest[] = [
  {
    id: 1, empId: 'PC2024009', name: '장현우', department: '영업팀', rank: '과장',
    hireDate: '2019-03-04', resignDate: '2024-06-30', reason: '개인 사유', status: '대기',
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
    hireDate: '2021-07-12', resignDate: '2024-05-31', reason: '이직', status: '처리중',
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

const allEmployees = [
  { id: 'PC2024001', name: '김민수', department: '개발팀' },
  { id: 'PC2024002', name: '이서연', department: '인사팀' },
  { id: 'PC2024003', name: '박지훈', department: '마케팅팀' },
  { id: 'PC2024004', name: '최유진', department: '영업팀' },
  { id: 'PC2024005', name: '정하은', department: '재무팀' },
  { id: 'PC2024006', name: '한승우', department: '개발팀' },
  { id: 'PC2024007', name: '오나영', department: '경영지원팀' },
  { id: 'PC2024008', name: '윤재혁', department: '개발팀' },
]

export default function RetirementManagement() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('')
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [showRetireSearch, setShowRetireSearch] = useState(false)
  const [retireSearch, setRetireSearch] = useState('')

  const filtered = mockRetirements.filter(r => !filterStatus || r.status === filterStatus)

  return (
    <div className="flex-1 overflow-y-auto p-6" onClick={() => menuOpen && setMenuOpen(null)}>
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">퇴직 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">퇴직 관리</h1>
          <p className="text-xs text-gray-400 mt-1">퇴직 신청 접수 및 처리, 퇴직 프로세스 체크리스트를 관리합니다.</p>
        </div>
        <button
          onClick={() => setShowRetireSearch(true)}
          className="flex items-center gap-1.5 bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
        >
          <i className="fas fa-user-minus text-xs"></i>
          퇴직 처리
        </button>
      </div>

      {/* 퇴직 처리 대상 검색 모달 */}
      {showRetireSearch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">퇴직 처리 대상 선택</h3>
              <button onClick={() => { setShowRetireSearch(false); setRetireSearch('') }} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-3">
              <i className="fas fa-search text-gray-400 text-xs"></i>
              <input
                value={retireSearch}
                onChange={e => setRetireSearch(e.target.value)}
                className="flex-1 text-sm outline-none"
                placeholder="이름 또는 사번 검색"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {allEmployees
                .filter(e => !retireSearch || e.name.includes(retireSearch) || e.id.includes(retireSearch))
                .map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => { setShowRetireSearch(false); setRetireSearch(''); navigate(`/hr/employee/${emp.id}/retire`) }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f2faf6] transition-colors text-left"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                      <div className="text-xs text-gray-400">{emp.department} · {emp.id}</div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">대기</div>
          <div className="text-2xl font-bold text-yellow-500">{mockRetirements.filter(r => r.status === '대기').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">처리중</div>
          <div className="text-2xl font-bold text-blue-500">{mockRetirements.filter(r => r.status === '처리중').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">처리 완료</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{mockRetirements.filter(r => r.status === '처리완료').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 상태</option>
            <option value="대기">대기</option>
            <option value="처리중">처리중</option>
            <option value="처리완료">처리완료</option>
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
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">퇴직 예정일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사유</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ret => (
                <tr key={ret.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{ret.empId}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{ret.name}</td>
                  <td className="px-4 py-3 text-gray-600">{ret.department}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ret.resignDate}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{ret.reason}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ret.status === '대기' ? 'bg-yellow-50 text-yellow-600' :
                        ret.status === '처리중' ? 'bg-blue-50 text-blue-600' :
                        'bg-[#eaf6f0] text-[#1D9E75]'
                      }`}>{ret.status}</span>
                      {ret.status === '처리중' && ret.checklist.some(c => !c.done) && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full font-medium">
                          미완료 {ret.checklist.filter(c => !c.done).length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center relative">
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === ret.id ? null : ret.id) }}
                      className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors px-2 py-1"
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {menuOpen === ret.id && (
                      <div onClick={e => e.stopPropagation()} className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                        <button
                          onClick={() => { navigate(`/hr/retirement/${ret.id}`); setMenuOpen(null) }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors"
                        >
                          <i className="fas fa-eye mr-2 text-[10px]"></i>상세 보기
                        </button>
                        <button
                          onClick={() => { navigate(`/hr/retirement/${ret.id}/edit`); setMenuOpen(null) }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors"
                        >
                          <i className="fas fa-edit mr-2 text-[10px]"></i>수정
                        </button>
                      </div>
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
