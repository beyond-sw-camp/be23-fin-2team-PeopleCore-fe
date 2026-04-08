import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ApprovalFormModal, { type FormItem } from './ApprovalFormModal'
import ApprovalDocumentPage, { type TempSavedDoc } from './ApprovalDocumentPage'
import ApprovalHome from './components/ApprovalHome'
import {
  DocumentList, TempSavedList, WaitingDocList, ReceivedDocList,
  CcViewDocList, UpcomingDocList, DraftDocList, ApprovalBoxList,
  CcViewBoxList, SentDocList, InboxDocList,
  DeptCompletedDocList, DeptReceivedDocList, DeptSentDocList,
} from './components/DocumentLists'
import { ApprovalSettingsModal, PersonalBoxSettingsModal } from './components/ApprovalModals'
import type { PersonalFolder } from './components/approvalTypes'
import DeptBoxManageView from './components/DeptBoxManageView'
import PersonalBoxManageView from './components/PersonalBoxManageView'
import { approvalApi, type FormListResponse } from '../../api/approval'

/* ── 결재 사이드 메뉴 ── */
type ActiveView = '전자결재 홈' | '기안 완료 문서함' | '임시 저장함' | '결재 문서함' | '참조/열람 문서함' | '수신 문서함' | '발송 문서함'
  | '결재 대기 문서' | '결재 수신 문서' | '참조/열람 대기 문서' | '결재 예정 문서' | '결재 발신 문서'
  | '부서 문서함 관리' | '개인 문서함 관리'
  | '부서 기안완료 문서함' | '부서 결재 수신함' | '부서 결재 발신함'

const PERSONAL_MENU = [
  '기안 완료 문서함',
  '임시 저장함',
  '결재 문서함',
  '참조/열람 문서함',
  '수신 문서함',
  '발송 문서함',
]

