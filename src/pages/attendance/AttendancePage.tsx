import { useEffect, useState } from 'react'
import { openApprovalWindow, subscribeApprovalCompleted } from '../../utils/approvalWindow'
import LeaveStatusView from './components/LeaveStatusView'
import LeaveHistoryView from './components/LeaveHistoryView'
import AttendanceView from './components/AttendanceView'
import HrManagerView from './components/HrManagerView'
import { type HrSubTab } from './components/HrManagerView'
import LeaveApplyModal from './components/LeaveApplyModal'
import type { LeaveApplyData } from './components/LeaveApplyModal'
import VacationGrantRequestModal from './components/VacationGrantRequestModal'
import type { VacationGrantRequestData } from './components/VacationGrantRequestModal'
import OvertimeApplyModal from './components/OvertimeApplyModal'
import type { OvertimeApplyData } from './components/OvertimeApplyModal'
import AttendanceCorrectionModal from './components/AttendanceCorrectionModal'
import type { AttendanceCorrectionData } from './components/AttendanceCorrectionModal'
import { formatHm } from '../../api/attendance'
import { attendanceApi, type CheckInRes, type CheckOutRes, type MyWorkGroup } from '../../api/attendance'
import { useAuth } from '../../contexts/AuthContext'

const toHHmm = (iso: string | null | undefined) => iso ? iso.slice(11, 16) : '-'

function extractCommuteError(e: unknown): string | undefined {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const res = (e as { response?: { data?: { message?: string; errorCode?: string; code?: string } } }).response
    const code = res?.data?.errorCode ?? res?.data?.code
    if (code === 'COMMUTE_ALREADY_CHECKED_IN') return '이미 오늘 출근 체크가 완료되었습니다.'
    if (code === 'COMMUTE_ALREADY_CHECKED_OUT') return '이미 오늘 퇴근 체크가 완료되었습니다.'
    if (code === 'COMMUTE_NOT_CHECKED_IN') return '오늘 출근 기록이 없어 퇴근 체크를 할 수 없습니다.'
    if (code === 'EMPLOYEE_WORK_GROUP_NOT_ASSIGNED') return '근무 그룹이 배정되지 않았습니다. 관리자에게 문의하세요.'
    if (code === 'EMPLOYEE_NOT_FOUND') return '사원 정보를 찾을 수 없습니다.'
    return res?.data?.message
  }
  return undefined
}

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
type MainTab = '휴가관리' | '근태관리' | '인사담당자'
type LeaveSubTab = '휴가현황' | '휴가내역'

