import { useState, useMemo, useEffect } from 'react'
import {
  kpiTemplates as seedTemplates,
  type KpiTemplate,
} from '../employee/kpiTemplates'
import { useKpiOptions } from '../../../stores/kpiOptionsStore'
import Pagination from '../../../components/Pagination'

const KPI_PAGE_SIZE = 10

type FormState = Omit<KpiTemplate, 'id'>

const emptyForm: FormState = {
  department: 'COMMON',
  category: '업무성과',
  name: '',
  description: '',
  direction: 'UP',
  unit: 'PERCENT',
  baseline: undefined,
}

export default function KpiTemplate() {
  const options = useKpiOptions()
  const [items, setItems] = useState<KpiTemplate[]>(seedTemplates)
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterDept, setFilterDept] = useState<string>('ALL')
  const [keyword, setKeyword] = useState('')

  // 옵션 코드 → 라벨 매핑 (store 변경 시 자동 갱신)
  const directionLabel = useMemo(
    () => Object.fromEntries(options.directions.map(o => [o.code, o.label])),
    [options.directions],
  )
  const unitLabel = useMemo(
    () => Object.fromEntries(options.units.map(o => [o.code, o.label])),
    [options.units],
  )
  const departmentLabel = useMemo(
    () => Object.fromEntries(options.departments.map(o => [o.code, o.label])),
    [options.departments],
  )
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (filterCategory !== 'ALL' && it.category !== filterCategory) return false
      if (filterDept !== 'ALL' && it.department !== filterDept) return false
      if (keyword && !it.name.includes(keyword) && !it.description.includes(keyword)) return false
      return true
    })
  }, [items, filterCategory, filterDept, keyword])

  // 페이지네이션
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [filterCategory, filterDept, keyword])
  const paged = filtered.slice((page - 1) * KPI_PAGE_SIZE, page * KPI_PAGE_SIZE)

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (t: KpiTemplate) => {
    setEditingId(t.id)
    setForm({
      department: t.department,
      category: t.category,
      name: t.name,
      description: t.description,
      direction: t.direction,
      unit: t.unit,
      baseline: t.baseline,
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingId !== null) {
      setItems(items.map(it => (it.id === editingId ? { ...it, ...form } : it)))
    } else {
      const nextId = Math.max(0, ...items.map(i => i.id)) + 1
      setItems([...items, { id: nextId, ...form }])
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = (id: number) => {
    if (!confirm('이 지표를 삭제하시겠습니까?')) return
    setItems(items.filter(it => it.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="p-4 bg-[#f2faf6] border border-[#d4ecdd] rounded-lg text-[12px] text-gray-700">
        <div className="font-semibold text-[#1D9E75] mb-1">KPI 지표 마스터</div>
        사원은 목표 등록 시 여기 등록된 지표를 선택해서 목표값만 입력합니다. 방향·단위·주기는 지표마다 고정됩니다.
      </div>

      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-[12px] outline-none"
          >
            <option value="ALL">전체 부서</option>
            {options.departments.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-[12px] outline-none"
          >
            <option value="ALL">전체 카테고리</option>
            {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="지표명·설명 검색"
            className="border border-gray-200 rounded-md px-3 py-2 text-[12px] outline-none w-56"
          />
          <span className="text-[12px] text-gray-400">총 {filtered.length}건</span>
        </div>
        <button
          onClick={openAdd}
          className="px-3 py-2 bg-[#1D9E75] text-white rounded-md text-[12px] font-medium hover:bg-[#178a65]"
        >
          + 지표 추가
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left w-14">ID</th>
              <th className="px-3 py-2 text-left w-20">부서</th>
              <th className="px-3 py-2 text-left w-24">카테고리</th>
              <th className="px-3 py-2 text-left">지표명</th>
              <th className="px-3 py-2 text-left">설명</th>
              <th className="px-3 py-2 text-center w-16">방향</th>
              <th className="px-3 py-2 text-center w-16">단위</th>
              <th className="px-3 py-2 text-right w-20">사내평균</th>
              <th className="px-3 py-2 text-center w-24">관리</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(t => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-400">{t.id}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    t.department === 'COMMON'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-[#eff6ff] text-[#3b82f6]'
                  }`}>
                    {departmentLabel[t.department]}
                  </span>
                </td>
                <td className="px-3 py-2">{t.category}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{t.name}</td>
                <td className="px-3 py-2 text-gray-500">{t.description}</td>
                <td className="px-3 py-2 text-center">{directionLabel[t.direction]}</td>
                <td className="px-3 py-2 text-center">{unitLabel[t.unit]}</td>
                <td className="px-3 py-2 text-right text-gray-500">{t.baseline ?? '-'}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => openEdit(t)} className="text-[#1D9E75] hover:underline mr-2">수정</button>
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-gray-400">등록된 지표가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={filtered.length}
        pageSize={KPI_PAGE_SIZE}
        onChange={setPage}
      />

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg w-[520px] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-[15px] font-bold text-gray-800 mb-4">
              {editingId !== null ? 'KPI 지표 수정' : 'KPI 지표 추가'}
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">부서</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value as KpiTemplate['department'] })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  >
                    {options.departments.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">카테고리</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as KpiTemplate['category'] })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  >
                    {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">지표명</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  placeholder="예) 신규 고객 유치 건수"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">측정 기준 설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none resize-none"
                  placeholder="어떤 기준으로 측정하는지 간단히 작성"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">방향</label>
                  <select
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value as KpiTemplate['direction'] })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  >
                    {options.directions.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">단위</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value as KpiTemplate['unit'] })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  >
                    {options.units.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
                  </select>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 border border-gray-200 rounded-md text-[12px] text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-[#1D9E75] text-white rounded-md text-[12px] font-medium hover:bg-[#178a65]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
