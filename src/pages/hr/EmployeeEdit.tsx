import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchEmployeeDetail,
  updateEmployee,
  fetchDepartmentList,
  fetchGradeList,
  fetchTitleList,
  EMP_ROLE_LABEL,
} from '../../api/employee'
import { formSetupApi } from '../../api/formConfig'
import type {
  EmpDetailResponseDto,
  EmployeeUpdateRequestDto,
  DepartmentDto,
  GradeDto,
  TitleDto,
  EmpGender,
  EmpType,
  EmpRole,
} from '../../api/employee'
import FaceRegisterCapture from '../../components/face/FaceRegisterCapture'
import { formatResidentNumber } from './EmployeeRegister'
import AccountInputModal from '../../components/payroll/AccountInputModal'
import RetirementAccountModal from '../../components/payroll/RetirementAccountModal'
import { empSalaryApi, type EmpSalaryDetailRes, type PensionType, type RetirementType } from '../../api/payAdmin'

const RESIDENT_NUMBER_REGEX = /^\d{6}-\d{7}$/

const selectClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8"
const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors"

// 급여계좌 인증 결과 (모달이 onSave로 넘겨주는 5개 값)
interface SalaryAccountInfo {
  bankCode: string
  bankName: string
  accountNumber: string
  accountHolder: string
  verificationToken: string
}

