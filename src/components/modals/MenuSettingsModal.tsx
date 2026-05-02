import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { SIDEBAR_MENU_ITEMS, type MenuItemConfig, type MenuKey } from '../layout/sidebarMenu'

interface MenuSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  menuVisibility: Record<string, boolean>
  onToggle: (key: string) => void
  isHRAdmin: boolean
  menuOrder: MenuKey[]
  onReorder: (order: MenuKey[]) => void
  /** true 면 menuOrder 에 포함된 메뉴만 표시 (서버 응답 기준) */
  serverControlled?: boolean
  /** 서버가 toggleable=true 로 알려준 메뉴 키 집합. 없으면 MenuItemConfig.togglable 사용 */
  toggleableKeys?: Set<MenuKey>
}

export default function MenuSettingsModal({
  isOpen,
  onClose,
  menuVisibility,
  onToggle,
  isHRAdmin,
  menuOrder,
  onReorder,
  serverControlled,
  toggleableKeys,
}: MenuSettingsModalProps) {
  const [reorderMode, setReorderMode] = useState(false)
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  if (!isOpen) return null

  const itemMap = new Map(SIDEBAR_MENU_ITEMS.map((i) => [i.key, i] as const))
  const items: MenuItemConfig[] = []
  menuOrder.forEach((k) => {
    const i = itemMap.get(k)
    if (i && (!i.requireHRAdmin || isHRAdmin)) items.push(i)
  })
  if (!serverControlled) {
    SIDEBAR_MENU_ITEMS.forEach((i) => {
      if (!menuOrder.includes(i.key) && (!i.requireHRAdmin || isHRAdmin)) items.push(i)
    })
  }
  const isTogglable = (item: MenuItemConfig) =>
    toggleableKeys ? toggleableKeys.has(item.key) : item.togglable

  const commit = (next: MenuItemConfig[]) => {
    onReorder(next.map((i) => i.key))
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    if (items[index].lockedOrder || items[target].lockedOrder) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  const handleDragStart = (index: number) => (e: DragEvent<HTMLDivElement>) => {
    if (items[index].lockedOrder) {
      e.preventDefault()
      return
    }
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', String(index))
    } catch {
      /* Firefox requires setData */
    }
  }

  const handleDragOver = (index: number) => (e: DragEvent<HTMLDivElement>) => {
    if (dragIndexRef.current === null) return
    if (items[index].lockedOrder) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) setDragOverIndex(index)
  }

  const handleDrop = (index: number) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const from = dragIndexRef.current
    dragIndexRef.current = null
    setDragOverIndex(null)
    if (from === null || from === index) return
    if (items[from].lockedOrder || items[index].lockedOrder) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    commit(next)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[min(380px,calc(100vw-24px))] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-base">메뉴설정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">
            {reorderMode ? '드래그 또는 화살표로 순서를 변경하세요.' : '사이드바에 표시할 메뉴를 선택하세요.'}
          </p>
          <button
            type="button"
            onClick={() => setReorderMode((v) => !v)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              reorderMode
                ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {reorderMode ? '완료' : '순서 변경'}
          </button>
        </div>
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {items.map((item, index) => {
            const canDrag = reorderMode && !item.lockedOrder
            const isOver = reorderMode && dragOverIndex === index
            return (
              <div
                key={item.key}
                draggable={canDrag}
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isOver ? 'bg-[#eaf6f0] ring-1 ring-[#1D9E75]' : 'bg-gray-50'
                } ${canDrag ? 'cursor-move' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {reorderMode && (
                    <i
                      className={`fa-solid fa-grip-vertical text-xs ${
                        item.lockedOrder ? 'text-gray-300' : 'text-gray-400'
                      }`}
                    />
                  )}
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                {reorderMode ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || item.lockedOrder || items[index - 1]?.lockedOrder}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="위로 이동"
                    >
                      <i className="fa-solid fa-chevron-up text-[11px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1 || item.lockedOrder}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="아래로 이동"
                    >
                      <i className="fa-solid fa-chevron-down text-[11px]" />
                    </button>
                  </div>
                ) : isTogglable(item) ? (
                  <div
                    className={`toggle-switch ${menuVisibility[item.key] ? 'on' : ''}`}
                    onClick={() => onToggle(item.key)}
                  />
                ) : (
                  <span className="text-[11px] text-gray-400">항상 표시</span>
                )}
              </div>
            )
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-[#1D9E75] text-white text-sm font-medium rounded-lg hover:bg-[#1D9E75] transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  )
}
