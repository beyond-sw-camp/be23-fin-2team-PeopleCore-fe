import { useState } from 'react'

function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: daysInPrevMonth - firstDay + 1 + i, current: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, current: true })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, current: false })
    }
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-900 tracking-tight">{year}년 {month + 1}월</span>
        <div className="flex gap-0.5">
          <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors text-sm">‹</button>
          <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors text-sm">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
          <div key={d} className={`text-[10px] font-semibold tracking-wider py-1 ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center flex-1">
        {cells.map((cell, i) => (
          <div key={i} className="flex items-center justify-center">
            <div
              className={`w-[30px] h-[30px] flex items-center justify-center rounded-full text-xs cursor-pointer transition-colors ${
                !cell.current
                  ? 'text-gray-300'
                  : cell.current && isToday(cell.day)
                    ? 'bg-[#1D9E75] text-white font-bold'
                    : 'text-gray-700 hover:bg-[#E1F5EE]'
              }`}
            >
              {cell.day}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#9FE1CB]"></div>
          <span className="text-xs text-gray-600"><strong className="text-gray-900">오늘:</strong> 주간 미팅</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span className="text-xs text-gray-600"><strong className="text-gray-900">28일:</strong> 팀 회식</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* 상단: 사원카드 + 최근접속메뉴 + 캘린더 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* 사용자 정보 & 결재 카드 */}
          <div className="col-span-12 lg:col-span-3">
            <div className="card p-6 h-full flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                <i className="fas fa-user text-3xl text-gray-400"></i>
              </div>
              <h2 className="font-bold text-lg">김철수 <span className="text-sm font-medium text-gray-500">팀장</span></h2>
              <p className="text-sm text-gray-500 mb-6">부서: 경영지원팀</p>

              <div className="space-y-3 w-3/4 mx-auto">
                <div className="bg-[#E1F5EE] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between">
                  <p className="text-sm text-[#1D9E75] font-bold">전자결재</p>
                  <p className="text-lg font-bold text-[#1D9E75]">3<span className="text-xs ml-1">건</span></p>
                </div>
                <div className="bg-[#E1F5EE] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between">
                  <p className="text-sm text-[#1D9E75] font-bold">안 읽은 메일</p>
                  <p className="text-lg font-bold text-[#1D9E75]">2<span className="text-xs ml-1">건</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 접속 메뉴 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="card p-6 h-full">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-history mr-2 text-[#1D9E75]"></i>
                최근 접속 메뉴
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center text-sm text-gray-600 hover:text-[#1D9E75] cursor-pointer">
                  <div className="w-1 h-1 bg-[#1D9E75] rounded-full mr-3"></div>
                  <span>급여 명세서 조회</span>
                </li>
                <li className="flex items-center text-sm text-gray-600 hover:text-[#1D9E75] cursor-pointer">
                  <div className="w-1 h-1 bg-[#1D9E75] rounded-full mr-3"></div>
                  <span>연차 신청</span>
                </li>
                <li className="flex items-center text-sm text-gray-600 hover:text-[#1D9E75] cursor-pointer">
                  <div className="w-1 h-1 bg-[#1D9E75] rounded-full mr-3"></div>
                  <span>프로젝트 현황</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 캘린더 */}
          <div className="col-span-12 lg:col-span-5">
            <Calendar />
          </div>
        </div>

        {/* 하단: 전사게시판 + 출퇴근 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* 전사게시판 */}
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full flex flex-col">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">전사 게시판</h3>
                <button className="text-xs text-[#1D9E75] font-bold">+ 더보기</button>
              </div>
              <div className="p-0 flex-1 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#1D9E75] text-xs text-white uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">제목</th>
                      <th className="px-6 py-3 font-medium">작성자</th>
                      <th className="px-6 py-3 font-medium">날짜</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">[공지] 2024년 복지 포인트 지급 안내</td>
                      <td className="px-6 py-4 text-sm text-gray-500">인사팀</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2024.03.25</td>
                    </tr>
                    <tr className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">[이벤트] 사내 카페 테이크아웃 할인 혜택</td>
                      <td className="px-6 py-4 text-sm text-gray-500">총무팀</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2024.03.24</td>
                    </tr>
                    <tr className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">시스템 점검에 따른 서비스 일시 중단 안내</td>
                      <td className="px-6 py-4 text-sm text-gray-500">IT운영팀</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2024.03.22</td>
                    </tr>
                    <tr className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">신규 입사자 교육 일정 안내 (4월)</td>
                      <td className="px-6 py-4 text-sm text-gray-500">교육팀</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2024.03.21</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 출퇴근 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="card p-6 h-full flex flex-col">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-fingerprint mr-2 text-[#1D9E75]"></i>
                출퇴근
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <p className="text-xs text-gray-400">현재 상태</p>
                <span className="inline-block px-3 py-1 bg-[#E1F5EE] text-[#1D9E75] text-sm font-bold rounded-full border border-[#9FE1CB]">근무 중</span>
                <p className="text-xs text-gray-500">출근 08:52</p>
                <div className="flex gap-3 w-full mt-2">
                  <button className="flex-1 py-2.5 bg-[#1D9E75] text-white text-sm font-bold rounded-lg hover:bg-[#1D9E75] transition-colors">
                    <i className="fas fa-sign-in-alt mr-1"></i>출근
                  </button>
                  <button className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                    <i className="fas fa-sign-out-alt mr-1"></i>퇴근
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span>이번 달 지각 0회</span>
                <span>초과근무 2.5h</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
