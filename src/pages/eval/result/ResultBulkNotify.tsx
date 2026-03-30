import { useState } from 'react';

interface ChecklistItem {
  id: number;
  label: string;
  done: boolean;
  detail?: string;
}

export default function ResultBulkNotify() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, label: '최종 등급 확정 완료', done: true },
    { id: 2, label: '급여 모듈 전달 완료', done: true },
    { id: 3, label: '이의신청 기간 설정', done: true, detail: '2024-07-01 ~ 2024-07-07' },
    { id: 4, label: '팀장 피드백 작성 완료', done: false },
  ]);

  const [contentOptions, setContentOptions] = useState({
    grade: true,
    feedback: true,
    peerScore: false,
    appealInfo: true,
  });

  const allDone = checklist.every(c => c.done);

  const toggleContent = (key: keyof typeof contentOptions) => {
    setContentOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">평가 결과 일괄 통보</span>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">평가 결과 일괄 통보</h1>
        <p className="text-xs text-gray-400 mt-1">평가 대상자에게 결과를 일괄 공개합니다 (eval-21)</p>
      </div>

      {/* Season info */}
      <div className="card p-4 mb-5 flex items-center gap-3">
        <i className="fas fa-calendar-check text-[#1D9E75]"></i>
        <span className="text-sm font-medium text-gray-800">2024년 상반기 정기평가</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">등급확정완료</span>
        <span className="text-xs text-gray-400 ml-auto">대상 73명</span>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left config */}
        <div className="col-span-7 space-y-4">
          {/* Checklist */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">통보 전 체크리스트</h2>
            <p className="text-xs text-gray-400 mb-3">모든 항목이 완료되어야 일괄 공개가 가능합니다.</p>
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${item.done ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500' : 'bg-red-400'}`}>
                      {item.done ? <i className="fas fa-check text-white text-xs"></i> : <i className="fas fa-times text-white text-xs"></i>}
                    </div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                    {item.detail && <span className="text-xs text-gray-400">({item.detail})</span>}
                  </div>
                  {!item.done && (
                    <span className="text-xs text-red-500 font-medium">미완료</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content options */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">통보 내용 설정</h2>
            <div className="space-y-2">
              {[
                { key: 'grade' as const, label: '평가등급 공개' },
                { key: 'feedback' as const, label: '팀장 피드백 공개' },
                { key: 'peerScore' as const, label: '동료평가 점수 공개 (익명)' },
                { key: 'appealInfo' as const, label: '이의신청 기간 안내' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentOptions[opt.key]}
                    onChange={() => toggleContent(opt.key)}
                    className="accent-[#1D9E75]"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {allDone ? '모든 준비가 완료되었습니다.' : `${checklist.filter(c => !c.done).length}개 항목이 미완료입니다.`}
            </span>
            <button
              disabled={!allDone}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${allDone ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <i className="fas fa-broadcast-tower"></i>일괄 공개 (대상 73명)
            </button>
          </div>
        </div>

        {/* Right preview */}
        <div className="col-span-5 card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">미리보기</h2>
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="font-bold text-gray-800 mb-2">2024년 상반기 성과평가 결과 안내</div>
            <div className="text-xs text-gray-500 mb-3">안녕하세요. 2024년 상반기 성과평가 결과를 안내드립니다.</div>
            {contentOptions.grade && (
              <div className="bg-white rounded-lg p-3 mb-2 border border-gray-100">
                <div className="text-xs font-semibold text-gray-600 mb-1">■ 평가 등급</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1D9E75]">A</span>
                  <span className="text-xs text-gray-500">우수 (상위 20%)</span>
                </div>
              </div>
            )}
            {contentOptions.feedback && (
              <div className="bg-white rounded-lg p-3 mb-2 border border-gray-100">
                <div className="text-xs font-semibold text-gray-600 mb-1">■ 팀장 피드백</div>
                <div className="text-xs text-gray-600">업무 성과가 우수하며 지속적인 성장 가능성이 높습니다...</div>
              </div>
            )}
            {contentOptions.appealInfo && (
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-xs font-semibold text-gray-600 mb-1">■ 이의신청 안내</div>
                <div className="text-xs text-gray-600">기간: 2024-07-01 ~ 2024-07-07</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
