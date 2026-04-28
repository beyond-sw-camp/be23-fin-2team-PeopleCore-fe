import { useState, useEffect, useMemo } from 'react'
import { departmentApi, type DepartmentTreeResponse } from '../../api/org'
import {
  fetchKpiOptionBundle,
  saveKpiOptionBundle,
  resetKpiOptionBundle,
  type KpiOptionBundle,
  type KpiOptionItem,
} from '../../api/kpiOption'

// 부서 트리 depth 선택값 — 1..N 또는 'leaf'
type DepartmentLevel = number | 'leaf'

// 부서 코드+라벨 (해소된 결과 표시용)
interface CodeOption {
  code: string
  label: string
}

// 트리에서 최대 depth 계산 (루트 = 1)
function computeMaxDepth(tree: DepartmentTreeResponse[]): number {
  let max = 0
  const walk = (nodes: DepartmentTreeResponse[], depth: number) => {
    for (const n of nodes) {
      if (depth > max) max = depth
      if (n.children?.length) walk(n.children, depth + 1)
    }
  }
  walk(tree, 1)
  return max
}

// targetDepth까지 파고들었을 때 "끝나버린 가지"들만 반환.
// = depth === targetDepth 노드 + depth < targetDepth인 리프 노드
function getDeptsAtDepth(tree: DepartmentTreeResponse[], targetDepth: number): DepartmentTreeResponse[] {
  const result: DepartmentTreeResponse[] = []
  const walk = (nodes: DepartmentTreeResponse[], depth: number) => {
    for (const n of nodes) {
      const isLeaf = !n.children?.length
      if (depth === targetDepth) {
        result.push(n)
      } else if (depth < targetDepth && isLeaf) {
        result.push(n)
      } else if (!isLeaf && depth < targetDepth) {
        walk(n.children!, depth + 1)
      }
    }
  }
  walk(tree, 1)
  return result
}

