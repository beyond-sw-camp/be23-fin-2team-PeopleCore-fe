import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchEmployeeList,
  fetchEmployeeCard,
  fetchDepartmentList,
  deleteEmployee,
  EMP_TYPE_LABEL,
  EMP_STATUS_LABEL,
} from '../../api/employee'
import type {
  EmployeeListDto,
  EmployeeCardDto,
  EmployeeListParams,
  DepartmentDto,
  EmpType,
  EmpStatus,
  EmployeeSortField,
} from '../../api/employee'

export default function EmployeeList() {
  const navigate = useNavigate()

  // 필터 상태
  const [search, setSearch] = useState('')
  const [filterDeptId, setFilterDeptId] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<EmpType | ''>('')
  const [filterStatus, setFilterStatus] = useState<EmpStatus | ''>('')
  const [sortField, setSortField] = useState<EmployeeSortField>('EMP_NUM')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // 데이터 상태
  const [employees, setEmployees] = useState<EmployeeListDto[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [card, setCard] = useState<EmployeeCardDto>({ total: 0, active: 0, onLeave: 0, hiredThisMonth: 0 })
  const [departments, setDepartments] = useState<DepartmentDto[]>([])

  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmployeeListDto | null>(null)

  // 데이터 조회
  const loadList = useCallback(async () => {
    const params: EmployeeListParams = {
      page,
      size: pageSize,
      sortField,
      sortDirection: sortDir.toUpperCase() as 'ASC' | 'DESC',
    }
    if (search) params.keyword = search
    if (filterDeptId !== '') params.deptId = filterDeptId
    if (filterType) params.empType = filterType
    if (filterStatus) params.empStatus = filterStatus

    try {
      const res = await fetchEmployeeList(params)
      setEmployees(res.content)
      setTotalElements(res.totalElements)
      setTotalPages(Math.max(1, res.totalPages))
    } catch (e) {
      console.error('사원 목록 조회 실패', e)
    }
  }, [page, pageSize, sortField, sortDir, search, filterDeptId, filterType, filterStatus])

  useEffect(() => { loadList() }, [loadList])

  useEffect(() => {
    fetchEmployeeCard().then(setCard).catch(() => {})
    fetchDepartmentList().then(setDepartments).catch(() => {})
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteEmployee(deleteTarget.empId)
      setDeleteTarget(null)
      loadList()
      fetchEmployeeCard().then(setCard).catch(() => {})
    } catch (e) {
      alert('삭제에 실패했습니다. 퇴직 상태인 사원만 삭제할 수 있습니다.')
      setDeleteTarget(null)
    }
  }

  const handleSearch = () => {
    setPage(0)
    loadList()
  }

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
          <div className="text-2xl font-bold text-gray-900">{card.total}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">재직</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{card.active}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">휴직</div>
          <div className="text-2xl font-bold text-yellow-500">{card.onLeave}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">이번 달 입사</div>
          <div className="text-2xl font-bold text-blue-500">{card.hiredThisMonth}<span className="text-sm font-normal text-gray-400 ml-1">명</span></div>
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
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
            value={filterDeptId}
            onChange={e => { setFilterDeptId(e.target.value ? Number(e.target.value) : ''); setPage(0) }}
          >
            <option value="">전체 부서</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.deptName}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
            value={filterType}
            onChange={e => { setFilterType(e.target.value as EmpType | ''); setPage(0) }}
          >
            <option value="">전체 고용형태</option>
            <option value="FULL">정규직</option>
            <option value="CONTRACT">계약직</option>
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as EmpStatus | ''); setPage(0) }}
          >
            <option value="">전체 상태</option>
            <option value="ACTIVE">재직</option>
            <option value="ON_LEAVE">휴직</option>
            <option value="RESIGNED">퇴직</option>
          </select>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-400">총 {totalElements}명</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-visible flex flex-col" style={{ minHeight: 520 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th
                onClick={() => {
                  if (sortField === 'EMP_NUM') setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                  else { setSortField('EMP_NUM'); setSortDir('asc') }
                  setPage(0)
                }}
                className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100"
              >
                사번<span className={`ml-1 ${sortField === 'EMP_NUM' ? 'text-[#1D9E75]' : 'text-gray-300'}`}>⇅</span>
              </th>
              <th
                onClick={() => {
                  if (sortField === 'EMP_NAME') setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                  else { setSortField('EMP_NAME'); setSortDir('asc') }
                  setPage(0)
                }}
                className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100"
              >
                성명<span className={`ml-1 ${sortField === 'EMP_NAME' ? 'text-[#1D9E75]' : 'text-gray-300'}`}>⇅</span>
              </th>
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
            {employees.map(emp => (
              <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.empNum}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{emp.empName}</td>
                <td className="px-4 py-3 text-gray-600">{emp.deptName}</td>
                <td className="px-4 py-3 text-gray-600">{emp.gradeName}</td>
                <td className="px-4 py-3 text-gray-600">{emp.titleName || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    emp.empType === 'FULL' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {EMP_TYPE_LABEL[emp.empType]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{emp.empHireDate}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    emp.empStatus === 'ACTIVE' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    emp.empStatus === 'ON_LEAVE' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {EMP_STATUS_LABEL[emp.empStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === emp.empId ? null : emp.empId) }}
                    className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors px-2 py-1"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  {menuOpen === emp.empId && (
                    <div className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                      <button
                        onClick={() => { navigate(`/hr/employee/${emp.empId}`); setMenuOpen(null) }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors"
                      >
                        <i className="fas fa-eye mr-2 text-[10px]"></i>상세 보기
                      </button>
                      <button
                        onClick={() => { navigate(`/hr/employee/${emp.empId}/edit`); setMenuOpen(null) }}
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
            {employees.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">조회된 사원이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex-1" />
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}개</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-left text-[10px]" />
            </button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-left text-[10px]" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter(n => n === 0 || n === totalPages - 1 || Math.abs(n - page) <= 2)
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
                    {(n as number) + 1}
                  </button>
                )
              )
            }
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-right text-[10px]" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-right text-[10px]" />
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {totalElements === 0 ? '0명' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} / ${totalElements}명`}
          </span>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-[min(400px,calc(100vw-24px))]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">사원 삭제</h3>
                <p className="text-xs text-gray-400 mt-0.5">퇴직 상태인 사원만 삭제할 수 있습니다.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              <span className="font-medium">{deleteTarget.empName} ({deleteTarget.empNum})</span> 사원을 목록에서 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
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
