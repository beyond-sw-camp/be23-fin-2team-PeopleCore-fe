import { useState } from 'react';

interface DeptGrade {
  dept: string;
  total: number;
  grades: { grade: 'S' | 'A' | 'B' | 'C' | 'D'; count: number }[];
}

const deptData: DeptGrade[] = [
  { dept: '개발팀', total: 3, grades: [{ grade: 'S', count: 2 }, { grade: 'A', count: 1 }, { grade: 'B', count: 0 }, { grade: 'C', count: 0 }, { grade: 'D', count: 0 }] },
  { dept: '인사팀', total: 1, grades: [{ grade: 'S', count: 1 }, { grade: 'A', count: 0 }, { grade: 'B', count: 0 }, { grade: 'C', count: 0 }, { grade: 'D', count: 0 }] },
  { dept: '마케팅팀', total: 1, grades: [{ grade: 'S', count: 0 }, { grade: 'A', count: 0 }, { grade: 'B', count: 0 }, { grade: 'C', count: 1 }, { grade: 'D', count: 0 }] },
  { dept: '영업팀', total: 1, grades: [{ grade: 'S', count: 0 }, { grade: 'A', count: 0 }, { grade: 'B', count: 1 }, { grade: 'C', count: 0 }, { grade: 'D', count: 0 }] },
  { dept: '재무팀', total: 1, grades: [{ grade: 'S', count: 0 }, { grade: 'A', count: 1 }, { grade: 'B', count: 0 }, { grade: 'C', count: 0 }, { grade: 'D', count: 0 }] },
  { dept: '경영지원팀', total: 1, grades: [{ grade: 'S', count: 0 }, { grade: 'A', count: 0 }, { grade: 'B', count: 1 }, { grade: 'C', count: 0 }, { grade: 'D', count: 0 }] },
];

const gradeTargets: Record<string, number> = { S: 10, A: 20, B: 40, C: 20, D: 10 };
const gradeColors: Record<string, { bg: string; text: string }> = {
  S: { bg: '#1D9E75', text: 'text-[#1D9E75]' },
  A: { bg: '#3B82F6', text: 'text-blue-500' },
  B: { bg: '#F59E0B', text: 'text-yellow-500' },
  C: { bg: '#F97316', text: 'text-orange-500' },
  D: { bg: '#EF4444', text: 'text-red-500' },
};

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function DeptGradeDistribution() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);

  const isOverQuota = (total: number, count: number, grade: string) => {
    if (total === 0) return false;
    const pct = (count / total) * 100;
    return pct > gradeTargets[grade];
  };

  const totalByGrade = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  deptData.forEach(d => d.grades.forEach(g => { totalByGrade[g.grade] += g.count; }));
  const grandTotal = Object.values(totalByGrade).reduce((s, c) => s + c, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 등급 산정/보정 › <span className="text-[#1D9E75] font-medium">부서별 등급 분포 조회</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">부서별 등급 분포 조회</h1>
          <p className="text-xs text-gray-400 mt-1">부서별 등급 분포와 강제배분 준수 여부를 확인합니다 (eval-16)</p>
        </div>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-gray-500">목표 비율</span>
          {Object.entries(gradeTargets).map(([g, t]) => (
            <div key={g} className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${gradeColors[g].text}`}>{g}</span>
              <span className="text-xs text-gray-500">≤ {t}%</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block"></span>
            <span className="text-xs text-gray-500">초과</span>
          </div>
        </div>
      </div>

      {/* Dept cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {deptData.map(dept => (
          <div key={dept.dept} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">{dept.dept}</span>
              <span className="text-xs text-gray-400">총 {dept.total}명</span>
            </div>
            <div className="flex gap-2">
              {dept.grades.map(g => {
                const pct = dept.total > 0 ? Math.round((g.count / dept.total) * 100) : 0;
                const over = isOverQuota(dept.total, g.count, g.grade);
                return (
                  <div
                    key={g.grade}
                    className={`flex-1 rounded-lg p-2 text-center ${over ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
                  >
                    <div className={`text-xs font-bold ${gradeColors[g.grade].text}`}>{g.grade}</div>
                    <div className="text-sm font-bold text-gray-800">{g.count}</div>
                    <div className={`text-xs ${over ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{pct}%</div>
                    {over && <div className="text-xs text-red-500">⚠</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Total distribution bar */}
      <div className="card p-5">
        <div className="text-xs font-semibold text-gray-600 mb-3">전사 합계 분포</div>
        <div className="flex h-8 rounded-lg overflow-hidden mb-2">
          {(['S', 'A', 'B', 'C', 'D'] as const).map(g => {
            const pct = grandTotal > 0 ? (totalByGrade[g] / grandTotal) * 100 : 0;
            return pct > 0 ? (
              <div
                key={g}
                className="flex items-center justify-center text-white text-xs font-bold transition-all"
                style={{ width: `${pct}%`, backgroundColor: gradeColors[g].bg }}
              >
                {g} {totalByGrade[g]}명
              </div>
            ) : null;
          })}
        </div>
        <div className="flex gap-4">
          {(['S', 'A', 'B', 'C', 'D'] as const).map(g => (
            <div key={g} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gradeColors[g].bg }}></div>
              <span className="text-xs text-gray-600">{g}: {totalByGrade[g]}명 ({grandTotal > 0 ? Math.round((totalByGrade[g] / grandTotal) * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
