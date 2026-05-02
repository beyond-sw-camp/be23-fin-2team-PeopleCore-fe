import { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  dept: string;
  rank: string;
}

interface PeerMapping {
  evaluateeId: string;
  evaluatorIds: string[];
}

const allEmployees: Employee[] = [
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리' },
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장' },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원' },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임' },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장' },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원' },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리' },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장' },
];

const initialMappings: PeerMapping[] = [
  { evaluateeId: 'PC2024001', evaluatorIds: ['PC2024006', 'PC2024008', 'PC2024003'] },
  { evaluateeId: 'PC2024002', evaluatorIds: ['PC2024007', 'PC2024005'] },
  { evaluateeId: 'PC2024004', evaluatorIds: ['PC2024003', 'PC2024005'] },
];

const seasons = ['2025년 상반기 정기평가', '2024년 하반기 정기평가', '2024년 상반기 정기평가'];

const emp = (id: string) => allEmployees.find(e => e.id === id)!;

export default function PeerAssignment() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [mappings, setMappings] = useState<PeerMapping[]>(initialMappings);
  const [mode, setMode] = useState<'list' | 'auto' | 'manual'>('list');
  const [deptFilter, setDeptFilter] = useState('전체');

  // 자동배정 설정
  const [autoCount, setAutoCount] = useState(3);
  const [autoScope, setAutoScope] = useState<'same' | 'cross' | 'all'>('all');
  const [autoExcludeSelf, setAutoExcludeSelf] = useState(true);

  // 수동배정
  const [manualTarget, setManualTarget] = useState<string>('');
  const [manualSelected, setManualSelected] = useState<string[]>([]);

  // 수정 모달
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editSelected, setEditSelected] = useState<string[]>([]);

  const depts = ['전체', ...Array.from(new Set(allEmployees.map(e => e.dept)))];

  const mapped = new Set(mappings.map(m => m.evaluateeId));
  const unmappedEmployees = allEmployees.filter(e => !mapped.has(e.id));
  const totalMapped = mappings.length;
  const avgEvaluators = mappings.length > 0 ? mappings.reduce((s, m) => s + m.evaluatorIds.length, 0) / mappings.length : 0;

  const filteredMappings = mappings.filter(m => {
    if (deptFilter === '전체') return true;
    return emp(m.evaluateeId).dept === deptFilter;
  });

  // 자동배정 실행
  const handleAutoAssign = () => {
    const newMappings: PeerMapping[] = allEmployees.map(target => {
      let candidates = allEmployees.filter(e => {
        if (autoExcludeSelf && e.id === target.id) return false;
        if (autoScope === 'same') return e.dept === target.dept;
        if (autoScope === 'cross') return e.dept !== target.dept;
        return true;
      });
      // 랜덤 셔플 후 자르기
      candidates = candidates.sort(() => Math.random() - 0.5).slice(0, autoCount);
      return { evaluateeId: target.id, evaluatorIds: candidates.map(c => c.id) };
    });
    setMappings(newMappings);
    setMode('list');
  };

  // 수동배정 저장
  const handleManualSave = () => {
    if (!manualTarget || manualSelected.length === 0) return;
    const existing = mappings.findIndex(m => m.evaluateeId === manualTarget);
    if (existing >= 0) {
      const updated = [...mappings];
      updated[existing] = { ...updated[existing], evaluatorIds: manualSelected };
      setMappings(updated);
    } else {
      setMappings([...mappings, { evaluateeId: manualTarget, evaluatorIds: manualSelected }]);
    }
    setManualTarget('');
    setManualSelected([]);
    setMode('list');
  };

  // 수정 저장
  const handleEditSave = () => {
    if (!editTarget) return;
    setMappings(mappings.map(m => m.evaluateeId === editTarget ? { ...m, evaluatorIds: editSelected } : m));
    setEditTarget(null);
  };

  // 삭제
  const handleDelete = (evaluateeId: string) => {
    setMappings(mappings.filter(m => m.evaluateeId !== evaluateeId));
  };

  const toggleEvaluator = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 설계 › <span className="text-[#1D9E75] font-medium">동료평가 대상자 지정</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">동료평가 대상자 지정</h1>
          <p className="text-xs text-gray-400 mt-1">동료평가 피평가자에게 평가자를 배정합니다</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          >
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <button
            onClick={() => setMode('auto')}
            className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
          >
            <i className="fas fa-magic mr-1.5"></i>자동 배정
          </button>
          <button
            onClick={() => { setMode('manual'); setManualTarget(''); setManualSelected([]); }}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
          >
            <i className="fas fa-hand-pointer"></i>수동 지정
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">배정 완료</div>
          <div className="text-2xl font-bold text-gray-800">{totalMapped}<span className="text-sm font-normal text-gray-400">/{allEmployees.length}명</span></div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">평균 평가자 수</div>
          <div className="text-2xl font-bold text-[#1D9E75]">{avgEvaluators.toFixed(1)}명</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 mb-1">미배정</div>
          <div className="text-2xl font-bold text-red-500">{unmappedEmployees.length}명</div>
          {unmappedEmployees.length > 0 && (
            <div className="text-[10px] text-gray-400 mt-1">{unmappedEmployees.map(e => e.name).join(', ')}</div>
          )}
        </div>
      </div>

      {/* ========== 자동 배정 패널 ========== */}
      {mode === 'auto' && (
        <div className="card mb-5 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">자동 배정 설정</h2>
            <p className="text-xs text-gray-400 mt-1">조건을 설정하면 전체 사원에게 평가자를 자동 배정합니다</p>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-3 gap-6 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">평가자 수 (인당)</label>
                <select
                  value={autoCount}
                  onChange={e => setAutoCount(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
                >
                  {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}명</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">배정 범위</label>
                <select
                  value={autoScope}
                  onChange={e => setAutoScope(e.target.value as 'same' | 'cross' | 'all')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
                >
                  <option value="all">전체 (부서 무관)</option>
                  <option value="same">동일 부서만</option>
                  <option value="cross">타 부서만</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">옵션</label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoExcludeSelf}
                    onChange={e => setAutoExcludeSelf(e.target.checked)}
                    className="accent-[#1D9E75]"
                  />
                  <span className="text-sm text-gray-700">본인 제외</span>
                </label>
              </div>
            </div>

            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3 text-xs text-[#1e40af] mb-5">
              <i className="fas fa-info-circle mr-1"></i>
              자동 배정 시 기존 배정 내역이 <strong>모두 초기화</strong>됩니다. 배정 후 개별 수정이 가능합니다.
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setMode('list')} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
              <button onClick={handleAutoAssign} className="bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
                <i className="fas fa-magic mr-1.5"></i>자동 배정 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 수동 지정 패널 ========== */}
      {mode === 'manual' && (
        <div className="card mb-5 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">수동 지정</h2>
            <p className="text-xs text-gray-400 mt-1">피평가자를 선택한 후 평가자를 직접 지정합니다</p>
          </div>
          <div className="px-6 py-5">
            {/* 피평가자 선택 */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">피평가자 선택 <span className="text-red-400">*</span></label>
              <select
                value={manualTarget}
                onChange={e => { setManualTarget(e.target.value); setManualSelected([]); }}
                className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
              >
                <option value="">선택하세요</option>
                {allEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.dept} · {e.rank})</option>
                ))}
              </select>
            </div>

            {/* 평가자 선택 */}
            {manualTarget && (
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  평가자 선택 <span className="text-[#1D9E75] font-normal">({manualSelected.length}명 선택)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {allEmployees.filter(e => e.id !== manualTarget).map(e => {
                    const isSelected = manualSelected.includes(e.id);
                    return (
                      <div
                        key={e.id}
                        onClick={() => toggleEvaluator(manualSelected, setManualSelected, e.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#1D9E75] bg-[#eaf6f0]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-[#1D9E75] border-[#1D9E75] text-white' : 'border-gray-300'
                          }`}>
                            {isSelected && <i className="fas fa-check"></i>}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{e.name}</div>
                            <div className="text-[11px] text-gray-400">{e.dept} · {e.rank}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setMode('list')} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
              <button
                onClick={handleManualSave}
                disabled={!manualTarget || manualSelected.length === 0}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  manualTarget && manualSelected.length > 0
                    ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-3 mb-4">
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
        >
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto leading-[36px]">총 {filteredMappings.length}건</span>
      </div>

      {/* 배정 목록 테이블 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">피평가자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">평가자</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">인원</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredMappings.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">배정된 내역이 없습니다</td></tr>
            ) : (
              filteredMappings.map(m => {
                const target = emp(m.evaluateeId);
                return (
                  <tr key={m.evaluateeId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{target.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{target.dept}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{target.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.evaluatorIds.map(eid => (
                          <span key={eid} className="text-xs px-2 py-0.5 bg-[#eaf6f0] text-[#1D9E75] rounded-full font-medium">
                            {emp(eid).name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{m.evaluatorIds.length}명</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => { setEditTarget(m.evaluateeId); setEditSelected([...m.evaluatorIds]); }}
                          className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(m.evaluateeId)}
                          className="text-xs px-3 py-1 border border-red-200 text-red-400 rounded-md hover:bg-red-50 transition-all"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========== 수정 모달 ========== */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[min(560px,calc(100vw-24px))] mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">평가자 수정</h3>
                <p className="text-xs text-gray-400 mt-0.5">{emp(editTarget).name} ({emp(editTarget).dept} · {emp(editTarget).rank})</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                평가자 선택 <span className="text-[#1D9E75]">({editSelected.length}명)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {allEmployees.filter(e => e.id !== editTarget).map(e => {
                  const isSelected = editSelected.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => toggleEvaluator(editSelected, setEditSelected, e.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#1D9E75] bg-[#eaf6f0]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] ${
                          isSelected ? 'bg-[#1D9E75] border-[#1D9E75] text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <i className="fas fa-check"></i>}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{e.name}</div>
                          <div className="text-[11px] text-gray-400">{e.dept} · {e.rank}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditTarget(null)} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
                <button
                  onClick={handleEditSave}
                  disabled={editSelected.length === 0}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    editSelected.length > 0
                      ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