/* ══════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════ */
export default function AttendancePage() {
  const { isHRAdmin, user } = useAuth()
  const [mainTab, setMainTab] = useState<MainTab>('휴가관리')
  const [leaveSubTab, setLeaveSubTab] = useState<LeaveSubTab>('휴가현황')
  const [leaveApplyOpen, setLeaveApplyOpen] = useState(false)
  const [grantRequestOpen, setGrantRequestOpen] = useState(false)
  const [overtimeApplyOpen, setOvertimeApplyOpen] = useState(false)
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [correctionDate, setCorrectionDate] = useState<string | undefined>(undefined)
  const [hrSubTab, setHrSubTab] = useState<HrSubTab>('전사 근태현황')

  // 일반 사원이 인사담당자 탭에 머무르지 않도록 가드
  useEffect(() => {
    if (!isHRAdmin && mainTab === '인사담당자') {
      setMainTab('휴가관리')
    }
  }, [isHRAdmin, mainTab])

  const [checkIn, setCheckIn] = useState<CheckInRes | null>(null)
  const [checkOut, setCheckOut] = useState<CheckOutRes | null>(null)
  const [todayIn, setTodayIn] = useState<string | null>(null)
  const [todayOut, setTodayOut] = useState<string | null>(null)
  const [myWorkGroup, setMyWorkGroup] = useState<MyWorkGroup | null>(null)
  const [commuteLoading, setCommuteLoading] = useState(false)
  const [commuteModal, setCommuteModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  // 결재 팝업이 완료되면 증가시켜 하위 뷰를 재조회시킴
  const [refreshSignal, setRefreshSignal] = useState(0)

  useEffect(() => {
    let cancelled = false
    const loadSummary = () => {
      attendanceApi.getMyWeeklySummary()
        .then((res) => {
          if (cancelled) return
          setTodayIn(res.today.checkIn)
          setTodayOut(res.today.checkOut)
          setMyWorkGroup(res.workGroup)
        })
        .catch(() => { /* 최초 조회 실패 시 버튼 액션으로만 상태 갱신 */ })
    }
    loadSummary()
    return () => { cancelled = true }
  }, [refreshSignal])

  // 결재 팝업 완료 감지 → 출퇴근 요약/휴가 잔여 리프레시
  useEffect(() => {
    return subscribeApprovalCompleted((event) => {
      if (event.type === 'closed' || event.type === 'submitted') {
        setRefreshSignal((n) => n + 1)
      }
    })
  }, [])

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const todayStr = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일 (${dayNames[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const handleCheckIn = async () => {
    if (commuteLoading) return
    setCommuteLoading(true)
    try {
      const res = await attendanceApi.checkIn()
      setCheckIn(res)
      setTodayIn(toHHmm(res.checkInAt))
      setCommuteModal({ type: 'success', message: `출근 완료 · ${toHHmm(res.checkInAt)}` })
    } catch (e: unknown) {
      setCommuteModal({ type: 'error', message: extractCommuteError(e) ?? '출근 체크에 실패했습니다.' })
    } finally {
      setCommuteLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (commuteLoading) return
    setCommuteLoading(true)
    try {
      const res = await attendanceApi.checkOut()
      setCheckOut(res)
      setTodayOut(toHHmm(res.checkOutAt))
      if (!checkIn) {
        setCheckIn({
          comRecId: res.comRecId, workDate: res.workDate, checkInAt: res.checkInAt,
          checkInIp: res.checkOutIp, isOffsite: res.isOffsite,
          checkInStatus: 'ON_TIME', holidayReason: res.holidayReason,
        })
        setTodayIn(toHHmm(res.checkInAt))
      }
      setCommuteModal({ type: 'success', message: `퇴근 완료 · ${toHHmm(res.checkOutAt)}` })
    } catch (e: unknown) {
      setCommuteModal({ type: 'error', message: extractCommuteError(e) ?? '퇴근 체크에 실패했습니다.' })
    } finally {
      setCommuteLoading(false)
    }
  }

  const checkedIn = checkIn !== null || todayIn !== null
  const checkedOut = checkOut !== null || todayOut !== null

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000] mb-3">
            {mainTab === '휴가관리' ? '휴가' : mainTab === '근태관리' ? '근태' : '인사 담당자'}
          </h2>

          {mainTab === '휴가관리' && (
            <div className="space-y-2">
              <button onClick={() => setLeaveApplyOpen(true)}
                className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] transition-colors">
                휴가 신청
              </button>
              <button onClick={() => setGrantRequestOpen(true)}
                className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] transition-colors">
                휴가 부여 요청
              </button>
            </div>
          )}

          {mainTab === '근태관리' && (
            <div>
              <div className="text-[11px] text-gray-500 mb-2">{todayStr}</div>
              {myWorkGroup && (
                <div className="text-[11px] text-gray-600 mb-2">
                  <span className="font-medium text-gray-800">{myWorkGroup.groupName}</span>
                  <span className="text-gray-400"> · {myWorkGroup.groupStartTime} ~ {myWorkGroup.groupEndTime}</span>
                </div>
              )}
              <div className="border border-gray-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>출근 시간</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    !checkedIn ? 'bg-gray-100 text-gray-500'
                    : !checkedOut ? 'bg-[#E1F5EE] text-[#1D9E75]'
                    : 'bg-gray-100 text-gray-700'
                  }`}>
                    {!checkedIn ? '미출근' : !checkedOut ? '근무 중' : '퇴근 완료'}
                  </span>
                  <span>퇴근 시간</span>
                </div>
                <div className="flex items-center justify-between text-[14px] font-bold text-gray-900">
                  <span className={checkedIn ? 'text-[#1D9E75]' : 'text-gray-400'}>{todayIn ?? '-'}</span>
                  <span className="text-gray-300">→</span>
                  <span className={checkedOut ? 'text-gray-900' : 'text-gray-400'}>{todayOut ?? '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={handleCheckIn}
                  disabled={commuteLoading || checkedIn}
                  className={`py-2 border rounded-lg text-[12px] transition-colors ${checkedIn ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-[#1D9E75] text-[#1D9E75] hover:bg-[#E1F5EE]'} ${commuteLoading ? 'opacity-60 cursor-wait' : ''}`}
                >출근하기</button>
                <button
                  onClick={handleCheckOut}
                  disabled={commuteLoading || !checkedIn || checkedOut}
                  className={`py-2 border rounded-lg text-[12px] transition-colors ${(!checkedIn || checkedOut) ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-gray-700 text-gray-700 hover:bg-gray-50'} ${commuteLoading ? 'opacity-60 cursor-wait' : ''}`}
                >퇴근하기</button>
              </div>
              <button onClick={() => setOvertimeApplyOpen(true)}
                className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] transition-colors">
                추가 근로 신청
              </button>
            </div>
          )}
        </div>

        {/* 사이드 메뉴 */}
        <nav className="p-2 space-y-0.5">
          {/* 휴가관리 */}
          <div
            onClick={() => setMainTab('휴가관리')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] transition-colors ${mainTab === '휴가관리' ? 'text-[#1D9E75] font-medium' : 'text-[#000000] hover:bg-[#E1F5EE]'}`}
          >
            휴가 관리
          </div>
          {mainTab === '휴가관리' && (
            <div className="ml-4 space-y-0.5">
              <div onClick={() => setLeaveSubTab('휴가현황')}
                className={`px-3 py-1.5 text-[12px] cursor-pointer rounded transition-colors ${leaveSubTab === '휴가현황' ? 'text-[#1D9E75] font-medium' : 'text-gray-600 hover:bg-[#E1F5EE]'}`}>
                휴가현황
              </div>
              <div onClick={() => setLeaveSubTab('휴가내역')}
                className={`px-3 py-1.5 text-[12px] cursor-pointer rounded transition-colors ${leaveSubTab === '휴가내역' ? 'text-[#1D9E75] font-medium' : 'text-gray-600 hover:bg-[#E1F5EE]'}`}>
                휴가내역
              </div>
            </div>
          )}

          {/* 근태관리 */}
          <div
            onClick={() => setMainTab('근태관리')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] transition-colors ${mainTab === '근태관리' ? 'text-[#1D9E75] font-medium' : 'text-[#000000] hover:bg-[#E1F5EE]'}`}
          >
            근태 관리
          </div>

          {/* 인사 담당자 — HR_ADMIN / HR_SUPER_ADMIN 전용 */}
          {isHRAdmin && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider select-none">
                인사 담당자
              </div>
              <div className="space-y-0.5">
                {(['전사 근태현황', '전사 휴가 관리', '초과근무', '정정 관리'] as HrSubTab[]).map((sub) => (
                  <div key={sub} onClick={() => { setMainTab('인사담당자'); setHrSubTab(sub) }}
                    className={`px-3 py-1.5 text-[12px] cursor-pointer rounded transition-colors ${mainTab === '인사담당자' && hrSubTab === sub ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-gray-600 hover:bg-[#E1F5EE]'}`}>
                    {sub}
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {mainTab === '휴가관리' && leaveSubTab === '휴가현황' && <LeaveStatusView key={`status-${refreshSignal}`} onOpenApply={() => setLeaveApplyOpen(true)} />}
        {mainTab === '휴가관리' && leaveSubTab === '휴가내역' && <LeaveHistoryView key={`history-${refreshSignal}`} />}
        {mainTab === '근태관리' && (
          <AttendanceView
            key={`attendance-${refreshSignal}`}
            onOpenApply={() => setOvertimeApplyOpen(true)}
            onOpenCorrection={(date) => { setCorrectionDate(date); setCorrectionOpen(true) }}
          />
        )}
        {mainTab === '인사담당자' && isHRAdmin && <HrManagerView key={`hr-${refreshSignal}`} subTab={hrSubTab} />}
      </div>

      {commuteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCommuteModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-[360px] p-5" onClick={(e) => e.stopPropagation()}>
            <div className={`text-[14px] font-bold mb-2 ${commuteModal.type === 'success' ? 'text-[#1D9E75]' : 'text-red-500'}`}>
              {commuteModal.type === 'success' ? '완료' : '오류'}
            </div>
            <div className="text-[13px] text-gray-700 mb-4">{commuteModal.message}</div>
            <div className="flex justify-end">
              <button onClick={() => setCommuteModal(null)} className="px-4 py-1.5 text-[12px] bg-gray-900 text-white rounded-lg hover:bg-gray-800">확인</button>
            </div>
          </div>
        </div>
      )}

      {leaveApplyOpen && (
        <LeaveApplyModal
          onClose={() => setLeaveApplyOpen(false)}
          onSubmitToApproval={(data: LeaveApplyData) => {
            setLeaveApplyOpen(false)
            const today = new Date()
            const requestDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            // 휴가신청서.html(default-form)의 input name과 1:1 매칭되어 자동 채워진다.
            // 부서/직급/직책이 미할당된 사원이라도 빈 칸으로 보이지 않도록 '미배정'으로 폴백.
            const orUnassigned = (v?: string) => (v && v.trim()) ? v : '미배정'
            const drafterPrefill = {
              title: `${user?.empName ?? ''} ${data.type} 신청서`.trim(),
              emp_name: user?.empName ?? '',
              emp_dept_name: orUnassigned(user?.deptName),
              emp_grade_name: orUnassigned(user?.gradeName),
              emp_title_name: orUnassigned(user?.titleName),
              request_date: requestDate,
              vacationTypeName: data.type,
            }
            openApprovalWindow({
              openForm: {
                name: '휴가신청',
                folder: '인사',
                retention: '5',
                formCode: 'VACATION_REQUEST',
              },
              prefill: {
                formCode: 'VACATION_REQUEST',
                infoId: data.infoId,
                vacReqStartat: data.vacReqStartat,
                vacReqEndat: data.vacReqEndat,
                vacReqUseDay: data.totalDays,
                vacReqReason: data.vacReqReason,
                ...drafterPrefill,
              },
              docDataOverride: {
                infoId: data.infoId,
                vacReqStartat: data.vacReqStartat,
                vacReqEndat: data.vacReqEndat,
                vacReqUseDay: data.totalDays,
                vacReqReason: data.vacReqReason,
                ...drafterPrefill,
              },
              leaveData: data,
            }, data.attachments)
          }}
        />
      )}

      {grantRequestOpen && (
        <VacationGrantRequestModal
          onClose={() => setGrantRequestOpen(false)}
          onSubmitToApproval={(data: VacationGrantRequestData) => {
            setGrantRequestOpen(false)
            const today = new Date()
            const requestDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            const docTitle = `${data.typeName} 부여 신청`
            // 휴가 부여 신청.html(default-form)의 emp_name/emp_dept_name/emp_grade_name/emp_title_name 자동 채움.
            const orUnassigned = (v?: string) => (v && v.trim()) ? v : '미배정'
            const drafterPrefill = {
              emp_name: user?.empName ?? '',
              emp_dept_name: orUnassigned(user?.deptName),
              emp_grade_name: orUnassigned(user?.gradeName),
              emp_title_name: orUnassigned(user?.titleName),
            }
            openApprovalWindow({
              openForm: {
                name: '휴가부여요청',
                folder: '인사',
                retention: '5',
                formCode: 'VACATION_GRANT_REQUEST',
              },
              prefill: {
                formCode: 'VACATION_GRANT_REQUEST',
                title: docTitle,
                request_date: requestDate,
                infoId: data.typeId,
                vacationTypeName: data.typeName,
                vacReqUseDay: data.requestDays,
                vacReqReason: data.reason,
                pregnancyWeeks: data.pregnancyWeeks,
                ...drafterPrefill,
              },
              docDataOverride: {
                title: docTitle,
                request_date: requestDate,
                infoId: data.typeId,
                vacationTypeName: data.typeName,
                vacReqUseDay: data.requestDays,
                vacReqReason: data.reason,
                pregnancyWeeks: data.pregnancyWeeks,
                ...drafterPrefill,
              },
              grantRequestData: data,
            }, data.attachments)
          }}
        />
      )}

      {correctionOpen && (
        <AttendanceCorrectionModal
          initialDate={correctionDate}
          onClose={() => { setCorrectionOpen(false); setCorrectionDate(undefined) }}
          onNavigateHistory={() => {
            setCorrectionOpen(false)
            setCorrectionDate(undefined)
            setMainTab('근태관리')
          }}
          onSubmit={(data: AttendanceCorrectionData) => {
            setCorrectionOpen(false)
            setCorrectionDate(undefined)
            const reqCheckIn = `${data.correctionDate}T${data.afterCheckIn}:00`
            const reqCheckOut = `${data.correctionDate}T${data.afterCheckOut}:00`
            openApprovalWindow({
              openForm: {
                name: '근태정정신청서',
                folder: '인사',
                retention: '5',
                formCode: data.formCode,
              },
              prefill: {
                formCode: data.formCode,
                formId: data.formId,
                comRecId: data.comRecId,
                workDate: data.correctionDate,
                empName: data.empName,
                currentCheckIn: data.currentCheckIn ?? '',
                currentCheckOut: data.currentCheckOut ?? '',
                reqCheckIn,
                reqCheckOut,
                attenReason: data.reason,
              },
              docDataOverride: {
                comRecId: data.comRecId,
                workDate: data.correctionDate,
                empName: data.empName,
                currentCheckIn: data.currentCheckIn ?? '',
                currentCheckOut: data.currentCheckOut ?? '',
                reqCheckIn,
                reqCheckOut,
                attenReason: data.reason,
              },
              correctionData: data,
            }, data.files)
          }}
        />
      )}

      {overtimeApplyOpen && (
        <OvertimeApplyModal
          onClose={() => setOvertimeApplyOpen(false)}
          onSubmittedToApproval={(data: OvertimeApplyData) => {
            setOvertimeApplyOpen(false)
            openApprovalWindow({
              openForm: {
                name: '초과근로신청서',
                folder: '인사',
                retention: '5',
                formCode: 'OVERTIME_REQUEST',
              },
              prefill: {
                formCode: 'OVERTIME_REQUEST',
                otDate: data.otDate,
                otPlanStart: data.otPlanStart.slice(11, 16),
                otPlanEnd: data.otPlanEnd.slice(11, 16),
                otReason: data.otReason,
                otPlanMinutes: formatHm(data.otPlanMinutes),
                remainingMinutes: formatHm(data.remainingMinutesAfter),
                otPlanHours: formatHm(data.otPlanMinutes),
                remainingHours: formatHm(data.remainingMinutesAfter),
              },
              docDataOverride: {
                otDate: `${data.otDate}T00:00:00`,
                otPlanStart: data.otPlanStart,
                otPlanEnd: data.otPlanEnd,
                otReason: data.otReason,
              },
              overtimeData: data,
            })
          }}
        />
      )}

    </div>
  )
}
