import { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  dept: string;
  rank: string;
  status: '재직' | '수습' | '휴직';
  included: boolean;
}

const mockEmployees: Employee[] = [
  { id: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', status: '재직', included: true },
  { id: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', status: '재직', included: true },
  { id: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', status: '수습', included: false },
  { id: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', status: '재직', included: true },
  { id: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', status: '재직', included: true },
];

const depts = [
  { name: '개발팀', count: 15 },
  { name: '인사팀', count: 8 },
  { name: '마케팅팀', count: 10 },
  { name: '영업팀', count: 18 },
  { name: '재무팀', count: 7 },
  { name: '경영지원팀', count: 15 },
];

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];

export default function TargetConfirmation() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [statusFilter, setStatusFilter] = useState<'전체' | '재직' | '수습' | '휴직'>('전체');
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);

  const toggleIncluded = (id: string) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, included: !e.included } : e));
  };

  const filtered = statusFilter === '전체' ? employees : employees.filter(e => e.status === statusFilter);

  const statusBadge = (s: Employee['status']) => {
    if (s === '재직') return 'bg-green-100 text-green-700';
    if (s === '수습') return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 설계 › <span className="text-[#1D9E75] font-medium">평가 대상자 확정</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 대상자 확정</h1>
          <p className="text-xs text-gray-400 mt-1">평가 시즌별 대상자를 확정합니다 (eval-3)</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          >
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-check"></i>대상자 확정
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">재직상태</span>
          {(['전체', '재직', '수습', '휴직'] as const).map(s => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" checked={statusFilter === s} onChange={() => setStatusFilter(s)} className="accent-[#1D9E75]" />
              <span className="text-sm text-gray-600">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Department grid */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        {depts.map(d => (
          <div key={d.name} className="card p-4 text-center cursor-pointer hover:border-[#1D9E75] hover:shadow-md transition-all border border-transparent">
            <div className="text-xs font-medium text-gray-700 mb-1">{d.name}</div>
            <div className="text-lg font-bold text-[#1D9E75]">{d.count}명</div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3 mb-5">
        <span className="text-xs text-gray-500">재직 상태 기준 자동 추출 · 수습/휴직자 별도 설정 가능</span>
        <span className="text-sm font-bold text-[#1D9E75]">총 73명</span>
      </div>

      {/* Employee table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">재직상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">포함여부</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500">{emp.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{emp.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{emp.dept}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{emp.rank}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(emp.status)}`}>{emp.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleIncluded(emp.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${emp.included ? 'bg-[#1D9E75]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${emp.included ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
