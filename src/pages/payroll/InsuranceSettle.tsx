import { useState, useEffect } from 'react'
import { insuranceSettlementApi } from '../../api/payAdmin'
import type { InsuranceSettlementRes, InsuranceSettlementSummaryRes, InsuranceSettlementDetailRes } from '../../api/payAdmin'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 15

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }
function fmtDiff(n: number | null | undefined) {
  const r = Math.round(n ?? 0)
  if (r > 0) return `+${r.toLocaleString()}`
  return r.toLocaleString()
}

// 4대보험 정산 권장 시기 (한국 표준 일정)
const today = new Date()
const TODAY_YEAR = today.getFullYear()
const TODAY_MONTH = today.getMonth() + 1
const LAST_YEAR = TODAY_YEAR - 1

type SeasonMsg = { tone: 'now' | 'wrap' | 'soon' | 'later'; text: string }
function getCurrentSeason(): SeasonMsg {
  if (TODAY_MONTH === 3) return { tone: 'now', text: `🎯 지금이 ${LAST_YEAR}년 고용·산재보험 정산 시점입니다 (보수총액 신고 직후, 3월 15일까지 신고)` }
  if (TODAY_MONTH === 4) return { tone: 'now', text: `🎯 지금이 ${LAST_YEAR}년 건강·장기요양 정산 시점입니다 (보수총액 신고 후 4~5월 정산보험료 부과)` }
  if (TODAY_MONTH === 5) return { tone: 'wrap', text: `⏰ ${LAST_YEAR}년 건강·장기요양 정산을 마무리하실 시점입니다` }
  if (TODAY_MONTH <= 2) return { tone: 'soon', text: `📅 ${LAST_YEAR}년 정산은 ${TODAY_YEAR}년 3월부터 진행하세요 (전년도 보수총액 신고 후)` }
  return { tone: 'later', text: `📅 ${TODAY_YEAR}년 정산은 ${TODAY_YEAR + 1}년 3월에 진행하세요 (올해 보수총액 신고 후)` }
}

const SEASON_STYLE: Record<SeasonMsg['tone'], string> = {
  now: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  wrap: 'bg-amber-50 border-amber-300 text-amber-800',
  soon: 'bg-blue-50 border-blue-200 text-blue-800',
  later: 'bg-gray-50 border-gray-200 text-gray-700',
}

