import { useState, useEffect, useMemo } from 'react'
import {
  fetchKpiTemplates,
  createKpiTemplate,
  updateKpiTemplate,
  deleteKpiTemplate,
  type KpiTemplateResponse,
  type KpiTemplateRequest,
  type KpiDirection,
} from '../../../api/kpiTemplate'
import { fetchKpiOptionBundle, type KpiOptionItem } from '../../../api/kpiOption'
import { departmentApi, gradeApi, type DepartmentTreeResponse, type GradeResponse } from '../../../api/org'
import Pagination from '../../../components/Pagination'
import { useActiveStages } from '../../../hooks/useActiveStages'

const flattenAllDepts = (tree: DepartmentTreeResponse[]): DepartmentTreeResponse[] => {
  const out: DepartmentTreeResponse[] = []
  const walk = (ns: DepartmentTreeResponse[]) => {
    for (const n of ns) {
      out.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(tree)
  return out
}

const KPI_PAGE_SIZE = 10

// 방향 라벨
const directionLabel: Record<KpiDirection, string> = {
  UP: '증가형',
  DOWN: '감소형',
  MAINTAIN: '유지형',
}

interface FormState {
  deptId: number | null
  gradeId: number | null   // null = 해당 부서 전 직급 공통
  categoryOptionId: number | null
  unitOptionId: number | null
  name: string
  description: string
  direction: KpiDirection
}

const emptyForm: FormState = {
  deptId: null,
  gradeId: null,
  categoryOptionId: null,
  unitOptionId: null,
  name: '',
  description: '',
  direction: 'UP',
}

export default function KpiTemplate() {
  // 서버 데이터
  const [items, setItems] = useState<KpiTemplateResponse[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<KpiOptionItem[]>([])
  const [units, setUnits] = useState<KpiOptionItem[]>([])
  const [departments, setDepartments] = useState<DepartmentTreeResponse[]>([])
  const [grades, setGrades] = useState<GradeResponse[]>([])

  // 조직도 전체 부서를 평탄화 (KPI 적용부서 depth 필터 없음 — 모든 부서 노출)
  const flatDepartments = useMemo(
    () => flattenAllDepts(departments),
    [departments],
  )

  // 필터
  const [filterDeptId, setFilterDeptId] = useState<number | ''>('')
  const [filterGradeId, setFilterGradeId] = useState<number | ''>('')
  const [filterCategoryId, setFilterCategoryId] = useState<number | ''>('')
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const currentYear = new Date().getFullYear()
  const [filterYearFrom, setFilterYearFrom] = useState<number>(currentYear)
  const [filterYearTo, setFilterYearTo] = useState<number>(currentYear)
  // 연도 셀렉트 옵션 — 현재년도 기준 -5 ~ +1
  const yearOptions: number[] = []
  for (let y = currentYear - 5; y <= currentYear + 1; y++) yearOptions.push(y)
  const [page, setPage] = useState(1)

  // 폼
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 목표등록 단계가 열려있는 동안에는 KPI 마스터를 잠금 — 사원이 이미 선택한 지표가 바뀌면 안 됨
  const { isOpen } = useActiveStages()
  const isGoalEntryOpen = isOpen('GOAL_ENTRY')

  // 초기 로드: 옵션 + 부서 + 직급 (인사통합 직급 마스터)
  useEffect(() => {
    Promise.all([
      fetchKpiOptionBundle(),
      departmentApi.getTree().then(r => r.data).catch(() => []),
      gradeApi.getList().then(r => r.data).catch(() => []),
    ])
      .then(([bundle, deptTree, gradeList]) => {
        setCategories(bundle.categories)
        setUnits(bundle.units)
        setDepartments(deptTree)
        setGrades(gradeList)
      })
      .catch((e: any) => {
        console.error('[KpiTemplate] options/depts/grades failed', e)
        setError(e?.response?.data?.message || 'KPI 옵션을 불러오지 못했습니다.')
        setLoading(false)
      })
  }, [])

  // 검색 debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(t)
  }, [keyword])

  // 필터/페이지 변경 시 목록 재조회
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchKpiTemplates({
      deptId: filterDeptId === '' ? undefined : filterDeptId,
      gradeId: filterGradeId === '' ? undefined : filterGradeId,
      // 카테고리는 백엔드 KpiTemplateController 가 문자열(category)로 받음 → id로 라벨 찾아서 전달
      category: filterCategoryId === '' ? undefined : categories.find(c => c.id === filterCategoryId)?.label,
      keyword: debouncedKeyword || undefined,
      yearFrom: filterYearFrom,
      yearTo: filterYearTo,
      page: page - 1,
      size: KPI_PAGE_SIZE,
    })
      .then(p => {
        setItems(p.content)
        setTotal(p.totalElements)
      })
      .catch((e: any) => {
        console.error('[KpiTemplate] list failed', e)
        setError(e?.response?.data?.message || '지표 목록을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [filterDeptId, filterGradeId, filterCategoryId, debouncedKeyword, filterYearFrom, filterYearTo, page, categories])

  // 검색/필터 변경 시 페이지 초기화
  useEffect(() => { setPage(1) }, [filterDeptId, filterGradeId, filterCategoryId, debouncedKeyword, filterYearFrom, filterYearTo])

  const openAdd = () => {
    if (isGoalEntryOpen) return
    setEditingId(null)
    // 기본값: 첫 옵션으로 프리필 (직급은 기본 "전 직급 공통" = null)
    setForm({
      deptId: flatDepartments[0]?.id ?? null,
      gradeId: null,
      categoryOptionId: categories[0]?.id ?? null,
      unitOptionId: units[0]?.id ?? null,
      name: '',
      description: '',
      direction: 'UP',
    })
    setShowForm(true)
    setError(null)
  }

  const openEdit = (t: KpiTemplateResponse) => {
    if (isGoalEntryOpen) return
    setEditingId(t.kpiId)
    setForm({
      deptId: t.deptId,
      gradeId: t.gradeId,
      categoryOptionId: t.categoryOptionId,
      unitOptionId: t.unitOptionId,
      name: t.name,
      description: t.description,
      direction: t.direction,
    })
    setShowForm(true)
    setError(null)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const canSave =
    form.deptId !== null &&
    form.categoryOptionId !== null &&
    form.unitOptionId !== null &&
    form.name.trim().length > 0 &&
    form.description.trim().length > 0

  const handleSave = async () => {
    if (!canSave || isGoalEntryOpen) return
    const payload: KpiTemplateRequest = {
      deptId: form.deptId!,
      gradeId: form.gradeId,
      categoryOptionId: form.categoryOptionId!,
      unitOptionId: form.unitOptionId!,
      name: form.name.trim(),
      description: form.description.trim(),
      direction: form.direction,
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId !== null) {
        const updated = await updateKpiTemplate(editingId, payload)
        setItems(prev => prev.map(it => it.kpiId === editingId ? updated : it))
      } else {
        const created = await createKpiTemplate(payload)
        // 신규는 맨 앞에
        setItems(prev => [created, ...prev])
        setTotal(t => t + 1)
        setPage(1)
      }
      closeForm()
    } catch (e: any) {
      console.error('[KpiTemplate] save failed', e)
      setError(e?.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (isGoalEntryOpen) return
    if (!confirm('이 지표를 삭제하시겠습니까?')) return
    setSaving(true)
    setError(null)
    try {
      await deleteKpiTemplate(id)
      setItems(prev => prev.filter(it => it.kpiId !== id))
      setTotal(t => Math.max(0, t - 1))
    } catch (e: any) {
      console.error('[KpiTemplate] delete failed', e)
      setError(e?.response?.data?.message || '삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="p-4 bg-[#f2faf6] border border-[#d4ecdd] rounded-lg text-[12px] text-gray-700">
        <div className="font-semibold text-[#1D9E75] mb-1">KPI 지표 마스터</div>
        사원은 목표 등록 시 여기 등록된 지표를 선택해서 목표값만 입력합니다. 방향·단위는 지표마다 고정됩니다.
      </div>

      {isGoalEntryOpen && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-800 flex items-center gap-2">
          <i className="fa-solid fa-lock" />
          목표등록 단계 진행 중에는 KPI 지표를 추가·수정·삭제할 수 없습니다. 단계 종료 후 다시 시도해주세요.
        </div>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select
            value={filterDeptId}
            onChange={e => setFilterDeptId(e.target.value === '' ? '' : Number(e.target.value))}
            className="border border-gray-200 rounded-md px-3 py-2 text-[12px] outline-none"
          >
            <option value="">전체 부서</option>
            {flatDepartments.map(d => <option key={d.id} value={d.id}>{d.deptName}</option>)}
          </select>
          <select
            value={filterGradeId}
            onChange={e => setFilterGradeId(e.target.value === '' ? '' : Number(e.target.value))}
            className="border border-gray-200 rounded-md px-3 py-2 text-[12px] outline-none"
          >
            <option value="">전체 직급</option>
            {grades.map(g => <option key={g.gradeId} value={g.gradeId}>{g.gradeName}</option>)}
          </select>
          <select
            value={filterCategoryId}
            onChange={e => setFilterCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            className="border border-gray-200 rounded-md px-3 py-2 text-[12px] outline-none"
          >
            <option value="">전체 카테고리</option>
            {categories.filter(c => c.id !== null).map(c => <option key={c.id!} value={c.id!}>{c.label}</option>)}
          </select>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="지표명·설명 검색"
            className="border border-gray-200 rounded-md px-3 py-2 text-[12px] outline-none w-56"
          />
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200 text-[12px] text-gray-500">
            <span className="mr-1">사내평균</span>
            <select
              value={filterYearFrom}
              onChange={e => setFilterYearFrom(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-2 py-2 text-[12px] outline-none"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span>~</span>
            <select
              value={filterYearTo}
              onChange={e => setFilterYearTo(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-2 py-2 text-[12px] outline-none"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <span className="text-[12px] text-gray-400">총 {total}건</span>
        </div>
        <button
          onClick={openAdd}
          disabled={isGoalEntryOpen || flatDepartments.length === 0 || categories.length === 0 || units.length === 0}
          title={isGoalEntryOpen ? '목표등록 단계 진행 중에는 추가할 수 없습니다.' : undefined}
          className="px-3 py-2 bg-[#1D9E75] text-white rounded-md text-[12px] font-medium hover:bg-[#178a65] disabled:opacity-50 disabled:cursor-not-allowed"
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
              <th className="px-3 py-2 text-left w-24">부서</th>
              <th className="px-3 py-2 text-left w-20">직급</th>
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
            {loading ? (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-gray-400">
                <i className="fas fa-spinner fa-spin mr-2" />불러오는 중...
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-gray-400">등록된 지표가 없습니다.</td></tr>
            ) : (
              items.map(t => (
                <tr key={t.kpiId} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">{t.kpiId}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#eff6ff] text-[#3b82f6]">
                      {t.deptName}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {t.gradeName ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#fef3c7] text-[#92400e]">
                        {t.gradeName}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">전 직급</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{t.categoryLabel}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{t.name}</td>
                  <td className="px-3 py-2 text-gray-500">{t.description}</td>
                  <td className="px-3 py-2 text-center">{directionLabel[t.direction]}</td>
                  <td className="px-3 py-2 text-center">{t.unitLabel}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{t.baseline ?? '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => openEdit(t)}
                      disabled={saving || isGoalEntryOpen}
                      title={isGoalEntryOpen ? '목표등록 단계 진행 중에는 수정할 수 없습니다.' : undefined}
                      className="text-[#1D9E75] hover:underline mr-2 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >수정</button>
                    <button
                      onClick={() => handleDelete(t.kpiId)}
                      disabled={saving || isGoalEntryOpen}
                      title={isGoalEntryOpen ? '목표등록 단계 진행 중에는 삭제할 수 없습니다.' : undefined}
                      className="text-red-500 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >삭제</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={KPI_PAGE_SIZE}
        onChange={setPage}
      />

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeForm}>
          <div className="bg-white rounded-lg w-[520px] p-5" onClick={e => e.stopPropagation()}>
            <div className="text-[15px] font-bold text-gray-800 mb-4">
              {editingId !== null ? 'KPI 지표 수정' : 'KPI 지표 추가'}
            </div>

            <div className="space-y-3 text-[12px]">
              <div>
                <label className="block text-gray-500 mb-1">부서</label>
                <select
                  value={form.deptId ?? ''}
                  onChange={e => setForm({ ...form, deptId: e.target.value === '' ? null : Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                >
                  <option value="" disabled>선택</option>
                  {flatDepartments.map(d => <option key={d.id} value={d.id}>{d.deptName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">직급</label>
                <select
                  value={form.gradeId ?? ''}
                  onChange={e => setForm({ ...form, gradeId: e.target.value === '' ? null : Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                >
                  <option value="">전 직급 공통</option>
                  {grades.map(g => <option key={g.gradeId} value={g.gradeId}>{g.gradeName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">카테고리</label>
                <select
                  value={form.categoryOptionId ?? ''}
                  onChange={e => setForm({ ...form, categoryOptionId: e.target.value === '' ? null : Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                >
                  <option value="" disabled>선택</option>
                  {categories.filter(c => c.id !== null).map(c => <option key={c.id!} value={c.id!}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">지표명</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  placeholder="예) 신규 고객 유치 건수"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">측정 기준 설명</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
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
                    onChange={e => setForm({ ...form, direction: e.target.value as KpiDirection })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  >
                    <option value="UP">증가형</option>
                    <option value="DOWN">감소형</option>
                    <option value="MAINTAIN">유지형</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">단위</label>
                  <select
                    value={form.unitOptionId ?? ''}
                    onChange={e => setForm({ ...form, unitOptionId: e.target.value === '' ? null : Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 outline-none"
                  >
                    <option value="" disabled>선택</option>
                    {units.filter(u => u.id !== null).map(u => <option key={u.id!} value={u.id!}>{u.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-3 py-2 border border-gray-200 rounded-md text-[12px] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving || isGoalEntryOpen}
                className="px-3 py-2 bg-[#1D9E75] text-white rounded-md text-[12px] font-medium hover:bg-[#178a65] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
