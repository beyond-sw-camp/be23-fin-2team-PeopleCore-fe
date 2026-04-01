import { useState } from 'react'

interface Contract {
  id: number
  empId: string
  name: string
  department: string
  position: string    // 직책
  jobTitle: string    // 직무
  rank: string        // 직급
  employmentType: string // 근로형태
  year: string
  contractType: string
  registeredDate: string
  fileName: string
  // 급여 상세
  annualSalary: number
  baseSalary: number        // 월 기본급
  extraSalary: number       // 월 기본급 외
  contractStart: string
  contractEnd: string
  weeklyHours: string
  probation: string
  memo: string
}

const mockContracts: Contract[] = [
  {
    id: 1, empId: 'PC2024001', name: '김민수', department: '개발팀', position: '팀원', jobTitle: '백엔드 개발', rank: '대리', employmentType: '정규직',
    year: '2024', contractType: '연봉계약서', registeredDate: '2024-01-08', fileName: '김민수_2024_연봉계약서.pdf',
    annualSalary: 48000000, baseSalary: 3500000, extraSalary: 500000, contractStart: '2024-01-01', contractEnd: '', weeklyHours: '40시간 (주 5일)', probation: '', memo: ''
  },
  {
    id: 2, empId: 'PC2024002', name: '이서연', department: '인사팀', position: '팀장', jobTitle: '인사관리', rank: '과장', employmentType: '정규직',
    year: '2024', contractType: '연봉계약서', registeredDate: '2024-01-06', fileName: '이서연_2024_연봉계약서.pdf',
    annualSalary: 55000000, baseSalary: 4000000, extraSalary: 583333, contractStart: '2024-01-01', contractEnd: '', weeklyHours: '40시간 (주 5일)', probation: '', memo: ''
  },
  {
    id: 3, empId: 'PC2024005', name: '정하은', department: '재무팀', position: '파트장', jobTitle: '회계', rank: '차장', employmentType: '정규직',
    year: '2024', contractType: '연봉계약서', registeredDate: '2024-01-04', fileName: '정하은_2024_연봉계약서.pdf',
    annualSalary: 62000000, baseSalary: 4500000, extraSalary: 666667, contractStart: '2024-01-01', contractEnd: '', weeklyHours: '40시간 (주 5일)', probation: '', memo: ''
  },
  {
    id: 4, empId: 'PC2024008', name: '윤재혁', department: '개발팀', position: '팀장', jobTitle: '프론트엔드 개발', rank: '부장', employmentType: '정규직',
    year: '2024', contractType: '연봉계약서', registeredDate: '2024-01-03', fileName: '윤재혁_2024_연봉계약서.pdf',
    annualSalary: 72000000, baseSalary: 5200000, extraSalary: 800000, contractStart: '2024-01-01', contractEnd: '', weeklyHours: '40시간 (주 5일)', probation: '', memo: ''
  },
  {
    id: 5, empId: 'PC2024004', name: '최유진', department: '영업팀', position: '팀원', jobTitle: '국내영업', rank: '주임', employmentType: '정규직',
    year: '2024', contractType: '연봉계약서', registeredDate: '2024-01-10', fileName: '최유진_2024_연봉계약서.pdf',
    annualSalary: 38000000, baseSalary: 2800000, extraSalary: 366667, contractStart: '2024-01-01', contractEnd: '', weeklyHours: '40시간 (주 5일)', probation: '', memo: ''
  },
  {
    id: 6, empId: 'PC2024003', name: '박지훈', department: '마케팅팀', position: '팀원', jobTitle: '디지털마케팅', rank: '사원', employmentType: '계약직',
    year: '2024', contractType: '근로계약서', registeredDate: '2023-09-01', fileName: '박지훈_2024_근로계약서.pdf',
    annualSalary: 32000000, baseSalary: 2400000, extraSalary: 266667, contractStart: '2024-01-01', contractEnd: '2024-12-31', weeklyHours: '40시간 (주 5일)', probation: '3개월', memo: '수습 기간 급여 90% 적용'
  },
]

// 사원 목록 (EmployeeList와 동일 데이터)
interface Employee {
  id: string
  name: string
  department: string
  position: string
  rank: string
  employType: string
}

