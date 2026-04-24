import { useState, useEffect } from 'react'
import {
  attendanceApi,
  encodeWorkDays,
  decodeWorkDays,
  type WorkGroupListItem,
  type WorkGroupDetail,
  type WorkGroupMember,
  type WorkGroupReq,
} from '../../../../api/attendance'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

const toHHmm = (t: string) => (t || '').slice(0, 5)
const toHHmmss = (t: string) => (t.length === 5 ? `${t}:00` : t)

interface FormInitial {
  workGroupId?: number
  groupName: string
  groupCode: string
  groupDesc: string
  startTime: string
  endTime: string
  workDays: string[]
  breakStart: string
  breakEnd: string
  overtimeRecognize: 'APPROVAL' | 'ALL'
}

const DEFAULT_INITIAL: FormInitial = {
  groupName: '',
  groupCode: '',
  groupDesc: '',
  startTime: '09:00',
  endTime: '18:00',
  workDays: ['월', '화', '수', '목', '금'],
  breakStart: '12:00',
  breakEnd: '13:00',
  overtimeRecognize: 'APPROVAL',
}

function WorkGroupForm({
  initial,
  isEdit,
  onBack,
  onSave,
}: {
  initial: FormInitial
  isEdit: boolean
  onBack: () => void
  onSave: (req: WorkGroupReq) => Promise<void>
}) {
  const [name, setName] = useState(initial.groupName)
  const [code, setCode] = useState(initial.groupCode)
  const [desc, setDesc] = useState(initial.groupDesc)
  const [policyOpen, setPolicyOpen] = useState(true)
  const [startTime, setStartTime] = useState(initial.startTime)
  const [endTime, setEndTime] = useState(initial.endTime)
  const [workDays, setWorkDays] = useState<string[]>(initial.workDays)
  const [breakStart, setBreakStart] = useState(initial.breakStart)
  const [breakEnd, setBreakEnd] = useState(initial.breakEnd)
  const [overtimeRecognition, setOvertimeRecognition] = useState<'APPROVAL' | 'ALL'>(initial.overtimeRecognize)
  const [saving, setSaving] = useState(false)

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

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        groupName: name.trim(),
        groupCode: code.trim(),
        groupDesc: desc,
        groupStartTime: toHHmmss(startTime),
        groupEndTime: toHHmmss(endTime),
        groupWorkDay: encodeWorkDays(workDays),
        groupBreakStart: toHHmmss(breakStart),
        groupBreakEnd: toHHmmss(breakEnd),
        groupOvertimeRecognize: overtimeRecognition,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <i className="fas fa-arrow-left text-[16px]" />
        </button>
        <h3 className="text-[18px] font-bold text-gray-900">{isEdit ? '근무그룹 수정' : '근무그룹 추가'}</h3>
      </div>

      <div className="space-y-5 mb-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[13px] font-semibold text-gray-900 mb-2 block">근무그룹 명 <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="근무그룹명을 입력하세요."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#1D9E75] transition-colors" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-gray-900 mb-2 block">
              근무그룹 코드 <span className="text-red-500">*</span>
              {isEdit && <span className="text-[11px] text-gray-400 font-normal ml-2">(수정 불가)</span>}
            </label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit}
              placeholder="근무그룹 코드를 입력하세요."
              className={`w-full border border-gray-300 rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#1D9E75] transition-colors ${isEdit ? 'bg-gray-50 text-gray-500' : ''}`} />
          </div>
        </div>
        <div>
          <label className="text-[13px] font-semibold text-gray-900 mb-2 block">근무그룹 설명</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="근무 그룹설명 입력 시, 임직원이 내 근태현황에서 적용 근무그룹에 대한 설명을 확인할 수 있습니다."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#1D9E75] transition-colors resize-y min-h-[100px]" />
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl mb-4">
        <button onClick={() => setPolicyOpen(!policyOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left">
          <span className="text-[14px] font-semibold text-gray-900">기본 근무정책 <span className="text-red-500">*</span></span>
          <i className={`fas fa-chevron-down text-gray-400 text-[12px] transition-transform ${policyOpen ? 'rotate-180' : ''}`} />
        </button>

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

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[14px] font-semibold text-gray-900">초과근로시간 인정여부</span>
          <span className="text-gray-400 text-[12px]">ⓘ</span>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" checked={overtimeRecognition === 'APPROVAL'} onChange={() => setOvertimeRecognition('APPROVAL')}
              className="accent-[#1D9E75] w-4 h-4" />
            <span className="text-[12px] text-gray-700">승인된 전자결재 <span className="text-[#1D9E75] font-semibold">시간만큼</span> 초과 근로시간 인정</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" checked={overtimeRecognition === 'ALL'} onChange={() => setOvertimeRecognition('ALL')}
              className="accent-[#1D9E75] w-4 h-4" />
            <span className="text-[12px] text-gray-700">전자결재 승인없이, <span className="text-[#1D9E75] font-semibold">초과된 근로시간 모두 인정</span></span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onBack}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">취소</button>
        <button disabled={!name.trim() || !code.trim() || saving}
          onClick={handleSave}
          className={`px-6 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
            name.trim() && code.trim() && !saving ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>{saving ? '저장 중...' : '저장'}</button>
      </div>
    </div>
  )
}

export default function WorkGroupView() {
  const [groups, setGroups] = useState<WorkGroupListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editInitial, setEditInitial] = useState<FormInitial | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [memberModal, setMemberModal] = useState<{ groupId: number; groupName: string } | null>(null)
  const [members, setMembers] = useState<WorkGroupMember[]>([])
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(new Set())
  const [transferModal, setTransferModal] = useState(false)
  const [transferTarget, setTransferTarget] = useState<number | ''>('')
  const [transferring, setTransferring] = useState(false)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)
  const [memberLoading, setMemberLoading] = useState(false)

  const loadGroups = async () => {
    setLoading(true)
    try {
      const data = await attendanceApi.getWorkGroups()
      setGroups(data)
    } catch {
      setModal({ type: 'error', message: '근무그룹 목록을 불러오지 못했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGroups() }, [])

  const loadMembers = async (groupId: number, p: number, s: number) => {
    setMemberLoading(true)
    try {
      const res = await attendanceApi.getWorkGroupMembers(groupId, p, s)
      setMembers(res.content)
      setTotalElements(res.totalElements)
      setTotalPages(Math.max(1, res.totalPages))
    } catch {
      setMembers([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setMemberLoading(false)
    }
  }

  const handleOpenMembers = (groupId: number, groupName: string) => {
    setPage(0)
    setPageSize(10)
    setSelectedEmpIds(new Set())
    setMemberModal({ groupId, groupName })
    loadMembers(groupId, 0, 10)
  }

  const toggleEmp = (empId: number) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev)
      if (next.has(empId)) next.delete(empId); else next.add(empId)
      return next
    })
  }

  const toggleAllOnPage = () => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev)
      const allSelected = members.every((m) => next.has(m.empId))
      if (allSelected) members.forEach((m) => next.delete(m.empId))
      else members.forEach((m) => next.add(m.empId))
      return next
    })
  }

  const handleTransfer = async () => {
    if (!memberModal || !transferTarget || selectedEmpIds.size === 0) return
    setTransferring(true)
    try {
      const res = await attendanceApi.transferMembers(memberModal.groupId, {
        targetWorkGroupId: Number(transferTarget),
        empIds: Array.from(selectedEmpIds),
      })
      setTransferModal(false)
      setTransferTarget('')
      setSelectedEmpIds(new Set())
      setModal({ type: 'success', message: `${res.movedCount}명이 이관되었습니다.` })
      loadMembers(memberModal.groupId, page, pageSize)
      loadGroups()
    } catch (e: unknown) {
      const msg = extractErrorMessage(e) ?? '이관에 실패했습니다.'
      setModal({ type: 'error', message: msg })
    } finally {
      setTransferring(false)
    }
  }

  const handleChangePage = (newPage: number) => {
    if (!memberModal) return
    setPage(newPage)
    loadMembers(memberModal.groupId, newPage, pageSize)
  }

  const handleChangeSize = (newSize: number) => {
    if (!memberModal) return
    setPageSize(newSize)
    setPage(0)
    loadMembers(memberModal.groupId, 0, newSize)
  }

  const handleEdit = async (groupId: number) => {
    try {
      const detail = await attendanceApi.getWorkGroup(groupId)
      setEditInitial(detailToInitial(detail))
    } catch {
      setModal({ type: 'error', message: '근무그룹 정보를 불러오지 못했습니다.' })
    }
  }

  const handleCreate = async (req: WorkGroupReq) => {
    try {
      await attendanceApi.createWorkGroup(req)
      setShowAddForm(false)
      setModal({ type: 'success', message: '근무그룹이 생성되었습니다.' })
      loadGroups()
    } catch (e: unknown) {
      const msg = extractErrorMessage(e) ?? '근무그룹 생성에 실패했습니다.'
      setModal({ type: 'error', message: msg })
    }
  }

  const handleUpdate = async (req: WorkGroupReq) => {
    if (!editInitial?.workGroupId) return
    try {
      await attendanceApi.updateWorkGroup(editInitial.workGroupId, req)
      setEditInitial(null)
      setModal({ type: 'success', message: '근무그룹이 수정되었습니다.' })
      loadGroups()
    } catch (e: unknown) {
      const msg = extractErrorMessage(e) ?? '근무그룹 수정에 실패했습니다.'
      setModal({ type: 'error', message: msg })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await attendanceApi.deleteWorkGroup(deleteTarget.id)
      setDeleteTarget(null)
      setModal({ type: 'success', message: '근무그룹이 삭제되었습니다.' })
      loadGroups()
    } catch (e: unknown) {
      const msg = extractErrorMessage(e) ?? '근무그룹 삭제에 실패했습니다.'
      setDeleteTarget(null)
      setModal({ type: 'error', message: msg })
    }
  }

  if (showAddForm) {
    return <WorkGroupForm initial={DEFAULT_INITIAL} isEdit={false} onBack={() => setShowAddForm(false)} onSave={handleCreate} />
  }

  if (editInitial) {
    return <WorkGroupForm initial={editInitial} isEdit onBack={() => setEditInitial(null)} onSave={handleUpdate} />
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

      {loading ? (
        <div className="text-[13px] text-gray-400 py-10 text-center">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {groups.map((g) => {
            const workDays = decodeWorkDays(g.groupWorkDay)
            const restDays = WEEKDAYS.filter((d) => !workDays.includes(d))
            return (
              <div key={g.workGroupId} className="border-2 border-[#1D9E75]/30 rounded-xl p-5 hover:shadow-sm transition-all relative">
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button onClick={() => handleEdit(g.workGroupId)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#1D9E75] hover:bg-[#E1F5EE] rounded-full transition-colors"
                    title="근무그룹 수정">
                    <i className="fas fa-pen text-[11px]" />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: g.workGroupId, name: g.groupName })}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="근무그룹 삭제">
                    <i className="fas fa-trash text-[12px]" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{g.groupCode}</span>
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">{g.groupName}</h4>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex"><span className="text-gray-500 w-20 shrink-0">근로시간</span><span className="text-gray-800">{toHHmm(g.groupStartTime)} ~ {toHHmm(g.groupEndTime)}</span></div>
                  <div className="flex"><span className="text-gray-500 w-20 shrink-0">근무요일</span><span className="text-gray-800">{workDays.join(',') || '없음'}</span></div>
                  <div className="flex"><span className="text-gray-500 w-20 shrink-0">주휴일</span><span className="text-gray-800">{restDays.join(',') || '없음'}</span></div>
                  <div className="flex">
                    <span className="text-gray-500 w-20 shrink-0">적용사원</span>
                    <button onClick={() => handleOpenMembers(g.workGroupId, g.groupName)}
                      className="text-[#1D9E75] font-semibold hover:underline cursor-pointer">
                      {g.memberCount}명
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          <div onClick={() => setShowAddForm(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[18px] mb-3">+</div>
            <h4 className="text-[14px] font-semibold text-gray-700 mb-1">근무그룹 추가하기</h4>
            <p className="text-[11px] text-gray-400 text-center">회사 정책에 따른 근무제 유형을 선택하고,<br />근무 정책을 설정해보세요!</p>
          </div>
        </div>
      )}

      {memberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMemberModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[560px] max-h-[70vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">적용 사원</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">{memberModal.groupName} 근무그룹에 소속된 사원</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setTransferTarget(''); setTransferModal(true) }}
                  disabled={selectedEmpIds.size === 0}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors ${selectedEmpIds.size > 0 ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  이관 {selectedEmpIds.size > 0 && `(${selectedEmpIds.size})`}
                </button>
                <button onClick={() => setMemberModal(null)} className="text-gray-400 hover:text-gray-600 text-[18px]">×</button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              {memberLoading ? (
                <div className="text-center py-12 text-[13px] text-gray-400">불러오는 중...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-gray-400">소속된 사원이 없습니다</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="px-3 py-2.5 text-left w-8">
                        <input type="checkbox"
                          checked={members.length > 0 && members.every((m) => selectedEmpIds.has(m.empId))}
                          onChange={toggleAllOnPage}
                          className="accent-[#1D9E75] w-4 h-4" />
                      </th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">이름</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직책</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.empId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={selectedEmpIds.has(m.empId)} onChange={() => toggleEmp(m.empId)}
                            className="accent-[#1D9E75] w-4 h-4" />
                        </td>
                        <td className="px-3 py-2.5 text-gray-800 font-medium">{m.empName}</td>
                        <td className="px-3 py-2.5 text-gray-600">{m.deptName}</td>
                        <td className="px-3 py-2.5 text-gray-600">{m.gradeName}</td>
                        <td className="px-3 py-2.5 text-gray-600">{m.titleName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-500">페이지당</span>
                <select value={pageSize} onChange={(e) => handleChangeSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1D9E75]">
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-[12px] text-gray-400">총 {totalElements}명</span>
              </div>
              <div className="flex items-center gap-2">
                {totalElements > 0 && (
                  <>
                    <button onClick={() => handleChangePage(Math.max(0, page - 1))} disabled={page === 0}
                      className="px-2 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">이전</button>
                    <span className="text-[12px] text-gray-600">{page + 1} / {totalPages}</span>
                    <button onClick={() => handleChangePage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                      className="px-2 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">다음</button>
                  </>
                )}
                <button onClick={() => setMemberModal(null)}
                  className="px-4 py-1.5 border border-gray-300 text-gray-600 text-[12px] font-medium rounded hover:bg-gray-50 ml-2">닫기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {transferModal && memberModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !transferring && setTransferModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[420px] p-6">
            <h2 className="text-[15px] font-bold text-gray-900 mb-1">근무그룹 이관</h2>
            <p className="text-[12px] text-gray-500 mb-4">선택한 <span className="text-[#1D9E75] font-semibold">{selectedEmpIds.size}명</span>을 이관할 대상 그룹을 선택하세요.</p>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">이관 대상 근무그룹</label>
            <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75] mb-5">
              <option value="">근무그룹 선택</option>
              {groups.filter((g) => g.workGroupId !== memberModal.groupId).map((g) => (
                <option key={g.workGroupId} value={g.workGroupId}>{g.groupName} ({g.groupCode})</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setTransferModal(false)} disabled={transferring}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">취소</button>
              <button onClick={handleTransfer} disabled={!transferTarget || transferring}
                className={`px-5 py-2 text-[13px] font-medium rounded-lg transition-colors ${transferTarget && !transferring ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {transferring ? '이관 중...' : '이관하기'}
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
            <p className="text-[14px] font-semibold text-gray-900 mb-1">근무그룹 삭제</p>
            <p className="text-[13px] text-gray-500 mb-5">"{deleteTarget.name}" 근무그룹을 삭제하시겠습니까?</p>
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
              className="px-6 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">확인</button>
          </div>
        </div>
      )}
    </div>
  )
}

