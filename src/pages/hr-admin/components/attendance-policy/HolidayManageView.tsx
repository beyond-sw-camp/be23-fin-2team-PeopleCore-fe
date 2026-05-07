import { useEffect, useState } from 'react'
import {
  holidayApi,
  type HolidayRes,
  type HolidayTypeFilter,
} from '../../../../api/holiday'
import { useAuth } from '../../../../contexts/AuthContext'

interface EditingHoliday {
  id: number | null
  date: string
  holidayName: string
  isRepeating: boolean
}

const EMPTY_HOLIDAY: EditingHoliday = {
  id: null,
  date: '',
  holidayName: '',
  isRepeating: false,
}

const TYPE_OPTIONS: { value: HolidayTypeFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'NATIONAL', label: '법정공휴일' },
  { value: 'COMPANY', label: '사내 휴일' },
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1]

export default function HolidayManageView() {
  const { isHRSuperAdmin } = useAuth()
  const [year, setYear] = useState<number>(currentYear)
  const [typeFilter, setTypeFilter] = useState<HolidayTypeFilter>('ALL')
  const [holidays, setHolidays] = useState<HolidayRes[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; rule: EditingHoliday } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<HolidayRes | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await holidayApi.list(year, typeFilter)
        if (!aborted) setHolidays(res)
      } catch {
        if (!aborted) setHolidays([])
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void load()
    return () => {
      aborted = true
    }
  }, [year, typeFilter])

  const reload = async () => {
    try {
      const res = await holidayApi.list(year, typeFilter)
      setHolidays(res)
    } catch {
      // 무시 - 직전 상태 유지
    }
  }

  const openCreateModal = () => {
    const today = new Date()
    const defaultDate = `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setEditModal({ mode: 'create', rule: { ...EMPTY_HOLIDAY, date: defaultDate } })
  }

  const openEditModal = (h: HolidayRes) => {
    setEditModal({
      mode: 'edit',
      rule: {
        id: h.holidayId,
        date: h.date,
        holidayName: h.holidayName,
        isRepeating: h.isRepeating,
      },
    })
  }

  const handleSave = async () => {
    if (!editModal) return
    const { rule, mode } = editModal
    if (!rule.date || rule.holidayName.trim() === '') return

    const payload = {
      date: rule.date,
      holidayName: rule.holidayName.trim(),
      isRepeating: rule.isRepeating,
    }
    setSaving(true)
    try {
      if (mode === 'create') {
        await holidayApi.create(payload)
      } else if (rule.id != null) {
        await holidayApi.update(rule.id, payload)
      }
      await reload()
      setEditModal(null)
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { code?: string; message?: string } } }
      const code = err?.response?.data?.code
      if (err?.response?.status === 403) {
        alert(code === 'HOLIDAY_NOT_COMPANY'
          ? '법정공휴일은 수정할 수 없습니다.'
          : code === 'HOLIDAY_ACCESS_DENIED'
          ? '다른 회사의 휴일은 변경할 수 없습니다.'
          : '사내 휴일 변경은 HR_SUPER_ADMIN만 가능합니다.')
      } else if (err?.response?.status === 409 || code === 'HOLIDAY_DUPLICATED') {
        alert('이미 등록된 날짜의 휴일입니다.')
      } else {
        alert(mode === 'create' ? '휴일 추가에 실패했습니다.' : '휴일 수정에 실패했습니다.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (h: HolidayRes) => {
    try {
      await holidayApi.delete(h.holidayId)
      setHolidays((prev) => prev.filter((x) => x.holidayId !== h.holidayId))
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { code?: string } } }
      const code = err?.response?.data?.code
      if (code === 'HOLIDAY_NOT_COMPANY') alert('법정공휴일은 삭제할 수 없습니다.')
      else if (code === 'HOLIDAY_ACCESS_DENIED') alert('다른 회사의 휴일은 삭제할 수 없습니다.')
      else if (err?.response?.status === 403) alert('삭제 권한이 없습니다. (HR_SUPER_ADMIN 전용)')
      else alert('휴일 삭제에 실패했습니다.')
    }
    setDeleteConfirm(null)
  }

  const isValid = editModal
    ? editModal.rule.date.trim() !== '' && editModal.rule.holidayName.trim() !== ''
    : false

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">사내 휴일 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">
        법정공휴일과 회사 자체 휴일을 관리합니다. 휴일은 출퇴근 판정과 연차 영업일 계산에 반영됩니다. 법정공휴일은 시스템에서 관리하며 수정/삭제할 수 없습니다.
      </p>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-gray-700 font-medium">연도</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-gray-700 font-medium">구분</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as HolidayTypeFilter)}
            className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        {isHRSuperAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors"
          >
            + 사내 휴일 추가
          </button>
        )}
      </div>

      {/* 표 */}
      {loading ? (
        <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
      ) : (
        <>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium w-32">날짜</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴일명</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium w-28">구분</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium w-24">반복</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium w-32">관리</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => {
                const isCompany = h.holidayType === 'COMPANY'
                return (
                  <tr key={h.holidayId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-800">{h.occurrenceDate}</td>
                    <td className="px-3 py-2.5 text-gray-800">{h.holidayName}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                          isCompany
                            ? 'bg-[#E1F5EE] text-[#1D9E75]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isCompany ? '사내 휴일' : '법정공휴일'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{h.isRepeating ? '매년 반복' : '1회성'}</td>
                    <td className="px-3 py-2.5 text-right">
                      {isHRSuperAdmin && isCompany ? (
                        <>
                          <button
                            onClick={() => openEditModal(h)}
                            className="text-[11px] text-[#1D9E75] hover:underline mr-2"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(h)}
                            className="text-[11px] text-red-500 hover:underline"
                          >
                            삭제
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {holidays.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">
              해당 연도/구분에 등록된 휴일이 없습니다
            </div>
          )}
        </>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(420px,calc(100vw-24px))] p-6">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">사내 휴일 삭제</h3>
            <p className="text-[12px] text-gray-600 mb-1">
              <strong>{deleteConfirm.occurrenceDate} {deleteConfirm.holidayName}</strong> 휴일을 삭제하시겠습니까?
            </p>
            {deleteConfirm.isRepeating && (
              <p className="text-[11px] text-amber-600 mt-1">매년 반복 휴일이라 모든 연도에서 사라집니다.</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-1.5 border border-gray-300 text-gray-600 text-[13px] rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-1.5 bg-red-500 text-white text-[13px] rounded-md hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(480px,calc(100vw-24px))] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[16px] font-bold text-gray-900">
                {editModal.mode === 'create' ? '사내 휴일 추가' : '사내 휴일 수정'}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">
                  날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editModal.rule.date}
                  onChange={(e) =>
                    setEditModal({ ...editModal, rule: { ...editModal.rule, date: e.target.value } })
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">
                  휴일명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editModal.rule.holidayName}
                  onChange={(e) =>
                    setEditModal({ ...editModal, rule: { ...editModal.rule, holidayName: e.target.value } })
                  }
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
                  placeholder="예: 창립기념일"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">매년 반복</label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.rule.isRepeating}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        rule: { ...editModal.rule, isRepeating: e.target.checked },
                      })
                    }
                    className="accent-[#1D9E75]"
                  />
                  <span className="text-[12px] text-gray-600">
                    체크 시 매년 같은 월/일에 자동 적용됩니다 (예: 매년 5/15 창립기념일)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setEditModal(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${
                  isValid && !saving
                    ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? '처리 중...' : editModal.mode === 'create' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
