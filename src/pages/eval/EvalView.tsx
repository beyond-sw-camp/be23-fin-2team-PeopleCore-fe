import { useState } from 'react'

interface EvalRecord {
  empId: string
  name: string
  department: string
  rank: string
  selfScore: number | null
  peerScore: number | null
  managerScore: number | null
  totalScore: number | null
  grade: string | null
  selfStatus: '제출' | '미제출'
  peerStatus: '제출' | '미제출' | '일부'
  managerStatus: '제출' | '미제출'
}

const mockRecords: EvalRecord[] = [
  { empId: 'PC2024001', name: '김민수', department: '개발팀', rank: '대리', selfScore: 82, peerScore: 78, managerScore: 85, totalScore: 82.4, grade: 'A', selfStatus: '제출', peerStatus: '제출', managerStatus: '제출' },
  { empId: 'PC2024002', name: '이서연', department: '인사팀', rank: '과장', selfScore: 90, peerScore: 88, managerScore: 92, totalScore: 90.4, grade: 'S', selfStatus: '제출', peerStatus: '제출', managerStatus: '제출' },
  { empId: 'PC2024003', name: '박지훈', department: '마케팅팀', rank: '사원', selfScore: 70, peerScore: null, managerScore: null, totalScore: null, grade: null, selfStatus: '제출', peerStatus: '미제출', managerStatus: '미제출' },
  { empId: 'PC2024004', name: '최유진', department: '영업팀', rank: '주임', selfScore: 75, peerScore: 72, managerScore: null, totalScore: null, grade: null, selfStatus: '제출', peerStatus: '제출', managerStatus: '미제출' },
  { empId: 'PC2024005', name: '정하은', department: '재무팀', rank: '차장', selfScore: 88, peerScore: 85, managerScore: 90, totalScore: 88.4, grade: 'A', selfStatus: '제출', peerStatus: '제출', managerStatus: '제출' },
  { empId: 'PC2024006', name: '한승우', department: '개발팀', rank: '사원', selfScore: null, peerScore: null, managerScore: null, totalScore: null, grade: null, selfStatus: '미제출', peerStatus: '미제출', managerStatus: '미제출' },
  { empId: 'PC2024007', name: '오나영', department: '경영지원팀', rank: '대리', selfScore: 80, peerScore: 76, managerScore: 82, totalScore: 80.0, grade: 'B', selfStatus: '제출', peerStatus: '제출', managerStatus: '제출' },
  { empId: 'PC2024008', name: '윤재혁', department: '개발팀', rank: '부장', selfScore: 85, peerScore: 90, managerScore: 88, totalScore: 88.0, grade: 'A', selfStatus: '제출', peerStatus: '제출', managerStatus: '제출' },
]

export default function EvalView() {
  const [tab, setTab] = useState<'all' | 'self' | 'manager' | 'peer'>('all')
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')

  const filtered = mockRecords.filter(r => {
    if (search && !r.name.includes(search) && !r.empId.includes(search)) return false
    if (filterDept && r.department !== filterDept) return false
    return true
  })

  const departments = [...new Set(mockRecords.map(r => r.department))]

  const gradeColor = (grade: string | null) => {
    if (!grade) return 'bg-gray-100 text-gray-400'
    if (grade === 'S') return 'bg-[#eaf6f0] text-[#1D9E75]'
    if (grade === 'A') return 'bg-blue-50 text-blue-600'
    if (grade === 'B') return 'bg-yellow-50 text-yellow-600'
    return 'bg-red-50 text-red-500'
  }

  const statusBadge = (status: string) => {
    if (status === '제출') return 'bg-[#eaf6f0] text-[#1D9E75]'
    if (status === '일부') return 'bg-yellow-50 text-yellow-600'
    return 'bg-red-50 text-red-500'
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 조회</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 조회</h1>
          <p className="text-xs text-gray-400 mt-1">전체·본인·팀장·동료 평가 결과를 조회합니다. (eval-11 ~ eval-14)</p>
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
          <option>2024년 상반기 정기평가</option>
          <option>2023년 하반기 정기평가</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: 'all', label: '전체 평가' },
          { key: 'self', label: '본인 평가' },
          { key: 'manager', label: '팀장 평가' },
          { key: 'peer', label: '동료 평가' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {['S', 'A', 'B', 'C', '-'].map(g => {
          const count = g === '-'
            ? mockRecords.filter(r => !r.grade).length
            : mockRecords.filter(r => r.grade === g).length
          return (
            <div key={g} className="card p-3 text-center">
              <div className={`text-lg font-bold ${g === 'S' ? 'text-[#1D9E75]' : g === 'A' ? 'text-blue-500' : g === 'B' ? 'text-yellow-500' : g === 'C' ? 'text-red-400' : 'text-gray-400'}`}>
                {g === '-' ? '미산정' : g}
              </div>
              <div className="text-xl font-bold text-gray-900">{count}<span className="text-xs font-normal text-gray-400">명</span></div>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 부서</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">총 {filtered.length}명</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              {(tab === 'all' || tab === 'self') && (
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">자기평가</th>
              )}
              {(tab === 'all' || tab === 'peer') && (
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">동료평가</th>
              )}
              {(tab === 'all' || tab === 'manager') && (
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">상위자평가</th>
              )}
              {tab === 'all' && (
                <>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">종합점수</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">등급</th>
                </>
              )}
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">상세</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.empId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.empId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.department}</td>
                <td className="px-4 py-3 text-gray-600">{r.rank}</td>
                {(tab === 'all' || tab === 'self') && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-medium text-gray-900">{r.selfScore ?? '—'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge(r.selfStatus)}`}>{r.selfStatus}</span>
                    </div>
                  </td>
                )}
                {(tab === 'all' || tab === 'peer') && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-medium text-gray-900">{r.peerScore ?? '—'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge(r.peerStatus)}`}>{r.peerStatus}</span>
                    </div>
                  </td>
                )}
                {(tab === 'all' || tab === 'manager') && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-medium text-gray-900">{r.managerScore ?? '—'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge(r.managerStatus)}`}>{r.managerStatus}</span>
                    </div>
                  </td>
                )}
                {tab === 'all' && (
                  <>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{r.totalScore ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${gradeColor(r.grade)}`}>{r.grade ?? '—'}</span>
                    </td>
                  </>
                )}
                <td className="px-4 py-3 text-center">
                  <button className="text-gray-400 hover:text-[#1D9E75] text-xs"><i className="fas fa-eye"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
