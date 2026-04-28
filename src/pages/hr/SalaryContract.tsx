import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchFormSetup,
  fetchSalaryContractList,
  fetchSalaryContractDetail,
  fetchSalaryContractHistory,
  createSalaryContract,
  deleteSalaryContract,
  downloadSalaryContractFile,
  type FormFieldSetupResponse,
  type SalaryContractListResDto,
  type SalaryContractDetailResDto,
  type SalaryContractHistoryResDto,
  type SalaryContractSortField,
} from '../../api/salaryContract'
import { fetchEmployeeList } from '../../api/employee/employeeApi'
import type { EmployeeListDto } from '../../api/employee/types'

const EMP_TYPE_LABEL: Record<string, string> = { FULL: '정규직', CONTRACT: '계약직' }
const fmt = (n: number | null | undefined) => (n == null ? '-' : Number(n).toLocaleString('ko-KR'))
const inputClass =
  'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors'

export default function SalaryContract() {
  // 목록 상태
  const [rows, setRows] = useState<SalaryContractListResDto[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [sortField, setSortField] = useState<SalaryContractSortField>('EMP_NUM')

  // 모달/메뉴 상태
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [detail, setDetail] = useState<SalaryContractDetailResDto | null>(null)
  const [history, setHistory] = useState<SalaryContractHistoryResDto[] | null>(null)

  // 폼 설정
  const [formFields, setFormFields] = useState<FormFieldSetupResponse[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)

  // 사원 검색
  const [empSearch, setEmpSearch] = useState('')
  const [empResults, setEmpResults] = useState<EmployeeListDto[]>([])
  const [empSearchOpen, setEmpSearchOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<EmployeeListDto | null>(null)

  const loadList = async () => {
    const res = await fetchSalaryContractList({ search, year: filterYear || undefined, sortField, page, size: pageSize })
    setRows(res.content)
    setTotalElements(res.totalElements)
    setTotalPages(Math.max(1, res.totalPages))
  }

  useEffect(() => {
    loadList().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, filterYear, sortField])

  // 사원 검색 (디바운스)
  const empTimer = useRef<number | null>(null)
  useEffect(() => {
    if (!empSearchOpen) return
    if (empTimer.current) window.clearTimeout(empTimer.current)
    empTimer.current = window.setTimeout(async () => {
      if (!empSearch.trim()) {
        setEmpResults([])
        return
      }
      try {
        const res = await fetchEmployeeList({ keyword: empSearch, size: 10, page: 0 })
        setEmpResults(res.content)
      } catch (e) {
        console.error(e)
      }
    }, 250)
  }, [empSearch, empSearchOpen])

  const openRegister = async () => {
    try {
      const fields = await fetchFormSetup('SALARY_CONTRACT')
      setFormFields(fields.filter(f => f.visible).sort((a, b) => a.sortOrder - b.sortOrder))
      setFormValues({})
      setFile(null)
      setSelectedEmp(null)
      setEmpSearch('')
      setShowRegister(true)
    } catch (e) {
      console.error(e)
      alert('폼 설정을 불러오지 못했습니다.')
    }
  }

  const handleSelectEmp = (emp: EmployeeListDto) => {
    setSelectedEmp(emp)
    setEmpSearch(emp.empName)
    setEmpSearchOpen(false)
    // autoFillFrom 기반 자동 입력
    const next = { ...formValues }
    for (const f of formFields) {
      if (!f.autoFillFrom) continue
      switch (f.autoFillFrom) {
        case 'empName': next[f.fieldKey] = emp.empName; break
        case 'empNum': next[f.fieldKey] = emp.empNum; break
        case 'department': next[f.fieldKey] = emp.deptName; break
        case 'rank': next[f.fieldKey] = emp.gradeName; break
        case 'position': next[f.fieldKey] = emp.titleName; break
        case 'employType': next[f.fieldKey] = EMP_TYPE_LABEL[emp.empType] ?? emp.empType; break
        case 'hireDate': next[f.fieldKey] = emp.empHireDate ?? ''; break
      }
    }
    setFormValues(next)
  }

  const handleSubmit = async () => {
    if (!selectedEmp) {
      alert('사원을 선택해 주세요.')
      return
    }
    // 필수 검증 (SEARCH/FILE/AUTO는 별도 처리, autoFillFrom은 사원 선택으로 채워짐)
    for (const f of formFields) {
      if (!f.required) continue
      if (f.fieldType === 'SEARCH' || f.fieldType === 'FILE' || f.fieldType === 'AUTO') continue
      if (f.autoFillFrom) continue
      if (!(formValues[f.fieldKey] ?? '').trim()) {
        alert(`${f.label}은(는) 필수 항목입니다.`)
        return
      }
    }
    // 계약 종료일은 시작일 이전일 수 없음 (텍스트 직접 입력 우회 방지)
    const start = formValues['contractStart']
    const end = formValues['contractEnd']
    if (start && end && end < start) {
      alert('계약 종료일은 계약 시작일 이전일 수 없습니다.')
      return
    }
    // 계약 연도와 시작일/종료일 연도가 일치해야 함
    const year = formValues['contractYear']
    if (year) {
      if (start && start.slice(0, 4) !== year) {
        alert(`계약 시작일은 계약 연도(${year})와 같은 연도여야 합니다.`)
        return
      }
      if (end && end.slice(0, 4) !== year) {
        alert(`계약 종료일은 계약 연도(${year})와 같은 연도여야 합니다.`)
        return
      }
    }
    const fields = formFields.map(f => ({ fieldKey: f.fieldKey, value: formValues[f.fieldKey] ?? '' }))
    try {
      await createSalaryContract({ empId: selectedEmp.empId, fields }, file)
      setShowRegister(false)
      await loadList()
    } catch (e) {
      console.error(e)
      alert('등록에 실패했습니다.')
    }
  }

  const openDetail = async (id: number) => {
    try {
      setDetail(await fetchSalaryContractDetail(id))
    } catch (e) {
      console.error(e)
    }
  }

  const openHistory = async (empNum: string) => {
    // 목록 rows에서 empNum으로 id 찾기 어려움 → history는 empId 필요
    // 상세에서 empId가 나옴. 목록 DTO에 empId가 없으므로 상세로 우회.
    const row = rows.find(r => r.empNum === empNum)
    if (!row) return
    try {
      const d = await fetchSalaryContractDetail(row.id)
      const h = await fetchSalaryContractHistory(d.empId)
      setHistory(h)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`${name}의 계약서를 삭제하시겠습니까?`)) return
    try {
      await deleteSalaryContract(id)
      await loadList()
    } catch (e) {
      console.error(e)
      alert('삭제에 실패했습니다.')
    }
  }

  const sectionsInOrder = useMemo(() => {
    // 고정 순서: 인적사항 → 계약기간 → 급여 → 기타사항. 그 외 섹션은 뒤에 등장 순서로
    const FIXED_ORDER = ['인적사항', '계약기간', '급여', '기타사항']
    const present = new Set(formFields.map(f => f.section))
    const order: string[] = FIXED_ORDER.filter(s => present.has(s))
    for (const f of formFields) {
      if (!order.includes(f.section)) order.push(f.section)
    }
    return order
  }, [formFields])

  // 연봉 = 고정수당 합 × 12 + 비고정수당 합
  const computedAnnualSalary = useMemo(() => {
    let fixedMonthly = 0
    let nonFixedSum = 0
    for (const f of formFields) {
      if (!f.fieldKey.startsWith('payItem_')) continue
      const v = parseFloat(formValues[f.fieldKey] || '0')
      if (isNaN(v)) continue
      if (f.isFixed) fixedMonthly += v
      else nonFixedSum += v
    }
    return fixedMonthly * 12 + nonFixedSum
  }, [formFields, formValues])

  useEffect(() => {
    const newVal = String(computedAnnualSalary)
    if ((formValues['annualSalary'] ?? '') !== newVal) {
      setFormValues(prev => ({ ...prev, annualSalary: newVal }))
    }
  }, [computedAnnualSalary])

  const renderField = (f: FormFieldSetupResponse) => {
    const val = formValues[f.fieldKey] ?? ''
    const setVal = (v: string) => setFormValues(prev => ({ ...prev, [f.fieldKey]: v }))
    const isPayItem = f.fieldKey.startsWith('payItem_')
    const readOnly = isPayItem ? false : (!!f.autoFillFrom || f.fieldType === 'AUTO' || !!f.locked)
    const common = `${inputClass} w-full ${readOnly ? 'bg-gray-100' : ''}`
    switch (f.fieldType) {
      case 'DATE': {
        // 계약 종료일은 계약 시작일 이전을 선택할 수 없도록 min 제한
        const minDate = f.fieldKey === 'contractEnd' ? (formValues['contractStart'] || undefined) : undefined
        return <input type="date" max="9999-12-31" min={minDate} className={common} value={val} readOnly={readOnly} onChange={e => setVal(e.target.value)} />
      }
      case 'NUMBER': {
        const isMoneyField = f.fieldKey === 'annualSalary' || isPayItem
        if (isMoneyField) {
          const rawDigits = val.replace(/[^\d]/g, '')
          const displayVal = rawDigits ? Number(rawDigits).toLocaleString('ko-KR') : ''
          const onMoneyChange = (e: { target: { value: string } }) =>
            setVal(e.target.value.replace(/[^\d]/g, ''))
          if (f.fieldKey === 'annualSalary') {
            return (
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  className={`${common} bg-gray-100`}
                  value={displayVal}
                  readOnly
                />
                <span className="text-[10px] text-gray-400">
                  자동 계산 (고정수당 합 × 12 + 비고정수당 합)
                </span>
              </div>
            )
          }
          return <input type="text" inputMode="numeric" className={common} value={displayVal} readOnly={readOnly} onChange={onMoneyChange} />
        }
        return <input type="number" className={common} value={val} readOnly={readOnly} onChange={e => setVal(e.target.value)} />
      }
      case 'TEXTAREA':
        return <textarea className={`${common} h-20 resize-none`} value={val} readOnly={readOnly} onChange={e => setVal(e.target.value)} />
      case 'SELECT':
      case 'RADIO':
        return (
          <select className={common} value={val} disabled={readOnly} onChange={e => setVal(e.target.value)}>
            <option value="">선택</option>
            {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )
      case 'FILE':
        return (
          <label className="flex flex-col items-center justify-center gap-1.5 w-full py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1D9E75] hover:bg-[#f5faf7] transition-colors">
            <i className={`fas ${file ? 'fa-file-circle-check text-[#1D9E75]' : 'fa-cloud-arrow-up text-gray-400'} text-2xl`}></i>
            <span className="text-sm text-gray-600">{file ? file.name : '클릭하여 파일 업로드'}</span>
            <span className="text-xs text-gray-400">{file ? '다른 파일로 교체하려면 클릭' : 'PDF, 이미지 파일 지원'}</span>
            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )
      case 'SEARCH':
        // 사원 검색 필드
        return (
          <div className="relative">
            <input
              className={`${inputClass} w-full pr-8`}
              placeholder="이름 또는 사번 검색"
              value={empSearch}
              onChange={e => { setEmpSearch(e.target.value); setEmpSearchOpen(true); setSelectedEmp(null) }}
              onFocus={() => setEmpSearchOpen(true)}
            />
            {empSearchOpen && empResults.length > 0 && !selectedEmp && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {empResults.map(emp => (
                  <button
                    key={emp.empId}
                    type="button"
                    onClick={() => handleSelectEmp(emp)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#f2faf6] transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{emp.empName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{emp.empNum}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {emp.deptName} · {emp.gradeName} · {EMP_TYPE_LABEL[emp.empType] ?? emp.empType}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      default:
        return <input type="text" className={common} value={val} readOnly={readOnly} onChange={e => setVal(e.target.value)} />
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6" onClick={() => menuOpen && setMenuOpen(null)}>
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">연봉 계약 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">연봉 계약 관리</h1>
          <p className="text-xs text-gray-400 mt-1">구두 계약 완료된 연봉 계약서를 등록하고 관리합니다.</p>
        </div>
        <button
          onClick={() => (showRegister ? setShowRegister(false) : openRegister())}
          className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
        >
          <i className="fas fa-plus text-xs"></i>
          계약서 등록
        </button>
      </div>

      {/* 등록 폼 */}
      {showRegister && (
        <div className="card mb-5 overflow-hidden">
          <div className="px-8 pt-6 pb-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">계약서 등록</h2>
            <p className="text-xs text-gray-400 mt-1">회사에 설정된 폼에 따라 항목이 표시됩니다.</p>
          </div>

          <div className="px-8 py-6">
            {sectionsInOrder.map(section => (
              <div className="mb-6" key={section}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-bold text-gray-800">{section}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                    {formFields.filter(f => f.section === section && f.fieldType !== 'FILE').map(f => (
                      <div key={f.fieldKey} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">
                          {f.label} {f.required && <span className="text-red-400">*</span>}
                        </label>
                        {renderField(f)}
                      </div>
                    ))}
                  </div>
                  {formFields.filter(f => f.section === section && f.fieldType === 'FILE').map(f => (
                    <div key={f.fieldKey} className="mt-4">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        {f.label} {f.required && <span className="text-red-400">*</span>}
                      </label>
                      {renderField(f)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 첨부파일: 폼에 FILE 필드가 없을 경우 기본 노출 */}
            {!formFields.some(f => f.fieldType === 'FILE') && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-bold text-gray-800">서명 완료 계약서 첨부</span>
                </div>
                <label
                  htmlFor="contract-file-upload"
                  className="flex flex-col items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1D9E75] hover:bg-[#f5faf7] transition-colors"
                >
                  <i className={`fas ${file ? 'fa-file-circle-check text-[#1D9E75]' : 'fa-cloud-arrow-up text-gray-400'} text-3xl`}></i>
                  <span className="text-sm text-gray-600">
                    {file ? file.name : '클릭하여 파일 업로드'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {file ? '다른 파일로 교체하려면 클릭' : 'PDF, 이미지 파일 지원'}
                  </span>
                  <input
                    id="contract-file-upload"
                    type="file"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowRegister(false)} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
              <button onClick={handleSubmit} className="bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
                <i className="fas fa-file-signature mr-1.5"></i>계약서 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <form
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs"
            onSubmit={e => { e.preventDefault(); setPage(0); setSearch(searchInput) }}
          >
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input
              className="bg-transparent border-none outline-none text-sm flex-1"
              placeholder="이름 또는 사번 검색"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </form>
          <input
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none w-24"
            placeholder="연도"
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setPage(0) }}
          />
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-400">총 {totalElements}건</span>
            <select
              className="text-xs text-gray-400 outline-none bg-transparent cursor-pointer hover:text-gray-600 transition-colors"
              value={sortField}
              onChange={e => { setSortField(e.target.value as SalaryContractSortField); setPage(0) }}
            >
              <option value="EMP_NUM">사번순</option>
              <option value="EMP_NAME">성명순</option>
              <option value="CONTRACT_START">계약일순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직책</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">근로형태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">계약일자</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.empNum}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.empName}</td>
                <td className="px-4 py-3 text-gray-600">{c.department}</td>
                <td className="px-4 py-3 text-gray-600">{c.rank}</td>
                <td className="px-4 py-3 text-gray-600">{c.position}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.employmentType === 'FULL' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-orange-50 text-orange-600'
                  }`}>{EMP_TYPE_LABEL[c.employmentType] ?? c.employmentType}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.contractStart ?? '-'}</td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id) }}
                    className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors px-2 py-1"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  {menuOpen === c.id && (
                    <div onClick={e => e.stopPropagation()} className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                      <button
                        onClick={() => { openDetail(c.id); setMenuOpen(null) }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors"
                      >
                        <i className="fas fa-eye mr-2 text-[10px]"></i>상세 보기
                      </button>
                      <button
                        onClick={() => { openHistory(c.empNum); setMenuOpen(null) }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors"
                      >
                        <i className="fas fa-history mr-2 text-[10px]"></i>계약 이력
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => { handleDelete(c.id, c.empName); setMenuOpen(null) }}
                        className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <i className="fas fa-trash-alt mr-2 text-[10px]"></i>삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-xs text-gray-400">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex-1" />
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}건</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-left text-[10px]" />
            </button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-left text-[10px]" />
            </button>
            <span className="px-3 text-xs text-gray-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-right text-[10px]" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-right text-[10px]" />
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {totalElements === 0 ? '0건' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} / ${totalElements}건`}
          </span>
        </div>
      </div>

      {/* 상세 모달 */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl w-[700px] mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{detail.empName}</h3>
                  <span className="text-[11px] font-mono text-gray-400">{detail.empNum}</span>
                </div>
                <span className="text-[11px] text-gray-400">등록일 {detail.registeredDate ?? '-'}</span>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            <div className="px-7 py-6 space-y-6">
              {Array.from(new Set(detail.fields.map(f => f.section))).map(section => (
                <div key={section}>
                  <h4 className="text-xs font-bold text-gray-800 mb-3">{section}</h4>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {detail.fields.filter(f => f.section === section).map(f => (
                          <tr key={f.fieldKey} className="border-b border-gray-50 last:border-0">
                            <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 w-32 text-xs">{f.label}</td>
                            <td className="px-4 py-2.5 text-gray-800">{f.value || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {detail.fileName && (
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-3">첨부 파일</h4>
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f8fcfa] rounded-xl border border-[#d0ede2]">
                    <i className="fas fa-file-pdf text-red-400"></i>
                    <span className="flex-1 text-sm text-gray-700">
                      {detail.originalFileName ?? detail.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadSalaryContractFile(
                          detail.id,
                          detail.originalFileName ?? detail.fileName ?? 'salary-contract',
                        )
                      }
                      className="text-xs px-3 py-1.5 bg-white text-[#1f6f47] border border-[#d0ede2] rounded-lg hover:bg-[#eef7f1] transition-colors"
                    >
                      <i className="fas fa-download mr-1"></i>다운로드
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100">
              <button onClick={() => setDetail(null)}
                className="text-sm px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 이력 모달 */}
      {history && history.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setHistory(null)}>
          <div className="bg-white rounded-2xl w-[700px] mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{history[0].empName}</h3>
                  <span className="text-[11px] font-mono text-gray-400">{history[0].empNum}</span>
                </div>
                <p className="text-xs text-gray-400">{history[0].department} · {history[0].rank} · 계약 이력 {history.length}건</p>
              </div>
              <button onClick={() => setHistory(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            <div className="px-7 py-6">
              <div className="space-y-4">
                {history.map((c, idx) => (
                  <div key={c.id} className={`rounded-xl border p-5 ${idx === 0 ? 'border-[#1D9E75] bg-[#f8fcfa]' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{c.year ?? '-'}년</span>
                        {idx === 0 && <span className="text-[10px] px-2 py-0.5 bg-[#1D9E75] text-white rounded-full font-medium">현재</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] text-gray-400 block">계약 연봉</span>
                        <span className="text-sm font-bold text-gray-900">{fmt(c.annualSalary)}원</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">계약 시작</span>
                        <span className="text-sm text-gray-700">{c.contractStart ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">계약 종료</span>
                        <span className="text-sm text-gray-700">{c.contractEnd ?? '무기한'}</span>
                      </div>
                    </div>
                    {c.salaryDiff != null && c.salaryDiffRate != null && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className={`text-xs font-medium ${Number(c.salaryDiff) > 0 ? 'text-[#1D9E75]' : Number(c.salaryDiff) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {Number(c.salaryDiff) > 0 ? '▲' : Number(c.salaryDiff) < 0 ? '▼' : '—'} 전년 대비 {Number(c.salaryDiff) > 0 ? '+' : ''}{fmt(c.salaryDiff)}원 ({Number(c.salaryDiffRate) > 0 ? '+' : ''}{c.salaryDiffRate}%)
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end px-7 py-4 border-t border-gray-100">
              <button onClick={() => setHistory(null)}
                className="text-sm px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