function detailToInitial(d: WorkGroupDetail): FormInitial {
  return {
    workGroupId: d.workGroupId,
    groupName: d.groupName,
    groupCode: d.groupCode,
    groupDesc: d.groupDesc ?? '',
    startTime: toHHmm(d.groupStartTime),
    endTime: toHHmm(d.groupEndTime),
    workDays: decodeWorkDays(d.groupWorkDay),
    breakStart: toHHmm(d.groupBreakStart),
    breakEnd: toHHmm(d.groupBreakEnd),
    overtimeRecognize: d.groupOvertimeRecognize,
  }
}

function extractErrorMessage(e: unknown): string | undefined {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const res = (e as { response?: { data?: { message?: string; code?: string } } }).response
    if (res?.data?.code === 'WORK_GROUP_HAS_MEMBERS') {
      return '소속된 멤버가 있어 삭제할 수 없습니다. 멤버를 다른 그룹으로 이동한 후 삭제하세요.'
    }
    if (res?.data?.code === 'WORK_GROUP_CODE_DUPLICATE') {
      return '이미 존재하는 근무그룹 코드입니다.'
    }
    if (res?.data?.code === 'WORK_GROUP_TRANSFER_SAME_TARGET') {
      return '출발 그룹과 도착 그룹이 동일합니다. 다른 그룹을 선택해주세요.'
    }
    if (res?.data?.code === 'WORK_GROUP_TRANSFER_DIFFERENT_COMPANY') {
      return '다른 회사의 근무그룹으로는 이관할 수 없습니다.'
    }
    if (res?.data?.code === 'WORK_GROUP_TRANSFER_INVALID_MEMBERS') {
      return '선택한 사원 중 이 그룹에 소속되지 않은 사원이 포함되어 있습니다. 사원 목록을 새로고침 후 다시 시도해주세요.'
    }
    return res?.data?.message
  }
  return undefined
}
