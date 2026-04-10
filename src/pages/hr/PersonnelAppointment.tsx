import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEmployeeList } from '../../api/employee/employeeApi'
import type { EmployeeListDto } from '../../api/employee/types'
import { useAuth } from '../../contexts/AuthContext'

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
  status: '승인대기' | '승인' | '반려'
  isPublic: boolean
  registeredDate: string
}

const mockAppointments: Appointment[] = [
  { id: 1, orderNo: 'HR-2024-001', empId: 'PC2024001', name: '김민수', type: '직위변경', fromDept: '개발팀', toDept: '개발팀', fromRank: '대리', toRank: '과장', fromPosition: '팀원', toPosition: '팀원', effectiveDate: '2024-06-01', noticeDate: '2024-05-28', status: '승인', isPublic: true, registeredDate: '2024-05-20' },
  { id: 2, orderNo: 'HR-2024-002', empId: 'PC2024004', name: '최유진', type: '부서변경', fromDept: '영업팀', toDept: '마케팅팀', fromRank: '주임', toRank: '주임', fromPosition: '팀원', toPosition: '팀원', effectiveDate: '2024-06-01', noticeDate: '2024-05-28', status: '승인', isPublic: true, registeredDate: '2024-05-20' },
  { id: 3, orderNo: 'HR-2024-003', empId: 'PC2024005', name: '정하은', type: '직위변경', fromDept: '재무팀', toDept: '재무팀', fromRank: '차장', toRank: '부장', fromPosition: '파트장', toPosition: '파트장', effectiveDate: '2024-07-01', noticeDate: '', status: '승인대기', isPublic: false, registeredDate: '2024-06-15' },
  { id: 4, orderNo: 'HR-2024-004', empId: 'PC2024008', name: '윤재혁', type: '보직변경', fromDept: '개발팀', toDept: '개발팀', fromRank: '부장', toRank: '부장', fromPosition: '팀장', toPosition: '실장', effectiveDate: '2024-07-01', noticeDate: '', status: '반려', isPublic: false, registeredDate: '2024-06-18' },
  { id: 5, orderNo: 'HR-2024-005', empId: 'PC2024003', name: '박지훈', type: '부서변경', fromDept: '마케팅팀', toDept: '영업팀', fromRank: '사원', toRank: '사원', fromPosition: '팀원', toPosition: '팀원', effectiveDate: '2024-06-30', noticeDate: '', status: '승인', isPublic: false, registeredDate: '2024-06-10' },
  { id: 6, orderNo: 'HR-2024-006', empId: 'PC2024009', name: '홍길동', type: '직위변경', fromDept: '개발팀', toDept: '개발팀', fromRank: '사원', toRank: '주임', fromPosition: '팀원', toPosition: '팀원', effectiveDate: '2024-07-15', noticeDate: '', status: '승인대기', isPublic: false, registeredDate: '2024-06-28' },
]

