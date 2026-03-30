import type { SharedCalendar } from './types'

interface CalendarSidebarProps {
  calendars: SharedCalendar[]
  onToggleCalendar: (id: string) => void
  onAddSubscription: () => void
}

export default function CalendarSidebar({
  calendars,
  onToggleCalendar,
  onAddSubscription,
}: CalendarSidebarProps) {
  const myCalendars = calendars.filter(c => c.type === 'my')
  const subscribedCalendars = calendars.filter(c => c.type === 'subscribed')
  const companyCalendars = calendars.filter(c => c.type === 'company')

  return (
    <div className="w-[220px] border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      {/* 내 캘린더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-700">내 캘린더</span>
        </div>
        <div className="space-y-2">
          {myCalendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={cal.visible}
                onChange={() => onToggleCalendar(cal.id)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: cal.color }}
              />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">{cal.name}</span>
              <div className="w-2.5 h-2.5 rounded-full ml-auto" style={{ backgroundColor: cal.color }} />
            </label>
          ))}
        </div>
      </div>

      {/* 관심 캘린더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-700">관심 캘린더</span>
        </div>
        <div className="space-y-2">
          {subscribedCalendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 cursor-pointer group">
              {cal.status === 'pending' ? (
                <>
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-500 rounded font-medium shrink-0">신청대기</span>
                  <span className="text-xs text-gray-400 truncate">{cal.name}</span>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={cal.visible}
                    onChange={() => onToggleCalendar(cal.id)}
                    className="w-3.5 h-3.5 rounded"
                    style={{ accentColor: cal.color }}
                  />
                  <span className="text-xs text-gray-700 group-hover:text-gray-900 truncate">{cal.name}</span>
                  <div className="w-2.5 h-2.5 rounded-full ml-auto shrink-0" style={{ backgroundColor: cal.color }} />
                </>
              )}
            </label>
          ))}
        </div>
        <button
          onClick={onAddSubscription}
          className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 hover:text-[#2e9e6e] transition-colors"
        >
          <i className="fas fa-plus text-[10px]" />
          관심 캘린더 추가
        </button>
      </div>

      {/* 전사 캘린더 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-700">전사 캘린더</span>
        </div>
        <div className="space-y-2">
          {companyCalendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={cal.visible}
                onChange={() => onToggleCalendar(cal.id)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: cal.color }}
              />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">{cal.name}</span>
              <div className="w-2.5 h-2.5 rounded-full ml-auto" style={{ backgroundColor: cal.color }} />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
