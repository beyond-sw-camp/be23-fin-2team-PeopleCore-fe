import { useEffect, useState } from 'react'
import { vacationApi } from '../../../../api/vacation'

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

  if (loading) {
    return <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 촉진 처리</h3>
      <p className="text-[12px] text-gray-400 mb-5">연차 사용 촉진(근로기준법 제61조)을 관리합니다</p>

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
    </div>
  )
}
