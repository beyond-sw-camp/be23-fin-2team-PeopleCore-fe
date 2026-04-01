export default function Weekly52View() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">주간 최대 근무 시간</h3>
      <p className="text-[12px] text-gray-400 mb-5">주간 최대 근무시간 한도를 설정하고 초과 시 처리 방식을 관리합니다</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">정책 설정</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">주간 최대 근무시간</span>
            <input type="number" defaultValue={52} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-20" />
            <span className="text-[12px] text-gray-500">시간</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">경고 기준</span>
            <input type="number" defaultValue={48} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-20" />
            <span className="text-[12px] text-gray-500">시간 초과 시 경고 알림</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">초과 시 처리</span>
            <select className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              <option>관리자에게 알림만 발송</option>
              <option>초과근무 신청 자동 차단</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
      </div>
    </div>
  )
}
