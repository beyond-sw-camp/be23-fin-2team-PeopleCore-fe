import api from './client'

export interface AlarmItem {
  alarmId: number
  alarmType: string
  alarmTitle: string
  alarmContent: string
  alarmLink: string
  alarmRefType: string
  alarmRefId: number
  alarmIsRead: boolean
  createdAt: string
}

export interface AlarmPageResponse {
  content: AlarmItem[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const alarmApi = {
  /** 알림 목록 조회 */
  getAlarms(params: { filter?: 'all' | 'unread'; page?: number; size?: number } = {}) {
    return api.get<AlarmPageResponse>('/collaboration-service/alarm', { params })
  },

  /** 안읽은 알림 개수 */
  getUnreadCount() {
    return api.get<{ count: number }>('/collaboration-service/alarm/unread-count')
  },

  /** 최근 알림 (대시보드 카드용, 최대 5건) */
  getRecent() {
    return api.get<AlarmItem[]>('/collaboration-service/alarm/recent')
  },

  /** 단건 읽음 처리 */
  markAsRead(alarmId: number) {
    return api.patch(`/collaboration-service/alarm/${alarmId}/read`)
  },

  /** 전체 읽음 처리 */
  markAllAsRead() {
    return api.patch('/collaboration-service/alarm/read-all')
  },

  /** 단건 삭제 */
  deleteAlarm(alarmId: number) {
    return api.delete(`/collaboration-service/alarm/${alarmId}`)
  },

  /** 전체 삭제 */
  deleteAllAlarms() {
    return api.delete('/collaboration-service/alarm')
  },
}
