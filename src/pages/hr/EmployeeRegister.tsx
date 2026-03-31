import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function EmployeeRegister() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [gender, setGender] = useState('male')
  const [pwMethod, setPwMethod] = useState('auto')
  const [employType, setEmployType] = useState('')
  const [empId, setEmpId] = useState('')
  const [emailId, setEmailId] = useState('')
  const [checklist, setChecklist] = useState([
    { label: '시스템 계정 발급 완료', checked: false },
    { label: '노트북 · 장비 배정', checked: false },
    { label: '근로계약서 서명 완료', checked: false },
    { label: '개인정보 동의서 제출', checked: false },
    { label: '사내 보안 교육 이수', checked: false },
    { label: '급여 계좌 등록', checked: false },
  ])
  const [files, setFiles] = useState<{ name: string; size: number }[]>([])

  const steps = [
    { num: 1, label: '기본 정보 입력', desc: '인적사항 · 소속' },
    { num: 2, label: '계정 · 권한 설정', desc: '로그인 계정 발급' },
    { num: 3, label: '서류 · 온보딩', desc: '계약서 · 체크리스트' },
    { num: 4, label: '최종 확인', desc: '계정 발급 · 메일 발송' },
  ]

  let empCounter = 2024001
  const genEmpId = () => {
    const id = 'PC' + empCounter++
    setEmpId(id)
  }

  const toggleCheckItem = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size }))
      setFiles(prev => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const showContractEnd = employType === 'contract' || employType === 'dispatch' || employType === 'intern'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-1">
          인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">신규 사원 등록</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">신규 사원 등록</h1>
            <p className="text-xs text-gray-400 mt-1">입사 확정 후 기본 인적사항과 계정을 등록합니다. (emp-1, emp-4)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/hr/employee')} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
              취소
            </button>
            <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-check text-xs"></i>
              등록 완료
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="card p-4 mb-5 flex items-center">
          {steps.map((step, i) => (
            <div key={step.num} className="contents">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step.num < currentStep ? 'bg-[#1D9E75] text-white' :
                  step.num === currentStep ? 'bg-[#1D9E75] text-white shadow-[0_0_0_4px_#d0ede2]' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.num < currentStep ? <i className="fas fa-check text-[10px]"></i> : step.num}
                </div>
                <div>
                  <div className={`text-xs font-semibold ${step.num <= currentStep ? 'text-[#1D9E75]' : 'text-gray-400'}`}>{step.label}</div>
                  <div className="text-[11px] text-gray-400">{step.desc}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${step.num < currentStep ? 'bg-[#1D9E75]' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* ① 기본 인적사항 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">기본 인적사항</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">성명 <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="예) 홍길동" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">영문명</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="예) Hong Gildong" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">생년월일 <span className="text-red-400">*</span></label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">성별 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all ${
                      gender === g ? 'border-[#1D9E75] bg-[#eaf6f0] text-[#1D9E75] font-medium' : 'border-gray-200 text-gray-500'
                    }`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${gender === g ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                      {gender === g && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                    {g === 'male' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">연락처 <span className="text-red-400">*</span></label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="010-0000-0000" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">개인 이메일 <span className="text-red-400">*</span></label>
              <input type="email" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="example@email.com" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">주소</label>
              <div className="flex gap-2 mb-1.5">
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors w-36" placeholder="우편번호" />
                <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">주소 검색</button>
              </div>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors mb-1.5" placeholder="기본 주소" />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="상세 주소" />
            </div>
          </div>
        </div>

        {/* ② 소속 및 고용 정보 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">소속 및 고용 정보</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">입사일 <span className="text-red-400">*</span></label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
              <span className="text-[11px] text-gray-400">입사일 기준으로 연차가 자동 생성됩니다</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">고용 형태 <span className="text-red-400">*</span></label>
              <select value={employType} onChange={e => setEmployType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option value="">선택</option>
                <option value="regular">정규직</option>
                <option value="contract">계약직</option>
                <option value="dispatch">파견직</option>
                <option value="intern">인턴</option>
                <option value="parttime">시간제</option>
              </select>
            </div>
            {showContractEnd && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">계약 만료일 <span className="text-red-400">*</span></label>
                <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" />
                <span className="text-[11px] text-gray-400">계약 만료 30일 전 자동 알림이 발송됩니다</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">부서 <span className="text-red-400">*</span></label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option value="">부서 선택</option>
                <option>개발팀</option>
                <option>인사팀</option>
                <option>마케팅팀</option>
                <option>영업팀</option>
                <option>재무팀</option>
                <option>경영지원팀</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">직급 <span className="text-red-400">*</span></label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option value="">직급 선택</option>
                <option>사원</option>
                <option>주임</option>
                <option>대리</option>
                <option>과장</option>
                <option>차장</option>
                <option>부장</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">직책</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option value="">직책 선택 (선택)</option>
                <option>팀원</option>
                <option>팀장</option>
                <option>파트장</option>
                <option>실장</option>
                <option>본부장</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">보고 대상 (상위자)</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors" placeholder="이름 또는 사번 검색" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">근무지</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option>본사 (서울)</option>
                <option>판교 R&D센터</option>
                <option>부산 지사</option>
                <option>재택 근무</option>
              </select>
            </div>
          </div>
        </div>

        {/* ③ 시스템 계정 설정 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">시스템 계정 설정</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수 · emp-1</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">사번 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 flex-1 cursor-not-allowed" placeholder="자동 생성" value={empId} disabled />
                <button onClick={genEmpId} className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all whitespace-nowrap">자동 생성</button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">사내 이메일 <span className="text-red-400">*</span></label>
              <div className="flex">
                <input value={emailId} onChange={e => setEmailId(e.target.value)} className="border border-gray-200 rounded-l-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors flex-1 border-r-0" placeholder="아이디" />
                <span className="px-3 py-2 bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg text-sm text-gray-400 whitespace-nowrap">@peoplecore.com</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">초기 비밀번호 발급 방식 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {[{ key: 'auto', label: '자동 생성 후 메일 발송' }, { key: 'manual', label: '직접 설정' }].map(opt => (
                  <button key={opt.key} onClick={() => setPwMethod(opt.key)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all ${
                      pwMethod === opt.key ? 'border-[#1D9E75] bg-[#eaf6f0] text-[#1D9E75] font-medium' : 'border-gray-200 text-gray-500'
                    }`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${pwMethod === opt.key ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                      {pwMethod === opt.key && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">메일함 용량</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option>5 GB (기본)</option>
                <option>10 GB</option>
                <option>20 GB</option>
                <option>50 GB</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">계정 미리보기</label>
              <div className="bg-[#f2faf6] rounded-xl p-3.5 border border-[#d0ede2]">
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-[#5a8a70] font-medium">사번</span>
                  <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#c8e0d4]">{empId || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-[#5a8a70] font-medium">사내 이메일</span>
                  <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#c8e0d4]">{emailId ? `${emailId}@peoplecore.com` : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-[#5a8a70] font-medium">초기 비밀번호</span>
                  <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#c8e0d4]">자동 생성 (메일 발송)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ④ 권한 설정 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">메뉴 / 기능 권한 설정</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수 · emp-2, emp-12</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">권한 템플릿 <span className="text-red-400">*</span></label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option value="">템플릿 선택</option>
                <option>일반 사원 (기본)</option>
                <option>팀장</option>
                <option>HR 담당자</option>
                <option>재무 담당자</option>
                <option>시스템 관리자</option>
              </select>
              <span className="text-[11px] text-gray-400">선택한 템플릿 기준으로 접근 권한이 자동 설정됩니다</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">정보 열람 범위</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8">
                <option>본인 정보만</option>
                <option>팀 내 열람 가능</option>
                <option>부서 전체 열람 가능</option>
                <option>전사 열람 가능</option>
              </select>
            </div>
          </div>
        </div>

        {/* ⑤ 인사 서류 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">인사 서류 등록</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">선택 · emp-9</span>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">서류 첨부</label>
            <div className="mt-1.5 border-2 border-dashed border-[#c8e0d4] rounded-xl p-5 text-center cursor-pointer hover:border-[#1D9E75] hover:bg-[#f2faf6] transition-all bg-gray-50"
              onClick={() => document.getElementById('file-input')?.click()}>
              <i className="fas fa-cloud-upload-alt text-2xl text-[#a8d4bc] mb-2"></i>
              <div className="text-sm text-gray-400">파일을 여기에 드래그하거나 클릭하여 업로드</div>
              <div className="text-[11px] text-gray-400 mt-1">근로계약서 · 서약서 · 개인정보 동의서 / PDF, HWP, DOCX (최대 10MB)</div>
            </div>
            <input type="file" id="file-input" multiple className="hidden" onChange={handleFileChange} />
            {files.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#f2faf6] rounded-lg border border-[#d0ede2]">
                    <i className="fas fa-file-alt text-[#1D9E75] text-xs"></i>
                    <span className="flex-1 text-xs text-[#1D9E75]">{f.name}</span>
                    <span className="text-[11px] text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-400 transition-colors">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ⑥ 온보딩 체크리스트 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">입사 온보딩 체크리스트</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">선택 · emp-6</span>
          </div>
          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={idx} onClick={() => toggleCheckItem(idx)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  item.checked ? 'bg-[#f2faf6] border-[#c8e8d8]' : 'border-gray-100 hover:bg-gray-50'
                }`}>
                <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 transition-all ${
                  item.checked ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'
                }`}>
                  {item.checked && <i className="fas fa-check text-white text-[9px]"></i>}
                </div>
                <span className={`flex-1 text-sm ${item.checked ? 'text-[#1D9E75]' : 'text-gray-700'}`}>{item.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                  item.checked ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-gray-50 text-gray-400'
                }`}>
                  {item.checked ? '완료' : '대기'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-5"></div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-400">* 표시된 항목은 필수 입력값입니다. 등록 완료 시 사내 이메일로 계정 정보가 발송됩니다.</span>
        <div className="flex gap-2">
          <button className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">임시 저장</button>
          <button onClick={() => setCurrentStep(Math.min(4, currentStep + 1))} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">다음 단계 →</button>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-check text-xs"></i>
            등록 완료 및 계정 발급
          </button>
        </div>
      </div>
    </div>
  )
}
