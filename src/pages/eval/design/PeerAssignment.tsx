import { useState } from 'react';

interface PeerMapping {
  id: number;
  evaluatee: string;
  dept: string;
  evaluators: string[];
}

const mockMappings: PeerMapping[] = [
  { id: 1, evaluatee: '김민수', dept: '개발팀', evaluators: ['한승우', '윤재혁', '박지훈'] },
  { id: 2, evaluatee: '이서연', dept: '인사팀', evaluators: ['오나영', '정하은'] },
  { id: 3, evaluatee: '박지훈', dept: '마케팅팀', evaluators: ['최유진', '김민수', '이서연'] },
  { id: 4, evaluatee: '최유진', dept: '영업팀', evaluators: ['박지훈', '정하은'] },
  { id: 5, evaluatee: '한승우', dept: '개발팀', evaluators: ['김민수', '윤재혁'] },
];

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function PeerAssignment() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [mappings] = useState<PeerMapping[]>(mockMappings);

  const totalMappings = mappings.length;
  const avgEvaluators = mappings.reduce((s, m) => s + m.evaluators.length, 0) / mappings.length;
  const unmapped = 8 - mappings.length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 설계 › <span className="text-[#1D9E75] font-medium">동료평가 대상자 지정</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">동료평가 대상자 지정</h1>
          <p className="text-xs text-gray-400 mt-1">동료평가 피평가자와 평가자를 매핑합니다 (eval-5)</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          >
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            <i className="fas fa-magic mr-1.5"></i>자동 배정
          </button>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-hand-pointer"></i>수동 지정
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">전체 매핑</div>
          <div className="text-2xl font-bold text-gray-800">{totalMappings}건</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">평균 평가자수</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{avgEvaluators.toFixed(1)}명</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">미매핑</div>
          <div className="text-2xl font-bold text-red-500">{unmapped}명</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">피평가자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평가자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">인원수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map(m => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.evaluatee}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{m.dept}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {m.evaluators.map(ev => (
                      <span key={ev} className="text-xs px-2 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full font-medium">
                        {ev}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-700">{m.evaluators.length}명</td>
                <td className="px-4 py-3">
                  <button className="text-gray-400 hover:text-[#1D9E75] transition-colors">
                    <i className="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
