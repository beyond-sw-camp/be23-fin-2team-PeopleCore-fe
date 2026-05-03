import { useState } from 'react'

interface Props {
  currentValue: number
  onClose: () => void
  onSave: (count: number) => void
}

export default function DependentsModal({ currentValue, onClose, onSave }: Props) {
  const [count, setCount] = useState(currentValue)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(360px,calc(100vw-24px))]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">부양가족수 변경</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">부양가족수 (본인 포함)</label>
            <input
              type="number"
              min={0}
              max={20}
              value={count}
              onChange={e => setCount(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
            />
          </div>
          <p className="text-[10px] text-gray-400">간이세액표 조회 시 사용됩니다. 변경 시 다음 급여 계산부터 반영됩니다.</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => { onSave(count); onClose() }} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">변경 완료</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}
