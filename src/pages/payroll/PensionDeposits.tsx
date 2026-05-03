import { useState, useEffect, useCallback } from 'react'
import {
  pensionDepositApi,
  empSalaryApi,
  type PensionDepositByEmployeeRes,
  type PensionDepositByEmployeeSummaryRes,
  type PensionDepositRes,
  type PensionDepositEmployeeRes,
  type DepStatus,
  type EmpSalaryRes,
} from '../../api/payAdmin'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 15

function fmt(n: number) { return n.toLocaleString() }

function fmtDateTime(s: string | null | undefined) {
  if (!s) return '-'
  // "2026-03-25T09:00:00(.xxx)" → "2026-03-25 09:00"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return m ? `${m[1]} ${m[2]}` : s
}

function statusLabel(s: DepStatus) {
  return s === 'COMPLETED' ? '적립완료' : s === 'SCHEDULED' ? '적립예정' : '취소'
}

function statusClass(s: DepStatus) {
  return s === 'COMPLETED'
    ? 'bg-green-100 text-green-700'
    : s === 'SCHEDULED'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-500'
}

// 페이지 진입 시 기본 기간: 올해 1월 ~ 현재 월
const todayForDefault = new Date()
const DEFAULT_FROM_YM = `${todayForDefault.getFullYear()}-01`
const DEFAULT_TO_YM = `${todayForDefault.getFullYear()}-${String(todayForDefault.getMonth() + 1).padStart(2, '0')}`

