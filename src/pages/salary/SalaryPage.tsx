import { useState, useRef } from 'react'

// ── 타입 (ERD: pay_stubs + pay_details + pay_items 기반) ──
interface PayDetail {
  itemName: string        // pay_items.pay_item_name
  category: 'PAYMENT' | 'DEDUCTION'  // pay_items.pay_item_type
  amount: number          // pay_details.amount
}

interface PayStub {
  id: string              // pay_stubs.pay_stubs_id
  month: string           // pay_stubs.pay_year_month
  details: PayDetail[]    // pay_details 목록
  totalEarnings: number   // pay_stubs.total_pay
  totalDeductions: number // pay_stubs.total_deduction
  netPay: number          // pay_stubs.net_pay
  paidDate: string
  status: 'paid' | 'pending'  // pay_stubs.is_sent
}

// ERD: employees, emp_accounts, pay_items, insurance_rates, retirement_settings
const EMPLOYEE = {
  // employees 테이블
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
  // pay_items (category=SALARY) + pay_details
  annualSalary: 52000000,
  monthlySalary: 4350000,
  // pay_items (category=ALLOWANCE, is_fixed=true)
  fixedAllowances: [
    { name: '식대', amount: 200000 },
    { name: '교통비', amount: 100000 },
    { name: '직책수당', amount: 300000 },
  ],
  // emp_accounts 테이블
  salaryBank: '우리은행',
  salaryAccount: '1002-123-456789',
  retirementBank: '국민은행',
  retirementAccount: '123-45-6789-012',
}

