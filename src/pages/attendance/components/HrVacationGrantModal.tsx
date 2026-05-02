import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vacationApi } from '../../../api/vacation'
import { fetchEmployeeList } from '../../../api/employee'
import { queryKeys } from '../../../lib/queryKeys'

interface Props {
  open: boolean
  onClose: () => void
  onGranted?: () => void
}

const currentYear = () => new Date().getFullYear()

export default function HrVacationGrantModal({ open, onClose, onGranted }: Props) {
  const queryClient = useQueryClient()

  const [typeId, setTypeId] = useState<number | null>(null)
  const [days, setDays] = useState<number>(1)
  const [year, setYear] = useState<number>(currentYear())
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [reason, setReason] = useState<string>('')

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [empSearch, setEmpSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  const typesQuery = useQuery({
    queryKey: ['vacation', 'activeTypes'],
    queryFn: () => vacationApi.getActiveTypes(),
    enabled: open,
  })
  const employeesQuery = useQuery({
    queryKey: ['employee', 'list', { empStatus: 'ACTIVE', size: 500 }],
    queryFn: () => fetchEmployeeList({ empStatus: 'ACTIVE', size: 500 }),
    enabled: open,
  })
  const types = typesQuery.data ?? []
  const employees = employeesQuery.data?.content ?? []
  const loadingMeta = open && (typesQuery.isPending || employeesQuery.isPending)

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setEmpSearch('')
      setDeptFilter('')
      setDays(1)
      setYear(currentYear())
      setExpiresAt('')
      setReason('')
      setTypeId(null)
    }
  }, [open])

  const depts = useMemo(() => {
    const set = new Set<string>()
    employees.forEach((e) => { if (e.deptName) set.add(e.deptName) })
    return Array.from(set).sort()
  }, [employees])

  const filteredEmps = useMemo(() => {
    let list = employees
    if (deptFilter) list = list.filter((e) => e.deptName === deptFilter)
    if (empSearch) {
      const q = empSearch.toLowerCase()
      list = list.filter((e) =>
        e.empName.toLowerCase().includes(q)
        || e.empNum.toLowerCase().includes(q)
        || (e.deptName ?? '').toLowerCase().includes(q))
    }
    return list
  }, [employees, empSearch, deptFilter])

  const toggleEmp = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllFiltered = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      filteredEmps.forEach((e) => {
        if (checked) next.add(e.empId)
        else next.delete(e.empId)
      })
      return next
    })
  }

  const allFilteredSelected = filteredEmps.length > 0 && filteredEmps.every((e) => selected.has(e.empId))

  const canSubmit = typeId !== null && selected.size > 0 && days !== 0 && !Number.isNaN(days) && expiresAt.trim() !== ''

  const roundTo = (v: number) => Math.round(v * 100) / 100

  const stepUp = () => {
    setDays((d) => {
      const cur = roundTo(d)
      const next = Number.isInteger(cur) && cur >= 1 ? cur + 1 : cur + 0.25
      return roundTo(next)
    })
  }

  const stepDown = () => {
    setDays((d) => {
      const cur = roundTo(d)
      const next = Number.isInteger(cur) && cur <= -1 ? cur - 1 : cur - 0.25
      return roundTo(next)
    })
  }

  const grantMutation = useMutation({
    mutationFn: () => vacationApi.grantBalance({
      typeId: typeId!,
      empIds: Array.from(selected),
      days,
      year,
      expiresAt,
      reason: reason.trim() === '' ? null : reason.trim(),
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vacation.all })
      alert(`${selected.size}명 ${days > 0 ? '+' : ''}${days}일 조정 완료`)
      onGranted?.()
      onClose()
    },
    onError: (e) => {
      const err = e as { response?: { status?: number; data?: { code?: string } } }
      const code = err?.response?.data?.code
      if (code === 'VACATION_BALANCE_INSUFFICIENT') alert('잔여가 부족한 사원이 있어 조정이 취소되었습니다. (미리쓰기 정책이 OFF인 상태)')
      else if (code === 'BAD_REQUEST') alert('일수는 0이 될 수 없습니다.')
      else if (code === 'VACATION_TYPE_NOT_FOUND') alert('휴가 유형을 찾을 수 없습니다.')
      else if (code === 'EMPLOYEE_NOT_FOUND') alert('선택한 사원 중 일부를 찾을 수 없습니다.')
      else if (code === 'OPTIMISTIC_LOCK') alert('다른 관리자가 동시에 수정 중입니다. 잠시 후 다시 시도해주세요.')
      else if (err?.response?.status === 403) alert('휴가 조정 권한이 없습니다.')
      else alert('휴가 조정에 실패했습니다.')
    },
  })

  const submitting = grantMutation.isPending

  const submit = () => {
    if (!canSubmit || typeId === null) return
    grantMutation.mutate()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(640px,calc(100vw-24px))] max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">휴가 조정</h2>
          <p className="text-[12px] text-gray-500 mt-1">선택된 사원의 잔여를 가감합니다. 양수는 추가 부여, 음수는 차감 (소급 조정 가능)</p>
        </div>

        {loadingMeta ? (
          <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
        ) : (
          <div className="px-6 py-5 space-y-4 overflow-y-auto">
            {/* 사원 선택 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-gray-700 font-medium">대상 사원 <span className="text-red-500">*</span> <span className="text-[11px] text-gray-500 ml-1">{selected.size}명 선택됨</span></span>
                <div className="flex items-center gap-2">
                  <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none focus:border-[#1D9E75]">
                    <option value="">전체 부서</option>
                    {depts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="이름·사번 검색"
                    className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none w-36 focus:border-[#1D9E75]" />
                </div>
              </div>

              <div className="border border-gray-200 rounded max-h-[200px] overflow-y-auto">
                <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center">
                  <input type="checkbox" checked={allFilteredSelected}
                    onChange={(e) => toggleAllFiltered(e.target.checked)} className="accent-[#1D9E75] mr-2" />
                  <span className="text-[11px] text-gray-600">검색결과 전체 선택 ({filteredEmps.length}명)</span>
                </div>
                {filteredEmps.map((e) => (
                  <label key={e.empId}
                    className={`flex items-center gap-2 px-3 py-1.5 text-[12px] cursor-pointer transition-colors ${
                      selected.has(e.empId) ? 'bg-[#E1F5EE]' : 'hover:bg-gray-50'
                    }`}>
                    <input type="checkbox" checked={selected.has(e.empId)}
                      onChange={() => toggleEmp(e.empId)} className="accent-[#1D9E75]" />
                    <span className="font-medium text-gray-800">{e.empName}</span>
                    <span className="text-gray-400">{e.empNum}</span>
                    <span className="text-gray-500 ml-auto">{e.deptName} · {e.gradeName}</span>
                  </label>
                ))}
                {filteredEmps.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-gray-400">검색 결과가 없습니다</div>
                )}
              </div>
            </div>

            {/* 휴가 유형 */}
            <div className="flex items-center gap-4">
              <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">휴가 유형 <span className="text-red-500">*</span></label>
              <select value={typeId ?? ''} onChange={(e) => setTypeId(e.target.value === '' ? null : Number(e.target.value))}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]">
                <option value="">휴가 유형을 선택하세요</option>
                {types.map((t) => (
                  <option key={t.typeId} value={t.typeId}>{t.typeName} ({t.typeCode})</option>
                ))}
              </select>
            </div>

            {/* 일수 / 연도 */}
            <div className="flex items-center gap-4">
              <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">조정 일수 <span className="text-red-500">*</span></label>
              <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:border-[#1D9E75]">
                <button type="button" onClick={stepDown}
                  className="px-2 py-2 text-[13px] text-gray-600 hover:bg-gray-100 border-r border-gray-300">−</button>
                <input type="number" value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="px-2 py-2 text-[12px] outline-none w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button type="button" onClick={stepUp}
                  className="px-2 py-2 text-[13px] text-gray-600 hover:bg-gray-100 border-l border-gray-300">+</button>
              </div>
              <span className="text-[12px] text-gray-500">일 <span className="text-[11px] text-gray-400 ml-1">(음수 차감 가능)</span></span>

              <label className="text-[12px] text-gray-700 font-medium ml-6">대상 연도</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none w-24 focus:border-[#1D9E75]" />
            </div>

            {/* 만료일 */}
            <div className="flex items-center gap-4">
              <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">만료일 <span className="text-red-500">*</span></label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                required
                className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]" />
            </div>

            {/* 사유 */}
            <div className="flex items-start gap-4">
              <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium mt-2">사유</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="예: 2026년 출산휴가 부여 (감사 로그용)"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] min-h-[60px] resize-y" />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">취소</button>
          <button onClick={submit}
            disabled={!canSubmit || submitting}
            className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${canSubmit && !submitting ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {submitting ? '처리 중...' : `${selected.size}명 조정`}
          </button>
        </div>
      </div>
    </div>
  )
}
