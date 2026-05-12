import { useState, useMemo, useEffect, useCallback } from 'react'
import { useActiveSeasons } from '../../../stores/seasonsStore'
import Pagination from '../../../components/Pagination'
import {
  fetchDistributionDiff,
  fetchCalibrationList,
  fetchCalibrations,
  batchSaveCalibration,
  fetchCalibrationReview,
  type DistributionDiffDto,
  type CalibrationListItemDto,
  type CalibrationHistoryDto,
  type CalibrationReview,
  type CalibrationItemRequest,
  type EvalGradeSortField,
} from '../../../api/evalGrade'
import { departmentApi, type DepartmentTreeResponse } from '../../../api/org'
import { useAuth } from '../../../contexts/AuthContext'

const PAGE_SIZE = 10
type SortKey = 'name' | 'totalScore' | 'autoGrade'
type SortDir = 'asc' | 'desc'

// 프론트 로컬 변경 추적용 (저장 전 누적)
interface LocalChange {
  gradeId: number
  empName: string
  fromGrade: string
  toGrade: string
  reason: string
}

export default function GradeCalibration() {
  const { user } = useAuth()
  const seasons = useActiveSeasons()
  const currentSeason = seasons.find(s => s.status === '진행중') ?? seasons[0]
  const currentSeasonName = currentSeason?.name ?? ''
  const seasonId = currentSeason?.id ?? null

  // ─── 백엔드 데이터 state ───
  const [distDiff, setDistDiff] = useState<DistributionDiffDto | null>(null)
  const [records, setRecords] = useState<CalibrationListItemDto[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [histories, setHistories] = useState<CalibrationHistoryDto[]>([])
  const [anomalies, setAnomalies] = useState<CalibrationReview | null>(null)
  const [loading, setLoading] = useState(false)

  // ─── 로컬 변경 추적 (저장 전까지 서버 미반영) ───
  const [localChanges, setLocalChanges] = useState<Map<number, LocalChange>>(new Map())

  // ─── 검색/필터/정렬/페이지 ───
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<number | ''>('')
  const [depts, setDepts] = useState<DepartmentTreeResponse[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('totalScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  // 부서 드롭다운 — 회사 전체 부서 (페이지 데이터에서 추출하면 페이지마다 옵션이 바뀜)
  useEffect(() => {
    departmentApi.getList()
      .then(r => setDepts(r.data))
      .catch(() => setDepts([]))
  }, [])

  // ─── 사유 모달 ───
  const [reasonModal, setReasonModal] = useState<{
    gradeId: number
    recordName: string
    fromGrade: string
    toGrade: string
    reason: string
  } | null>(null)

  // ─── sortField 매핑 ───
  const toSortField = (key: SortKey): EvalGradeSortField | undefined => {
    if (key === 'name') return 'EMP_NAME'
    if (key === 'totalScore') return 'TOTAL_SCORE'
    if (key === 'autoGrade') return 'AUTO_GRADE'
    return undefined
  }

  // ─── 데이터 로드 ───
  const loadData = useCallback(async () => {
    if (!seasonId) return
    setLoading(true)
    try {
      const [diff, listRes, histRes, anomRes] = await Promise.all([
        fetchDistributionDiff(seasonId),
        fetchCalibrationList(seasonId, {
          deptId: deptFilter === '' ? undefined : deptFilter,
          keyword: search || undefined,
          sortField: toSortField(sortKey),
          sortDirection: sortDir.toUpperCase() as 'ASC' | 'DESC',
          page: page - 1,
          size: PAGE_SIZE,
        }),
        fetchCalibrations(seasonId),
        fetchCalibrationReview(seasonId),
      ])
      setDistDiff(diff)
      setRecords(listRes.content)
      setTotalElements(listRes.totalElements)
      setHistories(histRes)
      setAnomalies(anomRes)
    } catch {
      // 에러 시 빈 상태 유지
    } finally {
      setLoading(false)
    }
  }, [seasonId, deptFilter, search, sortKey, sortDir, page])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { setPage(1) }, [search, deptFilter, sortKey, sortDir])

  // ─── 분포 카드 (로컬 변경 반영) ───
  const defaultGrades = [
    { label: 'S', color: '#2563EB', targetRatio: 10, targetCount: 0, actualCount: 0, diff: 0, status: 'MATCH' as const },
    { label: 'A', color: '#16A34A', targetRatio: 20, targetCount: 0, actualCount: 0, diff: 0, status: 'MATCH' as const },
    { label: 'B', color: '#CA8A04', targetRatio: 40, targetCount: 0, actualCount: 0, diff: 0, status: 'MATCH' as const },
    { label: 'C', color: '#EA580C', targetRatio: 20, targetCount: 0, actualCount: 0, diff: 0, status: 'MATCH' as const },
    { label: 'D', color: '#DC2626', targetRatio: 10, targetCount: 0, actualCount: 0, diff: 0, status: 'MATCH' as const },
  ]
  const liveGrades = useMemo(() => {
    if (!distDiff) return defaultGrades
    // 로컬 변경으로 actual 보정
    const adjustMap = new Map<string, number>()
    localChanges.forEach(c => {
      if (c.fromGrade !== c.toGrade) {
        adjustMap.set(c.fromGrade, (adjustMap.get(c.fromGrade) ?? 0) - 1)
        adjustMap.set(c.toGrade, (adjustMap.get(c.toGrade) ?? 0) + 1)
      }
    })
    return distDiff.grades.map(g => {
      const adj = adjustMap.get(g.label) ?? 0
      const actual = g.actualCount + adj
      const diff = actual - g.targetCount
      return { ...g, actualCount: actual, diff, status: diff === 0 ? 'MATCH' : diff > 0 ? 'OVER' : 'UNDER' }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distDiff, localChanges])

  // 저장 차단 정책: 상위 등급의 OVER만 차단. 마지막 등급은 잔여 흡수 역할이라 OVER 허용.
  // 부족(UNDER)은 자동 산정 시 동점자 상위 흡수로 자연 발생 → 전체 허용.
  const lastGradeIdx = liveGrades.length - 1
  const mismatchCount = liveGrades.filter((g, i) => g.status === 'OVER' && i !== lastGradeIdx).length
  const ratioOk = mismatchCount === 0
  const adjustedCount = (distDiff?.calibrationCount ?? 0) + localChanges.size

  // ─── 이상 팀 + clip 사원 ───
  const hasAnomaly = !!anomalies &&
    (anomalies.zeroStdDevTeams.length + anomalies.undersizedTeams.length + anomalies.clippedSelfEmployees.length) > 0

  const [collapsed, setCollapsed] = useState(true)

  // ─── 등급 변경 핸들러 ───
  const handleGradeChange = (record: CalibrationListItemDto, newGrade: string) => {
    const current = localChanges.get(record.gradeId)
    const fromGrade = current ? current.fromGrade : (record.adjustedGrade ?? record.autoGrade ?? '')

    if (newGrade === '' || newGrade === fromGrade) {
      // 원복 — 로컬 변경 제거
      const next = new Map(localChanges)
      next.delete(record.gradeId)
      setLocalChanges(next)
      return
    }

    setReasonModal({
      gradeId: record.gradeId,
      recordName: record.name,
      fromGrade: record.adjustedGrade ?? record.autoGrade ?? '',
      toGrade: newGrade,
      reason: current?.reason ?? '',
    })
  }

  const handleReasonConfirm = () => {
    if (!reasonModal || !reasonModal.reason.trim()) return
    const next = new Map(localChanges)
    next.set(reasonModal.gradeId, {
      gradeId: reasonModal.gradeId,
      empName: reasonModal.recordName,
      fromGrade: reasonModal.fromGrade,
      toGrade: reasonModal.toGrade,
      reason: reasonModal.reason,
    })
    setLocalChanges(next)
    setReasonModal(null)
  }

  // ─── 현재 표시 등급 (로컬 변경 반영) ───
  const getDisplayGrade = (r: CalibrationListItemDto) => {
    const local = localChanges.get(r.gradeId)
    return local ? local.toGrade : (r.adjustedGrade ?? r.autoGrade ?? '')
  }

  const isLocalChanged = (r: CalibrationListItemDto) => localChanges.has(r.gradeId)

  // ─── 저장 ───
  const handleSave = async () => {
    if (!seasonId) return
    if (localChanges.size === 0) return

    const items: CalibrationItemRequest[] = []
    localChanges.forEach(c => {
      items.push({ gradeId: c.gradeId, toGrade: c.toGrade, reason: c.reason })
    })

    try {
      const result = await batchSaveCalibration(seasonId, items)
      if (result.success) {
        alert(`보정 ${result.saveCount}건이 저장되었습니다.`)
        setLocalChanges(new Map())
        loadData()
      } else {
        const msgs = (result.currentDiff ?? [])
          .filter(d => d.status !== 'MATCH')
          .map(d => `${d.label}: ${d.actualCount}명 (기준 ${d.targetCount}명)`)
          .join('\n')
        alert(`등급 비율이 기준과 맞지 않습니다:\n\n${msgs}\n\n비율을 조정한 뒤 저장해주세요.`)
      }
    } catch {
      alert('저장에 실패했습니다.')
    }
  }

  // ─── 정렬 ───
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  const sortIcon = (key: SortKey) => {
    const active = sortKey === key
    return <span className={`ml-1 ${active ? 'text-[#1D9E75]' : 'text-gray-300'}`}>⇅</span>
  }

  const gradeColorStyle = (label: string) => {
    const g = liveGrades.find(x => x.label === label)
    return g ? { backgroundColor: `${g.color}1A`, color: g.color } : { backgroundColor: '#f5f5f5', color: '#8a9490' }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-[14px] text-[#8a9490]">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 등급 &gt; 등급 보정</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">등급 보정</h1>
          <p className="text-[13px] text-[#8a9490]">자동 산정된 등급을 자유롭게 개별 보정합니다. 상위 등급의 비율 초과만 차단되며, 최하위 등급(잔여 흡수)과 부족(UNDER)은 허용됩니다.</p>
        </div>
        <div className="flex gap-2">
          <div className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-[#f8faf9] text-[#1a2b23]">
            {currentSeasonName}
          </div>
          <button
            onClick={handleSave}
            disabled={localChanges.size === 0}
            className={`border-none rounded-lg px-4 py-2.5 text-[13px] font-medium text-white transition-colors ${
              localChanges.size > 0
                ? (ratioOk ? 'bg-[#1D9E75] hover:bg-[#0F6E56] cursor-pointer' : 'bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer')
                : 'bg-[#d0d8d4] cursor-not-allowed'
            }`}
          >
            {ratioOk ? '보정 저장' : '초과 등급 조정 필요'}
          </button>
        </div>
      </div>

      {/* 편향보정 상태 — 항상 표시 (접힌 형태 기본) */}
      {(() => {
        const processed = anomalies?.processedCount ?? 0
        const notRun = !anomalies || processed === 0

        if (notRun) {
          // 편향보정 예측내역이 없습니다.
          return (
            <div className={`mb-6 bg-white border rounded-lg ${collapsed ? 'border-gray-200' : 'border-gray-300'}`}>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#8a9490]">편향보정 예측내역이 없습니다.</span>
                </div>
                <span className="text-[12px] text-[#8a9490]">{collapsed ? '펼치기 ▾' : '접기 ▴'}</span>
              </button>
              {!collapsed && (
                <div className="px-4 pb-4 text-[12px] text-[#5a6b62]">
                  편향보정 예측내역이 없습니다.
                </div>
              )}
            </div>
          )
        }

        if (!hasAnomaly) {
          // 정상 완료
          return (
            <div className={`mb-6 bg-white border rounded-lg ${collapsed ? 'border-[#d4ecdd]' : 'border-[#2e9e6e]'}`}>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f2faf6]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#2e9e6e]">✓ 편향보정 정상 완료</span>
                  <span className="text-[11px] text-[#8a9490]">{processed}명 처리</span>
                </div>
                <span className="text-[12px] text-[#8a9490]">{collapsed ? '펼치기 ▾' : '접기 ▴'}</span>
              </button>
              {!collapsed && (
                <div className="px-4 pb-4 text-[12px] text-[#5a6b62]">
                  전체 {processed}명 편향보정 완료 · 이상 팀 없음
                </div>
              )}
            </div>
          )
        }

        // 이상 팀 있음
        return (
          <div className={`mb-6 bg-white border rounded-lg ${collapsed ? 'border-amber-200' : 'border-amber-300'}`}>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-amber-700">⚠️ 보정 참고사항</span>
                <span className="text-[11px] text-[#8a9490]">
                  {(() => {
                    const teamCnt = anomalies!.zeroStdDevTeams.length + anomalies!.undersizedTeams.length
                    const clipCnt = anomalies!.clippedSelfEmployees.length
                    const parts: string[] = []
                    if (teamCnt > 0) parts.push(`${teamCnt}개 팀`)
                    if (clipCnt > 0) parts.push(`자기평가 상한 초과 ${clipCnt}명`)
                    return `(${parts.join(', ')})`
                  })()}
                </span>
              </div>
              <span className="text-[12px] text-[#8a9490]">{collapsed ? '펼치기 ▾' : '접기 ▴'}</span>
            </button>
            {!collapsed && (
              <div className="px-4 pb-4 space-y-3">
                {/* 이상 팀 (보통 소수) */}
                {(anomalies!.zeroStdDevTeams.length + anomalies!.undersizedTeams.length) > 0 && (
                  <div className="space-y-1.5">
                    {anomalies!.zeroStdDevTeams.map(t => (
                      <div key={`z-${t.deptId}`} className="flex items-center gap-2 text-[12px]">
                        <span className="inline-block w-[60px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] text-center">동점</span>
                        <span className="text-[#1a2b23] font-medium">{t.deptName}</span>
                        <span className="text-[11px] text-[#8a9490]">· 전원 동점으로 보정 스킵 (원점수 유지)</span>
                      </div>
                    ))}
                    {anomalies!.undersizedTeams.map(t => (
                      <div key={`u-${t.deptId}`} className="flex items-center gap-2 text-[12px]">
                        <span className="inline-block w-[60px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] text-center">소규모</span>
                        <span className="text-[#1a2b23] font-medium">{t.deptName}</span>
                        <span className="text-[11px] text-[#8a9490]">· 팀 인원 부족으로 보정 스킵</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 자기평가 상한 초과 사원 — 다수 가능, 별도 sub-section 스크롤 */}
                {anomalies!.clippedSelfEmployees.length > 0 && (
                  <div className={(anomalies!.zeroStdDevTeams.length + anomalies!.undersizedTeams.length) > 0 ? 'pt-2.5 border-t border-amber-100' : ''}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[11px] font-semibold text-[#5a6b62]">
                        자기평가 상한 초과 사원
                        <span className="ml-1 text-[#8a9490] font-normal">({anomalies!.clippedSelfEmployees.length}명, 원점수 큰 순)</span>
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
                      {[...anomalies!.clippedSelfEmployees]
                        .sort((a, b) => b.rawSelfScore - a.rawSelfScore)
                        .map(c => (
                          <div key={`c-${c.empId}`} className="flex items-center gap-2 text-[12px]">
                            <span className="inline-block w-[60px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] text-center">상한</span>
                            <span className="text-[#1a2b23] font-medium">{c.empName}</span>
                            <span className="text-[11px] text-[#8a9490]">· {c.deptName} ·</span>
                            <span className="text-[12px] font-bold text-[#1a2b23] tabular-nums">{c.rawSelfScore}점</span>
                            {c.autoGrade && (
                              <span className="text-[11px] text-[#8a9490]">· 자동등급 {c.autoGrade}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* 실제 vs 목표 분포 카드 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-semibold text-[#1a2b23]">실제 vs 목표 분포</div>
            <div className="text-[11px] text-[#8a9490] mt-0.5">상위 등급의 초과는 저장이 차단됩니다. 최하위 등급의 초과는 허용됩니다. 부족은 허용됩니다.</div>
          </div>
          <span className={`text-[12px] px-3 py-1 rounded-full font-semibold ${
            ratioOk ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef3cd] text-[#f59e0b]'
          }`}>
            {ratioOk ? '저장 가능 ✓' : `초과 등급 ${mismatchCount}개`}
          </span>
        </div>
        <div className="flex gap-3">
          {liveGrades.map(g => (
            <div
              key={g.label}
              className={`flex-1 p-3 rounded-xl border ${
                g.diff > 0 ? 'border-red-200 bg-red-50' :
                g.diff < 0 ? 'border-amber-200 bg-amber-50' :
                'border-gray-100'
              }`}
            >
              <div className="text-[18px] font-bold" style={{ color: g.color }}>{g.label}</div>
              <div className={`text-[20px] font-bold ${
                g.diff > 0 ? 'text-red-600' : g.diff < 0 ? 'text-amber-700' : 'text-gray-800'
              }`}>
                {g.actualCount}명
              </div>
              <div className="text-[11px] text-gray-400">
                기준 {g.targetCount}명 ({g.targetRatio}%)
              </div>
              {g.diff !== 0 && (
                <div className={`text-[11px] mt-1 font-medium ${g.diff > 0 ? 'text-red-500' : 'text-amber-600'}`}>
                  {g.diff > 0 ? `+${g.diff}명 초과` : `${g.diff}명 부족`}
                </div>
              )}
              {g.diff === 0 && (
                <div className="text-[11px] mt-1 text-[#2e9e6e] font-medium">일치 ✓</div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-[#8a9490] leading-relaxed">
          · 상위 등급(S~C) 초과 시 저장이 차단됩니다. 최하위 등급(D)은 인원이 넘쳐도 허용됩니다.<br />
          · 부족(UNDER)은 동점자 처리 등으로 자연 발생할 수 있어 모든 등급에서 허용됩니다.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 테이블 */}
        <div className="col-span-8 space-y-3">
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border border-[#e0e5e3] bg-white rounded-md px-3 py-2 flex-1">
              <i className="fas fa-search text-gray-400 text-xs"></i>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="이름/사번 검색"
                className="flex-1 text-[13px] focus:outline-none"
              />
            </div>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value === '' ? '' : Number(e.target.value))}
              className="border border-[#e0e5e3] bg-white rounded-md px-3 py-2 text-[13px] focus:outline-none"
            >
              <option value="">전체 부서</option>
              {depts.map(d => (
                <option key={d.id} value={d.id}>{d.deptName}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9] flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-[#1a2b23]">등급 보정 테이블</h3>
              <span className="text-[11px] text-[#8a9490]">보정된 행은 강조 표시됩니다</span>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e0e5e3]">
                  <th onClick={() => handleSort('name')} className="text-left px-5 py-3 font-medium text-[#5a6b62] cursor-pointer select-none hover:bg-[#f5f5f5]">
                    성명/부서{sortIcon('name')}
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">직급</th>
                  <th onClick={() => handleSort('totalScore')} className="text-center px-5 py-3 font-medium text-[#5a6b62] cursor-pointer select-none hover:bg-[#f5f5f5]">
                    종합점수{sortIcon('totalScore')}
                  </th>
                  <th onClick={() => handleSort('autoGrade')} className="text-center px-5 py-3 font-medium text-[#5a6b62] cursor-pointer select-none hover:bg-[#f5f5f5]">
                    자동등급{sortIcon('autoGrade')}
                  </th>
                  <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">보정등급</th>
                  <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">보정사유</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-[13px]">검색 결과가 없습니다.</td></tr>
                )}
                {records.map(r => {
                  const displayGrade = getDisplayGrade(r)
                  const changed = isLocalChanged(r)
                  const isAdjusted = changed || r.calibrated
                  const localChange = localChanges.get(r.gradeId)
                  return (
                    <tr key={r.gradeId} className={`border-b border-[#f0f2f1] transition-colors ${isAdjusted ? 'bg-[#eff6ff]' : 'hover:bg-[#fafbfa]'}`}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#1a2b23]">{r.name}</div>
                        <div className="text-[11px] text-[#8a9490]">{r.deptName}</div>
                      </td>
                      <td className="px-5 py-3 text-[#5a6b62]">{r.position}</td>
                      <td className="px-5 py-3 text-center font-semibold text-[#1a2b23]">{r.totalScore ?? '—'}</td>
                      <td className="px-5 py-3 text-center">
                        {r.autoGrade && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={gradeColorStyle(r.autoGrade)}>
                            {r.autoGrade}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <select
                          value={displayGrade}
                          onChange={e => handleGradeChange(r, e.target.value)}
                          className={`border rounded-md px-2 py-1 text-[12px] cursor-pointer ${
                            isAdjusted ? 'border-[#3b82f6] bg-white font-medium' : 'border-[#e0e5e3]'
                          }`}
                        >
                          <option value="">선택</option>
                          {liveGrades.map(g => <option key={g.label} value={g.label}>{g.label}</option>)}
                        </select>
                        {isAdjusted && (
                          <div className="text-[10px] text-[#3b82f6] mt-0.5">{r.autoGrade} → {displayGrade}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {(localChange || r.reason) ? (
                          <div>
                            <div className="text-[12px] text-[#1a2b23]">{localChange?.reason ?? r.reason}</div>
                            {r.adjusterName && !localChange && <div className="text-[10px] text-[#8a9490] mt-0.5">{r.adjusterName}</div>}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#d0d8d4]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={totalElements}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>

        {/* 우측: 보정 건수 + 이력 */}
        <div className="col-span-4 space-y-4">
          <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#8a9490] mb-0.5">현재 보정 건수</div>
              <div className="text-[10px] text-[#b0b8b4]">저장 전까지 누적됩니다</div>
            </div>
            <div className="text-[28px] font-bold text-[#3b82f6]">
              {adjustedCount}<span className="text-[14px] text-[#8a9490] font-normal ml-1">건</span>
            </div>
          </div>

          {(histories.length > 0 || localChanges.size > 0) ? (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-3">보정 이력</h3>
              <div className="space-y-3">
                {/* 로컬 미저장 변경 (상단) */}
                {Array.from(localChanges.values()).map(c => {
                  return (
                    <div key={`local-${c.gradeId}`} className="border border-[#3b82f6] border-dashed rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium text-[#1a2b23]">{c.empName || '—'}</span>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded font-medium" style={gradeColorStyle(c.fromGrade)}>{c.fromGrade}</span>
                          <span className="text-[#8a9490]">→</span>
                          <span className="px-1.5 py-0.5 rounded font-medium" style={gradeColorStyle(c.toGrade)}>{c.toGrade}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#5a6b62]">{c.reason}</div>
                      <div className="text-[10px] text-[#3b82f6] mt-1">
                        {user?.empName && `${user.empName} · `}{new Date().toISOString().slice(0, 10)} · 미저장
                      </div>
                    </div>
                  )
                })}
                {/* 서버 이력 (건별) */}
                {histories.map(h => (
                  <div key={h.calibrationId} className="border border-[#e0e5e3] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-[#1a2b23]">{h.empName}</span>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded font-medium" style={gradeColorStyle(h.fromGrade)}>{h.fromGrade}</span>
                        <span className="text-[#8a9490]">→</span>
                        <span className="px-1.5 py-0.5 rounded font-medium" style={gradeColorStyle(h.toGrade)}>{h.toGrade}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#5a6b62]">{h.reason}</div>
                    <div className="text-[10px] text-[#8a9490] mt-1">
                      {h.adjusterName && `${h.adjusterName} · `}{h.createdAt?.split('T')[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-[#e0e5e3] rounded-lg p-8 text-center">
              <div className="text-[32px] mb-2">📋</div>
              <div className="text-[13px] text-[#8a9490]">아직 보정된 항목이 없습니다</div>
              <div className="text-[11px] text-[#b0b8b4] mt-1">좌측 테이블에서 보정등급을 변경하세요</div>
            </div>
          )}
        </div>
      </div>

      {/* 사유 입력 모달 */}
      {reasonModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px]">
            <h3 className="text-[18px] font-semibold text-[#1a2b23] mb-2">등급 보정</h3>
            <p className="text-[13px] text-[#8a9490] mb-4">
              <span className="font-medium text-[#1a2b23]">{reasonModal.recordName}</span>의 등급을 변경합니다.
            </p>
            <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-4">
                <span className="px-3 py-1 rounded text-[16px] font-bold" style={gradeColorStyle(reasonModal.fromGrade)}>
                  {reasonModal.fromGrade || '—'}
                </span>
                <span className="text-[20px] text-[#8a9490]">→</span>
                <span className="px-3 py-1 rounded text-[16px] font-bold" style={gradeColorStyle(reasonModal.toGrade)}>
                  {reasonModal.toGrade}
                </span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">
                보정 사유 <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={reasonModal.reason}
                  onChange={e => setReasonModal({ ...reasonModal, reason: e.target.value })}
                  maxLength={1000}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 pb-6 text-[13px] resize-none focus:border-[#1D9E75] focus:outline-none"
                  rows={3}
                  placeholder="등급을 변경하는 구체적인 사유를 입력하세요"
                  autoFocus
                />
                <span className="absolute bottom-2 right-3 text-[11px] text-[#8a9490] pointer-events-none">
                  {reasonModal.reason.length}/1000
                </span>
              </div>
            </div>
            <div className="bg-[#fef3cd] border border-[#fde68a] rounded-lg p-3 mb-4 text-[11px] text-[#92400e]">
              보정 사유는 평가 이력에 영구 저장되며, 이의신청 시 근거 자료로 활용됩니다.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReasonModal(null)}
                className="flex-1 border border-[#e0e5e3] bg-white rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
              >
                취소
              </button>
              <button
                onClick={handleReasonConfirm}
                disabled={!reasonModal.reason.trim()}
                className={`flex-1 text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors ${
                  reasonModal.reason.trim()
                    ? 'bg-[#1D9E75] hover:bg-[#0F6E56]'
                    : 'bg-[#d0d8d4] cursor-not-allowed'
                }`}
              >
                보정 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
