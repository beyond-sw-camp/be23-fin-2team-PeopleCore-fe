import { useState } from 'react'

interface PayrollEmployee {
  name: string; dept: string; rank: string; type: string; hireDate: string
  basePay: number; overtimePay: number; nightPay: number; holidayPay: number; annualPay: number; bonusPay: number; eduSupport: number; mealPay: number
  incomeTax: number; localIncomeTax: number; nationalPension: number; healthInsurance: number; longTermCare: number; employmentInsurance: number; studentLoan: number
  totalPay: number; totalDeduct: number; netPay: number; unpaid: number
  payStatus: '산정중' | '확정' | '승인요청' | '지급완료'
}

const MOCK_DATA: PayrollEmployee[] = [
  { name: '김민수', dept: '개발팀', rank: '대리', type: '정규', hireDate: '2022-03-02',
    basePay: 3500000, overtimePay: 200000, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 0, mealPay: 200000,
    incomeTax: 156000, localIncomeTax: 15600, nationalPension: 180000, healthInsurance: 137700, longTermCare: 17640, employmentInsurance: 35100, studentLoan: 0,
    totalPay: 3900000, totalDeduct: 542040, netPay: 3357960, unpaid: 3357960, payStatus: '산정중' },
  { name: '이서연', dept: '인사팀', rank: '과장', type: '정규', hireDate: '2020-07-15',
    basePay: 4200000, overtimePay: 150000, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 0, mealPay: 200000,
    incomeTax: 198000, localIncomeTax: 19800, nationalPension: 207000, healthInsurance: 158400, longTermCare: 20280, employmentInsurance: 40500, studentLoan: 0,
    totalPay: 4550000, totalDeduct: 643980, netPay: 3906020, unpaid: 3906020, payStatus: '산정중' },
  { name: '박지훈', dept: '마케팅팀', rank: '사원', type: '계약', hireDate: '2023-09-01',
    basePay: 2700000, overtimePay: 100000, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 0, mealPay: 200000,
    incomeTax: 89000, localIncomeTax: 8900, nationalPension: 135000, healthInsurance: 103200, longTermCare: 13200, employmentInsurance: 27000, studentLoan: 0,
    totalPay: 3000000, totalDeduct: 376300, netPay: 2623700, unpaid: 2623700, payStatus: '산정중' },
  { name: '최유진', dept: '영업팀', rank: '주임', type: '정규', hireDate: '2021-11-10',
    basePay: 3000000, overtimePay: 180000, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 0, mealPay: 200000,
    incomeTax: 112000, localIncomeTax: 11200, nationalPension: 153000, healthInsurance: 117000, longTermCare: 14970, employmentInsurance: 30600, studentLoan: 0,
    totalPay: 3380000, totalDeduct: 438770, netPay: 2941230, unpaid: 2941230, payStatus: '산정중' },
  { name: '정하은', dept: '재무팀', rank: '차장', type: '정규', hireDate: '2018-04-20',
    basePay: 4800000, overtimePay: 200000, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 100000, mealPay: 200000,
    incomeTax: 285000, localIncomeTax: 28500, nationalPension: 243000, healthInsurance: 185760, longTermCare: 23760, employmentInsurance: 47520, studentLoan: 0,
    totalPay: 5300000, totalDeduct: 813540, netPay: 4486460, unpaid: 4486460, payStatus: '산정중' },
  { name: '윤재혁', dept: '개발팀', rank: '부장', type: '정규', hireDate: '2015-02-16',
    basePay: 5800000, overtimePay: 300000, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 100000, mealPay: 200000,
    incomeTax: 420000, localIncomeTax: 42000, nationalPension: 288000, healthInsurance: 220200, longTermCare: 28200, employmentInsurance: 57600, studentLoan: 0,
    totalPay: 6400000, totalDeduct: 1056000, netPay: 5344000, unpaid: 5344000, payStatus: '산정중' },
]

function fmt(n: number) { return n.toLocaleString() }

// 빈 데이터 (직원 리스트만 있고 금액은 0)
const EMPTY_DATA: PayrollEmployee[] = MOCK_DATA.map(e => ({
  ...e, basePay: 0, overtimePay: 0, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 0, mealPay: 0,
  incomeTax: 0, localIncomeTax: 0, nationalPension: 0, healthInsurance: 0, longTermCare: 0, employmentInsurance: 0, studentLoan: 0,
  totalPay: 0, totalDeduct: 0, netPay: 0, unpaid: 0, payStatus: '산정중' as const,
}))

