import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const mockRetirements = [
  {
    id: 1, empId: 'PC2024009', name: '장현우', department: '영업팀', rank: '과장',
    hireDate: '2019-03-04', resignDate: '2024-06-30', reason: '개인 사유', status: '대기',
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: false },
      { label: '시스템 계정 회수', done: false },
      { label: '잔여 연차 정산', done: false },
      { label: '퇴직금 정산', done: false },
    ],
  },
  {
    id: 2, empId: 'PC2024010', name: '송미래', department: '마케팅팀', rank: '대리',
    hireDate: '2021-07-12', resignDate: '2024-05-31', reason: '이직', status: '대기',
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: true },
      { label: '시스템 계정 회수', done: false },
      { label: '잔여 연차 정산', done: false },
      { label: '퇴직금 정산', done: false },
    ],
  },
  {
    id: 3, empId: 'PC2024011', name: '강태영', department: '개발팀', rank: '사원',
    hireDate: '2023-01-09', resignDate: '2024-04-30', reason: '계약 만료', status: '처리완료',
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: true },
      { label: '시스템 계정 회수', done: true },
      { label: '잔여 연차 정산', done: true },
      { label: '퇴직금 정산', done: true },
    ],
  },
]

const reasons = ['자진퇴사', '권고사직', '정년퇴직', '계약만료', '기타']

export default function RetirementEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = mockRetirements.find(r => String(r.id) === id) || mockRetirements[0]

  const [resignDate, setResignDate] = useState(data.resignDate)
  const [reason, setReason] = useState(data.reason)
  const [detail, setDetail] = useState('')
  const [checklist, setChecklist] = useState(data.checklist.map(c => ({ ...c })))
  const [status, setStatus] = useState(data.status)

  const toggleCheck = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item))
  }

  const doneCount = checklist.filter(c => c.done).length
  const remainCount = checklist.length - doneCount

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-xs text-gray-400 mb-1">
          인사관리 › 퇴직 관리 › 퇴직 상세 › <span className="text-[#1D9E75] font-medium">수정</span>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.name} 퇴직 정보 수정</h1>
            <p className="text-xs text-gray-400 mt-1">{data.empId} · {data.department} · {data.rank}</p>
          </div>
        </div>

        {/* 퇴직 정보 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">퇴직 정보</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">성명</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" value={data.name} disabled />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">부서 / 직급</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" value={`${data.department} / ${data.rank}`} disabled />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">입사일</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" value={data.hireDate} disabled />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">퇴직 예정일 <span className="text-red-400">*</span></label>
              <input type="date" value={resignDate} onChange={e => setResignDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">퇴직 사유 <span className="text-red-400">*</span></label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">상태 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {(['대기', '처리완료'] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all ${
                      status === s
                        ? s === '대기' ? 'border-yellow-400 bg-yellow-50 text-yellow-600 font-medium'
                        : 'border-[#1D9E75] bg-[#eaf6f0] text-[#1D9E75] font-medium'
                        : 'border-gray-200 text-gray-500'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
              {status === '처리완료' && remainCount > 0 && (
                <span className="text-[11px] text-red-500 mt-1">체크리스트를 전부 완료한 후 처리완료로 변경하세요.</span>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">상세 사유</label>
              <textarea value={detail} onChange={e => setDetail(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors resize-none"
                rows={3} placeholder="상세 퇴직 사유를 입력하세요" />
            </div>
          </div>
        </div>

        {/* 인수인계 및 반납 현황 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">반납 및 정산 현황</span>
            <span className="text-xs text-gray-400">{doneCount}/{checklist.length} 완료</span>
          </div>
          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={idx} onClick={() => toggleCheck(idx)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                  item.done ? 'bg-[#f2faf6] border-[#c8e8d8]' : 'border-gray-100 hover:bg-gray-50'
                }`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                  item.done ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'
                }`}>
                  {item.done && <i className="fas fa-check text-white text-[9px]"></i>}
                </div>
                <span className={`text-sm flex-1 ${item.done ? 'text-[#1D9E75]' : 'text-gray-700'}`}>{item.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.done ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-gray-100 text-gray-400'}`}>
                  {item.done ? '완료' : '미완료'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-5"></div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-400">체크리스트 항목을 클릭하여 완료 여부를 변경할 수 있습니다.</span>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/hr/retirement/${id}`)}
            className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            취소
          </button>
          <button onClick={() => navigate(`/hr/retirement/${id}`)}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-check text-xs"></i>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
