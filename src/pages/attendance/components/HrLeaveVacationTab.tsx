import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
export const HR_LEAVE_MOCK = [
  { id: 1, name: '강희계', position: '부장', dept: '경영', hireDate: '2017-01-01', retireDate: '', years: 9, period: '2026-01-01 ~ 2026-12-31', remaining: 4, used: 15, total: 19, generated: 19, carried: 0, adjusted: 0, expired: 0 },
  { id: 2, name: '권시정', position: '차장', dept: '경영', hireDate: '2014-12-31', retireDate: '', years: 11, period: '2025-12-31 ~ 2026-12-30', remaining: -5, used: 25, total: 20, generated: 20, carried: 0, adjusted: 0, expired: 0 },
  { id: 3, name: '김인재', position: '차장', dept: '경영', hireDate: '2015-02-09', retireDate: '', years: 11, period: '2026-02-09 ~ 2027-02-08', remaining: 0, used: 18, total: 18, generated: 20, carried: -2, adjusted: 0, expired: 0 },
  { id: 4, name: '박지현', position: '과장', dept: '경영', hireDate: '2020-05-24', retireDate: '', years: 5, period: '2025-05-24 ~ 2026-05-23', remaining: 13, used: 4, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0 },
  { id: 5, name: '이수진', position: '대리', dept: '경영', hireDate: '2023-12-31', retireDate: '', years: 2, period: '2025-12-31 ~ 2026-12-30', remaining: 15, used: 0, total: 15, generated: 15, carried: 0, adjusted: 0, expired: 0 },
  { id: 6, name: '박서준', position: '팀장', dept: '개발', hireDate: '2022-05-26', retireDate: '', years: 3, period: '2025-05-26 ~ 2026-05-25', remaining: 16, used: 0, total: 16, generated: 16, carried: 0, adjusted: 0, expired: 0 },
  { id: 7, name: '이민호', position: '과장', dept: '개발', hireDate: '2020-01-19', retireDate: '', years: 6, period: '2026-01-19 ~ 2027-01-18', remaining: 16, used: 1, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0 },
  { id: 8, name: '최예린', position: '대리', dept: '개발', hireDate: '2023-12-31', retireDate: '', years: 2, period: '2025-12-31 ~ 2026-12-30', remaining: 15, used: 0, total: 15, generated: 15, carried: 0, adjusted: 0, expired: 0 },
  { id: 9, name: '한도윤', position: '사원', dept: '개발', hireDate: '2025-05-30', retireDate: '', years: 0, period: '2026-01-01 ~ 2026-12-31', remaining: 9, used: 0, total: 9, generated: 2, carried: 0, adjusted: 0, expired: 0 },
  { id: 10, name: '송미래', position: '팀장', dept: '인사', hireDate: '2017-01-02', retireDate: '', years: 9, period: '2026-01-02 ~ 2027-01-01', remaining: 0, used: 0, total: 0, generated: 0, carried: 0, adjusted: 0, expired: 0 },
  { id: 11, name: '윤서연', position: '과장', dept: '인사', hireDate: '2020-06-01', retireDate: '', years: 5, period: '2025-06-01 ~ 2026-05-31', remaining: 11, used: 6, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0 },
]

export const HR_VACATION_MOCK = [
  { id: 1, name: '권시정', dept: '경영', leaveType: '보상휴가', dayOption: '종일', dates: '2026-04-10', days: 1, status: '승인대기', appliedAt: '2026-03-28' },
  { id: 2, name: '박지현', dept: '경영', leaveType: '출산휴가', dayOption: '종일', dates: '2026-04-14 ~ 07-12', days: 90, status: '승인대기', appliedAt: '2026-03-29' },
  { id: 3, name: '이민호', dept: '개발', leaveType: '배우자돌봄휴가', dayOption: '종일', dates: '2026-04-15 ~ 04-16', days: 2, status: '승인대기', appliedAt: '2026-03-30' },
  { id: 4, name: '강희계', dept: '경영', leaveType: '보상휴가', dayOption: '종일', dates: '2026-04-11', days: 1, status: '승인완료', appliedAt: '2026-03-25' },
  { id: 5, name: '박서준', dept: '개발', leaveType: '가족돌봄휴가', dayOption: '반차(오전)', dates: '2026-04-07', days: 0.5, status: '승인완료', appliedAt: '2026-03-20' },
  { id: 6, name: '이수진', dept: '경영', leaveType: '출산휴가-다태아', dayOption: '종일', dates: '2026-04-20 ~ 08-17', days: 120, status: '승인대기', appliedAt: '2026-03-31' },
]

