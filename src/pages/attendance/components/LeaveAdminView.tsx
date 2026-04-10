import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
interface LeaveEmployee {
  id: number
  empNo: string
  name: string
  dept: string
  position: string
  hireDate: string
  period: string
  total: number
  used: number
  remaining: number
  usedPercent: number
}

const LEAVE_ADMIN_MOCK: LeaveEmployee[] = [
  { id: 1, empNo: 'EMP001', name: '강희계', dept: '경영', position: '부장', hireDate: '2017-01-01', period: '2026-01-01 ~ 2026-12-31', total: 19, used: 15, remaining: 4, usedPercent: 78.9 },
  { id: 2, empNo: 'EMP002', name: '권시정', dept: '경영', position: '차장', hireDate: '2014-12-31', period: '2025-12-31 ~ 2026-12-30', total: 20, used: 25, remaining: -5, usedPercent: 125.0 },
  { id: 3, empNo: 'EMP003', name: '김인재', dept: '경영', position: '차장', hireDate: '2015-02-09', period: '2026-02-09 ~ 2027-02-08', total: 18, used: 18, remaining: 0, usedPercent: 100.0 },
  { id: 4, empNo: 'EMP004', name: '박지현', dept: '경영', position: '과장', hireDate: '2020-05-24', period: '2025-05-24 ~ 2026-05-23', total: 17, used: 4, remaining: 13, usedPercent: 23.5 },
  { id: 5, empNo: 'EMP005', name: '이수진', dept: '경영', position: '대리', hireDate: '2023-12-31', period: '2025-12-31 ~ 2026-12-30', total: 15, used: 0, remaining: 15, usedPercent: 0 },
  { id: 6, empNo: 'EMP006', name: '박서준', dept: '개발', position: '팀장', hireDate: '2022-05-26', period: '2025-05-26 ~ 2026-05-25', total: 16, used: 0, remaining: 16, usedPercent: 0 },
  { id: 7, empNo: 'EMP007', name: '이민호', dept: '개발', position: '과장', hireDate: '2020-01-19', period: '2026-01-19 ~ 2027-01-18', total: 17, used: 1, remaining: 16, usedPercent: 5.9 },
  { id: 8, empNo: 'EMP008', name: '최예린', dept: '개발', position: '대리', hireDate: '2023-12-31', period: '2025-12-31 ~ 2026-12-30', total: 15, used: 0, remaining: 15, usedPercent: 0 },
  { id: 9, empNo: 'EMP009', name: '한도윤', dept: '개발', position: '사원', hireDate: '2025-05-30', period: '2026-01-01 ~ 2026-12-31', total: 9, used: 0, remaining: 9, usedPercent: 0 },
  { id: 10, empNo: 'EMP010', name: '송미래', dept: '인사', position: '팀장', hireDate: '2017-01-02', period: '2026-01-02 ~ 2027-01-01', total: 19, used: 7, remaining: 12, usedPercent: 36.8 },
  { id: 11, empNo: 'EMP011', name: '윤서연', dept: '인사', position: '과장', hireDate: '2020-06-01', period: '2025-06-01 ~ 2026-05-31', total: 17, used: 6, remaining: 11, usedPercent: 35.3 },
]

const DEPARTMENTS = ['전체', '경영', '개발', '인사']

/* ══════════════════════════════════════
   유틸
   ══════════════════════════════════════ */
function getUsedPercentColor(percent: number): string {
  if (percent >= 100) return 'text-red-600 font-semibold'
  if (percent >= 80) return 'text-[#1D9E75] font-semibold'
  if (percent < 30) return 'text-orange-500 font-semibold'
  return 'text-gray-800'
}

function getUsedPercentBg(percent: number): string {
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 80) return 'bg-[#1D9E75]'
  if (percent < 30) return 'bg-orange-400'
  return 'bg-blue-400'
}

function getRemainingBadge(remaining: number): string {
  if (remaining < 0) return 'bg-red-50 text-red-600'
  if (remaining === 0) return 'bg-gray-100 text-gray-500'
  if (remaining >= 10) return 'bg-orange-50 text-orange-600'
  return 'bg-green-50 text-green-700'
}

/* ══════════════════════════════════════
   컴포넌트
   ══════════════════════════════════════ */
