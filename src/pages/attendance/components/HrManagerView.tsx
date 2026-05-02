import HrAttendanceTab from './HrAttendanceTab'
import HrLeaveVacationTab from './HrLeaveVacationTab'

export type HrSubTab = '전사 근태현황' | '전사 휴가 관리'

/* ══════════════════════════════════════
   인사 담당자 뷰
   ══════════════════════════════════════ */
export default function HrManagerView({ subTab, initialDate }: { subTab: HrSubTab; initialDate?: string }) {
  return (
    <div>
      {subTab === '전사 근태현황' && <HrAttendanceTab initialDate={initialDate} />}
      {subTab === '전사 휴가 관리' && <HrLeaveVacationTab />}
    </div>
  )
}
