import { useState } from 'react'

interface Appointment {
  id: number
  empId: string
  name: string
  type: string
  fromDept: string
  toDept: string
  fromRank: string
  toRank: string
  effectiveDate: string
  status: '작성중' | '결재대기' | '결재완료' | '통보완료'
  approver: string
}

const mockAppointments: Appointment[] = [
  { id: 1, empId: 'PC2024001', name: '김민수', type: '승진', fromDept: '개발팀', toDept: '개발팀', fromRank: '대리', toRank: '과장', effectiveDate: '2024-06-01', status: '결재대기', approver: '윤재혁' },
  { id: 2, empId: 'PC2024004', name: '최유진', type: '전보', fromDept: '영업팀', toDept: '마케팅팀', fromRank: '주임', toRank: '주임', effectiveDate: '2024-06-01', status: '결재대기', approver: '이서연' },
  { id: 3, empId: 'PC2024005', name: '정하은', type: '승진', fromDept: '재무팀', toDept: '재무팀', fromRank: '차장', toRank: '부장', effectiveDate: '2024-05-15', status: '결재완료', approver: '윤재혁' },
  { id: 4, empId: 'PC2024007', name: '오나영', type: '겸직', fromDept: '경영지원팀', toDept: '인사팀 (겸직)', fromRank: '대리', toRank: '대리', effectiveDate: '2024-05-01', status: '통보완료', approver: '이서연' },
  { id: 5, empId: 'PC2024003', name: '박지훈', type: '전보', fromDept: '마케팅팀', toDept: '영업팀', fromRank: '사원', toRank: '사원', effectiveDate: '2024-04-15', status: '통보완료', approver: '윤재혁' },
]

export default function PersonnelAppointment() {
  const [showRegister, setShowRegister] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = mockAppointments.filter(a => !filterStatus || a.status === filterStatus)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">인사 발령</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">인사 발령</h1>
          <p className="text-xs text-gray-400 mt-1">승진 · 전보 · 겸직 등 인사 발령을 등록하고 결재·통보를 관리합니다. (emp-14, emp-15, emp-16)</p>
        </div>
        <button onClick={() => setShowRegister(!showRegister)}
          className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
          <i className="fas fa-plus text-xs"></i>
          발령 등록
        </button>
      </div>

      {/* Register Form */}
      {showRegister && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">발령 등록</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">emp-14</span>
          </div>
          <div className="grid grid-cols-3 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">대상 사원 <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="이름 또는 사번 검색" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령 유형 <span className="text-red-400">*</span></label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                <option value="">선택</option>
                <option>승진</option>
                <option>전보</option>
                <option>겸직</option>
                <option>직무변경</option>
                <option>보직해임</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령일 <span className="text-red-400">*</span></label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">변경 전 부서</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed" disabled placeholder="자동 입력" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">변경 후 부서</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                <option value="">선택</option>
                <option>개발팀</option>
                <option>인사팀</option>
                <option>마케팅팀</option>
                <option>영업팀</option>
                <option>재무팀</option>
                <option>경영지원팀</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">변경 후 직급</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                <option value="">선택</option>
                <option>사원</option>
                <option>주임</option>
                <option>대리</option>
                <option>과장</option>
                <option>차장</option>
                <option>부장</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">결재자 <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="결재자 검색" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령 사유</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="발령 사유를 입력하세요" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <button onClick={() => setShowRegister(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
            <button className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">결재 요청</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 상태</option>
            <option value="작성중">작성중</option>
            <option value="결재대기">결재대기</option>
            <option value="결재완료">결재완료</option>
            <option value="통보완료">통보완료</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발령 유형</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">변경 전</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">변경 후</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발령일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">결재자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(apt => (
              <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{apt.empId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{apt.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    apt.type === '승진' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    apt.type === '전보' ? 'bg-blue-50 text-blue-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>{apt.type}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{apt.fromDept} / {apt.fromRank}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{apt.toDept} / {apt.toRank}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{apt.effectiveDate}</td>
                <td className="px-4 py-3 text-gray-600">{apt.approver}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    apt.status === '작성중' ? 'bg-gray-100 text-gray-500' :
                    apt.status === '결재대기' ? 'bg-yellow-50 text-yellow-600' :
                    apt.status === '결재완료' ? 'bg-blue-50 text-blue-600' :
                    'bg-[#eaf6f0] text-[#1D9E75]'
                  }`}>{apt.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {apt.status === '결재대기' && (
                    <div className="flex gap-1.5 justify-center">
                      <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">승인</button>
                      <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-red-300 hover:text-red-500 transition-all">반려</button>
                    </div>
                  )}
                  {apt.status === '결재완료' && (
                    <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                      <i className="fas fa-bell mr-1"></i>통보
                    </button>
                  )}
                  {(apt.status === '통보완료' || apt.status === '작성중') && (
                    <span className="text-xs text-gray-400">{apt.status === '통보완료' ? '완료' : '—'}</span>
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
