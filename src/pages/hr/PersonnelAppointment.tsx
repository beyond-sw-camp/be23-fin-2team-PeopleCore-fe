import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Appointment {
  id: number
  orderNo: string
  empId: string
  name: string
  type: '입사' | '퇴사' | '직위변경' | '부서변경' | '보직변경'
  fromDept: string
  toDept: string
  fromRank: string
  toRank: string
  fromPosition: string
  toPosition: string
  effectiveDate: string
  noticeDate: string
  status: '작성중' | '결재대기' | '결재완료' | '공지완료'
  isPublic: boolean
  registeredDate: string
}

const mockAppointments: Appointment[] = [
  { id: 1, orderNo: 'HR-2024-001', empId: 'PC2024001', name: '김민수', type: '직위변경', fromDept: '개발팀', toDept: '개발팀', fromRank: '대리', toRank: '과장', fromPosition: '팀원', toPosition: '팀원', effectiveDate: '2024-06-01', noticeDate: '2024-05-28', status: '공지완료', isPublic: true, registeredDate: '2024-05-20' },
  { id: 2, orderNo: 'HR-2024-002', empId: 'PC2024004', name: '최유진', type: '부서변경', fromDept: '영업팀', toDept: '마케팅팀', fromRank: '주임', toRank: '주임', fromPosition: '팀원', toPosition: '팀원', effectiveDate: '2024-06-01', noticeDate: '2024-05-28', status: '공지완료', isPublic: true, registeredDate: '2024-05-20' },
  { id: 3, orderNo: 'HR-2024-003', empId: 'PC2024005', name: '정하은', type: '직위변경', fromDept: '재무팀', toDept: '재무팀', fromRank: '차장', toRank: '부장', fromPosition: '파트장', toPosition: '파트장', effectiveDate: '2024-07-01', noticeDate: '', status: '결재대기', isPublic: false, registeredDate: '2024-06-15' },
  { id: 4, orderNo: 'HR-2024-004', empId: 'PC2024008', name: '윤재혁', type: '보직변경', fromDept: '개발팀', toDept: '개발팀', fromRank: '부장', toRank: '부장', fromPosition: '팀장', toPosition: '실장', effectiveDate: '2024-07-01', noticeDate: '', status: '결재대기', isPublic: false, registeredDate: '2024-06-18' },
  { id: 5, orderNo: 'HR-2024-005', empId: 'PC2024003', name: '박지훈', type: '퇴사', fromDept: '마케팅팀', toDept: '', fromRank: '사원', toRank: '', fromPosition: '팀원', toPosition: '', effectiveDate: '2024-06-30', noticeDate: '', status: '결재완료', isPublic: false, registeredDate: '2024-06-10' },
  { id: 6, orderNo: 'HR-2024-006', empId: 'PC2024009', name: '홍길동', type: '입사', fromDept: '', toDept: '개발팀', fromRank: '', toRank: '사원', fromPosition: '', toPosition: '팀원', effectiveDate: '2024-07-15', noticeDate: '', status: '작성중', isPublic: false, registeredDate: '2024-06-28' },
]

