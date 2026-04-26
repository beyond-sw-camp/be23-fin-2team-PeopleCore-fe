import { useState } from 'react'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  time: string
}

const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요! PeopleCore AI 코파일럿입니다. 근태, 급여, 결재, 사내 정책 등 무엇이든 물어보세요.',
    time: '09:12',
  },
  {
    id: 2,
    role: 'user',
    text: '이번 달 내 연차 남은 일수 알려줘',
    time: '09:13',
  },
  {
    id: 3,
    role: 'assistant',
    text: '2026년 기준 잔여 연차는 12일입니다. 이번 달에는 4월 28일(화) ~ 4월 30일(목) 사이에 연차 사용이 가능합니다.',
    time: '09:13',
  },
]

const QUICK_ACTIONS = [
  { icon: 'fa-plane-departure', label: '연차 신청' },
  { icon: 'fa-file-invoice-dollar', label: '급여 명세서' },
  { icon: 'fa-calendar-check', label: '오늘 일정' },
  { icon: 'fa-users', label: '조직도 찾기' },
]

const SUGGESTIONS = [
  '이번 주 내 출퇴근 기록 요약해줘',
  '전자결재 대기 중인 문서 알려줘',
  '회사 복지제도 설명해줘',
]

export default function AICopilotPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [input, setInput] = useState('')

  if (collapsed) {
    return (
      <aside className="w-[44px] bg-white border-r border-[#d1d5db] flex flex-col items-center py-3 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 rounded-lg bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center hover:bg-[#cdecdd] transition-colors"
          title="AI 코파일럿 열기"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-[13px]" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-[320px] bg-white border-r border-[#d1d5db] flex flex-col h-full shrink-0">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-[#eef0ef] flex items-center justify-between bg-gradient-to-r from-[#f0faf6] to-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1D9E75] flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-wand-magic-sparkles text-white text-[12px]" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-gray-900 leading-tight">AI 코파일럿</div>
            <div className="text-[10px] text-[#1D9E75] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
              온라인
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
            title="새 대화"
          >
            <i className="fa-solid fa-plus text-[12px]" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
            title="접기"
          >
            <i className="fa-solid fa-angles-left text-[11px]" />
          </button>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="px-3 pt-3 pb-2 border-b border-[#eef0ef]">
        <div className="text-[10px] font-semibold text-gray-500 mb-2 tracking-wider">빠른 작업</div>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-[#eef0ef] hover:border-[#1D9E75]/40 hover:bg-[#f0faf6] transition-colors text-left"
            >
              <i className={`fa-solid ${a.icon} text-[11px] text-[#1D9E75]`} />
              <span className="text-[11px] text-gray-700 font-medium truncate">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {MOCK_MESSAGES.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#1D9E75] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-wand-magic-sparkles text-white text-[9px]" />
              </div>
            )}
            <div className={`max-w-[82%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#1D9E75] text-white rounded-br-sm'
                    : 'bg-[#f4f6f5] text-gray-800 rounded-tl-sm'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 px-1">{m.time}</span>
            </div>
          </div>
        ))}

        {/* 추천 질문 */}
        <div className="pt-2">
          <div className="text-[10px] font-semibold text-gray-400 mb-2 tracking-wider flex items-center gap-1">
            <i className="fa-solid fa-lightbulb text-[9px]" />
            추천 질문
          </div>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="w-full text-left px-2.5 py-1.5 rounded-lg border border-dashed border-gray-200 hover:border-[#1D9E75]/40 hover:bg-[#f0faf6] text-[11px] text-gray-600 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-[#eef0ef] p-3 bg-white">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-[#fafafa] px-3 py-2 focus-within:border-[#1D9E75] focus-within:bg-white transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="무엇이든 물어보세요..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[12px] text-gray-800 placeholder-gray-400 focus:outline-none max-h-20"
          />
          <button
            disabled={!input.trim()}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              input.trim()
                ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-paper-plane text-[10px]" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <button className="text-[10px] text-gray-400 hover:text-[#1D9E75] flex items-center gap-1">
              <i className="fa-solid fa-paperclip text-[9px]" />
              첨부
            </button>
            <button className="text-[10px] text-gray-400 hover:text-[#1D9E75] flex items-center gap-1">
              <i className="fa-solid fa-microphone text-[9px]" />
              음성
            </button>
          </div>
          <span className="text-[9px] text-gray-300">AI는 실수할 수 있어요</span>
        </div>
      </div>
    </aside>
  )
}
