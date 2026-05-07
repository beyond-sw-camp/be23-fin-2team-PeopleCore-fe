import { useState, useEffect, useCallback, useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import type { Editor as TinyMCEEditor } from 'tinymce'

// TinyMCE를 npm 패키지에서 직접 로드 (public/tinymce/ 불필요)
import 'tinymce/tinymce'
import 'tinymce/models/dom/model'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'
// plugins
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/anchor'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/media'
import 'tinymce/plugins/table'
import 'tinymce/plugins/help'
import 'tinymce/plugins/wordcount'
// skin CSS — ?raw로 가져와서 <style>로 주입 (lightningcss 호환 문제 우회)
import skinCss from 'tinymce/skins/ui/oxide/skin.min.css?raw'
import contentCss from 'tinymce/skins/content/default/content.min.css?raw'
import contentUiCss from 'tinymce/skins/ui/oxide/content.min.css?raw'

// 스킨 CSS를 메인 페이지에 한 번만 주입
if (typeof document !== 'undefined' && !document.getElementById('tinymce-skin-css')) {
  const style = document.createElement('style')
  style.id = 'tinymce-skin-css'
  style.textContent = skinCss
  document.head.appendChild(style)
}
import mammoth from 'mammoth'
import OrgSelectModal from '../../../components/modals/OrgSelectModal'
import { approvalApi } from '../../../api/approval'
import { resolveApprovalFileUrl } from '../../../utils/approvalFileUrl'
import type {
  FormFolderResponse,
  FormListResponse,
  FormVersionResponse,
  FormDetailResponse,
  ApprovalDelegationResponse,
  ApprovalSignatureResponse,
} from '../../../api/approval'
import { departmentApi, employeeApi } from '../../../api/org'
import type { DepartmentTreeResponse, EmployeeListItem } from '../../../api/org'

type ApprovalSettingsView = 'form-manage' | 'delegation' | 'doc-number' | 'member-settings'

const APPROVAL_SETTING_MENUS: { key: ApprovalSettingsView; label: string }[] = [
  { key: 'form-manage', label: '결재 양식 관리' },
  { key: 'delegation', label: '결재 위임 정책' },
  { key: 'doc-number', label: '결재번호 규칙' },
  { key: 'member-settings', label: '사원 결재 환경 설정' },
]

/* ══════════════════════════════════════════════
   1. 결재 양식 관리
   ══════════════════════════════════════════════ */
function FormManageView() {
  const [folders, setFolders] = useState<FormFolderResponse[]>([])
  const [forms, setForms] = useState<FormListResponse[]>([])
  const [allForms, setAllForms] = useState<FormListResponse[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [checkedFormIds, setCheckedFormIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [batchOpen, setBatchOpen] = useState(false)

  // 순서바꾸기 (드래그 앤 드롭) 상태
  const [reorderMode, setReorderMode] = useState(false)
  const [reorderList, setReorderList] = useState<FormListResponse[]>([])
  const [reorderSubmitting, setReorderSubmitting] = useState(false)
  const dragItemRef = useRef<number | null>(null)
  const dragOverItemRef = useRef<number | null>(null)

  // 양식 추가/수정 모달 상태
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formModalMode, setFormModalMode] = useState<'add' | 'edit'>('add')
  const [formEditId, setFormEditId] = useState<number | null>(null)
  const [formModalData, setFormModalData] = useState({
    formName: '',
    formCode: '',
    formHtml: '',
    folderId: null as number | null,
    formWritePermission: 'ALL',
    formIsPublic: true,
    formRetentionYear: 5,
    formPreApprovalYn: false,
  })
  const [formModalError, setFormModalError] = useState('')
  const [formModalSubmitting, setFormModalSubmitting] = useState(false)
  const [, setFormModalFileName] = useState('')
  const [, setFormModalDragging] = useState(false)
  const [formEditTab, setFormEditTab] = useState<'edit' | 'preview'>('edit')
  const editorRef = useRef<TinyMCEEditor | null>(null)

  // 버전 이력 모달
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [versionTargetForm, setVersionTargetForm] = useState<FormListResponse | null>(null)
  const [versionList, setVersionList] = useState<FormVersionResponse[]>([])
  const [versionLoading, setVersionLoading] = useState(false)

  // 옛 버전 미리보기 모달
  const [versionPreviewOpen, setVersionPreviewOpen] = useState(false)
  const [versionPreviewLoading, setVersionPreviewLoading] = useState(false)
  const [versionPreviewData, setVersionPreviewData] = useState<FormDetailResponse | null>(null)

  // 롤백 확인 모달
  const [rollbackTarget, setRollbackTarget] = useState<FormVersionResponse | null>(null)
  const [rollbackSubmitting, setRollbackSubmitting] = useState(false)

  // 양식 수정 완료 모달
  const [updateSuccessVersion, setUpdateSuccessVersion] = useState<number | null>(null)

  const handleFormFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (!ext || !['html', 'htm', 'docx', 'hwp'].includes(ext)) {
      setFormModalError('.html, .docx, .hwp 파일만 업로드할 수 있습니다.')
      return
    }

    setFormModalFileName(file.name)
    setFormModalError('')

    try {
      if (ext === 'html' || ext === 'htm') {
        const text = await file.text()
        setFormModalData((p) => ({ ...p, formHtml: text }))
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (mammoth as any).convertToHtml({
          arrayBuffer,
          styleMap: [
            "p[style-name='Title'] => h1.form-title:fresh",
            "table => table.docx-table:fresh",
          ],
        })
        const wrapped = `<div class="docx-content">${result.value}</div>`
        setFormModalData((p) => ({ ...p, formHtml: wrapped }))
      } else if (ext === 'hwp') {
        const { Viewer } = await import('hwp.js')
        const arrayBuffer = await file.arrayBuffer()
        const container = document.createElement('div')
        container.style.position = 'absolute'
        container.style.left = '-9999px'
        document.body.appendChild(container)
        new Viewer(container, new Uint8Array(arrayBuffer), { type: 'array' })
        await new Promise((r) => setTimeout(r, 500))
        const html = container.innerHTML
        document.body.removeChild(container)
        const wrapped = `<div class="hwp-content">${html}</div>`
        setFormModalData((p) => ({ ...p, formHtml: wrapped }))
      }
    } catch (err) {
      console.error('파일 변환 실패:', err)
      setFormModalError('파일 변환에 실패했습니다. 파일을 확인해주세요.')
      setFormModalFileName('')
    }
  }

  // 폴더 추가/수정 상태
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderModalMode, setFolderModalMode] = useState<'add' | 'edit'>('add')
  const [folderModalName, setFolderModalName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null)

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [foldersRes, allFormsRes] = await Promise.all([
        approvalApi.getAllFormFolders(),
        approvalApi.getAdminForms(),
      ])
      setFolders(foldersRes.data)
      setAllForms(allFormsRes.data)
      if (!selectedFolderId && foldersRes.data.length > 0) {
        setSelectedFolderId(foldersRes.data[0].folderId)
      }
    } catch (err) {
      console.error('양식 데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedFolderId])

  useEffect(() => { loadData() }, [loadData])

  // 선택된 폴더의 양식 로드
  useEffect(() => {
    if (selectedFolderId == null) return
    approvalApi.getAdminForms(selectedFolderId)
      .then((res) => setForms(res.data))
      .catch((err) => console.error('양식 로드 실패:', err))
  }, [selectedFolderId])

  const findFolder = (list: FormFolderResponse[], id: number): FormFolderResponse | undefined => {
    for (const f of list) {
      if (f.folderId === id) return f
      if (f.children?.length) {
        const found = findFolder(f.children, id)
        if (found) return found
      }
    }
    return undefined
  }
  const selectedFolder = selectedFolderId != null ? findFolder(folders, selectedFolderId) : undefined
  const filteredForms = forms.filter((f) => !search || f.formName.includes(search))
  const allChecked = filteredForms.length > 0 && filteredForms.every((f) => checkedFormIds.has(f.formId))

  const toggleExpand = (id: number) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // 폴더 CRUD
  const handleAddFolder = () => {
    setFolderModalMode('add')
    setFolderModalName('')
    setFolderModalOpen(true)
  }

  const handleEditFolder = () => {
    if (!selectedFolder) return
    setFolderModalMode('edit')
    setEditingFolderId(selectedFolder.folderId)
    setFolderModalName(selectedFolder.folderName)
    setFolderModalOpen(true)
  }

  const handleFolderModalSubmit = async () => {
    try {
      if (folderModalMode === 'add') {
        await approvalApi.createFormFolder({ folderName: folderModalName, parentId: selectedFolderId })
      } else if (editingFolderId != null) {
        await approvalApi.updateFormFolder(editingFolderId, { folderName: folderModalName })
      }
      setFolderModalOpen(false)
      await loadData()
    } catch (err) {
      console.error('폴더 저장 실패:', err)
    }
  }

  const handleDeleteFolder = async () => {
    if (!selectedFolderId || !confirm('이 폴더를 삭제하시겠습니까?')) return
    try {
      await approvalApi.deleteFormFolder(selectedFolderId)
      setSelectedFolderId(null)
      await loadData()
    } catch (err) {
      console.error('폴더 삭제 실패:', err)
    }
  }

  // 폴더 노출 여부 변경
  const handleVisibilityChange = async (visible: boolean) => {
    if (!selectedFolderId) return
    try {
      await approvalApi.updateFormFolderVisibility(selectedFolderId, visible)
      await loadData()
    } catch (err) {
      console.error('노출 여부 변경 실패:', err)
    }
  }

  // 양식 추가 모달 열기
  const handleOpenFormAdd = () => {
    setFormModalMode('add')
    setFormEditId(null)
    setFormModalData({
      formName: '',
      formCode: '',
      formHtml: '',
      folderId: selectedFolderId,
      formWritePermission: 'ALL',
      formIsPublic: true,
      formRetentionYear: 5,
      formPreApprovalYn: false,
    })
    setFormModalError('')
    setFormModalFileName('')
    setFormEditTab('edit')
    setFormModalOpen(true)
  }

  // 양식 수정 모달 열기
  const handleOpenFormEdit = async () => {
    if (checkedFormIds.size !== 1) { alert('수정할 양식을 1개 선택하세요.'); return }
    const formId = [...checkedFormIds][0]
    const form = forms.find((f) => f.formId === formId)
    if (!form) return

    try {
      const editRes = await approvalApi.getFormEdit(formId)
      setFormModalMode('edit')
      setFormEditId(formId)
      setFormModalData({
        formName: form.formName,
        formCode: form.formCode,
        formHtml: editRes.data.formHtml,
        folderId: form.folderId,
        formWritePermission: form.formWritePermission,
        formIsPublic: form.formIsPublic,
        formRetentionYear: form.formRetentionYear,
        formPreApprovalYn: form.formPreApprovalYn,
      })
      setFormModalError('')
      setFormModalFileName('기존 파일 유지')
      setFormEditTab('edit')
      setFormModalOpen(true)
    } catch (err) {
      console.error('양식 상세 로드 실패:', err)
      alert('양식 정보를 불러오는데 실패했습니다.')
    }
  }

  // 양식 추가/수정 제출
  const handleFormModalSubmit = async () => {
    // 에디터에서 최신 HTML 가져오기
    const latestHtml = editorRef.current?.getContent() || formModalData.formHtml
    if (!formModalData.formName.trim()) { setFormModalError('양식명을 입력하세요.'); return }
    if (formModalMode === 'add' && !formModalData.formCode.trim()) { setFormModalError('양식 코드를 입력하세요.'); return }
    if (!latestHtml.trim()) { setFormModalError('양식 내용을 입력하세요.'); return }
    if (formModalMode === 'add' && !formModalData.folderId) { setFormModalError('소속 폴더를 선택하세요.'); return }

    try {
      setFormModalSubmitting(true)
      setFormModalError('')

      if (formModalMode === 'add') {
        await approvalApi.createForm({
          formName: formModalData.formName.trim(),
          formCode: formModalData.formCode.trim(),
          formHtml: latestHtml,
          folderId: formModalData.folderId!,
          formWritePermission: formModalData.formWritePermission,
          formIsPublic: formModalData.formIsPublic,
          formRetentionYear: formModalData.formRetentionYear,
          formPreApprovalYn: formModalData.formPreApprovalYn,
        })
      } else {
        const res = await approvalApi.updateForm(formEditId!, {
          formName: formModalData.formName.trim(),
          formHtml: latestHtml,
          formWritePermission: formModalData.formWritePermission,
          formIsPublic: formModalData.formIsPublic,
          formRetentionYear: formModalData.formRetentionYear,
          formPreApprovalYn: formModalData.formPreApprovalYn,
        })
        setUpdateSuccessVersion(res.data.formVersion)
      }

      setFormModalOpen(false)
      setCheckedFormIds(new Set())
      await loadData()
      if (selectedFolderId) {
        const res = await approvalApi.getAdminForms(selectedFolderId)
        setForms(res.data)
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.response?.data || (formModalMode === 'add' ? '양식 추가에 실패했습니다.' : '양식 수정에 실패했습니다.')
      // 백엔드가 붙이는 " - formId=…, formCode=…" 꼬리표 제거
      const msg = typeof raw === 'string' ? raw.split(' - ')[0].trim() : '양식 저장에 실패했습니다.'
      setFormModalError(msg)
    } finally {
      setFormModalSubmitting(false)
    }
  }

  // 양식 사용여부 토글 (활성화 / 비활성화)
  const handleToggleFormActive = async (form: FormListResponse) => {
    if (form.isProtected) return
    try {
      await approvalApi.toggleFormActive(form.formId, !form.isActive)
      if (selectedFolderId) {
        const res = await approvalApi.getAdminForms(selectedFolderId)
        setForms(res.data)
      }
      const allRes = await approvalApi.getAdminForms()
      setAllForms(allRes.data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.response?.data
      const msg = typeof raw === 'string' ? raw.split(' - ')[0].trim() : '양식 사용여부 변경에 실패했습니다.'
      console.error('양식 사용여부 변경 실패:', err)
      alert(msg)
    }
  }

  // 양식 삭제
  const handleDeleteForm = async () => {
    if (checkedFormIds.size === 0) return
    if (!confirm(`선택한 ${checkedFormIds.size}개 양식을 삭제하시겠습니까?`)) return
    try {
      await Promise.all([...checkedFormIds].map((id) => approvalApi.deleteForm(id)))
      setCheckedFormIds(new Set())
      if (selectedFolderId) {
        const res = await approvalApi.getAdminForms(selectedFolderId)
        setForms(res.data)
      }
    } catch (err) {
      console.error('양식 삭제 실패:', err)
    }
  }

  // 순서바꾸기 (드래그 앤 드롭)
  const handleToggleReorder = () => {
    if (!reorderMode) {
      if (forms.length === 0) { alert('양식이 없습니다.'); return }
      setReorderList([...forms].sort((a, b) => a.formSortOrder - b.formSortOrder))
      setReorderMode(true)
    } else {
      setReorderMode(false)
    }
  }

  const handleDragStart = (index: number) => {
    dragItemRef.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index
    if (dragItemRef.current === null || dragItemRef.current === index) return
    const newList = [...reorderList]
    const dragItem = newList[dragItemRef.current]
    newList.splice(dragItemRef.current, 1)
    newList.splice(index, 0, dragItem)
    dragItemRef.current = index
    setReorderList(newList)
  }

  const handleDragEnd = () => {
    dragItemRef.current = null
    dragOverItemRef.current = null
  }

  const handleReorderSave = async () => {
    try {
      setReorderSubmitting(true)
      const orderList = reorderList.map((f, i) => ({ formId: f.formId, formSortOrder: i + 1 }))
      await approvalApi.reorderForms(orderList)
      setReorderMode(false)
      if (selectedFolderId) {
        const res = await approvalApi.getAdminForms(selectedFolderId)
        setForms(res.data)
      }
    } catch (err) {
      console.error('순서 변경 실패:', err)
      alert('순서 변경에 실패했습니다.')
    } finally {
      setReorderSubmitting(false)
    }
  }

  // 버전 이력 열기
  const handleOpenVersionHistory = async (form: FormListResponse) => {
    setVersionTargetForm(form)
    setVersionList([])
    setVersionModalOpen(true)
    setVersionLoading(true)
    try {
      const res = await approvalApi.getFormVersions(form.formId)
      setVersionList(res.data)
    } catch (err) {
      console.error('버전 이력 로드 실패:', err)
      alert('버전 이력을 불러오지 못했습니다.')
    } finally {
      setVersionLoading(false)
    }
  }

  // 옛 버전 미리보기
  const handleOpenVersionPreview = async (formId: number) => {
    setVersionPreviewOpen(true)
    setVersionPreviewLoading(true)
    setVersionPreviewData(null)
    try {
      const res = await approvalApi.getFormVersionPreview(formId)
      setVersionPreviewData(res.data)
    } catch (err) {
      console.error('미리보기 로드 실패:', err)
      alert('미리보기를 불러오지 못했습니다.')
      setVersionPreviewOpen(false)
    } finally {
      setVersionPreviewLoading(false)
    }
  }

  // 롤백 실행
  const handleRollbackConfirm = async () => {
    if (!rollbackTarget) return
    try {
      setRollbackSubmitting(true)
      await approvalApi.rollbackFormVersion(rollbackTarget.formId)
      const target = rollbackTarget
      setRollbackTarget(null)
      setVersionPreviewOpen(false)
      // 이력 모달은 유지하고 목록만 갱신
      if (versionTargetForm) {
        const res = await approvalApi.getFormVersions(versionTargetForm.formId)
        setVersionList(res.data)
      }
      // 양식 목록 갱신 (현재 버전이 바뀌었으므로)
      if (selectedFolderId) {
        const res = await approvalApi.getAdminForms(selectedFolderId)
        setForms(res.data)
      }
      const allRes = await approvalApi.getAdminForms()
      setAllForms(allRes.data)
      alert(`v${target.formVersion}으로 되돌렸습니다.`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.response?.data
      const msg = typeof raw === 'string' ? raw.split(' - ')[0].trim() : '롤백에 실패했습니다.'
      console.error('롤백 실패:', err)
      alert(msg)
    } finally {
      setRollbackSubmitting(false)
    }
  }

  // 폴더 트리 렌더링 (재귀)
  const renderFolderTree = (folderList: FormFolderResponse[], depth = 0) => {
    return folderList.map((folder) => (
      <div key={folder.folderId} style={{ marginLeft: depth * 8 }}>
        <div
          className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer select-none transition-colors ${
            selectedFolderId === folder.folderId ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => { setSelectedFolderId(folder.folderId); setCheckedFormIds(new Set()) }}
        >
          <span className="text-[10px] text-gray-400 w-3 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); toggleExpand(folder.folderId) }}>
            {folder.children?.length > 0 ? (expandedFolderIds.has(folder.folderId) ? '▼' : '▶') : ''}
          </span>
          <span>{folder.folderName}</span>
          {folder.folderIsVisible
            ? <i className="fas fa-eye text-[9px] text-[#1D9E75] ml-1" title="정상" />
            : <i className="fas fa-eye-slash text-[9px] text-gray-400 ml-1" title="숨김" />}
        </div>
        {expandedFolderIds.has(folder.folderId) && folder.children?.length > 0 && renderFolderTree(folder.children, depth + 1)}
      </div>
    ))
  }

  if (loading) return <div className="text-center text-gray-400 py-12">로딩 중...</div>

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-5">결재 양식</h3>
      <div className="border border-gray-200 rounded-xl p-5">
        <h4 className="text-[14px] font-bold text-gray-800 mb-4">결재 양식 관리</h4>
        <div className="flex gap-6">
          {/* 왼쪽: 폴더 트리 */}
          <div className="w-[260px] shrink-0">
            <h5 className="text-[13px] font-semibold text-gray-800 mb-3">결재양식 폴더 목록</h5>
            <div className="flex items-center gap-1 mb-3">
              <button onClick={handleAddFolder} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">폴더 추가</button>
              <button onClick={handleEditFolder} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">수정</button>
              <button onClick={handleDeleteFolder} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors text-red-500">삭제</button>
            </div>
            <div className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b border-gray-100">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="양식 제목을 입력하세요." className="text-[11px] outline-none bg-transparent w-full placeholder-gray-400" />
              </div>
              <div className="p-2 text-[12px] max-h-[400px] overflow-y-auto">
                <div className="flex items-center gap-1 py-1 px-1 text-gray-700 font-semibold select-none">PeopleCore</div>
                {renderFolderTree(folders)}
              </div>
            </div>
          </div>

          {/* 오른쪽: 선택된 폴더의 양식 목록 */}
          <div className="flex-1">
            <h5 className="text-[13px] font-semibold text-gray-800 mb-3">{selectedFolder?.folderName ?? '폴더를 선택하세요'}</h5>
            {selectedFolder && (
              <>
                {/* 폴더 노출 여부 */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[12px] text-gray-500">폴더 노출 여부</span>
                  <label className="flex items-center gap-1 text-[12px] cursor-pointer">
                    <input type="radio" name="folderVisible" checked={selectedFolder.folderIsVisible} onChange={() => handleVisibilityChange(true)} className="accent-[#1D9E75]" /> 정상
                  </label>
                  <label className="flex items-center gap-1 text-[12px] cursor-pointer">
                    <input type="radio" name="folderVisible" checked={!selectedFolder.folderIsVisible} onChange={() => handleVisibilityChange(false)} className="accent-[#1D9E75]" /> 숨김
                  </label>
                </div>

                {/* 양식 툴바 */}
                <div className="flex items-center gap-1 mb-3">
                  <button onClick={handleOpenFormAdd} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">양식 추가</button>
                  <button onClick={handleOpenFormEdit} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">양식 수정</button>
                  <button onClick={handleDeleteForm} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors text-red-500">양식 삭제</button>
                  <button onClick={handleToggleReorder} className={`px-2.5 py-1 text-[11px] border rounded transition-colors ${reorderMode ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {reorderMode ? '순서바꾸기 취소' : '순서바꾸기'}
                  </button>
                  {reorderMode && (
                    <button onClick={handleReorderSave} disabled={reorderSubmitting}
                      className="px-2.5 py-1 text-[11px] bg-[#1D9E75] text-white rounded hover:bg-[#178a65] transition-colors disabled:opacity-50">
                      {reorderSubmitting ? '저장 중...' : '순서 저장'}
                    </button>
                  )}
                  <button onClick={() => setBatchOpen(true)} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">일괄설정</button>
                </div>

                {/* 양식 테이블 */}
                {reorderMode && (
                  <p className="text-[11px] text-[#1D9E75] mb-2"><i className="fas fa-info-circle mr-1" />양식을 드래그하여 순서를 변경한 뒤 &quot;순서 저장&quot;을 눌러주세요.</p>
                )}
                <table className="w-full text-[12px]">
                  <thead><tr className="border-b-2 border-gray-900">
                    {reorderMode && <th className="px-2 py-2.5 w-8"></th>}
                    {!reorderMode && (
                      <th className="px-3 py-2.5 w-8">
                        <input type="checkbox" checked={allChecked} onChange={() => {
                          if (allChecked) setCheckedFormIds(new Set())
                          else setCheckedFormIds(new Set(filteredForms.map((f) => f.formId)))
                        }} className="accent-[#1D9E75]" />
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">제목</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">양식코드</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">버전</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용여부</th>
                  </tr></thead>
                  <tbody>
                    {reorderMode ? (
                      reorderList.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-[13px]">양식이 없습니다.</td></tr>
                      ) : reorderList.map((form, idx) => (
                        <tr key={form.formId}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragEnter={() => handleDragEnter(idx)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          className="border-b border-gray-100 hover:bg-[#E1F5EE] transition-colors cursor-grab active:cursor-grabbing"
                        >
                          <td className="px-2 py-2.5 text-center text-gray-400"><i className="fas fa-grip-vertical" /></td>
                          <td className="px-3 py-2.5 text-[#1D9E75] font-medium">{form.formName}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">{form.formCode}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">v{form.formVersion}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${form.isActive ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-100 text-gray-400'}`}>
                              {form.isActive ? '사용' : '미사용'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredForms.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-[13px]">양식이 없습니다.</td></tr>
                      ) : filteredForms.map((form) => (
                        <tr key={form.formId} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!form.isActive ? 'opacity-60' : ''}`}>
                          <td className="px-3 py-2.5">
                            <input type="checkbox" checked={checkedFormIds.has(form.formId)}
                              onChange={() => setCheckedFormIds((prev) => {
                                const n = new Set(prev); if (n.has(form.formId)) n.delete(form.formId); else n.add(form.formId); return n
                              })} className="accent-[#1D9E75]" />
                          </td>
                          <td className="px-3 py-2.5 text-[#1D9E75] font-medium cursor-pointer hover:underline">{form.formName}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">{form.formCode}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button type="button" onClick={() => handleOpenVersionHistory(form)}
                              className="text-[#1D9E75] hover:underline font-medium"
                              title="버전 이력 보기">
                              v{form.formVersion}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={form.isActive}
                              disabled={form.isProtected}
                              onClick={() => handleToggleFormActive(form)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isActive ? 'bg-[#1D9E75]' : 'bg-gray-300'} ${form.isProtected ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={form.isProtected ? '보호 양식 (변경 불가)' : (form.isActive ? '사용 중 (클릭 시 미사용 처리)' : '미사용 (클릭 시 활성화)')}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 폴더 추가/수정 모달 */}
      {folderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setFolderModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(400px,calc(100vw-24px))] p-6">
            <h2 className="text-[16px] font-bold text-gray-900 mb-4">{folderModalMode === 'add' ? '폴더 추가' : '폴더 수정'}</h2>
            <input value={folderModalName} onChange={(e) => setFolderModalName(e.target.value)}
              placeholder="폴더명을 입력하세요" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-[#1D9E75] mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={handleFolderModalSubmit} className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">
                {folderModalMode === 'add' ? '추가' : '저장'}
              </button>
              <button onClick={() => setFolderModalOpen(false)} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄설정 모달 */}
      {batchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setBatchOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[95vw] max-w-[min(1200px,calc(100vw-24px))] max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">일괄설정</h2>
              <button onClick={() => setBatchOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="w-full text-[11px] whitespace-nowrap">
                <thead><tr className="border-b-2 border-gray-900">
                  <th className="px-2 py-2.5 text-left text-gray-700 font-medium sticky left-0 bg-white min-w-[250px]">제목</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">전결 옵션</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">보존연한</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">사용여부</th>
                </tr></thead>
                <tbody>
                  {allForms.map((f, idx) => (
                    <tr key={f.formId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-2.5 text-gray-800 sticky left-0 bg-white font-medium">
                        {f.folderName} &gt; {f.formName}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.formPreApprovalYn}
                            onChange={() => setAllForms((p) => p.map((s, i) => i === idx ? { ...s, formPreApprovalYn: !s.formPreApprovalYn } : s))}
                            className="accent-[#1D9E75]" />
                          <span>{f.formPreApprovalYn ? '사용' : '미사용'}</span>
                        </label>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <select value={f.formRetentionYear}
                          onChange={(e) => setAllForms((p) => p.map((s, i) => i === idx ? { ...s, formRetentionYear: Number(e.target.value) } : s))}
                          className="border border-gray-300 rounded px-1 py-0.5 text-[11px] outline-none">
                          {[1, 3, 5, 10, 30].map((y) => <option key={y} value={y}>{y}년</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className={`inline-flex items-center gap-1 ${f.isProtected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                          <input type="checkbox" checked={f.isActive}
                            disabled={f.isProtected}
                            onChange={() => setAllForms((p) => p.map((s, i) => i === idx ? { ...s, isActive: !s.isActive } : s))}
                            className="accent-[#1D9E75]" />
                          <span>{f.isActive ? '사용' : '미사용'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={async () => {
                try {
                  await approvalApi.batchUpdateForms({
                    forms: allForms.map((f) => ({
                      formId: f.formId,
                      formIsPublic: f.formIsPublic,
                      formPreApprovalYn: f.formPreApprovalYn,
                      formWritePermission: f.formWritePermission,
                      formRetentionYear: f.formRetentionYear,
                    })),
                  })
                  setBatchOpen(false)
                  await loadData()
                } catch (err) { console.error('일괄설정 저장 실패:', err) }
              }} className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">확인</button>
              <button onClick={() => setBatchOpen(false)} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 양식 추가/수정 — 전체 화면 */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          {/* 상단 헤더 */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
            <h2 className="text-[16px] font-bold text-gray-900">{formModalMode === 'add' ? '양식 추가' : '양식 수정'}</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFormEditTab('edit')}
                className={`px-3 py-1.5 text-[12px] rounded border transition-colors ${formEditTab === 'edit' ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}>
                <i className="fas fa-edit mr-1" />편집
              </button>
              <button type="button" onClick={() => { if (editorRef.current) setFormModalData((p) => ({ ...p, formHtml: editorRef.current!.getContent() })); setFormEditTab('preview') }}
                className={`px-3 py-1.5 text-[12px] rounded border transition-colors ${formEditTab === 'preview' ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}>
                <i className="fas fa-eye mr-1" />미리보기
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button onClick={handleFormModalSubmit} disabled={formModalSubmitting}
                className="px-4 py-1.5 bg-[#1D9E75] text-white text-[12px] font-medium rounded hover:bg-[#178a65] transition-colors disabled:opacity-50">
                {formModalSubmitting ? '저장 중...' : formModalMode === 'add' ? '추가' : '저장'}
              </button>
              <button onClick={() => setFormModalOpen(false)} className="px-4 py-1.5 border border-gray-300 text-gray-600 text-[12px] rounded hover:bg-gray-50 transition-colors">닫기</button>
            </div>
          </div>

          {formModalError && (
            <div className="bg-red-50 border-b border-red-200 text-red-600 text-[12px] px-6 py-2">{formModalError}</div>
          )}

          {/* 본문: 왼쪽 설정 + 오른쪽 에디터/미리보기 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 왼쪽 설정 패널 */}
            <div className="w-[280px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">양식명 <span className="text-red-500">*</span></label>
                <input value={formModalData.formName} onChange={(e) => setFormModalData((p) => ({ ...p, formName: e.target.value }))}
                  placeholder="예: 휴가신청" className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]" />
              </div>

              {formModalMode === 'add' ? (
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">양식 코드 <span className="text-red-500">*</span></label>
                  <input value={formModalData.formCode} onChange={(e) => setFormModalData((p) => ({ ...p, formCode: e.target.value.toUpperCase() }))}
                    placeholder="예: LEAVE_REQ" className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1D9E75] font-mono" />
                  <span className="text-[10px] text-gray-400">등록 후 수정 불가</span>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">양식 코드</label>
                  <input value={formModalData.formCode} disabled className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-[12px] bg-gray-50 text-gray-400 font-mono" />
                </div>
              )}

              {formModalMode === 'add' && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">소속 폴더 <span className="text-red-500">*</span></label>
                  <select value={formModalData.folderId ?? ''} onChange={(e) => setFormModalData((p) => ({ ...p, folderId: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]">
                    <option value="" disabled>폴더 선택</option>
                    {folders.map((f) => <option key={f.folderId} value={f.folderId}>{f.folderName}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">보존 연한</label>
                <select value={formModalData.formRetentionYear} onChange={(e) => setFormModalData((p) => ({ ...p, formRetentionYear: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]">
                  {[1, 3, 5, 10, 30].map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input type="checkbox" checked={formModalData.formIsPublic} onChange={() => setFormModalData((p) => ({ ...p, formIsPublic: !p.formIsPublic }))} className="accent-[#1D9E75]" />
                  공개
                </label>
                <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input type="checkbox" checked={formModalData.formPreApprovalYn} onChange={() => setFormModalData((p) => ({ ...p, formPreApprovalYn: !p.formPreApprovalYn }))} className="accent-[#1D9E75]" />
                  전결 옵션
                </label>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-[11px] text-gray-600 border border-dashed border-gray-300 rounded hover:border-[#1D9E75] hover:text-[#1D9E75] cursor-pointer transition-colors"
                  onDragOver={(e) => { e.preventDefault(); setFormModalDragging(true) }}
                  onDragLeave={() => setFormModalDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setFormModalDragging(false); const f = e.dataTransfer.files?.[0]; if (f) { handleFormFile(f); setFormEditTab('edit') } }}
                >
                  <i className="fas fa-upload" />
                  파일 불러오기
                  <input type="file" accept=".html,.htm,.docx,.hwp" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) { handleFormFile(file); setFormEditTab('edit') }
                    e.target.value = ''
                  }} />
                </label>
                <span className="text-[10px] text-gray-400 mt-1 block text-center">.html, .docx, .hwp</span>
              </div>
            </div>

            {/* 오른쪽 에디터 / 미리보기 */}
            <div className="flex-1 overflow-y-auto">
              {formEditTab === 'preview' ? (
                <div className="p-8 bg-white min-h-full">
                  <style>{`
                    .form-preview table { border-collapse: collapse; width: 100%; }
                    .form-preview table, .form-preview th, .form-preview td { border: 1px solid #333; }
                    .form-preview th, .form-preview td { padding: 6px 8px; font-size: 12px; }
                    .form-preview th { background: #f5f5f5; font-weight: 600; }
                    .form-preview input, .form-preview textarea, .form-preview select {
                      border: 1px solid #ccc; padding: 4px 6px; font-size: 12px; border-radius: 2px;
                    }
                    .form-preview { font-family: "Malgun Gothic", sans-serif; font-size: 12px; }
                  `}</style>
                  {formModalData.formHtml ? (
                    <div className="form-preview" dangerouslySetInnerHTML={{ __html: formModalData.formHtml }} />
                  ) : (
                    <div className="text-center text-gray-400 py-20">양식 내용이 없습니다.</div>
                  )}
                </div>
              ) : (
                <div style={{ height: '100%' }}>
                  <Editor
                    key={formEditId ?? 'new'}
                    onInit={(_evt, editor) => { editorRef.current = editor }}
                    value={formModalData.formHtml}
                    onEditorChange={(content) => setFormModalData((p) => ({ ...p, formHtml: content }))}
                    init={{
                      height: 'calc(100vh - 53px)',
                      menubar: 'file edit view insert format table',
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                        'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                        'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount',
                      ],
                      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
                        'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
                        'table | forecolor backcolor removeformat | code fullscreen | help',
                      table_default_attributes: { border: '1' },
                      table_default_styles: { 'border-collapse': 'collapse', width: '100%' },
                      skin: false,
                      content_css: false,
                      content_style: `${contentCss}\n${contentUiCss}\nbody { font-family: "Malgun Gothic", sans-serif; font-size: 12px; }`,
                      language: 'ko_KR',
                      language_url: '/tinymce/langs/ko_KR.js',
                      branding: false,
                      promotion: false,
                      licenseKey: 'gpl',
                      resize: false,
                      setup: (editor) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        editor.on('drop', (e: any) => {
                          const file = e.dataTransfer?.files?.[0]
                          if (file && /\.(html?|docx|hwp)$/i.test(file.name)) {
                            e.preventDefault()
                            e.stopPropagation()
                            handleFormFile(file)
                          }
                        })
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 버전 이력 모달 */}
      {versionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setVersionModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(720px,calc(100vw-24px))] max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">버전 이력</h2>
                {versionTargetForm && (
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {versionTargetForm.formName} <span className="text-gray-400">({versionTargetForm.formCode})</span>
                  </p>
                )}
              </div>
              <button onClick={() => setVersionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-[18px]">
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {versionLoading ? (
                <div className="text-center text-gray-400 py-12 text-[13px]">불러오는 중...</div>
              ) : versionList.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-[13px]">버전 이력이 없습니다.</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2.5 text-left text-gray-700 font-medium w-20">버전</th>
                      <th className="px-4 py-2.5 text-left text-gray-700 font-medium">양식명</th>
                      <th className="px-4 py-2.5 text-left text-gray-700 font-medium w-44">수정일시</th>
                      <th className="px-4 py-2.5 text-right text-gray-700 font-medium w-28">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionList.map((v) => (
                      <tr key={v.formId}
                        className={`border-b border-gray-100 transition-colors ${v.isCurrent ? 'bg-[#E1F5EE]/40' : 'hover:bg-gray-50 cursor-pointer'} ${!v.isActive ? 'opacity-60' : ''}`}
                        onClick={() => { if (!v.isCurrent) handleOpenVersionPreview(v.formId) }}
                      >
                        <td className="px-4 py-2.5 font-mono text-gray-700">
                          v{v.formVersion}
                          {v.isCurrent && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1D9E75] text-white">현재</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-800">
                          {v.formName}
                          {!v.isActive && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-500">삭제됨</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 font-mono text-[11px]">
                          {v.updatedAt?.replace('T', ' ').slice(0, 16) ?? '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button type="button" disabled={v.isCurrent}
                            onClick={() => setRollbackTarget(v)}
                            className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${v.isCurrent ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            title={v.isCurrent ? '이미 현재 버전입니다' : '이 버전으로 되돌리기'}>
                            롤백
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button onClick={() => setVersionModalOpen(false)}
                className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 옛 버전 미리보기 모달 */}
      {versionPreviewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVersionPreviewOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(960px,calc(100vw-24px))] max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">버전 미리보기</h2>
                {versionPreviewData && (
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {versionPreviewData.formName} <span className="text-gray-400">v{versionPreviewData.formVersion}</span>
                    {versionPreviewData.isCurrent && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1D9E75] text-white">현재</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {versionPreviewData && !versionPreviewData.isCurrent && (
                  <button type="button"
                    onClick={() => {
                      const v = versionList.find((x) => x.formId === versionPreviewData.formId)
                      if (v) setRollbackTarget(v)
                    }}
                    className="px-3 py-1.5 bg-[#1D9E75] text-white text-[12px] font-medium rounded hover:bg-[#178a65] transition-colors">
                    이 버전으로 되돌리기
                  </button>
                )}
                <button onClick={() => setVersionPreviewOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-600 text-[12px] rounded hover:bg-gray-50 transition-colors">닫기</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {versionPreviewLoading ? (
                <div className="text-center text-gray-400 py-20 text-[13px]">불러오는 중...</div>
              ) : versionPreviewData ? (
                <>
                  <style>{`
                    .form-version-preview table { border-collapse: collapse; width: 100%; }
                    .form-version-preview table, .form-version-preview th, .form-version-preview td { border: 1px solid #333; }
                    .form-version-preview th, .form-version-preview td { padding: 6px 8px; font-size: 12px; }
                    .form-version-preview th { background: #f5f5f5; font-weight: 600; }
                    .form-version-preview input, .form-version-preview textarea, .form-version-preview select {
                      border: 1px solid #ccc; padding: 4px 6px; font-size: 12px; border-radius: 2px;
                    }
                    .form-version-preview { font-family: "Malgun Gothic", sans-serif; font-size: 12px; }
                  `}</style>
                  <div className="form-version-preview" dangerouslySetInnerHTML={{ __html: versionPreviewData.formHtml }} />
                </>
              ) : (
                <div className="text-center text-gray-400 py-20 text-[13px]">데이터가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 롤백 확인 모달 */}
      {rollbackTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !rollbackSubmitting && setRollbackTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(420px,calc(100vw-24px))] p-6">
            <h2 className="text-[16px] font-bold text-gray-900 mb-2">버전 롤백</h2>
            <p className="text-[13px] text-gray-700 leading-relaxed">
              <span className="font-mono font-semibold text-[#1D9E75]">v{rollbackTarget.formVersion}</span> 버전으로 되돌리시겠습니까?
            </p>
            <p className="text-[12px] text-gray-500 mt-2">롤백 시 해당 버전이 현재 버전이 됩니다.</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setRollbackTarget(null)} disabled={rollbackSubmitting}
                className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50">취소</button>
              <button onClick={handleRollbackConfirm} disabled={rollbackSubmitting}
                className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors disabled:opacity-50">
                {rollbackSubmitting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 양식 수정 완료 모달 */}
      {updateSuccessVersion !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setUpdateSuccessVersion(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(380px,calc(100vw-24px))] p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-[#E1F5EE] flex items-center justify-center">
                <i className="fas fa-check text-[#1D9E75] text-[14px]" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">저장 완료</h2>
                <p className="text-[13px] text-gray-700 mt-1">
                  <span className="font-mono font-semibold text-[#1D9E75]">v{updateSuccessVersion}</span>으로 저장되었습니다.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setUpdateSuccessVersion(null)}
                className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   2. 결재 위임 정책
   ══════════════════════════════════════════════ */
function DelegationView() {
  const [delegations, setDelegations] = useState<ApprovalDelegationResponse[]>([])
  const [loading, setLoading] = useState(true)

  // 위임 등록 모달
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<EmployeeListItem | null>(null)
  const [selectedDele, setSelectedDele] = useState<EmployeeListItem | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [orgTarget, setOrgTarget] = useState<'emp' | 'dele' | null>(null)

  const loadDelegations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await approvalApi.getAdminDelegations()
      setDelegations(res.data)
    } catch (err) {
      console.error('위임 목록 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDelegations() }, [loadDelegations])

  // 사원 검색
  const handleOpenModal = () => {
    setSelectedEmp(null); setSelectedDele(null)
    setStartDate(''); setEndDate(''); setReason('')
    setModalError(''); setOrgTarget(null); setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedEmp) { setModalError('위임자(원 결재자)를 선택하세요.'); return }
    if (!selectedDele) { setModalError('대결자를 선택하세요.'); return }
    if (selectedEmp.empId === selectedDele.empId) { setModalError('위임자와 대결자가 같을 수 없습니다.'); return }
    if (!startDate || !endDate) { setModalError('위임 기간을 입력하세요.'); return }
    if (startDate > endDate) { setModalError('시작일이 종료일보다 늦을 수 없습니다.'); return }

    try {
      setSubmitting(true); setModalError('')
      await approvalApi.createAdminDelegation({
        empId: selectedEmp.empId,
        empName: selectedEmp.empName,
        empDeptName: selectedEmp.deptName,
        empGrade: selectedEmp.gradeName,
        empTitle: selectedEmp.titleName || '',
        appDeleEmpId: selectedDele.empId,
        deleName: selectedDele.empName,
        deleDeptName: selectedDele.deptName,
        deleGrade: selectedDele.gradeName,
        deleTitle: selectedDele.titleName || null,
        appDeleStartAt: startDate,
        appDeleEndAt: endDate,
        appDeleReason: reason,
      })
      setModalOpen(false)
      await loadDelegations()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data
      setModalError(typeof msg === 'string' ? msg : '위임 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await approvalApi.toggleAdminDelegation(id)
      await loadDelegations()
    } catch (err) {
      console.error('위임 상태 변경 실패:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 위임 설정을 삭제하시겠습니까?')) return
    try {
      await approvalApi.deleteAdminDelegation(id)
      await loadDelegations()
    } catch (err) {
      console.error('위임 삭제 실패:', err)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-12">로딩 중...</div>

  const empPickerEl = (label: string, target: 'emp' | 'dele', selected: EmployeeListItem | null, setSelected: (e: EmployeeListItem | null) => void) => (
    <div>
      <label className="block text-[12px] font-medium text-gray-700 mb-1">{label} <span className="text-red-500">*</span></label>
      {selected ? (
        <div className="flex items-center justify-between border border-[#1D9E75] rounded-lg px-3 py-2 bg-[#F0FBF7]">
          <span className="text-[13px]">
            <span className="font-medium text-gray-900">{selected.empName}</span>
            <span className="text-gray-500 ml-2">{selected.deptName} · {selected.gradeName}{selected.titleName ? ` · ${selected.titleName}` : ''}</span>
          </span>
          <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-red-500 text-sm">&times;</button>
        </div>
      ) : (
        <button type="button" onClick={() => setOrgTarget(target)}
          className="w-full border border-gray-300 border-dashed rounded-lg px-3 py-2.5 text-[13px] text-gray-400 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors text-left">
          <i className="fas fa-sitemap mr-2" />조직도에서 선택
        </button>
      )}
    </div>
  )

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">결재 위임 정책</h3>
      <p className="text-[12px] text-gray-400 mb-5">부재 기간 설정 시 지정 대리인에게 결재 권한을 자동 위임합니다.</p>

      <div className="flex justify-end mb-4">
        <button onClick={handleOpenModal} className="px-4 py-1.5 bg-[#1D9E75] text-white text-[12px] font-medium rounded-lg hover:bg-[#178a65] transition-colors flex items-center gap-1">
          <i className="fas fa-plus text-[10px]" /> 위임 등록
        </button>
      </div>

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">원 결재자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">위임 결재자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">위임 기간</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
        </tr></thead>
        <tbody>
          {delegations.length === 0 ? (
            <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-[13px]">등록된 위임이 없습니다.</td></tr>
          ) : delegations.map((d) => (
            <tr key={d.appDeleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800 font-medium">{d.empName} {d.empTitle}</td>
              <td className="px-3 py-2.5 text-[#1D9E75] font-medium">{d.deleName} {d.deleTitle}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.empDeptName}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.startAt} ~ {d.endAt}</td>
              <td className="px-3 py-2.5 text-gray-500">{d.reason}</td>
              <td className="px-3 py-2.5">
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.isActive ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-100 text-gray-500'}`}>
                  {d.isActive ? '위임중' : '만료'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right flex items-center justify-end gap-2">
                <button onClick={() => handleToggle(d.appDeleId)} className="text-[11px] text-gray-500 hover:underline">
                  {d.isActive ? '해제' : '활성화'}
                </button>
                <button onClick={() => handleDelete(d.appDeleId)} className="text-[11px] text-red-500 hover:underline">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 위임 등록 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(560px,calc(100vw-24px))] max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">위임 등록</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {modalError && <div className="bg-red-50 border border-red-200 text-red-600 text-[12px] px-3 py-2 rounded-lg">{modalError}</div>}

              {empPickerEl('위임자 (원 결재자)', 'emp', selectedEmp, setSelectedEmp)}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">대결자 (위임 받을 사원) <span className="text-red-500">*</span></label>
                {selectedDele ? (
                  <div className="flex items-center justify-between border border-[#1D9E75] rounded-lg px-3 py-2 bg-[#F0FBF7]">
                    <span className="text-[13px]">
                      <span className="font-medium text-gray-900">{selectedDele.empName}</span>
                      <span className="text-gray-500 ml-2">{selectedDele.deptName} · {selectedDele.gradeName}{selectedDele.titleName ? ` · ${selectedDele.titleName}` : ''}</span>
                    </span>
                    <button type="button" onClick={() => setSelectedDele(null)} className="text-gray-400 hover:text-red-500 text-sm">&times;</button>
                  </div>
                ) : !selectedEmp ? (
                  <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-300 bg-gray-50 cursor-not-allowed">
                    <i className="fas fa-sitemap mr-2" />위임자를 먼저 선택하세요
                  </div>
                ) : (
                  <button type="button" onClick={() => setOrgTarget('dele')}
                    className="w-full border border-gray-300 border-dashed rounded-lg px-3 py-2.5 text-[13px] text-gray-400 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors text-left">
                    <i className="fas fa-sitemap mr-2" />조직도에서 선택
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">시작일 <span className="text-red-500">*</span></label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">종료일 <span className="text-red-500">*</span></label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75]" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">위임 사유</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="예: 출장으로 인한 결재 위임"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75] resize-y" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={handleSubmit} disabled={submitting}
                className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors disabled:opacity-50">
                {submitting ? '등록 중...' : '등록'}
              </button>
              <button onClick={() => setModalOpen(false)} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 조직도 사원 선택 모달 */}
      <OrgSelectModal
        isOpen={orgTarget !== null}
        title={orgTarget === 'emp' ? '위임자 선택' : '대결자 선택'}
        excludeEmpId={orgTarget === 'emp' ? selectedDele?.empId : selectedEmp?.empId}
        onClose={() => setOrgTarget(null)}
        onSelect={(emp) => {
          if (orgTarget === 'emp') setSelectedEmp(emp)
          else setSelectedDele(emp)
          setOrgTarget(null)
        }}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════
   3. 결재번호 규칙
   ══════════════════════════════════════════════ */
function DocNumberView() {
  const [slot1, setSlot1] = useState('DEPT_CODE')
  const [slot2, setSlot2] = useState('FORM_CODE')
  const [slot3, setSlot3] = useState('NONE')
  const [dateFmt, setDateFmt] = useState('yyMMdd')
  const [seqDigits, setSeqDigits] = useState(3)
  const [separator, setSeparator] = useState('-')
  const [customSlot1, setCustomSlot1] = useState('')
  const [customSlot2, setCustomSlot2] = useState('')
  const [customSlot3, setCustomSlot3] = useState('')
  const [seqReset, setSeqReset] = useState<'YEAR' | 'MONTH' | 'NEVER'>('YEAR')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    approvalApi.getNumberRule()
      .then((res) => {
        const r = res.data
        setSlot1(r.numberRuleSlot1Type)
        setSlot2(r.numberRuleSlot2Type)
        setSlot3(r.numberRuleSlot3Type ?? 'NONE')
        setCustomSlot1(r.numberRuleSlot1Custom ?? '')
        setCustomSlot2(r.numberRuleSlot2Custom ?? '')
        setCustomSlot3(r.numberRuleSlot3Custom ?? '')
        setDateFmt(r.numberRuleDateFormat)
        setSeqDigits(r.numberRuleSeqDigits)
        setSeparator(r.numberRuleSeparator)
        setSeqReset(r.numberRuleSeqResetCycle)
      })
      .catch((err) => console.error('채번 규칙 로드 실패:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await approvalApi.updateNumberRule({
        numberRuleSlot1Type: slot1,
        numberRuleSlot1Custom: slot1 === 'CUSTOM' ? customSlot1 : null,
        numberRuleSlot2Type: slot2,
        numberRuleSlot2Custom: slot2 === 'CUSTOM' ? customSlot2 : null,
        numberRuleSlot3Type: slot3 === 'NONE' ? null : slot3,
        numberRuleSlot3Custom: slot3 === 'CUSTOM' ? customSlot3 : null,
        numberRuleDateFormat: dateFmt,
        numberRuleSeqDigits: seqDigits,
        numberRuleSeparator: separator,
        numberRuleSeqResetCycle: seqReset,
      })
      alert('저장되었습니다.')
    } catch (err) {
      console.error('채번 규칙 저장 실패:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const slotOptions = [
    { value: 'COMPANY_NAME', label: '회사명', example: 'PeopleCore' },
    { value: 'DEPT_CODE', label: '부서코드', example: 'HR' },
    { value: 'DEPT_NAME', label: '부서명', example: '인사' },
    { value: 'FORM_CODE', label: '양식코드', example: 'LEAVE' },
    { value: 'FORM_NAME', label: '양식명', example: '휴가신청' },
    { value: 'CUSTOM', label: '직접 입력', example: '' },
    { value: 'NONE', label: '없음', example: '' },
  ]

  const getExample = (slot: string, custom: string) => {
    if (slot === 'CUSTOM') return custom || '입력값'
    if (slot === 'NONE' || !slot) return ''
    return slotOptions.find((o) => o.value === slot)?.example ?? ''
  }

  const dateExample = dateFmt === 'yyyyMMdd' ? '20260408' : dateFmt === 'yyMMdd' ? '260408' : dateFmt === 'yyyyMM' ? '202604' : dateFmt === 'yyMM' ? '2604' : dateFmt === 'yyyy' ? '2026' : '26'
  const parts = [getExample(slot1, customSlot1), getExample(slot2, customSlot2), getExample(slot3, customSlot3), dateExample, String(1).padStart(seqDigits, '0')].filter(Boolean)
  const preview = parts.join(separator)

  if (loading) return <div className="text-center text-gray-400 py-12">로딩 중...</div>

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">결재번호 규칙</h3>
      <p className="text-[12px] text-gray-400 mb-5">결재 완료 후 생성되는 문서번호의 형식을 설정합니다.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">번호 생성 규칙</h4>
        <p className="text-[11px] text-gray-400 mb-4">순서: 1번째 자리 → 2번째 자리 → 3번째 자리 → 날짜 → 일련번호</p>

        <div className="space-y-4">
          {[
            { label: '1번째 자리', slot: slot1, setSlot: setSlot1, custom: customSlot1, setCustom: setCustomSlot1 },
            { label: '2번째 자리', slot: slot2, setSlot: setSlot2, custom: customSlot2, setCustom: setCustomSlot2 },
            { label: '3번째 자리', slot: slot3, setSlot: setSlot3, custom: customSlot3, setCustom: setCustomSlot3 },
          ].map(({ label, slot, setSlot, custom, setCustom }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-[12px] text-gray-600 w-28 shrink-0">{label}</span>
              <select value={slot} onChange={(e) => setSlot(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
                {slotOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {slot === 'CUSTOM' && <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="직접 입력" className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-28" />}
              {slot !== 'NONE' && slot !== 'CUSTOM' && <span className="text-[11px] text-gray-400">예: {getExample(slot, '')}</span>}
            </div>
          ))}

          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">날짜 형식</span>
            <select value={dateFmt} onChange={(e) => setDateFmt(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value="yyyyMMdd">yyyyMMdd</option>
              <option value="yyMMdd">yyMMdd</option>
              <option value="yyyyMM">yyyyMM</option>
              <option value="yyMM">yyMM</option>
              <option value="yyyy">yyyy</option>
              <option value="yy">yy</option>
            </select>
            <span className="text-[11px] text-gray-400">예: {dateExample}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">일련번호 자릿수</span>
            <select value={seqDigits} onChange={(e) => setSeqDigits(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value={3}>3자리 (001)</option>
              <option value={4}>4자리 (0001)</option>
              <option value={5}>5자리 (00001)</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">구분자</span>
            <select value={separator} onChange={(e) => setSeparator(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value="-">- (하이픈)</option>
              <option value="_">_ (언더스코어)</option>
              <option value="/">/ (슬래시)</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">번호 초기화 주기</span>
            <select value={seqReset} onChange={(e) => setSeqReset(e.target.value as typeof seqReset)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value="YEAR">매년 초기화</option>
              <option value="MONTH">매월 초기화</option>
              <option value="NEVER">초기화 안 함</option>
            </select>
            <span className="text-[11px] text-gray-400">일련번호를 주기적으로 001부터 다시 시작</span>
          </div>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-2">미리보기</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <span className="text-[20px] font-bold text-gray-900 font-mono tracking-wider">{preview}</span>
        </div>
        <div className="flex justify-center gap-1 mt-3">
          {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">{p}</span>
              {i < parts.length - 1 && <span className="text-gray-400 text-[10px]">{separator}</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors disabled:opacity-60">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   4. 사원 결재 환경 설정
   ══════════════════════════════════════════════ */
function MemberApprovalSettingsView() {
  const [departments, setDepartments] = useState<DepartmentTreeResponse[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [search, setSearch] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Record<number, boolean>>({})
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null)
  const [selectedEmpName, setSelectedEmpName] = useState('')
  const [signature, setSignature] = useState<ApprovalSignatureResponse | null>(null)
  const [delegations, setDelegations] = useState<ApprovalDelegationResponse[]>([])
  const [loading, setLoading] = useState(true)

  // 부서 트리 + 사원 목록 로드
  useEffect(() => {
    Promise.all([
      departmentApi.getTree(),
      employeeApi.getList({ size: 1000 }),
    ])
      .then(([deptRes, empRes]) => {
        setDepartments(deptRes.data)
        setEmployees(empRes.data.content)
        // 첫 부서 펼치기
        if (deptRes.data.length > 0) {
          setExpandedDepts({ [deptRes.data[0].id]: true })
        }
      })
      .catch((err) => console.error('사원 데이터 로드 실패:', err))
      .finally(() => setLoading(false))
  }, [])

  // 사원 선택 시 서명 + 위임 로드
  useEffect(() => {
    if (selectedEmpId == null) return
    approvalApi.getEmployeeSignature(selectedEmpId)
      .then((res) => setSignature(res.data))
      .catch(() => setSignature(null))
    approvalApi.getDelegations()
      .then((res) => setDelegations(res.data.filter((d) => d.empId === selectedEmpId)))
      .catch(() => setDelegations([]))
  }, [selectedEmpId])

  const filteredEmployees = employees.filter((e) =>
    !search || e.empName.includes(search) || e.titleName?.includes(search) || e.deptName?.includes(search)
  )

  // 부서별 사원 그룹
  const getEmployeesByDept = (deptName: string) =>
    filteredEmployees.filter((e) => e.deptName === deptName)

  const handleSignatureUpload = async (file: File) => {
    if (selectedEmpId == null) return
    try {
      const res = await approvalApi.uploadEmployeeSignature(selectedEmpId, file)
      setSignature(res.data)
    } catch (err) {
      console.error('서명 업로드 실패:', err)
    }
  }

  const handleSignatureDelete = async () => {
    if (selectedEmpId == null) return
    try {
      await approvalApi.deleteEmployeeSignature(selectedEmpId)
      setSignature(null)
    } catch (err) {
      console.error('서명 삭제 실패:', err)
    }
  }

  const renderDeptTree = (depts: DepartmentTreeResponse[]) => {
    return depts.map((dept) => {
      const members = getEmployeesByDept(dept.deptName)
      if (search && members.length === 0 && (!dept.children || dept.children.length === 0)) return null
      return (
        <div key={dept.id}>
          <div className="flex items-center gap-1 py-1 px-1 cursor-pointer select-none hover:bg-gray-50 rounded"
            onClick={() => setExpandedDepts((p) => ({ ...p, [dept.id]: !p[dept.id] }))}>
            <span className="text-[10px] text-gray-400 w-3">{expandedDepts[dept.id] ? '▼' : '▶'}</span>
            <span className="font-semibold text-gray-700">{dept.deptName}</span>
            <span className="text-gray-400 text-[11px] ml-1">{members.length}</span>
          </div>
          {expandedDepts[dept.id] && members.map((m, idx) => (
            <div key={`${dept.id}-${m.empId ?? idx}`}
              onClick={(e) => { e.stopPropagation(); setSelectedEmpId(m.empId); setSelectedEmpName(m.empName) }}
              className={`flex items-center gap-2 py-1.5 pl-5 pr-2 rounded cursor-pointer transition-colors ${
                selectedEmpId === m.empId ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'
              }`}>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0">
                <span>{m.empName[0]}</span>
              </div>
              <span className="text-gray-800">{m.empName} {m.titleName}</span>
            </div>
          ))}
          {expandedDepts[dept.id] && dept.children && renderDeptTree(dept.children)}
        </div>
      )
    })
  }

  if (loading) return <div className="text-center text-gray-400 py-12">로딩 중...</div>

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-5">사원 결재 환경 설정</h3>
      <div className="border border-gray-200 rounded-xl p-5">
        <div className="flex gap-6">
          {/* 왼쪽: 사원 목록 */}
          <div className="w-[240px] shrink-0">
            <div className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b border-gray-100">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 직위, 부서 검색" className="text-[11px] outline-none bg-transparent w-full placeholder-gray-400" />
              </div>
              <div className="p-2 text-[12px] max-h-[500px] overflow-y-auto">
                {renderDeptTree(departments)}
                {(() => {
                  const allDeptNames = new Set<string>()
                  const collectNames = (depts: DepartmentTreeResponse[]) => {
                    depts.forEach((d) => { allDeptNames.add(d.deptName); if (d.children?.length) collectNames(d.children) })
                  }
                  collectNames(departments)
                  const unassigned = filteredEmployees.filter((e) => !e.deptName || e.deptName === '미배정' || !allDeptNames.has(e.deptName))
                  if (unassigned.length === 0) return null
                  return (
                    <div>
                      <div className="flex items-center gap-1 py-1 px-1 cursor-pointer select-none hover:bg-gray-50 rounded"
                        onClick={() => setExpandedDepts((p) => ({ ...p, [-1]: !p[-1] }))}>
                        <span className="text-[10px] text-gray-400 w-3">{expandedDepts[-1] ? '▼' : '▶'}</span>
                        <span className="font-semibold text-gray-500">미소속</span>
                        <span className="text-gray-400 text-[11px] ml-1">{unassigned.length}</span>
                      </div>
                      {expandedDepts[-1] && unassigned.map((m, idx) => (
                        <div key={`unassigned-${m.empId ?? idx}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedEmpId(m.empId); setSelectedEmpName(m.empName) }}
                          className={`flex items-center gap-2 py-1.5 pl-5 pr-2 rounded cursor-pointer transition-colors ${
                            selectedEmpId === m.empId ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'
                          }`}>
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0">
                            <span>{m.empName[0]}</span>
                          </div>
                          <span>{m.empName}</span>
                          {m.gradeName && <span className="text-gray-400 text-[10px] ml-auto">{m.gradeName}</span>}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* 오른쪽: 선택된 사원 설정 */}
          <div className="flex-1">
            {selectedEmpId == null ? (
              <div className="text-[13px] text-gray-400 text-center py-20">왼쪽에서 사원을 선택하세요.</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-gray-500 w-28 shrink-0">이름</span>
                  <span className="text-[14px] font-semibold text-gray-900">{selectedEmpName}</span>
                </div>

                {/* 서명 이미지 */}
                <div className="flex items-start gap-4">
                  <span className="text-[12px] text-gray-500 w-28 shrink-0 pt-1">서명 이미지</span>
                  <div>
                    <div className="border border-gray-200 rounded-lg p-3 mb-2 w-[160px] h-[100px] flex flex-col items-center justify-center">
                      {signature ? (
                        <img src={resolveApprovalFileUrl(signature.fileUrl)} alt="서명" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-gray-400">서명 없음</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                        서명 올리기
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleSignatureUpload(e.target.files[0]) }} />
                      </label>
                      {signature && (
                        <button onClick={handleSignatureDelete} className="px-3 py-1.5 text-[11px] border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors">삭제</button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">* 서명은 최대 55x40 pixel 이미지</p>
                  </div>
                </div>

                {/* 부재위임설정 */}
                <div className="flex items-start gap-4">
                  <span className="text-[12px] text-gray-500 w-28 shrink-0 pt-1">부재위임설정</span>
                  <div className="flex-1">
                    <table className="w-full text-[11px]">
                      <thead><tr className="border-b border-gray-200">
                        <th className="px-2 py-2 text-left text-gray-500 font-medium">부재기간</th>
                        <th className="px-2 py-2 text-left text-gray-500 font-medium">대결자</th>
                        <th className="px-2 py-2 text-left text-gray-500 font-medium">부재사유</th>
                        <th className="px-2 py-2 text-center text-gray-500 font-medium">사용여부</th>
                      </tr></thead>
                      <tbody>
                        {delegations.length === 0 ? (
                          <tr><td colSpan={4} className="py-8 text-center text-gray-400">등록된 설정이 없습니다.</td></tr>
                        ) : delegations.map((d) => (
                          <tr key={d.appDeleId} className="border-b border-gray-100">
                            <td className="px-2 py-2 text-gray-600">{d.startAt} ~ {d.endAt}</td>
                            <td className="px-2 py-2 text-gray-700">{d.deleName} {d.deleTitle}</td>
                            <td className="px-2 py-2 text-gray-600">{d.reason}</td>
                            <td className="px-2 py-2 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.isActive ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-100 text-gray-500'}`}>
                                {d.isActive ? '사용' : '만료'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   메인 탭 컴포넌트
   ══════════════════════════════════════════════ */
export default function ApprovalSettingsTab() {
  const [view, setView] = useState<ApprovalSettingsView>('form-manage')

  const renderContent = () => {
    switch (view) {
      case 'form-manage': return <FormManageView />
      case 'delegation': return <DelegationView />
      case 'doc-number': return <DocNumberView />
      case 'member-settings': return <MemberApprovalSettingsView />
      default: return null
    }
  }

  return (
    <div className="flex gap-0 -m-6 h-[calc(100%+48px)]">
      {/* 서브 사이드바 */}
      <div className="w-[200px] bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-800">결재 환경설정</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">결재 프로세스 정책 관리</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {APPROVAL_SETTING_MENUS.map((m) => (
            <div key={m.key} onClick={() => setView(m.key)}
              className={`flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer rounded-lg transition-colors ${view === m.key ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-gray-600 hover:bg-gray-50'}`}>
              {m.label}
            </div>
          ))}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  )
}
