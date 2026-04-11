import { useState } from 'react'

interface AdminUser {
  id: number
  empId: string
  name: string
  department: string
  rank: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  grantedAt: string | null
}

const mockAdminUsers: AdminUser[] = [
  { id: 1, empId: 'PC2024003', name: '박지훈', department: '마케팅팀', rank: '과장', role: 'ADMIN', grantedAt: null },
  { id: 2, empId: 'PC2024004', name: '최유진', department: '영업팀', rank: '차장', role: 'SUPER_ADMIN', grantedAt: '2026-03-15' },
  { id: 3, empId: 'PC2024001', name: '김민수', department: '개발팀', rank: '대리', role: 'ADMIN', grantedAt: null },
  { id: 4, empId: 'PC2024002', name: '이서연', department: '인사팀', rank: '과장', role: 'ADMIN', grantedAt: null },
]

export default function PermissionManagement() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [users, setUsers] = useState<AdminUser[]>(mockAdminUsers)

  const filtered = users.filter(u =>
    !searchKeyword || u.name.includes(searchKeyword) || u.empId.includes(searchKeyword)
  )

  const today = () => new Date().toISOString().slice(0, 10)

  const handleGrantSuperAdmin = (user: AdminUser) => {
    if (confirm(`'${user.name}'에게 SUPER_ADMIN 권한을 부여하시겠습니까?`)) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: 'SUPER_ADMIN' as const, grantedAt: today() } : u))
    }
  }

  const handleRevokeSuperAdmin = (user: AdminUser) => {
    if (confirm(`'${user.name}'의 SUPER_ADMIN 권한을 회수하시겠습니까?`)) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: 'ADMIN' as const, grantedAt: null } : u))
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
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1"
              placeholder="이름 또는 사번 검색"
            />
          </div>
          <span className="text-xs text-gray-400 ml-auto">
            ADMIN {filtered.length}명
          </span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">현재 권한</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">적용일자</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">처리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{user.empId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.department}</td>
                <td className="px-4 py-3 text-gray-600">{user.rank}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === 'SUPER_ADMIN' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {user.grantedAt || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {user.role === 'ADMIN' ? (
                    <button
                      onClick={() => handleGrantSuperAdmin(user)}
                      className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors"
                    >
                      권한 부여
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRevokeSuperAdmin(user)}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      권한 회수
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
        ADMIN 권한을 가진 사용자만 표시됩니다. 권한 부여 후 대상 사용자가 재로그인하면 새 권한이 적용됩니다.
      </div>
    </div>
  )
}
