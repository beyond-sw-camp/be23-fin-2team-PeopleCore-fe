import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type FieldConfig, DEFAULT_FIELDS } from '../hr-admin/components/EmployeeRegisterFormConfig'
import { registerEmployee, fetchDepartmentList, fetchGradeList, fetchTitleList } from '../../api/employee'
import { attendanceApi, type WorkGroupListItem } from '../../api/attendance'
import type {
  EmployeeCreateRequestDto,
  DepartmentDto,
  GradeDto,
  TitleDto,
  EmpGender,
  EmpType,
  EmpRole,
  PasswordIssueType,
} from '../../api/employee'
import FaceRegisterCapture from '../../components/face/FaceRegisterCapture'

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors'
const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8`

// 특수 필드 렌더러 (하드코딩이 필요한 필드)
function SpecialField({ field, formData, onChange, departments, grades, titles, workGroups }: { field: FieldConfig; formData: Record<string, string>; onChange: (key: string, val: string) => void; departments: DepartmentDto[]; grades: GradeDto[]; titles: TitleDto[]; workGroups: WorkGroupListItem[] }) {
  switch (field.fieldKey) {
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

    case 'address': {
      const openPostcode = () => {
        const daum = (window as any).daum
        if (!daum?.Postcode) { alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return }
        new daum.Postcode({
          oncomplete(data: any) {
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
            <input className={`${inputClass} bg-gray-50 text-gray-400 flex-1 cursor-not-allowed`} placeholder="입사일 기준 자동 생성" value="" disabled />
          </div>
          <span className="text-[11px] text-gray-400">사번은 등록 시 입사일 기준으로 자동 생성됩니다 (YYYYMM-XXXX)</span>
        </div>
      )

    case 'companyEmail':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex">
            <input className={`${inputClass} bg-gray-50 text-gray-400 flex-1 cursor-not-allowed`} placeholder="사번 기준 자동 생성" value="" disabled />
            <span className="px-3 py-2 bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg text-sm text-gray-400 whitespace-nowrap">@peoplecore.com</span>
          </div>
          <span className="text-[11px] text-gray-400">사내 이메일은 사번 기준으로 자동 생성됩니다</span>
        </div>
      )

    case 'pwMethod':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2">
            {[{ key: 'AUTO_EMAIL', label: '자동 생성 후 메일 발송' }, { key: 'MANUAL', label: '직접 설정' }].map(opt => (
              <button key={opt.key} onClick={() => onChange('pwMethod', opt.key)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all ${
                  formData.pwMethod === opt.key ? 'border-[#1D9E75] bg-[#eaf6f0] text-[#1D9E75] font-medium' : 'border-gray-200 text-gray-500'
                }`}>
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${formData.pwMethod === opt.key ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                  {formData.pwMethod === opt.key && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )

    case 'mailQuota':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}</label>
          <input className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} value="5GB" disabled />
          <span className="text-[11px] text-gray-400">메일함 용량은 5GB로 고정됩니다</span>
        </div>
      )

    // 부서 필드를 API에서 가져온 목록으로 렌더링
    case 'department':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">부서 선택</option>
            {departments.map(d => <option key={d.id} value={d.deptName}>{d.deptName}</option>)}
          </select>
        </div>
      )

    case 'rank':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">직급 선택</option>
            {grades.map(g => <option key={g.gradeId} value={g.gradeName}>{g.gradeName}</option>)}
          </select>
        </div>
      )

    case 'position':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={selectClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)}>
            <option value="">직책 선택</option>
            {titles.map(t => <option key={t.titleId} value={t.titleName}>{t.titleName}</option>)}
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
          <input type="date" className={inputClass} value={formData[field.fieldKey] || ''} onChange={e => onChange(field.fieldKey, e.target.value)} />
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
const SPECIAL_FIELDS = ['gender', 'address', 'empId', 'companyEmail', 'pwMethod', 'department', 'rank', 'position', 'workGroup', 'mailQuota']