/* ══════════════════════════════════════
   전사 휴가 관리 탭
   ══════════════════════════════════════ */
export default function HrLeaveVacationTab() {
  const [innerTab, setInnerTab] = useState<'전사 기간별 휴가 현황' | '전사 연차 현황' | '법적 근로 휴가 현황' | '법적 근로 휴가 결재'>('전사 기간별 휴가 현황')
  const [deptFilter, setDeptFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)
  const depts = ['전체', ...new Set(HR_LEAVE_MOCK.map((d) => d.dept))]
  const filteredLeave = deptFilter === '전체' ? HR_LEAVE_MOCK : HR_LEAVE_MOCK.filter((d) => d.dept === deptFilter)
  const filteredVacation = statusFilter === '전체' ? HR_VACATION_MOCK : HR_VACATION_MOCK.filter((d) => d.status === statusFilter)
  const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }

  // 주간 캘린더 데이터
  const weekDays = [
    { day: 30, dow: '월', leaveCount: 2 },
    { day: 31, dow: '화', leaveCount: 4 },
    { day: 1, dow: '수', leaveCount: 1, isToday: true },
    { day: 2, dow: '목', leaveCount: 1 },
    { day: 3, dow: '금', leaveCount: 1 },
    { day: 4, dow: '토', leaveCount: 1 },
    { day: 5, dow: '일', leaveCount: 1 },
  ]

  // 선택된 날짜의 휴가자 목록
  const dayLeaveMock = [
    { empNo: '-', name: '권시정', position: '차장', dept: '경영', leaveType: '출산휴가', dates: '2026-03-01 ~ 2026-05-29', used: '90d', duration: '90d' },
  ]

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">전사 휴가 관리</h1>

      {/* 탭 */}
      <div className="flex items-center gap-2 mb-4">
        {(['전사 기간별 휴가 현황', '전사 연차 현황', '법적 근로 휴가 현황'] as const).map((t) => (
          <button key={t} onClick={() => setInnerTab(t)} className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${innerTab === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
        ))}
        <button onClick={() => setInnerTab('법적 근로 휴가 결재')} className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${innerTab === '법적 근로 휴가 결재' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>법적 근로 휴가 결재</button>
      </div>

      {/* 날짜 선택 - 중앙 */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left" /></button>
        <span className="text-[18px] font-bold text-gray-900">{innerTab === '전사 연차 현황' ? '2026-04' : innerTab === '법적 근로 휴가 현황' ? '2026' : '2026-03-30 ~ 2026-04-05'}</span>
        <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right" /></button>
        <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-1">오늘</button>
      </div>

      {innerTab === '전사 기간별 휴가 현황' ? (<>
        {/* 주간 캘린더 */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => (
              <div key={d.day}
                onClick={() => setSelectedDay(d.day === selectedDay ? null : d.day)}
                className={`border-r border-gray-100 last:border-r-0 cursor-pointer transition-colors ${d.isToday && selectedDay === d.day ? 'bg-blue-50' : d.isToday ? 'bg-gray-50' : selectedDay === d.day ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                  <span className={`text-[14px] font-semibold ${d.isToday ? 'text-white bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-900'}`}>{d.day}</span>
                  <span className={`text-[12px] ${d.isToday ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>{d.dow}</span>
                </div>
                <div className="px-2 py-2 min-h-[60px]">
                  {d.leaveCount > 0 && (
                    <div className="bg-[#4fc3f7] text-white text-[11px] rounded px-2 py-1 flex items-center justify-between">
                      <span>휴가자</span>
                      <span className="font-bold">{d.leaveCount} 명</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedDay !== null && (
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="text-[12px] text-gray-500 mb-2">선택: {selectedDay}일 휴가자 상세</div>
            </div>
          )}
        </div>

        {/* 검색 + 페이지 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* 휴가자 테이블 */}
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원명</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서명</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가유형</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가사용일</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용휴가</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">휴가사용기간</th>
          </tr></thead>
          <tbody>
            {dayLeaveMock.map((d, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-500">{d.empNo}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                    <span className="text-gray-800 font-medium">{d.name} {d.position}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
                <td className="px-3 py-2.5 text-gray-700">{d.leaveType}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.dates}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.used}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>) : innerTab === '전사 연차 현황' ? (<>
        {/* 검색 + 연차조정 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* 연차 테이블 */}
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사번</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사원명</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">부서명</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">입사일</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">퇴사일</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">근속연수</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">연차구분</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">연차사용기간</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">잔여</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">사용</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">총연차</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">발생</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">소멸</th>
          </tr></thead>
          <tbody>
            {(search ? filteredLeave.filter((d) => d.name.includes(search) || d.dept.includes(search)) : filteredLeave).slice(0, perPage).map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-2 py-3 text-gray-500">-</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                    <span className="text-gray-800 font-medium">{d.name} {d.position}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-gray-600">{d.dept}</td>
                <td className="px-2 py-3 text-gray-600">{d.hireDate}</td>
                <td className="px-2 py-3 text-gray-400">{d.retireDate || ''}</td>
                <td className="px-2 py-3 text-right text-gray-700">{d.years}</td>
                <td className="px-2 py-3"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.years < 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{d.years < 1 ? '월차' : '연차'}</span></td>
                <td className="px-2 py-3 text-gray-600 text-[11px]">{d.period}</td>
                <td className={`px-2 py-3 text-right font-semibold ${d.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{d.remaining}d</td>
                <td className="px-2 py-3 text-right text-gray-700">{d.used}d</td>
                <td className="px-2 py-3 text-right text-gray-700">{d.total}d</td>
                <td className="px-2 py-3 text-right text-gray-500">{d.generated}d</td>
                <td className="px-2 py-3 text-right text-gray-500">{d.expired}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>) : innerTab === '법적 근로 휴가 현황' ? (<>
        {/* 기타휴가 - 직원별 법적 근로 휴가 사용 현황 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사번</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사원명</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">부서명</th>
            {['보상휴가', '출산휴가', '출산휴가-다태아', '배우자돌봄휴가', '가족돌봄휴가'].map((t) => (
              <th key={t} className="px-2 py-2.5 text-right text-gray-700 font-medium">{t}</th>
            ))}
          </tr></thead>
          <tbody>
            {(search ? filteredLeave.filter((d) => d.name.includes(search) || d.dept.includes(search)) : filteredLeave).slice(0, perPage).map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-2 py-3 text-gray-500">-</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                    <span className="text-gray-800 font-medium">{d.name} {d.position}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-gray-600">{d.dept}</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
                <td className={`px-2 py-3 text-right ${d.name === '김인재' ? 'text-[#1D9E75] font-semibold' : 'text-gray-700'}`}>{d.name === '김인재' ? '2d' : d.name === '박지현' ? '90d' : '0d'}</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
              </tr>
            ))}
          </tbody>
        </table>

      </>) : innerTab === '법적 근로 휴가 결재' ? (<>
        {/* 법적 근로 휴가 결재 */}
        <div className="flex items-center gap-2 mb-6">
          {['전체', '승인대기', '승인완료', '반려'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 text-[12px] rounded-full transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
          ))}
        </div>
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가 유형</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사용 옵션</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가일</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">일수</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청일</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">처리</th>
          </tr></thead>
          <tbody>
            {filteredVacation.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-800 font-medium">{d.name}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
                <td className="px-3 py-2.5 text-gray-700">{d.leaveType}</td>
                <td className="px-3 py-2.5 text-gray-500">{d.dayOption}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.dates}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.days}d</td>
                <td className="px-3 py-2.5 text-gray-500">{d.appliedAt}</td>
                <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? 'bg-gray-100 text-gray-500'}`}>{d.status}</span></td>
                <td className="px-3 py-2.5 text-right">
                  {d.status === '승인대기' && (<>
                    <button className="text-[11px] text-[#1D9E75] hover:underline mr-2">승인</button>
                    <button className="text-[11px] text-red-500 hover:underline">반려</button>
                  </>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>) : null}
    </div>
  )
}
