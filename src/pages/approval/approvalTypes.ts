export interface OrgMember {
  id: string
  name: string
  position: string
  department: string
}

export const CURRENT_USER: OrgMember = { id: 'u1', name: '김인재', position: '차장', department: '경영' }
