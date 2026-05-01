import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { defaultRules, type RulesState } from '../design/evaluationRulesData';
import { useActiveSeasons } from '../../../stores/seasonsStore';
import { fetchDepartmentList } from '../../../api/employee/employeeApi';
import { fetchRules, toFrontendRules } from '../../../api/evalRules';
import {
  fetchDraftList,
  calculateGrades,
  applyBiasAdjustment,
  applyDistribution,
  fetchDistributionDiff,
  fetchTeamBiasSummary,
  type DraftListItemDto,
  type EvalGradeSortField,
  type TeamBiasTeam,
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

  // 팀장 편향 보정 (Z-score) — 백엔드에서 팀별 보정 전/후 평균 조회
  const [teamBias, setTeamBias] = useState<TeamBiasTeam[]>([]);
  const [minTeamSize, setMinTeamSize] = useState<number>(5);
  const loadTeamBias = useCallback(async () => {
    if (!currentSeason) return;
    try {
      const res = await fetchTeamBiasSummary(currentSeason.id);
      setTeamBias(res.teams);
      setMinTeamSize(res.minTeamSize);
    } catch {
      setTeamBias([]);
    }
  }, [currentSeason]);
  useEffect(() => { loadTeamBias(); }, [loadTeamBias]);

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
        sortDirection: sortDir.toUpperCase() as 'ASC' | 'DESC',
        page: page - 1,
        size: PAGE_SIZE,
      });
      setRows(res.content);
      setTotalElements(res.totalElements);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? '목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [currentSeason, search, deptFilter, sortKey, sortDir, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, deptFilter, sortKey, sortDir]);

  const handleSort = (key: FrontSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: FrontSortKey) => {
    const active = sortKey === key;
    return <span className={`ml-1 ${active ? 'text-[#1D9E75]' : 'text-gray-300'}`}>⇅</span>;
  };

  const [showRecalcModal, setShowRecalcModal] = useState(false);
  // 모달 오픈 시 조회 — 현재 보정 건수 > 0 이면 재산정 시 리셋될 수 있음을 경고
  const [calibrationCount, setCalibrationCount] = useState(0);

  // 편향 보정 카드 가로 스크롤
  const biasScrollRef = useRef<HTMLDivElement>(null);
  const scrollBias = (dir: -1 | 1) => biasScrollRef.current?.scrollBy({ left: 200 * dir, behavior: 'smooth' });

  const openRecalcModal = async () => {
    if (!currentSeason) return;
    setCalibrationCount(0);
    setShowRecalcModal(true);
    try {
      const diff = await fetchDistributionDiff(currentSeason.id);
      setCalibrationCount(diff.calibrationCount);
    } catch {
      // 조회 실패해도 모달은 열어둠 — 경고만 미표시
    }
  };

  const handleRecalculate = async () => {
    setShowRecalcModal(false);
    if (!currentSeason) return;
    setRecalculating(true);
    try {
      await calculateGrades(currentSeason.id);
      await applyBiasAdjustment(currentSeason.id);
      // confirm=true 로 항상 호출 — 보정 이력 있으면 리셋 후 재배분, 없으면 그냥 배분
      await applyDistribution(currentSeason.id, true);
      await Promise.all([load(), loadTeamBias()]);
    } catch (e: unknown) {
      // axios 에러는 e.response.data.message 에 백엔드 실제 사유가 있음 (등급 산정 단계 외 호출 시 등)
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message ?? err?.message ?? '등급 재산정에 실패했습니다';
      alert(msg);
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
            onClick={openRecalcModal}
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
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-gray-500">팀장 편향 보정 (Z-score)</div>
              {(() => {
                const origs = teamBias.map(t => t.originalAvg);
                const adjs = teamBias.map(t => t.adjustedAvg);
                const stdDev = (arr: number[]) => {
                  if (arr.length === 0) return 0;
                  const m = arr.reduce((s, n) => s + n, 0) / arr.length;
                  return Math.sqrt(arr.reduce((s, n) => s + Math.pow(n - m, 2), 0) / arr.length);
                };
                const sigmaBefore = stdDev(origs);
                const sigmaAfter = stdDev(adjs);
                return (
                  <span className="text-[10px] text-gray-400">
                    표준편차 {sigmaBefore.toFixed(1)} → <span className="text-[#1D9E75] font-semibold">{sigmaAfter.toFixed(1)}</span>
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 text-gray-400">
                <span className="w-2.5 h-[2px] bg-gray-300" />적용 전
              </span>
              <span className="inline-flex items-center gap-1 text-[#1D9E75] font-medium">
                <span className="w-2.5 h-[2px] bg-[#1D9E75]" />적용 후
              </span>
            </div>
          </div>

          {/* 가로 스크롤 카드 — 팀별 before/after 요약 */}
          <div className="relative group">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white via-white/85 to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/85 to-transparent z-10" />

            {/* 은은한 이동 버튼 — hover 시에만 또렷해짐 */}
            <button
              type="button"
              onClick={() => scrollBias(-1)}
              aria-label="이전"
              className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/70 text-gray-400 opacity-40 group-hover:opacity-100 hover:bg-white hover:text-gray-700 hover:shadow-sm transition-all flex items-center justify-center"
            >
              <i className="fas fa-chevron-left text-[10px]"></i>
            </button>
            <button
              type="button"
              onClick={() => scrollBias(1)}
              aria-label="다음"
              className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/70 text-gray-400 opacity-40 group-hover:opacity-100 hover:bg-white hover:text-gray-700 hover:shadow-sm transition-all flex items-center justify-center"
            >
              <i className="fas fa-chevron-right text-[10px]"></i>
            </button>

            <div
              ref={biasScrollRef}
              className="overflow-x-auto hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              <div className="flex gap-2 px-10 py-1">
                {teamBias.length === 0 && (
                  <div className="shrink-0 w-full text-center text-[11px] text-gray-400 py-4">
                    팀별 편향 보정 데이터가 없습니다
                  </div>
                )}
                {teamBias.map(t => {
                  const diff = t.adjustedAvg - t.originalAvg;
                  const isDown = diff < 0;
                  const excluded = t.memberCount < minTeamSize || Math.abs(diff) < 0.05;
                  const reason = t.memberCount < minTeamSize ? '소규모' : '변화량 0';
                  // 카드에는 '팀' 접미사 제거해서 좁게
                  const shortName = t.deptName.replace(/팀$/, '');

                  // 제외된 팀 — 비활성 스타일
                  if (excluded) {
                    return (
                      <div
                        key={t.deptId}
                        title={`${t.deptName} — ${reason}으로 Z-score 보정 제외`}
                        className="shrink-0 w-[128px] bg-white border border-dashed border-gray-200 rounded-lg px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-400 truncate">{shortName}</span>
                          <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                            {reason}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 tabular-nums">
                          <span className="text-[15px] font-semibold text-gray-400">{t.originalAvg.toFixed(1)}</span>
                          <span className="text-[10px] text-gray-300 ml-0.5">{t.memberCount}명</span>
                        </div>
                      </div>
                    );
                  }

                  // 정상 보정 팀
                  return (
                    <div
                      key={t.deptId}
                      title={t.deptName}
                      className="shrink-0 w-[128px] bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 hover:border-gray-200 transition-colors"
                    >
                      {/* 상단: 팀명 + 변화량 */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-gray-700 truncate">{shortName}</span>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold shrink-0 ${
                          isDown ? 'text-[#1D9E75]' : 'text-[#3b82f6]'
                        }`}>
                          <i className={`fas fa-caret-${isDown ? 'down' : 'up'} text-[9px]`}></i>
                          {Math.abs(diff).toFixed(1)}
                        </span>
                      </div>

                      {/* 하단: 점수 이동 */}
                      <div className="flex items-baseline gap-1.5 tabular-nums">
                        <span className="text-[12px] text-gray-400">{t.originalAvg.toFixed(1)}</span>
                        <i className="fas fa-arrow-right text-gray-300 text-[8px]"></i>
                        <span className={`text-[15px] font-bold ${
                          isDown ? 'text-[#1D9E75]' : 'text-[#3b82f6]'
                        }`}>
                          {t.adjustedAvg.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
            {loading && rows.length === 0 ? (
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

      {showRecalcModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[440px]">
            <h3 className="text-[18px] font-semibold text-[#1a2b23] mb-2">등급 재산정</h3>
            <p className="text-[13px] text-[#5a6b62] mb-4">
              아래 단계를 순차적으로 실행합니다.
            </p>
            <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-5 h-5 rounded-full bg-[#1D9E75] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                <span className="text-[#1a2b23] font-medium">종합점수 산정</span>
                <span className="text-[11px] text-[#8a9490]">— 가중치 적용 점수 계산</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-5 h-5 rounded-full bg-[#1D9E75] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                <span className="text-[#1a2b23] font-medium">편향보정</span>
                <span className="text-[11px] text-[#8a9490]">— 팀 간 점수 편향 보정</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-5 h-5 rounded-full bg-[#1D9E75] text-white text-[11px] flex items-center justify-center font-bold">3</span>
                <span className="text-[#1a2b23] font-medium">강제배분</span>
                <span className="text-[11px] text-[#8a9490]">— 목표 비율에 맞춰 등급 배정</span>
              </div>
            </div>
            <div className="bg-[#fef3cd] border border-[#fde68a] rounded-lg p-3 mb-4 text-[11px] text-[#92400e]">
              기존 산정 결과가 있는 경우 모두 초기화 후 재산정됩니다.
            </div>
            {calibrationCount > 0 && (
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3 mb-4 text-[12px] text-[#b91c1c]">
                ⚠️ 기존 보정 <strong>{calibrationCount}건</strong>이 리셋됩니다.
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRecalcModal(false)}
                className="flex-1 border border-[#e0e5e3] bg-white rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
              >
                취소
              </button>
              <button
                onClick={handleRecalculate}
                className="flex-1 bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
              >
                재산정 실행
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
