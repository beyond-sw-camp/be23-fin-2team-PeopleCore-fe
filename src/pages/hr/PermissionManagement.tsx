import { useState } from 'react'

interface PermissionRequest {
  id: number
  empId: string
  name: string
  department: string
  requestType: string
  detail: string
  requestDate: string
  status: '대기' | '승인' | '반려'
}

const mockRequests: PermissionRequest[] = [
  { id: 1, empId: 'PC2024003', name: '박지훈', department: '마케팅팀', requestType: '메뉴 접근 권한', detail: '전자결재 모듈 접근 요청', requestDate: '2024-05-10', status: '대기' },
  { id: 2, empId: 'PC2024006', name: '한승우', department: '개발팀', requestType: '메일함 용량 추가', detail: '메일함 5GB → 20GB 증설', requestDate: '2024-05-09', status: '대기' },
  { id: 3, empId: 'PC2024004', name: '최유진', department: '영업팀', requestType: '정보 열람 범위', detail: '부서 전체 인사정보 열람 요청', requestDate: '2024-05-08', status: '대기' },
  { id: 4, empId: 'PC2024001', name: '김민수', department: '개발팀', requestType: '메뉴 접근 권한', detail: '급여 관리 모듈 접근 요청', requestDate: '2024-05-07', status: '승인' },
  { id: 5, empId: 'PC2024007', name: '오나영', department: '경영지원팀', requestType: '메일함 용량 추가', detail: '메일함 5GB → 10GB 증설', requestDate: '2024-05-05', status: '승인' },
  { id: 6, empId: 'PC2024002', name: '이서연', department: '인사팀', requestType: '정보 열람 범위', detail: '전사 인사정보 열람 요청', requestDate: '2024-05-03', status: '반려' },
]

const roleTemplates = [
  { name: '일반 사원', menus: ['대시보드', '게시판', '마이페이지', '메일'], infoScope: '본인 정보만' },
  { name: '팀장', menus: ['대시보드', '게시판', '전자결재', '근태', '마이페이지', '메일'], infoScope: '팀 내 열람 가능' },
  { name: 'HR 담당자', menus: ['대시보드', '게시판', '전자결재', '근태', '성과', '급여', '인사관리', '마이페이지', '메일'], infoScope: '전사 열람 가능' },
  { name: '재무 담당자', menus: ['대시보드', '게시판', '전자결재', '급여', '마이페이지', '메일'], infoScope: '부서 전체 열람 가능' },
  { name: '시스템 관리자', menus: ['전체 메뉴'], infoScope: '전사 열람 가능' },
]

export default function PermissionManagement() {
  const [tab, setTab] = useState<'requests' | 'templates'>('requests')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = mockRequests.filter(r => !filterStatus || r.status === filterStatus)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">권한 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">권한 관리</h1>
          <p className="text-xs text-gray-400 mt-1">사원의 메뉴·기능 접근 권한 및 정보 열람 범위를 관리합니다. (emp-2, emp-3, emp-12, emp-13)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('requests')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'requests' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
          권한 신청 목록
        </button>
        <button onClick={() => setTab('templates')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'templates' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
          권한 템플릿 관리
        </button>
      </div>

      {tab === 'requests' && (
        <>
          {/* Filters */}
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
                <i className="fas fa-search text-gray-400 text-xs"></i>
                <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
                <option value="">전체 상태</option>
                <option value="대기">대기</option>
                <option value="승인">승인</option>
                <option value="반려">반려</option>
              </select>
              <span className="text-xs text-gray-400 ml-auto">
                대기 {mockRequests.filter(r => r.status === '대기').length}건
              </span>
            </div>
          </div>

          {/* Request Table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청 유형</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상세 내용</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">처리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{req.empId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{req.name}</td>
                    <td className="px-4 py-3 text-gray-600">{req.department}</td>
                    <td className="px-4 py-3 text-gray-600">{req.requestType}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{req.detail}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{req.requestDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.status === '대기' ? 'bg-yellow-50 text-yellow-600' :
                        req.status === '승인' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                        'bg-red-50 text-red-500'
                      }`}>{req.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {req.status === '대기' ? (
                        <div className="flex gap-1.5 justify-center">
                          <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">승인</button>
                          <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-red-300 hover:text-red-500 transition-all">반려</button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">처리 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          {roleTemplates.map((tpl, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#eaf6f0] flex items-center justify-center">
                    <i className="fas fa-shield-alt text-[#1D9E75] text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tpl.name}</div>
                    <div className="text-xs text-gray-400">정보 열람: {tpl.infoScope}</div>
                  </div>
                </div>
                <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                  <i className="fas fa-edit mr-1"></i>수정
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tpl.menus.map((m, j) => (
                  <span key={j} className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md">{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
