import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEmployeeList } from '../../api/employee/employeeApi'
import type { EmployeeListDto } from '../../api/employee/types'
import { useAuth } from '../../contexts/AuthContext'
import { hrOrderApi } from '../../api/hrOrder'
import type { HrOrderListItem, HrOrderDetail, OrderType, OrderStatus, HrOrderCreateReq } from '../../api/hrOrder'
import { departmentApi, gradeApi, titleApi } from '../../api/org'
import type { DepartmentTreeResponse, GradeResponse, TitleResponse } from '../../api/org'

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  PROMOTION: '승진',
  TRANSFER: '전보',
  TITLE_CHANGE: '보직변경',
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '승인대기',
  CONFIRMED: '승인',
  APPLIED: '반영완료',
  REJECTED: '반려',
}

// 부서 트리를 평탄화
function flattenDepts(nodes: DepartmentTreeResponse[]): DepartmentTreeResponse[] {
  const result: DepartmentTreeResponse[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children?.length) result.push(...flattenDepts(node.children))
  }
  return result
}

export default function PersonnelAppointment() {
  const navigate = useNavigate()
  const { isHRSuperAdmin } = useAuth()

  // 발령 목록
  const [orders, setOrders] = useState<HrOrderListItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  // 필터
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [filterType, setFilterType] = useState<OrderType | ''>('')
  const [keyword, setKeyword] = useState('')

  // 정렬
  const [sortKey, setSortKey] = useState<'empNum' | 'empName' | 'effectiveDate'>('empNum')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // UI 상태
  const [showRegister, setShowRegister] = useState(false)
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  // 상세/수정 모달
  const [detailData, setDetailData] = useState<HrOrderDetail | null>(null)
  const [editData, setEditData] = useState<HrOrderDetail | null>(null)
  const [editOrderType, setEditOrderType] = useState<OrderType>('PROMOTION')
  const [editEffectiveDate, setEditEffectiveDate] = useState('')
  const [editAfterId, setEditAfterId] = useState<number | ''>('')

  // 승인/반려 확인 모달
  const [confirmModal, setConfirmModal] = useState<{ id: number; type: 'approve' | 'reject'; name: string } | null>(null)

  // 사원 검색 모달
  const [showEmpSearch, setShowEmpSearch] = useState(false)
  const [empSearchKeyword, setEmpSearchKeyword] = useState('')
  const [empSearchResults, setEmpSearchResults] = useState<EmployeeListDto[]>([])
  const [empSearchLoading, setEmpSearchLoading] = useState(false)

  // 발령 등록 폼
  const [registerOrderType, setRegisterOrderType] = useState<OrderType>('PROMOTION')
  const [registerEffectiveDate, setRegisterEffectiveDate] = useState('')

  interface SelectedEmp {
    empId: number
    empNum: string
    empName: string
    deptName: string
    gradeName: string
    titleName: string
    afterId: number | ''
  }
  const [selectedEmps, setSelectedEmps] = useState<SelectedEmp[]>([])

  // 부서/직급/직책 마스터 데이터
  const [departments, setDepartments] = useState<DepartmentTreeResponse[]>([])
  const [grades, setGrades] = useState<GradeResponse[]>([])
  const [titles, setTitles] = useState<TitleResponse[]>([])

  // ── 데이터 로드 ──

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page: 0, size: 9999 }
      if (filterStatus) params.status = filterStatus
      if (filterType) params.orderType = filterType
      if (keyword) params.keyword = keyword
      const res = await hrOrderApi.getList(params as any)
      setOrders(res.data.content)
      setTotalElements(res.data.totalElements)
    } catch (e) {
      console.error('발령 목록 조회 실패', e)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, keyword])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    Promise.all([
      departmentApi.getTree(),
      gradeApi.getList(),
      titleApi.getList(),
    ]).then(([deptRes, gradeRes, titleRes]) => {
      setDepartments(flattenDepts(deptRes.data))
      setGrades(gradeRes.data)
      setTitles(titleRes.data)
    }).catch(e => console.error('마스터 데이터 로드 실패', e))
  }, [])

  // ── 사원 검색 ──

  const searchEmployees = async () => {
    setEmpSearchLoading(true)
    try {
      const res = await fetchEmployeeList({ keyword: empSearchKeyword, empStatus: 'ACTIVE', page: 0, size: 20 })
      setEmpSearchResults(res.content)
    } catch {
      setEmpSearchResults([])
    } finally {
      setEmpSearchLoading(false)
    }
  }

  useEffect(() => {
    if (showEmpSearch) searchEmployees()
  }, [showEmpSearch])

  const addEmployee = (emp: EmployeeListDto) => {
    if (selectedEmps.some(s => s.empId === emp.empId)) return
    setSelectedEmps(prev => [...prev, {
      empId: emp.empId, empNum: emp.empNum, empName: emp.empName,
      deptName: emp.deptName, gradeName: emp.gradeName, titleName: emp.titleName,
      afterId: '',
    }])
    setShowEmpSearch(false)
  }

  const removeSelectedEmp = (empId: number) => {
    setSelectedEmps(prev => prev.filter(e => e.empId !== empId))
  }

  // ── 발령 등록 ──

  const getTargetType = (orderType: OrderType): string => {
    if (orderType === 'PROMOTION') return 'GRADE'
    if (orderType === 'TRANSFER') return 'DEPARTMENT'
    return 'TITLE'
  }

  const getBeforeId = (emp: SelectedEmp, orderType: OrderType): number => {
    if (orderType === 'PROMOTION') {
      return grades.find(g => g.gradeName === emp.gradeName)?.gradeId ?? 0
    }
    if (orderType === 'TRANSFER') {
      return departments.find(d => d.deptName === emp.deptName)?.id ?? 0
    }
    return titles.find(t => t.titleName === emp.titleName)?.titleId ?? 0
  }

  const handleRegister = async () => {
    if (!registerEffectiveDate || selectedEmps.length === 0) return
    const details = selectedEmps
      .filter(emp => emp.afterId !== '')
      .map(emp => ({
        empId: emp.empId,
        targetType: getTargetType(registerOrderType),
        beforeId: getBeforeId(emp, registerOrderType),
        afterId: emp.afterId as number,
      }))
    if (details.length === 0) return alert('변경 대상을 선택해주세요.')

    try {
      const req: HrOrderCreateReq = {
        orderType: registerOrderType,
        effectiveDate: registerEffectiveDate,
        details,
      }
      await hrOrderApi.create(req)
      alert('발령이 등록되었습니다.')
      setShowRegister(false)
      setSelectedEmps([])
      setRegisterEffectiveDate('')
      loadOrders()
    } catch (e) {
      console.error('발령 등록 실패', e)
      alert('발령 등록에 실패했습니다.')
    }
  }

  // ── 상세 조회 ──

  const openDetail = async (orderId: number) => {
    try {
      const res = await hrOrderApi.getDetail(orderId)
      setDetailData(res.data)
    } catch (e) {
      console.error('상세 조회 실패', e)
    }
  }

  // ── 수정 ──

  const openEdit = async (orderId: number) => {
    try {
      const res = await hrOrderApi.getDetail(orderId)
      setEditData(res.data)
      setEditOrderType(res.data.orderType)
      setEditEffectiveDate(res.data.effectiveDate)
      setEditAfterId('')
    } catch (e) {
      console.error('상세 조회 실패', e)
    }
  }

  const handleUpdate = async () => {
    if (!editData || !editAfterId) return
    try {
      const targetType = getTargetType(editOrderType)
      let beforeId = 0
      if (editOrderType === 'PROMOTION') beforeId = grades.find(g => g.gradeName === editData.gradeName)?.gradeId ?? 0
      else if (editOrderType === 'TRANSFER') beforeId = departments.find(d => d.deptName === editData.deptName)?.id ?? 0
      else beforeId = titles.find(t => t.titleName === editData.titleName)?.titleId ?? 0

      await hrOrderApi.update(editData.orderId, {
        orderType: editOrderType,
        effectiveDate: editEffectiveDate,
        details: [{
          empId: editData.empId,
          targetType,
          beforeId,
          afterId: editAfterId as number,
        }],
      })
      alert('수정되었습니다.')
      setEditData(null)
      loadOrders()
    } catch (e) {
      console.error('수정 실패', e)
      alert('수정에 실패했습니다.')
    }
  }

  // ── 승인 / 반려 ──

  const handleConfirm = async (id: number) => {
    try {
      await hrOrderApi.confirm(id)
      setConfirmModal(null)
      loadOrders()
    } catch (e) {
      console.error('승인 실패', e)
      alert('승인에 실패했습니다.')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await hrOrderApi.reject(id)
      setConfirmModal(null)
      loadOrders()
    } catch (e) {
      console.error('반려 실패', e)
      alert('반려에 실패했습니다.')
    }
  }

  // ── 알림 발송 ──

  const handleNotify = async () => {
    try {
      for (const id of checkedIds) {
        await hrOrderApi.notify(id)
      }
      alert('알림이 발송되었습니다.')
      setCheckedIds([])
      loadOrders()
    } catch (e) {
      console.error('알림 발송 실패', e)
      alert('알림 발송에 실패했습니다.')
    }
  }

  // ── 삭제 ──

  const handleDelete = async (orderId: number) => {
    if (!confirm('해당 발령을 삭제하시겠습니까?')) return
    try {
      await hrOrderApi.delete(orderId)
      loadOrders()
      setMenuOpen(null)
    } catch (e) {
      console.error('삭제 실패', e)
      alert('삭제에 실패했습니다.')
    }
  }

  // ── 체크박스 ──

  const toggleCheck = (id: number) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleAll = () => {
    setCheckedIds(checkedIds.length === orders.length ? [] : orders.map(a => a.orderId))
  }

  // ── 변경 대상 선택 옵션 ──

  const getAfterOptions = (orderType: OrderType) => {
    if (orderType === 'PROMOTION') return grades.map(g => ({ id: g.gradeId, name: g.gradeName }))
    if (orderType === 'TRANSFER') return departments.map(d => ({ id: d.id, name: d.deptName }))
    return titles.map(t => ({ id: t.titleId, name: t.titleName }))
  }

  const getAfterLabel = (orderType: OrderType) => {
    if (orderType === 'PROMOTION') return '변경 직급'
    if (orderType === 'TRANSFER') return '변경 부서'
    return '변경 직책'
  }

  const sorted = [...orders].sort((a, b) => {
    const cmp = (a[sortKey] ?? '').localeCompare(b[sortKey] ?? '')
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex-1 overflow-y-auto p-6" onClick={() => menuOpen && setMenuOpen(null)}>
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">인사 발령</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">인사 발령</h1>
          <p className="text-xs text-gray-400 mt-1">승진 · 전보 · 보직변경 유형의 인사 발령을 등록하고 결재·공지합니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleNotify}
            disabled={checkedIds.length === 0}
            className={`flex items-center gap-1.5 border px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${checkedIds.length > 0 ? 'border-gray-200 bg-white text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] cursor-pointer' : 'border-gray-100 bg-white text-gray-300 cursor-not-allowed'}`}>
            <i className="fas fa-bullhorn text-xs"></i>
            알림 발송{checkedIds.length > 0 ? ` (${checkedIds.length})` : ''}
          </button>
          <button onClick={() => setShowRegister(!showRegister)}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-plus text-xs"></i>
            발령 등록
          </button>
        </div>
      </div>

      {/* Register Form */}
      {showRegister && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">발령 등록</span>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령유형 <span className="text-red-400">*</span></label>
              <select value={registerOrderType} onChange={e => setRegisterOrderType(e.target.value as OrderType)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                {(Object.entries(ORDER_TYPE_LABELS) as [OrderType, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령일자 <span className="text-red-400">*</span></label>
              <input type="date" value={registerEffectiveDate} onChange={e => setRegisterEffectiveDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
          </div>

          {/* 대상 사원 등록 영역 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-medium text-gray-600">대상 사원 ({selectedEmps.length}명)</span>
              <button onClick={() => setShowEmpSearch(true)} className="text-xs px-3 py-1 border border-gray-200 bg-white text-gray-600 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">+ 사원추가</button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-medium text-gray-500">사번</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">사원명</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">현재 부서</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">현재 직급</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">현재 직책</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">{getAfterLabel(registerOrderType)} <span className="text-red-400">*</span></th>
                  <th className="text-center px-3 py-2 font-medium text-gray-500 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {selectedEmps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-xs">
                      "사원추가" 버튼으로 대상자를 추가하세요
                    </td>
                  </tr>
                ) : (
                  selectedEmps.map(emp => (
                    <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-mono text-gray-500">{emp.empNum}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{emp.empName}</td>
                      <td className="px-3 py-2 text-gray-600">{emp.deptName}</td>
                      <td className="px-3 py-2 text-gray-600">{emp.gradeName}</td>
                      <td className="px-3 py-2 text-gray-600">{emp.titleName || '-'}</td>
                      <td className="px-3 py-2">
                        <select value={emp.afterId}
                          onChange={e => setSelectedEmps(prev => prev.map(s => s.empId === emp.empId ? { ...s, afterId: Number(e.target.value) } : s))}
                          className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-[#1D9E75] w-full">
                          <option value="">선택</option>
                          {getAfterOptions(registerOrderType).map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => removeSelectedEmp(emp.empId)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button onClick={() => { setShowRegister(false); setSelectedEmps([]) }} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
            <button onClick={handleRegister} className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">저장</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setPage(1); loadOrders() } }}
              className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
          </div>
          <select value={filterType} onChange={e => { setFilterType(e.target.value as OrderType | ''); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 유형</option>
            {(Object.entries(ORDER_TYPE_LABELS) as [OrderType, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as OrderStatus | ''); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 상태</option>
            {(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <span className="text-xs text-gray-500">총 <span className="font-semibold text-gray-800">{sorted.length}</span>건</span>
          <select
            className="text-xs text-gray-400 outline-none bg-transparent cursor-pointer hover:text-gray-600 transition-colors"
            value={`${sortKey}-${sortDir}`}
            onChange={e => {
              const [key, dir] = e.target.value.split('-')
              setSortKey(key as 'empNum' | 'empName' | 'effectiveDate')
              setSortDir(dir as 'asc' | 'desc')
              setPage(1)
            }}
          >
            <option value="empNum-asc">사번 오름차순</option>
            <option value="empNum-desc">사번 내림차순</option>
            <option value="empName-asc">성명 가나다순</option>
            <option value="empName-desc">성명 역순</option>
            <option value="effectiveDate-asc">발령일 오래된순</option>
            <option value="effectiveDate-desc">발령일 최신순</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs w-8">
                <input type="checkbox" className="accent-[#1D9E75]" checked={checkedIds.length === orders.length && orders.length > 0} onChange={toggleAll} />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발령유형</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발령일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">등록일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">알림</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs w-16">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="py-12 text-center text-gray-400 text-sm">로딩 중...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-gray-400 text-sm">발령 내역이 없습니다</td></tr>
            ) : paginated.map(order => {
              return (
                <tr key={order.orderId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="accent-[#1D9E75]" checked={checkedIds.includes(order.orderId)} onChange={() => toggleCheck(order.orderId)} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.empNum}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{order.empName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.orderType === 'PROMOTION' ? 'bg-purple-50 text-purple-600' :
                      order.orderType === 'TRANSFER' ? 'bg-blue-50 text-blue-600' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>{ORDER_TYPE_LABELS[order.orderType]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{order.effectiveDate}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{order.createAt?.split('T')[0]}</td>
                  <td className="px-4 py-3">
                    {order.status === 'PENDING' && isHRSuperAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={e => { e.stopPropagation(); setConfirmModal({ id: order.orderId, type: 'approve', name: order.empName }) }}
                          className="text-[10px] px-2.5 py-0.5 border border-[#1D9E75] text-[#1D9E75] rounded hover:bg-[#eaf6f0] transition-colors">승인</button>
                        <button onClick={e => { e.stopPropagation(); setConfirmModal({ id: order.orderId, type: 'reject', name: order.empName }) }}
                          className="text-[10px] px-2.5 py-0.5 border border-red-400 text-red-400 rounded hover:bg-red-50 transition-colors">반려</button>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'CONFIRMED' || order.status === 'APPLIED' ? 'bg-gray-100 text-gray-500' :
                        order.status === 'REJECTED' ? 'bg-red-50 text-red-500' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>{ORDER_STATUS_LABELS[order.status]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {order.isNotified
                      ? <i className="fas fa-check text-[#1D9E75] text-xs"></i>
                      : <span className="text-gray-300">-</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center relative">
                    <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === order.orderId ? null : order.orderId) }}
                      className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors px-2 py-1">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {menuOpen === order.orderId && (
                      <div onClick={e => e.stopPropagation()} className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                        <button onClick={() => { openDetail(order.orderId); setMenuOpen(null) }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors">
                          <i className="fas fa-eye mr-2 text-[10px]"></i>상세 보기</button>
                        {order.status === 'PENDING' && (
                          <>
                            <button onClick={() => { openEdit(order.orderId); setMenuOpen(null) }}
                              className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors">
                              <i className="fas fa-pen mr-2 text-[10px]"></i>수정</button>
                            <button onClick={() => handleDelete(order.orderId)}
                              className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                              <i className="fas fa-trash mr-2 text-[10px]"></i>삭제</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="flex-1" />
        {/* 페이징 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>페이지당</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none">
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}건</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-left text-[10px]" />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-left text-[10px]" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '...' ? (
                  <span key={`e-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n as number)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      page === n ? 'bg-[#1D9E75] text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    {n}
                  </button>
                )
              )
            }
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-right text-[10px]" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-right text-[10px]" />
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {sorted.length === 0 ? '0건' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)} / ${sorted.length}건`}
          </span>
        </div>
      </div>

      {/* 사원 검색 모달 */}
      {showEmpSearch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[560px] max-h-[70vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">사원 검색</h3>
              <button onClick={() => setShowEmpSearch(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
                  <i className="fas fa-search text-gray-400 text-xs"></i>
                  <input value={empSearchKeyword} onChange={e => setEmpSearchKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') searchEmployees() }}
                    className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번으로 검색" autoFocus />
                </div>
                <button onClick={searchEmployees} className="px-4 py-2 bg-[#1D9E75] text-white text-sm rounded-lg hover:bg-[#178a65] transition-colors">검색</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {empSearchLoading ? (
                <div className="py-12 text-center text-gray-400 text-sm">검색 중...</div>
              ) : empSearchResults.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">검색 결과가 없습니다</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">사번</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">이름</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">부서</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">직급</th>
                      <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 w-16">선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empSearchResults.map(emp => {
                      const alreadyAdded = selectedEmps.some(s => s.empId === emp.empId)
                      return (
                        <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{emp.empNum}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{emp.empName}</td>
                          <td className="px-4 py-2.5 text-gray-600">{emp.deptName}</td>
                          <td className="px-4 py-2.5 text-gray-600">{emp.gradeName}</td>
                          <td className="px-4 py-2.5 text-center">
                            {alreadyAdded ? (
                              <span className="text-[10px] text-gray-400">추가됨</span>
                            ) : (
                              <button onClick={() => addEmployee(emp)} className="text-xs px-2.5 py-1 bg-[#1D9E75] text-white rounded hover:bg-[#178a65] transition-colors">선택</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {detailData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[700px] mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{detailData.empName}</h3>
                  <span className="text-[11px] font-mono text-gray-400">{detailData.empNum}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    detailData.orderType === 'PROMOTION' ? 'bg-purple-50 text-purple-600' :
                    detailData.orderType === 'TRANSFER' ? 'bg-blue-50 text-blue-600' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>{ORDER_TYPE_LABELS[detailData.orderType]}</span>
                </div>
                <span className="text-[11px] text-gray-400">등록일 {detailData.createdAt?.split('T')[0]}</span>
              </div>
              <button onClick={() => setDetailData(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <div className="px-7 py-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-3">발령 정보</h4>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 w-28 text-xs">발령유형</td>
                        <td className="px-4 py-2.5 text-gray-800">{ORDER_TYPE_LABELS[detailData.orderType]}</td>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 w-28 text-xs">발령일</td>
                        <td className="px-4 py-2.5 text-gray-800">{detailData.effectiveDate}</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">상태</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            detailData.status === 'CONFIRMED' || detailData.status === 'APPLIED' ? 'bg-gray-100 text-gray-500' :
                            detailData.status === 'REJECTED' ? 'bg-red-50 text-red-500' :
                            'bg-yellow-50 text-yellow-600'
                          }`}>{ORDER_STATUS_LABELS[detailData.status]}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">알림 여부</td>
                        <td className="px-4 py-2.5 text-gray-800">{detailData.isNotified ? '발송완료' : '미발송'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">현재 소속</td>
                        <td className="px-4 py-2.5 text-gray-800" colSpan={3}>{detailData.deptName} · {detailData.gradeName} · {detailData.titleName || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {detailData.details.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-3">변경 내용</h4>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left w-24">구분</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">변경 전</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-gray-400 text-center w-10"></th>
                          <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">변경 후</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.details.map((d, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="px-4 py-2.5 text-xs text-gray-400">
                              {d.targetType === 'DEPARTMENT' ? '부서' : d.targetType === 'GRADE' ? '직급' : '직책'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">{d.beforeName}</td>
                            <td className="px-4 py-2.5 text-center"><i className="fas fa-arrow-right text-[10px] text-gray-300"></i></td>
                            <td className="px-4 py-2.5 text-gray-900 font-medium">{d.afterName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100">
              <button onClick={() => setDetailData(null)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">닫기</button>
              {detailData.status === 'PENDING' && (
                <button onClick={() => { openEdit(detailData.orderId); setDetailData(null) }}
                  className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
                  <i className="fas fa-pen mr-1.5 text-[10px]"></i>수정</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[640px] max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">발령 수정</h3>
              <button onClick={() => setEditData(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">발령일자 <span className="text-red-400">*</span></label>
                  <input type="date" value={editEffectiveDate} onChange={e => setEditEffectiveDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">대상 사원</label>
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" disabled value={`${editData.empName} (${editData.empNum})`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">발령 유형 <span className="text-red-400">*</span></label>
                  <select value={editOrderType} onChange={e => { setEditOrderType(e.target.value as OrderType); setEditAfterId('') }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]">
                    {(Object.entries(ORDER_TYPE_LABELS) as [OrderType, string][]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">{getAfterLabel(editOrderType)} <span className="text-red-400">*</span></label>
                  <select value={editAfterId} onChange={e => setEditAfterId(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]">
                    <option value="">선택</option>
                    {getAfterOptions(editOrderType).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-2">현재 정보: {editData.deptName} · {editData.gradeName} · {editData.titleName || '-'}</div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditData(null)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleUpdate}
                className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 승인/반려 확인 모달 */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[400px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmModal.type === 'approve' ? 'bg-[#eaf6f0]' : 'bg-red-50'
              }`}>
                <i className={`fas ${confirmModal.type === 'approve' ? 'fa-check text-[#1D9E75]' : 'fa-times text-red-500'}`}></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {confirmModal.type === 'approve' ? '발령 승인' : '발령 반려'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {confirmModal.type === 'approve' ? '해당 인사 발령을 승인합니다.' : '해당 인사 발령을 반려합니다.'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              <span className="font-medium">{confirmModal.name}</span>님의 인사 발령을 {confirmModal.type === 'approve' ? '승인' : '반려'}하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmModal(null)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors">취소</button>
              <button onClick={() => confirmModal.type === 'approve' ? handleConfirm(confirmModal.id) : handleReject(confirmModal.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  confirmModal.type === 'approve' ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-red-500 hover:bg-red-600'
                }`}>
                {confirmModal.type === 'approve' ? '승인' : '반려'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