export default function InsuranceSettle() {
  const [fromMonth, setFromMonth] = useState(`${LAST_YEAR}-01`)
  const [toMonth, setToMonth] = useState(`${LAST_YEAR}-12`)
  const [applyYearMonth, setApplyYearMonth] = useState(() => {
    const nextM = TODAY_MONTH === 12 ? `${TODAY_YEAR + 1}-01` : `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}`
    return nextM
  })
  const [summary, setSummary] = useState<InsuranceSettlementSummaryRes | null>(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [applying, setApplying] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const data: InsuranceSettlementRes[] = summary?.settlements || []
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1) }, [summary])

  const handleSearch = () => {
    setLoading(true)
    insuranceSettlementApi.getList(fromMonth, toMonth)
      .then(setSummary)
      .catch(err => { console.error('정산보험료 조회 실패:', err); alert('정산 내역 조회에 실패했습니다.') })
      .finally(() => setLoading(false))
  }

  const handleCalculate = () => {
    if (!confirm(`${fromMonth} ~ ${toMonth} 기간의 보험료를 산정하시겠습니까?`)) return
    setCalculating(true)
    insuranceSettlementApi.calculate({ fromYearMonth: fromMonth, toYearMonth: toMonth })
      .then(res => { setSummary(res); alert(`${res.totalEmployees}명의 보험료 산정이 완료되었습니다.`) })
      .catch(err => { console.error('보험료 산정 실패:', err); alert('보험료 산정에 실패했습니다.') })
      .finally(() => setCalculating(false))
  }

  const handleApplyToPayroll = () => {
    if (!summary || data.length === 0) { alert('산정된 내역이 없습니다. 먼저 산정해 주세요.'); return }
    const unapplied = data.filter(e => !e.isApplied)
    if (unapplied.length === 0) { alert('모두 반영된 상태입니다.'); return }
    const extra = unapplied.filter(e => e.totalDiff > 0).length
    const refund = unapplied.filter(e => e.totalDiff < 0).length
    if (!confirm(`${applyYearMonth} 급여대장에 반영하시겠습니까?\n\n- 추가징수(공제항목): ${extra}명\n- 환급(지급항목): ${refund}명`)) return

    setApplying(true)
    insuranceSettlementApi.applyToPayroll({ targetPayYearMonth: applyYearMonth, fromYearMonth: fromMonth, toYearMonth: toMonth })
      .then(() => {
        alert(`${unapplied.length}명의 정산 내역이 ${applyYearMonth} 급여대장에 반영되었습니다.`)
        handleSearch()  // 반영 후 목록 재조회
      })
      .catch(err => { console.error('급여대장 반영 실패:', err); alert('급여대장 반영에 실패했습니다.') })
      .finally(() => setApplying(false))
  }

  const diffCls = (v: number) => v > 0 ? 'text-red-500' : v < 0 ? 'text-blue-500' : 'text-gray-500'

  const badge = (category: string) => {
    if (category === '추가징수') return <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 font-semibold">추가징수</span>
    if (category === '환급') return <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-semibold">환급</span>
    return <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">차액없음</span>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 사회보험 &gt; 정산보험료</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">정산보험료</h1>
        <p className="text-xs text-gray-500 mb-4">정산기간 내 실지급 보수총액을 기준으로 보험료를 재산정하여 매월 공제액과의 차액을 급여대장에 반영합니다.</p>

        {/* 정산 권장 일정 — 운영자 가이드 */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1">
                <i className="fas fa-calendar-check text-emerald-600 text-[12px]" />
                정산 권장 일정
              </h3>
              <p className="text-[11px] text-gray-600">매년 1회, 전년도(1~12월) 보수총액 기준으로 정산. 한 화면에서 산정 → 반영까지 처리됩니다.</p>
            </div>
            <button
              onClick={() => {
                setFromMonth(`${LAST_YEAR}-01`)
                setToMonth(`${LAST_YEAR}-12`)
                const next = TODAY_MONTH === 12 ? `${TODAY_YEAR + 1}-01` : `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}`
                setApplyYearMonth(next)
              }}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 whitespace-nowrap"
            >
              <i className="fas fa-magic text-[10px] mr-1" />
              {LAST_YEAR}년 정산 빠른 설정
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-[11px] mb-3">
            <div className={`bg-white border rounded p-2.5 ${TODAY_MONTH === 4 ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-gray-200'}`}>
              <div className="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                건강·장기요양
                {TODAY_MONTH === 4 && <span className="text-[9px] bg-emerald-500 text-white rounded px-1.5 py-0.5">지금</span>}
              </div>
              <div className="text-gray-600">📅 매년 <strong>4월</strong></div>
              <div className="text-gray-400 text-[10px] mt-0.5">보수총액 신고 후 4~5월 부과</div>
            </div>
            <div className={`bg-white border rounded p-2.5 ${TODAY_MONTH === 3 ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-gray-200'}`}>
              <div className="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                고용·산재
                {TODAY_MONTH === 3 && <span className="text-[9px] bg-emerald-500 text-white rounded px-1.5 py-0.5">지금</span>}
              </div>
              <div className="text-gray-600">📅 매년 <strong>3월</strong></div>
              <div className="text-gray-400 text-[10px] mt-0.5">보수총액 신고(~3.15) 후 3~4월 부과</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-2.5 opacity-75">
              <div className="font-semibold text-gray-700 mb-1">국민연금</div>
              <div className="text-gray-500">⚠️ 정산 대상 아님</div>
              <div className="text-gray-400 text-[10px] mt-0.5">7월 기준소득월액 변경으로 자동 반영</div>
            </div>
          </div>

          {/* 현재 시점 동적 배너 */}
          {(() => {
            const season = getCurrentSeason()
            return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded text-xs border ${SEASON_STYLE[season.tone]}`}>
                <span>{season.text}</span>
              </div>
            )
          })()}
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-5 text-xs flex-wrap">
          <span className="text-gray-500">정산기간</span>
          <input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <span className="text-gray-400">~</span>
          <input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <span className="text-gray-500 ml-3">반영할 급여월</span>
          <input type="month" value={applyYearMonth} onChange={e => setApplyYearMonth(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <button onClick={handleSearch} disabled={loading} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">
            <i className="fas fa-search text-[10px] mr-1" />{loading ? '조회중...' : '조회'}
          </button>
          <button onClick={handleCalculate} disabled={calculating} className="px-3 py-1.5 border border-[#2e9e6e] text-[#2e9e6e] rounded hover:bg-[#f0f9f6] disabled:opacity-40">
            <i className="fas fa-calculator text-[10px] mr-1" />{calculating ? '산정중...' : '보험료 산정'}
          </button>
          <button onClick={handleApplyToPayroll} disabled={applying || !summary || data.length === 0} className="px-3 py-1.5 text-white bg-[#2e9e6e] rounded hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed">
            <i className="fas fa-file-invoice text-[10px] mr-1" />{applying ? '반영중...' : '급여대장 반영'}
          </button>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1 mb-4">
          <p className="font-semibold">ℹ️ 정산 방식</p>
          <p>• <strong>보수총액</strong> = 정산기간 내 지급완료(PAID) 급여대장의 지급합계 누적</p>
          <p>• <strong>기공제액</strong> = 같은 기간 동안 매월 급여대장에서 이미 공제한 보험료 누적</p>
          <p>• <strong>정산액</strong> = 보수총액 × 요율, <strong>차액 = 정산액 − 기공제액</strong></p>
          <p>• 차액 <strong className="text-red-500">(+) 추가징수</strong> → 반영월 급여대장의 공제항목에 "보험료 정산분"으로 추가</p>
          <p>• 차액 <strong className="text-blue-500">(−) 환급</strong> → 반영월 급여대장의 지급항목에 "보험료 환급분"으로 추가</p>
        </div>


        {/* 요약 */}
        {summary && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">정산 대상자</div>
              <div className="text-xl font-bold text-gray-800 mt-1">{summary.totalEmployees} <span className="text-sm font-normal">명</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">반영 완료</div>
              <div className="text-xl font-bold text-[#2e9e6e] mt-1">{summary.appliedCount} <span className="text-sm font-normal">명</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">추가 징수 총액</div>
              <div className="text-xl font-bold text-red-500 mt-1">+{fmt(summary.totalChargeAmount)} <span className="text-sm font-normal">원</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">환급 총액</div>
              <div className="text-xl font-bold text-blue-500 mt-1">−{fmt(summary.totalRefundAmount)} <span className="text-sm font-normal">원</span></div>
            </div>
          </div>
        )}

        {/* 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1400px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th rowSpan={2} className="py-2 px-3 text-center font-medium text-gray-500">상태</th>
                <th rowSpan={2} className="py-2 px-3 text-center font-medium text-gray-500">사원명</th>
                <th rowSpan={2} className="py-2 px-3 text-center font-medium text-gray-500">부서</th>
                <th rowSpan={2} className="py-2 px-3 text-right font-medium text-gray-500">보수총액</th>
                <th colSpan={3} className="py-2 px-3 text-center font-medium text-gray-500 border-l border-gray-200">항목별 차액 (정산액 − 기공제)</th>
                <th rowSpan={2} className="py-2 px-3 text-right font-medium text-gray-500 bg-orange-50 border-l border-gray-200">차액 합계</th>
                <th rowSpan={2} className="py-2 px-3 text-center font-medium text-gray-500">구분</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2 px-3 text-right font-medium text-gray-500 border-l border-gray-200">건강보험</th>
                <th className="py-2 px-3 text-right font-medium text-gray-500">장기요양</th>
                <th className="py-2 px-3 text-right font-medium text-gray-500">고용보험</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? pagedData.map(emp => (
                <tr key={emp.settlementId} onClick={() => setDetailId(emp.settlementId)} className="border-b border-gray-50 hover:bg-[#f2faf6] cursor-pointer">
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${emp.isApplied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {emp.isApplied ? '반영완료' : '미반영'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-600 font-medium hover:underline">{emp.empName}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{emp.deptName}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(emp.baseSalary)}</td>
                  <td className={`py-2.5 px-3 text-right border-l border-gray-100 ${diffCls(emp.diffHealth)}`}>{fmtDiff(emp.diffHealth)}</td>
                  <td className={`py-2.5 px-3 text-right ${diffCls(emp.diffLtc)}`}>{fmtDiff(emp.diffLtc)}</td>
                  <td className={`py-2.5 px-3 text-right ${diffCls(emp.diffEmployment)}`}>{fmtDiff(emp.diffEmployment)}</td>
                  <td className={`py-2.5 px-3 text-right font-bold bg-orange-50/50 border-l border-gray-100 ${diffCls(emp.totalDiff)}`}>{fmtDiff(emp.totalDiff)}</td>
                  <td className="py-2.5 px-3 text-center">{badge(emp.diffCategory || (emp.totalDiff > 0 ? '추가징수' : emp.totalDiff < 0 ? '환급' : '차액없음'))}</td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="py-12 text-center text-gray-400">{summary ? '검색된 결과가 없습니다.' : '정산기간을 선택한 후 조회 또는 산정하세요.'}</td></tr>
              )}
            </tbody>
            {data.length > 0 && (() => {
              const totals = data.reduce((acc, e) => {
                acc.base += e.baseSalary
                acc.hi += e.diffHealth; acc.ltc += e.diffLtc; acc.ei += e.diffEmployment; acc.total += e.totalDiff
                return acc
              }, { base: 0, hi: 0, ltc: 0, ei: 0, total: 0 })
              return (
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                    <td colSpan={3} className="py-2.5 px-3 text-right text-gray-700">합계</td>
                    <td className="py-2.5 px-3 text-right text-gray-800">{fmt(totals.base)}</td>
                    <td className={`py-2.5 px-3 text-right border-l border-gray-200 ${diffCls(totals.hi)}`}>{fmtDiff(totals.hi)}</td>
                    <td className={`py-2.5 px-3 text-right ${diffCls(totals.ltc)}`}>{fmtDiff(totals.ltc)}</td>
                    <td className={`py-2.5 px-3 text-right ${diffCls(totals.ei)}`}>{fmtDiff(totals.ei)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold bg-orange-100 border-l border-gray-200 ${diffCls(totals.total)}`}>{fmtDiff(totals.total)}</td>
                    <td />
                  </tr>
                </tfoot>
              )
            })()}
          </table>
        </div>

        <Pagination page={page} total={data.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {detailId && <DetailModal settlementId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}

// ── 상세 모달 ──
function DetailModal({ settlementId, onClose }: { settlementId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<InsuranceSettlementDetailRes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    insuranceSettlementApi.getDetail(settlementId)
      .then(setDetail)
      .catch(err => console.error('상세 조회 실패:', err))
      .finally(() => setLoading(false))
  }, [settlementId])

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-8 text-sm text-gray-500">로딩 중...</div>
    </div>
  )
  if (!detail) return null

  const diffCls = (v: number) => v > 0 ? 'text-red-500' : v < 0 ? 'text-blue-500' : 'text-gray-500'
  const rows = [
    { label: '국민연금', settle: detail.pensionEmployee, deducted: detail.deductedPension, diff: detail.diffPension, isSettleTarget: false },
    { label: '건강보험', settle: detail.healthEmployee, deducted: detail.deductedHealth, diff: detail.diffHealth, isSettleTarget: true },
    { label: '장기요양', settle: detail.ltcEmployee, deducted: detail.deductedLtc, diff: detail.diffLtc, isSettleTarget: true },
    { label: '고용보험', settle: detail.employmentEmployee, deducted: detail.deductedEmployment, diff: detail.diffEmployment, isSettleTarget: true },
  ]
  const totalSettle = rows.filter(r => r.isSettleTarget).reduce((a, r) => a + r.settle, 0)
  const totalDeducted = rows.filter(r => r.isSettleTarget).reduce((a, r) => a + r.deducted, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(600px,calc(100vw-24px))]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">정산 상세 · {detail.empName}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {detail.deptName} · {detail.titleName || '-'} · {detail.gradeName || '-'} · 보수총액 {fmt(detail.baseSalary)}원
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              정산기간 {detail.settlementFromMonth} ~ {detail.settlementToMonth}
              {detail.payYearMonth && <> · 반영월 <strong>{detail.payYearMonth}</strong></>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2 px-3 text-center font-medium text-gray-500">항목</th>
                <th className="py-2 px-3 text-right font-medium text-gray-500">정산액</th>
                <th className="py-2 px-3 text-right font-medium text-gray-500">기공제액</th>
                <th className="py-2 px-3 text-right font-medium text-gray-500">차액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label} className="border-b border-gray-50">
                  <td className="py-2.5 px-3 text-center text-gray-700">
                    {r.label}
                    {!r.isSettleTarget && <span className="ml-1.5 text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5">표시용</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(r.settle)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(r.deducted)}</td>
                  <td className={`py-2.5 px-3 text-right font-medium ${r.isSettleTarget ? diffCls(r.diff) : 'text-gray-400'}`}>
                    {r.isSettleTarget ? fmtDiff(r.diff) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                <td className="py-2.5 px-3 text-center text-gray-700">차액 합계 (정산대상 3종)</td>
                <td className="py-2.5 px-3 text-right text-gray-800">{fmt(totalSettle)}</td>
                <td className="py-2.5 px-3 text-right text-gray-800">{fmt(totalDeducted)}</td>
                <td className={`py-2.5 px-3 text-right text-base ${diffCls(detail.totalDiff)}`}>{fmtDiff(detail.totalDiff)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-4 text-[11px] text-gray-500 bg-blue-50 border border-blue-100 rounded p-3">
            {detail.totalDiff > 0 ? <span>추가징수 <strong className="text-red-500">{fmt(detail.totalDiff)}원</strong>이 반영월 급여대장의 <strong>공제항목</strong>에 추가됩니다.</span>
              : detail.totalDiff < 0 ? <span>환급 <strong className="text-blue-500">{fmt(Math.abs(detail.totalDiff))}원</strong>이 반영월 급여대장의 <strong>지급항목</strong>에 추가됩니다.</span>
              : <span>차액이 없어 별도 반영되지 않습니다.</span>}
          </div>

          {detail.isApplied && (
            <div className="mt-2 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded p-2 text-center">
              ✓ 이 정산은 <strong>{detail.payYearMonth}</strong> 급여대장에 이미 반영되었습니다.
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  )
}
