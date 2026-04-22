import { useState } from 'react'

// 목 데이터 (백엔드 연결 전)
interface DepositItem {
  depId: number
  empId: number
  empName: string
  deptName: string
  payYearMonth: string
  baseAmount: number
  depositAmount: number
  depStatus: 'COMPLETED' | 'PENDING'
  depositDate: string
  payrollRunId: number | null
  isManual: boolean
}

const MOCK_DEPOSITS: DepositItem[] = [
  { depId: 1, empId: 1, empName: '김민수', deptName: '개발팀', payYearMonth: '2026-03', baseAmount: 4000000, depositAmount: 333333, depStatus: 'COMPLETED', depositDate: '2026-03-25 09:00', payrollRunId: 12, isManual: false },
  { depId: 2, empId: 2, empName: '이서연', deptName: '인사팀', payYearMonth: '2026-03', baseAmount: 4666667, depositAmount: 388888, depStatus: 'COMPLETED', depositDate: '2026-03-25 09:00', payrollRunId: 12, isManual: false },
  { depId: 3, empId: 1, empName: '김민수', deptName: '개발팀', payYearMonth: '2026-02', baseAmount: 4000000, depositAmount: 333333, depStatus: 'COMPLETED', depositDate: '2026-02-25 09:00', payrollRunId: 11, isManual: false },
  { depId: 4, empId: 3, empName: '박지훈', deptName: '마케팅팀', payYearMonth: '2026-01', baseAmount: 3000000, depositAmount: 250000, depStatus: 'COMPLETED', depositDate: '2026-02-10 15:30', payrollRunId: null, isManual: true },
]

function fmt(n: number) { return n.toLocaleString() }

export default function PensionDeposits() {
  const [fromYm, setFromYm] = useState('2026-01')
  const [toYm, setToYm] = useState('2026-03')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'COMPLETED' | 'PENDING'>('')
  const [manualModalOpen, setManualModalOpen] = useState(false)

  // 필터링
  const filtered = MOCK_DEPOSITS.filter(d => {
    if (d.payYearMonth < fromYm || d.payYearMonth > toYm) return false
    if (search && !d.empName.includes(search)) return false
    if (statusFilter && d.depStatus !== statusFilter) return false
    return true
  })

  const totalEmployees = new Set(filtered.map(d => d.empId)).size
  const totalAmount = filtered.reduce((a, d) => a + d.depositAmount, 0)
  const months = new Set(filtered.map(d => d.payYearMonth)).size
  const monthlyAvg = months > 0 ? Math.round(totalAmount / months) : 0
  const grandTotal = MOCK_DEPOSITS.filter(d => d.depStatus === 'COMPLETED').reduce((a, d) => a + d.depositAmount, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직연금 적립 내역</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직연금 적립 내역 (DC형)</h1>
        <p className="text-xs text-gray-500 mb-5">회사 전체 DC형 사원의 퇴직연금 적립 이력을 조회·관리합니다.</p>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-5 text-xs flex-wrap">
          <span className="text-gray-500">적립 기간</span>
          <input type="month" value={fromYm} onChange={e => setFromYm(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <span className="text-gray-400">~</span>
          <input type="month" value={toYm} onChange={e => setToYm(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="사원명..." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-32" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | 'COMPLETED' | 'PENDING')} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="">전체 상태</option>
            <option value="COMPLETED">적립완료</option>
            <option value="PENDING">취소</option>
          </select>
          <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">
            <i className="fas fa-search text-[10px] mr-1" />조회
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setManualModalOpen(true)} className="px-3 py-1.5 text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]">
              <i className="fas fa-plus text-[10px] mr-1" />수동 적립 등록
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{totalEmployees} <span className="text-sm font-normal">명</span></div>
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

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1 mb-4">
          <p className="font-semibold">ℹ️ 안내</p>
          <p>• <strong>자동 적립</strong>은 매월 급여 지급처리 완료 시 해당 사원의 DC 계좌에 기록됩니다.</p>
          <p>• <strong>수동 적립 등록</strong>은 자동 적립이 누락되었거나 소급 반영이 필요할 때만 사용하세요.</p>
          <p>• 적립 <strong>취소</strong> 시 상태가 <strong>PENDING</strong>으로 전환됩니다 (감사 목적상 실제 삭제되지 않음).</p>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">적립월</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">기준임금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">적립금액</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">구분</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">상태</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">적립일시</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-gray-400">조회된 적립 내역이 없습니다.</td></tr>
              ) : filtered.map(d => (
                <tr key={d.depId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-blue-600 cursor-pointer hover:underline">{d.empName}</td>
                  <td className="py-2.5 px-3 text-gray-600">{d.deptName}</td>
                  <td className="py-2.5 px-3 text-gray-600">{d.payYearMonth}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{fmt(d.baseAmount)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-800">{fmt(d.depositAmount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    {d.isManual ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">수동</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">자동 · #{d.payrollRunId}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.depStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.depStatus === 'COMPLETED' ? '적립완료' : '취소'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{d.depositDate}</td>
                  <td className="py-2.5 px-3 text-center">
                    {d.depStatus === 'COMPLETED' && (
                      <button className="text-[10px] text-red-500 border border-red-200 rounded px-2 py-0.5 hover:bg-red-50">취소</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-gray-400 mt-4">
          ※ 본 화면은 백엔드 API 연결 전 목(mock) 데이터입니다. 백엔드 구현 완료 후 실제 데이터로 연결됩니다.
        </p>
      </div>

      {manualModalOpen && (
        <ManualDepositModal onClose={() => setManualModalOpen(false)} />
      )}
    </div>
  )
}

// ── 수동 적립 등록 모달 ──
function ManualDepositModal({ onClose }: { onClose: () => void }) {
  const [empName, setEmpName] = useState('')
  const [payYearMonth, setPayYearMonth] = useState('2026-03')
  const [baseAmount, setBaseAmount] = useState(0)
  const [depositAmount, setDepositAmount] = useState(0)
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    // TODO: POST /pay/admin/pension-deposits
    alert(`수동 적립 등록 (목업)\n사원: ${empName}\n월: ${payYearMonth}\n적립금액: ${depositAmount.toLocaleString()}원`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[460px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">수동 적립 등록</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-3 text-xs">
          <div>
            <label className="text-gray-500 mb-1 block">사원명 <span className="text-red-500">*</span></label>
            <input type="text" value={empName} onChange={e => setEmpName(e.target.value)} placeholder="사원명 검색" className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e]" />
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">적립 기준월 <span className="text-red-500">*</span></label>
            <input type="month" value={payYearMonth} onChange={e => setPayYearMonth(e.target.value)} className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e]" />
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">기준임금 <span className="text-red-500">*</span></label>
            <input type="number" value={baseAmount} onChange={e => setBaseAmount(Number(e.target.value))} className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e] text-right" />
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">적립금액 <span className="text-red-500">*</span></label>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e] text-right" />
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
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">취소</button>
          <button onClick={handleSubmit} disabled={!empName || !depositAmount || !reason} className="px-4 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed">등록</button>
        </div>
      </div>
    </div>
  )
}
