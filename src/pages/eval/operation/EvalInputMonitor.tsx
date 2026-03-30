import { useState } from 'react';

type EvalStatus = '제출' | '미제출' | '일부';

interface EmployeeStatus {
  id: string;
  name: string;
  dept: string;
  selfSubmit: EvalStatus;
  selfDate: string;
  peerSubmit: EvalStatus;
  peerDate: string;
  managerSubmit: EvalStatus;
  managerDate: string;
}

const mockData: EmployeeStatus[] = [
  { id: 'PC2024001', name: '김민수', dept: '개발팀', selfSubmit: '제출', selfDate: '2024-06-10 14:32', peerSubmit: '제출', peerDate: '2024-06-12 09:15', managerSubmit: '미제출', managerDate: '-' },
  { id: 'PC2024002', name: '이서연', dept: '인사팀', selfSubmit: '제출', selfDate: '2024-06-09 11:20', peerSubmit: '제출', peerDate: '2024-06-11 16:45', managerSubmit: '미제출', managerDate: '-' },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', selfSubmit: '미제출', selfDate: '-', peerSubmit: '미제출', peerDate: '-', managerSubmit: '미제출', managerDate: '-' },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', selfSubmit: '제출', selfDate: '2024-06-11 10:05', peerSubmit: '일부', peerDate: '-', managerSubmit: '미제출', managerDate: '-' },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', selfSubmit: '제출', selfDate: '2024-06-10 08:55', peerSubmit: '미제출', peerDate: '-', managerSubmit: '미제출', managerDate: '-' },
  { id: 'PC2024006', name: '한승우', dept: '개발팀', selfSubmit: '미제출', selfDate: '-', peerSubmit: '미제출', peerDate: '-', managerSubmit: '미제출', managerDate: '-' },
  { id: 'PC2024007', name: '오나영', dept: '경영지원팀', selfSubmit: '제출', selfDate: '2024-06-11 15:30', peerSubmit: '미제출', peerDate: '-', managerSubmit: '미제출', managerDate: '-' },
  { id: 'PC2024008', name: '윤재혁', dept: '개발팀', selfSubmit: '제출', selfDate: '2024-06-09 17:00', peerSubmit: '제출', peerDate: '2024-06-13 10:30', managerSubmit: '미제출', managerDate: '-' },
];

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function EvalInputMonitor() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [activeTab, setActiveTab] = useState<'self' | 'peer' | 'manager'>('self');
  const [deptFilter, setDeptFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');

  const statusBadge = (s: EvalStatus) => {
    if (s === '제출') return 'bg-green-100 text-green-700';
    if (s === '미제출') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getSubmitInfo = (emp: EmployeeStatus) => {
    if (activeTab === 'self') return { status: emp.selfSubmit, date: emp.selfDate };
    if (activeTab === 'peer') return { status: emp.peerSubmit, date: emp.peerDate };
    return { status: emp.managerSubmit, date: emp.managerDate };
  };

  const selfSubmitted = mockData.filter(e => e.selfSubmit === '제출').length;
  const peerSubmitted = mockData.filter(e => e.peerSubmit === '제출').length;

  const filtered = mockData.filter(e => {
    if (deptFilter !== '전체' && e.dept !== deptFilter) return false;
    const { status } = getSubmitInfo(e);
    if (statusFilter !== '전체' && status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 운영 › <span className="text-[#1D9E75] font-medium">평가 입력 현황 모니터링</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 입력 현황 모니터링</h1>
          <p className="text-xs text-gray-400 mt-1">평가 단계별 제출 현황을 실시간으로 모니터링합니다 (eval-9)</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          >
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            <i className="fas fa-sync-alt mr-1.5"></i>새로고침
          </button>
        </div>
      </div>

      {/* Progress cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: '자기평가', submitted: selfSubmitted, total: 73, color: '#1D9E75' },
          { label: '동료평가', submitted: peerSubmitted, total: 73, color: '#3B82F6' },
          { label: '상위자평가', submitted: 0, total: 73, color: '#F59E0B' },
        ].map(item => {
          const pct = Math.round((item.submitted / item.total) * 100);
          return (
            <div key={item.label} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                  <div className="text-2xl font-bold text-gray-800 mt-0.5">{item.submitted}<span className="text-sm font-normal text-gray-400">/{item.total} 제출</span></div>
                </div>
                <span className="text-lg font-bold" style={{ color: item.color }}>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }}></div>
              </div>
              <div className="text-xs text-red-500">미제출 {item.total - item.submitted}명</div>
            </div>
          );
        })}
      </div>

      {/* Tab */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ key: 'self' as const, label: '자기평가' }, { key: 'peer' as const, label: '동료평가' }, { key: 'manager' as const, label: '상위자평가' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {['전체', '개발팀', '인사팀', '마케팅팀', '영업팀', '재무팀', '경영지원팀'].map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {['전체', '제출', '미제출', '일부'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">제출일시</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const info = getSubmitInfo(emp);
              return (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500">{emp.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{emp.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{emp.dept}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{info.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(info.status)}`}>{info.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
