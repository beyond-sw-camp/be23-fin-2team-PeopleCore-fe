import { useParams, useNavigate } from 'react-router-dom'

const mockRetirements = [
  {
    id: 1, empId: 'PC2024009', name: '장현우', department: '영업팀', rank: '과장',
    hireDate: '2019-03-04', resignDate: '2024-06-30', reason: '개인 사유', status: '대기' as const,
    salary: 4800000, yearsOfService: '5년 3개월',
    totalLeave: 15, usedLeave: 8, remainLeave: 7,
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: false, date: '' },
      { label: '시스템 계정 회수', done: false, date: '' },
      { label: '업무 인수인계서 제출', done: false, date: '' },
      { label: '잔여 연차 정산', done: false, date: '' },
      { label: '퇴직금 정산', done: false, date: '' },
    ],
    history: [
      { action: '퇴직 신청 접수', date: '2024-05-15', by: '장현우 (본인)' },
    ],
  },
  {
    id: 2, empId: 'PC2024010', name: '송미래', department: '마케팅팀', rank: '대리',
    hireDate: '2021-07-12', resignDate: '2024-05-31', reason: '이직', status: '처리중' as const,
    salary: 3600000, yearsOfService: '2년 10개월',
    totalLeave: 15, usedLeave: 12, remainLeave: 3,
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: true, date: '2024-05-20' },
      { label: '시스템 계정 회수', done: false, date: '' },
      { label: '업무 인수인계서 제출', done: true, date: '2024-05-22' },
      { label: '잔여 연차 정산', done: false, date: '' },
      { label: '퇴직금 정산', done: false, date: '' },
    ],
    history: [
      { action: '업무 인수인계서 제출', date: '2024-05-22', by: 'HR팀' },
      { action: '장비 반납 완료', date: '2024-05-20', by: 'IT팀' },
      { action: '퇴직 처리 시작', date: '2024-05-18', by: 'HR팀 이서연' },
      { action: '퇴직 신청 접수', date: '2024-05-10', by: '송미래 (본인)' },
    ],
  },
  {
    id: 3, empId: 'PC2024011', name: '강태영', department: '개발팀', rank: '사원',
    hireDate: '2023-01-09', resignDate: '2024-04-30', reason: '계약 만료', status: '처리완료' as const,
    salary: 3000000, yearsOfService: '1년 3개월',
    totalLeave: 11, usedLeave: 11, remainLeave: 0,
    checklist: [
      { label: '장비 반납 (노트북·사원증)', done: true, date: '2024-04-25' },
      { label: '시스템 계정 회수', done: true, date: '2024-04-28' },
      { label: '업무 인수인계서 제출', done: true, date: '2024-04-22' },
      { label: '잔여 연차 정산', done: true, date: '2024-04-29' },
      { label: '퇴직금 정산', done: true, date: '2024-04-30' },
    ],
    history: [
      { action: '퇴직 처리 완료', date: '2024-04-30', by: 'HR팀 이서연' },
      { action: '퇴직금 정산 완료', date: '2024-04-30', by: '재무팀' },
      { action: '잔여 연차 정산', date: '2024-04-29', by: 'HR팀' },
      { action: '시스템 계정 비활성화', date: '2024-04-28', by: 'IT팀' },
      { action: '장비 반납 완료', date: '2024-04-25', by: 'IT팀' },
      { action: '업무 인수인계서 제출', date: '2024-04-22', by: 'HR팀' },
      { action: '퇴직 처리 시작', date: '2024-04-20', by: 'HR팀 이서연' },
      { action: '퇴직 신청 접수', date: '2024-04-15', by: '강태영 (본인)' },
    ],
  },
]

const fmt = (n: number) => n.toLocaleString()

