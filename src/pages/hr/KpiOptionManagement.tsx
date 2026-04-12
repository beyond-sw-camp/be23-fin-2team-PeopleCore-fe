import { useState, useEffect } from 'react'
import {
  useKpiOptions,
  setKpiOptions,
  resetKpiOptions,
  type KpiOptionsState,
  type CodeOption,
} from '../../stores/kpiOptionsStore'

type CodeField = 'departments' | 'directions' | 'units'

interface SectionCodeProps {
  title: string
  description: string
  field: CodeField
  items: CodeOption[]
  onChange: (next: CodeOption[]) => void
}

function SectionCode({ title, description, items, onChange }: SectionCodeProps) {
  const handleUpdate = (idx: number, patch: Partial<CodeOption>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  const handleRemove = (idx: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== idx))
  }
  const handleAdd = () => {
    onChange([...items, { code: '', label: '' }])
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-gray-800">{title}</h3>
        <span className="text-[11px] text-gray-400">총 {items.length}개</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">{description}</p>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left w-40">코드 (저장값)</th>
              <th className="px-3 py-2 text-left">표시 라벨 (화면용)</th>
              <th className="px-3 py-2 text-center w-16">삭제</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    value={it.code}
                    onChange={e => handleUpdate(i, { code: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px] font-mono"
                    placeholder="예: UP"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={it.label}
                    onChange={e => handleUpdate(i, { label: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px]"
                    placeholder="예: 상향"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleRemove(i)}
                    disabled={items.length <= 1}
                    className="text-[#ef4444] hover:underline disabled:text-gray-300 disabled:no-underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">항목이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAdd}
        className="mt-3 px-3 py-1.5 border border-dashed border-[#1D9E75] text-[#1D9E75] rounded-md text-[12px] hover:bg-[#f2faf6]"
      >
        + 항목 추가
      </button>
    </div>
  )
}

interface SectionSimpleProps {
  title: string
  description: string
  items: string[]
  onChange: (next: string[]) => void
}

function SectionSimple({ title, description, items, onChange }: SectionSimpleProps) {
  const handleUpdate = (idx: number, value: string) => {
    onChange(items.map((it, i) => (i === idx ? value : it)))
  }
  const handleRemove = (idx: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== idx))
  }
  const handleAdd = () => onChange([...items, ''])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-gray-800">{title}</h3>
        <span className="text-[11px] text-gray-400">총 {items.length}개</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">{description}</p>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">항목명</th>
              <th className="px-3 py-2 text-center w-16">삭제</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    value={it}
                    onChange={e => handleUpdate(i, e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px]"
                    placeholder="예: 업무성과"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleRemove(i)}
                    disabled={items.length <= 1}
                    className="text-[#ef4444] hover:underline disabled:text-gray-300 disabled:no-underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">항목이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAdd}
        className="mt-3 px-3 py-1.5 border border-dashed border-[#1D9E75] text-[#1D9E75] rounded-md text-[12px] hover:bg-[#f2faf6]"
      >
        + 항목 추가
      </button>
    </div>
  )
}

export default function KpiOptionManagement() {
  const saved = useKpiOptions()
  const [draft, setDraft] = useState<KpiOptionsState>(saved)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!dirty) setDraft(saved)
  }, [saved, dirty])

  const update = (patch: Partial<KpiOptionsState>) => {
    setDraft(d => ({ ...d, ...patch }))
    setDirty(true)
  }

  const handleSave = () => {
    // 빈 코드/라벨 제거
    const clean: KpiOptionsState = {
      categories: draft.categories.filter(x => x.trim()),
      departments: draft.departments.filter(x => x.code.trim() && x.label.trim()),
      directions: draft.directions.filter(x => x.code.trim() && x.label.trim()),
      units: draft.units.filter(x => x.code.trim() && x.label.trim()),
    }
    setKpiOptions(clean)
    setDirty(false)
  }

  const handleReset = () => {
    resetKpiOptions()
    setDirty(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">KPI 옵션 관리</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">KPI 옵션 관리</h1>
        <p className="text-xs text-gray-400 mt-1">
          평가 시스템에서 공용으로 사용하는 드롭다운 항목(카테고리·부서·방향·단위·주기)을 관리합니다.
          변경 내용은 KPI 지표 등록 화면에 즉시 반영됩니다.
        </p>
      </div>

      <div className="space-y-5">
        <SectionSimple
          title="① 카테고리"
          description="KPI 지표 분류 (예: 업무성과, 역량개발, 조직기여)"
          items={draft.categories}
          onChange={v => update({ categories: v })}
        />

        <SectionCode
          title="② 적용 부서"
          description="KPI 지표가 적용되는 부서 (COMMON = 전사 공통). 코드는 저장용, 라벨은 화면 표시용."
          field="departments"
          items={draft.departments}
          onChange={v => update({ departments: v })}
        />

        <SectionCode
          title="③ 지표 방향"
          description="점수 상향/하향/유지 등 KPI의 목표 방향성"
          field="directions"
          items={draft.directions}
          onChange={v => update({ directions: v })}
        />

        <SectionCode
          title="④ 측정 단위"
          description="KPI 목표값의 단위 (예: %, 건, 원, 시간)"
          field="units"
          items={draft.units}
          onChange={v => update({ units: v })}
        />

      </div>

      {/* 저장 바 */}
      <div className="sticky bottom-0 mt-6 bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div className="text-[12px] text-gray-500">
          {dirty
            ? <span className="text-[#f59e0b] font-medium">● 저장되지 않은 변경사항</span>
            : '저장됨'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-md text-[12px] text-gray-600 hover:bg-gray-50"
          >
            기본값 복원
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`px-4 py-2 rounded-md text-[12px] font-medium text-white ${
              dirty ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
