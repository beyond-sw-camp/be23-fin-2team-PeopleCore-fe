import api from './client'

// ── 타입 ──
export interface BankRes {
  bankCode: string
  bankName: string
}

export interface PaySettingsReq {
  salaryPayMonth: 'CURRENT' | 'NEXT'
  salaryPayDay: number | null
  salaryPayLastDay: boolean
  mainBankCode: string
}

export interface PaySettingsRes {
  companyPaySettingsId: number
  salaryPayDay: number | null
  salaryPayLastDay: boolean
  salaryPayMonth: 'CURRENT' | 'NEXT'
  salaryPayMonthLabel: string
  mainBankCode: string
  mainBankName: string
  updatedAt: string
}

export type PayItemType = 'PAYMENT' | 'DEDUCTION'
export type PayItemCategory = 'SALARY' | 'ALLOWANCE' | 'BONUS' | 'INSURANCE' | 'TAX' | 'OTHER_DEDUCTION'

export interface PayItemReq {
  payItemName: string
  payItemType: PayItemType
  isFixed?: boolean
  isTaxable?: boolean
  taxExemptLimit?: number
  payItemCategory?: PayItemCategory
  sortOrder?: number
}

export type LegalCalcType = 'OVERTIME' | 'NIGHT' | 'HOLIDAY' | 'LEAVE' | null

export interface PayItemRes {
  payItemId: number
  payItemName: string
  payItemType: PayItemType
  isFixed: boolean
  isTaxable: boolean
  taxExemptLimit: number
  payItemCategory: PayItemCategory
  sortOrder: number
  isActive: boolean
  isLegal: boolean
  legalCalcType: LegalCalcType
  isProtect?: boolean
}

// ── 보험요율 타입 ──
export interface InsuranceRatesRes {
  insuranceRatesId: number
  year: number
  nationalPension: number
  healthInsurance: number
  longTermCare: number
  employInsurance: number
  employInsuranceEmployer: number
  pensionUpperLimit: number
  pensionLowerLimit: number
  validFrom: string
  validTo: string
  updatedAt: string
}

export interface InsuranceJobTypesReq {
  name: string
  description?: string
  industrialAccidentRate: number
}

export interface InsuranceJobTypesRes {
  jobTypesId: number
  name: string
  description: string
  industrialAccidentRate: number
  isActive: boolean
}

// ── 보험요율 API ──
export const insuranceApi = {
  getRates: (year?: number) =>
    year
      ? api.get<InsuranceRatesRes>(`/hr-service/pay/superadmin/insurance/rates/${year}`).then(r => r.data)
      : api.get<InsuranceRatesRes>('/hr-service/pay/superadmin/insurance/rates').then(r => r.data),

  updateEmployerRate: (employmentInsuranceEmployer: number) =>
    api.put('/hr-service/pay/superadmin/insurance/rates/employer', { employmentInsuranceEmployer }).then(r => r.data),

  getJobTypes: () =>
    api.get<InsuranceJobTypesRes[]>('/hr-service/pay/superadmin/insurance/jobtypes').then(r => r.data),

  createJobType: (data: InsuranceJobTypesReq) =>
    api.post<InsuranceJobTypesRes>('/hr-service/pay/superadmin/insurance/jobtypes', data).then(r => r.data),

  updateJobType: (id: number, data: InsuranceJobTypesReq) =>
    api.put<InsuranceJobTypesRes>(`/hr-service/pay/superadmin/insurance/jobtypes/${id}`, data).then(r => r.data),

  toggleJobType: (id: number) =>
    api.patch<InsuranceJobTypesRes>(`/hr-service/pay/superadmin/insurance/jobtypes/${id}`).then(r => r.data),

  deleteJobType: (id: number) =>
    api.delete(`/hr-service/pay/superadmin/insurance/jobtypes/${id}`),
}

// ── 급여대장(작성) 타입 ──
export type PayrollStatus = 'PENDING' | 'CONFIRMED' | 'IN_APPROVAL' | 'PAID'

