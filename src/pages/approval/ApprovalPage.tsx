import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import ApprovalFormModal, { type FormItem } from './ApprovalFormModal'
import ApprovalDocumentPage, { type TempSavedDoc } from './ApprovalDocumentPage'
import ApprovalHome from './components/ApprovalHome'
import {
  DocumentList, TempSavedList, WaitingDocList,
  CcViewDocList, UpcomingDocList, DraftDocList, ApprovalBoxList,
  CcViewBoxList, InboxDocList,
  DeptCompletedDocList, DeptReceivedDocList, DeptSentDocList,
  PersonalFolderDocList,
} from './components/DocumentLists'
import { ApprovalSettingsModal, PersonalBoxSettingsModal } from './components/ApprovalModals'
import type { PersonalFolder } from './components/approvalTypes'
import DeptBoxManageView from './components/DeptBoxManageView'
import PersonalBoxManageView from './components/PersonalBoxManageView'
import { approvalApi, type FormListResponse } from '../../api/approval'

/* ── 결재 사이드 메뉴 ── */
type ActiveView = '전자결재 홈' | '기안 완료 문서함' | '임시 저장함' | '결재 문서함' | '참조/열람 문서함' | '수신 문서함'
  | '결재 대기 문서' | '참조/열람 대기 문서' | '결재 예정 문서' | '결재 발신 문서'
  | '부서 문서함 관리' | '개인 문서함 관리'
  | '부서 기안완료 문서함' | '부서 결재 수신함' | '부서 결재 발신함'
  | '개인폴더'

const PERSONAL_MENU_ITEMS = [
  { label: '기안 완료 문서함' as const, countKey: 'draft' as const },
  { label: '임시 저장함' as const, countKey: 'temp' as const },
  { label: '결재 문서함' as const, countKey: 'approved' as const },
  { label: '참조/열람 문서함' as const, countKey: 'ccViewBox' as const },
  { label: '수신 문서함' as const, countKey: 'inbox' as const },
]

