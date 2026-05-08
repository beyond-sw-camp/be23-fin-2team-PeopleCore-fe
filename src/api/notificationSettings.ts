import api from './client'

/** 업무별 ON·OFF 맵. 키는 프론트 정의(예: 'board' / 'calendar' / 'approval'), 값은 토글 상태. */
export type ServiceSettings = Record<string, boolean>

export interface NotificationSettingsRes {
  serviceSettings: ServiceSettings
  updatedAt: string
}

export interface NotificationSettingsReq {
  serviceSettings: ServiceSettings
}

const BASE = '/hr-service/notification-settings'

export const notificationSettingsApi = {
  getMine: () =>
    api.get<NotificationSettingsRes>(`${BASE}/me`).then(r => r.data),
  updateMine: (req: NotificationSettingsReq) =>
    api.put<NotificationSettingsRes>(`${BASE}/me`, req).then(r => r.data),
}
