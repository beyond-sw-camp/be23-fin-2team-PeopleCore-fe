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

const selectClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8"
const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors"

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
    empHireDate: '',
    empType: 'FULL' as EmpType,
    deptName: '',
    gradeName: '',
    titleName: '',
    empRole: 'EMPLOYEE' as EmpRole,
    empMailboxSize: '',
  })

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  useEffect(() => {
    if (!empId) return
    Promise.all([
      fetchEmployeeDetail(empId),
      fetchDepartmentList(),
      fetchGradeList(),
      fetchTitleList(),
    ]).then(([detail, depts, gradeList, titleList]) => {
      setOriginal(detail)
      setDepartments(depts)
      setGrades(gradeList)
      setTitles(titleList)
      setForm({
        empName: detail.empName || '',
        empNameEn: detail.empNameEn || '',
        empBirthDate: detail.empBirthDate || '',
        empGender: (detail.empGender as EmpGender) || 'MALE',
        empPhone: detail.empPhone || '',
        empPersonalEmail: detail.empPersonalEmail || '',
        empZipCode: '',
        empAddressBase: detail.empAddressBase || '',
        empAddressDetail: detail.empAddressDetail || '',
        empHireDate: detail.empHireDate || '',
        empType: (detail.empType as EmpType) || 'FULL',
        deptName: detail.deptName || '',
        gradeName: detail.gradeName || '',
        titleName: detail.titleName || '',
        empRole: (detail.empRole as EmpRole) || 'EMPLOYEE',
        empMailboxSize: detail.empMailboxSize || '',
      })
    }).catch(() => {
      alert('사원 정보를 불러올 수 없습니다.')
    }).finally(() => setLoading(false))
  }, [empId])

  const handleSave = async () => {
    if (!form.empName || !form.empBirthDate || !form.empPhone || !form.empHireDate || !form.deptName || !form.gradeName || !form.titleName) {
      alert('필수 항목을 모두 입력해주세요.')
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
        empHireDate: form.empHireDate,
        empType: form.empType,
        deptName: form.deptName,
        gradeName: form.gradeName,
        titleName: form.titleName,
        empRole: form.empRole,
        empMailboxSize: form.empMailboxSize || undefined,
      }
      await updateEmployee(empId, dto)
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
              <input type="date" className={inputClass} value={form.empBirthDate} onChange={e => set('empBirthDate', e.target.value)} />
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
              <label className="text-xs font-medium text-gray-500">연락처 <span className="text-red-400">*</span></label>
              <input className={inputClass} value={form.empPhone} onChange={e => set('empPhone', e.target.value)} />
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
                  const daum = (window as any).daum
                  if (!daum?.Postcode) { alert('주소 검색 서비스를 불러오는 중입니다.'); return }
                  new daum.Postcode({
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
              <input type="date" className={inputClass} value={form.empHireDate} onChange={e => set('empHireDate', e.target.value)} />
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
                <input type="date" className={inputClass} />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">부서 <span className="text-red-400">*</span></label>
              <select value={form.deptName} onChange={e => set('deptName', e.target.value)} className={selectClass}>
                <option value="">부서 선택</option>
                {departments.map(d => <option key={d.id} value={d.deptName}>{d.deptName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">직급 <span className="text-red-400">*</span></label>
              <select value={form.gradeName} onChange={e => set('gradeName', e.target.value)} className={selectClass}>
                <option value="">직급 선택</option>
                {grades.map(g => <option key={g.gradeId} value={g.gradeName}>{g.gradeName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">직책 <span className="text-red-400">*</span></label>
              <select value={form.titleName} onChange={e => set('titleName', e.target.value)} className={selectClass}>
                <option value="">직책 선택</option>
                {titles.map(t => <option key={t.titleId} value={t.titleName}>{t.titleName}</option>)}
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">메일함 용량</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed" value="5GB" disabled />
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
    </div>
  )
}
