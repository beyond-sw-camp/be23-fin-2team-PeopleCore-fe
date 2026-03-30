import { useState } from 'react';

type StageStatus = '마감' | '진행중' | '대기';

interface Stage {
  id: number;
  name: string;
  dateRange: string;
  submitted: number;
  total: number;
  status: StageStatus;
}

const initialStages: Stage[] = [
  { id: 1, name: '목표등록', dateRange: '2024-06-01 ~ 2024-06-07', submitted: 65, total: 73, status: '마감' },
  { id: 2, name: '자기평가', dateRange: '2024-06-08 ~ 2024-06-15', submitted: 45, total: 73, status: '진행중' },
  { id: 3, name: '동료평가', dateRange: '2024-06-10 ~ 2024-06-17', submitted: 0, total: 73, status: '대기' },
  { id: 4, name: '상위자평가', dateRange: '2024-06-18 ~ 2024-06-25', submitted: 0, total: 73, status: '대기' },
];

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function StageOpenClose() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [stages, setStages] = useState<Stage[]>(initialStages);

  const handleAction = (id: number, action: '오픈' | '마감') => {
    setStages(stages.map(s => {
      if (s.id !== id) return s;
      return { ...s, status: action === '오픈' ? '진행중' : '마감' };
    }));
  };

  const statusBadge = (s: StageStatus) => {
    if (s === '진행중') return 'bg-green-100 text-green-700';
    if (s === '마감') return 'bg-gray-100 text-gray-500';
    return 'bg-yellow-100 text-yellow-700';
  };

  const circleStyle = (s: StageStatus) => {
    if (s === '마감') return 'bg-[#1D9E75] text-white';
    if (s === '진행중') return 'bg-[#1D9E75] text-white ring-4 ring-[#1D9E75]/20 animate-pulse';
    return 'bg-gray-100 text-gray-400 border-2 border-gray-200';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 운영 › <span className="text-[#1D9E75] font-medium">평가 오픈/마감 처리</span>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">평가 오픈/마감 처리</h1>
        <p className="text-xs text-gray-400 mt-1">평가 단계별 오픈 및 마감을 처리합니다 (eval-7)</p>
      </div>

      {/* Season selector */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <i className="fas fa-calendar-alt text-[#1D9E75]"></i>
        <select
          value={selectedSeason}
          onChange={e => setSelectedSeason(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
        >
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700 ml-auto">진행중</span>
      </div>

      {/* Stage pipeline */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="relative">
            {idx < stages.length - 1 && (
              <div className="absolute top-10 left-full w-4 h-0.5 bg-gray-200 z-10 -translate-x-2"></div>
            )}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${circleStyle(stage.status)}`}>
                  {stage.status === '마감' ? <i className="fas fa-check text-xs"></i> : stage.id}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{stage.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(stage.status)}`}>
                    {stage.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-3">{stage.dateRange}</div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>제출 현황</span>
                  <span>{stage.submitted}/{stage.total}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1D9E75] rounded-full transition-all"
                    style={{ width: `${(stage.submitted / stage.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              {stage.status === '대기' && (
                <button
                  onClick={() => handleAction(stage.id, '오픈')}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#1D9E75] text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#0F6E56] transition-colors"
                >
                  <i className="fas fa-lock-open"></i>오픈
                </button>
              )}
              {stage.status === '진행중' && (
                <button
                  onClick={() => handleAction(stage.id, '마감')}
                  className="w-full flex items-center justify-center gap-1.5 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                >
                  <i className="fas fa-lock"></i>마감
                </button>
              )}
              {stage.status === '마감' && (
                <div className="text-center text-xs text-gray-400 py-1">마감 완료</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Warning note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-start gap-2">
        <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5 text-xs"></i>
        <p className="text-xs text-yellow-700">이전 단계가 마감된 후 다음 단계를 오픈할 수 있습니다. 단계 순서(목표등록 → 자기평가 → 동료평가 → 상위자평가)를 준수해주세요.</p>
      </div>
    </div>
  );
}
