import { useState, useEffect } from 'react';
import { useSeasons, refreshSeasons } from '../../../stores/seasonsStore';
import { useActiveStages } from '../../../hooks/useActiveStages';
import Pagination from '../../../components/Pagination';
import {
  fetchFinalizeSummary,
  fetchUnassignedList,
  finalizeGrades,
  type FinalizeSummaryDto,
  type UnassignedEmployeeDto,
} from '../../../api/evalGrade';

type UnassignedSortField = 'EMP_NUM' | 'EMP_NAME';
type SortDir = 'asc' | 'desc';
const UNASSIGNED_PAGE_SIZE = 10;

export default function GradeFinalLock() {
  const seasons = useSeasons();
  // 확정 후에도 동일 시즌을 계속 보여주기 위해 viewingSeasonId 로 고정
  const [viewingSeasonId, setViewingSeasonId] = useState<number | null>(null);
  useEffect(() => {
    if (viewingSeasonId === null && seasons.length > 0) {
      const inProgress = seasons.find(s => s.status === '진행중');
      setViewingSeasonId((inProgress ?? seasons[0]).id);
    }
  }, [seasons, viewingSeasonId]);

  const currentSeason = seasons.find(s => s.id === viewingSeasonId) ?? null;
  const currentSeasonName = currentSeason?.name ?? '';
  const seasonId = currentSeason?.id;
  const isLocked = currentSeason?.status === '완료';

  // FINALIZATION 단계 IN_PROGRESS 가 아니면 확정 불가 — 프런트 게이트
  const { isOpen: isStageOpen } = useActiveStages();
  const isFinalizationOpen = isStageOpen('FINALIZATION');

  const [summary, setSummary] = useState<FinalizeSummaryDto | null>(null);
  const [unassignedList, setUnassignedList] = useState<UnassignedEmployeeDto[]>([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [sortField, setSortField] = useState<UnassignedSortField>('EMP_NUM');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  // 체크한 미산정자 empId 집합 — 전부 체크돼야 확정 가능
  const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());

  // seasonId / 정렬 / 페이지 변경 시 데이터 재로드
  useEffect(() => {
    if (!seasonId) {
      // 시즌이 없으면 로딩 풀어서 "시즌이 없습니다" 분기 보여주기
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      fetchFinalizeSummary(seasonId),
      fetchUnassignedList(seasonId, {
        sortField,
        sortDirection: sortDir.toUpperCase() as 'ASC' | 'DESC',
        page: unassignedPage - 1,
        size: UNASSIGNED_PAGE_SIZE,
      }),
    ])
      .then(([s, p]) => {
        setSummary(s);
        setUnassignedList(p.content);
        setUnassignedTotal(p.totalElements);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((e: any) => {
        console.error('[GradeFinalLock] load failed', e);
        setError(e?.response?.data?.message || '데이터를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [seasonId, sortField, sortDir, unassignedPage]);

  // 전체 미산정자 수만큼 체크되면 잠금 가능 (페이지 전체 아니라 total 기준)
  // + FINALIZATION 단계가 IN_PROGRESS 여야만 확정 허용
  const allAcked = unassignedTotal === 0 || acknowledged.size >= unassignedTotal;
  const canLock = allAcked && isFinalizationOpen;

  const toggleSort = (f: UnassignedSortField) => {
    if (sortField === f) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
    setUnassignedPage(1);
  };

  const toggleAck = (id: number) => {
    setAcknowledged(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 전체 미산정자(모든 페이지) 체크/해제. 체크는 서버에서 전체 empId 한 번에 받아와 박음.
  const toggleAllAck = async () => {
    if (!seasonId || unassignedTotal === 0) return;
    if (acknowledged.size >= unassignedTotal) {
      setAcknowledged(new Set());
      return;
    }
    try {
      const p = await fetchUnassignedList(seasonId, {
        sortField,
        sortDirection: sortDir.toUpperCase() as 'ASC' | 'DESC',
        page: 0,
        size: unassignedTotal,
      });
      setAcknowledged(new Set(p.content.map(e => e.empId)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[GradeFinalLock] fetch all unassigned failed', e);
      setError(e?.response?.data?.message || '전체 확인 처리에 실패했습니다.');
    }
  };

  const doFinalize = async () => {
    if (!seasonId || !canLock) return;
    setSaving(true);
    setError(null);
    try {
      await finalizeGrades(seasonId, Array.from(acknowledged));
      setShowConfirm(false);
      // 시즌 상태 '완료' 로 갱신된 걸 store 에 반영
      await refreshSeasons();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[GradeFinalLock] finalize failed', e);
      setError(e?.response?.data?.message || '최종 확정에 실패했습니다.');
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  if (!currentSeason) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-500">
        시즌이 없습니다.
      </div>
    );
  }

  const totalCount = summary?.totalCount ?? 0;
  const assignedCount = summary?.assignedCount ?? 0;
  const unassignedCount = summary?.unassignedCount ?? 0;
  const calibratedCount = summary?.calibratedCount ?? 0;
  const assignedRatio = totalCount > 0 ? (assignedCount / totalCount) * 100 : 0;
  const calibratedRatio = totalCount > 0 ? (calibratedCount / totalCount) * 100 : 0;

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
              disabled={!canLock || loading || saving}
              title={!isFinalizationOpen ? '결과확정 단계가 아직 열리지 않았습니다' : undefined}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                canLock && !loading && !saving
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-lock"></i>최종 확정 및 잠금
            </button>
          ) : (
            <div className="flex items-center gap-1.5 border border-red-300 text-red-500 px-5 py-2.5 rounded-lg text-sm font-medium bg-red-50">
              <i className="fas fa-lock"></i>확정 완료
            </div>
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
            <p className="text-sm text-gray-600 mb-5">
              최종 확정 후에는 등급 수정이 불가하며 시즌이 자동으로 마감됩니다. 진행하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={doFinalize}
                disabled={saving}
                className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? '처리 중...' : '확정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에러 배너 */}
      {error && (
        <div className="rounded-xl px-5 py-3 mb-4 bg-red-50 border border-red-200 text-sm text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />
          {error}
        </div>
      )}

      {/* 상단 상태 배너 */}
      <div className={`rounded-xl px-5 py-3 mb-5 flex items-center gap-2 ${
        isLocked ? 'bg-red-50 border border-red-200'
        : !isFinalizationOpen ? 'bg-gray-50 border border-gray-200'
        : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <i className={`fas ${
          isLocked ? 'fa-lock text-red-500'
          : !isFinalizationOpen ? 'fa-clock text-gray-500'
          : 'fa-exclamation-triangle text-yellow-500'
        }`}></i>
        <span className={`text-sm font-semibold ${
          isLocked ? 'text-red-700'
          : !isFinalizationOpen ? 'text-gray-600'
          : 'text-yellow-700'
        }`}>
          {isLocked ? '확정 완료 · 수정 불가'
            : !isFinalizationOpen ? '결과확정 단계가 아직 열리지 않았습니다'
            : '보정 완료 후 최종 확정하세요'}
        </span>
      </div>

      {/* 핵심 지표 — 배정 완료 / 미산정 / 보정 이력 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-5 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="px-5 py-4 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">배정 완료</div>
            <div className="text-[18px] font-bold text-gray-800">
              {assignedCount}<span className="text-[11px] text-gray-400">/{totalCount}명</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{assignedRatio.toFixed(1)}%</div>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">미산정</div>
            <div className={`text-[18px] font-bold ${unassignedCount > 0 ? 'text-[#ef4444]' : 'text-gray-800'}`}>
              {unassignedCount}<span className="text-[11px] text-gray-400 ml-0.5">명</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {unassignedCount === 0 ? '없음' : `확인 ${acknowledged.size}/${unassignedCount}`}
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

      {/* 미제출 · 미산정 직원 목록 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-gray-800">미제출 · 미산정 직원</h3>
            <span className="text-[11px] text-gray-400">
              {unassignedCount === 0
                ? '없음'
                : `${unassignedCount}명 · 확인 ${acknowledged.size}/${unassignedCount}`}
            </span>
          </div>
          {unassignedList.length > 0 && (() => {
            const allChecked = unassignedTotal > 0 && acknowledged.size >= unassignedTotal;
            return (
              <button
                onClick={toggleAllAck}
                className={`inline-flex items-center gap-1.5 text-[12px] font-medium rounded-md px-3 py-1.5 transition-colors ${
                  allChecked
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-[#2e9e6e] text-white hover:bg-[#258a5c] shadow-sm'
                }`}
              >
                <i className={`fas ${allChecked ? 'fa-rotate-left' : 'fa-check'} text-[11px]`} />
                {allChecked ? '전체 해제' : '전체 확인완료'}
              </button>
            );
          })()}
        </div>

        {loading && unassignedList.length === 0 ? (
          <div className="px-5 py-10 text-center text-[12px] text-gray-400">
            <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
          </div>
        ) : unassignedCount === 0 ? (
          <div className="px-5 py-6 text-center text-[12px] text-gray-400">
            미산정 직원이 없습니다.
          </div>
        ) : (
          <>
            <p className="px-5 pt-3 text-[11px] text-gray-500">
              각 사원을 확인(체크)하면 미제출이 용인되어 시즌확정이 가능합니다.
            </p>
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
                    <SortHeader label="사번" field="EMP_NUM" sortField={sortField} onClick={toggleSort} />
                    <SortHeader label="이름" field="EMP_NAME" sortField={sortField} onClick={toggleSort} />
                    <th className="text-left font-normal py-2.5 px-3">부서</th>
                    <th className="text-left font-normal py-2.5 px-3">직급</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: UNASSIGNED_PAGE_SIZE }).map((_, i) => {
                    const e = unassignedList[i];
                    if (!e) {
                      return (
                        <tr key={`empty-${i}`} className="border-b border-gray-50 last:border-0">
                          <td colSpan={5} className="py-2.5 px-3">&nbsp;</td>
                        </tr>
                      );
                    }
                    const checked = acknowledged.has(e.empId);
                    return (
                      <tr key={e.empId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
                        <td className="text-center py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAck(e.empId)}
                            className="w-4 h-4 cursor-pointer accent-[#1D9E75]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 truncate">{e.empNum}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 truncate">{e.empName}</td>
                        <td className="py-2.5 px-3 text-gray-600 truncate">{e.deptName}</td>
                        <td className="py-2.5 px-3 text-gray-600 truncate">{e.position}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <Pagination
                page={unassignedPage}
                total={unassignedTotal}
                pageSize={UNASSIGNED_PAGE_SIZE}
                onChange={setUnassignedPage}
              />
            </div>
          </>
        )}
      </div>

      {/* 확정 안내 */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-800 mb-2">
          <i className="fas fa-info-circle text-[#1D9E75]"></i>
          최종 확정 및 잠금 안내
        </div>
        <ul className="text-[12px] text-gray-600 leading-6 list-disc pl-5 space-y-1">
          <li>보정을 완료한 후 <span className="font-medium text-gray-800">최종 확정</span>을 진행해야 합니다.</li>
          <li>최종 확정 시 해당 <span className="font-medium text-gray-800">시즌이 자동으로 마감</span>되며, 이후에는 등급 수정이 제한됩니다.</li>
          <li>
            시즌 마감일까지 확정 버튼을 누르지 않은 경우 <span className="font-medium text-gray-800">자동 확정</span>되지만,
            미산정 직원이 남아있다면 알림이 발송되며
            <span className="font-medium text-gray-800"> 수동 확정 및 시즌 종료 처리</span>가 필요합니다.
          </li>
        </ul>
      </div>

    </div>
  );
}

// 정렬 가능한 컬럼 헤더 — 클릭 시 같은 컬럼이면 방향 토글, 다른 컬럼이면 해당 컬럼 asc 로 전환
function SortHeader({
  label,
  field,
  sortField,
  onClick,
}: {
  label: string;
  field: UnassignedSortField;
  sortField: UnassignedSortField;
  onClick: (f: UnassignedSortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onClick(field)}
      className={`text-left font-normal py-2.5 px-3 cursor-pointer select-none hover:text-gray-600 ${active ? 'text-[#1D9E75]' : ''}`}
    >
      {label} <span className="text-[10px]">↕</span>
    </th>
  );
}