export default function PersonnelAppointment() {
  const navigate = useNavigate()
  const { isHRSuperAdmin } = useAuth()
  const [appointments, setAppointments] = useState(mockAppointments)
  const [showRegister, setShowRegister] = useState(false)
  const [editTarget, setEditTarget] = useState<Appointment | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null)

  // 사원 검색 모달
  const [showEmpSearch, setShowEmpSearch] = useState(false)
  const [empSearchKeyword, setEmpSearchKeyword] = useState('')
  const [empSearchResults, setEmpSearchResults] = useState<EmployeeListDto[]>([])
  const [empSearchLoading, setEmpSearchLoading] = useState(false)

  interface SelectedEmp {
    empId: number
    empNum: string
    empName: string
    deptName: string
    gradeName: string
    titleName: string
    newDept: string
    newRank: string
    newPosition: string
    effectiveDate: string
  }
  const [selectedEmps, setSelectedEmps] = useState<SelectedEmp[]>([])

  const searchEmployees = async () => {
    setEmpSearchLoading(true)
    try {
      const res = await fetchEmployeeList({ keyword: empSearchKeyword, empStatus: 'ACTIVE', page: 0, size: 20 })
      setEmpSearchResults(res.content)
    } catch {
      setEmpSearchResults([])
    } finally {
      setEmpSearchLoading(false)
    }
  }

  useEffect(() => {
    if (showEmpSearch) searchEmployees()
  }, [showEmpSearch])

  const addEmployee = (emp: EmployeeListDto) => {
    if (selectedEmps.some(s => s.empId === emp.empId)) return
    setSelectedEmps(prev => [...prev, {
      empId: emp.empId, empNum: emp.empNum, empName: emp.empName,
      deptName: emp.deptName, gradeName: emp.gradeName, titleName: emp.titleName,
      newDept: '', newRank: '', newPosition: '', effectiveDate: '',
    }])
    setShowEmpSearch(false)
  }

  const removeSelectedEmp = (empId: number) => {
    setSelectedEmps(prev => prev.filter(e => e.empId !== empId))
  }

  const updateSelectedEmp = (empId: number, field: keyof SelectedEmp, value: string) => {
    setSelectedEmps(prev => prev.map(e => e.empId === empId ? { ...e, [field]: value } : e))
  }

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

  const handleConfirm = (id: number) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: '승인' as const } : a))
  }
  const handleReject = (id: number) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: '반려' as const } : a))
  }

  const filtered = appointments.filter(a => !filterStatus || a.status === filterStatus)

  return (
    <div className="flex-1 overflow-y-auto p-6" onClick={() => menuOpen && setMenuOpen(null)}>
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
              <span className="text-xs font-medium text-gray-600">대상 사원 ({selectedEmps.length}명)</span>
              <button onClick={() => setShowEmpSearch(true)} className="text-xs px-3 py-1 border border-gray-200 bg-white text-gray-600 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">+ 사원추가</button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-medium text-gray-500">사번</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">사원명</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">현재 부서</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">현재 직위</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">변경 부서</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">변경 직위</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">변경 보직</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">발령일 <span className="text-red-400">*</span></th>
                  <th className="text-center px-3 py-2 font-medium text-gray-500 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {selectedEmps.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-400 text-xs">
                      "사원추가" 버튼으로 대상자를 추가하세요
                    </td>
                  </tr>
                ) : (
                  selectedEmps.map(emp => (
                    <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-mono text-gray-500">{emp.empNum}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{emp.empName}</td>
                      <td className="px-3 py-2 text-gray-600">{emp.deptName}</td>
                      <td className="px-3 py-2 text-gray-600">{emp.gradeName}</td>
                      <td className="px-3 py-2">
                        <input value={emp.newDept} onChange={e => updateSelectedEmp(emp.empId, 'newDept', e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-[#1D9E75] w-full" placeholder="부서" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={emp.newRank} onChange={e => updateSelectedEmp(emp.empId, 'newRank', e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-[#1D9E75] w-full" placeholder="직위" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={emp.newPosition} onChange={e => updateSelectedEmp(emp.empId, 'newPosition', e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-[#1D9E75] w-full" placeholder="보직" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="date" value={emp.effectiveDate} onChange={e => updateSelectedEmp(emp.empId, 'effectiveDate', e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-[#1D9E75]" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => removeSelectedEmp(emp.empId)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
            <option value="승인대기">승인대기</option>
            <option value="승인">승인</option>
            <option value="반려">반려</option>
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
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">공지</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs w-16">관리</th>
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
                  <td className="px-4 py-3">
                    {apt.status === '승인대기' && isHRSuperAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={e => { e.stopPropagation(); handleConfirm(apt.id) }}
                          className="text-[10px] px-2.5 py-0.5 border border-[#1D9E75] text-[#1D9E75] rounded hover:bg-[#eaf6f0] transition-colors">승인</button>
                        <button onClick={e => { e.stopPropagation(); handleReject(apt.id) }}
                          className="text-[10px] px-2.5 py-0.5 border border-red-400 text-red-400 rounded hover:bg-red-50 transition-colors">반려</button>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        apt.status === '승인' ? 'bg-gray-100 text-gray-500' :
                        apt.status === '반려' ? 'bg-gray-100 text-gray-500' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>{apt.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {apt.isPublic
                      ? <i className="fas fa-check text-[#1D9E75] text-xs"></i>
                      : <span className="text-gray-300">-</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center relative">
                    <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === apt.id ? null : apt.id) }}
                      className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors px-2 py-1">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {menuOpen === apt.id && (
                      <div onClick={e => e.stopPropagation()} className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                        <button onClick={() => { setDetailTarget(apt); setMenuOpen(null) }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors">
                          <i className="fas fa-eye mr-2 text-[10px]"></i>상세 보기</button>
                        <button onClick={() => { setEditTarget(apt); setMenuOpen(null) }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors">
                          <i className="fas fa-pen mr-2 text-[10px]"></i>수정</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 사원 검색 모달 */}
      {showEmpSearch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[560px] max-h-[70vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">사원 검색</h3>
              <button onClick={() => setShowEmpSearch(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
                  <i className="fas fa-search text-gray-400 text-xs"></i>
                  <input value={empSearchKeyword} onChange={e => setEmpSearchKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') searchEmployees() }}
                    className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번으로 검색" autoFocus />
                </div>
                <button onClick={searchEmployees} className="px-4 py-2 bg-[#1D9E75] text-white text-sm rounded-lg hover:bg-[#178a65] transition-colors">검색</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {empSearchLoading ? (
                <div className="py-12 text-center text-gray-400 text-sm">검색 중...</div>
              ) : empSearchResults.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">검색 결과가 없습니다</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">사번</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">이름</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">부서</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">직급</th>
                      <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 w-16">선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empSearchResults.map(emp => {
                      const alreadyAdded = selectedEmps.some(s => s.empId === emp.empId)
                      return (
                        <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{emp.empNum}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{emp.empName}</td>
                          <td className="px-4 py-2.5 text-gray-600">{emp.deptName}</td>
                          <td className="px-4 py-2.5 text-gray-600">{emp.gradeName}</td>
                          <td className="px-4 py-2.5 text-center">
                            {alreadyAdded ? (
                              <span className="text-[10px] text-gray-400">추가됨</span>
                            ) : (
                              <button onClick={() => addEmployee(emp)} className="text-xs px-2.5 py-1 bg-[#1D9E75] text-white rounded hover:bg-[#178a65] transition-colors">선택</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[700px] mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{detailTarget.name}</h3>
                  <span className="text-[11px] font-mono text-gray-400">{detailTarget.empId}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    detailTarget.type === '직위변경' ? 'bg-purple-50 text-purple-600' :
                    detailTarget.type === '부서변경' ? 'bg-blue-50 text-blue-600' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>{detailTarget.type}</span>
                </div>
                <span className="text-[11px] text-gray-400">발령번호 {detailTarget.orderNo} · 등록일 {detailTarget.registeredDate}</span>
              </div>
              <button onClick={() => setDetailTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <div className="px-7 py-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-3">발령 정보</h4>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 w-28 text-xs">발령번호</td>
                        <td className="px-4 py-2.5 text-gray-800 font-mono">{detailTarget.orderNo}</td>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 w-28 text-xs">발령유형</td>
                        <td className="px-4 py-2.5 text-gray-800">{detailTarget.type}</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">발령일</td>
                        <td className="px-4 py-2.5 text-gray-800">{detailTarget.effectiveDate}</td>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">상태</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            detailTarget.status === '승인' ? 'bg-gray-100 text-gray-500' :
                            detailTarget.status === '반려' ? 'bg-gray-100 text-gray-500' :
                            'bg-yellow-50 text-yellow-600'
                          }`}>{detailTarget.status}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">공지 여부</td>
                        <td className="px-4 py-2.5 text-gray-800" colSpan={3}>{detailTarget.isPublic ? '공지완료' : '미공지'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-3">변경 내용</h4>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left w-24">구분</th>
                        <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">변경 전</th>
                        <th className="px-4 py-2.5 text-xs font-medium text-gray-400 text-center w-10"></th>
                        <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">변경 후</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailTarget.fromDept !== detailTarget.toDept && detailTarget.fromDept && detailTarget.toDept && (
                        <tr className="border-b border-gray-50">
                          <td className="px-4 py-2.5 text-xs text-gray-400">부서</td>
                          <td className="px-4 py-2.5 text-gray-700">{detailTarget.fromDept}</td>
                          <td className="px-4 py-2.5 text-center"><i className="fas fa-arrow-right text-[10px] text-gray-300"></i></td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium">{detailTarget.toDept}</td>
                        </tr>
                      )}
                      {detailTarget.fromRank !== detailTarget.toRank && detailTarget.fromRank && detailTarget.toRank && (
                        <tr className="border-b border-gray-50">
                          <td className="px-4 py-2.5 text-xs text-gray-400">직위</td>
                          <td className="px-4 py-2.5 text-gray-700">{detailTarget.fromRank}</td>
                          <td className="px-4 py-2.5 text-center"><i className="fas fa-arrow-right text-[10px] text-gray-300"></i></td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium">{detailTarget.toRank}</td>
                        </tr>
                      )}
                      {detailTarget.fromPosition !== detailTarget.toPosition && detailTarget.fromPosition && detailTarget.toPosition && (
                        <tr>
                          <td className="px-4 py-2.5 text-xs text-gray-400">보직</td>
                          <td className="px-4 py-2.5 text-gray-700">{detailTarget.fromPosition}</td>
                          <td className="px-4 py-2.5 text-center"><i className="fas fa-arrow-right text-[10px] text-gray-300"></i></td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium">{detailTarget.toPosition}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100">
              <button onClick={() => setDetailTarget(null)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">닫기</button>
              <button onClick={() => { setEditTarget(detailTarget); setDetailTarget(null) }}
                className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
                <i className="fas fa-pen mr-1.5 text-[10px]"></i>수정</button>
            </div>
          </div>
        </div>
      )}

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
