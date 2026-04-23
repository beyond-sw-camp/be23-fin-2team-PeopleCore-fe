export type EmpType = 'FULL' | 'CONTRACT'
export type EmpStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED'
export type EmpGender = 'MALE' | 'FEMALE'
export type EmpRole = 'HR_SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE'
export type PasswordIssueType = 'AUTO_EMAIL' | 'MANUAL'
export type EmployeeSortField = 'EMP_NUM' | 'EMP_NAME'

// 사원 목록 DTO (백엔드 EmployeeListDto 매칭)
// NOTE: empId는 백엔드 EmployeeListDto에도 추가 필요
export interface EmployeeListDto {
  empId: number
  empNum: string
  empName: string
  deptName: string
  gradeName: string
  titleName: string
  empType: EmpType
  empHireDate: string
  empStatus: EmpStatus
}

// 상단 카드 DTO (백엔드 EmployeeCardResponseDto 매칭)
export interface EmployeeCardDto {
  total: number
  active: number
  onLeave: number
  hiredThisMonth: number
}

// 사원 상세 DTO (백엔드 EmpDetailResponseDto 매칭)
export interface EmpDetailResponseDto {
  empName: string
  empNameEn: string
  empBirthDate: string
  empGender: string
  empPhone: string
  empPersonalEmail: string
  empZipCode: string
  empAddressBase: string
  empAddressDetail: string
  empHireDate: string
  empType: string
  deptName: string
  gradeName: string
  titleName: string
  empStatus: string
  empNum: string
  empEmail: string
  empRole: string
}

// 사원 등록 요청 DTO (백엔드 EmployeeCreateRequestDto 매칭)
export interface EmployeeCreateRequestDto {
  empName: string
  empNameEn: string
  empBirthDate: string
  empGender: EmpGender
  empPhone: string
  empPersonalEmail: string
  empZipCode: string
  empAddressBase: string
  empAddressDetail?: string
  empHireDate: string
  empType: EmpType
  deptName: string
  gradeName: string
  titleName: string
  empRole: EmpRole
  passwordIssueType: PasswordIssueType
  initialPassword?: string
  workGroupId?: number
}

// 사원 수정 요청 DTO (백엔드 EmployeeUpdateRequestDto 매칭)
export interface EmployeeUpdateRequestDto {
  empName: string
  empNameEn?: string
  empBirthDate: string
  empGender: EmpGender
  empPhone: string
  empPersonalEmail?: string
  empZipCode: string
  empAddressBase: string
  empAddressDetail?: string
  empHireDate: string
  empType: EmpType
  deptName: string
  gradeName: string
  titleName: string
  empRole: EmpRole
}

// Spring Page 응답
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface DepartmentDto {
  id: number
  deptName: string
  deptCode: string
}

export interface GradeDto {
  gradeId: number
  gradeName: string
  gradeCode: string
}

export interface TitleDto {
  titleId: number
  titleName: string
  titleCode: string
}

export interface EmployeeListParams {
  keyword?: string
  deptId?: number
  empType?: EmpType
  empStatus?: EmpStatus
  sortField?: EmployeeSortField
  page?: number
  size?: number
}

export const EMP_TYPE_LABEL: Record<EmpType, string> = {
  FULL: '정규직',
  CONTRACT: '계약직',
}

export const EMP_STATUS_LABEL: Record<EmpStatus, string> = {
  ACTIVE: '재직',
  ON_LEAVE: '휴직',
  RESIGNED: '퇴직',
}

export const EMP_GENDER_LABEL: Record<EmpGender, string> = {
  MALE: '남성',
  FEMALE: '여성',
}

export const EMP_ROLE_LABEL: Record<EmpRole, string> = {
  HR_SUPER_ADMIN: '인사 최고 관리자',
  HR_ADMIN: 'HR 담당자',
  EMPLOYEE: '일반 사원',
}
