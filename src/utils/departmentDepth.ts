import type { DepartmentTreeResponse } from '../api/org'

export type DepartmentLevel = number | 'leaf'

// targetDepth 까지 파고들었을 때 끝나는 가지들만 반환
// = depth === targetDepth 노드 + depth < targetDepth 인 리프 노드
export function getDeptsAtDepth(
  tree: DepartmentTreeResponse[],
  targetDepth: number,
): DepartmentTreeResponse[] {
  const result: DepartmentTreeResponse[] = []
  const walk = (nodes: DepartmentTreeResponse[], depth: number) => {
    for (const n of nodes) {
      const isLeaf = !n.children?.length
      if (depth === targetDepth) result.push(n)
      else if (depth < targetDepth && isLeaf) result.push(n)
      else if (!isLeaf && depth < targetDepth) walk(n.children!, depth + 1)
    }
  }
  walk(tree, 1)
  return result
}

export function getLeafDepts(tree: DepartmentTreeResponse[]): DepartmentTreeResponse[] {
  const result: DepartmentTreeResponse[] = []
  const walk = (nodes: DepartmentTreeResponse[]) => {
    for (const n of nodes) {
      if (!n.children?.length) result.push(n)
      else walk(n.children)
    }
  }
  walk(tree)
  return result
}

// "1".."N" 또는 "leaf" 문자열 → 부서 평탄 리스트
export function flattenByLevel(
  tree: DepartmentTreeResponse[],
  level: string,
): DepartmentTreeResponse[] {
  if (level === 'leaf') return getLeafDepts(tree)
  const n = Number(level)
  return Number.isFinite(n) && n >= 1 ? getDeptsAtDepth(tree, n) : []
}
