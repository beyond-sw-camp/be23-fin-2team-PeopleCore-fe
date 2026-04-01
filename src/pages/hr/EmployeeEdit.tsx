import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const mockEmployeeDetails: Record<string, any> = {
  PC2024001: { id: 'PC2024001', name: '김민수', englishName: 'Kim Minsu', department: '개발팀', position: '팀원', rank: '대리', employType: 'regular', hireDate: '2022-03-02', email: 'minsu.kim', status: '재직', phone: '010-1234-5678', personalEmail: 'minsu@gmail.com', address: '서울시 강남구 테헤란로 123', birthDate: '1995-03-15', gender: 'male', workplace: '본사 (서울)', supervisor: '윤재혁 부장', permissionTemplate: '일반 사원 (기본)', infoScope: '본인 정보만', mailQuota: '5 GB (기본)' },
  PC2024002: { id: 'PC2024002', name: '이서연', englishName: 'Lee Seoyeon', department: '인사팀', position: '팀장', rank: '과장', employType: 'regular', hireDate: '2020-07-15', email: 'seoyeon.lee', status: '재직', phone: '010-2345-6789', personalEmail: 'seoyeon@gmail.com', address: '서울시 서초구 반포대로 45', birthDate: '1990-08-22', gender: 'female', workplace: '본사 (서울)', supervisor: '정하은 차장', permissionTemplate: '팀장', infoScope: '팀 내 열람 가능', mailQuota: '10 GB' },
  PC2024003: { id: 'PC2024003', name: '박지훈', englishName: 'Park Jihun', department: '마케팅팀', position: '팀원', rank: '사원', employType: 'contract', hireDate: '2023-09-01', email: 'jihun.park', status: '재직', phone: '010-3456-7890', personalEmail: 'jihun@gmail.com', address: '서울시 마포구 월드컵북로 56', birthDate: '1998-12-01', gender: 'male', workplace: '본사 (서울)', supervisor: '최유진 주임', permissionTemplate: '일반 사원 (기본)', infoScope: '본인 정보만', mailQuota: '5 GB (기본)' },
  PC2024004: { id: 'PC2024004', name: '최유진', englishName: 'Choi Yujin', department: '영업팀', position: '팀원', rank: '주임', employType: 'regular', hireDate: '2021-11-10', email: 'yujin.choi', status: '재직', phone: '010-4567-8901', personalEmail: 'yujin@gmail.com', address: '서울시 송파구 올림픽로 300', birthDate: '1996-06-18', gender: 'female', workplace: '본사 (서울)', supervisor: '정하은 차장', permissionTemplate: '일반 사원 (기본)', infoScope: '본인 정보만', mailQuota: '5 GB (기본)' },
  PC2024005: { id: 'PC2024005', name: '정하은', englishName: 'Jung Haeun', department: '재무팀', position: '파트장', rank: '차장', employType: 'regular', hireDate: '2018-04-20', email: 'haeun.jung', status: '재직', phone: '010-5678-9012', personalEmail: 'haeun@gmail.com', address: '서울시 영등포구 여의대로 108', birthDate: '1988-01-30', gender: 'female', workplace: '본사 (서울)', supervisor: '윤재혁 부장', permissionTemplate: '팀장', infoScope: '부서 전체 열람 가능', mailQuota: '10 GB' },
  PC2024006: { id: 'PC2024006', name: '한승우', englishName: 'Han Seungwoo', department: '개발팀', position: '팀원', rank: '사원', employType: 'intern', hireDate: '2024-01-08', email: 'seungwoo.han', status: '재직', phone: '010-6789-0123', personalEmail: 'seungwoo@gmail.com', address: '경기도 성남시 분당구 판교로 256', birthDate: '2000-09-05', gender: 'male', workplace: '판교 R&D센터', supervisor: '윤재혁 부장', permissionTemplate: '일반 사원 (기본)', infoScope: '본인 정보만', mailQuota: '5 GB (기본)' },
  PC2024007: { id: 'PC2024007', name: '오나영', englishName: 'Oh Nayoung', department: '경영지원팀', position: '팀원', rank: '대리', employType: 'regular', hireDate: '2021-05-03', email: 'nayoung.oh', status: '휴직', phone: '010-7890-1234', personalEmail: 'nayoung@gmail.com', address: '서울시 강동구 천호대로 1077', birthDate: '1993-11-12', gender: 'female', workplace: '본사 (서울)', supervisor: '정하은 차장', permissionTemplate: '일반 사원 (기본)', infoScope: '본인 정보만', mailQuota: '5 GB (기본)' },
  PC2024008: { id: 'PC2024008', name: '윤재혁', englishName: 'Yoon Jaehyuk', department: '개발팀', position: '팀장', rank: '부장', employType: 'regular', hireDate: '2015-02-16', email: 'jaehyuk.yoon', status: '재직', phone: '010-8901-2345', personalEmail: 'jaehyuk@gmail.com', address: '서울시 용산구 한남대로 98', birthDate: '1985-04-25', gender: 'male', workplace: '본사 (서울)', supervisor: '', permissionTemplate: '팀장', infoScope: '팀 내 열람 가능', mailQuota: '10 GB' },
}

const selectClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23b0b8b4%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8"
const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors"

export default function EmployeeEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const initial = mockEmployeeDetails[id || ''] || mockEmployeeDetails['PC2024001']

  const [form, setForm] = useState({ ...initial })
  const set = (key: string, val: string) => setForm((p: any) => ({ ...p, [key]: val }))

  const showContractEnd = form.employType === 'contract' || form.employType === 'dispatch' || form.employType === 'intern'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-1">
          인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">사원 정보 수정</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">사원 정보 수정</h1>
            <p className="text-xs text-gray-400 mt-1">{initial.name} ({initial.id})님의 정보를 수정합니다.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
              취소
            </button>
            <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-check text-xs"></i>
              저장
            </button>
          </div>
        </div>

        {/* 기본 인적사항 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">기본 인적사항</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">성명 <span className="text-red-400">*</span></label>
              <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">영문명</label>
              <input className={inputClass} value={form.englishName} onChange={e => set('englishName', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">생년월일 <span className="text-red-400">*</span></label>
              <input type="date" className={inputClass} value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">성별 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => set('gender', g)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all ${
                      form.gender === g ? 'border-[#1D9E75] bg-[#eaf6f0] text-[#1D9E75] font-medium' : 'border-gray-200 text-gray-500'
                    }`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${form.gender === g ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                      {form.gender === g && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                    {g === 'male' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">연락처 <span className="text-red-400">*</span></label>
              <input className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">개인 이메일 <span className="text-red-400">*</span></label>
              <input type="email" className={inputClass} value={form.personalEmail} onChange={e => set('personalEmail', e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">주소</label>
              <input className={inputClass} value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* 소속 및 고용 정보 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">소속 및 고용 정보</span>
            <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">입사일 <span className="text-red-400">*</span></label>
              <input type="date" className={inputClass} value={form.hireDate} onChange={e => set('hireDate', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">고용 형태 <span className="text-red-400">*</span></label>
              <select value={form.employType} onChange={e => set('employType', e.target.value)} className={selectClass}>
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
                <input type="date" className={inputClass} />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">부서 <span className="text-red-400">*</span></label>
              <select value={form.department} onChange={e => set('department', e.target.value)} className={selectClass}>
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
              <select value={form.rank} onChange={e => set('rank', e.target.value)} className={selectClass}>
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
              <select value={form.position} onChange={e => set('position', e.target.value)} className={selectClass}>
                <option>팀원</option>
                <option>팀장</option>
                <option>파트장</option>
                <option>실장</option>
                <option>본부장</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">보고 대상 (상위자)</label>
              <input className={inputClass} value={form.supervisor} onChange={e => set('supervisor', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">근무지</label>
              <select value={form.workplace} onChange={e => set('workplace', e.target.value)} className={selectClass}>
                <option>본사 (서울)</option>
                <option>판교 R&D센터</option>
                <option>부산 지사</option>
                <option>재택 근무</option>
              </select>
            </div>
          </div>
        </div>

        {/* 시스템 계정 정보 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">시스템 계정 설정</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">사번</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed" value={form.id} disabled />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">사내 이메일</label>
              <div className="flex">
                <input value={form.email} onChange={e => set('email', e.target.value)} className="border border-gray-200 rounded-l-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors flex-1 border-r-0" />
                <span className="px-3 py-2 bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg text-sm text-gray-400 whitespace-nowrap">@peoplecore.com</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">메일함 용량</label>
              <select value={form.mailQuota} onChange={e => set('mailQuota', e.target.value)} className={selectClass}>
                <option>5 GB (기본)</option>
                <option>10 GB</option>
                <option>20 GB</option>
                <option>50 GB</option>
              </select>
            </div>
          </div>
        </div>

        {/* 권한 설정 */}
        <div className="card p-5 mb-3.5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">메뉴 / 기능 권한 설정</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">권한 템플릿</label>
              <select value={form.permissionTemplate} onChange={e => set('permissionTemplate', e.target.value)} className={selectClass}>
                <option>일반 사원 (기본)</option>
                <option>팀장</option>
                <option>HR 담당자</option>
                <option>재무 담당자</option>
                <option>시스템 관리자</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">정보 열람 범위</label>
              <select value={form.infoScope} onChange={e => set('infoScope', e.target.value)} className={selectClass}>
                <option>본인 정보만</option>
                <option>팀 내 열람 가능</option>
                <option>부서 전체 열람 가능</option>
                <option>전사 열람 가능</option>
              </select>
            </div>
          </div>
        </div>

        <div className="h-5"></div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-400">* 표시된 항목은 필수 입력값입니다.</span>
        <div className="flex gap-2">
          <button className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">임시 저장</button>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-check text-xs"></i>
            수정 완료
          </button>
        </div>
      </div>
    </div>
  )
}