export default function PersonnelAppointment() {
  const navigate = useNavigate()
  const [showRegister, setShowRegister] = useState(false)
  const [editTarget, setEditTarget] = useState<Appointment | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [checkedIds, setCheckedIds] = useState<number[]>([])

  const toggleCheck = (id: number) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleAll = () => {
    setCheckedIds(checkedIds.length === filtered.length ? [] : filtered.map(a => a.id))
  }

  const handleNotice = () => {
    const selected = mockAppointments.filter(a => checkedIds.includes(a.id))
    const content = selected.map(a => {
      const changeText = a.type === '입사' ? `${a.toDept} / ${a.toRank}`
        : a.type === '퇴사' ? `${a.fromDept} / ${a.fromRank}`
        : a.type === '직위변경' ? `${a.fromRank} → ${a.toRank}`
        : a.type === '부서변경' ? `${a.fromDept} → ${a.toDept}`
        : `${a.fromPosition} → ${a.toPosition}`
      return `${a.name} (${a.type}) - ${changeText} [${a.effectiveDate}]`
    }).join('\n')
    navigate('/board', { state: { appointmentNotice: true, content } })
  }

  const filtered = mockAppointments.filter(a => !filterStatus || a.status === filterStatus)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">인사 발령</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">인사 발령</h1>
          <p className="text-xs text-gray-400 mt-1">입사 · 퇴사 · 직위변경 · 부서변경 · 보직변경 유형의 인사 발령을 등록하고 결재·공지합니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleNotice}
            disabled={checkedIds.length === 0}
            className={`flex items-center gap-1.5 border px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${checkedIds.length > 0 ? 'border-gray-200 bg-white text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] cursor-pointer' : 'border-gray-100 bg-white text-gray-300 cursor-not-allowed'}`}>
            <i className="fas fa-bullhorn text-xs"></i>
            인사공고{checkedIds.length > 0 ? ` (${checkedIds.length})` : ''}
          </button>
          <button onClick={() => setShowRegister(!showRegister)}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-plus text-xs"></i>
            발령 등록
          </button>
        </div>
      </div>

      {/* Register Form */}
      {showRegister && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">발령 등록</span>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령일자 <span className="text-red-400">*</span></label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령번호</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed" disabled value="자동 생성" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령제목 <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="예) 2024년 하반기 정기 인사발령" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발령 인원</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed" disabled value="0 명" />
            </div>
          </div>

          {/* 발령유형 체크박스 */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 mb-2 block">발령유형 <span className="text-red-400">*</span></label>
            <div className="flex gap-4">
              {['입사', '퇴사', '직위변경', '부서변경', '보직변경'].map(t => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-[#1D9E75]" />
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">인사발령 유형은 여러 개 선택 가능하며, 선택에 따라 아래에서 대상 사원을 등록합니다.</p>
          </div>

          {/* 대상 사원 등록 영역 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-medium text-gray-600">대상 사원</span>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1 border border-gray-200 bg-white text-gray-600 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">+ 사원추가</button>
                <button className="text-xs px-3 py-1 border border-gray-200 bg-white text-gray-600 rounded-md hover:border-red-300 hover:text-red-500 transition-all">삭제</button>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-center px-3 py-2 font-medium text-gray-500 w-8"><input type="checkbox" className="accent-[#1D9E75]" /></th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">사원명 <span className="text-red-400">*</span></th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">부서 <span className="text-red-400">*</span></th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">직위 <span className="text-red-400">*</span></th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">변경 부서</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">변경 직위</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">변경 보직</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">발령일 <span className="text-red-400">*</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-400 text-xs">
                    "사원추가" 버튼으로 대상자를 추가하세요
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button onClick={() => setShowRegister(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
            <button className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">저장</button>
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
            <option value="공지완료">공지완료</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs w-8">
                <input type="checkbox" className="accent-[#1D9E75]" checked={checkedIds.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발령번호</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발령유형</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">변경 내용</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발령일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">등록일</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">공지</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(apt => {
              const changeText = apt.type === '입사' ? `${apt.toDept} / ${apt.toRank}`
                : apt.type === '퇴사' ? `${apt.fromDept} / ${apt.fromRank}`
                : apt.type === '직위변경' ? `${apt.fromRank} → ${apt.toRank}`
                : apt.type === '부서변경' ? `${apt.fromDept} → ${apt.toDept}`
                : `${apt.fromPosition} → ${apt.toPosition}`
              return (
                <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="accent-[#1D9E75]" checked={checkedIds.includes(apt.id)} onChange={() => toggleCheck(apt.id)} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{apt.empId}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{apt.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{apt.orderNo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      apt.type === '입사' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                      apt.type === '퇴사' ? 'bg-red-50 text-red-500' :
                      apt.type === '직위변경' ? 'bg-purple-50 text-purple-600' :
                      apt.type === '부서변경' ? 'bg-blue-50 text-blue-600' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>{apt.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{changeText}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{apt.effectiveDate}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{apt.registeredDate}</td>
                  <td className="px-4 py-3 text-center">
                    {apt.isPublic
                      ? <i className="fas fa-check text-[#1D9E75] text-xs"></i>
                      : <span className="text-gray-300">-</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={(e) => { e.stopPropagation(); setEditTarget(apt) }} className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">수정</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[640px] max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">발령 수정</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">발령일자 <span className="text-red-400">*</span></label>
                  <input type="date" defaultValue={editTarget.effectiveDate}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">발령번호</label>
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" disabled value={editTarget.orderNo} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">대상 사원</label>
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" disabled value={`${editTarget.name} (${editTarget.empId})`} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">발령 유형 <span className="text-red-400">*</span></label>
                  <select defaultValue={editTarget.type}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]">
                    <option>입사</option>
                    <option>퇴사</option>
                    <option>직위변경</option>
                    <option>부서변경</option>
                    <option>보직변경</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">변경 전 부서</label>
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" disabled value={editTarget.fromDept || '—'} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">변경 후 부서</label>
                  <select defaultValue={editTarget.toDept}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]">
                    <option value="">선택</option>
                    <option>개발팀</option><option>인사팀</option><option>마케팅팀</option><option>영업팀</option><option>재무팀</option><option>경영지원팀</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">변경 전 직위</label>
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" disabled value={editTarget.fromRank || '—'} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">변경 후 직위</label>
                  <select defaultValue={editTarget.toRank}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]">
                    <option value="">선택</option>
                    <option>사원</option><option>주임</option><option>대리</option><option>과장</option><option>차장</option><option>부장</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">변경 전 보직</label>
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" disabled value={editTarget.fromPosition || '—'} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">변경 후 보직</label>
                  <select defaultValue={editTarget.toPosition}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]">
                    <option value="">선택</option>
                    <option>팀원</option><option>팀장</option><option>파트장</option><option>실장</option><option>본부장</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">발령 사유</label>
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75]" placeholder="발령 사유를 입력하세요" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditTarget(null)}
                className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={() => setEditTarget(null)}
                className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
