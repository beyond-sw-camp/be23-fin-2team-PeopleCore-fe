import { useState, useMemo, useEffect, useCallback } from 'react';
import { defaultRules, type RulesState } from '../design/evaluationRulesData';
import { useActiveSeasons } from '../../../stores/seasonsStore';
import { fetchDepartmentList } from '../../../api/employee/employeeApi';
import { fetchRules, toFrontendRules } from '../../../api/evalRules';
import {
  fetchDraftList,
  calculateGrades,
  applyBiasAdjustment,
  applyDistribution,
  type DraftListItemDto,
  type EvalGradeSortField,
} from '../../../api/evalGrade';
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 10;

type FrontSortKey = 'id' | 'name' | 'totalScore' | 'autoGrade';

const sortFieldMap: Record<FrontSortKey, EvalGradeSortField> = {
  id: 'EMP_NUM',
  name: 'EMP_NAME',
  totalScore: 'TOTAL_SCORE',
  autoGrade: 'AUTO_GRADE',
};

interface DeptOption { id: number; name: string }

export default function GradeDraftAuto() {
  const seasons = useActiveSeasons();
  const currentSeason = seasons.find(s => s.status === '진행중') ?? seasons[0];

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<FrontSortKey>('totalScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<DraftListItemDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const [depts, setDepts] = useState<DeptOption[]>([]);
  useEffect(() => {
    fetchDepartmentList()
      .then(list => setDepts(list.map(d => ({ id: d.id, name: d.deptName }))))
      .catch(() => {});
  }, []);

  // 백엔드에서 시즌 규칙 조회 (없으면 프론트 기본값 fallback)
  const [rules, setRules] = useState<RulesState>(defaultRules);
  useEffect(() => {
    if (!currentSeason) return;
    fetchRules(currentSeason.id)
      .then(dto => {
        if (dto) setRules(toFrontendRules(dto));
        else setRules(defaultRules);
      })
      .catch(() => setRules(defaultRules));
  }, [currentSeason]);

  const gradeColorMap = useMemo(() => {
    const map: Record<string, { bg: string; text: string }> = {};
    rules.grades.forEach(g => { map[g.label] = { bg: `${g.color}1A`, text: g.color }; });
    return map;
  }, [rules.grades]);

  const load = useCallback(async () => {
    if (!currentSeason) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDraftList(currentSeason.id, {
        keyword: search || undefined,
        deptId: deptFilter ?? undefined,
        sortField: sortFieldMap[sortKey],
        page: page - 1,
        size: PAGE_SIZE,
      });
      setRows(res.content);
      setTotalElements(res.totalElements);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [currentSeason, search, deptFilter, sortKey, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, deptFilter, sortKey, sortDir]);

  const handleSort = (key: FrontSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: FrontSortKey) => {
    if (sortKey !== key) return <span className="text-gray-300 ml-1">⇅</span>;
    return <span className="text-[#1D9E75] ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  const handleRecalculate = async () => {
    if (!currentSeason) return;
    if (!confirm('종합점수 산정 → 편향보정 → 강제배분을 순차적으로 실행합니다. 진행하시겠습니까?')) return;
    setRecalculating(true);
    try {
      await calculateGrades(currentSeason.id);
      await applyBiasAdjustment(currentSeason.id);
      await applyDistribution(currentSeason.id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '등급 재산정에 실패했습니다');
    } finally {
      setRecalculating(false);
    }
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
          <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
            {currentSeason?.name ?? '시즌 없음'}
          </div>
          <button
            disabled={recalculating || !currentSeason}
            onClick={handleRecalculate}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors disabled:opacity-50"
          >
            <i className={`fas fa-sync-alt ${recalculating ? 'animate-spin' : ''}`}></i>
            {recalculating ? '산정 중...' : '등급 재산정'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
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
          value={deptFilter ?? ''}
          onChange={e => setDeptFilter(e.target.value ? Number(e.target.value) : null)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
        >
          <option value="">전체 부서</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-600">{error}</div>
      )}

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
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th onClick={() => handleSort('totalScore')} className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100">
                종합점수{sortIcon('totalScore')}
              </th>
              <th onClick={() => handleSort('autoGrade')} className="text-left px-4 py-3 font-medium text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100">
                자동등급{sortIcon('autoGrade')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">불러오는 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">검색 결과가 없습니다.</td></tr>
            ) : rows.map(e => (
              <tr key={e.empNum} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500">{e.empNum}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.deptName}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.position}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800">{e.totalScore != null ? Number(e.totalScore) : '-'}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={totalElements}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-2">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-sm"></i>
        <span className="text-xs text-yellow-700">자동 산정된 등급은 초안입니다. 등급 보정과 최종 확정을 거쳐야 공개됩니다.</span>
      </div>
    </div>
  );
}
