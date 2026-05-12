import { useState, useEffect, useCallback } from 'react'
import { severanceApi, approvalDraftApi } from '../../api/payAdmin'
import type { SeveranceRes, SeveranceDetailRes, SeveranceListRes, SevStatus } from '../../api/payAdmin'
import { fetchEmployeeList } from '../../api/employee/employeeApi'
import { resignApi } from '../../api/resign'
import { openApprovalWindow, subscribeApprovalCompleted } from '../../utils/approvalWindow'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 15

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }
function calcAverageDailyWage(detail: SeveranceDetailRes) {
  const days = Number(detail.last3MonthDays || 0)
  if (days <= 0) return 0
  const bonusAdded = Math.floor(Number(detail.lastYearBonus || 0) * 3 / 12)
  const annualLeaveAdded = Math.floor(Number(detail.annualLeaveForAvgWage || 0) * 3 / 12)
  return Math.round((Number(detail.last3MonthPay || 0) + bonusAdded + annualLeaveAdded) / days)
}
type SeveranceAmountRow = Pick<SeveranceRes, 'retirementType' | 'severanceAmount' | 'taxAmount' | 'netAmount' | 'dcDiffAmount'> & {
  annualLeaveOnRetirement?: number | null
}
function calcPayableSeverance(row: SeveranceAmountRow) {
  return row.retirementType === 'DC'
    ? Number(row.dcDiffAmount || 0)
    : Number(row.severanceAmount || 0)
}
function calcDisplayNetAmount(row: SeveranceAmountRow) {
  if (row.retirementType === 'DC') {
    return calcPayableSeverance(row) - Number(row.taxAmount || 0) + Number(row.annualLeaveOnRetirement || 0)
  }
  if (row.annualLeaveOnRetirement != null) {
    return Number(row.severanceAmount || 0) - Number(row.taxAmount || 0) + Number(row.annualLeaveOnRetirement || 0)
  }
  return Number(row.netAmount || 0)
}

const SEV_STATUS_LABEL: Record<string, string> = {
  CALCULATING: '산정중',
  CONFIRMED: '확정',
  PENDING_APPROVAL: '승인요청',
  APPROVED: '승인완료',
  PAID: '지급완료',
}
const SEV_STATUS_BADGE: Record<string, string> = {
  CALCULATING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-orange-100 text-orange-700',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  PAID: 'bg-green-100 text-green-700',
}
const PENSION_LABEL: Record<string, string> = { severance: '퇴직금', DB: 'DB형', DC: 'DC형' }
const PENSION_BADGE: Record<string, string> = {
  severance: 'bg-orange-100 text-orange-700',
  DB: 'bg-purple-100 text-purple-700',
  DC: 'bg-gray-100 text-gray-500',
}

