export default function Header() {
  return (
    <header className="h-14 bg-white border-b border-[#d1d5db] flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold text-[#1D9E75] tracking-tight">PeopleCore</h1>
        <div className="relative w-96">
          <input
            type="text"
            placeholder="전사 통합 검색..."
            className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#1D9E75] text-sm"
          />
          <i className="fas fa-search absolute left-4 top-3 text-gray-400"></i>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative text-gray-500 hover:text-[#1D9E75]">
          <i className="far fa-bell text-xl"></i>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        <button className="text-gray-500 hover:text-[#1D9E75]">
          <i className="far fa-envelope text-xl"></i>
        </button>
        <div className="flex items-center space-x-3 border-l pl-6">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">김철수 팀장</p>
            <p className="text-[11px] text-gray-500">인사총무팀 / PeopleCore</p>
          </div>
          <div className="w-10 h-10 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold">
            JS
          </div>
        </div>
      </div>
    </header>
  )
}
