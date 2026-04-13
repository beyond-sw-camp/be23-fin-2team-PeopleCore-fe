import { useState, useRef, useEffect } from 'react'
import {
  useSeasons,
  setSeasons,
  getSeasons,
  defaultStages,
  type Season,
  type Stage,
} from '../../../stores/seasonsStore'
import Pagination from '../../../components/Pagination'

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
  if (s === '완료') return 'bg-[#f5f5f5] text-[#8a9490]'
  if (s === '마감') return 'bg-[#f5f5f5] text-[#8a9490]'
  if (s === '대기') return 'bg-[#f5f5f5] text-[#8a9490]'
  return 'bg-[#f5f5f5] text-[#8a9490]'
}

export default function SeasonCreate() {
  const seasons = useSeasons()
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ name: '', period: '상반기', year: '2024', startDate: '', endDate: '' })

  const pagedSeasons = seasons.slice((page - 1) * SEASON_PAGE_SIZE, page * SEASON_PAGE_SIZE)

  const selected = seasons.find(s => s.id === selectedId) || null

  const handleCreate = () => {
    if (!form.name || !form.startDate || !form.endDate) return
    setSeasons([...getSeasons(), {
      id: Date.now(),
      name: form.name,
      period: form.period,
      startDate: form.startDate,
      endDate: form.endDate,
      status: '준비중',
      stages: defaultStages(),
    }])
    setForm({ name: '', period: '상반기', year: '2024', startDate: '', endDate: '' })
    setShowForm(false)
  }

  const updateSeason = (seasonId: number, updater: (s: Season) => Season) => {
    setSeasons(getSeasons().map(s => s.id === seasonId ? updater(s) : s))
  }

  const handleSeasonFieldChange = (seasonId: number, field: 'name' | 'startDate' | 'endDate' | 'status', value: string) => {
    updateSeason(seasonId, s => ({ ...s, [field]: value } as Season))
  }

  const handleStageChange = (seasonId: number, stageId: string, field: keyof Stage, value: string) => {
    updateSeason(seasonId, s => ({
      ...s,
      stages: s.stages.map(st => st.id === stageId ? { ...st, [field]: value } as Stage : st),
    }))
  }

  // 목록 뷰
  if (!selected) {
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
                <label className="block text-[12px] text-[#5a6b62] mb-1">평가명</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 2024년 상반기 정기평가"
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">평가주기</label>
                <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]">
                  <option>상반기</option><option>하반기</option><option>연간</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">연도</label>
                <YearPicker value={form.year} onChange={y => setForm({ ...form, year: y })} />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">시작일</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">종료일</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
              </div>
            </div>
            <div className="p-3 bg-[#f2faf6] border border-[#d4ecdd] rounded-md text-[11px] text-gray-600 mt-4">
              시즌 생성 시 기본 5단계(목표등록/자기평가/상위자평가/등급 산정 및 보정/결과확정)가 자동으로 만들어집니다. 생성 후 상세에서 단계 추가·순서 변경·날짜 설정이 가능합니다.
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
              <button onClick={handleCreate} className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]">생성</button>
            </div>
          </div>
        )}

        {/* 시즌 목록 */}
        <div className="space-y-3">
          {pagedSeasons.map(season => (
            <div key={season.id} className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#eaf6f0] flex items-center justify-center text-[#2e9e6e] text-[14px]">📅</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#1a2b23]">{season.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusColor(season.status)}`}>{season.status}</span>
                    <span className="text-[11px] text-gray-400">단계 {season.stages.length}개</span>
                  </div>
                  <div className="text-[12px] text-[#8a9490] mt-0.5">{season.startDate} ~ {season.endDate}</div>
                </div>
              </div>
              <button onClick={() => setSelectedId(season.id)}
                className="border border-[#e0e5e3] bg-white text-[#1a2b23] rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
              >관리</button>
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

  // 상세 관리 뷰
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">
        성과관리(인사) &gt; 설계 &gt; 평가 주기/일정 생성 &gt; <span className="text-[#2e9e6e] font-medium">{selected.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedId(null)}
            className="text-[#8a9490] bg-transparent border-none cursor-pointer text-[18px] hover:text-[#1a2b23]">←</button>
          <div>
            <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">{selected.name}</h1>
            <p className="text-[13px] text-[#8a9490]">평가 시즌의 기본 정보와 단계별 일정을 설정합니다.</p>
          </div>
        </div>
        <span className={`text-[12px] px-3 py-1 rounded font-medium ${statusColor(selected.status)}`}>{selected.status}</span>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
        <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[12px] text-[#5a6b62] mb-1">평가명</label>
            <input type="text" value={selected.name}
              onChange={e => handleSeasonFieldChange(selected.id, 'name', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">시작일</label>
            <input type="date" value={selected.startDate}
              onChange={e => handleSeasonFieldChange(selected.id, 'startDate', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">종료일</label>
            <input type="date" value={selected.endDate}
              onChange={e => handleSeasonFieldChange(selected.id, 'endDate', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">상태</label>
            <select value={selected.status}
              onChange={e => handleSeasonFieldChange(selected.id, 'status', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]">
              <option value="준비중">준비중</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
            </select>
          </div>
        </div>
      </div>

      {/* 단계별 일정 — 날짜만 수정 가능 (단계 추가/삭제/순서 변경 불가) */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">단계별 일정 관리</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">시즌 생성 시 자동 등록된 단계의 날짜만 수정 가능합니다.</p>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e5e3]">
              <th className="text-center px-3 py-3 font-medium text-[#5a6b62] w-[60px]">순서</th>
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">단계명</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[180px]">시작일</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[180px]">종료일</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[90px]">상태</th>
            </tr>
          </thead>
          <tbody>
            {selected.stages.map((stage, i) => (
              <tr key={stage.id} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-3 py-3 text-center text-[12px] text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 text-[13px] font-medium text-[#1a2b23]">{stage.name}</td>
                <td className="px-5 py-3 text-center">
                  <input type="date" value={stage.startDate}
                    onChange={e => handleStageChange(selected.id, stage.id, 'startDate', e.target.value)}
                    className="border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px] text-center" />
                </td>
                <td className="px-5 py-3 text-center">
                  <input type="date" value={stage.endDate}
                    onChange={e => handleStageChange(selected.id, stage.id, 'endDate', e.target.value)}
                    className="border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px] text-center" />
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColor(stage.status)}`}>{stage.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => setSelectedId(null)}
          className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
        >목록으로</button>
      </div>
    </div>
  )
}
