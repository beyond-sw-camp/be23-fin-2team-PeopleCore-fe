import { useState } from 'react';

interface ManagerEval {
  id: number;
  evaluatee: string;
  dept: string;
  evaluator: string;
  scores: { name: string; score: number | null }[];
  total: number | null;
  feedbackSummary: string;
  status: '제출' | '미제출';
  submitDate: string;
}

const mockEvals: ManagerEval[] = [
  {
    id: 1, evaluatee: '김민수', dept: '개발팀', evaluator: '윤재혁(부장)',
    scores: [{ name: 'KPI', score: 85 }, { name: '역량', score: 82 }, { name: '협업', score: 88 }],
    total: 85, feedbackSummary: '업무 성과 우수, 지속적인 성장 가능성', status: '제출', submitDate: '2024-06-20 14:30',
  },
  {
    id: 2, evaluatee: '이서연', dept: '인사팀', evaluator: '정하은(차장)',
    scores: [{ name: 'KPI', score: 92 }, { name: '역량', score: 90 }, { name: '협업', score: 94 }],
    total: 92, feedbackSummary: '탁월한 인사 기획 역량, 리더십 발휘', status: '제출', submitDate: '2024-06-21 10:15',
  },
  { id: 3, evaluatee: '박지훈', dept: '마케팅팀', evaluator: '-', scores: [], total: null, feedbackSummary: '-', status: '미제출', submitDate: '-' },
  { id: 4, evaluatee: '최유진', dept: '영업팀', evaluator: '-', scores: [], total: null, feedbackSummary: '-', status: '미제출', submitDate: '-' },
];

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function ManagerEvalView() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [deptFilter, setDeptFilter] = useState('전체');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = mockEvals.filter(e => deptFilter === '전체' || e.dept === deptFilter);
  const submittedCount = mockEvals.filter(e => e.status === '제출').length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 조회 › <span className="text-[#1D9E75] font-medium">팀장 평가 조회</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">팀장 평가 조회</h1>
          <p className="text-xs text-gray-400 mt-1">팀장(상위자)의 평가 내용을 조회합니다</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
            {['전체', '개발팀', '인사팀', '마케팅팀', '영업팀', '재무팀', '경영지원팀'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4 mb-5 flex items-center gap-3">
        <i className="fas fa-chart-bar text-[#1D9E75]"></i>
        <span className="text-sm text-gray-700">상위자평가 제출 현황</span>
        <span className="text-sm font-bold text-[#1D9E75]">제출 {submittedCount}</span>
        <span className="text-sm text-gray-400">/ 전체 73</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">피평가자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평가자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">항목별 점수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">총점</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">피드백 요약</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">제출상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">제출일시</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상세</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ev => (
              <>
                <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800">{ev.evaluatee}</div>
                    <div className="text-xs text-gray-400">{ev.dept}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ev.evaluator}</td>
                  <td className="px-4 py-3">
                    {ev.scores.length > 0 ? (
                      <div className="flex gap-1">
                        {ev.scores.map(s => (
                          <span key={s.name} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{s.name}: {s.score}</span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">{ev.total ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{ev.feedbackSummary}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ev.status === '제출' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{ev.submitDate}</td>
                  <td className="px-4 py-3">
                    {ev.status === '제출' && (
                      <button onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)} className="text-gray-400 hover:text-[#1D9E75] transition-colors">
                        <i className={`fas fa-chevron-${expandedId === ev.id ? 'up' : 'down'}`}></i>
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === ev.id && (
                  <tr key={`${ev.id}-detail`} className="bg-[#1D9E75]/5">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="text-xs font-semibold text-gray-600 mb-2">상세 평가 내용</div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        {ev.scores.map(s => (
                          <div key={s.name} className="bg-white rounded-lg p-3">
                            <div className="text-xs text-gray-400">{s.name}</div>
                            <div className="text-lg font-bold text-[#1D9E75]">{s.score}점</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-600 mb-1">피드백 전문</div>
                        <div className="text-xs text-gray-700">{ev.feedbackSummary}. 꾸준한 성과와 팀 기여도가 돋보입니다. 다음 반기에는 더 큰 역할을 맡길 예정입니다.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
