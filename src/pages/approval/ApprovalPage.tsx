import { useState } from 'react'
import ApprovalFormModal, { FORM_FOLDERS } from './ApprovalFormModal'
import ApprovalDocumentPage, { type TempSavedDoc } from './ApprovalDocumentPage'

/* ── 결재 사이드 메뉴 ── */
const DEFAULT_FREQUENT_FORMS = ['지출결의', '경조금지급신청']

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
  | '결재 대기 문서' | '결재 수신 문서' | '공문 대기 문서' | '참조/열람 대기 문서' | '결재 예정 문서'

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

/* ── 결재 대기 Mock 데이터 (내가 결재해야 할 문서) ── */
const WAITING_DOCS = [
  { id: 101, date: '2026-03-28', form: '휴가신청', title: '연차 휴가 신청', urgent: true, author: '이수진 대리', dept: '경영', files: 0 },
  { id: 102, date: '2026-03-27', form: '지출결의', title: '3월 법인카드 정산', urgent: false, author: '박지현 과장', dept: '경영', files: 1 },
  { id: 103, date: '2026-03-27', form: '해외출장신청', title: '일본 출장 신청', urgent: true, author: '정하은 사원', dept: '경영', files: 2 },
  { id: 104, date: '2026-03-26', form: '채용요청', title: '프론트엔드 개발자 채용 요청', urgent: false, author: '박서준 팀장', dept: '개발', files: 0 },
  { id: 105, date: '2026-03-25', form: '교육수강신청', title: 'AWS 자격증 교육 수강', urgent: false, author: '최예린 대리', dept: '개발', files: 1 },
]

