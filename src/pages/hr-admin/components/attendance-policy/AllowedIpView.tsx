import { useState, useEffect } from 'react'
import { attendanceApi, type AllowedIpRes } from '../../../../api/attendance'

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}$/
const CIDR_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}\/(3[0-2]|[12]?\d)$/

const isValidIp = (value: string) => IPV4_REGEX.test(value) || CIDR_REGEX.test(value)
const formatDate = (iso: string) => iso ? iso.slice(0, 10) : '-'

export default function AllowedIpView() {
  const [ips, setIps] = useState<AllowedIpRes[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<AllowedIpRes | null>(null)
  const [formLabel, setFormLabel] = useState('')
  const [formIp, setFormIp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AllowedIpRes | null>(null)
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [myIp, setMyIp] = useState<string | null>(null)

  const loadIps = async () => {
    setLoading(true)
    try {
      const data = await attendanceApi.getAllowedIps()
      setIps(data)
    } catch {
      setModal({ type: 'error', message: '허용 IP 목록을 불러오지 못했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadIps() }, [])

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d: { ip: string }) => setMyIp(d.ip))
      .catch(() => setMyIp(null))
  }, [])

  const openAdd = () => {
    setEditTarget(null)
    setFormLabel('')
    setFormIp('')
    setErrorMsg('')
    setShowAddModal(true)
  }

  const openEdit = (ip: AllowedIpRes) => {
    setEditTarget(ip)
    setFormLabel(ip.label ?? '')
    setFormIp(ip.ipCidr)
    setErrorMsg('')
    setShowAddModal(true)
  }

  const handleSave = async () => {
    const label = formLabel.trim()
    const ip = formIp.trim()
    if (!ip) { setErrorMsg('IP 주소를 입력하세요.'); return }
    if (!isValidIp(ip)) { setErrorMsg('올바른 IPv4 주소 또는 CIDR 형식이 아닙니다. (예: 192.168.0.1 또는 192.168.0.0/24)'); return }

    setSaving(true)
    try {
      if (editTarget) {
        await attendanceApi.updateAllowedIp(editTarget.id, { ipCidr: ip, label, isActive: editTarget.isActive })
        setModal({ type: 'success', message: '허용 IP가 수정되었습니다.' })
      } else {
        await attendanceApi.createAllowedIp({ ipCidr: ip, label, isActive: true })
        setModal({ type: 'success', message: '허용 IP가 등록되었습니다.' })
      }
      setShowAddModal(false)
      loadIps()
    } catch (e: unknown) {
      const msg = extractErrorMessage(e) ?? (editTarget ? '수정에 실패했습니다.' : '등록에 실패했습니다.')
      setErrorMsg(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await attendanceApi.deleteAllowedIp(deleteTarget.id)
      setDeleteTarget(null)
      setModal({ type: 'success', message: '허용 IP가 삭제되었습니다.' })
      loadIps()
    } catch (e: unknown) {
      setDeleteTarget(null)
      setModal({ type: 'error', message: extractErrorMessage(e) ?? '삭제에 실패했습니다.' })
    }
  }

  const handleToggle = async (ip: AllowedIpRes) => {
    try {
      await attendanceApi.toggleAllowedIp(ip.id)
      loadIps()
    } catch (e: unknown) {
      setModal({ type: 'error', message: extractErrorMessage(e) ?? '활성 상태 변경에 실패했습니다.' })
    }
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">허용 IP 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">등록된 IP에서만 출퇴근 체크가 가능하도록 제한합니다. 등록된 CIDR 대역 밖에서 체크인하면 "근무지 외"로 처리됩니다.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-semibold text-gray-800">허용 IP 목록 <span className="text-gray-400 font-normal">({ips.length})</span></h4>
          <button onClick={openAdd}
            className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors">
            + IP 등록
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[13px] text-gray-400">불러오는 중...</div>
        ) : ips.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-gray-400">
            등록된 허용 IP가 없습니다. IP를 등록해주세요.
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">이름</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">IP 주소 / CIDR</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">등록일</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">활성</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {ips.map((ip) => (
                <tr key={ip.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!ip.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{ip.label || '-'}</td>
                  <td className="px-3 py-2.5 text-gray-700 font-mono">{ip.ipCidr}</td>
                  <td className="px-3 py-2.5 text-gray-500">{formatDate(ip.createdAt)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => handleToggle(ip)}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${ip.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ip.isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => openEdit(ip)}
                      className="text-[11px] text-[#1D9E75] hover:underline mr-2">수정</button>
                    <button onClick={() => setDeleteTarget(ip)}
                      className="text-[11px] text-red-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => !saving && setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[440px] p-6">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4">{editTarget ? '허용 IP 수정' : '허용 IP 등록'}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">이름</label>
                <input type="text" value={formLabel} onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="예: 본사 사무실"
                  maxLength={100}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75]" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">IP 주소 <span className="text-red-500">*</span></label>
                <input type="text" value={formIp} onChange={(e) => setFormIp(e.target.value)}
                  placeholder="192.168.0.1 또는 192.168.0.0/24"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75] font-mono" />

                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  {myIp && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-location-dot text-[#1D9E75] text-[11px]" />
                        <span className="text-[11px] text-gray-600">내 현재 IP</span>
                        <span className="text-[12px] font-mono font-semibold text-gray-800">{myIp}</span>
                      </div>
                      <button type="button" onClick={() => setFormIp(myIp)}
                        className="text-[11px] text-[#1D9E75] hover:underline font-medium">이 IP 사용</button>
                    </div>
                  )}
                  <div className="text-[11px] text-gray-500 leading-relaxed">
                    <div className="font-semibold text-gray-600 mb-1">등록 방법</div>
                    <ul className="space-y-0.5 list-disc pl-4">
                      <li><span className="font-mono text-gray-700">192.168.0.5</span> — 단일 IP (자동으로 /32 적용)</li>
                      <li><span className="font-mono text-gray-700">192.168.0.0/24</span> — 대역(192.168.0.0 ~ 192.168.0.255)</li>
                      <li><span className="font-mono text-gray-700">10.0.0.0/16</span> — 더 넓은 대역(10.0.x.x 전체)</li>
                    </ul>
                  </div>
                </div>
              </div>
              {errorMsg && <p className="text-[12px] text-red-500">{errorMsg}</p>}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} disabled={saving}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">취소</button>
              <button onClick={handleSave} disabled={saving}
                className={`px-5 py-2 text-[13px] font-medium rounded-lg transition-colors ${saving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#1D9E75] text-white hover:bg-[#178a65]'}`}>
                {saving ? '저장 중...' : (editTarget ? '수정' : '등록')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[380px] p-6 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-50">
              <i className="fas fa-trash text-red-500 text-[18px]" />
            </div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">허용 IP 삭제</p>
            <p className="text-[13px] text-gray-500 mb-5">"{deleteTarget.label || deleteTarget.ipCidr}"을 삭제하시겠습니까?</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleDelete}
                className="px-5 py-2 bg-red-500 text-white text-[13px] font-medium rounded-lg hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}

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

function extractErrorMessage(e: unknown): string | undefined {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const res = (e as { response?: { data?: { message?: string; code?: string } } }).response
    if (res?.data?.code === 'INVALID_CIDR_FORMAT') return '유효하지 않은 CIDR 형식입니다.'
    if (res?.data?.code === 'ALLOWED_IP_DUPLICATE') return '이미 등록된 IP 대역입니다.'
    if (res?.data?.code === 'ALLOWED_IP_NOT_FOUND') return '허용 IP를 찾을 수 없습니다.'
    if (res?.data?.code === 'COMPANY_NOT_FOUND') return '회사를 찾을 수 없습니다.'
    return res?.data?.message
  }
  return undefined
}
