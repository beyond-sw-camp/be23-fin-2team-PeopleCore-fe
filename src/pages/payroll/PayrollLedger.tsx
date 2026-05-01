import { useState, useEffect, useCallback, useRef } from 'react'
import { payrollApi, approvalDraftApi } from '../../api/payAdmin'
import type { PayrollRunRes, PayrollEmpRes, PayrollEmpDetailRes, WageInfoRes, ApprovedOvertimeRes } from '../../api/payAdmin'
import { openApprovalWindow } from '../../utils/approvalWindow'
import { usePayItemMeta, taxExemptHintText, taxablePart } from '../../utils/usePayItemLimits'

const STATUS_LABEL: Record<string, string> = {
  // 급여대장 워크플로우 상태
  CALCULATING: '산정중',
  CONFIRMED: '확정',
  PENDING_APPROVAL: '전자결재승인전',
  APPROVED: '승인완료',
  PAID: '지급완료',
  // 재직 상태
  ACTIVE: '재직', ON_LEAVE: '휴직', RESIGNED: '퇴직',
  // 직원 구분
  FULL: '정규', CONTRACT: '계약', DISPATCHED: '파견',
}
const STATUS_BADGE: Record<string, string> = {
  CALCULATING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-orange-100 text-orange-700',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-purple-100 text-purple-700',
  PAID: 'bg-green-100 text-green-700',
}

// 사원 행 상태 표시 — 사원별 상태(empStatus) 우선
//   - 부분 결재 시나리오: A 승인+B 반려 처럼 사원마다 결재 결과가 다를 수 있어
//     run 전체 상태(runStatus)보다 사원별 empStatus 가 진실에 더 가까움.
//   - empStatus = APPROVED 면 결재 승인됨 (approvalDocId 가 추적용으로 남아있어도 무시)
//   - empStatus = CONFIRMED + approvalDocId 있음 → 결재 진행 중
//   - empStatus = CONFIRMED + approvalDocId 없음 → 확정만 (반려/회수돼서 풀린 경우 포함)
function rowStatus(
  runStatus: string | undefined,
  empStatus: string | undefined,
  approvalDocId: number | null | undefined,
): string {
  // 사원별 종료 상태가 우선
  if (empStatus === 'PAID') return 'PAID'
  if (empStatus === 'APPROVED') return 'APPROVED'

  // run 이 PAID 면 모든 사원 PAID 처리 (legacy 일괄 지급 케이스 호환)
  if (runStatus === 'PAID') return 'PAID'
  if (runStatus === 'APPROVED') return 'APPROVED'

  // 진행 중 분기
  if (empStatus === 'CONFIRMED' && approvalDocId != null) return 'PENDING_APPROVAL'
  if (empStatus === 'CONFIRMED') return 'CONFIRMED'
  return 'CALCULATING'
}
function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }
function parseNum(s: string) { return Number(s.replace(/,/g, '').replace(/[^0-9]/g, '')) || 0 }
function label(v: string) { return STATUS_LABEL[v] || v }

