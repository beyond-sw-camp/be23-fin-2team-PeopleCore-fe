import { useState } from 'react'

/* ── 결재 사이드 메뉴 ── */
const FREQUENT_FORMS = ['지출결의', '경조금지급신청']

const APPROVE_MENU = [
  { label: '결재 대기 문서', count: 13 },
  { label: '결재 수신 문서', count: 0 },
  { label: '공문 대기 문서', count: 0 },
  { label: '참조/열람 대기 문서', count: 2 },
  { label: '결재 예정 문서', count: 69 },
]

const PERSONAL_MENU = [
  '기안 문서함',
  '임시 저장함',
  '결재 문서함',
  '참조/열람 문서함',
  '수신 문서함',
  '발송 문서함',
  '공문 문서함',
]

type ActiveView = '전자결재 홈' | '기안 문서함' | '임시 저장함' | '결재 문서함' | '참조/열람 문서함' | '수신 문서함' | '발송 문서함' | '공문 문서함'

/* ── Mock 데이터 ── */
const PENDING_CARDS = [
  { id: 1, title: '휴가신청', author: '김인재 차장', date: '2026-03-25', form: '휴가신청', urgent: true, status: '진행중', comments: 1, reads: 0, files: 0 },
  { id: 2, title: '해외출장신청', author: '김인재 차장', date: '2026-03-23', form: '해외출장신청', urgent: true, status: '완료', comments: 0, reads: 2, files: 0 },
  { id: 3, title: '휴가신청서', author: '김인재 차장', date: '2026-03-27', form: '휴가신청서', urgent: false, status: '진행중', comments: 0, reads: 0, files: 0 },
  { id: 4, title: '구매품의서', author: '김인재 차장', date: '2026-03-27', form: '구매품의서', urgent: false, status: '진행중', comments: 0, reads: 0, files: 0 },
]

const PROGRESS_DOCS = [
  { date: '2026-03-23', form: '휴가신청서', title: '휴가신청서', urgent: false, status: '진행중' },
  { date: '2026-02-16', form: '휴가신청', title: '휴가신청', urgent: false, status: '진행중' },
  { date: '2026-02-10', form: '지출결의', title: '지출결의', urgent: false, status: '진행중' },
  { date: '2026-02-04', form: '비자발급신청', title: '비자발급신청', urgent: false, status: '진행중' },
  { date: '2026-02-04', form: '비자발급신청', title: '비자발급신청', urgent: false, status: '진행중' },
]

const COMPLETE_DOCS = [
  { date: '2026-01-15', form: '휴가신청서', title: '연차 사용', docNum: 'AP-2026-0042', status: '승인' },
  { date: '2026-01-10', form: '지출결의', title: '팀 회식비 정산', docNum: 'AP-2026-0038', status: '승인' },
]

