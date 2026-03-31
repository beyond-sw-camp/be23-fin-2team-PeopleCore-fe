import { useState } from 'react';

interface PeerEvalSummary {
  id: number;
  evaluatee: string;
  dept: string;
  totalEvaluators: number;
  submitted: number;
  avgScore: number | null;
  maxScore: number | null;
  minScore: number | null;
}

interface PeerDetail {
  items: { name: string; avgScore: number }[];
}

const mockSummaries: PeerEvalSummary[] = [
  { id: 1, evaluatee: '김민수', dept: '개발팀', totalEvaluators: 3, submitted: 2, avgScore: 78, maxScore: 82, minScore: 74 },
  { id: 2, evaluatee: '이서연', dept: '인사팀', totalEvaluators: 2, submitted: 2, avgScore: 88, maxScore: 90, minScore: 86 },
  { id: 3, evaluatee: '박지훈', dept: '마케팅팀', totalEvaluators: 3, submitted: 0, avgScore: null, maxScore: null, minScore: null },
  { id: 4, evaluatee: '최유진', dept: '영업팀', totalEvaluators: 2, submitted: 1, avgScore: 70, maxScore: 70, minScore: 70 },
  { id: 5, evaluatee: '한승우', dept: '개발팀', totalEvaluators: 2, submitted: 0, avgScore: null, maxScore: null, minScore: null },
];

const mockPeerDetails: Record<number, PeerDetail> = {
  1: { items: [{ name: 'KPI달성률', avgScore: 76 }, { name: '프로젝트기여도', avgScore: 80 }, { name: '직무전문성', avgScore: 78 }, { name: '협업소통', avgScore: 82 }] },
  2: { items: [{ name: 'KPI달성률', avgScore: 88 }, { name: '프로젝트기여도', avgScore: 90 }, { name: '직무전문성', avgScore: 86 }, { name: '협업소통', avgScore: 88 }] },
};

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function PeerEvalView() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const completed = mockSummaries.filter(e => e.submitted === e.totalEvaluators && e.totalEvaluators > 0).length;
  const partial = mockSummaries.filter(e => e.submitted > 0 && e.submitted < e.totalEvaluators).length;
  const none = mockSummaries.filter(e => e.submitted === 0).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 조회 › <span className="text-[#1D9E75] font-medium">동료평가 조회</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">동료평가 조회</h1>
          <p className="text-xs text-gray-400 mt-1">피평가자별 동료평가 결과를 조회합니다 (eval-14)</p>
        </div>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">완료</div>
          <div className="text-2xl font-bold text-green-500">{completed}명</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">일부완료</div>
          <div className="text-2xl font-bold text-yellow-500">{partial}명</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">미제출</div>
          <div className="text-2xl font-bold text-red-500">{none}명</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">피평가자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평가자수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">제출수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평균점수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">최고/최저</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">제출율</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상세</th>
            </tr>
          </thead>
          <tbody>
            {mockSummaries.map(e => {
              const pct = e.totalEvaluators > 0 ? Math.round((e.submitted / e.totalEvaluators) * 100) : 0;
              return (
                <>
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{e.evaluatee}</div>
                      <div className="text-xs text-gray-400">{e.dept}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{e.totalEvaluators}명</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">{e.submitted}명</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{e.avgScore ?? '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {e.maxScore ? `${e.maxScore} / ${e.minScore}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {e.submitted > 0 && (
                        <button onClick={() => setExpandedId(expandedId === e.id ? null : e.id)} className="text-gray-400 hover:text-[#1D9E75] transition-colors">
                          <i className="fas fa-eye"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === e.id && mockPeerDetails[e.id] && (
                    <tr key={`${e.id}-detail`} className="bg-[#1D9E75]/5">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="text-xs font-semibold text-gray-600 mb-2">
                          <i className="fas fa-user-secret mr-1 text-gray-400"></i>익명 동료평가 항목별 평균
                        </div>
                        <div className="flex gap-3">
                          {mockPeerDetails[e.id].items.map(item => (
                            <div key={item.name} className="bg-white rounded-lg px-3 py-2 text-center">
                              <div className="text-xs text-gray-400">{item.name}</div>
                              <div className="text-lg font-bold text-[#1D9E75]">{item.avgScore}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
