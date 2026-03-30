export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* 상단 영역: 프로필/결재현황 + 전사게시판 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 사용자 정보 & 결재 카드 */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                <i className="fas fa-user text-3xl text-gray-400"></i>
              </div>
              <h2 className="font-bold text-lg">김철수</h2>
              <p className="text-sm text-gray-500 mb-6">부서: 경영지원팀</p>

              <div className="space-y-3 w-3/4 mx-auto">
                <div className="bg-[#f0f9f6] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between">
                  <p className="text-sm text-[#0F6E56] font-bold">전자결재</p>
                  <p className="text-lg font-bold text-[#1D9E75]">3<span className="text-xs ml-1">건</span></p>
                </div>
                <div className="bg-[#f0f9f6] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between">
                  <p className="text-sm text-[#0F6E56] font-bold">안 읽은 메일</p>
                  <p className="text-lg font-bold text-[#1D9E75]">2<span className="text-xs ml-1">건</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 전사게시판 */}
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full flex flex-col">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">전사 게시판</h3>
                <button className="text-xs text-[#1D9E75] font-bold">+ 더보기</button>
              </div>
              <div className="p-0 flex-1 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
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
        </div>

        {/* 하단 영역: 최근 접속 메뉴 + 캘린더 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 최근 접속 메뉴 */}
          <div className="col-span-12 lg:col-span-3">
            <div className="card p-6 h-full">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-history mr-2 text-[#1D9E75]"></i>
                최근 접속 메뉴
              </h3>
              <ul className="space-y-3">
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
          <div className="col-span-12 lg:col-span-9">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-800">캘린더</h3>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full"><i className="fas fa-chevron-left text-xs"></i></button>
                  <span className="font-bold text-gray-700">2024년 3월</span>
                  <button className="p-2 hover:bg-gray-100 rounded-full"><i className="fas fa-chevron-right text-xs"></i></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 py-2 text-center text-xs font-bold text-red-500">일</div>
                <div className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-600">월</div>
                <div className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-600">화</div>
                <div className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-600">수</div>
                <div className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-600">목</div>
                <div className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-600">금</div>
                <div className="bg-gray-50 py-2 text-center text-xs font-bold text-blue-500">토</div>

                <div className="bg-white h-24 p-2 relative opacity-40">25</div>
                <div className="bg-white h-24 p-2 relative opacity-40">26</div>
                <div className="bg-white h-24 p-2 relative opacity-40">27</div>
                <div className="bg-white h-24 p-2 relative opacity-40">28</div>
                <div className="bg-white h-24 p-2 relative opacity-40">29</div>
                <div className="bg-white h-24 p-2 relative">1</div>
                <div className="bg-white h-24 p-2 relative">2</div>
                <div className="bg-white h-24 p-2 relative">24</div>
                <div className="bg-[#f0f9f6] h-24 p-2 relative border-2 border-[#1D9E75]">
                  <span className="font-bold">25</span>
                  <div className="mt-2 bg-[#1D9E75] text-white text-[10px] p-1 rounded">주간 미팅</div>
                </div>
                <div className="bg-white h-24 p-2 relative">26</div>
                <div className="bg-white h-24 p-2 relative">27</div>
                <div className="bg-white h-24 p-2 relative">
                  28
                  <div className="mt-2 bg-[#9FE1CB] text-[#0F6E56] text-[10px] p-1 rounded">팀 회식</div>
                </div>
                <div className="bg-white h-24 p-2 relative">29</div>
                <div className="bg-white h-24 p-2 relative">30</div>
                <div className="bg-white h-24 p-2 relative">31</div>
                <div className="bg-white h-24 p-2 relative opacity-40">1</div>
                <div className="bg-white h-24 p-2 relative opacity-40">2</div>
                <div className="bg-white h-24 p-2 relative opacity-40">3</div>
                <div className="bg-white h-24 p-2 relative opacity-40">4</div>
                <div className="bg-white h-24 p-2 relative opacity-40">5</div>
                <div className="bg-white h-24 p-2 relative opacity-40">6</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
