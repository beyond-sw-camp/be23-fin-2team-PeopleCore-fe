import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resignApi, type ResignDetail } from '../../api/resign'
import ApprovalDocumentInlineView from '../../components/approval/ApprovalDocumentInlineView'

export default function RetirementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ResignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState(false)

  useEffect(() => {
    if (!id) return
    resignApi.getDetail(Number(id))
      .then(res => setData(res.data))
      .catch(e => {
        console.error('퇴직 상세 조회 실패', e)
        alert('퇴직 정보를 불러올 수 없습니다.')
        navigate('/hr/retirement')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleProcess = async () => {
    if (!data) return
    try {
      await resignApi.process(data.resignId)
      setConfirmModal(false)
      navigate('/hr/retirement')
    } catch (e) {
      console.error('퇴직 처리 실패', e)
      alert('퇴직 처리에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-gray-400">불러오는 중...</span>
      </div>
    )
  }

  if (!data) return null

  const statusLabel = data.empStatus === 'RESIGNED' ? '퇴직' : data.empStatus === 'CONFIRMED' ? '퇴직예정' : '처리대기'
  const statusColor = data.empStatus === 'RESIGNED' ? 'bg-red-50 text-red-500' : data.empStatus === 'CONFIRMED' ? 'bg-blue-50 text-blue-500' : 'bg-[#eaf6f0] text-[#1D9E75]'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 퇴직 관리 › <span className="text-[#1D9E75] font-medium">퇴직 상세</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.empName} 퇴직 상세</h1>
          <p className="text-xs text-gray-400 mt-1">{data.empNum} · {data.deptName} · {data.gradeName}</p>
        </div>
        <div className="flex gap-2">
          {data.empStatus === 'ACTIVE' && (
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

        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">성명</span>
            <span className="text-gray-900 font-medium">{data.empName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">사번</span>
            <span className="text-gray-600 font-mono text-xs">{data.empNum}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">부서 / 직급</span>
            <span className="text-gray-600">{data.deptName} / {data.gradeName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">입사일</span>
            <span className="text-gray-600">{data.hireDate}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 my-4"></div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">신청일</span>
            <span className="text-gray-600">{data.registeredDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">퇴직예정일</span>
            <span className="text-gray-600">{data.resignDate || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">퇴직 상태</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* 결재 양식 */}
      <div className="card p-5 mb-3.5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">퇴직 결재 양식</h3>
        {data.docId ? (
          <ApprovalDocumentInlineView docId={data.docId} />
        ) : (
          <div className="border border-gray-200 rounded-lg p-6 min-h-[200px] bg-gray-50 flex items-center justify-center">
            <span className="text-sm text-gray-400">연결된 결재 문서가 없습니다.</span>
          </div>
        )}
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
                <p className="text-xs text-gray-400 mt-0.5">퇴직예정일에 자동으로 퇴직 처리됩니다.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              <span className="font-medium">{data.empName} ({data.empNum})</span>님을 퇴직 처리하시겠습니까?
              {data.resignDate && (
                <><br /><span className="text-xs text-gray-400">퇴직예정일: {data.resignDate}</span></>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmModal(false)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors">취소</button>
              <button onClick={handleProcess}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">퇴직처리</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
