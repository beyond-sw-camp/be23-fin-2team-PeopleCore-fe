import { useEffect, useMemo, useState } from 'react'
import {
  vacationApi,
  type VacationGrantRequestResponse,
  type VacationRequestResponse,
  type VacationRequestStatus,
  VACATION_REQUEST_STATUS_LABEL,
} from '../../../api/vacation'

const STATUS_ORDER: VacationRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED']

const STATUS_BADGE: Record<VacationRequestStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-600',
  APPROVED: 'bg-[#E1F5EE] text-[#1D9E75]',
  REJECTED: 'bg-red-50 text-red-500',
  CANCELED: 'bg-gray-100 text-gray-500',
}

function formatDateRange(startAt: string, endAt: string): string {
  const s = startAt.slice(0, 10)
  const e = endAt.slice(0, 10)
  return s === e ? s : `${s} ~ ${e}`
}

type UseSortKey =
  | 'empName'
  | 'empDeptName'
  | 'typeName'
  | 'startAt'
  | 'useDays'
  | 'createdAt'
  | 'status'

type GrantSortKey =
  | 'empName'
  | 'empDeptName'
  | 'typeName'
  | 'useDays'
  | 'createdAt'
  | 'status'

type ViewMode = 'use' | 'grant'

export default function HrVacationRequestAdminView() {
  const [view, setView] = useState<ViewMode>('use')

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView('use')}
          className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${view === 'use' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          휴가 신청 현황
        </button>
        <button onClick={() => setView('grant')}
          className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${view === 'grant' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          휴가 부여 신청 현황
        </button>
      </div>

      {view === 'use' ? <VacationUseRequestsTable /> : <VacationGrantRequestsTable />}
    </div>
  )
}

function VacationUseRequestsTable() {
  const [page, setPage] = useState(0)
  const size = 20
  const [data, setData] = useState<VacationRequestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<UseSortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    Promise.all(
      STATUS_ORDER.map((s) =>
        vacationApi.getAdminRequests({ status: s, page: 0, size: 500 }).catch(() => null),
      ),
    )
      .then((responses) => {
        if (ignore) return
        setData(responses.flatMap((r) => r?.content ?? []))
      })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  const handleSort = (key: UseSortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
    setPage(0)
  }
  const sortIcon = (key: UseSortKey) => (sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '')

  const sorted = useMemo(() => {
    const list = search
      ? data.filter((d) => d.empName.includes(search) || (d.empDeptName ?? '').includes(search))
      : data
    const mul = sortAsc ? 1 : -1
    return [...list].sort((a, b) => {
      if (sortKey === 'status') {
        return mul * (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
      }
      if (sortKey === 'useDays') return mul * (a.useDays - b.useDays)
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      return mul * av.localeCompare(bv)
    })
  }, [data, search, sortKey, sortAsc])

  const totalElements = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const pageData = sorted.slice(page * size, page * size + size)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
          <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
        </div>
        <div className="text-[11px] text-gray-400">총 {totalElements}건</div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
      ) : (
        <>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('empName')}>신청자{sortIcon('empName')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('empDeptName')}>부서{sortIcon('empDeptName')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급/직책</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('typeName')}>휴가 유형{sortIcon('typeName')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('startAt')}>휴가기간{sortIcon('startAt')}</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('useDays')}>일수{sortIcon('useDays')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('createdAt')}>신청일{sortIcon('createdAt')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('status')}>상태{sortIcon('status')}</th>
            </tr></thead>
            <tbody>
              {pageData.map((d) => (
                <tr key={d.requestId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{d.empName}</td>
                  <td className="px-3 py-2.5 text-gray-600">{d.empDeptName ?? '-'}</td>
                  <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                    {[d.empGrade, d.empTitle].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">{d.typeName}</td>
                  <td className="px-3 py-2.5 text-gray-600">{formatDateRange(d.startAt, d.endAt)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.useDays}d</td>
                  <td className="px-3 py-2.5 text-gray-500">{d.createdAt.slice(0, 10)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${STATUS_BADGE[d.status]}`}>
                      {VACATION_REQUEST_STATUS_LABEL[d.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageData.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">신청 내역이 없습니다</div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">이전</button>
              <span className="text-[12px] text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">다음</button>
            </div>
          )}
        </>
      )}
    </>
  )
}

function VacationGrantRequestsTable() {
  const [page, setPage] = useState(0)
  const size = 20
  const [data, setData] = useState<VacationGrantRequestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<GrantSortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    Promise.all(
      STATUS_ORDER.map((s) =>
        vacationApi.getAdminGrantRequests({ status: s, page: 0, size: 500 }).catch(() => null),
      ),
    )
      .then((responses) => {
        if (ignore) return
        setData(responses.flatMap((r) => r?.content ?? []))
      })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  const handleSort = (key: GrantSortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
    setPage(0)
  }
  const sortIcon = (key: GrantSortKey) => (sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '')

  const sorted = useMemo(() => {
    const list = search
      ? data.filter((d) => d.empName.includes(search) || (d.empDeptName ?? '').includes(search))
      : data
    const mul = sortAsc ? 1 : -1
    return [...list].sort((a, b) => {
      if (sortKey === 'status') {
        return mul * (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
      }
      if (sortKey === 'useDays') return mul * (a.useDays - b.useDays)
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      return mul * av.localeCompare(bv)
    })
  }, [data, search, sortKey, sortAsc])

  const totalElements = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const pageData = sorted.slice(page * size, page * size + size)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
          <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
        </div>
        <div className="text-[11px] text-gray-400">총 {totalElements}건</div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
      ) : (
        <>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('empName')}>신청자{sortIcon('empName')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('empDeptName')}>부서{sortIcon('empDeptName')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급/직책</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('typeName')}>휴가 유형{sortIcon('typeName')}</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('useDays')}>부여 일수{sortIcon('useDays')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('createdAt')}>신청일{sortIcon('createdAt')}</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('status')}>상태{sortIcon('status')}</th>
            </tr></thead>
            <tbody>
              {pageData.map((d) => (
                <tr key={d.requestId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{d.empName}</td>
                  <td className="px-3 py-2.5 text-gray-600">{d.empDeptName ?? '-'}</td>
                  <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                    {[d.empGrade, d.empTitle].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">{d.typeName}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.useDays}d</td>
                  <td className="px-3 py-2.5 text-gray-600">{d.reason ?? '-'}</td>
                  <td className="px-3 py-2.5 text-gray-500">{d.createdAt.slice(0, 10)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${STATUS_BADGE[d.status]}`}>
                      {VACATION_REQUEST_STATUS_LABEL[d.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageData.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">신청 내역이 없습니다</div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">이전</button>
              <span className="text-[12px] text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">다음</button>
            </div>
          )}
        </>
      )}
    </>
  )
}
