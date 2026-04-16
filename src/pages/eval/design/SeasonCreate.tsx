import { useState, useRef, useEffect } from 'react'
import {
  useSeasons,
  useSeasonWithDetail,
  createSeasonAction,
  refreshSeasons,
} from '../../../stores/seasonsStore'
import Pagination from '../../../components/Pagination'
import SeasonDetail from './SeasonDetail'
import SeasonView from './SeasonView'

// 고정 5단계 — 백엔드 SeasonService.createSeason 과 문자열 동일
const STAGE_NAMES = ['목표등록', '자기평가', '상위자평가', '등급 산정 및 보정', '결과확정'] as const

// 빈 단계 5개 — 관리자가 날짜 채우도록
const emptyStageForm = () =>
  STAGE_NAMES.map(name => ({ name, startDate: '', endDate: '' }))

const SEASON_PAGE_SIZE = 5

// 연도 선택 팝업
function YearPicker({ value, onChange }: { value: string; onChange: (y: string) => void }) {
  const [open, setOpen] = useState(false)
  const [decadeBase, setDecadeBase] = useState(() => {
    const y = parseInt(value, 10) || new Date().getFullYear()
    return y - (y % 10)
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const years = Array.from({ length: 12 }, (_, i) => decadeBase - 1 + i)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-white hover:border-[#1D9E75] flex items-center justify-between"
      >
        <span>{value}년</span>
        <span className="text-[11px] text-[#8a9490]">📅</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-[240px] bg-white border border-[#e0e5e3] rounded-md shadow-lg p-3">
          <div className="flex items-center justify-between mb-2 text-[12px]">
            <button type="button" onClick={() => setDecadeBase(b => b - 10)} className="px-2 py-0.5 hover:bg-[#f5f5f5] rounded">◀</button>
            <span className="font-semibold text-[#1a2b23]">{decadeBase} - {decadeBase + 9}</span>
            <button type="button" onClick={() => setDecadeBase(b => b + 10)} className="px-2 py-0.5 hover:bg-[#f5f5f5] rounded">▶</button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {years.map(y => {
              const inDecade = y >= decadeBase && y < decadeBase + 10
              const selected = value === y.toString()
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => { onChange(y.toString()); setOpen(false) }}
                  className={`py-2 rounded text-[12px] transition-colors ${
                    selected ? 'bg-[#1D9E75] text-white font-semibold'
                    : inDecade ? 'text-[#1a2b23] hover:bg-[#eaf6f0]'
                    : 'text-[#d0d8d4] hover:bg-[#f5f5f5]'
                  }`}
                >{y}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const statusColor = (s: string) => {
  if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
  if (s === '준비중') return 'bg-[#fef3cd] text-[#f59e0b]'
  return 'bg-[#f5f5f5] text-[#8a9490]'
}

export default function SeasonCreate() {
  const seasons = useSeasons()
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mode, setMode] = useState<'edit' | 'view'>('view')
  const [page, setPage] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', period: '상반기', year: String(new Date().getFullYear()), startDate: '', endDate: '' })
  const [stageForm, setStageForm] = useState(emptyStageForm())

  const pagedSeasons = seasons.slice((page - 1) * SEASON_PAGE_SIZE, page * SEASON_PAGE_SIZE)
  const selected = useSeasonWithDetail(selectedId)

  const handleStageChange = (idx: number, field: 'startDate' | 'endDate', value: string) => {
    setStageForm(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const validateForm = (): string | null => {
    if (!form.name || !form.startDate || !form.endDate) return '시즌 기본정보를 입력하세요'
    if (form.endDate < form.startDate) return '시즌 종료일이 시작일보다 빠를 수 없습니다'

    let prevEnd: string | null = null
    for (let i = 0; i < stageForm.length; i++) {
      const s = stageForm[i]
      if (!s.startDate || !s.endDate) return `${i + 1}번째 단계 날짜를 입력하세요`
      if (s.endDate < s.startDate) return `${i + 1}번째 단계: 종료일이 시작일보다 빠를 수 없습니다`
      if (s.startDate < form.startDate || s.endDate > form.endDate) {
        return `${i + 1}번째 단계는 시즌 기간 내여야 합니다`
      }
      if (prevEnd && s.startDate < prevEnd) {
        return `${i + 1}번째 단계는 이전 단계 이후에 시작해야 합니다`
      }
      prevEnd = s.endDate
    }
    return null
  }

  const handleCreate = async () => {
    const err = validateForm()
    if (err) { alert(err); return }
    setSubmitting(true)
    try {
      await createSeasonAction({
        name: form.name,
        period: form.period,
        startDate: form.startDate,
        endDate: form.endDate,
        stages: stageForm.map(s => ({ startDate: s.startDate, endDate: s.endDate })),
      })
      setForm({ name: '', period: '상반기', year: String(new Date().getFullYear()), startDate: '', endDate: '' })
      setStageForm(emptyStageForm())
      setShowForm(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '시즌 생성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 상세 뷰
  if (selectedId && selected) {
    if (mode === 'view') {
      return (
        <SeasonView
          season={selected}
          onBack={() => setSelectedId(null)}
          onEdit={() => setMode('edit')}
        />
      )
    }
    return (
      <SeasonDetail
        season={selected}
        onBack={() => { setSelectedId(null); setMode('view'); refreshSeasons().catch(() => {}) }}
      />
    )
  }

  return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 설계 &gt; 평가 주기/일정 생성</div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">평가 주기/일정 생성</h1>
            <p className="text-[13px] text-[#8a9490]">평가 시즌을 생성하고 단계별 일정을 관리합니다.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
          >
            + 평가 시즌 생성
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
            <h2 className="text-[14px] font-semibold text-[#1a2b23] mb-4">새 평가 시즌 생성</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[12px] text-[#5a6b62] mb-1">평가명<span className="text-[#ef4444] ml-0.5">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 2024년 상반기 정기평가"
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">평가주기<span className="text-[#ef4444] ml-0.5">*</span></label>
                <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]">
                  <option>상반기</option><option>하반기</option><option>연간</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">연도<span className="text-[#ef4444] ml-0.5">*</span></label>
                <YearPicker value={form.year} onChange={y => setForm({ ...form, year: y })} />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">시작일<span className="text-[#ef4444] ml-0.5">*</span></label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">종료일<span className="text-[#ef4444] ml-0.5">*</span></label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-semibold text-[#1a2b23]">단계별 일정<span className="text-[#ef4444] ml-0.5">*</span></label>
                <span className="text-[11px] text-[#8a9490]">각 단계는 시즌 기간 내, 순서대로 지정</span>
              </div>
              <div className="border border-[#e0e5e3] rounded-md overflow-hidden">
                <table className="w-full text-[12px]">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[160px]" />
                    <col />
                    <col />
                  </colgroup>
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-center">순서</th>
                      <th className="px-3 py-2 text-left">단계명</th>
                      <th className="px-3 py-2 text-center">시작일<span className="text-[#ef4444] ml-0.5">*</span></th>
                      <th className="px-3 py-2 text-center">종료일<span className="text-[#ef4444] ml-0.5">*</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageForm.map((s, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-700">{s.name}</td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={s.startDate}
                            min={form.startDate || undefined}
                            max={form.endDate || undefined}
                            onChange={e => handleStageChange(idx, 'startDate', e.target.value)}
                            className="w-full border border-[#e0e5e3] rounded px-2 py-1 text-[12px]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={s.endDate}
                            min={s.startDate || form.startDate || undefined}
                            max={form.endDate || undefined}
                            onChange={e => handleStageChange(idx, 'endDate', e.target.value)}
                            className="w-full border border-[#e0e5e3] rounded px-2 py-1 text-[12px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-[#f2faf6] border border-[#d4ecdd] rounded-md text-[11px] text-gray-600 mt-4">
              시즌 생성 시 5단계(목표등록/자기평가/상위자평가/등급 산정 및 보정/결과확정) 일정이 함께 저장됩니다. 생성 후에도 관리 화면에서 날짜 수정이 가능합니다.
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button disabled={submitting} onClick={() => setShowForm(false)} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50">취소</button>
              <button disabled={submitting} onClick={handleCreate} className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] disabled:opacity-50">
                {submitting ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {pagedSeasons.length === 0 && (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-10 text-center text-[13px] text-gray-400">
              등록된 시즌이 없습니다.
            </div>
          )}
          {pagedSeasons.map(season => (
            <div key={season.id} className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#eaf6f0] flex items-center justify-center text-[#2e9e6e] text-[14px]">📅</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#1a2b23]">{season.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusColor(season.status)}`}>{season.status}</span>
                    <span className="text-[11px] text-gray-400">{season.period}</span>
                  </div>
                  <div className="text-[12px] text-[#8a9490] mt-0.5">{season.startDate} ~ {season.endDate}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedId(season.id); setMode('view') }}
                  className="border border-[#e0e5e3] bg-white text-[#1a2b23] rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
                >
                  상세
                </button>
                <button
                  onClick={() => { setSelectedId(season.id); setMode('edit') }}
                  disabled={season.status === '완료'}
                  title={season.status === '완료' ? '완료된 시즌은 관리할 수 없습니다' : '편집·단계 일정 관리'}
                  className={`rounded-lg px-4 py-2 text-[13px] font-medium border transition-colors ${
                    season.status === '완료'
                      ? 'border-[#1D9E75] bg-[#1D9E75] text-white opacity-40 cursor-not-allowed'
                      : 'border-[#1D9E75] bg-[#1D9E75] text-white cursor-pointer hover:bg-[#0F6E56]'
                  }`}
                >
                  관리
                </button>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          page={page}
          total={seasons.length}
          pageSize={SEASON_PAGE_SIZE}
          onChange={setPage}
        />
      </div>
  )
}
