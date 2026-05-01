import { useEffect, useMemo, useState } from 'react'
import {
  employeeApi,
  departmentApi,
  type EmployeeListItem,
  type DepartmentTreeResponse,
} from '../../../api/org'
import { empEvaluatorApi, type EmpEvaluatorMapping } from '../../../api/empEvaluator'
import { useSeasons, type Season } from '../../../stores/seasonsStore'

const flattenDeptNames = (tree: DepartmentTreeResponse[]): string[] => {
  const out: string[] = []
  const walk = (ns: DepartmentTreeResponse[]) => {
    for (const n of ns) {
      out.push(n.deptName)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(tree)
  return out
}

// 부서 트리에서 deptId → parentDeptId 맵 구축 (평가자 계층 검증용)
const buildDeptParentMap = (tree: DepartmentTreeResponse[]): Map<number, number | null> => {
  const map = new Map<number, number | null>()
  const walk = (ns: DepartmentTreeResponse[]) => {
    for (const n of ns) {
      map.set(n.id, n.parentDeptId)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(tree)
  return map
}

// deptId 의 자기 자신 + 모든 ancestor 부서 ID 집합 — 평가자가 이 안에 들어있어야 매핑 허용
const collectAncestorsOrSelf = (
  deptId: number | undefined,
  parentMap: Map<number, number | null>,
): Set<number> => {
  const set = new Set<number>()
  if (deptId === undefined) return set
  let cursor: number | null | undefined = deptId
  while (cursor !== undefined && cursor !== null && !set.has(cursor)) {
    set.add(cursor)
    cursor = parentMap.get(cursor) ?? null
  }
  return set
}

const isRetiredStatus = (status: string | undefined | null): boolean => {
  if (!status) return false
  const s = String(status).toUpperCase()
  if (s === 'RETIRED' || s === 'TERMINATED') return true
  if (status === '퇴사' || status === '퇴직') return true
  return false
}

type SortKey = 'name' | 'dept' | 'grade' | 'evaluator'

type ViewMode = 'current' | { kind: 'snapshot'; seasonId: number }

export default function EmpEvaluatorMapping() {
  const seasons = useSeasons()
  const [loading, setLoading] = useState(true)
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [allEmployees, setAllEmployees] = useState<EmployeeListItem[]>([])
  const [deptNames, setDeptNames] = useState<string[]>([])
  const [deptParentMap, setDeptParentMap] = useState<Map<number, number | null>>(new Map())
  const [rawMappings, setRawMappings] = useState<EmpEvaluatorMapping[]>([])
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  // 보기 모드 — 글로벌 편집 / 과거 시즌 박제 read-only
  const [viewMode, setViewMode] = useState<ViewMode>('current')
  const isCurrentMode = viewMode === 'current'

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('')
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false)
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('dept')
  const [sortAsc, setSortAsc] = useState(true)

  const [pickerOpen, setPickerOpen] = useState<
    | { mode: 'single'; empId: number }
    | { mode: 'bulk' }
    | null
  >(null)
  const [pickerSearch, setPickerSearch] = useState('')

  // 박제 조회 대상 — 완료된 시즌만 (진행 중 시즌은 "현시즌" 으로 통합)
  const closedSeasons = useMemo(
    () => [...seasons]
      .filter(s => s.status === '완료')
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [seasons],
  )

  // 현재 진행 중 시즌 — "현시즌" 라벨에 표시
  const openSeason = useMemo(
    () => seasons.find(s => s.status === '진행중') ?? null,
    [seasons],
  )

  // 진행 중 시즌이 있고 현시즌 모드면 → 박제 잠금 모드 (퇴사로 풀린 미지정 행만 재지정 가능)
  const isOpenLocked = isCurrentMode && openSeason !== null

  // 사원 + 부서 한 번만 로드
  useEffect(() => {
    setLoading(true)
    Promise.all([
      employeeApi.getList({ size: 10000 }),
      departmentApi.getTree(),
    ])
      .then(([{ data: empPage }, { data: tree }]) => {
        setAllEmployees(empPage.content)
        setDeptNames(flattenDeptNames(tree))
        setDeptParentMap(buildDeptParentMap(tree))
      })
      .catch(e => {
        console.error('[EmpEvaluatorMapping] 사원/부서 로드 실패', e)
        setError('데이터를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  // 보기 모드 변경 시 매핑 재로드
  useEffect(() => {
    setLoadingMappings(true)
    setError(null)
    setDirty(false)
    setSelectedEmpIds(new Set())

    if (viewMode === 'current') {
      empEvaluatorApi.getGlobal()
        .then(({ data }) => {
          setRawMappings(data.mappings)
          setSnapshotAt(null)
        })
        .catch(e => {
          console.error('[EmpEvaluatorMapping] 글로벌 매핑 로드 실패', e)
          setError('매핑을 불러오지 못했습니다.')
          setRawMappings([])
        })
        .finally(() => setLoadingMappings(false))
    } else {
      empEvaluatorApi.getSeasonSnapshot(viewMode.seasonId)
        .then(({ data }) => {
          if (data) {
            setRawMappings(data.mappings)
            setSnapshotAt(data.snapshotAt)
          } else {
            setRawMappings([])
            setSnapshotAt(null)
          }
        })
        .catch(e => {
          console.error('[EmpEvaluatorMapping] 박제 로드 실패', e)
          setError('박제 매핑을 불러오지 못했습니다.')
          setRawMappings([])
        })
        .finally(() => setLoadingMappings(false))
    }
  }, [viewMode])

  const empById = useMemo(() => {
    const m = new Map<number, EmployeeListItem>()
    for (const e of allEmployees) m.set(e.empId, e)
    return m
  }, [allEmployees])

  const mappingByEmp = useMemo(() => {
    const m = new Map<number, EmpEvaluatorMapping>()
    for (const x of rawMappings) m.set(x.empId, x)
    return m
  }, [rawMappings])

  // 평가 대상 사원
  //   - DRAFT/시즌 없음 (현시즌 모드): 활성 사원 전체 (HR이 매핑 작업 대상)
  //   - OPEN 시즌 (현시즌 모드, isOpenLocked): EvalGrade 박제 명단만 (그 시즌 평가 대상)
  //   - 박제 이력 모드: 박제 명단만 (퇴사자도 포함)
  const targetEmployees = useMemo(() => {
    if (isCurrentMode && !isOpenLocked) {
      return allEmployees.filter(e => !isRetiredStatus(e.empStatus))
    }
    // OPEN 시즌 또는 이력 모드 — 박제 명단(매핑된 사원)만
    const ids = new Set(rawMappings.map(m => m.empId))
    return allEmployees.filter(e => ids.has(e.empId))
  }, [allEmployees, rawMappings, isCurrentMode, isOpenLocked])

  const activeTargets = useMemo(
    () => targetEmployees.filter(e => !isRetiredStatus(e.empStatus)),
    [targetEmployees],
  )
  const retiredEvaluateesInSnapshot = useMemo(
    () => isCurrentMode
      ? []
      : targetEmployees.filter(e => isRetiredStatus(e.empStatus)),
    [targetEmployees, isCurrentMode],
  )

  // 카운트 — 매핑됨 / 평가 제외 / 미정
  const totalCount = activeTargets.length
  const mappedCount = activeTargets.filter(e => {
    const m = mappingByEmp.get(e.empId)
    return m && !m.excluded
  }).length
  const excludedCount = activeTargets.filter(e => {
    const m = mappingByEmp.get(e.empId)
    return m && m.excluded
  }).length
  const unmappedCount = totalCount - mappedCount - excludedCount  // 매핑/제외 결정 안 된 사원

  const visibleEmployees = useMemo(() => {
    const s = search.trim().toLowerCase()
    let list = targetEmployees.filter(e => {
      if (deptFilter && e.deptName !== deptFilter) return false
      if (showOnlyUnassigned && mappingByEmp.has(e.empId)) return false
      if (s) {
        return (
          e.empName.toLowerCase().includes(s) ||
          e.empNum?.toLowerCase().includes(s) ||
          e.deptName.toLowerCase().includes(s)
        )
      }
      return true
    })

    list = [...list].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      switch (sortKey) {
        case 'name': return a.empName.localeCompare(b.empName) * dir
        case 'dept': return (a.deptName.localeCompare(b.deptName) || a.empName.localeCompare(b.empName)) * dir
        case 'grade': return (a.gradeName.localeCompare(b.gradeName) || a.empName.localeCompare(b.empName)) * dir
        case 'evaluator': {
          const ma = mappingByEmp.get(a.empId)
          const mb = mappingByEmp.get(b.empId)
          const aev = ma && ma.evaluatorId != null ? empById.get(ma.evaluatorId)?.empName ?? '' : ''
          const bev = mb && mb.evaluatorId != null ? empById.get(mb.evaluatorId)?.empName ?? '' : ''
          return (aev.localeCompare(bev) || a.empName.localeCompare(b.empName)) * dir
        }
      }
    })
    return list
  }, [targetEmployees, search, deptFilter, showOnlyUnassigned, mappingByEmp, sortKey, sortAsc, empById])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(v => !v)
    else { setSortKey(k); setSortAsc(true) }
  }

  const toggleSelect = (empId: number) => {
    if (!isCurrentMode) return
    setSelectedEmpIds(prev => {
      const next = new Set(prev)
      if (next.has(empId)) next.delete(empId)
      else next.add(empId)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    if (!isCurrentMode) return
    const visibleIds = visibleEmployees.map(e => e.empId)
    setSelectedEmpIds(prev => {
      const allSelected = visibleIds.every(id => prev.has(id))
      const next = new Set(prev)
      if (allSelected) visibleIds.forEach(id => next.delete(id))
      else visibleIds.forEach(id => next.add(id))
      return next
    })
  }

  // 평가자 매핑 (excluded=false 로 자동 전환)
  const setLocalMapping = (empId: number, evaluatorId: number | null) => {
    if (!isCurrentMode) return
    setRawMappings(prev => {
      const idx = prev.findIndex(m => m.empId === empId)
      if (evaluatorId === null) {
        if (idx < 0) return prev
        return prev.filter(m => m.empId !== empId)
      }
      if (idx < 0) return [...prev, { empId, evaluatorId, excluded: false }]
      const next = [...prev]
      next[idx] = { ...next[idx], evaluatorId, excluded: false }
      return next
    })
    setDirty(true)
  }

  // 평가 제외 토글 (evaluator null + excluded=true)
  const setLocalExcluded = (empId: number) => {
    if (!isCurrentMode) return
    setRawMappings(prev => {
      const idx = prev.findIndex(m => m.empId === empId)
      if (idx < 0) return [...prev, { empId, evaluatorId: null, excluded: true }]
      const next = [...prev]
      next[idx] = { ...next[idx], evaluatorId: null, excluded: true }
      return next
    })
    setDirty(true)
  }

  const applyPick = (newEvaluatorId: number) => {
    if (!pickerOpen || !isCurrentMode) return
    if (pickerOpen.mode === 'single') {
      if (pickerOpen.empId === newEvaluatorId) {
        alert('본인을 본인의 평가자로 지정할 수 없습니다.')
        return
      }
      // OPEN 시즌 박제 잠금 모드 — 미지정 행 재지정은 즉시 PATCH (백엔드: EvalGrade.evaluator_id_snapshot update)
      if (isOpenLocked) {
        reassignSingle(pickerOpen.empId, newEvaluatorId)
        setPickerOpen(null)
        setPickerSearch('')
        return
      }
      setLocalMapping(pickerOpen.empId, newEvaluatorId)
    } else if (pickerOpen.mode === 'bulk') {
      setRawMappings(prev => {
        const map = new Map(prev.map(m => [m.empId, m]))
        selectedEmpIds.forEach(id => {
          if (id === newEvaluatorId) return
          const cur = map.get(id)
          map.set(id, cur
            ? { ...cur, evaluatorId: newEvaluatorId, excluded: false }
            : { empId: id, evaluatorId: newEvaluatorId, excluded: false })
        })
        return Array.from(map.values())
      })
      setDirty(true)
    }
    setPickerOpen(null)
    setPickerSearch('')
  }

  const clearBulk = () => {
    if (!isCurrentMode || selectedEmpIds.size === 0) return
    setRawMappings(prev => prev.filter(m => !selectedEmpIds.has(m.empId)))
    setDirty(true)
  }

  const save = async () => {
    if (!isCurrentMode) return
    setSaving(true)
    setError(null)
    try {
      const { data } = await empEvaluatorApi.updateGlobal(rawMappings)
      setRawMappings(data.mappings)
      setDirty(false)
      setSelectedEmpIds(new Set())
    } catch (e) {
      console.error('[EmpEvaluatorMapping] 저장 실패', e)
      setError('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const activeEmployees = useMemo(
    () => allEmployees.filter(e => !isRetiredStatus(e.empStatus)),
    [allEmployees],
  )

  // 피평가자 부서 + 상위 부서들의 deptId 집합 — 평가자는 이 안에 있어야 함
  //   single: 해당 사원의 ancestor-or-self
  //   bulk: 선택된 모든 사원의 ancestor-or-self 교집합 (모든 사원에게 동시 평가자가 될 수 있어야 함)
  const allowedEvaluatorDeptIds = useMemo<Set<number> | null>(() => {
    if (!pickerOpen) return null
    const collect = (empId: number) => {
      const e = empById.get(empId)
      return collectAncestorsOrSelf(e?.deptId, deptParentMap)
    }
    if (pickerOpen.mode === 'single') {
      return collect(pickerOpen.empId)
    }
    // bulk: 교집합
    const ids = Array.from(selectedEmpIds)
    if (ids.length === 0) return new Set<number>()
    let acc = collect(ids[0])
    for (let i = 1; i < ids.length; i++) {
      const next = collect(ids[i])
      acc = new Set(Array.from(acc).filter(d => next.has(d)))
      if (acc.size === 0) break
    }
    return acc
  }, [pickerOpen, selectedEmpIds, empById, deptParentMap])

  const pickerCandidates = useMemo(() => {
    if (!pickerOpen) return []
    const s = pickerSearch.trim().toLowerCase()
    const excludeId = pickerOpen.mode === 'single' ? pickerOpen.empId : null
    let list = activeEmployees.filter(e => e.empId !== excludeId)
    // 부서 계층 필터 — 같은 부서 또는 상위 부서만
    if (allowedEvaluatorDeptIds) {
      list = list.filter(e => allowedEvaluatorDeptIds.has(e.deptId))
    }
    if (s) {
      list = list.filter(e =>
        e.empName.toLowerCase().includes(s) ||
        e.deptName.toLowerCase().includes(s) ||
        e.empNum?.toLowerCase().includes(s),
      )
    }
    return list.slice(0, 50)
  }, [activeEmployees, pickerSearch, pickerOpen, allowedEvaluatorDeptIds])

  // 시즌 진행 중 미지정 행에 새 평가자 지정 (퇴사로 풀린 행만)
  const reassignSingle = async (empId: number, newEvaluatorId: number) => {
    setSaving(true)
    setError(null)
    try {
      await empEvaluatorApi.reassignDuringSeason(empId, newEvaluatorId)
      // 로컬 상태 갱신
      const ev = empById.get(newEvaluatorId)
      setRawMappings(prev => prev.map(m =>
        m.empId === empId ? { ...m, evaluatorId: newEvaluatorId, excluded: false } : m,
      ))
      // empById 미존재 시 fallback — 새로고침 권장 (보통 active 사원이라 존재함)
      if (!ev) console.warn('[reassignSingle] 새 평가자 사원 정보 없음', newEvaluatorId)
    } catch (e) {
      console.error('[EmpEvaluatorMapping] 재지정 실패', e)
      setError('재지정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400 text-[13px]">
        <i className="fa-solid fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  const allVisibleSelected =
    visibleEmployees.length > 0 &&
    visibleEmployees.every(e => selectedEmpIds.has(e.empId))
  const someVisibleSelected =
    !allVisibleSelected &&
    visibleEmployees.some(e => selectedEmpIds.has(e.empId))

  const sortIcon = (k: SortKey) => sortKey === k ? (sortAsc ? '▲' : '▼') : ''

  const snapshotSeason = viewMode !== 'current'
    ? seasons.find(s => s.id === (viewMode as { seasonId: number }).seasonId) ?? null
    : null

  return (
    <div className="space-y-5">
      {/* 안내 */}
      <div className="p-4 bg-[#f2faf6] border border-[#d4ecdd] rounded-lg text-[12px] text-gray-700">
        <div className="font-semibold text-[#1D9E75] mb-1">사원-평가자 매핑</div>
        시즌과 무관하게 회사 단위로 유지하는 매핑입니다. <b>시즌 OPEN 시점</b>에 자동으로 박제되어 그 시즌의 평가 대상자가 결정되며,
        시즌 진행 중 평가자 변경은 진행 중 시즌의 평가에도 즉시 반영됩니다.
        과거 시즌의 박제 매핑은 우측 상단 토글에서 조회할 수 있습니다.
      </div>

      {/* 시즌 드롭다운 — "현재 매핑" + 시즌별 박제 통합 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[12px] text-gray-500 font-medium">조회 대상</label>
          <select
            value={isCurrentMode ? 'current' : String((viewMode as { seasonId: number }).seasonId)}
            onChange={e => {
              const v = e.target.value
              if (v === 'current') setViewMode('current')
              else setViewMode({ kind: 'snapshot', seasonId: Number(v) })
            }}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-[12px] min-w-[320px]"
          >
            <option value="current">
              {openSeason
                ? `현시즌 — ${openSeason.name} (편집 가능)`
                : '현시즌 (편집 가능)'}
            </option>
            {closedSeasons.length > 0 && (
              <optgroup label="확정된 시즌 박제 (읽기 전용)">
                {closedSeasons.map((s: Season) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startDate} ~ {s.endDate})
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {isCurrentMode ? (
            <span className="text-[11px] text-[#1D9E75] flex items-center gap-1 font-medium">
              <i className="fa-solid fa-pen-to-square text-[10px]" />
              {openSeason
                ? '편집 모드 — 변경 시 진행 중 시즌의 평가에도 즉시 반영'
                : '편집 모드 — 다음 시즌 OPEN 시 이 매핑이 박제됩니다'}
            </span>
          ) : (
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <i className="fa-solid fa-lock text-[10px]" />
              읽기 전용 — {snapshotSeason?.name ?? '시즌 박제'}
              {snapshotAt && <span className="ml-1">· 박제 {new Date(snapshotAt).toLocaleString('ko-KR')}</span>}
            </span>
          )}
        </div>

        <div className="text-[12px] text-gray-600 flex items-center gap-3 flex-wrap">
          <span>
            평가 대상 <b className="text-gray-800">{totalCount}</b>명 ·
            매핑 <b className="text-[#1D9E75]">{mappedCount}</b>명 ·
            제외 <b className="text-gray-500">{excludedCount}</b>명 ·
            <span className={unmappedCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
              {' '}미정 <b>{unmappedCount}</b>명
            </span>
          </span>
          {isCurrentMode && unmappedCount > 0 && (
            <span className="text-[11px] text-red-600 font-medium">
              ⚠ 미정자 있음 — 시즌 OPEN 불가
            </span>
          )}
          {!isCurrentMode && retiredEvaluateesInSnapshot.length > 0 && (
            <span className="text-[11px] text-gray-500">
              · 시즌 중 피평가자 퇴사 <b className="text-gray-600">{retiredEvaluateesInSnapshot.length}명</b> (당시 평가 대상 제외)
            </span>
          )}
          {dirty && isCurrentMode && (
            <span className="text-[11px] text-amber-600 font-medium">● 저장되지 않은 변경사항</span>
          )}
        </div>
      </div>

      {/* OPEN 시즌 박제 잠금 안내 */}
      {isOpenLocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <i className="fa-solid fa-lock text-blue-500 text-[16px]" />
          <div>
            <div className="text-[13px] font-semibold text-blue-800">
              {openSeason?.name} 진행 중 — 평가자 박제 잠금
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              평가자가 퇴사로 풀린 미지정 행만 새 평가자 지정이 가능합니다. 일반 매핑 변경은 시즌 종료 후.
            </div>
          </div>
        </div>
      )}

      {/* 도구 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름 / 사번 / 부서 검색"
            className="border border-gray-200 rounded-md px-3 py-1.5 text-[12px] w-[220px]"
          />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-2 py-1.5 text-[12px]"
          >
            <option value="">전체 부서</option>
            {deptNames.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {isCurrentMode && (
            <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyUnassigned}
                onChange={e => setShowOnlyUnassigned(e.target.checked)}
                className="accent-[#1D9E75]"
              />
              미지정만 보기
            </label>
          )}

          {isCurrentMode && !isOpenLocked && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-gray-500">선택 {selectedEmpIds.size}명</span>
              <button
                onClick={() => setPickerOpen({ mode: 'bulk' })}
                disabled={selectedEmpIds.size === 0}
                className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-md hover:opacity-90 disabled:opacity-40"
              >
                일괄 지정
              </button>
              <button
                onClick={clearBulk}
                disabled={selectedEmpIds.size === 0}
                className="px-3 py-1.5 text-[12px] text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
              >
                일괄 해제
              </button>
              <button
                onClick={() => setSelectedEmpIds(new Set())}
                disabled={selectedEmpIds.size === 0}
                className="px-3 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 disabled:opacity-40"
              >
                선택 초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loadingMappings ? (
          <div className="p-10 text-center text-[12px] text-gray-400">
            <i className="fa-solid fa-spinner fa-spin mr-2" /> 매핑 불러오는 중...
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className="p-10 text-center text-[12px] text-gray-400">
            {isCurrentMode ? '조건에 해당하는 사원이 없습니다.' : `이 시즌의 박제 매핑이 없습니다 (시즌 OPEN 시 자동 박제됩니다)${snapshotSeason ? `: ${snapshotSeason.name}` : ''}`}
          </div>
        ) : (
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-gray-500">
                  {isCurrentMode && !isOpenLocked && (
                    <th className="px-3 py-2 w-[36px] text-center">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={el => { if (el) el.indeterminate = someVisibleSelected }}
                        onChange={toggleSelectAllVisible}
                        className="accent-[#1D9E75]"
                      />
                    </th>
                  )}
                  <th className="px-3 py-2 w-[110px] text-left">사번</th>
                  <th className="px-3 py-2 text-left cursor-pointer hover:text-gray-700" onClick={() => toggleSort('name')}>
                    이름 {sortIcon('name')}
                  </th>
                  <th className="px-3 py-2 text-left cursor-pointer hover:text-gray-700" onClick={() => toggleSort('dept')}>
                    부서 {sortIcon('dept')}
                  </th>
                  <th className="px-3 py-2 text-left cursor-pointer hover:text-gray-700" onClick={() => toggleSort('grade')}>
                    직급 / 직책 {sortIcon('grade')}
                  </th>
                  <th className="px-3 py-2 text-left cursor-pointer hover:text-gray-700" onClick={() => toggleSort('evaluator')}>
                    평가자 {sortIcon('evaluator')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map(e => {
                  const mapping = mappingByEmp.get(e.empId)
                  const isExcluded = !!mapping?.excluded
                  const ev = mapping && !isExcluded && mapping.evaluatorId != null ? empById.get(mapping.evaluatorId) : undefined
                  const isSelected = selectedEmpIds.has(e.empId)
                  const isUnmapped = !mapping  // 매핑/제외 결정 안 된 상태 (미정)
                  const evaluatorRetired = !!(ev && isRetiredStatus(ev.empStatus))
                  const evaluateeRetired = isRetiredStatus(e.empStatus)

                  let rowBg = ''
                  if (evaluateeRetired) rowBg = 'bg-gray-50/80'
                  else if (isCurrentMode && isSelected) rowBg = 'bg-[#f1faf5]'
                  else if (isCurrentMode && isUnmapped) rowBg = 'bg-red-50/30'
                  else if (isCurrentMode && evaluatorRetired) rowBg = 'bg-amber-50/30'

                  return (
                    <tr key={e.empId} className={`border-t border-gray-100 ${rowBg} hover:bg-[#f8fbf9]`}>
                      {isCurrentMode && !isOpenLocked && (
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(e.empId)}
                            className="accent-[#1D9E75]"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{e.empNum}</td>
                      <td className="px-3 py-2 font-medium">
                        <span className={evaluateeRetired ? 'text-gray-400 line-through' : 'text-gray-800'}>
                          {e.empName}
                        </span>
                        {evaluateeRetired && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-medium">퇴사</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 ${evaluateeRetired ? 'text-gray-400' : 'text-gray-600'}`}>{e.deptName}</td>
                      <td className={`px-3 py-2 ${evaluateeRetired ? 'text-gray-400' : 'text-gray-600'}`}>
                        {e.gradeName}
                        {e.titleName && <span className="text-gray-400"> · {e.titleName}</span>}
                      </td>
                      <td className="px-3 py-2">
                        {evaluateeRetired ? (
                          <span className="text-[11px] text-gray-400">평가 대상 제외 (본인 퇴사)</span>
                        ) : isExcluded ? (
                          // 평가 제외된 행
                          isCurrentMode ? (
                            <div className="group flex items-center gap-2">
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-medium">
                                평가 제외
                              </span>
                              <button
                                onClick={() => setPickerOpen({ mode: 'single', empId: e.empId })}
                                className="opacity-0 group-hover:opacity-100 text-[11px] text-[#1D9E75] hover:underline transition-opacity"
                                title="평가자 지정으로 변경"
                              >
                                → 평가자 지정
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-medium">평가 제외</span>
                          )
                        ) : !mapping ? (
                          // 미정 — 매핑 없음 + 제외도 아님 (DRAFT/시즌 없음에서만 발생)
                          isCurrentMode && !isOpenLocked ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPickerOpen({ mode: 'single', empId: e.empId })}
                                className="text-[11px] text-[#1D9E75] hover:underline font-medium"
                              >
                                + 평가자 지정
                              </button>
                              <span className="text-[10px] text-gray-300">|</span>
                              <button
                                onClick={() => setLocalExcluded(e.empId)}
                                className="text-[11px] text-gray-500 hover:text-gray-700 hover:underline"
                              >
                                평가 제외
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">— 미지정</span>
                          )
                        ) : isOpenLocked ? (
                          // OPEN 시즌 박제 잠금 — 매핑된 행은 read-only, evaluatorId null 행만 재지정 가능
                          mapping.evaluatorId == null ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPickerOpen({ mode: 'single', empId: e.empId })}
                                className="text-[11px] text-amber-700 hover:underline font-semibold bg-amber-100 px-2 py-1 rounded"
                                title="평가자 퇴사로 풀린 미지정 행 — 새 평가자 지정"
                              >
                                ⚠ 평가자 지정 필요 (퇴사)
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <i className="fa-solid fa-user-check text-[10px] text-[#1D9E75]" />
                              <span className="text-gray-800">{ev?.empName ?? '—'}</span>
                              <span className="text-[10px] text-gray-400">{ev?.deptName ?? ''}</span>
                              <i className="fa-solid fa-lock text-[9px] text-gray-300 ml-1" title="시즌 진행 중 — 변경 불가" />
                            </div>
                          )
                        ) : isCurrentMode ? (
                          // 매핑됨 — 평가자 표시 + hover 시 해제 / 제외 토글
                          <div className="group flex items-center gap-2">
                            <button
                              onClick={() => setPickerOpen({ mode: 'single', empId: e.empId })}
                              className="flex items-center gap-2 text-left hover:text-[#1D9E75]"
                              title="클릭하여 변경"
                            >
                              <i className={`fa-solid fa-user-check text-[10px] ${evaluatorRetired ? 'text-gray-400' : 'text-[#1D9E75]'}`} />
                              <span className={evaluatorRetired ? 'text-gray-600 line-through' : 'text-gray-800'}>
                                {ev?.empName ?? '—'}
                              </span>
                              {evaluatorRetired && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">퇴사</span>
                              )}
                              <span className="text-[10px] text-gray-400">{ev?.deptName ?? ''}</span>
                            </button>
                            <button
                              onClick={() => setLocalExcluded(e.empId)}
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 hover:text-gray-600 transition-opacity"
                              title="평가 제외로 변경"
                            >
                              제외
                            </button>
                            <button
                              onClick={() => setLocalMapping(e.empId, null)}
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-300 hover:text-red-500 transition-opacity"
                              title="매핑 해제 (미정 상태로)"
                            >
                              <i className="fa-solid fa-xmark" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <i className={`fa-solid fa-user-check text-[10px] ${evaluatorRetired ? 'text-gray-400' : 'text-[#1D9E75]'}`} />
                            <span className={evaluatorRetired ? 'text-gray-600 line-through' : 'text-gray-700'}>
                              {ev?.empName ?? '—'}
                            </span>
                            {evaluatorRetired && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">퇴사</span>
                            )}
                            <span className="text-[10px] text-gray-400">{ev?.deptName ?? ''}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          <i className="fa-solid fa-triangle-exclamation mr-1.5" />
          {error}
        </div>
      )}

      {/* 저장 바 — DRAFT/시즌 없음 모드만 (OPEN 시즌 박제 잠금 시 숨김) */}
      {isCurrentMode && !isOpenLocked && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-[12px] text-gray-500">
            {dirty ? <span className="text-amber-600 font-medium">● 저장되지 않은 변경사항</span> : '저장됨'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLoadingMappings(true)
                empEvaluatorApi.getGlobal()
                  .then(({ data }) => { setRawMappings(data.mappings); setDirty(false) })
                  .finally(() => setLoadingMappings(false))
              }}
              disabled={!dirty || saving}
              className="px-4 py-2 text-[12px] text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
            >
              변경 취소
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="px-5 py-2 text-[12px] text-white bg-[#1D9E75] rounded-md hover:opacity-90 disabled:opacity-40"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 평가자 picker */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => { setPickerOpen(null); setPickerSearch('') }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[460px] max-h-[80vh] flex flex-col"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[14px] font-bold text-gray-800">
                {pickerOpen.mode === 'single' && `${empById.get(pickerOpen.empId)?.empName ?? '사원'} 의 평가자 선택`}
                {pickerOpen.mode === 'bulk' && `선택한 ${selectedEmpIds.size}명의 평가자 일괄 지정`}
              </h3>
            </div>
            <div className="px-5 py-3 border-b border-gray-100 space-y-2">
              <div className="text-[11px] text-gray-500 bg-[#f8faf9] border border-gray-100 rounded px-2.5 py-1.5">
                <i className="fa-solid fa-circle-info text-[10px] mr-1 text-[#1D9E75]" />
                평가자는 피평가자와 <b>같은 부서</b> 또는 <b>상위 부서</b> 소속만 지정 가능합니다.
              </div>
              <input
                autoFocus
                value={pickerSearch}
                onChange={ev => setPickerSearch(ev.target.value)}
                placeholder="이름 / 사번 / 부서로 검색"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[12px]"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {pickerCandidates.length === 0 ? (
                <div className="px-5 py-10 text-center text-[12px] text-gray-400">
                  {allowedEvaluatorDeptIds && allowedEvaluatorDeptIds.size === 0
                    ? '평가자 후보가 없습니다 — 선택된 사원들의 공통 상위 부서가 없습니다.'
                    : pickerSearch.trim()
                      ? '검색 결과 없음'
                      : '같은 부서 또는 상위 부서에 활성 사원이 없습니다.'}
                </div>
              ) : (
                pickerCandidates.map(e => (
                  <button
                    key={e.empId}
                    onClick={() => applyPick(e.empId)}
                    className="w-full flex items-center justify-between px-5 py-2.5 text-left hover:bg-[#f1faf5]"
                  >
                    <div>
                      <div className="text-[13px] text-gray-800">
                        {e.empName}
                        {e.titleName && <span className="text-gray-500 font-normal"> · {e.titleName}</span>}
                      </div>
                      <div className="text-[11px] text-gray-400">{e.deptName} · {e.empNum}</div>
                    </div>
                    <i className="fa-solid fa-arrow-right text-[10px] text-gray-300" />
                  </button>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => { setPickerOpen(null); setPickerSearch('') }}
                className="px-4 py-1.5 text-[12px] text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
