import { useState, useEffect } from 'react'
import { attendanceApi, type OvertimePolicyRes } from '../../../../api/attendance'

const UNIT_MAP = { FIFTEEN: 15, THIRTY: 30, SIXTY: 60 } as const
const UNIT_REVERSE: Record<number, OvertimePolicyRes['otMinUnit']> = { 15: 'FIFTEEN', 30: 'THIRTY', 60: 'SIXTY' }

export default function OvertimeSettingsView() {
  const [unitMin, setUnitMin] = useState(60)
  const [requirePreApproval, setRequirePreApproval] = useState(true)
  const [requirePostApproval, setRequirePostApproval] = useState(false)
  const [maxHours, setMaxHours] = useState(52)
  const [warningHours, setWarningHours] = useState(45)
  const [exceedAction, setExceedAction] = useState<'NOTIFY' | 'BLOCK'>('NOTIFY')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    attendanceApi.getOvertimePolicy().then((data) => {
      setUnitMin(UNIT_MAP[data.otMinUnit])
      setRequirePreApproval(data.otPolicyBefore)
      setRequirePostApproval(data.otPolicyAfter)
      setMaxHours(data.otPolicyWeeklyMaxHour)
      setWarningHours(data.otPolicyWarningHour)
      setExceedAction(data.otExceedAction)
      setLoaded(true)
    }).catch(() => {
      setLoaded(true)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await attendanceApi.saveOvertimePolicy({
        otMinUnit: UNIT_REVERSE[unitMin],
        otPolicyBefore: requirePreApproval,
        otPolicyAfter: requirePostApproval,
        otPolicyWeeklyMaxHour: maxHours,
        otPolicyWarningHour: warningHours,
        otExceedAction: exceedAction,
      })
      setModal({ type: 'success', message: '저장되었습니다.' })
    } catch {
      setModal({ type: 'error', message: '저장에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return <div className="text-[13px] text-gray-400 py-10 text-center">불러오는 중...</div>
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">초과근무 정책 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">초과근무 신청 단위, 결재 프로세스, 주간 최대 근무시간을 설정합니다</p>

      {/* 신청 시간 단위 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">신청 시간 단위</h4>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-gray-600 w-40 shrink-0">초과근무 신청 최소 단위</span>
          <select value={unitMin} onChange={(e) => setUnitMin(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]">
            <option value={15}>15분</option>
            <option value={30}>30분</option>
            <option value={60}>1시간</option>
          </select>
          <span className="text-[11px] text-gray-400">단위로 신청 가능</span>
        </div>
      </div>

      {/* 결재 프로세스 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">결재 프로세스</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12px] text-gray-800 font-medium">사전 결재 (초과근무 신청)</span>
              <p className="text-[11px] text-gray-400 mt-0.5">초과근무 시작 전 전자결재를 통해 사전 승인</p>
            </div>
            <button onClick={() => setRequirePreApproval(!requirePreApproval)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${requirePreApproval ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${requirePreApproval ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12px] text-gray-800 font-medium">사후 결재 (실적 확인)</span>
              <p className="text-[11px] text-gray-400 mt-0.5">초과근무 완료 후 실제 근무 시간을 확인하는 전자결재</p>
            </div>
            <button onClick={() => setRequirePostApproval(!requirePostApproval)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${requirePostApproval ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${requirePostApproval ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {requirePostApproval && (
          <div className="mt-4 bg-yellow-50 rounded-lg p-3">
            <p className="text-[11px] text-yellow-700">
              <i className="fas fa-exclamation-triangle mr-1" />
              사후 결재 활성화 시: 초과근무 완료 후 실제 근무 시간과 신청 시간이 다를 경우 자동으로 사후 결재가 생성됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 주간 최대 근무시간 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">주간 최대 근무시간</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">주간 최대 근무시간</span>
            <input type="number" value={maxHours} onChange={(e) => setMaxHours(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-20" />
            <span className="text-[12px] text-gray-500">시간</span>
            <span className="text-[11px] text-gray-400">(이 값이 전사 근태현황 및 근태관리의 최대 기준이 됩니다)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">경고 기준</span>
            <input type="number" value={warningHours} onChange={(e) => setWarningHours(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-20" />
            <span className="text-[12px] text-gray-500">시간 초과 시 경고 알림</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">초과 시 처리</span>
            <select value={exceedAction} onChange={(e) => setExceedAction(e.target.value as 'NOTIFY' | 'BLOCK')}
              className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              <option value="NOTIFY">관리자에게 알림만 발송</option>
              <option value="BLOCK">초과근무 신청 자동 차단</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className={`px-5 py-2 text-[13px] font-medium rounded-lg transition-colors ${saving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#1D9E75] text-white hover:bg-[#178a65]'}`}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

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
