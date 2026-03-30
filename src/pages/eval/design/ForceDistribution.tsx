import { useState } from 'react';

interface GradeRatio {
  grade: string;
  label: string;
  ratio: number;
  color: string;
}

interface HistoryEntry {
  date: string;
  changer: string;
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

const initialRatios: GradeRatio[] = [
  { grade: 'S', label: '탁월', ratio: 10, color: '#1D9E75' },
  { grade: 'A', label: '우수', ratio: 20, color: '#3B82F6' },
  { grade: 'B', label: '보통', ratio: 40, color: '#F59E0B' },
  { grade: 'C', label: '미흡', ratio: 20, color: '#F97316' },
  { grade: 'D', label: '부진', ratio: 10, color: '#EF4444' },
];

const mockHistory: HistoryEntry[] = [
  { date: '2024-05-20', changer: '이서연(인사팀)', s: 10, a: 20, b: 40, c: 20, d: 10 },
  { date: '2024-01-10', changer: '이서연(인사팀)', s: 5, a: 25, b: 45, c: 15, d: 10 },
  { date: '2023-11-01', changer: '정하은(재무팀)', s: 10, a: 20, b: 40, c: 20, d: 10 },
];

export default function ForceDistribution() {
  const [ratios, setRatios] = useState<GradeRatio[]>(initialRatios);
  const [editMode, setEditMode] = useState(false);
  const [tempRatios, setTempRatios] = useState<GradeRatio[]>(initialRatios);

  const total = tempRatios.reduce((s, r) => s + r.ratio, 0);

  const handleSave = () => {
    if (total !== 100) return;
    setRatios(tempRatios);
    setEditMode(false);
  };

  const maxRatio = Math.max(...ratios.map(r => r.ratio));

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 설계 › <span className="text-[#1D9E75] font-medium">강제배분 설정</span>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">강제배분 설정</h1>
        <p className="text-xs text-gray-400 mt-1">등급별 인원 비율을 설정합니다 (eval-4)</p>
      </div>

      {/* Grade ratio card */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-800">등급별 비율 설정</h2>
          {!editMode ? (
            <button
              onClick={() => { setEditMode(true); setTempRatios(ratios.map(r => ({ ...r }))); }}
              className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
            >
              수정
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${total === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                합계 {total}%
              </span>
              <button onClick={handleSave} className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">저장</button>
              <button onClick={() => setEditMode(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-4 h-36 mb-4 px-4">
          {ratios.map(r => (
            <div key={r.grade} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold" style={{ color: r.color }}>{r.ratio}%</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${(r.ratio / maxRatio) * 100}px`, backgroundColor: r.color, opacity: 0.85 }}
              ></div>
            </div>
          ))}
        </div>

        {/* Grade labels */}
        <div className="flex gap-4 px-4">
          {(editMode ? tempRatios : ratios).map((r, i) => (
            <div key={r.grade} className="flex-1 text-center">
              <div className="text-sm font-bold" style={{ color: r.color }}>{r.grade}</div>
              <div className="text-xs text-gray-400">{r.label}</div>
              {editMode ? (
                <input
                  type="number"
                  value={tempRatios[i].ratio}
                  onChange={e => {
                    const updated = [...tempRatios];
                    updated[i] = { ...updated[i], ratio: Number(e.target.value) };
                    setTempRatios(updated);
                  }}
                  className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-[#1D9E75]"
                />
              ) : (
                <div className="text-sm font-semibold text-gray-700 mt-1">{r.ratio}%</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">설정 이력</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">변경일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">변경자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">S%</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">A%</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">B%</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">C%</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">D%</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((h, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-600">{h.date}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{h.changer}</td>
                <td className="px-4 py-3 text-xs font-medium text-[#1D9E75]">{h.s}%</td>
                <td className="px-4 py-3 text-xs font-medium text-blue-500">{h.a}%</td>
                <td className="px-4 py-3 text-xs font-medium text-yellow-500">{h.b}%</td>
                <td className="px-4 py-3 text-xs font-medium text-orange-500">{h.c}%</td>
                <td className="px-4 py-3 text-xs font-medium text-red-500">{h.d}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
