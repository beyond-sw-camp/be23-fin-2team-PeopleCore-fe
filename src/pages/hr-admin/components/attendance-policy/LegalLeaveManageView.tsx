import { useEffect, useState } from 'react'
import { vacationApi, type VacationTypeResponse } from '../../../../api/vacation'

interface EditingType {
  typeId: number | null
  typeCode: string
  typeName: string
  deductUnit: number
  sortOrder: number | null
}

const EMPTY_TYPE: EditingType = {
  typeId: null,
  typeCode: '',
  typeName: '',
  deductUnit: 1.0,
  sortOrder: null,
}

const DEDUCT_UNIT_LABEL: Record<string, string> = {
  '1': '종일',
  '0.5': '반차',
  '0.25': '반반차',
}

const deductUnitKey = (v: number) => String(v)

export default function LegalLeaveManageView() {
  const [types, setTypes] = useState<VacationTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; type: EditingType } | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [deactivateConfirm, setDeactivateConfirm] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await vacationApi.getAllTypes()
        if (!aborted) setTypes(res)
      } catch {
        // 서버 미응답 시 빈 상태 유지
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void load()
    return () => { aborted = true }
  }, [])

  const filtered = filter === 'all' ? types
    : filter === 'active' ? types.filter((t) => t.isActive)
    : types.filter((t) => !t.isActive)

  const sorted = [...filtered].sort((a, b) => a.sortOrder - b.sortOrder)

  const openCreate = () => {
    setEditModal({ mode: 'create', type: { ...EMPTY_TYPE } })
  }

  const openEdit = (t: VacationTypeResponse) => {
    setEditModal({
      mode: 'edit',
      type: {
        typeId: t.typeId,
        typeCode: t.typeCode,
        typeName: t.typeName,
        deductUnit: t.deductUnit,
        sortOrder: t.sortOrder,
      },
    })
  }

  const handleSave = async () => {
    if (!editModal) return
    const { mode, type } = editModal
    const payload = {
      typeCode: type.typeCode.trim(),
      typeName: type.typeName.trim(),
      deductUnit: type.deductUnit,
      sortOrder: type.sortOrder,
    }
    setSaving(true)
    try {
      if (mode === 'create') {
        const created = await vacationApi.createType(payload)
        setTypes((prev) => [...prev, created])
      } else if (type.typeId !== null) {
        const updated = await vacationApi.updateType(type.typeId, payload)
        setTypes((prev) => prev.map((t) => (t.typeId === updated.typeId ? updated : t)))
      }
      setEditModal(null)
    } catch (e) {
      const msg = (e as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (msg === 'VACATION_TYPE_SYSTEM_RESERVED') alert('시스템 예약 코드(MONTHLY/ANNUAL)는 사용할 수 없습니다.')
      else if (msg === 'VACATION_TYPE_CODE_DUPLICATE') alert('이미 동일한 코드가 존재합니다.')
      else alert(mode === 'create' ? '유형 추가에 실패했습니다.' : '유형 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (typeId: number) => {
    try {
      await vacationApi.deactivateType(typeId)
      setTypes((prev) => prev.map((t) => (t.typeId === typeId ? { ...t, isActive: false } : t)))
    } catch {
      alert('비활성화에 실패했습니다.')
    }
    setDeactivateConfirm(null)
  }

  const handleActivate = async (typeId: number) => {
    try {
      await vacationApi.activateType(typeId)
      setTypes((prev) => prev.map((t) => (t.typeId === typeId ? { ...t, isActive: true } : t)))
    } catch {
      alert('재활성화에 실패했습니다.')
    }
  }

  const isValid = editModal
    ? editModal.type.typeName.trim() !== ''
      && (editModal.mode === 'edit' || editModal.type.typeCode.trim() !== '')
      && [1.0, 0.5, 0.25].includes(editModal.type.deductUnit)
    : false

  if (loading) {
    return <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">휴가 유형 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">회사에서 사용할 휴가 유형을 등록합니다. 시스템 예약 유형(월차/연차)은 수정·삭제할 수 없습니다.</p>

      {/* 필터 + 추가 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {([['all', '전체'], ['active', '활성'], ['inactive', '비활성']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-1.5 text-[12px] transition-colors ${filter === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {label} ({key === 'all' ? types.length : key === 'active' ? types.filter((t) => t.isActive).length : types.filter((t) => !t.isActive).length})
            </button>
          ))}
        </div>
        <button onClick={openCreate}
          className="px-4 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors">
          + 휴가 유형 추가
        </button>
      </div>

      {/* 테이블 */}
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">코드</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가명</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">차감 단위</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">정렬</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">시스템</th>
          <th className="px-3 py-2.5 text-center text-gray-700 font-medium">상태</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
        </tr></thead>
        <tbody>
          {sorted.map((t) => (
            <tr key={t.typeId} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!t.isActive ? 'opacity-50' : ''}`}>
              <td className="px-3 py-2.5 text-gray-600 font-mono">{t.typeCode}</td>
              <td className="px-3 py-2.5 text-gray-800 font-medium">{t.typeName}</td>
              <td className="px-3 py-2.5 text-center text-gray-600">{DEDUCT_UNIT_LABEL[deductUnitKey(t.deductUnit)] ?? `${t.deductUnit}`}</td>
              <td className="px-3 py-2.5 text-center text-gray-500">{t.sortOrder}</td>
              <td className="px-3 py-2.5 text-center">
                {t.isSystemReserved && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold">시스템 예약</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                {t.isActive ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#E1F5EE] text-[#1D9E75] font-semibold">활성</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">비활성</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right">
                {t.isSystemReserved ? (
                  <span className="text-[11px] text-gray-300">—</span>
                ) : (
                  <>
                    <button onClick={() => openEdit(t)}
                      className="text-[11px] text-[#1D9E75] hover:underline mr-2">수정</button>
                    {t.isActive ? (
                      <button onClick={() => setDeactivateConfirm(t.typeId)}
                        className="text-[11px] text-red-500 hover:underline">비활성화</button>
                    ) : (
                      <button onClick={() => handleActivate(t.typeId)}
                        className="text-[11px] text-[#1D9E75] hover:underline">재활성화</button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-[13px] text-gray-400">등록된 휴가 유형이 없습니다</div>
      )}

      {/* 안내 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <i className="fas fa-info-circle text-blue-400 mt-0.5 text-[12px]" />
          <div className="text-[11px] text-blue-600 space-y-1">
            <p><strong>시스템 예약(월차·연차)</strong>: 모든 회사에 기본 생성되며 수정·삭제할 수 없습니다.</p>
            <p><strong>비활성화</strong>: 기존 잔여는 사용 가능하지만 신규 신청 드롭다운에서는 제외됩니다.</p>
            <p><strong>코드(typeCode)</strong>: 회사 내 유일, 생성 후 변경 불가합니다.</p>
          </div>
        </div>
      </div>

      {/* 비활성화 확인 모달 */}
      {deactivateConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeactivateConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[400px] p-6">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">휴가 유형 비활성화</h3>
            <p className="text-[12px] text-gray-600 mb-1">
              <strong>{types.find((t) => t.typeId === deactivateConfirm)?.typeName}</strong> 유형을 비활성화하시겠습니까?
            </p>
            <p className="text-[11px] text-gray-500 mt-2">기존 잔여는 유지되며, 신규 신청 드롭다운에서만 제외됩니다.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setDeactivateConfirm(null)}
                className="px-4 py-1.5 border border-gray-300 text-gray-600 text-[13px] rounded-md hover:bg-gray-50">취소</button>
              <button onClick={() => handleDeactivate(deactivateConfirm)}
                className="px-4 py-1.5 bg-red-500 text-white text-[13px] rounded-md hover:bg-red-600">비활성화</button>
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
              {/* 코드 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">코드 <span className="text-red-500">*</span></label>
                <input type="text" value={editModal.type.typeCode}
                  onChange={(e) => setEditModal({ ...editModal, type: { ...editModal.type, typeCode: e.target.value.toUpperCase() } })}
                  disabled={editModal.mode === 'edit'}
                  className={`flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] font-mono ${editModal.mode === 'edit' ? 'bg-gray-100 text-gray-500' : ''}`}
                  placeholder="예: MATERNITY, REFRESH" />
              </div>

              {/* 휴가명 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">휴가명 <span className="text-red-500">*</span></label>
                <input type="text" value={editModal.type.typeName}
                  onChange={(e) => setEditModal({ ...editModal, type: { ...editModal.type, typeName: e.target.value } })}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
                  placeholder="예: 출산휴가, 리프레시 휴가" />
              </div>

              {/* 차감 단위 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">차감 단위 <span className="text-red-500">*</span></label>
                <select value={editModal.type.deductUnit}
                  onChange={(e) => setEditModal({ ...editModal, type: { ...editModal.type, deductUnit: Number(e.target.value) } })}
                  className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]">
                  <option value={1}>종일 (1.0)</option>
                  <option value={0.5}>반차 (0.5)</option>
                  <option value={0.25}>반반차 (0.25)</option>
                </select>
              </div>

              {/* 정렬 순서 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">정렬 순서</label>
                <input type="number" value={editModal.type.sortOrder ?? ''}
                  onChange={(e) => setEditModal({ ...editModal, type: { ...editModal.type, sortOrder: e.target.value === '' ? null : Number(e.target.value) } })}
                  className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none w-24 focus:border-[#1D9E75]"
                  placeholder="999" />
                <span className="text-[11px] text-gray-400">작을수록 먼저 표시 (미입력 시 999)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setEditModal(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">취소</button>
              <button onClick={handleSave}
                disabled={!isValid || saving}
                className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${isValid && !saving ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {saving ? '처리 중...' : editModal.mode === 'create' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
