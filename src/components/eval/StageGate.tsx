import { type ReactNode } from 'react'
import {
  useActiveStages,
  STAGE_KEY_LABEL,
  type StageKey,
} from '../../hooks/useActiveStages'

interface Props {
  requires: StageKey
  children: ReactNode
}

// 단계 게이트 — 요구 단계가 IN_PROGRESS 가 아니면 안내 패널로 차단.
// 페이지 컴포넌트를 이걸로 감싸서 쓴다.
export default function StageGate({ requires, children }: Props) {
  const { loading, isOpen, currentLabel, seasonName } = useActiveStages()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[13px] text-[#8a9490]">단계 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (!isOpen(requires)) {
    return (
      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#f2faf6] flex items-center justify-center">
            <i className="fa-solid fa-lock text-[#1D9E75] text-[18px]" />
          </div>
          <div className="text-[16px] font-semibold text-[#1a2b23] mb-2">
            {STAGE_KEY_LABEL[requires]} 기간이 아닙니다
          </div>
          <div className="text-[13px] text-[#5a6b62] mb-1">
            현재 진행 단계:{' '}
            <span className="font-medium text-[#1D9E75]">{currentLabel}</span>
          </div>
          <div className="text-[12px] text-gray-400">
            {seasonName ?? '활성 시즌이 없습니다'}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