// 리프(하위 없는) 부서들만 평탄화
function getLeafDepts(tree: DepartmentTreeResponse[]): DepartmentTreeResponse[] {
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

function resolveDepartments(
  tree: DepartmentTreeResponse[],
  level: DepartmentLevel,
): CodeOption[] {
  const list = level === 'leaf' ? getLeafDepts(tree) : getDeptsAtDepth(tree, level)
  return list.map(d => ({ code: String(d.id), label: d.deptName }))
}

interface DepartmentSectionProps {
  title: string
  level: DepartmentLevel
  onLevelChange: (next: DepartmentLevel) => void
}

function isNodeSelected(
  node: DepartmentTreeResponse,
  depth: number,
  level: DepartmentLevel,
): boolean {
  const isLeaf = !node.children?.length
  if (level === 'leaf') return isLeaf
  // A안: depth === N  또는  (depth < N && 리프)
  if (depth === level) return true
  if (depth < level && isLeaf) return true
  return false
}

function TreeNode({
  node,
  depth,
  level,
  isLast,
  parentLines,
}: {
  node: DepartmentTreeResponse
  depth: number
  level: DepartmentLevel
  isLast: boolean
  parentLines: boolean[]
}) {
  const selected = isNodeSelected(node, depth, level)
  const hasChildren = !!node.children?.length

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded text-[12px] font-mono ${
          selected ? 'bg-[#E1F5EE] text-[#1D9E75] font-semibold' : 'text-gray-400'
        }`}
      >
        {parentLines.map((show, i) => (
          <span key={i} className="w-4 text-gray-200 select-none text-center">{show ? '│' : ''}</span>
        ))}
        {depth > 1 && (
          <span className="w-4 text-gray-200 select-none text-center">{isLast ? '└' : '├'}</span>
        )}
        <i className={`fa-solid ${hasChildren ? 'fa-folder' : 'fa-file'} text-[10px] ${selected ? 'text-[#1D9E75]' : 'text-gray-300'}`} />
        <span className="ml-1 font-sans">{node.deptName}</span>
        {selected && (
          <span className="ml-auto text-[10px] bg-[#1D9E75] text-white rounded px-1.5 py-0.5 font-sans">선택됨</span>
        )}
        <span className={`${selected ? 'ml-2' : 'ml-auto'} text-[10px] text-gray-300 font-sans`}>L{depth}</span>
      </div>
      {hasChildren && node.children!.map((child, i) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          level={level}
          isLast={i === node.children!.length - 1}
          parentLines={[...parentLines, !isLast]}
        />
      ))}
    </div>
  )
}

function DepartmentLevelSection({ title, level, onLevelChange }: DepartmentSectionProps) {
  const [tree, setTree] = useState<DepartmentTreeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    departmentApi.getTree()
      .then(({ data }) => { setTree(data); setError(null) })
      .catch(() => setError('조직도를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const maxDepth = useMemo(() => computeMaxDepth(tree), [tree])
  const resolved = useMemo(() => resolveDepartments(tree, level), [tree, level])

  const intermediateLevels = maxDepth > 1
    ? Array.from({ length: maxDepth - 1 }, (_, i) => i + 1)
    : []

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-gray-800">{title}</h3>
        <span className="text-[11px] text-gray-400">선택된 부서 <span className="text-[#1D9E75] font-semibold">{resolved.length}</span>개</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        조직도의 어느 깊이 부서를 KPI 적용 단위로 쓸지 선택합니다. N단계는 해당 깊이 + 그보다 얕은 단계에서 하위 없이 끝난 부서까지 포함합니다.
      </p>

      {loading ? (
        <div className="text-[12px] text-gray-400 py-4 text-center">조직도 불러오는 중...</div>
      ) : error ? (
        <div className="text-[12px] text-red-500 py-4 text-center">{error}</div>
      ) : maxDepth === 0 ? (
        <div className="text-[12px] text-gray-400 py-4 text-center">등록된 부서가 없습니다.</div>
      ) : (
        <>
          {/* 상단: 단계 스텝퍼 */}
          <div className="flex items-start mb-4 px-2">
            {[
              ...intermediateLevels.map(n => ({
                key: `L${n}`,
                selected: level === n,
                label: n === 1 ? '최상위' : `${n}단계`,
                count: getDeptsAtDepth(tree, n).length,
                content: <span className="text-[12px] font-bold">{n}</span>,
                onClick: () => onLevelChange(n),
              })),
              {
                key: 'leaf',
                selected: level === 'leaf',
                label: '최하위',
                count: getLeafDepts(tree).length,
                content: <i className="fa-solid fa-leaf text-[11px]" />,
                onClick: () => onLevelChange('leaf'),
              },
            ].map((step, i, arr) => (
              <div key={step.key} className={`flex items-start ${i < arr.length - 1 ? 'flex-1' : 'shrink-0'}`}>
                <button onClick={step.onClick} className="flex flex-col items-center gap-1 group shrink-0 w-14">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.selected
                        ? 'bg-[#1D9E75] text-white border-[#1D9E75] shadow-sm'
                        : 'bg-white text-gray-400 border-gray-200 group-hover:border-[#1D9E75] group-hover:text-[#1D9E75]'
                    }`}
                  >
                    {step.content}
                  </div>
                  <span className={`text-[11px] ${step.selected ? 'text-[#1D9E75] font-semibold' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-gray-300">{step.count}개</span>
                </button>
                {i < arr.length - 1 && (
                  <div className="h-[2px] flex-1 bg-gray-200 mt-[15px]" />
                )}
              </div>
            ))}
          </div>

          {/* 조직도 트리 */}
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-[360px] overflow-y-auto">
            {tree.map((root, i) => (
              <TreeNode
                key={root.id}
                node={root}
                depth={1}
                level={level}
                isLast={i === tree.length - 1}
                parentLines={[]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface SectionSimpleProps {
  title: string
  description: string
  items: KpiOptionItem[]
  onChange: (next: KpiOptionItem[]) => void
  placeholder?: string
}

function SectionSimple({ title, description, items, onChange, placeholder }: SectionSimpleProps) {
  const handleUpdate = (idx: number, label: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, label } : it)))
  }
  const handleRemove = (idx: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== idx))
  }
  const handleAdd = () => onChange([...items, { id: null, label: '' }])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-gray-800">{title}</h3>
        <span className="text-[11px] text-gray-400">총 {items.length}개</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">{description}</p>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">항목명</th>
              <th className="px-3 py-2 text-center w-16">삭제</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id ?? `new-${i}`} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    value={it.label}
                    onChange={e => handleUpdate(i, e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px]"
                    placeholder={placeholder ?? '항목명'}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleRemove(i)}
                    disabled={items.length <= 1}
                    className="text-[#ef4444] hover:underline disabled:text-gray-300 disabled:no-underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">항목이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAdd}
        className="mt-3 px-3 py-1.5 border border-dashed border-[#1D9E75] text-[#1D9E75] rounded-md text-[12px] hover:bg-[#f2faf6]"
      >
        + 항목 추가
      </button>
    </div>
  )
}

export default function KpiOptionManagement() {
  const [bundle, setBundle] = useState<KpiOptionBundle | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 최초 로드
  useEffect(() => {
    fetchKpiOptionBundle()
      .then(b => { setBundle(b); setError(null) })
      .catch(e => {
        console.error('[KpiOptionManagement] fetch failed', e)
        setError(e?.response?.data?.message || 'KPI 옵션을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (patch: Partial<KpiOptionBundle>) => {
    setBundle(b => (b ? { ...b, ...patch } : b))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!bundle) return
    const cleaned: KpiOptionBundle = {
      categories: bundle.categories.filter(c => c.label.trim()),
      units: bundle.units.filter(u => u.label.trim()),
      departmentLevel: bundle.departmentLevel,
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await saveKpiOptionBundle(cleaned)
      setBundle(saved)
      setDirty(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[KpiOptionManagement] save failed', e)
      setError(e?.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    setError(null)
    try {
      const reset = await resetKpiOptionBundle()
      setBundle(reset)
      setDirty(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[KpiOptionManagement] reset failed', e)
      setError(e?.response?.data?.message || '복원에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const departmentLevelForUI: DepartmentLevel = bundle
    ? (bundle.departmentLevel === 'leaf' ? 'leaf' : Number(bundle.departmentLevel))
    : 'leaf'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">KPI 옵션 관리</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">KPI 옵션 관리</h1>
        <p className="text-xs text-gray-400 mt-1">
          평가 시스템에서 공용으로 사용하는 드롭다운 항목(카테고리·부서·단위)을 관리합니다.
          변경 내용은 KPI 지표 등록 화면에 즉시 반영됩니다.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {loading || !bundle ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-[13px] text-gray-400">
          <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
        </div>
      ) : (
        <>
          <div className="space-y-5">
            <SectionSimple
              title="① 카테고리"
              description="KPI 지표 분류 (예: 업무성과, 역량개발, 조직기여)"
              items={bundle.categories}
              onChange={v => update({ categories: v })}
              placeholder="예: 업무성과"
            />

            <DepartmentLevelSection
              title="② 적용 부서"
              level={departmentLevelForUI}
              onLevelChange={v => update({ departmentLevel: v === 'leaf' ? 'leaf' : String(v) })}
            />

            <SectionSimple
              title="③ 측정 단위"
              description="KPI 목표값의 단위 (예: %, 건, 원, 시간)"
              items={bundle.units}
              onChange={v => update({ units: v })}
              placeholder="예: %"
            />
          </div>

          {/* 저장 바 */}
          <div className="sticky bottom-0 mt-6 bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div className="text-[12px] text-gray-500">
              {dirty
                ? <span className="text-[#f59e0b] font-medium">● 저장되지 않은 변경사항</span>
                : '저장됨'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 border border-gray-200 rounded-md text-[12px] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                기본값 복원
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className={`px-4 py-2 rounded-md text-[12px] font-medium text-white ${
                  dirty && !saving ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
