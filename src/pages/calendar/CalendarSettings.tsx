import { useState } from 'react'
import type { SharedCalendar } from './types'

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

type SettingsTab = 'subscription' | 'leave-sync'
type SubFilter = 'registered' | 'viewers'

interface CalendarSettingsProps {
  onClose: () => void
  myCalendars: SharedCalendar[]
}

export default function CalendarSettings({ onClose, myCalendars }: CalendarSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('subscription')

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">캘린더 관리</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <i className="fas fa-times text-lg" />
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'subscription' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          관심 캘린더 관리
        </button>
        <button
          onClick={() => setActiveTab('leave-sync')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'leave-sync' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          연차 연동 설정
        </button>
      </div>

      {activeTab === 'subscription' && <SubscriptionView />}
      {activeTab === 'leave-sync' && <LeaveSyncView myCalendars={myCalendars} />}
    </div>
  )
}

// ── 관심 캘린더 관리 ──
function SubscriptionView() {
  const [subFilter, setSubFilter] = useState<SubFilter>('registered')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [subscribedList] = useState<SubscribedCalendarItem[]>(MOCK_SUBSCRIBED)
  const [viewerList] = useState<ViewerItem[]>(MOCK_VIEWERS)

  const currentList = subFilter === 'registered' ? subscribedList : viewerList
  const allSelected = currentList.length > 0 && selectedIds.length === currentList.length

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(currentList.map(item => item.id))
  }
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  const handleDelete = () => { setSelectedIds([]) }

  return (
    <div>
      <div className="flex items-center gap-6 mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="subFilter" checked={subFilter === 'registered'} onChange={() => { setSubFilter('registered'); setSelectedIds([]) }} className="w-3.5 h-3.5" style={{ accentColor: '#3b82f6' }} />
          <span className="text-xs text-gray-700">내가 등록한 관심 캘린더</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="subFilter" checked={subFilter === 'viewers'} onChange={() => { setSubFilter('viewers'); setSelectedIds([]) }} className="w-3.5 h-3.5" style={{ accentColor: '#3b82f6' }} />
          <span className="text-xs text-gray-700">내 일정을 보고 있는 동료</span>
        </label>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {subFilter === 'viewers' ? (
            <>
              <button onClick={() => {}} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800"><i className="fas fa-check text-xs" />수락</button>
              <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800"><i className="fas fa-trash-alt text-xs" />삭제(거절)</button>
            </>
          ) : (
            <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800"><i className="fas fa-trash-alt text-xs" />삭제</button>
          )}
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600"><option>20</option><option>50</option><option>100</option></select>
      </div>

      <div className="border-t border-gray-300">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-10 py-3 text-center"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-3.5 h-3.5" /></th>
              <th className="py-3 text-left text-xs font-medium text-gray-500">이름</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500">캘린더</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500" />
              <th className="py-3 text-right text-xs font-medium text-gray-500 pr-4">상태</th>
              <th className="py-3 text-right text-xs font-medium text-gray-500">설정일</th>
            </tr>
          </thead>
          <tbody>
            {currentList.length > 0 ? currentList.map(item => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 text-center"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="w-3.5 h-3.5" /></td>
                <td className="py-3 text-xs text-gray-700">{item.name}</td>
                <td className="py-3 text-xs text-gray-500">{item.calendarName}</td>
                <td />
                <td className="py-3 text-right text-xs pr-4"><span className={item.status === '신청대기' ? 'text-gray-400' : 'text-gray-700'}>{item.status}</span></td>
                <td className="py-3 text-right text-xs text-gray-500">{item.date}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><i className="fas fa-calendar-alt text-3xl text-gray-300" /></div>
                  <p className="text-xs text-gray-400">{subFilter === 'registered' ? '등록한 관심 캘린더가 없습니다..' : '관심 캘린더가 없습니다..'}</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-1 mt-6">
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"><i className="fas fa-angle-double-left text-xs" /></button>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"><i className="fas fa-angle-left text-xs" /></button>
        <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-xs text-gray-700 font-medium">1</button>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"><i className="fas fa-angle-right text-xs" /></button>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"><i className="fas fa-angle-double-right text-xs" /></button>
      </div>
    </div>
  )
}

// ── 연차 연동 설정 ──
function LeaveSyncView({ myCalendars }: { myCalendars: SharedCalendar[] }) {
  const [syncCalendarIds, setSyncCalendarIds] = useState<string[]>(myCalendars.length > 0 ? [myCalendars[0].id] : [])
  const [isPublic, setIsPublic] = useState(false)

  const toggleCalendar = (id: string) => {
    setSyncCalendarIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-5">전자결재에서 연차가 승인되면 캘린더에 자동으로 일정을 등록합니다.</p>

      {/* 연동할 캘린더 선택 */}
      <div className="border border-gray-200 rounded-lg p-5 mb-5">
        <h4 className="text-sm font-medium text-gray-800 mb-1">연동할 캘린더</h4>
        <p className="text-[11px] text-gray-400 mb-4">승인된 연차를 등록할 캘린더를 선택합니다. 여러 개 선택 가능합니다.</p>
        <div className="space-y-2.5">
          {myCalendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={syncCalendarIds.includes(cal.id)} onChange={() => toggleCalendar(cal.id)} className="w-3.5 h-3.5 accent-[#2e9e6e]" />
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
              <span className="text-xs text-gray-700">{cal.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 공개 설정 */}
      <div className="border border-gray-200 rounded-lg p-5 mb-5">
        <h4 className="text-sm font-medium text-gray-800 mb-1">연차 일정 공개 여부</h4>
        <p className="text-[11px] text-gray-400 mb-4">등록되는 연차 일정을 다른 사람에게 공개할지 설정합니다.</p>
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="accent-[#2e9e6e]" />
            <span className="text-xs text-gray-700">공개</span>
            <span className="text-[10px] text-gray-400 ml-1">관심 캘린더 구독자에게 표시</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="accent-[#2e9e6e]" />
            <span className="text-xs text-gray-700">비공개</span>
            <span className="text-[10px] text-gray-400 ml-1">본인만 확인 가능</span>
          </label>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 rounded-lg p-3 text-[11px] text-blue-700 space-y-1">
        <p>• 연차 결재가 <strong>승인 완료</strong>되면 선택한 캘린더에 종일 일정으로 자동 등록됩니다.</p>
        <p>• <strong>공개</strong> 선택 시 내 캘린더를 구독 중인 동료에게 연차 일정이 표시됩니다.</p>
        <p>• <strong>비공개</strong> 선택 시 본인만 확인할 수 있습니다.</p>
      </div>

      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#2e9e6e] text-white text-[13px] font-medium rounded-lg hover:bg-[#26865d]">저장</button>
      </div>
    </div>
  )
}
