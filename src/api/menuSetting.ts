import api from './client'
import type { MenuKey } from '../components/layout/sidebarMenu'

export type MenuCode =
  | 'DASHBOARD'
  | 'APPROVAL'
  | 'CALENDAR'
  | 'FILES'
  | 'ATTENDANCE'
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
