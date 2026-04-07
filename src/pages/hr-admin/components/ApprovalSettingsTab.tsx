import { useState, useEffect, useCallback } from 'react'
import { approvalApi } from '../../../api/approval'
import type {
  FormFolderResponse,
  FormListResponse,
  ApprovalDelegationResponse,
  NumberRuleResponse,
  DeptFolderResponse,
  ApprovalSignatureResponse,
} from '../../../api/approval'
import { departmentApi, employeeApi } from '../../../api/org'
import type { DepartmentTreeResponse, EmployeeListItem } from '../../../api/org'

type ApprovalSettingsView = 'form-manage' | 'delegation' | 'doc-number' | 'member-settings' | 'dept-docbox'

const APPROVAL_SETTING_MENUS: { key: ApprovalSettingsView; label: string }[] = [
  { key: 'form-manage', label: '결재 양식 관리' },
  { key: 'delegation', label: '결재 위임 정책' },
  { key: 'doc-number', label: '결재번호 규칙' },
  { key: 'member-settings', label: '사원 결재 환경 설정' },
  { key: 'dept-docbox', label: '부서 문서함' },
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
        approvalApi.getForms(),
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

  useEffect(() => { loadData() }, [])

  // 선택된 폴더의 양식 로드
  useEffect(() => {
    if (selectedFolderId == null) return
    approvalApi.getForms(selectedFolderId)
      .then((res) => setForms(res.data))
      .catch((err) => console.error('양식 로드 실패:', err))
  }, [selectedFolderId])

  const selectedFolder = folders.find((f) => f.folderId === selectedFolderId)
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
        await approvalApi.createFormFolder({ folderName: folderModalName, parentId: selectedFolderId ?? undefined })
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

  // 양식 삭제
  const handleDeleteForm = async () => {
    if (checkedFormIds.size === 0) return
    if (!confirm(`선택한 ${checkedFormIds.size}개 양식을 삭제하시겠습니까?`)) return
    try {
      await Promise.all([...checkedFormIds].map((id) => approvalApi.deleteForm(id)))
      setCheckedFormIds(new Set())
      if (selectedFolderId) {
        const res = await approvalApi.getForms(selectedFolderId)
        setForms(res.data)
      }
    } catch (err) {
      console.error('양식 삭제 실패:', err)
    }
  }

  // 일괄설정 저장
  const handleBatchSave = async () => {
    // batchOpen에서 변경된 allForms를 기반으로 batch-settings 호출
    setBatchOpen(false)
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
                  <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">양식 추가</button>
                  <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">양식 수정</button>
                  <button onClick={handleDeleteForm} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors text-red-500">양식 삭제</button>
                  <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">순서바꾸기</button>
                  <button onClick={() => setBatchOpen(true)} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">일괄설정</button>
                </div>

                {/* 양식 테이블 */}
                <table className="w-full text-[12px]">
                  <thead><tr className="border-b-2 border-gray-900">
                    <th className="px-3 py-2.5 w-8">
                      <input type="checkbox" checked={allChecked} onChange={() => {
                        if (allChecked) setCheckedFormIds(new Set())
                        else setCheckedFormIds(new Set(filteredForms.map((f) => f.formId)))
                      }} className="accent-[#1D9E75]" />
                    </th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">제목</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">양식코드</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">작성권한</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용여부</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">모바일 기안 허용</th>
                  </tr></thead>
                  <tbody>
                    {filteredForms.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-[13px]">양식이 없습니다.</td></tr>
                    ) : filteredForms.map((form) => (
                      <tr key={form.formId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={checkedFormIds.has(form.formId)}
                            onChange={() => setCheckedFormIds((prev) => {
                              const n = new Set(prev); if (n.has(form.formId)) n.delete(form.formId); else n.add(form.formId); return n
                            })} className="accent-[#1D9E75]" />
                        </td>
                        <td className="px-3 py-2.5 text-[#1D9E75] font-medium cursor-pointer hover:underline">{form.formName}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{form.formCode}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{form.formWritePermission}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{form.isActive ? '사용' : '미사용'}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{form.formMobileYn ? '허용' : '비허용'}</td>
                      </tr>
                    ))}
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
          <div className="relative bg-white rounded-xl shadow-xl w-[400px] p-6">
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
          <div className="relative bg-white rounded-xl shadow-xl w-[95vw] max-w-[1200px] max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">일괄설정</h2>
              <button onClick={() => setBatchOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="w-full text-[11px] whitespace-nowrap">
                <thead><tr className="border-b-2 border-gray-900">
                  <th className="px-2 py-2.5 text-left text-gray-700 font-medium sticky left-0 bg-white min-w-[250px]">제목</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">작성 권한</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">공개여부</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">전결 옵션</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">보존연한</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">모바일 기안</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">사용여부</th>
                </tr></thead>
                <tbody>
                  {allForms.map((f, idx) => (
                    <tr key={f.formId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-2.5 text-gray-800 sticky left-0 bg-white font-medium">
                        {f.folderName} &gt; {f.formName}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <select value={f.formWritePermission}
                          onChange={(e) => setAllForms((p) => p.map((s, i) => i === idx ? { ...s, formWritePermission: e.target.value } : s))}
                          className="border border-gray-300 rounded px-1 py-0.5 text-[11px] outline-none">
                          <option value="ALL">전체</option><option value="DEPT">부서</option><option value="PERSONAL">개인</option>
                        </select>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.formIsPublic}
                            onChange={() => setAllForms((p) => p.map((s, i) => i === idx ? { ...s, formIsPublic: !s.formIsPublic } : s))}
                            className="accent-[#1D9E75]" />
                          <span>{f.formIsPublic ? '공개' : '비공개'}</span>
                        </label>
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
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.formMobileYn}
                            onChange={() => setAllForms((p) => p.map((s, i) => i === idx ? { ...s, formMobileYn: !s.formMobileYn } : s))}
                            className="accent-[#1D9E75]" />
                          <span>{f.formMobileYn ? '허용' : '비허용'}</span>
                        </label>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.isActive}
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
                  const formIds = allForms.map((f) => f.formId)
                  await approvalApi.batchUpdateForms({ formIds })
                  setBatchOpen(false)
                  await loadData()
                } catch (err) { console.error('일괄설정 저장 실패:', err) }
              }} className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">확인</button>
              <button onClick={() => setBatchOpen(false)} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
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

  const loadDelegations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await approvalApi.getDelegations()
      setDelegations(res.data)
    } catch (err) {
      console.error('위임 목록 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDelegations() }, [loadDelegations])

  const handleToggle = async (id: number) => {
    try {
      await approvalApi.toggleDelegation(id)
      await loadDelegations()
    } catch (err) {
      console.error('위임 상태 변경 실패:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 위임 설정을 삭제하시겠습니까?')) return
    try {
      await approvalApi.deleteDelegation(id)
      await loadDelegations()
    } catch (err) {
      console.error('위임 삭제 실패:', err)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-12">로딩 중...</div>

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">결재 위임 정책</h3>
      <p className="text-[12px] text-gray-400 mb-5">부재 기간 설정 시 지정 대리인에게 결재 권한을 자동 위임합니다.</p>

      <div className="flex justify-end mb-4">
        <button className="px-4 py-1.5 bg-[#1D9E75] text-white text-[12px] font-medium rounded-lg hover:bg-[#178a65] transition-colors flex items-center gap-1">
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
    </div>
  )
}

/* ══════════════════════════════════════════════
   3. 결재번호 규칙
   ══════════════════════════════════════════════ */
function DocNumberView() {
  const [slot1, setSlot1] = useState('dept_code')
  const [slot2, setSlot2] = useState('form_code')
  const [slot3, setSlot3] = useState('none')
  const [dateFmt, setDateFmt] = useState('YYYYMMDD')
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
        setSlot3(r.numberRuleSlot3Type)
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
        numberRuleSlot1Custom: slot1 === 'custom' ? customSlot1 : null,
        numberRuleSlot2Type: slot2,
        numberRuleSlot2Custom: slot2 === 'custom' ? customSlot2 : null,
        numberRuleSlot3Type: slot3,
        numberRuleSlot3Custom: slot3 === 'custom' ? customSlot3 : null,
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
    { value: 'company_name', label: '회사명', example: 'PeopleCore' },
    { value: 'dept_code', label: '부서코드', example: 'HR' },
    { value: 'dept_name', label: '부서명', example: '인사' },
    { value: 'form_code', label: '양식코드', example: 'LEAVE' },
    { value: 'form_name', label: '양식명', example: '휴가신청' },
    { value: 'custom', label: '직접 입력', example: '' },
    { value: 'none', label: '없음', example: '' },
  ]

  const getExample = (slot: string, custom: string) => {
    if (slot === 'custom') return custom || '입력값'
    if (slot === 'none') return ''
    return slotOptions.find((o) => o.value === slot)?.example ?? ''
  }

  const dateExample = dateFmt === 'YYYYMMDD' ? '20260401' : dateFmt === 'YYYYMM' ? '202604' : '2026'
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
              {slot === 'custom' && <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="직접 입력" className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-28" />}
              {slot !== 'none' && slot !== 'custom' && <span className="text-[11px] text-gray-400">예: {getExample(slot, '')}</span>}
            </div>
          ))}

          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">날짜 형식</span>
            <select value={dateFmt} onChange={(e) => setDateFmt(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value="YYYYMMDD">YYYYMMDD</option>
              <option value="YYYYMM">YYYYMM</option>
              <option value="YYYY">YYYY</option>
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
          {expandedDepts[dept.id] && members.map((m) => (
            <div key={m.empNum}
              onClick={() => { setSelectedEmpId(Number(m.empNum)); setSelectedEmpName(m.empName) }}
              className={`flex items-center gap-2 py-1.5 pl-5 pr-2 rounded cursor-pointer transition-colors ${
                selectedEmpId === Number(m.empNum) ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'
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
                        <img src={signature.fileUrl} alt="서명" className="max-w-full max-h-full object-contain" />
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
   5. 부서 문서함 설정
   ══════════════════════════════════════════════ */
function DeptDocBoxSettingsView() {
  const [deptFolders, setDeptFolders] = useState<DeptFolderResponse[]>([])
  const [departments, setDepartments] = useState<DepartmentTreeResponse[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [rightPanel, setRightPanel] = useState<'none' | 'dept-picker'>('none')
  const [useDocBox, setUseDocBox] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [foldersRes, deptsRes] = await Promise.all([
        approvalApi.getDeptFolders(),
        departmentApi.getTree(),
      ])
      setDeptFolders(foldersRes.data)
      setDepartments(deptsRes.data)
      if (!selectedFolderId && foldersRes.data.length > 0) {
        setSelectedFolderId(foldersRes.data[0].id)
      }
    } catch (err) {
      console.error('부서 문서함 데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedFolderId])

  useEffect(() => { loadData() }, [])

  const selectedFolder = deptFolders.find((f) => f.id === selectedFolderId)

  const handleAddFolder = async () => {
    const name = prompt('문서함 이름을 입력하세요')
    if (!name) return
    try {
      await approvalApi.createDeptFolder(name)
      await loadData()
    } catch (err) {
      console.error('문서함 추가 실패:', err)
    }
  }

  const handleDeleteFolder = async () => {
    if (!selectedFolderId || !confirm('이 문서함을 삭제하시겠습니까?')) return
    try {
      await approvalApi.deleteDeptFolder(selectedFolderId)
      setSelectedFolderId(null)
      await loadData()
    } catch (err) {
      console.error('문서함 삭제 실패:', err)
    }
  }

  const handleAddManager = async (empId: number, empName: string, deptName: string) => {
    if (!selectedFolderId) return
    try {
      await approvalApi.addDeptFolderManager(selectedFolderId, { empId, empName, deptName })
      await loadData()
    } catch (err) {
      console.error('담당자 추가 실패:', err)
    }
  }

  const handleRemoveManager = async (empId: number) => {
    if (!selectedFolderId) return
    try {
      await approvalApi.removeDeptFolderManager(selectedFolderId, empId)
      await loadData()
    } catch (err) {
      console.error('담당자 삭제 실패:', err)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-12">로딩 중...</div>

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-5">부서 문서함</h3>
      <div className="border border-gray-200 rounded-xl p-5 min-h-[500px]">
        {/* 사용 설정 */}
        <div className="flex items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-[13px] text-gray-700 font-medium">부서 문서함 사용 설정</span>
          <button onClick={() => setUseDocBox(!useDocBox)}
            className={`px-4 py-1.5 text-[12px] border rounded-lg transition-colors ${useDocBox ? 'border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE] font-medium' : 'border-gray-300 text-gray-500'}`}>
            {useDocBox ? '사용 중' : '미사용'}
          </button>
        </div>

        {useDocBox && (
          <>
            <h4 className="text-[14px] font-bold text-gray-800 mb-3">부서 문서함 목록</h4>
            <div className="flex gap-6">
              {/* 왼쪽: 문서함 목록 */}
              <div className="w-[220px] shrink-0">
                <div className="flex items-center gap-1 mb-3">
                  <button onClick={handleAddFolder} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50">추가</button>
                  <button onClick={handleDeleteFolder} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 text-red-500">삭제</button>
                  <button onClick={() => setRightPanel(rightPanel === 'dept-picker' ? 'none' : 'dept-picker')}
                    className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50">담당자 관리</button>
                </div>

                {/* 선택된 문서함의 담당자 */}
                {selectedFolder && selectedFolder.managers.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mb-2 px-1">
                    <span className="text-[10px] text-gray-400">담당자:</span>
                    {selectedFolder.managers.map((m) => (
                      <span key={m.empId} className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                        {m.empName}
                        <button onClick={() => handleRemoveManager(m.empId)} className="text-gray-400 hover:text-red-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[12px]">
                  {deptFolders.map((folder) => (
                    <div key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`py-1.5 px-3 rounded cursor-pointer transition-colors ${
                        selectedFolderId === folder.id ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}>
                      {folder.name}
                      {folder.docCount > 0 && <span className="text-gray-400 ml-1">({folder.docCount})</span>}
                    </div>
                  ))}
                  {deptFolders.length === 0 && (
                    <div className="text-center text-gray-400 py-8">문서함이 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 오른쪽: 담당자 선택 */}
              {rightPanel === 'dept-picker' && (
                <div className="flex-1 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[13px] font-semibold text-gray-800">담당자 추가 (부서 트리)</h5>
                    <button onClick={() => setRightPanel('none')} className="text-[11px] text-gray-500 hover:text-[#1D9E75]">닫기</button>
                  </div>
                  <DeptEmployeePicker
                    departments={departments}
                    selectedManagers={selectedFolder?.managers ?? []}
                    onSelect={(empId, empName, deptName) => handleAddManager(empId, empName, deptName)}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** 부서 트리에서 사원 선택하는 피커 */
function DeptEmployeePicker({
  departments,
  selectedManagers,
  onSelect,
}: {
  departments: DepartmentTreeResponse[]
  selectedManagers: { empId: number }[]
  onSelect: (empId: number, empName: string, deptName: string) => void
}) {
  const [expandedDepts, setExpandedDepts] = useState<Record<number, boolean>>({})
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const [selectedDeptName, setSelectedDeptName] = useState('')

  const handleDeptClick = async (deptId: number, deptName: string) => {
    setSelectedDeptId(deptId)
    setSelectedDeptName(deptName)
    setExpandedDepts((p) => ({ ...p, [deptId]: !p[deptId] }))
    setLoadingEmp(true)
    try {
      const res = await employeeApi.getList({ deptId, size: 1000 })
      setEmployees(res.data.content)
    } catch {
      setEmployees([])
    } finally {
      setLoadingEmp(false)
    }
  }

  const renderTree = (depts: DepartmentTreeResponse[]) => depts.map((dept) => (
    <div key={dept.id}>
      <div className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer hover:bg-[#E1F5EE] transition-colors"
        onClick={() => handleDeptClick(dept.id, dept.deptName)}>
        <span className="text-gray-800 font-medium text-[12px]">{dept.deptName}</span>
        <span className="text-[11px] text-gray-400">{dept.memberCount}명</span>
      </div>
      {expandedDepts[dept.id] && selectedDeptId === dept.id && (
        <div className="ml-3">
          {loadingEmp ? (
            <div className="text-[11px] text-gray-400 py-2 pl-3">로딩 중...</div>
          ) : employees.map((emp) => {
            const isSelected = selectedManagers.some((m) => m.empId === Number(emp.empNum))
            return (
              <div key={emp.empNum}
                onClick={() => onSelect(Number(emp.empNum), emp.empName, selectedDeptName)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'}`}>
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0">{emp.empName[0]}</div>
                <span className="text-gray-800 flex-1 text-[12px]">{emp.empName} {emp.titleName}</span>
                {isSelected && <span className="text-[#1D9E75] text-[10px] font-medium">담당자</span>}
              </div>
            )
          })}
        </div>
      )}
      {dept.children && dept.children.length > 0 && expandedDepts[dept.id] && selectedDeptId !== dept.id && renderTree(dept.children)}
    </div>
  ))

  return <div className="space-y-1">{renderTree(departments)}</div>
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
      case 'dept-docbox': return <DeptDocBoxSettingsView />
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
