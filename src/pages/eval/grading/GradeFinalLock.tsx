import { useState, useMemo } from 'react';
import { useActiveSeasons } from '../../../stores/seasonsStore';

interface EmployeeGrade {
  id: string;
  name: string;
  dept: string;
  rank: string;
  totalScore: number | null;
  autoGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  finalGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  isCalibrated: boolean;
  calibrationReason?: string;
}

const mockData: EmployeeGrade[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', totalScore: 90.4, autoGrade: 'S', finalGrade: 'S', isCalibrated: false },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', totalScore: 88.0, autoGrade: 'A', finalGrade: 'S', isCalibrated: true, calibrationReason: '팀 리딩 성과 반영' },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', totalScore: 82.4, autoGrade: 'A', finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', totalScore: 88.4, autoGrade: 'A', finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', totalScore: 80.0, autoGrade: 'B', finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', totalScore: null, autoGrade: 'B', finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', totalScore: null, autoGrade: 'C', finalGrade: 'C', isCalibrated: false },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', totalScore: null, autoGrade: 'C', finalGrade: null, isCalibrated: false },
];

// 강제배분 목표 비율 (%)
const targetDistribution: Record<'S' | 'A' | 'B' | 'C' | 'D', number> = {
  S: 10, A: 30, B: 40, C: 15, D: 5,
};

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };
const gradeSolidColors: Record<string, string> = { S: '#1D9E75', A: '#3B82F6', B: '#F59E0B', C: '#F97316', D: '#EF4444' };

export default function GradeFinalLock() {
  const seasons = useActiveSeasons();
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.name ?? '');
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const total = mockData.length;

  // 등급 카운트 & 실제 비율
  const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  mockData.forEach(e => { if (e.finalGrade && e.finalGrade in gradeCounts) gradeCounts[e.finalGrade]++; });

  // 미산정 직원
  const unassignedList = mockData.filter(e => !e.finalGrade);

  // 점수 누락 직원 (totalScore null)
  const missingScoreList = mockData.filter(e => e.totalScore === null);

  // 비율 불일치 등급 (실제 인원 vs 목표 slot 인원 차이 >= 1)
  const quotaIssues = useMemo(() => {
    return (['S', 'A', 'B', 'C', 'D'] as const).map(g => {
      const targetCount = Math.round(total * targetDistribution[g] / 100);
      const actualCount = gradeCounts[g];
      const diff = actualCount - targetCount;
      return { grade: g, targetCount, actualCount, diff };
    }).filter(q => q.diff !== 0);
  }, [total, gradeCounts]);

  const checklist = [
    { label: '강제배분 비율 일치', done: quotaIssues.length === 0 },
    { label: '점수 누락자 없음', done: missingScoreList.length === 0 },
    { label: '미산정 직원 처리', done: unassignedList.length === 0 },
  ];

  const canLock = unassignedList.length === 0 && quotaIssues.length === 0 && missingScoreList.length === 0;

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
            {seasons.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          {!isLocked ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canLock}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                canLock ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
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

      {/* 미산정 상태 */}
      <div className={`rounded-xl px-5 py-3 mb-5 border ${
        unassignedList.length > 0 ? 'bg-red-50 border-red-200' : 'bg-[#eaf6f0] border-[#d4ecdd]'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <i className={`fas ${unassignedList.length > 0 ? 'fa-exclamation-circle text-red-500' : 'fa-check-circle text-[#2e9e6e]'}`}></i>
          <span className={`text-sm font-semibold ${unassignedList.length > 0 ? 'text-red-700' : 'text-[#1D9E75]'}`}>
            {unassignedList.length > 0
              ? `미산정 직원 ${unassignedList.length}명 — 등급 지정 후 잠금 가능합니다`
              : '미산정 직원 없음 ✓'}
          </span>
        </div>
        {unassignedList.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-6">
            {unassignedList.map(e => (
              <span key={e.id} className="text-xs px-2 py-0.5 bg-white border border-red-200 text-red-600 rounded-full">
                {e.name} ({e.dept}/{e.rank})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 점수 누락 상태 */}
      <div className={`rounded-xl px-5 py-3 mb-5 border ${
        missingScoreList.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-[#eaf6f0] border-[#d4ecdd]'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <i className={`fas ${missingScoreList.length > 0 ? 'fa-exclamation-circle text-orange-500' : 'fa-check-circle text-[#2e9e6e]'}`}></i>
          <span className={`text-sm font-semibold ${missingScoreList.length > 0 ? 'text-orange-700' : 'text-[#1D9E75]'}`}>
            {missingScoreList.length > 0
              ? `종합점수 누락 ${missingScoreList.length}명 — 평가 미제출 또는 점수 미산정`
              : '종합점수 누락 없음 ✓'}
          </span>
        </div>
        {missingScoreList.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-6">
            {missingScoreList.map(e => (
              <span key={e.id} className="text-xs px-2 py-0.5 bg-white border border-orange-200 text-orange-600 rounded-full">
                {e.name} ({e.dept}/{e.rank})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 비율 불일치 상태 */}
      <div className={`rounded-xl px-5 py-3 mb-5 border ${
        quotaIssues.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#eaf6f0] border-[#d4ecdd]'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <i className={`fas ${quotaIssues.length > 0 ? 'fa-exclamation-circle text-amber-500' : 'fa-check-circle text-[#2e9e6e]'}`}></i>
          <span className={`text-sm font-semibold ${quotaIssues.length > 0 ? 'text-amber-700' : 'text-[#1D9E75]'}`}>
            {quotaIssues.length > 0
              ? `강제배분 비율 불일치 ${quotaIssues.length}개 등급 — 보정 단계에서 조정이 필요합니다`
              : '강제배분 비율 목표와 일치 ✓'}
          </span>
        </div>
        {quotaIssues.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-6">
            {quotaIssues.map(q => (
              <span key={q.grade} className={`text-xs px-2 py-0.5 bg-white border border-amber-200 rounded-full font-medium ${
                q.diff > 0 ? 'text-red-600' : 'text-amber-700'
              }`}>
                <span className={`px-1.5 py-0 rounded mr-1 ${gradeColors[q.grade]}`}>{q.grade}</span>
                {q.actualCount}명 / 목표 {q.targetCount}명 ({q.diff > 0 ? '+' : ''}{q.diff}명 {q.diff > 0 ? '초과' : '부족'})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5 mb-5">
        {/* 목표 vs 실제 비율 비교 */}
        <div className="col-span-8 card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">강제배분 목표 vs 실제 비율</h2>
          <div className="space-y-2.5">
            {(['S', 'A', 'B', 'C', 'D'] as const).map(g => {
              const target = targetDistribution[g];
              const actualCount = gradeCounts[g];
              const actual = total > 0 ? (actualCount / total) * 100 : 0;
              const diff = actual - target;
              return (
                <div key={g} className="flex items-center gap-3">
                  <span className={`w-7 text-center text-sm font-bold rounded ${gradeColors[g]}`}>{g}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                        {/* 목표선 */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                          style={{ left: `${target}%` }}
                        />
                        {/* 실제 */}
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(actual, 100)}%`, backgroundColor: gradeSolidColors[g] }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">목표 {target}% · 실제 {actual.toFixed(1)}% ({actualCount}명)</span>
                      <span className={`font-medium ${Math.abs(diff) < 5 ? 'text-[#1D9E75]' : 'text-orange-500'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%p {Math.abs(diff) < 5 ? '✓' : '⚠'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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

    </div>
  );
}
