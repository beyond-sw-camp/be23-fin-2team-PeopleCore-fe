export interface ItemScore { itemId: string; itemName: string; score: number | null; weight: number }
export interface CalibrationLog { date: string; from: string; to: string; reason: string; actor: string }
export interface AppealLog { date: string; reason: string; status: string; decidedAt?: string; decision?: string }

// 목표 등록 단계 조회용 (상세 페이지 Section 1)
export interface GoalEntry {
  goalType: 'KPI' | 'OKR'
  category: string
  title: string
  grade: '상' | '중' | '하'
  ratio: number              // 승인된 목표 중 비율(%) - 백엔드 계산값
  targetValue?: number       // KPI 만
  targetUnit?: string        // KPI 만
}

// 근거자료 파일 (다운로드 링크용)
export interface EvalFile {
  name: string
  url?: string               // MinIO 다운로드 URL
}

// 자기평가 - 목표별 1건
export interface SelfEvalEntry {
  goalType: 'KPI' | 'OKR'
  title: string
  grade: '상' | '중' | '하'
  targetValue?: number
  targetUnit?: string
  actualValue?: number
  achievementLevel?: string  // OKR: 우수/양호/보통/부족/미흡
  achievementDetail: string
  files: EvalFile[]
}

// 상위자평가 - 사원당 1건 (HR 화면이라 comment/feedback 둘 다 노출)
export interface ManagerEvalEntry {
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  comment: string            // HR 내부용 (근거)
  feedback: string           // 사원 공개용 (성장 조언)
}

export interface PersonResult {
  id: string
  name: string
  dept: string
  rank: string
  selfScore: number | null
  managerScore: number | null
  totalScore: number | null
  autoGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null
  finalGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null
  isCalibrated: boolean
  detail?: {
    goals?: GoalEntry[]                  // 목표 등록 단계 내역
    selfEvalEntries?: SelfEvalEntry[]    // 자기평가 상세 (목표별)
    managerEvalEntry?: ManagerEvalEntry  // 상위자평가 상세
    itemScores: ItemScore[]
    rawScore: number
    teamAvg?: number
    teamStd?: number
    companyAvg?: number
    companyStd?: number
    adjustedScore: number
    rank: string
    autoGrade: string
    calibrations: CalibrationLog[]
    lockedAt?: string
    appeals: AppealLog[]
  }
}

export const gradeColors: Record<string, string> = {
  S: 'bg-[#1D9E75]/10 text-[#1D9E75]',
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-yellow-100 text-yellow-700',
  C: 'bg-orange-100 text-orange-700',
  D: 'bg-red-100 text-red-700',
}

