import { useState } from 'react';

interface YearlyRecord {
  season: string;
  year: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  selfScore: number;
  peerScore: number;
  managerScore: number;
  totalScore: number;
  delta: number | null;
}

const mockHistory: YearlyRecord[] = [
  { season: '2024년 상반기', year: 2024, grade: 'A', selfScore: 82, peerScore: 78, managerScore: 85, totalScore: 82.4, delta: 6.4 },
  { season: '2023년 하반기', year: 2023, grade: 'B', selfScore: 74, peerScore: 70, managerScore: 78, totalScore: 76.0, delta: -8.2 },
  { season: '2023년 상반기', year: 2023, grade: 'A', selfScore: 84, peerScore: 80, managerScore: 88, totalScore: 84.2, delta: 7.7 },
  { season: '2022년 하반기', year: 2022, grade: 'B', selfScore: 75, peerScore: 72, managerScore: 79, totalScore: 76.5, delta: -14.5 },
  { season: '2022년 상반기', year: 2022, grade: 'S', selfScore: 90, peerScore: 88, managerScore: 94, totalScore: 91.0, delta: null },
];

const gradeColors: Record<string, { bg: string; text: string; bar: string }> = {
  S: { bg: 'bg-[#1D9E75]/10', text: 'text-[#1D9E75]', bar: '#1D9E75' },
  A: { bg: 'bg-blue-100', text: 'text-blue-700', bar: '#3B82F6' },
  B: { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: '#F59E0B' },
  C: { bg: 'bg-orange-100', text: 'text-orange-700', bar: '#F97316' },
  D: { bg: 'bg-red-100', text: 'text-red-700', bar: '#EF4444' },
};

const employees = ['김민수', '이서연', '박지훈', '최유진', '정하은', '한승우', '오나영', '윤재혁'];

