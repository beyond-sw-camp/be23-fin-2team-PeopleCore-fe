import { useState } from 'react'
import type { CalendarEvent } from './types'
import { useAuth } from '../../contexts/AuthContext'

interface EventDetailModalProps {
  event: CalendarEvent | null
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  isAdmin?: boolean
}

export default function EventDetailModal({ event, onClose, onEdit, onDelete, isAdmin }: EventDetailModalProps) {
  const { user } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!event) return null

  const formatDateTime = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return event.allDay ? `${y}.${m}.${d}` : `${y}.${m}.${d} ${h}:${min}`
  }

  const getRepeatText = () => {
    if (!event.repeat) return null
    const types: Record<string, string> = { daily: '매일', weekly: '매주', monthly: '매월', yearly: '매년', custom: '사용자 정의' }
    let text = types[event.repeat.type]
    if (event.repeat.endType === 'date' && event.repeat.endDate) {
      text += ` (${event.repeat.endDate.toLocaleDateString()} 까지)`
    } else if (event.repeat.endType === 'count') {
      text += ` (${event.repeat.endCount}회)`
    }
    return text
  }

  const isCompanyEvent = event.calendarId.startsWith('company-')
  const isCreator = !!user?.empName && user.empName === event.createdBy
  const canEdit = isCompanyEvent ? !!isAdmin : isCreator
  const isInvitee = !!event.invitees?.some(inv => inv.name === user?.empName)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[min(440px,calc(100vw-24px))] max-h-[80vh] overflow-y-auto">
        {/* 상단 컬러 바 */}
        <div className="h-2 rounded-t-2xl" style={{ backgroundColor: event.color }} />

        <div className="px-6 py-4">
          {/* 제목 */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {!event.isPublic && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">비공개</span>
                )}
                {event.allDay && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">종일</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && (
                <>
                  <button onClick={() => onEdit(event)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <i className="fas fa-pen text-sm" />
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <i className="fas fa-trash text-sm" />
                  </button>
                </>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          </div>

          {!canEdit && isInvitee && (
            <div className="mb-3 flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <i className="fas fa-info-circle text-blue-500 text-xs mt-0.5" />
              <span className="text-xs text-blue-700">참석자로 초대된 일정입니다. 수정/삭제는 작성자만 가능합니다.</span>
            </div>
          )}

          <div className="space-y-3">
            {/* 시간 */}
            <div className="flex items-center gap-3">
              <i className="far fa-clock text-gray-400 w-5 text-center" />
              <div className="text-sm text-gray-700">
                <div>{formatDateTime(event.start)}</div>
                <div className="text-gray-400">~ {formatDateTime(event.end)}</div>
              </div>
            </div>

            {/* 장소 */}
            {event.location && (
              <div className="flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-gray-400 w-5 text-center" />
                <span className="text-sm text-gray-700">{event.location}</span>
              </div>
            )}

            {/* 설명 */}
            {event.description && (
              <div className="flex items-start gap-3">
                <i className="fas fa-align-left text-gray-400 w-5 text-center mt-0.5" />
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* 반복 */}
            {event.repeat && (
              <div className="flex items-center gap-3">
                <i className="fas fa-redo text-gray-400 w-5 text-center" />
                <span className="text-sm text-gray-700">{getRepeatText()}</span>
              </div>
            )}

            {/* 알림 */}
            {event.alarms && event.alarms.length > 0 && (
              <div className="flex items-start gap-3">
                <i className="far fa-bell text-gray-400 w-5 text-center mt-0.5" />
                <div className="space-y-1">
                  {event.alarms.map((alarm, i) => {
                    const units: Record<string, string> = { minutes: '분', hours: '시간', days: '일' }
                    return (
                      <div key={i} className="text-sm text-gray-700">
                        알림 · {alarm.amount}{units[alarm.unit]} 전
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 작성자 */}
            <div className="flex items-center gap-3">
              <i className="far fa-user text-gray-400 w-5 text-center" />
              <span className="text-sm text-gray-700">{event.createdBy}</span>
              {event.createdByDepartment && (
                <span className="text-xs text-gray-400">{event.createdByDepartment}</span>
              )}
            </div>

            {/* 참석자: 실제 초대된 참석자가 1명 이상일 때만 노출 */}
            {event.invitees && event.invitees.length > 0 && (
              <div className="flex items-start gap-3">
                <i className="fas fa-users text-gray-400 w-5 text-center mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-2">참석자 ({event.invitees.length})</div>
                  <div className="space-y-1.5">
                    {event.invitees.map(inv => {
                      const display = inv.name?.trim() || `사번 ${inv.id}`
                      return (
                        <div key={inv.id} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                            {display[0]}
                          </div>
                          <div>
                            <span className="text-sm text-gray-700">{display}</span>
                            {inv.department && <span className="text-xs text-gray-400 ml-1">{inv.department}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(340px,calc(100vw-24px))] p-6 text-center">
            <p className="text-sm text-gray-800 mb-1 font-medium">'{event.title}' 일정을 삭제하시겠습니까?</p>
            <p className="text-xs text-gray-400 mb-5">삭제된 일정은 복구할 수 없습니다.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => { onDelete(event.id); setConfirmDelete(false); onClose() }}
                className="px-5 py-2 text-[13px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
