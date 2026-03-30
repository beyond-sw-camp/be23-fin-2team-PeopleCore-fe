import { useState } from 'react'

interface SubscribedCalendarItem {
  id: string
  name: string
  position: string
  calendarName: string
  status: '신청대기' | '관심 캘린더'
  date: string
}

interface ViewerItem {
  id: string
  name: string
  position: string
  calendarName: string
  status: '수락' | '대기'
  date: string
}

const MOCK_SUBSCRIBED: SubscribedCalendarItem[] = [
  { id: '1', name: '김종율 대표이사', position: '대표이사', calendarName: '내 일정', status: '신청대기', date: '2019-06-14' },
  { id: '2', name: '정다혜 차장', position: '차장', calendarName: '내 일정', status: '신청대기', date: '2026-03-24' },
  { id: '3', name: '김지훈 상무', position: '상무', calendarName: '내 일정', status: '관심 캘린더', date: '2019-07-30' },
  { id: '4', name: '강미정 과장', position: '과장', calendarName: '내 일정', status: '관심 캘린더', date: '2020-01-08' },
]

const MOCK_VIEWERS: ViewerItem[] = []

type MainTab = 'my' | 'subscribed'
type SubFilter = 'registered' | 'viewers'

interface CalendarSettingsProps {
  onClose: () => void
}

export default function CalendarSettings({ onClose }: CalendarSettingsProps) {
  const [mainTab, setMainTab] = useState<MainTab>('subscribed')
  const [subFilter, setSubFilter] = useState<SubFilter>('registered')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [subscribedList] = useState<SubscribedCalendarItem[]>(MOCK_SUBSCRIBED)
  const [viewerList] = useState<ViewerItem[]>(MOCK_VIEWERS)

  const currentList = subFilter === 'registered' ? subscribedList : viewerList
  const allSelected = currentList.length > 0 && selectedIds.length === currentList.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentList.map(item => item.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleDelete = () => {
    setSelectedIds([])
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">내 캘린더 관리</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="fas fa-times text-lg" />
        </button>
      </div>

      {/* 메인 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setMainTab('my')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            mainTab === 'my'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          내 캘린더
        </button>
        <button
          onClick={() => { setMainTab('subscribed'); setSelectedIds([]) }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            mainTab === 'subscribed'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          관심 캘린더
        </button>
      </div>

      {mainTab === 'subscribed' && (
        <>
          {/* 서브 필터 (라디오) */}
          <div className="flex items-center gap-6 mb-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="subFilter"
                checked={subFilter === 'registered'}
                onChange={() => { setSubFilter('registered'); setSelectedIds([]) }}
                className="w-4 h-4"
                style={{ accentColor: '#3b82f6' }}
              />
              <span className="text-sm text-gray-700">내가 등록한 관심 캘린더</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="subFilter"
                checked={subFilter === 'viewers'}
                onChange={() => { setSubFilter('viewers'); setSelectedIds([]) }}
                className="w-4 h-4"
                style={{ accentColor: '#3b82f6' }}
              />
              <span className="text-sm text-gray-700">내 일정을 보고 있는 동료</span>
            </label>
          </div>

          {/* 액션 바 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {subFilter === 'viewers' ? (
                <>
                  <button
                    onClick={() => {}}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <i className="fas fa-check text-xs" />
                    수락
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <i className="fas fa-trash-alt text-xs" />
                    삭제(거절)
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <i className="fas fa-trash-alt text-xs" />
                  삭제
                </button>
              )}
            </div>
            <select className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-600">
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>

          {/* 테이블 */}
          <div className="border-t border-gray-300">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-10 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="py-3 text-left text-sm font-medium text-gray-500">이름</th>
                  <th className="py-3 text-left text-sm font-medium text-gray-500">캘린더</th>
                  <th className="py-3 text-left text-sm font-medium text-gray-500" />
                  <th className="py-3 text-right text-sm font-medium text-gray-500 pr-4">상태</th>
                  <th className="py-3 text-right text-sm font-medium text-gray-500">설정일</th>
                </tr>
              </thead>
              <tbody>
                {currentList.length > 0 ? (
                  currentList.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-3 text-sm text-gray-700">{item.name}</td>
                      <td className="py-3 text-sm text-gray-500">{item.calendarName}</td>
                      <td />
                      <td className="py-3 text-right text-sm pr-4">
                        <span className={
                          item.status === '신청대기'
                            ? 'text-gray-400'
                            : 'text-gray-700'
                        }>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm text-gray-500">{item.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-calendar-alt text-3xl text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">
                          {subFilter === 'registered'
                            ? '등록한 관심 캘린더가 없습니다..'
                            : '관심 캘린더가 없습니다..'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-center gap-1 mt-6">
            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <i className="fas fa-angle-double-left text-xs" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <i className="fas fa-angle-left text-xs" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm text-gray-700 font-medium">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <i className="fas fa-angle-right text-xs" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <i className="fas fa-angle-double-right text-xs" />
            </button>
          </div>
        </>
      )}

      {mainTab === 'my' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <i className="fas fa-calendar-alt text-3xl text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">내 캘린더 설정 기능 준비 중입니다.</p>
        </div>
      )}
    </div>
  )
}
