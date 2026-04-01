import React from 'react'

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

/* ── 섹션 테이블 공통 ── */
function SectionTable({ title, columns, rows }: { title: string; columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mb-8">
      <h2 className="text-[14px] font-bold text-[#000000] mb-3 tracking-tight">{title}</h2>
      <div className="bg-white rounded-xl border border-[#d1d5db] shadow-sm overflow-hidden">
        <table className="w-full text-left text-[12px]">
          <thead>
            {/* 테이블 헤더 배경만 크림 톤으로 변경 */}
            <tr className="bg-gray-50 border-b border-gray-800">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 font-semibold text-[#000000] ${
                    i >= columns.length - 2 ? 'text-right' : ''
                  }`}
                >
                  {col}
                </th>
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

/* ── 전자결재 홈 ── */
export default function ApprovalHome() {
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
          <span className="text-[#000000]">{doc.date}</span>,
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
          <span className="text-[#000000]">{doc.date}</span>,
          <span className="text-gray-600">{doc.form}</span>,
          <span className="text-gray-900 font-medium">{doc.title}</span>,
          <span className="text-gray-400">{doc.docNum}</span>,
          <span className="inline-block text-[11px] px-2.5 py-1 bg-blue-50 text-blue-600 font-semibold rounded-full">{doc.status}</span>,
        ])}
      />
    </div>
  )
}
