import { useState } from 'react'

interface Season {
  id: number
  name: string
  period: string
  startDate: string
  endDate: string
  status: '진행중' | '준비중' | '완료'
  targetCount: number
  stages: Stage[]
}

interface Stage {
  name: string
  startDate: string
  endDate: string
  status: '대기' | '진행중' | '완료'
}

const mockSeasons: Season[] = [
  {
    id: 1, name: '2024년 상반기 정기평가', period: '상반기',
    startDate: '2024-06-01', endDate: '2024-06-30', status: '진행중', targetCount: 73,
    stages: [
      { name: '목표 등록', startDate: '2024-06-01', endDate: '2024-06-07', status: '완료' },
      { name: '자기평가', startDate: '2024-06-08', endDate: '2024-06-14', status: '진행중' },
      { name: '팀장평가', startDate: '2024-06-15', endDate: '2024-06-21', status: '대기' },
      { name: '동료평가', startDate: '2024-06-15', endDate: '2024-06-21', status: '대기' },
      { name: '등급 산정', startDate: '2024-06-22', endDate: '2024-06-28', status: '대기' },
      { name: '결과 확정', startDate: '2024-06-29', endDate: '2024-06-30', status: '대기' },
    ],
  },
  {
    id: 2, name: '2023년 하반기 정기평가', period: '하반기',
    startDate: '2023-12-01', endDate: '2023-12-31', status: '완료', targetCount: 70,
    stages: [
      { name: '목표 등록', startDate: '2023-12-01', endDate: '2023-12-07', status: '완료' },
      { name: '자기평가', startDate: '2023-12-08', endDate: '2023-12-14', status: '완료' },
      { name: '팀장평가', startDate: '2023-12-15', endDate: '2023-12-21', status: '완료' },
      { name: '동료평가', startDate: '2023-12-15', endDate: '2023-12-21', status: '완료' },
      { name: '등급 산정', startDate: '2023-12-22', endDate: '2023-12-28', status: '완료' },
      { name: '결과 확정', startDate: '2023-12-29', endDate: '2023-12-31', status: '완료' },
    ],
  },
  {
    id: 3, name: '2024년 하반기 정기평가', period: '하반기',
    startDate: '2024-12-01', endDate: '2024-12-31', status: '준비중', targetCount: 0,
    stages: [
      { name: '목표 등록', startDate: '', endDate: '', status: '대기' },
      { name: '자기평가', startDate: '', endDate: '', status: '대기' },
      { name: '팀장평가', startDate: '', endDate: '', status: '대기' },
      { name: '동료평가', startDate: '', endDate: '', status: '대기' },
      { name: '등급 산정', startDate: '', endDate: '', status: '대기' },
      { name: '결과 확정', startDate: '', endDate: '', status: '대기' },
    ],
  },
]

const statusColor = (s: string) => {
  if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
  if (s === '준비중') return 'bg-[#fef3cd] text-[#f59e0b]'
  if (s === '완료') return 'bg-[#f5f5f5] text-[#8a9490]'
  if (s === '대기') return 'bg-[#f5f5f5] text-[#8a9490]'
  return 'bg-[#f5f5f5] text-[#8a9490]'
}

