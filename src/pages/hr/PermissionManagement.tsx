import { useState } from 'react'

interface PermissionRequest {
  id: number
  empId: string
  name: string
  department: string
  rank: string
  requestType: string
  detail: string
  requestDate: string
  approvalStatus: '승인' | '반려'
  applyStatus: '미적용' | '적용완료' | '보류'
}

interface RankPermission {
  rank: string
  infoScope: string
}

interface PositionPermission {
  position: string
  infoScope: string
  extras: string[]
}

const infoScopes = ['본인 정보만', '팀 내 열람 가능', '부서 전체 열람 가능', '전사 열람 가능']
const extraPermissions = ['팀원 평가 권한', '팀원 목표 승인', '팀원 인사정보 조회', '부서 예산 조회', '전사 인사정보 조회', '전사 급여 조회']

const mockRequests: PermissionRequest[] = [
  { id: 1, empId: 'PC2024003', name: '박지훈', department: '마케팅팀', rank: '사원', requestType: '정보 열람 범위', detail: '부서 전체 인사정보 열람 요청', requestDate: '2024-05-10', approvalStatus: '승인', applyStatus: '미적용' },
  { id: 2, empId: 'PC2024004', name: '최유진', department: '영업팀', rank: '주임', requestType: '정보 열람 범위', detail: '팀 내 열람 권한 요청', requestDate: '2024-05-08', approvalStatus: '승인', applyStatus: '미적용' },
  { id: 3, empId: 'PC2024001', name: '김민수', department: '개발팀', rank: '대리', requestType: '정보 열람 범위', detail: '부서 전체 열람 요청', requestDate: '2024-05-07', approvalStatus: '승인', applyStatus: '적용완료' },
  { id: 4, empId: 'PC2024002', name: '이서연', department: '인사팀', rank: '과장', requestType: '정보 열람 범위', detail: '전사 인사정보 열람 요청', requestDate: '2024-05-03', approvalStatus: '반려', applyStatus: '보류' },
]

const initialRankPermissions: RankPermission[] = [
  { rank: '사원', infoScope: '본인 정보만' },
  { rank: '주임', infoScope: '본인 정보만' },
  { rank: '대리', infoScope: '팀 내 열람 가능' },
  { rank: '과장', infoScope: '팀 내 열람 가능' },
  { rank: '차장', infoScope: '부서 전체 열람 가능' },
  { rank: '부장', infoScope: '전사 열람 가능' },
]

const initialPositionPermissions: PositionPermission[] = [
  { position: '팀장', infoScope: '팀 내 열람 가능', extras: ['팀원 평가 권한', '팀원 목표 승인', '팀원 인사정보 조회'] },
  { position: '파트장', infoScope: '부서 전체 열람 가능', extras: ['팀원 평가 권한', '팀원 목표 승인'] },
  { position: '실장', infoScope: '부서 전체 열람 가능', extras: ['팀원 평가 권한', '팀원 목표 승인', '부서 예산 조회'] },
  { position: '본부장', infoScope: '전사 열람 가능', extras: ['팀원 평가 권한', '팀원 목표 승인', '전사 인사정보 조회', '전사 급여 조회'] },
]