export default function RetirementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = mockRetirements.find(r => String(r.id) === id) || mockRetirements[0]

  const avgSalary = data.salary
  const severancePay = Math.round(avgSalary / 30 * 365 * (parseInt(data.yearsOfService) + (data.yearsOfService.includes('개월') ? parseInt(data.yearsOfService.split('년 ')[1]) / 12 : 0)))
  const leavePay = Math.round((data.salary / 30) * data.remainLeave)
  const totalSettlement = data.salary + leavePay + severancePay

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 퇴직 관리 › <span className="text-[#1D9E75] font-medium">퇴직 상세</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.name} 퇴직 상세</h1>
          <p className="text-xs text-gray-400 mt-1">{data.empId} · {data.department} · {data.rank}</p>
        </div>
        <div className="flex gap-2">
          {data.status !== '처리완료' && (
            <button
              onClick={() => navigate(`/hr/retirement/${data.id}/edit`)}
              className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors"
            >
              퇴직 정보 수정
            </button>
          )}
          <button onClick={() => navigate('/hr/retirement')}
            className="border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
            목록으로
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-4">
          {/* 퇴직 정보 + 근속 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">퇴직 정보</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">성명</span>
                <span className="text-gray-900 font-medium">{data.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">사번</span>
                <span className="text-gray-600 font-mono text-xs">{data.empId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">부서 / 직급</span>
                <span className="text-gray-600">{data.department} / {data.rank}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">입사일</span>
                <span className="text-gray-600">{data.hireDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">퇴직 예정일</span>
                <span className="text-gray-900 font-medium">{data.resignDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">재직 기간</span>
                <span className="text-gray-900 font-medium">{data.yearsOfService}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">퇴직 사유</span>
                <span className="text-gray-600">{data.reason}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">상태</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  data.status === '대기' ? 'bg-yellow-50 text-yellow-600' :
                  data.status === '처리중' ? 'bg-blue-50 text-blue-600' :
                  'bg-[#eaf6f0] text-[#1D9E75]'
                }`}>{data.status}</span>
              </div>
            </div>
          </div>

          {/* 잔여 연차 현황 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">잔여 연차 현황</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">총 연차</div>
                <div className="text-xl font-bold text-gray-900">{data.totalLeave}<span className="text-sm font-normal text-gray-400">일</span></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">사용</div>
                <div className="text-xl font-bold text-blue-500">{data.usedLeave}<span className="text-sm font-normal text-gray-400">일</span></div>
              </div>
              <div className="bg-[#f2faf6] rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">잔여</div>
                <div className="text-xl font-bold text-[#1D9E75]">{data.remainLeave}<span className="text-sm font-normal text-gray-400">일</span></div>
              </div>
            </div>
            {data.remainLeave > 0 && (
              <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
                미사용 연차 {data.remainLeave}일 × 일급 {fmt(Math.round(data.salary / 30))}원 = <span className="font-bold text-gray-900">{fmt(leavePay)}원</span> 수당 환산
              </div>
            )}
          </div>

          {/* 퇴직금 산정 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">퇴직금 산정 내역</h3>
            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">월 평균임금</span>
                <span className="text-gray-900">{fmt(avgSalary)}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">일 평균임금</span>
                <span className="text-gray-600">{fmt(Math.round(avgSalary / 30))}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">근속연수</span>
                <span className="text-gray-600">{data.yearsOfService}</span>
              </div>
              <div className="flex justify-between text-sm pt-2.5 border-t border-gray-100">
                <span className="text-gray-900 font-medium">예상 퇴직금</span>
                <span className="text-[#1D9E75] font-bold text-base">{fmt(severancePay)}원</span>
              </div>
            </div>
            <div className="text-[11px] text-gray-400">퇴직금 = 일 평균임금 × 365 × (근속연수). 실제 금액은 재무팀 정산 후 확정됩니다.</div>
          </div>

          {/* 최종 급여 정산 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">최종 정산 요약</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">최종 월 급여</span>
                <span className="text-gray-900">{fmt(data.salary)}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">미사용 연차 수당</span>
                <span className="text-gray-900">{fmt(leavePay)}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">퇴직금</span>
                <span className="text-gray-900">{fmt(severancePay)}원</span>
              </div>
              <div className="flex justify-between text-sm pt-3 mt-1 border-t-2 border-gray-200">
                <span className="text-gray-900 font-bold">총 정산 금액</span>
                <span className="text-[#1D9E75] font-bold text-lg">{fmt(totalSettlement)}원</span>
              </div>
            </div>
          </div>

          {/* 반납 및 정산 현황 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">인수인계 및 반납 현황</h3>
            <div className="space-y-2.5">
              {data.checklist.map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${item.done ? 'bg-[#f2faf6] border-[#c8e8d8]' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${item.done ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'}`}>
                      {item.done && <i className="fas fa-check text-white text-[9px]"></i>}
                    </div>
                    <span className={`text-sm ${item.done ? 'text-[#1D9E75]' : 'text-gray-700'}`}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.date && <span className="text-xs text-gray-400">{item.date}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.done ? 'bg-[#eaf6f0] text-[#1D9E75]' : 'bg-gray-100 text-gray-400'}`}>
                      {item.done ? '완료' : '미완료'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 처리 이력 */}
        <div className="col-span-4">
          <div className="card p-5 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">처리 이력</h3>
            <div className="space-y-4">
              {data.history.map((h, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
                    {idx < data.history.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="text-xs font-medium text-gray-900">{h.action}</div>
                    <div className="text-[11px] text-gray-400">{h.date} · {h.by}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
