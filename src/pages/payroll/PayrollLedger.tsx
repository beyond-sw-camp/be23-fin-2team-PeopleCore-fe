import { useState, useEffect, useCallback } from 'react'
import { payrollApi } from '../../api/payAdmin'
import type { PayrollRunRes, PayrollEmpRes, PayrollEmpDetailRes, WageInfoRes, ApprovedOvertimeRes } from '../../api/payAdmin'
import ApprovalDraftModal from './ApprovalDraftModal'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '산정중', CONFIRMED: '확정', IN_APPROVAL: '승인요청', PAID: '지급완료',
  ACTIVE: '재직', ON_LEAVE: '휴직', RESIGNED: '퇴직',
  FULL: '정규', CONTRACT: '계약', DISPATCHED: '파견',
}
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-orange-100 text-orange-700',
  IN_APPROVAL: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
}

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }
function parseNum(s: string) { return Number(s.replace(/,/g, '').replace(/[^0-9]/g, '')) || 0 }
function label(v: string) { return STATUS_LABEL[v] || v }

export default function PayrollLedger() {
  const [yearMonth, setYearMonth] = useState('2026-04')
  const [run, setRun] = useState<PayrollRunRes | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<PayrollEmpRes | null>(null)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [checkedIds, setCheckedIds] = useState<number[]>([])

  const fetchRun = useCallback(() => {
    setLoading(true)
    payrollApi.getPayroll(yearMonth)
      .then(setRun)
      .catch(err => {
        if (err?.response?.status === 404) {
          setRun(null)  // 해당월 급여대장이 아직 없음
        } else {
          console.error('급여대장 조회 실패:', err)
        }
      })
      .finally(() => setLoading(false))
  }, [yearMonth])

  useEffect(() => { fetchRun() }, [fetchRun])

  const employees = run?.employees || []

  const toggleCheck = (id: number) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
  }
  const toggleAll = () => {
    if (checkedIds.length === employees.length) setCheckedIds([])
    else setCheckedIds(employees.map(e => e.empId))
  }

  const handleCreatePayroll = () => {
    if (!confirm(`${yearMonth} 급여대장을 새로 생성하시겠습니까?\n\n재직 중인 전 직원이 '산정중' 상태로 추가됩니다. 각 사원을 클릭해 지급 항목을 입력하면 공제가 자동 계산됩니다.`)) return
    setLoading(true)
    payrollApi.createPayroll(yearMonth)
      .then(async createRes => {
        console.log('[급여대장 생성 응답]', createRes)
        // 생성 직후 전체 목록 재조회
        const fetched = await payrollApi.getPayroll(yearMonth).catch(err => { console.error('재조회 실패:', err); return null })
        console.log('[급여대장 재조회 결과]', fetched)
        if (fetched) setRun(fetched)
        else setRun(createRes)  // 재조회 실패 시 생성 응답이라도 사용
        alert('급여대장이 생성되었습니다. 대상 사원: ' + (fetched?.employees?.length ?? createRes?.employees?.length ?? 0) + '명')
      })
      .catch(err => { console.error('급여대장 생성 실패:', err); alert('생성 실패: ' + (err?.response?.data?.message || '오류')) })
      .finally(() => setLoading(false))
  }

  const handleCopyPrev = () => {
    if (!confirm(`전월 급여대장을 복사하시겠습니까?\n\n전월 지급/공제 금액이 그대로 복사됩니다.`)) return
    setLoading(true)
    payrollApi.copyFromPreviousMonth(yearMonth)
      .then(async () => {
        await payrollApi.getPayroll(yearMonth).then(setRun).catch(() => {})
        alert('전월 급여가 복사되었습니다.')
      })
      .catch(err => { console.error('전월복사 실패:', err); alert('전월복사 실패: ' + (err?.response?.data?.message || '오류')) })
      .finally(() => setLoading(false))
  }

  const handleConfirm = () => {
    if (!run) return
    if (!confirm('급여를 확정하시겠습니까?')) return
    payrollApi.confirmPayroll(run.payrollRunId)
      .then(() => { alert('급여가 확정되었습니다.'); fetchRun() })
      .catch(err => alert('확정 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const handleApproval = () => {
    if (!run) return
    setApprovalModalOpen(true)
  }

  const handlePay = () => {
    if (!run) return
    if (!confirm('지급처리 하시겠습니까?')) return
    payrollApi.processPayment(run.payrollRunId)
      .then(() => { alert('지급처리 완료'); fetchRun() })
      .catch(err => alert('지급처리 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const handleDownloadTransfer = () => {
    if (!run) return
    payrollApi.downloadTransferFile(run.payrollRunId)
      .then(res => {
        const url = URL.createObjectURL(res.data as Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `급여대량이체_${yearMonth}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(err => alert('파일 다운로드 실패: ' + (err?.response?.data?.message || '오류')))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 급여대장(작성){selected && ` > ${selected.empName}`}</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">급여대장(작성)</h1>
        <p className="text-xs text-gray-500 mb-5">월별 급여대장을 작성하고 관리합니다.</p>

        {!selected && (
        <>
        {/* 상단 컨트롤 */}
        <div className="flex items-center gap-3 mb-4">
          <input type="month" value={yearMonth} onChange={e => { setYearMonth(e.target.value); setCheckedIds([]) }} className="text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          {!run && !loading && (
            <>
              <button onClick={handleCreatePayroll} className="px-3 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]">
                <i className="fas fa-plus text-[10px] mr-1" />새로 생성
              </button>
              <button onClick={handleCopyPrev} className="px-3 py-1.5 text-xs text-white bg-blue-500 rounded hover:bg-blue-600">
                <i className="fas fa-copy text-[10px] mr-1" />전월 복사
              </button>
              <span className="text-[11px] text-gray-400">· 둘 중 하나만 선택하세요</span>
            </>
          )}
          {run && (
            <>
              <button onClick={handleConfirm} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-check text-[10px] mr-1" />확정</button>
              <button onClick={handleApproval} className="px-3 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]"><i className="fas fa-file-signature text-[10px] mr-1" />전자결재</button>
              <button onClick={handlePay} className="px-3 py-1.5 text-xs text-white bg-[#3b82f6] rounded hover:bg-[#2563eb]"><i className="fas fa-coins text-[10px] mr-1" />지급처리</button>
              <button onClick={handleDownloadTransfer} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-file-excel text-[10px] mr-1" />대량이체 파일</button>
              <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_BADGE[run.payrollStatus] || 'bg-gray-100 text-gray-600'}`}>{label(run.payrollStatus)}</span>
            </>
          )}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">급여대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{run?.totalEmployees ?? 0} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">세 전 총 지급합계</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(run?.totalPay)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">공제합계</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(run?.totalDeduction)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">공제 후 지급액</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(run?.totalNetPay)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">미지급 급여</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(run?.unpaidAmount)} <span className="text-sm font-normal">원</span></div>
          </div>
        </div>
        </>
        )}

        {!selected ? (
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2 px-2 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={employees.length > 0 && checkedIds.length === employees.length} onChange={toggleAll} /></th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">상태</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">사원명</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">부서</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">직급</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">직원구분</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">지급합계</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">공제합계</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">공제 후 지급액</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">미지급</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="py-8 text-center text-gray-400">로딩 중...</td></tr>
                  ) : !run ? (
                    <tr><td colSpan={10} className="py-12 text-center text-gray-400">{yearMonth} 급여대장이 아직 생성되지 않았습니다. 상단의 "급여대장 생성" 버튼을 클릭하세요.</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan={10} className="py-8 text-center text-gray-400">대상 사원이 없습니다.</td></tr>
                  ) : employees.map(emp => (
                    <tr key={emp.empId} onClick={() => setSelected(emp)} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50">
                      <td className="py-2 px-2" onClick={e => e.stopPropagation()}><input type="checkbox" className="w-3 h-3" checked={checkedIds.includes(emp.empId)} onChange={() => toggleCheck(emp.empId)} /></td>
                      <td className="py-2 px-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{label(emp.status)}</span></td>
                      <td className="py-2 px-2 text-blue-600 hover:underline">{emp.empName}</td>
                      <td className="py-2 px-2 text-gray-600">{emp.deptName}</td>
                      <td className="py-2 px-2 text-gray-600">{emp.gradeName || '-'}</td>
                      <td className="py-2 px-2 text-gray-600">{label(emp.empType)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.totalPay)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.totalDeduction)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.netPay)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.unpaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : run && (
          <EmpDetailEditor
            payrollRunId={run.payrollRunId}
            empSummary={selected}
            onClose={() => { setSelected(null); fetchRun() }}
          />
        )}
      </div>

      {/* 전자결재 상신 모달 */}
      {approvalModalOpen && run && (
        <ApprovalDraftModal
          type="SALARY"
          ledgerId={run.payrollRunId}
          onClose={() => setApprovalModalOpen(false)}
          onSubmitted={() => fetchRun()}
        />
      )}
    </div>
  )
}

// ── 사원별 급여 상세 편집 ──
function EmpDetailEditor({ payrollRunId, empSummary, onClose }: { payrollRunId: number; empSummary: PayrollEmpRes; onClose: () => void }) {
  const [detail, setDetail] = useState<PayrollEmpDetailRes | null>(null)
  const [wageInfo, setWageInfo] = useState<WageInfoRes | null>(null)
  const [overtime, setOvertime] = useState<ApprovedOvertimeRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentEdits, setPaymentEdits] = useState<Record<number, number>>({})

  const fetchAll = useCallback(() => {
    setLoading(true)
    Promise.all([
      payrollApi.getEmpDetail(payrollRunId, empSummary.empId),
      payrollApi.getWageInfo(payrollRunId, empSummary.empId).catch(() => null),
      payrollApi.getApprovedOvertime(payrollRunId, empSummary.empId).catch(() => null),
    ]).then(([d, w, o]) => {
      setDetail(d)
      setWageInfo(w)
      setOvertime(o)
      const init: Record<number, number> = {}
      d.paymentItems.forEach(p => init[p.payItemId] = p.amount)
      setPaymentEdits(init)
    }).catch(err => console.error('상세 조회 실패:', err))
      .finally(() => setLoading(false))
  }, [payrollRunId, empSummary.empId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleApplyOvertime = () => {
    payrollApi.applyOvertime(payrollRunId, empSummary.empId)
      .then(() => { alert('초과근무 수당이 적용되었습니다.'); fetchAll() })
      .catch(err => alert('적용 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const totalPay = Object.values(paymentEdits).reduce((a, b) => a + b, 0)
  const totalDeduct = detail?.deductionItems.reduce((a, b) => a + b.amount, 0) || 0
  const netPay = totalPay - totalDeduct

  const handleRecalcDeductions = () => {
    payrollApi.calcDeductions({ totalPay, empId: empSummary.empId })
      .then(res => {
        if (!detail) return
        // 응답으로 공제 항목을 매핑 (이름 매칭)
        const updated = detail.deductionItems.map(item => {
          const name = item.payItemName
          if (name.includes('국민연금')) return { ...item, amount: res.nationalPension }
          if (name.includes('건강')) return { ...item, amount: res.healthInsurance }
          if (name.includes('장기요양')) return { ...item, amount: res.longTermCare }
          if (name.includes('고용')) return { ...item, amount: res.employmentInsurance }
          if (name.includes('소득세') && !name.includes('지방')) return { ...item, amount: res.incomeTax }
          if (name.includes('지방소득세')) return { ...item, amount: res.localIncomeTax }
          return item
        })
        setDetail({ ...detail, deductionItems: updated })
      })
      .catch(err => alert('공제 계산 실패: ' + (err?.response?.data?.message || '오류')))
  }

  if (loading || !detail) return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">로딩 중...</div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-xs text-gray-600 border border-gray-200 rounded px-2.5 py-1 hover:bg-gray-50">
            <i className="fas fa-arrow-left text-[10px] mr-1" />목록으로
          </button>
          <div className="text-sm">
            <span className="text-gray-500">사원명</span> <span className="font-bold ml-1">{detail.empName}</span>
            <span className="text-gray-500 ml-4">부서</span> <span className="font-bold ml-1">{detail.deptName}</span>
            <span className="text-gray-500 ml-4">직급</span> <span className="font-bold ml-1">{detail.gradeName || '-'}</span>
            <span className="text-gray-500 ml-4">구분</span> <span className="font-bold ml-1">{label(detail.empType)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 px-6 py-5">
        {/* 좌측: 지급/공제 입력 */}
        <div className="col-span-2 space-y-5">
          {/* 지급항목 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 flex items-center justify-between">
              <span><i className="fas fa-arrow-up text-[10px] text-blue-500 mr-1.5" />지급항목</span>
              <button onClick={handleRecalcDeductions} className="text-[10px] text-[#2e9e6e] border border-[#2e9e6e] rounded px-2 py-0.5 hover:bg-[#f0f9f6]">공제 자동계산</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 p-4 text-xs">
              {detail.paymentItems.map(item => (
                <div key={item.payItemId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600">{item.payItemName}</span>
                  <input
                    type="text"
                    value={fmt(paymentEdits[item.payItemId] ?? item.amount)}
                    onChange={e => setPaymentEdits(prev => ({ ...prev, [item.payItemId]: parseNum(e.target.value) }))}
                    className="w-32 text-right text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#2e9e6e]"
                  />
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">지급항목 합계</span>
              <span className="font-bold text-gray-800">{fmt(totalPay)} <span className="font-normal text-gray-500">원</span></span>
            </div>
          </div>

          {/* 공제항목 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 flex items-center justify-between">
              <span><i className="fas fa-arrow-down text-[10px] text-red-500 mr-1.5" />공제항목</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 p-4 text-xs">
              {detail.deductionItems.map(item => (
                <div key={item.payItemId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600">{item.payItemName}</span>
                  <span className="w-32 text-right text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50 text-gray-600">{fmt(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">공제항목 합계</span>
              <span className="font-bold text-red-500">{fmt(totalDeduct)} <span className="font-normal text-gray-500">원</span></span>
            </div>
          </div>

          <div className="border border-[#2e9e6e] bg-[#f0f9f6] rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#2e9e6e]">공제 후 지급액</span>
            <span className="text-lg font-bold text-[#2e9e6e]">{fmt(netPay)} <span className="text-xs font-normal">원</span></span>
          </div>
        </div>

        {/* 우측: 일당/시급 + 전자결재 */}
        <div className="col-span-1 space-y-4">
          {wageInfo && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200">
                <i className="fas fa-calculator text-[10px] text-[#2e9e6e] mr-1.5" />일당/시급 기준
              </div>
              <div className="p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between"><span className="text-gray-500">시급</span><span className="font-medium text-gray-800">{fmt(wageInfo.hourlyWage)} 원</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">일당</span><span className="font-medium text-gray-800">{fmt(wageInfo.dailyWage)} 원</span></div>
              </div>
            </div>
          )}

          {overtime && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 flex items-center justify-between">
                <span><i className="fas fa-file-signature text-[10px] text-[#2e9e6e] mr-1.5" />이달 승인된 전자결재</span>
                <button
                  onClick={handleApplyOvertime}
                  disabled={overtime.applied}
                  className={`text-[10px] rounded px-2 py-0.5 ${overtime.applied ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white bg-[#2e9e6e] hover:bg-[#26865d]'}`}
                >
                  {overtime.applied ? '적용완료' : '전체 적용'}
                </button>
              </div>
              <div className="p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between"><span className="text-gray-500">연장근로</span><span className="text-[#2e9e6e]">{Math.round(overtime.totalExtendedMinutes / 60 * 10) / 10}h · {fmt(overtime.extendedPay)}원</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">야간근로</span><span className="text-[#2e9e6e]">{Math.round(overtime.totalNightMinutes / 60 * 10) / 10}h · {fmt(overtime.nightPay)}원</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">휴일근로</span><span className="text-[#2e9e6e]">{Math.round(overtime.totalHolidayMinutes / 60 * 10) / 10}h · {fmt(overtime.holidayPay)}원</span></div>
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 font-semibold">
                  <span className="text-gray-600">합계</span>
                  <span className="text-gray-800">{fmt(overtime.totalAmount)} 원</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1">
            <p className="font-semibold">ℹ️ 참고사항</p>
            <p>• 지급항목 변경 후 "공제 자동계산"을 누르면 4대보험·세금이 재계산됩니다.</p>
            <p>• 승인된 연장/야간/휴일근로는 "전체 적용" 클릭 시 지급항목에 반영됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