export default function Approval() {
  const [activeView, setActiveView] = useState<ActiveView>('전자결재 홈')

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 전자결재 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">전자결재</h2>
          <button
            onClick={() => setActiveView('전자결재 홈')}
            className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-gray-700 font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
          >
            새 결재 진행
          </button>
        </div>

        {/* 자주 쓰는 양식 */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-gray-500">자주 쓰는 양식</span>
            <button className="text-[11px] text-[#1D9E75]">✎</button>
          </div>
          {FREQUENT_FORMS.map((form) => (
            <div key={form} className="py-1.5 px-2 text-[12px] text-gray-600 hover:text-[#1D9E75] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors">
              {form}
            </div>
          ))}
        </div>

        {/* 결재하기 */}
        <div className="px-4 pt-3 pb-2">
          <span className="text-[12px] font-semibold text-gray-500 mb-1 block">결재하기</span>
          {APPROVE_MENU.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-1.5 px-2 text-[12px] text-gray-600 hover:text-[#1D9E75] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors"
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className="text-[11px] font-bold text-[#1D9E75]">{item.count}</span>
              )}
            </div>
          ))}
        </div>

        {/* 개인 문서함 */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-gray-500">개인 문서함</span>
            <button className="text-[11px] text-gray-400">⚙</button>
          </div>
          <div className="text-[11px] text-gray-300 mb-1 px-2">─ &lt;기본 문서함&gt; ─</div>
          {PERSONAL_MENU.map((item) => (
            <div
              key={item}
              onClick={() => setActiveView(item as ActiveView)}
              className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                activeView === item
                  ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                  : 'text-gray-600 hover:text-[#1D9E75] hover:bg-[#E1F5EE]'
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* 부서 문서함 */}
        <div className="px-4 pt-3 pb-4">
          <span className="text-[12px] font-semibold text-gray-500 block mb-1">부서 문서함</span>
          <div className="py-1.5 px-2 text-[12px] text-gray-600 hover:text-[#1D9E75] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors">
            경영지원팀
          </div>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {activeView === '전자결재 홈' ? (
          <ApprovalHome />
        ) : (
          <DocumentList title={activeView} />
        )}
      </div>
    </div>
  )
}

/* ── 전자결재 홈 ── */
function ApprovalHome() {
  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-6 tracking-tight">전자결재 홈</h1>

      {/* 결재 대기 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {PENDING_CARDS.map((card) => (
          <div key={card.id} className="bg-white rounded-xl border border-[#d1d5db] p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-1.5 mb-3">
              {card.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                card.status === '진행중' ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-blue-50 text-blue-600'
              }`}>{card.status}</span>
            </div>
            <h3 className="text-[14px] font-bold text-gray-900 mb-4 leading-snug">{card.title}</h3>
            <div className="space-y-1.5 text-[12px] text-gray-400 mb-4 flex-1">
              <div className="flex"><span className="w-14 text-gray-500">기안자</span>{card.author}</div>
              <div className="flex"><span className="w-14 text-gray-500">기안일</span>{card.date}</div>
              <div className="flex"><span className="w-14 text-gray-500">결재양식</span>{card.form}</div>
            </div>
            <button className="w-full py-2 border border-[#e0e5e2] rounded-lg text-[12px] text-gray-600 font-medium hover:bg-[#1D9E75] hover:text-white hover:border-[#1D9E75] transition-all">
              결재하기
            </button>
          </div>
        ))}
      </div>

      {/* 기안 진행 문서 */}
      <SectionTable
        title="기안 진행 문서"
        columns={['기안일', '결재양식', '제목', '', '결재상태']}
        rows={PROGRESS_DOCS.map((doc) => [
          <span className="text-gray-400">{doc.date}</span>,
          <span className="text-gray-600">{doc.form}</span>,
          <span className="text-gray-900 font-medium">{doc.title}</span>,
          '',
          <span className="inline-block text-[11px] px-2.5 py-1 bg-[#E1F5EE] text-[#1D9E75] font-semibold rounded-full">{doc.status}</span>,
        ])}
      />

      {/* 완료 문서 */}
      <SectionTable
        title="완료 문서"
        columns={['기안일', '결재양식', '제목', '문서번호', '결재상태']}
        rows={COMPLETE_DOCS.map((doc) => [
          <span className="text-gray-400">{doc.date}</span>,
          <span className="text-gray-600">{doc.form}</span>,
          <span className="text-gray-900 font-medium">{doc.title}</span>,
          <span className="text-gray-400">{doc.docNum}</span>,
          <span className="inline-block text-[11px] px-2.5 py-1 bg-blue-50 text-blue-600 font-semibold rounded-full">{doc.status}</span>,
        ])}
      />
    </div>
  )
}

/* ── 섹션 테이블 공통 ── */
function SectionTable({ title, columns, rows }: { title: string; columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mb-8">
      <h2 className="text-[14px] font-bold text-gray-900 mb-3 tracking-tight">{title}</h2>
      <div className="bg-white rounded-xl border border-[#d1d5db] shadow-sm overflow-hidden">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-[#1D9E75] border-b border-[#1D9E75]">
              {columns.map((col, i) => (
                <th key={i} className={`px-5 py-3 font-semibold text-white ${i >= columns.length - 2 ? 'text-right' : ''}`}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-200 last:border-b-0 hover:bg-[#E1F5EE] cursor-pointer transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className={`px-5 py-3 ${j >= row.length - 2 ? 'text-right' : ''}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── 문서함 리스트 (공통) ── */
function DocumentList({ title }: { title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#d1d5db] rounded-lg px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mr-2"><circle cx="7" cy="7" r="5" stroke="#b0b8b4" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#b0b8b4" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input type="text" placeholder="문서 검색" className="text-[12px] outline-none bg-transparent w-40 placeholder-gray-300" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#d1d5db] shadow-sm overflow-hidden">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-[#1D9E75] border-b border-[#1D9E75]">
              <th className="px-5 py-3 font-semibold text-white">기안일</th>
              <th className="px-5 py-3 font-semibold text-white">결재양식</th>
              <th className="px-5 py-3 font-semibold text-white">제목</th>
              <th className="px-5 py-3 font-semibold text-white text-right">첨부</th>
              <th className="px-5 py-3 font-semibold text-white text-right">결재상태</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="py-16 text-center">
                <div className="text-gray-300 text-[13px]">
                  <div className="text-3xl mb-2">📋</div>
                  문서가 없습니다.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
