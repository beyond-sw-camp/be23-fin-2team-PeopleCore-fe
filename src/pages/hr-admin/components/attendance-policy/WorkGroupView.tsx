import { useState } from 'react'

interface WorkGroup {
  id: number; name: string; type: string; isDefault: boolean
  startTime: string; endTime: string; hours: number
  workDays: string; holidays: string; location: string; device: string; members: number
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

function WorkGroupAddForm({ onBack, onSave }: { onBack: () => void; onSave: (group: WorkGroup) => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [desc, setDesc] = useState('')

  // 기본 근무정책
  const [policyOpen, setPolicyOpen] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [workDays, setWorkDays] = useState(['월', '화', '수', '목', '금'])
  const [breakStart, setBreakStart] = useState('12:00')
  const [breakEnd, setBreakEnd] = useState('13:00')

  // 초과근로시간 인정
  const [overtimeRecognition, setOvertimeRecognition] = useState<'approval' | 'all'>('approval')

  // 근태체크 디바이스
  const [useMobileApp, setUseMobileApp] = useState(false)

  const restDays = WEEKDAYS.filter((d) => !workDays.includes(d))

  const workHours = (() => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const [bsh, bsm] = breakStart.split(':').map(Number)
    const [beh, bem] = breakEnd.split(':').map(Number)
    const total = (eh * 60 + em) - (sh * 60 + sm)
    const breakMin = (beh * 60 + bem) - (bsh * 60 + bsm)
    return Math.max(0, total - breakMin) / 60
  })()

  const breakMinutes = (() => {
    const [bsh, bsm] = breakStart.split(':').map(Number)
    const [beh, bem] = breakEnd.split(':').map(Number)
    return (beh * 60 + bem) - (bsh * 60 + bsm)
  })()

  const toggleDay = (day: string) => {
    setWorkDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])
  }


  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <i className="fas fa-arrow-left text-[16px]" />
        </button>
        <h3 className="text-[18px] font-bold text-gray-900">근무그룹 추가</h3>
      </div>

      {/* 기본 정보 */}
      <div className="space-y-5 mb-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[13px] font-semibold text-gray-900 mb-2 block">근무그룹 명 <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="근무그룹명을 입력하세요."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#1D9E75] transition-colors" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-gray-900 mb-2 block">근무그룹 코드 <span className="text-red-500">*</span></label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="근무그룹 코드를 입력하세요."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#1D9E75] transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-[13px] font-semibold text-gray-900 mb-2 block">근무그룹 설명</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="근무 그룹설명 입력 시, 임직원이 내 근태현황에서 적용 근무그룹에 대한 설명을 확인할 수 있습니다."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#1D9E75] transition-colors resize-y min-h-[100px]" />
        </div>
      </div>

      {/* ─── 기본 근무정책 ─── */}
      <div className="border border-gray-200 rounded-xl mb-4">
        <button onClick={() => setPolicyOpen(!policyOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left">
          <span className="text-[14px] font-semibold text-gray-900">기본 근무정책 <span className="text-red-500">*</span></span>
          <i className={`fas fa-chevron-down text-gray-400 text-[12px] transition-transform ${policyOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* 접혀있을 때 요약 */}
        {!policyOpen && (
          <div className="px-5 pb-4 -mt-2">
            <div className="text-[12px] text-[#1D9E75] font-semibold mb-1">현재 근무정책 설정</div>
            <p className="text-[11px] text-gray-400 mb-2">소정근로시간, 출퇴근시간, 근무요일, 휴게시간을 설정합니다.</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
              <span>1일 소정 근로시간 : <span className="text-[#1D9E75] font-semibold">{workHours}h</span></span>
              <span>출근시간 : <span className="text-[#1D9E75] font-semibold">{startTime}</span></span>
              <span>퇴근시간 : <span className="text-[#1D9E75] font-semibold">{endTime}</span></span>
              <span>휴게시간 : <span className="text-[#1D9E75] font-semibold">{Math.floor(breakMinutes / 60)}h {breakMinutes % 60}m</span></span>
              <span>근무요일 : <span className="text-[#1D9E75] font-semibold">{workDays.join(',')}</span></span>
              <span>주휴일 : <span className="text-[#1D9E75] font-semibold">{restDays.join(',') || '없음'}</span></span>
            </div>
          </div>
        )}

        {/* 펼쳐있을 때 */}
        {policyOpen && (
          <div className="px-5 pb-5 space-y-5 border-t border-gray-100 pt-4">
            <div className="text-[13px] text-[#1D9E75] font-semibold">현재 근무정책 설정</div>
            <p className="text-[11px] text-gray-400 -mt-3">소정근로시간, 출퇴근시간, 근무요일, 휴게시간을 설정합니다.</p>

            <div className="flex items-center gap-4">
              <span className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">출퇴근 시간</span>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <span className="text-[11px] text-gray-500">오전</span>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-[13px] outline-none font-medium" />
              </div>
              <span className="text-gray-400">~</span>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <span className="text-[11px] text-gray-500">오후</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-[13px] outline-none font-medium" />
              </div>
              <span className="text-[12px] text-[#1D9E75] font-semibold">소정근로 {workHours}h</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">근무요일</span>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((day) => (
                  <button key={day} onClick={() => toggleDay(day)}
                    className={`w-9 h-9 rounded-full text-[12px] font-medium transition-colors ${
                      workDays.includes(day)
                        ? 'bg-[#1D9E75] text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}>
                    {day}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-gray-400">주 {workDays.length}일</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">휴게시간</span>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <span className="text-[11px] text-gray-500">오후</span>
                <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} className="text-[13px] outline-none font-medium" />
              </div>
              <span className="text-gray-400">~</span>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <span className="text-[11px] text-gray-500">오후</span>
                <input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} className="text-[13px] outline-none font-medium" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">주휴일</span>
              <div className="flex gap-1.5">
                {restDays.length > 0 ? restDays.map((day) => (
                  <span key={day} className="w-9 h-9 rounded-full bg-red-50 text-red-400 text-[12px] font-medium flex items-center justify-center">{day}</span>
                )) : <span className="text-[12px] text-gray-400">없음</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 초과근로시간 인정여부 ─── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[14px] font-semibold text-gray-900">초과근로시간 인정여부</span>
          <span className="text-gray-400 text-[12px]">ⓘ</span>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" checked={overtimeRecognition === 'approval'} onChange={() => setOvertimeRecognition('approval')}
              className="accent-[#1D9E75] w-4 h-4" />
            <span className="text-[12px] text-gray-700">승인된 전자결재 <span className="text-[#1D9E75] font-semibold">시간만큼</span> 초과 근로시간 인정</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" checked={overtimeRecognition === 'all'} onChange={() => setOvertimeRecognition('all')}
              className="accent-[#1D9E75] w-4 h-4" />
            <span className="text-[12px] text-gray-700">전자결재 승인없이, <span className="text-[#1D9E75] font-semibold">초과된 근로시간 모두 인정</span></span>
          </label>
        </div>
      </div>

      {/* ─── 근태체크 디바이스 ─── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[14px] font-semibold text-gray-900">근태체크 디바이스</span>
          <span className="text-gray-400 text-[12px]">ⓘ</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-4 py-2 text-[13px] bg-gray-900 text-white rounded-lg">웹 서비스</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useMobileApp} onChange={() => setUseMobileApp(!useMobileApp)}
              className="accent-[#1D9E75] w-4 h-4" />
            <span className="text-[13px] text-gray-700">모바일 앱</span>
          </label>
        </div>
      </div>

      {/* ─── 하단 버튼 ─── */}
      <div className="flex justify-end gap-3">
        <button onClick={onBack}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">취소</button>
        <button disabled={!name.trim() || !code.trim()}
          onClick={() => {
            const restDays = WEEKDAYS.filter((d) => !workDays.includes(d))
            const device = useMobileApp ? '웹 서비스, 모바일 앱' : '웹 서비스'
            onSave({
              id: Date.now(),
              name,
              type: '고정근로',
              isDefault: false,
              startTime,
              endTime,
              hours: workHours,
              workDays: workDays.join(','),
              holidays: restDays.join(',') || '없음',
              location: '',
              device,
              members: 0,
            })
          }}
          className={`px-6 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
            name.trim() && code.trim() ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>저장</button>
      </div>
    </div>
  )
}

interface GroupMember {
  empId: number
  empNo: string
  name: string
  deptName: string
  gradeName: string
  titleName: string
  assignedAt: string
}

export default function WorkGroupView() {
  const [groups, setGroups] = useState<WorkGroup[]>([
    {
      id: 1, name: '기본 근무그룹', type: '고정근로', isDefault: true,
      startTime: '09:00', endTime: '18:00', hours: 8,
      workDays: '월,화,수,목,금', holidays: '토,일',
      location: '', device: '웹 서비스', members: 12,
    },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [memberModal, setMemberModal] = useState<{ groupId: number; groupName: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [editTarget, setEditTarget] = useState<WorkGroup | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])

  const DUMMY_MEMBERS: Record<number, GroupMember[]> = {
    1: [
      { empId: 1, empNo: 'EMP001', name: '김민수', deptName: '개발팀', gradeName: '과장', titleName: '팀장', assignedAt: '2024-01-15' },
      { empId: 2, empNo: 'EMP002', name: '이서연', deptName: '개발팀', gradeName: '대리', titleName: '', assignedAt: '2024-03-02' },
      { empId: 3, empNo: 'EMP003', name: '박지훈', deptName: '개발팀', gradeName: '사원', titleName: '', assignedAt: '2024-05-20' },
      { empId: 4, empNo: 'EMP004', name: '최유진', deptName: '인사팀', gradeName: '과장', titleName: '팀장', assignedAt: '2023-11-10' },
      { empId: 5, empNo: 'EMP005', name: '정하늘', deptName: '인사팀', gradeName: '대리', titleName: '', assignedAt: '2024-02-18' },
      { empId: 6, empNo: 'EMP006', name: '강도윤', deptName: '마케팅팀', gradeName: '차장', titleName: '팀장', assignedAt: '2023-08-05' },
      { empId: 7, empNo: 'EMP007', name: '윤서현', deptName: '마케팅팀', gradeName: '사원', titleName: '', assignedAt: '2024-07-22' },
      { empId: 8, empNo: 'EMP008', name: '임재호', deptName: '영업팀', gradeName: '부장', titleName: '팀장', assignedAt: '2023-06-01' },
      { empId: 9, empNo: 'EMP009', name: '한소희', deptName: '영업팀', gradeName: '대리', titleName: '', assignedAt: '2024-04-14' },
      { empId: 10, empNo: 'EMP010', name: '오준혁', deptName: '기획팀', gradeName: '과장', titleName: '팀장', assignedAt: '2023-12-08' },
      { empId: 11, empNo: 'EMP011', name: '신예린', deptName: '기획팀', gradeName: '사원', titleName: '', assignedAt: '2025-01-06' },
      { empId: 12, empNo: 'EMP012', name: '조태민', deptName: '개발팀', gradeName: '사원', titleName: '', assignedAt: '2025-02-11' },
    ],
  }

  const handleOpenMembers = (groupId: number, groupName: string) => {
    // TODO: API 호출 → GET /api/attendance/work-groups/{groupId}/members
    setMembers(DUMMY_MEMBERS[groupId] || [])
    setMemberModal({ groupId, groupName })
  }

  if (showAddForm) {
    return <WorkGroupAddForm onBack={() => setShowAddForm(false)} onSave={(group) => {
      setGroups((prev) => [...prev, group])
      setShowAddForm(false)
    }} />
  }

  if (editTarget) {
    return <WorkGroupAddForm onBack={() => setEditTarget(null)} onSave={(group) => {
      setGroups((prev) => prev.map((g) => g.id === editTarget.id ? { ...group, id: editTarget.id, isDefault: editTarget.isDefault, members: editTarget.members } : g))
      setEditTarget(null)
    }} />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-800">근무그룹 관리</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">+ 근무그룹 추가</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="border-2 border-[#1D9E75]/30 rounded-xl p-5 hover:shadow-sm transition-all relative">
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <button onClick={() => setEditTarget(g)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#1D9E75] hover:bg-[#E1F5EE] rounded-full transition-colors"
                title="근무그룹 수정">
                <i className="fas fa-pen text-[11px]" />
              </button>
              <button onClick={() => setDeleteTarget({ id: g.id, name: g.name })}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="근무그룹 삭제">
                <i className="fas fa-trash text-[12px]" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {g.isDefault && <span className="text-[10px] px-2 py-0.5 rounded bg-[#1D9E75] text-white font-medium">기본</span>}
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{g.type}</span>
            </div>
            <h4 className="text-[14px] font-bold text-gray-900 mb-3">{g.name}</h4>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">근로시간</span><span className="text-gray-800">{g.startTime} ~ {g.endTime} ({g.hours}h)</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">근무요일</span><span className="text-gray-800">{g.workDays}</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">주휴일</span><span className="text-gray-800">{g.holidays}</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">근무지</span><span className="text-gray-400">{g.location || '-'}</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">디바이스</span><span className="text-gray-800">{g.device}</span></div>
              <div className="flex">
                <span className="text-gray-500 w-20 shrink-0">적용멤버</span>
                <button onClick={() => handleOpenMembers(g.id, g.name)}
                  className="text-[#1D9E75] font-semibold hover:underline cursor-pointer">
                  {g.members}명
                </button>
              </div>
            </div>
          </div>
        ))}

        <div onClick={() => setShowAddForm(true)}
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 transition-all">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[18px] mb-3">+</div>
          <h4 className="text-[14px] font-semibold text-gray-700 mb-1">근무그룹 추가하기</h4>
          <p className="text-[11px] text-gray-400 text-center">회사 정책에 따른 근무제 유형을 선택하고,<br />근무 정책을 설정해보세요!</p>
        </div>
      </div>

      {/* 적용 멤버 모달 */}
      {memberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMemberModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[560px] max-h-[70vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">적용 멤버</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">{memberModal.groupName} 근무그룹에 소속된 사원</p>
              </div>
              <button onClick={() => setMemberModal(null)} className="text-gray-400 hover:text-gray-600 text-[18px]">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              {members.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-gray-400">소속된 사원이 없습니다</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">이름</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직책</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.empId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-gray-500">{m.empNo}</td>
                        <td className="px-3 py-2.5 text-gray-800 font-medium">{m.name}</td>
                        <td className="px-3 py-2.5 text-gray-600">{m.deptName}</td>
                        <td className="px-3 py-2.5 text-gray-600">{m.gradeName}</td>
                        <td className="px-3 py-2.5 text-gray-600">{m.titleName}</td>
                        <td className="px-3 py-2.5 text-gray-500">{m.assignedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button onClick={() => setMemberModal(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">닫기</button>
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
            <p className="text-[14px] font-semibold text-gray-900 mb-1">근무그룹 삭제</p>
            <p className="text-[13px] text-gray-500 mb-5">"{deleteTarget.name}" 근무그룹을 삭제하시겠습니까?</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={() => {
                setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id))
                setDeleteTarget(null)
              }}
                className="px-5 py-2 bg-red-500 text-white text-[13px] font-medium rounded-lg hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
