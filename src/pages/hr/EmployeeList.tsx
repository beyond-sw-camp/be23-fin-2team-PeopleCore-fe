import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Employee {
  id: string
  name: string
  department: string
  position: string
  rank: string
  employType: string
  hireDate: string
  email: string
  status: string
}

const mockEmployees: Employee[] = [
  { id: 'PC2024001', name: '김민수', department: '개발팀', position: '팀원', rank: '대리', employType: '정규직', hireDate: '2022-03-02', email: 'minsu.kim@peoplecore.com', status: '재직' },
  { id: 'PC2024002', name: '이서연', department: '인사팀', position: '팀장', rank: '과장', employType: '정규직', hireDate: '2020-07-15', email: 'seoyeon.lee@peoplecore.com', status: '재직' },
  { id: 'PC2024003', name: '박지훈', department: '마케팅팀', position: '팀원', rank: '사원', employType: '계약직', hireDate: '2023-09-01', email: 'jihun.park@peoplecore.com', status: '재직' },
  { id: 'PC2024004', name: '최유진', department: '영업팀', position: '팀원', rank: '주임', employType: '정규직', hireDate: '2021-11-10', email: 'yujin.choi@peoplecore.com', status: '재직' },
  { id: 'PC2024005', name: '정하은', department: '재무팀', position: '파트장', rank: '차장', employType: '정규직', hireDate: '2018-04-20', email: 'haeun.jung@peoplecore.com', status: '재직' },
  { id: 'PC2024006', name: '한승우', department: '개발팀', position: '팀원', rank: '사원', employType: '인턴', hireDate: '2024-01-08', email: 'seungwoo.han@peoplecore.com', status: '재직' },
  { id: 'PC2024007', name: '오나영', department: '경영지원팀', position: '팀원', rank: '대리', employType: '정규직', hireDate: '2021-05-03', email: 'nayoung.oh@peoplecore.com', status: '휴직' },
  { id: 'PC2024008', name: '윤재혁', department: '개발팀', position: '팀장', rank: '부장', employType: '정규직', hireDate: '2015-02-16', email: 'jaehyuk.yoon@peoplecore.com', status: '재직' },
]

export default function EmployeeList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = mockEmployees.filter(emp => {
    if (search && !emp.name.includes(search) && !emp.id.includes(search)) return false
    if (filterDept && emp.department !== filterDept) return false
    if (filterType && emp.employType !== filterType) return false
    if (filterStatus && emp.status !== filterStatus) return false
    return true
  })

  const departments = [...new Set(mockEmployees.map(e => e.department))]
  const types = [...new Set(mockEmployees.map(e => e.employType))]

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">사원 관리</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">사원 관리</h1>
          <p className="text-xs text-gray-400 mt-1">전체 임직원 목록을 조회하고 관리합니다.</p>
        </div>
        <button
          onClick={() => navigate('/hr/employee/register')}
          className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
        >
          <i className="fas fa-plus text-xs"></i>
          신규 사원 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">전체 인원</div>
          <div className="text-2xl font-bold text-gray-900">{mockEmployees.length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">재직</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{mockEmployees.filter(e => e.status === '재직').length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">휴직</div>
          <div className="text-2xl font-bold text-yellow-500">{mockEmployees.filter(e => e.status === '휴직').length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">이번 달 입사</div>
          <div className="text-2xl font-bold text-blue-500">2<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input
              className="bg-transparent border-none outline-none text-sm flex-1"
              placeholder="이름 또는 사번 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="">전체 부서</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">전체 고용형태</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">전체 상태</option>
            <option value="재직">재직</option>
            <option value="휴직">휴직</option>
            <option value="퇴직">퇴직</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">총 {filtered.length}명</span>
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
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직책</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">고용형태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">입사일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                <td className="px-4 py-3 text-gray-600">{emp.rank}</td>
                <td className="px-4 py-3 text-gray-600">{emp.position}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    emp.employType === '정규직' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    emp.employType === '계약직' ? 'bg-blue-50 text-blue-600' :
                    emp.employType === '인턴' ? 'bg-purple-50 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {emp.employType}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{emp.hireDate}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    emp.status === '재직' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    emp.status === '휴직' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
