import { useState } from 'react'
import { BANKS, findBankByName } from '../../constants/banks'

interface Props {
  currentBank?: string
  currentAccount?: string
  title?: string
  onClose: () => void
  onSave: (bankCode: string, bankName: string, account: string, holder: string, token: string) => void
}

export default function AccountInputModal({ currentBank = '', currentAccount = '', title = '급여 계좌 변경', onClose, onSave }: Props) {
  const initialBankCode = findBankByName(currentBank)?.code ?? BANKS[0].code
  const [bankCode, setBankCode] = useState(initialBankCode)
  const [newAccount, setNewAccount] = useState(currentAccount)
  const [holder, setHolder] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!newAccount.trim() || !holder.trim()) {
      setError('계좌번호와 예금주를 모두 입력해주세요.')
      return
    }
    const bankName = BANKS.find(b => b.code === bankCode)?.name ?? ''
    onSave(bankCode, bankName, newAccount.trim(), holder.trim(), '')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(420px,calc(100vw-24px))]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">은행</label>
            <select value={bankCode} onChange={e => setBankCode(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]">
              {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">계좌번호</label>
            <input
              type="text"
              inputMode="numeric"
              value={newAccount}
              onChange={e => setNewAccount(e.target.value.replace(/\D/g, ''))}
              placeholder="계좌번호를 입력하세요 (숫자만)"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">예금주</label>
            <input type="text" value={holder} onChange={e => setHolder(e.target.value)} placeholder="예금주명" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={handleSubmit} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">저장</button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}