export default function PensionDeposits() {
  const [fromYm, setFromYm] = useState(DEFAULT_FROM_YM)
  const [toYm, setToYm] = useState(DEFAULT_TO_YM)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | DepStatus>('')
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [detailEmpId, setDetailEmpId] = useState<number | null>(null)

  const [summary, setSummary] = useState<PensionDepositByEmployeeSummaryRes | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchList = useCallback(() => {
    setLoading(true)
    pensionDepositApi
      .getByEmployee({
        fromYm: fromYm || undefined,
        toYm: toYm || undefined,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      .then(setSummary)
      .catch(err => {
        console.error('퇴직연금 적립내역 조회 실패:', err)
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }, [fromYm, toYm, search, statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList()
  }, [fetchList])

  const employees = summary?.employees ?? []
  const pagedEmployees = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1) }, [summary])
  const totalEmployees = summary?.totalEmployees ?? 0
  const totalAmount = summary?.totalDepositAmount ?? 0
  const monthlyAvg = summary?.monthlyAverage ?? 0
  const grandTotal = summary?.grandTotalDeposited ?? 0
  const scheduledCount = summary?.scheduledCount ?? 0
  const scheduledAmount = summary?.scheduledAmount ?? 0
  const scheduledMonths = summary?.scheduledMonths ?? []
  // 표시용: 최대 3개월까지 노출, 그 이상은 "+N" 으로 축약
  const scheduledMonthsLabel = (() => {
    if (scheduledMonths.length === 0) return ''
    if (scheduledMonths.length <= 3) return scheduledMonths.join(', ')
    return `${scheduledMonths.slice(0, 3).join(', ')} +${scheduledMonths.length - 3}`
  })()

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직연금 적립 내역</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직연금 적립 내역 (DC형)</h1>
        <p className="text-xs text-gray-500 mb-5">회사 전체 DC형 사원의 퇴직연금 적립 이력을 조회·관리합니다. 사원명을 클릭하면 월별 상세 내역을 볼 수 있습니다.</p>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-5 text-xs flex-wrap">
          <span className="text-gray-500">적립 기간</span>
          <input type="month" value={fromYm} onChange={e => setFromYm(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <span className="text-gray-400">~</span>
          <input type="month" value={toYm} onChange={e => setToYm(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | DepStatus)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="">전체 상태</option>
            <option value="COMPLETED">적립완료</option>
            <option value="SCHEDULED">적립예정</option>
            <option value="CANCELED">취소</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setBatchModalOpen(true)} className="px-3 py-1.5 border border-[#2e9e6e] text-[#2e9e6e] rounded hover:bg-[#f0f9f6]" title="해당 월의 PAID 급여대장 기준 DC 사원 일괄 적립">
              <i className="fas fa-bolt text-[10px] mr-1" />월별 일괄 적립
            </button>
            <button onClick={() => setExcelModalOpen(true)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50" title="기간 선택 → 사업자 제출 / 회계 결산용 명세 엑셀 다운로드">
              <i className="fas fa-file-excel text-[10px] mr-1" />명세 다운로드
            </button>
            <button onClick={() => setManualModalOpen(true)} className="px-3 py-1.5 text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]">
              <i className="fas fa-plus text-[10px] mr-1" />수동 적립 등록
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{totalEmployees} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className={`border rounded-lg p-4 ${scheduledCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            <div className={`text-xs ${scheduledCount > 0 ? 'text-blue-700' : 'text-gray-500'}`}>적립 예정 <span className="text-[10px] text-gray-400">(처리 대기)</span></div>
            <div className={`text-xl font-bold mt-1 ${scheduledCount > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
              {scheduledCount} <span className="text-sm font-normal">명</span>
            </div>
            {scheduledCount > 0 && (
              <>
                <div className="text-[11px] text-blue-600 mt-0.5">{fmt(scheduledAmount)} 원</div>
                {scheduledMonthsLabel && (
                  <div className="text-[10px] text-blue-500 mt-0.5 truncate" title={scheduledMonths.join(', ')}>
                    📅 {scheduledMonthsLabel}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">기간 내 적립 총액</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(totalAmount)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">월평균 적립액</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(monthlyAvg)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">누적 적립 (전체)</div>
            <div className="text-xl font-bold text-[#2e9e6e] mt-1">{fmt(grandTotal)} <span className="text-sm font-normal">원</span></div>
          </div>
        </div>

        {/* 적립 예정 알림 배너 — SCHEDULED 가 있을 때만 노출 */}
        {scheduledCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <i className="fas fa-bolt text-blue-600 text-sm" />
              <div className="text-xs text-blue-800">
                자동 산정된 <strong className="text-blue-700">{scheduledCount}명</strong> · <strong className="text-blue-700">{fmt(scheduledAmount)}원</strong> 이 적립 처리 대기 중입니다.
                {scheduledMonthsLabel && (
                  <span className="ml-1.5 inline-flex items-center text-[11px] text-blue-700 bg-white border border-blue-200 rounded px-1.5 py-0.5" title={scheduledMonths.join(', ')}>
                    📅 {scheduledMonthsLabel}
                  </span>
                )}
                <span className="text-[11px] text-blue-600 ml-1">[월별 일괄 적립] 으로 처리해주세요.</span>
              </div>
            </div>
            <button
              onClick={() => setBatchModalOpen(true)}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 whitespace-nowrap"
            >
              <i className="fas fa-bolt text-[10px] mr-1" />지금 처리
            </button>
          </div>
        )}

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1 mb-4">
          <p className="font-semibold">ℹ️ 안내</p>
          <p>• <strong>자동 적립</strong>은 매월 급여 지급처리 완료 시 해당 사원의 DC 계좌에 기록됩니다.</p>
          <p>• <strong>수동 적립 등록</strong>은 자동 적립이 누락되었거나 소급 반영이 필요할 때만 사용하세요.</p>
          <p>• 사원명을 클릭하면 해당 사원의 <strong>월별 상세 내역</strong>을 볼 수 있습니다.</p>
        </div>

        {/* 검색 — 집계박스 아래 */}
        <div className="flex items-center gap-3 mb-3 text-xs">
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
        </div>

        {/* 테이블 — 사원별 집계 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">적립 개월수</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">기간 내 총 적립액</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">최근 적립일시</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">특이사항</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">조회 중...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">조회된 적립 내역이 없습니다.</td></tr>
              ) : pagedEmployees.map((e: PensionDepositByEmployeeRes) => (
                <tr key={e.empId} onClick={() => setDetailEmpId(e.empId)} className="border-b border-gray-50 hover:bg-[#f2faf6] cursor-pointer">
                  <td className="py-2.5 px-3 text-center text-blue-600 font-medium hover:underline">{e.empName}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{e.deptName}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{e.monthCount}개월</td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-800">{fmt(e.totalAmount)} 원</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{fmtDateTime(e.lastDepositDate)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex gap-1">
                      {e.hasManual && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">수동 포함</span>}
                      {e.hasCanceled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">취소 포함</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={employees.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {manualModalOpen && <ManualDepositModal onClose={() => setManualModalOpen(false)} onCreated={fetchList} />}
      {batchModalOpen && <BatchDepositModal onClose={() => setBatchModalOpen(false)} onProcessed={fetchList} />}
      {excelModalOpen && <ExcelDownloadModal onClose={() => setExcelModalOpen(false)} initFromYm={fromYm} initToYm={toYm} />}
      {detailEmpId !== null && (
        <DetailModal
          empId={detailEmpId}
          fromYm={fromYm}
          toYm={toYm}
          onClose={() => setDetailEmpId(null)}
          onChanged={fetchList}
        />
      )}
    </div>
  )
}

// ── 월별 일괄 적립 모달 (월 단위 — 적립 처리 자체는 월별이 자연스러움) ──
function BatchDepositModal({ onClose, onProcessed }: { onClose: () => void; onProcessed: () => void }) {
  // 기본값: 직전 월 (PAID 처리됐을 가능성 높음)
  const defaultYm = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()
  const [payYearMonth, setPayYearMonth] = useState(defaultYm)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!confirm(`${payYearMonth} PAID 급여대장 기준으로 DC형 사원의 퇴직연금을 일괄 적립하시겠습니까?\n\n* 각 사원에게 해당 월 지급합계의 1/12 만큼 적립됩니다.\n* 이미 같은 월·사원에 적립된 경우 중복되지 않고 스킵됩니다.\n* 외부 사업자 송금은 별도 진행이 필요합니다.`)) return
    setCreating(true)
    try {
      const res = await pensionDepositApi.createMonthly(payYearMonth)
      if (res.created === 0) {
        alert(`${payYearMonth}: 신규 적립이 생성되지 않았습니다. (이미 처리됐거나 DC 사원이 없습니다)`)
      } else {
        alert(`${payYearMonth}: ${res.created}명의 적립이 생성되었습니다.`)
      }
      onProcessed()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } }
      const msg = e?.response?.data?.message || ''
      const status = e?.response?.status
      if (msg.includes('PAYROLL_NOT_FOUND') || status === 404) {
        alert(`${payYearMonth}: 해당 월의 급여대장이 없습니다.`)
      } else if (msg.includes('PAYROLL_STATUS_INVALID') || msg.includes('지급 완료')) {
        alert(`${payYearMonth}: 지급 완료(PAID) 상태인 급여대장만 적립할 수 있습니다.`)
      } else {
        alert(`적립 실패 (${status ?? '오류'}): ${msg || '알 수 없는 오류'}`)
      }
      console.error('월별 일괄 적립 실패:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(480px,calc(100vw-24px))] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">월별 일괄 적립</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">PAID 급여대장 기준으로 DC형 사원 적립 처리</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-amber-50 text-[11px] text-amber-800">
          <p>매월 자동 산정된 "적립예정" 항목을 일괄로 적립 완료 처리합니다. 외부 사업자 송금은 별도 진행이 필요하며, 송금용 명세는 [명세 다운로드] 버튼으로 받으실 수 있습니다.</p>
        </div>

        <div className="px-6 py-5">
          <label className="block text-xs text-gray-500 mb-1.5">대상 급여월</label>
          <input
            type="month"
            value={payYearMonth}
            onChange={e => setPayYearMonth(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#2e9e6e]"
          />
          <p className="text-[10px] text-gray-400 mt-1">해당 월의 급여대장이 PAID 상태여야 적립이 가능합니다.</p>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">취소</button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fas fa-bolt text-[10px] mr-1.5" />
            {creating ? '처리 중...' : '일괄 적립 처리'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 명세 엑셀 다운로드 모달 (임의 기간 — 사업자 송금/회계 결산/노무 감사용) ──
function ExcelDownloadModal({ onClose, initFromYm, initToYm }: { onClose: () => void; initFromYm: string; initToYm: string }) {
  const [fromYm, setFromYm] = useState(initFromYm)
  const [toYm, setToYm] = useState(initToYm)
  const [downloading, setDownloading] = useState(false)

  const setQuickRange = (months: number) => {
    const d = new Date()
    const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    d.setMonth(d.getMonth() - (months - 1))
    const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setFromYm(from); setToYm(to)
  }
  const setThisYear = () => {
    const y = new Date().getFullYear()
    setFromYm(`${y}-01`); setToYm(`${y}-12`)
  }

  const handleDownload = async () => {
    if (fromYm > toYm) {
      alert('기간 시작이 종료보다 이후일 수 없습니다.')
      return
    }
    setDownloading(true)
    try {
      const res = await pensionDepositApi.downloadExcel(fromYm, toYm)
      const cd = res.headers?.['content-disposition'] as string | undefined
      const periodLabel = fromYm === toYm ? fromYm : `${fromYm}_${toYm}`
      let fileName = `퇴직연금_${periodLabel}_적립명세.xlsx`
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
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } }
      const msg = e?.response?.data?.message || ''
      const status = e?.response?.status
      if (msg.includes('DEPOSIT_NOT_FOUND') || status === 404) {
        alert('선택한 기간에 적립 완료된 내역이 없습니다.')
      } else {
        alert(`다운로드 실패 (${status ?? '오류'}): ${msg || '알 수 없는 오류'}`)
      }
      console.error('명세 다운로드 실패:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(520px,calc(100vw-24px))] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">적립 명세 다운로드</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">사업자 송금 첨부 / 회계 결산 / 노무 감사용</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-blue-50 text-[11px] text-blue-700 space-y-0.5">
          <p>📑 다운로드 파일에는 두 시트가 포함됩니다.</p>
          <p>• <strong>합산 시트</strong> — 사원별 누계 (사업자 송금/회계 결산용)</p>
          <p>• <strong>월별 상세 시트</strong> — 사원 × 월 전체 (노무 감사/검증용)</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">기간</label>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={fromYm}
                onChange={e => setFromYm(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#2e9e6e]"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                type="month"
                value={toYm}
                onChange={e => setToYm(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#2e9e6e]"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              <button onClick={() => setQuickRange(1)} className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">최근 1개월</button>
              <button onClick={() => setQuickRange(3)} className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">최근 3개월 (분기)</button>
              <button onClick={() => setQuickRange(6)} className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">최근 6개월 (반기)</button>
              <button onClick={setThisYear} className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">올해 전체</button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">취소</button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fas fa-file-excel text-[10px] mr-1.5" />
            {downloading ? '다운로드 중...' : '엑셀 다운로드'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 사원별 상세 모달 ──
function DetailModal({
  empId,
  fromYm,
  toYm,
  onClose,
  onChanged,
}: {
  empId: number
  fromYm: string
  toYm: string
  onClose: () => void
  onChanged: () => void
}) {
  const [data, setData] = useState<PensionDepositEmployeeRes | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    pensionDepositApi
      .getEmployeeDeposits(empId, { fromYm: fromYm || undefined, toYm: toYm || undefined })
      .then(setData)
      .catch(err => console.error('사원별 적립 이력 조회 실패:', err))
      .finally(() => setLoading(false))
  }, [empId, fromYm, toYm])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleCancel = async (depId: number) => {
    const reason = prompt('취소 사유를 입력하세요.', '') ?? ''
    if (!confirm('이 적립을 취소하시겠습니까?\n(실제 삭제가 아닌 CANCELED 상태로 전환됩니다.)')) return
    try {
      await pensionDepositApi.cancel(depId, reason || undefined)
      load()
      onChanged()
    } catch (err) {
      console.error('적립 취소 실패:', err)
      alert('적립 취소에 실패했습니다.')
    }
  }

  const items: PensionDepositRes[] = data?.deposits ?? []
  const completedSum = items.filter(d => d.depStatus === 'COMPLETED').reduce((a, d) => a + d.depositAmount, 0)
  const canceledSum = items.filter(d => d.depStatus === 'CANCELED').reduce((a, d) => a + d.depositAmount, 0)
  const monthCount = items.filter(d => d.depStatus === 'COMPLETED').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(780px,calc(100vw-24px))] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">
              퇴직연금 적립 내역{data ? ` · ${data.empName}` : ''}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {data ? `${data.deptName} · ${data.retirementType} · 총 ${monthCount}개월 적립 · ${fmt(completedSum)}원` : '로딩 중...'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 요약 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#f0f9f6] border border-[#2e9e6e]/30 rounded-lg p-3">
              <div className="text-[11px] text-[#2e9e6e]">적립완료 합계</div>
              <div className="text-base font-bold text-[#2e9e6e] mt-1">{fmt(completedSum)} 원</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-[11px] text-gray-500">취소 합계</div>
              <div className="text-base font-bold text-gray-500 mt-1">{fmt(canceledSum)} 원</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-[11px] text-gray-500">전체 건수</div>
              <div className="text-base font-bold text-gray-800 mt-1">{items.length} 건</div>
            </div>
          </div>

          {/* 월별 상세 테이블 */}
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2 px-3 text-center font-medium text-gray-500">적립월</th>
                <th className="py-2 px-3 text-right font-medium text-gray-500">기준임금</th>
                <th className="py-2 px-3 text-right font-medium text-gray-500">적립금액</th>
                <th className="py-2 px-3 text-center font-medium text-gray-500">구분</th>
                <th className="py-2 px-3 text-center font-medium text-gray-500">상태</th>
                <th className="py-2 px-3 text-center font-medium text-gray-500">적립일시</th>
                <th className="py-2 px-3 text-center font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">조회 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">조회된 내역이 없습니다.</td></tr>
              ) : items.map(d => (
                <tr key={d.depId} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-center text-gray-800 font-medium">{d.payYearMonth}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{fmt(d.baseAmount)}</td>
                  <td className="py-2 px-3 text-right font-medium text-gray-800">{fmt(d.depositAmount)}</td>
                  <td className="py-2 px-3 text-center">
                    {d.isManual ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">수동</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        자동{d.payrollRunId != null ? ` · #${d.payrollRunId}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusClass(d.depStatus)}`}>
                      {statusLabel(d.depStatus)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-gray-600">{fmtDateTime(d.depositDate)}</td>
                  <td className="py-2 px-3 text-center">
                    {d.depStatus === 'COMPLETED' && (
                      <button onClick={() => handleCancel(d.depId)} className="text-[10px] text-red-500 border border-red-200 rounded px-2 py-0.5 hover:bg-red-50">취소</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  )
}

// ── 수동 적립 등록 모달 ──
function ManualDepositModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [empKeyword, setEmpKeyword] = useState('')
  const [empResults, setEmpResults] = useState<EmpSalaryRes[]>([])
  const [selectedEmp, setSelectedEmp] = useState<EmpSalaryRes | null>(null)
  const [payYearMonth, setPayYearMonth] = useState('2026-03')
  const [baseAmount, setBaseAmount] = useState<number>(0)
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!empKeyword || selectedEmp) {
      setEmpResults([])
      return
    }
    const t = setTimeout(() => {
      empSalaryApi
        .getList({ keyword: empKeyword, size: 10 })
        .then(res => setEmpResults(res.content))
        .catch(err => console.error('사원 검색 실패:', err))
    }, 250)
    return () => clearTimeout(t)
  }, [empKeyword, selectedEmp])

  const handleSubmit = async () => {
    if (!selectedEmp || !depositAmount || !baseAmount || !reason) return
    setSubmitting(true)
    try {
      await pensionDepositApi.createManual({
        empId: selectedEmp.empId,
        payYearMonth,
        baseAmount,
        depositAmount,
        depStatus: 'COMPLETED',
        reason,
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      console.error('수동 적립 등록 실패:', err)
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '수동 적립 등록에 실패했습니다.'
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(460px,calc(100vw-24px))]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">수동 적립 등록</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-3 text-xs">
          <div className="relative">
            <label className="text-gray-500 mb-1 block">사원 <span className="text-red-500">*</span></label>
            {selectedEmp ? (
              <div className="flex items-center justify-between border border-gray-200 rounded px-2.5 py-1.5">
                <span className="text-gray-800">{selectedEmp.empName} <span className="text-gray-400">({selectedEmp.deptName})</span></span>
                <button onClick={() => { setSelectedEmp(null); setEmpKeyword('') }} className="text-gray-400 hover:text-gray-600">&times;</button>
              </div>
            ) : (
              <input
                type="text"
                value={empKeyword}
                onChange={e => setEmpKeyword(e.target.value)}
                placeholder="사원명 검색"
                className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e]"
              />
            )}
            {!selectedEmp && empResults.length > 0 && (
              <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto shadow">
                {empResults.map(emp => (
                  <button
                    key={emp.empId}
                    onClick={() => { setSelectedEmp(emp); setEmpResults([]) }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-gray-50"
                  >
                    <div className="text-gray-800">{emp.empName}</div>
                    <div className="text-[10px] text-gray-400">{emp.deptName} · {emp.empType}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">적립 기준월 <span className="text-red-500">*</span></label>
            <input type="month" value={payYearMonth} onChange={e => setPayYearMonth(e.target.value)} className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e]" />
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">기준임금 <span className="text-red-500">*</span></label>
            <input type="number" value={baseAmount || ''} onChange={e => setBaseAmount(Number(e.target.value))} className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e] text-right" />
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">적립금액 <span className="text-red-500">*</span></label>
            <input type="number" value={depositAmount || ''} onChange={e => setDepositAmount(Number(e.target.value))} className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e] text-right" />
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">사유 <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="예: 2026-03 급여 지급처리 누락분 소급" className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e] resize-none" />
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded p-2 text-[10px] text-yellow-700">
            이 등록은 감사 로그에 남습니다. 자동 적립이 이미 존재하는 월에는 등록할 수 없습니다.
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">취소</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedEmp || !depositAmount || !baseAmount || !reason}
            className="px-4 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