export default function ApprovalPage() {
  const [activeView, setActiveView] = useState<ActiveView>('전자결재 홈')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [frequentForms, setFrequentForms] = useState(DEFAULT_FREQUENT_FORMS)
  const [editingForm, setEditingForm] = useState<{ name: string; folder: string; retention: string } | null>(null)
  const [tempSavedDocs, setTempSavedDocs] = useState<TempSavedDoc[]>([])
  const [editingTempDoc, setEditingTempDoc] = useState<TempSavedDoc | null>(null)

  return (
    <div className="flex flex-1 overflow-hidden">
      <ApprovalFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onConfirm={(form) => {
          setEditingForm({ name: form.name, folder: form.folder, retention: form.retention })
          setFormModalOpen(false)
        }}
        onAddFrequent={(formName) => {
          setFrequentForms((prev) => prev.includes(formName) ? prev : [...prev, formName])
        }}
      />
      {/* ── 전자결재 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000] mb-3">전자결재</h2>
          <button
            onClick={() => setFormModalOpen(true)}
            className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] hover:text-[#000000] transition-colors"
          >
            새 결재 진행
          </button>
        </div>

        {/* 자주 쓰는 양식 */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#000000]">자주 쓰는 양식</span>
            <button
              type="button"
              className="text-[11px] text-[#000000] font-semibold hover:underline flex items-center gap-1"
              onClick={() => {
                // TODO: 자주 쓰는 양식 편집 화면 연결
              }}
            >
              <span aria-hidden>✎</span> 편집
            </button>
          </div>
          {frequentForms.map((formName) => (
            <div
              key={formName}
              className="py-1.5 px-2 text-[12px] text-[#000000] hover:text-[#000000] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors"
              onClick={() => {
                const found = FORM_FOLDERS.flatMap((f) => f.items).find((i) => i.name === formName)
                if (found) setEditingForm(found)
              }}
            >
              {formName}
            </div>
          ))}
        </div>

        {/* 결재하기 */}
        <div className="px-4 pt-3 pb-2">
          <span className="text-[12px] font-semibold text-[#000000] mb-1 block">결재하기</span>
          {APPROVE_MENU.map((item) => (
            <div
              key={item.label}
              onClick={() => { setActiveView(item.label as ActiveView); setEditingForm(null) }}
              className={`flex items-center justify-between py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                activeView === item.label
                  ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                  : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
              }`}
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className="text-[11px] font-bold text-[#000000]">{item.count}</span>
              )}
            </div>
          ))}
        </div>

        {/* 개인 문서함 */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-[#000000]">개인 문서함</span>
            <button
              type="button"
              className="text-[11px] text-[#000000] font-semibold hover:text-[#000000] transition-colors flex items-center gap-1"
              onClick={() => {
                // TODO: 개인 문서함 설정 화면 연결
              }}
            >
              <span aria-hidden>⚙</span> 설정
            </button>
          </div>
          <div className="text-[11px] text-[#000000] mb-1 px-2">─ &lt;기본 문서함&gt; ─</div>
          {PERSONAL_MENU.map((item) => (
            <div
              key={item}
              onClick={() => setActiveView(item as ActiveView)}
              className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                activeView === item
                  ? 'text-[#000000] font-medium bg-[#E1F5EE]'
                  : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* 부서 문서함 */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-[#000000]">부서 문서함</span>
            <button
              type="button"
              className="text-[11px] text-[#000000] font-semibold hover:text-[#000000] transition-colors flex items-center gap-1"
              onClick={() => {
                // TODO: 부서 문서함 설정 화면 연결
              }}
            >
              <span aria-hidden>⚙</span> 설정
            </button>
          </div>
          <div className="py-1.5 px-2 text-[12px] text-[#000000] hover:text-[#000000] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors">
            경영지원팀
          </div>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      {editingForm ? (
        <ApprovalDocumentPage
          form={editingForm}
          onBack={() => { setEditingForm(null); setEditingTempDoc(null) }}
          onTempSave={(doc) => {
            setTempSavedDocs((prev) => {
              const exists = prev.findIndex((d) => d.id === doc.id)
              if (exists >= 0) {
                const updated = [...prev]
                updated[exists] = doc
                return updated
              }
              return [doc, ...prev]
            })
          }}
          initialDocData={editingTempDoc?.docData}
          editingTempId={editingTempDoc?.id}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeView === '전자결재 홈' ? (
            <ApprovalHome />
          ) : activeView === '임시 저장함' ? (
            <TempSavedList
              docs={tempSavedDocs}
              onOpen={(doc) => {
                setEditingTempDoc(doc)
                setEditingForm(doc.form)
              }}
              onDelete={(id) => setTempSavedDocs((prev) => prev.filter((d) => d.id !== id))}
            />
          ) : activeView === '결재 대기 문서' ? (
            <WaitingDocList />
          ) : (
            <DocumentList title={activeView} />
          )}
        </div>
      )}
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

/* ── 임시 저장함 ── */
function TempSavedList({ docs, onOpen, onDelete }: {
  docs: TempSavedDoc[]
  onOpen: (doc: TempSavedDoc) => void
  onDelete: (id: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">임시 저장함</h1>
      </div>
      <div className="bg-white rounded-xl border border-[#d1d5db] shadow-sm overflow-hidden">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="px-5 py-3 font-semibold text-gray-700">저장일</th>
              <th className="px-5 py-3 font-semibold text-gray-700">결재양식</th>
              <th className="px-5 py-3 font-semibold text-gray-700">제목</th>
              <th className="px-5 py-3 font-semibold text-gray-700 text-right">상태</th>
              <th className="px-5 py-3 font-semibold text-gray-700 text-right">삭제</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="text-gray-300 text-[13px]">
                    <div className="text-3xl mb-2">📋</div>
                    임시 저장된 문서가 없습니다.
                  </div>
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-[#E1F5EE] cursor-pointer transition-colors"
                  onClick={() => onOpen(doc)}
                >
                  <td className="px-5 py-3 text-gray-700">{doc.savedAt}</td>
                  <td className="px-5 py-3 text-gray-600">{doc.form.name}</td>
                  <td className="px-5 py-3 text-gray-900 font-medium">{doc.form.name}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-block text-[11px] px-2.5 py-1 bg-yellow-50 text-yellow-600 font-semibold rounded-full">임시저장</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── 필드 목록 정의 ── */
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

/* ── 결재 대기 문서 목록 ── */
function WaitingDocList() {
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
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">결재 대기 문서</h1>

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
        visibleFields={visibleFields}
        onClose={() => setFieldModalOpen(false)}
        onSave={(fields) => { setVisibleFields(fields); setFieldModalOpen(false) }}
      />
    </div>
  )
}

/* ── 필드 설정 모달 ── */
function FieldSettingsModal({ isOpen, visibleFields, onClose, onSave }: {
  isOpen: boolean
  visibleFields: string[]
  onClose: () => void
  onSave: (fields: string[]) => void
}) {
  const [selected, setSelected] = useState(visibleFields)

  if (!isOpen) return null

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[440px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">필드 목록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="divide-y divide-gray-100">
          {ALL_FIELDS.map((field) => (
            <div key={field.key} className="flex items-start gap-3 px-6 py-3">
              <input
                type="checkbox"
                checked={selected.includes(field.key)}
                onChange={() => toggle(field.key)}
                className="accent-[#3b82f6] mt-0.5 w-4 h-4"
              />
              <div>
                <div className="text-[13px] font-semibold text-gray-800">{field.label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{field.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={() => onSave(selected)} className="px-5 py-1.5 bg-[#3b82f6] text-white text-[13px] font-medium rounded-md hover:bg-[#2563eb] transition-colors">
            확인
          </button>
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
