import { useState } from 'react'
import { type TempSavedDoc } from '../ApprovalDocumentPage'
import { FieldSettingsModal } from './ApprovalModals'

/* ══════════════════════════════════════════════
   공용 페이지네이션 + 검색 + 툴바 + statusBadge
   ══════════════════════════════════════════════ */

export function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button onClick={() => setPage(1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-double-left" /></button>
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-left" /></button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors ${p === page ? 'bg-[#1D9E75] text-white font-bold' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
      ))}
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-right" /></button>
      <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-double-right" /></button>
    </div>
  )
}

export function SearchBar({ options }: { options?: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
        <option>전체기간</option><option>1주일</option><option>1개월</option><option>3개월</option>
      </select>
      <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
        {(options ?? ['제목', '기안자', '결재양식']).map((o) => <option key={o}>{o}</option>)}
      </select>
      <div className="flex items-center border border-gray-300 rounded overflow-hidden">
        <input type="text" placeholder="검색" className="px-2 py-1 text-[12px] outline-none w-32" />
        <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#6b7280" strokeWidth="1.5" /><path d="M11 11l3 3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  )
}

export function ToolbarRow({ perPage, setPerPage, setPage, fieldModalOpen, children }: {
  perPage: number; setPerPage: (n: number) => void; setPage: (n: number) => void; fieldModalOpen: () => void; children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">{children}</div>
      <div className="flex items-center gap-3">
        <button onClick={fieldModalOpen} className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
          <i className="fas fa-cog text-[10px]" /> 필드 설정
        </button>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }} className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  )
}

