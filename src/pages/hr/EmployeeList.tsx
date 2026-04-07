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
  { id: 'PC2024006', name: '한승우', department: '개발팀', position: '팀원', rank: '사원', employType: '계약직', hireDate: '2024-01-08', email: 'seungwoo.han@peoplecore.com', status: '재직' },
  { id: 'PC2024007', name: '오나영', department: '경영지원팀', position: '팀원', rank: '대리', employType: '정규직', hireDate: '2021-05-03', email: 'nayoung.oh@peoplecore.com', status: '휴직' },
  { id: 'PC2024008', name: '윤재혁', department: '개발팀', position: '팀장', rank: '부장', employType: '정규직', hireDate: '2015-02-16', email: 'jaehyuk.yoon@peoplecore.com', status: '재직' },
]

export default function EmployeeList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState<'id' | 'name' | 'hireDate'>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = mockEmployees.filter(emp => {
    if (search && !emp.name.includes(search) && !emp.id.includes(search)) return false
    if (filterDept && emp.department !== filterDept) return false
    if (filterType && emp.employType !== filterType) return false
    if (filterStatus && emp.status !== filterStatus) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = a[sortKey].localeCompare(b[sortKey])
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const departments = [...new Set(mockEmployees.map(e => e.department))]
  const types = [...new Set(mockEmployees.map(e => e.employType))]

  return (
    <div className="flex-1 overflow-y-auto p-6" onClick={() => menuOpen && setMenuOpen(null)}>
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
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-400">총 {filtered.length}명</span>
            <select
              className="text-xs text-gray-400 outline-none bg-transparent cursor-pointer hover:text-gray-600 transition-colors"
              value={`${sortKey}-${sortDir}`}
              onChange={e => {
                const [key, dir] = e.target.value.split('-')
                setSortKey(key as 'id' | 'name' | 'hireDate')
                setSortDir(dir as 'asc' | 'desc')
                setPage(1)
              }}
            >
              <option value="id-asc">사번 오름차순</option>
              <option value="id-desc">사번 내림차순</option>
              <option value="name-asc">성명 가나다순</option>
              <option value="name-desc">성명 역순</option>
              <option value="hireDate-asc">입사일 오래된순</option>
              <option value="hireDate-desc">입사일 최신순</option>
            </select>
          </div>
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
            {paginated.map(emp => (
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
                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}
                    className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors px-2 py-1"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  {menuOpen === emp.id && (
                    <div className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                      <button
                        onClick={() => { navigate(`/hr/employee/${emp.id}`); setMenuOpen(null) }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors"
                      >
                        <i className="fas fa-eye mr-2 text-[10px]"></i>상세 보기
                      </button>
                      <button
                        onClick={() => { navigate(`/hr/employee/${emp.id}/edit`); setMenuOpen(null) }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors"
                      >
                        <i className="fas fa-edit mr-2 text-[10px]"></i>정보 수정
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => { setDeleteTarget(emp); setMenuOpen(null) }}
                        className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <i className="fas fa-trash-alt mr-2 text-[10px]"></i>사원 삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}개</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-left text-[10px]" />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-left text-[10px]" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '...' ? (
                  <span key={`e-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n as number)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      page === n ? 'bg-[#1D9E75] text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    {n}
                  </button>
                )
              )
            }
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-right text-[10px]" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-right text-[10px]" />
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {sorted.length === 0 ? '0명' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)} / ${sorted.length}명`}
          </span>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-[400px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">사원 삭제</h3>
                <p className="text-xs text-gray-400 mt-0.5">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              <span className="font-medium">{deleteTarget.name} ({deleteTarget.id})</span> 사원을 목록에서 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => { /* TODO: 삭제 API 호출 */ setDeleteTarget(null) }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
