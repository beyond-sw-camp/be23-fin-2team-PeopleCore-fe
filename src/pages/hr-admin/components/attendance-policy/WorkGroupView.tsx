import { useState } from 'react'

interface WorkGroup {
  id: number; name: string; type: string; isDefault: boolean
  startTime: string; endTime: string; hours: number
  workDays: string; holidays: string; location: string; device: string; members: number
}

const WORK_TYPES = [
  { key: 'fixed', label: '고정근로/시차출퇴근', desc: '출퇴근 시간이 고정되어 있는 근무제입니다.' },
  { key: 'free', label: '자유출근', desc: '출근 시간을 자유롭게 선택할 수 있는 근무제입니다.' },
  { key: 'selective', label: '선택근로', desc: '일정 정산기간 내 총 근로시간만 채우면 되는 근무제입니다.' },
]

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

function WorkGroupAddForm({ onBack }: { onBack: () => void }) {
  const [workType, setWorkType] = useState('fixed')
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

  // 자동 출퇴근체크
  const [autoCheck, setAutoCheck] = useState(false)
  const [checkInBefore, setCheckInBefore] = useState('제한없음')
  const [checkInAfter, setCheckInAfter] = useState('제한없음')
  const [checkOutBefore, setCheckOutBefore] = useState('제한없음')
  const [checkOutAfter, setCheckOutAfter] = useState('제한없음')
  const [useAutoCheckIn, setUseAutoCheckIn] = useState(false)
  const [useAutoCheckOut, setUseAutoCheckOut] = useState(false)

  // 초과근로시간 인정
  const [overtimeRecognition, setOvertimeRecognition] = useState<'approval' | 'all'>('approval')

  // 근태체크 디바이스
  const [device, setDevice] = useState('웹 서비스')

  const selectedType = WORK_TYPES.find((t) => t.key === workType)
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

  const MINUTE_OPTIONS = ['제한없음', '5', '10', '15', '30', '60']

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <i className="fas fa-arrow-left text-[16px]" />
        </button>
        <h3 className="text-[18px] font-bold text-gray-900">근무그룹 추가</h3>
      </div>

      {/* 근무제 유형 선택 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {WORK_TYPES.map((t) => (
          <button key={t.key} onClick={() => setWorkType(t.key)}
            className={`px-4 py-2 text-[13px] rounded-full border transition-colors ${
              workType === t.key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-gray-500 mb-8">{selectedType?.desc}</p>

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
            <label className="text-[13px] font-semibold text-gray-900 mb-2 block">근무그룹 코드 <span className="text-gray-400 text-[11px] font-normal">ⓘ</span></label>
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

      {/* ─── 자동 출퇴근체크 기능 ─── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[14px] font-semibold text-gray-900">자동 출퇴근체크 기능</span>
          <span className="text-gray-400 text-[12px]">ⓘ</span>
          <button onClick={() => setAutoCheck(!autoCheck)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ml-2 ${autoCheck ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoCheck ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {autoCheck && (
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            {/* 정시출근 처리 */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={useAutoCheckIn} onChange={() => setUseAutoCheckIn(!useAutoCheckIn)} className="accent-[#1D9E75] w-4 h-4" />
                <span className="text-[12px] text-gray-700 font-medium">정시출근 처리</span>
                <span className="text-gray-400 text-[11px]">ⓘ</span>
              </label>
              <select value={checkInBefore} onChange={(e) => setCheckInBefore(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
                {MINUTE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <span className="text-[12px] text-gray-500">분 전</span>
              <span className="text-[12px] bg-[#E1F5EE] text-[#1D9E75] font-semibold px-3 py-1 rounded">출근시간 {startTime}</span>
              <select value={checkInAfter} onChange={(e) => setCheckInAfter(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
                {MINUTE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <span className="text-[12px] text-gray-500">분 후</span>
            </div>

            {/* 정시퇴근 처리 */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={useAutoCheckOut} onChange={() => setUseAutoCheckOut(!useAutoCheckOut)} className="accent-[#1D9E75] w-4 h-4" />
                <span className="text-[12px] text-gray-700 font-medium">정시퇴근 처리</span>
                <span className="text-gray-400 text-[11px]">ⓘ</span>
              </label>
              <select value={checkOutBefore} onChange={(e) => setCheckOutBefore(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
                {MINUTE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <span className="text-[12px] text-gray-500">분 전</span>
              <span className="text-[12px] bg-[#E1F5EE] text-[#1D9E75] font-semibold px-3 py-1 rounded">퇴근시간 {endTime}</span>
              <select value={checkOutAfter} onChange={(e) => setCheckOutAfter(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
                {MINUTE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <span className="text-[12px] text-gray-500">분 후</span>
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
        <div className="flex border border-gray-300 rounded-lg overflow-hidden w-fit">
          {['웹 서비스', '모바일 앱', 'PC 메신저'].map((d) => (
            <button key={d} onClick={() => setDevice(d)}
              className={`px-5 py-2 text-[13px] transition-colors ${device === d ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 하단 버튼 ─── */}
      <div className="flex justify-end gap-3">
        <button onClick={onBack}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">취소</button>
        <button disabled={!name.trim()}
          className={`px-6 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
            name.trim() ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>저장</button>
      </div>
    </div>
  )
}

export default function WorkGroupView() {
  const [groups] = useState<WorkGroup[]>([
    { id: 1, name: '기본그룹', type: '고정근로', isDefault: true, startTime: '09:00', endTime: '18:00', hours: 8, workDays: '월, 화, 수, 목, 금', holidays: '일', location: '', device: '웹 서비스', members: 40 },
  ])
  const [showAddForm, setShowAddForm] = useState(false)

  if (showAddForm) {
    return <WorkGroupAddForm onBack={() => setShowAddForm(false)} />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-800">근무그룹 관리</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">비활성 그룹 보기</button>
          <button onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">+ 근무그룹 추가</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="border-2 border-[#1D9E75]/30 rounded-xl p-5 hover:shadow-sm transition-all">
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
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">적용멤버</span><span className="text-gray-800">{g.members}</span></div>
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
    </div>
  )
}
