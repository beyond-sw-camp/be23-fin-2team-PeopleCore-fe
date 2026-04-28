import { useState, useEffect, useCallback } from 'react'
import type { OrderType, OrderStatus } from '../types'
import { ORDER_TYPE_LABELS, ORDER_STATUS_LABELS } from '../types'
import { hrOrderApi } from '../../../api/hrOrder'
import type { HrOrderListItem, HrOrderDetail, HrOrderCreateReq } from '../../../api/hrOrder'
import { gradeApi, titleApi, departmentApi } from '../../../api/org'
import type { GradeResponse, TitleResponse, DepartmentTreeResponse } from '../../../api/org'
import { fetchEmployeeList } from '../../../api/employee/employeeApi'
import type { EmployeeListDto } from '../../../api/employee/types'

function flattenDepts(nodes: DepartmentTreeResponse[]): DepartmentTreeResponse[] {
  const result: DepartmentTreeResponse[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children?.length) result.push(...flattenDepts(node.children))
  }
  return result
}

export default function PersonnelOrderTab() {
  // 발령 목록
  const [orders, setOrders] = useState<HrOrderListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<OrderType | ''>('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')

  // 상세
  const [selectedDetail, setSelectedDetail] = useState<HrOrderDetail | null>(null)

  // 등록 모달
  const [createModal, setCreateModal] = useState(false)
  const [formType, setFormType] = useState<OrderType>('PROMOTION')
  const [formDate, setFormDate] = useState('')
  const [, setFormEmpId] = useState<number | ''>('')
  const [formAfterId, setFormAfterId] = useState<number | ''>('')

  // 사원 검색
  const [empKeyword, setEmpKeyword] = useState('')
  const [empResults, setEmpResults] = useState<EmployeeListDto[]>([])
  const [selectedEmp, setSelectedEmp] = useState<EmployeeListDto | null>(null)

  // 마스터 데이터
  const [departments, setDepartments] = useState<DepartmentTreeResponse[]>([])
  const [grades, setGrades] = useState<GradeResponse[]>([])
  const [titles, setTitles] = useState<TitleResponse[]>([])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page: 0, size: 100 }
      if (filterType) params.orderType = filterType
      if (filterStatus) params.status = filterStatus
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await hrOrderApi.getList(params as any)
      setOrders(res.data.content)
    } catch (e) {
      console.error('발령 목록 조회 실패', e)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    Promise.all([
      departmentApi.getTree(),
      gradeApi.getList(),
      titleApi.getList(),
    ]).then(([dRes, gRes, tRes]) => {
      setDepartments(flattenDepts(dRes.data))
      setGrades(gRes.data)
      setTitles(tRes.data)
    }).catch(console.error)
  }, [])

  // 상세 선택
  const selectOrder = async (orderId: number) => {
    try {
      const res = await hrOrderApi.getDetail(orderId)
      setSelectedDetail(res.data)
    } catch (e) {
      console.error('상세 조회 실패', e)
    }
  }

  // 사원 검색
  const searchEmp = async () => {
    try {
      const res = await fetchEmployeeList({ keyword: empKeyword, empStatus: 'ACTIVE', page: 0, size: 20 })
      setEmpResults(res.content)
    } catch { setEmpResults([]) }
  }

  // 발령 등록
  const getTargetType = (t: OrderType) => t === 'PROMOTION' ? 'GRADE' : t === 'TRANSFER' ? 'DEPARTMENT' : 'TITLE'

  const getBeforeId = (): number => {
    if (!selectedEmp) return 0
    if (formType === 'PROMOTION') return grades.find(g => g.gradeName === selectedEmp.gradeName)?.gradeId ?? 0
    if (formType === 'TRANSFER') return departments.find(d => d.deptName === selectedEmp.deptName)?.id ?? 0
    return titles.find(t => t.titleName === selectedEmp.titleName)?.titleId ?? 0
  }

  const handleSubmit = async () => {
    if (!selectedEmp || !formDate || formAfterId === '') return
    try {
      const req: HrOrderCreateReq = {
        orderType: formType,
        effectiveDate: formDate,
        details: [{
          empId: selectedEmp.empId,
          targetType: getTargetType(formType),
          beforeId: getBeforeId(),
          afterId: formAfterId as number,
        }],
      }
      await hrOrderApi.create(req)
      alert('발령이 등록되었습니다.')
      setCreateModal(false)
      setSelectedEmp(null)
      setFormAfterId('')
      loadOrders()
    } catch (e) {
      console.error('발령 등록 실패', e)
      alert('발령 등록에 실패했습니다.')
    }
  }

  // 알림 발송
  const handleNotify = async (orderId: number) => {
    try {
      await hrOrderApi.notify(orderId)
      alert('알림이 발송되었습니다.')
      selectOrder(orderId)
      loadOrders()
    } catch (e) {
      console.error('알림 발송 실패', e)
      alert('알림 발송에 실패했습니다.')
    }
  }

  // 삭제
  const handleDelete = async (orderId: number) => {
    if (!confirm('해당 발령을 삭제하시겠습니까?')) return
    try {
      await hrOrderApi.delete(orderId)
      setSelectedDetail(null)
      loadOrders()
    } catch (e) {
      console.error('삭제 실패', e)
      alert('삭제에 실패했습니다.')
    }
  }

  // 변경 대상 옵션
  const getAfterOptions = (t: OrderType) => {
    if (t === 'PROMOTION') return grades.map(g => ({ id: g.gradeId, name: g.gradeName }))
    if (t === 'TRANSFER') return departments.map(d => ({ id: d.id, name: d.deptName }))
    return titles.map(t => ({ id: t.titleId, name: t.titleName }))
  }

  const openCreate = () => {
    setFormType('PROMOTION'); setFormDate(''); setFormEmpId('')
    setFormAfterId(''); setSelectedEmp(null); setEmpResults([])
    setEmpKeyword('')
    setCreateModal(true)
  }

  const formatDate = (d: string) => d?.split('T')[0] || ''

  return (
    <div className="flex gap-5 h-full">
      {/* 좌: 발령 목록 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
        {/* 필터 바 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as OrderType | '')}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#1D9E75]">
              <option value="">전체 유형</option>
              {Object.entries(ORDER_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as OrderStatus | '')}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#1D9E75]">
              <option value="">전체 상태</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <button onClick={openCreate}
            className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">
            <i className="fa-solid fa-plus text-[10px] mr-1" />발령 신청
          </button>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-[13px]">로딩 중...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <i className="fa-solid fa-file-contract text-3xl mb-3" />
              <p className="text-[13px]">발령 내역이 없습니다</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[80px_80px_1fr_100px_100px_80px] px-5 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100 sticky top-0">
                <span>유형</span><span>대상자</span><span>사번</span><span>발령일</span><span>상태</span><span>알림</span>
              </div>
              {orders.map((order) => {
                const statusCfg = ORDER_STATUS_LABELS[order.status]
                return (
                  <div
                    key={order.orderId}
                    onClick={() => selectOrder(order.orderId)}
                    className={`grid grid-cols-[80px_80px_1fr_100px_100px_80px] px-5 py-2.5 text-[12px] border-b border-gray-50 cursor-pointer transition-colors items-center ${
                      selectedDetail?.orderId === order.orderId ? 'bg-[#f0faf6]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-700 font-medium">{ORDER_TYPE_LABELS[order.orderType]}</span>
                    <span className="text-gray-800">{order.empName}</span>
                    <span className="text-gray-500 truncate font-mono text-[11px]">{order.empNum}</span>
                    <span className="text-gray-500">{order.effectiveDate}</span>
                    <span><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color}`}>{statusCfg.label}</span></span>
                    <span>
                      {order.isNotified
                        ? <i className="fa-solid fa-check-circle text-green-500 text-[12px]" title="발송완료" />
                        : <i className="fa-solid fa-circle-minus text-gray-300 text-[12px]" title="미발송" />
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 우: 상세/액션 */}
      <div className="w-[300px] bg-white rounded-xl border border-gray-200 shrink-0 overflow-y-auto">
        {selectedDetail ? (
          <div className="p-5">
            <div className="mb-4 pb-4 border-b border-gray-100">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ORDER_STATUS_LABELS[selectedDetail.status].color}`}>
                {ORDER_STATUS_LABELS[selectedDetail.status].label}
              </span>
              <h3 className="text-[16px] font-bold text-gray-800 mt-2">
                {ORDER_TYPE_LABELS[selectedDetail.orderType]}
              </h3>
              <p className="text-[12px] text-gray-400 mt-0.5">등록일: {formatDate(selectedDetail.createdAt)}</p>
            </div>

            <div className="space-y-3 mb-5">
              <DetailRow label="대상자" value={`${selectedDetail.empName} (${selectedDetail.empNum})`} />
              <DetailRow label="발령일" value={selectedDetail.effectiveDate} />
              <DetailRow label="현재 소속" value={`${selectedDetail.deptName} · ${selectedDetail.gradeName} · ${selectedDetail.titleName || '-'}`} />
              {selectedDetail.details.map((d, i) => (
                <DetailRow key={i}
                  label={d.targetType === 'DEPARTMENT' ? '부서 변경' : d.targetType === 'GRADE' ? '직급 변경' : '직책 변경'}
                  value={`${d.beforeName} → ${d.afterName}`} />
              ))}
            </div>

            {selectedDetail.status === 'SCHEDULED' && (
              <div className="px-3 py-2.5 bg-amber-50 rounded-lg mb-3">
                <p className="text-[11px] text-amber-700">
                  <i className="fa-solid fa-clock text-[10px] mr-1" />
                  발령일에 자동으로 반영됩니다
                </p>
              </div>
            )}
            <div className="flex gap-2">
              {!selectedDetail.isNotified && (
                <button onClick={() => handleNotify(selectedDetail.orderId)}
                  className="flex-1 py-2 text-[12px] bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  <i className="fa-solid fa-paper-plane text-[10px] mr-1" />공지 발송
                </button>
              )}
              {selectedDetail.status === 'SCHEDULED' && (
                <button onClick={() => handleDelete(selectedDetail.orderId)}
                  className="flex-1 py-2 text-[12px] border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                  삭제
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <i className="fa-solid fa-file-signature text-3xl mb-3" />
            <p className="text-[13px]">발령을 선택하면</p>
            <p className="text-[13px]">상세 정보가 표시됩니다</p>
          </div>
        )}
      </div>

      {/* 발령 등록 모달 */}
      {createModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setCreateModal(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[min(480px,calc(100vw-24px))] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-800">인사 발령 신청</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">발령 유형을 선택하고 대상 직원 및 변경 사항을 입력하세요.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* 유형 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1.5 block">발령 유형</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ORDER_TYPE_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => { setFormType(k as OrderType); setFormAfterId('') }}
                      className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${
                        formType === k ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* 대상 직원 검색 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">대상 직원</label>
                <div className="flex gap-2">
                  <input value={empKeyword} onChange={e => setEmpKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') searchEmp() }}
                    placeholder="이름 또는 사번 검색"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
                  <button onClick={searchEmp} className="px-3 py-2 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90">검색</button>
                </div>
                {empResults.length > 0 && !selectedEmp && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-[150px] overflow-y-auto">
                    {empResults.map(emp => (
                      <div key={emp.empId} onClick={() => { setSelectedEmp(emp); setEmpResults([]) }}
                        className="px-3 py-2 text-[12px] hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                        {emp.empName} ({emp.empNum}) · {emp.deptName} · {emp.gradeName}
                      </div>
                    ))}
                  </div>
                )}
                {selectedEmp && (
                  <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-[11px] text-gray-500 flex items-center justify-between">
                    <span>{selectedEmp.empName} ({selectedEmp.empNum}) · {selectedEmp.deptName} · {selectedEmp.gradeName} · {selectedEmp.titleName || '-'}</span>
                    <button onClick={() => setSelectedEmp(null)} className="text-gray-400 hover:text-red-400 ml-2">
                      <i className="fa-solid fa-times text-[10px]" />
                    </button>
                  </div>
                )}
              </div>

              {/* 변경 대상 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">
                  {formType === 'PROMOTION' ? '변경 직급' : formType === 'TRANSFER' ? '이동 부서' : '변경 직책'}
                </label>
                <select value={formAfterId} onChange={e => setFormAfterId(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]">
                  <option value="">선택</option>
                  {getAfterOptions(formType).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {/* 발령일 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">발령일</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setCreateModal(false)} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleSubmit} disabled={!selectedEmp || !formDate || formAfterId === ''}
                className="px-4 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40">
                신청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-[12px] text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
