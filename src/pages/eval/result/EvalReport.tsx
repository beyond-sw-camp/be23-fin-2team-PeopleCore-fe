import { useState } from 'react';

type ReportType = 'individual' | 'dept' | 'company';
type ExportFormat = 'PDF' | 'Excel' | 'CSV';

interface DownloadHistory {
  date: string;
  type: string;
  format: string;
  downloader: string;
}

const mockHistory: DownloadHistory[] = [
  { date: '2024-07-05 14:23', type: '전사 리포트', format: 'PDF', downloader: '이서연' },
  { date: '2024-07-04 10:11', type: '부서별 리포트 (개발팀)', format: 'Excel', downloader: '이서연' },
  { date: '2024-07-03 16:45', type: '개인별 리포트 (김민수)', format: 'PDF', downloader: '이서연' },
];

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];
const depts = ['개발팀', '인사팀', '마케팅팀', '영업팀', '재무팀', '경영지원팀'];

export default function EvalReport() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [reportType, setReportType] = useState<ReportType>('individual');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('PDF');
  const [selectedEmployee, setSelectedEmployee] = useState('김민수');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['개발팀']);
  const [includeOptions, setIncludeOptions] = useState({ scores: true, itemScores: true, feedback: true, yearlyComparison: false });

  const toggleDept = (dept: string) => {
    setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  const reportCards: { key: ReportType; icon: string; title: string; desc: string }[] = [
    { key: 'individual', icon: 'fa-user', title: '개인별 리포트', desc: '특정 직원의 상세 평가 결과를 출력합니다' },
    { key: 'dept', icon: 'fa-building', title: '부서별 리포트', desc: '선택한 부서의 종합 평가 현황을 출력합니다' },
    { key: 'company', icon: 'fa-chart-bar', title: '전사 리포트', desc: '전사 평가 결과 및 통계를 출력합니다' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">평가 리포트 출력</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 리포트 출력</h1>
          <p className="text-xs text-gray-400 mt-1">평가 결과를 다양한 형식으로 출력합니다</p>
        </div>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Report type selection */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {reportCards.map(card => (
          <button
            key={card.key}
            onClick={() => setReportType(card.key)}
            className={`card p-5 text-left transition-all ${reportType === card.key ? 'border-2 border-[#1D9E75] shadow-md' : 'border border-gray-100 hover:border-gray-200'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${reportType === card.key ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-500'}`}>
              <i className={`fas ${card.icon}`}></i>
            </div>
            <div className={`text-sm font-bold mb-1 ${reportType === card.key ? 'text-[#1D9E75]' : 'text-gray-800'}`}>{card.title}</div>
            <div className="text-xs text-gray-400">{card.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Options */}
        <div className="col-span-7 space-y-4">
          {/* Conditional options */}
          {reportType === 'individual' && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">직원 선택</h3>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <i className="fas fa-search text-gray-400 text-xs"></i>
                <input
                  type="text"
                  value={selectedEmployee}
                  onChange={e => setSelectedEmployee(e.target.value)}
                  placeholder="이름 또는 사번으로 검색"
                  className="flex-1 text-sm focus:outline-none"
                />
              </div>
              {selectedEmployee && (
                <div className="mt-2 p-3 bg-[#1D9E75]/5 rounded-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-sm font-bold">{selectedEmployee[0]}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{selectedEmployee}</div>
                    <div className="text-xs text-gray-400">개발팀 · 대리</div>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">A등급</span>
                </div>
              )}
            </div>
          )}

          {reportType === 'dept' && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">부서 선택</h3>
              <div className="flex flex-wrap gap-2">
                {depts.map(d => (
                  <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(d)}
                      onChange={() => toggleDept(d)}
                      className="accent-[#1D9E75]"
                    />
                    <span className="text-sm text-gray-700">{d}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {reportType === 'company' && (
            <div className="card p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <i className="fas fa-info-circle text-[#1D9E75]"></i>
                전사 리포트는 모든 부서와 직원을 포함합니다.
              </div>
            </div>
          )}

          {/* Export format */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">출력 형식</h3>
            <div className="flex gap-4">
              {(['PDF', 'Excel', 'CSV'] as const).map(fmt => (
                <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={exportFormat === fmt} onChange={() => setExportFormat(fmt)} className="accent-[#1D9E75]" />
                  <span className="text-sm text-gray-700">{fmt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Include options */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">포함 항목</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'scores' as const, label: '점수 상세' },
                { key: 'itemScores' as const, label: '항목별 점수' },
                { key: 'feedback' as const, label: '팀장 피드백' },
                { key: 'yearlyComparison' as const, label: '연도별 비교' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includeOptions[opt.key]} onChange={e => setIncludeOptions({ ...includeOptions, [opt.key]: e.target.checked })} className="accent-[#1D9E75]" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
              <i className="fas fa-eye mr-1.5"></i>리포트 미리보기
            </button>
            <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-download"></i>다운로드 ({exportFormat})
            </button>
          </div>
        </div>

        {/* Recent downloads */}
        <div className="col-span-5 card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 다운로드</h3>
          <div className="space-y-3">
            {mockHistory.map((h, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-800">{h.type}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{h.date} · {h.downloader}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">{h.format}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
