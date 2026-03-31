import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SettingsModal from '../modals/SettingsModal'

export default function Header() {
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setProfileOpen(false)
    navigate('/login')
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-[#d1d5db] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <h1
            className="text-xl font-bold text-[#1D9E75] tracking-tight cursor-pointer select-none"
            onClick={() => navigate('/')}
          >
            PeopleCore
          </h1>
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
          <button
            className="text-gray-500 hover:text-[#1D9E75]"
            onClick={() => window.open('/messenger', 'messenger', 'width=1100,height=700')}
            title="메신저"
          >
            <i className="far fa-comment-dots text-xl"></i>
          </button>

          {/* 프로필 영역 */}
          <div className="relative border-l pl-6" ref={profileRef}>
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">김철수 팀장</p>
                <p className="text-[11px] text-gray-500">인사총무팀 / PeopleCore</p>
              </div>
              <div className="w-10 h-10 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold">
                JS
              </div>
            </div>

            {/* 프로필 드롭다운 */}
            {profileOpen && (
              <div className="absolute right-0 top-14 w-[220px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="flex justify-end px-3 pt-2">
                  <button onClick={() => setProfileOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
                </div>
                <div className="flex flex-col items-center pb-4 px-4">
                  <div className="w-16 h-16 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold text-xl mb-2">
                    JS
                  </div>
                  <p className="text-sm font-bold text-gray-800">김철수 팀장</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">kimcs@peoplecore.kr</p>
                </div>
                <div className="border-t border-gray-100 px-4 py-3 flex justify-center gap-6">
                  <button
                    onClick={() => { setProfileOpen(false); setSettingsOpen(true) }}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-cog text-sm" />
                    </div>
                    <span className="text-[11px]">설정</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-power-off text-sm" />
                    </div>
                    <span className="text-[11px]">로그아웃</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
