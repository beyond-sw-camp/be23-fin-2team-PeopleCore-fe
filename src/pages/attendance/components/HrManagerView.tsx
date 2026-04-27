import HrAttendanceTab from './HrAttendanceTab'
import HrLeaveVacationTab from './HrLeaveVacationTab'
import HrOvertimeTab from './HrOvertimeTab'
import HrCorrectionTab from './HrCorrectionTab'

export type HrSubTab = '전사 근태현황' | '전사 휴가 관리' | '초과근무' | '정정 관리'

/* ══════════════════════════════════════
   인사 담당자 뷰
   ══════════════════════════════════════ */
export default function HrManagerView({ subTab, initialDate }: { subTab: HrSubTab; initialDate?: string }) {
  return (
    <div>
      {subTab === '전사 근태현황' && <HrAttendanceTab initialDate={initialDate} />}
      {subTab === '전사 휴가 관리' && <HrLeaveVacationTab />}
      {subTab === '초과근무' && <HrOvertimeTab />}
      {subTab === '정정 관리' && <HrCorrectionTab />}
    </div>
  )
}
