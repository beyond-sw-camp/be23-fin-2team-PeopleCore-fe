import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ApprovalFormModal, { FORM_FOLDERS } from './ApprovalFormModal'
import ApprovalDocumentPage, { type TempSavedDoc } from './ApprovalDocumentPage'

/* ── 결재 사이드 메뉴 ── */
const DEFAULT_FREQUENT_FORMS = ['지출결의', '경조금지급신청']

const APPROVE_MENU = [
  { label: '결재 대기 문서', count: 13 },
  { label: '결재 수신 문서', count: 0 },
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
]

type ActiveView = '전자결재 홈' | '기안 문서함' | '임시 저장함' | '결재 문서함' | '참조/열람 문서함' | '수신 문서함' | '발송 문서함'
  | '결재 대기 문서' | '결재 수신 문서' | '참조/열람 대기 문서' | '결재 예정 문서'

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

export default function ApprovalPage() {
  const location = useLocation()
  const [activeView, setActiveView] = useState<ActiveView>('전자결재 홈')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [frequentForms, setFrequentForms] = useState(DEFAULT_FREQUENT_FORMS)
  const [editingForm, setEditingForm] = useState<{ name: string; folder: string; retention: string } | null>(null)
  const [tempSavedDocs, setTempSavedDocs] = useState<TempSavedDoc[]>([])
  const [editingTempDoc, setEditingTempDoc] = useState<TempSavedDoc | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [personalBoxSettingsOpen, setPersonalBoxSettingsOpen] = useState(false)
  const [personalFolders, setPersonalFolders] = useState([
    { id: 1, name: '테스트', createdAt: '2025-07-09', docCount: 0, shared: 0 },
    { id: 2, name: '체험용 폴더', createdAt: '2025-09-17', docCount: 0, shared: 0 },
  ])

  // 다른 페이지에서 결재 양식을 선택하여 넘어온 경우
  useEffect(() => {
    const state = location.state as { openForm?: { name: string; folder: string; retention: string } } | null
    if (state?.openForm) {
      setEditingForm(state.openForm)
      // state 소비 후 제거 (뒤로가기 시 재실행 방지)
      window.history.replaceState({}, '')
    }
  }, [location.state])

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
      <ApprovalSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PersonalBoxSettingsModal
        isOpen={personalBoxSettingsOpen}
        onClose={() => setPersonalBoxSettingsOpen(false)}
        folders={personalFolders}
        onFoldersChange={setPersonalFolders}
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
              onClick={() => setPersonalBoxSettingsOpen(true)}
            >
              <span aria-hidden>⚙</span> 설정
            </button>
          </div>
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
          {personalFolders.map((f) => (
            <div
              key={f.id}
              className="py-1.5 px-2 text-[12px] text-[#000000] hover:text-[#000000] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors"
            >
              {f.name}
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

        {/* 전자결재 환경 설정 */}
        <div className="px-4 pt-3 pb-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2 text-[12px] text-[#000000] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors w-full"
          >
            <i className="fas fa-cog text-[10px] text-gray-500" />
            전자결재 환경 설정
          </button>
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
          ) : activeView === '결재 수신 문서' ? (
            <ReceivedDocList />
          ) : activeView === '참조/열람 대기 문서' ? (
            <CcViewDocList />
          ) : activeView === '결재 예정 문서' ? (
            <UpcomingDocList />
          ) : activeView === '기안 문서함' ? (
            <DraftDocList />
          ) : activeView === '결재 문서함' ? (
            <ApprovalBoxList />
          ) : activeView === '참조/열람 문서함' ? (
            <CcViewBoxList />
          ) : activeView === '발송 문서함' ? (
            <SentDocList />
          ) : activeView === '수신 문서함' ? (
            <InboxDocList />
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

/* ── 임시 저장함 필드 ── */
const TEMP_FIELDS = [
  { key: 'date', label: '생성일', desc: '임시 저장된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

/* ── 임시 저장함 ── */
function TempSavedList({ docs, onOpen, onDelete }: {
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
        fields={ALL_FIELDS}
        visibleFields={visibleFields}
        onClose={() => setFieldModalOpen(false)}
        onSave={(fields) => { setVisibleFields(fields); setFieldModalOpen(false) }}
      />
    </div>
  )
}

/* ── 필드 설정 모달 (공용) ── */
function FieldSettingsModal({ isOpen, fields, visibleFields, onClose, onSave }: {
  isOpen: boolean
  fields: { key: string; label: string; desc: string }[]
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
          {fields.map((field) => (
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

/* ── 결재 수신 문서 필드 ── */
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

/* ── 결재 수신 문서 목록 ── */
function ReceivedDocList() {
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
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">결재 수신 문서</h1>

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

/* ── 참조/열람 대기 문서 필드 ── */
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

/* ── 참조/열람 대기 문서 목록 ── */
function CcViewDocList() {
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

/* ── 결재 예정 문서 필드 ── */
const UPCOMING_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'dept', label: '기안부서', desc: '기안자가 소속된 부서가 표시됩니다.' },
]

/* ── 결재 예정 문서 목록 ── */
function UpcomingDocList() {
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

/* ══════════════════════════════════════════════
   공용 페이지네이션 + 검색
   ══════════════════════════════════════════════ */
function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
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

function SearchBar({ options }: { options?: string[] }) {
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

function ToolbarRow({ perPage, setPerPage, setPage, fieldModalOpen, children }: {
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

/* ══════════════════════════════════════════════
   개인 문서함 뷰들
   ══════════════════════════════════════════════ */

/* ── Mock: 기안 문서함 ── */
const DRAFT_BOX_DOCS = [
  { id: 501, date: '2026-03-19', completedDate: '2026-03-19', form: '사무용품신청', title: '사무용품신청', urgent: false, files: 0, dept: '경영', docNum: '', status: '완료' },
  { id: 502, date: '2026-03-18', completedDate: '', form: '휴가신청서', title: '휴가신청서', urgent: false, files: 0, dept: '경영', docNum: '', status: '진행중' },
  { id: 503, date: '2026-03-18', completedDate: '', form: '휴가신청서', title: '휴가신청서', urgent: false, files: 1, dept: '경영', docNum: '', status: '진행중' },
  { id: 504, date: '2026-03-12', completedDate: '2026-03-12', form: '휴가신청', title: '휴가신청', urgent: true, files: 2, dept: '경영', docNum: 'AP-2026-00144', status: '승인' },
  { id: 505, date: '2026-03-10', completedDate: '', form: '비자발급신청', title: '비자발급신청', urgent: false, files: 1, dept: '경영', docNum: '', status: '반려' },
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

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    '완료': 'bg-gray-100 text-gray-500', '승인': 'bg-blue-50 text-blue-600', '진행중': 'bg-[#E1F5EE] text-[#1D9E75]',
    '반려': 'bg-red-50 text-red-500', '임시저장': 'bg-yellow-50 text-yellow-600', '접수대기': 'bg-yellow-50 text-yellow-600', '접수': 'bg-[#E1F5EE] text-[#1D9E75]',
  }
  return <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

function DraftDocList() {
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
const APPROVAL_BOX_DOCS = [
  { id: 601, date: '2026-03-23', completedDate: '2026-03-23', form: '해외출장신청', title: '해외출장신청', urgent: true, files: 3, author: '김인재', dept: '경영', docNum: 'AP-2026-00150', status: '완료' },
  { id: 602, date: '2026-03-19', completedDate: '', form: '재직증명서', title: '재직증명서', urgent: false, files: 1, author: '김인재', dept: '경영', docNum: '', status: '반려' },
  { id: 603, date: '2026-03-10', completedDate: '2026-03-11', form: '교육결과보고', title: '교육결과보고', urgent: false, files: 0, author: '김인재', dept: '경영', docNum: 'AP-2026-00143', status: '완료' },
  { id: 604, date: '2026-03-05', completedDate: '', form: '업무기안', title: '기안문 작성 연습입니다.', urgent: true, files: 1, author: '김인재', dept: '경영', docNum: '', status: '반려' },
  { id: 605, date: '2026-02-12', completedDate: '', form: '휴직원', title: '휴직원', urgent: false, files: 0, author: '다다', dept: 'ONE TEAM', docNum: '', status: '진행중' },
]

function ApprovalBoxList() {
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
function CcViewBoxList() {
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

function SentDocList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(SENT_FIELDS.map((f) => f.key))
  const [statusFilter, setStatusFilter] = useState('전체')
  const totalPages = 1
  const v = (k: string) => visibleFields.includes(k)

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">발송 문서함</h1>
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

function InboxDocList() {
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

/* ── 전자결재 환경 설정 모달 ── */
function ApprovalSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('기본 설정')
  const [writeMode, setWriteMode] = useState('일반 작성')
  const [imageDisplay, setImageDisplay] = useState('thumbnail')
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const signInputRef = useRef<HTMLInputElement>(null)

  // 부재/위임 목록
  const [absences, setAbsences] = useState([
    { id: 1, startDate: '2025-08-27', endDate: '2025-08-27', delegate: '임고단', reason: '연차', active: true },
    { id: 2, startDate: '2025-06-23', endDate: '2025-06-23', delegate: '강희계', reason: 'dfgfdgfd', active: true },
  ])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [addAbsenceOpen, setAddAbsenceOpen] = useState(false)

  if (!isOpen) return null

  const tabs = ['기본 설정', '부재/위임 설정']

  const toggleAll = () => {
    if (absences.every((a) => checkedIds.has(a.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(absences.map((a) => a.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleDeleteAbsences = () => {
    setAbsences((prev) => prev.filter((a) => !checkedIds.has(a.id)))
    setCheckedIds(new Set())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[700px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">결재환경설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-[13px] transition-colors ${
                activeTab === t ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === '기본 설정' && (
            <div className="space-y-8">
              {/* 서명관리 */}
              <div>
                <h3 className="text-[13px] font-semibold text-blue-700 mb-4">서명관리</h3>
                <input
                  ref={signInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setSignatureUrl(url)
                    }
                    e.target.value = ''
                  }}
                />
                <div className="flex items-start gap-4">
                  <div className="inline-block border border-gray-300 rounded-lg p-4 text-center min-w-[100px]">
                    <div className="text-[11px] text-gray-500 mb-2">직위</div>
                    <div className="w-16 h-16 mx-auto rounded-full border-2 border-red-400 flex items-center justify-center mb-2 overflow-hidden">
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="서명" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-red-400 text-[12px] font-bold">승인</span>
                      )}
                    </div>
                    <div className="text-[12px] text-gray-700">이름</div>
                    <div className="text-[11px] text-gray-400 mt-1">결재일</div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => signInputRef.current?.click()}
                      className="px-3 py-1.5 text-[12px] border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <i className="fas fa-upload text-[10px] mr-1" /> 서명 업로드
                    </button>
                    {signatureUrl && (
                      <button
                        onClick={() => setSignatureUrl(null)}
                        className="px-3 py-1.5 text-[12px] border border-gray-300 rounded hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <i className="fas fa-trash-alt text-[10px] mr-1" /> 서명 삭제
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400">100 x 100 pixel 권장</p>
                  </div>
                </div>
              </div>

              {/* 결재 작성 방식 */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-6">
                  <span className="text-[13px] font-semibold text-gray-900 w-28">결재 작성 방식</span>
                  <select
                    value={writeMode}
                    onChange={(e) => setWriteMode(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                  >
                    <option>일반 작성</option>
                    <option>간편 작성</option>
                  </select>
                </div>
              </div>

              {/* 첨부 이미지 설정 */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-start gap-6">
                  <span className="text-[13px] font-semibold text-gray-900 w-28 pt-0.5">첨부 이미지 설정</span>
                  <div className="space-y-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="radio" name="imgDisplay" value="thumbnail" checked={imageDisplay === 'thumbnail'} onChange={() => setImageDisplay('thumbnail')} className="accent-[#1D9E75] mt-0.5" />
                      <div>
                        <span className="text-[12px] text-gray-900 font-medium">기본 사이즈로 표시</span>
                        <span className="text-[11px] text-gray-400 ml-1">(썸네일로 표시합니다. 100 x 100 pixel)</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="radio" name="imgDisplay" value="original" checked={imageDisplay === 'original'} onChange={() => setImageDisplay('original')} className="accent-[#1D9E75] mt-0.5" />
                      <div>
                        <span className="text-[12px] text-gray-900 font-medium">원본 사이즈로 표시</span>
                        <span className="text-[11px] text-gray-400 ml-1">(원본 크기로 표시합니다. 파일이 여러 개인 경우, 속도저하가 발생할 수 있습니다.)</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="radio" name="imgDisplay" value="filename" checked={imageDisplay === 'filename'} onChange={() => setImageDisplay('filename')} className="accent-[#1D9E75] mt-0.5" />
                      <div>
                        <span className="text-[12px] text-gray-900 font-medium">파일명으로 표시</span>
                        <span className="text-[11px] text-gray-400 ml-1">(파일 이름만 표시합니다.)</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === '부재/위임 설정' && (
            <div>
              {/* 부재 추가 / 삭제 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-[12px]">
                  <button onClick={() => setAddAbsenceOpen(true)} className="flex items-center gap-1 text-gray-600 hover:text-[#1D9E75] transition-colors">
                    <i className="fas fa-plus text-[10px]" /> 부재 추가
                  </button>
                  <button
                    onClick={handleDeleteAbsences}
                    disabled={checkedIds.size === 0}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-trash-alt text-[10px]" /> 삭제
                  </button>
                </div>
                <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
                  <option>20</option><option>10</option><option>50</option>
                </select>
              </div>

              {/* 테이블 */}
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2.5 text-gray-500 font-medium w-10">
                      <input type="checkbox" checked={absences.length > 0 && absences.every((a) => checkedIds.has(a.id))} onChange={toggleAll} className="accent-[#1D9E75]" />
                    </th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">부재 시작</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">부재 종료</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">대결자</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium">부재 사유</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">사용 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-300 text-[13px]">등록된 부재/위임 설정이 없습니다.</td></tr>
                  ) : (
                    absences.map((a) => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={checkedIds.has(a.id)} onChange={() => toggleOne(a.id)} className="accent-[#1D9E75]" />
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{a.startDate || '-'}</td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{a.endDate || '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600 whitespace-nowrap">{a.delegate || '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600">{a.reason || '-'}</td>
                        <td className="px-3 py-2.5 text-blue-600 whitespace-nowrap">{a.active ? '사용' : '미사용'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <AddAbsenceModal
                isOpen={addAbsenceOpen}
                onClose={() => setAddAbsenceOpen(false)}
                onConfirm={(a) => {
                  setAbsences((prev) => [...prev, { id: Date.now(), ...a, active: true }])
                  setAddAbsenceOpen(false)
                }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-6 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">저장</button>
          <button onClick={onClose} className="px-6 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
        </div>
      </div>
    </div>
  )
}

/* ── 부재 추가 모달 ── */
function AddAbsenceModal({ isOpen, onClose, onConfirm }: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { startDate: string; endDate: string; reason: string; delegate: string }) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')
  const [delegate, setDelegate] = useState('')
  const [orgPickerOpen, setOrgPickerOpen] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[600px] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">부재 추가</h2>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* 부재 기간 */}
          <div className="flex items-center">
            <span className="w-24 text-[13px] font-semibold text-blue-700 shrink-0">부재 기간</span>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
              <span className="text-gray-400">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
            </div>
          </div>

          {/* 부재 사유 */}
          <div className="flex items-start border-t border-gray-100 pt-5">
            <span className="w-24 text-[13px] font-semibold text-blue-700 shrink-0 pt-1">부재 사유</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
            />
          </div>

          {/* 대결자 */}
          <div className="flex items-center border-t border-gray-100 pt-5">
            <span className="w-24 text-[13px] font-semibold text-blue-700 shrink-0">대결자</span>
            {delegate ? (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-800">{delegate}</span>
                <button onClick={() => setDelegate('')} className="text-gray-400 hover:text-red-400 text-[11px]">
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOrgPickerOpen(true)}
                className="text-[12px] text-blue-600 hover:text-blue-800 transition-colors"
              >
                + 대결자 선택
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => onConfirm({ startDate, endDate, reason, delegate })}
            className="px-6 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors"
          >
            확인
          </button>
          <button onClick={onClose} className="px-6 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>

        {/* 대결자 선택 조직도 모달 */}
        {orgPickerOpen && (
          <OrgPickerModal
            onClose={() => setOrgPickerOpen(false)}
            onSelect={(name) => { setDelegate(name); setOrgPickerOpen(false) }}
          />
        )}
      </div>
    </div>
  )
}

/* ── 조직도 선택 모달 (대결자용) ── */
const PICKER_DEPARTMENTS = [
  { name: '경영', members: ['강희계 부장', '권시정 차장', '김인재 차장', '박지현 과장', '이수진 대리', '정하은 사원'] },
  { name: '개발', members: ['박서준 팀장', '이민호 과장', '최예린 대리', '한도윤 사원'] },
  { name: '인사', members: ['송미래 팀장', '윤서연 과장', '장현우 대리'] },
]

function OrgPickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (name: string) => void }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(PICKER_DEPARTMENTS.map((d) => [d.name, true]))
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[340px] max-h-[500px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-900">대결자 선택</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        <div className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mr-2 shrink-0">
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 검색"
              className="flex-1 text-[12px] outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 text-[12px]">
          {PICKER_DEPARTMENTS.map((dept) => {
            const filtered = dept.members.filter((m) => !search || m.includes(search))
            if (search && filtered.length === 0) return null
            return (
              <div key={dept.name}>
                <div
                  className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
                  onClick={() => setExpanded((prev) => ({ ...prev, [dept.name]: !prev[dept.name] }))}
                >
                  <span className="text-[10px] text-gray-500 w-3">{expanded[dept.name] ? '▼' : '▶'}</span>
                  <span className="font-semibold text-gray-700">{dept.name}</span>
                  <span className="text-gray-400 text-[11px] ml-1">{dept.members.length}</span>
                </div>
                {expanded[dept.name] && filtered.map((m) => (
                  <div
                    key={m}
                    className="flex items-center gap-2 py-1.5 pl-6 pr-2 cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors"
                    onClick={() => onSelect(m.split(' ')[0])}
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 shrink-0">
                      <i className="fas fa-user" />
                    </div>
                    <span className="text-gray-800">{m}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── 개인 문서함 관리 모달 ── */
interface PersonalFolder {
  id: number; name: string; createdAt: string; docCount: number; shared: number
}

function PersonalBoxSettingsModal({ isOpen, onClose, folders, onFoldersChange }: {
  isOpen: boolean; onClose: () => void
  folders: PersonalFolder[]; onFoldersChange: (folders: PersonalFolder[]) => void
}) {
  const [activeTab, setActiveTab] = useState('문서함')
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [reordering, setReordering] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  if (!isOpen) return null

  const toggleAll = () => {
    if (folders.every((f) => checkedIds.has(f.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(folders.map((f) => f.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleAdd = () => {
    const name = prompt('문서함 이름을 입력하세요')
    if (!name) return
    if (folders.some((f) => f.name === name)) {
      alert('이미 같은 이름의 문서함이 존재합니다.')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    onFoldersChange([...folders, { id: Date.now(), name, createdAt: today, docCount: 0, shared: 0 }])
  }

  const handleDelete = () => {
    onFoldersChange(folders.filter((f) => !checkedIds.has(f.id)))
    setCheckedIds(new Set())
  }

  const startEdit = (id: number, name: string) => { setEditingId(id); setEditName(name) }
  const saveEdit = (id: number) => {
    if (editName && !folders.some((f) => f.id !== id && f.name === editName)) {
      onFoldersChange(folders.map((f) => f.id === id ? { ...f, name: editName } : f))
    }
    setEditingId(null)
  }

  const moveRow = (from: number, to: number) => {
    if (to < 0 || to >= folders.length) return
    const updated = [...folders]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    onFoldersChange(updated)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDrop = (idx: number) => {
    if (dragIdx !== null && dragIdx !== idx) {
      moveRow(dragIdx, idx)
    }
    setDragIdx(null)
    setDragOverIdx(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[900px] max-h-[85vh] min-h-[500px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">개인 문서함 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex border-b border-gray-200 px-6">
          {['문서함', '자동분류'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-[13px] transition-colors ${activeTab === t ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === '문서함' ? (
            <div>
              <div className="flex items-center gap-4 text-[12px] text-gray-600 mb-4">
                <button
                  onClick={() => setReordering(!reordering)}
                  className={`flex items-center gap-1 transition-colors ${reordering ? 'text-[#1D9E75] font-semibold' : 'hover:text-[#1D9E75]'}`}
                >
                  <i className={`fas ${reordering ? 'fa-check' : 'fa-sort'} text-[10px]`} />
                  {reordering ? '순서 바꾸기 완료' : '순서 바꾸기'}
                </button>
                {!reordering && (
                  <>
                    <button onClick={handleAdd} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
                      <i className="fas fa-plus text-[10px]" /> 추가
                    </button>
                    <button onClick={handleDelete} disabled={checkedIds.size === 0}
                      className="flex items-center gap-1 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <i className="fas fa-trash-alt text-[10px]" /> 삭제
                    </button>
                    <button
                      disabled={checkedIds.size === 0}
                      onClick={() => setTransferOpen(true)}
                      className="flex items-center gap-1 hover:text-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-exchange-alt text-[10px]" /> 문서함 이관
                    </button>
                  </>
                )}
              </div>

              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {reordering && <th className="px-3 py-2.5 text-gray-500 font-medium w-16">순서</th>}
                    {!reordering && (
                      <th className="px-3 py-2.5 text-gray-500 font-medium w-10">
                        <input type="checkbox" checked={folders.length > 0 && folders.every((f) => checkedIds.has(f.id))} onChange={toggleAll} className="accent-[#1D9E75]" />
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-gray-500 font-medium">문서함 이름</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">생성일</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">문서 개수</th>
                    <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">설정</th>
                  </tr>
                </thead>
                <tbody>
                  {folders.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-300 text-[13px]">문서함이 없습니다.</td></tr>
                  ) : (
                    folders.map((f, idx) => (
                      <tr
                        key={f.id}
                        className={`border-b transition-colors ${
                          reordering && dragOverIdx === idx && dragIdx !== idx
                            ? 'border-t-2 border-t-[#1D9E75] bg-[#f0fdf8]'
                            : 'border-gray-100 hover:bg-gray-50'
                        } ${reordering ? 'cursor-grab' : ''} ${reordering && dragIdx === idx ? 'opacity-40' : ''}`}
                        draggable={reordering}
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                      >
                        {reordering ? (
                          <td className="px-3 py-2.5">
                            <i className="fas fa-grip-vertical text-[12px] text-gray-400 cursor-grab" />
                          </td>
                        ) : (
                          <td className="px-3 py-2.5">
                            <input type="checkbox" checked={checkedIds.has(f.id)} onChange={() => toggleOne(f.id)} className="accent-[#1D9E75]" />
                          </td>
                        )}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {editingId === f.id ? (
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => saveEdit(f.id)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(f.id) }}
                                autoFocus className="border border-[#1D9E75] rounded px-2 py-0.5 text-[12px] outline-none w-40" />
                            ) : (
                              <>
                                <span className="text-gray-800">{f.name}</span>
                                {!reordering && (
                                  <button onClick={() => startEdit(f.id, f.name)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <i className="fas fa-pen text-[9px]" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500 whitespace-nowrap">{f.createdAt}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{f.docCount}</td>
                        <td className="px-3 py-2.5 text-right"><span className="text-[11px] text-gray-500">공유 {f.shared}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {transferOpen && (
                <TransferModal
                  folderNames={folders.filter((f) => checkedIds.has(f.id)).map((f) => f.name)}
                  onClose={() => setTransferOpen(false)}
                  onConfirm={(targetName) => {
                    alert(`"${folders.filter((f) => checkedIds.has(f.id)).map((f) => f.name).join(', ')}" 문서함을 ${targetName}에게 이관했습니다.`)
                    onFoldersChange(folders.filter((f) => !checkedIds.has(f.id)))
                    setCheckedIds(new Set())
                    setTransferOpen(false)
                  }}
                />
              )}
            </div>
          ) : (
            <AutoClassifyTab />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 문서함 이관 모달 ── */
function TransferModal({ folderNames, onClose, onConfirm }: {
  folderNames: string[]
  onClose: () => void
  onConfirm: (targetName: string) => void
}) {
  const [target, setTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(PICKER_DEPARTMENTS.map((d) => [d.name, true]))
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[460px] max-h-[600px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">문서함 이관</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 text-[12px] text-gray-600">
          이관 대상: <span className="font-semibold text-gray-900">{folderNames.join(', ')}</span>
        </div>

        {/* 검색 */}
        <div className="px-6 py-2 border-b border-gray-200">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mr-2 shrink-0">
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 검색"
              className="flex-1 text-[12px] outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* 조직도 */}
        <div className="flex-1 overflow-y-auto p-3 text-[12px]">
          {PICKER_DEPARTMENTS.map((dept) => {
            const filtered = dept.members.filter((m) => !search || m.includes(search))
            if (search && filtered.length === 0) return null
            return (
              <div key={dept.name}>
                <div
                  className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
                  onClick={() => setExpanded((prev) => ({ ...prev, [dept.name]: !prev[dept.name] }))}
                >
                  <span className="text-[10px] text-gray-500 w-3">{expanded[dept.name] ? '▼' : '▶'}</span>
                  <span className="font-semibold text-gray-700">{dept.name}</span>
                  <span className="text-gray-400 text-[11px] ml-1">{dept.members.length}</span>
                </div>
                {expanded[dept.name] && filtered.map((m) => {
                  const name = m.split(' ')[0]
                  return (
                    <div
                      key={m}
                      className={`flex items-center gap-2 py-1.5 pl-6 pr-2 cursor-pointer rounded transition-colors ${
                        target === name ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setTarget(name)}
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 shrink-0">
                        <i className="fas fa-user" />
                      </div>
                      <span>{m}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* 선택된 대상 + 버튼 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-[12px] text-gray-500">
            {target ? <>이관 대상자: <span className="font-semibold text-gray-900">{target}</span></> : '사원을 선택하세요'}
          </div>
          <div className="flex gap-2">
            <button
              disabled={!target}
              onClick={() => { if (target) onConfirm(target) }}
              className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              이관
            </button>
            <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 자동분류 탭 ── */
function AutoClassifyTab() {
  const [enabled, setEnabled] = useState(true)
  const [rules, setRules] = useState<{ id: number; name: string; condition: string; folder: string }[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [reordering, setReordering] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const toggleAll = () => {
    if (rules.every((r) => checkedIds.has(r.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(rules.map((r) => r.id)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const [addRuleOpen, setAddRuleOpen] = useState(false)

  const moveRule = (from: number, to: number) => {
    if (to < 0 || to >= rules.length) return
    const updated = [...rules]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    setRules(updated)
  }

  const handleDelete = () => {
    setRules((prev) => prev.filter((r) => !checkedIds.has(r.id)))
    setCheckedIds(new Set())
  }

  return (
    <div>
      {/* 자동분류 규칙 on/off */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[13px] font-semibold text-blue-700">자동분류 규칙</span>
        <label className="flex items-center gap-1 text-[12px] text-gray-700 cursor-pointer">
          <input type="radio" name="autoClassify" checked={enabled} onChange={() => setEnabled(true)} className="accent-[#1D9E75]" />
          적용함
        </label>
        <label className="flex items-center gap-1 text-[12px] text-gray-700 cursor-pointer">
          <input type="radio" name="autoClassify" checked={!enabled} onChange={() => setEnabled(false)} className="accent-[#1D9E75]" />
          적용하지 않음
        </label>
      </div>

      {/* 저장/취소 */}
      <div className="flex justify-center gap-2 mb-6 border-b border-gray-100 pb-6">
        <button className="px-6 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">저장</button>
        <button className="px-6 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
      </div>

      {/* 툴바 */}
      <div className="flex items-center gap-4 text-[12px] text-gray-600 mb-4">
        <button
          onClick={() => setReordering(!reordering)}
          className={`flex items-center gap-1 transition-colors ${reordering ? 'text-[#1D9E75] font-semibold' : 'hover:text-[#1D9E75]'}`}
        >
          <i className={`fas ${reordering ? 'fa-check' : 'fa-sort'} text-[10px]`} />
          {reordering ? '순서 바꾸기 완료' : '순서 바꾸기'}
        </button>
        {!reordering && (
          <>
            <button onClick={() => setAddRuleOpen(true)} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
              <i className="fas fa-plus text-[10px]" /> 추가
            </button>
            <button onClick={handleDelete} disabled={checkedIds.size === 0}
              className="flex items-center gap-1 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <i className="fas fa-trash-alt text-[10px]" /> 삭제
            </button>
          </>
        )}
      </div>

      {/* 테이블 */}
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-gray-200">
            {reordering
              ? <th className="px-3 py-2.5 text-gray-500 font-medium w-12">순서</th>
              : <th className="px-3 py-2.5 text-gray-500 font-medium w-10"><input type="checkbox" checked={rules.length > 0 && rules.every((r) => checkedIds.has(r.id))} onChange={toggleAll} className="accent-[#1D9E75]" /></th>
            }
            <th className="px-3 py-2.5 text-gray-500 font-medium">분류규칙</th>
            <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">분류 조건</th>
            <th className="px-3 py-2.5 text-gray-500 font-medium text-right whitespace-nowrap">보관문서함</th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr><td colSpan={4} className="py-16 text-center text-gray-300 text-[13px]">분류규칙이 없습니다.</td></tr>
          ) : (
            rules.map((r, idx) => (
              <tr
                key={r.id}
                className={`border-b transition-colors ${
                  reordering && dragOverIdx === idx && dragIdx !== idx
                    ? 'border-t-2 border-t-[#1D9E75] bg-[#f0fdf8]'
                    : 'border-gray-100 hover:bg-gray-50'
                } ${reordering ? 'cursor-grab' : ''} ${reordering && dragIdx === idx ? 'opacity-40' : ''}`}
                draggable={reordering}
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
                onDrop={() => { if (dragIdx !== null && dragIdx !== idx) moveRule(dragIdx, idx); setDragIdx(null); setDragOverIdx(null) }}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
              >
                {reordering
                  ? <td className="px-3 py-2.5"><i className="fas fa-grip-vertical text-[12px] text-gray-400" /></td>
                  : <td className="px-3 py-2.5"><input type="checkbox" checked={checkedIds.has(r.id)} onChange={() => toggleOne(r.id)} className="accent-[#1D9E75]" /></td>
                }
                <td className="px-3 py-2.5 text-gray-800">{r.name}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{r.condition || '-'}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{r.folder || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {addRuleOpen && (
        <AutoClassifyRuleModal
          onClose={() => setAddRuleOpen(false)}
          onConfirm={(rule) => {
            const conditions: string[] = []
            if (rule.title) conditions.push(`제목: "${rule.title}"`)
            if (rule.formName) conditions.push(`양식: "${rule.formName}"`)
            if (rule.author) conditions.push(`기안자: "${rule.author}"`)
            if (rule.dept) conditions.push(`부서: "${rule.dept}"`)
            setRules((prev) => [...prev, {
              id: Date.now(),
              name: `${rule.sourceBox} 자동분류`,
              condition: conditions.join(', ') || '-',
              folder: rule.targetFolder,
            }])
            setAddRuleOpen(false)
          }}
        />
      )}
    </div>
  )
}

/* ── 자동분류 규칙 추가 모달 ── */
function AutoClassifyRuleModal({ onClose, onConfirm }: {
  onClose: () => void
  onConfirm: (rule: { sourceBox: string; title: string; formName: string; author: string; dept: string; targetFolder: string }) => void
}) {
  const [sourceBox, setSourceBox] = useState('기안 문서함')
  const [useTitle, setUseTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [useForm, setUseForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [useAuthor, setUseAuthor] = useState(false)
  const [author, setAuthor] = useState('')
  const [useDept, setUseDept] = useState(false)
  const [dept, setDept] = useState('')
  const [targetFolder, setTargetFolder] = useState('테스트')

  const folders = ['테스트', '체험용 폴더']
  const boxes = ['기안 문서함', '결재 문서함', '수신 문서함', '참조/열람 문서함']

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[400px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">자동분류</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 소스 문서함 */}
          <div className="flex items-center gap-2 text-[13px]">
            <select value={sourceBox} onChange={(e) => setSourceBox(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none bg-[#1D9E75] text-white">
              {boxes.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="text-gray-700">의 문서에</span>
          </div>

          {/* 제목 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useTitle} onChange={() => setUseTitle(!useTitle)} className="accent-[#1D9E75]" />
              제목이
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!useTitle}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 양식명 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useForm} onChange={() => setUseForm(!useForm)} className="accent-[#1D9E75]" />
              양식명이
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} disabled={!useForm}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 기안자 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useAuthor} onChange={() => setUseAuthor(!useAuthor)} className="accent-[#1D9E75]" />
              기안자가
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={!useAuthor}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 기안부서 */}
          <div>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useDept} onChange={() => setUseDept(!useDept)} className="accent-[#1D9E75]" />
              기안부서가
            </label>
            <div className="flex items-center gap-2 pl-5">
              <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} disabled={!useDept}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50 disabled:text-gray-300" />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">을(를) 포함 할 때</span>
            </div>
          </div>

          {/* 보관 문서함 */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[12px] font-semibold text-gray-700">해당 문서를 다음 문서함에 분류</span>
            <select value={targetFolder} onChange={(e) => setTargetFolder(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
              {folders.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* 안내 */}
          <div className="text-[11px] text-gray-400 space-y-1 pt-2">
            <p>※ 문서의 진행 상태가 완료된 것만 분류됩니다.</p>
            <p>※ 이미 수동으로 분류된 문서는 자동분류에 포함되지 않습니다.</p>
          </div>
        </div>

        <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => onConfirm({
              sourceBox,
              title: useTitle ? title : '',
              formName: useForm ? formName : '',
              author: useAuthor ? author : '',
              dept: useDept ? dept : '',
              targetFolder,
            })}
            className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors"
          >
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
