import { useState } from 'react'

type SalaryPolicyView = 'pay-items' | 'deduct-items' | 'insurance-rates' | 'pay-day' | 'legal-allowance'

const MENUS: { key: SalaryPolicyView; label: string }[] = [
  { key: 'pay-items', label: '지급항목 관리' },
  { key: 'deduct-items', label: '공제항목 관리' },
  { key: 'insurance-rates', label: '사회보험 요율표' },
  { key: 'pay-day', label: '급여지급일 설정' },
  { key: 'legal-allowance', label: '법정수당 산정' },
]

// ── 삭제 확인 모달 ──
function DeleteConfirmModal({ names, onConfirm, onClose }: { names: string[]; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[360px] p-6 text-center">
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
interface PayItemForm { name: string; isFixed: boolean; taxFree: boolean; taxFreeLimit: number }

function PayItemModal({ onClose, onSave }: { onClose: () => void; onSave: (item: PayItemForm) => void }) {
  const [form, setForm] = useState<PayItemForm>({ name: '', isFixed: false, taxFree: false, taxFreeLimit: 0 })
  const fmtComma = (n: number) => n.toLocaleString()
  const parseNum = (s: string) => Number(s.replace(/,/g, '').replace(/[^0-9]/g, '')) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[440px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">지급항목 등록</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-20 shrink-0">항목명 <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="항목명을 입력하세요" className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]" autoFocus />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-20 shrink-0">고정수당</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.isFixed} onChange={e => setForm(prev => ({ ...prev, isFixed: e.target.checked }))} className="w-3.5 h-3.5 accent-[#1D9E75]" />
              <span className="text-[12px] text-gray-700">매월 고정 지급</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-20 shrink-0">비과세</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.taxFree} onChange={e => setForm(prev => ({ ...prev, taxFree: e.target.checked }))} className="w-3.5 h-3.5 accent-[#1D9E75]" />
              <span className="text-[12px] text-gray-700">비과세 항목</span>
            </label>
          </div>
          {form.taxFree && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-gray-500 w-20 shrink-0">비과세한도</label>
              <input type="text" value={fmtComma(form.taxFreeLimit)} onChange={e => setForm(prev => ({ ...prev, taxFreeLimit: parseNum(e.target.value) }))} className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75] text-right" />
              <span className="text-[12px] text-gray-500">원</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => { if (form.name.trim()) onSave(form) }} disabled={!form.name.trim()} className="px-5 py-2 text-[13px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed">등록</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 지급항목 관리 ──
function PayItemsView() {
  const [items, setItems] = useState([
    { id: 1, name: '기본급', isFixed: false, taxFree: false, taxFreeLimit: 0, active: true },
    { id: 2, name: '직책수당', isFixed: true, taxFree: false, taxFreeLimit: 0, active: true },
    { id: 3, name: '식대', isFixed: true, taxFree: true, taxFreeLimit: 200000, active: true },
    { id: 4, name: '교통비', isFixed: true, taxFree: true, taxFreeLimit: 200000, active: true },
    { id: 5, name: '연장근로수당', isFixed: false, taxFree: false, taxFreeLimit: 0, active: true },
    { id: 6, name: '야간근로수당', isFixed: false, taxFree: false, taxFreeLimit: 0, active: true },
    { id: 7, name: '휴일근로수당', isFixed: false, taxFree: false, taxFreeLimit: 0, active: true },
    { id: 8, name: '연차수당', isFixed: false, taxFree: false, taxFreeLimit: 0, active: true },
    { id: 9, name: '상여금', isFixed: false, taxFree: false, taxFreeLimit: 0, active: true },
    { id: 10, name: '교육비지원금', isFixed: true, taxFree: false, taxFreeLimit: 0, active: false },
    { id: 11, name: '결근차감', isFixed: false, taxFree: false, taxFreeLimit: 0, active: false },
    { id: 12, name: '명절·휴가수당', isFixed: false, taxFree: false, taxFreeLimit: 0, active: false },
  ])
  const [modalOpen, setModalOpen] = useState(false)
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const toggle = (id: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i))
  const toggleCheck = (id: number) => setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAllCheck = () => { if (checkedIds.length === items.length) setCheckedIds([]); else setCheckedIds(items.map(i => i.id)) }
  const addItem = (form: PayItemForm) => {
    setItems(prev => [...prev, { id: Date.now(), ...form, active: true }])
    setModalOpen(false)
  }
  const handleDelete = () => {
    setItems(prev => prev.filter(i => !checkedIds.includes(i.id)))
    setCheckedIds([])
    setDeleteConfirm(false)
  }
  const checkedNames = items.filter(i => checkedIds.includes(i.id)).map(i => i.name)

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">지급항목 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">급여 명세서에 표시될 지급 항목을 등록하고 관리합니다 (ERD: pay_items, category=PAYMENT)</p>

      <div className="flex items-center gap-2 mb-4">
        <input type="text" placeholder="항목명을 입력하세요.." className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-48" />
        <button className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">조회</button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setModalOpen(true)} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">+ 등록</button>
        <button onClick={() => checkedIds.length > 0 ? setDeleteConfirm(true) : alert('삭제할 항목을 선택해주세요.')} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50 text-red-500">삭제</button>
      </div>

      {modalOpen && <PayItemModal onClose={() => setModalOpen(false)} onSave={addItem} />}
      {deleteConfirm && <DeleteConfirmModal names={checkedNames} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={checkedIds.length === items.length && items.length > 0} onChange={toggleAllCheck} /></th>
          <th className="px-3 py-2.5 text-left font-medium text-gray-700">항목명</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">고정수당</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">비과세</th>
          <th className="px-3 py-2.5 text-right font-medium text-gray-700">비과세한도</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">사용여부</th>
        </tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5"><input type="checkbox" className="w-3 h-3" checked={checkedIds.includes(item.id)} onChange={() => toggleCheck(item.id)} /></td>
              <td className="px-3 py-2.5 text-[#1D9E75] cursor-pointer hover:underline">{item.name}</td>
              <td className="px-3 py-2.5 text-center">{item.isFixed ? '●' : ''}</td>
              <td className="px-3 py-2.5 text-center">{item.taxFree ? '●' : ''}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{item.taxFreeLimit.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-center">
                <button onClick={() => toggle(item.id)} className={`w-10 h-5 rounded-full transition-colors relative ${item.active ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${item.active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
      </div>
    </div>
  )
}

// ── 공제항목 등록 모달 ──
function DeductItemModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[380px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">공제항목 등록</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-gray-500 w-16 shrink-0">항목명 <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="공제항목명을 입력하세요" className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]" autoFocus />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => { if (name.trim()) onSave(name.trim()) }} disabled={!name.trim()} className="px-5 py-2 text-[13px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed">등록</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 공제항목 관리 ──
function DeductItemsView() {
  const [items, setItems] = useState([
    { id: 1, name: '근로소득세', active: true },
    { id: 2, name: '근로지방소득세', active: true },
    { id: 3, name: '국민연금', active: true },
    { id: 4, name: '건강보험', active: true },
    { id: 5, name: '장기요양보험', active: true },
    { id: 6, name: '고용보험', active: true },
    { id: 7, name: '학자금상환', active: true },
  ])
  const [modalOpen, setModalOpen] = useState(false)
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const toggle = (id: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i))
  const toggleCheck = (id: number) => setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAllCheck = () => { if (checkedIds.length === items.length) setCheckedIds([]); else setCheckedIds(items.map(i => i.id)) }
  const addItem = (name: string) => {
    setItems(prev => [...prev, { id: Date.now(), name, active: true }])
    setModalOpen(false)
  }
  const handleDelete = () => {
    setItems(prev => prev.filter(i => !checkedIds.includes(i.id)))
    setCheckedIds([])
    setDeleteConfirm(false)
  }
  const checkedNames = items.filter(i => checkedIds.includes(i.id)).map(i => i.name)

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">공제항목 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">급여에서 공제되는 항목을 관리합니다 (ERD: pay_items, category=DEDUCTION)</p>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setModalOpen(true)} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">+ 등록</button>
        <button onClick={() => checkedIds.length > 0 ? setDeleteConfirm(true) : alert('삭제할 항목을 선택해주세요.')} className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50 text-red-500">삭제</button>
      </div>

      {modalOpen && <DeductItemModal onClose={() => setModalOpen(false)} onSave={addItem} />}
      {deleteConfirm && <DeleteConfirmModal names={checkedNames} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={checkedIds.length === items.length && items.length > 0} onChange={toggleAllCheck} /></th>
          <th className="px-3 py-2.5 text-left font-medium text-gray-700">항목명</th>
          <th className="px-3 py-2.5 text-center font-medium text-gray-700">사용여부</th>
        </tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5"><input type="checkbox" className="w-3 h-3" checked={checkedIds.includes(item.id)} onChange={() => toggleCheck(item.id)} /></td>
              <td className="px-3 py-2.5 text-[#1D9E75] cursor-pointer hover:underline">{item.name}</td>
              <td className="px-3 py-2.5 text-center">
                <button onClick={() => toggle(item.id)} className={`w-10 h-5 rounded-full transition-colors relative ${item.active ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${item.active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
      </div>
    </div>
  )
}

// ── 사회보험 요율표 ──
function InsuranceRatesView() {
  const [year, setYear] = useState(2026)
  const [rates, setRates] = useState({
    nationalPension: { worker: 4.5, employer: 4.5, validFrom: '2024-07-01', validTo: '2025-06-30', upperLimit: 6170000, lowerLimit: 390000 },
    nationalPension2: { worker: 4.5, employer: 4.5, validFrom: '2025-07-01', validTo: '2026-06-30', upperLimit: 6370000, lowerLimit: 400000 },
    healthInsurance: { worker: 3.545, employer: 3.545, longTermCareRate: 12.81, validFrom: '2026-01-01', validTo: '2026-12-31' },
    employmentInsurance: { worker: 0.9, employer: 0.9, validFrom: '2022-07-01' },
  })

  // ERD: insurance_job_types + insurance_rates (job_types_id FK)
  const [jobTypes, setJobTypes] = useState([
    { id: 1, name: '사무직/판매직', rate: 0.7, active: true },
    { id: 2, name: '전기/전자/정밀기기', rate: 0.9, active: true },
    { id: 3, name: '건설업', rate: 3.5, active: false },
    { id: 4, name: '음식/숙박업', rate: 1.2, active: false },
  ])
  const [newJobName, setNewJobName] = useState('')
  const [newJobRate, setNewJobRate] = useState('')

  const addJobType = () => {
    if (!newJobName.trim() || !newJobRate) return
    setJobTypes(prev => [...prev, { id: Date.now(), name: newJobName.trim(), rate: Number(newJobRate), active: true }])
    setNewJobName('')
    setNewJobRate('')
  }
  const removeJobType = (id: number) => setJobTypes(prev => prev.filter(j => j.id !== id))
  const toggleJobType = (id: number) => setJobTypes(prev => prev.map(j => j.id === id ? { ...j, active: !j.active } : j))
  const updateJobRate = (id: number, rate: number) => setJobTypes(prev => prev.map(j => j.id === id ? { ...j, rate } : j))

  const inputCls = "text-[12px] border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#1D9E75] w-20 text-right"

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">사회보험 요율표</h3>
      <p className="text-[12px] text-gray-400 mb-5">4대보험 요율을 연도별로 관리합니다 (ERD: insurance_rates)</p>

      <div className="flex items-center gap-2 mb-5">
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-20" />
        <button className="px-3 py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50">조회</button>
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
            <td className="px-3 py-3 text-center">{rates.nationalPension.worker}%</td>
            <td className="px-3 py-3 text-center">{rates.nationalPension.employer}%</td>
            <td className="px-3 py-3 text-center font-medium">{(rates.nationalPension.worker + rates.nationalPension.employer).toFixed(1)}%</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-3 py-2 text-[11px] text-gray-500 text-center" colSpan={2}>적용기간: {rates.nationalPension2.validFrom} ~ {rates.nationalPension2.validTo}</td>
            <td className="px-3 py-2 text-[11px] text-gray-500">상한액: {rates.nationalPension2.upperLimit.toLocaleString()} / 하한액: {rates.nationalPension2.lowerLimit.toLocaleString()}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-3 font-medium text-gray-800" rowSpan={2}>건강보험<br/><span className="text-[10px] text-gray-400">(노인장기요양보험료)</span></td>
            <td className="px-3 py-3 text-center">{rates.healthInsurance.worker}%</td>
            <td className="px-3 py-3 text-center">{rates.healthInsurance.employer}%</td>
            <td className="px-3 py-3 text-center font-medium">{(rates.healthInsurance.worker + rates.healthInsurance.employer).toFixed(2)}%</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-3 py-2 text-[11px] text-gray-500 text-center" colSpan={2}>장기요양: 건강보험료의 {rates.healthInsurance.longTermCareRate}%</td>
            <td className="px-3 py-2 text-[11px] text-gray-500">적용기간: {rates.healthInsurance.validFrom} ~ {rates.healthInsurance.validTo}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-3 font-medium text-gray-800">고용보험</td>
            <td className="px-3 py-3 text-center"><input type="number" step="0.01" min="0" max="100" value={rates.employmentInsurance.worker} className={inputCls} onChange={e => setRates(prev => ({ ...prev, employmentInsurance: { ...prev.employmentInsurance, worker: parseFloat(e.target.value) || 0 } }))} /> %</td>
            <td className="px-3 py-3 text-center"><input type="number" step="0.01" min="0" max="100" value={rates.employmentInsurance.employer} className={inputCls} onChange={e => setRates(prev => ({ ...prev, employmentInsurance: { ...prev.employmentInsurance, employer: parseFloat(e.target.value) || 0 } }))} /> %</td>
            <td className="px-3 py-3 text-center font-medium">{(rates.employmentInsurance.worker + rates.employmentInsurance.employer).toFixed(1)}%</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-3 py-3 font-medium text-gray-800">산재보험</td>
            <td className="px-3 py-3 text-center text-[11px] text-gray-400" colSpan={3}>업종별 요율 하단 참조</td>
          </tr>
        </tbody>
      </table>

      {/* 업종별 산재보험 요율 (ERD: insurance_job_types + insurance_rates) */}
      <div className="mt-6">
        <h4 className="text-[14px] font-bold text-gray-800 mb-1">업종별 산재보험 요율</h4>
        <p className="text-[11px] text-gray-400 mb-4">업종(산재보험구분)별 산재보험 요율을 등록합니다. 사원은 소속 부서의 업종에 따라 산재보험이 적용됩니다. (ERD: insurance_job_types)</p>

        <div className="flex items-center gap-2 mb-4">
          <input type="text" value={newJobName} onChange={e => setNewJobName(e.target.value)} placeholder="업종명" className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-40" />
          <input type="text" value={newJobRate} onChange={e => setNewJobRate(e.target.value)} placeholder="요율(%)" className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-20 text-right" />
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
              <tr key={jt.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-800 font-medium">{jt.name}</td>
                <td className="px-3 py-2.5 text-gray-500">{jt.name === '사무직/판매직' ? '사무·판매 종사자' : jt.name === '건설업' ? '건설 현장 근로자' : ''}</td>
                <td className="px-3 py-2.5 text-right">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={jt.rate}
                    onChange={e => updateJobRate(jt.id, parseFloat(e.target.value) || 0)}
                    className={inputCls}
                  /> %
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => toggleJobType(jt.id)} className={`w-10 h-5 rounded-full transition-colors relative ${jt.active ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${jt.active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => removeJobType(jt.id)} className="text-[11px] text-red-500 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-blue-50 rounded-lg p-3 text-[11px] text-blue-700">
        <p>※ 국민연금·건강보험 요율은 공단 고시 기준이며, 시스템에서 자동 반영됩니다.</p>
        <p>※ <strong>고용보험 요율</strong>은 관리자가 직접 입력하여 설정합니다.</p>
        <p>※ <strong>산재보험 요율</strong>은 업종별로 다르게 적용됩니다. 부서에 업종을 지정하면 해당 부서 사원에게 자동 적용됩니다.</p>
      </div>

      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
      </div>
    </div>
  )
}

// ── 급여지급일 설정 ──
function PayDayView() {
  const [payMonth, setPayMonth] = useState('익월')
  const [payDay, setPayDay] = useState(25)
  const [isLastDay, setIsLastDay] = useState(false)

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">급여지급일 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">매월 급여 지급일을 설정합니다</p>

      <div className="space-y-5">
        <div className="flex items-center gap-4 text-[13px]">
          <span className="text-gray-600 w-32">급여지급일 지정</span>
          <select value={payMonth} onChange={e => setPayMonth(e.target.value)} className="text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="당월">당월</option>
            <option value="익월">익월</option>
          </select>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <span className="text-gray-600 w-32" />
          <input type="number" min={1} max={31} value={isLastDay ? '' : payDay} onChange={e => setPayDay(Number(e.target.value))} disabled={isLastDay} placeholder="말" className={`text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none w-16 text-right ${isLastDay ? 'bg-gray-100 text-gray-400' : ''}`} />
          <span className="text-[12px] text-gray-600">일</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={isLastDay} onChange={e => setIsLastDay(e.target.checked)} className="w-3.5 h-3.5 accent-[#1D9E75]" />
            <span className="text-[12px] text-gray-600">말일</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
      </div>
    </div>
  )
}

// ── 법정수당 산정 ──
function LegalAllowanceView() {
  const [items, setItems] = useState([
    { name: '연장근로수당', desc: '1일 8시간 근무하거나 1주 40시간 초과하여 근무하는 경우', formula: '연장근로시간 수 x 시간당 통상임금 x 50%', active: true },
    { name: '야간근로수당', desc: '오후 10시(22시)부터 오전 06시까지 근로를 제공한 경우', formula: '야간근로시간 수 x 시간당 통상임금 x 50%', active: true },
    { name: '휴일근로수당', desc: '휴일 날 근로를 제공한 경우', formula: '휴일근로시간 수 x 시간당 통상임금 x 50%', active: true },
    { name: '연차수당', desc: '연차휴가를 사용하지 않은 경우', formula: '1일 통상임금 x 미사용 연차 휴가일수', active: true },
  ])
  const toggle = (name: string) => setItems(prev => prev.map(i => i.name === name ? { ...i, active: !i.active } : i))

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
            <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{item.name}</td>
              <td className="px-3 py-3 text-gray-600">{item.desc}</td>
              <td className="px-3 py-3 text-gray-600">{item.formula}</td>
              <td className="px-3 py-3 text-center w-28">
                <button onClick={() => toggle(item.name)} className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${item.active ? 'bg-[#1D9E75] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {item.active ? '사용' : '미사용'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">저장</button>
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
