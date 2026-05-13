import { useState } from 'react';

type AppealStatus = '접수' | '검토중' | '인용' | '기각';

interface Appeal {
  id: string;
  receiptDate: string;
  name: string;
  dept: string;
  currentGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  requestedGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  reason: string;
  managerComment: string;
  status: AppealStatus;
}

const initialAppeals: Appeal[] = [
  {
    id: 'APP-2024-001', receiptDate: '2024-07-02', name: '박지훈', dept: '마케팅팀',
    currentGrade: 'C', requestedGrade: 'B',
    reason: '프로젝트 기여도가 높았으나 평가에 반영되지 않은 것 같습니다.',
    managerComment: '해당 프로젝트는 보조 역할로 주도적 기여는 어려웠습니다.',
    status: '검토중',
  },
  {
    id: 'APP-2024-002', receiptDate: '2024-07-03', name: '한승우', dept: '개발팀',
    currentGrade: 'C', requestedGrade: 'B',
    reason: '신입 특성상 목표 수립이 늦었으나 성과는 충분했습니다.',
    managerComment: '-',
    status: '접수',
  },
  {
    id: 'APP-2024-003', receiptDate: '2024-07-01', name: '최유진', dept: '영업팀',
    currentGrade: 'B', requestedGrade: 'A',
    reason: '영업 목표를 120% 달성했으나 동료평가가 부당하게 낮았습니다.',
    managerComment: '동료평가 결과 검토 후 인용이 적절합니다.',
    status: '인용',
  },
];

const gradeColors: Record<string, string> = { S: 'bg-[#1D9E75]/10 text-[#1D9E75]', A: 'bg-blue-100 text-blue-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-orange-100 text-orange-700', D: 'bg-red-100 text-red-700' };

const statusBadge: Record<AppealStatus, string> = {
  '접수': 'bg-gray-100 text-gray-600',
  '검토중': 'bg-yellow-100 text-yellow-700',
  '인용': 'bg-green-100 text-green-700',
  '기각': 'bg-red-100 text-red-700',
};

export default function AppealManagement() {
  const [appeals, setAppeals] = useState<Appeal[]>(initialAppeals);
  const [statusFilter, setStatusFilter] = useState<'전체' | AppealStatus>('전체');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: '인용' | '기각' } | null>(null);

  const handleAction = (id: string, action: '인용' | '기각') => {
    setAppeals(appeals.map(a => a.id === id ? { ...a, status: action } : a));
    setConfirmAction(null);
  };

  const filtered = statusFilter === '전체' ? appeals : appeals.filter(a => a.status === statusFilter);

  const counts = {
    total: appeals.length,
    pending: appeals.filter(a => a.status === '검토중' || a.status === '접수').length,
    approved: appeals.filter(a => a.status === '인용').length,
    rejected: appeals.filter(a => a.status === '기각').length,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">이의신청 접수 및 처리</span>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">이의신청 접수 및 처리</h1>
        <p className="text-xs text-gray-400 mt-1">평가 결과에 대한 이의신청을 접수하고 처리합니다</p>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {confirmAction.action === '인용' ? '이의신청 인용' : '이의신청 기각'}
            </h3>
            {confirmAction.action === '인용' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-700">인용 시 등급 잠금이 해제되어 재조정이 가능합니다.</p>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              {confirmAction.action === '인용' ? '해당 이의신청을 인용 처리하시겠습니까?' : '해당 이의신청을 기각 처리하시겠습니까?'}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
              <button
                onClick={() => handleAction(confirmAction.id, confirmAction.action)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${confirmAction.action === '인용' ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-red-500 hover:bg-red-600'}`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card p-5"><div className="text-xs text-gray-400 mb-1">전체</div><div className="text-2xl font-bold text-gray-800">{counts.total}건</div></div>
        <div className="card p-5"><div className="text-xs text-gray-400 mb-1">접수/검토중</div><div className="text-2xl font-bold text-yellow-500">{counts.pending}건</div></div>
        <div className="card p-5"><div className="text-xs text-gray-400 mb-1">인용</div><div className="text-2xl font-bold text-green-500">{counts.approved}건</div></div>
        <div className="card p-5"><div className="text-xs text-gray-400 mb-1">기각</div><div className="text-2xl font-bold text-red-500">{counts.rejected}건</div></div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {(['전체', '접수', '검토중', '인용', '기각'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${statusFilter === s ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">접수번호</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">접수일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명(부서)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">등급 변경 요청</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">이의신청 사유</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">팀장 소명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">처리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-gray-600">{a.id}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{a.receiptDate}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-800">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.dept}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gradeColors[a.currentGrade]}`}>{a.currentGrade}</span>
                    <i className="fas fa-arrow-right text-gray-300 text-xs"></i>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gradeColors[a.requestedGrade]}`}>{a.requestedGrade}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                  <div className="truncate" title={a.reason}>{a.reason}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                  <div className="truncate">{a.managerComment}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[a.status]}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  {(a.status === '접수' || a.status === '검토중') && (
                    <div className="flex gap-1">
                      <button onClick={() => setConfirmAction({ id: a.id, action: '인용' })} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">인용</button>
                      <button onClick={() => setConfirmAction({ id: a.id, action: '기각' })} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">기각</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
