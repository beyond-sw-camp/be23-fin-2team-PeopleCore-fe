import { useEffect, useState } from 'react'
import {
  vacationApi,
  type VacationGrantBasisType,
  type VacationRuleRes,
} from '../../../../api/vacation'

interface EditingRule {
  id: number | null
  minYears: number
  maxYears: number | null
  days: number
  desc: string
}

const EMPTY_RULE: EditingRule = { id: null, minYears: 0, maxYears: null, days: 1, desc: '' }
const DEFAULT_FISCAL_START = '01-01'

const isValidMmDd = (s: string): boolean => {
  if (!/^\d{2}-\d{2}$/.test(s)) return false
  const [mm, dd] = s.split('-').map(Number)
  if (mm < 1 || mm > 12) return false
  if (dd < 1 || dd > 31) return false
  return true
}

export default function LeaveRuleView() {
  const [grantBasis, setGrantBasis] = useState<VacationGrantBasisType>('HIRE')
  const [fiscalYearStart, setFiscalYearStart] = useState<string>(DEFAULT_FISCAL_START)
  const [rules, setRules] = useState<VacationRuleRes[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<{ mode: 'create' | 'edit'; rule: EditingRule } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [noLimit, setNoLimit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingBasis, setSavingBasis] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      try {
        const [basisRes, rulesRes] = await Promise.all([
          vacationApi.getGrantBasis(),
          vacationApi.getRules(),
        ])
        if (!aborted) {
          setGrantBasis(basisRes.grantBasis)
          if (basisRes.fiscalYearStart) setFiscalYearStart(basisRes.fiscalYearStart)
          setRules(rulesRes)
        }
      } catch {
        // 서버 미응답 시 기본값 유지
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void load()
    return () => { aborted = true }
  }, [])

  const saveGrantBasis = async (nextBasis: VacationGrantBasisType, nextFiscal: string) => {
    // 변경 없으면 저장 스킵 (label+radio 중복 호출 가드)
    if (nextBasis === grantBasis && (nextBasis === 'HIRE' || nextFiscal === fiscalYearStart)) return
    if (savingBasis) return

    if (nextBasis === 'FISCAL' && !isValidMmDd(nextFiscal)) {
      alert('회계연도 시작일은 mm-dd 형식이어야 합니다. (예: 01-01)')
      return
    }
    const prevBasis = grantBasis
    const prevFiscal = fiscalYearStart
    setGrantBasis(nextBasis)
    if (nextBasis === 'FISCAL') setFiscalYearStart(nextFiscal)
    setSavingBasis(true)
    try {
      // HIRE면 fiscalYearStart 필드 생략, FISCAL이면 mm-dd 전송
      const payload = nextBasis === 'FISCAL'
        ? { grantBasis: nextBasis, fiscalYearStart: nextFiscal }
        : { grantBasis: nextBasis, fiscalYearStart: null }
      const res = await vacationApi.updateGrantBasis(payload)
      setGrantBasis(res.grantBasis)
      if (res.fiscalYearStart) setFiscalYearStart(res.fiscalYearStart)
    } catch {
      setGrantBasis(prevBasis)
      setFiscalYearStart(prevFiscal)
      alert('지급 기준 변경에 실패했습니다.')
    } finally {
      setSavingBasis(false)
    }
  }

  const handleBasisRadio = (v: VacationGrantBasisType) => {
    if (v === grantBasis) return
    void saveGrantBasis(v, v === 'FISCAL' ? fiscalYearStart : DEFAULT_FISCAL_START)
  }

  const handleFiscalChange = (v: string) => {
    setFiscalYearStart(v)
  }

  const handleFiscalBlur = () => {
    if (grantBasis !== 'FISCAL') return
    if (!isValidMmDd(fiscalYearStart)) return
    void saveGrantBasis('FISCAL', fiscalYearStart)
  }

  const sorted = [...rules].sort((a, b) => a.minYears - b.minYears)

  const openCreateModal = () => {
    setNoLimit(false)
    setEditModal({ mode: 'create', rule: { ...EMPTY_RULE } })
  }

  const openEditModal = (rule: VacationRuleRes) => {
    setNoLimit(rule.maxYears === null)
    setEditModal({
      mode: 'edit',
      rule: { id: rule.id, minYears: rule.minYears, maxYears: rule.maxYears, days: rule.days, desc: rule.desc ?? '' },
    })
  }

  const handleSave = async () => {
    if (!editModal) return
    const { rule, mode } = editModal
    const payload = {
      minYears: rule.minYears,
      maxYears: noLimit ? null : rule.maxYears,
      days: rule.days,
      desc: rule.desc.trim() === '' ? null : rule.desc.trim(),
    }
    setSaving(true)
    try {
      if (mode === 'create') {
        const created = await vacationApi.createRule(payload)
        setRules((prev) => [...prev, created])
      } else {
        const updated = await vacationApi.updateRule(rule.id!, payload)
        setRules((prev) => prev.map((r) => r.id === updated.id ? updated : r))
      }
      setEditModal(null)
    } catch {
      alert(mode === 'create' ? '규칙 추가에 실패했습니다.' : '규칙 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await vacationApi.deleteRule(id)
      setRules((prev) => prev.filter((r) => r.id !== id))
    } catch {
      alert('규칙 삭제에 실패했습니다.')
    }
    setDeleteConfirm(null)
  }

  const isValid = editModal
    ? editModal.rule.days > 0 && (noLimit || (editModal.rule.maxYears !== null && editModal.rule.maxYears > editModal.rule.minYears))
    : false

  if (loading) {
    return <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 발생 규칙 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">연차 지급 기준과 근속연수별 발생일수 규칙을 정의합니다</p>

      {/* ── 지급 기준 선택 ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[13px] font-semibold text-gray-800">연차 지급 기준</h4>
          {savingBasis && <span className="text-[11px] text-gray-400">저장 중...</span>}
        </div>
        <div className="flex gap-4">
          <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors ${grantBasis === 'HIRE' ? 'border-[#1D9E75] bg-[#E1F5EE]' : 'border-gray-200 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <input type="radio" name="grantBasis" checked={grantBasis === 'HIRE'} onChange={() => handleBasisRadio('HIRE')}
                className="accent-[#1D9E75]" />
              <span className="text-[13px] font-medium text-gray-800">입사일 기준</span>
            </div>
            <p className="text-[11px] text-gray-500 ml-5">각 직원의 입사일로부터 1년 단위로 연차가 발생합니다. 직원마다 연차 기간이 다릅니다.</p>
          </label>
          <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors ${grantBasis === 'FISCAL' ? 'border-[#1D9E75] bg-[#E1F5EE]' : 'border-gray-200 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <input type="radio" name="grantBasis" checked={grantBasis === 'FISCAL'} onChange={() => handleBasisRadio('FISCAL')}
                className="accent-[#1D9E75]" />
              <span className="text-[13px] font-medium text-gray-800">회계연도 기준</span>
            </div>
            <p className="text-[11px] text-gray-500 ml-5">회계연도 시작일 기준으로 전 직원에게 일괄 연차가 부여됩니다.</p>
          </label>
        </div>

        {/* 회계연도 시작일 입력 */}
        {grantBasis === 'FISCAL' && (
          <div className="mt-4 flex items-center gap-3 pl-1">
            <span className="text-[12px] text-gray-700 font-medium">회계연도 시작일 <span className="text-red-500">*</span></span>
            <input
              type="text"
              value={fiscalYearStart}
              onChange={(e) => handleFiscalChange(e.target.value)}
              onBlur={handleFiscalBlur}
              placeholder="01-01"
              maxLength={5}
              className={`border rounded px-2 py-1 text-[12px] outline-none w-24 focus:border-[#1D9E75] ${
                isValidMmDd(fiscalYearStart) ? 'border-gray-300' : 'border-red-300'
              }`}
            />
            <span className="text-[11px] text-gray-400">mm-dd 형식 (예: 01-01)</span>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openCreateModal}
          className="px-4 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors">
          + 규칙 추가
        </button>
      </div>

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근속연수 (이상)</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근속연수 (미만)</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">발생 연차</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">비고</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
        </tr></thead>
        <tbody>
          {sorted.map((r, idx) => (
            <tr key={r.id ?? `tmp-${idx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800">{r.minYears}년</td>
              <td className="px-3 py-2.5 text-gray-600">{r.maxYears !== null ? `${r.maxYears}년` : '무제한'}</td>
              <td className="px-3 py-2.5 text-right text-[#1D9E75] font-semibold">{r.days}일</td>
              <td className="px-3 py-2.5 text-gray-500">{r.desc ?? ''}</td>
              <td className="px-3 py-2.5 text-right">
                <button onClick={() => openEditModal(r)}
                  className="text-[11px] text-[#1D9E75] hover:underline mr-2">수정</button>
                <button onClick={() => r.id != null && setDeleteConfirm(r.id)}
                  className="text-[11px] text-red-500 hover:underline">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rules.length === 0 && (
        <div className="text-center py-12 text-[13px] text-gray-400">등록된 연차 발생 규칙이 없습니다</div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[400px] p-6">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">규칙 삭제</h3>
            <p className="text-[12px] text-gray-600 mb-1">
              근속연수 <strong>{rules.find((r) => r.id === deleteConfirm)?.minYears}년 ~ {
                rules.find((r) => r.id === deleteConfirm)?.maxYears !== null
                  ? `${rules.find((r) => r.id === deleteConfirm)?.maxYears}년`
                  : '무제한'
              }</strong> 규칙을 삭제하시겠습니까?
            </p>
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
                {editModal.mode === 'create' ? '연차 발생 규칙 추가' : '연차 발생 규칙 수정'}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 근속연수 (이상) */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-28 shrink-0 font-medium">근속연수 (이상) <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" value={editModal.rule.minYears}
                    onChange={(e) => setEditModal({ ...editModal, rule: { ...editModal.rule, minYears: Number(e.target.value) } })}
                    className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none w-20 focus:border-[#1D9E75]" min={0} />
                  <span className="text-[12px] text-gray-500">년</span>
                </div>
              </div>

              {/* 근속연수 (미만) */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-28 shrink-0 font-medium">근속연수 (미만) <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" value={editModal.rule.maxYears ?? ''}
                    onChange={(e) => setEditModal({ ...editModal, rule: { ...editModal.rule, maxYears: e.target.value ? Number(e.target.value) : null } })}
                    className={`border border-gray-300 rounded px-3 py-2 text-[12px] outline-none w-20 focus:border-[#1D9E75] ${noLimit ? 'bg-gray-100 text-gray-400' : ''}`}
                    min={0} disabled={noLimit} />
                  <span className="text-[12px] text-gray-500">년</span>
                  <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer ml-2">
                    <input type="checkbox" checked={noLimit}
                      onChange={(e) => {
                        setNoLimit(e.target.checked)
                        if (e.target.checked) {
                          setEditModal({ ...editModal, rule: { ...editModal.rule, maxYears: null } })
                        }
                      }}
                      className="accent-[#1D9E75]" />
                    무제한
                  </label>
                </div>
              </div>

              {/* 발생 연차 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-28 shrink-0 font-medium">발생 연차 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" value={editModal.rule.days}
                    onChange={(e) => setEditModal({ ...editModal, rule: { ...editModal.rule, days: Number(e.target.value) } })}
                    className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none w-20 focus:border-[#1D9E75]" min={1} />
                  <span className="text-[12px] text-gray-500">일</span>
                </div>
              </div>

              {/* 비고 */}
              <div className="flex items-center gap-4">
                <label className="text-[12px] text-gray-700 w-28 shrink-0 font-medium">비고</label>
                <input type="text" value={editModal.rule.desc}
                  onChange={(e) => setEditModal({ ...editModal, rule: { ...editModal.rule, desc: e.target.value } })}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
                  placeholder="예: 월 1일 (월차)" />
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
