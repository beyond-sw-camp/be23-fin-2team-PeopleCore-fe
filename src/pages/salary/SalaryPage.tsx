import { useState, useRef, useEffect, useCallback } from 'react'
import {
  mySalaryApi,
  type MySalaryInfoRes,
  type PayStubListRes,
  type PayStubDetailRes,
  type PensionInfoRes,
  type MySeveranceEstimateRes,
} from '../../api/mypay'

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
    <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 w-[420px] text-center">
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

// ── 계좌변경 모달 ──
function AccountChangeModal({
  current,
  onClose,
  onSaved,
}: {
  current: MySalaryInfoRes['salaryAccount']
  onClose: () => void
  onSaved: () => void
}) {
  const [bank, setBank] = useState(current?.bankName ?? '')
  const [account, setAccount] = useState(current?.accountNumber ?? '')
  const [holder, setHolder] = useState(current?.accountHolder ?? '')
  const [verified, setVerified] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleVerify = () => {
    // 백엔드 계좌 인증 연동 전: 통과 처리
    setVerified(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await mySalaryApi.updateAccount({
        bankName: bank,
        accountNumber: account,
        accountHolder: holder,
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error('급여 계좌 변경 실패:', err)
      alert('급여 계좌 변경에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[420px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">급여 계좌 변경</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">은행</label>
            <select value={bank} onChange={e => { setBank(e.target.value); setVerified(false) }} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]">
              <option value="">선택</option>
              {['우리은행', '국민은행', '신한은행', '하나은행', '농협은행', 'IBK기업은행', 'SC제일은행', '카카오뱅크', '토스뱅크'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">계좌번호</label>
            <input type="text" value={account} onChange={e => { setAccount(e.target.value); setVerified(false) }} placeholder="계좌번호를 입력하세요" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">예금주</label>
            <input type="text" value={holder} onChange={e => setHolder(e.target.value)} placeholder="예금주명" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
          </div>

          {verified && (
            <div className="flex items-center gap-1.5 text-xs text-[#2e9e6e] bg-[#f0f9f6] rounded-lg px-3 py-2">
              <i className="fas fa-check-circle" /> 계좌 인증이 완료되었습니다.
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          {!verified ? (
            <button
              onClick={handleVerify}
              disabled={!bank || !account || !holder}
              className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] transition-colors disabled:opacity-40"
            >
              계좌 인증
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] transition-colors disabled:opacity-40"
            >
              {saving ? '저장 중...' : '변경 완료'}
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>
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
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [depModalOpen, setDepModalOpen] = useState(false)
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
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
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
                  <img src={info.profileImageUrl} alt={info.empName} className="w-full h-full object-cover" />
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
                <div className="flex items-center col-span-3">
                  <span className="text-gray-500 w-16 shrink-0">부양가족수</span>
                  <span className="font-medium text-gray-800 mr-2">{info?.dependentsCount ?? 1}명</span>
                  <span className="text-[10px] text-gray-400 mr-2">(본인 포함, 소득세 계산용)</span>
                  <button onClick={() => setDepModalOpen(true)} className="text-[10px] text-[#1D9E75] border border-[#1D9E75] rounded px-2 py-0.5 hover:bg-[#f0f9f6]">수정</button>
                </div>
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
                      {(info?.salaryInfo.fixedAllowances ?? []).map((a, i, arr) => (
                        <tr key={a.payItemId} className="border-b border-gray-100">
                          {i === 0 && <td className="py-2 text-gray-500" rowSpan={arr.length}>고정수당</td>}
                          <td className="py-2 text-gray-600 pl-2">{a.payItemName}</td>
                          <td className="py-2 text-gray-800 pl-4 text-right">{a.amount.toLocaleString()}</td>
                          <td colSpan={3} />
                        </tr>
                      ))}
                      {(info?.salaryInfo.fixedAllowances ?? []).length === 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-500">고정수당</td>
                          <td className="py-2 text-gray-400 pl-2" colSpan={5}>없음</td>
                        </tr>
                      )}
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
                            <td className="py-2 text-gray-800">{info?.salaryAccount?.accountNumber ?? '미등록'}</td>
                            <td className="py-2" colSpan={2}>
                              <button onClick={() => setAccountModalOpen(true)} className="text-[10px] text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">계좌변경</button>
                            </td>
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
                      {stubDetail.paymentItems.map(item => (
                        <tr key={item.payItemId} className="border-x border-b border-gray-200">
                          <td className="py-1.5 px-3 text-gray-600 w-28">{item.payItemName}</td>
                          <td className="py-1.5 px-3 text-right text-gray-800">{formatMoney(item.amount)}</td>
                        </tr>
                      ))}
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

      {accountModalOpen && (
        <AccountChangeModal
          current={info?.salaryAccount ?? null}
          onClose={() => setAccountModalOpen(false)}
          onSaved={fetchInfo}
        />
      )}

      {depModalOpen && (
        <MyDependentsModal
          currentValue={info?.dependentsCount ?? 1}
          onClose={() => setDepModalOpen(false)}
          onSaved={fetchInfo}
        />
      )}
    </div>
  )
}

// ── 부양가족수 변경 모달 (내 급여 화면 전용) ──
function MyDependentsModal({ currentValue, onClose, onSaved }: { currentValue: number; onClose: () => void; onSaved: () => void }) {
  const [count, setCount] = useState(currentValue)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    mySalaryApi.updateDependents(count)
      .then(() => { onSaved(); onClose() })
      .catch(err => {
        console.error('부양가족수 변경 실패:', err)
        alert('부양가족수 변경에 실패했습니다.')
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[360px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">부양가족수 변경</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">부양가족수 (본인 포함)</label>
            <input
              type="number"
              min={0}
              max={20}
              value={count}
              onChange={e => setCount(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
            />
          </div>
          <p className="text-[10px] text-gray-400">
            연말정산 시 인적공제 기준이 됩니다. 변경 시 다음 급여 계산부터 반영됩니다.<br />
            허위 신고 시 본인 책임이며 가산세가 부과될 수 있습니다.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:opacity-40"
          >
            {saving ? '저장 중...' : '변경 완료'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
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

  const showSeveranceTab = retirementType === 'severance'
  const showPensionTab = retirementType === 'DB' || retirementType === 'DC'

  const getDefaultTab = (t: RetirementType): RetirementTab =>
    t === 'severance' ? 'severance' : 'pension'

  const [activeTab, setActiveTab] = useState<RetirementTab>('severance')

  // pension 로드되면 기본 탭 설정
  useEffect(() => {
    if (pension) setActiveTab(getDefaultTab(retirementType))
  }, [pension, retirementType])

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
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
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
          {showSeveranceTab && (
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
          )}
          {showPensionTab && (
            <>
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
              <button
                onClick={() => setActiveTab('pension')}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'pension'
                    ? 'border-gray-800 text-gray-800'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                DB/DC 퇴직연금 적립금액
              </button>
            </>
          )}
        </div>

        {/* ── 근속기준 탭 ── */}
        {activeTab === 'severance' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
              <p>- 예상되는 퇴사일자를 기준으로 하여, 30일 분 이상의 평균임금으로 퇴직금을 계산합니다.</p>
              <p>- 실제 산정되는 퇴직금과 금액 차이가 발생될 수 있으므로 참고용으로 활용해주시길 바랍니다.</p>
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
                          {retirementType === 'DC' ? '회사 추가 부담액 (예상퇴직금 − DC 적립액)' : '예상 퇴직금'}
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

        {/* ── DB/DC 탭 ── */}
        {activeTab === 'pension' && pension && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
              <p>- 회사의 퇴직연금 제도(DB/DC형)에 따른 적립금액을 확인합니다.</p>
              <p>- 실제 적립 금액은 퇴직연금 운용사 기준이며, 차이가 발생할 수 있습니다.</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 w-52 bg-gray-50 font-medium text-right">퇴직연금 유형</td>
                    <td className="py-2.5 px-4 text-gray-800">
                      {pension.retirementType === 'DB' ? 'DB형 (확정급여형)' :
                       pension.retirementType === 'DC' ? 'DC형 (확정기여형)' : '법정 퇴직금'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">최근 적립일</td>
                    <td className="py-2.5 px-4 text-gray-800">{formatDate(pension.lastDepositDate)}</td>
                  </tr>
                  {pension.retirementType === 'DC' && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2.5 px-4 text-gray-600 bg-gray-50 font-medium text-right">
                        월 적립액 (기준급여의 1/12)
                      </td>
                      <td className="py-2.5 px-4 text-gray-800">
                        {formatMoney(pension.monthlyDeposit)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <table className="w-full text-xs border-t-2 border-gray-300">
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 w-52 font-bold text-right">누적 적립금액</td>
                    <td className="py-3 px-4 font-bold text-[#2e9e6e] text-base bg-[#f0fdfa]">
                      {formatMoney(pension.totalDeposited)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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

  // TODO: PIN 기능 구현 시 아래 블록 주석 해제
  // if (!authenticated) {
  //   return <PasswordScreen onSuccess={() => setAuthenticated(true)} />
  // }

  // 미사용 경고 방지 — PIN 기능 복구 시 제거
  void PasswordScreen

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">급여</h2>
        </div>
        <nav className="p-2 space-y-0.5">
          <button
            onClick={() => setActiveView('salary')}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
              activeView === 'salary'
                ? 'text-[#2e9e6e] font-medium bg-[#f0f9f6]'
                : 'text-[#374151] hover:bg-gray-50'
            }`}
          >
            내 급여 조회
          </button>
          <button
            onClick={() => setActiveView('retirement')}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
              activeView === 'retirement'
                ? 'text-[#2e9e6e] font-medium bg-[#f0f9f6]'
                : 'text-[#374151] hover:bg-gray-50'
            }`}
          >
            예상 퇴직금 조회
          </button>
        </nav>
      </div>

      {/* 콘텐츠 */}
      {activeView === 'salary' ? <MySalaryView /> : <RetirementView />}
    </div>
  )
}