export default function ApprovalPage() {
  const location = useLocation()
  const [activeView, setActiveView] = useState<ActiveView>('전자결재 홈')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [frequentForms, setFrequentForms] = useState<FormListResponse[]>([])
  const [frequentEditMode, setFrequentEditMode] = useState(false)
  const [editingForm, setEditingForm] = useState<FormItem | null>(() => {
    const state = location.state as { openForm?: FormItem; viewDocId?: number } | null
    if (state?.openForm) {
      window.history.replaceState({}, '')
      return state.openForm
    }
    return null
  })
  const [tempSavedDocs, setTempSavedDocs] = useState<TempSavedDoc[]>([])
  const [editingTempDoc, setEditingTempDoc] = useState<TempSavedDoc | null>(null)
  const [viewDocId, setViewDocId] = useState<number | null>(() => {
    const state = location.state as { viewDocId?: number } | null
    if (state?.viewDocId) {
      window.history.replaceState({}, '')
      return state.viewDocId
    }
    return null
  })

  // location.state 변경 감지 (알림 클릭 등으로 같은 페이지 내에서 문서 열기)
  useEffect(() => {
    const state = location.state as { viewDocId?: number } | null
    if (state?.viewDocId) {
      setViewDocId(state.viewDocId)
      setEditingForm(null)
      window.history.replaceState({}, '')
    }
  }, [location.state])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [personalBoxSettingsOpen, setPersonalBoxSettingsOpen] = useState(false)
  const [personalFolders, setPersonalFolders] = useState<PersonalFolder[]>([])
  const [selectedPersonalFolder, setSelectedPersonalFolder] = useState<PersonalFolder | null>(null)

  // 사이드바 결재 건수
  const [menuCounts, setMenuCounts] = useState({
    waiting: 0, ccView: 0, upcoming: 0,
    draft: 0, temp: 0, approved: 0, ccViewBox: 0, inbox: 0,
  })

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

    // 사이드바 건수
    approvalApi.getDocumentCounts()
      .then(({ data }) => { if (!controller.signal.aborted) setMenuCounts(data) })
      .catch(() => { /* ignore */ })

    return () => { controller.abort() }
  }, [])

  // 탭 변경 시 건수 갱신
  useEffect(() => {
    approvalApi.getDocumentCounts()
      .then(({ data }) => setMenuCounts(data))
      .catch(() => { /* ignore */ })
  }, [activeView])

  const APPROVE_MENU = [
    { label: '결재 대기 문서' as const, count: menuCounts.waiting },
    { label: '참조/열람 대기 문서' as const, count: menuCounts.ccView },
    { label: '결재 예정 문서' as const, count: menuCounts.upcoming },
    { label: '결재 발신 문서' as const, count: 0 },
  ]

  // 임시저장 확인 모달
  const [tempSaveModalOpen, setTempSaveModalOpen] = useState(false)
  const [pendingView, setPendingView] = useState<{ view: ActiveView; folder?: PersonalFolder | null } | null>(null)

  // 문서 작성/편집 중인지 판별 (readOnly 조회가 아닌 editingForm 상태)
  const isEditing = editingForm !== null

  const navigateToView = (view: ActiveView, folder?: PersonalFolder | null) => {
    // 문서 조회 중이면 바로 닫기
    setViewDocId(null)

    // 문서 작성/편집 중이면 임시저장 확인 모달
    if (isEditing) {
      setPendingView({ view, folder: folder ?? null })
      setTempSaveModalOpen(true)
      return
    }

    setActiveView(view)
    if (folder !== undefined) setSelectedPersonalFolder(folder ?? null)
  }

  const handleTempSaveConfirm = () => {
    // 임시저장 버튼 트리거 — ApprovalDocumentPage의 handleTempSave를 호출하기 위해
    // tempSaveRef를 사용
    tempSaveRef.current?.()
    setTempSaveModalOpen(false)
    if (pendingView) {
      setEditingForm(null)
      setEditingTempDoc(null)
      setActiveView(pendingView.view)
      if (pendingView.folder !== undefined) setSelectedPersonalFolder(pendingView.folder ?? null)
      setPendingView(null)
    }
  }

  const handleTempSaveCancel = () => {
    setTempSaveModalOpen(false)
    setEditingForm(null)
    setEditingTempDoc(null)
    if (pendingView) {
      setActiveView(pendingView.view)
      if (pendingView.folder !== undefined) setSelectedPersonalFolder(pendingView.folder ?? null)
      setPendingView(null)
    }
  }

  const tempSaveRef = useRef<(() => void) | null>(null)

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
          <h2 className="text-[15px] font-bold text-[#000000] mb-3 cursor-pointer hover:text-[#1D9E75] transition-colors" onClick={() => navigateToView('전자결재 홈')}>전자결재</h2>
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
              onClick={() => navigateToView(item.label)}
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
              onClick={() => navigateToView('개인 문서함 관리')}
            >
              <span aria-hidden>⚙</span> 설정
            </button>
          </div>
          {PERSONAL_MENU_ITEMS.map((item) => (
            <div
              key={item.label}
              onClick={() => navigateToView(item.label as ActiveView)}
              className={`flex items-center justify-between py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                activeView === item.label
                  ? 'text-[#000000] font-medium bg-[#E1F5EE]'
                  : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
              }`}
            >
              <span>{item.label}</span>
              {menuCounts[item.countKey] > 0 && (
                <span className="text-[11px] font-bold text-[#000000]">{menuCounts[item.countKey]}</span>
              )}
            </div>
          ))}
          {personalFolders.map((f) => (
            <div
              key={f.id}
              onClick={() => navigateToView('개인폴더', f)}
              className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                activeView === '개인폴더' && selectedPersonalFolder?.id === f.id
                  ? 'text-[#000000] font-medium bg-[#E1F5EE]'
                  : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
              }`}
            >
              {f.name}
            </div>
          ))}
        </div>

        {/* 부서 문서함 */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-[#000000]">부서 문서함</span>
          </div>
          {['부서 기안완료 문서함', '부서 결재 수신함', '부서 결재 발신함'].map((item) => (
            <div
              key={item}
              onClick={() => navigateToView(item as ActiveView)}
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
          tempSaveRef={tempSaveRef}
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
          ) : activeView === '참조/열람 대기 문서' ? (
            <CcViewDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '결재 예정 문서' ? (
            <UpcomingDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '결재 발신 문서' ? (
            <DraftDocList title="결재 발신 문서" onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '기안 완료 문서함' ? (
            <DraftDocList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '결재 문서함' ? (
            <ApprovalBoxList onDocClick={(docId) => setViewDocId(docId)} />
          ) : activeView === '참조/열람 문서함' ? (
            <CcViewBoxList onDocClick={(docId) => setViewDocId(docId)} />
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
          ) : activeView === '개인폴더' && selectedPersonalFolder ? (
            <PersonalFolderDocList key={selectedPersonalFolder.id} folderId={selectedPersonalFolder.id} folderName={selectedPersonalFolder.name} onDocClick={(docId) => setViewDocId(docId)} />
          ) : (
            <DocumentList title={activeView} />
          )}
        </div>
      )}

      {/* 임시저장 확인 모달 */}
      {tempSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-[360px]">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">임시저장</h3>
            <p className="text-[13px] text-gray-600 mb-5">작성 중인 문서를 임시저장하시겠습니까?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleTempSaveCancel}
                className="px-4 py-2 text-[13px] border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                저장 안 함
              </button>
              <button
                onClick={handleTempSaveConfirm}
                className="px-4 py-2 text-[13px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a64]"
              >
                임시저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
