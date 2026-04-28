import api from './client'
import type { MenuKey } from '../components/layout/sidebarMenu'

export type MenuCode =
  | 'DASHBOARD'
  | 'APPROVAL'
  | 'CALENDAR'
  | 'FILES'
  | 'ATTENDANCE'
  | 'LEAVE'
  | 'ATTENDANCE_ADMIN'
  | 'PAYROLL'
  | 'PERFORMANCE'
  | 'EMPLOYEE_MGMT'
  | 'PAYROLL_MGMT'
  | 'HR_INTEGRATION'
  | 'EVAL_ADMIN'

export interface MenuSettingItem {
  menuCode: MenuCode
  isVisible: boolean
  sortOrder: number
  toggleable: boolean
}

export interface MenuSettingUpdateItem {
  menuCode: MenuCode
  isVisible: boolean
  sortOrder: number
}

export const MENU_CODE_TO_KEY: Record<MenuCode, MenuKey | null> = {
  DASHBOARD: 'dashboard',
  APPROVAL: 'approval',
  CALENDAR: 'calendar',
  FILES: 'drive',
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  ATTENDANCE_ADMIN: 'attendance-admin',
  PAYROLL: 'salary',
  PERFORMANCE: 'performance',
  EMPLOYEE_MGMT: 'hr',
  PAYROLL_MGMT: 'payroll',
  HR_INTEGRATION: null,
  EVAL_ADMIN: 'eval-admin',
}

export const MENU_KEY_TO_CODE: Record<MenuKey, MenuCode> = {
  dashboard: 'DASHBOARD',
  approval: 'APPROVAL',
  calendar: 'CALENDAR',
  drive: 'FILES',
  attendance: 'ATTENDANCE',
  leave: 'LEAVE',
  'attendance-admin': 'ATTENDANCE_ADMIN',
  salary: 'PAYROLL',
  performance: 'PERFORMANCE',
  hr: 'EMPLOYEE_MGMT',
  payroll: 'PAYROLL_MGMT',
  'eval-admin': 'EVAL_ADMIN',
}

export const fetchMyMenuSettings = () =>
  api.get<MenuSettingItem[]>('/hr-service/menu-settings/me').then(r => r.data)

export const updateMyMenuSettings = (items: MenuSettingUpdateItem[]) =>
  api
    .put<MenuSettingItem[]>('/hr-service/menu-settings/me', { items })
    .then(r => r.data)

export interface RecentMenuItem {
  menuCode: MenuCode
  accessedAt: string
}

// fire-and-forget: 응답 무시. DASHBOARD/권한 없는 코드는 BE 가 자체 무시.
export const recordRecentMenu = (menuCode: MenuCode) =>
  api.post('/hr-service/menu-settings/me/recent', { menuCode }).catch(() => undefined)

export const fetchRecentMenus = () =>
  api.get<RecentMenuItem[]>('/hr-service/menu-settings/me/recent').then(r => r.data)

/** 라우터 location → MenuKey 매핑 (없으면 null) */
export function resolveMenuKeyFromLocation(pathname: string, search: string): MenuKey | null {
  if (pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard'
  if (pathname === '/attendance' || pathname.startsWith('/attendance/')) {
    const tab = new URLSearchParams(search).get('tab')
    return tab === 'attendance' ? 'attendance' : 'leave'
  }
  if (pathname === '/attendance-admin' || pathname.startsWith('/attendance-admin/')) return 'attendance-admin'
  if (pathname === '/approval' || pathname.startsWith('/approval/')) return 'approval'
  if (pathname === '/calendar' || pathname.startsWith('/calendar/')) return 'calendar'
  if (pathname === '/drive' || pathname.startsWith('/drive/')) return 'drive'
  if (pathname === '/salary' || pathname.startsWith('/salary/')) return 'salary'
  if (pathname === '/eval-admin' || pathname.startsWith('/eval-admin/')) return 'eval-admin'
  if (pathname === '/eval' || pathname.startsWith('/eval/')) return 'performance'
  if (pathname === '/hr' || pathname.startsWith('/hr/')) return 'hr'
  if (pathname === '/payroll' || pathname.startsWith('/payroll/')) return 'payroll'
  return null
}
