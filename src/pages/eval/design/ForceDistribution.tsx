import { useState } from 'react'

interface GradeRatio {
  grade: string
  label: string
  ratio: number
  color: string
}

interface Preset {
  label: string
  description: string
  ratios: GradeRatio[]
}

interface HistoryEntry {
  date: string
  changer: string
  s: number
  a: number
  b: number
  c: number
  d: number
}

const gradeColors = {
  S: '#7c3aed', A: '#2e9e6e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
}

const initialRatios: GradeRatio[] = [
  { grade: 'S', label: '탁월', ratio: 10, color: gradeColors.S },
  { grade: 'A', label: '우수', ratio: 20, color: gradeColors.A },
  { grade: 'B', label: '보통', ratio: 40, color: gradeColors.B },
  { grade: 'C', label: '미흡', ratio: 20, color: gradeColors.C },
  { grade: 'D', label: '부진', ratio: 10, color: gradeColors.D },
]

const presets: Preset[] = [
  {
    label: '표준형 (기본)',
    description: '가장 일반적인 정규분포 형태입니다. 중간 등급(B)에 가장 많은 인원을 배치하고 상·하위 등급은 대칭적으로 줄어드는 구조입니다. 대부분의 조직에서 무난하게 사용할 수 있습니다.',
    ratios: [
      { grade: 'S', label: '탁월', ratio: 10, color: gradeColors.S },
      { grade: 'A', label: '우수', ratio: 20, color: gradeColors.A },
      { grade: 'B', label: '보통', ratio: 40, color: gradeColors.B },
      { grade: 'C', label: '미흡', ratio: 20, color: gradeColors.C },
      { grade: 'D', label: '부진', ratio: 10, color: gradeColors.D },
    ],
  },
  {
    label: '상위 확대형',
    description: '우수 인재 비율을 높여 동기부여를 강화하는 구조입니다. 성과 중심 조직이나 핵심 인재 유지가 중요한 부서에 적합합니다. 하위 등급 비율이 낮아 저성과자 관리는 약할 수 있습니다.',
    ratios: [
      { grade: 'S', label: '탁월', ratio: 15, color: gradeColors.S },
      { grade: 'A', label: '우수', ratio: 25, color: gradeColors.A },
      { grade: 'B', label: '보통', ratio: 35, color: gradeColors.B },
      { grade: 'C', label: '미흡', ratio: 15, color: gradeColors.C },
      { grade: 'D', label: '부진', ratio: 10, color: gradeColors.D },
    ],
  },
  {
    label: '엄격형',
    description: '하위 등급 비율을 높여 성과 압박을 강화하는 구조입니다. 저성과자 관리가 필요하거나 조직 쇄신이 필요한 시기에 적용합니다. 상위 등급이 희소해 받았을 때의 보상 가치가 높아집니다.',
    ratios: [
      { grade: 'S', label: '탁월', ratio: 5, color: gradeColors.S },
      { grade: 'A', label: '우수', ratio: 15, color: gradeColors.A },
      { grade: 'B', label: '보통', ratio: 40, color: gradeColors.B },
      { grade: 'C', label: '미흡', ratio: 25, color: gradeColors.C },
      { grade: 'D', label: '부진', ratio: 15, color: gradeColors.D },
    ],
  },
]

const mockHistory: HistoryEntry[] = [
  { date: '2024-05-20', changer: '이서연(인사팀)', s: 10, a: 20, b: 40, c: 20, d: 10 },
  { date: '2024-01-10', changer: '이서연(인사팀)', s: 5, a: 25, b: 45, c: 15, d: 10 },
  { date: '2023-11-01', changer: '정하은(재무팀)', s: 10, a: 20, b: 40, c: 20, d: 10 },
]

