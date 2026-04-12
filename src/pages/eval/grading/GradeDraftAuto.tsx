import { useState, useMemo, useEffect } from 'react';
import { defaultRules } from '../design/evaluationRulesData';
import { useActiveSeasons } from '../../../stores/seasonsStore';
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 10;
type SortKey = 'id' | 'name' | 'dept' | 'totalScore' | 'autoGrade';
type SortDir = 'asc' | 'desc';

interface GradeRecord {
  id: string;
  name: string;
  dept: string;
  rank: string;
  scores: Record<string, number | null>;   // 항목별 점수 (itemId → score)
  totalScore: number | null;
  autoGrade: string | null;
  draftStatus: '초안' | '확정대기';
}

const mockData: GradeRecord[] = [
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리',
    scores: { self: 82, manager: 85 }, totalScore: 84.1, autoGrade: 'A', draftStatus: '확정대기' },
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장',
    scores: { self: 90, manager: 92 }, totalScore: 91.4, autoGrade: 'S', draftStatus: '확정대기' },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원',
    scores: { self: 70, manager: null }, totalScore: null, autoGrade: null, draftStatus: '초안' },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임',
    scores: { self: 75, manager: null }, totalScore: null, autoGrade: null, draftStatus: '초안' },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장',
    scores: { self: 88, manager: 90 }, totalScore: 89.4, autoGrade: 'A', draftStatus: '확정대기' },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원',
    scores: { self: null, manager: null }, totalScore: null, autoGrade: null, draftStatus: '초안' },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리',
    scores: { self: 80, manager: 82 }, totalScore: 81.4, autoGrade: 'B', draftStatus: '확정대기' },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장',
    scores: { self: 85, manager: 88 }, totalScore: 87.1, autoGrade: 'A', draftStatus: '확정대기' },
];

export default function GradeDraftAuto() {
  const seasons = useActiveSeasons();
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.name ?? '');

  // 검색·정렬·페이지
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('전체');
  const [sortKey, setSortKey] = useState<SortKey>('totalScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // 평가 규칙 (관리자가 평가 규칙 페이지에서 설정한 값)
  const rules = defaultRules;

  // 등급 → 색상 매핑 (공유 규칙 기반)
  const gradeColorMap = useMemo(() => {
    const map: Record<string, { bg: string; text: string }> = {};
    rules.grades.forEach(g => {
      map[g.label] = { bg: `${g.color}1A`, text: g.color };
    });
    return map;
  }, [rules.grades]);

  // 등급 순서 맵 (정렬용)
  const gradeOrder = useMemo(() => {
    const m: Record<string, number> = {};
    rules.grades.forEach((g, i) => { m[g.label] = i; });
    return m;
  }, [rules.grades]);

  // 필터·정렬
  const filteredSorted = useMemo(() => {
    const filtered = mockData.filter(r => {
      if (deptFilter !== '전체' && r.dept !== deptFilter) return false;
      if (search && !r.name.includes(search) && !r.id.includes(search)) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'id') cmp = a.id.localeCompare(b.id);
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'dept') cmp = a.dept.localeCompare(b.dept);
      else if (sortKey === 'totalScore') cmp = (a.totalScore ?? -Infinity) - (b.totalScore ?? -Infinity);
      else if (sortKey === 'autoGrade') {
        const ao = a.autoGrade ? gradeOrder[a.autoGrade] ?? 999 : 999;
        const bo = b.autoGrade ? gradeOrder[b.autoGrade] ?? 999 : 999;
        cmp = ao - bo;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [search, deptFilter, sortKey, sortDir, gradeOrder]);

  useEffect(() => { setPage(1); }, [search, deptFilter, sortKey, sortDir]);

  const paged = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const depts = useMemo(
    () => ['전체', ...Array.from(new Set(mockData.map(m => m.dept)))],
    [],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-gray-300 ml-1">⇅</span>;
    return <span className="text-[#1D9E75] ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 등급 산정/보정 › <span className="text-[#1D9E75] font-medium">등급 초안 자동 산정</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">등급 초안 자동 산정</h1>
          <p className="text-xs text-gray-400 mt-1">평가 규칙에 설정된 가중치·배분 비율로 등급 초안을 자동 산정합니다.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
            {seasons.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-sync-alt"></i>등급 재산정
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* 종합점수 산출 공식 — 평가 규칙에서 가져옴 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-500">종합점수 산출 공식</div>
            <span className="text-[10px] text-gray-400">↗ 평가 규칙에서 설정</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {rules.items.map((it, i) => (
              <span key={it.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-400">+</span>}
                <span className="text-sm font-bold text-[#1D9E75]">
                  {it.name} × {it.weight}%
                </span>
              </span>
            ))}
            {rules.adjustments.filter(a => a.enabled).map(a => (
              <span key={a.id} className="flex items-center gap-2">
                <span className="text-gray-400">{a.points >= 0 ? '+' : '−'}</span>
                <span className={`text-sm font-bold ${a.points >= 0 ? 'text-[#2e9e6e]' : 'text-[#ef4444]'}`}>
                  {a.name}({Math.abs(a.points)})
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 등급별 목표 비율 — 평가 규칙에서 가져옴 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-500">등급별 목표 비율</div>
            <span className="text-[10px] text-gray-400">↗ 평가 규칙에서 설정</span>
          </div>
          <div className="flex gap-2">
            {rules.grades.map(g => (
              <div
                key={g.id}
                className="flex-1 text-center py-2 rounded-lg"
                style={{ backgroundColor: `${g.color}1A`, color: g.color }}
              >
                <div className="text-sm font-bold">{g.label}</div>
                <div className="text-xs">{g.ratio}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 검색·필터 */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <i className="fas fa-search text-gray-400 text-xs"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름/사번 검색"
            className="flex-1 text-sm focus:outline-none"
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
        >
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th onClick={() => handleSort('id')} className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100">
                사번{sortIcon('id')}
              </th>
              <th onClick={() => handleSort('name')} className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100">
                성명{sortIcon('name')}
              </th>
              <th onClick={() => handleSort('dept')} className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100">
                부서{sortIcon('dept')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th onClick={() => handleSort('totalScore')} className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100">
                종합점수{sortIcon('totalScore')}
              </th>
              <th onClick={() => handleSort('autoGrade')} className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100">
                자동등급{sortIcon('autoGrade')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">초안상태</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">검색 결과가 없습니다.</td></tr>
            )}
            {paged.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500">{e.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.dept}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.rank}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800">{e.totalScore ?? '-'}</td>
                <td className="px-4 py-3">
                  {e.autoGrade ? (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: gradeColorMap[e.autoGrade]?.bg,
                        color: gradeColorMap[e.autoGrade]?.text,
                      }}
                    >
                      {e.autoGrade}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">미산정</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${e.draftStatus === '확정대기' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.draftStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={filteredSorted.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />

      {/* Warning banner */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-2">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-sm"></i>
        <span className="text-xs text-yellow-700">HR 확정 전까지 초안 상태입니다. 보정 후 최종 확정이 필요합니다.</span>
      </div>
    </div>
  );
}
