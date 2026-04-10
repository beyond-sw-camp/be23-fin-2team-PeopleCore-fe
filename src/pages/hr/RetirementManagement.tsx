import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface RetirementRequest {
  id: number
  empId: string
  name: string
  department: string
  rank: string
  registeredDate: string
  approvalStatus: '결재대기' | '결재완료'
  retireStatus: '재직' | '퇴직완료'
}

const initialData: RetirementRequest[] = [
  { id: 1, empId: 'PC2024009', name: '장현우', department: '영업팀', rank: '과장', registeredDate: '2024-05-15', approvalStatus: '결재완료', retireStatus: '재직' },
  { id: 2, empId: 'PC2024010', name: '송미래', department: '마케팅팀', rank: '대리', registeredDate: '2024-05-10', approvalStatus: '결재완료', retireStatus: '퇴직완료' },
  { id: 3, empId: 'PC2024011', name: '강태영', department: '개발팀', rank: '사원', registeredDate: '2024-04-15', approvalStatus: '결재대기', retireStatus: '재직' },
]

export default function RetirementManagement() {
  const navigate = useNavigate()
  const [retirements, setRetirements] = useState<RetirementRequest[]>(initialData)
  const [filterApproval, setFilterApproval] = useState('')
  const [filterRetire, setFilterRetire] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<RetirementRequest | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RetirementRequest | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const filtered = retirements
    .filter(r => !filterApproval || r.approvalStatus === filterApproval)
    .filter(r => !filterRetire || r.retireStatus === filterRetire)

  const handleRetire = () => {
    if (!confirmTarget) return
    setRetirements(prev => prev.map(r => r.id === confirmTarget.id ? { ...r, retireStatus: '퇴직완료' as const } : r))
    setConfirmTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setRetirements(prev => prev.filter(r => r.id !== deleteTarget.id))
    setDeleteTarget(null)
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
          <div className="text-xs text-gray-400 mb-1">퇴직처리</div>
          <div className="text-2xl font-bold text-red-500">{retirements.filter(r => r.approvalStatus === '결재완료' && r.retireStatus === '재직').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">퇴직완료</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{retirements.filter(r => r.retireStatus === '퇴직완료').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">결재대기</div>
          <div className="text-2xl font-bold text-yellow-500">{retirements.filter(r => r.approvalStatus === '결재대기').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
          </div>
          <select value={filterApproval} onChange={e => setFilterApproval(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 결재</option>
            <option value="결재완료">결재완료</option>
            <option value="결재대기">결재대기</option>
          </select>
          <select value={filterRetire} onChange={e => setFilterRetire(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 상태</option>
            <option value="재직">재직</option>
            <option value="퇴직완료">퇴직완료</option>
          </select>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-400">총 {filtered.length}건</span>
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
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">결재 상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">퇴직 여부</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ret => (
              <tr key={ret.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{ret.empId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{ret.name}</td>
                <td className="px-4 py-3 text-gray-600">{ret.department}</td>
                <td className="px-4 py-3 text-gray-600">{ret.rank}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ret.retireStatus === '퇴직완료' ? 'bg-red-50 text-red-500' :
                    'bg-[#eaf6f0] text-[#1D9E75]'
                  }`}>{ret.retireStatus === '퇴직완료' ? '퇴직' : '재직'}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{ret.registeredDate}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ret.approvalStatus === '결재완료' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>{ret.approvalStatus}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {ret.retireStatus === '퇴직완료' ? (
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-400 rounded-md inline-block">퇴직완료</span>
                  ) : ret.approvalStatus === '결재완료' ? (
                    <button
                      onClick={() => setConfirmTarget(ret)}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      퇴직처리
                    </button>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === ret.id ? null : ret.id)}
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
                      {ret.retireStatus === '퇴직완료' && (
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
          </tbody>
        </table>
      </div>

      {/* 퇴직처리 확인 모달 */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[400px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <i className="fas fa-user-minus text-red-500"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">퇴직 처리</h3>
                <p className="text-xs text-gray-400 mt-0.5">재직 상태가 퇴직으로 변경됩니다.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              <span className="font-medium">{confirmTarget.name} ({confirmTarget.empId})</span>님을 퇴직 처리하시겠습니까?
              <br />
              <span className="text-xs text-gray-400">퇴직 예정일: {confirmTarget.resignDate}</span>
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
          <div className="bg-white rounded-xl shadow-xl p-6 w-[400px]" onClick={e => e.stopPropagation()}>
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
              <span className="font-medium">{deleteTarget.name} ({deleteTarget.empId})</span>의 퇴직 기록을 삭제하시겠습니까?
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
