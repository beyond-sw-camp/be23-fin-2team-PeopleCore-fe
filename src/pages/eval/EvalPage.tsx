import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import EvalDesign from './EvalDesign'
import EvalGrading from './EvalGrading'
import EvalResult from './EvalResult'
import EvalEmployee from './EvalEmployee'
import EvalManager from './EvalManager'

type EvalTab = 'employee' | 'manager' | 'design' | 'grading' | 'result'

const TABS: { key: EvalTab; label: string; icon: string }[] = [
  { key: 'employee', label: '성과관리(개인)', icon: 'fa-solid fa-user' },
  { key: 'manager', label: '성과관리(팀장)', icon: 'fa-solid fa-user-tie' },
  { key: 'design', label: '평가 설계', icon: 'fa-solid fa-drafting-compass' },
  { key: 'grading', label: '등급 산정/보정', icon: 'fa-solid fa-chart-bar' },
  { key: 'result', label: '평가 결과 처리', icon: 'fa-solid fa-clipboard-check' },
]

const PATH_TO_TAB: Record<string, EvalTab> = {
  '/eval': 'employee',
  '/eval/employee': 'employee',
  '/eval/manager': 'manager',
  '/eval/design': 'design',
  '/eval/grading': 'grading',
  '/eval/result': 'result',
}

const TAB_TO_PATH: Record<EvalTab, string> = {
  'employee': '/eval/employee',
  'manager': '/eval/manager',
  'design': '/eval/design',
  'grading': '/eval/grading',
  'result': '/eval/result',
}

export default function EvalPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialTab = PATH_TO_TAB[location.pathname] || 'design'
  const [activeTab, setActiveTab] = useState<EvalTab>(initialTab)

  useEffect(() => {
    const tab = PATH_TO_TAB[location.pathname]
    if (tab && tab !== activeTab) setActiveTab(tab)
  }, [location.pathname])

  const handleTabChange = (tab: EvalTab) => {
    setActiveTab(tab)
    navigate(TAB_TO_PATH[tab])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f8fafb]">
      <div className="px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-gray-800">성과 평가</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">평가 설계, 운영, 조회, 등급 산정 및 결과 처리를 관리합니다</p>
          </div>
          {(['design', 'grading', 'result'] as EvalTab[]).includes(activeTab) && (
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium">
              <i className="fa-solid fa-lock text-[9px] mr-1" />인사 관리자 전용
            </span>
          )}
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-[#1D9E75]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={`${tab.icon} text-[11px]`} />
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D9E75] rounded-t" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'employee' && <EvalEmployee />}
        {activeTab === 'manager' && <EvalManager />}
        {activeTab === 'design' && <EvalDesign />}
        {activeTab === 'grading' && <EvalGrading />}
        {activeTab === 'result' && <EvalResult />}
      </div>
    </div>
  )
}
