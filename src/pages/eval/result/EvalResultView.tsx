import { useState } from 'react';

interface DeptResult {
  dept: string;
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
  total: number;
  avgScore: number;
}

interface PersonResult {
  id: string;
  name: string;
  dept: string;
  rank: string;
  selfScore: number | null;
  peerScore: number | null;
  managerScore: number | null;
  totalScore: number | null;
  finalGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  isCalibrated: boolean;
}

const deptResults: DeptResult[] = [
  { dept: '개발팀', s: 1, a: 1, b: 0, c: 1, d: 0, total: 3, avgScore: 86.1 },
  { dept: '인사팀', s: 1, a: 0, b: 0, c: 0, d: 0, total: 1, avgScore: 90.4 },
  { dept: '마케팅팀', s: 0, a: 0, b: 0, c: 1, d: 0, total: 1, avgScore: 70.0 },
  { dept: '영업팀', s: 0, a: 0, b: 1, c: 0, d: 0, total: 1, avgScore: 73.5 },
  { dept: '재무팀', s: 0, a: 1, b: 0, c: 0, d: 0, total: 1, avgScore: 88.4 },
  { dept: '경영지원팀', s: 0, a: 0, b: 1, c: 0, d: 0, total: 1, avgScore: 80.0 },
];

const personResults: PersonResult[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', selfScore: 90, peerScore: 88, managerScore: 92, totalScore: 90.4, finalGrade: 'S', isCalibrated: false },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', selfScore: 85, peerScore: 90, managerScore: 88, totalScore: 88.0, finalGrade: 'S', isCalibrated: true },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', selfScore: 82, peerScore: 78, managerScore: 85, totalScore: 82.4, finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', selfScore: 88, peerScore: 85, managerScore: 90, totalScore: 88.4, finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', selfScore: 80, peerScore: 76, managerScore: 82, totalScore: 80.0, finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', selfScore: 75, peerScore: 72, managerScore: null, totalScore: null, finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', selfScore: 70, peerScore: null, managerScore: null, totalScore: null, finalGrade: 'C', isCalibrated: false },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', selfScore: null, peerScore: null, managerScore: null, totalScore: null, finalGrade: null, isCalibrated: false },
];

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };
const gradeSolidColors: Record<string, string> = { S: '#1D9E75', A: '#3B82F6', B: '#F59E0B', C: '#F97316', D: '#EF4444' };
const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function EvalResultView() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [viewMode, setViewMode] = useState<'dept' | 'person'>('dept');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('전체');

  const gradeSummary = { S: 2, A: 2, B: 2, C: 1, D: 0 };

  const filteredPerson = personResults.filter(e => {
    if (deptFilter !== '전체' && e.dept !== deptFilter) return false;
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false;
    return true;
  });

  const filteredDept = deptResults.filter(d => deptFilter === '전체' || d.dept === deptFilter);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">평가 결과 조회</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 결과 조회</h1>
          <p className="text-xs text-gray-400 mt-1">최종 확정된 평가 결과를 조회합니다 (eval-19)</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[{ key: 'dept' as const, label: '부서별' }, { key: 'person' as const, label: '개인별' }].map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === v.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grade summary */}
      <div className="flex gap-3 mb-5">
        {(['S', 'A', 'B', 'C', 'D'] as const).map(g => (
          <div key={g} className="card p-4 flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: gradeSolidColors[g] }}>{g}</div>
            <div>
              <div className="text-xs text-gray-400">{g}등급</div>
              <div className="text-lg font-bold text-gray-800">{gradeSummary[g]}명</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {viewMode === 'person' && (
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="이름/사번 검색" className="flex-1 text-sm focus:outline-none" />
          </div>
        )}
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {['전체', '개발팀', '인사팀', '마케팅팀', '영업팀', '재무팀', '경영지원팀'].map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {viewMode === 'dept' ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs text-[#1D9E75]">S</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs text-blue-500">A</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs text-yellow-500">B</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs text-orange-500">C</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs text-red-500">D</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">총인원</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평균점수</th>
              </tr>
            </thead>
            <tbody>
              {filteredDept.map(d => (
                <tr key={d.dept} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{d.dept}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#1D9E75]">{d.s}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-500">{d.a}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-yellow-500">{d.b}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-orange-500">{d.c}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-500">{d.d}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{d.total}명</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">{d.avgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">자기</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">동료</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상위자</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">종합</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">확정등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">보정</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerson.map(e => (
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
                    {e.finalGrade ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[e.finalGrade]}`}>{e.finalGrade}</span>
                    ) : <span className="text-xs text-gray-400">미산정</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.isCalibrated ? (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">보정</span>
                    ) : <span className="text-xs text-gray-300">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
