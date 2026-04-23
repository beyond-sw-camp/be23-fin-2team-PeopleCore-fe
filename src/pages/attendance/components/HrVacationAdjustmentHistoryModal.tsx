import { useCallback, useEffect, useRef, useState } from 'react'
import {
  vacationApi,
  type VacationAdjustmentResponse,
  type VacationLedgerEventType,
} from '../../../api/vacation'

interface Props {
  open: boolean
  onClose: () => void
  empId: number | null
  empName?: string
  year?: number
}

const EVENT_LABEL: Record<string, { label: string; cls: string }> = {
  MANUAL_GRANT: { label: '수동 부여', cls: 'bg-[#E1F5EE] text-[#1D9E75]' },
  MANUAL_USED: { label: '수동 차감', cls: 'bg-red-50 text-red-500' },
  ACCRUAL: { label: '발생', cls: 'bg-blue-50 text-blue-600' },
  EXPIRED: { label: '소멸', cls: 'bg-gray-100 text-gray-500' },
  REQUEST_APPROVED: { label: '신청 승인', cls: 'bg-indigo-50 text-indigo-600' },
  REQUEST_CANCELED: { label: '신청 취소', cls: 'bg-yellow-50 text-yellow-600' },
}

const eventBadge = (t: VacationLedgerEventType) => {
  const b = EVENT_LABEL[t] ?? { label: String(t), cls: 'bg-gray-100 text-gray-600' }
  return <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${b.cls}`}>{b.label}</span>
}

const formatDays = (v: number) => `${v > 0 ? '+' : ''}${v}일`

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function HrVacationAdjustmentHistoryModal({ open, onClose, empId, empName, year }: Props) {
  const [items, setItems] = useState<VacationAdjustmentResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadPage = useCallback(async (nextPage: number) => {
    if (empId === null) return
    setLoading(true)
    setError(null)
    try {
      const res = await vacationApi.getAdjustments({ empId, year, page: nextPage, size: 20 })
      setItems((prev) => (nextPage === 0 ? res.content : [...prev, ...res.content]))
      setPage(res.number)
      setHasNext(res.hasNext)
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { code?: string; message?: string } } }
      if (err?.response?.status === 403) setError('조정 이력 조회 권한이 없습니다.')
      else setError(err?.response?.data?.message ?? '조정 이력을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [empId, year])

  useEffect(() => {
    if (!open) return
    setItems([])
    setPage(0)
    setHasNext(false)
    void loadPage(0)
  }, [open, loadPage])

  useEffect(() => {
    if (!open || !hasNext || loading) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadPage(page + 1)
    }, { rootMargin: '40px' })
    io.observe(el)
    return () => io.disconnect()
  }, [open, hasNext, loading, page, loadPage])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[640px] max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">휴가 조정 이력{empName ? ` — ${empName}` : ''}</h2>
          <p className="text-[12px] text-gray-500 mt-1">
            {year ? `${year}년 기준 ` : ''}가장 최근 조정부터 시간순으로 정렬됩니다
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 && !loading && !error && (
            <div className="text-center py-12 text-[13px] text-gray-400">조정 이력이 없습니다</div>
          )}
          {error && (
            <div className="text-center py-12 text-[13px] text-red-500">{error}</div>
          )}

          <ul className="divide-y divide-gray-100">
            {items.map((a) => (
              <li key={a.ledgerId} className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  {eventBadge(a.eventType)}
                  <span className="text-[12px] text-gray-700 font-medium">{a.typeName}</span>
                  <span className={`text-[12px] font-semibold ml-auto ${a.changeDays > 0 ? 'text-[#1D9E75]' : 'text-red-500'}`}>
                    {formatDays(a.changeDays)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>{a.balanceYear}년 기준</span>
                  {a.managerName && <span>담당 {a.managerName}</span>}
                  <span className="ml-auto">{formatDateTime(a.createdAt)}</span>
                </div>
                {a.reason && <div className="mt-1 text-[12px] text-gray-700">{a.reason}</div>}
              </li>
            ))}
          </ul>

          <div ref={sentinelRef} />
          {loading && (
            <div className="text-center py-4 text-[12px] text-gray-400">불러오는 중...</div>
          )}
          {!loading && !hasNext && items.length > 0 && (
            <div className="text-center py-3 text-[11px] text-gray-400">마지막 항목입니다</div>
          )}
        </div>

        <div className="flex justify-end px-6 py-3 border-t border-gray-200">
          <button onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  )
}
