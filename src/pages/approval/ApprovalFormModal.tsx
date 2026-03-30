import { useState } from 'react'

/* ── 양식 데이터 ── */
export interface FormItem {
  name: string
  folder: string
  retention: string
}

interface FormFolder {
  name: string
  items: FormItem[]
}

export const FORM_FOLDERS: FormFolder[] = [
  {
    name: '출장',
    items: [
      { name: '해외출장신청', folder: '출장', retention: '5년' },
      { name: '비자발급신청', folder: '출장', retention: '5년' },
      { name: '국내출장신청', folder: '출장', retention: '5년' },
    ],
  },
  {
    name: '인사',
    items: [
      { name: '교육결과보고', folder: '인사', retention: '3년' },
      { name: '휴직원', folder: '인사', retention: '5년' },
      { name: '채용요청', folder: '인사', retention: '5년' },
      { name: '휴가신청', folder: '인사', retention: '3년' },
      { name: '채용품의', folder: '인사', retention: '5년' },
      { name: '결근사유서', folder: '인사', retention: '3년' },
      { name: '교육수강신청', folder: '인사', retention: '3년' },
    ],
  },
  {
    name: '일반',
    items: [
      { name: '지출결의', folder: '일반', retention: '5년' },
      { name: '경조금지급신청', folder: '일반', retention: '5년' },
      { name: '구매품의서', folder: '일반', retention: '5년' },
    ],
  },
]

const DEPARTMENTS = ['ONE TEAM', '경영지원팀', '개발팀', '인사팀']
const DEPT_DOCS = ['미지정', '경영지원팀', '개발팀']

interface ApprovalFormModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (form: FormItem, department: string, deptDoc: string) => void
  onAddFrequent: (formName: string) => void
}

export default function ApprovalFormModal({ isOpen, onClose, onConfirm, onAddFrequent }: ApprovalFormModalProps) {
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(
    Object.fromEntries(FORM_FOLDERS.map((f) => [f.name, true]))
  )
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null)
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [deptDoc, setDeptDoc] = useState(DEPT_DOCS[0])

  if (!isOpen) return null

  const toggleFolder = (name: string) => {
    setExpandedFolders((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const filteredFolders = FORM_FOLDERS.map((folder) => ({
    ...folder,
    items: folder.items.filter((item) =>
      item.name.includes(search)
    ),
  })).filter((folder) => folder.items.length > 0)

  const handleConfirm = () => {
    if (selectedForm) {
      onConfirm(selectedForm, department, deptDoc)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[700px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">결재양식 선택</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* + 자주 쓰는 양식으로 추가 */}
        <div className="flex justify-end px-6 pt-3">
          <button
            disabled={!selectedForm}
            onClick={() => { if (selectedForm) onAddFrequent(selectedForm.name) }}
            className="text-[12px] text-gray-600 hover:text-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + 자주 쓰는 양식으로 추가
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 overflow-hidden px-6 py-3 gap-4">
          {/* 왼쪽: 트리 */}
          <div className="w-[260px] border border-gray-200 rounded-lg flex flex-col shrink-0">
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
              {filteredFolders.map((folder) => (
                <div key={folder.name}>
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
                      key={item.name}
                      className={`flex items-center gap-1 py-1 pl-7 pr-2 cursor-pointer rounded transition-colors select-none ${
                        selectedForm?.name === item.name
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
              ))}
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
              <div className="flex items-center">
                <span className="w-24 text-gray-500 shrink-0">기안부서</span>
                {selectedForm ? (
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : null}
              </div>
              <div className="flex items-center">
                <span className="w-24 text-gray-500 shrink-0">부서문서함</span>
                {selectedForm ? (
                  <select
                    value={deptDoc}
                    onChange={(e) => setDeptDoc(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                  >
                    {DEPT_DOCS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : null}
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
