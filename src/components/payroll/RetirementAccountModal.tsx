import { useState } from 'react'

interface Props {
  companyProvider: string
  currentAccount?: string
  onClose: () => void
  onSave: (account: string) => void
}

export default function RetirementAccountModal({ companyProvider, currentAccount = '', onClose, onSave }: Props) {
  const [account, setAccount] = useState(currentAccount)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(420px,calc(100vw-24px))]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">퇴직연금 계좌 변경</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">운용사 <span className="text-[10px] text-gray-400 ml-1">(회사 지정)</span></label>
            <input type="text" value={companyProvider || '-'} disabled className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">계좌번호</label>
            <input
              type="text"
              inputMode="numeric"
              value={account}
              onChange={e => setAccount(e.target.value.replace(/\D/g, ''))}
              placeholder="계좌번호를 입력하세요 (숫자만)"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
            />
          </div>
          <p className="text-[10px] text-gray-400">DC형 퇴직연금은 사원이 본인 계좌를 관리합니다. 운용사는 회사가 지정한 곳을 사용합니다.</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => { onSave(account); onClose() }} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">변경 완료</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}
