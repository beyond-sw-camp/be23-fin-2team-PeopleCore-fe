import { useState, useEffect } from 'react'
import { paySettingsApi, payItemsApi, insuranceApi, retirementApi, taxTableApi } from '../../../api/payAdmin'
import type { PayItemRes, BankRes, InsuranceRatesRes, InsuranceJobTypesRes, PensionType, TaxWithholdingRowRes } from '../../../api/payAdmin'

type SalaryPolicyView = 'pay-items' | 'deduct-items' | 'insurance-rates' | 'pay-day' | 'legal-allowance' | 'retirement-pension' | 'tax-table'

const MENUS: { key: SalaryPolicyView; label: string }[] = [
  { key: 'pay-day', label: '급여지급 설정' },
  { key: 'pay-items', label: '지급항목 관리' },
  { key: 'deduct-items', label: '공제항목 관리' },
  { key: 'legal-allowance', label: '법정수당 산정' },
  { key: 'insurance-rates', label: '사회보험 요율표' },
  { key: 'tax-table', label: '간이세액표 확인' },
  { key: 'retirement-pension', label: '퇴직연금 설정' },
]


// ── 급여지급일 설정 ──
function PayDayView() {
  const [payMonth, setPayMonth] = useState<'CURRENT' | 'NEXT'>('NEXT')
  const [payDay, setPayDay] = useState<number>(25)
  const [isLastDay, setIsLastDay] = useState(false)
  const [mainBankCode, setMainBankCode] = useState('')
  const [banks, setBanks] = useState<BankRes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([paySettingsApi.getBanks(), paySettingsApi.getSettings()])
      .then(([bankList, settings]) => {
        setBanks(bankList)
        setPayMonth(settings.salaryPayMonth)
        setPayDay(settings.salaryPayDay ?? 25)
        setIsLastDay(settings.salaryPayLastDay)
        setMainBankCode(settings.mainBankCode)
      })
      .catch(() => {/* 백엔드 미연결 시 기본값 유지 */})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      await paySettingsApi.updateSettings({
        salaryPayMonth: payMonth,
        salaryPayDay: isLastDay ? null : payDay,
        salaryPayLastDay: isLastDay,
        mainBankCode,
      })
      alert('저장되었습니다.')
    } catch {
      alert('저장에 실패했습니다.')
    }
  }

  if (loading) return <div className="text-xs text-gray-400 py-10 text-center">불러오는 중...</div>

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">급여지급 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">급여 지급일과 이체 은행을 설정합니다</p>

      {/* 급여지급일 */}
      <div className="border border-gray-200 rounded-lg p-4 mb-5">
        <h4 className="text-[13px] font-medium text-gray-800 mb-3">급여지급일</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-gray-600 w-28 text-[12px]">지급 기준</span>
            <select value={payMonth} onChange={e => setPayMonth(e.target.value as 'CURRENT' | 'NEXT')} className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none">
              <option value="CURRENT">당월</option>
              <option value="NEXT">익월</option>
            </select>
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-gray-600 w-28 text-[12px]">지급일</span>
            <input type="number" min={1} max={31} value={isLastDay ? '' : payDay} onChange={e => setPayDay(Number(e.target.value))} disabled={isLastDay} placeholder="말일" className={`text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-16 text-right ${isLastDay ? 'bg-gray-100 text-gray-400' : ''}`} />
            <span className="text-[12px] text-gray-600">일</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={isLastDay} onChange={e => setIsLastDay(e.target.checked)} className="w-3.5 h-3.5 accent-[#1D9E75]" />
              <span className="text-[12px] text-gray-600">말일</span>
            </label>
          </div>
        </div>
      </div>

      {/* 대량이체 파일 설정 */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-[13px] font-medium text-gray-800 mb-3">대량이체 파일 설정</h4>
        <p className="text-[11px] text-gray-400 mb-4">급여대장에서 대량이체 파일 생성 시 사용할 은행을 선택합니다.</p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-[12px]">
            <span className="text-gray-600 w-28 shrink-0">주거래 은행</span>
            <select value={mainBankCode} onChange={e => setMainBankCode(e.target.value)} className="w-40 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]">
              <option value="">선택</option>
              {banks.map(b => <option key={b.bankCode} value={b.bankCode}>{b.bankName}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 rounded-lg p-3 text-[11px] text-blue-700 space-y-1">
        <p>• 급여대장에서 "대량이체 파일" 다운로드 시, 여기서 설정한 은행 형식으로 파일이 생성됩니다.</p>
        <p>• 은행별 대량이체 파일 형식은 백엔드에서 자동 생성됩니다.</p>
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={handleSave} className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
      </div>
    </div>
  )
}

// ── 삭제 확인 모달 ──
function DeleteConfirmModal({ names, onConfirm, onClose }: { names: string[]; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(360px,calc(100vw-24px))] p-6 text-center">
        <p className="text-sm text-gray-800 mb-1 font-medium">
          {names.length === 1 ? `'${names[0]}'` : `'${names[0]}' 외 ${names.length - 1}건`}을 삭제하시겠습니까?
        </p>
        <p className="text-xs text-gray-400 mb-5">삭제된 항목은 복구할 수 없습니다.</p>
        <div className="flex justify-center gap-2">
          <button onClick={onConfirm} className="px-5 py-2 text-[13px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">삭제</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 지급항목 등록 모달 ──
type PayItemCategoryType = 'SALARY' | 'ALLOWANCE' | 'BONUS' | 'INSURANCE' | 'TAX' | 'OTHER_DEDUCTION'
const PAY_CATEGORY_LABELS: Record<PayItemCategoryType, string> = {
  SALARY: '급여', ALLOWANCE: '수당', BONUS: '상여', INSURANCE: '4대보험', TAX: '세금', OTHER_DEDUCTION: '기타공제',
}
const PAYMENT_CATEGORIES: PayItemCategoryType[] = ['SALARY', 'ALLOWANCE', 'BONUS']
const DEDUCTION_CATEGORIES: PayItemCategoryType[] = ['INSURANCE', 'TAX', 'OTHER_DEDUCTION']
interface PayItemForm { name: string; isFixed: boolean; taxFree: boolean; taxFreeLimit: number; category: PayItemCategoryType }

function PayItemModal({ onClose, onSave, initialData, title, categories, protectedMode }: { onClose: () => void; onSave: (item: PayItemForm) => void; initialData?: PayItemForm; title?: string; categories?: PayItemCategoryType[]; protectedMode?: boolean }) {
  const availableCategories = categories || PAYMENT_CATEGORIES
  const [form, setForm] = useState<PayItemForm>(initialData || { name: '', isFixed: false, taxFree: false, taxFreeLimit: 0, category: 'SALARY' })
  const fmtComma = (n: number) => n.toLocaleString()
  const parseNum = (s: string) => Number(s.replace(/,/g, '').replace(/[^0-9]/g, '')) || 0
  const lockedCls = 'bg-gray-100 text-gray-400 cursor-not-allowed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(440px,calc(100vw-24px))]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">{title || '지급항목 등록'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {protectedMode && (
          <div className="px-6 pt-4 -mb-1 text-[11px] text-gray-500">
            <i className="fas fa-info-circle mr-1" />필수 항목입니다. 비과세한도만 변경할 수 있습니다.
          </div>
        )}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-20 shrink-0">항목명 <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="항목명을 입력하세요" disabled={protectedMode} className={`flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75] ${protectedMode ? lockedCls : ''}`} autoFocus={!protectedMode} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-20 shrink-0">카테고리 <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value as PayItemCategoryType }))} disabled={protectedMode} className={`flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75] ${protectedMode ? lockedCls : ''}`}>
              {availableCategories.map(k => <option key={k} value={k}>{PAY_CATEGORY_LABELS[k]}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-20 shrink-0">고정수당</label>
            <label className={`flex items-center gap-1.5 ${protectedMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={form.isFixed} onChange={e => setForm(prev => ({ ...prev, isFixed: e.target.checked }))} disabled={protectedMode} className="w-3.5 h-3.5 accent-[#1D9E75] disabled:opacity-40" />
              <span className={`text-[12px] ${protectedMode ? 'text-gray-400' : 'text-gray-700'}`}>매월 고정 지급</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-20 shrink-0">비과세</label>
            <label className={`flex items-center gap-1.5 ${protectedMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={form.taxFree} onChange={e => setForm(prev => ({ ...prev, taxFree: e.target.checked }))} disabled={protectedMode} className="w-3.5 h-3.5 accent-[#1D9E75] disabled:opacity-40" />
              <span className={`text-[12px] ${protectedMode ? 'text-gray-400' : 'text-gray-700'}`}>비과세 항목</span>
            </label>
          </div>
          {(form.taxFree || protectedMode) && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-gray-500 w-20 shrink-0">비과세한도</label>
              <input type="text" value={fmtComma(form.taxFreeLimit)} onChange={e => setForm(prev => ({ ...prev, taxFreeLimit: parseNum(e.target.value) }))} className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75] text-right" autoFocus={protectedMode} />
              <span className="text-[12px] text-gray-500">원</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => { if (form.name.trim()) onSave(form) }} disabled={!form.name.trim()} className="px-5 py-2 text-[13px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed">{initialData ? '저장' : '등록'}</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 지급항목 관리 ──
function PayItemsView() {
  const [items, setItems] = useState<PayItemRes[]>([])
  const [searchName, setSearchName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PayItemRes | null>(null)
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const fetchItems = (name?: string) => {
    payItemsApi.getList('PAYMENT', name || undefined, false).then(setItems).catch(() => {})
  }
  useEffect(() => { fetchItems() }, [])

  const toggle = (id: number) => {
    payItemsApi.toggleActive(id).then(updated => {
      setItems(prev => prev.map(i => i.payItemId === updated.payItemId ? updated : i))
    }).catch(() => {})
  }
  const toggleCheck = (id: number) => setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAllCheck = () => { if (checkedIds.length === items.length) setCheckedIds([]); else setCheckedIds(items.map(i => i.payItemId)) }
  const addItem = (form: PayItemForm) => {
    payItemsApi.create({
      payItemName: form.name, payItemType: 'PAYMENT', isFixed: form.isFixed,
      isTaxable: !form.taxFree, taxExemptLimit: form.taxFreeLimit, payItemCategory: form.category,
    }).then(() => { fetchItems(); setModalOpen(false) }).catch(() => alert('등록 실패'))
  }
  const updateItem = (form: PayItemForm) => {
    if (!editingItem) return
    payItemsApi.update(editingItem.payItemId, {
      payItemName: form.name, payItemType: 'PAYMENT', isFixed: form.isFixed,
      isTaxable: !form.taxFree, taxExemptLimit: form.taxFreeLimit, payItemCategory: form.category,
    }).then(() => { fetchItems(); setEditingItem(null) }).catch(() => alert('수정 실패'))
  }
  const handleDelete = () => {
    payItemsApi.deleteItems(checkedIds)
      .then(() => { fetchItems(); setCheckedIds([]); setDeleteConfirm(false); alert('삭제되었습니다.') })
      .catch((err) => {
        setDeleteConfirm(false)
        const msg = err.response?.data?.message || '삭제 실패'
        alert(msg)
      })
  }
  const checkedNames = items.filter(i => checkedIds.includes(i.payItemId)).map(i => i.payItemName)

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">지급항목 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">급여 명세서에 표시될 지급 항목을 등록하고 관리합니다</p>

      <div className="flex items-center gap-2 mb-4">
        <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="항목명을 입력하세요.." className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-48" />
        <button onClick={() => fetchItems(searchName)} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">조회</button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setModalOpen(true)} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">+ 등록</button>
        <button onClick={() => checkedIds.length > 0 ? setDeleteConfirm(true) : alert('삭제할 항목을 선택해주세요.')} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50 text-red-500">삭제</button>
      </div>

      {modalOpen && <PayItemModal onClose={() => setModalOpen(false)} onSave={addItem} />}
      {editingItem && <PayItemModal title="지급항목 수정" initialData={{ name: editingItem.payItemName, isFixed: editingItem.isFixed, taxFree: !editingItem.isTaxable, taxFreeLimit: editingItem.taxExemptLimit, category: (editingItem.payItemCategory as PayItemCategoryType) || 'SALARY' }} onClose={() => setEditingItem(null)} onSave={updateItem} protectedMode={!!editingItem.isProtect} />}
      {deleteConfirm && <DeleteConfirmModal names={checkedNames} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={checkedIds.length === items.length && items.length > 0} onChange={toggleAllCheck} /></th>
          <th className="px-3 py-2.5 text-left font-medium text-gray-700">항목명</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">카테고리</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">고정수당</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">비과세</th>
          <th className="px-3 py-2.5 text-right font-medium text-gray-700">비과세한도</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">사용여부</th>
        </tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.payItemId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5">
                <input
                  type="checkbox"
                  className="w-3 h-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  checked={!item.isProtect && checkedIds.includes(item.payItemId)}
                  onChange={() => toggleCheck(item.payItemId)}
                  disabled={item.isProtect}
                  title={item.isProtect ? '필수 항목은 삭제할 수 없습니다' : undefined}
                />
              </td>
              <td className="px-3 py-2.5 text-gray-800">
                <span className="inline-flex items-center gap-1.5">
                  <span className="cursor-pointer hover:text-[#1D9E75] hover:underline" onClick={() => setEditingItem(item)}>{item.payItemName}</span>
                  {item.isProtect && <span className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5">필수</span>}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center text-gray-500 text-[11px]">{PAY_CATEGORY_LABELS[item.payItemCategory as PayItemCategoryType] || item.payItemCategory}</td>
              <td className="px-3 py-2.5 text-center">{item.isFixed ? '●' : ''}</td>
              <td className="px-3 py-2.5 text-center">{!item.isTaxable ? '●' : ''}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{item.taxExemptLimit.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-center">
                <button
                  onClick={() => !item.isProtect && toggle(item.payItemId)}
                  disabled={item.isProtect}
                  title={item.isProtect ? '필수 항목은 사용유무를 변경할 수 없습니다' : undefined}
                  className={`w-10 h-5 rounded-full transition-colors relative ${item.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'} ${item.isProtect ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${item.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 공제항목 등록 모달 ──
function DeductItemModal({ onClose, onSave, title, initialName, initialCategory }: { onClose: () => void; onSave: (name: string, category: PayItemCategoryType) => void; title?: string; initialName?: string; initialCategory?: PayItemCategoryType }) {
  const [name, setName] = useState(initialName || '')
  const [category, setCategory] = useState<PayItemCategoryType>(initialCategory || 'INSURANCE')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(380px,calc(100vw-24px))]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">{title || '공제항목 등록'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-16 shrink-0">항목명 <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="공제항목명을 입력하세요" className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]" autoFocus />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-16 shrink-0">카테고리 <span className="text-red-500">*</span></label>
            <select value={category} onChange={e => setCategory(e.target.value as PayItemCategoryType)} className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]">
              {DEDUCTION_CATEGORIES.map(k => <option key={k} value={k}>{PAY_CATEGORY_LABELS[k]}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => { if (name.trim()) onSave(name.trim(), category) }} disabled={!name.trim()} className="px-5 py-2 text-[13px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed">{initialName ? '저장' : '등록'}</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 공제항목 관리 ──
function DeductItemsView() {
  const [items, setItems] = useState<PayItemRes[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PayItemRes | null>(null)
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const fetchItems = () => {
    payItemsApi.getList('DEDUCTION', undefined, false).then(setItems).catch(() => {})
  }
  useEffect(() => { fetchItems() }, [])

  const toggle = (id: number) => {
    payItemsApi.toggleActive(id).then(updated => {
      setItems(prev => prev.map(i => i.payItemId === updated.payItemId ? updated : i))
    }).catch(() => {})
  }
  const toggleCheck = (id: number) => setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAllCheck = () => { if (checkedIds.length === items.length) setCheckedIds([]); else setCheckedIds(items.map(i => i.payItemId)) }
  const addItem = (name: string, category: PayItemCategoryType) => {
    payItemsApi.create({ payItemName: name, payItemType: 'DEDUCTION', payItemCategory: category })
      .then(() => { fetchItems(); setModalOpen(false) }).catch(() => alert('등록 실패'))
  }
  const updateItem = (name: string, category: PayItemCategoryType) => {
    if (!editingItem) return
    payItemsApi.update(editingItem.payItemId, { payItemName: name, payItemType: 'DEDUCTION', payItemCategory: category })
      .then(() => { fetchItems(); setEditingItem(null) }).catch(() => alert('수정 실패'))
  }
  const handleDelete = () => {
    payItemsApi.deleteItems(checkedIds)
      .then(() => { fetchItems(); setCheckedIds([]); setDeleteConfirm(false); alert('삭제되었습니다.') })
      .catch((err) => {
        setDeleteConfirm(false)
        const msg = err.response?.data?.message || '삭제 실패'
        alert(msg)
      })
  }
  const checkedNames = items.filter(i => checkedIds.includes(i.payItemId)).map(i => i.payItemName)

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">공제항목 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">급여에서 공제되는 항목을 관리합니다</p>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setModalOpen(true)} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">+ 등록</button>
        <button onClick={() => checkedIds.length > 0 ? setDeleteConfirm(true) : alert('삭제할 항목을 선택해주세요.')} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50 text-red-500">삭제</button>
      </div>

      {modalOpen && <DeductItemModal onClose={() => setModalOpen(false)} onSave={addItem} />}
      {editingItem && <DeductItemModal title="공제항목 수정" initialName={editingItem.payItemName} initialCategory={(editingItem.payItemCategory as PayItemCategoryType) || 'INSURANCE'} onClose={() => setEditingItem(null)} onSave={updateItem} />}
      {deleteConfirm && <DeleteConfirmModal names={checkedNames} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={checkedIds.length === items.length && items.length > 0} onChange={toggleAllCheck} /></th>
          <th className="px-3 py-2.5 text-left font-medium text-gray-700">항목명</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">카테고리</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">사용여부</th>
        </tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.payItemId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5">
                <input
                  type="checkbox"
                  className="w-3 h-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  checked={!item.isProtect && checkedIds.includes(item.payItemId)}
                  onChange={() => toggleCheck(item.payItemId)}
                  disabled={item.isProtect}
                  title={item.isProtect ? '필수 항목은 삭제할 수 없습니다' : undefined}
                />
              </td>
              <td className="px-3 py-2.5 text-gray-800">
                <span className="inline-flex items-center gap-1.5">
                  {item.isProtect ? (
                    <span className="text-gray-400">{item.payItemName}</span>
                  ) : (
                    <span className="cursor-pointer hover:text-[#1D9E75] hover:underline" onClick={() => setEditingItem(item)}>{item.payItemName}</span>
                  )}
                  {item.isProtect && <span className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5">필수</span>}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center text-gray-500 text-[11px]">{PAY_CATEGORY_LABELS[item.payItemCategory as PayItemCategoryType] || item.payItemCategory}</td>
              <td className="px-3 py-2.5 text-center">
                <button
                  onClick={() => !item.isProtect && toggle(item.payItemId)}
                  disabled={item.isProtect}
                  title={item.isProtect ? '필수 항목은 사용유무를 변경할 수 없습니다' : undefined}
                  className={`w-10 h-5 rounded-full transition-colors relative ${item.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'} ${item.isProtect ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${item.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 사회보험 요율표 ──
function InsuranceRatesView() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [rates, setRates] = useState<InsuranceRatesRes | null>(null)
  const [employerRate, setEmployerRate] = useState(0)
  const [jobTypes, setJobTypes] = useState<InsuranceJobTypesRes[]>([])
  const [newJobName, setNewJobName] = useState('')
  const [newJobRate, setNewJobRate] = useState('')
  const [newJobDesc, setNewJobDesc] = useState('')

  const fetchRates = (y?: number) => {
    insuranceApi.getRates(y).then(r => { setRates(r); setEmployerRate(r.employInsuranceEmployer) }).catch(() => {})
  }
  const fetchJobTypes = () => {
    insuranceApi.getJobTypes().then(setJobTypes).catch(() => {})
  }
  useEffect(() => { fetchRates(); fetchJobTypes() }, [])

  const handleSaveEmployerRate = () => {
    insuranceApi.updateEmployerRate(employerRate).then(() => { fetchRates(year); alert('저장되었습니다.') }).catch(() => alert('저장 실패'))
  }
  const addJobType = () => {
    if (!newJobName.trim() || !newJobRate) return
    insuranceApi.createJobType({ name: newJobName.trim(), description: newJobDesc.trim(), industrialAccidentRate: Number(newJobRate) })
      .then(() => { fetchJobTypes(); setNewJobName(''); setNewJobRate(''); setNewJobDesc('') })
      .catch(() => alert('등록 실패'))
  }
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null)
  const deleteJobName = jobTypes.find(j => j.jobTypesId === deleteJobId)?.name || ''

  const removeJobType = () => {
    if (!deleteJobId) return
    insuranceApi.deleteJobType(deleteJobId)
      .then(() => { fetchJobTypes(); setDeleteJobId(null); alert('삭제되었습니다.') })
      .catch(() => alert('삭제 실패'))
  }
  const toggleJobType = (id: number) => {
    insuranceApi.toggleJobType(id).then(() => fetchJobTypes()).catch(() => {})
  }

  const inputCls = "text-[12px] border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#1D9E75] w-20 text-right"

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">사회보험 요율표</h3>
      <p className="text-[12px] text-gray-400 mb-5">4대보험 요율을 연도별로 관리합니다 (ERD: insurance_rates)</p>

      <div className="flex items-center gap-2 mb-5">
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-20" />
        <button onClick={() => fetchRates(year)} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">조회</button>
      </div>

      <table className="w-full text-[12px] border-collapse">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left font-medium text-gray-700 w-40">항목</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">근로자</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">사업주</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">보험요율 (근로자+사업주)</th>
        </tr></thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-3 font-medium text-gray-800" rowSpan={2}>국민연금</td>
            <td className="px-3 py-3 text-center">{rates?.nationalPension ?? 4.5}%</td>
            <td className="px-3 py-3 text-center">{rates?.nationalPension ?? 4.5}%</td>
            <td className="px-3 py-3 text-center font-medium">{((rates?.nationalPension ?? 4.5) * 2).toFixed(1)}%</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-3 py-2 text-[11px] text-gray-500 text-center" colSpan={2}>적용기간: {rates?.validFrom ?? ''} ~ {rates?.validTo ?? ''}</td>
            <td className="px-3 py-2 text-[11px] text-gray-500">상한액: {(rates?.pensionUpperLimit ?? 0).toLocaleString()} / 하한액: {(rates?.pensionLowerLimit ?? 0).toLocaleString()}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-3 font-medium text-gray-800" rowSpan={2}>건강보험<br/><span className="text-[10px] text-gray-400">(노인장기요양보험료)</span></td>
            <td className="px-3 py-3 text-center">{rates?.healthInsurance ?? 3.545}%</td>
            <td className="px-3 py-3 text-center">{rates?.healthInsurance ?? 3.545}%</td>
            <td className="px-3 py-3 text-center font-medium">{((rates?.healthInsurance ?? 3.545) * 2).toFixed(3)}%</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-3 py-2 text-[11px] text-gray-500 text-center" colSpan={2}>장기요양: 건강보험료의 {rates?.longTermCare ?? 12.81}%</td>
            <td className="px-3 py-2 text-[11px] text-gray-500">적용기간: {rates?.validFrom ?? ''} ~ {rates?.validTo ?? ''}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-3 font-medium text-gray-800">고용보험</td>
            <td className="px-3 py-3 text-center">{rates?.employInsurance ?? 0.9}%</td>
            <td className="px-3 py-3 text-center"><input type="number" step="0.01" min="0" max="100" value={employerRate} className={inputCls} onChange={e => setEmployerRate(parseFloat(e.target.value) || 0)} /> %</td>
            <td className="px-3 py-3 text-center font-medium">{((rates?.employInsurance ?? 0.9) + employerRate).toFixed(2)}%</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-3 font-medium text-gray-800">산재보험</td>
            <td className="px-3 py-3 text-center text-[11px] text-gray-400" colSpan={3}>업종별 요율 하단 참조</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mt-4">
        <button onClick={handleSaveEmployerRate} className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
      </div>

      {/* 업종별 산재보험 요율 (ERD: insurance_job_types + insurance_rates) */}
      <div className="mt-6">
        <h4 className="text-[14px] font-bold text-gray-800 mb-1">업종별 산재보험 요율</h4>
        <p className="text-[11px] text-gray-400 mb-4">업종(산재보험구분)별 산재보험 요율을 등록합니다. 사원은 소속 부서의 업종에 따라 산재보험이 적용됩니다. (ERD: insurance_job_types)</p>

        <div className="flex items-center gap-2 mb-4">
          <input type="text" value={newJobName} onChange={e => setNewJobName(e.target.value)} placeholder="업종명" className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-40" />
          <input type="text" value={newJobDesc} onChange={e => setNewJobDesc(e.target.value)} placeholder="설명" className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-40" />
          <input type="number" step="0.01" value={newJobRate} onChange={e => setNewJobRate(e.target.value)} placeholder="요율(%)" className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-20 text-right" />
          <button onClick={addJobType} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">+ 등록</button>
        </div>

        <table className="w-full text-[12px] border-collapse">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-3 py-2.5 text-left font-medium text-gray-700">업종명</th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-700">설명</th>
            <th className="px-3 py-2.5 text-right font-medium text-gray-700">산재보험 요율</th>
            <th className="px-3 py-2.5 text-center font-medium text-gray-700">사용여부</th>
            <th className="px-3 py-2.5 text-right font-medium text-gray-700">관리</th>
          </tr></thead>
          <tbody>
            {jobTypes.map(jt => (
              <tr key={jt.jobTypesId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-800 font-medium">{jt.name}</td>
                <td className="px-3 py-2.5 text-gray-500">{jt.description}</td>
                <td className="px-3 py-2.5 text-right text-gray-800">{jt.industrialAccidentRate} %</td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => toggleJobType(jt.jobTypesId)} className={`w-10 h-5 rounded-full transition-colors relative ${jt.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${jt.isActive ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => setDeleteJobId(jt.jobTypesId)} className="text-[11px] text-red-500 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deleteJobId && <DeleteConfirmModal names={[deleteJobName]} onConfirm={removeJobType} onClose={() => setDeleteJobId(null)} />}
      </div>

      <div className="mt-4 bg-blue-50 rounded-lg p-3 text-[11px] text-blue-700">
        <p>※ 국민연금·건강보험 요율은 공단 고시 기준이며, 시스템에서 자동 반영됩니다.</p>
        <p>※ <strong>고용보험 요율</strong>은 관리자가 직접 입력하여 설정합니다.</p>
        <p>※ <strong>산재보험 요율</strong>은 업종별로 다르게 적용됩니다. 부서에 업종을 지정하면 해당 부서 사원에게 자동 적용됩니다.</p>
      </div>
    </div>
  )
}

// ── 법정수당 산정 ──
// legalCalcType → 설명/산정방식 매핑
const LEGAL_CALC_MAP: Record<string, { desc: string; formula: string }> = {
  OVERTIME: { desc: '1일 8시간 근무하거나 1주 40시간 초과하여 근무하는 경우', formula: '연장근로시간 수 x 시간당 통상임금 x 50%' },
  NIGHT: { desc: '오후 10시(22시)부터 오전 06시까지 근로를 제공한 경우', formula: '야간근로시간 수 x 시간당 통상임금 x 50%' },
  HOLIDAY: { desc: '휴일 날 근로를 제공한 경우', formula: '휴일근로시간 수 x 시간당 통상임금 x 50%' },
  LEAVE: { desc: '연차휴가를 사용하지 않은 경우', formula: '1일 통상임금 x 미사용 연차 휴가일수' },
}

function LegalAllowanceView() {
  const [items, setItems] = useState<{ id: number; name: string; legalCalcType: string; desc: string; formula: string; active: boolean; isProtect: boolean }[]>([])

  const fetchItems = () => {
    payItemsApi.getList('PAYMENT', undefined, true).then(list => {
      const legals = list.filter(i => i.isLegal && i.legalCalcType)
      setItems(legals.map(i => {
        const mapped = LEGAL_CALC_MAP[i.legalCalcType || ''] || { desc: '', formula: '' }
        return { id: i.payItemId, name: i.payItemName, legalCalcType: i.legalCalcType || '', desc: mapped.desc, formula: mapped.formula, active: i.isActive, isProtect: !!i.isProtect }
      }))
    }).catch(() => {
      // 백엔드 미연결 시 폴백
      setItems([
        { id: 1, name: '연장근로수당', legalCalcType: 'OVERTIME', ...LEGAL_CALC_MAP.OVERTIME, active: true, isProtect: true },
        { id: 2, name: '야간근로수당', legalCalcType: 'NIGHT', ...LEGAL_CALC_MAP.NIGHT, active: true, isProtect: true },
        { id: 3, name: '휴일근로수당', legalCalcType: 'HOLIDAY', ...LEGAL_CALC_MAP.HOLIDAY, active: true, isProtect: true },
        { id: 4, name: '연차수당', legalCalcType: 'LEAVE', ...LEGAL_CALC_MAP.LEAVE, active: true, isProtect: true },
      ])
    })
  }
  useEffect(() => { fetchItems() }, [])

  const toggle = (id: number) => {
    const target = items.find(i => i.id === id)
    if (target?.isProtect) return
    payItemsApi.toggleActive(id).then(() => fetchItems()).catch(() => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i))
    })
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">법정수당 산정</h3>
      <p className="text-[12px] text-gray-400 mb-5">법정 수당의 계산 방식과 사용여부를 설정합니다</p>

      <div className="mb-4 bg-blue-50 rounded-lg p-3 text-[11px] text-blue-700">
        <p className="font-medium mb-1">법정수당이란?</p>
        <p>법적으로 그 지급이 강제되는 수당으로 시간외근무수당(연장근로수당, 야간근로수당, 휴일근로수당), 연차수당 등이 있습니다.</p>
      </div>

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left font-medium text-gray-700">법정수당</th>
          <th className="px-3 py-2.5 text-left font-medium text-gray-700">설명</th>
          <th className="px-3 py-2.5 text-left font-medium text-gray-700">법정 산정 방식</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700 w-28">사용여부</th>
        </tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  {item.name}
                  {item.isProtect && <span className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5">필수</span>}
                </span>
              </td>
              <td className="px-3 py-3 text-gray-600">{item.desc}</td>
              <td className="px-3 py-3 text-gray-600">{item.formula}</td>
              <td className="px-3 py-3 text-center w-28">
                <button
                  onClick={() => toggle(item.id)}
                  disabled={item.isProtect}
                  title={item.isProtect ? '필수 항목은 사용유무를 변경할 수 없습니다' : undefined}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${item.active ? 'bg-[#1D9E75] text-white' : 'bg-gray-200 text-gray-500'} ${item.isProtect ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {item.active ? '사용' : '미사용'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 퇴직연금 설정 ──
function RetirementPensionView() {
  const [pensionType, setPensionType] = useState<PensionType>('severance')
  const [dbProvider, setDbProvider] = useState('')
  const [dbAccount, setDbAccount] = useState('')
  const [bankList, setBankList] = useState<BankRes[]>([])
  const banks = bankList.length > 0 ? bankList.map(b => b.bankName) : ['국민은행', '우리은행', '신한은행', '하나은행', '농협은행', 'IBK기업은행']

  useEffect(() => {
    retirementApi.getSettings().then(s => {
      setPensionType(s.pensionType)
      setDbProvider(s.pensionProvider || '')
      setDbAccount(s.pensionAccount || '')
    }).catch(() => {})
    paySettingsApi.getBanks().then(setBankList).catch(() => {})
  }, [])

  const handleSave = () => {
    retirementApi.saveSettings({
      pensionType,
      pensionProvider: (pensionType === 'DB' || pensionType === 'DB_DC') ? dbProvider : undefined,
      pensionAccount: (pensionType === 'DB' || pensionType === 'DB_DC') ? dbAccount : undefined,
    }).then(() => alert('저장되었습니다.')).catch(() => alert('저장에 실패했습니다.'))
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">퇴직연금 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">회사의 퇴직연금 제도를 설정합니다 (ERD: retirement_settings)</p>

      <div className="space-y-5">
        <div className="flex items-center gap-4 text-[13px]">
          <span className="text-gray-600 w-32">퇴직연금 제도</span>
          <div className="flex items-center gap-4">
            {([
              { value: 'severance' as const, label: '퇴직금 (직접지급)' },
              { value: 'DB' as const, label: 'DB형 (확정급여)' },
              { value: 'DC' as const, label: 'DC형 (확정기여)' },
              { value: 'DB_DC' as const, label: 'DB+DC형 (혼합)' },
            ]).map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="pensionType" checked={pensionType === opt.value} onChange={() => setPensionType(opt.value)} className="accent-[#1D9E75]" />
                <span className="text-[12px] text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 유형별 설명 */}
        <div className="bg-blue-50 rounded-lg p-3 text-[11px] text-blue-700 space-y-1">
          {pensionType === 'severance' && (
            <>
              <p className="font-medium">퇴직금 (직접지급)</p>
              <p>회사가 퇴직 시 근속연수 기반으로 퇴직금을 직접 계산하여 지급합니다.</p>
              <p>퇴직금 = 1일 평균임금 × 30일 × (근속연수)</p>
            </>
          )}
          {pensionType === 'DB' && (
            <>
              <p className="font-medium">DB형 (확정급여형)</p>
              <p>퇴직 시 받을 급여가 사전에 확정되며, 회사가 금융기관에 적립금을 납입합니다.</p>
              <p>퇴직급여 = 퇴직 직전 3개월 평균임금 × 근속연수</p>
              <p>실제 지급은 금융기관(운용사)을 통해 이루어집니다.</p>
            </>
          )}
          {pensionType === 'DC' && (
            <>
              <p className="font-medium">DC형 (확정기여형)</p>
              <p>회사가 매년 연간 임금총액의 1/12 이상을 근로자 개인 퇴직연금 계좌에 납입합니다.</p>
              <p>근로자가 직접 운용하며, 퇴직 시 적립금 + 운용수익을 수령합니다.</p>
            </>
          )}
          {pensionType === 'DB_DC' && (
            <>
              <p className="font-medium">DB+DC형 (혼합형)</p>
              <p>사원별로 DB형 또는 DC형을 선택하여 운영합니다.</p>
              <p>DB형 사원: 퇴직급여 = 퇴직 직전 3개월 평균임금 × 근속연수 (금융기관 지급)</p>
              <p>DC형 사원: 회사가 매년 연간 임금총액의 1/12 이상을 개인 계좌에 납입</p>
            </>
          )}
        </div>

        {/* DB형/DB+DC형일 때 운용사/계좌 입력 */}
        {(pensionType === 'DB' || pensionType === 'DB_DC') && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="text-[13px] font-medium text-gray-800 mb-2">DB형 운용 정보</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[12px]">
                <label className="text-gray-500 w-24 shrink-0 whitespace-nowrap">퇴직연금 운용사</label>
                <select value={dbProvider} onChange={e => setDbProvider(e.target.value)} className="w-52 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]">
                  {banks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 text-[12px]">
                <label className="text-gray-500 w-24 shrink-0 whitespace-nowrap">운용 계좌</label>
                <input type="text" value={dbAccount} onChange={e => setDbAccount(e.target.value)} placeholder="계좌번호" className="w-52 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={handleSave} className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
      </div>
    </div>
  )
}

// ── 간이세액표 확인 (DB: tax_withholding_table, 시스템 전역, 천원 단위) ──
function TaxTableView() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [yearList, setYearList] = useState<number[]>([])
  const [allRows, setAllRows] = useState<TaxWithholdingRowRes[]>([])
  const [loading, setLoading] = useState(false)

  // 표시 윈도우 (천원 단위) — 기본 3000~3500
  const INITIAL_MIN = 3000
  const INITIAL_MAX = 3500
  const STEP = 500   // 한 클릭당 50만원씩 확장
  const [windowMin, setWindowMin] = useState(INITIAL_MIN)
  const [windowMax, setWindowMax] = useState(INITIAL_MAX)

  const dependentCols = Array.from({ length: 11 }, (_, i) => i + 1)
  const fmt = (n: number) => n.toLocaleString()

  // 등록된 연도 목록
  useEffect(() => {
    taxTableApi.getYears()
      .then(setYearList)
      .catch(err => console.error('연도 목록 조회 실패:', err))
  }, [])

  // 연도별 표 조회 + 윈도우 초기화
  const fetchTable = (y: number) => {
    setLoading(true)
    taxTableApi.getByYear(y, 0, 2000)
      .then(res => {
        setAllRows(res.content)
        setWindowMin(INITIAL_MIN)
        setWindowMax(INITIAL_MAX)
      })
      .catch(err => {
        console.error('간이세액표 조회 실패:', err)
        setAllRows([])
      })
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTable(year) }, [year])

  // 윈도우 안 행
  const visibleRows = allRows
    .filter(r => r.salaryMin >= windowMin && r.salaryMin < windowMax)
    .sort((a, b) => a.salaryMin - b.salaryMin)

  // 위/아래 더보기 가능 여부
  const minPossible = allRows.length > 0 ? Math.min(...allRows.map(r => r.salaryMin)) : 0
  const maxPossible = allRows.length > 0 ? Math.max(...allRows.map(r => r.salaryMax)) : 0
  const hasAbove = windowMin > minPossible
  const hasBelow = windowMax < maxPossible

  // 위/아래로 윈도우 통째 이동 (확장 아님)
  const loadMoreAbove = () => {
    const newMax = windowMin
    const newMin = Math.max(minPossible, windowMin - STEP)
    setWindowMin(newMin)
    setWindowMax(newMax)
  }
  const loadMoreBelow = () => {
    const newMin = windowMax
    const newMax = Math.min(maxPossible, windowMax + STEP)
    setWindowMin(newMin)
    setWindowMax(newMax)
  }

  // 한 행에서 부양가족수별 세액 꺼내는 헬퍼
  const taxByDep = (row: TaxWithholdingRowRes, dep: number): number => {
    const map: Record<number, number> = {
      1: row.taxDep01, 2: row.taxDep02, 3: row.taxDep03,
      4: row.taxDep04, 5: row.taxDep05, 6: row.taxDep06,
      7: row.taxDep07, 8: row.taxDep08, 9: row.taxDep09,
      10: row.taxDep10, 11: row.taxDep11,
    }
    return map[dep] ?? 0
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">간이세액표 확인</h3>
      <p className="text-[12px] text-gray-400 mb-5">
        국세청 고시 근로소득 간이세액표를 조회합니다. 월급여액 + 부양가족수 조합으로 소득세가 결정됩니다.
        <span className="ml-1 text-gray-300">(시스템 전역 데이터)</span>
      </p>

      {/* 연도 선택 */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
          {yearList.length > 0
            ? yearList.map(y => <option key={y} value={y}>{y}년</option>)
            : <option value={year}>{year}년</option>}
        </select>
        <button onClick={() => fetchTable(year)} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">새로고침</button>
      </div>

      {/* 요약 정보 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-[12px]">
          <div><span className="text-gray-500">적용 연도</span><div className="font-medium text-gray-800 mt-0.5">{year}년</div></div>
          <div><span className="text-gray-500">근로소득세</span><div className="text-gray-800 mt-0.5">간이세액표 기준 자동 계산</div></div>
          <div><span className="text-gray-500">지방소득세</span><div className="text-gray-800 mt-0.5">근로소득세 × 10%</div></div>
        </div>
      </div>

      {/* 세액표 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-[11px] min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 px-2 text-center font-medium text-gray-500" colSpan={2}>
                월급여액(천원)<br />
                <span className="text-[10px] font-normal">[비과세 및 학자금 제외]</span>
              </th>
              <th className="py-2 px-2 text-center font-medium text-gray-500" colSpan={11}>
                공제대상가족의 수<br />
                <span className="text-[10px] font-normal">(단위: 원)</span>
              </th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="py-1.5 px-2 text-center text-gray-500">이상</th>
              <th className="py-1.5 px-2 text-center text-gray-500">미만</th>
              {dependentCols.map(n => (
                <th key={n} className="py-1.5 px-2 text-center text-gray-500">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="py-8 text-center text-gray-400">로딩 중...</td></tr>
            ) : allRows.length === 0 ? (
              <tr><td colSpan={13} className="py-8 text-center text-gray-400">{year}년 데이터가 없습니다.</td></tr>
            ) : (
              <>
                {/* 위 더보기 */}
                {hasAbove && (
                  <tr className="bg-gray-50/60">
                    <td colSpan={13} className="py-1.5 text-center">
                      <button
                        onClick={loadMoreAbove}
                        className="text-[11px] text-gray-500 hover:text-[#1D9E75] hover:underline px-3 py-1"
                      >
                        <i className="fas fa-chevron-up mr-1.5 text-[9px]" />
                        위 자료 더보기 ({fmt(Math.max(minPossible, windowMin - STEP))} ~ {fmt(windowMin)} 천원)
                      </button>
                    </td>
                  </tr>
                )}

                {/* 데이터 행들 */}
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-6 text-center text-gray-400 text-[11px]">
                      현재 구간({fmt(windowMin)}~{fmt(windowMax)} 천원)에 데이터가 없습니다. 위/아래 더보기로 다른 구간을 확인하세요.
                    </td>
                  </tr>
                ) : visibleRows.map(row => (
                  <tr key={row.taxId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-1.5 px-2 text-right text-gray-700">{fmt(row.salaryMin)}</td>
                    <td className="py-1.5 px-2 text-right text-gray-700">{fmt(row.salaryMax)}</td>
                    {dependentCols.map(dep => {
                      const tax = taxByDep(row, dep)
                      return (
                        <td key={dep} className={`py-1.5 px-2 text-right ${tax > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                          {tax > 0 ? fmt(tax) : ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* 아래 더보기 */}
                {hasBelow && (
                  <tr className="bg-gray-50/60">
                    <td colSpan={13} className="py-1.5 text-center">
                      <button
                        onClick={loadMoreBelow}
                        className="text-[11px] text-gray-500 hover:text-[#1D9E75] hover:underline px-3 py-1"
                      >
                        아래 자료 더보기 ({fmt(windowMax)} ~ {fmt(Math.min(maxPossible, windowMax + STEP))} 천원)
                        <i className="fas fa-chevron-down ml-1.5 text-[9px]" />
                      </button>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-yellow-50 rounded-lg p-3 text-[11px] text-yellow-800 space-y-1">
        <p className="font-medium"><i className="fas fa-info-circle mr-1" />안내</p>
        <p>• 간이세액표는 국세청에서 매년 고시하는 시스템 전역 데이터입니다 (회사별 X).</p>
        <p>• <strong>월급여액은 천원 단위</strong>로 표시됩니다 (예: 1,060 → 실제 1,060,000원).</p>
        <p>• 급여 산정 시 사원의 월급여액과 부양가족수에 따라 소득세가 자동 조회됩니다.</p>
        <p>• 지방소득세는 소득세의 10%로 자동 계산됩니다.</p>
      </div>
    </div>
  )
}

// ── 메인 ──
export default function SalaryPolicyTab() {
  const [activeView, setActiveView] = useState<SalaryPolicyView>('pay-items')

  const renderView = () => {
    switch (activeView) {
      case 'pay-items': return <PayItemsView />
      case 'deduct-items': return <DeductItemsView />
      case 'insurance-rates': return <InsuranceRatesView />
      case 'pay-day': return <PayDayView />

      case 'legal-allowance': return <LegalAllowanceView />
      case 'retirement-pension': return <RetirementPensionView />
      case 'tax-table': return <TaxTableView />
    }
  }

  return (
    <div className="flex gap-0 -m-6 h-[calc(100%+48px)]">
      {/* 서브 사이드바 */}
      <div className="w-[200px] bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-800">급여 정책</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">급여 체계와 수당·공제 정책 관리</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {MENUS.map(m => (
            <div
              key={m.key}
              onClick={() => setActiveView(m.key)}
              className={`flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer rounded-lg transition-colors ${
                activeView === m.key ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m.label}
            </div>
          ))}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </div>
    </div>
  )
}
