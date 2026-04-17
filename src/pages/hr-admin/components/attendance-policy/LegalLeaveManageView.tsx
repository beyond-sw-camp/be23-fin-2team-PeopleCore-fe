import { useState } from 'react'

interface LeaveType {
  id: number
  name: string
  isLegal: boolean
  isPaid: boolean
  maxDays: number
  unit: '일' | '반차' | '반반차'
  isActive: boolean
}

const INITIAL_LEAVES: LeaveType[] = []

const EMPTY_LEAVE: Omit<LeaveType, 'id'> = {
  name: '', isLegal: false, isPaid: true, maxDays: 1, unit: '일', isActive: true,
}

export default function LegalLeaveManageView() {
  const [leaves, setLeaves] = useState<LeaveType[]>(INITIAL_LEAVES)
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; leave: LeaveType | Omit<LeaveType, 'id'> } | null>(null)
  const [filter, setFilter] = useState<'all' | 'legal' | 'company'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const filtered = filter === 'all' ? leaves
    : filter === 'legal' ? leaves.filter((l) => l.isLegal)
    : leaves.filter((l) => !l.isLegal)

  const handleSave = () => {
    if (!editModal) return
    if (editModal.mode === 'create') {
      const newId = Math.max(...leaves.map((l) => l.id), 0) + 1
      setLeaves([...leaves, { ...editModal.leave, id: newId } as LeaveType])
    } else {
      setLeaves(leaves.map((l) => l.id === (editModal.leave as LeaveType).id ? editModal.leave as LeaveType : l))
    }
    setEditModal(null)
  }

  const activeCount = leaves.filter((l) => l.isActive).length

  const handleToggleActive = (id: number) => {
    const target = leaves.find((l) => l.id === id)
    if (target?.isActive && activeCount <= 3) return
    setLeaves(leaves.map((l) => l.id === id ? { ...l, isActive: !l.isActive } : l))
  }

  const handleDelete = (id: number) => {
    setLeaves(leaves.filter((l) => l.id !== id))
    setDeleteConfirm(null)
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">별도 휴가 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">회사에서 사용할 휴가 유형을 등록합니다. 법정 휴가는 직원 신청 시 인사과 승인이 필요합니다.</p>

      {/* 필터 + 추가 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {([['all', '전체'], ['legal', '법정 휴가'], ['company', '회사 휴가']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-1.5 text-[12px] transition-colors ${filter === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {label} ({key === 'all' ? leaves.length : key === 'legal' ? leaves.filter((l) => l.isLegal).length : leaves.filter((l) => !l.isLegal).length})
            </button>
          ))}
        </div>
        <button onClick={() => setEditModal({ mode: 'create', leave: { ...EMPTY_LEAVE } })}
          className="px-4 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors">
          + 휴가 유형 추가
        </button>
      </div>

      {/* 테이블 */}
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">구분</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가명</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">유급/무급</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">최대일수</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">신청단위</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">승인 프로세스</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">상태</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
        </tr></thead>
        <tbody>
          {filtered.map((l) => (
            <tr key={l.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!l.isActive ? 'opacity-50' : ''}`}>
              <td className="px-3 py-2.5">
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${l.isLegal ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {l.isLegal ? '법정' : '회사'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-gray-800 font-medium">{l.name}</td>
              <td className="px-3 py-2.5 text-center">
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${l.isPaid ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-100 text-gray-500'}`}>
                  {l.isPaid ? '유급' : '무급'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right text-[#1D9E75] font-semibold">
                {l.maxDays === 0 ? '제한없음' : `${l.maxDays}일`}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-600">{l.unit}</td>
              <td className="px-3 py-2.5 text-center">
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${l.isLegal ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                  {l.isLegal ? '인사과 승인' : '일반 결재'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center">
                <button onClick={() => handleToggleActive(l.id)}
                  title={l.isActive && activeCount <= 3 ? '최소 3개 이상 활성화 필요' : ''}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${l.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'} ${l.isActive && activeCount <= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${l.isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </td>
              <td className="px-3 py-2.5 text-right">
                <button onClick={() => setEditModal({ mode: 'edit', leave: { ...l } })}
                  className="text-[11px] text-[#1D9E75] hover:underline mr-2">수정</button>
                <button onClick={() => setDeleteConfirm(l.id)}
                  className="text-[11px] text-red-500 hover:underline">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[13px] text-gray-400">등록된 휴가 유형이 없습니다</div>
      )}

      {/* 안내 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <i className="fas fa-info-circle text-blue-400 mt-0.5 text-[12px]" />
          <div className="text-[11px] text-blue-600 space-y-1">
            <p><strong>법정 휴가</strong>: 직원이 신청하면 인사과 승인 프로세스를 거쳐 부여됩니다.</p>
            <p><strong>회사 휴가</strong>: 일반 전자결재 라인을 통해 승인됩니다.</p>
            <p>활성화된 휴가 유형만 사원 연차·휴가 관리에서 신청할 수 있습니다.</p>
            <p>최소 3개 이상의 휴가 유형이 활성화되어 있어야 합니다.</p>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[400px] p-6">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">휴가 유형 삭제</h3>
            <p className="text-[12px] text-gray-600 mb-1">
              <strong>{leaves.find((l) => l.id === deleteConfirm)?.name}</strong>을(를) 삭제하시겠습니까?
            </p>
            {leaves.find((l) => l.id === deleteConfirm)?.isLegal && (
              <p className="text-[11px] text-red-500 mb-4">
                <i className="fas fa-exclamation-triangle mr-1" />
                법정 휴가입니다. 삭제 시 해당 유형으로 신청이 불가능해집니다. 삭제보다 비활성화를 권장합니다.
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-1.5 border border-gray-300 text-gray-600 text-[13px] rounded-md hover:bg-gray-50">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-1.5 bg-red-500 text-white text-[13px] rounded-md hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[480px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[16px] font-bold text-gray-900">
                {editModal.mode === 'create' ? '휴가 유형 추가' : '휴가 유형 수정'}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 휴가명 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">휴가명 <span className="text-red-500">*</span></label>
                <input type="text" value={editModal.leave.name}
                  onChange={(e) => setEditModal({ ...editModal, leave: { ...editModal.leave, name: e.target.value } })}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
                  placeholder="예: 출산휴가, 보상휴가" />
              </div>

              {/* 구분 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">구분</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                    <input type="radio" checked={editModal.leave.isLegal}
                      onChange={() => setEditModal({ ...editModal, leave: { ...editModal.leave, isLegal: true } })} className="accent-[#1D9E75]" />
                    법정 휴가 <span className="text-[10px] text-gray-400">(인사과 승인)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                    <input type="radio" checked={!editModal.leave.isLegal}
                      onChange={() => setEditModal({ ...editModal, leave: { ...editModal.leave, isLegal: false } })} className="accent-[#1D9E75]" />
                    회사 휴가 <span className="text-[10px] text-gray-400">(일반 결재)</span>
                  </label>
                </div>
              </div>

              {/* 유급/무급 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">유급 여부</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                    <input type="radio" checked={editModal.leave.isPaid}
                      onChange={() => setEditModal({ ...editModal, leave: { ...editModal.leave, isPaid: true } })} className="accent-[#1D9E75]" />
                    유급
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                    <input type="radio" checked={!editModal.leave.isPaid}
                      onChange={() => setEditModal({ ...editModal, leave: { ...editModal.leave, isPaid: false } })} className="accent-[#1D9E75]" />
                    무급
                  </label>
                </div>
              </div>

              {/* 최대 일수 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">최대 일수</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={editModal.leave.maxDays}
                    onChange={(e) => setEditModal({ ...editModal, leave: { ...editModal.leave, maxDays: Number(e.target.value) } })}
                    className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none w-20 focus:border-[#1D9E75]" min={0} />
                  <span className="text-[12px] text-gray-500">일 (0 = 제한없음)</span>
                </div>
              </div>

              {/* 신청 단위 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">신청 단위</label>
                <select value={editModal.leave.unit}
                  onChange={(e) => setEditModal({ ...editModal, leave: { ...editModal.leave, unit: e.target.value as LeaveType['unit'] } })}
                  className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]">
                  <option value="일">일 단위</option>
                  <option value="반차">반차 가능</option>
                  <option value="반반차">반반차 가능</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setEditModal(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">취소</button>
              <button onClick={handleSave}
                disabled={!editModal.leave.name.trim()}
                className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${editModal.leave.name.trim() ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {editModal.mode === 'create' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
