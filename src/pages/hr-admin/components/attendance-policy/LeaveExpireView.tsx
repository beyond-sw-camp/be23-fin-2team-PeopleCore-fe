export default function LeaveExpireView() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 소멸 처리</h3>
      <p className="text-[12px] text-gray-400 mb-5">미사용 연차를 자동 소멸 처리하고 이력을 기록합니다</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">소멸 처리 설정</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">소멸 처리 방식</span>
            <select className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              <option>연차 사용 기간 만료 시 자동 소멸</option>
              <option>수동 소멸 처리</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">소멸 알림 발송</span>
            <select className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              <option>소멸 6개월 전, 2개월 전</option>
              <option>소멸 3개월 전, 1개월 전</option>
              <option>소멸 1개월 전</option>
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
