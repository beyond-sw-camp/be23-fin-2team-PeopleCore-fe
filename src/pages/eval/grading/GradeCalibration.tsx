import { useState, useMemo, useEffect } from 'react'
import { defaultRules } from '../design/evaluationRulesData'
import { useActiveSeasons } from '../../../stores/seasonsStore'
import Pagination from '../../../components/Pagination'

const PAGE_SIZE = 10
type SortKey = 'id' | 'name' | 'dept' | 'totalScore' | 'autoGrade' | 'adjustedGrade'
type SortDir = 'asc' | 'desc'

interface CalibrationRecord {
  id: string
  name: string
  dept: string
  rank: string
  totalScore: number | null
  autoGrade: string | null
  adjustedGrade: string
  reason: string
  adjustedAt: string | null
}

const initialData: CalibrationRecord[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', totalScore: 90.4, autoGrade: 'S', adjustedGrade: 'S', reason: '', adjustedAt: null },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', totalScore: 82.4, autoGrade: 'A', adjustedGrade: 'A', reason: '', adjustedAt: null },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', totalScore: 88.0, autoGrade: 'A', adjustedGrade: 'S', reason: '팀 리더십 및 조직 기여도 우수. 하반기 MSA 전환 프로젝트를 성공적으로 리드하여 상향 조정.', adjustedAt: '2024-06-25' },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', totalScore: 88.4, autoGrade: 'A', adjustedGrade: 'A', reason: '', adjustedAt: null },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', totalScore: 80.0, autoGrade: 'B', adjustedGrade: 'B', reason: '', adjustedAt: null },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', totalScore: 75.2, autoGrade: 'B', adjustedGrade: 'B', reason: '', adjustedAt: null },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', totalScore: 65.0, autoGrade: 'C', adjustedGrade: 'C', reason: '', adjustedAt: null },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', totalScore: 58.0, autoGrade: 'C', adjustedGrade: '', reason: '', adjustedAt: null },
]


function computeSlots(total: number, grades: typeof defaultRules.grades) {
  if (total <= 0) return Object.fromEntries(grades.map(g => [g.label, 0]))
  const slots: Record<string, number> = {}
  let remaining = total
  const lastIdx = grades.length - 1
  grades.forEach((g, i) => {
    if (i === lastIdx) {
      slots[g.label] = Math.max(0, remaining)
    } else {
      const v = Math.round(total * g.ratio / 100)
      slots[g.label] = v
      remaining -= v
    }
  })
  return slots
}

