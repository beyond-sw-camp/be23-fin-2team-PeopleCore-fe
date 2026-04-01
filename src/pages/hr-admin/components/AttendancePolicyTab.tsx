import { useState } from 'react'

type AttPolicyView = 'leave-rule' | 'leave-expire' | 'weekly52' | 'pay-link' | 'work-group'

const ATT_POLICY_MENUS: { key: AttPolicyView; label: string }[] = [
  { key: 'leave-rule', label: '연차 발생 규칙 설정' },
  { key: 'leave-expire', label: '연차 소멸 처리' },
  { key: 'weekly52', label: '주 52시간 정책 설정' },
  { key: 'pay-link', label: '근태→급여 연동 확정' },
  { key: 'work-group', label: '근무그룹 관리' },
]

function LeaveRuleView() {
  const [rules, setRules] = useState([
    { id: 1, minYears: 0, maxYears: 1, days: 1, desc: '월 1일 (월차)' },
    { id: 2, minYears: 1, maxYears: 3, days: 15, desc: '' },
    { id: 3, minYears: 3, maxYears: 5, days: 16, desc: '' },
    { id: 4, minYears: 5, maxYears: 7, days: 17, desc: '' },
    { id: 5, minYears: 7, maxYears: null as number | null, days: 20, desc: '' },
  ])

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 발생 규칙 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">근속연수별 연차 발생일수 규칙을 정의합니다</p>

      <div className="flex justify-end mb-4">
        <button className="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50">규칙 추가</button>
      </div>

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근속연수 (이상)</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근속연수 (미만)</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">발생 연차</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">비고</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
        </tr></thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800">{r.minYears}년</td>
              <td className="px-3 py-2.5 text-gray-600">{r.maxYears !== null ? `${r.maxYears}년` : '무제한'}</td>
              <td className="px-3 py-2.5 text-right text-[#1D9E75] font-semibold">{r.days}일</td>
              <td className="px-3 py-2.5 text-gray-500">{r.desc}</td>
              <td className="px-3 py-2.5 text-right">
                <button className="text-[11px] text-[#1D9E75] hover:underline mr-2">수정</button>
                <button className="text-[11px] text-red-500 hover:underline">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
      </div>
    </div>
  )
}

function LeaveExpireView() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 소멸 처리</h3>
      <p className="text-[12px] text-gray-400 mb-5">미사용 연차를 자동 소멸 처리하고 이력을 기록합니다</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">소멸 처리 설정</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">소멸 처리 방식</span>
            <select className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              <option>연차 사용 기간 만료 시 자동 소멸</option>
              <option>수동 소멸 처리</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">소멸 알림 발송</span>
            <select className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              <option>소멸 6개월 전, 2개월 전</option>
              <option>소멸 3개월 전, 1개월 전</option>
              <option>소멸 1개월 전</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
      </div>
    </div>
  )
}

function Weekly52View() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">주 52시간 정책 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">법정 근무시간 한도 관리 정책을 설정합니다</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">정책 설정</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">주간 최대 근무시간</span>
            <input type="number" defaultValue={52} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-20" />
            <span className="text-[12px] text-gray-500">시간</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">경고 기준</span>
            <input type="number" defaultValue={48} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-20" />
            <span className="text-[12px] text-gray-500">시간 초과 시 경고 알림</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-32 shrink-0">초과 시 처리</span>
            <select className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              <option>관리자에게 알림만 발송</option>
              <option>초과근무 신청 자동 차단</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
      </div>
    </div>
  )
}

function PayLinkView() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">근태→급여 연동 확정</h3>
      <p className="text-[12px] text-gray-400 mb-5">월 마감 근태 데이터를 급여 모듈에 확정 전달합니다</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">연동 현황</h4>
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">대상 월</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">대상 인원</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">확정일</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">처리</th>
          </tr></thead>
          <tbody>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5 text-gray-800 font-medium">2026-03</td>
              <td className="px-3 py-2.5 text-right text-gray-700">13명</td>
              <td className="px-3 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-yellow-50 text-yellow-600">미확정</span></td>
              <td className="px-3 py-2.5 text-gray-500">-</td>
              <td className="px-3 py-2.5 text-right"><button className="text-[11px] text-[#1D9E75] hover:underline">확정</button></td>
            </tr>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5 text-gray-800 font-medium">2026-02</td>
              <td className="px-3 py-2.5 text-right text-gray-700">13명</td>
              <td className="px-3 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-600">확정 완료</span></td>
              <td className="px-3 py-2.5 text-gray-500">2026-03-05</td>
              <td className="px-3 py-2.5 text-right"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WorkGroupView() {
  const [groups, setGroups] = useState([
    { id: 1, name: '기본그룹', type: '고정근로', isDefault: true, startTime: '09:00', endTime: '18:00', hours: 8, workDays: '월, 화, 수, 목, 금', holidays: '일', location: '', device: '웹 서비스', members: 40 },
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-800">근무그룹 관리</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">비활성 그룹 보기</button>
          <button className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">+ 근무그룹 추가</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 기존 그룹 카드 */}
        {groups.map((g) => (
          <div key={g.id} className="border-2 border-[#1D9E75]/30 rounded-xl p-5 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-3">
              {g.isDefault && <span className="text-[10px] px-2 py-0.5 rounded bg-[#1D9E75] text-white font-medium">기본</span>}
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{g.type}</span>
            </div>
            <h4 className="text-[14px] font-bold text-gray-900 mb-3">{g.name}</h4>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">근로시간</span><span className="text-gray-800">{g.startTime} ~ {g.endTime} ({g.hours}h)</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">근무요일</span><span className="text-gray-800">{g.workDays}</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">주휴일</span><span className="text-gray-800">{g.holidays}</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">근무지</span><span className="text-gray-400">{g.location || '-'}</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">디바이스</span><span className="text-gray-800">{g.device}</span></div>
              <div className="flex"><span className="text-gray-500 w-20 shrink-0">적용멤버</span><span className="text-gray-800">{g.members}</span></div>
            </div>
          </div>
        ))}

        {/* 추가 카드 */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 transition-all">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[18px] mb-3">+</div>
          <h4 className="text-[14px] font-semibold text-gray-700 mb-1">근무그룹 추가하기</h4>
          <p className="text-[11px] text-gray-400 text-center">회사 정책에 따른 근무제 유형을 선택하고,<br />근무 정책을 설정해보세요!</p>
        </div>
      </div>
    </div>
  )
}

export default function AttendancePolicyTab() {
  const [view, setView] = useState<AttPolicyView>('leave-rule')

  return (
    <div className="flex gap-0 -m-6 h-[calc(100%+48px)]">
      {/* 서브 사이드바 */}
      <div className="w-[200px] bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-800">근태·연차 정책</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">연차 규칙 및 근태 정책 관리</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {ATT_POLICY_MENUS.map((m) => (
            <div key={m.key} onClick={() => setView(m.key)}
              className={`flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer rounded-lg transition-colors ${view === m.key ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-gray-600 hover:bg-gray-50'}`}>
              {m.label}
            </div>
          ))}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'leave-rule' && <LeaveRuleView />}
        {view === 'leave-expire' && <LeaveExpireView />}
        {view === 'weekly52' && <Weekly52View />}
        {view === 'pay-link' && <PayLinkView />}
        {view === 'work-group' && <WorkGroupView />}
      </div>
    </div>
  )
}
