import { useState } from 'react'

interface AllowedIp {
  id: number
  label: string
  ipAddress: string
  type: 'SINGLE' | 'CIDR'
  createdAt: string
  active: boolean
}

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}$/
const CIDR_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}\/(3[0-2]|[12]?\d)$/

const validateIp = (value: string): { valid: boolean; type: 'SINGLE' | 'CIDR' | null } => {
  if (CIDR_REGEX.test(value)) return { valid: true, type: 'CIDR' }
  if (IPV4_REGEX.test(value)) return { valid: true, type: 'SINGLE' }
  return { valid: false, type: null }
}

export default function AllowedIpView() {
  const [ips, setIps] = useState<AllowedIp[]>([
    { id: 1, label: '본사 사무실', ipAddress: '211.45.102.10', type: 'SINGLE', createdAt: '2026-01-15', active: true },
    { id: 2, label: '본사 사내망 대역', ipAddress: '192.168.0.0/24', type: 'CIDR', createdAt: '2026-01-15', active: true },
    { id: 3, label: '판교 지사', ipAddress: '203.248.17.55', type: 'SINGLE', createdAt: '2026-02-20', active: true },
    { id: 4, label: '테스트용', ipAddress: '10.0.0.0/16', type: 'CIDR', createdAt: '2026-03-05', active: false },
  ])

  const [ipRestrictionOn, setIpRestrictionOn] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newIp, setNewIp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<AllowedIp | null>(null)
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleAdd = () => {
    const label = newLabel.trim()
    const ip = newIp.trim()
    if (!label) { setErrorMsg('IP 이름을 입력하세요.'); return }
    if (!ip) { setErrorMsg('IP 주소를 입력하세요.'); return }
    const { valid, type } = validateIp(ip)
    if (!valid) { setErrorMsg('올바른 IPv4 주소 또는 CIDR 형식이 아닙니다. (예: 192.168.0.1 또는 192.168.0.0/24)'); return }
    if (ips.some((i) => i.ipAddress === ip)) { setErrorMsg('이미 등록된 IP 주소입니다.'); return }

    const now = new Date().toISOString().slice(0, 10)
    setIps((prev) => [...prev, { id: Date.now(), label, ipAddress: ip, type: type!, createdAt: now, active: true }])
    setNewLabel('')
    setNewIp('')
    setErrorMsg('')
    setShowAddModal(false)
    setModal({ type: 'success', message: '허용 IP가 등록되었습니다.' })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setIps((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    setDeleteTarget(null)
    setModal({ type: 'success', message: '허용 IP가 삭제되었습니다.' })
  }

  const toggleActive = (id: number) => {
    setIps((prev) => prev.map((i) => i.id === id ? { ...i, active: !i.active } : i))
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">허용 IP 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">등록된 IP에서만 출퇴근 체크가 가능하도록 제한합니다.</p>

      {/* IP 제한 on/off */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[13px] font-semibold text-gray-800">IP 기반 출퇴근 체크 제한</span>
            <p className="text-[11px] text-gray-400 mt-0.5">OFF로 설정하면 모든 IP에서 출퇴근 체크가 허용됩니다.</p>
          </div>
          <button onClick={() => setIpRestrictionOn(!ipRestrictionOn)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ipRestrictionOn ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${ipRestrictionOn ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* 등록된 IP 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-semibold text-gray-800">허용 IP 목록 <span className="text-gray-400 font-normal">({ips.length})</span></h4>
          <button onClick={() => { setNewLabel(''); setNewIp(''); setErrorMsg(''); setShowAddModal(true) }}
            className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors">
            + IP 등록
          </button>
        </div>

        {ips.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-gray-400">
            등록된 허용 IP가 없습니다. IP를 등록해주세요.
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">이름</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">IP 주소</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">유형</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">등록일</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">활성</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {ips.map((ip) => (
                <tr key={ip.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!ip.active ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{ip.label}</td>
                  <td className="px-3 py-2.5 text-gray-700 font-mono">{ip.ipAddress}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${ip.type === 'CIDR' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {ip.type === 'CIDR' ? '대역(CIDR)' : '단일 IP'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{ip.createdAt}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => toggleActive(ip.id)}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${ip.active ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ip.active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setDeleteTarget(ip)}
                      className="text-[11px] text-red-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[440px] p-6">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4">허용 IP 등록</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">이름 <span className="text-red-500">*</span></label>
                <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="예: 본사 사무실"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75]" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">IP 주소 <span className="text-red-500">*</span></label>
                <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)}
                  placeholder="192.168.0.1 또는 192.168.0.0/24"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75] font-mono" />
                <p className="text-[11px] text-gray-400 mt-1">단일 IP(IPv4) 또는 CIDR 표기(192.168.0.0/24)를 입력하세요.</p>
              </div>
              {errorMsg && <p className="text-[12px] text-red-500">{errorMsg}</p>}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleAdd}
                className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[380px] p-6 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-50">
              <i className="fas fa-trash text-red-500 text-[18px]" />
            </div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">허용 IP 삭제</p>
            <p className="text-[13px] text-gray-500 mb-5">"{deleteTarget.label}" ({deleteTarget.ipAddress})을 삭제하시겠습니까?</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleDelete}
                className="px-5 py-2 bg-red-500 text-white text-[13px] font-medium rounded-lg hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 결과 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[360px] p-6 text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${modal.type === 'success' ? 'bg-[#E1F5EE]' : 'bg-red-50'}`}>
              <i className={`fas ${modal.type === 'success' ? 'fa-check text-[#1D9E75]' : 'fa-times text-red-500'} text-[20px]`} />
            </div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">{modal.type === 'success' ? '완료' : '오류'}</p>
            <p className="text-[13px] text-gray-500 mb-5">{modal.message}</p>
            <button onClick={() => setModal(null)}
              className="px-6 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65]">확인</button>
          </div>
        </div>
      )}
    </div>
  )
}
