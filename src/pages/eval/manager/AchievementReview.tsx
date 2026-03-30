import { useState } from 'react'

type TaskGrade = '상' | '중' | '하'
type AchievementLevel = '우수' | '양호' | '보통' | '부족' | '미흡'
type ApprovalStatus = '대기' | '승인' | '반려'

interface Task {
  id: number
  title: string
  category: string
  grade: TaskGrade
  selfLevel: AchievementLevel
  selfDetail: string
  selfEvidence: string
  approvalStatus: ApprovalStatus
  rejectReason: string
}

interface TeamMember {
  id: number
  name: string
  dept: string
  position: string
  tasks: Task[]
  submittedDate: string | null
}

const achievementColors: Record<AchievementLevel, { bg: string; text: string; border: string }> = {
  '우수': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]', border: 'border-[#7c3aed]' },
  '양호': { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]', border: 'border-[#2e9e6e]' },
  '보통': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]' },
  '부족': { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]' },
  '미흡': { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]', border: 'border-[#ef4444]' },
}

const gradeColors: Record<TaskGrade, { bg: string; text: string }> = {
  '상': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '중': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '하': { bg: 'bg-[#f8faf9]', text: 'text-[#8a9490]' },
}

const mockMembers: TeamMember[] = [
  {
    id: 1, name: '김민수', dept: '개발팀', position: '선임', submittedDate: '2026-03-15',
    tasks: [
      { id: 1, title: '신규 고객 유치 20건 달성', category: '업무성과', grade: '상', selfLevel: '우수', selfDetail: '신규 고객 23건 유치 달성. 목표 대비 115% 초과 달성.', selfEvidence: 'CRM 실적 리포트', approvalStatus: '대기', rejectReason: '' },
      { id: 2, title: '고객 만족도 90% 이상 유지', category: '업무성과', grade: '중', selfLevel: '양호', selfDetail: '고객 만족도 91.2% 달성. CS 응대 매뉴얼 개정.', selfEvidence: 'CS 만족도 설문 결과', approvalStatus: '대기', rejectReason: '' },
      { id: 3, title: 'AWS 자격증 취득', category: '역량개발', grade: '하', selfLevel: '양호', selfDetail: 'AWS SAA 자격증 취득 완료. 시험 점수 820점.', selfEvidence: 'AWS 합격 증명서', approvalStatus: '승인', rejectReason: '' },
      { id: 4, title: '사내 세미나 발표 2회', category: '역량개발', grade: '하', selfLevel: '보통', selfDetail: '세미나 1회 진행 완료. 2차는 일정 조율 중.', selfEvidence: '세미나 발표 자료', approvalStatus: '반려', rejectReason: '2회 목표 중 1회만 완료. 달성도를 재평가 바랍니다.' },
      { id: 5, title: '신규 입사자 온보딩 지원', category: '조직기여', grade: '중', selfLevel: '양호', selfDetail: '신규 입사자 2명 온보딩 멘토링 수행.', selfEvidence: '온보딩 체크리스트', approvalStatus: '대기', rejectReason: '' },
    ],
  },
  {
    id: 2, name: '이서연', dept: '개발팀', position: '책임', submittedDate: '2026-03-14',
    tasks: [
      { id: 6, title: '시스템 아키텍처 개선', category: '업무성과', grade: '상', selfLevel: '우수', selfDetail: '레거시 → MSA 1차 전환 완료. API 응답시간 40% 개선.', selfEvidence: '아키텍처 문서', approvalStatus: '대기', rejectReason: '' },
      { id: 7, title: '팀 기술 교육 월 1회', category: '조직기여', grade: '중', selfLevel: '보통', selfDetail: '6개월간 4회 진행. 2회 미진행.', selfEvidence: '교육 자료', approvalStatus: '대기', rejectReason: '' },
      { id: 8, title: 'MSA 전환 프로젝트 리드', category: '업무성과', grade: '상', selfLevel: '양호', selfDetail: '1차 마이그레이션 3개 서비스 분리 완료.', selfEvidence: '프로젝트 보고서', approvalStatus: '대기', rejectReason: '' },
    ],
  },
  {
    id: 3, name: '박준호', dept: '개발팀', position: '사원', submittedDate: null,
    tasks: [
      { id: 9, title: '버그 수정 월 10건', category: '업무성과', grade: '중', selfLevel: '보통', selfDetail: '', selfEvidence: '', approvalStatus: '대기', rejectReason: '' },
      { id: 10, title: 'React 학습', category: '역량개발', grade: '하', selfLevel: '보통', selfDetail: '', selfEvidence: '', approvalStatus: '대기', rejectReason: '' },
      { id: 11, title: '문서 정리', category: '조직기여', grade: '하', selfLevel: '보통', selfDetail: '', selfEvidence: '', approvalStatus: '대기', rejectReason: '' },
    ],
  },
]

export default function AchievementReview() {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ taskId: number; reason: string } | null>(null)

  const selected = members.find(m => m.id === selectedId)

  const handleApprove = (memberId: number, taskId: number) => {
    setMembers(members.map(m =>
      m.id === memberId
        ? { ...m, tasks: m.tasks.map(t => t.id === taskId ? { ...t, approvalStatus: '승인' as ApprovalStatus, rejectReason: '' } : t) }
        : m
    ))
  }

  const handleApproveAll = (memberId: number) => {
    setMembers(members.map(m =>
      m.id === memberId
        ? { ...m, tasks: m.tasks.map(t => t.approvalStatus === '대기' ? { ...t, approvalStatus: '승인' as ApprovalStatus, rejectReason: '' } : t) }
        : m
    ))
  }

  const handleRejectConfirm = (memberId: number) => {
    if (!rejectModal) return
    setMembers(members.map(m =>
      m.id === memberId
        ? { ...m, tasks: m.tasks.map(t => t.id === rejectModal.taskId ? { ...t, approvalStatus: '반려' as ApprovalStatus, rejectReason: rejectModal.reason } : t) }
        : m
    ))
    setRejectModal(null)
  }

  const totalPending = members.reduce((sum, m) => sum + m.tasks.filter(t => t.approvalStatus === '대기').length, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(팀장) &gt; 팀원 달성도 검토</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 달성도 검토</h1>
        <p className="text-[13px] text-[#8a9490]">사원이 제출한 업무별 달성도 평가를 검토하고 승인 또는 반려합니다.</p>
      </div>

      {/* 현황 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 팀원</div>
          <div className="text-[20px] font-bold text-[#1a2b23]">{members.length}명</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">제출 완료</div>
          <div className="text-[20px] font-bold text-[#2e9e6e]">{members.filter(m => m.submittedDate).length}명</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">승인 대기</div>
          <div className="text-[20px] font-bold text-[#f59e0b]">{totalPending}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">반려</div>
          <div className="text-[20px] font-bold text-[#ef4444]">{members.reduce((s, m) => s + m.tasks.filter(t => t.approvalStatus === '반려').length, 0)}건</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 팀원 목록 */}
        <div className="col-span-4">
          <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
              <h3 className="text-[13px] font-semibold text-[#1a2b23]">팀원 목록</h3>
            </div>
            <div className="divide-y divide-[#f0f2f1]">
              {members.map(m => {
                const pending = m.tasks.filter(t => t.approvalStatus === '대기').length
                const approved = m.tasks.filter(t => t.approvalStatus === '승인').length
                const rejected = m.tasks.filter(t => t.approvalStatus === '반려').length
                const isSubmitted = m.submittedDate !== null

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedId === m.id ? 'bg-[#eaf6f0]' : 'hover:bg-[#fafbfa]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <div className="text-[13px] font-medium text-[#1a2b23]">{m.name}</div>
                        <div className="text-[11px] text-[#8a9490]">{m.position}</div>
                      </div>
                      {!isSubmitted ? (
                        <span className="bg-[#f5f5f5] text-[#8a9490] text-[10px] px-1.5 py-0.5 rounded">미제출</span>
                      ) : pending > 0 ? (
                        <span className="bg-[#fef3cd] text-[#f59e0b] text-[10px] px-1.5 py-0.5 rounded font-medium">{pending}건 대기</span>
                      ) : (
                        <span className="bg-[#eaf6f0] text-[#2e9e6e] text-[10px] px-1.5 py-0.5 rounded font-medium">검토 완료</span>
                      )}
                    </div>
                    <div className="flex gap-3 text-[10px] text-[#8a9490]">
                      <span>승인 <span className="text-[#2e9e6e] font-medium">{approved}</span></span>
                      <span>반려 <span className="text-[#ef4444] font-medium">{rejected}</span></span>
                      <span>대기 <span className="text-[#f59e0b] font-medium">{pending}</span></span>
                    </div>
                    {isSubmitted && (
                      <div className="text-[10px] text-[#b0b8b4] mt-1">제출일: {m.submittedDate}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 달성도 검토 */}
        <div className="col-span-8">
          {selected ? (
            <div className="space-y-4">
              {/* 팀원 정보 + 일괄승인 */}
              <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-[16px] font-semibold text-[#1a2b23]">{selected.name}</div>
                  <div className="text-[12px] text-[#8a9490]">{selected.dept} · {selected.position} · 업무 {selected.tasks.length}건</div>
                </div>
                {selected.submittedDate && selected.tasks.some(t => t.approvalStatus === '대기') && (
                  <button
                    onClick={() => handleApproveAll(selected.id)}
                    className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
                  >
                    대기 건 일괄 승인
                  </button>
                )}
              </div>

              {!selected.submittedDate ? (
                <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
                  <div className="text-[#d0d8d4] text-[32px] mb-3">📭</div>
                  <div className="text-[14px] text-[#8a9490]">아직 자기평가를 제출하지 않았습니다</div>
                </div>
              ) : (
                /* 업무별 카드 */
                selected.tasks.map(task => {
                  const isApproved = task.approvalStatus === '승인'
                  const isRejected = task.approvalStatus === '반려'
                  const isPending = task.approvalStatus === '대기'

                  return (
                    <div key={task.id} className={`bg-white border rounded-lg p-5 ${
                      isApproved ? 'border-[#2e9e6e]' :
                      isRejected ? 'border-[#fca5a5]' :
                      'border-[#e0e5e3]'
                    }`}>
                      {/* 헤더 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{task.category}</span>
                          <span className={`${gradeColors[task.grade].bg} ${gradeColors[task.grade].text} px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                            등급 {task.grade}
                          </span>
                          <span className="text-[13px] font-medium text-[#1a2b23]">{task.title}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          isApproved ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                          isRejected ? 'bg-[#fef2f2] text-[#ef4444]' :
                          'bg-[#fef3cd] text-[#f59e0b]'
                        }`}>{task.approvalStatus}</span>
                      </div>

                      {/* 사원 달성도 */}
                      <div className="mb-3">
                        <div className="text-[11px] text-[#8a9490] mb-1">사원 자체 달성도</div>
                        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border ${
                          achievementColors[task.selfLevel].bg} ${achievementColors[task.selfLevel].text} ${achievementColors[task.selfLevel].border
                        }`}>
                          {task.selfLevel}
                        </span>
                      </div>

                      {/* 달성 내용 */}
                      {task.selfDetail && (
                        <div className="mb-3">
                          <div className="text-[11px] font-medium text-[#5a6b62] mb-1">달성 내용</div>
                          <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{task.selfDetail}</div>
                        </div>
                      )}

                      {/* 실적 근거 */}
                      {task.selfEvidence && (
                        <div className="mb-3">
                          <div className="text-[11px] font-medium text-[#5a6b62] mb-1">실적 근거</div>
                          <div className="text-[12px] text-[#8a9490] bg-[#f8faf9] rounded-lg p-2">{task.selfEvidence}</div>
                        </div>
                      )}

                      {/* 반려 사유 표시 */}
                      {isRejected && task.rejectReason && (
                        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 mb-3">
                          <div className="text-[11px] font-medium text-[#ef4444] mb-1">반려 사유</div>
                          <div className="text-[13px] text-[#7f1d1d]">{task.rejectReason}</div>
                        </div>
                      )}

                      {/* 승인/반려 버튼 */}
                      {isPending && (
                        <div className="flex gap-2 justify-end pt-3 border-t border-[#f0f2f1]">
                          <button
                            onClick={() => setRejectModal({ taskId: task.id, reason: '' })}
                            className="border border-[#ef4444] text-[#ef4444] bg-white rounded-lg px-4 py-2 text-[12px] cursor-pointer hover:bg-[#fef2f2] transition-colors"
                          >
                            반려
                          </button>
                          <button
                            onClick={() => handleApprove(selected.id, task.id)}
                            className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
                          >
                            승인
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="text-[12px] text-[#2e9e6e] text-right pt-2 border-t border-[#eaf6f0]">승인 완료</div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
              <div className="text-[#d0d8d4] text-[40px] mb-3">📋</div>
              <div className="text-[14px] text-[#8a9490]">좌측에서 팀원을 선택하세요</div>
            </div>
          )}
        </div>
      </div>

      {/* 반려 모달 */}
      {rejectModal && selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px]">
            <h3 className="text-[16px] font-semibold text-[#1a2b23] mb-2">달성도 반려</h3>
            <p className="text-[13px] text-[#8a9490] mb-4">반려 사유를 작성하면 사원이 수정 후 재제출할 수 있습니다.</p>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none mb-4 focus:border-[#ef4444] focus:outline-none"
              rows={4}
              placeholder="반려 사유를 입력하세요"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectModal(null)} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
              <button
                onClick={() => handleRejectConfirm(selected.id)}
                disabled={!rejectModal.reason.trim()}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium border-none cursor-pointer transition-colors ${
                  rejectModal.reason.trim() ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
                }`}
              >
                반려 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