export default function YearlyHistory() {
  const [selectedEmployee, setSelectedEmployee] = useState('김민수');
  const [search, setSearch] = useState('');

  const gradeCounts: Record<string, number> = {};
  mockHistory.forEach(h => { gradeCounts[h.grade] = (gradeCounts[h.grade] || 0) + 1; });

  const avgScore = mockHistory.reduce((s, h) => s + h.totalScore, 0) / mockHistory.length;
  const bestSeason = mockHistory.reduce((best, h) => h.totalScore > best.totalScore ? h : best, mockHistory[0]);
  const worstSeason = mockHistory.reduce((worst, h) => h.totalScore < worst.totalScore ? h : worst, mockHistory[0]);

  const filteredEmployees = employees.filter(e => e.includes(search));

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">연도별 평가 이력 관리</span>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">연도별 평가 이력 관리</h1>
        <p className="text-xs text-gray-400 mt-1">직원별 연도별 평가 이력을 조회합니다 (eval-24)</p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left panel */}
        <div className="col-span-9 space-y-4">
          {/* Employee search */}
          <div className="card p-4">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-3">
              <i className="fas fa-search text-gray-400 text-xs"></i>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="직원 검색"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
            {search && filteredEmployees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filteredEmployees.map(e => (
                  <button key={e} onClick={() => { setSelectedEmployee(e); setSearch(''); }} className="text-xs px-3 py-1 bg-gray-100 hover:bg-[#1D9E75]/10 hover:text-[#1D9E75] rounded-full transition-colors">
                    {e}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1D9E75] flex items-center justify-center text-white font-bold">{selectedEmployee[0]}</div>
              <div>
                <div className="text-sm font-bold text-gray-900">{selectedEmployee}</div>
                <div className="text-xs text-gray-400">개발팀 · 대리 · 26040001</div>
              </div>
            </div>
          </div>

          {/* Line chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">연도별 종합점수 추이</h3>
            {(() => {
              const data = [...mockHistory].reverse()
              const W = 600; const H = 160
              const PL = 32; const PR = 16; const PT = 18; const PB = 30
              const cW = W - PL - PR; const cH = H - PT - PB
              const px = (i: number) => PL + (i / (data.length - 1)) * cW
              const py = (s: number) => PT + ((100 - s) / 40) * cH
              const d = data.map((h, i) => `${i === 0 ? 'M' : 'L'} ${px(i)},${py(h.totalScore)}`).join(' ')
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '160px' }}>
                  {[70, 80, 90, 100].map(v => (
                    <g key={v}>
                      <line x1={PL} y1={py(v)} x2={W - PR} y2={py(v)} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3" />
                      <text x={PL - 4} y={py(v) + 3} textAnchor="end" fontSize="8" fill="#d1d5db">{v}</text>
                    </g>
                  ))}
                  <path d={d} fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((h, i) => (
                    <g key={i}>
                      <circle cx={px(i)} cy={py(h.totalScore)} r="3.5" fill="white" stroke={gradeColors[h.grade].bar} strokeWidth="1.5" />
                      <text x={px(i)} y={py(h.totalScore) - 8} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={gradeColors[h.grade].bar}>{h.totalScore}</text>
                      <text x={px(i)} y={H - 14} textAnchor="middle" fontSize="7.5" fill="#9ca3af">{h.season.split('년 ')[0]}년</text>
                      <text x={px(i)} y={H - 5} textAnchor="middle" fontSize="7" fill="#c4c4c4">{h.season.split('년 ')[1]}</text>
                    </g>
                  ))}
                </svg>
              )
            })()}
          </div>

          {/* History table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평가시즌</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">등급</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">자기평가</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">동료평가</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상위자평가</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">종합점수</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">변동</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map(h => (
                  <tr key={h.season} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{h.season}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[h.grade].bg} ${gradeColors[h.grade].text}`}>{h.grade}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{h.selfScore}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{h.peerScore}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{h.managerScore}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{h.totalScore}</td>
                    <td className="px-4 py-3">
                      {h.delta !== null ? (
                        <span className={`text-xs font-semibold ${h.delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {h.delta > 0 ? '+' : ''}{h.delta.toFixed(1)}
                        </span>
                      ) : <span className="text-xs text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: stats */}
        <div className="col-span-3 space-y-4">
          {/* Grade frequency */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">등급 취득 횟수</h3>
            <div className="space-y-2">
              {(['S', 'A', 'B', 'C', 'D'] as const).map(g => (
                <div key={g} className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeColors[g].bg} ${gradeColors[g].text}`}>{g}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${((gradeCounts[g] || 0) / mockHistory.length) * 100}%`, backgroundColor: gradeColors[g].bar }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">{gradeCounts[g] || 0}회</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">성과 추이</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">평균 점수</span>
                <span className="text-sm font-bold text-[#1D9E75]">{avgScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">최고 점수</span>
                <span className="text-sm font-bold text-[#1D9E75]">{Math.max(...mockHistory.map(h => h.totalScore))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">최저 점수</span>
                <span className="text-sm font-bold text-red-500">{Math.min(...mockHistory.map(h => h.totalScore))}</span>
              </div>
            </div>
          </div>

          {/* Best/worst */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">시즌 분석</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">최고 시즌</div>
                <div className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${gradeColors[bestSeason.grade].bg} ${gradeColors[bestSeason.grade].text}`}>
                  {bestSeason.grade}
                </div>
                <div className="text-xs text-gray-600 mt-1">{bestSeason.season}</div>
                <div className="text-sm font-bold text-[#1D9E75]">{bestSeason.totalScore}점</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">최저 시즌</div>
                <div className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${gradeColors[worstSeason.grade].bg} ${gradeColors[worstSeason.grade].text}`}>
                  {worstSeason.grade}
                </div>
                <div className="text-xs text-gray-600 mt-1">{worstSeason.season}</div>
                <div className="text-sm font-bold text-red-500">{worstSeason.totalScore}점</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
