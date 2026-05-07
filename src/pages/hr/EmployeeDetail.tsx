import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchEmployeeDetail,
  deleteEmployee,
  downloadEmployeeFile,
  EMP_TYPE_LABEL,
  EMP_STATUS_LABEL,
  EMP_GENDER_LABEL,
  EMP_ROLE_LABEL,
} from '../../api/employee'
import type { EmpDetailResponseDto, EmployeeFileResDto, EmpType, EmpStatus, EmpGender, EmpRole } from '../../api/employee'
import { empSalaryApi, type EmpSalaryDetailRes } from '../../api/payAdmin'
import { resolveProfileImageUrl } from '../../utils/profileImage'

const RETIREMENT_TYPE_LABEL: Record<string, string> = {
  severance: '퇴직금',
  DB: 'DB형 (확정급여)',
  DC: 'DC형 (확정기여)',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
  )
}

export default function EmployeeDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const empId = Number(id)

  const [emp, setEmp] = useState<EmpDetailResponseDto | null>(null)
  const [salary, setSalary] = useState<EmpSalaryDetailRes | null>(null)   // 급여 정보 (권한 없으면 null)
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)

  useEffect(() => {
    if (!empId) return
    Promise.all([
      fetchEmployeeDetail(empId),
      empSalaryApi.getDetail(empId).catch(() => null),   // 권한 부족/오류 시 급여 정보만 미표시
    ]).then(([detail, salaryRes]) => {
      setEmp(detail)
      setSalary(salaryRes)
    })
      .catch(() => alert('사원 정보를 불러올 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [empId])

  const handleDelete = async () => {
    try {
      await deleteEmployee(empId)
      setDeleteModal(false)
      navigate('/hr/list')
    } catch {
      alert('삭제에 실패했습니다. 퇴직 상태인 사원만 삭제할 수 있습니다.')
      setDeleteModal(false)
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
  if (!emp) return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">사원 정보를 찾을 수 없습니다.</div>

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">사원 상세</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">사원 상세 정보</h1>
          <p className="text-xs text-gray-400 mt-1">{emp.empName} ({emp.empNum})님의 인사 정보입니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/hr/employee/${empId}/edit`)}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
          >
            <i className="fas fa-edit text-xs"></i>
            정보 수정
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-1.5 border border-red-300 bg-white text-red-500 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <i className="fas fa-trash-alt text-xs"></i>
            사원 삭제
          </button>
          <button
            onClick={() => navigate('/hr/list')}
            className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
          >
            목록으로
          </button>
        </div>
      </div>

      {/* 기본 인적사항 — 옵셔널 필드는 값이 있을 때만 표시 (등록 시점의 폼 설정이 자연스럽게 박제) */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">기본 인적사항</span>
        </div>

        {/* 프로필 사진 */}
        <div className="flex items-center gap-5 mb-4">
          <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {emp.empProfileImageUrl ? (
              <img src={resolveProfileImageUrl(emp.empProfileImageUrl)} alt={`${emp.empName} 프로필`} className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-user text-3xl text-gray-300"></i>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">프로필 사진</span>
            <span className="text-[11px] text-gray-400">{emp.empProfileImageUrl ? '등록됨' : '미등록'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="성명" value={emp.empName} />
          {emp.empNameEn && <InfoRow label="영문명" value={emp.empNameEn} />}
          <InfoRow label="생년월일" value={emp.empBirthDate} />
          <InfoRow label="성별" value={EMP_GENDER_LABEL[emp.empGender as EmpGender] || emp.empGender} />
          <InfoRow label="연락처" value={emp.empPhone} />
          {emp.empPersonalEmail && <InfoRow label="개인 이메일" value={emp.empPersonalEmail} />}
          {(emp.empAddressBase || emp.empAddressDetail) && (
            <div className="col-span-2">
              <InfoRow label="주소" value={[emp.empAddressBase, emp.empAddressDetail].filter(Boolean).join(' ')} />
            </div>
          )}
        </div>
      </div>

      {/* 소속 및 고용 정보 */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">소속 및 고용 정보</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="입사일" value={emp.empHireDate} />
          <InfoRow label="고용 형태" value={EMP_TYPE_LABEL[emp.empType as EmpType] || emp.empType} />
          <InfoRow label="부서" value={emp.deptName} />
          <InfoRow label="직급" value={emp.gradeName} />
          <InfoRow label="직책" value={emp.titleName} />
          <InfoRow label="상태" value={EMP_STATUS_LABEL[emp.empStatus as EmpStatus] || emp.empStatus} />
        </div>
      </div>

      {/* 시스템 계정 정보 */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">시스템 계정 정보</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="사번" value={emp.empNum} />
          <InfoRow label="사내 이메일" value={emp.empEmail} />
        </div>
      </div>

      {/* 권한 정보 */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">권한 정보</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="권한" value={EMP_ROLE_LABEL[emp.empRole as EmpRole] || emp.empRole} />
        </div>
      </div>

      {/* 인사 서류 — 첨부된 파일이 있을 때만 표시 (등록/수정에서 업로드한 PDF·HWP·DOCX) */}
      {emp.files && emp.files.length > 0 && (
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">인사 서류</span>
            <span className="text-[10px] text-gray-400">{emp.files.length}건</span>
          </div>
          <div className="space-y-1.5">
            {emp.files.map((f: EmployeeFileResDto) => (
              <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 bg-[#f2faf6] rounded-lg border border-[#d0ede2]">
                <i className="fas fa-file-alt text-[#1D9E75] text-xs"></i>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await downloadEmployeeFile(empId, f.id, f.originalFileName)
                    } catch {
                      alert('파일을 다운로드할 수 없습니다.')
                    }
                  }}
                  className="flex-1 text-left text-xs text-[#1D9E75] hover:underline"
                  title="클릭하여 다운로드"
                >
                  {f.originalFileName}
                </button>
                <span className="text-[11px] text-gray-400">{(f.fileSize / 1024).toFixed(0)}KB</span>
                <i className="fas fa-download text-[#1D9E75] text-[10px]"></i>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 급여 정보 (관리자 권한이 있을 때만 — empSalaryApi 호출 성공 시) */}
      {salary && (() => {
        const showRetirement = salary.companyPensionType === 'DC' || salary.companyPensionType === 'DB_DC'
        const salaryAccountDisplay = salary.bankName
          ? `${salary.bankName} ${salary.accountNumber || ''} (${salary.accountHolder || ''})`
          : ''
        const retirementTypeDisplay = salary.empRetirementType
          ? (RETIREMENT_TYPE_LABEL[salary.empRetirementType] || salary.empRetirementType)
          : ''
        return (
          <div className="card p-5 mb-3.5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">급여 정보</span>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="col-span-2">
                <InfoRow label="급여 계좌" value={salaryAccountDisplay} />
              </div>
              {showRetirement && (
                <>
                  <InfoRow label="퇴직연금 유형" value={retirementTypeDisplay} />
                  <InfoRow label="퇴직연금 운용사" value={salary.companyPensionProvider || ''} />
                  {salary.empRetirementType === 'DC' && (
                    <div className="col-span-2">
                      <InfoRow label="퇴직급여 계좌" value={salary.retirementAccountNumber || ''} />
                    </div>
                  )}
                </>
              )}
              <InfoRow label="부양가족수" value={salary.dependentsCount != null ? `${salary.dependentsCount}명` : ''} />
            </div>
          </div>
        )
      })()}

      <div className="h-5"></div>

      {/* 삭제 확인 모달 */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteModal(false)}>
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
              <span className="font-medium">{emp.empName} ({emp.empNum})</span> 사원을 목록에서 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal(false)}
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
