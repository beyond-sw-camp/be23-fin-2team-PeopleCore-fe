import { useState } from 'react'

interface CertRequest {
  id: number
  empId: string
  name: string
  department: string
  certType: string
  purpose: string
  requestDate: string
  status: '발급대기' | '발급완료' | '반려'
  copies: number
}

const mockCerts: CertRequest[] = [
  { id: 1, empId: 'PC2024001', name: '김민수', department: '개발팀', certType: '재직증명서', purpose: '은행 제출용', requestDate: '2024-05-12', status: '발급대기', copies: 1 },
  { id: 2, empId: 'PC2024004', name: '최유진', department: '영업팀', certType: '재직증명서', purpose: '비자 발급', requestDate: '2024-05-11', status: '발급대기', copies: 2 },
  { id: 3, empId: 'PC2024005', name: '정하은', department: '재무팀', certType: '경력증명서', purpose: '이직 준비', requestDate: '2024-05-10', status: '발급완료', copies: 1 },
  { id: 4, empId: 'PC2024002', name: '이서연', department: '인사팀', certType: '재직증명서', purpose: '대출 서류', requestDate: '2024-05-08', status: '발급완료', copies: 1 },
  { id: 5, empId: 'PC2024007', name: '오나영', department: '경영지원팀', certType: '경력증명서', purpose: '외부 제출', requestDate: '2024-05-05', status: '발급완료', copies: 3 },
]

export default function Certificate() {
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showRequest, setShowRequest] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const filtered = mockCerts.filter(c => {
    if (filterType && c.certType !== filterType) return false
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">제증명</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">제증명 발급</h1>
          <p className="text-xs text-gray-400 mt-1">재직증명서, 경력증명서 등 각종 증명서 발급을 관리합니다. (emp-19, emp-20)</p>
        </div>
        <button onClick={() => setShowRequest(!showRequest)}
          className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
          <i className="fas fa-plus text-xs"></i>
          증명서 발급
        </button>
      </div>

      {/* Request Form */}
      {showRequest && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">증명서 발급 요청</span>
          </div>
          <div className="grid grid-cols-3 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">대상 사원 <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="이름 또는 사번 검색" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">증명서 종류 <span className="text-red-400">*</span></label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors">
                <option value="">선택</option>
                <option>재직증명서</option>
                <option>경력증명서</option>
                <option>근로소득 원천징수 영수증</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">발급 부수</label>
              <input type="number" defaultValue={1} min={1} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
            <div className="col-span-3 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">용도</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="예) 은행 대출 서류 제출용" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <button onClick={() => setShowRequest(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
            <button className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">발급 요청</button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eaf6f0] flex items-center justify-center">
            <i className="fas fa-file-alt text-[#1D9E75]"></i>
          </div>
          <div>
            <div className="text-xs text-gray-400">재직증명서</div>
            <div className="text-lg font-bold text-gray-900">{mockCerts.filter(c => c.certType === '재직증명서').length}건</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <i className="fas fa-file-contract text-blue-500"></i>
          </div>
          <div>
            <div className="text-xs text-gray-400">경력증명서</div>
            <div className="text-lg font-bold text-gray-900">{mockCerts.filter(c => c.certType === '경력증명서').length}건</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
            <i className="fas fa-clock text-yellow-500"></i>
          </div>
          <div>
            <div className="text-xs text-gray-400">발급 대기</div>
            <div className="text-lg font-bold text-yellow-500">{mockCerts.filter(c => c.status === '발급대기').length}건</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 종류</option>
            <option value="재직증명서">재직증명서</option>
            <option value="경력증명서">경력증명서</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 상태</option>
            <option value="발급대기">발급대기</option>
            <option value="발급완료">발급완료</option>
            <option value="반려">반려</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">증명서 종류</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">용도</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">부수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">신청일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">상태</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(cert => (
              <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{cert.empId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{cert.name}</td>
                <td className="px-4 py-3 text-gray-600">{cert.department}</td>
                <td className="px-4 py-3 text-gray-600">{cert.certType}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{cert.purpose}</td>
                <td className="px-4 py-3 text-center text-gray-600">{cert.copies}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{cert.requestDate}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    cert.status === '발급대기' ? 'bg-yellow-50 text-yellow-600' :
                    cert.status === '발급완료' ? 'bg-[#eaf6f0] text-[#1D9E75]' :
                    'bg-red-50 text-red-500'
                  }`}>{cert.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {cert.status === '발급대기' && (
                    <div className="flex gap-1.5 justify-center">
                      <button className="text-xs px-3 py-1 bg-[#1D9E75] text-white rounded-md hover:bg-[#0F6E56] transition-colors">발급</button>
                      <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-red-300 hover:text-red-500 transition-all">반려</button>
                    </div>
                  )}
                  {cert.status === '발급완료' && (
                    <button className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
                      <i className="fas fa-download mr-1"></i>출력
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex-1" />
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-auto">
          <span className="text-xs text-gray-400">총 {filtered.length}건</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-left text-[10px]" />
            </button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-left text-[10px]" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter(n => n === 0 || n === totalPages - 1 || Math.abs(n - page) <= 2)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '...' ? (
                  <span key={`e-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n as number)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      page === n ? 'bg-[#1D9E75] text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    {(n as number) + 1}
                  </button>
                )
              )
            }
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-right text-[10px]" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <i className="fas fa-angle-double-right text-[10px]" />
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {filtered.length === 0 ? '0건' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)} / ${filtered.length}건`}
          </span>
        </div>
      </div>
    </div>
  )
}