export const personResults: PersonResult[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', selfScore: 90, managerScore: 92, totalScore: 91.4, autoGrade: 'S', finalGrade: 'S', isCalibrated: false,
    detail: {
      goals: [
        { goalType: 'KPI', category: '업무성과', title: '신규 채용 건수',   grade: '상', ratio: 50, targetValue: 30, targetUnit: '명' },
        { goalType: 'KPI', category: '업무성과', title: '이직률 감소',       grade: '중', ratio: 33.3, targetValue: 5, targetUnit: '%' },
        { goalType: 'OKR', category: '역량개발', title: '인사 데이터 분석 과정 수료', grade: '하', ratio: 16.7 },
      ],
      selfEvalEntries: [
        { goalType: 'KPI', title: '신규 채용 건수', grade: '상', targetValue: 30, targetUnit: '명', actualValue: 32,
          achievementDetail: 'Q1 20명, Q2 12명 확보. 채용공고 리브랜딩 + 헤드헌팅 비용 30% 절감.',
          files: [{ name: '채용현황_2024H1.xlsx' }, { name: 'recruitment_report.pdf' }] },
        { goalType: 'KPI', title: '이직률 감소', grade: '중', targetValue: 5, targetUnit: '%', actualValue: 4.2,
          achievementDetail: '면담 주기 단축 + 복지제도 개편으로 목표치 초과 달성.',
          files: [{ name: 'turnover_analysis.xlsx' }] },
        { goalType: 'OKR', title: '인사 데이터 분석 과정 수료', grade: '하', achievementLevel: '양호',
          achievementDetail: 'Coursera People Analytics 전 과정 수료. 수료증 첨부.',
          files: [{ name: 'coursera_certificate.pdf' }] },
      ],
      managerEvalEntry: {
        grade: 'S',
        comment: '상반기 채용 KPI 초과 달성 + 이직률 감소 주도. 데이터 기반 HR 이니셔티브 실적 우수.',
        feedback: '리더십 역량이 두드러지니 하반기 팀 단위 프로젝트 주도 경험 확장 권장.',
      },
      itemScores: [
        { itemId: 'self', itemName: '자기평가', score: 90, weight: 30 },
        { itemId: 'manager', itemName: '상위자평가', score: 92, weight: 70 },
      ],
      rawScore: 91.4,
      teamAvg: 88, teamStd: 3, companyAvg: 78, companyStd: 6,
      adjustedScore: 91.4,
      rank: '1위 / 73명',
      autoGrade: 'S',
      calibrations: [],
      lockedAt: '2024-06-30',
      appeals: [],
    },
  },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', selfScore: 85, managerScore: 88, totalScore: 87.1, autoGrade: 'A', finalGrade: 'S', isCalibrated: true,
    detail: {
      itemScores: [
        { itemId: 'self', itemName: '자기평가', score: 85, weight: 30 },
        { itemId: 'manager', itemName: '상위자평가', score: 88, weight: 70 },
      ],
      rawScore: 90.1,
      teamAvg: 82, teamStd: 5, companyAvg: 78, companyStd: 6,
      adjustedScore: 89.2,
      rank: '8위 / 73명',
      autoGrade: 'A',
      calibrations: [
        { date: '2024-06-25', from: 'A', to: 'S', reason: '팀 리더십 및 MSA 전환 프로젝트 PM 기여. Slot 교환(상대: 정하은 S→A)', actor: 'HR 김과장' },
      ],
      lockedAt: '2024-06-30',
      appeals: [],
    },
  },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', selfScore: 82, managerScore: 85, totalScore: 84.1, autoGrade: 'A', finalGrade: 'A', isCalibrated: false,
    detail: {
      itemScores: [
        { itemId: 'self', itemName: '자기평가', score: 82, weight: 30 },
        { itemId: 'manager', itemName: '상위자평가', score: 85, weight: 70 },
      ],
      rawScore: 84.1,
      teamAvg: 82, teamStd: 5, companyAvg: 78, companyStd: 6,
      adjustedScore: 84.1,
      rank: '12위 / 73명',
      autoGrade: 'A',
      calibrations: [],
      lockedAt: '2024-06-30',
      appeals: [],
    },
  },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', selfScore: 88, managerScore: 90, totalScore: 89.4, autoGrade: 'S', finalGrade: 'A', isCalibrated: true,
    detail: {
      itemScores: [
        { itemId: 'self', itemName: '자기평가', score: 88, weight: 30 },
        { itemId: 'manager', itemName: '상위자평가', score: 90, weight: 70 },
      ],
      rawScore: 89.4,
      teamAvg: 80, teamStd: 4, companyAvg: 78, companyStd: 6,
      adjustedScore: 89.4,
      rank: '6위 / 73명',
      autoGrade: 'S',
      calibrations: [
        { date: '2024-06-25', from: 'S', to: 'A', reason: '[교환] 윤재혁(A→S)과 슬롯 교환', actor: 'HR 김과장' },
      ],
      lockedAt: '2024-06-30',
      appeals: [{ date: '2024-07-01', reason: 'S에서 A로 내려간 근거를 확인하고 싶습니다.', status: '기각', decidedAt: '2024-07-05', decision: '평가조정회의 결정 사항으로 Slot 교환 사유가 타당하다고 판단.' }],
    },
  },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', selfScore: 80, managerScore: 82, totalScore: 81.4, autoGrade: 'B', finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', selfScore: 75, managerScore: null, totalScore: null, autoGrade: 'B', finalGrade: 'B', isCalibrated: false },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', selfScore: 70, managerScore: null, totalScore: null, autoGrade: 'C', finalGrade: 'C', isCalibrated: false },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', selfScore: null, managerScore: null, totalScore: null, autoGrade: null, finalGrade: null, isCalibrated: false },
]
