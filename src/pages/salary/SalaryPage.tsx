import { useState, useRef, useEffect, useCallback } from 'react'
import {
  mySalaryApi,
  type MySalaryInfoRes,
  type PayStubListRes,
  type PayStubDetailRes,
  type PensionInfoRes,
  type MySeveranceEstimateRes,
} from '../../api/mypay'
import { taxExemptHintText } from '../../utils/usePayItemLimits'
import { resolveProfileImageUrl } from '../../utils/profileImage'

type RetirementType = 'severance' | 'DB' | 'DC'
type RetirementTab = 'severance' | 'pension'

function formatMoney(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '0원'
  return amount.toLocaleString('ko-KR') + '원'
}

function formatDate(s: string | null | undefined) {
  if (!s) return '-'
  // ISO datetime → "YYYY-MM-DD"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : s
}

function formatYearMonth(ym: string) {
  // "2026-03" → "2026년 3월"
  const m = ym.match(/^(\d{4})-(\d{2})$/)
  return m ? `${m[1]}년 ${parseInt(m[2], 10)}월` : ym
}

// ── 비밀번호 입력 화면 ──
// TODO: PIN 설정/검증 기능 구현 후 SalaryPage 에서 렌더링 복구 예정
function PasswordScreen({ onSuccess }: { onSuccess: () => void }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    setError('')
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
    if (e.key === 'Enter' && digits.every(d => d)) {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (digits.some(d => !d)) {
      setError('4자리 숫자를 모두 입력해주세요.')
      return
    }
    // 백엔드 PIN 검증 전: 일단 통과
    onSuccess()
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 w-[min(420px,calc(100vw-24px))] text-center">
        <div className="w-16 h-16 bg-[#f0f9f6] rounded-full flex items-center justify-center mx-auto mb-5">
          <i className="fas fa-lock text-[#2e9e6e] text-xl" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">급여 조회</h2>
        <p className="text-xs text-gray-500 mb-1">급여 조회를 위해 기존에 설정한</p>
        <p className="text-xs text-gray-500 mb-6">간편 비밀번호(숫자 4자리)를 입력해 주세요.</p>

        <div className="flex items-center justify-center gap-3 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-[#2e9e6e] focus:ring-1 focus:ring-[#2e9e6e] outline-none transition-colors"
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <p className="text-[11px] text-gray-400 mb-6">
          * 설정 &gt; 보안관리/간편비밀번호관리에서 변경할 수 있습니다.
        </p>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-[#2e9e6e] text-white text-sm font-medium rounded-lg hover:bg-[#26865d] transition-colors"
        >
          급여 조회
        </button>
      </div>
    </div>
  )
}

// ── 연도 선택 팝업 ──
function YearPicker({ year, onChange, onClose }: { year: number; onChange: (y: number) => void; onClose: () => void }) {
  const [page, setPage] = useState(Math.floor(year / 10) * 10)
  const years = Array.from({ length: 10 }, (_, i) => page + i)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-[180px]">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setPage(p => p - 10)} className="text-gray-400 hover:text-gray-600 text-xs px-1">«</button>
        <span className="text-xs font-medium text-gray-600">{page} - {page + 9}</span>
        <button onClick={() => setPage(p => p + 10)} className="text-gray-400 hover:text-gray-600 text-xs px-1">»</button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {years.map(y => (
          <button
            key={y}
            onClick={() => { onChange(y); onClose() }}
            className={`py-1.5 rounded text-xs transition-colors ${
              y === year
                ? 'bg-[#2e9e6e] text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
        <button onClick={() => { onChange(year); onClose() }} className="flex-1 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-700">확인</button>
        <button onClick={onClose} className="flex-1 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-700">취소</button>
      </div>
    </div>
  )
}

// ── 내 급여 조회 ──
function MySalaryView() {
  const [info, setInfo] = useState<MySalaryInfoRes | null>(null)
  const [stubList, setStubList] = useState<PayStubListRes[]>([])
  const [selectedStubId, setSelectedStubId] = useState<number | null>(null)
  const [stubDetail, setStubDetail] = useState<PayStubDetailRes | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [infoOpen, setInfoOpen] = useState(true)
  const [yearPickerOpen, setYearPickerOpen] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [loadingList, setLoadingList] = useState(false)

  // 내 급여 정보 로드
  const fetchInfo = useCallback(() => {
    setLoadingInfo(true)
    mySalaryApi.getInfo()
      .then(setInfo)
      .catch(err => {
        console.error('내 급여 정보 조회 실패:', err)
        setInfo(null)
      })
      .finally(() => setLoadingInfo(false))
  }, [])

  useEffect(() => { fetchInfo() }, [fetchInfo])

  // 연도별 명세서 목록 로드
  const fetchStubList = useCallback(() => {
    setLoadingList(true)
    mySalaryApi.getStubList(year)
      .then(list => {
        setStubList(list)
        // 첫 번째 항목 자동 선택
        if (list.length > 0 && !list.find(s => s.stubId === selectedStubId)) {
          setSelectedStubId(list[0].stubId)
        } else if (list.length === 0) {
          setSelectedStubId(null)
          setStubDetail(null)
        }
      })
      .catch(err => {
        console.error('명세서 목록 조회 실패:', err)
        setStubList([])
        setSelectedStubId(null)
        setStubDetail(null)
      })
      .finally(() => setLoadingList(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  useEffect(() => { fetchStubList() }, [fetchStubList])

  // 명세서 상세 로드
  useEffect(() => {
    if (selectedStubId === null) {
      setStubDetail(null)
      return
    }
    mySalaryApi.getStubDetail(selectedStubId)
      .then(setStubDetail)
      .catch(err => {
        console.error('명세서 상세 조회 실패:', err)
        setStubDetail(null)
      })
  }, [selectedStubId])

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-white">
      <div className="max-w-[1100px] mx-auto space-y-5">
        {/* 타이틀 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            내 급여 조회
            <span className="text-xs font-normal text-gray-400 ml-2">내 급여 정보와 급(상)여 명세서를 월별로 확인할 수 있습니다.</span>
          </h2>
        </div>

        {/* 사원 정보 카드 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex gap-5">
              <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {info?.profileImageUrl ? (
                  <img src={resolveProfileImageUrl(info.profileImageUrl)} alt={info.empName} className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-2xl text-gray-300" />
                )}
              </div>
              <div className="flex-1 grid grid-cols-3 gap-x-8 gap-y-2 text-xs">
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">이름</span><span className="font-medium text-gray-800">{info?.empName ?? '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">ID</span><span className="font-medium text-gray-800">{info?.empEmail ?? '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">직원구분</span><span className="font-medium text-gray-800">{info?.empType ?? '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">부서 / 직책</span><span className="font-medium text-gray-800">{info?.deptName ?? '-'} / {info?.titleName ?? '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">직위</span><span className="font-medium text-gray-800">{info?.gradeName ?? '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">입사일</span><span className="font-medium text-gray-800">{info?.empHireDate ?? '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">사원번호</span><span className="font-medium text-gray-800">{info?.empNum ?? '-'}</span></div>
                <div className="flex"><span className="text-gray-500 w-16 shrink-0">연락처</span><span className="font-medium text-gray-800">{info?.empPhone ?? '-'}</span></div>
              </div>
            </div>
          </div>

          {/* 급여상세 */}
          <div className="border-t border-gray-100">
            <div className="px-5 py-3">
              <h4 className="text-xs font-bold text-gray-700 mb-3">급여상세</h4>
              {loadingInfo ? (
                <div className="text-center text-xs text-gray-400 py-4">불러오는 중...</div>
              ) : (
                <>
                  <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">연봉</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2 text-right">{(info?.salaryInfo.annualSalary ?? 0).toLocaleString()}</td>
                        <td className="py-2 text-gray-500 pl-4">월급</td>
                        <td className="py-2 text-gray-800 bg-[#f8fffe] px-2 text-right">{(info?.salaryInfo.monthlySalary ?? 0).toLocaleString()}</td>
                        <td colSpan={2} />
                      </tr>
                      {(info?.salaryInfo.fixedAllowances ?? []).map((a, i, arr) => {
                        const hint = taxExemptHintText(a.taxExemptLimit, a.isTaxable)
                        return (
                          <tr key={a.payItemId} className="border-b border-gray-100">
                            {i === 0 && <td className="py-2 text-gray-500" rowSpan={arr.length}>고정수당</td>}
                            <td className="py-2 text-gray-600 pl-2">{a.payItemName}</td>
                            <td className="py-2 text-gray-800 pl-4 text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <span>{a.amount.toLocaleString()}</span>
                                {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
                              </div>
                            </td>
                            <td colSpan={3} />
                          </tr>
                        )
                      })}
                      {(info?.salaryInfo.fixedAllowances ?? []).length === 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-500">고정수당</td>
                          <td className="py-2 text-gray-400 pl-2" colSpan={5}>없음</td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">부양가족수</td>
                        <td className="py-2 text-gray-800 px-2">{info?.dependentsCount ?? 1}명</td>
                        <td className="py-2 text-[10px] text-gray-400" colSpan={4}>(본인 포함, 소득세 계산용)</td>
                      </tr>
                    </tbody>
                  </table>

                  <button
                    onClick={() => setInfoOpen(!infoOpen)}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-2 flex items-center gap-1 mx-auto"
                  >
                    {infoOpen ? '접기' : '자세히 보기'}
                    <i className={`fas fa-chevron-${infoOpen ? 'up' : 'down'} text-[9px]`} />
                  </button>

                  {infoOpen && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: '14%' }} />
                          <col style={{ width: '19%' }} />
                          <col style={{ width: '14%' }} />
                          <col style={{ width: '19%' }} />
                          <col style={{ width: '14%' }} />
                          <col style={{ width: '20%' }} />
                        </colgroup>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-500">급여은행</td>
                            <td className="py-2 text-gray-800">{info?.salaryAccount?.bankName ?? '미등록'}</td>
                            <td className="py-2 text-gray-500 pl-4">급여계좌</td>
                            <td className="py-2 text-gray-800" colSpan={3}>{info?.salaryAccount?.accountNumber ?? '미등록'}</td>
                          </tr>
                          {(() => {
                            // 1) 사원 본인 선택값 우선
                            // 2) 없으면 회사 설정으로 fallback (회사가 DB or DC일 때만 의미 있음)
                            const stored = info?.retirementAccount?.retirementType
                            const fallback = info?.companyPensionType === 'DB' ? 'DB'
                                           : info?.companyPensionType === 'DC' ? 'DC'
                                           : null
                            const empType = (stored === 'DB' || stored === 'DC')
                              ? stored
                              : fallback
                            // 운용사 = 회사 단일, 계좌 = 사원별 (DB/DC 공통)
                            const provider = info?.companyPensionProvider
                            const account = info?.retirementAccount?.accountNumber
                            const note = empType === 'DC'
                              ? 'DC형 (사원 본인 운용)'
                              : empType === 'DB' ? 'DB형 (회사 운용)' : ''
                            return (
                              <tr>
                                <td className="py-2 text-gray-500">퇴직연금 운용사</td>
                                <td className="py-2 text-gray-800">
                                  {provider ?? '미등록'}
                                  {note && <span className="ml-2 text-[10px] text-gray-400">{note}</span>}
                                </td>
                                <td className="py-2 text-gray-500 pl-4">퇴직연금계좌</td>
                                <td className="py-2 text-gray-800" colSpan={3}>{account ?? '미등록'}</td>
                              </tr>
                            )
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 급(상)여명세서 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-800">급(상)여명세서</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 border-l border-gray-300 pl-3 relative">
              <button
                onClick={() => setYearPickerOpen(!yearPickerOpen)}
                className="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 flex items-center gap-1"
              >
                {year} <i className="fas fa-calendar-alt text-[10px] text-gray-400" />
              </button>
              {yearPickerOpen && (
                <YearPicker
                  year={year}
                  onChange={setYear}
                  onClose={() => setYearPickerOpen(false)}
                />
              )}
              <button onClick={fetchStubList} className="px-1.5 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50">
                <i className="fas fa-search text-[10px]" /> 조회
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* 좌: 월별 목록 */}
            <div className="col-span-5">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-3 text-left font-medium text-gray-500">급(상)여월</th>
                      <th className="py-2 px-3 text-right font-medium text-gray-500">총 지급액</th>
                      <th className="py-2 px-3 text-right font-medium text-gray-500">총 공제액</th>
                      <th className="py-2 px-3 text-right font-medium text-gray-500">실수령액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingList ? (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400">불러오는 중...</td></tr>
                    ) : stubList.length > 0 ? stubList.map(stub => (
                      <tr
                        key={stub.stubId}
                        onClick={() => setSelectedStubId(stub.stubId)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          selectedStubId === stub.stubId ? 'bg-[#f0f9f6]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-gray-700">{formatYearMonth(stub.payYearMonth)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-700">{formatMoney(stub.totalPay)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-700">{formatMoney(stub.totalDeduction)}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-gray-800">{formatMoney(stub.netPay)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400">조회된 결과가 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 우: 명세서 상세 */}
            <div className="col-span-7">
              {stubDetail ? (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs">
                      <span className="text-gray-500 mr-4">사원명 <span className="font-medium text-gray-800 ml-1">{stubDetail.empName}</span></span>
                      <span className="text-gray-500">부서 <span className="font-medium text-gray-800 ml-1">{stubDetail.deptName ?? '-'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stubDetail.pdfUrl && (
                        <a href={stubDetail.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
                          <i className="fas fa-file-pdf text-[10px]" /> PDF 저장
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 지급 */}
                  <table className="w-full text-xs mb-3">
                    <tbody>
                      <tr className="bg-gray-50 border border-gray-200">
                        <td className="py-2 px-3 font-medium text-gray-700" colSpan={2}>지급항목</td>
                      </tr>
                      {stubDetail.paymentItems.map(item => {
                        const hint = taxExemptHintText(item.taxExemptLimit, item.isTaxable)
                        return (
                          <tr key={item.payItemId} className="border-x border-b border-gray-200">
                            <td className="py-1.5 px-3 text-gray-600 w-28">{item.payItemName}</td>
                            <td className="py-1.5 px-3 text-right text-gray-800">
                              <div className="flex flex-col items-end gap-0.5">
                                <span>{formatMoney(item.amount)}</span>
                                {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="border-x border-b border-gray-200 bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-700">총 지급액</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-800">{formatMoney(stubDetail.totalPay)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 공제 */}
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="bg-gray-50 border border-gray-200">
                        <td className="py-2 px-3 font-medium text-gray-700" colSpan={2}>공제항목</td>
                      </tr>
                      {stubDetail.deductionItems.map(item => (
                        <tr key={item.payItemId} className="border-x border-b border-gray-200">
                          <td className="py-1.5 px-3 text-gray-600 w-28">{item.payItemName}</td>
                          <td className="py-1.5 px-3 text-right text-gray-800">{formatMoney(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-x border-b border-gray-200 bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-700">총 공제액</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-800">{formatMoney(stubDetail.totalDeduction)}</td>
                      </tr>
                      <tr className="border-x border-b border-gray-200 bg-[#f0f9f6]">
                        <td className="py-2 px-3 font-bold text-gray-700">실수령액</td>
                        <td className="py-2 px-3 text-right font-bold text-[#2e9e6e]">{formatMoney(stubDetail.netPay)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-xs text-gray-400">
                  {selectedStubId !== null ? '명세서 불러오는 중...' : '월별 급여를 선택해주세요'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── 예상 퇴직금 조회 ──
function RetirementView() {
  const [pension, setPension] = useState<PensionInfoRes | null>(null)
  const [estimate, setEstimate] = useState<MySeveranceEstimateRes | null>(null)
  const [baseDate, setBaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [calculated, setCalculated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<RetirementTab>('severance')

  // 퇴직연금 정보는 진입 시 1회
  useEffect(() => {
    mySalaryApi.getPension()
      .then(setPension)
      .catch(err => {
        console.error('퇴직연금 조회 실패:', err)
        setPension(null)
      })
  }, [])

  const retirementType: RetirementType =
    (pension?.retirementType as RetirementType | undefined) ?? 'severance'

  // 탭 분기:
  // - severance: "근속기준 퇴직금 예상액" 단일 탭
  // - DB / DC : "근속기준 퇴직금 예상액" + "퇴직연금 적립금액" 두 탭
  const showPensionTab = retirementType === 'DB' || retirementType === 'DC'

  const handleCalculate = async () => {
    setLoading(true)
    setCalculated(true)
    try {
      const result = await mySalaryApi.getSeveranceEstimate(baseDate)
      setEstimate(result)
    } catch (err) {
      console.error('퇴직금 예상 조회 실패:', err)
      setEstimate(null)
    } finally {
      setLoading(false)
    }
  }

  const isEligible = (estimate?.serviceDays ?? 0) >= 365

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-white">
      <div className="max-w-[700px] mx-auto space-y-5">

        <div>
          <h2 className="text-lg font-bold text-gray-800">
            예상 퇴직금 조회
            <span className="text-xs font-normal text-gray-400 ml-2">
              퇴직금 예상액 및 퇴직연금 적립금액을 확인할 수 있습니다.
            </span>
          </h2>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('severance')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'severance'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            근속기준 퇴직금 예상액
          </button>
          {showPensionTab && (
            <button
              onClick={() => setActiveTab('pension')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'pension'
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {retirementType === 'DB' ? 'DB형 퇴직연금 적립' : 'DC형 퇴직연금 적립금액'}
            </button>
          )}
        </div>

        {/* ── 근속기준 탭 ── */}
        {activeTab === 'severance' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
              <p>- 예상되는 퇴사일자를 기준으로, 30일분 이상의 평균임금으로 퇴직금을 계산합니다.</p>
              <p>- 실제 산정되는 퇴직금과 차이가 발생할 수 있으므로 참고용입니다.</p>
              {retirementType === 'DC' && (
                <p className="text-[#2e9e6e]">
                  - DC형은 회사가 매월 적립하므로, 표시 금액은 <b>퇴사 시 회사가 추가로 부담할 금액</b>입니다.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-700 font-medium">
                예상 퇴사일 <span className="text-red-500">*</span>
              </span>
              <input
                type="date"
                value={baseDate}
                onChange={e => { setBaseDate(e.target.value); setCalculated(false) }}
                className="border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#2e9e6e]"
              />
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {loading ? '계산 중...' : '계산'}
              </button>
            </div>

            {/* 1년 미만 경고 */}
            {calculated && estimate && !isEligible && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-xs text-orange-700">
                <i className="fas fa-exclamation-circle" />
                1년 이상 근속 시 퇴직금이 발생합니다. (현재 근속: {estimate.serviceDays}일)
              </div>
            )}

            {/* 결과 테이블 */}
            {(!calculated || (estimate && isEligible)) && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      { label: '입사일', value: estimate?.hireDate ?? '' },
                      { label: '퇴직금 중간정산 여부', value: calculated ? '해당없음' : '' },
                      { label: '퇴직 정산기간', value: estimate ? `${estimate.hireDate} ~ ${estimate.baseDate}` : '' },
                      { label: '근속일수', value: estimate ? `${estimate.serviceDays.toLocaleString()} 일` : '' },
                      { label: '예상 퇴직일 이전 3개월 총 일수', value: estimate ? `${estimate.last3MonthDays} 일` : '' },
                      { label: '최근 3개월 급여 총액', value: estimate ? formatMoney(estimate.last3MonthPay) : '' },
                      { label: '직전 1년간 상여금 총액', value: estimate ? formatMoney(estimate.lastYearBonus) : '' },
                      { label: '연차수당', value: estimate ? formatMoney(estimate.annualLeaveAllowance) : '' },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-gray-200">
                        <td className="py-2.5 px-4 text-gray-600 w-56 bg-gray-50 font-medium text-right">
                          {row.label}
                        </td>
                        <td className="py-2.5 px-4 text-gray-800 bg-[#f0fdfa]">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {estimate && isEligible && (
                  <table className="w-full text-xs border-t-2 border-gray-300">
                    <tbody>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td className="py-3 px-4 text-gray-700 w-56 font-bold text-right">1일 평균임금</td>
                        <td className="py-3 px-4 font-bold text-gray-800 bg-[#f0fdfa]">{formatMoney(Math.round(estimate.avgDailyWage))}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4 text-gray-700 w-56 font-bold text-right">
                          {retirementType === 'DC' ? (
                            <>
                              회사 추가 부담액
                              <br />
                              <span className="text-xs font-normal text-gray-500">(예상퇴직금 − DC 적립액)</span>
                            </>
                          ) : '예상 퇴직금'}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#2e9e6e] text-base bg-[#f0fdfa]">
                          {formatMoney(estimate.displayAmount)}
                        </td>
                      </tr>
                      {retirementType === 'DC' && (
                        <>
                          <tr className="border-t border-gray-200 bg-white">
                            <td className="py-2 px-4 text-gray-500 w-56 text-right text-[11px]">참고 · 총 예상퇴직금</td>
                            <td className="py-2 px-4 text-gray-700 text-[11px]">{formatMoney(estimate.estimatedSeverance)}</td>
                          </tr>
                          <tr className="border-t border-gray-100 bg-white">
                            <td className="py-2 px-4 text-gray-500 w-56 text-right text-[11px]">참고 · 현재 DC 적립액</td>
                            <td className="py-2 px-4 text-gray-700 text-[11px]">{formatMoney(estimate.dcDepositedTotal)}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        {/* ── DB/DC 적립 탭 ── */}
        {activeTab === 'pension' && pension && (
          <>
            {pension.retirementType === 'DB' ? (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#f0f9f6] text-[#2e9e6e] flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-building-columns text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">회사 통합 운용</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      DB형은 회사가 퇴직연금을 통합 적립·운용하므로 개인별 누적 적립액은 표시하지 않습니다.
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      퇴직 시 예상 수령액은 <span className="font-medium text-gray-700">근속기준 퇴직금 예상액</span> 탭에서 확인해주세요.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
                <p>- 회사 퇴직연금 제도(DC형)에 따른 적립금액을 확인합니다.</p>
                <p>- 실제 적립 금액은 퇴직연금 운용사 기준이며, 차이가 발생할 수 있습니다.</p>
              </div>
            )}

            {pension.retirementType === 'DC' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 w-52 bg-gray-50 font-medium text-right">퇴직연금 유형</td>
                    <td className="py-2.5 px-4 text-gray-800">
                      DC형 (확정기여형)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">최근 적립일</td>
                    <td className="py-2.5 px-4 text-gray-800">{formatDate(pension.lastDepositDate)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">
                      월 적립액 (기준급여의 1/12)
                    </td>
                    <td className="py-2.5 px-4 text-gray-800">
                      {formatMoney(pension.monthlyDeposit)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full text-xs border-t-2 border-gray-300">
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 w-52 font-bold text-right">
                      누적 적립금액
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2e9e6e] text-base bg-[#f0fdfa]">
                      {formatMoney(pension.totalDeposited)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── 메인 급여 페이지 ──
type SalaryView = 'salary' | 'retirement'

export default function SalaryPage() {
  // TODO: PIN 설정/검증 기능 구현 후 아래 두 줄 복구
  // const [authenticated, setAuthenticated] = useState(false)
  const [activeView, setActiveView] = useState<SalaryView>('salary')
  const [sideOpen, setSideOpen] = useState(false)
  const selectView = (v: SalaryView) => { setActiveView(v); setSideOpen(false) }

  // TODO: PIN 기능 구현 시 아래 블록 주석 해제
  // if (!authenticated) {
  //   return <PasswordScreen onSuccess={() => setAuthenticated(true)} />
  // }

  // 미사용 경고 방지 — PIN 기능 복구 시 제거
  void PasswordScreen

  const sideContent = (
    <>
      <div className="p-4 border-b border-[#d1d5db] flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#000000]">급여</h2>
        <button
          type="button"
          onClick={() => setSideOpen(false)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="메뉴 닫기"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <nav className="p-2 space-y-0.5">
        <button
          onClick={() => selectView('salary')}
          className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
            activeView === 'salary'
              ? 'text-[#2e9e6e] font-medium bg-[#f0f9f6]'
              : 'text-[#374151] hover:bg-gray-50'
          }`}
        >
          내 급여 조회
        </button>
        <button
          onClick={() => selectView('retirement')}
          className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
            activeView === 'retirement'
              ? 'text-[#2e9e6e] font-medium bg-[#f0f9f6]'
              : 'text-[#374151] hover:bg-gray-50'
          }`}
        >
          예상 퇴직금 조회
        </button>
      </nav>
    </>
  )

  return (
    <div className="flex-1 flex overflow-hidden bg-white flex-col md:flex-row">
      {/* 모바일 토글 */}
      <div className="md:hidden flex items-center px-3 py-2 bg-white border-b border-[#d1d5db]">
        <button
          type="button"
          onClick={() => setSideOpen(true)}
          className="flex items-center gap-2 text-[13px] text-gray-700"
        >
          <i className="fa-solid fa-bars" />
          <span>메뉴</span>
        </button>
      </div>

      {/* 데스크톱 사이드바 */}
      <div className="hidden md:flex w-[220px] bg-white border-r border-[#d1d5db] flex-col shrink-0">
        {sideContent}
      </div>

      {/* 모바일 드로어 */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSideOpen(false)} />
          <div className="relative bg-white w-[260px] max-w-[80vw] flex flex-col h-full shadow-xl animate-in slide-in-from-left duration-200">
            {sideContent}
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0 flex overflow-hidden">
        {activeView === 'salary' ? <MySalaryView /> : <RetirementView />}
      </div>
    </div>
  )
}
