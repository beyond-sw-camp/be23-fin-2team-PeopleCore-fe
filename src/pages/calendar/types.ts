export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  location?: string
  description?: string
  isPublic: boolean
  calendarId: string
  color: string
  repeat?: RepeatConfig
  alarms?: AlarmConfig[]
  invitees?: Invitee[]
  createdBy: string
}

export interface RepeatConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number
  endType: 'date' | 'count' | 'never'
  endDate?: Date
  endCount?: number
  weekdays?: number[] // 0-6 for custom weekly
}

export interface AlarmConfig {
  method: 'email' | 'webpush' | 'popup'
  amount: number
  unit: 'minutes' | 'hours' | 'days'
}

export interface Invitee {
  id: string
  name: string
  department: string
  status: 'pending' | 'accepted' | 'declined' | 'maybe'
  comment?: string
}

export interface SharedCalendar {
  id: string
  name: string
  type: 'personal' | 'department' | 'team' | 'project'
  color: string
  visible: boolean
  permission: 'view' | 'edit' | 'admin'
  owner: string
}

export type CalendarViewType = 'day' | 'week' | 'month' | 'year'

export interface Holiday {
  date: Date
  name: string
  type: 'public' | 'company'
}

// Mock data
export const COLORS = [
  '#2e9e6e', '#3b82f6', '#ef4444', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

export const MOCK_CALENDARS: SharedCalendar[] = [
  { id: 'personal', name: '내 캘린더', type: 'personal', color: '#2e9e6e', visible: true, permission: 'admin', owner: '김철수' },
  { id: 'hr-dept', name: '인사총무팀', type: 'department', color: '#3b82f6', visible: true, permission: 'edit', owner: '인사총무팀' },
  { id: 'project-a', name: '프로젝트 Alpha', type: 'project', color: '#f59e0b', visible: true, permission: 'edit', owner: '김철수' },
  { id: 'company', name: '전사 캘린더', type: 'team', color: '#8b5cf6', visible: false, permission: 'view', owner: '관리자' },
]

export const MOCK_HOLIDAYS: Holiday[] = [
  { date: new Date(2026, 0, 1), name: '신정', type: 'public' },
  { date: new Date(2026, 2, 1), name: '삼일절', type: 'public' },
  { date: new Date(2026, 4, 5), name: '어린이날', type: 'public' },
  { date: new Date(2026, 5, 6), name: '현충일', type: 'public' },
  { date: new Date(2026, 7, 15), name: '광복절', type: 'public' },
  { date: new Date(2026, 9, 3), name: '개천절', type: 'public' },
  { date: new Date(2026, 9, 9), name: '한글날', type: 'public' },
  { date: new Date(2026, 11, 25), name: '크리스마스', type: 'public' },
  { date: new Date(2026, 3, 15), name: '창립기념일', type: 'company' },
  { date: new Date(2026, 10, 20), name: '사내 워크숍', type: 'company' },
]

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: '주간 팀 미팅',
    start: new Date(2026, 2, 30, 10, 0),
    end: new Date(2026, 2, 30, 11, 0),
    allDay: false,
    location: '3층 회의실 A',
    description: '이번 주 업무 현황 공유 및 다음 주 계획 논의',
    isPublic: true,
    calendarId: 'personal',
    color: '#2e9e6e',
    createdBy: '김철수',
    alarms: [{ method: 'popup', amount: 10, unit: 'minutes' }],
    invitees: [
      { id: 'u1', name: '이영희', department: '인사총무팀', status: 'accepted' },
      { id: 'u2', name: '박지훈', department: '인사총무팀', status: 'pending' },
    ],
  },
  {
    id: '2',
    title: '신규 입사자 OT',
    start: new Date(2026, 2, 30, 14, 0),
    end: new Date(2026, 2, 30, 16, 0),
    allDay: false,
    location: '교육장',
    description: '4월 신규 입사자 대상 오리엔테이션',
    isPublic: true,
    calendarId: 'hr-dept',
    color: '#3b82f6',
    createdBy: '김철수',
  },
  {
    id: '3',
    title: '프로젝트 Alpha 킥오프',
    start: new Date(2026, 2, 31, 9, 0),
    end: new Date(2026, 2, 31, 10, 30),
    allDay: false,
    location: '5층 대회의실',
    isPublic: true,
    calendarId: 'project-a',
    color: '#f59e0b',
    createdBy: '김철수',
    invitees: [
      { id: 'u3', name: '최수진', department: '개발팀', status: 'accepted' },
      { id: 'u4', name: '정민호', department: '기획팀', status: 'maybe', comment: '다른 일정과 겹칠 수 있습니다' },
    ],
  },
  {
    id: '4',
    title: '연차',
    start: new Date(2026, 3, 2, 0, 0),
    end: new Date(2026, 3, 2, 23, 59),
    allDay: true,
    isPublic: false,
    calendarId: 'personal',
    color: '#2e9e6e',
    createdBy: '김철수',
  },
  {
    id: '5',
    title: '급여 정산 마감',
    start: new Date(2026, 2, 28, 0, 0),
    end: new Date(2026, 2, 28, 23, 59),
    allDay: true,
    isPublic: true,
    calendarId: 'hr-dept',
    color: '#3b82f6',
    createdBy: '이영희',
  },
  {
    id: '6',
    title: '팀 회식',
    start: new Date(2026, 3, 3, 18, 0),
    end: new Date(2026, 3, 3, 20, 0),
    allDay: false,
    location: '강남역 근처',
    isPublic: true,
    calendarId: 'hr-dept',
    color: '#3b82f6',
    createdBy: '김철수',
  },
]