export default function PayrollLedger() {
  const [yearMonth, setYearMonth] = useState('2026-04')
  const [data, setData] = useState<PayrollEmployee[]>(EMPTY_DATA)
  const [selected, setSelected] = useState<PayrollEmployee | null>(null)
  const [editPay, setEditPay] = useState({ basePay: 0, overtimePay: 0, nightPay: 0, holidayPay: 0, annualPay: 0, bonusPay: 0, eduSupport: 0, mealPay: 0, incomeTax: 0, localIncomeTax: 0, nationalPension: 0, healthInsurance: 0, longTermCare: 0, employmentInsurance: 0, studentLoan: 0 })
  const [, setCopied] = useState(false)
  const [checkedNames, setCheckedNames] = useState<string[]>([])
  const [appliedIndexes, setAppliedIndexes] = useState<number[]>([])

  const toggleCheck = (name: string) => {
    setCheckedNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }
  const toggleAll = () => {
    if (checkedNames.length === data.length) setCheckedNames([])
    else setCheckedNames(data.map(e => e.name))
  }

  // 산정중 → 확정
  const handleConfirm = () => {
    const targets = checkedNames.length > 0 ? checkedNames : data.map(e => e.name)
    setData(prev => prev.map(e => targets.includes(e.name) && e.payStatus === '산정중' ? { ...e, payStatus: '확정' } : e))
    setCheckedNames([])
  }

  // 확정 → 승인요청 (전자결재)
  const handleApproval = () => {
    const targets = checkedNames.length > 0 ? checkedNames : data.map(e => e.name)
    setData(prev => prev.map(e => targets.includes(e.name) && e.payStatus === '확정' ? { ...e, payStatus: '승인요청' } : e))
    setCheckedNames([])
  }

  // 승인요청 → 지급완료
  const handlePaySelected = () => {
    const targets = checkedNames.length > 0 ? checkedNames : data.map(e => e.name)
    setData(prev => prev.map(e => targets.includes(e.name) && e.payStatus === '승인요청' ? { ...e, payStatus: '지급완료', unpaid: 0 } : e))
    setCheckedNames([])
  }

  const parseNum = (s: string) => Number(s.replace(/,/g, '').replace(/[^0-9]/g, '')) || 0
  const calcNet = () => {
    const pay = editPay.basePay + editPay.overtimePay + editPay.nightPay + editPay.holidayPay + editPay.annualPay + editPay.bonusPay + editPay.eduSupport + editPay.mealPay
    const ded = editPay.incomeTax + editPay.localIncomeTax + editPay.nationalPension + editPay.healthInsurance + editPay.longTermCare + editPay.employmentInsurance + editPay.studentLoan
    return pay - ded
  }

  const handleSelectEmp = (emp: PayrollEmployee) => {
    setSelected(emp)
    setAppliedIndexes([])
    setEditPay({ basePay: emp.basePay, overtimePay: emp.overtimePay, nightPay: emp.nightPay, holidayPay: emp.holidayPay, annualPay: emp.annualPay, bonusPay: emp.bonusPay, eduSupport: emp.eduSupport, mealPay: emp.mealPay, incomeTax: emp.incomeTax, localIncomeTax: emp.localIncomeTax, nationalPension: emp.nationalPension, healthInsurance: emp.healthInsurance, longTermCare: emp.longTermCare, employmentInsurance: emp.employmentInsurance, studentLoan: emp.studentLoan })
  }

  const handleSaveDetail = () => {
    if (!selected) return
    const pay = editPay.basePay + editPay.overtimePay + editPay.nightPay + editPay.holidayPay + editPay.annualPay + editPay.bonusPay + editPay.eduSupport + editPay.mealPay
    const ded = editPay.incomeTax + editPay.localIncomeTax + editPay.nationalPension + editPay.healthInsurance + editPay.longTermCare + editPay.employmentInsurance + editPay.studentLoan
    const net = pay - ded
    setData(prev => prev.map(e => e.name === selected.name ? { ...e, ...editPay, totalPay: pay, totalDeduct: ded, netPay: net, unpaid: net } : e))
    setSelected(null)
  }

  const handleDownloadExcel = () => {
    // CSV 형태로 대량이체 파일 생성
    const header = '사원명,부서,은행,계좌번호,지급액'
    const rows = data
      .filter(e => e.netPay > 0)
      .map(e => `${e.name},${e.dept},,${e.netPay}`) // 은행/계좌는 백엔드 연동 후
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `급여대량이체_${yearMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyPrevMonth = () => {
    // 전월 데이터(MOCK_DATA)를 현재 월로 복사
    setData(MOCK_DATA.map(e => ({ ...e })))
    setSelected(null)
    setCopied(true)
  }

  const totalPay = data.reduce((a, e) => a + e.totalPay, 0)
  const totalDeduct = data.reduce((a, e) => a + e.totalDeduct, 0)
  const totalNet = data.reduce((a, e) => a + e.netPay, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 급여대장(작성){selected && ` > ${selected.name}`}</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">급여대장(작성)</h1>
        <p className="text-xs text-gray-500 mb-5">월별 급여대장을 작성하고 관리합니다.</p>

        {!selected && (
        <>
        {/* 상단 컨트롤 */}
        <div className="flex items-center gap-3 mb-4">
          <input type="month" value={yearMonth} onChange={e => { setYearMonth(e.target.value); setData(EMPTY_DATA.map(d => ({ ...d }))); setSelected(null); setCopied(false); setCheckedNames([]) }} className="text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <button onClick={handleCopyPrevMonth} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors">
            <i className="fas fa-copy text-[10px] mr-1" />전월 복사
          </button>
          <button onClick={handleConfirm} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors">
            <i className="fas fa-check text-[10px] mr-1" />확정
          </button>
          <button onClick={handleApproval} className="px-3 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]">
            <i className="fas fa-file-signature text-[10px] mr-1" />전자결재
          </button>
          <button onClick={handlePaySelected} className="px-3 py-1.5 text-xs text-white bg-[#3b82f6] rounded hover:bg-[#2563eb]">
            <i className="fas fa-coins text-[10px] mr-1" />지급처리
          </button>
          <button onClick={handleDownloadExcel} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors">
            <i className="fas fa-file-excel text-[10px] mr-1" />대량이체 파일
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">급여대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{data.length} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">세 전 총 지급합계</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(totalPay)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">공제합계</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(totalDeduct)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">공제 후 지급액</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(totalNet)} <span className="text-sm font-normal">원</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">미지급 급여</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(totalNet)} <span className="text-sm font-normal">원</span></div>
          </div>
        </div>
        </>
        )}

        {!selected ? (
        <div className="flex gap-4">
          {/* 좌: 목록 */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2 px-2 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={checkedNames.length === data.length && data.length > 0} onChange={toggleAll} /></th>
                  <th className="py-2 px-2 text-left font-medium text-gray-500">상태</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-500">사원명</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-500">부서</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-500">직위</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-500">직원구분</th>
                  <th className="py-2 px-2 text-right font-medium text-gray-500">지급합계</th>
                  <th className="py-2 px-2 text-right font-medium text-gray-500">공제합계</th>
                  <th className="py-2 px-2 text-right font-medium text-gray-500">공제 후 지급액</th>
                  <th className="py-2 px-2 text-right font-medium text-gray-500">미지급</th>
                </tr>
              </thead>
              <tbody>
                {data.map((emp, i) => (
                  <tr key={i} onClick={() => handleSelectEmp(emp)} className={`border-b border-gray-50 cursor-pointer transition-colors ${selected?.name === emp.name ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-2 px-2"><input type="checkbox" className="w-3 h-3" checked={checkedNames.includes(emp.name)} onChange={() => toggleCheck(emp.name)} onClick={e => e.stopPropagation()} /></td>
                    <td className="py-2 px-2"><span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      emp.payStatus === '산정중' ? 'bg-yellow-100 text-yellow-700' :
                      emp.payStatus === '확정' ? 'bg-orange-100 text-orange-700' :
                      emp.payStatus === '승인요청' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>{emp.payStatus}</span></td>
                    <td className="py-2 px-2 text-blue-600">{emp.name}</td>
                    <td className="py-2 px-2 text-gray-600">{emp.dept}</td>
                    <td className="py-2 px-2 text-gray-600">{emp.rank}</td>
                    <td className="py-2 px-2 text-gray-600">{emp.type}</td>
                    <td className="py-2 px-2 text-right">{fmt(emp.totalPay)}</td>
                    <td className="py-2 px-2 text-right">{fmt(emp.totalDeduct)}</td>
                    <td className="py-2 px-2 text-right">{fmt(emp.netPay)}</td>
                    <td className="py-2 px-2 text-right">{fmt(emp.unpaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
        ) : (
          /* 전체 화면 상세 편집 */
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelected(null)} className="text-xs text-gray-600 border border-gray-200 rounded px-2.5 py-1 hover:bg-gray-50">
                  <i className="fas fa-arrow-left text-[10px] mr-1" />목록으로
                </button>
                <div className="text-sm">
                  <span className="text-gray-500">사원명</span> <span className="font-bold ml-1">{selected.name}</span>
                  <span className="text-gray-500 ml-4">부서</span> <span className="font-bold ml-1">{selected.dept}</span>
                  <span className="text-gray-500 ml-4">직위</span> <span className="font-bold ml-1">{selected.rank}</span>
                  <span className="text-gray-500 ml-4">구분</span> <span className="font-bold ml-1">{selected.type}</span>
                  <span className="text-gray-500 ml-4">입사일</span> <span className="font-bold ml-1">{selected.hireDate}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 px-6 py-5">
              {/* 좌측(2/3): 지급/공제 입력 */}
              <div className="col-span-2 space-y-5">
                {/* 지급항목 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 flex items-center justify-between">
                    <span><i className="fas fa-arrow-up text-[10px] text-blue-500 mr-1.5" />지급항목</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 p-4 text-xs">
                    {([
                      { label: '기본급', key: 'basePay' },
                      { label: '연장근로수당', key: 'overtimePay' },
                      { label: '야간근로수당', key: 'nightPay' },
                      { label: '휴일근로수당', key: 'holidayPay' },
                      { label: '연차수당', key: 'annualPay' },
                      { label: '상여금', key: 'bonusPay' },
                      { label: '교육비지원금', key: 'eduSupport' },
                      { label: '식대', key: 'mealPay' },
                    ] as const).map(item => (
                      <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-gray-600">{item.label}</span>
                        <input
                          type="text"
                          value={fmt(editPay[item.key])}
                          onChange={e => setEditPay(prev => ({ ...prev, [item.key]: parseNum(e.target.value) }))}
                          className="w-32 text-right text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#2e9e6e]"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">지급항목 합계</span>
                    <span className="font-bold text-gray-800">{fmt(editPay.basePay + editPay.overtimePay + editPay.nightPay + editPay.holidayPay + editPay.annualPay + editPay.bonusPay + editPay.eduSupport + editPay.mealPay)} <span className="font-normal text-gray-500">원</span></span>
                  </div>
                </div>

                {/* 공제항목 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 flex items-center justify-between">
                    <span><i className="fas fa-arrow-down text-[10px] text-red-500 mr-1.5" />공제항목</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 p-4 text-xs">
                    {([
                      { label: '근로소득세', key: 'incomeTax' },
                      { label: '근로지방소득세', key: 'localIncomeTax' },
                      { label: '국민연금', key: 'nationalPension' },
                      { label: '건강보험', key: 'healthInsurance' },
                      { label: '장기요양보험', key: 'longTermCare' },
                      { label: '고용보험', key: 'employmentInsurance' },
                      { label: '학자금상환', key: 'studentLoan' },
                    ] as const).map(item => (
                      <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-gray-600">{item.label}</span>
                        <input
                          type="text"
                          value={fmt(editPay[item.key])}
                          onChange={e => setEditPay(prev => ({ ...prev, [item.key]: parseNum(e.target.value) }))}
                          className="w-32 text-right text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#2e9e6e]"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">공제항목 합계</span>
                    <span className="font-bold text-red-500">{fmt(editPay.incomeTax + editPay.localIncomeTax + editPay.nationalPension + editPay.healthInsurance + editPay.longTermCare + editPay.employmentInsurance + editPay.studentLoan)} <span className="font-normal text-gray-500">원</span></span>
                  </div>
                </div>

                {/* 공제 후 지급액 */}
                <div className="border border-[#2e9e6e] bg-[#f0f9f6] rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#2e9e6e]">공제 후 지급액</span>
                  <span className="text-lg font-bold text-[#2e9e6e]">{fmt(calcNet())} <span className="text-xs font-normal">원</span></span>
                </div>
              </div>

              {/* 우측(1/3): 전자결재 참고 */}
              <div className="col-span-1 space-y-4">
                {/* 일당/시급 정보 */}
                {(() => {
                  // 월급 기준 소정근로시간 209h (주 40h 기준) · 법정배율 1.5배
                  const hourlyRate = Math.round(selected.basePay > 0 ? selected.basePay / 209 : (selected.totalPay || 3000000) / 209)
                  const dailyRate = hourlyRate * 8
                  const hourlyOT = Math.round(hourlyRate * 1.5)
                  return (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200">
                        <i className="fas fa-calculator text-[10px] text-[#2e9e6e] mr-1.5" />
                        일당/시급 기준
                      </div>
                      <div className="p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">시급</span>
                          <span className="font-medium text-gray-800">{fmt(hourlyRate)} 원</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">일당 (8h)</span>
                          <span className="font-medium text-gray-800">{fmt(dailyRate)} 원</span>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                          <span className="text-gray-500">연장/야간/휴일(1.5배)</span>
                          <span className="font-medium text-[#2e9e6e]">{fmt(hourlyOT)} 원/h</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {(() => {
                  const hourlyRate = Math.round(selected.basePay > 0 ? selected.basePay / 209 : (selected.totalPay || 3000000) / 209)
                  const hourlyOT = Math.round(hourlyRate * 1.5)
                  const approvals = [
                    { type: '연장근로', key: 'overtimePay' as const, date: '2026-04-05', hours: 2 },
                    { type: '연장근로', key: 'overtimePay' as const, date: '2026-04-12', hours: 3 },
                    { type: '야간근로', key: 'nightPay' as const, date: '2026-04-18', hours: 2 },
                    { type: '휴일근로', key: 'holidayPay' as const, date: '2026-04-20', hours: 4 },
                  ]
                  const totalHours = approvals.reduce((a, b) => a + b.hours, 0)
                  const totalAmount = totalHours * hourlyOT

                  const applyAll = () => {
                    const byKey: Record<string, number> = {}
                    approvals.forEach((a, i) => {
                      if (!appliedIndexes.includes(i)) byKey[a.key] = (byKey[a.key] || 0) + a.hours * hourlyOT
                    })
                    setEditPay(prev => ({
                      ...prev,
                      overtimePay: (prev.overtimePay || 0) + (byKey.overtimePay || 0),
                      nightPay: (prev.nightPay || 0) + (byKey.nightPay || 0),
                      holidayPay: (prev.holidayPay || 0) + (byKey.holidayPay || 0),
                    }))
                    setAppliedIndexes(approvals.map((_, i) => i))
                  }

                  const applyOne = (idx: number, key: 'overtimePay' | 'nightPay' | 'holidayPay', amount: number) => {
                    setEditPay(prev => ({ ...prev, [key]: (prev[key] || 0) + amount }))
                    setAppliedIndexes(prev => [...prev, idx])
                  }

                  const allApplied = appliedIndexes.length === approvals.length

                  return (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 flex items-center justify-between">
                        <span><i className="fas fa-file-signature text-[10px] text-[#2e9e6e] mr-1.5" />이달 승인된 전자결재</span>
                        <button
                          onClick={applyAll}
                          disabled={allApplied}
                          className={`text-[10px] rounded px-2 py-0.5 ${allApplied ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white bg-[#2e9e6e] hover:bg-[#26865d]'}`}
                        >
                          {allApplied ? '적용완료' : '전체 적용'}
                        </button>
                      </div>
                      <div className="p-3 space-y-2 text-xs">
                        {approvals.map((item, i) => {
                          const amount = item.hours * hourlyOT
                          const applied = appliedIndexes.includes(i)
                          return (
                            <div key={i} className="flex items-center gap-2 border border-gray-100 rounded px-3 py-2 hover:bg-gray-50">
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-800 font-medium">{item.type}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{item.date}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-[#2e9e6e] font-semibold">{item.hours}시간</div>
                                <div className="text-[10px] text-gray-500">{fmt(amount)}원</div>
                              </div>
                              <button
                                onClick={() => applyOne(i, item.key, amount)}
                                disabled={applied}
                                className={`shrink-0 text-[10px] border rounded px-2 py-1 ${applied ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'text-[#2e9e6e] border-[#2e9e6e] hover:bg-[#f0f9f6]'}`}
                              >
                                {applied ? '완료' : '적용'}
                              </button>
                            </div>
                          )
                        })}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs font-semibold">
                          <span className="text-gray-600">합계 ({totalHours}시간)</span>
                          <span className="text-gray-800">{fmt(totalAmount)} 원</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1">
                  <p className="font-semibold">ℹ️ 참고사항</p>
                  <p>• 승인된 연장/야간/휴일근로 시간은 법정수당 계산에 반영됩니다.</p>
                  <p>• 시급 = 기본급 ÷ 209시간, 법정배율 1.5배를 적용합니다.</p>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="px-5 py-2 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleSaveDetail} className="px-5 py-2 text-xs font-medium text-white bg-[#2e9e6e] rounded hover:bg-[#26865d] transition-colors">
                <i className="fas fa-save text-[10px] mr-1" />저장
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
