import { useState, useEffect } from 'react'
import {
  fetchKpiOptionBundle,
  saveKpiOptionBundle,
  resetKpiOptionBundle,
  type KpiOptionBundle,
  type KpiOptionItem,
} from '../../api/kpiOption'

interface SectionSimpleProps {
  title: string
  description: string
  items: KpiOptionItem[]
  onChange: (next: KpiOptionItem[]) => void
  placeholder?: string
}

function SectionSimple({ title, description, items, onChange, placeholder }: SectionSimpleProps) {
  const handleUpdate = (idx: number, label: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, label } : it)))
  }
  const handleRemove = (idx: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== idx))
  }
  const handleAdd = () => onChange([...items, { id: null, label: '' }])

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
              <tr key={it.id ?? `new-${i}`} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    value={it.label}
                    onChange={e => handleUpdate(i, e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px]"
                    placeholder={placeholder ?? '항목명'}
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
  const [bundle, setBundle] = useState<KpiOptionBundle | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 최초 로드
  useEffect(() => {
    fetchKpiOptionBundle()
      .then(b => { setBundle(b); setError(null) })
      .catch(e => {
        console.error('[KpiOptionManagement] fetch failed', e)
        setError(e?.response?.data?.message || 'KPI 옵션을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (patch: Partial<KpiOptionBundle>) => {
    setBundle(b => (b ? { ...b, ...patch } : b))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!bundle) return
    const cleaned: KpiOptionBundle = {
      categories: bundle.categories.filter(c => c.label.trim()),
      units: bundle.units.filter(u => u.label.trim()),
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await saveKpiOptionBundle(cleaned)
      setBundle(saved)
      setDirty(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[KpiOptionManagement] save failed', e)
      setError(e?.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    setError(null)
    try {
      const reset = await resetKpiOptionBundle()
      setBundle(reset)
      setDirty(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[KpiOptionManagement] reset failed', e)
      setError(e?.response?.data?.message || '복원에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">KPI 옵션 관리</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">KPI 옵션 관리</h1>
        <p className="text-xs text-gray-400 mt-1">
          평가 시스템에서 공용으로 사용하는 드롭다운 항목(카테고리·단위)을 관리합니다.
          변경 내용은 KPI 지표 등록 화면에 즉시 반영됩니다.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {loading || !bundle ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-[13px] text-gray-400">
          <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
        </div>
      ) : (
        <>
          <div className="space-y-5">
            <SectionSimple
              title="① 카테고리"
              description="KPI 지표 분류 (예: 업무성과, 역량개발, 조직기여)"
              items={bundle.categories}
              onChange={v => update({ categories: v })}
              placeholder="예: 업무성과"
            />

            <SectionSimple
              title="② 측정 단위"
              description="KPI 목표값의 단위 (예: %, 건, 원, 시간)"
              items={bundle.units}
              onChange={v => update({ units: v })}
              placeholder="예: %"
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
                disabled={saving}
                className="px-4 py-2 border border-gray-200 rounded-md text-[12px] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                기본값 복원
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className={`px-4 py-2 rounded-md text-[12px] font-medium text-white ${
                  dirty && !saving ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
