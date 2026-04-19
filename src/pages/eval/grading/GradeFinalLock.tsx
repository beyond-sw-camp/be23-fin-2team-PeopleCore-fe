import { useState, useMemo } from 'react';
import { useActiveSeasons } from '../../../stores/seasonsStore';
import Pagination from '../../../components/Pagination';

type UnassignedSortField = 'id' | 'name' | 'dept' | 'rank';
type SortDir = 'asc' | 'desc';
const UNASSIGNED_PAGE_SIZE = 10;

interface EmployeeGrade {
  id: string;
  name: string;
  dept: string;
  rank: string;
  totalScore: number | null;
  finalGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  isCalibrated: boolean;
}

const mockData: EmployeeGrade[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', totalScore: 90.4, finalGrade: 'S', isCalibrated: false },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', totalScore: 88.0, finalGrade: 'S', isCalibrated: true },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', totalScore: 82.4, finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', totalScore: 88.4, finalGrade: 'A', isCalibrated: false },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', totalScore: 80.0, finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', totalScore: 75.2, finalGrade: 'B', isCalibrated: true },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', totalScore: 68.5, finalGrade: 'C', isCalibrated: false },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', totalScore: null, finalGrade: null, isCalibrated: false },
];

// 등급별 색상 (도넛/범례 공용)
const gradeColor: Record<'S' | 'A' | 'B' | 'C' | 'D', string> = {
  S: '#1D9E75', A: '#3B82F6', B: '#F59E0B', C: '#F97316', D: '#EF4444',
};

// 등급 부제 라벨
const gradeLabel: Record<'S' | 'A' | 'B' | 'C' | 'D', string> = {
  S: 'Excellent', A: 'Great', B: 'Good', C: 'Needs Imp.', D: 'Warning',
};

// 강제배분 목표 비율 (%) — 평가 규칙에서 가져와야 하지만 mock 단계에서 하드코딩
const targetRatio: Record<'S' | 'A' | 'B' | 'C' | 'D', number> = {
  S: 10, A: 25, B: 45, C: 15, D: 5,
};


