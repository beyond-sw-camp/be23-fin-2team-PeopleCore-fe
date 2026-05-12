import { useState } from 'react';

interface EvalRecord {
  id: string;
  name: string;
  dept: string;
  rank: string;
  selfScore: number | null;
  selfSubmitted: boolean;
  peerScore: number | null;
  peerSubmitted: boolean;
  managerScore: number | null;
  managerSubmitted: boolean;
  totalScore: number | null;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
}

const mockData: EvalRecord[] = [
  { id: '26040001', name: '김민수', dept: '개발팀', rank: '대리', selfScore: 82, selfSubmitted: true, peerScore: 78, peerSubmitted: true, managerScore: 85, managerSubmitted: true, totalScore: 82.4, grade: 'A' },
  { id: '26040002', name: '이서연', dept: '인사팀', rank: '과장', selfScore: 90, selfSubmitted: true, peerScore: 88, peerSubmitted: true, managerScore: 92, managerSubmitted: true, totalScore: 90.4, grade: 'S' },
  { id: '26040003', name: '박지훈', dept: '마케팅팀', rank: '사원', selfScore: 70, selfSubmitted: true, peerScore: null, peerSubmitted: false, managerScore: null, managerSubmitted: false, totalScore: null, grade: null },
  { id: '26040004', name: '최유진', dept: '영업팀', rank: '주임', selfScore: 75, selfSubmitted: true, peerScore: 72, peerSubmitted: true, managerScore: null, managerSubmitted: false, totalScore: null, grade: null },
  { id: '26040005', name: '정하은', dept: '재무팀', rank: '차장', selfScore: 88, selfSubmitted: true, peerScore: 85, peerSubmitted: true, managerScore: 90, managerSubmitted: true, totalScore: 88.4, grade: 'A' },
  { id: '26040006', name: '한승우', dept: '개발팀', rank: '사원', selfScore: null, selfSubmitted: false, peerScore: null, peerSubmitted: false, managerScore: null, managerSubmitted: false, totalScore: null, grade: null },
  { id: '26040007', name: '오나영', dept: '경영지원팀', rank: '대리', selfScore: 80, selfSubmitted: true, peerScore: 76, peerSubmitted: true, managerScore: 82, managerSubmitted: true, totalScore: 80.0, grade: 'B' },
  { id: '26040008', name: '윤재혁', dept: '개발팀', rank: '부장', selfScore: 85, selfSubmitted: true, peerScore: 90, peerSubmitted: true, managerScore: 88, managerSubmitted: true, totalScore: 88.0, grade: 'A' },
];

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };
const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function AllEvalList() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('전체');
  const [gradeFilter, setGradeFilter] = useState('전체');

  const gradeSummary = [
    { grade: 'S', count: mockData.filter(e => e.grade === 'S').length, color: '#1D9E75' },
    { grade: 'A', count: mockData.filter(e => e.grade === 'A').length, color: '#3B82F6' },
    { grade: 'B', count: mockData.filter(e => e.grade === 'B').length, color: '#F59E0B' },
    { grade: 'C', count: mockData.filter(e => e.grade === 'C').length, color: '#F97316' },
    { grade: '미산정', count: mockData.filter(e => e.grade === null).length, color: '#9CA3AF' },
  ];

  const filtered = mockData.filter(e => {
    if (deptFilter !== '전체' && e.dept !== deptFilter) return false;
    if (gradeFilter !== '전체' && (gradeFilter === '미산정' ? e.grade !== null : e.grade !== gradeFilter)) return false;
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false;
    return true;
  });

  const ScoreCell = ({ score, submitted }: { score: number | null; submitted: boolean }) => (
    <div className="flex items-center gap-1">
      <span className="text-sm font-semibold text-gray-700">{score ?? '-'}</span>
      {submitted ? (
        <span className="text-xs text-green-500"><i className="fas fa-check-circle"></i></span>
      ) : (
        <span className="text-xs text-gray-300"><i className="fas fa-circle"></i></span>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 조회 › <span className="text-[#1D9E75] font-medium">전체 평가 조회</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">전체 평가 조회</h1>
          <p className="text-xs text-gray-400 mt-1">전체 평가 대상자의 평가 현황을 조회합니다 (eval-11)</p>
        </div>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Grade summary */}
      <div className="flex gap-3 mb-5">
        {gradeSummary.map(g => (
          <div key={g.grade} className="card p-4 flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: g.color }}>
              {g.grade === '미산정' ? '?' : g.grade}
            </div>
            <div>
              <div className="text-xs text-gray-400">{g.grade}</div>
              <div className="text-lg font-bold text-gray-800">{g.count}명</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <i className="fas fa-search text-gray-400 text-xs"></i>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 또는 사번 검색" className="flex-1 text-sm focus:outline-none" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {['전체', '개발팀', '인사팀', '마케팅팀', '영업팀', '재무팀', '경영지원팀'].map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {['전체', 'S', 'A', 'B', 'C', 'D', '미산정'].map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">자기평가</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상위자평가</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">종합점수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">등급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상세</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500">{e.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.dept}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.rank}</td>
                <td className="px-4 py-3"><ScoreCell score={e.selfScore} submitted={e.selfSubmitted} /></td>
                <td className="px-4 py-3"><ScoreCell score={e.managerScore} submitted={e.managerSubmitted} /></td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800">{e.totalScore ?? '-'}</td>
                <td className="px-4 py-3">
                  {e.grade ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[e.grade]}`}>{e.grade}</span>
                  ) : (
                    <span className="text-xs text-gray-400">미산정</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="text-gray-400 hover:text-[#1D9E75] transition-colors">
                    <i className="fas fa-eye"></i>
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
