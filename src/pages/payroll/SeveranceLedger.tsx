import { useState, useEffect, useCallback } from 'react'
import { severanceApi } from '../../api/payAdmin'
import type { SeveranceRes, SeveranceDetailRes, SeveranceListRes, SevStatus } from '../../api/payAdmin'
import { fetchEmployeeList } from '../../api/employee/employeeApi'
import { resignApi } from '../../api/resign'
import ApprovalDraftModal from './ApprovalDraftModal'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 15

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }

const SEV_STATUS_LABEL: Record<string, string> = {
  CALCULATING: '산정중',
  CONFIRMED: '확정',
  IN_APPROVAL: '승인요청',
  APPROVED: '승인완료',
  PAID: '지급완료',
}
const SEV_STATUS_BADGE: Record<string, string> = {
  CALCULATING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-orange-100 text-orange-700',
  IN_APPROVAL: 'bg-blue-100 text-blue-700',
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
  const [approvalSevId, setApprovalSevId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [calcModalOpen, setCalcModalOpen] = useState(false)

  const fetchList = useCallback(() => {
    setLoading(true)
    severanceApi.list({ size: 100 })
      .then(setSummary)
      .catch(err => { console.error('퇴직금 목록 조회 실패:', err); setSummary(null) })
      .finally(() => setLoading(false))
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchList() }, [fetchList])

  const handleConfirm = (sevId: number) => {
    if (!confirm('퇴직금을 확정하시겠습니까?')) return
    severanceApi.confirm(sevId)
      .then(() => { alert('확정되었습니다.'); fetchList() })
      .catch(err => alert('확정 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const handleSubmitApproval = (sevId: number) => {
    setApprovalSevId(sevId)
  }

  const items = summary?.severances?.content || []
  const filteredItems = (() => {
    const kw = searchKeyword.trim().toLowerCase()
    return items.filter(s => {
      if (statusFilter && s.sevStatus !== statusFilter) return false
      if (!kw) return true
      return s.empName.toLowerCase().includes(kw)
        || (s.empNum?.toLowerCase().includes(kw) ?? false)
    })
  })()
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1) }, [summary, searchKeyword, statusFilter])

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#f9fafb]">
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

        <div className="flex items-center gap-3 mb-4 text-xs">
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
            <option value="IN_APPROVAL">승인요청</option>
            <option value="APPROVED">승인완료</option>
            <option value="PAID">지급완료</option>
          </select>
          <button
            onClick={() => setCalcModalOpen(true)}
            className="px-3 py-1.5 border border-[#2e9e6e] text-[#2e9e6e] rounded hover:bg-[#f0f9f6]"
            title="자동 산정에서 누락된 퇴직자의 퇴직금을 직접 산정합니다"
          >
            <i className="fas fa-calculator text-[10px] mr-1" />수동 산정
          </button>
          {summary && (
            <div className="ml-auto text-xs text-gray-500">
              총 퇴직금 <span className="font-bold text-gray-800">{fmt(summary.totalSeveranceAmount)}</span> 원 · 실지급 <span className="font-bold text-[#2e9e6e]">{fmt(summary.totalNetAmount)}</span> 원
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
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
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="py-12 text-center text-gray-400">로딩 중...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={12} className="py-12 text-center text-gray-400">{searchKeyword.trim() ? '검색된 결과가 없습니다.' : '퇴직금 산정 내역이 없습니다.'}</td></tr>
              ) : pagedItems.map((s: SeveranceRes) => (
                <tr key={s.sevId} className="border-b border-gray-50 hover:bg-gray-50">
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
                  <td className="py-2.5 px-3 text-right text-gray-800 font-medium">{fmt(s.netAmount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEV_STATUS_BADGE[s.sevStatus] || 'bg-gray-100 text-gray-500'}`}>
                      {SEV_STATUS_LABEL[s.sevStatus] || s.sevStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {s.sevStatus === 'CALCULATING' && (
                        <button onClick={() => handleConfirm(s.sevId)} className="text-[10px] text-white bg-orange-500 rounded px-2 py-0.5 hover:bg-orange-600">확정</button>
                      )}
                      {s.sevStatus === 'CONFIRMED' && (
                        <button onClick={() => handleSubmitApproval(s.sevId)} className="text-[10px] text-white bg-[#2e9e6e] rounded px-2 py-0.5 hover:bg-[#26865d]">결재상신</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={filteredItems.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {detailSevId && <DetailModal sevId={detailSevId} onClose={() => setDetailSevId(null)} />}
      {approvalSevId && (
        <ApprovalDraftModal
          type="RETIREMENT"
          ledgerId={approvalSevId}
          onClose={() => setApprovalSevId(null)}
          onSubmitted={() => fetchList()}
        />
      )}
      {calcModalOpen && (
        <ManualCalcModal
          onClose={() => setCalcModalOpen(false)}
          onCalculated={() => { setCalcModalOpen(false); fetchList() }}
        />
      )}
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
  const [loading, setLoading] = useState(false)
  const [calcEmpId, setCalcEmpId] = useState<number | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const [resignedRes, confirmedRes] = await Promise.all([
        // 퇴직 완료 (Employee.empStatus = RESIGNED)
        fetchEmployeeList({ empStatus: 'RESIGNED', keyword: keyword || undefined, size: 50 })
          .catch(err => { console.error('퇴직자 목록 조회 실패:', err); return { content: [] } }),
        // 퇴직 확정(Resign.retireStatus = CONFIRMED, 퇴직예정일 대기) — 사전 산정 대상
        resignApi.getList({ empStatus: 'CONFIRMED', keyword: keyword || undefined, size: 50 })
          .then(r => r.data)
          .catch(err => { console.error('확정 퇴직자 목록 조회 실패:', err); return { content: [] } }),
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
      const unique = Array.from(new Map(merged.map(c => [c.empId, c])).values())
      setCandidates(unique)
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
    const desc = source === 'CONFIRMED'
      ? '* 퇴직 확정(CONFIRMED) 상태의 사원을 사전 산정합니다.\n* 퇴직 완료 시 자동으로 재산정되어 갱신됩니다.'
      : '* 자동 산정에서 누락된 퇴직자를 직접 산정합니다.\n* 이미 산정중(CALCULATING) 항목이 있으면 덮어씁니다.'
    if (!confirm(`${empName} 사원의 퇴직금을 산정하시겠습니까?\n\n${desc}`)) return
    setCalcEmpId(empId)
    try {
      await severanceApi.calculate({ empId })
      alert(`${empName} 사원의 퇴직금 산정이 완료되었습니다.`)
      onCalculated()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }, status?: number } }
      const msg = e?.response?.data?.message || ''
      const status = e?.response?.status
      if (msg.includes('SERVICE_PERIOD') || msg.includes('1년')) {
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
                {candidates.map(c => (
                  <tr key={c.empId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-center text-gray-600">{c.empNum}</td>
                    <td className="py-2.5 px-4 text-center text-gray-800 font-medium">{c.empName}</td>
                    <td className="py-2.5 px-4 text-center text-gray-600">{c.deptName || '-'}</td>
                    <td className="py-2.5 px-4 text-center text-gray-600">{c.gradeName || '-'}</td>
                    <td className="py-2.5 px-4 text-center text-gray-600">
                      <span className="text-[10px] text-gray-400 mr-1">{c.source === 'CONFIRMED' ? '예정' : '입사'}</span>
                      {c.primaryDate || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {c.source === 'CONFIRMED' ? (
                        <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-medium">사전 산정</span>
                      ) : (
                        <span className="text-[10px] text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 font-medium">퇴직</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleCalculate(c.empId, c.empName, c.source)}
                        disabled={calcEmpId === c.empId}
                        className="text-[10px] text-white bg-[#2e9e6e] rounded px-2.5 py-1 hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {calcEmpId === c.empId ? '산정 중...' : '산정'}
                      </button>
                    </td>
                  </tr>
                ))}
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
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">연차수당</span><span className="text-gray-800">{fmt(detail.annualLeaveAllowance)} 원</span></div>
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">평균 일당</span><span className="text-gray-800">{Number(detail.avgDailyWage).toLocaleString()} 원</span></div>
            </div>
          </section>

          {/* 산정 금액 */}
          <section>
            <h4 className="text-[12px] font-semibold text-gray-700 mb-2">산정 금액</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">퇴직금</span><span className="text-gray-800 font-medium">{fmt(detail.severanceAmount)} 원</span></div>
              <div className="flex px-4 py-2"><span className="w-32 text-gray-500">세액</span><span className="text-red-500">{fmt(detail.taxAmount)} 원</span></div>
              <div className="flex px-4 py-2 bg-[#f0f9f6]"><span className="w-32 text-[#2e9e6e] font-semibold">실지급액</span><span className="text-[#2e9e6e] font-bold">{fmt(detail.netAmount)} 원</span></div>
            </div>
          </section>

          {/* DC형 정보 */}
          {detail.retirementType === 'DC' && (
            <section>
              <h4 className="text-[12px] font-semibold text-gray-700 mb-2">DC형 정보</h4>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                <div className="flex px-4 py-2"><span className="w-32 text-gray-500">기적립 총액</span><span className="text-gray-800">{fmt(detail.dcDepositedTotal)} 원</span></div>
                <div className="flex px-4 py-2"><span className="w-32 text-gray-500">차액</span><span className={detail.dcDiffAmount > 0 ? 'text-red-500' : 'text-blue-500'}>{fmt(detail.dcDiffAmount)} 원</span></div>
              </div>
            </section>
          )}

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