export default function SeveranceLedger() {
  const [statusFilter, setStatusFilter] = useState<SevStatus | ''>('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [summary, setSummary] = useState<SeveranceListRes | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailSevId, setDetailSevId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [calcModalOpen, setCalcModalOpen] = useState(false)
  const [selectedSevIds, setSelectedSevIds] = useState<Set<number>>(new Set())
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const fetchList = useCallback(() => {
    setLoading(true)
    severanceApi.list({ size: 100 })
      .then(setSummary)
      .catch(err => { console.error('퇴직금 목록 조회 실패:', err); setSummary(null) })
      .finally(() => setLoading(false))
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchList() }, [fetchList])

  // 다중선택 일괄 확정 (CALCULATING → CONFIRMED)
  const handleBulkConfirm = async () => {
    const sevIds = Array.from(selectedSevIds)
    if (sevIds.length === 0) return
    if (!confirm(`${sevIds.length}건의 퇴직금을 확정하시겠습니까?`)) return

    const results = await Promise.allSettled(sevIds.map(id => severanceApi.confirm(id)))
    const ok = results.filter(r => r.status === 'fulfilled').length
    const fail = results.length - ok

    if (fail === 0) {
      alert(`${ok}건 모두 확정되었습니다.`)
    } else {
      alert(`확정 ${ok}건 / 실패 ${fail}건`)
    }
    setSelectedSevIds(new Set())
    fetchList()
  }

  // 다중선택 일괄 결재상신
  const handleSubmitApproval = async () => {
    const sevIds = Array.from(selectedSevIds)
    if (sevIds.length === 0) return
    try {
      const draft = await approvalDraftApi.getDraft({ type: 'RETIREMENT', sevIds })
      openApprovalWindow({
        openForm: {
          formCode: 'RETIREMENT_SEVERANCE',
          name: '퇴직급여지급결의서',
          folder: '인사',
          retention: '5',
        },
        customHtmlTemplate: draft.htmlTemplate,
        docDataOverride: {
          sevIds,                        // 백엔드 SeveranceFormHandler.extractSevIds 가 읽음
          hrRefType: 'SEVERANCE',
          hrRefId: sevIds[0],            // hrRefId는 단일이므로 첫 번째 sevId
        },
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert('결재 양식을 불러오지 못했습니다: ' + (msg || '오류'))
    }
  }

  // 체크박스 활성 조건 — 산정중(확정 가능) / 확정+미바인딩(결재상신 가능) / 승인완료(지급처리 가능)
  const isCheckable = (s: SeveranceRes) =>
    s.sevStatus === 'CALCULATING'
    || (s.sevStatus === 'CONFIRMED' && s.approvalDocId == null)
    || s.sevStatus === 'APPROVED'

  const toggleSelect = (sevId: number) => {
    setSelectedSevIds(prev => {
      const next = new Set(prev)
      if (next.has(sevId)) next.delete(sevId)
      else next.add(sevId)
      return next
    })
  }

  // 선택된 sev들의 상태 분포
  const items = summary?.severances?.content || []
  const selectedItems = items.filter(s => selectedSevIds.has(s.sevId))
  const allSelectedCalculating = selectedItems.length > 0
    && selectedItems.every(s => s.sevStatus === 'CALCULATING')
  const allSelectedConfirmed = selectedItems.length > 0
    && selectedItems.every(s => s.sevStatus === 'CONFIRMED' && s.approvalDocId == null)
  const allSelectedApproved = selectedItems.length > 0
    && selectedItems.every(s => s.sevStatus === 'APPROVED')

  const readErrorMessage = async (err: unknown) => {
    const e = err as { response?: { data?: unknown; status?: number } }
    const data = e?.response?.data
    if (data instanceof Blob) {
      const text = await data.text()
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string }
        return parsed.message || parsed.error || text
      } catch {
        return text
      }
    }
    if (data && typeof data === 'object' && 'message' in data) {
      return String((data as { message?: unknown }).message || '')
    }
    return ''
  }

  const handleDownloadTransferFile = async () => {
    const sevIds = selectedItems.filter(s => s.sevStatus === 'APPROVED').map(s => s.sevId)
    if (sevIds.length === 0) return
    try {
      const res = await severanceApi.downloadTransferFile(sevIds)
      const cd = res.headers?.['content-disposition'] as string | undefined
      let fileName = '퇴직금이체파일.xlsx'
      if (cd) {
        const m = cd.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
        if (m) fileName = decodeURIComponent(m[1].replace(/"/g, '').trim())
      }
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } }
      const msg = await readErrorMessage(err)
      alert(`이체파일 다운로드 실패 (${e?.response?.status ?? '오류'}): ${msg || '다운로드할 수 있는 대상이 없습니다.'}`)
      console.error('퇴직금 이체파일 다운로드 실패:', err)
    }
  }

  // 결재 상신 완료 시 목록 자동 갱신 + 선택 초기화
  useEffect(() => {
    return subscribeApprovalCompleted(event => {
      if (event.formCode === 'RETIREMENT_SEVERANCE' && event.type !== 'tempsaved') {
        setSelectedSevIds(new Set())
        fetchList()
        window.setTimeout(fetchList, 800)
      }
    })
  }, [fetchList])

  const filteredItems = (() => {
    const kw = searchKeyword.trim().toLowerCase()
    return items
      .filter(s => {
        if (statusFilter && s.sevStatus !== statusFilter) return false
        if (!kw) return true
        return s.empName.toLowerCase().includes(kw)
          || (s.empNum?.toLowerCase().includes(kw) ?? false)
      })
      .slice()
      .sort((a, b) => (b.resignDate ?? '').localeCompare(a.resignDate ?? ''))
  })()
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); setSelectedSevIds(new Set()) }, [summary, searchKeyword, statusFilter])

  // 현재 페이지의 체크 가능한 sev들
  const pageCheckableIds = pagedItems.filter(isCheckable).map(s => s.sevId)
  const allPageChecked = pageCheckableIds.length > 0 && pageCheckableIds.every(id => selectedSevIds.has(id))
  const somePageChecked = pageCheckableIds.some(id => selectedSevIds.has(id))

  const togglePageSelectAll = () => {
    setSelectedSevIds(prev => {
      const next = new Set(prev)
      if (allPageChecked) {
        // 모두 선택된 상태 → 현재 페이지 ID 모두 해제
        pageCheckableIds.forEach(id => next.delete(id))
      } else {
        // 일부 또는 미선택 → 현재 페이지 ID 모두 선택
        pageCheckableIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-white">
      <div className="max-w-[1300px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직금대장(작성)</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직금대장(작성)</h1>
        <p className="text-xs text-gray-500 mb-5">퇴직자의 퇴직금을 산정하고 관리합니다.</p>

        {/* 요약 카드 */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">전체</div>
              <div className="text-xl font-bold text-gray-800 mt-1">{summary.totalCount} <span className="text-sm font-normal">건</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">산정중</div>
              <div className="text-xl font-bold text-yellow-600 mt-1">{summary.calculatingCount} <span className="text-sm font-normal">건</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">확정</div>
              <div className="text-xl font-bold text-orange-600 mt-1">{summary.confirmedCount} <span className="text-sm font-normal">건</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">승인완료</div>
              <div className="text-xl font-bold text-indigo-600 mt-1">{summary.approvedCount} <span className="text-sm font-normal">건</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">지급완료</div>
              <div className="text-xl font-bold text-[#2e9e6e] mt-1">{summary.paidCount} <span className="text-sm font-normal">건</span></div>
            </div>
          </div>
        )}

        {/* 1행: 검색/상태 필터 + 수동산정 + 처리 버튼 */}
        <div className="flex items-center gap-3 mb-2 text-xs flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <i className="fas fa-search text-gray-400 text-[10px]" />
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="이름 또는 사번 검색"
              className="bg-transparent border-none outline-none text-xs w-44"
            />
          </div>
          <span className="text-gray-500">상태</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as SevStatus | '')} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="">전체</option>
            <option value="CALCULATING">산정중</option>
            <option value="CONFIRMED">확정</option>
            <option value="PENDING_APPROVAL">승인요청</option>
            <option value="APPROVED">승인완료</option>
            <option value="PAID">지급완료</option>
          </select>
          <button
            onClick={() => setCalcModalOpen(true)}
            className="px-3 py-1.5 border border-[#2e9e6e] text-[#2e9e6e] rounded hover:bg-[#f0f9f6] whitespace-nowrap"
            title="자동 산정에서 누락된 퇴직자의 퇴직금을 직접 산정합니다"
          >
            <i className="fas fa-calculator text-[10px] mr-1" />수동 산정
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { setSelectedSevIds(new Set()); fetchList() }}
              disabled={loading}
              title="퇴직금대장 데이터 새로고침"
              className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              <i className={`fas fa-rotate-right text-[11px] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleBulkConfirm}
              disabled={!allSelectedCalculating}
              className="px-3 py-1.5 text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              title="산정중 상태의 퇴직금을 다중 선택하여 일괄 확정합니다"
            >
              <i className="fas fa-check text-[10px] mr-1" />
              선택 확정{allSelectedCalculating ? ` (${selectedSevIds.size})` : ''}
            </button>
            <button
              onClick={handleSubmitApproval}
              disabled={!allSelectedConfirmed}
              className="px-3 py-1.5 text-white bg-[#2e9e6e] rounded hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              title="확정 상태의 퇴직금을 다중 선택하여 한 결재로 일괄 상신합니다"
            >
              <i className="fas fa-file-signature text-[10px] mr-1" />
              선택 결재상신{allSelectedConfirmed ? ` (${selectedSevIds.size})` : ''}
            </button>
            <button
              onClick={() => setPaymentModalOpen(true)}
              disabled={!allSelectedApproved}
              className="px-3 py-1.5 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              title="승인완료 상태의 퇴직금을 다중 선택하여 일괄 지급처리합니다"
            >
              <i className="fas fa-money-bill-wave text-[10px] mr-1" />
              선택 지급처리{allSelectedApproved ? ` (${selectedSevIds.size})` : ''}
            </button>
            <button
              onClick={handleDownloadTransferFile}
              disabled={!allSelectedApproved}
              className="px-3 py-1.5 text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              title="승인완료 상태의 퇴직금을 은행 이체 엑셀 파일로 다운로드합니다"
            >
              <i className="fas fa-file-excel text-[10px] mr-1" />
              이체파일{allSelectedApproved ? ` (${selectedSevIds.size})` : ''}
            </button>
          </div>
        </div>

        {/* 2행: 합계 요약 (오른쪽 정렬) */}
        {summary && (
          <div className="flex items-center mb-4 text-xs">
            <div className="ml-auto text-gray-500">
              총 퇴직금 <span className="font-bold text-gray-800">{fmt(summary.totalSeveranceAmount)}</span> 원 · 실지급 <span className="font-bold text-[#2e9e6e]">{fmt(summary.totalNetAmount)}</span> 원
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1050px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-2 text-center font-medium text-gray-500">
                  <input
                    type="checkbox"
                    checked={allPageChecked}
                    ref={el => { if (el) el.indeterminate = !allPageChecked && somePageChecked }}
                    onChange={togglePageSelectAll}
                    disabled={pageCheckableIds.length === 0}
                    className="cursor-pointer disabled:cursor-not-allowed"
                    title="현재 페이지의 결재상신 가능(확정+미바인딩) 또는 지급처리 가능(승인완료) 항목 전체 선택/해제"
                  />
                </th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">직급</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">입사일</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">퇴사일</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">유형</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">근속연수</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">퇴직금액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">세액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">실지급액</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="py-12 text-center text-gray-400">로딩 중...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={12} className="py-12 text-center text-gray-400">{searchKeyword.trim() ? '검색된 결과가 없습니다.' : '퇴직금 산정 내역이 없습니다.'}</td></tr>
              ) : pagedItems.map((s: SeveranceRes) => {
                const checkable = isCheckable(s)
                const checked = selectedSevIds.has(s.sevId)
                return (
                <tr key={s.sevId} className={`border-b border-gray-50 hover:bg-gray-50 ${checked ? 'bg-[#f0f9f6]' : ''}`}>
                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checkable}
                      onChange={() => toggleSelect(s.sevId)}
                      className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                      title={checkable
                        ? (s.sevStatus === 'CALCULATING' ? '확정 묶음에 포함'
                            : s.sevStatus === 'CONFIRMED' ? '결재상신 묶음에 포함'
                            : '지급처리 묶음에 포함')
                        : (s.sevStatus === 'CONFIRMED' && s.approvalDocId != null ? '이미 결재 진행 중'
                            : s.sevStatus === 'PENDING_APPROVAL' ? '결재 진행 중'
                            : s.sevStatus === 'PAID' ? '이미 지급완료'
                            : '선택 가능한 상태가 아닙니다')}
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-600 cursor-pointer hover:underline" onClick={() => setDetailSevId(s.sevId)}>{s.empName}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{s.deptName}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{s.gradeName || '-'}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{s.hireDate}</td>
                  <td className="py-2.5 px-3 text-center text-red-500">{s.resignDate}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${PENSION_BADGE[s.retirementType] || 'bg-gray-100 text-gray-500'}`}>
                      {PENSION_LABEL[s.retirementType] || s.retirementType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{Number(s.serviceYears).toFixed(1)}년</td>
                  <td className="py-2.5 px-3 text-right text-gray-800 font-medium">{fmt(s.severanceAmount)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{fmt(s.taxAmount)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800 font-medium">{fmt(calcDisplayNetAmount(s))}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEV_STATUS_BADGE[s.sevStatus] || 'bg-gray-100 text-gray-500'}`}>
                      {SEV_STATUS_LABEL[s.sevStatus] || s.sevStatus}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={filteredItems.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {detailSevId && <DetailModal sevId={detailSevId} onClose={() => setDetailSevId(null)} />}
      {calcModalOpen && (
        <ManualCalcModal
          onClose={() => setCalcModalOpen(false)}
          onCalculated={() => { setCalcModalOpen(false); fetchList() }}
        />
      )}
      {paymentModalOpen && (
        <PaymentModal
          sevs={selectedItems}
          onClose={() => setPaymentModalOpen(false)}
          onProcessed={() => {
            setPaymentModalOpen(false)
            setSelectedSevIds(new Set())
            fetchList()
          }}
        />
      )}
    </div>
  )
}

// ── 다중선택 일괄 지급처리 모달 ──
function PaymentModal({
  sevs,
  onClose,
  onProcessed,
}: {
  sevs: SeveranceRes[]
  onClose: () => void
  onProcessed: () => void
}) {
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)

  const totalNet = sevs.reduce((sum, s) => sum + calcDisplayNetAmount(s), 0)

  const handleSubmit = async () => {
    if (!transferDate) {
      alert('이체일을 입력해주세요.')
      return
    }
    if (!confirm(`${sevs.length}명의 퇴직금을 ${transferDate} 자로 지급처리하시겠습니까?\n\n총 실지급액: ${totalNet.toLocaleString()}원\n\n* 지급처리 후에는 되돌릴 수 없습니다.`)) return

    setSubmitting(true)
    try {
      await severanceApi.processPayment({
        sevIds: sevs.map(s => s.sevId),
        transferDate,
      })
      alert('지급처리가 완료되었습니다.')
      onProcessed()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert('지급처리 실패: ' + (msg || '오류'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(560px,calc(100vw-24px))] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">퇴직금 일괄 지급처리</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">선택된 {sevs.length}명의 퇴직금을 일괄 지급 처리합니다.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-blue-50 text-[11px] text-blue-700 space-y-0.5">
          <p>ℹ️ 입력한 이체일자로 지급 완료 처리됩니다. 외부 송금은 별도 진행이 필요합니다.</p>
          <p>지급처리 후 상태는 <strong>지급완료(PAID)</strong>로 전환되며 되돌릴 수 없습니다.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">이체일 <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={transferDate}
              onChange={e => setTransferDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#2e9e6e]"
            />
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-[11px] font-medium text-gray-600 border-b border-gray-200 flex items-center justify-between">
              <span>대상 사원 ({sevs.length}명)</span>
              <span>합계 실지급액 <strong className="text-[#2e9e6e]">{totalNet.toLocaleString()}</strong> 원</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b border-gray-200">
                    <th className="py-1.5 px-3 text-center font-medium text-gray-500">사원명</th>
                    <th className="py-1.5 px-3 text-center font-medium text-gray-500">부서</th>
                    <th className="py-1.5 px-3 text-right font-medium text-gray-500">실지급액</th>
                  </tr>
                </thead>
                <tbody>
                  {sevs.map(s => (
                    <tr key={s.sevId} className="border-b border-gray-50">
                      <td className="py-1.5 px-3 text-center text-gray-800">{s.empName}</td>
                      <td className="py-1.5 px-3 text-center text-gray-600">{s.deptName}</td>
                      <td className="py-1.5 px-3 text-right text-gray-800 font-medium">{calcDisplayNetAmount(s).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">취소</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !transferDate}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fas fa-money-bill-wave text-[10px] mr-1.5" />
            {submitting ? '처리 중...' : '지급처리'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 수동 산정 모달: 퇴직 확정(CONFIRMED) + 퇴직 완료(RESIGNED) 사원 검색 → empId 선택 → severance/calculate 호출 ──
type CalcCandidate = {
  empId: number
  empNum: string
  empName: string
  deptName: string | null
  gradeName: string | null
  source: 'RESIGNED' | 'CONFIRMED'
  // RESIGNED → empHireDate, CONFIRMED → resignDate(퇴직예정일)
  primaryDate: string | null
}

function ManualCalcModal({ onClose, onCalculated }: { onClose: () => void; onCalculated: () => void }) {
  const [keyword, setKeyword] = useState('')
  const [candidates, setCandidates] = useState<CalcCandidate[]>([])
  const [existingSevByEmpId, setExistingSevByEmpId] = useState<Map<number, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [calcEmpId, setCalcEmpId] = useState<number | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const [resignedRes, confirmedRes, sevListRes] = await Promise.all([
        // 퇴직 완료 (Employee.empStatus = RESIGNED)
        fetchEmployeeList({ empStatus: 'RESIGNED', keyword: keyword || undefined, size: 50 })
          .catch(err => { console.error('퇴직자 목록 조회 실패:', err); return { content: [] } }),
        // 퇴직 확정(Resign.retireStatus = CONFIRMED, 퇴직예정일 대기) — 사전 산정 대상
        resignApi.getList({ empStatus: 'CONFIRMED', keyword: keyword || undefined, size: 50 })
          .then(r => r.data)
          .catch(err => { console.error('확정 퇴직자 목록 조회 실패:', err); return { content: [] } }),
        // 이미 산정된 퇴직금 (empId → sevStatus 매핑용)
        severanceApi.list({ size: 200 })
          .catch(err => { console.error('퇴직금 목록 조회 실패:', err); return null }),
      ])

      const resigned: CalcCandidate[] = resignedRes.content.map(e => ({
        empId: e.empId,
        empNum: e.empNum,
        empName: e.empName,
        deptName: e.deptName,
        gradeName: e.gradeName,
        source: 'RESIGNED' as const,
        primaryDate: e.empHireDate,
      }))

      const confirmed: CalcCandidate[] = confirmedRes.content.map(r => ({
        empId: r.empId,
        empNum: r.empNum,
        empName: r.empName,
        deptName: r.deptName,
        gradeName: r.gradeName,
        source: 'CONFIRMED' as const,
        primaryDate: r.resignDate,
      }))

      // CONFIRMED 우선, 같은 empId 중복 제거 (전이 케이스 안전망)
      const merged = [...confirmed, ...resigned]
      const uniqueAll = Array.from(new Map(merged.map(c => [c.empId, c])).values())

      // empId → sevStatus 매핑 (이미 산정된 사원 식별용)
      const sevMap = new Map<number, string>()
      if (sevListRes?.severances?.content) {
        for (const s of sevListRes.severances.content) {
          sevMap.set(s.empId, s.sevStatus)
        }
      }
      setExistingSevByEmpId(sevMap)

      // 잠금 상태(CONFIRMED 이상)는 후보에서 제외 — 어차피 재산정 불가
      // CALCULATING 또는 sev 없음만 노출
      const visible = uniqueAll.filter(c => {
        const status = sevMap.get(c.empId)
        return !status || status === 'CALCULATING'
      })
      setCandidates(visible)
    } finally {
      setLoading(false)
    }
  }, [keyword])

  // 모달 열릴 때 + keyword 변경 시 디바운스 fetch
  useEffect(() => {
    const t = setTimeout(fetchCandidates, 250)
    return () => clearTimeout(t)
  }, [fetchCandidates])

  const handleCalculate = async (empId: number, empName: string, source: CalcCandidate['source']) => {
    const existingStatus = existingSevByEmpId.get(empId)

    // CONFIRMED 이상 상태면 재산정 차단 (확정/결재중/승인완료/지급완료)
    if (existingStatus && existingStatus !== 'CALCULATING') {
      const statusLabel = SEV_STATUS_LABEL[existingStatus] || existingStatus
      alert(`${empName} 사원은 이미 확정/결재/지급 단계입니다 (현재 상태: ${statusLabel}).\n\n재산정 불가 — 진행 중인 결재나 지급 흐름에 영향을 줍니다.`)
      return
    }

    // CALCULATING 이면 덮어쓰기 안내
    let desc: string
    if (existingStatus === 'CALCULATING') {
      desc = '* 기존 산정중 상태의 결과를 새로 계산해 덮어씁니다.\n* 산정중이 아닌 단계로 진입한 경우엔 덮어쓰지 않고 차단됩니다.'
    } else if (source === 'CONFIRMED') {
      desc = '* 퇴직 확정(CONFIRMED) 상태의 사원을 사전 산정합니다.\n* 퇴직 완료 시 자동으로 재산정되어 갱신됩니다.'
    } else {
      desc = '* 자동 산정에서 누락된 퇴직자를 직접 산정합니다.'
    }
    if (!confirm(`${empName} 사원의 퇴직금을 ${existingStatus === 'CALCULATING' ? '재산정' : '산정'}하시겠습니까?\n\n${desc}`)) return
    setCalcEmpId(empId)
    try {
      await severanceApi.calculate({ empId })
      alert(`${empName} 사원의 퇴직금 ${existingStatus === 'CALCULATING' ? '재산정' : '산정'}이 완료되었습니다.`)
      onCalculated()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }, status?: number } }
      const msg = e?.response?.data?.message || ''
      const status = e?.response?.status
      if (msg.includes('SEVERANCE_LOCKED') || status === 409) {
        alert('산정 실패: 이미 확정/결재/지급 단계입니다. 재산정할 수 없습니다.')
      } else if (msg.includes('SERVICE_PERIOD') || msg.includes('1년')) {
        alert('산정 실패: 근속 1년 미만으로 법정 퇴직금 대상이 아닙니다.')
      } else if (msg.includes('RESIGN_DATE') || msg.includes('퇴직일')) {
        alert('산정 실패: 퇴직일이 설정되지 않았습니다. 퇴직 확정(CONFIRMED) 또는 퇴직예정일이 등록된 상태여야 합니다.')
      } else if (msg.includes('NO_PAYROLL_DATA') || msg.includes('급여 데이터') || msg.includes('급여대장')) {
        alert('산정 실패: 직전 3개월 급여 데이터가 없습니다.\n\n• 급여대장이 확정·지급된 상태인지 확인하세요.\n• 휴직 기간이라면 휴직 보정이 별도로 필요합니다 (현재 미지원).')
      } else {
        alert(`산정 실패 (${status ?? '오류'}): ${msg || '알 수 없는 오류'}`)
      }
      console.error('수동 산정 실패:', err)
    } finally {
      setCalcEmpId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(720px,calc(100vw-24px))] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">퇴직금 수동 산정</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">퇴직 확정 사원의 사전 산정 또는 자동 산정 누락 사원의 직접 산정.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-amber-50 text-[11px] text-amber-800 space-y-0.5">
          <p>ℹ️ 사원이 퇴직 처리되면 자동으로 산정됩니다. 본 기능은 다음 케이스에 사용하세요.</p>
          <p>① <strong>사전 산정</strong> — 퇴직 확정(CONFIRMED) 사원의 결재 사전 진행 / 직원 사전 통보</p>
          <p>② <strong>누락 산정</strong> — 자동 산정에서 누락된 퇴직(RESIGNED) 사원</p>
          <p>③ <strong>재산정</strong> — 근속 1년 충족 후 또는 데이터 보정 후 다시 산정</p>
        </div>

        <div className="px-6 py-3 border-b border-gray-100">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="사원명 또는 사번으로 검색"
            className="w-full text-xs border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#2e9e6e]"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-xs">로딩 중...</div>
          ) : candidates.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs">
              {keyword ? '검색된 사원이 없습니다.' : '퇴직 확정 또는 퇴직 완료 사원이 없습니다.'}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-4 text-center font-medium text-gray-500">사번</th>
                  <th className="py-2 px-4 text-center font-medium text-gray-500">사원명</th>
                  <th className="py-2 px-4 text-center font-medium text-gray-500">부서</th>
                  <th className="py-2 px-4 text-center font-medium text-gray-500">직급</th>
                  <th className="py-2 px-4 text-center font-medium text-gray-500">기준일</th>
                  <th className="py-2 px-4 text-center font-medium text-gray-500">상태</th>
                  <th className="py-2 px-4 text-center font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => {
                  const existingStatus = existingSevByEmpId.get(c.empId)
                  const isCalculating = existingStatus === 'CALCULATING'
                  return (
                  <tr key={c.empId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-center text-gray-600">{c.empNum}</td>
                    <td className="py-2.5 px-4 text-center font-medium text-gray-800">{c.empName}</td>
                    <td className="py-2.5 px-4 text-center text-gray-600">{c.deptName || '-'}</td>
                    <td className="py-2.5 px-4 text-center text-gray-600">{c.gradeName || '-'}</td>
                    <td className="py-2.5 px-4 text-center text-gray-600">
                      <span className="text-[10px] text-gray-400 mr-1">{c.source === 'CONFIRMED' ? '예정' : '입사'}</span>
                      {c.primaryDate || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isCalculating ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEV_STATUS_BADGE.CALCULATING}`}>
                          산정중 (재산정 가능)
                        </span>
                      ) : c.source === 'CONFIRMED' ? (
                        <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-medium">사전 산정</span>
                      ) : (
                        <span className="text-[10px] text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 font-medium">퇴직</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleCalculate(c.empId, c.empName, c.source)}
                        disabled={calcEmpId === c.empId}
                        className={`text-[10px] text-white rounded px-2.5 py-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                          isCalculating
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-[#2e9e6e] hover:bg-[#26865d]'
                        }`}
                        title={isCalculating ? '기존 산정중 결과를 덮어씁니다' : '퇴직금 산정 실행'}
                      >
                        {calcEmpId === c.empId ? '산정 중...'
                          : isCalculating ? '재산정'
                          : '산정'}
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  )
}

// ── 상세 모달 ──
function DetailModal({ sevId, onClose }: { sevId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<SeveranceDetailRes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    severanceApi.detail(sevId)
      .then(setDetail)
      .catch(err => console.error('퇴직금 상세 조회 실패:', err))
      .finally(() => setLoading(false))
  }, [sevId])

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-8 text-sm text-gray-500">로딩 중...</div>
    </div>
  )
  if (!detail) return null
  const averageDailyWage = calcAverageDailyWage(detail)
  const appliedDailyWage = Math.round(Number(detail.avgDailyWage || 0))
  const showAppliedDailyWage = appliedDailyWage > 0 && appliedDailyWage !== averageDailyWage
  const isDc = detail.retirementType === 'DC'
  const displayNetAmount = calcDisplayNetAmount(detail)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(680px,calc(100vw-24px))] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">퇴직금 상세 · {detail.empName}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{detail.deptName} · {detail.gradeName || '-'} · {PENSION_LABEL[detail.retirementType]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-5 text-xs">
          {/* 근속 정보 */}
          <section>
            <h4 className="text-[12px] font-semibold text-gray-700 mb-2">근속 정보</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">입사일</span><span className="text-gray-800">{detail.hireDate}</span></div>
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">퇴사일</span><span className="text-gray-800">{detail.resignDate}</span></div>
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">근속연수</span><span className="text-gray-800">{Number(detail.serviceYears).toFixed(2)}년 ({detail.serviceDays}일)</span></div>
              {detail.workGroupName && (
                <div className="flex px-4 py-2"><span className="w-32 text-gray-500">근무그룹</span><span className="text-gray-800">{detail.workGroupName}</span></div>
              )}
            </div>
          </section>

          {/* 산정 기초 */}
          <section>
            <h4 className="text-[12px] font-semibold text-gray-700 mb-2">산정 기초</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">최근 3개월 임금</span><span className="text-gray-800">{fmt(detail.last3MonthPay)} 원</span></div>
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">최근 3개월 일수</span><span className="text-gray-800">{detail.last3MonthDays}일</span></div>
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">전년 상여금</span><span className="text-gray-800">{fmt(detail.lastYearBonus)} 원</span></div>
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">1일 평균임금</span><span className="text-gray-800">{fmt(averageDailyWage)} 원</span></div>
              {showAppliedDailyWage && (
                <div className="flex px-4 py-2">
                  <span className="w-32 text-gray-500">적용 일당</span>
                  <span className="text-gray-800">{fmt(appliedDailyWage)} 원 <span className="text-[11px] text-gray-400">(통상임금 적용)</span></span>
                </div>
              )}
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">연차수당</span><span className="text-gray-800">{fmt(detail.annualLeaveForAvgWage)} 원 <span className="text-[11px] text-gray-400">(평균임금 반영분)</span></span></div>
            </div>
          </section>

          {/* 산정 금액 */}
          <section>
            <h4 className="text-[12px] font-semibold text-gray-700 mb-2">산정 금액</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">퇴직금</span><span className="text-gray-800 font-medium">{fmt(detail.severanceAmount)} 원</span></div>
              {isDc && <div className="flex px-4 py-2"><span className="w-32 text-gray-500">기적립 총액</span><span className="text-gray-800">{fmt(detail.dcDepositedTotal)} 원</span></div>}
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">세액</span><span className="text-red-500">{fmt(detail.taxAmount)} 원</span></div>
              <div className="flex px-4 py-2 bg-[#f0f9f6]">
                <span className="w-32 text-[#2e9e6e] font-semibold">실지급액</span>
                <span className="text-[#2e9e6e] font-bold">
                  {fmt(displayNetAmount)} 원
                  {isDc && <span className="text-[11px] text-gray-400 font-normal ml-1">(퇴직금 - 기적립 총액 - 세액)</span>}
                </span>
              </div>
            </div>
          </section>

          {/* 처리 정보 */}
          <section>
            <h4 className="text-[12px] font-semibold text-gray-700 mb-2">처리 정보</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">상태</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEV_STATUS_BADGE[detail.sevStatus] || 'bg-gray-100'}`}>
                  {SEV_STATUS_LABEL[detail.sevStatus] || detail.sevStatus}
                </span>
              </div>
              {detail.approvalDocId && (
                <div className="flex px-4 py-2"><span className="w-32 text-gray-500">전자결재 문서</span><span className="text-gray-800">#{detail.approvalDocId}</span></div>
              )}
              {detail.confirmedAt && (
                <div className="flex px-4 py-2"><span className="w-32 text-gray-500">확정일시</span><span className="text-gray-800">{detail.confirmedAt}</span></div>
              )}
              {detail.transferDate && (
                <div className="flex px-4 py-2"><span className="w-32 text-gray-500">지급일</span><span className="text-gray-800">{detail.transferDate}</span></div>
              )}
              {detail.paidAt && (
                <div className="flex px-4 py-2"><span className="w-32 text-gray-500">지급처리 일시</span><span className="text-gray-800">{detail.paidAt}</span></div>
              )}
            </div>
          </section>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  )
}