export default function GradeFinalLock() {
  const seasons = useActiveSeasons();
  const currentSeason = seasons.find(s => s.status === '진행중') ?? seasons[0];
  const currentSeasonName = currentSeason?.name ?? '';
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // 미제출/미산정 직원에 대해 관리자가 "확인" 체크한 ID 집합 — 전부 체크하면 잠금 허용
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  // 미산정 직원 — 전원 확인 체크되면 잠금 가능
  const unassignedList = mockData.filter(e => !e.finalGrade);
  const allAcknowledged = unassignedList.every(e => acknowledged.has(e.id));
  const canLock = unassignedList.length === 0 || allAcknowledged;

  // 미산정 테이블: 부서 필터 + 정렬 + 페이징
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [sortField, setSortField] = useState<UnassignedSortField>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [unassignedPage, setUnassignedPage] = useState(1);

  const deptOptions = useMemo(
    () => Array.from(new Set(unassignedList.map(e => e.dept))).sort(),
    [unassignedList],
  );

  const filteredSortedUnassigned = useMemo(() => {
    const filtered = deptFilter ? unassignedList.filter(e => e.dept === deptFilter) : unassignedList;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [unassignedList, deptFilter, sortField, sortDir]);

  const pagedUnassigned = filteredSortedUnassigned.slice(
    (unassignedPage - 1) * UNASSIGNED_PAGE_SIZE,
    unassignedPage * UNASSIGNED_PAGE_SIZE,
  );

  const toggleSort = (f: UnassignedSortField) => {
    if (sortField === f) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
    setUnassignedPage(1);
  };

  const toggleAck = (id: string) => {
    setAcknowledged(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllAck = () => {
    setAcknowledged(prev =>
      prev.size === unassignedList.length ? new Set() : new Set(unassignedList.map(e => e.id)),
    );
  };

  // ─── 요약 통계 ───
  const totalCount = mockData.length;
  const calibratedCount = mockData.filter(e => e.isCalibrated).length;
  const calibratedRatio = totalCount > 0 ? (calibratedCount / totalCount) * 100 : 0;
  const scoredList = mockData.filter(e => e.totalScore !== null);
  const scores = scoredList.map(e => e.totalScore as number);
  const avgScore = scores.length > 0 ? scores.reduce((s, n) => s + n, 0) / scores.length : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  // 표준편차 (모집단 기준)
  const stdDev = scores.length > 0
    ? Math.sqrt(scores.reduce((s, n) => s + Math.pow(n - avgScore, 2), 0) / scores.length)
    : 0;

  // 등급별 인원 (미산정 제외)
  const gradeOrder = ['S', 'A', 'B', 'C', 'D'] as const;
  const gradeCounts = gradeOrder.reduce<Record<'S' | 'A' | 'B' | 'C' | 'D', number>>(
    (acc, g) => { acc[g] = 0; return acc; },
    { S: 0, A: 0, B: 0, C: 0, D: 0 },
  );
  mockData.forEach(e => { if (e.finalGrade) gradeCounts[e.finalGrade]++; });
  const assignedTotal = gradeOrder.reduce((s, g) => s + gradeCounts[g], 0);

  // 도넛용 conic-gradient 문자열 구성 (누적 비율)
  let cumulative = 0;
  const donutSegments = gradeOrder.map(g => {
    const pct = assignedTotal > 0 ? (gradeCounts[g] / assignedTotal) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    return `${gradeColor[g]} ${start}% ${cumulative}%`;
  }).join(', ');
  const donutBg = assignedTotal > 0
    ? `conic-gradient(${donutSegments})`
    : '#e5e7eb';

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
          <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
            {currentSeasonName}
          </div>
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

      {/* 상단 상태 배너 */}
      <div className={`rounded-xl px-5 py-3 mb-5 flex items-center gap-2 ${isLocked ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <i className={`fas ${isLocked ? 'fa-lock text-red-500' : 'fa-exclamation-triangle text-yellow-500'}`}></i>
        <span className={`text-sm font-semibold ${isLocked ? 'text-red-700' : 'text-yellow-700'}`}>
          {isLocked ? '확정 완료 · 수정 불가' : '보정 완료 후 최종 확정하세요'}
        </span>
      </div>

      {/* 핵심 지표 — 배정 완료 / 보정 이력 / 미산정 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-5 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="px-5 py-4 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">배정 완료</div>
            <div className="text-[18px] font-bold text-gray-800">
              {assignedTotal}<span className="text-[11px] text-gray-400">/{totalCount}명</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {totalCount > 0 ? ((assignedTotal / totalCount) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">미산정</div>
            <div className={`text-[18px] font-bold ${unassignedList.length > 0 ? 'text-[#ef4444]' : 'text-gray-800'}`}>
              {unassignedList.length}<span className="text-[11px] text-gray-400 ml-0.5">명</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {unassignedList.length === 0 ? '없음' : `확인 ${acknowledged.size}/${unassignedList.length}`}
            </div>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">보정 이력</div>
            <div className="text-[18px] font-bold text-gray-800">
              {calibratedCount}<span className="text-[11px] text-gray-400 ml-0.5">건</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{calibratedRatio.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* 미제출 · 미산정 직원 목록 — 표 + 부서 필터 + 정렬 + 페이징 (10개 고정 슬롯) */}
      <div className="bg-white border border-gray-200 rounded-xl mb-5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-gray-800">미제출 · 미산정 직원</h3>
            <span className="text-[11px] text-gray-400">
              {unassignedList.length === 0
                ? '없음'
                : `${unassignedList.length}명 · 확인 ${acknowledged.size}/${unassignedList.length}`}
            </span>
          </div>
          {unassignedList.length > 0 && (
            <button
              onClick={toggleAllAck}
              className="text-[11px] text-gray-500 hover:text-gray-800 underline"
            >
              {acknowledged.size === unassignedList.length ? '전체 해제' : '전체 확인'}
            </button>
          )}
        </div>

        {unassignedList.length === 0 ? (
          <div className="px-5 py-6 text-center text-[12px] text-gray-400">
            미산정 직원이 없습니다.
          </div>
        ) : (
          <>
            <p className="px-5 pt-3 text-[11px] text-gray-500">
              각 사원을 확인(체크)하면 미제출 상태로 잠글 수 있습니다. 잠금 이후에도 미산정 상태는 기록에 남습니다.
            </p>
            {/* 필터 바 */}
            <div className="px-5 pt-2 pb-1 flex items-center gap-2">
              <select
                value={deptFilter}
                onChange={e => { setDeptFilter(e.target.value); setUnassignedPage(1); }}
                className="border border-gray-200 rounded-md px-2 py-1 text-[12px] bg-white text-gray-700 min-w-[140px]"
              >
                <option value="">전체 부서</option>
                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {deptFilter && (
                <span className="text-[11px] text-gray-400">
                  {filteredSortedUnassigned.length}명 필터됨
                </span>
              )}
            </div>
            <div className="pt-2">
              <table className="w-full text-[12px] table-fixed">
                <colgroup>
                  <col className="w-[60px]" />
                  <col className="w-[120px]" />
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr className="text-[11px] text-gray-400 border-b border-gray-100">
                    <th className="text-center font-normal py-2.5 px-3">확인</th>
                    <SortHeader label="사번" field="id" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
                    <SortHeader label="이름" field="name" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
                    <SortHeader label="부서" field="dept" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
                    <SortHeader label="직급" field="rank" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {/* 10개 슬롯 고정 — 부족하면 빈 줄로 채움 */}
                  {Array.from({ length: UNASSIGNED_PAGE_SIZE }).map((_, i) => {
                    const e = pagedUnassigned[i];
                    if (!e) {
                      return (
                        <tr key={`empty-${i}`} className="border-b border-gray-50 last:border-0">
                          <td colSpan={5} className="py-2.5 px-3">&nbsp;</td>
                        </tr>
                      );
                    }
                    const checked = acknowledged.has(e.id);
                    return (
                      <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                        <td className="text-center py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAck(e.id)}
                            className="w-4 h-4 cursor-pointer accent-[#1D9E75]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 truncate">{e.id}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 truncate">{e.name}</td>
                        <td className="py-2.5 px-3 text-gray-600 truncate">{e.dept}</td>
                        <td className="py-2.5 px-3 text-gray-600 truncate">{e.rank}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <Pagination
                page={unassignedPage}
                total={filteredSortedUnassigned.length}
                pageSize={UNASSIGNED_PAGE_SIZE}
                onChange={setUnassignedPage}
              />
            </div>
          </>
        )}
      </div>

      {/* 확정 후 안내 */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 text-[12px] text-gray-600">
        최종 확정 후에는 평가 결과 수정이 제한됩니다.
      </div>

    </div>
  );
}

// 정렬 가능한 컬럼 헤더 — 클릭 시 같은 컬럼이면 방향 토글, 다른 컬럼이면 해당 컬럼 asc 로 전환
function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onClick,
}: {
  label: string;
  field: UnassignedSortField;
  sortField: UnassignedSortField;
  sortDir: SortDir;
  onClick: (f: UnassignedSortField) => void;
}) {
  const active = sortField === field;
  const arrow = !active ? '↕' : sortDir === 'asc' ? '↑' : '↓';
  return (
    <th
      onClick={() => onClick(field)}
      className={`text-left font-normal py-2.5 px-3 cursor-pointer select-none hover:text-gray-600 ${active ? 'text-[#1D9E75]' : ''}`}
    >
      {label} <span className="text-[10px]">{arrow}</span>
    </th>
  );
}