export default function PermissionManagement() {
  const [tab, setTab] = useState<'requests' | 'rank'>('requests')
  const [filterApply, setFilterApply] = useState('')
  const [rankPermissions, setRankPermissions] = useState<RankPermission[]>(initialRankPermissions)
  const [positionPermissions, setPositionPermissions] = useState<PositionPermission[]>(initialPositionPermissions)
  const [editingRank, setEditingRank] = useState<string | null>(null)
  const [editingPosition, setEditingPosition] = useState<string | null>(null)

  const filtered = mockRequests.filter(r => !filterApply || r.applyStatus === filterApply)

  const handleRankScopeChange = (rank: string, scope: string) => {
    setRankPermissions(prev => prev.map(rp => rp.rank === rank ? { ...rp, infoScope: scope } : rp))
  }

  const handlePositionScopeChange = (position: string, scope: string) => {
    setPositionPermissions(prev => prev.map(pp => pp.position === position ? { ...pp, infoScope: scope } : pp))
  }

  const handlePositionExtraToggle = (position: string, extra: string) => {
    setPositionPermissions(prev => prev.map(pp => pp.position === position ? {
      ...pp,
      extras: pp.extras.includes(extra) ? pp.extras.filter(e => e !== extra) : [...pp.extras, extra]
    } : pp))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">권한 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">권한 관리</h1>
          <p className="text-xs text-gray-400 mt-1">직급·직책별 정보 열람 범위를 설정하고, 사원의 권한 변경 신청을 처리합니다.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('requests')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'requests' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
          권한 신청 목록
        </button>
        <button onClick={() => setTab('rank')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'rank' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
          직급별 권한 설정
        </button>
      </div>

      {tab === 'requests' && (
        <>
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
                <i className="fas fa-search text-gray-400 text-xs"></i>
                <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
              </div>
              <select value={filterApply} onChange={e => setFilterApply(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
                <option value="">전체 상태</option>
                <option value="미적용">미적용</option>
                <option value="적용완료">적용완료</option>
                <option value="보류">보류</option>
              </select>
              <span className="text-xs text-gray-400 ml-auto">
                미적용 {mockRequests.filter(r => r.applyStatus === '미적용').length}건
              </span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청 내용</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">결재</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">적용</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">처리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{req.empId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{req.name}</td>
                    <td className="px-4 py-3 text-gray-600">{req.department}</td>
                    <td className="px-4 py-3 text-gray-600">{req.rank}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{req.detail}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{req.requestDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.approvalStatus === '승인' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-red-50 text-red-500'
                      }`}>{req.approvalStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.applyStatus === '미적용' ? 'bg-yellow-50 text-yellow-600' :
                        req.applyStatus === '적용완료' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                        'bg-gray-100 text-gray-500'
                      }`}>{req.applyStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {req.approvalStatus === '승인' && req.applyStatus === '미적용' ? (
                        <div className="flex gap-1.5 justify-center">
                          <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">권한 적용</button>
                          <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-gray-400 transition-all">보류</button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
            전자결재에서 승인된 권한 변경 건이 이 목록에 표시됩니다. "권한 적용" 시 해당 사원에게 예외 권한이 반영됩니다.
          </div>
        </>
      )}

      {tab === 'rank' && (
        <>
          <div className="card p-5 mb-4">
            <div className="mb-1">
              <h3 className="text-sm font-semibold text-gray-900">직급별 정보 열람 범위</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">각 직급의 기본 정보 열람 범위를 설정합니다. 해당 직급의 모든 사원에게 일괄 적용됩니다.</p>

            <div className="space-y-3">
              {rankPermissions.map(rp => (
                <div key={rp.rank} className="card p-5">
                  {editingRank === rp.rank ? (
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <i className="fas fa-edit text-blue-500 text-sm"></i>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">'{rp.rank}' 권한 수정</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingRank(null)}
                            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                            취소
                          </button>
                          <button onClick={() => setEditingRank(null)}
                            className="text-xs px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg hover:bg-[#0F6E56] transition-colors font-medium">
                            저장
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">정보 열람 범위</label>
                        <div className="flex gap-2">
                          {infoScopes.map(scope => (
                            <button
                              key={scope}
                              onClick={() => handleRankScopeChange(rp.rank, scope)}
                              className={`text-xs px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                rp.infoScope === scope
                                  ? 'bg-[#eaf6f0] border-[#1D9E75] text-[#1D9E75] font-medium'
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {scope}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#eaf6f0] flex items-center justify-center">
                          <i className="fas fa-shield-alt text-[#1D9E75] text-sm"></i>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{rp.rank}</div>
                          <div className="text-xs text-gray-400">정보 열람: {rp.infoScope}</div>
                        </div>
                      </div>
                      <button onClick={() => setEditingRank(rp.rank)}
                        className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                        <i className="fas fa-edit mr-1"></i>수정
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 직책별 권한 설정 */}
          <div className="card p-5 mb-4">
            <div className="mb-1">
              <h3 className="text-sm font-semibold text-gray-900">직책별 추가 권한</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">직책이 있는 사원에게 부여되는 추가 열람 범위와 기능 권한을 설정합니다. 직급과 직책 중 더 넓은 범위가 적용됩니다.</p>

            <div className="space-y-3">
              {positionPermissions.map(pp => (
                <div key={pp.position} className="card p-5">
                  {editingPosition === pp.position ? (
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <i className="fas fa-edit text-blue-500 text-sm"></i>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">'{pp.position}' 권한 수정</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingPosition(null)}
                            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                            취소
                          </button>
                          <button onClick={() => setEditingPosition(null)}
                            className="text-xs px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg hover:bg-[#0F6E56] transition-colors font-medium">
                            저장
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">정보 열람 범위</label>
                        <div className="flex gap-2">
                          {infoScopes.map(scope => (
                            <button
                              key={scope}
                              onClick={() => handlePositionScopeChange(pp.position, scope)}
                              className={`text-xs px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                pp.infoScope === scope
                                  ? 'bg-[#eaf6f0] border-[#1D9E75] text-[#1D9E75] font-medium'
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {scope}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">추가 기능 권한</label>
                        <div className="flex flex-wrap gap-2">
                          {extraPermissions.map(extra => {
                            const isChecked = pp.extras.includes(extra)
                            return (
                              <button
                                key={extra}
                                onClick={() => handlePositionExtraToggle(pp.position, extra)}
                                className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-[#eaf6f0] border-[#1D9E75] text-[#1D9E75] font-medium'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                }`}
                              >
                                {isChecked && <i className="fas fa-check text-[10px] mr-1"></i>}
                                {extra}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#eaf6f0] flex items-center justify-center">
                            <i className="fas fa-user-tie text-[#1D9E75] text-sm"></i>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{pp.position}</div>
                            <div className="text-xs text-gray-400">정보 열람: {pp.infoScope}</div>
                          </div>
                        </div>
                        <button onClick={() => setEditingPosition(pp.position)}
                          className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                          <i className="fas fa-edit mr-1"></i>수정
                        </button>
                      </div>
                      {pp.extras.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {pp.extras.map((e, j) => (
                            <span key={j} className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md">{e}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
            개별 사원의 예외 권한은 「권한 신청 목록」 탭에서 사원 신청을 승인하여 처리합니다.
          </div>
        </>
      )}
    </div>
  )
}