export interface PayrollEmpRes {
  empId: number; empName: string; deptName: string; gradeName: string | null
  empType: string; status: string
  totalPay: number; totalDeduction: number; netPay: number; unpaid: number
}

export interface PayrollRunRes {
  payrollRunId: number; payYearMonth: string; payrollStatus: string
  totalEmployees: number; totalPay: number; totalDeduction: number; totalNetPay: number; unpaidAmount: number
  payDate: string | null
  employees: PayrollEmpRes[]
}

export interface PayrollItemDto { payItemId: number; payItemName: string; amount: number }

export interface PayrollEmpDetailRes {
  empID: number; empName: string; deptName: string; gradeName: string | null; empType: string
  paymentItems: PayrollItemDto[]
  deductionItems: PayrollItemDto[]
  totalPay: number; totalDeduction: number; netPay: number
}

export interface WageInfoRes { hourlyWage: number; dailyWage: number }

export interface DailyOvertimeDto {
  workDate: string
  recognizedExtendedMinutes: number
  recognizedNightMinutes: number
  recognizedHolidayMinutes: number
  actualWorkMinutes: number
}

export interface ApprovedOvertimeRes {
  totalExtendedMinutes: number; totalNightMinutes: number; totalHolidayMinutes: number
  extendedPay: number; nightPay: number; holidayPay: number; totalAmount: number
  applied: boolean
  dailyItems: DailyOvertimeDto[]
}

export interface CalcDeductionReq { totalPay: number; empId: number }
export interface CalcDeductionRes {
  nationalPension: number; healthInsurance: number; longTermCare: number; employmentInsurance: number
  incomeTax: number; localIncomeTax: number
  totalDeduction: number; netPay: number
}

const PAYROLL_BASE = '/hr-service/pay/admin/payroll'

export const payrollApi = {
  getPayroll: (payYearMonth: string) =>
    api.get<PayrollRunRes>(PAYROLL_BASE, { params: { payYearMonth } }).then(r => r.data),

  createPayroll: (payYearMonth: string) =>
    api.post<PayrollRunRes>(`${PAYROLL_BASE}/create`, null, { params: { payYearMonth } }).then(r => r.data),

  copyFromPreviousMonth: (payYearMonth: string) =>
    api.post<PayrollRunRes>(`${PAYROLL_BASE}/copy`, null, { params: { payYearMonth } }).then(r => r.data),

  getEmpDetail: (payrollRunId: number, empId: number) =>
    api.get<PayrollEmpDetailRes>(`${PAYROLL_BASE}/${payrollRunId}/employees/${empId}`).then(r => r.data),

  confirmPayroll: (payrollRunId: number) =>
    api.put(`${PAYROLL_BASE}/${payrollRunId}/confirm`),

  submitApproval: (payrollRunId: number, approvalDocId: number) =>
    api.post(`${PAYROLL_BASE}/${payrollRunId}/submit-approval`, null, { params: { approvalDocId } }),

  processPayment: (payrollRunId: number) =>
    api.put(`${PAYROLL_BASE}/${payrollRunId}/pay`),

  downloadTransferFile: (payrollRunId: number) =>
    api.get(`${PAYROLL_BASE}/${payrollRunId}/transfer-file`, { responseType: 'blob' }),

  getWageInfo: (payrollRunId: number, empId: number) =>
    api.get<WageInfoRes>(`${PAYROLL_BASE}/${payrollRunId}/employees/${empId}/wage-info`).then(r => r.data),

  getApprovedOvertime: (payrollRunId: number, empId: number) =>
    api.get<ApprovedOvertimeRes>(`${PAYROLL_BASE}/${payrollRunId}/employees/${empId}/approved-overtime`).then(r => r.data),

  applyOvertime: (payrollRunId: number, empId: number) =>
    api.post(`${PAYROLL_BASE}/${payrollRunId}/employees/${empId}/apply-overtime`),

  calcDeductions: (data: CalcDeductionReq) =>
    api.post<CalcDeductionRes>(`${PAYROLL_BASE}/calc-deductions`, data).then(r => r.data),
}

