import { apiFetch, apiFetchMultipart } from '../http'
import type {
  EmployeeListDto,
  EmployeeCardDto,
  EmpDetailResponseDto,
  EmployeeCreateRequestDto,
  EmployeeUpdateRequestDto,
  PageResponse,
  EmployeeListParams,
  DepartmentDto,
  GradeDto,
  TitleDto,
} from './types'

/* ─── 사원 목록 ─── */
export async function fetchEmployeeList(params: EmployeeListParams): Promise<PageResponse<EmployeeListDto>> {
  const query = new URLSearchParams()
  if (params.keyword)             query.set('keyword', params.keyword)
  if (params.deptId !== undefined) query.set('deptId', String(params.deptId))
  if (params.empType)             query.set('empType', params.empType)
  if (params.empStatus)           query.set('empStatus', params.empStatus)
  if (params.sortField)           query.set('sortField', params.sortField)
  if (params.sortDirection)       query.set('sortDirection', params.sortDirection)
  if (params.page !== undefined)  query.set('page', String(params.page))
  if (params.size !== undefined)  query.set('size', String(params.size))

  const res = await apiFetch(`/hr-service/employee?${query.toString()}`)
  return res.json()
}

/* ─── 카드 통계 (전체/재직/휴직/이번달) ─── */
export async function fetchEmployeeCard(): Promise<EmployeeCardDto> {
  const res = await apiFetch('/hr-service/employee/card')
  return res.json()
}

/* ─── 사원 상세 ─── */
export async function fetchEmployeeDetail(empId: number): Promise<EmpDetailResponseDto> {
  const res = await apiFetch(`/hr-service/employee/${empId}`)
  return res.json()
}

/* ─── 사번 미리보기 (입사일 기준 다음 사번) ─── */
export async function previewEmpNum(hireDate: string): Promise<string> {
  const res = await apiFetch(`/hr-service/employee/preview-empnum?hireDate=${encodeURIComponent(hireDate)}`)
  return res.text()
}

/* ─── 사원 등록 (multipart/form-data) ─── */
export async function registerEmployee(
  dto: EmployeeCreateRequestDto,
  files?: File[],
  profileImage?: File | null,
  customFields?: Record<string, string>,
): Promise<number> {
  const formData = new FormData()

  // DTO → FormData (@ModelAttribute 방식)
  for (const [key, value] of Object.entries(dto)) {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value))
    }
  }

  // 프로필 사진 — 백엔드: @RequestPart("profileImage") MultipartFile
  if (profileImage) {
    formData.append('profileImage', profileImage)
  }

  // 동적 fieldKey 값들 — 백엔드: customFieldsJson 으로 파싱 후 jsonb 컬럼에 저장
  if (customFields && Object.keys(customFields).length > 0) {
    formData.append('customFieldsJson', JSON.stringify(customFields))
  }

  // 파일 첨부
  if (files && files.length > 0) {
    files.forEach(file => formData.append('files', file))
  }

  const res = await apiFetchMultipart('/hr-service/employee', formData)
  return res.json()
}

/* ─── 사원 수정 (multipart/form-data) ─── */
export async function updateEmployee(
  empId: number,
  dto: EmployeeUpdateRequestDto,
  profileImage?: File | null,
  customFields?: Record<string, string>,
): Promise<EmpDetailResponseDto> {
  const formData = new FormData()

  for (const [key, value] of Object.entries(dto)) {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value))
    }
  }

  if (profileImage) {
    formData.append('profileImage', profileImage)
  }

  if (customFields && Object.keys(customFields).length > 0) {
    formData.append('customFieldsJson', JSON.stringify(customFields))
  }

  const res = await apiFetchMultipart(`/hr-service/employee/${empId}`, formData, { method: 'PUT' })
  return res.json()
}

/* ─── 사원 삭제 (soft delete, 퇴직 상태만 가능) ─── */
export async function deleteEmployee(empId: number): Promise<void> {
  await apiFetch(`/hr-service/employee/${empId}`, { method: 'DELETE' })
}

/* ─── 내 프로필 이미지 변경 ─── */
export async function updateMyProfileImage(file: File): Promise<{ profileImageUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetchMultipart('/hr-service/employee/me/profile-image', formData)
  return res.json()
}

/* ─── 내 프로필 이미지 제거 ─── */
export async function deleteMyProfileImage(): Promise<void> {
  await apiFetch('/hr-service/employee/me/profile-image', { method: 'DELETE' })
}

/* ─── 부서 목록 ─── */
export async function fetchDepartmentList(): Promise<DepartmentDto[]> {
  const res = await apiFetch('/hr-service/departments')
  return res.json()
}

/* ─── 직급 목록 ─── */
export async function fetchGradeList(): Promise<GradeDto[]> {
  const res = await apiFetch('/hr-service/grades')
  return res.json()
}

/* ─── 직책 목록 ─── */
export async function fetchTitleList(): Promise<TitleDto[]> {
  const res = await apiFetch('/hr-service/titles')
  return res.json()
}
