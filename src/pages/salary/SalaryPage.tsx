import { useState, useRef } from 'react'

// ── 타입 ──
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

const EMPLOYEE = {
  name: '김철수',
  id: 'kimcs@peoplecore.kr',
  department: '인사총무팀',
  position: '팀장',
  rank: '과장',
  empNo: '2019-0042',
  phone: '070-1234-5678',
  mobile: '010-1234-5678',
  hireDate: '2019-04-01',
  employeeType: '정규',
  // 급여상세
  salaryType: '연봉',
  annualSalary: 52000000,
  monthlySalary: 4350000,
  fixedAllowance: 500000,
  fixedAllowanceIncluded: false,
  // 자세히 보기 항목 (ERD: insurance_rates, emp_accounts 등)
  incomeTaxDependents: 1,
  childrenUnder20: 0,
  studentLoanRepayment: false,
  studentLoanRepaymentPeriod: '',
  studentLoanRepaymentAmount: 0,
  smeIncomeTaxReduction: false,
  smeReduction: '',
  smeReductionPeriod: '',
  smeReductionRate: '',
  duranuriApplied: false,
  duranuriPensionRate: '',
  duranuriEmploymentRate: '',
  salaryBank: '우리은행',
  salaryAccount: '1002-123-456789',
  retirementBank: '국민은행',
  retirementAccount: '123-45-6789-012',
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

// ── 비밀번호 입력 화면 ──
function PasswordScreen({ onSuccess }: { onSuccess: () => void }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    setError('')
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
    if (e.key === 'Enter' && digits.every(d => d)) {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (digits.some(d => !d)) {
      setError('4자리 숫자를 모두 입력해주세요.')
      return
    }
    // 백엔드 연동 전이므로 아무 값이나 통과
    onSuccess()
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 w-[420px] text-center">
        <div className="w-16 h-16 bg-[#f0f9f6] rounded-full flex items-center justify-center mx-auto mb-5">
          <i className="fas fa-lock text-[#2e9e6e] text-xl" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">급여 조회</h2>
        <p className="text-xs text-gray-500 mb-1">급여 조회를 위해 기존에 설정한</p>
        <p className="text-xs text-gray-500 mb-6">간편 비밀번호(숫자 4자리)를 입력해 주세요.</p>

        <div className="flex items-center justify-center gap-3 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-[#2e9e6e] focus:ring-1 focus:ring-[#2e9e6e] outline-none transition-colors"
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <p className="text-[11px] text-gray-400 mb-6">
          * 설정 &gt; 보안관리/간편비밀번호관리에서 변경할 수 있습니다.
        </p>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-[#2e9e6e] text-white text-sm font-medium rounded-lg hover:bg-[#26865d] transition-colors"
        >
          급여 조회
        </button>
      </div>
    </div>
  )
}

// ── 내 급여 조회 ──
// ── 연도 선택 팝업 ──
function YearPicker({ year, onChange, onClose }: { year: number; onChange: (y: number) => void; onClose: () => void }) {
  const [page, setPage] = useState(Math.floor(year / 10) * 10)
  const years = Array.from({ length: 10 }, (_, i) => page + i)
  const ref = useRef<HTMLDivElement>(null)

  useState(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  return (
    <div ref={ref} className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-[180px]">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setPage(p => p - 10)} className="text-gray-400 hover:text-gray-600 text-xs px-1">«</button>
        <span className="text-xs font-medium text-gray-600">{page} - {page + 9}</span>
        <button onClick={() => setPage(p => p + 10)} className="text-gray-400 hover:text-gray-600 text-xs px-1">»</button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {years.map(y => (
          <button
            key={y}
            onClick={() => { onChange(y); onClose() }}
            className={`py-1.5 rounded text-xs transition-colors ${
              y === year
                ? 'bg-[#2e9e6e] text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
        <button onClick={() => { onChange(year); onClose() }} className="flex-1 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-700">확인</button>
        <button onClick={onClose} className="flex-1 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-700">취소</button>
      </div>
    </div>
  )
}

function MySalaryView() {
  const [selectedStub, setSelectedStub] = useState<PayStub | null>(MOCK_PAYSTUBS[0])
  const [year, setYear] = useState(2026)
  const [infoOpen, setInfoOpen] = useState(true)
  const [yearPickerOpen, setYearPickerOpen] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1100px] mx-auto space-y-5">
        {/* 타이틀 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            내 급여 조회
            <span className="text-xs font-normal text-gray-400 ml-2">내 급여 정보와 급(상)여 명세서를 월별로 확인할 수 있습니다.</span>
          </h2>
        </div>

        {/* 사원 정보 카드 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex gap-5">
              <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-user text-2xl text-gray-300" />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-x-8 gap-y-2 text-xs">
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">이름</span><span className="font-medium text-gray-800">{EMPLOYEE.name}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">ID</span><span className="font-medium text-gray-800">{EMPLOYEE.id}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">직원구분</span><span className="font-medium text-gray-800">{EMPLOYEE.employeeType}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">부서 / 직책</span><span className="font-medium text-gray-800">{EMPLOYEE.department} / {EMPLOYEE.position}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">직위</span><span className="font-medium text-gray-800">{EMPLOYEE.rank}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">입사일</span><span className="font-medium text-gray-800">{EMPLOYEE.hireDate}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">사원번호</span><span className="font-medium text-gray-800">{EMPLOYEE.empNo}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">직통번호</span><span className="font-medium text-gray-800">{EMPLOYEE.phone}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">휴대전화</span><span className="font-medium text-gray-800">{EMPLOYEE.mobile}</span></div>
              </div>
            </div>
          </div>

          {/* 급여상세 */}
          <div className="border-t border-gray-100">
            <div className="px-5 py-3">
              <h4 className="text-xs font-bold text-gray-700 mb-3">급여상세</h4>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500 w-24">급여유형</td>
                    <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.salaryType}</td>
                    <td className="py-2 text-gray-500 w-12 pl-6">연봉</td>
                    <td className="py-2 text-gray-800 bg-[#f8fffe] px-2 text-right">{EMPLOYEE.annualSalary.toLocaleString()}</td>
                    <td className="py-2 text-gray-500 w-12 pl-6">월급</td>
                    <td className="py-2 text-gray-800 text-right">{EMPLOYEE.monthlySalary.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500">고정수당</td>
                    <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.fixedAllowance.toLocaleString()}</td>
                    <td className="py-2 text-gray-500 pl-6" colSpan={2}>고정수당 포함여부</td>
                    <td className="py-2 text-gray-800" colSpan={2}>{EMPLOYEE.fixedAllowanceIncluded ? '예' : '아니오'}</td>
                  </tr>
                </tbody>
              </table>

              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="text-xs text-gray-400 hover:text-gray-600 mt-2 flex items-center gap-1 mx-auto"
              >
                {infoOpen ? '접기' : '자세히 보기'}
                <i className={`fas fa-chevron-${infoOpen ? 'up' : 'down'} text-[9px]`} />
              </button>

              {/* 자세히 보기 확장 영역 */}
              {infoOpen && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">소득공제부양자</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.incomeTaxDependents}</td>
                        <td className="py-2 text-gray-500 pl-4">자녀수(20세 이하)</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.childrenUnder20}</td>
                        <td colSpan={2} />
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">학자금 상환여부</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.studentLoanRepayment ? '예' : '아니오'}</td>
                        <td className="py-2 text-gray-500 pl-4">학자금 상환기간</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.studentLoanRepaymentPeriod || '~'}</td>
                        <td className="py-2 text-gray-500 pl-4">학자금 상환금액</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.studentLoanRepaymentAmount.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">중소기업취업소득세감면</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.smeIncomeTaxReduction ? '예' : '아니오'}</td>
                        <td className="py-2 text-gray-500 pl-4">중소기업감면적용</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.smeReduction || '-'}</td>
                        <td className="py-2 text-gray-500 pl-4">중소기업소득세감면기간</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.smeReductionPeriod || '~'}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td colSpan={4} />
                        <td className="py-2 text-gray-500 pl-4">중소기업소득감면</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.smeReductionRate || ''} %</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">두루누리 적용여부</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2">{EMPLOYEE.duranuriApplied ? '예' : '아니오'}</td>
                        <td className="py-2 text-gray-500 pl-4">두루누리 국민연금감면율</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.duranuriPensionRate || ''} %</td>
                        <td className="py-2 text-gray-500 pl-4">두루누리 고용보험감면율</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.duranuriEmploymentRate || ''} %</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">급여은행</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.salaryBank}</td>
                        <td className="py-2 text-gray-500 pl-4">급여계좌</td>
                        <td className="py-2 text-gray-800" colSpan={3}>{EMPLOYEE.salaryAccount}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">퇴직연금은행</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.retirementBank}</td>
                        <td className="py-2 text-gray-500 pl-4">퇴직연금계좌</td>
                        <td className="py-2 text-gray-800" colSpan={3}>{EMPLOYEE.retirementAccount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 급(상)여명세서 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-800">급(상)여명세서</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 border-l border-gray-300 pl-3 relative">
              <button
                onClick={() => setYearPickerOpen(!yearPickerOpen)}
                className="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 flex items-center gap-1"
              >
                {year} <i className="fas fa-calendar-alt text-[10px] text-gray-400" />
              </button>
              {yearPickerOpen && (
                <YearPicker
                  year={year}
                  onChange={setYear}
                  onClose={() => setYearPickerOpen(false)}
                />
              )}
              <button className="px-1.5 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50">
                <i className="fas fa-search text-[10px]" /> 조회
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* 좌: 월별 목록 */}
            <div className="col-span-5">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-3 text-left font-medium text-gray-500">급(상)여월</th>
                      <th className="py-2 px-3 text-right font-medium text-gray-500">지급합계</th>
                      <th className="py-2 px-3 text-right font-medium text-gray-500">공제합계</th>
                      <th className="py-2 px-3 text-right font-medium text-gray-500">공제 후 지급액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PAYSTUBS.length > 0 ? MOCK_PAYSTUBS.map(stub => (
                      <tr
                        key={stub.id}
                        onClick={() => setSelectedStub(stub)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          selectedStub?.id === stub.id ? 'bg-[#f0f9f6]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-gray-700">{stub.month}</td>
                        <td className="py-2.5 px-3 text-right text-gray-700">{formatMoney(stub.totalEarnings)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-700">{formatMoney(stub.totalDeductions)}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-gray-800">{formatMoney(stub.netPay)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400">검색된 결과가 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 우: 명세서 상세 */}
            <div className="col-span-7">
              {selectedStub ? (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs">
                      <span className="text-gray-500 mr-4">사원명 <span className="font-medium text-gray-800 ml-1">{EMPLOYEE.name}</span></span>
                      <span className="text-gray-500">부서 <span className="font-medium text-gray-800 ml-1">{EMPLOYEE.department}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
                        <i className="fas fa-file-pdf text-[10px]" /> PDF 저장
                      </button>
                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
                        <i className="fas fa-envelope text-[10px]" /> 이메일 발송
                      </button>
                    </div>
                  </div>

                  {/* 지급 */}
                  <table className="w-full text-xs mb-3">
                    <tbody>
                      <tr className="bg-gray-50 border border-gray-200">
                        <td className="py-2 px-3 font-medium text-gray-700" colSpan={4}>지급항목</td>
                      </tr>
                      {[
                        { label: '기본급', amount: selectedStub.baseSalary },
                        { label: '직책수당', amount: selectedStub.positionPay },
                        { label: '연장근로수당', amount: selectedStub.overtime },
                        { label: '상여금', amount: selectedStub.bonus },
                        { label: '식대', amount: selectedStub.mealAllowance },
                        { label: '교통비', amount: selectedStub.transportAllowance },
                      ].map(item => (
                        <tr key={item.label} className="border-x border-b border-gray-200">
                          <td className="py-1.5 px-3 text-gray-600 w-28">{item.label}</td>
                          <td className="py-1.5 px-3 text-right text-gray-800">{formatMoney(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-x border-b border-gray-200 bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-700">지급항목 합계</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-800">{formatMoney(selectedStub.totalEarnings)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 공제 */}
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="bg-gray-50 border border-gray-200">
                        <td className="py-2 px-3 font-medium text-gray-700" colSpan={4}>공제항목</td>
                      </tr>
                      {[
                        { label: '국민연금', amount: selectedStub.nationalPension },
                        { label: '건강보험', amount: selectedStub.healthInsurance },
                        { label: '장기요양보험', amount: selectedStub.longTermCare },
                        { label: '고용보험', amount: selectedStub.employmentInsurance },
                        { label: '소득세', amount: selectedStub.incomeTax },
                        { label: '지방소득세', amount: selectedStub.localTax },
                      ].map(item => (
                        <tr key={item.label} className="border-x border-b border-gray-200">
                          <td className="py-1.5 px-3 text-gray-600 w-28">{item.label}</td>
                          <td className="py-1.5 px-3 text-right text-gray-800">{formatMoney(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-x border-b border-gray-200 bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-700">공제항목 합계</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-800">{formatMoney(selectedStub.totalDeductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-xs text-gray-400">
                  월별 급여를 선택해주세요
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 예상 퇴직금 조회 ──
function RetirementView() {
  const [estimatedDate, setEstimatedDate] = useState('2026-03-31')
  const [calculated, setCalculated] = useState(false)

  const handleCalc = () => setCalculated(true)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[700px] mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            예상 퇴직금 조회
            <span className="text-xs font-normal text-gray-400 ml-2">예상 퇴사일자 입력 시 계산된 예상 퇴직금을 확인할 수 있습니다.</span>
          </h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 text-xs text-gray-500 space-y-1">
          <p>- 예상되는 퇴사일자를 기준으로 하여, 30일 분 이상의 평균임금으로 퇴직금을 계산합니다.</p>
          <p>- 실제 산정되는 퇴직금과 금액 차이가 발생될 수 있으므로 참고용으로 활용해주시길 바랍니다.</p>
        </div>

        {/* 입력 */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-700 font-medium">예상 퇴사일 <span className="text-red-500">*</span></span>
          <input
            type="date"
            value={estimatedDate}
            onChange={e => { setEstimatedDate(e.target.value); setCalculated(false) }}
            className="border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#2e9e6e]"
          />
          <button
            onClick={handleCalc}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            계산
          </button>
        </div>

        {/* 결과 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {[
                { label: '입사일', value: calculated ? EMPLOYEE.hireDate : '' },
                { label: '퇴직금 중간정산 여부', value: calculated ? '해당없음' : '', highlight: true },
                { label: '퇴직 정산기간', value: calculated ? `${EMPLOYEE.hireDate} ~ ${estimatedDate}` : '', highlight: true },
                { label: '근속일수', value: calculated ? '2,557 일' : '', highlight: true },
                { label: '예상 퇴직일 이전 3개월 총 일수', value: calculated ? '90 일' : '', highlight: true },
                { label: '최근 3개월 급여 총액', value: calculated ? formatMoney(13050000) : '', highlight: true },
                { label: '직전 1년간 상여금 총액', value: calculated ? formatMoney(3500000) : '', highlight: true },
                { label: '연차수당', value: calculated ? formatMoney(0) : '', highlight: true },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-200">
                  <td className="py-2.5 px-4 text-gray-600 w-56 bg-gray-50 font-medium text-right">{row.label}</td>
                  <td className={`py-2.5 px-4 text-gray-800 ${row.highlight ? 'bg-[#f0fdfa]' : ''}`}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {calculated && (
            <table className="w-full text-xs border-t-2 border-gray-300">
              <tbody>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-3 px-4 text-gray-700 w-56 font-bold text-right">1개월 평균임금</td>
                  <td className="py-3 px-4 font-bold text-gray-800 bg-[#f0fdfa]">{formatMoney(4641667)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 text-gray-700 w-56 font-bold text-right">예상 퇴직금</td>
                  <td className="py-3 px-4 font-bold text-[#2e9e6e] text-base bg-[#f0fdfa]">{formatMoney(32491669)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 메인 급여 페이지 ──
type SalaryView = 'salary' | 'retirement'

export default function SalaryPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [activeView, setActiveView] = useState<SalaryView>('salary')

  if (!authenticated) {
    return <PasswordScreen onSuccess={() => setAuthenticated(true)} />
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">급여</h2>
        </div>
        <nav className="p-2 space-y-0.5">
          <button
            onClick={() => setActiveView('salary')}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
              activeView === 'salary'
                ? 'text-[#2e9e6e] font-medium bg-[#f0f9f6]'
                : 'text-[#374151] hover:bg-gray-50'
            }`}
          >
            내 급여 조회
          </button>
          <button
            onClick={() => setActiveView('retirement')}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
              activeView === 'retirement'
                ? 'text-[#2e9e6e] font-medium bg-[#f0f9f6]'
                : 'text-[#374151] hover:bg-gray-50'
            }`}
          >
            예상 퇴직금 조회
          </button>
        </nav>
      </div>

      {/* 콘텐츠 */}
      {activeView === 'salary' ? <MySalaryView /> : <RetirementView />}
    </div>
  )
}
