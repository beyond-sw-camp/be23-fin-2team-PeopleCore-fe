import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type FieldConfig, DEFAULT_FIELDS, resToFieldConfig } from '../hr-admin/components/EmployeeRegisterFormConfig'
import { registerEmployee, fetchDepartmentList, fetchGradeList, fetchTitleList, previewEmpNum } from '../../api/employee'
import { formSetupApi } from '../../api/formConfig'
import { attendanceApi, type WorkGroupOption } from '../../api/attendance'
import type {
  EmployeeCreateRequestDto,
  DepartmentDto,
  GradeDto,
  TitleDto,
  EmpGender,
  EmpType,
  EmpRole,
} from '../../api/employee'
import FaceRegisterCapture from '../../components/face/FaceRegisterCapture'
import { authApi } from '../../api/auth'
import { extractErrorMessage } from '../../api/http'
import AccountVerifyModal from '../../components/payroll/AccountVerifyModal'
import RetirementAccountModal from '../../components/payroll/RetirementAccountModal'
import { retirementApi, type PensionType, type RetirementType } from '../../api/payAdmin'
import { findBankByCode } from '../../constants/banks'

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors'
const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8`

// 주민등록번호: 숫자만 추출 → 6자리 뒤 하이픈 자동 → 최대 13자리
// eslint-disable-next-line react-refresh/only-export-components
export function formatResidentNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  return digits.length <= 6 ? digits : `${digits.slice(0, 6)}-${digits.slice(6)}`
}
const RESIDENT_NUMBER_REGEX = /^\d{6}-\d{7}$/
const COMPANY_EMAIL_LOCAL_REGEX = /^[a-z0-9._-]{3,15}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/
const LAST_INITIAL_PWD_KEY = 'peoplecore.lastInitialPassword'

// 특수 필드 렌더러 (하드코딩이 필요한 필드)
function SpecialField({ field, formData, onChange, departments, grades, titles, workGroups, empNumPreview, profilePreview, onProfileChange, onProfileRemove }: { field: FieldConfig; formData: Record<string, string>; onChange: (key: string, val: string) => void; departments: DepartmentDto[]; grades: GradeDto[]; titles: TitleDto[]; workGroups: WorkGroupOption[]; empNumPreview: string; profilePreview: string | null; onProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onProfileRemove: () => void }) {
  switch (field.fieldKey) {
    case 'profileImage':
      return (
        <div className="col-span-2 flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {profilePreview ? (
              <img src={profilePreview} alt="프로필 미리보기" className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-user text-3xl text-gray-300"></i>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('profile-image-input')?.click()}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
              >
                <i className="fas fa-camera text-[11px] mr-1.5"></i>
                {profilePreview ? '사진 변경' : '사진 업로드'}
              </button>
              {profilePreview && (
                <button
                  type="button"
                  onClick={onProfileRemove}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  제거
                </button>
              )}
            </div>
            <span className="text-[11px] text-gray-400">JPG / PNG · 5MB 이하 · 권장 1:1 비율</span>
            <input type="file" id="profile-image-input" accept="image/*" className="hidden" onChange={onProfileChange} />
          </div>
        </div>
      )

    case 'gender':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2">
            {[{ key: 'MALE', label: '남성' }, { key: 'FEMALE', label: '여성' }].map(g => (
              <button key={g.key} onClick={() => onChange('gender', g.key)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all ${
                  formData.gender === g.key ? 'border-[#1D9E75] bg-[#eaf6f0] text-[#1D9E75] font-medium' : 'border-gray-200 text-gray-500'
                }`}>
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${formData.gender === g.key ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                  {formData.gender === g.key && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )

    case 'residentNumber':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <input
            className={inputClass}
            placeholder="000000-0000000"
            inputMode="numeric"
            maxLength={14}
            value={formData.residentNumber || ''}
            onChange={e => onChange('residentNumber', formatResidentNumber(e.target.value))}
          />
        </div>
      )

    case 'address': {
      const openPostcode = () => {
        const daum = (window as unknown as { daum?: { Postcode: new (opts: { oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void }) => { open: () => void } } }).daum
        if (!daum?.Postcode) { alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return }
        new daum.Postcode({
          oncomplete(data) {
            onChange('zipCode', data.zonecode)
            onChange('address', data.roadAddress || data.jibunAddress)
          },
        }).open()
      }
      return (
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2 mb-1.5">
            <input className={`${inputClass} w-36`} placeholder="우편번호" value={formData.zipCode || ''} readOnly />
            <button type="button" onClick={openPostcode} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">주소 검색</button>
          </div>
          <input className={`${inputClass} mb-1.5`} placeholder="기본 주소" value={formData.address || ''} readOnly />
          <input className={inputClass} placeholder="상세 주소" value={formData.addressDetail || ''} onChange={e => onChange('addressDetail', e.target.value)} />
        </div>
      )
    }

    case 'empId':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2">
            <input
              className={`${inputClass} bg-gray-50 text-gray-400 flex-1 cursor-not-allowed`}
              placeholder="입사일을 선택하세요"
              value={empNumPreview}
              disabled
            />
          </div>
          <span className="text-[11px] text-gray-400">사번은 등록 시 입사일 기준으로 자동 생성됩니다.</span>
        </div>
      )

    case 'companyEmail':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex">
            <input
              className={`${inputClass} flex-1`}
              maxLength={15}
              value={formData.companyEmail || ''}
              onChange={e => onChange('companyEmail', e.target.value.toLowerCase())}
            />
            <span className="px-3 py-2 bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg text-sm text-gray-500 whitespace-nowrap">@peoplecore.com</span>
          </div>
          <span className="text-[11px] text-gray-400">예) hong.gildong · 영문 소문자, 숫자, . _ - 만 사용</span>
        </div>
      )

    case 'pwMethod':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            초기 비밀번호 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={formData.password || ''}
            onChange={e => onChange('password', e.target.value)}
          />
          <span className="text-[11px] text-gray-400">
            영문 대소문자, 숫자, 특수문자(!@#$%) 포함 8자 이상 · 직전 등록 시 입력한 비밀번호가 자동으로 채워집니다
          </span>
        </div>
      )

    // 부서 필드를 API에서 가져온 목록으로 렌더링
    case 'department':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">부서 선택</option>
            {departments.map(d => <option key={d.id} value={String(d.id)}>{d.deptName}</option>)}
          </select>
        </div>
      )

    case 'rank':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">직급 선택</option>
            {grades.map(g => <option key={g.gradeId} value={String(g.gradeId)}>{g.gradeName}</option>)}
          </select>
        </div>
      )

    case 'position':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">직책 선택</option>
            {titles.map(t => <option key={t.titleId} value={String(t.titleId)}>{t.titleName}</option>)}
          </select>
        </div>
      )

    case 'workGroup':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">근무그룹 선택</option>
            {workGroups.map(w => <option key={w.workGroupId} value={String(w.workGroupId)}>{w.groupName} ({w.groupCode})</option>)}
          </select>
          <span className="text-[11px] text-gray-400">근무그룹은 관리자 {'>'} 근태·연차 정책에서 관리할 수 있습니다</span>
        </div>
      )

    default:
      return null
  }
}

