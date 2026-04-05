export interface OrgMember {
  id: string
  empId?: number
  name: string
  position: string
  department: string
  grade?: string
  title?: string
}

// AuthContext의 user 정보를 기반으로 CURRENT_USER를 동적으로 생성하므로
// 하드코딩된 CURRENT_USER는 더 이상 사용하지 않음 (하위 호환용 유지)
export const CURRENT_USER: OrgMember = { id: 'u1', name: '김인재', position: '차장', department: '경영' }