export default function GradeCalibration() {
  const seasons = useActiveSeasons()
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.name ?? '')
  const [records, setRecords] = useState<CalibrationRecord[]>(initialData)

  const rules = defaultRules
  const grades = rules.grades

  // 등급 변경 사유 모달 (교환 개념 제거 — 개별 변경만)
  const [reasonModal, setReasonModal] = useState<{
    recordId: string
    recordName: string
    fromGrade: string
    toGrade: string
    reason: string
  } | null>(null)

  const gradeColorStyle = (label: string) => {
    const g = grades.find(x => x.label === label)
    return g ? { backgroundColor: `${g.color}1A`, color: g.color } : { backgroundColor: '#f5f5f5', color: '#8a9490' }
  }

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    grades.forEach(g => (counts[g.label] = 0))
    records.forEach(r => {
      const g = r.adjustedGrade || r.autoGrade || ''
      if (g in counts) counts[g]++
    })
    return counts
  }, [records, grades])

  const adjustedCount = records.filter(r => r.adjustedGrade && r.adjustedGrade !== r.autoGrade).length
  const slots = useMemo(() => computeSlots(records.length, grades), [records.length, grades])

  // 검색·정렬·페이지
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('전체')
  const [sortKey, setSortKey] = useState<SortKey>('totalScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const gradeOrder = useMemo(() => {
    const m: Record<string, number> = {}
    grades.forEach((g, i) => { m[g.label] = i })
    return m
  }, [grades])

  const depts = useMemo(
    () => ['전체', ...Array.from(new Set(records.map(r => r.dept)))],
    [records],
  )

  const filteredSorted = useMemo(() => {
    const filtered = records.filter(r => {
      if (deptFilter !== '전체' && r.dept !== deptFilter) return false
      if (search && !r.name.includes(search) && !r.id.includes(search)) return false
      return true
    })
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'id') cmp = a.id.localeCompare(b.id)
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'dept') cmp = a.dept.localeCompare(b.dept)
      else if (sortKey === 'totalScore') cmp = (a.totalScore ?? -Infinity) - (b.totalScore ?? -Infinity)
      else if (sortKey === 'autoGrade') {
        const ao = a.autoGrade ? gradeOrder[a.autoGrade] ?? 999 : 999
        const bo = b.autoGrade ? gradeOrder[b.autoGrade] ?? 999 : 999
        cmp = ao - bo
      }
      else if (sortKey === 'adjustedGrade') {
        const ao = a.adjustedGrade ? gradeOrder[a.adjustedGrade] ?? 999 : 999
        const bo = b.adjustedGrade ? gradeOrder[b.adjustedGrade] ?? 999 : 999
        cmp = ao - bo
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [records, search, deptFilter, sortKey, sortDir, gradeOrder])

  useEffect(() => { setPage(1) }, [search, deptFilter, sortKey, sortDir])

  const paged = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-gray-300 ml-1">⇅</span>
    return <span className="text-[#1D9E75] ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  // 저장 시 쿼터 준수 여부 판정 (한 등급이라도 목표와 다르면 불일치)
  const ratioViolations = useMemo(() => {
    return grades.filter(g => gradeCounts[g.label] !== slots[g.label])
  }, [grades, gradeCounts, slots])
  const ratioOk = ratioViolations.length === 0

  const handleGradeChange = (record: CalibrationRecord, newGrade: string) => {
    // 빈 값 또는 자동등급과 동일하면 보정 취소
    if (newGrade === '' || newGrade === record.autoGrade) {
      setRecords(records.map(r => r.id === record.id
        ? { ...r, adjustedGrade: newGrade, reason: '', adjustedAt: null }
        : r
      ))
      return
    }

    // 개별 변경 — 사유 모달만 띄움 (교환 대상 선택 없음)
    setReasonModal({
      recordId: record.id,
      recordName: record.name,
      fromGrade: record.adjustedGrade || record.autoGrade || '',
      toGrade: newGrade,
      reason: '',
    })
  }

  const handleReasonConfirm = () => {
    if (!reasonModal || !reasonModal.reason.trim()) return
    const today = new Date().toISOString().split('T')[0]
    setRecords(records.map(r =>
      r.id === reasonModal.recordId
        ? { ...r, adjustedGrade: reasonModal.toGrade, reason: reasonModal.reason, adjustedAt: today }
        : r
    ))
    setReasonModal(null)
  }

  const handleSave = () => {
    if (!ratioOk) {
      const msg = ratioViolations
        .map(g => `${g.label}: ${gradeCounts[g.label]}명 (목표 ${slots[g.label]}명)`)
        .join('\n')
      alert(`등급 비율이 목표와 맞지 않습니다:\n\n${msg}\n\n비율을 조정한 뒤 저장해주세요.`)
      return
    }
    alert('보정이 저장되었습니다.')
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 등급 &gt; 등급 보정</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">등급 보정 (Calibration)</h1>
          <p className="text-[13px] text-[#8a9490]">자동 산정된 등급을 자유롭게 개별 보정합니다. 최종 저장 시 등급별 목표 비율과 일치해야 합니다.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]">
            {seasons.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <button
            onClick={handleSave}
            className={`border-none rounded-lg px-4 py-2.5 text-[13px] font-medium text-white transition-colors ${
              ratioOk ? 'bg-[#1D9E75] hover:bg-[#0F6E56] cursor-pointer' : 'bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer'
            }`}
          >
            {ratioOk ? '보정 저장' : '비율 확인 필요'}
          </button>
        </div>
      </div>

      {/* 실제 vs 목표 분포 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-semibold text-[#1a2b23]">실제 vs 목표 분포</div>
            <div className="text-[11px] text-[#8a9490] mt-0.5">최종 저장 시 목표 인원과 정확히 일치해야 합니다. 전체 {records.length}명</div>
          </div>
          <span className={`text-[12px] px-3 py-1 rounded-full font-semibold ${
            ratioOk ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef3cd] text-[#f59e0b]'
          }`}>
            {ratioOk ? '쿼터 일치 ✓' : `${ratioViolations.length}개 등급 불일치`}
          </span>
        </div>
        <div className="flex gap-3">
          {grades.map(g => {
            const actual = gradeCounts[g.label]
            const slot = slots[g.label]
            const diff = actual - slot
            return (
              <div
                key={g.id}
                className={`flex-1 p-3 rounded-xl border ${
                  diff > 0 ? 'border-red-200 bg-red-50' :
                  diff < 0 ? 'border-amber-200 bg-amber-50' :
                  'border-gray-100'
                }`}
              >
                <div className="text-[18px] font-bold" style={{ color: g.color }}>{g.label}</div>
                <div className={`text-[20px] font-bold ${
                  diff > 0 ? 'text-red-600' : diff < 0 ? 'text-amber-700' : 'text-gray-800'
                }`}>
                  {actual}명
                </div>
                <div className="text-[11px] text-gray-400">
                  목표 {slot}명 ({g.ratio}%)
                </div>
                {diff !== 0 && (
                  <div className={`text-[11px] mt-1 font-medium ${diff > 0 ? 'text-red-500' : 'text-amber-600'}`}>
                    {diff > 0 ? `+${diff}명 초과` : `${diff}명 부족`}
                  </div>
                )}
                {diff === 0 && (
                  <div className="text-[11px] mt-1 text-[#2e9e6e] font-medium">일치 ✓</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 테이블 */}
        <div className="col-span-8 space-y-3">
          {/* 검색·필터 */}
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
              onChange={e => setDeptFilter(e.target.value)}
              className="border border-[#e0e5e3] bg-white rounded-md px-3 py-2 text-[13px] focus:outline-none"
            >
              {depts.map(d => <option key={d}>{d}</option>)}
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
                <th onClick={() => handleSort('adjustedGrade')} className="text-center px-5 py-3 font-medium text-[#5a6b62] cursor-pointer select-none hover:bg-[#f5f5f5]">
                  보정등급{sortIcon('adjustedGrade')}
                </th>
                <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">보정사유</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-[13px]">검색 결과가 없습니다.</td></tr>
              )}
              {paged.map(r => {
                const isAdjusted = !!r.adjustedGrade && r.adjustedGrade !== r.autoGrade
                return (
                  <tr key={r.id} className={`border-b border-[#f0f2f1] transition-colors ${isAdjusted ? 'bg-[#eff6ff]' : 'hover:bg-[#fafbfa]'}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#1a2b23]">{r.name}</div>
                      <div className="text-[11px] text-[#8a9490]">{r.dept}</div>
                    </td>
                    <td className="px-5 py-3 text-[#5a6b62]">{r.rank}</td>
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
                        value={r.adjustedGrade}
                        onChange={e => handleGradeChange(r, e.target.value)}
                        className={`border rounded-md px-2 py-1 text-[12px] cursor-pointer ${
                          isAdjusted ? 'border-[#3b82f6] bg-white font-medium' : 'border-[#e0e5e3]'
                        }`}
                      >
                        <option value="">선택</option>
                        {grades.map(g => <option key={g.id} value={g.label}>{g.label}</option>)}
                      </select>
                      {isAdjusted && (
                        <div className="text-[10px] text-[#3b82f6] mt-0.5">{r.autoGrade} → {r.adjustedGrade}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isAdjusted ? (
                        <div>
                          <div className="text-[12px] text-[#1a2b23]">{r.reason}</div>
                          {r.adjustedAt && <div className="text-[10px] text-[#8a9490] mt-0.5">{r.adjustedAt}</div>}
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
            total={filteredSorted.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>

        {/* 우측: 현재 보정 건수 + 보정 이력 */}
        <div className="col-span-4 space-y-4">
          {/* 현재 보정 건수 */}
          <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#8a9490] mb-0.5">현재 보정 건수</div>
              <div className="text-[10px] text-[#b0b8b4]">저장 전까지 누적됩니다</div>
            </div>
            <div className="text-[28px] font-bold text-[#3b82f6]">
              {adjustedCount}<span className="text-[14px] text-[#8a9490] font-normal ml-1">건</span>
            </div>
          </div>

          {adjustedCount > 0 ? (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-3">보정 이력</h3>
              <div className="space-y-3">
                {records.filter(r => r.adjustedGrade && r.adjustedGrade !== r.autoGrade).map(r => (
                  <div key={r.id} className="border border-[#e0e5e3] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-[#1a2b23]">{r.name}</span>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded font-medium" style={gradeColorStyle(r.autoGrade!)}>{r.autoGrade}</span>
                        <span className="text-[#8a9490]">→</span>
                        <span className="px-1.5 py-0.5 rounded font-medium" style={gradeColorStyle(r.adjustedGrade)}>{r.adjustedGrade}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#5a6b62]">{r.reason}</div>
                    {r.adjustedAt && <div className="text-[10px] text-[#8a9490] mt-1">{r.adjustedAt}</div>}
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

      {/* 사유 입력 모달 (교환 제거) */}
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
              <textarea
                value={reasonModal.reason}
                onChange={e => setReasonModal({ ...reasonModal, reason: e.target.value })}
                className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none focus:border-[#1D9E75] focus:outline-none"
                rows={3}
                placeholder="등급을 변경하는 구체적인 사유를 입력하세요"
                autoFocus
              />
            </div>

            <div className="bg-[#fef3cd] border border-[#fde68a] rounded-lg p-3 mb-4 text-[11px] text-[#92400e]">
              보정 사유는 평가 이력에 영구 저장되며, 이의신청 시 근거 자료로 활용됩니다. 최종 저장 시 등급별 비율이 목표와 일치해야 합니다.
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
