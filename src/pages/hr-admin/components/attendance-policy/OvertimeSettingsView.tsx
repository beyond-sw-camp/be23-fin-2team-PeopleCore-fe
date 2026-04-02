import { useState } from 'react'

export default function OvertimeSettingsView() {
  const [unitMin, setUnitMin] = useState(60)
  const [requirePreApproval, setRequirePreApproval] = useState(true)
  const [requirePostApproval, setRequirePostApproval] = useState(true)

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">초과근무 정책 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">초과근무 신청 단위와 결재 프로세스를 설정합니다</p>

      {/* 신청 시간 단위 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">신청 시간 단위</h4>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-gray-600 w-40 shrink-0">초과근무 신청 최소 단위</span>
          <select value={unitMin} onChange={(e) => setUnitMin(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]">
            <option value={15}>15분</option>
            <option value={30}>30분</option>
            <option value={60}>1시간</option>
          </select>
          <span className="text-[11px] text-gray-400">단위로 신청 가능</span>
        </div>
      </div>

      {/* 결재 프로세스 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">결재 프로세스</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12px] text-gray-800 font-medium">사전 결재 (초과근무 신청)</span>
              <p className="text-[11px] text-gray-400 mt-0.5">초과근무 시작 전 전자결재를 통해 사전 승인</p>
            </div>
            <button onClick={() => setRequirePreApproval(!requirePreApproval)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${requirePreApproval ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${requirePreApproval ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12px] text-gray-800 font-medium">사후 결재 (실적 확인)</span>
              <p className="text-[11px] text-gray-400 mt-0.5">초과근무 완료 후 실제 근무 시간을 확인하는 전자결재</p>
            </div>
            <button onClick={() => setRequirePostApproval(!requirePostApproval)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${requirePostApproval ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${requirePostApproval ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {requirePostApproval && (
          <div className="mt-4 bg-yellow-50 rounded-lg p-3">
            <p className="text-[11px] text-yellow-700">
              <i className="fas fa-exclamation-triangle mr-1" />
              사후 결재 활성화 시: 초과근무 완료 후 실제 근무 시간과 신청 시간이 다를 경우 자동으로 사후 결재가 생성됩니다.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
      </div>
    </div>
  )
}