export default function ForceDistribution() {
  const [ratios, setRatios] = useState<GradeRatio[]>(initialRatios)
  const [editMode, setEditMode] = useState(false)
  const [tempRatios, setTempRatios] = useState<GradeRatio[]>(initialRatios)
  const [showPresets, setShowPresets] = useState(false)

  const total = tempRatios.reduce((s, r) => s + r.ratio, 0)

  const handleSave = () => {
    if (total !== 100) return
    setRatios(tempRatios)
    setEditMode(false)
  }

  const applyPreset = (preset: Preset) => {
    setRatios(preset.ratios.map(r => ({ ...r })))
    setTempRatios(preset.ratios.map(r => ({ ...r })))
    setShowPresets(false)
  }

  const maxRatio = Math.max(...ratios.map(r => r.ratio))

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 설계 &gt; 강제배분 설정</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">강제배분 설정</h1>
          <p className="text-[13px] text-[#8a9490]">등급별 인원 비율을 설정합니다. 합계가 100%여야 합니다.</p>
        </div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="border border-[#e0e5e3] bg-white text-[#1a2b23] rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
        >
          기본 프리셋 적용
        </button>
      </div>

      {/* 프리셋 선택 */}
      {showPresets && (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
          <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-2">기본 프리셋 선택</h3>
          <p className="text-[12px] text-[#8a9490] mb-4">조직 상황에 맞는 배분 구조를 선택하세요. 적용 후 개별 수정이 가능합니다.</p>
          <div className="grid grid-cols-3 gap-4">
            {presets.map((preset, i) => (
              <div key={i} className="border border-[#e0e5e3] rounded-lg p-4 hover:border-[#1D9E75] transition-colors">
                <div className="text-[13px] font-semibold text-[#1a2b23] mb-2">{preset.label}</div>
                <p className="text-[11px] text-[#8a9490] mb-3 leading-relaxed">{preset.description}</p>
                <div className="flex gap-2 mb-3">
                  {preset.ratios.map(r => (
                    <div key={r.grade} className="flex-1 text-center">
                      <div className="text-[12px] font-bold" style={{ color: r.color }}>{r.grade}</div>
                      <div className="text-[11px] text-[#5a6b62]">{r.ratio}%</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => applyPreset(preset)}
                  className="w-full bg-[#1D9E75] text-white border-none rounded-md px-3 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
                >
                  적용
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => setShowPresets(false)} className="text-[12px] text-[#8a9490] bg-transparent border-none cursor-pointer hover:text-[#1a2b23]">닫기</button>
          </div>
        </div>
      )}

      {/* 등급별 비율 설정 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">등급별 비율 설정</h3>
          {!editMode ? (
            <button
              onClick={() => { setEditMode(true); setTempRatios(ratios.map(r => ({ ...r }))) }}
              className="border border-[#e0e5e3] bg-white text-[#1a2b23] rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
            >
              수정
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${total === 100 ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'}`}>
                합계 {total}%
              </span>
              <button onClick={handleSave} className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]">저장</button>
              <button onClick={() => setEditMode(false)} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
            </div>
          )}
        </div>

        {/* 바 차트 */}
        <div className="flex items-end gap-4 h-36 mb-4 px-4">
          {ratios.map(r => (
            <div key={r.grade} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[12px] font-semibold" style={{ color: r.color }}>{r.ratio}%</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${(r.ratio / maxRatio) * 100}px`, backgroundColor: r.color, opacity: 0.85 }}
              />
            </div>
          ))}
        </div>

        {/* 등급 라벨 + 입력 */}
        <div className="flex gap-4 px-4">
          {(editMode ? tempRatios : ratios).map((r, i) => (
            <div key={r.grade} className="flex-1 text-center">
              <div className="text-[14px] font-bold" style={{ color: r.color }}>{r.grade}</div>
              <div className="text-[11px] text-[#8a9490]">{r.label}</div>
              {editMode ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={tempRatios[i].ratio}
                  onChange={e => {
                    const updated = [...tempRatios]
                    updated[i] = { ...updated[i], ratio: Number(e.target.value) }
                    setTempRatios(updated)
                  }}
                  className="w-full mt-1 border border-[#e0e5e3] rounded-md px-2 py-1 text-center text-[13px]"
                />
              ) : (
                <div className="text-[14px] font-semibold text-[#1a2b23] mt-1">{r.ratio}%</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 설정 이력 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">설정 이력</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e5e3]">
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">변경일</th>
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">변경자</th>
              <th className="text-center px-5 py-3 font-medium" style={{ color: gradeColors.S }}>S</th>
              <th className="text-center px-5 py-3 font-medium" style={{ color: gradeColors.A }}>A</th>
              <th className="text-center px-5 py-3 font-medium" style={{ color: gradeColors.B }}>B</th>
              <th className="text-center px-5 py-3 font-medium" style={{ color: gradeColors.C }}>C</th>
              <th className="text-center px-5 py-3 font-medium" style={{ color: gradeColors.D }}>D</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((h, idx) => (
              <tr key={idx} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-5 py-3 text-[#5a6b62]">{h.date}</td>
                <td className="px-5 py-3 text-[#1a2b23]">{h.changer}</td>
                <td className="px-5 py-3 text-center font-medium" style={{ color: gradeColors.S }}>{h.s}%</td>
                <td className="px-5 py-3 text-center font-medium" style={{ color: gradeColors.A }}>{h.a}%</td>
                <td className="px-5 py-3 text-center font-medium" style={{ color: gradeColors.B }}>{h.b}%</td>
                <td className="px-5 py-3 text-center font-medium" style={{ color: gradeColors.C }}>{h.c}%</td>
                <td className="px-5 py-3 text-center font-medium" style={{ color: gradeColors.D }}>{h.d}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 기본 세팅 기준 안내 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-5">
        <h3 className="text-[13px] font-semibold text-[#1a2b23] mb-3">기본 세팅 기준 안내</h3>
        <div className="space-y-3 text-[12px] text-[#5a6b62] leading-relaxed">
          <div>
            <div className="font-medium text-[#1a2b23] mb-1">강제배분이란?</div>
            <p>평가 등급별로 받을 수 있는 인원 비율을 미리 정해두는 제도입니다. 평가자의 관대화/중심화 경향을 방지하고, 등급 간 변별력을 확보하기 위해 사용합니다.</p>
          </div>
          <div>
            <div className="font-medium text-[#1a2b23] mb-1">기본 배분 비율 (표준형)</div>
            <ul className="list-disc ml-4 space-y-0.5">
              <li><span className="font-medium" style={{ color: gradeColors.S }}>S등급 10%</span> — 탁월한 성과를 낸 최상위 인원. 전체의 약 1/10만 부여하여 희소가치를 유지합니다.</li>
              <li><span className="font-medium" style={{ color: gradeColors.A }}>A등급 20%</span> — 기대 이상의 우수한 성과. 승진·인센티브 등 보상의 주요 대상입니다.</li>
              <li><span className="font-medium" style={{ color: gradeColors.B }}>B등급 40%</span> — 기대 수준의 안정적 성과. 가장 많은 인원이 분포하는 중심 등급입니다.</li>
              <li><span className="font-medium" style={{ color: gradeColors.C }}>C등급 20%</span> — 기대에 다소 미치지 못한 성과. 역량 개발 및 개선 계획 대상입니다.</li>
              <li><span className="font-medium" style={{ color: gradeColors.D }}>D등급 10%</span> — 현저히 부진한 성과. 성과 개선 프로그램(PIP) 적용 대상입니다.</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-[#1a2b23] mb-1">왜 이 비율인가?</div>
            <ul className="list-disc ml-4 space-y-0.5">
              <li><span className="font-medium">정규분포 원리</span> — 대규모 조직에서 개인 성과는 정규분포를 따르는 경향이 있어, 중앙(B)이 가장 두껍고 양 끝(S/D)이 얇은 구조가 통계적으로 합리적입니다.</li>
              <li><span className="font-medium">상·하위 대칭</span> — S+A(30%) = C+D(30%)로 상하 대칭을 유지하여 공정성 인식을 높입니다.</li>
              <li><span className="font-medium">보상 재원 관리</span> — 상위 등급 비율이 과도하면 인센티브·승진 재원이 부족해지므로 30% 이내로 제한합니다.</li>
            </ul>
          </div>
          <div className="text-[11px] text-[#8a9490] pt-1">
            ※ 소규모 부서(10명 이하)에서는 강제배분 적용 시 1명 차이가 등급을 좌우할 수 있어, 부서 규모에 따라 유연하게 적용하는 것을 권장합니다.
          </div>
        </div>
      </div>
    </div>
  )
}
