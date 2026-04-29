import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../../api/auth'
import type { FaceEmployeeResponse } from '../../api/auth'
import FaceRegisterCapture from '../../components/face/FaceRegisterCapture'
import AlertModal from '../../components/common/AlertModal'

type Tab = 'register' | 'update' | 'delete'

interface ModalState {
  isOpen: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function FaceLoginManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('register')
  const [unregistered, setUnregistered] = useState<FaceEmployeeResponse[]>([])
  const [registered, setRegistered] = useState<FaceEmployeeResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: 'success', title: '', message: '' })
  const [deletingEmpId, setDeletingEmpId] = useState<number | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'register') {
        const { data } = await authApi.getFaceUnregistered()
        setUnregistered(data)
      } else {
        const { data } = await authApi.getFaceRegistered()
        setRegistered(data)
      }
    } catch {
      // API 에러 시 빈 리스트
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSelectedEmpId(null)
    setSearchKeyword('')
    setDeletingEmpId(null)
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const selectedEmp = (activeTab === 'register' ? unregistered : registered).find((e) => e.empId === selectedEmpId)

  const handleRegisterSuccess = useCallback((message: string) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: activeTab === 'register' ? '얼굴 등록 완료' : '얼굴 재등록 완료',
      message: selectedEmp
        ? `${selectedEmp.empName}(${selectedEmp.empNum})님의\n${message}`
        : message,
    })
    setSelectedEmpId(null)
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedEmp])

  const handleRegisterError = useCallback((message: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: '얼굴 등록 실패',
      message,
    })
  }, [])

  const handleDelete = useCallback(async (emp: FaceEmployeeResponse) => {
    setDeletingEmpId(emp.empId)
    try {
      await authApi.faceUnregister(emp.empId)
      setModal({
        isOpen: true,
        type: 'success',
        title: '얼굴 정보 삭제 완료',
        message: `${emp.empName}(${emp.empNum})님의\n얼굴 정보가 삭제되었습니다.`,
      })
      fetchData()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const detail = err.response?.data?.message || '얼굴 정보 삭제에 실패했습니다.'
      setModal({
        isOpen: true,
        type: 'error',
        title: '삭제 실패',
        message: detail,
      })
    } finally {
      setDeletingEmpId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const employees = activeTab === 'register' ? unregistered : registered
  const filtered = employees.filter(
    (e) =>
      e.empName.includes(searchKeyword) ||
      e.empNum.includes(searchKeyword) ||
      e.deptName.includes(searchKeyword)
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-1">
          인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">Face Login 관리</span>
        </div>

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Face Login 관리</h1>
          <p className="text-xs text-gray-400 mt-1">사원의 안면인식 로그인을 등록하고 관리합니다.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-5">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-5 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-[#1D9E75] text-[#1D9E75]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            신규 등록
            {unregistered.length > 0 && (
              <span className="ml-2 bg-[#eaf6f0] text-[#1D9E75] text-xs px-2 py-0.5 rounded-full">
                {unregistered.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('update')}
            className={`px-5 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'update'
                ? 'border-[#1D9E75] text-[#1D9E75]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            재등록
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`px-5 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'delete'
                ? 'border-red-500 text-red-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            삭제
            {registered.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                {registered.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative w-72">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="이름, 사번, 부서로 검색"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1D9E75] transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-5">
          {/* 사원 리스트 */}
          <div className={activeTab === 'delete' ? 'flex-1 card' : 'flex-1 card'}>
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">
                {activeTab === 'register' ? '미등록 사원' : '등록된 사원'}
              </span>
              <span className="text-xs text-gray-400 ml-2">{filtered.length}명</span>
            </div>

            {loading ? (
              <div className="text-center py-10 text-sm text-gray-400">
                <i className="fas fa-spinner fa-spin mr-2" />불러오는 중...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">
                {activeTab === 'register' ? '모든 사원이 얼굴 등록을 완료했습니다.' : '등록된 사원이 없습니다.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((emp) => (
                  <div
                    key={emp.empId}
                    className={`w-full flex items-center gap-4 px-5 py-3 transition-colors ${
                      activeTab !== 'delete' && selectedEmpId === emp.empId
                        ? 'bg-[#f2faf6] border-l-3 border-[#1D9E75]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* 클릭 영역 (등록/수정 탭) */}
                    {activeTab !== 'delete' ? (
                      <button
                        className="flex items-center gap-4 flex-1 text-left"
                        onClick={() => setSelectedEmpId(emp.empId === selectedEmpId ? null : emp.empId)}
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <i className="fas fa-user text-gray-400 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{emp.empName}</span>
                            <span className="text-xs text-gray-400">{emp.empNum}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {emp.deptName} · {emp.gradeName}
                          </div>
                        </div>
                        {activeTab === 'update' && emp.registeredAt && (
                          <div className="text-[11px] text-gray-400 shrink-0">
                            {new Date(emp.registeredAt).toLocaleDateString('ko-KR')} 등록
                          </div>
                        )}
                        <i className={`fas fa-chevron-right text-xs ${
                          selectedEmpId === emp.empId ? 'text-[#1D9E75]' : 'text-gray-300'
                        }`} />
                      </button>
                    ) : (
                      /* 삭제 탭 */
                      <>
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <i className="fas fa-user text-gray-400 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{emp.empName}</span>
                            <span className="text-xs text-gray-400">{emp.empNum}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {emp.deptName} · {emp.gradeName}
                            {emp.registeredAt && (
                              <span className="ml-2">{new Date(emp.registeredAt).toLocaleDateString('ko-KR')} 등록</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`${emp.empName}(${emp.empNum})님의 얼굴 정보를 삭제하시겠습니까?\n삭제 후 안면인식 로그인이 불가능합니다.`)) {
                              handleDelete(emp)
                            }
                          }}
                          disabled={deletingEmpId === emp.empId}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-60 shrink-0"
                        >
                          {deletingEmpId === emp.empId ? (
                            <i className="fas fa-spinner fa-spin text-xs" />
                          ) : (
                            <i className="fas fa-trash-alt text-xs" />
                          )}
                          {deletingEmpId === emp.empId ? '삭제 중...' : '삭제'}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 얼굴 등록 패널 (등록/수정 탭에서만 표시) */}
          {activeTab !== 'delete' && (
            <div className="w-[340px] shrink-0">
              {selectedEmpId ? (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-900">
                      {activeTab === 'register' ? '얼굴 등록' : '얼굴 재등록'}
                    </span>
                  </div>
                  <div className="mb-4">
                    {selectedEmp && (
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-[#eaf6f0] flex items-center justify-center">
                          <i className="fas fa-user text-[#1D9E75] text-xs" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{selectedEmp.empName}</div>
                          <div className="text-xs text-gray-400">{selectedEmp.empNum} · {selectedEmp.deptName}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <FaceRegisterCapture
                    key={selectedEmpId}
                    empId={selectedEmpId}
                    onSuccess={handleRegisterSuccess}
                    onError={handleRegisterError}
                  />
                </div>
              ) : (
                <div className="card p-5 text-center">
                  <div className="py-10">
                    <i className="fas fa-camera text-3xl text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">
                      왼쪽 목록에서 사원을 선택하면<br />얼굴 등록을 진행할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 삭제 탭 안내 패널 */}
          {activeTab === 'delete' && (
            <div className="w-[300px] shrink-0">
              <div className="card p-5">
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <i className="fas fa-exclamation-triangle text-red-400 text-xl" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">얼굴 정보 삭제</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    삭제된 사원은 안면인식 로그인을<br />
                    사용할 수 없게 됩니다.<br /><br />
                    삭제 후 다시 등록하려면<br />
                    '신규 등록' 탭에서 진행해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 성공/실패 모달 */}
      <AlertModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  )
}
