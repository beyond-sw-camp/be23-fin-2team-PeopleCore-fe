// 조직관리 공통 타입 정의

// ── 부서 ──────────────────────────────────────────────
export interface Department {
  id: string
  name: string
  code: string
  parentId: string | null
  headId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ── 직급 / 직책 ──────────────────────────────────────
export interface Rank {
  id: string
  name: string
  level: number        // 1이 가장 높음 (예: 사장=1, 사원=9)
  createdAt: string
}

export interface Position {
  id: string
  name: string         // 팀장, 본부장, 파트장 등
  departmentId: string | null  // null이면 공통 직책
  createdAt: string
}

// ── 직원 ──────────────────────────────────────────────
export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  departmentId: string
  departmentName: string
  rankId: string
  rankName: string
  positionId: string | null
  positionName: string | null
  joinDate: string
  status: 'active' | 'leave' | 'retired'
  profileColor: string
}

// ── 권한(Role) ────────────────────────────────────────
export interface Role {
  id: string
  name: string
  description: string
  menuPermissions: string[]      // 접근 가능 메뉴 key 배열
  infoAccessScope: 'all' | 'department' | 'team' | 'self'
  createdAt: string
  updatedAt: string
}

export interface PermissionHistory {
  id: string
  roleId: string
  roleName: string
  action: 'create' | 'update' | 'delete'
  detail: string
  changedBy: string
  changedAt: string
}

// ── 인사 발령 ─────────────────────────────────────────
export type OrderType = 'promotion' | 'transfer' | 'concurrent' | 'rank_change' | 'position_change'

export interface PersonnelOrder {
  id: string
  type: OrderType
  employeeId: string
  employeeName: string
  fromDepartment: string
  toDepartment: string
  fromRank: string
  toRank: string
  fromPosition: string
  toPosition: string
  effectiveDate: string
  status: 'pending_approval' | 'scheduled' | 'effective' | 'cancelled' | 'rejected'
  notified: boolean
  createdBy: string
  createdAt: string
  memo: string
}

// ── 탭 ───────────────────────────────────────────────
export type OrgManagementTab = 'department' | 'rank-position' | 'auth' | 'employee-search' | 'personnel-order'

// ── 유틸 ──────────────────────────────────────────────
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  promotion: '승진',
  transfer: '전보',
  concurrent: '겸직',
  rank_change: '직급 변경',
  position_change: '직책 변경',
}

export const ORDER_STATUS_LABELS: Record<PersonnelOrder['status'], { label: string; color: string }> = {
  pending_approval: { label: '승인대기', color: 'bg-amber-100 text-amber-700' },
  scheduled: { label: '예정', color: 'bg-blue-100 text-blue-700' },
  effective: { label: '발령완료', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-500' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-600' },
}

export const MENUS = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'board', label: '게시판' },
  { key: 'approval', label: '전자결재' },
  { key: 'calendar', label: '캘린더' },
  { key: 'drive', label: '파일함' },
  { key: 'attendance', label: '근태/연차' },
  { key: 'salary', label: '급여' },
  { key: 'performance', label: '성과 평가' },
  { key: 'org-management', label: '조직관리' },
] as const
