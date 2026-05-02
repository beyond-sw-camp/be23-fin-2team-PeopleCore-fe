import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { approvalApi, type FormFolderResponse, type FormListResponse } from '../../api/approval'
import { queryKeys } from '../../lib/queryKeys'

/* ── 양식 데이터 ── */
export interface FormItem {
  formId: number
  name: string
  folder: string
  retention: string
  formCode?: string
}

interface FormFolder {
  folderId: number
  name: string
  items: FormItem[]
}

interface ApprovalFormModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (form: FormItem, department: string, deptDoc: string) => void
  onAddFrequent: (formId: number) => void
}

export default function ApprovalFormModal({ isOpen, onClose, onConfirm, onAddFrequent }: ApprovalFormModalProps) {
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null)

  const foldersQuery = useQuery({
    queryKey: ['approval', 'formFolders'],
    queryFn: () => approvalApi.getFormFolders().then((r) => r.data),
    enabled: isOpen,
  })
  const formsQuery = useQuery({
    queryKey: queryKeys.approval.forms(),
    queryFn: () => approvalApi.getForms().then((r) => r.data),
    enabled: isOpen,
  })
  const folders: FormFolder[] = foldersQuery.data && formsQuery.data
    ? flattenFolders(foldersQuery.data, formsQuery.data)
    : []
  const loading = isOpen && (foldersQuery.isPending || formsQuery.isPending)

  useEffect(() => {
    if (folders.length === 0) return
    setExpandedFolders((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const expanded: Record<string, boolean> = {}
      folders.forEach((f) => { expanded[f.name] = true })
      return expanded
    })
  }, [folders])

  if (!isOpen) return null

  const toggleFolder = (name: string) => {
    setExpandedFolders((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const filteredFolders = folders.map((folder) => ({
    ...folder,
    items: folder.items.filter((item) => item.name.includes(search)),
  })).filter((folder) => folder.items.length > 0)

  const handleConfirm = () => {
    if (selectedForm) {
      onConfirm(selectedForm, '', '')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-[700px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">결재양식 선택</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* + 자주 쓰는 양식으로 추가 */}
        <div className="flex justify-end px-6 pt-3">
          <button
            disabled={!selectedForm}
            onClick={() => { if (selectedForm) onAddFrequent(selectedForm.formId) }}
            className="text-[12px] text-gray-600 hover:text-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + 자주 쓰는 양식으로 추가
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden px-4 sm:px-6 py-3 gap-4">
          {/* 왼쪽: 트리 */}
          <div className="w-full sm:w-[260px] sm:max-h-none max-h-[40vh] border border-gray-200 rounded-lg flex flex-col shrink-0">
            {/* 검색 */}
            <div className="flex items-center border-b border-gray-200 px-3 py-2">
              <input
                type="text"
                placeholder="양식제목"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="flex-1 text-[12px] outline-none bg-transparent placeholder-gray-400"
              />
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* 트리 목록 */}
            <div className="flex-1 overflow-y-auto p-2 text-[12px]">
              {loading ? (
                <div className="text-center text-gray-400 py-8">양식 로딩 중...</div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-center text-gray-400 py-8">양식이 없습니다.</div>
              ) : (
                filteredFolders.map((folder) => (
                  <div key={folder.folderId}>
                    {/* 폴더 */}
                    <div
                      className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-gray-50 rounded select-none"
                      onClick={() => toggleFolder(folder.name)}
                    >
                      <span className="text-[10px] text-gray-500 w-3">
                        {expandedFolders[folder.name] ? '▼' : '▶'}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path d="M1 4v9a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1H8L6.5 3H2a1 1 0 00-1 1z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5"/>
                      </svg>
                      <span className="font-semibold text-gray-800">{folder.name}</span>
                    </div>

                    {/* 파일 목록 */}
                    {expandedFolders[folder.name] && folder.items.map((item) => (
                      <div
                        key={item.formId}
                        className={`flex items-center gap-1 py-1 pl-7 pr-2 cursor-pointer rounded transition-colors select-none ${
                          selectedForm?.formId === item.formId
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedForm(item)}
                      >
                        <svg width="12" height="14" viewBox="0 0 12 16" fill="none" className="shrink-0">
                          <path d="M1 1.5A.5.5 0 011.5 1H8l3 3v10.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-13z" fill="white" stroke="#9ca3af" strokeWidth="1"/>
                          <path d="M8 1v3h3" stroke="#9ca3af" strokeWidth="1"/>
                        </svg>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 오른쪽: 상세정보 */}
          <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <span className="text-[13px] font-semibold text-gray-800">상세정보</span>
            </div>
            <div className="p-4 space-y-4 text-[13px]">
              <div className="flex">
                <span className="w-24 text-gray-500 shrink-0">제목</span>
                <span className="text-gray-900">{selectedForm?.name ?? ''}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-gray-500 shrink-0">전사문서함</span>
                <span className="text-gray-900">{selectedForm?.folder ?? ''}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-gray-500 shrink-0">보존연한</span>
                <span className="text-gray-900">{selectedForm?.retention ?? ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleConfirm}
            disabled={!selectedForm}
            className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            확인
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 헬퍼: 폴더 트리를 flat list로 변환 ── */
function flattenFolders(folderTree: FormFolderResponse[], allForms: FormListResponse[]): FormFolder[] {
  const result: FormFolder[] = []

  function traverse(folders: FormFolderResponse[]) {
    for (const folder of folders) {
      if (!folder.folderIsVisible) continue
      const items = allForms
        .filter((f) => f.folderId === folder.folderId && f.isActive)
        .map((f) => ({
          formId: f.formId,
          name: f.formName,
          folder: folder.folderName,
          retention: `${f.formRetentionYear}년`,
        }))
      if (items.length > 0) {
        result.push({ folderId: folder.folderId, name: folder.folderName, items })
      }
      if (folder.children?.length > 0) {
        traverse(folder.children)
      }
    }
  }

  traverse(folderTree)
  return result
}
