import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const mockEmployees: Record<string, any> = {
  PC2024001: { id: 'PC2024001', name: '김민수', department: '개발팀', rank: '대리', hireDate: '2022-03-02' },
  PC2024002: { id: 'PC2024002', name: '이서연', department: '인사팀', rank: '과장', hireDate: '2020-07-15' },
  PC2024003: { id: 'PC2024003', name: '박지훈', department: '마케팅팀', rank: '사원', hireDate: '2023-09-01' },
  PC2024004: { id: 'PC2024004', name: '최유진', department: '영업팀', rank: '주임', hireDate: '2021-11-10' },
  PC2024005: { id: 'PC2024005', name: '정하은', department: '재무팀', rank: '차장', hireDate: '2018-04-20' },
  PC2024006: { id: 'PC2024006', name: '한승우', department: '개발팀', rank: '사원', hireDate: '2024-01-08' },
  PC2024007: { id: 'PC2024007', name: '오나영', department: '경영지원팀', rank: '대리', hireDate: '2021-05-03' },
  PC2024008: { id: 'PC2024008', name: '윤재혁', department: '개발팀', rank: '부장', hireDate: '2015-02-16' },
}

const reasonOptions = ['자진퇴사', '권고사직', '정년퇴직', '계약만료', '기타']

const checklistItems = [
  { key: 'equipment', label: '장비 반납' },
  { key: 'account', label: '계정 비활성화' },
  { key: 'severance', label: '퇴직금 정산' },
]

export default function EmployeeRetire() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const emp = mockEmployees[id || ''] || mockEmployees['PC2024001']

  const [retireDate, setRetireDate] = useState('')
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    handover: false,
    equipment: false,
    account: false,
    severance: false,
  })

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-1">
          인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">퇴직 처리</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">퇴직 처리</h1>
            <p className="text-xs text-gray-400 mt-1">{emp.name} ({emp.id})님의 퇴직을 처리합니다.</p>
          </div>
        </div>

        {/* Employee Summary */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">대상 사원 정보</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">성명</span>
              <span className="text-sm text-gray-900">{emp.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">부서</span>
              <span className="text-sm text-gray-900">{emp.department}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">직급</span>
              <span className="text-sm text-gray-900">{emp.rank}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">입사일</span>
              <span className="text-sm text-gray-900">{emp.hireDate}</span>
            </div>
          </div>
        </div>

        {/* Retire Form */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">퇴직 정보</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">퇴직일 <span className="text-red-400">*</span></label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" value={retireDate} onChange={e => setRetireDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">퇴직 사유 <span className="text-red-400">*</span></label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">퇴직 사유 선택</option>
                {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">상세 사유</label>
              <textarea className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors resize-none h-24" placeholder="퇴직 상세 사유를 입력하세요" value={detail} onChange={e => setDetail(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Handover Checklist */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">반납 및 정산 현황</span>
          </div>
          <div className="space-y-3">
            {checklistItems.map(item => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => toggleCheck(item.key)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    checklist[item.key] ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300 group-hover:border-[#1D9E75]'
                  }`}
                >
                  {checklist[item.key] && <i className="fas fa-check text-white text-[10px]"></i>}
                </div>
                <span className={`text-sm ${checklist[item.key] ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="h-5"></div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-end gap-2 shrink-0">
        <button onClick={() => navigate(-1)} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
          취소
        </button>
        <button className="flex items-center gap-1.5 bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
          <i className="fas fa-user-minus text-xs"></i>
          퇴직 처리 완료
        </button>
      </div>
    </div>
  )
}