export function statusBadge(status: string) {
  const colors: Record<string, string> = {
    '완료': 'bg-gray-100 text-gray-500', '승인': 'bg-blue-50 text-blue-600', '진행중': 'bg-[#E1F5EE] text-[#1D9E75]',
    '반려': 'bg-red-50 text-red-500', '임시저장': 'bg-yellow-50 text-yellow-600', '접수대기': 'bg-yellow-50 text-yellow-600', '접수': 'bg-[#E1F5EE] text-[#1D9E75]',
  }
  return <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

/* ══════════════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════════════ */

/* ── 결재 대기 Mock 데이터 (내가 결재해야 할 문서) ── */
const WAITING_DOCS = [
  { id: 101, date: '2026-03-28', form: '휴가신청', title: '연차 휴가 신청', urgent: true, author: '이수진 대리', dept: '경영', files: 0 },
  { id: 102, date: '2026-03-27', form: '지출결의', title: '3월 법인카드 정산', urgent: false, author: '박지현 과장', dept: '경영', files: 1 },
  { id: 103, date: '2026-03-27', form: '해외출장신청', title: '일본 출장 신청', urgent: true, author: '정하은 사원', dept: '경영', files: 2 },
  { id: 104, date: '2026-03-26', form: '채용요청', title: '프론트엔드 개발자 채용 요청', urgent: false, author: '박서준 팀장', dept: '개발', files: 0 },
  { id: 105, date: '2026-03-25', form: '교육수강신청', title: 'AWS 자격증 교육 수강', urgent: false, author: '최예린 대리', dept: '개발', files: 1 },
]

/* ── 결재 수신 Mock 데이터 ── */
const RECEIVED_DOCS = [
  { id: 201, date: '2026-03-29', form: '구매품의서', title: '사무용품 구매 품의', urgent: false, author: '박지현 과장', dept: '경영', files: 1, docNum: 'AP-2026-0051', status: '접수대기' as const },
  { id: 202, date: '2026-03-28', form: '지출결의', title: '출장비 정산', urgent: true, author: '정하은 사원', dept: '경영', files: 0, docNum: 'AP-2026-0049', status: '접수대기' as const },
  { id: 203, date: '2026-03-25', form: '채용요청', title: '백엔드 개발자 충원', urgent: false, author: '박서준 팀장', dept: '개발', files: 2, docNum: 'AP-2026-0045', status: '접수' as const },
  { id: 204, date: '2026-03-22', form: '교육결과보고', title: 'React 심화 교육 결과보고', urgent: false, author: '최예린 대리', dept: '개발', files: 1, docNum: 'AP-2026-0040', status: '접수' as const },
]

/* ── 참조/열람 대기 Mock 데이터 ── */
const CC_VIEW_DOCS = [
  { id: 301, date: '2026-03-29', completedDate: '2026-03-30', type: '참조' as const, form: '지출결의', title: '3월 법인카드 정산', urgent: false, author: '박지현 과장', files: 1, docNum: 'AP-2026-0051', status: '승인' },
  { id: 302, date: '2026-03-27', completedDate: '', type: '열람' as const, form: '채용요청', title: '프론트엔드 개발자 채용', urgent: true, author: '박서준 팀장', files: 0, docNum: 'AP-2026-0048', status: '진행중' },
  { id: 303, date: '2026-03-25', completedDate: '2026-03-26', type: '참조' as const, form: '휴가신청', title: '이수진 대리 연차', urgent: false, author: '이수진 대리', files: 0, docNum: 'AP-2026-0044', status: '승인' },
  { id: 304, date: '2026-03-20', completedDate: '', type: '열람' as const, form: '해외출장신청', title: '미국 컨퍼런스 출장', urgent: false, author: '이민호 과장', files: 3, docNum: 'AP-2026-0038', status: '진행중' },
]

/* ── 결재 예정 Mock 데이터 (내 앞 사람이 결재해야 할 문서) ── */
const UPCOMING_DOCS = [
  { id: 401, date: '2026-03-11', form: '휴직원', title: '휴직원', urgent: true, author: '김인재', dept: '경영', files: 1 },
  { id: 402, date: '2026-03-27', form: '구매품의서', title: '구매품의서', urgent: false, author: '김인재', dept: '경영', files: 0 },
]

/* ── Mock: 기안 문서함 ── */
const DRAFT_BOX_DOCS = [
  { id: 501, date: '2026-03-19', completedDate: '2026-03-19', form: '사무용품신청', title: '사무용품신청', urgent: false, files: 0, dept: '경영', docNum: '', status: '완료' },
  { id: 502, date: '2026-03-18', completedDate: '', form: '휴가신청서', title: '휴가신청서', urgent: false, files: 0, dept: '경영', docNum: '', status: '진행중' },
  { id: 503, date: '2026-03-18', completedDate: '', form: '휴가신청서', title: '휴가신청서', urgent: false, files: 1, dept: '경영', docNum: '', status: '진행중' },
  { id: 504, date: '2026-03-12', completedDate: '2026-03-12', form: '휴가신청', title: '휴가신청', urgent: true, files: 2, dept: '경영', docNum: 'AP-2026-00144', status: '승인' },
  { id: 505, date: '2026-03-10', completedDate: '', form: '비자발급신청', title: '비자발급신청', urgent: false, files: 1, dept: '경영', docNum: '', status: '반려' },
]

const APPROVAL_BOX_DOCS = [
  { id: 601, date: '2026-03-23', completedDate: '2026-03-23', form: '해외출장신청', title: '해외출장신청', urgent: true, files: 3, author: '김인재', dept: '경영', docNum: 'AP-2026-00150', status: '완료' },
  { id: 602, date: '2026-03-19', completedDate: '', form: '재직증명서', title: '재직증명서', urgent: false, files: 1, author: '김인재', dept: '경영', docNum: '', status: '반려' },
  { id: 603, date: '2026-03-10', completedDate: '2026-03-11', form: '교육결과보고', title: '교육결과보고', urgent: false, files: 0, author: '김인재', dept: '경영', docNum: 'AP-2026-00143', status: '완료' },
  { id: 604, date: '2026-03-05', completedDate: '', form: '업무기안', title: '기안문 작성 연습입니다.', urgent: true, files: 1, author: '김인재', dept: '경영', docNum: '', status: '반려' },
  { id: 605, date: '2026-02-12', completedDate: '', form: '휴직원', title: '휴직원', urgent: false, files: 0, author: '다다', dept: 'ONE TEAM', docNum: '', status: '진행중' },
]

/* ══════════════════════════════════════════════
   필드 정의
   ══════════════════════════════════════════════ */

const TEMP_FIELDS = [
  { key: 'date', label: '생성일', desc: '임시 저장된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const ALL_FIELDS = [
  { key: 'date', label: '기안일', desc: '최초 결재문서가 시작된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '최종 결재가 되어 결재 문서의 진행이 완료된 날짜입니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'dept', label: '기안부서', desc: '기안자가 소속된 부서가 표시됩니다.' },
]

const DEFAULT_VISIBLE_FIELDS = ALL_FIELDS.map((f) => f.key)

const RECEIVED_FIELDS = [
  { key: 'date', label: '접수일', desc: '문서를 수신한 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'docNum', label: '원문번호', desc: '결재 문서의 원문번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const CC_VIEW_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'completedDate', label: '완료일', desc: '결재가 완료된 날짜를 표시합니다.' },
  { key: 'type', label: '구분', desc: '참조 또는 열람 구분을 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'docNum', label: '문서번호', desc: '결재 문서번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const UPCOMING_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'dept', label: '기안부서', desc: '기안자가 소속된 부서가 표시됩니다.' },
]

const DRAFT_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'completedDate', label: '완료일', desc: '결재가 완료된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'dept', label: '기안부서', desc: '기안자가 소속된 부서가 표시됩니다.' },
  { key: 'docNum', label: '문서번호', desc: '결재 문서번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const SENT_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'completedDate', label: '완료일', desc: '결재가 완료된 날짜를 표시합니다.' },
  { key: 'receivedDate', label: '접수일', desc: '문서가 접수된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'manager', label: '담당자', desc: '문서 담당자를 표시합니다.' },
  { key: 'sentDate', label: '발송일', desc: '문서가 발송된 날짜를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const INBOX_FIELDS = [
  { key: 'receivedDate', label: '접수일', desc: '문서를 수신한 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'lastApprover', label: '최종 결재자', desc: '최종 결재자를 표시합니다.' },
  { key: 'manager', label: '담당자', desc: '문서 담당자를 표시합니다.' },
  { key: 'docNum', label: '문서번호', desc: '결재 문서번호를 표시합니다.' },
  { key: 'origNum', label: '원문번호', desc: '원문 번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
  { key: 'receiverDept', label: '수신부서', desc: '수신 부서를 표시합니다.' },
]

/* ══════════════════════════════════════════════
   Document List Components
   ══════════════════════════════════════════════ */

/* ── 문서함 리스트 (공통) ── */
export function DocumentList({ title }: { title: string }) {
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

/* ── 임시 저장함 ── */
export function TempSavedList({ docs, onOpen, onDelete }: {
  docs: TempSavedDoc[]
  onOpen: (doc: TempSavedDoc) => void
  onDelete: (id: number) => void
}) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(TEMP_FIELDS.map((f) => f.key))

  const totalPages = Math.max(1, Math.ceil(docs.length / perPage))
  const paged = docs.slice((page - 1) * perPage, page * perPage)
  const v = (k: string) => visibleFields.includes(k)

  const allChecked = paged.length > 0 && paged.every((d) => checkedIds.has(d.id))
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(paged.map((d) => d.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleBulkDelete = () => {
    checkedIds.forEach((id) => onDelete(id))
    setCheckedIds(new Set())
  }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">임시 저장함</h1>

      {/* 문서 삭제 */}
      <div className="flex items-center gap-4 text-[12px] text-gray-600 mb-3">
        <button
          disabled={checkedIds.size === 0}
          onClick={handleBulkDelete}
          className="flex items-center gap-1.5 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-trash-alt text-[10px]" /> 문서 삭제
        </button>
      </div>

      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />

      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-gray-500 font-medium w-10">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#1D9E75]" />
            </th>
            {v('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">생성일</th>}
            {v('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
            {v('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
            {v('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
            {v('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
            {v('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 ? (
            <tr><td colSpan={1 + visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">임시 저장된 문서가 없습니다.</td></tr>
          ) : (
            paged.map((doc) => (
              <tr
                key={doc.id}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${checkedIds.has(doc.id) ? 'bg-blue-50/40' : ''}`}
                onClick={() => onOpen(doc)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checkedIds.has(doc.id)} onChange={() => toggleOne(doc.id)} className="accent-[#1D9E75]" />
                </td>
                {v('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.savedAt}</td>}
                {v('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.form.name}</td>}
                {v('urgent') && <td className="px-4 py-3 whitespace-nowrap"></td>}
                {v('title') && <td className="px-4 py-3 text-gray-900 font-medium">{doc.form.name}</td>}
                {v('files') && <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap"></td>}
                {v('status') && <td className="px-4 py-3 text-right">{statusBadge('임시저장')}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <SearchBar options={['제목', '결재양식']} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={TEMP_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 결재 대기 문서 목록 ── */
export function WaitingDocList({ title = '결재 대기 문서' }: { title?: string }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(DEFAULT_VISIBLE_FIELDS)

  const totalPages = Math.max(1, Math.ceil(WAITING_DOCS.length / perPage))
  const pagedDocs = WAITING_DOCS.slice((page - 1) * perPage, page * perPage)

  const allChecked = pagedDocs.length > 0 && pagedDocs.every((d) => checkedIds.has(d.id))
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(pagedDocs.map((d) => d.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isVisible = (key: string) => visibleFields.includes(key)

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">{title}</h1>

      {/* 일괄 결재 + 필드설정 + 페이지 수 */}
      <div className="flex items-center justify-between mb-3">
        <button
          disabled={checkedIds.size === 0}
          className="flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-list text-[10px]" />
          일괄 결재
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFieldModalOpen(true)}
            className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="fas fa-cog text-[10px]" /> 필드 설정
          </button>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
          >
            {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-gray-500 font-medium w-10">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#1D9E75]" />
            </th>
            {isVisible('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">기안일</th>}
            {isVisible('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
            {isVisible('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
            {isVisible('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
            {isVisible('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
            {isVisible('author') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안자</th>}
            {isVisible('dept') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안부서</th>}
          </tr>
        </thead>
        <tbody>
          {pagedDocs.length === 0 ? (
            <tr>
              <td colSpan={1 + visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">
                결재할 문서가 없습니다.
              </td>
            </tr>
          ) : (
            pagedDocs.map((doc) => (
              <tr
                key={doc.id}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  checkedIds.has(doc.id) ? 'bg-blue-50/40' : ''
                }`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checkedIds.has(doc.id)} onChange={() => toggleOne(doc.id)} className="accent-[#1D9E75]" />
                </td>
                {isVisible('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.date}</td>}
                {isVisible('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.form}</td>}
                {isVisible('urgent') && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {doc.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}
                  </td>
                )}
                {isVisible('title') && <td className="px-4 py-3 text-gray-900 font-medium">{doc.title}</td>}
                {isVisible('files') && (
                  <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">
                    {doc.files > 0 && <><i className="fas fa-paperclip text-[10px]" /> {doc.files}</>}
                  </td>
                )}
                {isVisible('author') && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{doc.author}</td>}
                {isVisible('dept') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{doc.dept}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 mt-6">
        <button onClick={() => setPage(1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-left" />
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-left" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors ${p === page ? 'bg-[#1D9E75] text-white font-bold' : 'text-gray-500 hover:bg-gray-100'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-right" />
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-right" />
        </button>
      </div>

      {/* 하단 검색 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          <option>전체기간</option>
          <option>1주일</option>
          <option>1개월</option>
          <option>3개월</option>
        </select>
        <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          <option>제목</option>
          <option>기안자</option>
          <option>결재양식</option>
        </select>
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <input type="text" placeholder="검색" className="px-2 py-1 text-[12px] outline-none w-32" />
          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#6b7280" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* 필드 설정 모달 */}
      <FieldSettingsModal
        isOpen={fieldModalOpen}
        fields={ALL_FIELDS}
        visibleFields={visibleFields}
        onClose={() => setFieldModalOpen(false)}
        onSave={(fields) => { setVisibleFields(fields); setFieldModalOpen(false) }}
      />
    </div>
  )
}

/* ── 결재 수신 문서 목록 ── */
export function ReceivedDocList({ title = '결재 수신 문서' }: { title?: string }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(RECEIVED_FIELDS.map((f) => f.key))
  const [statusFilter, setStatusFilter] = useState<'전체' | '접수대기' | '접수'>('전체')

  const filteredDocs = statusFilter === '전체'
    ? RECEIVED_DOCS
    : RECEIVED_DOCS.filter((d) => d.status === statusFilter)

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / perPage))
  const pagedDocs = filteredDocs.slice((page - 1) * perPage, page * perPage)

  const allChecked = pagedDocs.length > 0 && pagedDocs.every((d) => checkedIds.has(d.id))
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(pagedDocs.map((d) => d.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isVisible = (key: string) => visibleFields.includes(key)

  const statusTabs: Array<'전체' | '접수대기' | '접수'> = ['전체', '접수대기', '접수']

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">{title}</h1>

      {/* 상태 필터 탭 */}
      <div className="flex items-center gap-2 mb-4">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatusFilter(tab); setPage(1); setCheckedIds(new Set()) }}
            className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${
              statusFilter === tab
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 필드설정 + 페이지 수 */}
      <div className="flex items-center justify-end gap-3 mb-3">
        <button
          onClick={() => setFieldModalOpen(true)}
          className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          <i className="fas fa-cog text-[10px]" /> 필드 설정
        </button>
        <select
          value={perPage}
          onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
          className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
        >
          {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-gray-500 font-medium w-10">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#1D9E75]" />
            </th>
            {isVisible('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">접수일</th>}
            {isVisible('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
            {isVisible('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
            {isVisible('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
            {isVisible('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
            {isVisible('author') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안자</th>}
            {isVisible('docNum') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">원문번호</th>}
            {isVisible('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
          </tr>
        </thead>
        <tbody>
          {pagedDocs.length === 0 ? (
            <tr>
              <td colSpan={1 + visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">
                문서가 없습니다.
              </td>
            </tr>
          ) : (
            pagedDocs.map((doc) => (
              <tr
                key={doc.id}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  checkedIds.has(doc.id) ? 'bg-blue-50/40' : ''
                }`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checkedIds.has(doc.id)} onChange={() => toggleOne(doc.id)} className="accent-[#1D9E75]" />
                </td>
                {isVisible('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.date}</td>}
                {isVisible('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.form}</td>}
                {isVisible('urgent') && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {doc.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}
                  </td>
                )}
                {isVisible('title') && <td className="px-4 py-3 text-gray-900 font-medium">{doc.title}</td>}
                {isVisible('files') && (
                  <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">
                    {doc.files > 0 && <><i className="fas fa-paperclip text-[10px]" /> {doc.files}</>}
                  </td>
                )}
                {isVisible('author') && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{doc.author}</td>}
                {isVisible('docNum') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{doc.docNum}</td>}
                {isVisible('status') && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      doc.status === '접수대기' ? 'bg-yellow-50 text-yellow-600' : 'bg-[#E1F5EE] text-[#1D9E75]'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 mt-6">
        <button onClick={() => setPage(1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-left" />
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-left" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors ${p === page ? 'bg-[#1D9E75] text-white font-bold' : 'text-gray-500 hover:bg-gray-100'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-right" />
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-right" />
        </button>
      </div>

      {/* 하단 검색 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          <option>제목</option>
          <option>기안자</option>
          <option>원문번호</option>
        </select>
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <input type="text" placeholder="검색" className="px-2 py-1 text-[12px] outline-none w-32" />
          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#6b7280" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <FieldSettingsModal
        isOpen={fieldModalOpen}
        fields={RECEIVED_FIELDS}
        visibleFields={visibleFields}
        onClose={() => setFieldModalOpen(false)}
        onSave={(fields) => { setVisibleFields(fields); setFieldModalOpen(false) }}
      />
    </div>
  )
}

/* ── 참조/열람 대기 문서 목록 ── */
export function CcViewDocList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(CC_VIEW_FIELDS.map((f) => f.key))
  const [typeFilter, setTypeFilter] = useState<'전체' | '참조' | '열람'>('전체')

  const filteredDocs = typeFilter === '전체'
    ? CC_VIEW_DOCS
    : CC_VIEW_DOCS.filter((d) => d.type === typeFilter)

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / perPage))
  const pagedDocs = filteredDocs.slice((page - 1) * perPage, page * perPage)

  const allChecked = pagedDocs.length > 0 && pagedDocs.every((d) => checkedIds.has(d.id))
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(pagedDocs.map((d) => d.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isVisible = (key: string) => visibleFields.includes(key)

  const typeTabs: Array<'전체' | '참조' | '열람'> = ['전체', '참조', '열람']

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">참조/열람 대기 문서</h1>

      {/* 일괄 확인 */}
      <div className="flex items-center gap-1.5 text-[12px] text-gray-600 mb-3">
        <button
          disabled={checkedIds.size === 0}
          className="flex items-center gap-1.5 hover:text-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-list text-[10px]" />
          일괄 확인
        </button>
      </div>

      {/* 상태 필터 탭 + 필드설정 + 페이지 수 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {typeTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setTypeFilter(tab); setPage(1); setCheckedIds(new Set()) }}
              className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${
                typeFilter === tab
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFieldModalOpen(true)}
            className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="fas fa-cog text-[10px]" /> 필드 설정
          </button>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
          >
            {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-gray-500 font-medium w-10">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#1D9E75]" />
            </th>
            {isVisible('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">기안일</th>}
            {isVisible('completedDate') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">완료일</th>}
            {isVisible('type') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">구분</th>}
            {isVisible('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
            {isVisible('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
            {isVisible('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
            {isVisible('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
            {isVisible('author') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안자</th>}
            {isVisible('docNum') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">문서번호</th>}
            {isVisible('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
          </tr>
        </thead>
        <tbody>
          {pagedDocs.length === 0 ? (
            <tr>
              <td colSpan={1 + visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">
                문서가 없습니다.
              </td>
            </tr>
          ) : (
            pagedDocs.map((doc) => (
              <tr
                key={doc.id}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  checkedIds.has(doc.id) ? 'bg-blue-50/40' : ''
                }`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checkedIds.has(doc.id)} onChange={() => toggleOne(doc.id)} className="accent-[#1D9E75]" />
                </td>
                {isVisible('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.date}</td>}
                {isVisible('completedDate') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.completedDate || '-'}</td>}
                {isVisible('type') && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      doc.type === '참조' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {doc.type}
                    </span>
                  </td>
                )}
                {isVisible('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.form}</td>}
                {isVisible('urgent') && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {doc.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}
                  </td>
                )}
                {isVisible('title') && <td className="px-4 py-3 text-gray-900 font-medium">{doc.title}</td>}
                {isVisible('files') && (
                  <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">
                    {doc.files > 0 && <><i className="fas fa-paperclip text-[10px]" /> {doc.files}</>}
                  </td>
                )}
                {isVisible('author') && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{doc.author}</td>}
                {isVisible('docNum') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{doc.docNum}</td>}
                {isVisible('status') && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      doc.status === '진행중' ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 mt-6">
        <button onClick={() => setPage(1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-left" />
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-left" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors ${p === page ? 'bg-[#1D9E75] text-white font-bold' : 'text-gray-500 hover:bg-gray-100'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-right" />
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-right" />
        </button>
      </div>

      {/* 하단 검색 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          <option>전체기간</option>
          <option>1주일</option>
          <option>1개월</option>
          <option>3개월</option>
        </select>
        <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          <option>제목</option>
          <option>기안자</option>
          <option>문서번호</option>
        </select>
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <input type="text" placeholder="검색" className="px-2 py-1 text-[12px] outline-none w-32" />
          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#6b7280" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <FieldSettingsModal
        isOpen={fieldModalOpen}
        fields={CC_VIEW_FIELDS}
        visibleFields={visibleFields}
        onClose={() => setFieldModalOpen(false)}
        onSave={(fields) => { setVisibleFields(fields); setFieldModalOpen(false) }}
      />
    </div>
  )
}

/* ── 결재 예정 문서 목록 ── */
export function UpcomingDocList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(UPCOMING_FIELDS.map((f) => f.key))

  const totalPages = Math.max(1, Math.ceil(UPCOMING_DOCS.length / perPage))
  const pagedDocs = UPCOMING_DOCS.slice((page - 1) * perPage, page * perPage)

  const isVisible = (key: string) => visibleFields.includes(key)

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">결재 예정 문서</h1>

      {/* 필드설정 + 페이지 수 */}
      <div className="flex items-center justify-end gap-3 mb-3">
        <button
          onClick={() => setFieldModalOpen(true)}
          className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          <i className="fas fa-cog text-[10px]" /> 필드 설정
        </button>
        <select
          value={perPage}
          onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
          className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
        >
          {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            {isVisible('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">기안일</th>}
            {isVisible('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
            {isVisible('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
            {isVisible('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
            {isVisible('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
            {isVisible('author') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안자</th>}
            {isVisible('dept') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안부서</th>}
          </tr>
        </thead>
        <tbody>
          {pagedDocs.length === 0 ? (
            <tr>
              <td colSpan={visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">
                결재 예정 문서가 없습니다.
              </td>
            </tr>
          ) : (
            pagedDocs.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {isVisible('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.date}</td>}
                {isVisible('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.form}</td>}
                {isVisible('urgent') && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {doc.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}
                  </td>
                )}
                {isVisible('title') && <td className="px-4 py-3 text-gray-900 font-medium">{doc.title}</td>}
                {isVisible('files') && (
                  <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">
                    {doc.files > 0 && <><i className="fas fa-paperclip text-[10px]" /> {doc.files}</>}
                  </td>
                )}
                {isVisible('author') && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{doc.author}</td>}
                {isVisible('dept') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{doc.dept}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 mt-6">
        <button onClick={() => setPage(1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-left" />
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-left" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors ${p === page ? 'bg-[#1D9E75] text-white font-bold' : 'text-gray-500 hover:bg-gray-100'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-right" />
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
          <i className="fas fa-angle-double-right" />
        </button>
      </div>

      {/* 하단 검색 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          <option>전체기간</option>
          <option>1주일</option>
          <option>1개월</option>
          <option>3개월</option>
        </select>
        <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
          <option>제목</option>
          <option>기안자</option>
          <option>결재양식</option>
        </select>
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <input type="text" placeholder="검색" className="px-2 py-1 text-[12px] outline-none w-32" />
          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#6b7280" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <FieldSettingsModal
        isOpen={fieldModalOpen}
        fields={UPCOMING_FIELDS}
        visibleFields={visibleFields}
        onClose={() => setFieldModalOpen(false)}
        onSave={(fields) => { setVisibleFields(fields); setFieldModalOpen(false) }}
      />
    </div>
  )
}

/* ── 기안 문서함 ── */
export function DraftDocList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(DRAFT_FIELDS.map((f) => f.key))
  const [statusFilter, setStatusFilter] = useState('전체')
  const filtered = statusFilter === '전체' ? DRAFT_BOX_DOCS : DRAFT_BOX_DOCS.filter((d) => d.status === statusFilter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const v = (k: string) => visibleFields.includes(k)
  const tabs = ['전체', '진행', '완료', '반려']

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">기안 문서함</h1>
      <div className="flex items-center gap-2 mb-3">
        {tabs.map((t) => (
          <button key={t} onClick={() => { setStatusFilter(t === '진행' ? '진행중' : t); setPage(1) }}
            className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${(statusFilter === t || (t === '진행' && statusFilter === '진행중')) ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <table className="w-full text-left text-[12px]">
        <thead><tr className="border-b border-gray-200">
          <th className="px-4 py-3 text-gray-500 font-medium w-10"><input type="checkbox" className="accent-[#1D9E75]" /></th>
          {v('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">기안일</th>}
          {v('completedDate') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">완료일</th>}
          {v('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
          {v('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
          {v('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
          {v('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
          {v('dept') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안부서</th>}
          {v('docNum') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">문서번호</th>}
          {v('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
        </tr></thead>
        <tbody>{paged.length === 0 ? <tr><td colSpan={10} className="py-20 text-center text-gray-300 text-[13px]">문서가 없습니다.</td></tr> : paged.map((d) => (
          <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="accent-[#1D9E75]" /></td>
            {v('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.date}</td>}
            {v('completedDate') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.completedDate || '-'}</td>}
            {v('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{d.form}</td>}
            {v('urgent') && <td className="px-4 py-3 whitespace-nowrap">{d.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}</td>}
            {v('title') && <td className="px-4 py-3 text-gray-900 font-medium">{d.title}</td>}
            {v('files') && <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{d.files > 0 && <><i className="fas fa-paperclip text-[10px]" /> {d.files}</>}</td>}
            {v('dept') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{d.dept}</td>}
            {v('docNum') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{d.docNum || '-'}</td>}
            {v('status') && <td className="px-4 py-3 text-right">{statusBadge(d.status)}</td>}
          </tr>
        ))}</tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <SearchBar />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={DRAFT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 결재 문서함 ── */
export function ApprovalBoxList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(DRAFT_FIELDS.map((f) => f.key))
  const [statusFilter, setStatusFilter] = useState('전체')
  const filtered = statusFilter === '전체' ? APPROVAL_BOX_DOCS : APPROVAL_BOX_DOCS.filter((d) => d.status === (statusFilter === '진행' ? '진행중' : statusFilter))
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const v = (k: string) => visibleFields.includes(k)

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">결재 문서함</h1>
      <div className="flex items-center gap-2 mb-3">
        {['전체', '진행', '완료', '반려'].map((t) => (
          <button key={t} onClick={() => { setStatusFilter(t); setPage(1) }}
            className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${statusFilter === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <table className="w-full text-left text-[12px]">
        <thead><tr className="border-b border-gray-200">
          <th className="px-4 py-3 text-gray-500 font-medium w-10"><input type="checkbox" className="accent-[#1D9E75]" /></th>
          {v('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">기안일</th>}
          {v('completedDate') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">완료일</th>}
          {v('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
          {v('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
          {v('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
          {v('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
          {v('dept') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안부서</th>}
          {v('docNum') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">문서번호</th>}
          {v('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
        </tr></thead>
        <tbody>{paged.length === 0 ? <tr><td colSpan={10} className="py-20 text-center text-gray-300 text-[13px]">문서가 없습니다.</td></tr> : paged.map((d) => (
          <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="accent-[#1D9E75]" /></td>
            {v('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.date}</td>}
            {v('completedDate') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.completedDate || '-'}</td>}
            {v('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{d.form}</td>}
            {v('urgent') && <td className="px-4 py-3 whitespace-nowrap">{d.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}</td>}
            {v('title') && <td className="px-4 py-3 text-gray-900 font-medium">{d.title}</td>}
            {v('files') && <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{d.files > 0 && <><i className="fas fa-paperclip text-[10px]" /> {d.files}</>}</td>}
            {v('dept') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{d.dept}</td>}
            {v('docNum') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{d.docNum || '-'}</td>}
            {v('status') && <td className="px-4 py-3 text-right">{statusBadge(d.status)}</td>}
          </tr>
        ))}</tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <SearchBar />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={DRAFT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 참조/열람 문서함 ── */
export function CcViewBoxList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(CC_VIEW_FIELDS.map((f) => f.key))
  const [typeFilter, setTypeFilter] = useState('전체')
  const filtered = typeFilter === '전체' ? CC_VIEW_DOCS : CC_VIEW_DOCS.filter((d) => d.type === typeFilter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const v = (k: string) => visibleFields.includes(k)

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">참조/열람 문서함</h1>
      <div className="flex items-center gap-2 mb-3">
        {['전체', '참조', '열람'].map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
            className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${typeFilter === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <table className="w-full text-left text-[12px]">
        <thead><tr className="border-b border-gray-200">
          <th className="px-4 py-3 text-gray-500 font-medium w-10"><input type="checkbox" className="accent-[#1D9E75]" /></th>
          {v('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">기안일</th>}
          {v('completedDate') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">완료일</th>}
          {v('type') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">구분</th>}
          {v('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
          {v('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
          {v('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
          {v('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
          {v('author') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안자</th>}
          {v('docNum') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">문서번호</th>}
          {v('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
        </tr></thead>
        <tbody>{paged.length === 0 ? <tr><td colSpan={11} className="py-20 text-center text-gray-300 text-[13px]">문서가 없습니다.</td></tr> : paged.map((d) => (
          <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="accent-[#1D9E75]" /></td>
            {v('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.date}</td>}
            {v('completedDate') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.completedDate || '-'}</td>}
            {v('type') && <td className="px-4 py-3 whitespace-nowrap"><span className={`text-[11px] px-2 py-0.5 rounded font-medium ${d.type === '참조' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{d.type}</span></td>}
            {v('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{d.form}</td>}
            {v('urgent') && <td className="px-4 py-3 whitespace-nowrap">{d.urgent && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}</td>}
            {v('title') && <td className="px-4 py-3 text-gray-900 font-medium">{d.title}</td>}
            {v('files') && <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{d.files > 0 && <><i className="fas fa-paperclip text-[10px]" /> {d.files}</>}</td>}
            {v('author') && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{d.author}</td>}
            {v('docNum') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{d.docNum}</td>}
            {v('status') && <td className="px-4 py-3 text-right">{statusBadge(d.status)}</td>}
          </tr>
        ))}</tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <SearchBar options={['제목', '기안자', '문서번호']} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={CC_VIEW_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 발송 문서함 ── */
export function SentDocList({ title = '발송 문서함' }: { title?: string }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(SENT_FIELDS.map((f) => f.key))
  const [statusFilter, setStatusFilter] = useState('전체')
  const totalPages = 1
  const v = (k: string) => visibleFields.includes(k)

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">{title}</h1>
      <div className="flex items-center gap-2 mb-3">
        {['전체', '접수대기', '접수', '진행', '완료', '반려', '반송'].map((t) => (
          <button key={t} onClick={() => { setStatusFilter(t); setPage(1) }}
            className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${statusFilter === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <table className="w-full text-left text-[12px]">
        <thead><tr className="border-b border-gray-200">
          {v('date') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">기안일</th>}
          {v('completedDate') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">완료일</th>}
          {v('receivedDate') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">접수일</th>}
          {v('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
          {v('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
          {v('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
          {v('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
          {v('manager') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">담당자</th>}
          {v('sentDate') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">발송일</th>}
          {v('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
        </tr></thead>
        <tbody><tr><td colSpan={visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">문서가 없습니다.</td></tr></tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <SearchBar options={['제목', '담당자', '결재양식']} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={SENT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 수신 문서함 ── */
export function InboxDocList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(INBOX_FIELDS.map((f) => f.key))
  const [statusFilter, setStatusFilter] = useState('전체')
  const totalPages = 1
  const v = (k: string) => visibleFields.includes(k)

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">수신 문서함</h1>
      <div className="flex items-center gap-2 mb-3">
        {['전체', '접수대기', '접수', '진행', '완료', '반려', '반송'].map((t) => (
          <button key={t} onClick={() => { setStatusFilter(t); setPage(1) }}
            className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${statusFilter === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <table className="w-full text-left text-[12px]">
        <thead><tr className="border-b border-gray-200">
          <th className="px-4 py-3 text-gray-500 font-medium w-10"><input type="checkbox" className="accent-[#1D9E75]" /></th>
          {v('receivedDate') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">접수일</th>}
          {v('form') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">결재양식</th>}
          {v('urgent') && <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">긴급</th>}
          {v('title') && <th className="px-4 py-3 text-gray-500 font-medium">제목</th>}
          {v('files') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">첨부</th>}
          {v('author') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">기안자</th>}
          {v('lastApprover') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">최종 결재자</th>}
          {v('manager') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">담당자</th>}
          {v('docNum') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">문서번호</th>}
          {v('origNum') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">원문번호</th>}
          {v('status') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">결재상태</th>}
          {v('receiverDept') && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">수신부서</th>}
        </tr></thead>
        <tbody><tr><td colSpan={1 + visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">문서가 없습니다.</td></tr></tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <SearchBar options={['제목', '기안자', '문서번호']} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={INBOX_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}
