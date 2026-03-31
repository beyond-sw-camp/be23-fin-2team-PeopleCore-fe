import { useState } from 'react'

interface CalibrationRecord {
  id: string
  name: string
  dept: string
  rank: string
  totalScore: number | null
  autoGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null
  adjustedGrade: 'S' | 'A' | 'B' | 'C' | 'D' | ''
  reason: string
  adjustedAt: string | null
}

const gradeList = ['S', 'A', 'B', 'C', 'D'] as const

const initialData: CalibrationRecord[] = [
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', totalScore: 90.4, autoGrade: 'S', adjustedGrade: 'S', reason: '', adjustedAt: null },
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', totalScore: 82.4, autoGrade: 'A', adjustedGrade: 'A', reason: '', adjustedAt: null },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', rank: '부장', totalScore: 88.0, autoGrade: 'A', adjustedGrade: 'S', reason: '팀 리더십 및 조직 기여도 우수. 하반기 MSA 전환 프로젝트를 성공적으로 리드하여 상향 조정.', adjustedAt: '2024-06-25' },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', totalScore: 88.4, autoGrade: 'A', adjustedGrade: 'A', reason: '', adjustedAt: null },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', rank: '대리', totalScore: 80.0, autoGrade: 'B', adjustedGrade: 'B', reason: '', adjustedAt: null },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', totalScore: 75.2, autoGrade: 'B', adjustedGrade: 'B', reason: '', adjustedAt: null },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', totalScore: 65.0, autoGrade: 'C', adjustedGrade: 'C', reason: '', adjustedAt: null },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', totalScore: 58.0, autoGrade: 'C', adjustedGrade: '', reason: '', adjustedAt: null },
]

