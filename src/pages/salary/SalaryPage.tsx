import { useState } from 'react'

interface PayStub {
  id: string
  month: string
  baseSalary: number
  positionPay: number
  overtime: number
  bonus: number
  mealAllowance: number
  transportAllowance: number
  nationalPension: number
  healthInsurance: number
  longTermCare: number
  employmentInsurance: number
  incomeTax: number
  localTax: number
  totalEarnings: number
  totalDeductions: number
  netPay: number
  paidDate: string
  status: 'paid' | 'pending'
}

const MOCK_PAYSTUBS: PayStub[] = [
  {
    id: '1', month: '2026년 3월', baseSalary: 3500000, positionPay: 300000, overtime: 250000,
    bonus: 0, mealAllowance: 200000, transportAllowance: 100000,
    nationalPension: 202500, healthInsurance: 152180, longTermCare: 19480,
    employmentInsurance: 39150, incomeTax: 156000, localTax: 15600,
    totalEarnings: 4350000, totalDeductions: 584910, netPay: 3765090,
    paidDate: '2026.03.25', status: 'paid',
  },
  {
    id: '2', month: '2026년 2월', baseSalary: 3500000, positionPay: 300000, overtime: 180000,
    bonus: 0, mealAllowance: 200000, transportAllowance: 100000,
    nationalPension: 202500, healthInsurance: 152180, longTermCare: 19480,
    employmentInsurance: 39150, incomeTax: 143000, localTax: 14300,
    totalEarnings: 4280000, totalDeductions: 570610, netPay: 3709390,
    paidDate: '2026.02.25', status: 'paid',
  },
  {
    id: '3', month: '2026년 1월', baseSalary: 3500000, positionPay: 300000, overtime: 320000,
    bonus: 3500000, mealAllowance: 200000, transportAllowance: 100000,
    nationalPension: 202500, healthInsurance: 152180, longTermCare: 19480,
    employmentInsurance: 39150, incomeTax: 520000, localTax: 52000,
    totalEarnings: 7920000, totalDeductions: 985310, netPay: 6934690,
    paidDate: '2026.01.25', status: 'paid',
  },
]

function formatMoney(amount: number) {
  return amount.toLocaleString('ko-KR') + '원'
}

export default function SalaryPage() {
  const [selectedStub, setSelectedStub] = useState<PayStub | null>(MOCK_PAYSTUBS[0])
  const [year, setYear] = useState(2026)

  const annualTotal = MOCK_PAYSTUBS.reduce((acc, s) => acc + s.netPay, 0)
  const annualGross = MOCK_PAYSTUBS.reduce((acc, s) => acc + s.totalEarnings, 0)
  const annualDeductions = MOCK_PAYSTUBS.reduce((acc, s) => acc + s.totalDeductions, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">급여 명세서</h1>
            <p className="text-sm text-gray-500 mt-1">김철수 · 인사총무팀 · 팀장</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setYear(year - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">‹</button>
            <span className="text-sm font-bold text-gray-800 w-16 text-center">{year}년</span>
            <button onClick={() => setYear(year + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">›</button>
          </div>
        </div>

        {/* 연간 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-xs text-gray-500 mb-1">연간 총 급여 (세전)</div>
            <div className="text-xl font-bold text-gray-800">{formatMoney(annualGross)}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-gray-500 mb-1">연간 총 공제액</div>
            <div className="text-xl font-bold text-red-500">{formatMoney(annualDeductions)}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-gray-500 mb-1">연간 실수령액</div>
            <div className="text-xl font-bold text-[#2e9e6e]">{formatMoney(annualTotal)}</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 월별 리스트 */}
          <div className="col-span-4">
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-800">월별 급여</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {MOCK_PAYSTUBS.map(stub => (
                  <div
                    key={stub.id}
                    onClick={() => setSelectedStub(stub)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedStub?.id === stub.id ? 'bg-[#f0f9f6] border-l-2 border-[#2e9e6e]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{stub.month}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        stub.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {stub.status === 'paid' ? '지급완료' : '대기'}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 mt-1">{formatMoney(stub.netPay)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">지급일: {stub.paidDate}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 상세 명세서 */}
          <div className="col-span-8">
            {selectedStub ? (
              <div className="card">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">{selectedStub.month} 급여 명세서</h3>
                  <button className="flex items-center gap-1.5 text-xs text-[#2e9e6e] font-medium hover:text-[#1a7a4e]">
                    <i className="fas fa-download" /> PDF 다운로드
                  </button>
                </div>

                <div className="p-5 space-y-6">
                  {/* 지급 내역 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-[#2e9e6e] rounded-full" />
                      지급 내역
                    </h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-100">
                          {[
                            { label: '기본급', amount: selectedStub.baseSalary },
                            { label: '직책수당', amount: selectedStub.positionPay },
                            { label: '연장근로수당', amount: selectedStub.overtime },
                            { label: '상여금', amount: selectedStub.bonus },
                            { label: '식대', amount: selectedStub.mealAllowance },
                            { label: '교통비', amount: selectedStub.transportAllowance },
                          ].map(item => (
                            <tr key={item.label}>
                              <td className="px-4 py-2.5 text-sm text-gray-600">{item.label}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-800 text-right font-medium">{formatMoney(item.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-[#f0f9f6]">
                            <td className="px-4 py-3 text-sm font-bold text-[#2e9e6e]">지급 합계</td>
                            <td className="px-4 py-3 text-sm font-bold text-[#2e9e6e] text-right">{formatMoney(selectedStub.totalEarnings)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 공제 내역 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-red-400 rounded-full" />
                      공제 내역
                    </h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-100">
                          {[
                            { label: '국민연금', amount: selectedStub.nationalPension },
                            { label: '건강보험', amount: selectedStub.healthInsurance },
                            { label: '장기요양보험', amount: selectedStub.longTermCare },
                            { label: '고용보험', amount: selectedStub.employmentInsurance },
                            { label: '소득세', amount: selectedStub.incomeTax },
                            { label: '지방소득세', amount: selectedStub.localTax },
                          ].map(item => (
                            <tr key={item.label}>
                              <td className="px-4 py-2.5 text-sm text-gray-600">{item.label}</td>
                              <td className="px-4 py-2.5 text-sm text-red-500 text-right font-medium">-{formatMoney(item.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-red-50">
                            <td className="px-4 py-3 text-sm font-bold text-red-500">공제 합계</td>
                            <td className="px-4 py-3 text-sm font-bold text-red-500 text-right">-{formatMoney(selectedStub.totalDeductions)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 실수령액 */}
                  <div className="bg-[#2e9e6e] rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/70">실수령액</div>
                      <div className="text-2xl font-bold text-white mt-1">{formatMoney(selectedStub.netPay)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/70">지급일</div>
                      <div className="text-sm font-medium text-white mt-1">{selectedStub.paidDate}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-10 text-center text-gray-400">
                <i className="fas fa-file-invoice-dollar text-4xl mb-3" />
                <p>월별 급여를 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