// ── 연차수당 산정 타입 ──
export type AllowanceType = 'FISCAL_YEAR' | 'ANNIVERSARY' | 'RESIGNED'
export type AllowanceStatus = 'PENDING' | 'CALCULATED' | 'APPLIED'

export interface LeaveAllowanceRes {
  allowanceId: number; empId: number; empName: string; deptName: string; gradeName: string | null
  hireDate: string; resignDate: string | null
  normalMonthlySalary: number; dailyWage: number
  totalLeaveDays: number; usedLeaveDays: number; unusedLeaveDays: number
  allowanceAmount: number; status: AllowanceStatus; appliedMonth: string | null
}

export interface LeaveAllowanceSummaryRes {
  totalTarget: number; calculatedCount: number; appliedCount: number; totalAllowanceAmount: number
  employees: LeaveAllowanceRes[]
}

export interface LeavePolicyTypeRes {
  policyBaseType: 'FISCAL' | 'HIRE'
  fiscalYearStart: string | null
}

const LEAVE_ALLOW_BASE = '/hr-service/pay/admin/leave-allowance'

export const leaveAllowanceApi = {
  getPolicyType: () =>
    api.get<LeavePolicyTypeRes>(`${LEAVE_ALLOW_BASE}/policy-type`).then(r => r.data),

  getFiscalYearList: (year: number) =>
    api.get<LeaveAllowanceSummaryRes>(`${LEAVE_ALLOW_BASE}/year-end`, { params: { year } }).then(r => r.data),

  getResignedList: (year: number) =>
    api.get<LeaveAllowanceSummaryRes>(`${LEAVE_ALLOW_BASE}/resigned`, { params: { year } }).then(r => r.data),

  calculate: (year: number, type: AllowanceType, empIds: number[]) =>
    api.post(`${LEAVE_ALLOW_BASE}/calculate`, empIds, { params: { year, type } }),

  applyToPayroll: (allowanceIds: number[]) =>
    api.post(`${LEAVE_ALLOW_BASE}/apply-to-payroll`, allowanceIds),
}

// ── 전자결재 상신(결의서) 타입 ──
export type ApprovalFormType = 'SALARY' | 'RETIREMENT'

export interface ApprovalDraftRes {
  type: ApprovalFormType
  ledgerId: number
  htmlTemplate: string
  dataMap: Record<string, string>
}

export interface ApprovalLineItem {
  approverId: number
  order: number
  approvalType: string           // "APPROVE" | "REVIEW" | "AGREEMENT"
}

export interface ApprovalSubmitReq {
  type: ApprovalFormType
  ledgerId: number
  htmlContent: string            // dataMap이 반영되고 사용자 수정된 최종 HTML
  approvalLine: ApprovalLineItem[]
}

const APPROVAL_DRAFT_BASE = '/hr-service/pay/admin/approval'

export const approvalDraftApi = {
  getDraft: (type: ApprovalFormType, ledgerId: number) =>
    api.get<ApprovalDraftRes>(`${APPROVAL_DRAFT_BASE}/draft`, { params: { type, ledgerId } }).then(r => r.data),

  submit: (data: ApprovalSubmitReq) =>
    api.post(`${APPROVAL_DRAFT_BASE}/submit`, data),
}

// ── 퇴직금 타입 ──
export type SevStatus = 'CALCULATING' | 'CONFIRMED' | 'IN_APPROVAL' | 'APPROVED' | 'PAID'

export interface SeveranceCalcReq { empId: number }

export interface SeveranceRes {
  sevId: number; empId: number; empName: string; deptName: string; gradeName: string | null
  workGroupName: string | null; retirementType: 'severance' | 'DB' | 'DC'
  hireDate: string; resignDate: string
  serviceYears: number
  severanceAmount: number; taxAmount: number; netAmount: number
  dcDepositedTotal: number; dcDiffAmount: number
  sevStatus: string
  transferDate: string | null
}