export default function PayrollLedger() {
  const [yearMonth, setYearMonth] = useState('2026-04')
  const [run, setRun] = useState<PayrollRunRes | null>(null)
  // 초기 마운트 시 fetchRun()이 끝나기 전 "새로 생성" 버튼이 깜빡이지 않도록 loading=true 로 시작
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PayrollEmpRes | null>(null)
  const [checkedIds, setCheckedIds] = useState<number[]>([])

  const fetchRun = useCallback(() => {
    setLoading(true)
    setRun(null)   // yearMonth 변경 시 이전 월 데이터 즉시 비움 (응답 종류 무관 안전)
    payrollApi.getPayroll(yearMonth)
      .then(data => setRun(data ?? null))   // 200 + null/빈 객체도 안전 처리
      .catch(err => {
        if (err?.response?.status !== 404) {
          // 404는 정상(해당월 미생성). 그 외 에러만 로그
          console.error('급여대장 조회 실패:', err?.response?.status, err)
        }
        // setRun(null) 은 위에서 이미 했으므로 catch에서 추가 처리 불필요
      })
      .finally(() => setLoading(false))
  }, [yearMonth])

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleSyncEmployees = () => {
    if (!run) return
    if (!confirm('현재 시점의 재직 사원 목록과 비교해 누락된 신규 입사자를 추가합니다.\n\n기존 사원의 수정 금액·확정 상태는 그대로 유지됩니다. 계속하시겠습니까?')) return
    setLoading(true)
    payrollApi.syncEmployees(run.payrollRunId)
      .then(async res => {
        if (res.addedCount === 0) {
          alert(`추가할 신규 사원이 없습니다.\n현재 ${res.totalEmployeesAfter}명.`)
        } else {
          alert(`사원 ${res.addedCount}명이 추가되었습니다.\n총 ${res.totalEmployeesAfter}명.`)
        }
        const fetched = await payrollApi.getPayroll(yearMonth).catch(() => null)
        if (fetched) setRun(fetched)
      })
      .catch(err => { console.error('사원 동기화 실패:', err); alert('동기화 실패: ' + (err?.response?.data?.message || '오류')) })
      .finally(() => setLoading(false))
  }

  const handleApproval = async () => {
    if (!run) return
    try {
      const draft = await approvalDraftApi.getDraft('SALARY', run.payrollRunId)
      openApprovalWindow({
        openForm: {
          formCode: 'PAYROLL_PAYMENT',
          name: '급여지급결의서',
          folder: '인사',
          retention: '5',
        },
        // 백엔드(hr-service)가 활성 PayItem 기반으로 동적 빌드한 결의서 HTML을 그대로 사용
        customHtmlTemplate: draft.htmlTemplate,
        docDataOverride: {
          payrollRunId: run.payrollRunId,
          hrRefType: 'PAYROLL',
          hrRefId: run.payrollRunId,
        },
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert('결재 양식을 불러오지 못했습니다: ' + (msg || '오류'))
    }
  }

  // 지급 가능 사원 후보 — 결재 승인된(APPROVED) 사원만
  // 체크된 사원 중 APPROVED 만 추리고, 체크가 없으면 APPROVED 전체
  const resolvePayableTargets = (): { ids: number[]; skipped: number } => {
    const approvedAll = employees.filter(e => e.payrollEmpStatus === 'APPROVED').map(e => e.empId)
    if (checkedIds.length === 0) return { ids: approvedAll, skipped: 0 }
    const approvedSet = new Set(approvedAll)
    const ids = checkedIds.filter(id => approvedSet.has(id))
    return { ids, skipped: checkedIds.length - ids.length }
  }

  const handlePay = () => {
    if (!run) return
    const { ids, skipped } = resolvePayableTargets()
    if (ids.length === 0) {
      alert('지급 대상이 없습니다. 결재 승인된 사원만 지급처리 가능합니다.')
      return
    }
    const msg = skipped > 0
      ? `선택된 ${checkedIds.length}명 중 결재 승인된 ${ids.length}명만 지급처리됩니다. 진행하시겠습니까?`
      : `${ids.length}명을 지급처리하시겠습니까?`
    if (!confirm(msg)) return
    payrollApi.processPayment(run.payrollRunId, ids)
      .then(() => { alert(`${ids.length}명 지급처리 완료`); setCheckedIds([]); fetchRun() })
      .catch(err => alert('지급처리 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const handleDownloadTransfer = () => {
    if (!run) return
    // 사원별 상태 기반 — APPROVED 또는 PAID 사원만 이체파일 대상
    const downloadable = employees.filter(e =>
      e.payrollEmpStatus === 'APPROVED' || e.payrollEmpStatus === 'PAID'
    ).map(e => e.empId)
    if (downloadable.length === 0) {
      alert('전자결재가 승인된 사원이 없습니다.')
      return
    }
    // 체크된 사원만 (없으면 다운로드 가능 사원 전체)
    let targetIds: number[]
    let skipped = 0
    if (checkedIds.length > 0) {
      const set = new Set(downloadable)
      targetIds = checkedIds.filter(id => set.has(id))
      skipped = checkedIds.length - targetIds.length
    } else {
      targetIds = downloadable
    }
    if (targetIds.length === 0) {
      alert('대상 사원이 없습니다. 결재 승인된 사원만 이체파일을 받을 수 있습니다.')
      return
    }
    if (skipped > 0 && !confirm(`선택된 ${checkedIds.length}명 중 결재 승인된 ${targetIds.length}명만 이체파일에 포함됩니다. 진행하시겠습니까?`)) {
      return
    }
    payrollApi.downloadTransferFile(run.payrollRunId, targetIds)
      .then(res => {
        // Content-Disposition 헤더에서 파일명 추출 (백엔드가 은행별 파일명 보내줌)
        const cd = res.headers?.['content-disposition'] as string | undefined
        let fileName = `급여대량이체_${yearMonth}.csv`
        if (cd) {
          const match = cd.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
          if (match) fileName = decodeURIComponent(match[1].replace(/"/g, '').trim())
        }
        const url = URL.createObjectURL(res.data as Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(err => alert('파일 다운로드 실패: ' + (err?.response?.data?.message || '오류')))
  }

  // 사원별 확정/되돌리기
  const handleConfirmEmp = (empId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!run) return
    payrollApi.confirmEmployee(run.payrollRunId, empId)
      .then(() => fetchRun())
      .catch(err => alert('확정 실패: ' + (err?.response?.data?.message || '오류')))
  }
  const handleRevertEmp = (empId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!run) return
    payrollApi.revertEmployee(run.payrollRunId, empId)
      .then(() => fetchRun())
      .catch(err => alert('되돌리기 실패: ' + (err?.response?.data?.message || '오류')))
  }
  // 선택된 사원 일괄 확정
  const handleBulkConfirm = () => {
    if (!run || checkedIds.length === 0) return
    if (!confirm(`선택된 ${checkedIds.length}명을 확정 처리하시겠습니까?`)) return
    Promise.all(checkedIds.map(id => payrollApi.confirmEmployee(run.payrollRunId, id).catch(() => null)))
      .then(() => { fetchRun(); setCheckedIds([]) })
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
            <button onClick={handleCreatePayroll} className="px-3 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]">
              <i className="fas fa-plus text-[10px] mr-1" />새로 생성
            </button>
          )}
          {run && (
            <>
              {run.payrollStatus === 'CALCULATING' && (
                <button onClick={handleSyncEmployees} className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  <i className="fas fa-user-plus text-[10px] mr-1" />사원 동기화
                </button>
              )}
              <button onClick={handleBulkConfirm} disabled={checkedIds.length === 0} className="px-3 py-1.5 text-xs text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed">
                <i className="fas fa-check-double text-[10px] mr-1" />선택 {checkedIds.length}명 확정
              </button>
              <button onClick={handleApproval} className="px-3 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]"><i className="fas fa-file-signature text-[10px] mr-1" />확정사원 전자결재</button>
              <button onClick={handlePay} className="px-3 py-1.5 text-xs text-white bg-[#3b82f6] rounded hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed" disabled={employees.every(e => e.payrollEmpStatus !== 'APPROVED')}>
                <i className="fas fa-coins text-[10px] mr-1" />
                {checkedIds.length > 0 ? `선택 ${checkedIds.length}명 지급` : '승인사원 지급'}
              </button>
              <button onClick={handleDownloadTransfer} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" disabled={employees.every(e => e.payrollEmpStatus !== 'APPROVED' && e.payrollEmpStatus !== 'PAID')}>
                <i className="fas fa-file-excel text-[10px] mr-1" />이체파일
              </button>
            </>
          )}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-6 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">급여대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{run?.totalEmployees ?? 0} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">세전총 지급합계</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(run?.totalPay)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">공제합계 <span className="text-[10px] text-gray-400">(사원 부담)</span></div>
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
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">산재보험 <span className="text-[10px] text-gray-400">(회사 부담)</span></div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(run?.totalIndustrialAccident)} <span className="text-sm font-normal">원</span></div>
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
                    <th className="py-2 px-2 text-left font-medium text-gray-500">부서</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">사원명</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">직급</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">직원구분</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">재직</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">지급합계</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">공제합계</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">공제 후 지급액</th>
                    <th className="py-2 px-2 text-right font-medium text-gray-500">미지급</th>
                    <th className="py-2 px-2 text-left font-medium text-gray-500">상태</th>
                    <th className="py-2 px-2 text-center font-medium text-gray-500 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={12} className="py-8 text-center text-gray-400">로딩 중...</td></tr>
                  ) : !run ? (
                    <tr><td colSpan={12} className="py-12 text-center text-gray-400">{yearMonth} 급여대장이 아직 생성되지 않았습니다. 상단의 "급여대장 생성" 버튼을 클릭하세요.</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan={12} className="py-8 text-center text-gray-400">대상 사원이 없습니다.</td></tr>
                  ) : employees.map(emp => {
                    const empConfirmed = emp.payrollEmpStatus === 'CONFIRMED'
                    const empSt = emp.empStatus || 'ACTIVE'
                    const rowSt = rowStatus(run?.payrollStatus, emp.payrollEmpStatus, emp.approvalDocId)
                    // run 이 결재 단계 진입한 후엔 사원별 확정/취소 잠금
                    const lockEmpAction = run?.payrollStatus === 'PENDING_APPROVAL'
                      || run?.payrollStatus === 'APPROVED'
                      || run?.payrollStatus === 'PAID'
                    return (
                    <tr key={emp.empId} onClick={() => setSelected(emp)} className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${empSt === 'ON_LEAVE' ? 'bg-yellow-50/40' : ''}`}>
                      <td className="py-2 px-2" onClick={e => e.stopPropagation()}><input type="checkbox" className="w-3 h-3" checked={checkedIds.includes(emp.empId)} onChange={() => toggleCheck(emp.empId)} /></td>
                      <td className="py-2 px-2 text-gray-600">{emp.deptName}</td>
                      <td className="py-2 px-2 text-blue-600 hover:underline">{emp.empName}</td>
                      <td className="py-2 px-2 text-gray-600">{emp.gradeName || '-'}</td>
                      <td className="py-2 px-2 text-gray-600">{label(emp.empType)}</td>
                      <td className="py-2 px-2 text-gray-600">{label(empSt)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.totalPay)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.totalDeduction)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.netPay)}</td>
                      <td className="py-2 px-2 text-right">{fmt(emp.unpaid)}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_BADGE[rowSt] || 'bg-gray-100 text-gray-600'}`}>
                          {label(rowSt)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center" onClick={e => e.stopPropagation()}>
                        {lockEmpAction ? (
                          <span className="text-[10px] text-gray-300">-</span>
                        ) : empConfirmed ? (
                          <button onClick={(e) => handleRevertEmp(emp.empId, e)} className="text-[10px] text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">확정취소</button>
                        ) : (
                          <button onClick={(e) => handleConfirmEmp(emp.empId, e)} className="text-[10px] text-white bg-[#2e9e6e] rounded px-2 py-0.5 hover:bg-[#26865d]">확정</button>
                        )}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : run && (
          <EmpDetailEditor
            payrollRunId={run.payrollRunId}
            empSummary={selected}
            runStatus={run.payrollStatus}
            onClose={() => { setSelected(null); fetchRun() }}
          />
        )}
      </div>

    </div>
  )
}

// ── 사원별 급여 상세 편집 ──
function EmpDetailEditor({ payrollRunId, empSummary, runStatus, onClose }: { payrollRunId: number; empSummary: PayrollEmpRes; runStatus: string | undefined; onClose: () => void }) {
  const [detail, setDetail] = useState<PayrollEmpDetailRes | null>(null)
  const [wageInfo, setWageInfo] = useState<WageInfoRes | null>(null)
  const [overtime, setOvertime] = useState<ApprovedOvertimeRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentEdits, setPaymentEdits] = useState<Record<number, number>>({})
  const payItemMeta = usePayItemMeta()

  // 편집 잠금: 사원 CONFIRMED 또는 run 결재단계 이상
  const locked = empSummary.payrollEmpStatus === 'CONFIRMED'
    || runStatus === 'PENDING_APPROVAL' || runStatus === 'APPROVED' || runStatus === 'PAID'

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

  const handleRefreshEmployee = () => {
    if (!confirm(
      '이 사원의 항목 금액을 최신 연봉계약 / 부양가족수 / 비과세 정책 기준으로 다시 계산합니다.\n\n' +
      '⚠ 다음 내용은 사라집니다:\n' +
      '  • 수동으로 수정한 항목 금액\n' +
      '  • 적용해둔 초과근무수당\n' +
      '  • 적용해둔 연차수당\n\n' +
      '필요하면 새로고침 후 다시 적용해주세요. 계속하시겠습니까?'
    )) return
    payrollApi.refreshEmployee(payrollRunId, empSummary.empId)
      .then(() => { alert('사원 새로고침이 완료되었습니다.'); fetchAll() })
      .catch(err => alert('새로고침 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const totalPay = Object.values(paymentEdits).reduce((a, b) => a + b, 0)
  // 비과세 한도 차감 후 과세대상 base — 백엔드 TaxableCalc.taxablePart 와 동일 정책
  const taxablePay = Object.entries(paymentEdits).reduce(
    (sum, [id, amt]) => sum + taxablePart(amt, payItemMeta[Number(id)]),
    0,
  )

  // [DEBUG] paymentEdits 변경 추적
  useEffect(() => {
    console.log('[paymentEdits 변경]', paymentEdits, '→ totalPay:', totalPay, ', taxablePay:', taxablePay)
  }, [paymentEdits, totalPay, taxablePay])
  const totalDeduct = detail?.deductionItems.reduce((a, b) => a + b.amount, 0) || 0
  const netPay = totalPay - totalDeduct

  // 지급항목 변경 시 공제 자동계산 (디바운스 250ms)
  const skipFirstAutoCalc = useRef(true)
  useEffect(() => {
    if (skipFirstAutoCalc.current) { skipFirstAutoCalc.current = false; return }
    if (locked || !detail) return
    const t = setTimeout(() => {
      console.log('[자동계산] 호출', { totalPay, taxablePay, empId: empSummary.empId })
      payrollApi.calcDeductions({ totalPay, taxablePay, empId: empSummary.empId })
        .then(res => {
          console.log('[자동계산] 응답', res)
          setDetail(prev => {
            if (!prev) return prev
            const updated = prev.deductionItems.map(item => {
              const name = item.payItemName
              if (name.includes('국민연금')) return { ...item, amount: res.nationalPension }
              if (name.includes('건강')) return { ...item, amount: res.healthInsurance }
              if (name.includes('장기요양')) return { ...item, amount: res.longTermCare }
              if (name.includes('고용')) return { ...item, amount: res.employmentInsurance }
              if (name.includes('소득세') && !name.includes('지방')) return { ...item, amount: res.incomeTax }
              if (name.includes('지방소득세')) return { ...item, amount: res.localIncomeTax }
              return item
            })
            return { ...prev, deductionItems: updated }
          })
        })
        .catch(err => {
          console.error('[자동계산] 실패', err?.response?.status, err?.response?.data, err)
        })
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPay, taxablePay, locked])

  const handleSave = () => {
    if (!detail || saving) return
    const items = [
      ...detail.paymentItems.map(p => ({ payItemId: p.payItemId, amount: paymentEdits[p.payItemId] ?? p.amount })),
      ...detail.deductionItems.map(d => ({ payItemId: d.payItemId, amount: d.amount })),
    ]
    setSaving(true)
    payrollApi.updateEmpDetails(payrollRunId, empSummary.empId, items)
      .then(() => { alert('저장되었습니다.'); fetchAll() })
      .catch(err => alert('저장 실패: ' + (err?.response?.data?.message || '오류')))
      .finally(() => setSaving(false))
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
        {!locked && (
          <div className="flex items-center gap-2">
            <button onClick={handleRefreshEmployee} disabled={saving} className="text-xs text-gray-700 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <i className="fas fa-rotate text-[10px] mr-1" />사원 새로고침
            </button>
            <button onClick={handleSave} disabled={saving} className="text-xs text-white bg-[#2e9e6e] rounded px-3 py-1.5 hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed">
              <i className="fas fa-save text-[10px] mr-1" />{saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
        {locked && (
          <span className="text-xs text-gray-500 font-medium">
            <i className="fas fa-lock text-[11px] mr-1.5" />
            {empSummary.payrollEmpStatus === 'CONFIRMED' ? '확정된 사원입니다 (확정취소 후 수정 가능)' : '결재 단계로 진입하여 수정 불가'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 px-6 py-5">
        {/* 좌측: 지급/공제 입력 */}
        <div className="col-span-2 space-y-5">
          {/* 지급항목 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200">
              <span><i className="fas fa-arrow-up text-[10px] text-blue-500 mr-1.5" />지급항목</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 p-4 text-xs">
              {detail.paymentItems.map(item => {
                const meta = payItemMeta[item.payItemId]
                const hint = meta ? taxExemptHintText(meta.taxExemptLimit, meta.isTaxable) : null
                return (
                  <div key={item.payItemId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">{item.payItemName}</span>
                    <div className="flex flex-col items-end gap-0.5">
                      <input
                        type="text"
                        value={fmt(paymentEdits[item.payItemId] ?? item.amount)}
                        onChange={e => setPaymentEdits(prev => ({ ...prev, [item.payItemId]: parseNum(e.target.value) }))}
                        disabled={locked}
                        className="w-32 text-right text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#2e9e6e] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      />
                      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
                    </div>
                  </div>
                )
              })}
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