const mockEmployees: Employee[] = [
  { id: 'PC2024001', name: '김민수', department: '개발팀', position: '팀원', rank: '대리', employType: '정규직' },
  { id: 'PC2024002', name: '이서연', department: '인사팀', position: '팀장', rank: '과장', employType: '정규직' },
  { id: 'PC2024003', name: '박지훈', department: '마케팅팀', position: '팀원', rank: '사원', employType: '계약직' },
  { id: 'PC2024004', name: '최유진', department: '영업팀', position: '팀원', rank: '주임', employType: '정규직' },
  { id: 'PC2024005', name: '정하은', department: '재무팀', position: '파트장', rank: '차장', employType: '정규직' },
  { id: 'PC2024006', name: '한승우', department: '개발팀', position: '팀원', rank: '사원', employType: '인턴' },
  { id: 'PC2024007', name: '오나영', department: '경영지원팀', position: '팀원', rank: '대리', employType: '정규직' },
  { id: 'PC2024008', name: '윤재혁', department: '개발팀', position: '팀장', rank: '부장', employType: '정규직' },
]

const fmt = (n: number) => n.toLocaleString('ko-KR')

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors'

export default function SalaryContract() {
  const [filterYear, setFilterYear] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [checkedIds, setCheckedIds] = useState<number[]>([])

  // 사원 검색
  const [empSearch, setEmpSearch] = useState('')
  const [empSearchOpen, setEmpSearchOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)

  const empResults = empSearch.length > 0
    ? mockEmployees.filter(e => e.name.includes(empSearch) || e.id.includes(empSearch))
    : []

  const handleSelectEmp = (emp: Employee) => {
    setSelectedEmp(emp)
    setEmpSearch(emp.name)
    setEmpSearchOpen(false)
  }

  const handleClearEmp = () => {
    setSelectedEmp(null)
    setEmpSearch('')
  }

  const filtered = mockContracts.filter(c => !filterYear || c.year === filterYear)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">연봉 계약 관리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">연봉 계약 관리</h1>
          <p className="text-xs text-gray-400 mt-1">구두 계약 완료된 연봉 계약서를 등록하고 관리합니다.</p>
        </div>
        <button onClick={() => setShowRegister(!showRegister)}
          className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
          <i className="fas fa-plus text-xs"></i>
          계약서 등록
        </button>
      </div>

      {/* ========== 계약서 등록 - 실제 계약서 형태 ========== */}
      {showRegister && (
        <div className="card mb-5 overflow-hidden">
          {/* 등록 헤더 */}
          <div className="px-8 pt-6 pb-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">계약서 등록</h2>
            <p className="text-xs text-gray-400 mt-1">구두 계약 완료된 연봉 계약 내용을 입력합니다</p>
          </div>

          <div className="px-8 py-6">
            {/* 제1조 인적사항 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-bold text-gray-800">인적사항</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-xs font-medium text-gray-500">사원 검색 <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input
                        className={inputClass + ' w-full pr-8'}
                        placeholder="이름 또는 사번 검색"
                        value={empSearch}
                        onChange={e => { setEmpSearch(e.target.value); setEmpSearchOpen(true); setSelectedEmp(null) }}
                        onFocus={() => empSearch.length > 0 && setEmpSearchOpen(true)}
                      />
                      {selectedEmp && (
                        <button onClick={handleClearEmp} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      )}
                    </div>
                    {empSearchOpen && empResults.length > 0 && !selectedEmp && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {empResults.map(emp => (
                          <button
                            key={emp.id}
                            onClick={() => handleSelectEmp(emp)}
                            className="w-full text-left px-3 py-2.5 hover:bg-[#f2faf6] transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{emp.id}</span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">{emp.department} · {emp.rank} · {emp.employType}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {empSearchOpen && empSearch.length > 0 && empResults.length === 0 && !selectedEmp && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 px-3 py-3 text-xs text-gray-400 text-center">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">부서</label>
                    <input className={`${inputClass} bg-gray-100`} value={selectedEmp?.department || ''} readOnly placeholder="사원 선택 시 자동입력" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">직급</label>
                    <input className={`${inputClass} bg-gray-100`} value={selectedEmp?.rank || ''} readOnly placeholder="사원 선택 시 자동입력" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">직책</label>
                    <input className={`${inputClass} bg-gray-100`} value={selectedEmp?.position || ''} readOnly placeholder="사원 선택 시 자동입력" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">직무</label>
                    <input className={`${inputClass} bg-gray-100`} value="" readOnly placeholder="사원 선택 시 자동입력" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">근로형태</label>
                    <input className={`${inputClass} bg-gray-100`} value={selectedEmp?.employType || ''} readOnly placeholder="사원 선택 시 자동입력" />
                  </div>
                </div>
              </div>
            </div>

            {/* 제2조 계약기간 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-bold text-gray-800">계약기간</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">계약 연도 <span className="text-red-400">*</span></label>
                    <select className={inputClass}>
                      <option>2026</option>
                      <option>2025</option>
                      <option>2024</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">계약 시작일 <span className="text-red-400">*</span></label>
                    <input type="date" className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">계약 종료일</label>
                    <input type="date" className={inputClass} />
                    <span className="text-[10px] text-gray-400">정규직은 미입력 (무기한)</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">수습 기간</label>
                    <select className={inputClass}>
                      <option value="">없음</option>
                      <option>1개월</option>
                      <option>2개월</option>
                      <option>3개월</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">주당 근로시간 <span className="text-red-400">*</span></label>
                    <select className={inputClass}>
                      <option>40시간 (주 5일)</option>
                      <option>35시간</option>
                      <option>30시간</option>
                      <option>20시간 (시간제)</option>
                      <option>15시간 (단시간)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">계약서 유형 <span className="text-red-400">*</span></label>
                    <select className={inputClass}>
                      <option>연봉계약서</option>
                      <option>근로계약서</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 제3조 급여 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-bold text-gray-800">급여</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">급여 모듈 연동</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">계약 연봉 (원) <span className="text-red-400">*</span></label>
                    <input className={inputClass} placeholder="예) 48,000,000" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">월 기본급 (원) <span className="text-red-400">*</span></label>
                    <input className={inputClass} placeholder="예) 3,500,000" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">월 기본급 외 (원)</label>
                    <input className={inputClass} placeholder="예) 500,000" />
                    <span className="text-[10px] text-gray-400">고정 O/T, 수당 등 포함</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-4">※ 상세 급여 구성은 첨부된 계약서 PDF를 참고하세요.</p>
              </div>
            </div>

            {/* 제4조 기타 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-bold text-gray-800">기타사항</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex flex-col gap-1 mb-4">
                  <label className="text-xs font-medium text-gray-500">특약사항 / 메모</label>
                  <textarea className={`${inputClass} h-20 resize-none`} placeholder="계약 관련 특이사항을 입력하세요 (선택)" />
                </div>

                {/* 파일 첨부 */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">서명 완료 계약서 첨부</label>
                  <div className="border-2 border-dashed border-[#c8e0d4] rounded-xl p-5 text-center cursor-pointer hover:border-[#1D9E75] hover:bg-[#f2faf6] transition-all bg-white">
                    <i className="fas fa-cloud-upload-alt text-2xl text-[#a8d4bc] mb-2"></i>
                    <div className="text-sm text-gray-400">파일을 여기에 드래그하거나 클릭하여 업로드</div>
                    <div className="text-[10px] text-gray-400 mt-1">PDF, HWP, DOCX (최대 10MB)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowRegister(false)} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
              <button className="bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
                <i className="fas fa-file-signature mr-1.5"></i>계약서 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="이름 또는 사번 검색" />
          </div>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
            <option value="">전체 연도</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">총 {filtered.length}건</span>
          {checkedIds.length > 0 && (
            <button className="flex items-center gap-1.5 border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors">
              <i className="fas fa-trash-alt text-xs"></i>
              선택 삭제 ({checkedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <input type="checkbox"
                  checked={filtered.length > 0 && checkedIds.length === filtered.length}
                  onChange={e => setCheckedIds(e.target.checked ? filtered.map(c => c.id) : [])}
                  className="accent-[#1D9E75]" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직책</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">근로형태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">계약일자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">유형</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <input type="checkbox"
                    checked={checkedIds.includes(c.id)}
                    onChange={e => setCheckedIds(e.target.checked ? [...checkedIds, c.id] : checkedIds.filter(id => id !== c.id))}
                    className="accent-[#1D9E75]" />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.empId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.department}</td>
                <td className="px-4 py-3 text-gray-600">{c.rank}</td>
                <td className="px-4 py-3 text-gray-600">{c.position}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.employmentType === '정규직' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-orange-50 text-orange-600'
                  }`}>{c.employmentType}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.contractStart}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.contractType === '연봉계약서' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                  }`}>{c.contractType}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => setSelectedContract(c)} className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========== 상세 모달 ========== */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[700px] mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* 헤더 */}
            <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{selectedContract.name}</h3>
                  <span className="text-[11px] font-mono text-gray-400">{selectedContract.empId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    selectedContract.contractType === '연봉계약서' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                  }`}>{selectedContract.contractType}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    selectedContract.employmentType === '정규직' ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-orange-50 text-orange-600'
                  }`}>{selectedContract.employmentType}</span>
                  <span className="text-[11px] text-gray-400">등록일 {selectedContract.registeredDate}</span>
                </div>
              </div>
              <button onClick={() => setSelectedContract(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            <div className="px-7 py-6 space-y-6">
              {/* 인적사항 + 계약기간 통합 */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-3">계약 정보</h4>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 w-28 text-xs">부서</td>
                        <td className="px-4 py-2.5 text-gray-800">{selectedContract.department}</td>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 w-28 text-xs">직급</td>
                        <td className="px-4 py-2.5 text-gray-800">{selectedContract.rank}</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">직책</td>
                        <td className="px-4 py-2.5 text-gray-800">{selectedContract.position}</td>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">직무</td>
                        <td className="px-4 py-2.5 text-gray-800">{selectedContract.jobTitle}</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">계약기간</td>
                        <td className="px-4 py-2.5 text-gray-800">{selectedContract.contractStart} ~ {selectedContract.contractEnd || '무기한'}</td>
                        <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">근로시간</td>
                        <td className="px-4 py-2.5 text-gray-800">{selectedContract.weeklyHours}</td>
                      </tr>
                      {selectedContract.probation && (
                        <tr className="border-b border-gray-50">
                          <td className="px-4 py-2.5 text-gray-400 bg-gray-50/80 text-xs">수습기간</td>
                          <td colSpan={3} className="px-4 py-2.5 text-gray-800">{selectedContract.probation}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 연봉 구성 */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-3">연봉 구성</h4>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-3 text-gray-400 bg-gray-50/80 w-32 text-xs">계약 연봉</td>
                        <td className="px-4 py-3 text-gray-900 font-bold text-[#1D9E75]">{fmt(selectedContract.annualSalary)}원</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-3 text-gray-400 bg-gray-50/80 text-xs">월 기본급</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{fmt(selectedContract.baseSalary)}원</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-gray-400 bg-gray-50/80 text-xs">월 기본급 외</td>
                        <td className="px-4 py-3 text-gray-800">{fmt(selectedContract.extraSalary)}원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">※ 상세 급여 구성은 첨부된 계약서 PDF를 참고하세요.</p>
              </div>

              {/* 기타사항 */}
              {selectedContract.memo && (
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-3">기타사항</h4>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
                    {selectedContract.memo}
                  </div>
                </div>
              )}

              {/* 첨부 파일 */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-3">첨부 파일</h4>
                <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f8fcfa] rounded-xl border border-[#d0ede2]">
                  <i className="fas fa-file-pdf text-red-400"></i>
                  <span className="flex-1 text-sm text-gray-700">{selectedContract.fileName}</span>
                  <button className="text-xs text-[#1D9E75] hover:underline font-medium">
                    <i className="fas fa-download mr-1"></i>다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100">
              <button className="text-sm px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">삭제</button>
              <button onClick={() => setSelectedContract(null)}
                className="text-sm px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