export interface SeveranceListRes {
  totalCount: number
  calculatingCount: number
  confirmedCount: number
  approvedCount: number
  paidCount: number
  totalSeveranceAmount: number
  totalNetAmount: number
  severances: {
    content: SeveranceRes[]
    totalElements: number
    totalPages: number
    number: number
    size: number
  }
}

export interface SeveranceDetailRes {
  sevId: number; empId: number; empName: string; deptName: string; gradeName: string | null
  workGroupName: string | null; retirementType: 'severance' | 'DB' | 'DC'
  hireDate: string; resignDate: string
  serviceYears: number; serviceDays: number
  last3MonthPay: number; lastYearBonus: number; annualLeaveAllowance: number
  last3MonthDays: number; avgDailyWage: number
  severanceAmount: number; taxAmount: number; netAmount: number
  dcDepositedTotal: number; dcDiffAmount: number
  sevStatus: string
  approvalDocId: number | null
  transferDate: string | null
  confirmedBy: number | null; confirmedAt: string | null
  paidBy: number | null; paidAt: string | null
}

const SEV_BASE = '/hr-service/pay/admin/severance'

export interface SeveranceEstimateRowRes {
  empId: number
  empName: string
  deptName: string | null
  gradeName: string | null
  hireDate: string
  serviceYears: number
  retirementType: 'severance' | 'DB' | 'DC'
  avgDailyWage: number
  estimatedSeverance: number
  dcDepositedTotal: number | null
  dcDiffAmount: number | null
  displayAmount: number
}

export interface SeveranceEstimateSummaryRes {
  baseDate: string
  totalEmployees: number
  totalEstimateAmount: number
  severanceCount: number; severanceAmount: number
  dbCount: number; dbAmount: number
  dcCount: number; dcDiffAmount: number
  employees: SeveranceEstimateRowRes[]
}

export const severanceApi = {
  calculate: (data: SeveranceCalcReq) =>
    api.post<SeveranceDetailRes>(`${SEV_BASE}/calculate`, data).then(r => r.data),

  list: (params?: { status?: SevStatus; page?: number; size?: number }) =>
    api.get<SeveranceListRes>(SEV_BASE, { params }).then(r => r.data),

  detail: (sevId: number) =>
    api.get<SeveranceDetailRes>(`${SEV_BASE}/${sevId}`).then(r => r.data),

  confirm: (sevId: number) =>
    api.put(`${SEV_BASE}/${sevId}/confirm`),

  submitApproval: (sevId: number, approvalDocId: number) =>
    api.put(`${SEV_BASE}/${sevId}/submit-approval`, null, { params: { approvalDocId } }),

  estimate: (baseDate?: string, typeFilter?: string) =>
    api.get<SeveranceEstimateSummaryRes>(`${SEV_BASE}/estimate`, {
      params: { baseDate: baseDate || undefined, typeFilter: typeFilter || undefined },
    }).then(r => r.data),
}

// ── 정산보험료 타입 ──
export interface InsuranceSettlementRes {
  settlementId: number; empId: number; empName: string; deptName: string
  baseSalary: number
  pensionEmployee: number; healthEmployee: number; ltcEmployee: number; employmentEmployee: number; totalEmployee: number
  deductedPension: number; deductedHealth: number; deductedLtc: number; deductedEmployment: number; totalDeducted: number
  diffPension: number; diffHealth: number; diffLtc: number; diffEmployment: number; totalDiff: number
  diffCategory: string
  isApplied: boolean
}

export interface InsuranceSettlementSummaryRes {
  settlementFromMonth: string
  settlementToMonth: string
  totalEmployees: number
  appliedCount: number
  totalChargeAmount: number
  totalRefundAmount: number
  totalBaseSalary: number
  totalPensionEmployee: number; totalPensionEmployer: number
  totalHealthEmployee: number; totalHealthEmployer: number
  totalLtcEmployee: number; totalLtcEmployer: number
  totalEmploymentEmployee: number; totalEmploymentEmployer: number
  totalIndustrialEmployer: number
  grandTotalEmployee: number; grandTotalEmployer: number
  grandTotalDeducted: number
  grandTotalDiff: number
  settlements: InsuranceSettlementRes[]
}

