export interface OrgMember {
  id: string
  empId: number
  name: string
  position: string
  department: string
  deptId?: number
  grade?: string
  title?: string
  profileImageUrl?: string | null
  /**
   * 결재선 묶음(병렬 그룹) 단계.
   * 같은 lineStep 끼리는 병렬합의, 다른 step 사이는 순차합의.
   * 결재자(approvers)에서만 의미가 있고, 참조/열람자에는 사용하지 않음.
   */
  lineStep?: number
}
