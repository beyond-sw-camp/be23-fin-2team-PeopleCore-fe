import { useEffect, useMemo, useState } from 'react'
import { titleApi } from '../../../api/org'
import type { TitleResponse } from '../../../api/org'
import { capabilityApi } from '../../../api/capability'
import type { Capability } from '../../../api/capability'

const CATEGORY_LABELS: Record<string, string> = {
  FILE: '파일함',
}

export default function TitleCapabilityTab() {
  const [titles, setTitles] = useState<TitleResponse[]>([])
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [selectedTitleId, setSelectedTitleId] = useState<number | null>(null)
  const [grantedCodes, setGrantedCodes] = useState<Set<string>>(new Set())
  const [originalCodes, setOriginalCodes] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let pending = 2
    const done = () => {
      if (--pending === 0) setIsLoading(false)
    }
    titleApi.getList()
      .then(({ data }) => {
        console.log('[TitleCapabilityTab] titles:', data)
        setTitles(data.filter((t) => t.titleCode !== '000' && t.titleName !== '미배정'))
      })
      .catch((err) => console.error('titleApi.getList failed', err))
      .finally(done)
    capabilityApi.listAll()
      .then(({ data }) => setCapabilities(data))
      .catch((err) => console.error('capabilityApi.listAll failed', err))
      .finally(done)
  }, [])

  useEffect(() => {
    if (selectedTitleId == null) return
    capabilityApi.listByTitle(selectedTitleId).then(({ data }) => {
      const set = new Set(data)
      setGrantedCodes(set)
      setOriginalCodes(new Set(set))
    })
  }, [selectedTitleId])

  const groupedCapabilities = useMemo(() => {
    return capabilities.reduce((acc, cap) => {
      (acc[cap.category] ??= []).push(cap)
      return acc
    }, {} as Record<string, Capability[]>)
  }, [capabilities])

  const groupedTitles = useMemo(() => {
    const byName = new Map<string, TitleResponse[]>()
    for (const t of titles) {
      const arr = byName.get(t.titleName) ?? []
      arr.push(t)
      byName.set(t.titleName, arr)
    }
    for (const arr of byName.values()) {
      arr.sort((a, b) => {
        if (a.deptId == null && b.deptId != null) return -1
        if (a.deptId != null && b.deptId == null) return 1
        return (a.deptName ?? '').localeCompare(b.deptName ?? '', 'ko')
      })
    }
    return [...byName.entries()].sort(([a], [b]) => a.localeCompare(b, 'ko'))
  }, [titles])

  const isDirty = useMemo(() => {
    if (grantedCodes.size !== originalCodes.size) return true
    for (const code of grantedCodes) if (!originalCodes.has(code)) return true
    return false
  }, [grantedCodes, originalCodes])

  const handleSelectTitle = (titleId: number) => {
    if (isDirty && !window.confirm('저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return
    setSelectedTitleId(titleId)
  }

  const handleToggle = (code: string) => {
    setGrantedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const handleSave = async () => {
    if (selectedTitleId == null) return
    const toGrant: string[] = []
    const toRevoke: string[] = []
    for (const code of grantedCodes) if (!originalCodes.has(code)) toGrant.push(code)
    for (const code of originalCodes) if (!grantedCodes.has(code)) toRevoke.push(code)

    setIsSaving(true)
    try {
      await Promise.all([
        ...toGrant.map((code) => capabilityApi.grant(selectedTitleId, code)),
        ...toRevoke.map((code) => capabilityApi.revoke(selectedTitleId, code)),
      ])
      setOriginalCodes(new Set(grantedCodes))
    } catch {
      window.alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyToGroup = async () => {
    if (selectedTitleId == null) return
    const selected = titles.find((t) => t.titleId === selectedTitleId)
    if (!selected) return
    const group = titles.filter((t) => t.titleName === selected.titleName)
    if (group.length < 2) return
    if (!window.confirm(`같은 이름 "${selected.titleName}" ${group.length}개 직책에 현재 권한 설정을 일괄 적용하시겠습니까?`)) return

    setIsSaving(true)
    try {
      for (const t of group) {
        let original: Set<string>
        if (t.titleId === selectedTitleId) {
          original = originalCodes
        } else {
          const { data } = await capabilityApi.listByTitle(t.titleId)
          original = new Set(data)
        }
        const toGrant: string[] = []
        const toRevoke: string[] = []
        for (const code of grantedCodes) if (!original.has(code)) toGrant.push(code)
        for (const code of original) if (!grantedCodes.has(code)) toRevoke.push(code)

        await Promise.all([
          ...toGrant.map((code) => capabilityApi.grant(t.titleId, code)),
          ...toRevoke.map((code) => capabilityApi.revoke(t.titleId, code)),
        ])
      }
      setOriginalCodes(new Set(grantedCodes))
    } catch {
      window.alert('일괄 적용 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <i className="fa-solid fa-spinner fa-spin mr-2" /> 로딩 중...
      </div>
    )
  }

  const selectedTitle = titles.find((t) => t.titleId === selectedTitleId)
  const selectedGroupSize = selectedTitle
    ? titles.filter((t) => t.titleName === selectedTitle.titleName).length
    : 0

  return (
    <div className="flex gap-4 h-full">
      {/* 직책 목록 */}
      <div className="w-[260px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-[13px] font-semibold">직책 목록</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">권한을 부여할 직책을 선택하세요</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {titles.length === 0 && (
            <div className="p-4 text-[12px] text-gray-400">등록된 직책이 없습니다.</div>
          )}
          {groupedTitles.map(([name, group]) => {
            if (group.length === 1) {
              const title = group[0]
              return (
                <div
                  key={title.titleId}
                  onClick={() => handleSelectTitle(title.titleId)}
                  className={`px-4 py-2.5 cursor-pointer border-b border-gray-100 transition-colors ${
                    selectedTitleId === title.titleId
                      ? 'bg-[#E1F5EE] text-[#1D9E75]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-[13px] font-medium">{title.titleName}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {title.deptName ? title.deptName : '전사 공용'}
                  </div>
                </div>
              )
            }
            return (
              <div key={name} className="border-b border-gray-100">
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-gray-700">{name}</span>
                  <span className="text-[10.5px] text-gray-400">{group.length}개 부서</span>
                </div>
                {group.map((title) => (
                  <div
                    key={title.titleId}
                    onClick={() => handleSelectTitle(title.titleId)}
                    className={`pl-7 pr-4 py-2 cursor-pointer border-t border-gray-100 transition-colors ${
                      selectedTitleId === title.titleId
                        ? 'bg-[#E1F5EE] text-[#1D9E75]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-[12.5px]">
                      {title.deptName ? title.deptName : '전사 공용'}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* 권한 설정 영역 */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        {selectedTitle == null ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-[13px]">
            좌측에서 직책을 선택하세요
          </div>
        ) : (
          <>
            <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold">
                  {selectedTitle.titleName}
                  <span className="text-[11px] text-gray-400 ml-2 font-normal">
                    {selectedTitle.deptName ? selectedTitle.deptName : '전사 공용'}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isDirty ? '저장하지 않은 변경사항이 있습니다.' : '변경사항 없음'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedGroupSize > 1 && (
                  <button
                    onClick={handleApplyToGroup}
                    disabled={isSaving}
                    className={`px-3 py-1.5 text-[12px] rounded-lg font-medium border transition-colors ${
                      isSaving
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-[#1D9E75] text-[#1D9E75] hover:bg-[#E1F5EE]'
                    }`}
                    title={`같은 이름 ${selectedGroupSize}개 직책 전체에 현재 권한 설정을 복사합니다.`}
                  >
                    같은 이름 {selectedGroupSize}개에 일괄 적용
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className={`px-4 py-1.5 text-[12px] rounded-lg font-medium transition-colors ${
                    isDirty && !isSaving
                      ? 'bg-[#1D9E75] text-white hover:bg-[#178A65]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {Object.entries(groupedCapabilities).map(([category, caps]) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-[12px] font-semibold text-gray-700">
                      {CATEGORY_LABELS[category] ?? category}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-2">({caps.length})</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {caps.map((cap) => (
                      <label
                        key={cap.code}
                        className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={grantedCodes.has(cap.code)}
                          onChange={() => handleToggle(cap.code)}
                          className="mt-0.5 accent-[#1D9E75]"
                        />
                        <div className="flex-1">
                          <div className="text-[12.5px] text-gray-800">{cap.description}</div>
                          <div className="text-[10.5px] text-gray-400 mt-0.5 font-mono">
                            {cap.code}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {capabilities.length === 0 && (
                <div className="text-center text-gray-400 text-[12px] py-8">
                  등록된 권한이 없습니다.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
