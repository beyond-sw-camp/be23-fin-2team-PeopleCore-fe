export default function OverviewTab() {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-gray-800 mb-1">A Company</h2>
      <p className="text-[13px] text-gray-400 mb-6">PeopleCore 인사통합 관리 시스템</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">서비스 이용현황</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">사용자 수</p>
            <p className="text-[20px] font-bold text-[#1D9E75]">152<span className="text-[13px] font-normal text-gray-400">명</span></p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">결제 여부</p>
            <p className="text-[14px] font-semibold text-gray-800">
              <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[12px]">
                결제 완료
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">요금</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">플랜</p>
            <p className="text-[14px] font-semibold text-gray-800">Enterprise</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">월 요금</p>
            <p className="text-[14px] font-semibold text-gray-800">₩1,520,000</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">다음 결제일</p>
            <p className="text-[14px] font-semibold text-gray-800">2026-04-01</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">모듈별 사용현황</h3>
        <div className="space-y-3">
          {[
            { name: '전자결재', count: 1247 },
            { name: '급여 관리', count: 152 },
            { name: '근태 관리', count: 152 },
            { name: '성과 평가', count: 89 },
            { name: '메신저', count: 148 },
          ].map((mod) => (
            <div key={mod.name} className="flex items-center justify-between py-2">
              <span className="text-[13px] text-gray-700">{mod.name}</span>
              <span className="text-[13px] font-semibold text-gray-800">{mod.count.toLocaleString()}건</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
