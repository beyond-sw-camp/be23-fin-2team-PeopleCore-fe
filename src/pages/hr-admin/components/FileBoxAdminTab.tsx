import { useEffect, useMemo, useState } from 'react'
import {
  adminCapabilityApi,
  type AdminCapabilityMode,
} from '../../../api/filebox-permission'
import { gradeApi, titleApi } from '../../../api/org'

interface TargetItem {
  id: number
  name: string
  subLabel?: string
}

export default function FileBoxAdminTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<AdminCapabilityMode>('GRADE')
  const [grades, setGrades] = useState<TargetItem[]>([])
  const [titles, setTitles] = useState<TargetItem[]>([])
  const [grantedIds, setGrantedIds] = useState<Set<number>>(new Set())

  const [dirty, setDirty] = useState(false)
  const [modeSwitchTo, setModeSwitchTo] = useState<AdminCapabilityMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const targets = useMemo(() => (mode === 'GRADE' ? grades : titles), [mode, grades, titles])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: config }, { data: gradeList }, { data: titleList }] = await Promise.all([
        adminCapabilityApi.getConfig(),
        gradeApi.getList(),
        titleApi.getList(),
      ])
      setGrades(gradeList.map(g => ({ id: g.gradeId, name: g.gradeName })))
      setTitles(
        titleList.map(t => ({
          id: t.titleId,
          name: t.titleName,
          subLabel: t.deptName ?? '전사',
        })),
      )
      setMode(config.mode)
      setGrantedIds(new Set(config.grantedTargetIds))
      setDirty(false)
    } catch (e) {
      console.error('[FileBoxAdminTab] config 조회 실패', e)
      setError('설정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleTarget = (id: number) => {
    setGrantedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setDirty(true)
  }

  const confirmModeSwitch = () => {
    if (!modeSwitchTo) return
    setMode(modeSwitchTo)
    setGrantedIds(new Set())
    setDirty(true)
    setModeSwitchTo(null)
  }

  const save = async () => {
    if (grantedIds.size === 0) {
      setError('최소 한 개 이상의 대상을 선택해야 합니다. (0-admin 상태 방지)')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { data } = await adminCapabilityApi.updateConfig({
        mode,
        grantedTargetIds: Array.from(grantedIds),
      })
      setMode(data.mode)
      setGrantedIds(new Set(data.grantedTargetIds))
      setDirty(false)
    } catch (e) {
      console.error('[FileBoxAdminTab] config 저장 실패', e)
      setError('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400 text-[13px]">
        <i className="fa-solid fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[18px] font-bold text-gray-800 mb-1">파일함 Admin 권한</h1>
        <p className="text-[12px] text-gray-500">
          파일함을 생성할 수 있는 권한을 <b>직급 또는 직책</b> 중 한 축에 배타적으로 부여합니다.
          Admin 권한을 가진 사원이 파일함을 만들면 해당 파일함의 Owner가 되어 멤버별 ACL을 관리합니다.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-semibold text-gray-800">권한 부여 기준</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              모드를 전환하면 현재 선택된 대상이 모두 초기화됩니다.
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['GRADE', 'TITLE'] as const).map(m => (
              <button
                key={m}
                onClick={() => {
                  if (m === mode) return
                  if (grantedIds.size > 0 || dirty) {
                    setModeSwitchTo(m)
                  } else {
                    setMode(m)
                  }
                }}
                className={`px-4 py-1.5 text-[12px] rounded-md transition-colors ${
                  mode === m
                    ? 'bg-white text-[#1D9E75] font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'GRADE' ? '직급' : '직책'}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-gray-500 bg-gray-50 rounded px-3 py-2">
          <i className="fa-solid fa-circle-info mr-1.5 text-gray-400" />
          {mode === 'GRADE'
            ? '직급을 기준으로 Admin 권한이 부여됩니다. 선택된 직급에 해당하는 모든 사원이 파일함을 생성할 수 있습니다.'
            : '직책을 기준으로 Admin 권한이 부여됩니다. 직책은 배정받지 않은 사원이 있을 수 있으니 유의하세요.'}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="text-[13px] font-semibold text-gray-800">
            {mode === 'GRADE' ? '직급 목록' : '직책 목록'}
          </div>
          <div className="text-[11px] text-gray-500">선택 {grantedIds.size}건</div>
        </div>

        {targets.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-gray-400">
            {mode === 'GRADE' ? '등록된 직급이 없습니다.' : '등록된 직책이 없습니다.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {targets.map(t => {
              const checked = grantedIds.has(t.id)
              return (
                <label
                  key={t.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                    checked ? 'bg-[#F1FAF5]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTarget(t.id)}
                      className="w-4 h-4 accent-[#1D9E75]"
                    />
                    <span className="text-[13px] text-gray-800">{t.name}</span>
                  </div>
                  {t.subLabel && (
                    <span className="text-[11px] text-gray-500">{t.subLabel}</span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          <i className="fa-solid fa-triangle-exclamation mr-1.5" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={load}
          disabled={!dirty || saving}
          className="px-4 py-2 text-[12px] text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          변경 취소
        </button>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-5 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {modeSwitchTo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setModeSwitchTo(null)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[min(360px,calc(100vw-24px))] p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-bold text-gray-800 mb-2">
              {modeSwitchTo === 'GRADE' ? '직급 기준으로 전환' : '직책 기준으로 전환'}
            </h3>
            <p className="text-[12px] text-gray-500 mb-5 whitespace-pre-line">
              {`현재 ${mode === 'GRADE' ? '직급' : '직책'} 선택 항목이 모두 초기화됩니다.\n저장 전까지는 적용되지 않습니다.`}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setModeSwitchTo(null)}
                className="px-5 py-2 text-[12px] text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={confirmModeSwitch}
                className="px-5 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90"
              >
                전환
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