export default function SeasonCreate() {
  const [seasons, setSeasons] = useState<Season[]>(mockSeasons)
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', period: '상반기', year: '2024', startDate: '', endDate: '' })

  const selected = seasons.find(s => s.id === selectedId) || null

  const handleCreate = () => {
    if (!form.name || !form.startDate || !form.endDate) return
    setSeasons([...seasons, {
      id: Date.now(),
      name: form.name,
      period: form.period,
      startDate: form.startDate,
      endDate: form.endDate,
      status: '준비중',
      targetCount: 0,
      stages: [
        { name: '목표 등록', startDate: '', endDate: '', status: '대기' },
        { name: '자기평가', startDate: '', endDate: '', status: '대기' },
        { name: '팀장평가', startDate: '', endDate: '', status: '대기' },
        { name: '동료평가', startDate: '', endDate: '', status: '대기' },
        { name: '등급 산정', startDate: '', endDate: '', status: '대기' },
        { name: '결과 확정', startDate: '', endDate: '', status: '대기' },
      ],
    }])
    setForm({ name: '', period: '상반기', year: '2024', startDate: '', endDate: '' })
    setShowForm(false)
  }

  const handleStageChange = (seasonId: number, stageIdx: number, field: 'startDate' | 'endDate', value: string) => {
    setSeasons(seasons.map(s => {
      if (s.id !== seasonId) return s
      const stages = s.stages.map((st, i) => i === stageIdx ? { ...st, [field]: value } : st)
      return { ...s, stages }
    }))
  }

  const handleSeasonFieldChange = (seasonId: number, field: 'name' | 'startDate' | 'endDate' | 'status', value: string) => {
    setSeasons(seasons.map(s => s.id === seasonId ? { ...s, [field]: value } : s))
  }

  // 목록 뷰
  if (!selected) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 설계 &gt; 평가 주기/일정 생성</div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">평가 주기/일정 생성</h1>
            <p className="text-[13px] text-[#8a9490]">평가 시즌을 생성하고 일정을 관리합니다.</p>
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
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 2024년 상반기 정기평가"
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">평가주기</label>
                <select
                  value={form.period}
                  onChange={e => setForm({ ...form, period: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                >
                  <option>상반기</option>
                  <option>하반기</option>
                  <option>연간</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">연도</label>
                <select
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                >
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">시작일</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">종료일</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
              <button onClick={handleCreate} className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]">생성</button>
            </div>
          </div>
        )}

        {/* 시즌 목록 */}
        <div className="space-y-3">
          {seasons.map(season => (
            <div key={season.id} className="bg-white border border-[#e0e5e3] rounded-lg p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#eaf6f0] flex items-center justify-center text-[#2e9e6e] text-[14px]">📅</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#1a2b23]">{season.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusColor(season.status)}`}>{season.status}</span>
                  </div>
                  <div className="text-[12px] text-[#8a9490] mt-0.5">{season.startDate} ~ {season.endDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-[11px] text-[#8a9490]">대상인원</div>
                  <div className="text-[14px] font-semibold text-[#1a2b23]">{season.targetCount}명</div>
                </div>
                <button
                  onClick={() => setSelectedId(season.id)}
                  className="border border-[#e0e5e3] bg-white text-[#1a2b23] rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
                >
                  관리
                </button>
              </div>
            </div>
          ))}
        </div>
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
          <button
            onClick={() => setSelectedId(null)}
            className="text-[#8a9490] bg-transparent border-none cursor-pointer text-[18px] hover:text-[#1a2b23]"
          >
            ←
          </button>
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
            <input
              type="text"
              value={selected.name}
              onChange={e => handleSeasonFieldChange(selected.id, 'name', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">시작일</label>
            <input
              type="date"
              value={selected.startDate}
              onChange={e => handleSeasonFieldChange(selected.id, 'startDate', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">종료일</label>
            <input
              type="date"
              value={selected.endDate}
              onChange={e => handleSeasonFieldChange(selected.id, 'endDate', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">상태</label>
            <select
              value={selected.status}
              onChange={e => handleSeasonFieldChange(selected.id, 'status', e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
            >
              <option value="준비중">준비중</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">대상 인원</label>
            <div className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-[#f8faf9] text-[#1a2b23]">{selected.targetCount}명</div>
          </div>
        </div>
      </div>

      {/* 단계별 일정 관리 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">단계별 일정 관리</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e5e3]">
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">단계</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">시작일</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">종료일</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">상태</th>
            </tr>
          </thead>
          <tbody>
            {selected.stages.map((stage, i) => (
              <tr key={i} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-5 py-3 font-medium text-[#1a2b23]">{stage.name}</td>
                <td className="px-5 py-3 text-center">
                  <input
                    type="date"
                    value={stage.startDate}
                    onChange={e => handleStageChange(selected.id, i, 'startDate', e.target.value)}
                    className="border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px] text-center"
                  />
                </td>
                <td className="px-5 py-3 text-center">
                  <input
                    type="date"
                    value={stage.endDate}
                    onChange={e => handleStageChange(selected.id, i, 'endDate', e.target.value)}
                    className="border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px] text-center"
                  />
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColor(stage.status)}`}>{stage.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setSelectedId(null)}
          className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
        >
          목록으로
        </button>
        <button className="bg-[#1D9E75] text-white border-none rounded-lg px-5 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]">
          저장
        </button>
      </div>
    </div>
  )
}
