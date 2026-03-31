import { useState } from 'react';

interface GradeRecord {
  id: string;
  name: string;
  dept: string;
  rank: string;
  selfScore: number | null;
  peerScore: number | null;
  managerScore: number | null;
  totalScore: number | null;
  autoGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  draftStatus: '초안' | '확정대기';
}

const mockData: GradeRecord[] = [
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', selfScore: 82, peerScore: 78, managerScore: 85, totalScore: 82.4, autoGrade: 'A', draftStatus: '확정대기' },
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', selfScore: 90, peerScore: 88, managerScore: 92, totalScore: 90.4, autoGrade: 'S', draftStatus: '확정대기' },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', selfScore: 70, peerScore: null, managerScore: null, totalScore: null, autoGrade: null, draftStatus: '초안' },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', selfScore: 75, peerScore: 72, managerScore: null, totalScore: null, autoGrade: null, draftStatus: '초안' },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', selfScore: 88, peerScore: 85, managerScore: 90, totalScore: 88.4, autoGrade: 'A', draftStatus: '확정대기' },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', selfScore: null, peerScore: null, managerScore: null, totalScore: null, autoGrade: null, draftStatus: '초안' },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', selfScore: 80, peerScore: 76, managerScore: 82, totalScore: 80.0, autoGrade: 'B', draftStatus: '확정대기' },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', selfScore: 85, peerScore: 90, managerScore: 88, totalScore: 88.0, autoGrade: 'A', draftStatus: '확정대기' },
];

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };
const gradeTargets = { S: 10, A: 20, B: 40, C: 20, D: 10 };
const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function GradeDraftAuto() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);

  const total = mockData.filter(d => d.autoGrade).length;
  const gradeCounts = { S: 1, A: 3, B: 1, C: 0, D: 0 };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 등급 산정/보정 › <span className="text-[#1D9E75] font-medium">등급 초안 자동 산정</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">등급 초안 자동 산정</h1>
          <p className="text-xs text-gray-400 mt-1">가중치 기반 종합점수로 등급 초안을 자동 산정합니다 (eval-15)</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-sync-alt"></i>등급 재산정
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Weight formula */}
        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-500 mb-2">종합점수 산출 공식</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#1D9E75]">자기평가 × 20%</span>
            <span className="text-gray-400">+</span>
            <span className="text-sm font-bold text-blue-500">동료평가 × 30%</span>
            <span className="text-gray-400">+</span>
            <span className="text-sm font-bold text-purple-500">상위자평가 × 50%</span>
          </div>
        </div>

        {/* Grade quota */}
        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-500 mb-2">등급별 목표 비율</div>
          <div className="flex gap-2">
            {Object.entries(gradeTargets).map(([g, t]) => (
              <div key={g} className={`flex-1 text-center py-2 rounded-lg ${gradeColors[g]}`}>
                <div className="text-sm font-bold">{g}</div>
                <div className="text-xs">{t}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actual vs target */}
      <div className="card p-5 mb-5">
        <div className="text-xs font-semibold text-gray-500 mb-3">실제 vs 목표 분포</div>
        <div className="flex gap-3">
          {(['S', 'A', 'B', 'C', 'D'] as const).map(g => {
            const actual = gradeCounts[g];
            const targetPct = gradeTargets[g];
            const actualPct = total > 0 ? Math.round((actual / total) * 100) : 0;
            const isOver = actualPct > targetPct;
            return (
              <div key={g} className={`flex-1 p-3 rounded-xl border ${isOver ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <div className={`text-lg font-bold ${gradeColors[g].split(' ')[1]}`}>{g}</div>
                <div className={`text-xl font-bold ${isOver ? 'text-red-600' : 'text-gray-800'}`}>{actual}명</div>
                <div className="text-xs text-gray-400">{actualPct}% <span className="text-gray-300">/</span> 목표 {targetPct}%</div>
                {isOver && <div className="text-xs text-red-500 mt-1"><i className="fas fa-exclamation-triangle mr-1"></i>초과</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">자기(20%)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">동료(30%)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상위자(50%)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">종합점수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">자동등급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">초안상태</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500">{e.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.dept}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.rank}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{e.selfScore ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{e.peerScore ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{e.managerScore ?? '-'}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800">{e.totalScore ?? '-'}</td>
                <td className="px-4 py-3">
                  {e.autoGrade ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[e.autoGrade]}`}>{e.autoGrade}</span>
                  ) : (
                    <span className="text-xs text-gray-400">미산정</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${e.draftStatus === '확정대기' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.draftStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warning banner */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-2">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-sm"></i>
        <span className="text-xs text-yellow-700">HR 확정 전까지 초안 상태입니다. 보정 후 최종 확정이 필요합니다.</span>
      </div>
    </div>
  );
}
