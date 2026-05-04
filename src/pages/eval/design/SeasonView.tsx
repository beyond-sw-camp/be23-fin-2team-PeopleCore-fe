import { useState, useEffect } from 'react'
import { type Season } from '../../../stores/seasonsStore'
import { defaultRules, type RulesState } from './evaluationRulesData'
import { fetchRules, toFrontendRules } from '../../../api/evalRules'
import { stageLabel, toSeasonPeriodLabel } from '../../../api/season'

const statusColor = (s: string) => {
  if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
  if (s === '준비중') return 'bg-[#fef3cd] text-[#f59e0b]'
  if (s === '완료') return 'bg-[#f5f5f5] text-[#8a9490]'
  if (s === '마감') return 'bg-[#f5f5f5] text-[#8a9490]'
  if (s === '대기') return 'bg-[#f5f5f5] text-[#8a9490]'
  return 'bg-[#f5f5f5] text-[#8a9490]'
}

interface Props {
  season: Season
  onBack: () => void
  onEdit?: () => void
}

// 평가 시즌 상세 (읽기 전용) — 기본 정보 / 단계별 일정 / 사용된 평가 규칙
export default function SeasonView({ season, onBack, onEdit }: Props) {
  const [rules, setRules] = useState<RulesState>(defaultRules)

  useEffect(() => {
    fetchRules()
      .then(dto => {
        if (dto) setRules(toFrontendRules(dto))
        else setRules(defaultRules)
      })
      .catch(() => setRules(defaultRules))
  }, [season.id])

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">
        성과관리(인사) &gt; 설계 &gt; 평가 주기/일정 생성 &gt;{' '}
        <span className="text-[#2e9e6e] font-medium">{season.name} 상세</span>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-[#8a9490] bg-transparent border-none cursor-pointer text-[18px] hover:text-[#1a2b23]"
          >
            ←
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">{season.name}</h1>
            <p className="text-[13px] text-[#8a9490]">
              {toSeasonPeriodLabel(season.period)} · {season.startDate} ~ {season.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[12px] px-3 py-1 rounded font-medium ${statusColor(season.status)}`}>
            {season.status}
          </span>
          {onEdit && (
            <button
              onClick={onEdit}
              className="border border-[#1D9E75] text-[#1D9E75] bg-white rounded-md px-3 py-1.5 text-[12px] font-medium hover:bg-[#f2faf6]"
            >
              관리
            </button>
          )}
        </div>
      </div>

      {/* ① 기본 정보 */}
      <Section title="① 기본 정보">
        <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-[13px]">
          <InfoRow label="평가명" value={season.name} />
          <InfoRow label="평가주기" value={toSeasonPeriodLabel(season.period)} />
          <InfoRow label="시작일" value={season.startDate || '-'} />
          <InfoRow label="종료일" value={season.endDate || '-'} />
          <InfoRow
            label="상태"
            value={
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColor(season.status)}`}>
                {season.status}
              </span>
            }
          />
        </div>
      </Section>

      {/* ② 단계별 일정 */}
      <Section title="② 단계별 일정">
        <table className="w-full text-[13px] table-fixed">
          <thead>
            <tr className="border-b border-[#e0e5e3]">
              <th className="text-center px-3 py-3 font-medium text-[#5a6b62] w-[60px]">순서</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">단계명</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[140px]">시작일</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[140px]">종료일</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[100px]">상태</th>
            </tr>
          </thead>
          <tbody>
            {season.stages.map((stage, i) => (
              <tr key={stage.id} className="border-b border-[#f0f2f1]">
                <td className="px-3 py-3 text-center text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-[#1a2b23]">{stageLabel(stage)}</td>
                <td className="px-4 py-3 text-center text-[#5a6b62]">{stage.startDate || '-'}</td>
                <td className="px-4 py-3 text-center text-[#5a6b62]">{stage.endDate || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${statusColor(stage.status)}`}>
                    {stage.status}
                  </span>
                </td>
              </tr>
            ))}
            {season.stages.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-[12px] text-gray-400">등록된 단계가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* ③ 사용된 평가 규칙 */}
      <Section title="③ 사용된 평가 규칙" subtitle="이 시즌에 적용되는 종합점수 공식·등급 체계">
        {/* 종합점수 공식 */}
        <div className="mb-4">
          <div className="text-[12px] font-semibold text-gray-700 mb-2">종합점수 산출 공식</div>
          <div className="bg-[#f8faf9] border border-gray-200 rounded-md px-4 py-3 text-[12px] text-gray-700 flex items-center gap-2 flex-wrap">
            {rules.items.map((it, i) => (
              <span key={it.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-400">+</span>}
                <span className="font-semibold text-[#1D9E75]">{it.name} × {it.weight}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* 등급 체계 */}
        <div className="mb-4">
          <div className="text-[12px] font-semibold text-gray-700 mb-2">전사 등급 체계 · 강제배분 비율</div>
          <div className="flex gap-2">
            {rules.grades.map(g => (
              <div
                key={g.id}
                className="flex-1 text-center py-3 rounded-lg"
                style={{ backgroundColor: `${g.color}1A`, color: g.color }}
              >
                <div className="text-[14px] font-bold">{g.label}</div>
                <div className="text-[11px] mt-0.5">{g.ratio}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 편향 보정 */}
        {rules.useBiasAdjustment && (
          <div>
            <div className="text-[12px] font-semibold text-gray-700 mb-2">팀장 편향 보정 (Z-score)</div>
            <div className="bg-[#f8faf9] border border-gray-200 rounded-md px-4 py-3 text-[12px] text-gray-700 space-y-1">
              <div>보정 강도: <span className="font-semibold text-[#1a2b23]">{rules.biasWeight}</span> ({rules.biasWeight === 1 ? '완전 적용' : '부분 적용'})</div>
              <div>최소 팀 규모: <span className="font-semibold text-[#1a2b23]">{rules.minTeamSize}명</span> (미달 팀은 원점수 유지)</div>
            </div>
          </div>
        )}
      </Section>

      <div className="flex justify-end gap-3">
        <button
          onClick={onBack}
          className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
        >
          목록으로
        </button>
      </div>
    </div>
  )
}

// ─── 공통 UI ─────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-5">
      <h3 className="text-[14px] font-semibold text-[#1a2b23]">{title}</h3>
      {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#f0f2f1]">
      <span className="text-[12px] text-[#8a9490] w-[60px] shrink-0">{label}</span>
      <span className="text-[13px] text-[#1a2b23] font-medium">{value}</span>
    </div>
  )
}
