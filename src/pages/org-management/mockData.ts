import type { Department, Rank, Position, Employee, Role, PermissionHistory, PersonnelOrder } from './types'

// ── 부서 ──────────────────────────────────────────────
export const mockDepartments: Department[] = [
  { id: 'ceo', name: 'PeopleCore', code: 'CEO', parentId: null, headId: null, sortOrder: 1, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'management', name: '경영지원본부', code: 'MGT', parentId: 'ceo', headId: '7', sortOrder: 1, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'hr', name: '인사총무팀', code: 'HR', parentId: 'management', headId: '1', sortOrder: 1, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'finance', name: '재무회계팀', code: 'FIN', parentId: 'management', headId: '4', sortOrder: 2, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'ga', name: '총무팀', code: 'GA', parentId: 'management', headId: '6', sortOrder: 3, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'dev', name: '개발본부', code: 'DEV', parentId: 'ceo', headId: '13', sortOrder: 2, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'frontend', name: '프론트엔드팀', code: 'FE', parentId: 'dev', headId: '8', sortOrder: 1, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'backend', name: '백엔드팀', code: 'BE', parentId: 'dev', headId: '11', sortOrder: 2, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'infra', name: '인프라팀', code: 'INFRA', parentId: 'dev', headId: null, sortOrder: 3, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'qa', name: 'QA팀', code: 'QA', parentId: 'dev', headId: null, sortOrder: 4, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'sales', name: '영업본부', code: 'SALES', parentId: 'ceo', headId: null, sortOrder: 3, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'sales1', name: '영업1팀', code: 'S1', parentId: 'sales', headId: '14', sortOrder: 1, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'sales2', name: '영업2팀', code: 'S2', parentId: 'sales', headId: null, sortOrder: 2, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'marketing', name: '마케팅팀', code: 'MKT', parentId: 'sales', headId: '15', sortOrder: 3, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
]

// ── 직급 ──────────────────────────────────────────────
export const mockRanks: Rank[] = [
  { id: 'r1', name: '사장', level: 1, createdAt: '2025-01-01T00:00:00' },
  { id: 'r2', name: '부사장', level: 2, createdAt: '2025-01-01T00:00:00' },
  { id: 'r3', name: '전무', level: 3, createdAt: '2025-01-01T00:00:00' },
  { id: 'r4', name: '이사', level: 4, createdAt: '2025-01-01T00:00:00' },
  { id: 'r5', name: '부장', level: 5, createdAt: '2025-01-01T00:00:00' },
  { id: 'r6', name: '차장', level: 6, createdAt: '2025-01-01T00:00:00' },
  { id: 'r7', name: '과장', level: 7, createdAt: '2025-01-01T00:00:00' },
  { id: 'r8', name: '대리', level: 8, createdAt: '2025-01-01T00:00:00' },
  { id: 'r9', name: '사원', level: 9, createdAt: '2025-01-01T00:00:00' },
]

// ── 직책 ──────────────────────────────────────────────
export const mockPositions: Position[] = [
  { id: 'p1', name: '대표이사', departmentId: null, createdAt: '2025-01-01T00:00:00' },
  { id: 'p2', name: '본부장', departmentId: null, createdAt: '2025-01-01T00:00:00' },
  { id: 'p3', name: '팀장', departmentId: null, createdAt: '2025-01-01T00:00:00' },
  { id: 'p4', name: '파트장', departmentId: null, createdAt: '2025-01-01T00:00:00' },
]

// ── 직원 ──────────────────────────────────────────────
export const mockEmployees: Employee[] = [
  { id: '1', name: '김철수', email: 'cskim@peoplecore.com', phone: '010-1234-5678', departmentId: 'hr', departmentName: '인사총무팀', rankId: 'r5', rankName: '부장', positionId: 'p3', positionName: '팀장', joinDate: '2015-03-02', status: 'active', profileColor: '#4CAF50' },
  { id: '2', name: '이영희', email: 'yhlee@peoplecore.com', phone: '010-2345-6789', departmentId: 'hr', departmentName: '인사총무팀', rankId: 'r8', rankName: '대리', positionId: null, positionName: null, joinDate: '2020-07-01', status: 'active', profileColor: '#2196F3' },
  { id: '3', name: '박민수', email: 'mspark@peoplecore.com', phone: '010-3456-7890', departmentId: 'hr', departmentName: '인사총무팀', rankId: 'r9', rankName: '사원', positionId: null, positionName: null, joinDate: '2023-01-09', status: 'active', profileColor: '#FF9800' },
  { id: '4', name: '정수연', email: 'syjung@peoplecore.com', phone: '010-4567-8901', departmentId: 'finance', departmentName: '재무회계팀', rankId: 'r5', rankName: '부장', positionId: 'p3', positionName: '팀장', joinDate: '2014-06-01', status: 'active', profileColor: '#9C27B0' },
  { id: '5', name: '최동혁', email: 'dhchoi@peoplecore.com', phone: '010-5678-9012', departmentId: 'finance', departmentName: '재무회계팀', rankId: 'r7', rankName: '과장', positionId: null, positionName: null, joinDate: '2018-09-01', status: 'active', profileColor: '#F44336' },
  { id: '6', name: '한지민', email: 'jmhan@peoplecore.com', phone: '010-6789-0123', departmentId: 'ga', departmentName: '총무팀', rankId: 'r5', rankName: '부장', positionId: 'p3', positionName: '팀장', joinDate: '2013-11-01', status: 'active', profileColor: '#00BCD4' },
  { id: '7', name: '강호진', email: 'hjkang@peoplecore.com', phone: '010-7890-1234', departmentId: 'management', departmentName: '경영지원본부', rankId: 'r4', rankName: '이사', positionId: 'p2', positionName: '본부장', joinDate: '2010-05-01', status: 'active', profileColor: '#795548' },
  { id: '8', name: '윤서준', email: 'sjyoon@peoplecore.com', phone: '010-8901-2345', departmentId: 'frontend', departmentName: '프론트엔드팀', rankId: 'r5', rankName: '부장', positionId: 'p3', positionName: '팀장', joinDate: '2016-02-01', status: 'active', profileColor: '#E91E63' },
  { id: '9', name: '임하은', email: 'helim@peoplecore.com', phone: '010-9012-3456', departmentId: 'frontend', departmentName: '프론트엔드팀', rankId: 'r8', rankName: '대리', positionId: null, positionName: null, joinDate: '2021-03-01', status: 'active', profileColor: '#3F51B5' },
  { id: '10', name: '송태현', email: 'thsong@peoplecore.com', phone: '010-0123-4567', departmentId: 'frontend', departmentName: '프론트엔드팀', rankId: 'r9', rankName: '사원', positionId: null, positionName: null, joinDate: '2024-01-02', status: 'active', profileColor: '#009688' },
  { id: '11', name: '오민정', email: 'mjoh@peoplecore.com', phone: '010-1111-2222', departmentId: 'backend', departmentName: '백엔드팀', rankId: 'r5', rankName: '부장', positionId: 'p3', positionName: '팀장', joinDate: '2015-08-01', status: 'active', profileColor: '#FF5722' },
  { id: '12', name: '배준호', email: 'jhbae@peoplecore.com', phone: '010-3333-4444', departmentId: 'backend', departmentName: '백엔드팀', rankId: 'r7', rankName: '과장', positionId: null, positionName: null, joinDate: '2019-04-01', status: 'active', profileColor: '#607D8B' },
  { id: '13', name: '신예린', email: 'yrshin@peoplecore.com', phone: '010-5555-6666', departmentId: 'dev', departmentName: '개발본부', rankId: 'r4', rankName: '이사', positionId: 'p2', positionName: '본부장', joinDate: '2011-07-01', status: 'active', profileColor: '#CDDC39' },
  { id: '14', name: '장우성', email: 'wsjang@peoplecore.com', phone: '010-7777-8888', departmentId: 'sales1', departmentName: '영업1팀', rankId: 'r5', rankName: '부장', positionId: 'p3', positionName: '팀장', joinDate: '2014-12-01', status: 'active', profileColor: '#FFC107' },
  { id: '15', name: '권나영', email: 'nykwon@peoplecore.com', phone: '010-9999-0000', departmentId: 'marketing', departmentName: '마케팅팀', rankId: 'r5', rankName: '부장', positionId: 'p3', positionName: '팀장', joinDate: '2017-04-01', status: 'active', profileColor: '#8BC34A' },
]

// ── Role ──────────────────────────────────────────────
export const mockRoles: Role[] = [
  { id: 'role-admin', name: '시스템관리자', description: '모든 기능 및 메뉴 접근 가능', menuPermissions: ['dashboard', 'board', 'approval', 'calendar', 'drive', 'attendance', 'salary', 'performance', 'org-management'], infoAccessScope: 'all', createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'role-hr', name: '인사담당자', description: '인사 관련 메뉴 전체 접근 가능', menuPermissions: ['dashboard', 'board', 'approval', 'calendar', 'drive', 'attendance', 'salary', 'performance', 'org-management'], infoAccessScope: 'all', createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'role-manager', name: '부서장', description: '소속 부서 정보 열람 가능', menuPermissions: ['dashboard', 'board', 'approval', 'calendar', 'drive', 'attendance', 'salary', 'performance'], infoAccessScope: 'department', createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 'role-employee', name: '일반직원', description: '기본 업무 메뉴 접근', menuPermissions: ['dashboard', 'board', 'approval', 'calendar', 'drive', 'attendance'], infoAccessScope: 'self', createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
]

// ── 권한 변경 이력 ────────────────────────────────────
export const mockPermissionHistory: PermissionHistory[] = [
  { id: 'ph1', roleId: 'role-employee', roleName: '일반직원', action: 'update', detail: '급여 메뉴 접근 권한 제거', changedBy: '김철수', changedAt: '2026-03-28T10:30:00' },
  { id: 'ph2', roleId: 'role-manager', roleName: '부서장', action: 'update', detail: '성과 평가 메뉴 접근 권한 추가', changedBy: '김철수', changedAt: '2026-03-25T14:00:00' },
  { id: 'ph3', roleId: 'role-hr', roleName: '인사담당자', action: 'create', detail: '인사담당자 역할 생성', changedBy: '김철수', changedAt: '2026-03-01T09:00:00' },
]

// ── 인사 발령 ─────────────────────────────────────────
export const mockOrders: PersonnelOrder[] = [
  { id: 'ord-1', type: 'promotion', employeeId: '5', employeeName: '최동혁', fromDepartment: '재무회계팀', toDepartment: '재무회계팀', fromRank: '과장', toRank: '차장', fromPosition: '-', toPosition: '-', effectiveDate: '2026-04-01', status: 'pending_approval', notified: false, createdBy: '김철수', createdAt: '2026-03-25T10:00:00', memo: '2026년 상반기 정기 승진' },
  { id: 'ord-2', type: 'transfer', employeeId: '10', employeeName: '송태현', fromDepartment: '프론트엔드팀', toDepartment: '백엔드팀', fromRank: '사원', toRank: '사원', fromPosition: '-', toPosition: '-', effectiveDate: '2026-04-01', status: 'pending_approval', notified: false, createdBy: '김철수', createdAt: '2026-03-26T11:00:00', memo: '백엔드 인력 보강' },
  { id: 'ord-3', type: 'position_change', employeeId: '12', employeeName: '배준호', fromDepartment: '백엔드팀', toDepartment: '백엔드팀', fromRank: '과장', toRank: '과장', fromPosition: '-', toPosition: '파트장', effectiveDate: '2026-03-15', status: 'effective', notified: true, createdBy: '김철수', createdAt: '2026-03-10T09:00:00', memo: '백엔드 파트장 임명' },
  { id: 'ord-4', type: 'concurrent', employeeId: '6', employeeName: '한지민', fromDepartment: '총무팀', toDepartment: '총무팀/인사총무팀', fromRank: '부장', toRank: '부장', fromPosition: '팀장', toPosition: '팀장(겸직)', effectiveDate: '2026-03-01', status: 'effective', notified: true, createdBy: '김철수', createdAt: '2026-02-25T15:00:00', memo: '인사총무팀 겸직 발령' },
  { id: 'ord-5', type: 'rank_change', employeeId: '8', employeeName: '윤성호', fromDepartment: '프론트엔드팀', toDepartment: '프론트엔드팀', fromRank: '사원', toRank: '대리', fromPosition: '-', toPosition: '-', effectiveDate: '2026-04-15', status: 'pending_approval', notified: false, createdBy: '이영희', createdAt: '2026-03-28T14:00:00', memo: '경력 인정에 따른 직급 변경' },
]
