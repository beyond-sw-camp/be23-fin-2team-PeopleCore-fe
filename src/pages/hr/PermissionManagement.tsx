import { useEffect, useState, useCallback } from 'react'
import {
  fetchAdminList,
  grantSuperAdmin,
  revokeSuperAdmin,
  fetchPermissionHistory,
  type AdminUserResDto,
  type PermissionHistoryResDto,
} from '../../api/permission'

export default function PermissionManagement() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [users, setUsers] = useState<AdminUserResDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 10
  const [history, setHistory] = useState<PermissionHistoryResDto[] | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchAdminList({
        keyword: searchKeyword || undefined,
        sortField: 'empName',
        page: 0,
        size: 100,
      })
      setUsers(page.content)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '목록을 불러오지 못했습니다'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [searchKeyword])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = () => { setSearchKeyword(keywordInput.trim()); setPage(0) }
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
  const paginated = users.slice(page * pageSize, (page + 1) * pageSize)

  const handleGrantSuperAdmin = async (user: AdminUserResDto) => {
    if (!confirm(`'${user.empName}'에게 SUPER_ADMIN 권한을 부여하시겠습니까?`)) return
    try {
      await grantSuperAdmin(user.empId)
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '권한 부여에 실패했습니다.')
    }
  }

  const handleRevokeSuperAdmin = async (user: AdminUserResDto) => {
    if (!confirm(`'${user.empName}'의 SUPER_ADMIN 권한을 회수하시겠습니까?`)) return
    try {
      await revokeSuperAdmin(user.empId)
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '권한 회수에 실패했습니다.')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">권한 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">권한 관리</h1>
          <p className="text-xs text-gray-400 mt-1">ADMIN 사용자에게 SUPER_ADMIN 권한을 부여합니다.</p>
        </div>
        <button
          onClick={async () => {
            try {
              setHistory(await fetchPermissionHistory())
            } catch {
              alert('이력을 불러오지 못했습니다.')
            }
          }}
          className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
        >
          <i className="fas fa-history text-xs"></i>
          변경 이력
        </button>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              className="bg-transparent border-none outline-none text-sm flex-1"
              placeholder="이름 또는 사번 검색"
            />
          </div>
          <button
            onClick={handleSearch}
            className="text-xs px-3 py-2 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors"
          >
            검색
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            ADMIN {users.length}명
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="card overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">이메일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">현재 권한</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부여일</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">처리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-xs text-gray-400">불러오는 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-xs text-gray-400">표시할 관리자가 없습니다.</td></tr>
            ) : paginated.map(user => (
              <tr key={user.empId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{user.empNum}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{user.empName}</td>
                <td className="px-4 py-3 text-gray-600">{user.deptName ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">{user.gradeName ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{user.empEmail}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.empRole === 'HR_SUPER_ADMIN' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {user.empRole === 'HR_SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {user.grantedAt ? user.grantedAt.split('T')[0] : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {user.empRole === 'HR_ADMIN' ? (
                    <button
                      onClick={() => handleGrantSuperAdmin(user)}
                      className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors"
                    >
                      권한 부여
                    </button>
                  ) : user.empRole === 'HR_SUPER_ADMIN' ? (
                    <button
                      onClick={() => handleRevokeSuperAdmin(user)}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      권한 회수
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex-1" />
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-auto">
          <span className="text-xs text-gray-400">총 {users.length}명</span>
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
            {users.length === 0 ? '0명' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, users.length)} / ${users.length}명`}
          </span>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
        ADMIN/SUPER_ADMIN 권한을 가진 사용자만 표시됩니다. 권한 변경 후 대상 사용자가 재로그인하면 새 권한이 적용됩니다.
      </div>

      {/* 이력 모달 */}
      {history && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setHistory(null)}>
          <div className="bg-white rounded-2xl w-[720px] mx-4 max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">권한 변경 이력</h3>
                <p className="text-xs text-gray-400 mt-1">총 {history.length}건</p>
              </div>
              <button onClick={() => setHistory(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">일시</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">대상 사원</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">구분</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">변경 내용</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">수행자</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-xs text-gray-400">이력이 없습니다.</td></tr>
                  ) : history.map(h => (
                    <tr key={h.permissionId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs">{h.processedAt?.split('T')[0] ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{h.empName}</span>
                        <span className="text-xs text-gray-400 ml-1.5 font-mono">{h.empNum}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          h.status === 'GRANTED' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-red-50 text-red-500'
                        }`}>
                          {h.status === 'GRANTED' ? '부여' : '회수'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {h.status === 'GRANTED' ? 'ADMIN → SUPER_ADMIN' : 'SUPER_ADMIN → ADMIN'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{h.actorName ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end px-7 py-4 border-t border-gray-100">
              <button onClick={() => setHistory(null)}
                className="text-sm px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
