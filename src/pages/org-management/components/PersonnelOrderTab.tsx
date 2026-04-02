import { useState } from 'react'
import type { PersonnelOrder, Employee, Department, Rank, OrderType } from '../types'
import { ORDER_TYPE_LABELS, ORDER_STATUS_LABELS } from '../types'

interface Props {
  orders: PersonnelOrder[]
  employees: Employee[]
  departments: Department[]
  ranks: Rank[]
  onUpdateOrders: (orders: PersonnelOrder[]) => void
}

export default function PersonnelOrderTab({ orders, employees, departments, ranks, onUpdateOrders }: Props) {
  const [filterType, setFilterType] = useState<OrderType | ''>('')
  const [filterStatus, setFilterStatus] = useState<PersonnelOrder['status'] | ''>('')
  const [createModal, setCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PersonnelOrder | null>(null)

  // 발령 등록 폼
  const [formType, setFormType] = useState<OrderType>('promotion')
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formToDept, setFormToDept] = useState('')
  const [formToRank, setFormToRank] = useState('')
  const [formToPosition, setFormToPosition] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formMemo, setFormMemo] = useState('')

  const sortedOrders = [...orders]
    .filter((o) => (!filterType || o.type === filterType) && (!filterStatus || o.status === filterStatus))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const sortedRanks = [...ranks].sort((a, b) => a.level - b.level)

  const selectedEmp = employees.find((e) => e.id === formEmployeeId)

  const openCreate = () => {
    setFormType('promotion'); setFormEmployeeId(''); setFormToDept(''); setFormToRank('')
    setFormToPosition(''); setFormDate(''); setFormMemo('')
    setCreateModal(true)
  }

  const handleSubmit = () => {
    if (!formEmployeeId || !formDate) return
    const emp = employees.find((e) => e.id === formEmployeeId)
    if (!emp) return

    const toDeptName = formToDept ? departments.find((d) => d.id === formToDept)?.name || emp.departmentName : emp.departmentName
    const toRankName = formToRank ? sortedRanks.find((r) => r.id === formToRank)?.name || emp.rankName : emp.rankName

    const newOrder: PersonnelOrder = {
      id: `ord_${Date.now()}`, type: formType,
      employeeId: emp.id, employeeName: emp.name,
      fromDepartment: emp.departmentName, toDepartment: toDeptName,
      fromRank: emp.rankName, toRank: toRankName,
      fromPosition: emp.positionName || '-', toPosition: formToPosition || emp.positionName || '-',
      effectiveDate: formDate,
      status: 'pending_approval',
      notified: false, createdBy: '김철수', createdAt: new Date().toISOString(), memo: formMemo,
    }
    onUpdateOrders([...orders, newOrder])
    setCreateModal(false)
  }

  const handleNotify = (order: PersonnelOrder) => {
    onUpdateOrders(orders.map((o) => o.id === order.id ? { ...o, notified: true } : o))
    alert(`${order.employeeName}님에게 발령 공지가 발송되었습니다.`)
  }

  const handleCancel = (order: PersonnelOrder) => {
    if (confirm(`${order.employeeName}님의 ${ORDER_TYPE_LABELS[order.type]} 발령을 취소하시겠습니까?`)) {
      onUpdateOrders(orders.map((o) => o.id === order.id ? { ...o, status: 'cancelled' } : o))
    }
  }

  const formatDate = (d: string) => d.split('T')[0]

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
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as PersonnelOrder['status'] | '')}
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
          {sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <i className="fa-solid fa-file-contract text-3xl mb-3" />
              <p className="text-[13px]">발령 내역이 없습니다</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[80px_80px_1fr_100px_100px_80px] px-5 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100 sticky top-0">
                <span>유형</span><span>대상자</span><span>내용</span><span>발령일</span><span>상태</span><span>공지</span>
              </div>
              {sortedOrders.map((order) => {
                const statusCfg = ORDER_STATUS_LABELS[order.status]
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`grid grid-cols-[80px_80px_1fr_100px_100px_80px] px-5 py-2.5 text-[12px] border-b border-gray-50 cursor-pointer transition-colors items-center ${
                      selectedOrder?.id === order.id ? 'bg-[#f0faf6]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-700 font-medium">{ORDER_TYPE_LABELS[order.type]}</span>
                    <span className="text-gray-800">{order.employeeName}</span>
                    <span className="text-gray-500 truncate">
                      {order.fromDepartment !== order.toDepartment
                        ? `${order.fromDepartment} → ${order.toDepartment}`
                        : order.fromRank !== order.toRank
                        ? `${order.fromRank} → ${order.toRank}`
                        : `${order.fromPosition} → ${order.toPosition}`}
                    </span>
                    <span className="text-gray-500">{order.effectiveDate}</span>
                    <span><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color}`}>{statusCfg.label}</span></span>
                    <span>
                      {order.notified
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
        {selectedOrder ? (
          <div className="p-5">
            <div className="mb-4 pb-4 border-b border-gray-100">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ORDER_STATUS_LABELS[selectedOrder.status].color}`}>
                {ORDER_STATUS_LABELS[selectedOrder.status].label}
              </span>
              <h3 className="text-[16px] font-bold text-gray-800 mt-2">
                {ORDER_TYPE_LABELS[selectedOrder.type]}
              </h3>
              <p className="text-[12px] text-gray-400 mt-0.5">등록일: {formatDate(selectedOrder.createdAt)}</p>
            </div>

            <div className="space-y-3 mb-5">
              <DetailRow label="대상자" value={selectedOrder.employeeName} />
              <DetailRow label="발령일" value={selectedOrder.effectiveDate} />
              <DetailRow label="부서" value={`${selectedOrder.fromDepartment} → ${selectedOrder.toDepartment}`} />
              <DetailRow label="직급" value={`${selectedOrder.fromRank} → ${selectedOrder.toRank}`} />
              <DetailRow label="직책" value={`${selectedOrder.fromPosition} → ${selectedOrder.toPosition}`} />
              <DetailRow label="메모" value={selectedOrder.memo || '-'} />
              <DetailRow label="등록자" value={selectedOrder.createdBy} />
            </div>

            {selectedOrder.status === 'pending_approval' && (
              <div className="px-3 py-2.5 bg-amber-50 rounded-lg mb-3">
                <p className="text-[11px] text-amber-700">
                  <i className="fa-solid fa-clock text-[10px] mr-1" />
                  최고권한자의 승인을 기다리고 있습니다
                </p>
              </div>
            )}
            {selectedOrder.status === 'rejected' && (
              <div className="px-3 py-2.5 bg-red-50 rounded-lg mb-3">
                <p className="text-[11px] text-red-600">
                  <i className="fa-solid fa-circle-xmark text-[10px] mr-1" />
                  발령 신청이 반려되었습니다
                </p>
              </div>
            )}
            {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'rejected' && (
              <div className="flex gap-2">
                {selectedOrder.status === 'effective' && !selectedOrder.notified && (
                  <button onClick={() => handleNotify(selectedOrder)}
                    className="flex-1 py-2 text-[12px] bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <i className="fa-solid fa-paper-plane text-[10px] mr-1" />공지 발송
                  </button>
                )}
                {selectedOrder.status === 'pending_approval' && (
                  <button onClick={() => handleCancel(selectedOrder)}
                    className="flex-1 py-2 text-[12px] border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                    신청 취소
                  </button>
                )}
              </div>
            )}
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
          <div className="relative bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-800">인사 발령 신청</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">발령 유형을 선택하고 대상 직원 및 변경 사항을 입력하세요. 최고권한자 승인 후 발령됩니다.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* 유형 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1.5 block">발령 유형</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ORDER_TYPE_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setFormType(k as OrderType)}
                      className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${
                        formType === k ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* 대상 직원 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">대상 직원</label>
                <select value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]">
                  <option value="">직원 선택</option>
                  {employees.filter((e) => e.status === 'active').map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.departmentName} · {e.rankName})</option>
                  ))}
                </select>
                {selectedEmp && (
                  <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-[11px] text-gray-500">
                    현재: {selectedEmp.departmentName} · {selectedEmp.rankName} · {selectedEmp.positionName || '직책없음'}
                  </div>
                )}
              </div>

              {/* 변경 정보 (유형에 따라 분기) */}
              {(formType === 'transfer' || formType === 'concurrent') && (
                <div>
                  <label className="text-[12px] text-gray-600 mb-1 block">이동 부서</label>
                  <select value={formToDept} onChange={(e) => setFormToDept(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]">
                    <option value="">부서 선택</option>
                    {departments.filter((d) => d.id !== 'ceo').map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(formType === 'promotion' || formType === 'rank_change') && (
                <div>
                  <label className="text-[12px] text-gray-600 mb-1 block">변경 직급</label>
                  <select value={formToRank} onChange={(e) => setFormToRank(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]">
                    <option value="">직급 선택</option>
                    {sortedRanks.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formType === 'position_change' && (
                <div>
                  <label className="text-[12px] text-gray-600 mb-1 block">변경 직책</label>
                  <input value={formToPosition} onChange={(e) => setFormToPosition(e.target.value)} placeholder="예: 팀장, 파트장"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
                </div>
              )}

              {/* 발령일 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">발령일</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]" />
              </div>

              {/* 메모 */}
              <div>
                <label className="text-[12px] text-gray-600 mb-1 block">메모</label>
                <textarea value={formMemo} onChange={(e) => setFormMemo(e.target.value)} rows={2} placeholder="발령 사유 등"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75] resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setCreateModal(false)} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleSubmit} disabled={!formEmployeeId || !formDate}
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
