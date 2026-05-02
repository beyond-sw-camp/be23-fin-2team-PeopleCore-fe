import api from './client'

// ── 타입 ──

export type RetirementTypeStr = 'severance' | 'DB' | 'DC'
export type PayItemTypeStr = 'PAYMENT' | 'DEDUCTION'

export interface FixedAllowanceRes {
  payItemId: number
  payItemName: string
  amount: number
  taxExemptLimit?: number
  isTaxable?: boolean
}

export interface SalaryInfoRes {
  annualSalary: number
  monthlySalary: number
  fixedAllowances: FixedAllowanceRes[]
}

export interface AccountRes {
  empAccountId: number | null
  bankName: string | null
  accountNumber: string | null
  accountHolder: string | null
}

export interface RetirementAccountRes {
  retirementAccountId: number | null
  retirementType: string | null
  pensionProvider: string | null
  accountNumber: string | null
}

export interface MySalaryInfoRes {
  // 사원 기본
  empId: number
  empName: string
  empEmail: string | null
  empNum: string | null
  empPhone: string | null
  empType: string | null                // enum 문자열 "FULL" / "CONTRACT"
  empHireDate: string | null            // "yyyy-MM-dd"
  deptName: string | null
  gradeName: string | null
  titleName: string | null
  profileImageUrl: string | null
  // 급여·계좌
  salaryInfo: SalaryInfoRes
  salaryAccount: AccountRes | null
  retirementAccount: RetirementAccountRes | null
  // 회사 퇴직연금 설정 (DB형/DB_DC형일 때 운용사·계좌 표시용)
  companyPensionType?: 'severance' | 'DB' | 'DC' | 'DB_DC' | null
  companyPensionProvider?: string | null
  companyPensionAccount?: string | null
  // 부양가족수 (소득세 계산용)
  dependentsCount?: number | null
}

export interface PayStubListRes {
  stubId: number
  payYearMonth: string                  // "YYYY-MM"
  issuedAt: string | null               // ISO datetime
  totalPay: number
  totalDeduction: number
  netPay: number
  sendStatus: string | null             // "SENT" / "PENDING" 등
}

export interface PayStubItemRes {
  payItemId: number
  payItemName: string
  payItemType: PayItemTypeStr
  payItemCategory: string
  amount: number
  isTaxable: boolean | null
  taxExemptLimit?: number
}

export interface PayStubDetailRes {
  stubId: number
  payYearMonth: string
  issuedAt: string | null
  empName: string
  deptName: string | null
  totalPay: number
  totalDeduction: number
  netPay: number
  paymentItems: PayStubItemRes[]
  deductionItems: PayStubItemRes[]
  pdfUrl: string | null
}

export interface PensionInfoRes {
  retirementType: string                // "severance" / "DB" / "DC"
  monthlyDeposit: number
  totalDeposited: number
  lastDepositDate: string | null        // ISO datetime
}

export interface AccountUpdateReq {
  bankName: string
  accountNumber: string
  accountHolder: string
}

// 퇴직금 예상
export interface MySeveranceEstimateRes {
  empId: number
  empName: string
  deptName: string | null
  gradeName: string | null
  retirementType: string                // "severance" / "DB" / "DC"

  hireDate: string                      // yyyy-MM-dd
  baseDate: string
  serviceDays: number
  serviceYears: number                  // BigDecimal → 숫자

  last3MonthPay: number
  lastYearBonus: number
  annualLeaveAllowance: number
  last3MonthDays: number
  avgDailyWage: number                  // BigDecimal → 숫자

  estimatedSeverance: number
  dcDepositedTotal: number | null
  dcDiffAmount: number | null
  displayAmount: number

  calculatedAt: string                  // ISO datetime
}

// ── API ──

const BASE = '/hr-service/pay/my'

export const mySalaryApi = {
  /** 내 급여 정보 */
  getInfo: () =>
    api.get<MySalaryInfoRes>(`${BASE}/info`).then(r => r.data),

  /** 연도별 명세서 목록 */
  getStubList: (year: number | string) =>
    api.get<PayStubListRes[]>(`${BASE}/stubs`, { params: { year } }).then(r => r.data),

  /** 명세서 상세 */
  getStubDetail: (stubId: number) =>
    api.get<PayStubDetailRes>(`${BASE}/stubs/${stubId}`).then(r => r.data),

  /** 퇴직연금 정보 */
  getPension: () =>
    api.get<PensionInfoRes>(`${BASE}/pension`).then(r => r.data),

  /** 급여 계좌 변경 */
  updateAccount: (data: AccountUpdateReq) =>
    api.put(`${BASE}/account`, data),

  /** 부양가족수 변경 */
  updateDependents: (dependentsCount: number) =>
    api.put(`${BASE}/dependents`, { dependentsCount }),

  /** 내 퇴직금 예상 */
  getSeveranceEstimate: (baseDate?: string) =>
    api.get<MySeveranceEstimateRes>(`${BASE}/severance-estimate`, {
      params: baseDate ? { baseDate } : undefined,
    }).then(r => r.data),
}