// pay_items 카테고리별: SALARY(급여), ALLOWANCE(수당), BONUS(상여), INSURANCE(4대보험), TAX(세금)
const MOCK_PAYSTUBS: PayStub[] = [
  {
    id: '1', month: '2026년 3월',
    details: [
      // 지급 (PAYMENT)
      { itemName: '기본급', category: 'PAYMENT', amount: 3500000 },
      { itemName: '직책수당', category: 'PAYMENT', amount: 300000 },
      { itemName: '연장근로수당', category: 'PAYMENT', amount: 250000 },
      { itemName: '식대', category: 'PAYMENT', amount: 200000 },
      { itemName: '교통비', category: 'PAYMENT', amount: 100000 },
      // 공제 (DEDUCTION)
      { itemName: '국민연금', category: 'DEDUCTION', amount: 202500 },
      { itemName: '건강보험', category: 'DEDUCTION', amount: 152180 },
      { itemName: '장기요양보험', category: 'DEDUCTION', amount: 19480 },
      { itemName: '고용보험', category: 'DEDUCTION', amount: 39150 },
      { itemName: '근로소득세', category: 'DEDUCTION', amount: 156000 },
      { itemName: '지방소득세', category: 'DEDUCTION', amount: 15600 },
    ],
    totalEarnings: 4350000, totalDeductions: 584910, netPay: 3765090,
    paidDate: '2026.03.25', status: 'paid',
  },
  {
    id: '2', month: '2026년 2월',
    details: [
      { itemName: '기본급', category: 'PAYMENT', amount: 3500000 },
      { itemName: '직책수당', category: 'PAYMENT', amount: 300000 },
      { itemName: '연장근로수당', category: 'PAYMENT', amount: 180000 },
      { itemName: '식대', category: 'PAYMENT', amount: 200000 },
      { itemName: '교통비', category: 'PAYMENT', amount: 100000 },
      { itemName: '국민연금', category: 'DEDUCTION', amount: 202500 },
      { itemName: '건강보험', category: 'DEDUCTION', amount: 152180 },
      { itemName: '장기요양보험', category: 'DEDUCTION', amount: 19480 },
      { itemName: '고용보험', category: 'DEDUCTION', amount: 39150 },
      { itemName: '근로소득세', category: 'DEDUCTION', amount: 143000 },
      { itemName: '지방소득세', category: 'DEDUCTION', amount: 14300 },
    ],
    totalEarnings: 4280000, totalDeductions: 570610, netPay: 3709390,
    paidDate: '2026.02.25', status: 'paid',
  },
  {
    id: '3', month: '2026년 1월',
    details: [
      { itemName: '기본급', category: 'PAYMENT', amount: 3500000 },
      { itemName: '직책수당', category: 'PAYMENT', amount: 300000 },
      { itemName: '연장근로수당', category: 'PAYMENT', amount: 320000 },
      { itemName: '상여금', category: 'PAYMENT', amount: 3500000 },
      { itemName: '식대', category: 'PAYMENT', amount: 200000 },
      { itemName: '교통비', category: 'PAYMENT', amount: 100000 },
      { itemName: '국민연금', category: 'DEDUCTION', amount: 202500 },
      { itemName: '건강보험', category: 'DEDUCTION', amount: 152180 },
      { itemName: '장기요양보험', category: 'DEDUCTION', amount: 19480 },
      { itemName: '고용보험', category: 'DEDUCTION', amount: 39150 },
      { itemName: '근로소득세', category: 'DEDUCTION', amount: 520000 },
      { itemName: '지방소득세', category: 'DEDUCTION', amount: 52000 },
    ],
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

// ── 계좌변경 모달 ──
function AccountChangeModal({ onClose }: { onClose: () => void }) {
  const [bank, setBank] = useState(EMPLOYEE.salaryBank)
  const [account, setAccount] = useState(EMPLOYEE.salaryAccount)
  const [holder, setHolder] = useState(EMPLOYEE.name)
  const [verified, setVerified] = useState(false)

  const handleVerify = () => {
    // 백엔드 연동 전: 무조건 성공
    setVerified(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[420px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">급여 계좌 변경</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">은행</label>
            <select value={bank} onChange={e => { setBank(e.target.value); setVerified(false) }} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]">
              {['우리은행', '국민은행', '신한은행', '하나은행', '농협은행', 'IBK기업은행', 'SC제일은행', '카카오뱅크', '토스뱅크'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">계좌번호</label>
            <input type="text" value={account} onChange={e => { setAccount(e.target.value); setVerified(false) }} placeholder="계좌번호를 입력하세요" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">예금주</label>
            <input type="text" value={holder} onChange={e => setHolder(e.target.value)} placeholder="예금주명" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
          </div>

          {verified && (
            <div className="flex items-center gap-1.5 text-xs text-[#2e9e6e] bg-[#f0f9f6] rounded-lg px-3 py-2">
              <i className="fas fa-check-circle" /> 계좌 인증이 완료되었습니다.
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          {!verified ? (
            <button onClick={handleVerify} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] transition-colors">
              계좌 인증
            </button>
          ) : (
            <button onClick={onClose} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] transition-colors">
              변경 완료
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

function MySalaryView() {
  const [selectedStub, setSelectedStub] = useState<PayStub | null>(MOCK_PAYSTUBS[0])
  const [year, setYear] = useState(2026)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
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

          {/* 급여상세 (ERD: pay_items, emp_accounts) */}
          <div className="border-t border-gray-100">
            <div className="px-5 py-3">
              <h4 className="text-xs font-bold text-gray-700 mb-3">급여상세</h4>
              <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500">연봉</td>
                    <td className="py-2 text-gray-800 bg-[#f8fffe] px-2 text-right">{EMPLOYEE.annualSalary.toLocaleString()}</td>
                    <td className="py-2 text-gray-500 pl-4">월급</td>
                    <td className="py-2 text-gray-800 bg-[#f8fffe] px-2 text-right">{EMPLOYEE.monthlySalary.toLocaleString()}</td>
                    <td colSpan={2} />
                  </tr>
                  {EMPLOYEE.fixedAllowances.map((a, i) => (
                    <tr key={a.name} className="border-b border-gray-100">
                      {i === 0 && <td className="py-2 text-gray-500" rowSpan={EMPLOYEE.fixedAllowances.length}>고정수당</td>}
                      <td className="py-2 text-gray-600 pl-2">{a.name}</td>
                      <td className="py-2 text-gray-800 pl-4 text-right">{a.amount.toLocaleString()}</td>
                      <td colSpan={3} />
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="text-xs text-gray-400 hover:text-gray-600 mt-2 flex items-center gap-1 mx-auto"
              >
                {infoOpen ? '접기' : '자세히 보기'}
                <i className={`fas fa-chevron-${infoOpen ? 'up' : 'down'} text-[9px]`} />
              </button>

              {/* 자세히 보기: emp_accounts 계좌 정보 */}
              {infoOpen && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">급여은행</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.salaryBank}</td>
                        <td className="py-2 text-gray-500 pl-4">급여계좌</td>
                        <td className="py-2 text-gray-800">{EMPLOYEE.salaryAccount}</td>
                        <td className="py-2" colSpan={2}>
                          <button onClick={() => setAccountModalOpen(true)} className="text-[10px] text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">계좌변경</button>
                        </td>
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

                  {/* 지급 (pay_details where pay_item_type=PAYMENT) */}
                  <table className="w-full text-xs mb-3">
                    <tbody>
                      <tr className="bg-gray-50 border border-gray-200">
                        <td className="py-2 px-3 font-medium text-gray-700" colSpan={2}>지급항목</td>
                      </tr>
                      {selectedStub.details.filter(d => d.category === 'PAYMENT').map(item => (
                        <tr key={item.itemName} className="border-x border-b border-gray-200">
                          <td className="py-1.5 px-3 text-gray-600 w-28">{item.itemName}</td>
                          <td className="py-1.5 px-3 text-right text-gray-800">{formatMoney(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-x border-b border-gray-200 bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-700">지급항목 합계</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-800">{formatMoney(selectedStub.totalEarnings)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 공제 (pay_details where pay_item_type=DEDUCTION) */}
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="bg-gray-50 border border-gray-200">
                        <td className="py-2 px-3 font-medium text-gray-700" colSpan={2}>공제항목</td>
                      </tr>
                      {selectedStub.details.filter(d => d.category === 'DEDUCTION').map(item => (
                        <tr key={item.itemName} className="border-x border-b border-gray-200">
                          <td className="py-1.5 px-3 text-gray-600 w-28">{item.itemName}</td>
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

      {accountModalOpen && <AccountChangeModal onClose={() => setAccountModalOpen(false)} />}
    </div>
  )
}

// ── 예상 퇴직금 조회 ──
type RetirementTab = 'severance' | 'pension'

function RetirementView() {
  const [activeTab, setActiveTab] = useState<RetirementTab>('severance')
  const [estimatedDate, setEstimatedDate] = useState('2026-03-31')
  const [calculated, setCalculated] = useState(false)

  const handleCalc = () => setCalculated(true)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[700px] mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            예상 퇴직금 조회
            <span className="text-xs font-normal text-gray-400 ml-2">퇴직금 예상액 및 퇴직연금 적립금액을 확인할 수 있습니다.</span>
          </h2>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('severance')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'severance' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            근속기준 퇴직금 예상액
          </button>
          <button
            onClick={() => setActiveTab('pension')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'pension' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            DB/DC 퇴직연금 적립금액
          </button>
        </div>

        {activeTab === 'severance' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-xs text-gray-500 space-y-1">
              <p>- 예상되는 퇴사일자를 기준으로 하여, 30일 분 이상의 평균임금으로 퇴직금을 계산합니다.</p>
              <p>- 실제 산정되는 퇴직금과 금액 차이가 발생될 수 있으므로 참고용으로 활용해주시길 바랍니다.</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-700 font-medium">예상 퇴사일 <span className="text-red-500">*</span></span>
              <input
                type="date"
                value={estimatedDate}
                onChange={e => { setEstimatedDate(e.target.value); setCalculated(false) }}
                className="border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#2e9e6e]"
              />
              <button onClick={handleCalc} className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                계산
              </button>
            </div>

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
          </>
        )}

        {activeTab === 'pension' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-xs text-gray-500 space-y-1">
              <p>- 회사의 퇴직연금 제도(DB/DC형)에 따른 적립금액을 확인합니다.</p>
              <p>- 실제 적립 금액은 퇴직연금 운용사 기준이며, 차이가 발생할 수 있습니다.</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 w-48 bg-gray-50 font-medium text-right">퇴직연금 유형</td>
                    <td className="py-2.5 px-4 text-gray-800">DB형 (확정급여형)</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">퇴직연금 운용사</td>
                    <td className="py-2.5 px-4 text-gray-800">{EMPLOYEE.retirementBank}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">퇴직연금 계좌</td>
                    <td className="py-2.5 px-4 text-gray-800">{EMPLOYEE.retirementAccount}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">적립 시작일</td>
                    <td className="py-2.5 px-4 text-gray-800">{EMPLOYEE.hireDate}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">최근 적립일</td>
                    <td className="py-2.5 px-4 text-gray-800">2026-03-25</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">월 적립액 (기준급여의 1/12)</td>
                    <td className="py-2.5 px-4 text-gray-800">{formatMoney(362500)}</td>
                  </tr>
                </tbody>
              </table>
              <table className="w-full text-xs border-t-2 border-gray-300">
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 w-48 font-bold text-right">누적 적립금액</td>
                    <td className="py-3 px-4 font-bold text-[#2e9e6e] text-base bg-[#f0fdfa]">{formatMoney(30450000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
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