const gradeColors: Record<string, { bg: string; text: string }> = {
  S: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  A: { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
  B: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  C: { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]' },
  D: { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]' },
}

const gradeBarColors: Record<string, string> = {
  S: '#7c3aed', A: '#2e9e6e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
}

const gradeTargets = { S: 10, A: 20, B: 40, C: 20, D: 10 }
const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가']

export default function GradeCalibration() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0])
  const [records, setRecords] = useState<CalibrationRecord[]>(initialData)

  // 보정 사유 모달
  const [reasonModal, setReasonModal] = useState<{
    id: string
    name: string
    autoGrade: string
    newGrade: string
    reason: string
  } | null>(null)

  const handleGradeChange = (record: CalibrationRecord, newGrade: string) => {
    // 자동등급과 같으면 사유 없이 바로 적용 (보정 취소)
    if (newGrade === record.autoGrade || newGrade === '') {
      setRecords(records.map(r => r.id === record.id
        ? { ...r, adjustedGrade: newGrade as CalibrationRecord['adjustedGrade'], reason: '', adjustedAt: null }
        : r
      ))
      return
    }

    // 등급이 변경되면 사유 입력 모달 표시
    setReasonModal({
      id: record.id,
      name: record.name,
      autoGrade: record.autoGrade || '',
      newGrade,
      reason: record.reason || '',
    })
  }

  const handleReasonConfirm = () => {
    if (!reasonModal || !reasonModal.reason.trim()) return
    setRecords(records.map(r => r.id === reasonModal.id
      ? {
          ...r,
          adjustedGrade: reasonModal.newGrade as CalibrationRecord['adjustedGrade'],
          reason: reasonModal.reason,
          adjustedAt: new Date().toISOString().split('T')[0],
        }
      : r
    ))
    setReasonModal(null)
  }

  const handleReasonCancel = () => {
    setReasonModal(null)
  }

  const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  records.forEach(r => {
    const g = (r.adjustedGrade || r.autoGrade) as keyof typeof gradeCounts
    if (g && g in gradeCounts) gradeCounts[g]++
  })
  const gradedTotal = Object.values(gradeCounts).reduce((s, c) => s + c, 0)
  const adjustedCount = records.filter(r => r.adjustedGrade && r.adjustedGrade !== r.autoGrade).length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 등급 &gt; 등급 보정</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">등급 보정 (Calibration)</h1>
          <p className="text-[13px] text-[#8a9490]">자동 산정된 등급을 검토하고 보정합니다. 등급 변경 시 사유 입력이 필수입니다.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]">
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors">
            보정 저장
          </button>
        </div>
      </div>

      {/* 보정 현황 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 인원</div>
          <div className="text-[24px] font-bold text-[#1a2b23]">{records.length}명</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">보정 건수</div>
          <div className="text-[24px] font-bold text-[#3b82f6]">{adjustedCount}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">미지정</div>
          <div className="text-[24px] font-bold text-[#f59e0b]">{records.filter(r => !r.adjustedGrade && !r.autoGrade).length}명</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 테이블 */}
        <div className="col-span-8 bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9] flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#1a2b23]">등급 보정 테이블</h3>
            <span className="text-[11px] text-[#8a9490]">보정된 행은 강조 표시됩니다</span>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e5e3]">
                <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">성명/부서</th>
                <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">직급</th>
                <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">종합점수</th>
                <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">자동등급</th>
                <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">보정등급</th>
                <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">보정사유</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const isAdjusted = r.adjustedGrade && r.adjustedGrade !== r.autoGrade
                return (
                  <tr key={r.id} className={`border-b border-[#f0f2f1] transition-colors ${isAdjusted ? 'bg-[#eff6ff]' : 'hover:bg-[#fafbfa]'}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#1a2b23]">{r.name}</div>
                      <div className="text-[11px] text-[#8a9490]">{r.dept}</div>
                    </td>
                    <td className="px-5 py-3 text-[#5a6b62]">{r.rank}</td>
                    <td className="px-5 py-3 text-center font-semibold text-[#1a2b23]">{r.totalScore ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
                      {r.autoGrade && (
                        <span className={`${gradeColors[r.autoGrade].bg} ${gradeColors[r.autoGrade].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                          {r.autoGrade}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <select
                        value={r.adjustedGrade}
                        onChange={e => handleGradeChange(r, e.target.value)}
                        className={`border rounded-md px-2 py-1 text-[12px] cursor-pointer ${
                          isAdjusted ? 'border-[#3b82f6] bg-white font-medium' : 'border-[#e0e5e3]'
                        }`}
                      >
                        <option value="">선택</option>
                        {gradeList.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      {isAdjusted && (
                        <div className="text-[10px] text-[#3b82f6] mt-0.5">{r.autoGrade} → {r.adjustedGrade}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isAdjusted ? (
                        <div>
                          <div className="text-[12px] text-[#1a2b23]">{r.reason}</div>
                          {r.adjustedAt && <div className="text-[10px] text-[#8a9490] mt-0.5">{r.adjustedAt}</div>}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#d0d8d4]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 우측 분포 패널 */}
        <div className="col-span-4 space-y-4">
          <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
            <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-3">현재 등급 분포</h3>
            <div className="space-y-2 mb-4">
              {gradeList.map(g => {
                const count = gradeCounts[g]
                const pct = gradedTotal > 0 ? Math.round((count / gradedTotal) * 100) : 0
                const over = pct > gradeTargets[g]
                return (
                  <div key={g}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={`font-bold ${gradeColors[g].text}`}>{g} ({gradeTargets[g]}%)</span>
                      <span className={over ? 'text-[#ef4444] font-semibold' : 'text-[#5a6b62]'}>{count}명 ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#f0f2f1] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : gradeBarColors[g] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3 text-[11px] text-[#1e40af]">
              보정 시 분포가 실시간 업데이트됩니다. 목표 비율을 초과하면 빨간색으로 표시됩니다.
            </div>
          </div>

          {/* 보정 이력 */}
          {adjustedCount > 0 && (
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-3">보정 이력</h3>
              <div className="space-y-3">
                {records.filter(r => r.adjustedGrade && r.adjustedGrade !== r.autoGrade).map(r => (
                  <div key={r.id} className="border border-[#e0e5e3] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-[#1a2b23]">{r.name}</span>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className={`${gradeColors[r.autoGrade!].bg} ${gradeColors[r.autoGrade!].text} px-1.5 py-0.5 rounded font-medium`}>{r.autoGrade}</span>
                        <span className="text-[#8a9490]">→</span>
                        <span className={`${gradeColors[r.adjustedGrade].bg} ${gradeColors[r.adjustedGrade].text} px-1.5 py-0.5 rounded font-medium`}>{r.adjustedGrade}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#5a6b62]">{r.reason}</div>
                    {r.adjustedAt && <div className="text-[10px] text-[#8a9490] mt-1">{r.adjustedAt}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 보정 사유 입력 모달 */}
      {reasonModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px]">
            <h3 className="text-[18px] font-semibold text-[#1a2b23] mb-2">등급 보정 사유 입력</h3>
            <p className="text-[13px] text-[#8a9490] mb-4">
              <span className="font-medium text-[#1a2b23]">{reasonModal.name}</span>의 등급을 변경합니다. 보정 사유를 반드시 입력해주세요.
            </p>

            {/* 변경 내역 */}
            <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-4 flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-[11px] text-[#8a9490] mb-1">자동 산정</div>
                <span className={`${gradeColors[reasonModal.autoGrade]?.bg || 'bg-[#f5f5f5]'} ${gradeColors[reasonModal.autoGrade]?.text || 'text-[#8a9490]'} px-3 py-1 rounded text-[16px] font-bold`}>
                  {reasonModal.autoGrade || '—'}
                </span>
              </div>
              <span className="text-[20px] text-[#8a9490]">→</span>
              <div className="text-center">
                <div className="text-[11px] text-[#8a9490] mb-1">보정 등급</div>
                <span className={`${gradeColors[reasonModal.newGrade].bg} ${gradeColors[reasonModal.newGrade].text} px-3 py-1 rounded text-[16px] font-bold`}>
                  {reasonModal.newGrade}
                </span>
              </div>
            </div>

            {/* 사유 입력 */}
            <div className="mb-4">
              <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">
                보정 사유 <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                value={reasonModal.reason}
                onChange={e => setReasonModal({ ...reasonModal, reason: e.target.value })}
                className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none focus:border-[#1D9E75] focus:outline-none"
                rows={4}
                placeholder="등급을 변경하는 구체적인 사유를 입력하세요 (예: 팀 리더십 우수, 부서 간 협업 기여 등)"
                autoFocus
              />
            </div>

            <div className="bg-[#fef3cd] border border-[#fde68a] rounded-lg p-3 mb-4 text-[11px] text-[#92400e]">
              보정 사유는 평가 이력에 영구 저장되며, 이의신청 시 근거 자료로 활용됩니다.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReasonCancel}
                className="flex-1 border border-[#e0e5e3] bg-white rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
              >
                취소
              </button>
              <button
                onClick={handleReasonConfirm}
                disabled={!reasonModal.reason.trim()}
                className={`flex-1 text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors ${
                  reasonModal.reason.trim() ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] cursor-not-allowed'
                }`}
              >
                보정 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
