import { useState } from 'react'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface PromotionConfig {
  enabled: boolean
  firstEnabled: boolean
  firstMonthsBefore: number
  secondEnabled: boolean
  secondMonthsBefore: number
  notifyMethod: 'system'
}

interface AllowanceConfig {
  autoCalc: boolean
}

/* ══════════════════════════════════════
   Mock 촉진 이력
   ══════════════════════════════════════ */
interface PromotionHistory {
  id: number
  empNo: string
  name: string
  dept: string
  period: string
  remaining: number
  firstSentAt: string | null
  secondSentAt: string | null
  result: '수당지급' | '수당면제' | '진행중'
}

const PROMOTION_HISTORY: PromotionHistory[] = []

const resultColor: Record<string, string> = {
  '수당지급': 'bg-blue-50 text-blue-600',
  '수당면제': 'bg-gray-100 text-gray-500',
  '진행중': 'bg-yellow-50 text-yellow-600',
}

/* ══════════════════════════════════════
   컴포넌트
   ══════════════════════════════════════ */
export default function LeavePromotionView() {
  const [promotion, setPromotion] = useState<PromotionConfig>({
    enabled: true,
    firstEnabled: true,
    firstMonthsBefore: 6,
    secondEnabled: true,
    secondMonthsBefore: 2,
    notifyMethod: 'system',
  })

  const [allowance, setAllowance] = useState<AllowanceConfig>({
    autoCalc: true,
  })

  const [activeSection, setActiveSection] = useState<'설정' | '이력'>('설정')

  // 촉진 결과 요약
  const summary = {
    total: PROMOTION_HISTORY.length,
    exempted: PROMOTION_HISTORY.filter((h) => h.result === '수당면제').length,
    paid: PROMOTION_HISTORY.filter((h) => h.result === '수당지급').length,
    inProgress: PROMOTION_HISTORY.filter((h) => h.result === '진행중').length,
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 촉진 처리</h3>
      <p className="text-[12px] text-gray-400 mb-5">사용 촉진(근로기준법 제61조) 및 미사용 연차 수당을 관리합니다</p>

      {/* 섹션 탭 */}
      <div className="flex items-center gap-2 mb-5">
        {(['설정', '이력'] as const).map((t) => (
          <button key={t} onClick={() => setActiveSection(t)}
            className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${activeSection === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === '설정' ? '촉진 설정' : '촉진 이력'}
          </button>
        ))}
      </div>

      {/* ═══ 설정 섹션 ═══ */}
      {activeSection === '설정' && (
        <div className="space-y-5">
          {/* ── 연차 사용 촉진 설정 ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[13px] font-semibold text-gray-800">연차 사용 촉진</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[12px] text-gray-500">{promotion.enabled ? '사용' : '미사용'}</span>
                <div className="relative">
                  <input type="checkbox" checked={promotion.enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked
                      // 촉진 ON 시 1차는 무조건 활성화
                      setPromotion({
                        ...promotion,
                        enabled,
                        firstEnabled: enabled ? true : promotion.firstEnabled,
                      })
                    }}
                    className="sr-only" />
                  <div className={`w-9 h-5 rounded-full transition-colors ${promotion.enabled ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${promotion.enabled ? 'translate-x-4' : ''}`} />
                </div>
              </label>
            </div>

            {promotion.enabled && (
              <div className="space-y-4">
                {/* 안내 */}
                <p className="text-[11px] text-[#1D9E75] bg-[#E1F5EE] border border-[#1D9E75]/30 rounded px-3 py-2">
                  <i className="fas fa-info-circle mr-1" />
                  연차 사용 촉진을 사용하면 <strong>1차 촉진은 필수</strong>로 시행됩니다. 2차 촉진은 선택입니다.
                </p>

                {/* 1차 촉진 — 촉진 ON 시 고정 */}
                <div className="border border-[#1D9E75]/40 rounded-lg p-4 bg-[#F0FAF5]">
                  <div className="flex items-center gap-3 mb-3">
                    {/* 고정된 체크 표시 (체크박스 대신 초록 체크 아이콘) */}
                    <div className="w-4 h-4 rounded bg-[#1D9E75] flex items-center justify-center shrink-0">
                      <i className="fas fa-check text-white text-[8px]" />
                    </div>
                    <span className="text-[12px] font-medium text-gray-800">1차 촉진 (사용 계획 제출 요구)</span>
                  </div>
                  <div className="ml-7 flex items-center gap-3">
                    <span className="text-[12px] text-gray-600">연차 만료</span>
                    <select value={promotion.firstMonthsBefore}
                      onChange={(e) => setPromotion({ ...promotion, firstMonthsBefore: Number(e.target.value) })}
                      className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none focus:border-[#1D9E75] bg-white">
                      <option value={6}>6개월</option>
                      <option value={5}>5개월</option>
                      <option value={4}>4개월</option>
                      <option value={3}>3개월</option>
                    </select>
                    <span className="text-[12px] text-gray-600">전 통보</span>
                  </div>
                </div>

                {/* 2차 촉진 — 선택 */}
                <div className={`border rounded-lg p-4 transition-colors ${
                  promotion.secondEnabled
                    ? 'border-[#1D9E75]/40 bg-[#F0FAF5]'
                    : 'border-gray-100 bg-white'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" checked={promotion.secondEnabled}
                      onChange={(e) => setPromotion({ ...promotion, secondEnabled: e.target.checked })}
                      className="accent-[#1D9E75]" />
                    <span className="text-[12px] font-medium text-gray-800">2차 촉진 (사용 시기 지정 통보)</span>
                  </div>
                  {promotion.secondEnabled && (
                    <div className="ml-6 flex items-center gap-3">
                      <span className="text-[12px] text-gray-600">연차 만료</span>
                      <select value={promotion.secondMonthsBefore}
                        onChange={(e) => setPromotion({ ...promotion, secondMonthsBefore: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none focus:border-[#1D9E75] bg-white">
                        <option value={2}>2개월</option>
                        <option value={1}>1개월</option>
                      </select>
                      <span className="text-[12px] text-gray-600">전 통보</span>
                    </div>
                  )}
                </div>

                {/* 안내 */}
                <div className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
                  <p><strong>1차만 시행 시:</strong> 미사용 연차는 수당으로 전환됩니다</p>
                  <p><strong>1차 + 2차 모두 시행 시:</strong> 미사용 연차 수당이 면제됩니다 (근로기준법 제61조)</p>
                  <p><strong>촉진 미사용 시:</strong> 모든 미사용 연차는 수당으로 지급해야 합니다</p>
                </div>

              </div>
            )}
          </div>

          {/* ── 미사용 연차 수당 설정 (1차+2차 모두 켜져있으면 면제이므로 숨김) ── */}
          {!(promotion.enabled && promotion.firstEnabled && promotion.secondEnabled) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-[13px] font-semibold text-gray-800 mb-4">미사용 연차 수당 처리</h4>

              <div className="space-y-4">
                {/* 수당 자동산출 */}
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-gray-600 w-32 shrink-0">수당 자동 산출</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" checked={allowance.autoCalc}
                        onChange={(e) => setAllowance({ ...allowance, autoCalc: e.target.checked })}
                        className="sr-only" />
                      <div className={`w-9 h-5 rounded-full transition-colors ${allowance.autoCalc ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${allowance.autoCalc ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-[12px] text-gray-500">{allowance.autoCalc ? '사용' : '미사용'}</span>
                  </label>
                </div>

                {allowance.autoCalc && (
                  <>
                    {/* 산출 공식 */}
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-600 w-32 shrink-0">산출 공식</span>
                      <span className="text-[12px] text-gray-800 font-medium">미사용 시간 × (월 통상임금 ÷ 209)</span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
                      <p><strong>근로기준법 제60조 / 시행령 제6조</strong> 기준으로 산출합니다.</p>
                      <p>시간급 통상임금 = 월 통상임금 ÷ 209시간 (주 40시간 기준)</p>
                      <p>반차(4h), 반반차(2h) 사용분이 반영된 잔여시간을 기준으로 산출합니다.</p>
                      <p>예) 잔여 52시간, 월 통상임금 4,180,000원 → 시간급 20,000원 → 52 × 20,000 = 1,040,000원</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">
              저장
            </button>
          </div>
        </div>
      )}

      {/* ═══ 이력 섹션 ═══ */}
      {activeSection === '이력' && (
        <div>
          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">전체 대상</p>
              <p className="text-[22px] font-bold text-gray-800">{summary.total}명</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">수당 면제</p>
              <p className="text-[22px] font-bold text-gray-500">{summary.exempted}명</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">수당 지급</p>
              <p className="text-[22px] font-bold text-blue-600">{summary.paid}명</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">진행 중</p>
              <p className="text-[22px] font-bold text-yellow-600">{summary.inProgress}명</p>
            </div>
          </div>

          {/* 이력 테이블 */}
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">이름</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">연차 기간</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">잔여</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">1차 촉진</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">2차 촉진</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">결과</th>
              </tr>
            </thead>
            <tbody>
              {PROMOTION_HISTORY.map((h) => (
                <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-500">{h.empNo}</td>
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{h.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{h.dept}</td>
                  <td className="px-3 py-2.5 text-gray-500 text-[11px]">{h.period}</td>
                  <td className="px-3 py-2.5 text-center text-gray-800">{h.remaining}일</td>
                  <td className="px-3 py-2.5 text-center">
                    {h.firstSentAt
                      ? <span className="text-[#1D9E75] text-[11px]">{h.firstSentAt}</span>
                      : <span className="text-gray-300 text-[11px]">미발송</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {h.secondSentAt
                      ? <span className="text-[#1D9E75] text-[11px]">{h.secondSentAt}</span>
                      : <span className="text-gray-300 text-[11px]">미발송</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] ${resultColor[h.result]}`}>
                      {h.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