export default function ApprovalPage() {
  const location = useLocation()
  const [activeView, setActiveView] = useState<ActiveView>('전자결재 홈')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [frequentForms, setFrequentForms] = useState<FormListResponse[]>([])
  const [frequentEditMode, setFrequentEditMode] = useState(false)
  const [editingForm, setEditingForm] = useState<FormItem | null>(() => {
    const state = location.state as { openForm?: FormItem } | null
    if (state?.openForm) {
      window.history.replaceState({}, '')
      return state.openForm
    }
    return null
  })
  const [tempSavedDocs, setTempSavedDocs] = useState<TempSavedDoc[]>([])
  const [editingTempDoc, setEditingTempDoc] = useState<TempSavedDoc | null>(null)
  const [viewDocId, setViewDocId] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [personalBoxSettingsOpen, setPersonalBoxSettingsOpen] = useState(false)
  const [personalFolders, setPersonalFolders] = useState<PersonalFolder[]>([])

  // 사이드바 결재 건수
  const [menuCounts, setMenuCounts] = useState({ waiting: 0, received: 0, ccView: 0, upcoming: 0 })

  // 자주 쓰는 양식 + 개인 문서함 + 건수 로딩
  useEffect(() => {
    const controller = new AbortController()

    // 자주 쓰는 양식
    approvalApi.getFrequentForms()
      .then(({ data }) => { if (!controller.signal.aborted) setFrequentForms(data) })
      .catch(() => { /* ignore */ })

    // 개인 문서함
    approvalApi.getPersonalFolders()
      .then(({ data }) => { if (!controller.signal.aborted) setPersonalFolders(data.map((f) => ({ ...f, shared: 0 }))) })
      .catch(() => { /* ignore */ })

    // 사이드바 건수 (각 목록의 totalElements)
    Promise.all([
      approvalApi.getWaitingDocuments({ page: 0, size: 1 }),
      approvalApi.getReceivedDocuments({ page: 0, size: 1 }),
      approvalApi.getCcViewDocuments({ page: 0, size: 1 }),
      approvalApi.getUpcomingDocuments({ page: 0, size: 1 }),
    ]).then(([w, r, c, u]) => {
      if (!controller.signal.aborted) {
        setMenuCounts({
          waiting: w.data.totalElements,
          received: r.data.totalElements,
          ccView: c.data.totalElements,
          upcoming: u.data.totalElements,
        })
      }
    }).catch(() => { /* ignore */ })

    return () => { controller.abort() }
  }, [])

  const APPROVE_MENU = [
    { label: '결재 대기 문서' as const, count: menuCounts.waiting },
    { label: '결재 수신 문서' as const, count: menuCounts.received },
    { label: '참조/열람 대기 문서' as const, count: menuCounts.ccView },
    { label: '결재 예정 문서' as const, count: menuCounts.upcoming },
    { label: '결재 발신 문서' as const, count: 0 },
  ]

  const handleAddFrequent = async (formId: number) => {
    try {
      await approvalApi.addFrequentForm(formId)
      const { data } = await approvalApi.getFrequentForms()
      setFrequentForms(data)
    } catch {
      alert('자주 쓰는 양식 추가에 실패했습니다.')
    }
  }

  const handleRemoveFrequent = async (formId: number) => {
    try {
      await approvalApi.removeFrequentForm(formId)
      setFrequentForms((prev) => prev.filter((f) => f.formId !== formId))
    } catch {
      alert('자주 쓰는 양식 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ApprovalFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onConfirm={(form) => {
          setEditingTempDoc(null)
          setEditingForm(form)
          setFormModalOpen(false)
        }}
        onAddFrequent={handleAddFrequent}
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
          <h2 className="text-[15px] font-bold text-[#000000] mb-3 cursor-pointer hover:text-[#1D9E75] transition-colors" onClick={() => { setActiveView('전자결재 홈'); setEditingForm(null) }}>전자결재</h2>
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
          {frequentForms.map((form) => (
            <div
              key={form.formId}
              className="flex items-center justify-between py-1.5 px-2 text-[12px] text-[#000000] rounded hover:bg-[#E1F5EE] transition-colors group"
            >
              <span
                className={frequentEditMode ? '' : 'cursor-pointer flex-1'}
                onClick={() => {
                  if (frequentEditMode) return
                  setEditingTempDoc(null)
                  setEditingForm({
                    formId: form.formId,
                    name: form.formName,
                    folder: form.folderName,
                    retention: `${form.formRetentionYear}년`,
                  })
                }}
              >
                {form.formName}
              </span>
              {frequentEditMode && (
                <button
                  onClick={() => handleRemoveFrequent(form.formId)}
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
              onClick={() => { setActiveView(item.label); setEditingForm(null) }}
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
            <button
              type="button"
              className="text-[11px] text-[#000000] font-semibold hover:text-[#000000] transition-colors flex items-center gap-1"
              onClick={() => { setActiveView('부서 문서함 관리'); setEditingForm(null) }}
            >
              <span aria-hidden>⚙</span> 설정
            </button>
          </div>
          {['부서 기안완료 문서함', '부서 결재 수신함', '부서 결재 발신함'].map((item) => (
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
      {viewDocId ? (
        <ApprovalDocumentPage
          form={{ formId: 0, name: '', folder: '', retention: '' }}
          onBack={() => setViewDocId(null)}
          readOnly
          viewDocId={viewDocId}
        />
      ) : editingForm ? (
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
            <ApprovalHome onDocClick={(docId) => setViewDocId(docId)} />
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
            <WaitingDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '결재 수신 문서' ? (
            <ReceivedDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '참조/열람 대기 문서' ? (
            <CcViewDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '결재 예정 문서' ? (
            <UpcomingDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '결재 발신 문서' ? (
            <SentDocList title="결재 발신 문서" onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '기안 완료 문서함' ? (
            <DraftDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '결재 문서함' ? (
            <ApprovalBoxList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '참조/열람 문서함' ? (
            <CcViewBoxList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '발송 문서함' ? (
            <SentDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '수신 문서함' ? (
            <InboxDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '부서 문서함 관리' ? (
            <DeptBoxManageView />
          ) : activeView === '개인 문서함 관리' ? (
            <PersonalBoxManageView folders={personalFolders} onFoldersChange={(f) => setPersonalFolders(f)} />
          ) : activeView === '부서 기안완료 문서함' ? (
            <DeptCompletedDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '부서 결재 수신함' ? (
            <DeptReceivedDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '부서 결재 발신함' ? (
            <DeptSentDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : (
            <DocumentList title={activeView} />
          )}
        </div>
      )}
    </div>
  )
}