// 일반 필드 렌더러
function GenericField({ field, formData, onChange }: { field: FieldConfig; formData: Record<string, string>; onChange: (key: string, val: string) => void }) {
  const label = (
    <label className="text-xs font-medium text-gray-500">
      {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )

  switch (field.fieldType) {
    case 'TEXT':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input className={inputClass} placeholder={`${field.label} 입력`} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)} />
        </div>
      )
    case 'DATE':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input type="date" max="9999-12-31" className={inputClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)} />
          {field.fieldKey === 'contractEnd' && <span className="text-[11px] text-gray-400">계약 만료 30일 전 자동 알림이 발송됩니다</span>}
        </div>
      )
    case 'NUMBER':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input type="number" className={inputClass} placeholder={`${field.label} 입력`} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)} />
        </div>
      )
    case 'SELECT':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">{field.label} 선택</option>
            {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {field.fieldKey === 'authTemplate' && <span className="text-[11px] text-gray-400">선택한 권한에 따라 접근 범위가 결정됩니다</span>}
        </div>
      )
    case 'TEXTAREA':
      return (
        <div className="col-span-2 flex flex-col gap-1">
          {label}
          <textarea className={`${inputClass} h-20 resize-none`} placeholder={`${field.label} 입력`} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)} />
        </div>
      )
    default:
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input className={inputClass} placeholder={`${field.label} 입력`} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)} />
        </div>
      )
  }
}

