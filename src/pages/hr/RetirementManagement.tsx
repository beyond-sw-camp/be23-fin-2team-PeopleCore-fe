import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { resignApi, type ResignListItem, type ResignStatus } from '../../api/resign'

export default function RetirementManagement() {
  const navigate = useNavigate()

  // 목록 & 페이징
  const [retirements, setRetirements] = useState<ResignListItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // 필터
  const [keyword, setKeyword] = useState('')
  const [filterRetire, setFilterRetire] = useState('')

  // 통계
  const [status, setStatus] = useState<ResignStatus>({ processableCount: 0, confirmedCount: 0, completedCount: 0 })

  // 모달
  const [confirmTarget, setConfirmTarget] = useState<ResignListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResignListItem | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const loadList = useCallback(async () => {
    try {
      const { data } = await resignApi.getList({
        keyword: keyword || undefined,
        empStatus: filterRetire || undefined,
        page,
        size: pageSize,
      })
      setRetirements(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(Math.max(1, data.totalPages))
    } catch (e) {
      console.error('퇴직 목록 조회 실패', e)
    }
  }, [keyword, filterRetire, page])

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await resignApi.getStatus()
      setStatus(data)
    } catch (e) {
      console.error('퇴직 통계 조회 실패', e)
    }
  }, [])

  useEffect(() => { loadList() }, [loadList])
  useEffect(() => { loadStatus() }, [loadStatus])

  // 필터 변경 시 첫 페이지로
  useEffect(() => { setPage(0) }, [keyword, filterRetire])

  const handleRetire = async () => {
    if (!confirmTarget) return
    try {
      await resignApi.process(confirmTarget.id)
      setConfirmTarget(null)
      loadList()
      loadStatus()
    } catch (e) {
      console.error('퇴직 처리 실패', e)
      alert('퇴직 처리에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await resignApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      loadList()
      loadStatus()
    } catch (e) {
      console.error('퇴직 삭제 실패', e)
      alert('삭제에 실패했습니다.')
    }
  }

  const statusLabel = (s: string) => {
    if (s === 'RESIGNED') return '퇴직'
    if (s === 'CONFIRMED') return '퇴직예정'
    return '재직'
  }
  const statusColor = (s: string) => {
    if (s === 'RESIGNED') return 'bg-red-50 text-red-500'
    if (s === 'CONFIRMED') return 'bg-blue-50 text-blue-500'
    return 'bg-[#eaf6f0] text-[#1D9E75]'
  }

  return (
    <div className="flex-1 overflow-y-auto p-6" onClick={() => menuOpen && setMenuOpen(null)}>
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">퇴직 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">퇴직 관리</h1>
          <p className="text-xs text-gray-400 mt-1">결재 승인된 퇴직 신청을 확인하고 퇴직 처리합니다.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">퇴직처리 대기</div>
          <div className="text-2xl font-bold text-red-500">
            {status.processableCount}<span className="text-sm font-normal text-gray-400 ml-1">건</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">퇴직예정</div>
          <div className="text-2xl font-bold text-blue-500">
            {status.confirmedCount}<span className="text-sm font-normal text-gray-400 ml-1">건</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">퇴직완료</div>
          <div className="text-2xl font-bold text-[#1D9E75]">
            {status.completedCount}<span className="text-sm font-normal text-gray-400 ml-1">건</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input
              className="bg-transparent border-none outline-none text-sm flex-1"
              placeholder="이름 또는 사번 검색"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>
          <select value={filterRetire} onChange={e => setFilterRetire(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 상태</option>
            <option value="ACTIVE">재직</option>
            <option value="CONFIRMED">퇴직예정</option>
            <option value="RESIGNED">퇴직완료</option>
          </select>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-400">총 {totalElements}건</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">퇴직예정일</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">퇴직 처리</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {retirements.map(ret => (
              <tr key={ret.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{ret.empNum}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{ret.empName}</td>
                <td className="px-4 py-3 text-gray-600">{ret.deptName}</td>
                <td className="px-4 py-3 text-gray-600">{ret.gradeName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(ret.empStatus)}`}>
                    {statusLabel(ret.empStatus)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{ret.registeredDate}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{ret.resignDate || '-'}</td>
                <td className="px-4 py-3 text-center">
                  {ret.empStatus === 'RESIGNED' ? (
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-400 rounded-md inline-block">퇴직완료</span>
                  ) : ret.empStatus === 'CONFIRMED' ? (
                    <span className="text-xs px-3 py-1 bg-blue-50 text-blue-500 rounded-md inline-block">퇴직예정</span>
                  ) : (
                    <button
                      onClick={() => setConfirmTarget(ret)}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      퇴직처리
                    </button>
                  )}
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
                        <i className="fas fa-eye mr-2 text-[10px]"></i>상세
                      </button>
                      {ret.empStatus === 'RESIGNED' && (
                        <button
                          onClick={() => { setDeleteTarget(ret); setMenuOpen(null) }}
                          className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <i className="fas fa-trash-alt mr-2 text-[10px]"></i>삭제
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {retirements.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  퇴직 신청 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex-1" />
        {/* 페이징 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-auto">
          <span className="text-xs text-gray-400">총 {totalElements}건</span>
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
            {totalElements === 0 ? '0건' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} / ${totalElements}건`}
          </span>
        </div>
      </div>

      {/* 퇴직처리 확인 모달 */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[min(400px,calc(100vw-24px))]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <i className="fas fa-user-minus text-red-500"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">퇴직 처리</h3>
                <p className="text-xs text-gray-400 mt-0.5">퇴직예정일에 자동으로 퇴직 처리됩니다.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              <span className="font-medium">{confirmTarget.empName} ({confirmTarget.empNum})</span>님을 퇴직 처리하시겠습니까?
              {confirmTarget.resignDate && (
                <><br /><span className="text-xs text-gray-400">퇴직예정일: {confirmTarget.resignDate}</span></>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmTarget(null)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors">취소</button>
              <button onClick={handleRetire}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">퇴직처리</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[min(400px,calc(100vw-24px))]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <i className="fas fa-trash-alt text-red-500"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">퇴직 기록 삭제</h3>
                <p className="text-xs text-gray-400 mt-0.5">목록에서 삭제됩니다.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              <span className="font-medium">{deleteTarget.empName} ({deleteTarget.empNum})</span>의 퇴직 기록을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors">취소</button>
              <button onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