export default function EmployeeEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const empId = Number(id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [original, setOriginal] = useState<EmpDetailResponseDto | null>(null)
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [grades, setGrades] = useState<GradeDto[]>([])
  const [titles, setTitles] = useState<TitleDto[]>([])
  const [insuranceJobOptions, setInsuranceJobOptions] = useState<string[]>([])

  // 급여 정보 (별도 엔드포인트로 부분 PUT — dirty check)
  const [salaryDetail, setSalaryDetail] = useState<EmpSalaryDetailRes | null>(null)
  const [newSalaryAccount, setNewSalaryAccount] = useState<SalaryAccountInfo | null>(null)   // 재인증 시에만 set
  const [retirementType, setRetirementType] = useState<RetirementType | ''>('')
  const [retirementAccountNumber, setRetirementAccountNumber] = useState<string>('')
  const [dependentsCount, setDependentsCount] = useState<number>(1)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [retirementModalOpen, setRetirementModalOpen] = useState(false)

  // 폼 상태 (백엔드 EmployeeUpdateRequestDto 필드명 매칭)
  const [form, setForm] = useState({
    empName: '',
    empNameEn: '',
    empBirthDate: '',
    empGender: 'MALE' as EmpGender,
    empPhone: '',
    empPersonalEmail: '',
    empZipCode: '',
    empAddressBase: '',
    empAddressDetail: '',
    empResidentNumber: '',
    empHireDate: '',
    empType: 'FULL' as EmpType,
    deptId: '',
    gradeId: '',
    titleId: '',
    insuranceJobTypeName: '',
    empRole: 'EMPLOYEE' as EmpRole,
  })

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  useEffect(() => {
    if (!empId) return
    Promise.all([
      fetchEmployeeDetail(empId),
      fetchDepartmentList(),
      fetchGradeList(),
      fetchTitleList(),
      formSetupApi.getSetup('EMPLOYEE_REGISTER'),
      empSalaryApi.getDetail(empId).catch(() => null),   // 급여 정보 — 실패해도 기본정보 페이지는 동작
    ]).then(([detail, depts, gradeList, titleList, formSetupRes, salary]) => {
      setOriginal(detail)
      setDepartments(depts)
      setGrades(gradeList)
      setTitles(titleList)
      const jobField = formSetupRes.data.find(f => f.fieldKey === 'insuranceJobType')
      setInsuranceJobOptions(jobField?.options || [])
      setForm({
        empName: detail.empName || '',
        empNameEn: detail.empNameEn || '',
        empBirthDate: detail.empBirthDate || '',
        empGender: (detail.empGender as EmpGender) || 'MALE',
        empPhone: detail.empPhone || '',
        empPersonalEmail: detail.empPersonalEmail || '',
        empZipCode: detail.empZipCode || '',
        empAddressBase: detail.empAddressBase || '',
        empAddressDetail: detail.empAddressDetail || '',
        empResidentNumber: detail.empResidentNumber || '',
        empHireDate: detail.empHireDate || '',
        empType: (detail.empType as EmpType) || 'FULL',
        deptId: detail.deptId != null ? String(detail.deptId) : '',
        gradeId: detail.gradeId != null ? String(detail.gradeId) : '',
        titleId: detail.titleId != null ? String(detail.titleId) : '',
        insuranceJobTypeName: detail.insuranceJobTypeName || '',
        empRole: (detail.empRole as EmpRole) || 'EMPLOYEE',
      })
      if (salary) {
        setSalaryDetail(salary)
        setRetirementType(salary.empRetirementType ?? '')
        setRetirementAccountNumber(salary.retirementAccountNumber ?? '')
        setDependentsCount(salary.dependentsCount ?? 1)
      }
    }).catch(() => {
      alert('사원 정보를 불러올 수 없습니다.')
    }).finally(() => setLoading(false))
  }, [empId])

  // 급여 정보 dirty check 헬퍼들
  const effectiveCompanyPensionType: PensionType | null = salaryDetail?.companyPensionType ?? null
  const showRetirement = effectiveCompanyPensionType === 'DC' || effectiveCompanyPensionType === 'DB_DC'
  const isDBDC = effectiveCompanyPensionType === 'DB_DC'
  // 운용사 미설정 — 섹션은 보이되 입력은 차단 (백엔드 NOT NULL 제약 회피)
  const hasPensionProvider = !!salaryDetail?.companyPensionProvider && salaryDetail.companyPensionProvider.trim().length > 0
  const retirementDisabled = !hasPensionProvider
  const effectiveRetirementType: RetirementType | '' = isDBDC ? retirementType : (effectiveCompanyPensionType === 'DC' ? 'DC' : '')
  const needsAccount = effectiveRetirementType === 'DC' && !retirementDisabled

  const isRetirementDirty = (): boolean => {
    if (!salaryDetail) return false
    const origType = salaryDetail.empRetirementType ?? ''
    const origAccount = salaryDetail.retirementAccountNumber ?? ''
    return effectiveRetirementType !== origType || retirementAccountNumber.trim() !== origAccount.trim()
  }
  const isDependentsDirty = (): boolean => {
    if (!salaryDetail) return false
    return dependentsCount !== (salaryDetail.dependentsCount ?? 1)
  }

  const handleSave = async () => {
    if (!form.empName || !form.empBirthDate || !form.empResidentNumber || !form.empPhone || !form.empHireDate || !form.deptId || !form.gradeId || !form.titleId || !form.insuranceJobTypeName) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }
    if (!RESIDENT_NUMBER_REGEX.test(form.empResidentNumber)) {
      alert('주민등록번호를 13자리(000000-0000000)로 입력해주세요.')
      return
    }

    // 급여 정보 검증 (변경한 경우에만)
    if (isDBDC && retirementType === '' && (newSalaryAccount || isRetirementDirty())) {
      alert('퇴직연금 유형(DB/DC)을 선택해주세요.')
      return
    }
    if (needsAccount && isRetirementDirty() && !retirementAccountNumber.trim()) {
      alert('DC형 퇴직연금은 사원 본인 계좌번호가 필요합니다.')
      return
    }

    setSaving(true)
    try {
      const dto: EmployeeUpdateRequestDto = {
        empName: form.empName,
        empNameEn: form.empNameEn || undefined,
        empBirthDate: form.empBirthDate,
        empGender: form.empGender,
        empPhone: form.empPhone,
        empPersonalEmail: form.empPersonalEmail || undefined,
        empZipCode: form.empZipCode,
        empAddressBase: form.empAddressBase,
        empAddressDetail: form.empAddressDetail || undefined,
        empResidentNumber: form.empResidentNumber,
        empHireDate: form.empHireDate,
        empType: form.empType,
        deptId: Number(form.deptId),
        gradeId: Number(form.gradeId),
        titleId: Number(form.titleId),
        insuranceJobTypeName: form.insuranceJobTypeName,
        empRole: form.empRole,
      }

      // 1) 기본 정보 업데이트
      await updateEmployee(empId, dto)

      // 2) 급여 정보 — 변경된 항목만 부분 PUT (병렬 호출)
      const tasks: Promise<unknown>[] = []
      if (newSalaryAccount) {
        tasks.push(empSalaryApi.updateAccount(empId, {
          bankCode: newSalaryAccount.bankCode,
          bankName: newSalaryAccount.bankName,
          accountNumber: newSalaryAccount.accountNumber,
          accountHolder: newSalaryAccount.accountHolder,
          verificationToken: newSalaryAccount.verificationToken,
        }))
      }
      if (isDependentsDirty()) {
        tasks.push(empSalaryApi.updateDependents(empId, dependentsCount))
      }
      if (isRetirementDirty() && effectiveRetirementType) {
        tasks.push(empSalaryApi.updateRetirementAccount(empId, {
          retirementType: effectiveRetirementType,
          pensionProvider: salaryDetail?.companyPensionProvider || '',
          accountNumber: needsAccount ? retirementAccountNumber.trim() : undefined,
        }))
      }
      if (tasks.length > 0) await Promise.all(tasks)

      alert('수정이 완료되었습니다.')
      navigate(`/hr/employee/${empId}`)
    } catch {
      alert('수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
  if (!original) return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">사원 정보를 찾을 수 없습니다.</div>

  const showContractEnd = form.empType === 'CONTRACT'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-1">
          인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">사원 정보 수정</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">사원 정보 수정</h1>
            <p className="text-xs text-gray-400 mt-1">{original.empName} ({original.empNum})님의 정보를 수정합니다.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
              취소
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors disabled:opacity-50">
              <i className="fas fa-check text-xs"></i>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* 기본 인적사항 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">기본 인적사항</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">성명 <span className="text-red-400">*</span></label>
              <input className={inputClass} value={form.empName} onChange={e => set('empName', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">영문명</label>
              <input className={inputClass} value={form.empNameEn} onChange={e => set('empNameEn', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">생년월일 <span className="text-red-400">*</span></label>
              <input type="date" max="9999-12-31" className={inputClass} value={form.empBirthDate} onChange={e => set('empBirthDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">주민등록번호 <span className="text-red-400">*</span></label>
              <input
                className={inputClass}
                placeholder="000000-0000000"
                inputMode="numeric"
                maxLength={14}
                value={form.empResidentNumber}
                onChange={e => set('empResidentNumber', formatResidentNumber(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">연락처 <span className="text-red-400">*</span></label>
              <input className={inputClass} value={form.empPhone} onChange={e => set('empPhone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">성별 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {(['MALE', 'FEMALE'] as const).map(g => (
                  <button key={g} onClick={() => set('empGender', g)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all ${
                      form.empGender === g ? 'border-[#1D9E75] bg-[#eaf6f0] text-[#1D9E75] font-medium' : 'border-gray-200 text-gray-500'
                    }`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${form.empGender === g ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                      {form.empGender === g && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                    {g === 'MALE' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">개인 이메일</label>
              <input type="email" className={inputClass} value={form.empPersonalEmail} onChange={e => set('empPersonalEmail', e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">주소 <span className="text-red-400">*</span></label>
              <div className="flex gap-2 mb-1.5">
                <input className={`${inputClass} w-36`} placeholder="우편번호" value={form.empZipCode} readOnly />
                <button type="button" onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const daum = (window as any).daum
                  if (!daum?.Postcode) { alert('주소 검색 서비스를 불러오는 중입니다.'); return }
                  new daum.Postcode({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    oncomplete(data: any) {
                      set('empZipCode', data.zonecode)
                      set('empAddressBase', data.roadAddress || data.jibunAddress)
                    },
                  }).open()
                }} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">주소 검색</button>
              </div>
              <input className={`${inputClass} mb-1.5`} placeholder="기본 주소" value={form.empAddressBase} readOnly />
              <input className={inputClass} placeholder="상세 주소" value={form.empAddressDetail} onChange={e => set('empAddressDetail', e.target.value)} />
            </div>
          </div>
        </div>

        {/* 소속 및 고용 정보 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">소속 및 고용 정보</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">입사일 <span className="text-red-400">*</span></label>
              <input type="date" max="9999-12-31" className={inputClass} value={form.empHireDate} onChange={e => set('empHireDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">고용 형태 <span className="text-red-400">*</span></label>
              <select value={form.empType} onChange={e => set('empType', e.target.value)} className={selectClass}>
                <option value="FULL">정규직</option>
                <option value="CONTRACT">계약직</option>
              </select>
            </div>
            {showContractEnd && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">계약 만료일</label>
                <input type="date" max="9999-12-31" className={inputClass} />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">부서 <span className="text-red-400">*</span></label>
              <select value={form.deptId} onChange={e => set('deptId', e.target.value)} className={selectClass}>
                <option value="">부서 선택</option>
                {departments.map(d => <option key={d.id} value={String(d.id)}>{d.deptName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">직급 <span className="text-red-400">*</span></label>
              <select value={form.gradeId} onChange={e => set('gradeId', e.target.value)} className={selectClass}>
                <option value="">직급 선택</option>
                {grades.map(g => <option key={g.gradeId} value={String(g.gradeId)}>{g.gradeName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">직책 <span className="text-red-400">*</span></label>
              <select value={form.titleId} onChange={e => set('titleId', e.target.value)} className={selectClass}>
                <option value="">직책 선택</option>
                {titles.map(t => <option key={t.titleId} value={String(t.titleId)}>{t.titleName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">업종 <span className="text-red-400">*</span></label>
              <select value={form.insuranceJobTypeName} onChange={e => set('insuranceJobTypeName', e.target.value)} className={selectClass}>
                <option value="">업종 선택</option>
                {insuranceJobOptions.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 시스템 계정 정보 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">시스템 계정 설정</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">사번</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed" value={original.empNum} disabled />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">사내 이메일</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed" value={original.empEmail} disabled />
            </div>
          </div>
        </div>

        {/* 권한 설정 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">권한 설정</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">권한 <span className="text-red-400">*</span></label>
              <select value={form.empRole} onChange={e => set('empRole', e.target.value)} className={selectClass}>
                {(Object.entries(EMP_ROLE_LABEL) as [EmpRole, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 급여 정보 */}
        {salaryDetail && (
          <div className="card p-5 mb-3.5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">급여 정보</span>
              <span className="text-[10px] text-gray-400">변경된 항목만 저장됩니다</span>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              {/* 급여 계좌 */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">급여 계좌</label>
                <div className="flex gap-2 items-center">
                  <input
                    className={`${inputClass} flex-1 cursor-not-allowed ${newSalaryAccount ? 'bg-[#f2faf6] text-[#1D9E75]' : 'bg-gray-50 text-gray-600'}`}
                    value={
                      newSalaryAccount
                        ? `${newSalaryAccount.bankName} ${newSalaryAccount.accountNumber} (${newSalaryAccount.accountHolder})`
                        : (salaryDetail.bankName ? `${salaryDetail.bankName} ${salaryDetail.accountNumber || ''} (${salaryDetail.accountHolder || ''})` : '등록된 계좌 없음')
                    }
                    readOnly
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => setAccountModalOpen(true)}
                    className="border border-[#1D9E75] bg-white text-[#1D9E75] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#f2faf6] transition-all whitespace-nowrap"
                  >
                    {salaryDetail.bankName ? '계좌 변경' : '계좌 등록'}
                  </button>
                </div>
                {newSalaryAccount && (
                  <span className="text-[11px] text-[#1D9E75]"><i className="fas fa-check-circle mr-1"></i>새 계좌 입력됨 — 저장 시 반영됩니다</span>
                )}
              </div>

              {/* 퇴직급여 계좌 (회사 pensionType이 DC/DB_DC일 때만) */}
              {showRetirement && (
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    퇴직급여 계좌
                    <span className={`text-[10px] ml-2 ${retirementDisabled ? 'text-amber-500' : 'text-gray-400'}`}>
                      운용사: {hasPensionProvider ? `${salaryDetail.companyPensionProvider} (회사 지정)` : '미설정 ⚠️'}
                    </span>
                  </label>
                  <div className="flex gap-2 items-center">
                    {isDBDC && (
                      <select
                        value={retirementType}
                        disabled={retirementDisabled}
                        onChange={e => {
                          const v = e.target.value as RetirementType | ''
                          setRetirementType(v)
                          if (v !== 'DC') setRetirementAccountNumber('')
                        }}
                        className={`${selectClass} w-40 ${retirementDisabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                      >
                        <option value="">유형 선택</option>
                        <option value="DB">DB형 (확정급여)</option>
                        <option value="DC">DC형 (확정기여)</option>
                      </select>
                    )}
                    <input
                      className={`${inputClass} flex-1 cursor-not-allowed ${retirementAccountNumber ? 'bg-[#f2faf6] text-[#1D9E75]' : 'bg-gray-50 text-gray-400'}`}
                      value={retirementAccountNumber}
                      placeholder={retirementDisabled ? '운용사 미설정 — 입력 불가' : needsAccount ? '계좌번호 입력 후 등록' : 'DB형은 회사 운용 (계좌 입력 불필요)'}
                      readOnly
                      disabled
                    />
                    {needsAccount && (
                      <button
                        type="button"
                        onClick={() => setRetirementModalOpen(true)}
                        className="border border-[#1D9E75] bg-white text-[#1D9E75] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#f2faf6] transition-all whitespace-nowrap"
                      >
                        {retirementAccountNumber ? '계좌 변경' : '계좌 등록'}
                      </button>
                    )}
                  </div>
                  {retirementDisabled && (
                    <span className="text-[11px] text-amber-600">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      회사 퇴직연금 운용사가 등록되지 않았습니다. 인사 최고 관리자가 [퇴직연금 설정]에서 운용사를 입력해야 사원 계좌를 변경할 수 있습니다.
                    </span>
                  )}
                </div>
              )}

              {/* 부양가족수 */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">부양가족수 <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  className={`${inputClass} w-32`}
                  value={dependentsCount}
                  onChange={e => setDependentsCount(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                />
                <span className="text-[11px] text-gray-400">본인 포함 / 간이세액표 조회 시 사용</span>
              </div>
            </div>
          </div>
        )}

        {/* 안면인식 등록 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">안면인식 등록</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">선택</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">안면인식 로그인을 사용하려면 사원의 얼굴을 등록해주세요.</p>
          <FaceRegisterCapture empId={empId || 0} />
        </div>

        <div className="h-5"></div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-400">* 표시된 항목은 필수 입력값입니다.</span>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            취소
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors disabled:opacity-50">
            <i className="fas fa-check text-xs"></i>
            {saving ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </div>

      {/* 급여 계좌 변경 모달 */}
      {accountModalOpen && (
        <AccountInputModal
          currentBank={salaryDetail?.bankName || ''}
          currentAccount={salaryDetail?.accountNumber || ''}
          onClose={() => setAccountModalOpen(false)}
          onSave={(bankCode, bankName, accountNumber, accountHolder, verificationToken) =>
            setNewSalaryAccount({ bankCode, bankName, accountNumber, accountHolder, verificationToken })
          }
        />
      )}

      {/* 퇴직연금 계좌 변경 모달 */}
      {retirementModalOpen && (
        <RetirementAccountModal
          companyProvider={salaryDetail?.companyPensionProvider || ''}
          currentAccount={retirementAccountNumber}
          onClose={() => setRetirementModalOpen(false)}
          onSave={(account) => setRetirementAccountNumber(account)}
        />
      )}
    </div>
  )
}
