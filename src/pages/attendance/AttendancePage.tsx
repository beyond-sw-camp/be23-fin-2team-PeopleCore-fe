import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeaveStatusView from './components/LeaveStatusView'
import LeaveHistoryView from './components/LeaveHistoryView'
import AttendanceView from './components/AttendanceView'
import { type AttendViewMode } from './components/AttendanceView'
import HrManagerView from './components/HrManagerView'
import { type HrSubTab } from './components/HrManagerView'
import LeaveApplyModal from './components/LeaveApplyModal'
import type { LeaveApplyData } from './components/LeaveApplyModal'
import { attendanceApi, type CheckInRes, type CheckOutRes } from '../../api/attendance'

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
  const [mainTab, setMainTab] = useState<MainTab>('휴가관리')
  const [leaveSubTab, setLeaveSubTab] = useState<LeaveSubTab>('휴가현황')
  const [attendViewMode, setAttendViewMode] = useState<AttendViewMode>('주간')
  const [leaveApplyOpen, setLeaveApplyOpen] = useState(false)
  const [hrSubTab, setHrSubTab] = useState<HrSubTab>('전사 근태현황')
  const navigate = useNavigate()

  const [checkIn, setCheckIn] = useState<CheckInRes | null>(null)
  const [checkOut, setCheckOut] = useState<CheckOutRes | null>(null)
  const [commuteLoading, setCommuteLoading] = useState(false)
  const [commuteModal, setCommuteModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
      if (!checkIn) setCheckIn({
        comRecId: res.comRecId, workDate: res.workDate, checkInAt: res.checkInAt,
        checkInIp: res.checkOutIp, isOffsite: res.isOffsite,
        checkInStatus: 'ON_TIME', holidayReason: res.holidayReason,
      })
      setCommuteModal({ type: 'success', message: `퇴근 완료 · ${toHHmm(res.checkOutAt)}` })
    } catch (e: unknown) {
      setCommuteModal({ type: 'error', message: extractCommuteError(e) ?? '퇴근 체크에 실패했습니다.' })
    } finally {
      setCommuteLoading(false)
    }
  }

  const checkedIn = checkIn !== null
  const checkedOut = checkOut !== null

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000] mb-3">
            {mainTab === '휴가관리' ? '휴가' : mainTab === '근태관리' ? '근태' : '인사 담당자'}
          </h2>

          {mainTab === '휴가관리' && (
            <button onClick={() => setLeaveApplyOpen(true)}
              className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] transition-colors">
              휴가 신청
            </button>
          )}

          {mainTab === '근태관리' && (
            <div>
              <div className="text-[11px] text-gray-500 mb-2">{todayStr}</div>
              <div className="border border-gray-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>출근 시간</span><span>퇴근 시간</span>
                </div>
                <div className="flex items-center justify-between text-[14px] font-bold text-gray-900">
                  <span className={checkedIn ? 'text-[#1D9E75]' : 'text-gray-400'}>{checkedIn ? toHHmm(checkIn!.checkInAt) : '-'}</span>
                  <span className="text-gray-300">→</span>
                  <span className={checkedOut ? 'text-gray-900' : 'text-gray-400'}>{checkedOut ? toHHmm(checkOut!.checkOutAt) : '-'}</span>
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

          {/* 인사 담당자 — TODO: 인사 담당자 권한일 때만 표시 */}
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
        </nav>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {mainTab === '휴가관리' && leaveSubTab === '휴가현황' && <LeaveStatusView onOpenApply={() => setLeaveApplyOpen(true)} />}
        {mainTab === '휴가관리' && leaveSubTab === '휴가내역' && <LeaveHistoryView />}
        {mainTab === '근태관리' && <AttendanceView viewMode={attendViewMode} onViewModeChange={setAttendViewMode} onOpenApply={() => setLeaveApplyOpen(true)} />}
        {mainTab === '인사담당자' && <HrManagerView subTab={hrSubTab} />}
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
            // 휴가신청 데이터를 가지고 전자결재 화면으로 이동
            // TODO: 백엔드 연동 시 휴가 양식에 data 값을 미리 채워서 전달
            navigate('/approval', {
              state: {
                openForm: {
                  name: '휴가신청',
                  folder: '인사',
                  retention: '5',
                },
                leaveData: data,
              },
            })
          }}
        />
      )}

    </div>
  )
}
