import { useState } from 'react'
import axios from 'axios'
import { accountVerifyApi } from '../../api/payAdmin'
import { BANKS, findBankByName } from '../../constants/banks'

interface Props {
  currentBank?: string
  currentAccount?: string
  title?: string
  onClose: () => void
  onSave: (bankCode: string, bankName: string, account: string, holder: string, token: string) => void
}

export default function AccountVerifyModal({ currentBank = '', currentAccount = '', title = '급여 계좌 변경', onClose, onSave }: Props) {
  const initialBankCode = findBankByName(currentBank)?.code ?? BANKS[0].code
  const [bankCode, setBankCode] = useState(initialBankCode)
  const [newAccount, setNewAccount] = useState(currentAccount)
  const [holder, setHolder] = useState('')
  const [verified, setVerified] = useState(false)
  const [token, setToken] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const resetVerified = () => { setVerified(false); setToken(''); setError('') }

  const handleVerify = async () => {
    if (!newAccount.trim() || !holder.trim()) {
      setError('계좌번호와 예금주를 모두 입력해주세요.')
      return
    }
    setError('')
    setVerifying(true)
    try {
      const res = await accountVerifyApi.verify({
        bankCode,
        accountNumber: newAccount.trim(),
        accountHolder: holder.trim(),
      })
      setToken(res.verificationToken)
      setVerified(true)
    } catch (e) {
      const msg = axios.isAxiosError(e) ? (e.response?.data?.message ?? '계좌 인증에 실패했습니다.') : '계좌 인증에 실패했습니다.'
      setError(msg)
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = () => {
    const bankName = BANKS.find(b => b.code === bankCode)?.name ?? ''
    onSave(bankCode, bankName, newAccount.trim(), holder.trim(), token)
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
            <select value={bankCode} onChange={e => { setBankCode(e.target.value); resetVerified() }} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]">
              {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">계좌번호</label>
            <input type="text" value={newAccount} onChange={e => { setNewAccount(e.target.value); resetVerified() }} placeholder="계좌번호를 입력하세요 (- 없이)" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">예금주</label>
            <input type="text" value={holder} onChange={e => { setHolder(e.target.value); resetVerified() }} placeholder="예금주명" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}
          {verified && (
            <div className="flex items-center gap-1.5 text-xs text-[#2e9e6e] bg-[#f0f9f6] rounded-lg px-3 py-2">
              <i className="fas fa-check-circle" /> 계좌 인증이 완료되었습니다.
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          {!verified ? (
            <button onClick={handleVerify} disabled={verifying} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:bg-gray-300 disabled:cursor-not-allowed">
              {verifying ? '인증 중...' : '계좌 인증'}
            </button>
          ) : (
            <button onClick={handleSubmit} className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d]">변경 완료</button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
        </div>
      </div>
    </div>
  )
}
