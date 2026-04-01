import { useNavigate, useParams } from 'react-router-dom'

const mockEmployeeDetails: Record<string, any> = {
  PC2024001: { id: 'PC2024001', name: '김민수', englishName: 'Kim Minsu', department: '개발팀', position: '팀원', rank: '대리', employType: '정규직', hireDate: '2022-03-02', email: 'minsu.kim@peoplecore.com', status: '재직', phone: '010-1234-5678', personalEmail: 'minsu@gmail.com', address: '서울시 강남구 테헤란로 123', birthDate: '1995-03-15', gender: '남성', workplace: '본사 (서울)', supervisor: '윤재혁 부장', permissionTemplate: '일반 사원', infoScope: '본인 정보만', mailQuota: '5 GB' },
  PC2024002: { id: 'PC2024002', name: '이서연', englishName: 'Lee Seoyeon', department: '인사팀', position: '팀장', rank: '과장', employType: '정규직', hireDate: '2020-07-15', email: 'seoyeon.lee@peoplecore.com', status: '재직', phone: '010-2345-6789', personalEmail: 'seoyeon@gmail.com', address: '서울시 서초구 반포대로 45', birthDate: '1990-08-22', gender: '여성', workplace: '본사 (서울)', supervisor: '정하은 차장', permissionTemplate: '팀장', infoScope: '팀 내 열람 가능', mailQuota: '10 GB' },
  PC2024003: { id: 'PC2024003', name: '박지훈', englishName: 'Park Jihun', department: '마케팅팀', position: '팀원', rank: '사원', employType: '계약직', hireDate: '2023-09-01', email: 'jihun.park@peoplecore.com', status: '재직', phone: '010-3456-7890', personalEmail: 'jihun@gmail.com', address: '서울시 마포구 월드컵북로 56', birthDate: '1998-12-01', gender: '남성', workplace: '본사 (서울)', supervisor: '최유진 주임', permissionTemplate: '일반 사원', infoScope: '본인 정보만', mailQuota: '5 GB' },
  PC2024004: { id: 'PC2024004', name: '최유진', englishName: 'Choi Yujin', department: '영업팀', position: '팀원', rank: '주임', employType: '정규직', hireDate: '2021-11-10', email: 'yujin.choi@peoplecore.com', status: '재직', phone: '010-4567-8901', personalEmail: 'yujin@gmail.com', address: '서울시 송파구 올림픽로 300', birthDate: '1996-06-18', gender: '여성', workplace: '본사 (서울)', supervisor: '정하은 차장', permissionTemplate: '일반 사원', infoScope: '본인 정보만', mailQuota: '5 GB' },
  PC2024005: { id: 'PC2024005', name: '정하은', englishName: 'Jung Haeun', department: '재무팀', position: '파트장', rank: '차장', employType: '정규직', hireDate: '2018-04-20', email: 'haeun.jung@peoplecore.com', status: '재직', phone: '010-5678-9012', personalEmail: 'haeun@gmail.com', address: '서울시 영등포구 여의대로 108', birthDate: '1988-01-30', gender: '여성', workplace: '본사 (서울)', supervisor: '윤재혁 부장', permissionTemplate: '팀장', infoScope: '부서 전체 열람 가능', mailQuota: '10 GB' },
  PC2024006: { id: 'PC2024006', name: '한승우', englishName: 'Han Seungwoo', department: '개발팀', position: '팀원', rank: '사원', employType: '인턴', hireDate: '2024-01-08', email: 'seungwoo.han@peoplecore.com', status: '재직', phone: '010-6789-0123', personalEmail: 'seungwoo@gmail.com', address: '경기도 성남시 분당구 판교로 256', birthDate: '2000-09-05', gender: '남성', workplace: '판교 R&D센터', supervisor: '윤재혁 부장', permissionTemplate: '일반 사원', infoScope: '본인 정보만', mailQuota: '5 GB' },
  PC2024007: { id: 'PC2024007', name: '오나영', englishName: 'Oh Nayoung', department: '경영지원팀', position: '팀원', rank: '대리', employType: '정규직', hireDate: '2021-05-03', email: 'nayoung.oh@peoplecore.com', status: '휴직', phone: '010-7890-1234', personalEmail: 'nayoung@gmail.com', address: '서울시 강동구 천호대로 1077', birthDate: '1993-11-12', gender: '여성', workplace: '본사 (서울)', supervisor: '정하은 차장', permissionTemplate: '일반 사원', infoScope: '본인 정보만', mailQuota: '5 GB' },
  PC2024008: { id: 'PC2024008', name: '윤재혁', englishName: 'Yoon Jaehyuk', department: '개발팀', position: '팀장', rank: '부장', employType: '정규직', hireDate: '2015-02-16', email: 'jaehyuk.yoon@peoplecore.com', status: '재직', phone: '010-8901-2345', personalEmail: 'jaehyuk@gmail.com', address: '서울시 용산구 한남대로 98', birthDate: '1985-04-25', gender: '남성', workplace: '본사 (서울)', supervisor: '-', permissionTemplate: '팀장', infoScope: '팀 내 열람 가능', mailQuota: '10 GB' },
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

export default function EmployeeDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const emp = mockEmployeeDetails[id || ''] || mockEmployeeDetails['PC2024001']

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 사원 관리 › <span className="text-[#1D9E75] font-medium">사원 상세</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">사원 상세 정보</h1>
          <p className="text-xs text-gray-400 mt-1">{emp.name} ({emp.id})님의 인사 정보입니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/hr/employee/${emp.id}/edit`)}
            className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
          >
            <i className="fas fa-edit text-xs"></i>
            정보 수정
          </button>
          <button
            onClick={() => navigate('/hr/list')}
            className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
          >
            목록으로
          </button>
        </div>
      </div>

      {/* 기본 인적사항 */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">기본 인적사항</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="성명" value={emp.name} />
          <InfoRow label="영문명" value={emp.englishName} />
          <InfoRow label="생년월일" value={emp.birthDate} />
          <InfoRow label="성별" value={emp.gender} />
          <InfoRow label="연락처" value={emp.phone} />
          <InfoRow label="개인 이메일" value={emp.personalEmail} />
          <div className="col-span-2">
            <InfoRow label="주소" value={emp.address} />
          </div>
        </div>
      </div>

      {/* 소속 및 고용 정보 */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">소속 및 고용 정보</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="입사일" value={emp.hireDate} />
          <InfoRow label="고용 형태" value={emp.employType} />
          <InfoRow label="부서" value={emp.department} />
          <InfoRow label="직급" value={emp.rank} />
          <InfoRow label="직책" value={emp.position} />
          <InfoRow label="보고 대상 (상위자)" value={emp.supervisor} />
          <InfoRow label="근무지" value={emp.workplace} />
          <InfoRow label="상태" value={emp.status} />
        </div>
      </div>

      {/* 시스템 계정 정보 */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">시스템 계정 정보</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="사번" value={emp.id} />
          <InfoRow label="사내 이메일" value={emp.email} />
          <InfoRow label="메일함 용량" value={emp.mailQuota} />
        </div>
      </div>

      {/* 권한 정보 */}
      <div className="card p-5 mb-3.5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">권한 정보</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoRow label="권한 템플릿" value={emp.permissionTemplate} />
          <InfoRow label="정보 열람 범위" value={emp.infoScope} />
        </div>
      </div>

      <div className="h-5"></div>
    </div>
  )
}
