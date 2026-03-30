import { useState } from 'react';

interface CalibrationRecord {
  id: string;
  name: string;
  dept: string;
  rank: string;
  totalScore: number | null;
  autoGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  adjustedGrade: 'S' | 'A' | 'B' | 'C' | 'D' | '';
  reason: string;
}

const initialData: CalibrationRecord[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', totalScore: 90.4, autoGrade: 'S', adjustedGrade: 'S', reason: '' },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', totalScore: 82.4, autoGrade: 'A', adjustedGrade: 'A', reason: '' },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', totalScore: 88.0, autoGrade: 'A', adjustedGrade: 'S', reason: '팀 리더십 우수' },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', totalScore: 88.4, autoGrade: 'A', adjustedGrade: 'A', reason: '' },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', totalScore: 80.0, autoGrade: 'B', adjustedGrade: 'B', reason: '' },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', totalScore: null, autoGrade: 'B', adjustedGrade: 'B', reason: '' },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', totalScore: null, autoGrade: 'C', adjustedGrade: 'C', reason: '' },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', totalScore: null, autoGrade: 'C', adjustedGrade: '', reason: '' },
];

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };
const gradeTargets = { S: 10, A: 20, B: 40, C: 20, D: 10 };
const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function GradeCalibration() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [records, setRecords] = useState<CalibrationRecord[]>(initialData);

  const updateRecord = (id: string, field: 'adjustedGrade' | 'reason', value: string) => {
    setRecords(records.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  records.forEach(r => {
    const g = (r.adjustedGrade || r.autoGrade) as keyof typeof gradeCounts;
    if (g && g in gradeCounts) gradeCounts[g]++;
  });
  const gradedTotal = Object.values(gradeCounts).reduce((s, c) => s + c, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 등급 산정/보정 › <span className="text-[#1D9E75] font-medium">등급 보정</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">등급 보정 (Calibration)</h1>
          <p className="text-xs text-gray-400 mt-1">자동 산정 등급을 검토하고 보정합니다 (eval-17)</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-save"></i>보정 저장
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left panel */}
        <div className="col-span-8 card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">등급 보정 테이블</span>
            <span className="text-xs text-gray-400">보정 행은 강조 표시됩니다</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명/부서</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">종합점수</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">자동등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">보정등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">보정사유</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const isAdjusted = r.adjustedGrade && r.adjustedGrade !== r.autoGrade;
                return (
                  <tr key={r.id} className={`border-b border-gray-50 transition-colors ${isAdjusted ? 'bg-blue-50' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{r.name}</div>
                      <div className="text-xs text-gray-400">{r.dept}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.rank}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">{r.totalScore ?? '-'}</td>
                    <td className="px-4 py-3">
                      {r.autoGrade && <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[r.autoGrade]}`}>{r.autoGrade}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.adjustedGrade}
                        onChange={e => updateRecord(r.id, 'adjustedGrade', e.target.value)}
                        className={`border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#1D9E75] ${isAdjusted ? 'border-blue-300 bg-white' : 'border-gray-200'}`}
                      >
                        <option value="">선택</option>
                        {['S', 'A', 'B', 'C', 'D'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={r.reason}
                        onChange={e => updateRecord(r.id, 'reason', e.target.value)}
                        placeholder="보정 사유 입력"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1D9E75]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right panel: distribution */}
        <div className="col-span-4 card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">현재 등급 분포</h3>
          <div className="space-y-2 mb-4">
            {(['S', 'A', 'B', 'C', 'D'] as const).map(g => {
              const count = gradeCounts[g];
              const pct = gradedTotal > 0 ? Math.round((count / gradedTotal) * 100) : 0;
              const over = pct > gradeTargets[g];
              return (
                <div key={g}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-bold ${gradeColors[g].split(' ')[1]}`}>{g}</span>
                    <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>{count}명 ({pct}%) / 목표 {gradeTargets[g]}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: over ? '#EF4444' : g === 'S' ? '#1D9E75' : g === 'A' ? '#3B82F6' : g === 'B' ? '#F59E0B' : g === 'C' ? '#F97316' : '#EF4444' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <i className="fas fa-info-circle mr-1"></i>
            보정 시 전사 분포가 실시간 업데이트됩니다
          </div>
        </div>
      </div>
    </div>
  );
}
