// 조직도 데이터 (공용 파일함 공유 대상 선택용)

export interface OrgDepartment {
  id: string
  name: string
  children?: OrgDepartment[]
}

export interface OrgMember {
  id: string
  name: string
  position: string
  department: string
  departmentId: string
}

export const orgDepartments: OrgDepartment[] = [
  {
    id: 'ceo',
    name: 'PeopleCore',
    children: [
      {
        id: 'management',
        name: '경영지원본부',
        children: [
          { id: 'hr', name: '인사총무팀' },
          { id: 'finance', name: '재무회계팀' },
          { id: 'ga', name: '총무팀' },
        ],
      },
      {
        id: 'dev',
        name: '개발본부',
        children: [
          { id: 'frontend', name: '프론트엔드팀' },
          { id: 'backend', name: '백엔드팀' },
          { id: 'infra', name: '인프라팀' },
          { id: 'qa', name: 'QA팀' },
        ],
      },
      {
        id: 'sales',
        name: '영업본부',
        children: [
          { id: 'sales1', name: '영업1팀' },
          { id: 'sales2', name: '영업2팀' },
          { id: 'marketing', name: '마케팅팀' },
        ],
      },
    ],
  },
]

export const orgMembers: OrgMember[] = [
  { id: '1', name: '김철수', position: '팀장', department: '인사총무팀', departmentId: 'hr' },
  { id: '2', name: '이영희', position: '팀원', department: '인사총무팀', departmentId: 'hr' },
  { id: '3', name: '박민수', position: '팀원', department: '인사총무팀', departmentId: 'hr' },
  { id: '4', name: '정수연', position: '팀장', department: '재무회계팀', departmentId: 'finance' },
  { id: '5', name: '최동혁', position: '팀원', department: '재무회계팀', departmentId: 'finance' },
  { id: '6', name: '한지민', position: '팀장', department: '총무팀', departmentId: 'ga' },
  { id: '7', name: '강호진', position: '본부장', department: '경영지원본부', departmentId: 'management' },
  { id: '8', name: '윤서준', position: '팀장', department: '프론트엔드팀', departmentId: 'frontend' },
  { id: '9', name: '임하은', position: '팀원', department: '프론트엔드팀', departmentId: 'frontend' },
  { id: '10', name: '송태현', position: '팀원', department: '프론트엔드팀', departmentId: 'frontend' },
  { id: '11', name: '오민정', position: '팀장', department: '백엔드팀', departmentId: 'backend' },
  { id: '12', name: '배준호', position: '팀원', department: '백엔드팀', departmentId: 'backend' },
  { id: '13', name: '신예린', position: '본부장', department: '개발본부', departmentId: 'dev' },
  { id: '14', name: '장우성', position: '팀장', department: '영업1팀', departmentId: 'sales1' },
  { id: '15', name: '권나영', position: '팀장', department: '마케팅팀', departmentId: 'marketing' },
]

export function getAllDescendantIds(dept: OrgDepartment): string[] {
  const ids = [dept.id]
  if (dept.children) {
    for (const child of dept.children) {
      ids.push(...getAllDescendantIds(child))
    }
  }
  return ids
}

export function findDepartment(depts: OrgDepartment[], id: string): OrgDepartment | null {
  for (const dept of depts) {
    if (dept.id === id) return dept
    if (dept.children) {
      const found = findDepartment(dept.children, id)
      if (found) return found
    }
  }
  return null
}