// 특수 렌더링이 필요한 필드 목록
const SPECIAL_FIELDS = ['profileImage', 'gender', 'residentNumber', 'address', 'empId', 'companyEmail', 'pwMethod', 'department', 'rank', 'position', 'workGroup']

// 기본값 (API 실패 시 폴백)
const DEFAULT_SECTIONS = ['기본 인적사항', '소속 및 고용 정보', '시스템 계정 설정', '메뉴 / 기능 권한 설정', '급여 정보', '인사 서류 등록']

// 급여계좌 인증 결과 (모달이 onSave로 넘겨주는 5개 값을 보관)
interface SalaryAccountInfo {
  bankCode: string
  bankName: string
  accountNumber: string
  accountHolder: string
  verificationToken: string
}

export default function EmployeeRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Record<string, string>>({
    gender: 'MALE',
    password: localStorage.getItem(LAST_INITIAL_PWD_KEY) || '',
  })
  const [files, setFiles] = useState<File[]>([])
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [grades, setGrades] = useState<GradeDto[]>([])
  const [titles, setTitles] = useState<TitleDto[]>([])
  const [workGroups, setWorkGroups] = useState<WorkGroupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null)
  const [empNumPreview, setEmpNumPreview] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)

  // ── 급여 정보 ──
  const [companyPensionType, setCompanyPensionType] = useState<PensionType | null>(null)
  const [companyPensionProvider, setCompanyPensionProvider] = useState<string>('')
  const [salaryAccount, setSalaryAccount] = useState<SalaryAccountInfo | null>(null)
  const [retirementType, setRetirementType] = useState<RetirementType | ''>('')   // DB or DC (사원 선택)
  const [retirementAccountNumber, setRetirementAccountNumber] = useState<string>('')
  const [dependentsCount, setDependentsCount] = useState<number>(1)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [retirementModalOpen, setRetirementModalOpen] = useState(false)

  useEffect(() => {
    // 폼 설정 로드 (관리자가 폼 설정 화면에서 변경한 내용 + 백엔드 동적 옵션 반영)
    formSetupApi.getSetup('EMPLOYEE_REGISTER')
      .then(res => {
        const list = res.data.map(resToFieldConfig)
        setFields(list.length > 0 ? list : DEFAULT_FIELDS)
      })
      .catch(() => setFields(DEFAULT_FIELDS))
      .finally(() => setLoading(false))

    // 부서/직급/직책 목록 로드
    fetchDepartmentList().then(setDepartments).catch(() => {})
    fetchGradeList().then(setGrades).catch(() => {})
    fetchTitleList().then(setTitles).catch(() => {})
    attendanceApi.getWorkGroupOptions().then(setWorkGroups).catch(() => {})

    // 회사 퇴직연금 설정 조회 (UI 분기에 사용)
    // - 권한 부족(403) 또는 미설정 시 퇴직연금 입력 UI를 표시하지 않음 (안전한 폴백)
    retirementApi.getSettings()
      .then(res => {
        setCompanyPensionType(res.pensionType)
        setCompanyPensionProvider(res.pensionProvider || '')
      })
      .catch(() => { /* 조회 실패 시 퇴직연금 UI 미표시 */ })
  }, [])

  const onChange = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  // 입사일 변경 시 사번 미리보기 갱신
  useEffect(() => {
    const hireDate = formData.hireDate
    if (!hireDate) {
      setEmpNumPreview('')
      return
    }
    let aborted = false
    previewEmpNum(hireDate)
      .then((empNum) => { if (!aborted) setEmpNumPreview(empNum) })
      .catch(() => { if (!aborted) setEmpNumPreview('') })
    return () => { aborted = true }
  }, [formData.hireDate])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('프로필 사진은 5MB 이하로 업로드해주세요.')
      return
    }
    setProfileImage(file)
    const reader = new FileReader()
    reader.onload = () => setProfilePreview(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const removeProfile = () => {
    setProfileImage(null)
    setProfilePreview(null)
  }

  // 등록 처리
  const handleSubmit = async () => {
    // 필수값 검증 (어떤 필드가 비었는지 alert에 명시)
    const requiredFields: { key: keyof typeof formData; label: string }[] = [
      { key: 'empName',         label: '성명' },
      { key: 'empNameEn',       label: '영문명' },
      { key: 'birthDate',       label: '생년월일' },
      { key: 'residentNumber',  label: '주민등록번호' },
      { key: 'phone',           label: '연락처' },
      { key: 'personalEmail',   label: '개인 이메일' },
      { key: 'hireDate',        label: '입사일' },
      { key: 'department',      label: '부서' },
      { key: 'rank',            label: '직급' },
      { key: 'position',        label: '직책' },
      { key: 'workGroup',       label: '근무그룹' },
      { key: 'insuranceJobType', label: '업종' },
      { key: 'companyEmail',    label: '사내 이메일' },
    ]
    const missing = requiredFields.filter(f => !formData[f.key]).map(f => f.label)
    if (missing.length > 0) {
      alert(`필수 항목이 누락되었습니다:\n· ${missing.join('\n· ')}`)
      return
    }
    if (!formData.zipCode || !formData.address) {
      alert('주소를 입력해주세요.')
      return
    }
    if (!RESIDENT_NUMBER_REGEX.test(formData.residentNumber)) {
      alert('주민등록번호를 13자리(000000-0000000)로 입력해주세요.')
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.personalEmail)) {
      alert('개인 이메일을 올바른 형식으로 입력해주세요. (예: example@email.com)')
      return
    }
    if (!COMPANY_EMAIL_LOCAL_REGEX.test(formData.companyEmail)) {
      alert('사내 이메일 아이디는 영문 소문자/숫자/._- 조합 3~15자여야 합니다.')
      return
    }
    if (!formData.password) {
      alert('초기 비밀번호를 입력해주세요.')
      return
    }
    if (!PASSWORD_REGEX.test(formData.password)) {
      alert('비밀번호는 영문 대소문자, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.')
      return
    }

    // 급여 정보 검증
    // - 급여계좌/퇴직계좌는 모두 optional. 사원수정 화면에서 추후 입력 가능
    // - 다만 퇴직연금 유형(DB/DC)을 선택했고 DC인데 계좌번호를 안 적은 건 모순이므로 막음
    const effectiveRetirementType: RetirementType | '' =
      companyPensionType === 'DC' && retirementAccountNumber.trim() ? 'DC' :
      companyPensionType === 'DB_DC' ? retirementType :
      ''
    if (effectiveRetirementType === 'DC' && !retirementAccountNumber.trim()) {
      alert('DC형으로 등록하려면 사원 본인 계좌번호가 필요합니다. 입력하지 않으려면 유형 선택을 비워두세요.')
      return
    }

    setSubmitting(true)
    try {
      // 프론트 폼 데이터 → 백엔드 DTO 필드명 매핑
      const dto: EmployeeCreateRequestDto = {
        empName: formData.empName,
        empNameEn: formData.empNameEn || '',
        empBirthDate: formData.birthDate,
        empGender: formData.gender as EmpGender,
        empPhone: formData.phone,
        empPersonalEmail: formData.personalEmail,
        empZipCode: formData.zipCode || '',
        empAddressBase: formData.address || '',
        empAddressDetail: formData.addressDetail,
        empResidentNumber: formData.residentNumber,
        empHireDate: formData.hireDate,
        empType: (formData.employType === '계약직' ? 'CONTRACT' : 'FULL') as EmpType,
        deptId: Number(formData.department),
        gradeId: Number(formData.rank),
        titleId: Number(formData.position),
        insuranceJobTypeName: formData.insuranceJobType,
        empRole: (formData.authTemplate === 'HR 담당자' ? 'HR_ADMIN'
          : formData.authTemplate === '인사 최고 관리자' ? 'HR_SUPER_ADMIN'
          : 'EMPLOYEE') as EmpRole,
        empEmailLocal: formData.companyEmail,
        initialPassword: formData.password,
        workGroupId: formData.workGroup ? Number(formData.workGroup) : undefined,
        // 급여 정보 (모두 optional — 입력 안 한 항목은 백엔드에서 무시)
        salaryBankCode: salaryAccount?.bankCode,
        salaryBankName: salaryAccount?.bankName,
        salaryAccountNumber: salaryAccount?.accountNumber,
        salaryAccountHolder: salaryAccount?.accountHolder,
        salaryAccountVerificationToken: salaryAccount?.verificationToken,
        retirementType: effectiveRetirementType === 'DB' || effectiveRetirementType === 'DC'
          ? effectiveRetirementType
          : undefined,
        retirementAccountNumber: effectiveRetirementType === 'DC' ? retirementAccountNumber.trim() : undefined,
        dependentsCount,
      }

      // 동적 fieldKey 분리 — DEFAULT_FIELDS에 없는 fieldKey 들의 입력값을 customFields 로
      const defaultKeys = new Set(DEFAULT_FIELDS.map(f => f.fieldKey))
      const customFields: Record<string, string> = {}
      fields.forEach(f => {
        if (!defaultKeys.has(f.fieldKey) && formData[f.fieldKey]) {
          customFields[f.fieldKey] = String(formData[f.fieldKey])
        }
      })

      const newEmpId = await registerEmployee(
        dto,
        files.length > 0 ? files : undefined,
        profileImage,
        Object.keys(customFields).length > 0 ? customFields : undefined,
      )
      localStorage.setItem(LAST_INITIAL_PWD_KEY, formData.password)

      if (capturedFaceImage) {
        try {
          await authApi.faceRegister({ empId: newEmpId, image: capturedFaceImage })
          alert('사원 등록 및 얼굴 등록이 완료되었습니다.')
        } catch (faceErr: unknown) {
          const detail = extractErrorMessage(faceErr, '얼굴 등록에 실패했습니다.')
          alert(`사원은 등록되었으나 얼굴 등록에 실패했습니다.\n사유: ${detail}\n'안면 로그인 관리' 화면에서 다시 등록할 수 있습니다.`)
        }
      } else {
        alert('사원 등록이 완료되었습니다.')
      }
      navigate('/hr/list')
    } catch (e: unknown) {
      alert(extractErrorMessage(e, '사원 등록에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  // 계약직 선택 시 계약 만료일 표시
  const showContractEnd = formData.employType === '계약직' || formData.employType === 'CONTRACT'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-1">
          인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">신규 사원 등록</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">신규 사원 등록</h1>
            <p className="text-xs text-gray-400 mt-1">입사 확정 후 기본 인적사항과 계정을 등록합니다.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/hr/list')} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
              취소
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors disabled:opacity-50">
              <i className="fas fa-check text-xs"></i>
              {submitting ? '등록 중...' : '등록 완료'}
            </button>
          </div>
        </div>

        {/* 섹션별 동적 렌더링 */}
        {loading && <div className="text-center text-sm text-gray-400 py-10">폼 설정을 불러오는 중...</div>}
        {DEFAULT_SECTIONS.map(section => {
          const sectionFields = fields
            .filter(f => f.section === section && f.visible)
            .filter(f => {
              if (f.fieldKey === 'contractEnd') return showContractEnd
              return true
            })
            .sort((a, b) => a.sortOrder - b.sortOrder)

          if (sectionFields.length === 0) return null

          const hasRequired = sectionFields.some(f => f.required)

          // 급여 정보 섹션 — 별도 렌더링 (급여계좌/퇴직연금/부양가족수)
          if (section === '급여 정보') {
            const salaryField = sectionFields.find(f => f.fieldKey === 'salaryAccount')
            const retirementField = sectionFields.find(f => f.fieldKey === 'retirementAccount')
            const dependentsField = sectionFields.find(f => f.fieldKey === 'dependentsCount')

            // 회사 pensionType별 퇴직연금 UI 노출 여부
            const showRetirement = companyPensionType === 'DC' || companyPensionType === 'DB_DC'
            const isDBDC = companyPensionType === 'DB_DC'
            // 운용사 미설정 — 섹션은 보이되 입력은 차단 (백엔드 NOT NULL 제약 회피)
            const hasPensionProvider = !!companyPensionProvider && companyPensionProvider.trim().length > 0
            const retirementDisabled = !hasPensionProvider
            const effectiveRetirementType: RetirementType | '' = isDBDC ? retirementType : (companyPensionType === 'DC' ? 'DC' : '')
            const needsAccount = effectiveRetirementType === 'DC' && !retirementDisabled

            const salaryBank = salaryAccount ? findBankByCode(salaryAccount.bankCode)?.name ?? salaryAccount.bankName : ''
            const salaryAccountDisplay = salaryAccount ? `${salaryBank} ${salaryAccount.accountNumber} (${salaryAccount.accountHolder})` : ''

            return (
              <div key={section} className="card p-5 mb-3.5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">{section}</span>
                  {hasRequired && <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>}
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  {/* 급여 계좌 — 항상 optional (사원수정에서 추후 입력 가능) */}
                  {salaryField && (
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">
                        {salaryField.label}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          className={`${inputClass} flex-1 ${salaryAccount ? 'bg-[#f2faf6] text-[#1D9E75]' : 'bg-gray-50 text-gray-400'} cursor-not-allowed`}
                          value={salaryAccountDisplay}
                          placeholder="계좌 인증 후 자동 입력됩니다"
                          readOnly
                          disabled
                        />
                        <button
                          type="button"
                          onClick={() => setAccountModalOpen(true)}
                          className="border border-[#1D9E75] bg-white text-[#1D9E75] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#f2faf6] transition-all whitespace-nowrap"
                        >
                          {salaryAccount ? '계좌 재인증' : '계좌 인증'}
                        </button>
                      </div>
                      {salaryAccount && (
                        <span className="text-[11px] text-[#1D9E75]"><i className="fas fa-check-circle mr-1"></i>오픈뱅킹 인증 완료 (5분간 유효)</span>
                      )}
                    </div>
                  )}

                  {/* 퇴직급여 계좌 (회사 pensionType이 DC/DB_DC일 때만) */}
                  {retirementField && showRetirement && (
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">
                        {retirementField.label}
                        <span className={`text-[10px] ml-2 ${retirementDisabled ? 'text-amber-500' : 'text-gray-400'}`}>
                          운용사: {hasPensionProvider ? `${companyPensionProvider} (회사 지정)` : '미설정 ⚠️'}
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
                      {retirementDisabled ? (
                        <span className="text-[11px] text-amber-600">
                          <i className="fas fa-exclamation-triangle mr-1"></i>
                          회사 퇴직연금 운용사가 등록되지 않았습니다. 인사 최고 관리자가 [퇴직연금 설정]에서 운용사를 입력해야 사원 계좌를 등록할 수 있습니다.
                        </span>
                      ) : (!isDBDC && companyPensionType === 'DC' && (
                        <span className="text-[11px] text-gray-400">DC형 — 사원 본인이 운용. 계좌번호는 추후 사원수정 화면에서 등록할 수 있습니다.</span>
                      ))}
                    </div>
                  )}

                  {/* 부양가족수 */}
                  {dependentsField && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">
                        {dependentsField.label}{dependentsField.required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
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
                  )}
                </div>
              </div>
            )
          }

          // 파일 섹션은 별도 렌더링
          if (section === '인사 서류 등록') {
            const docField = sectionFields.find(f => f.fieldKey === 'documents')
            if (!docField) return null
            return (
              <div key={section} className="card p-5 mb-3.5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">{section}</span>
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">선택</span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">{docField.label}</label>
                  <div className="mt-1.5 border-2 border-dashed border-[#c8e0d4] rounded-xl p-5 text-center cursor-pointer hover:border-[#1D9E75] hover:bg-[#f2faf6] transition-all bg-gray-50"
                    onClick={() => document.getElementById('file-input')?.click()}>
                    <i className="fas fa-cloud-upload-alt text-2xl text-[#a8d4bc] mb-2"></i>
                    <div className="text-sm text-gray-400">파일을 여기에 드래그하거나 클릭하여 업로드</div>
                    <div className="text-[11px] text-gray-400 mt-1">근로계약서 · 서약서 · 개인정보 동의서 / PDF, HWP, DOCX (최대 10MB)</div>
                  </div>
                  <input type="file" id="file-input" multiple className="hidden" onChange={handleFileChange} />
                  {files.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#f2faf6] rounded-lg border border-[#d0ede2]">
                          <i className="fas fa-file-alt text-[#1D9E75] text-xs"></i>
                          <span className="flex-1 text-xs text-[#1D9E75]">{f.name}</span>
                          <span className="text-[11px] text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                          <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-400 transition-colors">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div key={section} className="card p-5 mb-3.5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">{section}</span>
                {hasRequired && <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                {sectionFields.map(field => {
                  // 특수 필드
                  if (SPECIAL_FIELDS.includes(field.fieldKey)) {
                    return <SpecialField key={field.fieldKey} field={field} formData={formData} onChange={onChange} departments={departments} grades={grades} titles={titles} workGroups={workGroups} empNumPreview={empNumPreview} profilePreview={profilePreview} onProfileChange={handleProfileChange} onProfileRemove={removeProfile} />
                  }

                  // 일반 필드
                  return <GenericField key={field.fieldKey} field={field} formData={formData} onChange={onChange} />
                })}
              </div>
            </div>
          )
        })}

        {/* 안면인식 등록 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">안면인식 등록</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">선택</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            안면인식 로그인을 사용하려면 사원의 얼굴을 촬영해주세요. 촬영 시 얼굴 인식만 먼저 검증되고, 실제 등록은 하단의 “등록 완료 및 계정 발급” 버튼 클릭 시 사원 정보와 함께 진행됩니다.
          </p>
          <FaceRegisterCapture
            empId={0}
            onCapture={(base64) => setCapturedFaceImage(base64 || null)}
            capturedImage={capturedFaceImage}
          />
        </div>

        <div className="h-5"></div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-400">* 표시된 항목은 필수 입력값입니다. 등록 완료 시 사내 이메일로 계정 정보가 발송됩니다.</span>
        <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors disabled:opacity-50">
          <i className="fas fa-check text-xs"></i>
          {submitting ? '등록 중...' : '등록 완료 및 계정 발급'}
        </button>
      </div>

      {/* 급여 계좌 인증 모달 */}
      {accountModalOpen && (
        <AccountVerifyModal
          title="급여 계좌 등록"
          onClose={() => setAccountModalOpen(false)}
          onSave={(bankCode, bankName, accountNumber, accountHolder, verificationToken) =>
            setSalaryAccount({ bankCode, bankName, accountNumber, accountHolder, verificationToken })
          }
        />
      )}

      {/* 퇴직연금 계좌 등록 모달 */}
      {retirementModalOpen && (
        <RetirementAccountModal
          companyProvider={companyPensionProvider}
          currentAccount={retirementAccountNumber}
          onClose={() => setRetirementModalOpen(false)}
          onSave={(account) => setRetirementAccountNumber(account)}
        />
      )}
    </div>
  )
}
