export type MenuKey =
  | 'dashboard'
  | 'approval'
  | 'calendar'
  | 'drive'
  | 'attendance'
  | 'leave'
  | 'attendance-admin'
  | 'salary'
  | 'performance'
  | 'hr'
  | 'payroll'
  | 'eval-admin'

export interface MenuItemConfig {
  key: MenuKey
  label: string
  path: string
  togglable: boolean
  lockedOrder: boolean
  requireHRAdmin?: boolean
}

export const SIDEBAR_MENU_ITEMS: MenuItemConfig[] = [
  { key: 'dashboard', label: '대시보드', path: '/', togglable: false, lockedOrder: true },
  { key: 'approval', label: '전자결재', path: '/approval', togglable: true, lockedOrder: false },
  { key: 'calendar', label: '캘린더', path: '/calendar', togglable: false, lockedOrder: false },
  { key: 'drive', label: '파일함', path: '/drive', togglable: false, lockedOrder: false },
  { key: 'attendance', label: '근태', path: '/attendance?tab=attendance', togglable: true, lockedOrder: false },
  { key: 'leave', label: '휴가', path: '/attendance?tab=leave', togglable: true, lockedOrder: false },
  { key: 'attendance-admin', label: '근태/휴가 관리', path: '/attendance-admin', togglable: false, lockedOrder: false, requireHRAdmin: true },
  { key: 'salary', label: '급여', path: '/salary', togglable: false, lockedOrder: false },
  { key: 'performance', label: '성과평가', path: '/eval', togglable: false, lockedOrder: false },
  { key: 'hr', label: '사원 관리', path: '/hr', togglable: false, lockedOrder: false, requireHRAdmin: true },
  { key: 'payroll', label: '급여 관리', path: '/payroll', togglable: false, lockedOrder: false, requireHRAdmin: true },
  { key: 'eval-admin', label: '평가 관리', path: '/eval-admin', togglable: true, lockedOrder: false, requireHRAdmin: true },
]

export const DEFAULT_MENU_ORDER: MenuKey[] = SIDEBAR_MENU_ITEMS.map((i) => i.key)