export interface InsuranceSettlementDetailRes {
  settlementId: number; payYearMonth: string
  settlementFromMonth: string; settlementToMonth: string
  empId: number; empName: string; deptName: string; gradeName: string | null; titleName: string | null
  baseSalary: number
  pensionRate: number; healthRate: number; ltcRate: number; employmentRate: number; employmentEmployerRate: number; industrialRate: number
  pensionEmployee: number; pensionEmployer: number
  healthEmployee: number; healthEmployer: number
  ltcEmployee: number; ltcEmployer: number
  employmentEmployee: number; employmentEmployer: number; industrialEmployer: number
  totalEmployee: number; totalEmployer: number; totalAmount: number
  deductedPension: number; deductedHealth: number; deductedLtc: number; deductedEmployment: number; totalDeducted: number
  diffPension: number; diffHealth: number; diffLtc: number; diffEmployment: number; totalDiff: number
  isApplied: boolean
}

export interface InsuranceSettlementCalcReq {
  fromYearMonth: string
  toYearMonth: string
}

export interface InsuranceSettlementApplyReq {
  targetPayYearMonth: string
  fromYearMonth: string
  toYearMonth: string
}

const INS_SETTLE_BASE = '/hr-service/pay/insurance'

export const insuranceSettlementApi = {
  getList: (fromYearMonth: string, toYearMonth: string, page = 0, size = 100) =>
    api.get<InsuranceSettlementSummaryRes>(INS_SETTLE_BASE, { params: { fromYearMonth, toYearMonth, page, size } }).then(r => r.data),

  calculate: (data: InsuranceSettlementCalcReq) =>
    api.post<InsuranceSettlementSummaryRes>(`${INS_SETTLE_BASE}/calculate`, data, { params: { size: 100 } }).then(r => r.data),

  getDetail: (settlementId: number) =>
    api.get<InsuranceSettlementDetailRes>(`${INS_SETTLE_BASE}/${settlementId}`).then(r => r.data),

  applyToPayroll: (data: InsuranceSettlementApplyReq) =>
    api.post(`${INS_SETTLE_BASE}/apply-to-payroll`, data),
}

// ── 사원별 급여관리 타입 ──
export type RetirementType = 'severance' | 'DB' | 'DC'

export interface EmpSalaryRes {
  empId: number; empStatus: string; empName: string; deptName: string; titleName: string | null
  empHireDate: string; empResignDate: string | null; empType: string
  annualSalary: number; monthlySalary: number; bankName: string | null; accountNumber: string | null
}

export interface ContractPayItemRes {
  payItemId: number; payItemName: string; amount: number
}

export interface EmpSalaryDetailRes {
  empId: number; empName: string; empNum: string; empEmail: string
  empStatus: string; deptName: string; gradeName: string | null; titleName: string | null
  empHireDate: string; empResignDate: string | null; empType: string
  annualSalary: number; monthlySalary: number
  fixedPayItems: ContractPayItemRes[]
  empAccountId: number | null; bankName: string | null; accountNumber: string | null; accountHolder: string | null
  companyPensionType: PensionType; empRetirementType: RetirementType | null
  retirementAccountId: number | null; pensionProvider: string | null; retirementAccountNumber: string | null
}

export interface EmpAccountReq {
  bankName: string; accountNumber: string; accountHolder: string; verificationToken: string
}

export interface EmpRetirementAccountReq {
  retirementType: RetirementType; pensionProvider: string; accountNumber?: string
}

export interface RetirementTypeUpdateReq {
  retirementType: 'DB' | 'DC'
}

