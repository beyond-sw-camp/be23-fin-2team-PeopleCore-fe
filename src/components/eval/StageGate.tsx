import { createContext, useContext, type ReactNode } from 'react'
import {
  useActiveStages,
  STAGE_KEY_LABEL,
  type StageKey,
} from '../../hooks/useActiveStages'

interface Props {
  requires: StageKey
  children: ReactNode
}

// StageGate 가 children 에 read-only 여부를 내려보내는 컨텍스트
// — 자식 페이지에서 useStageReadOnly() 로 받아 쓰기 액션을 disable 한다.
const ReadOnlyContext = createContext<boolean>(false)

// eslint-disable-next-line react-refresh/only-export-components
export function useStageReadOnly(): boolean {
  return useContext(ReadOnlyContext)
}

// 단계 게이트 — 정책:
// - WAITING / 단계 없음 / 활성 시즌 없음 → 차단 패널
// - IN_PROGRESS → 정상 렌더 (수정 가능)
// - FINISHED → 렌더하되 read-only 배너 + 컨텍스트로 자식에게 readOnly=true 내림
//   (마감 후에도 평가자가 달성도/첨부파일을 조회·다운로드할 수 있어야 함)
export default function StageGate({ requires, children }: Props) {
  const { loading, getStatus, currentLabel, seasonName } = useActiveStages()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[13px] text-[#8a9490]">단계 정보를 불러오는 중...</div>
      </div>
    )
  }

  const status = getStatus(requires)

  if (status === 'WAITING' || status === null) {
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

  const readOnly = status === 'FINISHED'

  return (
    <ReadOnlyContext.Provider value={readOnly}>
      {readOnly ? (
        // 자식 페이지 대부분이 `flex-1 overflow-y-auto`로 부모를 채우는 구조라
        // 배너를 위에 끼우려면 동일한 flex 컨텍스트로 한 번 감싸야 함
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="px-6 pt-4 shrink-0">
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-800 flex items-center gap-2">
              <i className="fa-solid fa-eye" />
              <span>
                {STAGE_KEY_LABEL[requires]} 단계가 마감되어 조회 전용 모드입니다. 수정·제출은 불가하며 조회와 파일 다운로드만 가능합니다.
              </span>
            </div>
          </div>
          {children}
        </div>
      ) : (
        // IN_PROGRESS — 기존과 동일하게 자식만 그대로 렌더 (Fragment)
        <>{children}</>
      )}
    </ReadOnlyContext.Provider>
  )
}
