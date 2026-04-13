import { useState } from 'react'
import LeaveRuleView from './attendance-policy/LeaveRuleView'
import LegalLeaveManageView from './attendance-policy/LegalLeaveManageView'
import OvertimeSettingsView from './attendance-policy/OvertimeSettingsView'
import WorkGroupView from './attendance-policy/WorkGroupView'
import LeavePromotionView from './attendance-policy/LeavePromotionView'
import AllowedIpView from './attendance-policy/AllowedIpView'
type AttPolicyView = 'leave-rule' | 'leave-promotion' | 'legal-leave' | 'overtime-settings' | 'work-group' | 'allowed-ip'

const ATT_POLICY_MENUS: { key: AttPolicyView; label: string; group: string }[] = [
  { key: 'leave-rule', label: '연차 발생 규칙 설정', group: '연차·휴가' },
  { key: 'leave-promotion', label: '연차 촉진 · 수당', group: '연차·휴가' },
  { key: 'legal-leave', label: '법적 근로 휴가 관리', group: '연차·휴가' },
  { key: 'overtime-settings', label: '초과근무 정책 설정', group: '근태·초과근무' },
  { key: 'work-group', label: '근무그룹 관리', group: '근태·초과근무' },
  { key: 'allowed-ip', label: '허용 IP 설정', group: '근태·초과근무' },
]

export default function AttendancePolicyTab() {
  const [view, setView] = useState<AttPolicyView>('leave-rule')

  const groups = [...new Set(ATT_POLICY_MENUS.map((m) => m.group))]

  return (
    <div className="flex gap-0 -m-6 h-[calc(100%+48px)]">
      {/* 서브 사이드바 */}
      <div className="w-[200px] bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-800">근태·연차 정책</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">연차 규칙 및 근태 정책 관리</p>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group}</div>
              {ATT_POLICY_MENUS.filter((m) => m.group === group).map((m) => (
                <div key={m.key} onClick={() => setView(m.key)}
                  className={`flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer rounded-lg transition-colors ${view === m.key ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {m.label}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'leave-rule' && <LeaveRuleView />}
        {view === 'leave-promotion' && <LeavePromotionView />}
        {view === 'legal-leave' && <LegalLeaveManageView />}
        {view === 'overtime-settings' && <OvertimeSettingsView />}
        {view === 'work-group' && <WorkGroupView />}
        {view === 'allowed-ip' && <AllowedIpView />}
      </div>
    </div>
  )
}
