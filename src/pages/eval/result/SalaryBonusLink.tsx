import { useState } from 'react';

interface GradeBonus {
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  bonusRate: number;
  count: number;
  baseSalary: number;
}

interface PersonBonus {
  name: string;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  baseSalary: number;
  bonusRate: number;
}

const initialGradeData: GradeBonus[] = [
  { grade: 'S', bonusRate: 200, count: 2, baseSalary: 5000000 },
  { grade: 'A', bonusRate: 150, count: 2, baseSalary: 4500000 },
  { grade: 'B', bonusRate: 100, count: 2, baseSalary: 4000000 },
  { grade: 'C', bonusRate: 50, count: 1, baseSalary: 3500000 },
  { grade: 'D', bonusRate: 0, count: 0, baseSalary: 3000000 },
];

const personBonuses: PersonBonus[] = [
  { name: '이서연', grade: 'S', baseSalary: 5200000, bonusRate: 200 },
  { name: '윤재혁', grade: 'S', baseSalary: 6000000, bonusRate: 200 },
  { name: '김민수', grade: 'A', baseSalary: 4500000, bonusRate: 150 },
  { name: '정하은', grade: 'A', baseSalary: 5000000, bonusRate: 150 },
  { name: '오나영', grade: 'B', baseSalary: 4000000, bonusRate: 100 },
  { name: '최유진', grade: 'B', baseSalary: 3800000, bonusRate: 100 },
  { name: '박지훈', grade: 'C', baseSalary: 3300000, bonusRate: 50 },
];

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };
const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function SalaryBonusLink() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [gradeData, setGradeData] = useState<GradeBonus[]>(initialGradeData);
  const [transmitted, setTransmitted] = useState(false);

  const formatKRW = (n: number) => `${(n / 10000).toFixed(0)}만원`;

  const totalBonus = gradeData.reduce((s, g) => s + (g.baseSalary * (g.bonusRate / 100) * g.count), 0);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">급여/인센티브 연동</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">급여/인센티브 연동</h1>
          <p className="text-xs text-gray-400 mt-1">평가 등급별 인센티브를 설정하고 급여 모듈에 전달합니다 (eval-20)</p>
        </div>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl px-5 py-3 mb-5 flex items-center gap-2 ${transmitted ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <i className={`fas ${transmitted ? 'fa-check-circle text-green-500' : 'fa-exclamation-triangle text-yellow-500'}`}></i>
        <span className={`text-sm font-semibold ${transmitted ? 'text-green-700' : 'text-yellow-700'}`}>
          {transmitted ? '급여 모듈 전달 완료 · 급여 계산이 가능합니다' : '급여 모듈 미전달 · 전달 완료 후 급여 계산이 가능합니다'}
        </span>
      </div>

      {/* Grade bonus table */}
      <div className="card overflow-hidden mb-5">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">등급별 인센티브 설정</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">등급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">기본인센티브율</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">1인평균</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">인원수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">합계</th>
            </tr>
          </thead>
          <tbody>
            {gradeData.map((g, idx) => {
              const perPerson = g.baseSalary * (g.bonusRate / 100);
              const total = perPerson * g.count;
              return (
                <tr key={g.grade} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[g.grade]}`}>{g.grade}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={g.bonusRate}
                        onChange={e => {
                          const updated = [...gradeData];
                          updated[idx] = { ...updated[idx], bonusRate: Number(e.target.value) };
                          setGradeData(updated);
                        }}
                        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-[#1D9E75]"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">{formatKRW(perPerson)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{g.count}명</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">{g.count > 0 ? formatKRW(total) : '-'}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-700">총 합계</td>
              <td className="px-4 py-3 text-sm font-bold text-[#1D9E75]">{formatKRW(totalBonus)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Person preview */}
      <div className="card overflow-hidden mb-5">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">개인별 예상 인센티브</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">등급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">기준급여</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">인센티브율</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">예상 보너스</th>
            </tr>
          </thead>
          <tbody>
            {personBonuses.map(p => {
              const rateData = gradeData.find(g => g.grade === p.grade);
              const rate = rateData?.bonusRate ?? p.bonusRate;
              const bonus = p.baseSalary * (rate / 100);
              return (
                <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[p.grade]}`}>{p.grade}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatKRW(p.baseSalary)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rate}%</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#1D9E75]">{formatKRW(bonus)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Transmit button */}
      <div className="flex items-center justify-between card p-4">
        <div className="text-xs text-gray-500">
          <i className="fas fa-exclamation-circle text-orange-400 mr-1"></i>
          급여 모듈 전달 후에는 인센티브율 수정이 제한됩니다. 신중하게 확인 후 전달하세요.
        </div>
        <button
          onClick={() => setTransmitted(true)}
          disabled={transmitted}
          className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-paper-plane"></i>급여 모듈 전달
        </button>
      </div>
    </div>
  );
}
