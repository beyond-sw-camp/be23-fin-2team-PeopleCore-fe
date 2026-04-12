import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeaveStatusView from './components/LeaveStatusView'
import LeaveHistoryView from './components/LeaveHistoryView'
import AttendanceView from './components/AttendanceView'
import { type AttendViewMode } from './components/AttendanceView'
import HrManagerView from './components/HrManagerView'
import { type HrSubTab } from './components/HrManagerView'
import LeaveApplyModal from './components/LeaveApplyModal'
import type { LeaveApplyData } from './components/LeaveApplyModal'

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

  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const todayDate = new Date(2026, 2, 31)
  const todayStr = `${todayDate.getFullYear()}년 ${String(todayDate.getMonth() + 1).padStart(2, '0')}월 ${String(todayDate.getDate()).padStart(2, '0')}일 (${dayNames[todayDate.getDay()]}) ${String(todayDate.getHours()).padStart(2, '0')}:${String(todayDate.getMinutes()).padStart(2, '0')}`

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
                  <span>09:40:00</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-gray-400">-</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button className="py-2 border border-gray-300 rounded-lg text-[12px] text-gray-400 cursor-not-allowed">출근하기</button>
                <button className="py-2 border border-gray-300 rounded-lg text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">퇴근하기</button>
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
