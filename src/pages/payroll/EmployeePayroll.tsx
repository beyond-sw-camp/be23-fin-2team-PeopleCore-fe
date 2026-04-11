import { useState } from 'react'

type Tab = 'salary' | 'monthly'

const MOCK_EMPLOYEES = [
  { empNo: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', position: '팀원', type: '정규직', hireDate: '2022-03-02', status: '재직', annualSalary: 48000000, monthlySalary: 4000000, bank: '국민은행', account: '123-456-789', retirementBank: '', retirementAccount: '' },
  { empNo: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', position: '팀장', type: '정규직', hireDate: '2020-07-15', status: '재직', annualSalary: 56000000, monthlySalary: 4666667, bank: '우리은행', account: '987-654-321', retirementBank: '', retirementAccount: '' },
  { empNo: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', position: '팀원', type: '계약직', hireDate: '2023-09-01', status: '재직', annualSalary: 36000000, monthlySalary: 3000000, bank: '신한은행', account: '111-222-333', retirementBank: '', retirementAccount: '' },
  { empNo: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', position: '팀원', type: '정규직', hireDate: '2021-11-10', status: '재직', annualSalary: 42000000, monthlySalary: 3500000, bank: '하나은행', account: '444-555-666', retirementBank: '', retirementAccount: '' },
  { empNo: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', position: '파트장', type: '정규직', hireDate: '2018-04-20', status: '재직', annualSalary: 64000000, monthlySalary: 5333333, bank: '국민은행', account: '777-888-999', retirementBank: '', retirementAccount: '' },
  { empNo: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', position: '팀원', type: '인턴', hireDate: '2024-01-08', status: '재직', annualSalary: 28000000, monthlySalary: 2333333, bank: '카카오뱅크', account: '3333-01-1234', retirementBank: '', retirementAccount: '' },
  { empNo: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', position: '팀원', type: '정규직', hireDate: '2021-05-03', status: '휴직', annualSalary: 46000000, monthlySalary: 3833333, bank: '우리은행', account: '555-666-777', retirementBank: '', retirementAccount: '' },
  { empNo: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', position: '팀장', type: '정규직', hireDate: '2015-02-16', status: '재직', annualSalary: 78000000, monthlySalary: 6500000, bank: '신한은행', account: '888-999-000', retirementBank: '', retirementAccount: '' },
]

function fmt(n: number) { return n.toLocaleString() }

type Employee = typeof MOCK_EMPLOYEES[0]

// ── 계좌변경 모달 ──
function AccountVerifyModal({ currentBank, currentAccount, onClose, onSave }: { currentBank: string; currentAccount: string; onClose: () => void; onSave: (bank: string, account: string) => void }) {
  const [newBank, setNewBank] = useState(currentBank)
  const [newAccount, setNewAccount] = useState(currentAccount)
  const [holder, setHolder] = useState('')
  const [verified, setVerified] = useState(false)
  const banks = ['국민은행', '우리은행', '신한은행', '하나은행', '농협은행', 'IBK기업은행', '카카오뱅크', '토스뱅크']

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
            <select value={newBank} onChange={e => { setNewBank(e.target.value); setVerified(false) }} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]">
              {banks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">계좌번호</label>
            <input type="text" value={newAccount} onChange={e => { setNewAccount(e.target.value); setVerified(false) }} placeholder="계좌번호를 입력하세요" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
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
            <button onClick={() => setVerified(true)} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">계좌 인증</button>
          ) : (
            <button onClick={() => { onSave(newBank, newAccount); onClose() }} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">변경 완료</button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}

function PayDetailModal({ emp, onClose }: { emp: Employee; onClose: () => void }) {
  const [annualSalary, _setAnnualSalary] = useState(emp.annualSalary)
  const [monthlySalary, _setMonthlySalary] = useState(emp.monthlySalary)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  // pay_items 테이블에서 is_fixed=true, category=ALLOWANCE 인 항목 (회사에서 세팅)
  const [fixedAllowances] = useState([
    { name: '식대', amount: 200000 },
    { name: '교통비', amount: 100000 },
    { name: '직책수당', amount: emp.position === '팀장' || emp.position === '파트장' ? 300000 : 0 },
  ])
  const [bank, setBank] = useState(emp.bank)
  const [account, setAccount] = useState(emp.account)
  const [retBank, setRetBank] = useState(emp.retirementBank || '')
  const [retAccount, setRetAccount] = useState(emp.retirementAccount || '')

  const fmtComma = (n: number) => n.toLocaleString()

  const banks = ['국민은행', '우리은행', '신한은행', '하나은행', '농협은행', 'IBK기업은행', '카카오뱅크', '토스뱅크']
  const inputCls = "text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl flex flex-col" style={{ width: '820px', height: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-[15px] font-bold text-gray-900">급여 상세 설정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* 사원 정보 */}
          <div className="border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex gap-4">
              <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-user text-2xl text-gray-300" />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
                <div className="flex"><span className="text-gray-500 w-14 shrink-0">직원구분</span><span className="text-red-500 mr-0.5">*</span><span className="font-medium text-gray-800">{emp.type}</span></div>
                <div className="flex"><span className="text-gray-500 w-10 shrink-0">부서</span><span className="font-medium text-gray-800">{emp.dept}</span></div>
                <div className="flex"><span className="text-gray-500 w-12 shrink-0">사원명</span><span className="font-medium text-gray-800">{emp.name}</span></div>
                <div className="flex"><span className="text-gray-500 w-14 shrink-0">입사일자</span><span className="text-red-500 mr-0.5">*</span><span className="font-medium text-gray-800">{emp.hireDate}</span></div>
                <div className="flex"><span className="text-gray-500 w-10 shrink-0">사번</span><span className="font-medium text-gray-800">{emp.empNo}</span></div>
                <div className="flex"><span className="text-gray-500 w-12 shrink-0">직위</span><span className="font-medium text-gray-800">{emp.rank}</span></div>
                <div className="flex"><span className="text-gray-500 w-14 shrink-0">ID</span><span className="font-medium text-gray-800">{emp.empNo.toLowerCase()}@peoplecore.kr</span></div>
                <div className="flex"><span className="text-gray-500 w-10 shrink-0">직책</span><span className="font-medium text-gray-800">{emp.position}</span></div>
                <div className="flex"><span className="text-gray-500 w-12 shrink-0">상태</span><span className="font-medium text-gray-800">{emp.status}</span></div>
              </div>
            </div>
          </div>

          {/* 급여 정보 (연봉계약에서 가져옴 - 읽기전용) */}
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <label className="text-gray-500 w-12 shrink-0">연봉</label>
                <span className={`${inputCls} flex-1 text-right bg-gray-50 text-gray-600`}>{fmtComma(annualSalary)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-500 w-16 shrink-0">월급</label>
                <span className={`${inputCls} flex-1 text-right bg-gray-50 text-gray-600`}>{fmtComma(monthlySalary)}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400">※ 연봉/월급은 사원관리 &gt; 연봉계약에서 설정됩니다.</p>

            {/* 고정수당 (pay_items: is_fixed=true, category=ALLOWANCE) - 읽기전용 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 border-b border-gray-200">
                고정수당 항목 <span className="text-gray-400 font-normal ml-1">(연봉계약에서 설정)</span>
              </div>
              <div className="divide-y divide-gray-100">
                {fixedAllowances.map((item) => (
                  <div key={item.name} className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-gray-600 w-20">{item.name}</span>
                    <span className={`${inputCls} w-36 text-right bg-gray-50 text-gray-600`}>{fmtComma(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-700">계좌 정보</span>
                <button onClick={() => setAccountModalOpen(true)} className="text-[10px] text-[#1D9E75] border border-[#1D9E75] rounded px-2 py-0.5 hover:bg-[#f0f9f6]">계좌변경</button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">급여은행 <span className="text-red-500">*</span></label>
                  <select value={bank} onChange={e => setBank(e.target.value)} className={`${inputCls} flex-1`}>
                    {banks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">급여계좌 <span className="text-red-500">*</span></label>
                  <input type="text" value={account} onChange={e => setAccount(e.target.value)} placeholder="계좌번호" className={`${inputCls} flex-1`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금은행</label>
                  <select value={retBank} onChange={e => setRetBank(e.target.value)} className={`${inputCls} flex-1`}>
                    <option value="">선택</option>
                    {banks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금계좌</label>
                  <input type="text" value={retAccount} onChange={e => setRetAccount(e.target.value)} placeholder="계좌번호" className={`${inputCls} flex-1`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {accountModalOpen && (
          <AccountVerifyModal
            currentBank={bank}
            currentAccount={account}
            onClose={() => setAccountModalOpen(false)}
            onSave={(b, a) => { setBank(b); setAccount(a) }}
          />
        )}

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] transition-colors">
            <i className="fas fa-save text-xs mr-1" /> 저장
          </button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-times text-xs mr-1" /> 취소
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmployeePayroll() {
  const [activeTab, setActiveTab] = useState<Tab>('salary')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)

  const filtered = MOCK_EMPLOYEES.filter(e => {
    if (search && !e.name.includes(search) && !e.empNo.includes(search)) return false
    if (deptFilter && e.dept !== deptFilter) return false
    if (statusFilter && e.status !== statusFilter) return false
    return true
  })

  const depts = [...new Set(MOCK_EMPLOYEES.map(e => e.dept))]
  const tabs: { key: Tab; label: string }[] = [
    { key: 'salary', label: '연봉' },
    { key: 'monthly', label: '월급여 예상지급공제' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1300px] mx-auto">
        {/* 브레드크럼 */}
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 사원별 급여관리</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">사원별 급여관리</h1>
        <p className="text-xs text-gray-500 mb-5">사원들의 급여정보를 관리합니다.</p>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 mb-5">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.label}
              {t.key === 'salary' && <span className="ml-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{MOCK_EMPLOYEES.length}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'salary' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 text-xs text-gray-500">
              <p>- 사원별로 계약한 연봉, 월급을 입력하고 지급할 계좌를 등록하는 화면입니다.</p>
              <p>- 또한 각종 소득세 감면 및 학자금 상환 등을 입력하면 급여작성에 반영되어 계산됩니다.</p>
            </div>

            {/* 필터 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">재직상태</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                  <option value="">전체</option>
                  <option value="재직">재직</option>
                  <option value="휴직">휴직</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">부서</span>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                  <option value="">전체</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <input type="text" placeholder="사원명을 입력하세요.." value={search} onChange={e => setSearch(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 text-xs outline-none w-44" />
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
            </div>

            <div className="flex items-center justify-end gap-2 mb-2">
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">엑셀 업로드</button>
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">엑셀 다운로드</button>
            </div>

            {/* 테이블 */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">재직상태</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">직위</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">입사일</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">직원구분</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">연봉</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">월급</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">은행</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">계좌번호</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.empNo} className={`border-b border-gray-50 hover:bg-gray-50 ${emp.status === '휴직' ? 'bg-yellow-50/50' : ''}`}>
                      <td className="py-2.5 px-3 text-gray-600">{emp.status}</td>
                      <td className="py-2.5 px-3 text-blue-600 cursor-pointer hover:underline" onClick={() => setSelectedEmp(emp)}>{emp.name}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.dept}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.rank}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.hireDate}</td>
                      <td className="py-2.5 px-3"><span className={`text-xs ${emp.type === '정규직' ? 'text-green-600' : emp.type === '인턴' ? 'text-purple-600' : 'text-orange-600'}`}>{emp.type}</span></td>
                      <td className="py-2.5 px-3 text-right text-gray-800">{fmt(emp.annualSalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-800">{fmt(emp.monthlySalary)}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.bank}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.account}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'monthly' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 text-xs text-gray-500">
              <p>- 실제 급여에 반영되는 내역과 다를 수 있으니, 참고용으로 봐주시길 바랍니다.</p>
            </div>
            <div className="flex items-center gap-4 mb-4 text-xs">
              <span className="text-gray-800">사원 <span className="font-bold text-lg ml-1">{filtered.length}</span> 명</span>
              <span className="text-gray-500">예상 지급 세 후 월급여 <span className="font-bold text-lg text-gray-800 ml-1">0</span> 원</span>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full text-xs min-w-[1100px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">재직상태</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">직위</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">연봉</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">월급</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">기본급</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">국민연금</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">건강보험</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">장기요양</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">고용보험</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">소득세</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">지방소득세</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">예상 세후 월급</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.empNo} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">{emp.status}</td>
                      <td className="py-2.5 px-3 text-blue-600">{emp.name}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.dept}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.rank}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{fmt(emp.annualSalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{fmt(emp.monthlySalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {selectedEmp && <PayDetailModal emp={selectedEmp} onClose={() => setSelectedEmp(null)} />}
    </div>
  )
}