// 기본값 (API 실패 시 폴백)
const DEFAULT_SECTIONS = ['기본 인적사항', '소속 및 고용 정보', '시스템 계정 설정', '메뉴 / 기능 권한 설정', '인사 서류 등록']

export default function EmployeeRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Record<string, string>>({ gender: 'MALE', pwMethod: 'AUTO_EMAIL' })
  const [files, setFiles] = useState<File[]>([])
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [grades, setGrades] = useState<GradeDto[]>([])
  const [titles, setTitles] = useState<TitleDto[]>([])
  const [workGroups, setWorkGroups] = useState<WorkGroupListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // 폼 설정 로드
    setFields(DEFAULT_FIELDS)
    setLoading(false)

    // 부서/직급/직책 목록 로드
    fetchDepartmentList().then(setDepartments).catch(() => {})
    fetchGradeList().then(setGrades).catch(() => {})
    fetchTitleList().then(setTitles).catch(() => {})
    attendanceApi.getWorkGroups().then(setWorkGroups).catch(() => {})
  }, [])

  const onChange = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

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

  // 등록 처리
  const handleSubmit = async () => {
    // 필수값 검증
    if (!formData.empName || !formData.empNameEn || !formData.birthDate || !formData.phone || !formData.personalEmail
      || !formData.hireDate || !formData.department || !formData.rank || !formData.position) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }
    if (!formData.zipCode || !formData.address) {
      alert('주소를 입력해주세요.')
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.personalEmail)) {
      alert('개인 이메일을 올바른 형식으로 입력해주세요. (예: example@email.com)')
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
        empHireDate: formData.hireDate,
        empType: (formData.employType === '계약직' ? 'CONTRACT' : 'FULL') as EmpType,
        deptName: formData.department,
        gradeName: formData.rank,
        titleName: formData.position,
        empRole: (formData.authTemplate === 'HR 담당자' ? 'HR_ADMIN'
          : formData.authTemplate === '인사 최고 관리자' ? 'HR_SUPER_ADMIN'
          : 'EMPLOYEE') as EmpRole,
        passwordIssueType: formData.pwMethod as PasswordIssueType,
        initialPassword: formData.pwMethod === 'MANUAL' ? formData.password : undefined,
        empMailboxSize: '5GB',
      }

      await registerEmployee(dto, files.length > 0 ? files : undefined)
      alert('사원 등록이 완료되었습니다.')
      navigate('/hr/list')
    } catch (e: any) {
      const msg = e?.message || '사원 등록에 실패했습니다.'
      alert(msg)
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
                  // 비밀번호 직접 설정 필드 (pwMethod가 MANUAL일 때만)
                  if (field.fieldKey === 'pwMethod') {
                    return (
                      <div key={field.fieldKey} className="contents">
                        <SpecialField field={field} formData={formData} onChange={onChange} departments={departments} grades={grades} titles={titles} workGroups={workGroups} />
                        {formData.pwMethod === 'MANUAL' && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">초기 비밀번호 <span className="text-red-400">*</span></label>
                            <input type="password" className={inputClass} placeholder="8자 이상, 대소문자+숫자+특수문자" value={formData.password || ''} onChange={e => onChange('password', e.target.value)} />
                            <span className="text-[11px] text-gray-400">영문 대문자, 소문자, 숫자, 특수문자(!@#$%) 포함 8자 이상</span>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // 특수 필드
                  if (SPECIAL_FIELDS.includes(field.fieldKey)) {
                    return <SpecialField key={field.fieldKey} field={field} formData={formData} onChange={onChange} departments={departments} grades={grades} titles={titles} workGroups={workGroups} />
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
          <p className="text-xs text-gray-400 mb-3">안면인식 로그인을 사용하려면 사원의 얼굴을 등록해주세요.</p>
          <FaceRegisterCapture empId={Number(formData.empId) || 0} />
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
    </div>
  )
}
