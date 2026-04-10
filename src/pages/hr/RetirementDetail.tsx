import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const mockRetirements = [
  {
    id: 1, empId: 'PC2024009', name: '장현우', department: '영업팀', rank: '과장',
    hireDate: '2019-03-04', resignDate: '2024-06-30', reason: '개인 사유',
    approvalStatus: '결재완료' as const, retireStatus: '재직' as const,
    yearsOfService: '5년 3개월', retireType: '자진퇴사', registeredDate: '2024-05-15',
  },
  {
    id: 2, empId: 'PC2024010', name: '송미래', department: '마케팅팀', rank: '대리',
    hireDate: '2021-07-12', resignDate: '2024-05-31', reason: '이직',
    approvalStatus: '결재완료' as const, retireStatus: '퇴직완료' as const,
    yearsOfService: '2년 10개월', retireType: '자진퇴사', registeredDate: '2024-05-10',
  },
  {
    id: 3, empId: 'PC2024011', name: '강태영', department: '개발팀', rank: '사원',
    hireDate: '2023-01-09', resignDate: '2024-04-30', reason: '계약 만료',
    approvalStatus: '결재대기' as const, retireStatus: '재직' as const,
    yearsOfService: '1년 3개월', retireType: '계약만료', registeredDate: '2024-04-15',
  },
]

export default function RetirementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = mockRetirements.find(r => String(r.id) === id) || mockRetirements[0]
  const [confirmModal, setConfirmModal] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 퇴직 관리 › <span className="text-[#1D9E75] font-medium">퇴직 상세</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.name} 퇴직 상세</h1>
          <p className="text-xs text-gray-400 mt-1">{data.empId} · {data.department} · {data.rank}</p>
        </div>
        <div className="flex gap-2">
          {data.approvalStatus === '결재완료' && (
            <button onClick={() => setConfirmModal(true)}
              className="flex items-center gap-1.5 bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
              <i className="fas fa-user-minus text-xs"></i>
              퇴직처리
            </button>
          )}
          <button onClick={() => navigate('/hr/retirement')}
            className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            목록으로
          </button>
        </div>
      </div>

      {/* 퇴직 신청 정보 */}
      <div className="card p-5 mb-3.5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">퇴직 신청 정보</h3>

        {/* 사원 정보 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">성명</span>
            <span className="text-gray-900 font-medium">{data.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">사번</span>
            <span className="text-gray-600 font-mono text-xs">{data.empId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">부서 / 직급</span>
            <span className="text-gray-600">{data.department} / {data.rank}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">입사일</span>
            <span className="text-gray-600">{data.hireDate}</span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-100 my-4"></div>

        {/* 퇴직 정보 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">신청일</span>
            <span className="text-gray-600">{data.registeredDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">결재 상태</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              data.approvalStatus === '결재완료' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
              'bg-yellow-50 text-yellow-600'
            }`}>{data.approvalStatus}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">재직 상태</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              data.retireStatus === '퇴직완료' ? 'bg-red-50 text-red-500' :
              'bg-[#eaf6f0] text-[#1D9E75]'
            }`}>{data.retireStatus === '퇴직완료' ? '퇴직' : '재직'}</span>
          </div>
        </div>
      </div>

      {/* 결재 양식 */}
      <div className="card p-5 mb-3.5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">퇴직 결재 양식</h3>
        <div className="border border-gray-200 rounded-lg p-6 min-h-[300px] bg-gray-50 flex items-center justify-center">
          <span className="text-sm text-gray-400">결재 양식이 표시됩니다</span>
        </div>
      </div>

      {/* 퇴직처리 확인 모달 */}
      {confirmModal && (
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
              <span className="font-medium">{data.name} ({data.empId})</span>님을 퇴직 처리하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmModal(false)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors">취소</button>
              <button onClick={() => { setConfirmModal(false); navigate('/hr/retirement') }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">퇴직처리</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
