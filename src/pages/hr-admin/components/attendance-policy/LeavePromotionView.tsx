import { useEffect, useState } from 'react'
import {
  vacationApi,
  type VacationPromotionNoticeResponse,
} from '../../../../api/vacation'

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

const STAGE_BADGE: Record<VacationPromotionNoticeResponse['noticeStage'], string> = {
  FIRST: 'bg-blue-50 text-blue-600',
  SECOND: 'bg-purple-50 text-purple-600',
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

  const [activeSection, setActiveSection] = useState<'설정' | '이력'>('설정')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await vacationApi.getPromotionPolicy()
        if (aborted) return
        setPromotion({
          enabled: res.isActive,
          firstEnabled: res.isActive,
          firstMonthsBefore: res.firstMonthsBefore ?? 6,
          secondEnabled: res.secondMonthsBefore !== null,
          secondMonthsBefore: res.secondMonthsBefore ?? 2,
          notifyMethod: 'system',
        })
      } catch {
        // 서버 미응답 시 기본값 유지
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void load()
    return () => { aborted = true }
  }, [])

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await vacationApi.updatePromotionPolicy({
        isActive: promotion.enabled,
        firstMonthsBefore: promotion.enabled ? promotion.firstMonthsBefore : null,
        secondMonthsBefore: promotion.enabled && promotion.secondEnabled ? promotion.secondMonthsBefore : null,
      })
      alert('촉진 정책이 저장되었습니다.')
    } catch {
      alert('촉진 정책 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 촉진 통지 이력
  const [notices, setNotices] = useState<VacationPromotionNoticeResponse[]>([])
  const [noticesLoading, setNoticesLoading] = useState(false)
  const [noticeYear, setNoticeYear] = useState<number>(new Date().getFullYear())
  const [noticePage, setNoticePage] = useState(0)
  const [noticeTotalPages, setNoticeTotalPages] = useState(0)
  const [noticeTotal, setNoticeTotal] = useState(0)

  useEffect(() => {
    if (activeSection !== '이력') return
    let aborted = false
    const loadNotices = async () => {
      setNoticesLoading(true)
      try {
        const res = await vacationApi.getAdminPromotionNotices({ year: noticeYear, page: noticePage, size: 20 })
        if (aborted) return
        setNotices(res.content)
        setNoticeTotalPages(res.totalPages)
        setNoticeTotal(res.totalElements)
      } catch {
        if (!aborted) {
          setNotices([])
          setNoticeTotalPages(0)
          setNoticeTotal(0)
        }
      } finally {
        if (!aborted) setNoticesLoading(false)
      }
    }
    void loadNotices()
    return () => { aborted = true }
  }, [activeSection, noticeYear, noticePage])

  const firstCount = notices.filter((n) => n.noticeStage === 'FIRST').length
  const secondCount = notices.filter((n) => n.noticeStage === 'SECOND').length

  if (loading) {
    return <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 촉진 처리</h3>
      <p className="text-[12px] text-gray-400 mb-5">연차 사용 촉진(근로기준법 제61조)을 관리합니다</p>

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

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving || loading}
              className={`px-5 py-2 text-[13px] font-medium rounded-lg transition-colors ${saving || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#1D9E75] text-white hover:bg-[#178a65]'}`}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ 이력 섹션 ═══ */}
      {activeSection === '이력' && (
        <div>
          {/* 필터 + 요약 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-600">연도</span>
              <input type="number" value={noticeYear}
                onChange={(e) => { setNoticeYear(Number(e.target.value)); setNoticePage(0) }}
                className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none w-24 focus:border-[#1D9E75]" />
            </div>
            <div className="text-[11px] text-gray-400">총 {noticeTotal}건</div>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">1차 통지</p>
              <p className="text-[22px] font-bold text-blue-600">{firstCount}건</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">2차 통지</p>
              <p className="text-[22px] font-bold text-purple-600">{secondCount}건</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">전체 통지</p>
              <p className="text-[22px] font-bold text-[#1D9E75]">{firstCount + secondCount}건</p>
            </div>
          </div>

          {noticesLoading ? (
            <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
          ) : (
            <>
              {/* 이력 테이블 */}
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원 ID</th>
                    <th className="px-3 py-2.5 text-center text-gray-700 font-medium">연도</th>
                    <th className="px-3 py-2.5 text-center text-gray-700 font-medium">대상 잔여</th>
                    <th className="px-3 py-2.5 text-center text-gray-700 font-medium">단계</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">통지 발송일</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">응답</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용 예정일수</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">응답일</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.noticeId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-800 font-medium">#{n.empId}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{n.noticeYear}</td>
                      <td className="px-3 py-2.5 text-center text-gray-800">{n.targetRemainingDays}일</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STAGE_BADGE[n.noticeStage]}`}>
                          {n.noticeStage === 'FIRST' ? '1차' : '2차'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-[11px]">{n.noticeSentAt.slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-[11px] max-w-[200px] truncate" title={n.employeeResponse ?? ''}>
                        {n.employeeResponse ?? <span className="text-gray-300">미응답</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        {n.responseUsedDays !== null ? `${n.responseUsedDays}일` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                        {n.responseRecordedAt ? n.responseRecordedAt.slice(0, 10) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {notices.length === 0 && (
                <div className="text-center py-12 text-[13px] text-gray-400">해당 연도에 통지 이력이 없습니다</div>
              )}

              {/* 페이지네이션 */}
              {noticeTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setNoticePage(Math.max(0, noticePage - 1))} disabled={noticePage === 0}
                    className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">이전</button>
                  <span className="text-[12px] text-gray-500">{noticePage + 1} / {noticeTotalPages}</span>
                  <button onClick={() => setNoticePage(Math.min(noticeTotalPages - 1, noticePage + 1))} disabled={noticePage >= noticeTotalPages - 1}
                    className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">다음</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
