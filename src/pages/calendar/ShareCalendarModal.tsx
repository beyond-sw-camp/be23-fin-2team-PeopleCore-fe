import { useState } from 'react'
import type { SharedCalendar } from './types'
import { COLORS } from './types'

interface ShareCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  onRequest: (calendar: SharedCalendar) => void
}

const MOCK_USERS = [
  { id: 'u1', name: '이영희', department: '인사총무팀' },
  { id: 'u2', name: '박지훈', department: '인사총무팀' },
  { id: 'u3', name: '최수진', department: '개발팀' },
  { id: 'u4', name: '정민호', department: '기획팀' },
  { id: 'u5', name: '한서연', department: '디자인팀' },
  { id: 'u6', name: '강동우', department: '마케팅팀' },
  { id: 'u7', name: '김종율', department: '영업팀' },
  { id: 'u8', name: '강미정', department: '경영지원팀' },
  { id: 'u9', name: '정다혜', department: '개발팀' },
]

export default function ShareCalendarModal({ isOpen, onClose, onRequest }: ShareCalendarModalProps) {
  const [searchText, setSearchText] = useState('')

  if (!isOpen) return null

  const filteredUsers = searchText.trim()
    ? MOCK_USERS.filter(u => u.name.includes(searchText) || u.department.includes(searchText))
    : MOCK_USERS

  const handleRequest = (user: typeof MOCK_USERS[0]) => {
    const colorIdx = Math.floor(Math.random() * COLORS.length)
    const newCal: SharedCalendar = {
      id: 'sub-' + user.id,
      name: `내 일정(${user.name})`,
      type: 'subscribed',
      color: COLORS[colorIdx],
      visible: false,
      owner: user.name,
      status: 'pending',
    }
    onRequest(newCal)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] max-h-[70vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-lg text-gray-800">관심 캘린더 추가</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0">
          <p className="text-xs text-gray-500 mb-3">상대방에게 캘린더 공유 요청을 보냅니다. 승인되면 일정을 열람할 수 있습니다.</p>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="이름 또는 부서로 검색..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#2e9e6e] focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">검색 결과가 없습니다</div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="text-sm text-gray-800 font-medium">{user.name}</div>
                      <div className="text-[11px] text-gray-400">{user.department}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequest(user)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-[#2e9e6e] font-medium px-3 py-1.5 rounded-lg bg-[#f0f9f6] hover:bg-[#e0f3ec] transition-all"
                  >
                    신청
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
