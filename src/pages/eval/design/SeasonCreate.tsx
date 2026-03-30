import { useState } from 'react';

interface Season {
  id: number;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  status: '진행중' | '준비중' | '완료';
  targetCount: number;
}

const mockSeasons: Season[] = [
  { id: 1, name: '2024년 상반기 정기평가', period: '상반기', startDate: '2024-06-01', endDate: '2024-06-30', status: '진행중', targetCount: 73 },
  { id: 2, name: '2023년 하반기 정기평가', period: '하반기', startDate: '2023-12-01', endDate: '2023-12-31', status: '완료', targetCount: 70 },
  { id: 3, name: '2024년 하반기 정기평가', period: '하반기', startDate: '2024-12-01', endDate: '2024-12-31', status: '준비중', targetCount: 0 },
];

export default function SeasonCreate() {
  const [showForm, setShowForm] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>(mockSeasons);
  const [form, setForm] = useState({ name: '', period: '상반기', year: '2024', startDate: '', endDate: '' });

  const statusColor = (s: Season['status']) => {
    if (s === '진행중') return 'bg-green-100 text-green-700';
    if (s === '준비중') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-500';
  };

  const handleCreate = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setSeasons([...seasons, {
      id: seasons.length + 1,
      name: form.name,
      period: form.period,
      startDate: form.startDate,
      endDate: form.endDate,
      status: '준비중',
      targetCount: 0,
    }]);
    setForm({ name: '', period: '상반기', year: '2024', startDate: '', endDate: '' });
    setShowForm(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 설계 › <span className="text-[#1D9E75] font-medium">평가 주기/일정 생성</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 주기/일정 생성</h1>
          <p className="text-xs text-gray-400 mt-1">평가 시즌을 생성하고 일정을 관리합니다 (eval-1)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
        >
          <i className="fas fa-plus"></i>
          평가 시즌 생성
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">새 평가 시즌 생성</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">평가명</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="예: 2024년 상반기 정기평가"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">평가주기</label>
              <select
                value={form.period}
                onChange={e => setForm({ ...form, period: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
              >
                <option>상반기</option>
                <option>하반기</option>
                <option>연간</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">연도</label>
              <select
                value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
              >
                <option>2024</option>
                <option>2025</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">시작일</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">종료일</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
            >
              생성
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {seasons.map(season => (
          <div key={season.id} className="card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
                <i className="fas fa-calendar-alt text-[#1D9E75] text-sm"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{season.name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(season.status)}`}>
                    {season.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {season.startDate} ~ {season.endDate}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-gray-400">대상인원</div>
                <div className="text-sm font-semibold text-gray-800">{season.targetCount}명</div>
              </div>
              <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                관리
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
