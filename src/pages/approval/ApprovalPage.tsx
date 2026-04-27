import { useState, useEffect } from 'react'
import ApprovalFormModal from './ApprovalFormModal'
import { type TempSavedDoc } from './ApprovalDocumentPage'
import { openApprovalWindow, subscribeApprovalCompleted } from '../../utils/approvalWindow'
import ApprovalHome from './components/ApprovalHome'
import {
  DocumentList, TempSavedList, WaitingDocList,
  CcViewDocList, UpcomingDocList, DraftDocList, ApprovalBoxList,
  CcViewBoxList, InboxDocList,
  DeptDocList,
  PersonalFolderDocList,
} from './components/DocumentLists'
import { ApprovalSettingsModal, PersonalBoxSettingsModal } from './components/ApprovalModals'
import type { PersonalFolder } from './components/approvalTypes'
import PersonalBoxManageView from './components/PersonalBoxManageView'
import { approvalApi, type FormListResponse } from '../../api/approval'

/* ── 결재 사이드 메뉴 ── */
type ActiveView = '전자결재 홈' | '기안 문서함' | '임시 저장함' | '결재 문서함' | '참조/열람 문서함' | '수신 문서함'
  | '결재 대기 문서' | '참조/열람 대기 문서' | '결재 예정 문서'
  | '개인 문서함 관리'
  | '부서 문서함'
  | '개인폴더'

const PERSONAL_MENU_ITEMS = [
  { label: '기안 문서함' as const, countKey: 'draft' as const },
  { label: '임시 저장함' as const, countKey: 'temp' as const },
  { label: '결재 문서함' as const, countKey: 'approved' as const },
  { label: '참조/열람 문서함' as const, countKey: 'ccViewBox' as const },
  { label: '수신 문서함' as const, countKey: 'inbox' as const },
]

