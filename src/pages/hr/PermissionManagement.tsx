import { useState } from 'react'

interface PermissionRequest {
  id: number
  empId: string
  name: string
  department: string
  rank: string
  requestType: string
  detail: string
  requestDate: string
  approvalStatus: '승인' | '반려'
  applyStatus: '미적용' | '적용완료'
}

const mockRequests: PermissionRequest[] = [
  { id: 1, empId: 'PC2024003', name: '박지훈', department: '마케팅팀', rank: '사원', requestType: '정보 열람 범위', detail: '부서 전체 인사정보 열람 요청', requestDate: '2024-05-10', approvalStatus: '승인', applyStatus: '미적용' },
  { id: 2, empId: 'PC2024004', name: '최유진', department: '영업팀', rank: '주임', requestType: '정보 열람 범위', detail: '팀 내 열람 권한 요청', requestDate: '2024-05-08', approvalStatus: '승인', applyStatus: '미적용' },
  { id: 3, empId: 'PC2024001', name: '김민수', department: '개발팀', rank: '대리', requestType: '정보 열람 범위', detail: '부서 전체 열람 요청', requestDate: '2024-05-07', approvalStatus: '승인', applyStatus: '적용완료' },
  { id: 4, empId: 'PC2024002', name: '이서연', department: '인사팀', rank: '과장', requestType: '정보 열람 범위', detail: '전사 인사정보 열람 요청', requestDate: '2024-05-03', approvalStatus: '반려', applyStatus: '미적용' },
]

export default function PermissionManagement() {
  const [filterApply, setFilterApply] = useState('')

  const filtered = mockRequests.filter(r => !filterApply || r.applyStatus === filterApply)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">권한 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">권한 관리</h1>
          <p className="text-xs text-gray-400 mt-1">직급·직책별 정보 열람 범위를 설정하고, 사원의 권한 변경 신청을 처리합니다.</p>
        </div>
      </div>

      <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
                <i className="fas fa-search text-gray-400 text-xs"></i>
                <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
              </div>
              <select value={filterApply} onChange={e => setFilterApply(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
                <option value="">전체 상태</option>
                <option value="미적용">미적용</option>
                <option value="적용완료">적용완료</option>
              </select>
              <span className="text-xs text-gray-400 ml-auto">
                미적용 {mockRequests.filter(r => r.applyStatus === '미적용').length}건
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
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청 내용</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">결재</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">적용</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">처리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{req.empId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{req.name}</td>
                    <td className="px-4 py-3 text-gray-600">{req.department}</td>
                    <td className="px-4 py-3 text-gray-600">{req.rank}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{req.detail}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{req.requestDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.approvalStatus === '승인' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-red-50 text-red-500'
                      }`}>{req.approvalStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.applyStatus === '미적용' ? 'bg-yellow-50 text-yellow-600' :
                        req.applyStatus === '적용완료' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-gray-100 text-gray-500'
                      }`}>{req.applyStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {req.approvalStatus === '승인' && req.applyStatus === '미적용' ? (
                        <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">권한 적용</button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
            전자결재에서 승인된 권한 변경 건이 이 목록에 표시됩니다. "권한 적용" 시 해당 사원에게 예외 권한이 반영됩니다.
          </div>
    </div>
  )
}
