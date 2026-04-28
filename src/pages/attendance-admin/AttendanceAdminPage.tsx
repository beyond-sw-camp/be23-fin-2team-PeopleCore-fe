import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import HrManagerView, { type HrSubTab } from '../attendance/components/HrManagerView'
import { useAuth } from '../../contexts/AuthContext'

/* ══════════════════════════════════════
   인사담당자 — 전사 근태/휴가 관리 페이지
   기존 AttendancePage 내부의 인사담당자 섹션을 분리한 독립 페이지.
   접근 권한: HR_ADMIN / HR_SUPER_ADMIN (Sidebar requireHRAdmin)
   ══════════════════════════════════════ */
export default function AttendanceAdminPage() {
  const { isHRAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // 결근/자동마감 알림 등 외부 진입(?date=YYYY-MM-DD): 마운트 시 한 번만 소비
  const initialDateParam = useRef<string | undefined>(searchParams.get('date') ?? undefined).current
  const [subTab, setSubTab] = useState<HrSubTab>('전사 근태현황')
  const [initialDate] = useState<string | undefined>(initialDateParam)

  // 권한 가드: HR admin 아닌 사용자가 직접 URL로 진입하면 대시보드로 이동
  useEffect(() => {
    if (!isHRAdmin) navigate('/', { replace: true })
  }, [isHRAdmin, navigate])

  // 외부 진입 파라미터를 URL에서 제거 (마운트 시 한 번)
  useEffect(() => {
    if (!initialDateParam) return
    const next = new URLSearchParams(searchParams)
    next.delete('date'); next.delete('empId')
    setSearchParams(next, { replace: true })
    // searchParams 의존성 의도적 제외: 마운트 직후 1회만 정리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isHRAdmin) return null

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">인사 담당자</h2>
        </div>
        <nav className="p-2 space-y-0.5">
          {(['전사 근태현황', '전사 휴가 관리'] as HrSubTab[]).map((sub) => (
            <div
              key={sub}
              onClick={() => setSubTab(sub)}
              className={`px-3 py-2.5 text-[13px] cursor-pointer rounded-lg transition-colors ${
                subTab === sub
                  ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                  : 'text-[#000000] hover:bg-[#E1F5EE]'
              }`}
            >
              {sub}
            </div>
          ))}
        </nav>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <HrManagerView subTab={subTab} initialDate={initialDate} />
      </div>
    </div>
  )
}