export interface ExpectedDeductionRes {
  empId: number; empStatus: string; empName: string; deptName: string; titleName: string | null
  annualSalary: number; monthlySalary: number; basePay: number
  nationalPension: number; healthInsurance: number; longTermCare: number; employmentInsurance: number
  incomeTax: number; localIncomeTax: number; totalDeduction: number; expectedNetPay: number
}

export interface ExpectedDeductionSummaryRes {
  totalEmployees: number; totalExpectedNetPay: number; employees: ExpectedDeductionRes[]
}

// ── 사원별 급여관리 API ──
const EMP_PAY_BASE = '/hr-service/pay/admin/employees'

export const empSalaryApi = {
  getList: (params?: { keyword?: string; deptId?: number; empType?: string; empStatus?: string; page?: number; size?: number }) =>
    api.get<{ content: EmpSalaryRes[]; totalElements: number }>(EMP_PAY_BASE, { params }).then(r => r.data),

  getDetail: (empId: number) =>
    api.get<EmpSalaryDetailRes>(`${EMP_PAY_BASE}/${empId}`).then(r => r.data),

  updateAccount: (empId: number, data: EmpAccountReq) =>
    api.put(`${EMP_PAY_BASE}/${empId}/account`, data),

  updateRetirementAccount: (empId: number, data: EmpRetirementAccountReq) =>
    api.put(`${EMP_PAY_BASE}/${empId}/retirement-account`, data),

  updateRetirementType: (empId: number, data: RetirementTypeUpdateReq) =>
    api.put(`${EMP_PAY_BASE}/${empId}/retirement-type`, data),

  getExpectedDeductions: () =>
    api.get<ExpectedDeductionSummaryRes>(`${EMP_PAY_BASE}/expected-deductions`).then(r => r.data),
}

// ── 퇴직연금 설정 타입 ──
export type PensionType = 'severance' | 'DB' | 'DC' | 'DB_DC'

export interface RetirementSettingsReq {
  pensionType: PensionType
  pensionProvider?: string
  pensionAccount?: string
}

export interface RetirementSettingsRes {
  retirementSettingsId: number
  pensionType: PensionType
  pensionProvider: string | null
  pensionAccount: string | null
}

// ── 퇴직연금 설정 API ──
export const retirementApi = {
  getSettings: () =>
    api.get<RetirementSettingsRes>('/hr-service/pay/superadmin/retirement').then(r => r.data),

  saveSettings: (data: RetirementSettingsReq) =>
    api.put<RetirementSettingsRes>('/hr-service/pay/superadmin/retirement', data).then(r => r.data),
}

// ── 급여지급 설정 API ──
export const paySettingsApi = {
  getBanks: () =>
    api.get<BankRes[]>('/hr-service/pay/superadmin/settings/banks').then(r => r.data),

  getSettings: () =>
    api.get<PaySettingsRes>('/hr-service/pay/superadmin/settings/payment').then(r => r.data),

  updateSettings: (data: PaySettingsReq) =>
    api.put<PaySettingsRes>('/hr-service/pay/superadmin/settings/payment', data).then(r => r.data),
}

// ── 지급/공제 항목 API ──
export const payItemsApi = {
  getList: (type: PayItemType, name?: string, isLegal?: boolean) =>
    api.get<PayItemRes[]>('/hr-service/pay/superadmin/payitems', { params: { type, name, isLegal } }).then(r => r.data),

  create: (data: PayItemReq) =>
    api.post<PayItemRes>('/hr-service/pay/superadmin/payitems', data).then(r => r.data),

  update: (id: number, data: PayItemReq) =>
    api.put<PayItemRes>(`/hr-service/pay/superadmin/payitems/${id}`, data).then(r => r.data),

  toggleActive: (id: number) =>
    api.patch<PayItemRes>(`/hr-service/pay/superadmin/payitems/${id}`).then(r => r.data),

  deleteItems: (ids: number[]) =>
    api.delete('/hr-service/pay/superadmin/payitems', { data: ids }),
}
