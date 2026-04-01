import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import ApprovalFormModal, { FORM_FOLDERS } from './ApprovalFormModal'
import ApprovalDocumentPage, { type TempSavedDoc } from './ApprovalDocumentPage'
import ApprovalHome from './components/ApprovalHome'
import {
  DocumentList, TempSavedList, WaitingDocList, ReceivedDocList,
  CcViewDocList, UpcomingDocList, DraftDocList, ApprovalBoxList,
  CcViewBoxList, SentDocList, InboxDocList,
} from './components/DocumentLists'
import { ApprovalSettingsModal, PersonalBoxSettingsModal } from './components/ApprovalModals'
import type { PersonalFolder } from './components/approvalTypes'
import DeptBoxManageView from './components/DeptBoxManageView'
import PersonalBoxManageView from './components/PersonalBoxManageView'

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
  | '부서 문서함 관리' | '개인 문서함 관리'
  | '부서 결재 대기함' | '부서 결재 수신함' | '부서 결재 발신함'

export default function ApprovalPage() {
  const location = useLocation()
  const [activeView, setActiveView] = useState<ActiveView>('전자결재 홈')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [frequentForms, setFrequentForms] = useState(DEFAULT_FREQUENT_FORMS)
  const [frequentEditMode, setFrequentEditMode] = useState(false)
  const [editingForm, setEditingForm] = useState<{ name: string; folder: string; retention: string } | null>(() => {
    const state = location.state as { openForm?: { name: string; folder: string; retention: string } } | null
    if (state?.openForm) {
      window.history.replaceState({}, '')
      return state.openForm
    }
    return null
  })
  const [tempSavedDocs, setTempSavedDocs] = useState<TempSavedDoc[]>([])
  const [editingTempDoc, setEditingTempDoc] = useState<TempSavedDoc | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [personalBoxSettingsOpen, setPersonalBoxSettingsOpen] = useState(false)
  const [personalFolders, setPersonalFolders] = useState<PersonalFolder[]>([
    { id: 1, name: '테스트', createdAt: '2025-07-09', docCount: 0, shared: 0 },
    { id: 2, name: '체험용 폴더', createdAt: '2025-09-17', docCount: 0, shared: 0 },
  ])

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
              onClick={() => setFrequentEditMode((prev) => !prev)}
            >
              <span aria-hidden>✎</span> {frequentEditMode ? '완료' : '편집'}
            </button>
          </div>
          {frequentForms.map((formName) => (
            <div
              key={formName}
              className="flex items-center justify-between py-1.5 px-2 text-[12px] text-[#000000] rounded hover:bg-[#E1F5EE] transition-colors group"
            >
              <span
                className={frequentEditMode ? '' : 'cursor-pointer flex-1'}
                onClick={() => {
                  if (frequentEditMode) return
                  const found = FORM_FOLDERS.flatMap((f) => f.items).find((i) => i.name === formName)
                  if (found) setEditingForm(found)
                }}
              >
                {formName}
              </span>
              {frequentEditMode && (
                <button
                  onClick={() => setFrequentForms((prev) => prev.filter((n) => n !== formName))}
                  className="text-gray-400 hover:text-red-500 transition-colors text-[11px] ml-2"
                >
                  <i className="fas fa-times" />
                </button>
              )}
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
              onClick={() => { setActiveView('개인 문서함 관리'); setEditingForm(null) }}
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
            {/* TODO: 인사과 권한일 때만 표시 (백엔드 연결 시 권한 체크) */}
            <button
              type="button"
              className="text-[11px] text-[#000000] font-semibold hover:text-[#000000] transition-colors flex items-center gap-1"
              onClick={() => { setActiveView('부서 문서함 관리'); setEditingForm(null) }}
            >
              <span aria-hidden>⚙</span> 설정
            </button>
          </div>
          {['부서 결재 대기함', '부서 결재 수신함', '부서 결재 발신함'].map((item) => (
            <div
              key={item}
              onClick={() => { setActiveView(item as ActiveView); setEditingForm(null) }}
              className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                activeView === item
                  ? 'text-[#000000] font-medium bg-[#E1F5EE]'
                  : 'text-[#000000] hover:bg-[#E1F5EE]'
              }`}
            >
              {item}
            </div>
          ))}
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
          ) : activeView === '부서 문서함 관리' ? (
            <DeptBoxManageView />
          ) : activeView === '개인 문서함 관리' ? (
            <PersonalBoxManageView folders={personalFolders} onFoldersChange={setPersonalFolders} />
          ) : activeView === '부서 결재 대기함' ? (
            <WaitingDocList title="부서 결재 대기함" />
          ) : activeView === '부서 결재 수신함' ? (
            <ReceivedDocList title="부서 결재 수신함" />
          ) : activeView === '부서 결재 발신함' ? (
            <SentDocList title="부서 결재 발신함" />
          ) : (
            <DocumentList title={activeView} />
          )}
        </div>
      )}
    </div>
  )
}
