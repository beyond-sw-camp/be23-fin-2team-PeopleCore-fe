import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { empSalaryApi } from '../../api/payAdmin'
import type { EmpSalaryRes, EmpSalaryDetailRes, ExpectedDeductionSummaryRes } from '../../api/payAdmin'
import AccountVerifyModal from '../../components/payroll/AccountVerifyModal'
import DependentsModal from '../../components/payroll/DependentsModal'
import RetirementAccountModal from '../../components/payroll/RetirementAccountModal'
import Pagination from '../../components/Pagination'

type Tab = 'salary' | 'monthly'

const PAGE_SIZE = 15

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }

const STATUS_LABEL: Record<string, string> = { ACTIVE: '재직', ON_LEAVE: '휴직', RESIGNED: '퇴직' }
const TYPE_LABEL: Record<string, string> = { FULL: '정규직', CONTRACT: '계약직', DISPATCHED: '파견직' }

// ── 급여상세 모달 ──
function PayDetailModal({ empId, onClose }: { empId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<EmpSalaryDetailRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [retModalOpen, setRetModalOpen] = useState(false)
  const [depModalOpen, setDepModalOpen] = useState(false)
  const [empPensionType, setEmpPensionType] = useState<'DB' | 'DC'>('DB')

  useEffect(() => {
    empSalaryApi.getDetail(empId)
      .then(res => {
        setDetail(res)
        // 1) 사원 본인 선택값 우선
        // 2) 없으면 회사 설정으로 fallback (회사가 DB or DC일 때만 의미 있음)
        const fallback = res.companyPensionType === 'DB' ? 'DB'
                       : res.companyPensionType === 'DC' ? 'DC'
                       : 'DB'
        const effective = (res.empRetirementType === 'DB' || res.empRetirementType === 'DC')
          ? res.empRetirementType
          : fallback
        setEmpPensionType(effective)
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
  const statusLabel = STATUS_LABEL[detail.empStatus] || detail.empStatus
  const typeLabel = TYPE_LABEL[detail.empType] || detail.empType
  const isDBDC = detail.companyPensionType === 'DB_DC'

  const handleSaveAccount = (bankCode: string, bankName: string, account: string, holder: string, token: string) => {
    empSalaryApi.updateAccount(empId, { bankName, bankCode, accountNumber: account, accountHolder: holder, verificationToken: token })
      .then(() => empSalaryApi.getDetail(empId).then(setDetail))
      .catch(err => {
        const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? '계좌 변경에 실패했습니다.') : '계좌 변경에 실패했습니다.'
        console.error('계좌 변경 실패:', err)
        alert(msg)
      })
  }

  const handleSaveDependents = (count: number) => {
    empSalaryApi.updateDependents(empId, count)
      .then(() => empSalaryApi.getDetail(empId).then(setDetail))
      .catch(err => console.error('부양가족수 변경 실패:', err))
  }

  const handleSaveRetirement = (account: string) => {
    if (!detail) return
    // 운용사는 회사 지정값 사용 (사원이 변경 불가)
    empSalaryApi.updateRetirementAccount(empId, {
      retirementType: empPensionType,
      pensionProvider: detail.companyPensionProvider || '',
      accountNumber: account || undefined,
    })
      .then(() => empSalaryApi.getDetail(empId).then(setDetail))
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
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="text-[13px] font-semibold text-gray-700">급여 정보</h4>
              {(detail.contractStartDate || detail.contractEndDate) && (
                <span className="text-[11px] text-gray-400">
                  계약 기간 · {detail.contractStartDate ?? '-'} ~ {detail.contractEndDate ?? '진행중'}
                </span>
              )}
            </div>
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
            <p className="text-[10px] text-gray-400">※ 연봉/월급/계약기간은 사원관리 &gt; 연봉계약에서 설정됩니다.</p>

            {/* 고정수당 */}
            {detail.fixedPayItems && detail.fixedPayItems.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">
                    고정수당 항목
                    <span className="text-gray-400 font-normal ml-1 text-[10px]">(연봉계약에서 설정)</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {detail.fixedPayItems.map(item => (
                    <div key={item.payItemId} className="flex items-center gap-2">
                      <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">{item.payItemName}</label>
                      <span className={`${inputCls} flex-1 text-right bg-gray-50 text-gray-600`}>{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 세금 계산 정보 */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">세금 계산 정보</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">부양가족수</label>
                <span className={`${inputCls} w-24 text-center bg-gray-50 text-gray-600`}>{detail.dependentsCount ?? 1}명</span>
                <span className="text-[10px] text-gray-400 ml-1">(본인 포함, 간이세액표 조회용)</span>
                <button onClick={() => setDepModalOpen(true)} className="ml-auto text-[10px] text-[#1D9E75] border border-[#1D9E75] rounded px-2 py-0.5 hover:bg-[#f0f9f6]">수정</button>
              </div>
            </div>

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

                {isDBDC && (
                  <div className="flex items-center gap-2 col-span-2">
                    <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금유형</label>
                    <select value={empPensionType} onChange={e => handleSaveRetirementType(e.target.value as 'DB' | 'DC')} className={`${inputCls} w-40`}>
                      <option value="DB">DB형 (확정급여)</option>
                      <option value="DC">DC형 (확정기여)</option>
                    </select>
                  </div>
                )}
                {(() => {
                  const isDC = empPensionType === 'DC'
                  // 운용사 = 회사 단일, 계좌 = 사원별 (DB/DC 공통)
                  const provider = detail.companyPensionProvider
                  const account  = detail.retirementAccountNumber
                  return (
                    <>
                      <div className="flex items-center gap-2 col-span-2 -mt-1 mb-1">
                        <span className="text-[10px] text-gray-400">
                          {isDC
                            ? 'DC형 — 사원 본인이 운용. 계좌 변경 가능.'
                            : 'DB형 — 회사 운용. 계좌는 회사 측 등록·관리.'}
                        </span>
                        {isDC && (
                          <button onClick={() => setRetModalOpen(true)} className="ml-auto text-[10px] text-[#1D9E75] border border-[#1D9E75] rounded px-2 py-0.5 hover:bg-[#f0f9f6]">계좌변경</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금운용사</label>
                        <span className={`${inputCls} flex-1 bg-gray-50 text-gray-600`}>{provider || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-gray-500 shrink-0 whitespace-nowrap w-20">퇴직연금계좌</label>
                        <span className={`${inputCls} flex-1 bg-gray-50 text-gray-600`}>{account || '-'}</span>
                      </div>
                    </>
                  )
                })()}
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
        {retModalOpen && (
          <RetirementAccountModal
            companyProvider={detail.companyPensionProvider || ''}
            currentAccount={detail.retirementAccountNumber || ''}
            onClose={() => setRetModalOpen(false)}
            onSave={handleSaveRetirement}
          />
        )}
        {depModalOpen && (
          <DependentsModal
            currentValue={detail.dependentsCount ?? 1}
            onClose={() => setDepModalOpen(false)}
            onSave={handleSaveDependents}
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

  // 페이지 상태 (탭별 분리)
  const [salaryPage, setSalaryPage] = useState(1)
  const [monthlyPage, setMonthlyPage] = useState(1)

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (activeTab === 'salary') fetchEmployees() }, [activeTab, fetchEmployees])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (activeTab === 'monthly') fetchDeductions() }, [activeTab, fetchDeductions])

  // 연봉탭 — 부서 옵션은 현재 로드된 사원의 deptName 모음
  const depts = [...new Set(employees.map(e => e.deptName))]
  const filtered = employees.filter(e => {
    if (deptFilter && e.deptName !== deptFilter) return false
    return true
  })
  const pagedSalary = filtered.slice((salaryPage - 1) * PAGE_SIZE, salaryPage * PAGE_SIZE)

  // 월급여 탭 — API 가 keyword 미지원 → 클라이언트 필터 (이름/사번 + 재직상태 + 부서)
  const monthlyAll = deductionData?.employees ?? []
  const monthlyDepts = [...new Set(monthlyAll.map(e => e.deptName))]
  const monthlyFiltered = monthlyAll.filter(e => {
    const kw = search.trim().toLowerCase()
    if (kw && !e.empName.toLowerCase().includes(kw) && !(e.empNum?.toLowerCase().includes(kw) ?? false)) return false
    if (statusFilter && e.empStatus !== statusFilter) return false
    if (deptFilter && e.deptName !== deptFilter) return false
    return true
  })
  const monthlyEmployees = monthlyFiltered
  const pagedMonthly = monthlyFiltered.slice((monthlyPage - 1) * PAGE_SIZE, monthlyPage * PAGE_SIZE)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSalaryPage(1) }, [search, statusFilter, deptFilter, employees])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMonthlyPage(1) }, [deductionData, search, statusFilter, deptFilter])

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

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <i className="fas fa-search text-gray-400 text-[10px]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="이름 또는 사번 검색"
                  className="bg-transparent border-none outline-none text-xs w-44"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">재직상태</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                  <option value="">전체</option>
                  <option value="ACTIVE">재직</option>
                  <option value="ON_LEAVE">휴직</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">부서</span>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                  <option value="">전체</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button className="ml-auto px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">엑셀 다운로드</button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full text-xs table-fixed min-w-[1000px]">
                <colgroup>
                  <col className="w-16" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-16" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-20" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-20" />
                  <col className="w-32" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">재직상태</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">사원명</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">부서</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">직위</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">입사일</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">퇴사일</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">직원구분</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">연봉</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">월급</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">은행</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">계좌번호</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="py-8 text-center text-gray-400">로딩 중...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={11} className="py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                  ) : pagedSalary.map(emp => (
                    <tr key={emp.empId} className={`border-b border-gray-50 hover:bg-gray-50 ${emp.empStatus === 'ON_LEAVE' ? 'bg-yellow-50/50' : ''}`}>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate">{STATUS_LABEL[emp.empStatus] || emp.empStatus}</td>
                      <td className="py-2.5 px-3 text-center text-blue-600 cursor-pointer hover:underline truncate" title={emp.empName} onClick={() => setSelectedEmpId(emp.empId)}>{emp.empName}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate" title={emp.deptName}>{emp.deptName}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate" title={emp.titleName || '-'}>{emp.titleName || '-'}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate">{emp.empHireDate}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate">{emp.empResignDate || '-'}</td>
                      <td className="py-2.5 px-3 text-center truncate"><span className={`text-xs ${emp.empType === 'FULL' ? 'text-green-600' : emp.empType === 'CONTRACT' ? 'text-orange-600' : 'text-purple-600'}`}>{TYPE_LABEL[emp.empType] || emp.empType}</span></td>
                      <td className="py-2.5 px-3 text-right text-gray-800 truncate">{fmt(emp.annualSalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-800 truncate">{fmt(emp.monthlySalary)}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate" title={emp.bankName || '-'}>{emp.bankName || '-'}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate" title={emp.accountNumber || '-'}>{emp.accountNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={salaryPage} total={filtered.length} pageSize={PAGE_SIZE} onChange={setSalaryPage} />
          </>
        )}

        {activeTab === 'monthly' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 text-xs text-gray-500">
              <p>- 실제 급여에 반영되는 내역과 다를 수 있으니, 참고용으로 봐주시길 바랍니다.</p>
            </div>
            <div className="flex items-center gap-4 mb-4 text-xs">
              <span className="text-gray-800">사원 <span className="font-bold text-lg ml-1">{deductionData?.totalEmployees ?? 0}</span> 명</span>
              <span className="text-gray-500">예상 지급 세후 월급여 <span className="font-bold text-lg text-gray-800 ml-1">{fmt(deductionData?.totalExpectedNetPay)}</span> 원</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <i className="fas fa-search text-gray-400 text-[10px]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="이름 또는 사번 검색"
                  className="bg-transparent border-none outline-none text-xs w-44"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">재직상태</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                  <option value="">전체</option>
                  <option value="ACTIVE">재직</option>
                  <option value="ON_LEAVE">휴직</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">부서</span>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                  <option value="">전체</option>
                  {monthlyDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button className="ml-auto px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">엑셀 다운로드</button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full text-xs table-fixed min-w-[1200px]">
                <colgroup>
                  <col className="w-16" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-16" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-24" />
                  <col className="w-28" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">재직상태</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">사원명</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">부서</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">직위</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">연봉</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">월급</th>
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
                    <tr><td colSpan={13} className="py-8 text-center text-gray-400">로딩 중...</td></tr>
                  ) : !monthlyEmployees.length ? (
                    <tr><td colSpan={13} className="py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                  ) : pagedMonthly.map(emp => (
                    <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate">{STATUS_LABEL[emp.empStatus] || emp.empStatus}</td>
                      <td className="py-2.5 px-3 text-center text-blue-600 truncate" title={emp.empName}>{emp.empName}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate" title={emp.deptName}>{emp.deptName}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600 truncate" title={emp.titleName || '-'}>{emp.titleName || '-'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600 whitespace-nowrap">{fmt(emp.annualSalary)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600 whitespace-nowrap">{fmt(emp.monthlySalary)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500 whitespace-nowrap">{fmt(emp.nationalPension)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500 whitespace-nowrap">{fmt(emp.healthInsurance)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500 whitespace-nowrap">{fmt(emp.longTermCare)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500 whitespace-nowrap">{fmt(emp.employmentInsurance)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500 whitespace-nowrap">{fmt(emp.incomeTax)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500 whitespace-nowrap">{fmt(emp.localIncomeTax)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-800 whitespace-nowrap">{fmt(emp.expectedNetPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={monthlyPage} total={monthlyEmployees.length} pageSize={PAGE_SIZE} onChange={setMonthlyPage} />
          </>
        )}
      </div>

      {selectedEmpId && <PayDetailModal empId={selectedEmpId} onClose={() => { setSelectedEmpId(null); fetchEmployees() }} />}
    </div>
  )
}
