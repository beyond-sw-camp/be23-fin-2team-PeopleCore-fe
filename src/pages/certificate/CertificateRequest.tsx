import { useState } from 'react'

interface MyCertRequest {
  id: number
  certType: string
  purpose: string
  copies: number
  requestDate: string
  status: '발급대기' | '발급완료' | '반려'
  rejectReason?: string
}

const mockMyRequests: MyCertRequest[] = [
  { id: 1, certType: '재직증명서', purpose: '은행 대출 서류 제출용', copies: 1, requestDate: '2024-05-12', status: '발급대기' },
  { id: 2, certType: '경력증명서', purpose: '외부 제출', copies: 1, requestDate: '2024-04-20', status: '발급완료' },
  { id: 3, certType: '재직증명서', purpose: '비자 발급', copies: 2, requestDate: '2024-03-15', status: '발급완료' },
]

const certTypes = ['재직증명서', '경력증명서', '근로소득 원천징수 영수증']

export default function CertificateRequest() {
  const [requests] = useState<MyCertRequest[]>(mockMyRequests)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ certType: '', purpose: '', copies: 1 })

  const handleSubmit = () => {
    if (!form.certType) return
    setShowForm(false)
    setForm({ certType: '', purpose: '', copies: 1 })
  }

  const pendingCount = requests.filter(r => r.status === '발급대기').length
  const completedCount = requests.filter(r => r.status === '발급완료').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">제증명 발급</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">제증명 신청</h1>
          <p className="text-[13px] text-[#8a9490]">재직증명서, 경력증명서 등 각종 증명서를 신청하고 발급 현황을 확인합니다.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
        >
          + 증명서 신청
        </button>
      </div>

      {/* 현황 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 신청</div>
          <div className="text-[24px] font-bold text-[#1a2b23]">{requests.length}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">발급 대기</div>
          <div className="text-[24px] font-bold text-[#f59e0b]">{pendingCount}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">발급 완료</div>
          <div className="text-[24px] font-bold text-[#2e9e6e]">{completedCount}건</div>
        </div>
      </div>

      {/* 신청 폼 */}
      {showForm && (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
          <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">증명서 신청</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">
                증명서 종류 <span className="text-[#ef4444]">*</span>
              </label>
              <select
                value={form.certType}
                onChange={e => setForm({ ...form, certType: e.target.value })}
                className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] focus:border-[#1D9E75] focus:outline-none"
              >
                <option value="">선택하세요</option>
                {certTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">용도</label>
              <input
                value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })}
                className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] focus:border-[#1D9E75] focus:outline-none"
                placeholder="예: 은행 대출 서류 제출용"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">발급 부수</label>
              <input
                type="number"
                min={1}
                value={form.copies}
                onChange={e => setForm({ ...form, copies: Number(e.target.value) })}
                className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] focus:border-[#1D9E75] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.certType}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium border-none cursor-pointer transition-colors ${
                form.certType ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
              }`}
            >
              신청
            </button>
          </div>
        </div>
      )}

      {/* 신청 내역 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">내 신청 내역</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e5e3]">
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">증명서 종류</th>
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">용도</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">부수</th>
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">신청일</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">상태</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">다운로드</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-5 py-3 font-medium text-[#1a2b23]">{req.certType}</td>
                <td className="px-5 py-3 text-[#5a6b62]">{req.purpose || '—'}</td>
                <td className="px-5 py-3 text-center text-[#5a6b62]">{req.copies}</td>
                <td className="px-5 py-3 text-[#8a9490]">{req.requestDate}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    req.status === '발급대기' ? 'bg-[#fef3cd] text-[#f59e0b]' :
                    req.status === '발급완료' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                    'bg-[#fef2f2] text-[#ef4444]'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  {req.status === '발급완료' ? (
                    <button className="text-[#1D9E75] bg-transparent border border-[#1D9E75] rounded px-2.5 py-1 text-[11px] cursor-pointer hover:bg-[#eaf6f0] transition-colors">
                      <i className="fas fa-download mr-1" />다운로드
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#d0d8d4]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
