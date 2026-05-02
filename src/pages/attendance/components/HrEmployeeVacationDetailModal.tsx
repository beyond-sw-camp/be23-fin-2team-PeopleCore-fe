import { useQuery } from '@tanstack/react-query'
import { vacationApi } from '../../../api/vacation'
import { SkeletonTableRows } from '../../../components/ui/Skeleton'

interface EmployeeSummary {
  id: number
  name: string
  position: string
  dept: string
}

interface Props {
  open: boolean
  onClose: () => void
  employee: EmployeeSummary | null
  year: number
}

const formatDays = (v: number) => `${Number(v).toFixed(2).replace(/\.?0+$/, '')}d`

export default function HrEmployeeVacationDetailModal({ open, onClose, employee, year }: Props) {
  const balancesQuery = useQuery({
    queryKey: ['vacation', 'admin', 'employeeBalances', employee?.id, year],
    queryFn: () => vacationApi.getEmployeeBalances(employee!.id, year),
    enabled: open && !!employee,
  })
  const balances = balancesQuery.data ?? []
  const loading = balancesQuery.isPending && open && !!employee
  const error: string | null = balancesQuery.isError
    ? (() => {
        const e = balancesQuery.error as { response?: { status?: number; data?: { message?: string } } }
        const status = e?.response?.status
        if (status === 403) return '접근 권한이 없습니다.'
        if (status === 404) return '해당 사원을 찾을 수 없습니다.'
        return e?.response?.data?.message ?? '휴가 잔여를 불러오지 못했습니다.'
      })()
    : null

  if (!open || !employee) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(820px,calc(100vw-24px))] max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">
            {employee.name} {employee.position} 보유 휴가
          </h2>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {employee.dept} · {year}년 · 총 {balances.length}개 유형
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <table className="w-full text-[12px]">
              <tbody>
                <SkeletonTableRows rows={4} cols={7} />
              </tbody>
            </table>
          )}
          {!loading && error && (
            <div className="text-center py-12 text-[13px] text-red-500">{error}</div>
          )}
          {!loading && !error && balances.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">보유한 휴가가 없습니다</div>
          )}
          {!loading && !error && balances.length > 0 && (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="px-3 py-2 text-left text-gray-700 font-medium">휴가유형</th>
                  <th className="px-3 py-2 text-right text-gray-700 font-medium">잔여</th>
                  <th className="px-3 py-2 text-right text-gray-700 font-medium">사용</th>
                  <th className="px-3 py-2 text-right text-gray-700 font-medium">대기</th>
                  <th className="px-3 py-2 text-right text-gray-700 font-medium">만료</th>
                  <th className="px-3 py-2 text-right text-gray-700 font-medium">총 적립</th>
                  <th className="px-3 py-2 text-left text-gray-700 font-medium">유효기간</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => {
                  const isExhausted = b.availableDays <= 0 && b.expiredDays > 0
                  return (
                    <tr
                      key={b.balanceId}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isExhausted ? 'text-gray-400' : ''}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isExhausted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {b.typeName}
                          </span>
                          {b.pendingDays > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 font-semibold">
                              결재 대기 {formatDays(b.pendingDays)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-semibold ${b.availableDays <= 0 ? 'text-gray-400' : 'text-[#1D9E75]'}`}>
                        {formatDays(b.availableDays)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">{formatDays(b.usedDays)}</td>
                      <td className={`px-3 py-2.5 text-right ${b.pendingDays > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {formatDays(b.pendingDays)}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${b.expiredDays > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {formatDays(b.expiredDays)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-500">{formatDays(b.totalDays)}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                        {b.grantedAt} ~ {b.expiresAt ?? '무기한'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end px-6 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