export default function LeaveAdminView() {
  const [deptFilter, setDeptFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'usedPercent' | 'remaining' | 'name'>('usedPercent')
  const [sortAsc, setSortAsc] = useState(true)
  const [lowUsageOnly, setLowUsageOnly] = useState(false)

  const filtered = LEAVE_ADMIN_MOCK
    .filter((e) => deptFilter === '전체' || e.dept === deptFilter)
    .filter((e) => !search || e.name.includes(search) || e.empNo.includes(search))
    .filter((e) => !lowUsageOnly || e.usedPercent < 30)
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1
      if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
      return mul * (a[sortKey] - b[sortKey])
    })

  // 부서별 요약 통계
  const deptStats = DEPARTMENTS.filter((d) => d !== '전체').map((dept) => {
    const members = LEAVE_ADMIN_MOCK.filter((e) => e.dept === dept)
    const totalLeave = members.reduce((s, e) => s + e.total, 0)
    const usedLeave = members.reduce((s, e) => s + e.used, 0)
    const avgPercent = members.length > 0 ? usedLeave / totalLeave * 100 : 0
    const lowUsage = members.filter((e) => e.usedPercent < 30).length
    return { dept, count: members.length, totalLeave, usedLeave, avgPercent: Math.round(avgPercent * 10) / 10, lowUsage }
  })

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sortIcon = (key: typeof sortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : ''

  const handleExcelDownload = () => {
    const header = '사번,이름,부서,직급,입사일,연차기간,총연차,사용,잔여,소진율(%)'
    const rows = filtered.map((e) =>
      `${e.empNo},${e.name},${e.dept},${e.position},${e.hireDate},${e.period},${e.total},${e.used},${e.remaining},${e.usedPercent}`
    )
    const csv = '\uFEFF' + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `연차현황_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">관리자 연차 현황</h3>
      <p className="text-[12px] text-gray-400 mb-5">부서별 연차 사용 현황을 조회하고 소진율이 낮은 직원을 관리합니다</p>

      {/* ── 부서별 요약 카드 ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {deptStats.map((s) => (
          <div key={s.dept} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => setDeptFilter(s.dept)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-gray-800">{s.dept}</span>
              <span className="text-[11px] text-gray-400">{s.count}명</span>
            </div>
            {/* 소진율 프로그레스 바 */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div className={`h-2 rounded-full transition-all ${s.avgPercent >= 80 ? 'bg-[#1D9E75]' : s.avgPercent < 30 ? 'bg-orange-400' : 'bg-blue-400'}`}
                style={{ width: `${Math.min(s.avgPercent, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">평균 소진율 <strong className={s.avgPercent < 30 ? 'text-orange-500' : 'text-[#1D9E75]'}>{s.avgPercent}%</strong></span>
              {s.lowUsage > 0 && (
                <span className="text-orange-500">소진율 낮음 {s.lowUsage}명</span>
              )}
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-gray-400">
              <span>총 {s.totalLeave}일</span>
              <span>사용 {s.usedLeave}일</span>
              <span>잔여 {s.totalLeave - s.usedLeave}일</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 필터 & 검색 ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {DEPARTMENTS.map((d) => (
              <button key={d} onClick={() => setDeptFilter(d)}
                className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors ${deptFilter === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {d}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer ml-2">
            <input type="checkbox" checked={lowUsageOnly} onChange={(e) => setLowUsageOnly(e.target.checked)}
              className="accent-[#1D9E75]" />
            소진율 30% 미만만
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="이름 · 사번 검색" value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-[12px] outline-none w-48 focus:border-[#1D9E75]" />
          <button onClick={handleExcelDownload}
            className="px-4 py-1.5 text-[12px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            CSV 다운로드
          </button>
        </div>
      </div>

      {/* ── 테이블 ── */}
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]"
              onClick={() => handleSort('name')}>이름{sortIcon('name')}</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">연차 기간</th>
            <th className="px-3 py-2.5 text-center text-gray-700 font-medium">총연차</th>
            <th className="px-3 py-2.5 text-center text-gray-700 font-medium">사용</th>
            <th className="px-3 py-2.5 text-center text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]"
              onClick={() => handleSort('remaining')}>잔여{sortIcon('remaining')}</th>
            <th className="px-3 py-2.5 text-center text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]"
              onClick={() => handleSort('usedPercent')}>소진율{sortIcon('usedPercent')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => (
            <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-500">{e.empNo}</td>
              <td className="px-3 py-2.5 text-gray-800 font-medium">{e.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{e.dept}</td>
              <td className="px-3 py-2.5 text-gray-600">{e.position}</td>
              <td className="px-3 py-2.5 text-gray-500 text-[11px]">{e.period}</td>
              <td className="px-3 py-2.5 text-center text-gray-800">{e.total}일</td>
              <td className="px-3 py-2.5 text-center text-gray-800">{e.used}일</td>
              <td className="px-3 py-2.5 text-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${getRemainingBadge(e.remaining)}`}>
                  {e.remaining}일
                </span>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${getUsedPercentBg(e.usedPercent)}`}
                      style={{ width: `${Math.min(e.usedPercent, 100)}%` }} />
                  </div>
                  <span className={`text-[11px] w-10 text-right ${getUsedPercentColor(e.usedPercent)}`}>
                    {e.usedPercent}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[13px] text-gray-400">검색 결과가 없습니다</div>
      )}

      {/* ── 범례 ── */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <span className="text-[11px] text-gray-400">범례:</span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> 소진율 30% 미만 (사용 촉진 권장)
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1D9E75]" /> 소진율 80% 이상
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 초과 사용
        </span>
      </div>
    </div>
  )
}
