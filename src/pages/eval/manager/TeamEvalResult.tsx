import { useState, useMemo } from 'react'

// ─── 타입 ─────────────────────────────────────────
interface GradeDef {
  id: string        // 등급 식별자 ("S", "EXCELLENT" 등 관리자 정의)
  label: string     // 표시명
}

interface TeamMemberResult {
  empId: number
  empName: string
  position: string
  managerGradeId: string   // 팀장이 부여한 등급 id
  autoGradeId: string      // 자동 산정 등급 id
  finalGradeId: string     // 최종 확정 등급 id
  managerComment?: string
}

// ─── 색상 팔레트 (등급 순위 기반) ─────────────────
// 등급 리스트의 인덱스(0=최상위) 로 접근
const COLOR_PALETTE = [
  { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]', border: 'border-[#7c3aed]' },  // 0 보라
  { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]', border: 'border-[#2e9e6e]' },  // 1 초록
  { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]' },  // 2 파랑
  { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]' },  // 3 주황
  { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]', border: 'border-[#ef4444]' },  // 4 빨강
  { bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#64748b]' },  // 5 회색
  { bg: 'bg-[#fff7ed]', text: 'text-[#ea580c]', border: 'border-[#ea580c]' },  // 6 다홍
  { bg: 'bg-[#ecfeff]', text: 'text-[#0891b2]', border: 'border-[#0891b2]' },  // 7 청록
]
const FALLBACK_COLOR = { bg: 'bg-[#f5f5f5]', text: 'text-[#8a9490]', border: 'border-[#8a9490]' }

// ─── 목업 데이터 ──────────────────────────────────
// TODO: GET /eval/rules/{seasonId} 로 교체. grades[].id/label 만 사용
const MOCK_GRADES: GradeDef[] = [
  { id: 'S', label: 'S' },
  { id: 'A', label: 'A' },
  { id: 'B', label: 'B' },
  { id: 'C', label: 'C' },
  { id: 'D', label: 'D' },
]

// TODO: GET /eval/grades/{seasonId}?teamId=... 로 교체
const MOCK_TEAM_RESULT: TeamMemberResult[] = [
  { empId: 101, empName: '박상현', position: '책임', managerGradeId: 'S', autoGradeId: 'S', finalGradeId: 'S', managerComment: '지난 분기 우수한 성과. 리더십 향상 두드러짐.' },
  { empId: 102, empName: '김민정', position: '선임', managerGradeId: 'A', autoGradeId: 'A', finalGradeId: 'A', managerComment: '목표 달성 꾸준함. 협업 부분 칭찬할 만함.' },
  { empId: 103, empName: '홍길동', position: '선임', managerGradeId: 'A', autoGradeId: 'A', finalGradeId: 'A', managerComment: '성과는 우수하나 팀 커뮤니케이션 개선 여지.' },
  { empId: 104, empName: '이서연', position: '책임', managerGradeId: 'A', autoGradeId: 'B', finalGradeId: 'A', managerComment: '프로젝트 기여도 높음. 등급 상향 반영됨.' },
  { empId: 105, empName: '정우진', position: '선임', managerGradeId: 'B', autoGradeId: 'B', finalGradeId: 'B' },
  { empId: 106, empName: '최수빈', position: '주임', managerGradeId: 'B', autoGradeId: 'B', finalGradeId: 'B' },
  { empId: 107, empName: '강태민', position: '주임', managerGradeId: 'B', autoGradeId: 'B', finalGradeId: 'B' },
  { empId: 108, empName: '윤지혜', position: '주임', managerGradeId: 'B', autoGradeId: 'C', finalGradeId: 'C', managerComment: '자기평가는 양호하나 KPI 달성률 낮음.' },
  { empId: 109, empName: '임현수', position: '주임', managerGradeId: 'C', autoGradeId: 'C', finalGradeId: 'C' },
  { empId: 110, empName: '송미라', position: '주임', managerGradeId: 'C', autoGradeId: 'D', finalGradeId: 'D', managerComment: '근태 이슈 + 목표 미달성. 다음 시즌 밀착 코칭 필요.' },
]

const MOCK_SEASONS = [
  { id: 1, name: '2026년 상반기 정기평가' },
  { id: 2, name: '2025년 하반기 정기평가' },
]


// ─── 컴포넌트 ─────────────────────────────────────
export default function TeamEvalResult() {
  const [seasonId, setSeasonId] = useState<number>(1)
  const [gradeFilter, setGradeFilter] = useState<string>('ALL')
  const [selectedMember, setSelectedMember] = useState<TeamMemberResult | null>(null)

  // 등급 id → 메타 (label, color, rank)
  //  - 리스트 인덱스가 순위 (0=최상위)
  //  - 색상은 인덱스 기반 팔레트
  const gradeMap = useMemo(() => {
    const map = new Map<string, { def: GradeDef; color: typeof COLOR_PALETTE[number]; rank: number }>()
    MOCK_GRADES.forEach((g, i) => {
      map.set(g.id, {
        def: g,
        color: COLOR_PALETTE[i] ?? FALLBACK_COLOR,
        rank: i,
      })
    })
    return map
  }, [])

  // 필터 적용
  const filtered = useMemo(
    () => gradeFilter === 'ALL'
      ? MOCK_TEAM_RESULT
      : MOCK_TEAM_RESULT.filter(m => m.finalGradeId === gradeFilter),
    [gradeFilter],
  )

  // 팀 요약 — 등급별 인원수
  const summary = useMemo(() => {
    const counts = new Map<string, number>()
    MOCK_GRADES.forEach(g => counts.set(g.id, 0))
    MOCK_TEAM_RESULT.forEach(m => counts.set(m.finalGradeId, (counts.get(m.finalGradeId) ?? 0) + 1))
    return { counts, total: MOCK_TEAM_RESULT.length }
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(팀장) &gt; 팀원 평가 결과</div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 평가 결과</h1>
          <p className="text-[13px] text-[#8a9490]">확정된 평가 결과를 확인하고 면담을 진행하세요.</p>
        </div>
        <select
          value={seasonId}
          onChange={e => setSeasonId(Number(e.target.value))}
          className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-white"
        >
          {MOCK_SEASONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* 팀 요약 — 5개 이하 동적 grid, 6개 이상 가로 스크롤 */}
      {MOCK_GRADES.length <= 5 ? (
        <div
          className="grid gap-3 mb-6"
          style={{ gridTemplateColumns: `repeat(${MOCK_GRADES.length + 1}, minmax(0, 1fr))` }}
        >
          <SummaryBox label="전체" count={summary.total} />
          {MOCK_GRADES.map(g => (
            <SummaryBox
              key={g.id}
              label={g.label}
              count={summary.counts.get(g.id) ?? 0}
              color={gradeMap.get(g.id)!.color}
            />
          ))}
        </div>
      ) : (
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            <div className="w-[120px] shrink-0">
              <SummaryBox label="전체" count={summary.total} />
            </div>
            {MOCK_GRADES.map(g => (
              <div key={g.id} className="w-[120px] shrink-0">
                <SummaryBox
                  label={g.label}
                  count={summary.counts.get(g.id) ?? 0}
                  color={gradeMap.get(g.id)!.color}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[12px] text-[#5a6b62]">최종등급 필터:</span>
        <button
          onClick={() => setGradeFilter('ALL')}
          className={`px-3 py-1 rounded text-[12px] font-medium transition-colors border ${
            gradeFilter === 'ALL'
              ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
              : 'bg-white text-[#5a6b62] border-[#e0e5e3] hover:border-[#1D9E75]'
          }`}
        >전체</button>
        {MOCK_GRADES.map(g => (
          <button
            key={g.id}
            onClick={() => setGradeFilter(g.id)}
            className={`px-3 py-1 rounded text-[12px] font-medium transition-colors border ${
              gradeFilter === g.id
                ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                : 'bg-white text-[#5a6b62] border-[#e0e5e3] hover:border-[#1D9E75]'
            }`}
          >{g.label}</button>
        ))}
      </div>

      {/* 결과 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center text-gray-400 text-[13px]">
          해당 등급 인원이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(m => {
            const adjusted = m.autoGradeId !== m.finalGradeId
            return (
              <button
                key={m.empId}
                type="button"
                onClick={() => setSelectedMember(m)}
                className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-left hover:border-[#1D9E75] hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[15px] font-semibold text-[#1a2b23]">{m.empName}</div>
                    <div className="text-[11px] text-[#8a9490] mt-0.5">{m.position}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {adjusted && <span className="text-[10px] text-[#f59e0b]" title="조정됨">▾</span>}
                    <GradeChip gradeId={m.finalGradeId} gradeMap={gradeMap} size="lg" bold />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <GradeFlow label="부여" gradeId={m.managerGradeId} gradeMap={gradeMap} />
                  <span className="text-gray-300">→</span>
                  <GradeFlow label="최초" gradeId={m.autoGradeId} gradeMap={gradeMap} muted />
                  <span className="text-gray-300">→</span>
                  <GradeFlow label="최종" gradeId={m.finalGradeId} gradeMap={gradeMap} bold />
                </div>

                {m.managerComment && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 line-clamp-1">
                    💬 {m.managerComment}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-[#f2faf6] border border-[#d4ecdd] rounded-md text-[11px] text-gray-600">
        ▾ 표시는 최초 부여 등급과 최종 등급이 다른 경우 (강제배분 또는 HR 보정으로 조정됨).
        카드를 클릭하면 상세 코멘트를 확인할 수 있습니다.
      </div>

      {selectedMember && (
        <DetailModal member={selectedMember} gradeMap={gradeMap} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}


// ─── 요약 박스 ────────────────────────────────────
function SummaryBox({ label, count, color }: {
  label: string
  count: number
  color?: typeof COLOR_PALETTE[number]
}) {
  const isDefault = !color
  return (
    <div
      className={`rounded-lg p-3 text-center border ${
        isDefault ? 'bg-white border-[#e0e5e3]' : `${color.bg} ${color.border}`
      }`}
    >
      <div
        className={`text-[11px] mb-1 truncate ${
          isDefault ? 'text-[#8a9490]' : `${color.text} font-semibold`
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[20px] font-bold truncate ${isDefault ? 'text-[#1a2b23]' : color.text}`}
      >
        {count}명
      </div>
    </div>
  )
}


// ─── 등급 칩 ──────────────────────────────────────
type GradeMap = Map<string, { def: GradeDef; color: typeof COLOR_PALETTE[number]; rank: number }>

function GradeChip({ gradeId, gradeMap, muted, bold, size = 'md' }: {
  gradeId: string
  gradeMap: GradeMap
  muted?: boolean
  bold?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const meta = gradeMap.get(gradeId)
  const color = meta?.color ?? FALLBACK_COLOR
  const label = meta?.def.label ?? gradeId
  const sizeCls =
    size === 'sm' ? 'px-1.5 py-0.5 text-[10px] min-w-[22px]' :
    size === 'lg' ? 'px-3 py-1 text-[14px] min-w-[32px]' :
                    'px-2.5 py-0.5 text-[12px] min-w-[26px]'
  return (
    <span
      className={`inline-block text-center rounded ${sizeCls} ${color.bg} ${color.text} ${bold ? 'font-bold' : 'font-medium'} ${muted ? 'opacity-60' : ''}`}
    >
      {label}
    </span>
  )
}

function GradeFlow({ label, gradeId, gradeMap, muted, bold }: {
  label: string
  gradeId: string
  gradeMap: GradeMap
  muted?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#8a9490]">{label}</span>
      <GradeChip gradeId={gradeId} gradeMap={gradeMap} size="sm" muted={muted} bold={bold} />
    </div>
  )
}


// ─── 상세 모달 ────────────────────────────────────
function DetailModal({ member, gradeMap, onClose }: {
  member: TeamMemberResult
  gradeMap: GradeMap
  onClose: () => void
}) {
  const adjusted = member.autoGradeId !== member.finalGradeId
  const labelOf = (id: string) => gradeMap.get(id)?.def.label ?? id

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#1a2b23]">{member.empName}</h2>
            <p className="text-[12px] text-[#8a9490]">{member.position}</p>
          </div>
          <button onClick={onClose} className="text-[20px] text-gray-400 hover:text-gray-600 leading-none">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <GradeStep label="본인이 준 등급" gradeId={member.managerGradeId} gradeMap={gradeMap} />
          <GradeStep label="최초 부여 등급" gradeId={member.autoGradeId} gradeMap={gradeMap} muted />
          <GradeStep label="최종 등급" gradeId={member.finalGradeId} gradeMap={gradeMap} bold />
        </div>

        {adjusted && (
          <div className="mb-4 p-2 bg-[#fffbeb] border border-[#fde68a] rounded text-[11px] text-[#92400e]">
            최초 부여 등급({labelOf(member.autoGradeId)})이 강제배분/보정으로 <strong>{labelOf(member.finalGradeId)}</strong> 으로 조정됨
          </div>
        )}

        <div className="border-t border-[#e0e5e3] pt-4">
          <div className="text-[12px] text-[#5a6b62] mb-1 font-medium">평가 코멘트</div>
          <div className="text-[13px] text-[#1a2b23] leading-relaxed min-h-[60px] bg-[#f8faf9] border border-[#e0e5e3] rounded-md p-3">
            {member.managerComment || <span className="text-gray-400">작성된 코멘트가 없습니다.</span>}
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-[#1D9E75] text-white border-none rounded-lg text-[13px] cursor-pointer hover:bg-[#0F6E56]">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}


function GradeStep({ label, gradeId, gradeMap, muted, bold }: {
  label: string
  gradeId: string
  gradeMap: GradeMap
  muted?: boolean
  bold?: boolean
}) {
  const meta = gradeMap.get(gradeId)
  const color = meta?.color ?? FALLBACK_COLOR
  const text = meta?.def.label ?? gradeId
  return (
    <div className={`rounded-md border p-3 text-center ${color.bg} ${color.border}`}>
      <div className="text-[11px] text-[#8a9490] mb-1">{label}</div>
      <div className={`text-[22px] ${color.text} ${bold ? 'font-bold' : 'font-semibold'} ${muted ? 'opacity-60' : ''}`}>
        {text}
      </div>
    </div>
  )
}
