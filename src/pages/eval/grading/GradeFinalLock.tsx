import { useState } from 'react';

interface EmployeeGrade {
  id: string;
  name: string;
  dept: string;
  rank: string;
  totalScore: number | null;
  autoGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  finalGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  isCalibrated: boolean;
}

const mockData: EmployeeGrade[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', totalScore: 90.4, autoGrade: 'S', finalGrade: 'S', isCalibrated: false },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', totalScore: 88.0, autoGrade: 'A', finalGrade: 'S', isCalibrated: true },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', totalScore: 82.4, autoGrade: 'A', finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', totalScore: 88.4, autoGrade: 'A', finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', totalScore: 80.0, autoGrade: 'B', finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', totalScore: null, autoGrade: 'B', finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', totalScore: null, autoGrade: 'C', finalGrade: 'C', isCalibrated: false },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', totalScore: null, autoGrade: 'C', finalGrade: null, isCalibrated: false },
];

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };
const gradeSolidColors: Record<string, string> = { S: '#1D9E75', A: '#3B82F6', B: '#F59E0B', C: '#F97316', D: '#EF4444' };
const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function GradeFinalLock() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  mockData.forEach(e => { if (e.finalGrade && e.finalGrade in gradeCounts) gradeCounts[e.finalGrade]++; });

  const checklist = [
    { label: '강제배분 비율 검토', done: true },
    { label: '보정 내역 검토', done: true },
    { label: '부서별 분포 확인', done: true },
    { label: '최종 확인', done: isLocked },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 등급 산정/보정 › <span className="text-[#1D9E75] font-medium">최종 등급 확정 및 잠금</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">최종 등급 확정 및 잠금</h1>
          <p className="text-xs text-gray-400 mt-1">평가 등급을 최종 확정하고 수정을 잠금합니다 (eval-18)</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          {!isLocked ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <i className="fas fa-lock"></i>최종 확정 및 잠금
            </button>
          ) : (
            <button
              onClick={() => setIsLocked(false)}
              className="flex items-center gap-1.5 border border-red-300 text-red-500 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
            >
              <i className="fas fa-lock-open"></i>잠금 해제 (HR 전용)
            </button>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-exclamation-triangle text-red-500"></i>
              <h3 className="text-base font-bold text-gray-900">최종 확정 확인</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">최종 확정 후에는 등급 수정이 불가합니다. 진행하시겠습니까?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
              <button onClick={() => { setIsLocked(true); setShowConfirm(false); }} className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">확정</button>
            </div>
          </div>
        </div>
      )}

      {/* Status banner */}
      <div className={`rounded-xl px-5 py-3 mb-5 flex items-center gap-2 ${isLocked ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <i className={`fas ${isLocked ? 'fa-lock text-red-500' : 'fa-exclamation-triangle text-yellow-500'}`}></i>
        <span className={`text-sm font-semibold ${isLocked ? 'text-red-700' : 'text-yellow-700'}`}>
          {isLocked ? '확정 완료 · 수정 불가' : '보정 완료 후 최종 확정하세요'}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-5">
        {/* Grade distribution */}
        <div className="col-span-8 card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">등급 분포 요약</h2>
          <div className="flex gap-3">
            {(['S', 'A', 'B', 'C', 'D'] as const).map(g => (
              <div key={g} className="flex-1 text-center py-4 rounded-xl" style={{ backgroundColor: `${gradeSolidColors[g]}15` }}>
                <div className="text-xl font-bold" style={{ color: gradeSolidColors[g] }}>{g}</div>
                <div className="text-2xl font-bold text-gray-800">{gradeCounts[g]}</div>
                <div className="text-xs text-gray-400">명</div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="col-span-4 card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">확정 전 체크리스트</h2>
          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${item.done ? 'bg-[#1D9E75] text-white' : 'bg-red-100 text-red-500'}`}>
                  {item.done ? <i className="fas fa-check text-xs"></i> : '✗'}
                </div>
                <span className={`text-xs ${item.done ? 'text-gray-700' : 'text-red-500 font-medium'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee cards */}
      <div className="grid grid-cols-2 gap-3">
        {mockData.map(emp => (
          <div key={emp.id} className={`card p-4 flex items-center justify-between ${isLocked ? 'opacity-90' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm">
                {emp.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{emp.name}</div>
                <div className="text-xs text-gray-400">{emp.dept} · {emp.rank} · {emp.totalScore ?? '-'}점</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {emp.isCalibrated && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">보정</span>
              )}
              {emp.finalGrade ? (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[emp.finalGrade]}`}>{emp.finalGrade}</span>
              ) : (
                <span className="text-xs text-gray-400">미산정</span>
              )}
              {isLocked && <i className="fas fa-lock text-gray-300 text-sm"></i>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
