import { useState } from 'react'
import type { Employee, Department, Rank } from '../types'

interface Props {
  employees: Employee[]
  departments: Department[]
  ranks: Rank[]
}

export default function EmployeeSearchTab({ employees, departments, ranks }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDeptId, setFilterDeptId] = useState('')
  const [filterRankId, setFilterRankId] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const filtered = employees.filter((e) => {
    if (e.status !== 'active') return false
    if (filterDeptId && e.departmentId !== filterDeptId) return false
    if (filterRankId && e.rankId !== filterRankId) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = e.name.toLowerCase().includes(q)
      const matchDept = e.departmentName.toLowerCase().includes(q)
      const matchRank = e.rankName.toLowerCase().includes(q)
      const matchPosition = e.positionName?.toLowerCase().includes(q) || false
      const matchJoinDate = e.joinDate.includes(q)
      if (!matchName && !matchDept && !matchRank && !matchPosition && !matchJoinDate) return false
    }
    return true
  })

  const sortedRanks = [...ranks].sort((a, b) => a.level - b.level)

  return (
    <div className="flex gap-5 h-full">
      {/* 좌: 검색 & 결과 목록 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
        {/* 검색 필터 */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 부서, 직급, 직책, 입사일로 검색..."
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-[13px] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <select value={filterDeptId} onChange={(e) => setFilterDeptId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#1D9E75] min-w-[140px]">
              <option value="">전체 부서</option>
              {departments.filter((d) => d.id !== 'ceo').map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select value={filterRankId} onChange={(e) => setFilterRankId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#1D9E75] min-w-[100px]">
              <option value="">전체 직급</option>
              {sortedRanks.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">검색 결과: <strong className="text-gray-600">{filtered.length}</strong>명</p>
        </div>

        {/* 결과 테이블 */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <i className="fa-solid fa-user-slash text-3xl mb-3" />
              <p className="text-[13px]">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_100px_80px_80px_100px] px-5 py-2.5 bg-gray-50 text-[11px] text-gray-500 font-medium border-b border-gray-100 sticky top-0">
                <span>이름</span><span>부서</span><span>직급</span><span>직책</span><span>입사일</span>
              </div>
              {filtered.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`grid grid-cols-[1fr_100px_80px_80px_100px] px-5 py-2.5 text-[12px] border-b border-gray-50 cursor-pointer transition-colors ${
                    selectedEmployee?.id === emp.id ? 'bg-[#f0faf6]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: emp.profileColor }}>
                      {emp.name.charAt(0)}
                    </span>
                    <span className="font-medium text-gray-800">{emp.name}</span>
                  </span>
                  <span className="text-gray-600 flex items-center">{emp.departmentName}</span>
                  <span className="text-gray-600 flex items-center">{emp.rankName}</span>
                  <span className="text-gray-600 flex items-center">{emp.positionName || '-'}</span>
                  <span className="text-gray-400 flex items-center">{emp.joinDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 우: 상세 정보 */}
      <div className="w-[300px] bg-white rounded-xl border border-gray-200 shrink-0 overflow-y-auto">
        {selectedEmployee ? (
          <div className="p-5">
            {/* 프로필 카드 */}
            <div className="flex flex-col items-center text-center mb-5 pb-5 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[22px] font-bold mb-3" style={{ backgroundColor: selectedEmployee.profileColor }}>
                {selectedEmployee.name.charAt(0)}
              </div>
              <h3 className="text-[16px] font-bold text-gray-800">{selectedEmployee.name}</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                {selectedEmployee.departmentName} · {selectedEmployee.rankName}
                {selectedEmployee.positionName && ` · ${selectedEmployee.positionName}`}
              </p>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-3">
              <InfoRow label="이메일" value={selectedEmployee.email} icon="fa-solid fa-envelope" />
              <InfoRow label="연락처" value={selectedEmployee.phone} icon="fa-solid fa-phone" />
              <InfoRow label="부서" value={selectedEmployee.departmentName} icon="fa-solid fa-building" />
              <InfoRow label="직급" value={selectedEmployee.rankName} icon="fa-solid fa-layer-group" />
              <InfoRow label="직책" value={selectedEmployee.positionName || '-'} icon="fa-solid fa-id-badge" />
              <InfoRow label="입사일" value={selectedEmployee.joinDate} icon="fa-solid fa-calendar" />
              <InfoRow label="상태" value={selectedEmployee.status === 'active' ? '재직' : selectedEmployee.status === 'leave' ? '휴직' : '퇴직'} icon="fa-solid fa-circle-info" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <i className="fa-solid fa-id-card text-3xl mb-3" />
            <p className="text-[13px]">직원을 선택하면</p>
            <p className="text-[13px]">상세 정보가 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <i className={`${icon} text-[11px] text-gray-400`} />
      </div>
      <div>
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-[12px] text-gray-800">{value}</p>
      </div>
    </div>
  )
}
