import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type FieldConfig, DEFAULT_FIELDS } from '../hr-admin/components/EmployeeRegisterFormConfig'
import { formSetupApi } from '../../api/formConfig'
import type { FormFieldSetupRes } from '../../api/formConfig'

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors'
const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8`

// 특수 필드 렌더러 (하드코딩이 필요한 필드)
function SpecialField({ field, formData, onChange }: { field: FieldConfig; formData: Record<string, string>; onChange: (key: string, val: string) => void }) {
  switch (field.fieldKey) {
    case 'gender':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2">
            {[{ key: 'male', label: '남성' }, { key: 'female', label: '여성' }].map(g => (
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

    case 'address':
      return (
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2 mb-1.5">
            <input className={`${inputClass} w-36`} placeholder="우편번호" value={formData.zipCode || ''} onChange={e => onChange('zipCode', e.target.value)} />
            <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">주소 검색</button>
          </div>
          <input className={`${inputClass} mb-1.5`} placeholder="기본 주소" value={formData.address || ''} onChange={e => onChange('address', e.target.value)} />
          <input className={inputClass} placeholder="상세 주소" value={formData.addressDetail || ''} onChange={e => onChange('addressDetail', e.target.value)} />
        </div>
      )

    case 'empId':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2">
            <input className={`${inputClass} bg-gray-50 text-gray-400 flex-1 cursor-not-allowed`} placeholder="자동 생성" value={formData.empId || ''} disabled />
            <button onClick={() => onChange('empId', 'PC' + (2024001 + Math.floor(Math.random() * 100)))}
              className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all whitespace-nowrap">자동 생성</button>
          </div>
        </div>
      )

    case 'companyEmail':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex">
            <input value={formData.companyEmail || ''} onChange={e => onChange('companyEmail', e.target.value)}
              className={`${inputClass} flex-1 rounded-r-none border-r-0`} placeholder="아이디" />
            <span className="px-3 py-2 bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg text-sm text-gray-400 whitespace-nowrap">@peoplecore.com</span>
          </div>
        </div>
      )

    case 'pwMethod':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <div className="flex gap-2">
            {[{ key: 'auto', label: '자동 생성 후 메일 발송' }, { key: 'manual', label: '직접 설정' }].map(opt => (
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
          {field.fieldKey === 'hireDate' && <span className="text-[11px] text-gray-400">입사일 기준으로 연차가 자동 생성됩니다</span>}
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
          {field.fieldKey === 'authTemplate' && <span className="text-[11px] text-gray-400">선택한 템플릿 기준으로 접근 권한이 자동 설정됩니다</span>}
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
const SPECIAL_FIELDS = ['gender', 'address', 'empId', 'companyEmail', 'pwMethod']

// API 응답 → FieldConfig 변환
function toFieldConfig(res: FormFieldSetupRes): FieldConfig {
  return {
    fieldKey: res.fieldKey,
    label: res.label,
    section: res.section,
    fieldType: res.fieldType as FieldConfig['fieldType'],
    visible: res.visible,
    required: res.required,
    sortOrder: res.sortOrder,
    options: res.options || undefined,
    autoFillFrom: res.autoFillFrom || undefined,
  }
}

// 기본값 (API 실패 시 폴백)
const DEFAULT_SECTIONS = ['기본 인적사항', '소속 및 고용 정보', '시스템 계정 설정', '메뉴 / 기능 권한 설정', '인사 서류 등록']

export default function EmployeeRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Record<string, string>>({ gender: 'male', pwMethod: 'auto' })
  const [files, setFiles] = useState<{ name: string; size: number }[]>([])
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: 백엔드 연결 후 주석 해제
    // formSetupApi.getSetup('EMPLOYEE_REGISTER')
    //   .then(res => {
    //     const list: FieldConfig[] = []
    //     for (const item of res.data) {
    //       list.push(toFieldConfig(item))
    //     }
    //     setFields(list)
    //   })
    //   .catch(() => { setFields(DEFAULT_FIELDS) })
    //   .finally(() => setLoading(false))
    setFields(DEFAULT_FIELDS)
    setLoading(false)
  }, [])

  const onChange = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size }))
      setFiles(prev => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // 계약직 선택 시 계약 만료일 표시
  const showContractEnd = formData.employType === '계약직' || formData.employType === 'contract'

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
            <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-check text-xs"></i>
              등록 완료
            </button>
          </div>
        </div>

        {/* 섹션별 동적 렌더링 */}
        {loading && <div className="text-center text-sm text-gray-400 py-10">폼 설정을 불러오는 중...</div>}
        {DEFAULT_SECTIONS.map(section => {
          const sectionFields = fields
            .filter(f => f.section === section && f.visible)
            .filter(f => {
              // 계약 만료일은 계약직일 때만 표시
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
                  // 비밀번호 직접 설정 필드 (pwMethod가 manual일 때만)
                  if (field.fieldKey === 'pwMethod') {
                    return (
                      <div key={field.fieldKey} className="contents">
                        <SpecialField field={field} formData={formData} onChange={onChange} />
                        {formData.pwMethod === 'manual' && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">초기 비밀번호 <span className="text-red-400">*</span></label>
                            <input type="password" className={inputClass} placeholder="비밀번호 입력" value={formData.password || ''} onChange={e => onChange('password', e.target.value)} />
                          </div>
                        )}
                      </div>
                    )
                  }

                  // 특수 필드
                  if (SPECIAL_FIELDS.includes(field.fieldKey)) {
                    return <SpecialField key={field.fieldKey} field={field} formData={formData} onChange={onChange} />
                  }

                  // 일반 필드
                  return <GenericField key={field.fieldKey} field={field} formData={formData} onChange={onChange} />
                })}
              </div>
            </div>
          )
        })}

        <div className="h-5"></div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-400">* 표시된 항목은 필수 입력값입니다. 등록 완료 시 사내 이메일로 계정 정보가 발송됩니다.</span>
        <div className="flex gap-2">
          <button className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">임시 저장</button>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-check text-xs"></i>
            등록 완료 및 계정 발급
          </button>
        </div>
      </div>
    </div>
  )
}
