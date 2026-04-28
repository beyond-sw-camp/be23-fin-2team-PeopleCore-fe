import { useEffect, useMemo, useState } from 'react'
import { attendanceApi, formatHm, type OvertimeRemainingRes, type OvertimeWeekItem, type OvertimeStatus } from '../../../api/attendance'

const OT_STATUS_STYLE: Record<OvertimeStatus, { label: string; cls: string }> = {
  PENDING: { label: '대기', cls: 'bg-yellow-50 text-yellow-600' },
  APPROVED: { label: '승인', cls: 'bg-green-50 text-green-700' },
  REJECTED: { label: '반려', cls: 'bg-red-50 text-red-600' },
  CANCELED: { label: '취소', cls: 'bg-gray-100 text-gray-500' },
}

const fmtHm = (iso: string) => iso.length >= 16 ? iso.slice(11, 16) : iso

export interface OvertimeApplyData {
  otDate: string
  otPlanStart: string
  otPlanEnd: string
  otReason: string
  otPlanMinutes: number
  remainingMinutesAfter: number
}

interface Props {
  onClose: () => void
  onSubmittedToApproval: (data: OvertimeApplyData) => void
}

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getMondayStr = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const toLocalDateTime = (date: string, time: string) => `${date}T${time}:00`

const addOneDay = (date: string) => {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function OvertimeApplyModal({ onClose, onSubmittedToApproval }: Props) {
  const [otDate, setOtDate] = useState<string>(todayStr())
  const [startTime, setStartTime] = useState<string>('19:00')
  const [endTime, setEndTime] = useState<string>('21:00')
  const [reason, setReason] = useState<string>('')
  const [remaining, setRemaining] = useState<OvertimeRemainingRes | null>(null)
  const [loadingRemaining, setLoadingRemaining] = useState(false)
  const [weekItems, setWeekItems] = useState<OvertimeWeekItem[]>([])
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekStart = useMemo(() => getMondayStr(otDate), [otDate])

  useEffect(() => {
    let aborted = false
    setLoadingRemaining(true)
    setLoadingWeek(true)
    attendanceApi.getOvertimeRemaining(weekStart)
      .then((res) => { if (!aborted) setRemaining(res) })
      .catch(() => { if (!aborted) setRemaining(null) })
      .finally(() => { if (!aborted) setLoadingRemaining(false) })
    attendanceApi.getOvertimeWeek(weekStart)
      .then((res) => { if (!aborted) setWeekItems(res.items) })
      .catch(() => { if (!aborted) setWeekItems([]) })
      .finally(() => { if (!aborted) setLoadingWeek(false) })
    return () => { aborted = true }
  }, [weekStart])

  const inputMinutes = useMemo(() => {
    if (!startTime || !endTime) return 0
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff <= 0) diff += 24 * 60
    return diff
  }, [startTime, endTime])

  const isOvernight = useMemo(() => {
    if (!startTime || !endTime) return false
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    return (eh * 60 + em) <= (sh * 60 + sm)
  }, [startTime, endTime])

  const overflowMinutes = remaining ? remaining.remainingMinutes - inputMinutes : 0
  const isBlocked = remaining?.exceedAction === 'BLOCK' && overflowMinutes < 0
  const isNotifyWarn = remaining?.exceedAction === 'NOTIFY' && overflowMinutes < 0

  const canSubmit = !!reason.trim() && inputMinutes > 0 && !isBlocked && !submitting

  const handleConfirm = async () => {
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const otPlanStart = toLocalDateTime(otDate, startTime)
      const otPlanEnd = toLocalDateTime(isOvernight ? addOneDay(otDate) : otDate, endTime)
      onSubmittedToApproval({
        otDate,
        otPlanStart,
        otPlanEnd,
        otReason: reason.trim(),
        otPlanMinutes: inputMinutes,
        remainingMinutesAfter: Math.max(0, overflowMinutes),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-[520px] flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">초과근로 신청</h2>
          <p className="text-[12px] text-gray-500 mt-1">신청 후 결재선 선택을 통해 전자결재가 상신됩니다.</p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">
          {/* 잔여 시간 */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-600">이번주 잔여 초과근로시간</span>
              <span className="font-bold text-gray-900">
                {loadingRemaining ? '-' : remaining ? formatHm(remaining.remainingMinutes) : '-'}
                {remaining && (
                  <span className="text-gray-400 font-normal ml-1">/ {formatHm(remaining.maxOvertimeBufferMinutes)}</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-600">신청 초과근로시간</span>
              <span className={`font-bold ${inputMinutes < 0 ? 'text-red-500' : 'text-gray-900'}`}>{formatHm(Math.max(0, inputMinutes))}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-600">신청 후 잔여</span>
              <span className={`font-bold ${overflowMinutes < 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>
                {remaining ? formatHm(Math.max(0, overflowMinutes)) : '-'}
              </span>
            </div>
            {remaining && remaining.exceedAction === 'BLOCK' && (
              <p className="text-[11px] text-gray-400 mt-1">정책: 초과 시 신청 차단</p>
            )}
            {remaining && remaining.exceedAction === 'NOTIFY' && (
              <p className="text-[11px] text-gray-400 mt-1">정책: 초과 시 경고만 표시</p>
            )}
          </div>

          {/* 날짜 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0 w-20">날짜 <span className="text-red-500">*</span></span>
            <input type="date" value={otDate} onChange={(e) => setOtDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
          </div>

          {/* 시간 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0 w-20">시간 <span className="text-red-500">*</span></span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
            <span className="text-gray-400">~</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
          </div>

          {/* 사유 */}
          <div>
            <div className="text-[13px] font-semibold text-gray-900 mb-1.5">사유 <span className="text-red-500">*</span></div>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="초과근로 사유를 입력해주세요"
              className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] resize-none" />
          </div>

          {isBlocked && (
            <p className="text-[12px] text-red-500">잔여 초과근로시간이 부족하여 신청할 수 없습니다.</p>
          )}
          {isNotifyWarn && (
            <p className="text-[12px] text-orange-500">잔여 초과근로시간을 초과합니다. 신청은 가능하나 경고 처리됩니다.</p>
          )}
          {inputMinutes <= 0 && (
            <p className="text-[12px] text-gray-400">종료 시각은 시작 시각보다 늦어야 합니다.</p>
          )}
          {error && <p className="text-[12px] text-red-500">{error}</p>}

          {/* 이번주 신청 이력 */}
          <div>
            <div className="text-[13px] font-semibold text-gray-900 mb-1.5">이번주 신청 이력</div>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="px-2 py-1.5 text-center font-medium">상태</th>
                    <th className="px-2 py-1.5 text-center font-medium">신청일</th>
                    <th className="px-2 py-1.5 text-center font-medium">시작</th>
                    <th className="px-2 py-1.5 text-center font-medium">종료</th>
                    <th className="px-2 py-1.5 text-center font-medium">시간</th>
                    <th className="px-2 py-1.5 text-left font-medium">사유</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingWeek ? (
                    <tr><td colSpan={6} className="px-2 py-3 text-center text-gray-400">불러오는 중...</td></tr>
                  ) : weekItems.length === 0 ? (
                    <tr><td colSpan={6} className="px-2 py-3 text-center text-gray-400">이번주 신청 내역이 없습니다</td></tr>
                  ) : (
                    weekItems.map((it) => {
                      const style = OT_STATUS_STYLE[it.otStatus] ?? { label: it.otStatus, cls: 'bg-gray-100 text-gray-500' }
                      return (
                        <tr key={it.otId} className="border-t border-gray-100">
                          <td className="px-2 py-1.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded ${style.cls}`}>{style.label}</span>
                          </td>
                          <td className="px-2 py-1.5 text-center text-gray-700">{it.otDate}</td>
                          <td className="px-2 py-1.5 text-center text-gray-700">{fmtHm(it.otPlanStart)}</td>
                          <td className="px-2 py-1.5 text-center text-gray-700">{fmtHm(it.otPlanEnd)}</td>
                          <td className="px-2 py-1.5 text-center text-gray-700">{formatHm(it.otPlanMinutes)}</td>
                          <td className="px-2 py-1.5 text-gray-700 truncate max-w-[160px]" title={it.otReason}>{it.otReason}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
          <button onClick={handleConfirm}
            disabled={!canSubmit}
            className={`px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              canSubmit ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
