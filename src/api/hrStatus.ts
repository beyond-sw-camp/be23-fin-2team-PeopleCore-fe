import { apiFetch } from './http'

export interface WorkforceSummaryDto {
  total: number
  hiredThisMonth: number
  resignedThisMonth: number
  contractExpiring: number
}

export interface GradeCountDto {
  gradeName: string
  count: number
}

export interface DeptWorkforceDto {
  deptName: string
  total: number
  gradeCounts: GradeCountDto[]
  avgYears: number
  avgMonths: number
}

export interface MonthlyTrendDto {
  month: string // "YYYY-MM" (Jackson YearMonth)
  hired: number
  resigned: number
}

export interface ExpiringContractDto {
  empNum: string
  empName: string
  deptName: string
  empType: string
  expiryDate: string // "YYYY-MM-DD"
  daysLeft: number
}

export async function fetchWorkforceSummary(): Promise<WorkforceSummaryDto> {
  const res = await apiFetch('/hr-service/hr-status/summary')
  return res.json()
}

export async function fetchWorkforceByDept(deptId?: number): Promise<DeptWorkforceDto[]> {
  const query = deptId !== undefined ? `?deptId=${deptId}` : ''
  const res = await apiFetch(`/hr-service/hr-status/by-dept${query}`)
  return res.json()
}

export async function fetchWorkforceTrend(): Promise<MonthlyTrendDto[]> {
  const res = await apiFetch('/hr-service/hr-status/trend')
  return res.json()
}

export async function fetchExpiringContracts(): Promise<ExpiringContractDto[]> {
  const res = await apiFetch('/hr-service/hr-status/expiring')
  return res.json()
}
