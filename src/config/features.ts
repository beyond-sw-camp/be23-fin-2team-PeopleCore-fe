/**
 * 통합검색의 "기능 이동" 레지스트리.
 *
 * keywords: 라벨 외에 추가 매칭어 (동의어, 영어, 축약어 등)
 * requiredRole: 'HR_ADMIN' 이상만 접근 가능하면 'HR_ADMIN',
 *               'HR_SUPER_ADMIN' 전용이면 'HR_SUPER_ADMIN'
 * action:
 *   { type: 'navigate', path }  → react-router navigate
 *   { type: 'event', name }     → window.dispatchEvent(CustomEvent)
 */

export type FeatureRole = 'HR_ADMIN' | 'HR_SUPER_ADMIN'

export interface FeatureEntry {
  id: string
  label: string
  keywords: string[]
  icon: string
  category: string
  requiredRole?: FeatureRole
  action:
    | { type: 'navigate'; path: string }
    | { type: 'event'; name: string }
}

export const FEATURES: FeatureEntry[] = [
  // ── 주요 메뉴 ──
  { id: 'dashboard', label: '대시보드', keywords: ['홈', 'home', 'dashboard'], icon: 'fa-solid fa-house', category: '메뉴', action: { type: 'navigate', path: '/' } },
  { id: 'board', label: '게시판', keywords: ['공지', '공지사항', 'board', '글'], icon: 'fa-solid fa-clipboard-list', category: '메뉴', action: { type: 'navigate', path: '/board' } },
  { id: 'approval', label: '전자결재', keywords: ['결재', '기안', '문서', 'approval'], icon: 'fa-solid fa-file-signature', category: '메뉴', action: { type: 'navigate', path: '/approval' } },
  { id: 'calendar', label: '캘린더', keywords: ['일정', '스케줄', 'schedule', 'calendar'], icon: 'fa-solid fa-calendar-days', category: '메뉴', action: { type: 'navigate', path: '/calendar' } },
  { id: 'drive', label: '파일함', keywords: ['파일', '드라이브', 'drive', 'file'], icon: 'fa-solid fa-folder-open', category: '메뉴', action: { type: 'navigate', path: '/drive' } },
  { id: 'attendance', label: '근태 / 연차', keywords: ['근태', '연차', '출근', '퇴근', '휴가', 'attendance'], icon: 'fa-solid fa-clock', category: '메뉴', action: { type: 'navigate', path: '/attendance' } },
  { id: 'salary', label: '급여', keywords: ['월급', '연봉', '급여명세서', 'salary', 'pay'], icon: 'fa-solid fa-won-sign', category: '메뉴', action: { type: 'navigate', path: '/salary' } },
  { id: 'eval', label: '성과평가', keywords: ['평가', '성과', '성과관리', '성과 관리', 'evaluation', 'performance'], icon: 'fa-solid fa-chart-line', category: '메뉴', action: { type: 'navigate', path: '/eval' } },
  { id: 'orgchart', label: '조직도', keywords: ['조직', '부서도', '조직구조', 'org'], icon: 'fa-solid fa-sitemap', category: '메뉴', action: { type: 'event', name: 'open-orgchart' } },

  // ── 성과 관리 세부 ──
  { id: 'eval-goal', label: '목표 등록', keywords: ['목표', '성과목표'], icon: 'fa-solid fa-bullseye', category: '성과', action: { type: 'navigate', path: '/eval/employee/goal' } },
  { id: 'eval-self', label: '자기평가', keywords: ['자가평가', '셀프평가'], icon: 'fa-solid fa-user-check', category: '성과', action: { type: 'navigate', path: '/eval/employee/self' } },
  { id: 'eval-result', label: '내 평가결과', keywords: ['평가결과', '내결과'], icon: 'fa-solid fa-square-poll-vertical', category: '성과', action: { type: 'navigate', path: '/eval/employee/result' } },
  { id: 'eval-appeal', label: '이의신청', keywords: ['평가이의', 'appeal'], icon: 'fa-regular fa-flag', category: '성과', action: { type: 'navigate', path: '/eval/employee/appeal' } },
  { id: 'eval-goal-approve', label: '목표 승인', keywords: ['목표승인'], icon: 'fa-solid fa-check-double', category: '성과(관리자)', action: { type: 'navigate', path: '/eval/manager/goal-approve' } },
  { id: 'eval-achievement', label: '성취도 검토', keywords: ['성취도'], icon: 'fa-solid fa-magnifying-glass-chart', category: '성과(관리자)', action: { type: 'navigate', path: '/eval/manager/achievement' } },
  { id: 'eval-team', label: '팀 평가', keywords: ['팀평가'], icon: 'fa-solid fa-people-group', category: '성과(관리자)', action: { type: 'navigate', path: '/eval/manager/eval' } },

  // ── 사원 관리 (HR_ADMIN+) ──
  { id: 'hr', label: '사원 관리', keywords: ['인사', 'HR', '직원관리'], icon: 'fa-solid fa-user-tie', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr' } },
  { id: 'hr-list', label: '사원 목록', keywords: ['직원목록', '사원리스트'], icon: 'fa-solid fa-list', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/list' } },
  { id: 'hr-register', label: '사원 등록', keywords: ['신규사원', '입사등록'], icon: 'fa-solid fa-user-plus', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/employee/register' } },
  { id: 'hr-salary-contract', label: '연봉계약', keywords: ['계약', '연봉'], icon: 'fa-solid fa-file-contract', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/salary-contract' } },
  { id: 'hr-certificate', label: '증명서 발급', keywords: ['증명서', '재직증명', '경력증명'], icon: 'fa-solid fa-stamp', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/certificate' } },
  { id: 'hr-workforce', label: '인력 현황', keywords: ['인력현황', '인원'], icon: 'fa-solid fa-users', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/workforce' } },
  { id: 'hr-retirement', label: '퇴사 관리', keywords: ['퇴사', '퇴직'], icon: 'fa-solid fa-door-open', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/retirement' } },
  { id: 'hr-appointment', label: '인사발령', keywords: ['발령', '인사이동'], icon: 'fa-solid fa-arrow-right-arrow-left', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/appointment' } },
  { id: 'hr-permission', label: '권한 관리', keywords: ['권한', 'permission', '역할'], icon: 'fa-solid fa-user-shield', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/permission' } },
  { id: 'hr-face-login', label: '얼굴 로그인 관리', keywords: ['얼굴인식', '페이스로그인', 'face'], icon: 'fa-solid fa-face-smile', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/face-login' } },
  { id: 'hr-history', label: '인사 변경 이력', keywords: ['이력', 'history'], icon: 'fa-solid fa-clock-rotate-left', category: '인사', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/hr/history' } },

  // ── 급여 관리 (HR_ADMIN+) ──
  { id: 'payroll', label: '급여 관리', keywords: ['페이롤', 'payroll', '급여관리'], icon: 'fa-solid fa-money-check-dollar', category: '급여', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/payroll' } },
  { id: 'payroll-employee', label: '사원별 급여', keywords: ['직원급여'], icon: 'fa-solid fa-coins', category: '급여', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/payroll/employee' } },
  { id: 'payroll-ledger', label: '급여대장', keywords: ['대장', '원천'], icon: 'fa-solid fa-book', category: '급여', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/payroll/ledger' } },
  { id: 'payroll-insurance', label: '정산보험료', keywords: ['4대보험', '보험정산', '보험'], icon: 'fa-solid fa-shield', category: '급여', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/payroll/insurance-settle' } },
  { id: 'payroll-severance-ledger', label: '퇴직금 대장', keywords: ['퇴직금대장'], icon: 'fa-solid fa-book-bookmark', category: '급여', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/payroll/severance-ledger' } },
  { id: 'payroll-severance-estimate', label: '퇴직금 추계', keywords: ['퇴직금', '추계'], icon: 'fa-solid fa-calculator', category: '급여', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/payroll/severance-estimate' } },
  { id: 'payroll-leave-allowance', label: '연차수당 추계', keywords: ['연차수당'], icon: 'fa-solid fa-umbrella-beach', category: '급여', requiredRole: 'HR_ADMIN', action: { type: 'navigate', path: '/payroll/leave-allowance' } },

  // ── 최고관리자 전용 ──
  { id: 'hr-admin', label: '인사통합', keywords: ['인사통합', '조직관리', '관리자'], icon: 'fa-solid fa-shield-halved', category: '최고관리자', requiredRole: 'HR_SUPER_ADMIN', action: { type: 'event', name: 'open-hr-admin-pin' } },
]

export function filterFeaturesByRole(
  features: FeatureEntry[],
  role: 'HR_SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE' | undefined
): FeatureEntry[] {
  return features.filter((f) => {
    if (!f.requiredRole) return true
    if (f.requiredRole === 'HR_SUPER_ADMIN') return role === 'HR_SUPER_ADMIN'
    if (f.requiredRole === 'HR_ADMIN') return role === 'HR_ADMIN' || role === 'HR_SUPER_ADMIN'
    return false
  })
}

export function matchFeatures(
  query: string,
  features: FeatureEntry[],
  limit = 3
): FeatureEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return features
    .map((f) => {
      const label = f.label.toLowerCase()
      const haystack = [label, ...f.keywords.map((k) => k.toLowerCase())].join(' ')
      if (!haystack.includes(q)) return null
      // 점수: 라벨 시작 > 라벨 포함 > 키워드 포함
      let score = 1
      if (label.startsWith(q)) score = 3
      else if (label.includes(q)) score = 2
      return { f, score }
    })
    .filter((x): x is { f: FeatureEntry; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.f)
}