export default function ApprovalPage() {
  const [activeView, setActiveView] = useState<ActiveView>('전자결재 홈')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [frequentForms, setFrequentForms] = useState<FormListResponse[]>([])
  const [frequentEditMode, setFrequentEditMode] = useState(false)
  const [tempSavedDocs, setTempSavedDocs] = useState<TempSavedDoc[]>([])
  // 결재 팝업 완료 → 사이드바 건수/목록 재조회용 신호
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [personalBoxSettingsOpen, setPersonalBoxSettingsOpen] = useState(false)
  const [personalFolders, setPersonalFolders] = useState<PersonalFolder[]>([])
  const [selectedPersonalFolder, setSelectedPersonalFolder] = useState<PersonalFolder | null>(null)

  // 사이드바 결재 건수
  const [menuCounts, setMenuCounts] = useState({
    waiting: 0, ccView: 0, upcoming: 0,
    draft: 0, temp: 0, approved: 0, ccViewBox: 0, inbox: 0,
    dept: 0,
    personalFolderCounts: {} as Record<string, number>,
  })

  // 자주 쓰는 양식 + 개인 문서함 (마운트 시 1회)
  useEffect(() => {
    const controller = new AbortController()

    approvalApi.getFrequentForms()
      .then(({ data }) => { if (!controller.signal.aborted) setFrequentForms(data) })
      .catch(() => { /* ignore */ })

    approvalApi.getPersonalFolders()
      .then(({ data }) => { if (!controller.signal.aborted) setPersonalFolders(data.map((f) => ({ ...f, shared: 0 }))) })
      .catch(() => { /* ignore */ })

    return () => { controller.abort() }
  }, [])

  // 사이드바 건수 (마운트 + 탭/refreshSignal 변경 시)
  useEffect(() => {
    approvalApi.getDocumentCounts()
      .then(({ data }) => setMenuCounts(data))
      .catch(() => { /* ignore */ })
  }, [activeView, refreshSignal])

  // 팝업에서 결재 완료/닫힘 신호 수신 → 건수 재조회 + 하위 목록 재마운트
  useEffect(() => {
    return subscribeApprovalCompleted((event) => {
      if (event.type === 'closed' || event.type === 'submitted' || event.type === 'tempsaved') {
        setRefreshSignal((n) => n + 1)
      }
    })
  }, [])

  const APPROVE_MENU = [
    { label: '결재 대기 문서' as const, count: menuCounts.waiting },
    { label: '참조/열람 대기 문서' as const, count: menuCounts.ccView },
    { label: '결재 예정 문서' as const, count: menuCounts.upcoming },
  ]

  const navigateToView = (view: ActiveView, folder?: PersonalFolder | null) => {
    setActiveView(view)
    if (folder !== undefined) setSelectedPersonalFolder(folder ?? null)
  }

  // 기안 작성 팝업 열기
  const openDraft = (openForm: { formId?: number; name?: string; folder?: string; retention?: string; formCode?: string }) => {
    openApprovalWindow({ openForm })
  }

  // 문서 조회 팝업 열기
  const openView = (docId: number) => {
    openApprovalWindow({ viewDocId: docId })
  }

  // 임시저장 문서 재열기 팝업
  const openTempSaved = (doc: TempSavedDoc) => {
    openApprovalWindow({
      openForm: {
        formId: doc.form.formId,
        name: doc.form.name,
        folder: doc.form.folder,
        retention: doc.form.retention,
        formCode: doc.form.formCode,
      },
      editingTempId: doc.id,
      initialDocData: doc.docData,
    })
  }

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
          setFormModalOpen(false)
          openDraft(form)
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
                  openDraft({
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
          {personalFolders.map((f) => {
            const folderCount = menuCounts.personalFolderCounts[String(f.id)] ?? 0
            return (
              <div
                key={f.id}
                onClick={() => navigateToView('개인폴더', f)}
                className={`flex items-center justify-between py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                  activeView === '개인폴더' && selectedPersonalFolder?.id === f.id
                    ? 'text-[#000000] font-medium bg-[#E1F5EE]'
                    : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
                }`}
              >
                <span>{f.name}</span>
                {folderCount > 0 && (
                  <span className="text-[11px] font-bold text-[#000000]">{folderCount}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* 부서 문서함 */}
        <div className="px-4 pt-3 pb-4">
          <div
            onClick={() => navigateToView('부서 문서함')}
            className={`flex items-center justify-between py-1.5 px-2 text-[12px] font-semibold cursor-pointer rounded transition-colors ${
              activeView === '부서 문서함'
                ? 'text-[#000000] bg-[#E1F5EE]'
                : 'text-[#000000] hover:bg-[#E1F5EE]'
            }`}
          >
            <span>부서 문서함</span>
            {menuCounts.dept > 0 && (
              <span className="text-[11px] font-bold text-[#000000]">{menuCounts.dept}</span>
            )}
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

      {/* ── 메인 콘텐츠 (문서 목록 뷰만 렌더. 기안/조회는 모두 팝업으로 분리) ── */}
      <div key={`list-${refreshSignal}`} className="flex-1 overflow-y-auto p-6 bg-white">
        {activeView === '전자결재 홈' ? (
          <ApprovalHome onDocClick={openView} />
        ) : activeView === '임시 저장함' ? (
          <TempSavedList
            docs={tempSavedDocs}
            onOpen={openTempSaved}
            onDelete={(id) => setTempSavedDocs((prev) => prev.filter((d) => d.id !== id))}
          />
        ) : activeView === '결재 대기 문서' ? (
          <WaitingDocList onDocClick={openView} />
        ) : activeView === '참조/열람 대기 문서' ? (
          <CcViewDocList onDocClick={openView} />
        ) : activeView === '결재 예정 문서' ? (
          <UpcomingDocList onDocClick={openView} />
        ) : activeView === '기안 문서함' ? (
          <DraftDocList onDocClick={openView} />
        ) : activeView === '결재 문서함' ? (
          <ApprovalBoxList onDocClick={openView} />
        ) : activeView === '참조/열람 문서함' ? (
          <CcViewBoxList onDocClick={openView} />
        ) : activeView === '수신 문서함' ? (
          <InboxDocList onDocClick={openView} />
        ) : activeView === '개인 문서함 관리' ? (
          <PersonalBoxManageView folders={personalFolders} onFoldersChange={(f) => setPersonalFolders(f)} />
        ) : activeView === '부서 문서함' ? (
          <DeptDocList onDocClick={openView} />
        ) : activeView === '개인폴더' && selectedPersonalFolder ? (
          <PersonalFolderDocList key={selectedPersonalFolder.id} folderId={selectedPersonalFolder.id} folderName={selectedPersonalFolder.name} onDocClick={openView} />
        ) : (
          <DocumentList title={activeView} />
        )}
      </div>
    </div>
  )
}
