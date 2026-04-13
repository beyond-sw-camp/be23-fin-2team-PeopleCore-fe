import { useState, useEffect, useCallback } from 'react'
import { empSalaryApi } from '../../api/payAdmin'
import type { EmpSalaryRes, EmpSalaryDetailRes, ExpectedDeductionSummaryRes, PensionType } from '../../api/payAdmin'

type Tab = 'salary' | 'monthly'

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }

const STATUS_LABEL: Record<string, string> = { ACTIVE: '재직', ON_LEAVE: '휴직', RESIGNED: '퇴직' }
const TYPE_LABEL: Record<string, string> = { FULL: '정규직', CONTRACT: '계약직', DISPATCHED: '파견직' }

// ── 계좌변경 모달 ──
function AccountVerifyModal({ currentBank, currentAccount, onClose, onSave }: { currentBank: string; currentAccount: string; onClose: () => void; onSave: (bank: string, account: string, holder: string, token: string) => void }) {
  const [newBank, setNewBank] = useState(currentBank)
  const [newAccount, setNewAccount] = useState(currentAccount)
  const [holder, setHolder] = useState('')
  const [verified, setVerified] = useState(false)
  const [token, setToken] = useState('')
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
            <button onClick={() => { setVerified(true); setToken('verified-' + Date.now()) }} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">계좌 인증</button>
          ) : (
            <button onClick={() => { onSave(newBank, newAccount, holder, token); onClose() }} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">변경 완료</button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 급여상세 모달 ──
function PayDetailModal({ empId, onClose }: { empId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<EmpSalaryDetailRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [empPensionType, setEmpPensionType] = useState<'DB' | 'DC'>('DB')
  const [retProvider, setRetProvider] = useState('')
  const [retAccount, setRetAccount] = useState('')

  useEffect(() => {
    empSalaryApi.getDetail(empId)
      .then(res => {
        setDetail(res)
        if (res.empRetirementType === 'DB' || res.empRetirementType === 'DC') setEmpPensionType(res.empRetirementType)
        setRetProvider(res.pensionProvider || '')
        setRetAccount(res.retirementAccountNumber || '')
      })
      .catch(err => console.error('급여상세 조회 실패:', err))
      .finally(() => setLoading(false))
  }, [empId])

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-xl p-8 text-sm text-gray-500">로딩 중...</div>
    </div>
  )
  if (!detail) return null

  const inputCls = "text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e]"
  const banks = ['국민은행', '우리은행', '신한은행', '하나은행', '농협은행', 'IBK기업은행', '카카오뱅크', '토스뱅크']
  const statusLabel = STATUS_LABEL[detail.empStatus] || detail.empStatus
  const typeLabel = TYPE_LABEL[detail.empType] || detail.empType
  const showRetirement = detail.companyPensionType && detail.companyPensionType !== 'severance'

  const handleSaveAccount = (bank: string, account: string, holder: string, token: string) => {
    empSalaryApi.updateAccount(empId, { bankName: bank, accountNumber: account, accountHolder: holder, verificationToken: token })
      .then(() => empSalaryApi.getDetail(empId).then(setDetail))
      .catch(err => console.error('계좌 변경 실패:', err))
  }

  const handleSaveRetirement = () => {
    empSalaryApi.updateRetirementAccount(empId, {
      retirementType: empPensionType,
      pensionProvider: retProvider,
      accountNumber: retAccount || undefined,
    })
      .then(() => alert('퇴직연금 계좌가 저장되었습니다.'))
      .catch(err => console.error('퇴직연금 저장 실패:', err))
  }

  const handleSaveRetirementType = (type: 'DB' | 'DC') => {
    setEmpPensionType(type)
    empSalaryApi.updateRetirementType(empId, { retirementType: type })
      .catch(err => console.error('퇴직연금 유형 변경 실패:', err))
  }

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
                <div className="flex"><span className="text-gray-500 w-14 shrink-0">직원구분</span><span className="text-red-500 mr-0.5">*</span><span className="font-medium text-gray-800">{typeLabel}</span></div>
                <div className="flex"><span className="text-gray-500 w-10 shrink-0">부서</span><span className="font-medium text-gray-800">{detail.deptName}</span></div>
                <div className="flex"><span className="text-gray-500 w-12 shrink-0">사원명</span><span className="font-medium text-gray-800">{detail.empName}</span></div>
                <div className="flex"><span className="text-gray-500 w-14 shrink-0">입사일자</span><span className="text-red-500 mr-0.5">*</span><span className="font-medium text-gray-800">{detail.empHireDate}</span></div>
                <div className="flex"><span className="text-gray-500 w-10 shrink-0">사번</span><span className="font-medium text-gray-800">{detail.empNum}</span></div>
                <div className="flex"><span className="text-gray-500 w-12 shrink-0">직위</span><span className="font-medium text-gray-800">{detail.titleName || '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-14 shrink-0">ID</span><span className="font-medium text-gray-800">{detail.empEmail || '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-10 shrink-0">직급</span><span className="font-medium text-gray-800">{detail.gradeName || '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-12 shrink-0">상태</span><span className="font-medium text-gray-800">{statusLabel}</span></div>
              </div>
            </div>
          </div>

          {/* 급여 정보 */}
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <label className="text-gray-500 w-12 shrink-0">연봉</label>
                <span className={`${inputCls} flex-1 text-right bg-gray-50 text-gray-600`}>{fmt(detail.annualSalary)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-500 w-16 shrink-0">월급</label>
                <span className={`${inputCls} flex-1 text-right bg-gray-50 text-gray-600`}>{fmt(detail.monthlySalary)}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400">※ 연봉/월급은 사원관리 &gt; 연봉계약에서 설정됩니다.</p>

            {/* 고정수당 */}
            {detail.fixedPayItems && detail.fixedPayItems.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 border-b border-gray-200">
                  고정수당 항목 <span className="text-gray-400 font-normal ml-1">(연봉계약에서 설정)</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {detail.fixedPayItems.map(item => (
                    <div key={item.payItemId} className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-gray-600 w-20">{item.payItemName}</span>
                      <span className={`${inputCls} w-36 text-right bg-gray-50 text-gray-600`}>{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 계좌 정보 */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-700">계좌 정보</span>
                <button onClick={() => setAccountModalOpen(true)} className="text-[10px] text-[#1D9E75] border border-[#1D9E75] rounded px-2 py-0.5 hover:bg-[#f0f9f6]">계좌변경</button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">급여은행 <span className="text-red-500">*</span></label>
                  <span className={`${inputCls} flex-1 bg-gray-50 text-gray-600`}>{detail.bankName || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">급여계좌 <span className="text-red-500">*</span></label>
                  <span className={`${inputCls} flex-1 bg-gray-50 text-gray-600`}>{detail.accountNumber || '-'}</span>
                </div>

                {showRetirement && (
                  <>
                    {detail.companyPensionType === 'DB_DC' && (
                      <div className="flex items-center gap-2 col-span-2">
                        <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금유형</label>
                        <select value={empPensionType} onChange={e => handleSaveRetirementType(e.target.value as 'DB' | 'DC')} className={`${inputCls} w-40`}>
                          <option value="DB">DB형 (확정급여)</option>
                          <option value="DC">DC형 (확정기여)</option>
                        </select>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금운용사</label>
                      <input type="text" value={retProvider} onChange={e => setRetProvider(e.target.value)} placeholder="운용사명" className={`${inputCls} flex-1`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금계좌</label>
                      <input type="text" value={retAccount} onChange={e => setRetAccount(e.target.value)} placeholder="계좌번호" className={`${inputCls} flex-1`} />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button onClick={handleSaveRetirement} className="text-[10px] text-white bg-[#2e9e6e] rounded px-3 py-1 hover:bg-[#26865d]">퇴직연금 저장</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {accountModalOpen && (
          <AccountVerifyModal
            currentBank={detail.bankName || '국민은행'}
            currentAccount={detail.accountNumber || ''}
            onClose={() => setAccountModalOpen(false)}
            onSave={handleSaveAccount}
          />
        )}

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-times text-xs mr-1" /> 닫기
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
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null)

  // 연봉 탭 데이터
  const [employees, setEmployees] = useState<EmpSalaryRes[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // 월급여 예상공제 탭 데이터
  const [deductionData, setDeductionData] = useState<ExpectedDeductionSummaryRes | null>(null)
  const [deductionLoading, setDeductionLoading] = useState(false)

  const fetchEmployees = useCallback(() => {
    setLoading(true)
    empSalaryApi.getList({
      keyword: search || undefined,
      empStatus: statusFilter || undefined,
      size: 100,
    })
      .then(res => { setEmployees(res.content); setTotalCount(res.totalElements) })
      .catch(err => console.error('급여 목록 조회 실패:', err))
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  const fetchDeductions = useCallback(() => {
    setDeductionLoading(true)
    empSalaryApi.getExpectedDeductions()
      .then(setDeductionData)
      .catch(err => console.error('예상공제 조회 실패:', err))
      .finally(() => setDeductionLoading(false))
  }, [])

  useEffect(() => { if (activeTab === 'salary') fetchEmployees() }, [activeTab, fetchEmployees])
  useEffect(() => { if (activeTab === 'monthly') fetchDeductions() }, [activeTab, fetchDeductions])

  const depts = [...new Set(employees.map(e => e.deptName))]
  const filtered = employees.filter(e => {
    if (deptFilter && e.deptName !== deptFilter) return false
    return true
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'salary', label: '연봉' },
    { key: 'monthly', label: '월급여 예상지급공제' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1300px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 사원별 급여관리</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">사원별 급여관리</h1>
        <p className="text-xs text-gray-500 mb-5">사원들의 급여정보를 관리합니다.</p>

        <div className="flex border-b border-gray-200 mb-5">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.label}
              {t.key === 'salary' && <span className="ml-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{totalCount}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'salary' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 text-xs text-gray-500">
              <p>- 사원별로 계약한 연봉, 월급을 입력하고 지급할 계좌를 등록하는 화면입니다.</p>
              <p>- 또한 각종 소득세 감면 및 학자금 상환 등을 입력하면 급여작성에 반영되어 계산됩니다.</p>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">재직상태</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                  <option value="">전체</option>
                  <option value="ACTIVE">재직</option>
                  <option value="ON_LEAVE">휴직</option>
                  <option value="RESIGNED">퇴직</option>
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
              <button onClick={fetchEmployees} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
            </div>

            <div className="flex items-center justify-end gap-2 mb-2">
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">엑셀 업로드</button>
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">엑셀 다운로드</button>
            </div>

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
                  {loading ? (
                    <tr><td colSpan={10} className="py-8 text-center text-gray-400">로딩 중...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10} className="py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                  ) : filtered.map(emp => (
                    <tr key={emp.empId} className={`border-b border-gray-50 hover:bg-gray-50 ${emp.empStatus === 'ON_LEAVE' ? 'bg-yellow-50/50' : ''}`}>
                      <td className="py-2.5 px-3 text-gray-600">{STATUS_LABEL[emp.empStatus] || emp.empStatus}</td>
                      <td className="py-2.5 px-3 text-blue-600 cursor-pointer hover:underline" onClick={() => setSelectedEmpId(emp.empId)}>{emp.empName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.deptName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.titleName || '-'}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.empHireDate}</td>
                      <td className="py-2.5 px-3"><span className={`text-xs ${emp.empType === 'FULL' ? 'text-green-600' : emp.empType === 'CONTRACT' ? 'text-orange-600' : 'text-purple-600'}`}>{TYPE_LABEL[emp.empType] || emp.empType}</span></td>
                      <td className="py-2.5 px-3 text-right text-gray-800">{fmt(emp.annualSalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-800">{fmt(emp.monthlySalary)}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.bankName || '-'}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.accountNumber || '-'}</td>
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
              <span className="text-gray-800">사원 <span className="font-bold text-lg ml-1">{deductionData?.totalEmployees ?? 0}</span> 명</span>
              <span className="text-gray-500">예상 지급 세 후 월급여 <span className="font-bold text-lg text-gray-800 ml-1">{fmt(deductionData?.totalExpectedNetPay)}</span> 원</span>
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
                  {deductionLoading ? (
                    <tr><td colSpan={14} className="py-8 text-center text-gray-400">로딩 중...</td></tr>
                  ) : !deductionData?.employees?.length ? (
                    <tr><td colSpan={14} className="py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                  ) : deductionData.employees.map(emp => (
                    <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">{STATUS_LABEL[emp.empStatus] || emp.empStatus}</td>
                      <td className="py-2.5 px-3 text-blue-600">{emp.empName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.deptName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{emp.titleName || '-'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{fmt(emp.annualSalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{fmt(emp.monthlySalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-800">{fmt(emp.basePay)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{fmt(emp.nationalPension)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{fmt(emp.healthInsurance)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{fmt(emp.longTermCare)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{fmt(emp.employmentInsurance)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{fmt(emp.incomeTax)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{fmt(emp.localIncomeTax)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-800">{fmt(emp.expectedNetPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedEmpId && <PayDetailModal empId={selectedEmpId} onClose={() => { setSelectedEmpId(null); fetchEmployees() }} />}
    </div>
  )
}
