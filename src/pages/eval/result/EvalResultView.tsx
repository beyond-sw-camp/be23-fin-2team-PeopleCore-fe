import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination';

interface Props {
  // 탭 기반 페이지(EvalAdminPage)에서 호출 시 — URL 변경 없이 상세 화면으로 전환
  onViewDetail?: (gradeId: number) => void
}
import {
  fetchAllResultSeasons,
  fetchFinalList,
  type SeasonOptionDto,
  type FinalGradeListItemDto,
} from '../../../api/evalGrade';
import { departmentApi, type DepartmentTreeResponse } from '../../../api/org';

const RESULT_PAGE_SIZE = 10;

const gradeColors: Record<string, string> = {
  S: 'bg-[#1D9E75]/10 text-[#1D9E75]',
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-yellow-100 text-yellow-700',
  C: 'bg-orange-100 text-orange-700',
  D: 'bg-red-100 text-red-700',
};

export default function EvalResultView({ onViewDetail }: Props = {}) {
  const navigate = useNavigate();
  const goDetail = (gradeId: number) => {
    if (onViewDetail) onViewDetail(gradeId)
    else navigate(`/eval/result/view/${gradeId}`)
  }

  const [seasons, setSeasons] = useState<SeasonOptionDto[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  const [depts, setDepts] = useState<DepartmentTreeResponse[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [list, setList] = useState<FinalGradeListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 시즌 + 부서 드롭다운 로드
  useEffect(() => {
    Promise.all([
      fetchAllResultSeasons(),
      departmentApi.getList().then(r => r.data).catch(() => []),
    ])
      .then(([seasonList, deptList]) => {
        setSeasons(seasonList);
        setDepts(deptList);
        if (seasonList.length > 0) {
          setSelectedSeasonId(seasonList[0].seasonId);
        } else {
          // 시즌 없으면 아래 목록 effect 가 안 돌아 로딩이 멈추지 않음 → 여기서 해제
          setLoading(false);
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((e: any) => {
        console.error('[EvalResultView] dropdowns failed', e);
        setError(e?.response?.data?.message || '시즌/부서 목록을 불러오지 못했습니다.');
        setLoading(false);
      });
  }, []);

  // 검색 입력 debounce (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // seasonId/필터/페이지 변경 시 목록 재조회
  useEffect(() => {
    if (!selectedSeasonId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetchFinalList(selectedSeasonId, {
      deptId: selectedDeptId === '' ? undefined : selectedDeptId,
      keyword: debouncedSearch || undefined,
      page: page - 1,
      size: RESULT_PAGE_SIZE,
    })
      .then(p => {
        setList(p.content);
        setTotal(p.totalElements);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((e: any) => {
        console.error('[EvalResultView] list failed', e);
        setError(e?.response?.data?.message || '결과 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [selectedSeasonId, selectedDeptId, debouncedSearch, page]);

  // 검색/부서/시즌 변경 시 페이지 초기화
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedDeptId, selectedSeasonId]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">평가 결과 조회</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 결과 조회</h1>
          <p className="text-xs text-gray-400 mt-1">진행 중 시즌의 잠정 결과와 확정된 결과를 모두 실시간으로 조회합니다.</p>
        </div>
        <select
          value={selectedSeasonId ?? ''}
          onChange={e => setSelectedSeasonId(Number(e.target.value))}
          disabled={seasons.length === 0}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75] disabled:bg-gray-50 disabled:text-gray-400"
        >
          {seasons.length === 0
            ? <option>시즌 없음</option>
            : seasons.map(s => (
                <option key={s.seasonId} value={s.seasonId}>
                  {s.name} {s.status === 'FINALIZED' ? '· 확정' : '· 진행중'}
                </option>
              ))}
        </select>
      </div>

      {/* Filters */}
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
          value={selectedDeptId}
          onChange={e => setSelectedDeptId(e.target.value === '' ? '' : Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
        >
          <option value="">전체 부서</option>
          {depts.map(d => (
            <option key={d.id} value={d.id}>{d.deptName}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl px-5 py-3 mb-4 bg-red-50 border border-red-200 text-sm text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">종합</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">예정등급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">확정등급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">보정</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs w-24">상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                  <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                  조회된 결과가 없습니다.
                </td>
              </tr>
            ) : (
              list.map(e => (
                <tr key={e.gradeId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500">{e.empNum}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.empName}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{e.deptName}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{e.position}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">{e.totalScore ?? '-'}</td>
                  <td className="px-4 py-3">
                    {e.autoGrade ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[e.autoGrade] ?? 'bg-gray-100 text-gray-600'}`}>{e.autoGrade}</span>
                    ) : <span className="text-xs text-gray-400">미산정</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.finalGrade ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[e.finalGrade] ?? 'bg-gray-100 text-gray-600'}`}>{e.finalGrade}</span>
                    ) : <span className="text-xs text-gray-400">미산정</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.isCalibrated ? (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">보정</span>
                    ) : <span className="text-xs text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => goDetail(e.gradeId)}
                      className="text-[11px] px-3 py-1 border border-[#1D9E75] text-[#1D9E75] rounded-md hover:bg-[#f2faf6]"
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={RESULT_PAGE_SIZE}
        onChange={setPage}
      />
    </div>
  );
}
