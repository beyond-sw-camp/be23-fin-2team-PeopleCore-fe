import { useState, useEffect, useCallback } from 'react'
import { type TempSavedDoc } from '../ApprovalDocumentPage'
import { FieldSettingsModal } from './ApprovalModals'
import { approvalApi, type DocumentListItem, type PageResponse, type DocumentListSearchParams } from '../../../api/approval'

/* ══════════════════════════════════════════════
   공용 페이지네이션 + 검색 + 툴바 + statusBadge
   ══════════════════════════════════════════════ */

export function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
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

export function SearchBar({ options, onSearch }: { options?: string[]; onSearch?: (keyword: string) => void }) {
  const [keyword, setKeyword] = useState('')
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
        <option>전체기간</option><option>1주일</option><option>1개월</option><option>3개월</option>
      </select>
      <select className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
        {(options ?? ['제목', '기안자', '결재양식']).map((o) => <option key={o}>{o}</option>)}
      </select>
      <div className="flex items-center border border-gray-300 rounded overflow-hidden">
        <input type="text" placeholder="검색" value={keyword} onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(keyword) }}
          className="px-2 py-1 text-[12px] outline-none w-32" />
        <button onClick={() => onSearch?.(keyword)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#6b7280" strokeWidth="1.5" /><path d="M11 11l3 3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  )
}

export function ToolbarRow({ perPage, setPerPage, setPage, fieldModalOpen, children }: {
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

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    'PENDING': { label: '진행중', color: 'bg-[#E1F5EE] text-[#1D9E75]' },
    'APPROVED': { label: '승인', color: 'bg-blue-50 text-blue-600' },
    'REJECTED': { label: '반려', color: 'bg-red-50 text-red-500' },
    'DRAFT': { label: '임시저장', color: 'bg-yellow-50 text-yellow-600' },
    'CANCELED': { label: '회수', color: 'bg-gray-100 text-gray-500' },
    '완료': { label: '완료', color: 'bg-gray-100 text-gray-500' },
    '승인': { label: '승인', color: 'bg-blue-50 text-blue-600' },
    '진행중': { label: '진행중', color: 'bg-[#E1F5EE] text-[#1D9E75]' },
    '반려': { label: '반려', color: 'bg-red-50 text-red-500' },
    '임시저장': { label: '임시저장', color: 'bg-yellow-50 text-yellow-600' },
    '접수대기': { label: '접수대기', color: 'bg-yellow-50 text-yellow-600' },
    '접수': { label: '접수', color: 'bg-[#E1F5EE] text-[#1D9E75]' },
  }
  const info = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }
  return <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${info.color}`}>{info.label}</span>
}

/* ══════════════════════════════════════════════
   공통 API 호출 훅
   ══════════════════════════════════════════════ */

function useDocumentList(
  fetchFn: (params: DocumentListSearchParams) => Promise<{ data: PageResponse<DocumentListItem> }>,
  extraParams?: DocumentListSearchParams,
) {
  const [docs, setDocs] = useState<DocumentListItem[]>([])
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetchFn({ page, size: perPage, search: search || undefined, ...extraParams })
      .then(({ data }) => {
        setDocs(data.content)
        setTotalPages(Math.max(1, data.totalPages))
      })
      .catch(() => {
        setDocs([])
        setTotalPages(1)
      })
      .finally(() => setLoading(false))
  }, [fetchFn, page, perPage, search, extraParams])

  useEffect(() => { load() }, [load])

  return { docs, page, setPage, perPage, setPerPage, totalPages, loading, search, setSearch }
}

/* ══════════════════════════════════════════════
   필드 정의
   ══════════════════════════════════════════════ */

const ALL_FIELDS = [
  { key: 'date', label: '기안일', desc: '최초 결재문서가 시작된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'dept', label: '기안부서', desc: '기안자가 소속된 부서가 표시됩니다.' },
]

const DRAFT_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'dept', label: '기안부서', desc: '기안자가 소속된 부서가 표시됩니다.' },
  { key: 'docNum', label: '문서번호', desc: '결재 문서번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const TEMP_FIELDS = [
  { key: 'date', label: '생성일', desc: '임시 저장된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

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

const CC_VIEW_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'docNum', label: '문서번호', desc: '결재 문서번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const SENT_FIELDS = [
  { key: 'date', label: '기안일', desc: '문서가 기안된 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'docNum', label: '문서번호', desc: '결재 문서번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

const INBOX_FIELDS = [
  { key: 'date', label: '접수일', desc: '문서를 수신한 날짜를 표시합니다.' },
  { key: 'form', label: '결재양식', desc: '결재 양식의 종류를 표시합니다.' },
  { key: 'urgent', label: '긴급', desc: '긴급으로 기안한 문서가 표시됩니다.' },
  { key: 'title', label: '제목', desc: '문서의 제목이 표시됩니다.' },
  { key: 'files', label: '첨부', desc: '첨부파일이 포함되었는지 표시됩니다.' },
  { key: 'author', label: '기안자', desc: '문서의 기안자가 표시됩니다.' },
  { key: 'docNum', label: '문서번호', desc: '결재 문서번호를 표시합니다.' },
  { key: 'status', label: '결재상태', desc: '현재 결재 진행 상태를 표시합니다.' },
]

/* ══════════════════════════════════════════════
   공통 문서 목록 테이블 렌더러
   ══════════════════════════════════════════════ */

function DocTable({ docs, fields, visibleFields, loading, onDocClick }: {
  docs: DocumentListItem[]
  fields: { key: string; label: string }[]
  visibleFields: string[]
  loading: boolean
  onDocClick?: (docId: number) => void
}) {
  const v = (k: string) => visibleFields.includes(k)

  if (loading) {
    return <div className="py-20 text-center text-gray-400 text-[13px]">로딩 중...</div>
  }

  return (
    <table className="w-full text-left text-[12px]">
      <thead>
        <tr className="border-b border-gray-200">
          {fields.filter((f) => v(f.key)).map((f) => (
            <th key={f.key} className={`px-4 py-3 text-gray-500 font-medium whitespace-nowrap ${['files', 'author', 'dept', 'docNum', 'status'].includes(f.key) ? 'text-right' : ''}`}>
              {f.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {docs.length === 0 ? (
          <tr><td colSpan={visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">문서가 없습니다.</td></tr>
        ) : docs.map((doc) => (
          <tr key={doc.docId} onClick={() => onDocClick?.(doc.docId)}
            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
            {v('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.createdAt?.slice(0, 10)}</td>}
            {v('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.formName}</td>}
            {v('urgent') && <td className="px-4 py-3 whitespace-nowrap">{doc.isEmergency && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}</td>}
            {v('title') && <td className="px-4 py-3 text-gray-900 font-medium">{doc.docTitle}</td>}
            {v('files') && <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{doc.hasAttachment && <i className="fas fa-paperclip text-[10px]" />}</td>}
            {v('author') && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{doc.drafterName}</td>}
            {v('dept') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{doc.drafterDept}</td>}
            {v('docNum') && <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{doc.docNum || '-'}</td>}
            {v('status') && <td className="px-4 py-3 text-right">{statusBadge(doc.docStatus)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ══════════════════════════════════════════════
   Document List Components
   ══════════════════════════════════════════════ */

/* ── 문서함 리스트 (공통 fallback) ── */
export function DocumentList({ title }: { title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">{title}</h1>
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
            <tr><td colSpan={5} className="py-16 text-center"><div className="text-gray-300 text-[13px]">문서가 없습니다.</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── 임시 저장함 ── */
export function TempSavedList({ docs: _localDocs, onOpen, onDelete }: {
  docs: TempSavedDoc[]
  onOpen: (doc: TempSavedDoc) => void
  onDelete: (id: number) => void
}) {
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(20)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(TEMP_FIELDS.map((f) => f.key))
  const [apiDocs, setApiDocs] = useState<DocumentListItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())

  const loadDocs = useCallback(() => {
    setLoading(true)
    approvalApi.getTempDocuments({ page, size: perPage })
      .then(({ data }) => {
        setApiDocs(data.content)
        setTotalPages(Math.max(1, data.totalPages))
      })
      .catch(() => { setApiDocs([]); setTotalPages(1) })
      .finally(() => setLoading(false))
  }, [page, perPage])

  useEffect(() => { loadDocs() }, [loadDocs])

  const v = (k: string) => visibleFields.includes(k)
  const allChecked = apiDocs.length > 0 && apiDocs.every((d) => checkedIds.has(d.docId))
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(apiDocs.map((d) => d.docId)))
  }
  const toggleOne = (id: number) => {
    setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleBulkDelete = async () => {
    for (const id of checkedIds) {
      try {
        await approvalApi.deleteDocument(id)
        onDelete(id)
      } catch { /* skip */ }
    }
    setCheckedIds(new Set())
    loadDocs()
  }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">임시 저장함</h1>
      <div className="flex items-center gap-4 text-[12px] text-gray-600 mb-3">
        <button disabled={checkedIds.size === 0} onClick={handleBulkDelete}
          className="flex items-center gap-1.5 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
          {loading ? (
            <tr><td colSpan={1 + visibleFields.length} className="py-20 text-center text-gray-400 text-[13px]">로딩 중...</td></tr>
          ) : apiDocs.length === 0 ? (
            <tr><td colSpan={1 + visibleFields.length} className="py-20 text-center text-gray-300 text-[13px]">임시 저장된 문서가 없습니다.</td></tr>
          ) : apiDocs.map((doc) => (
            <tr key={doc.docId}
              className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${checkedIds.has(doc.docId) ? 'bg-blue-50/40' : ''}`}
              onClick={() => onOpen({ id: doc.docId, form: { formId: 0, name: doc.formName, folder: '', retention: '' }, docData: {}, savedAt: doc.createdAt?.slice(0, 10) ?? '' })}>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={checkedIds.has(doc.docId)} onChange={() => toggleOne(doc.docId)} className="accent-[#1D9E75]" />
              </td>
              {v('date') && <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.createdAt?.slice(0, 10)}</td>}
              {v('form') && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.formName}</td>}
              {v('urgent') && <td className="px-4 py-3 whitespace-nowrap">{doc.isEmergency && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}</td>}
              {v('title') && <td className="px-4 py-3 text-gray-900 font-medium">{doc.docTitle}</td>}
              {v('files') && <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{doc.hasAttachment && <i className="fas fa-paperclip text-[10px]" />}</td>}
              {v('status') && <td className="px-4 py-3 text-right">{statusBadge('임시저장')}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '결재양식']} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={TEMP_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 결재 대기 문서 목록 ── */
export function WaitingDocList({ title = '결재 대기 문서' }: { title?: string }) {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getWaitingDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(ALL_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">{title}</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={ALL_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={ALL_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 결재 수신 문서 목록 ── */
export function ReceivedDocList({ title = '결재 수신 문서' }: { title?: string }) {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getReceivedDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(RECEIVED_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">{title}</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={RECEIVED_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '기안자', '원문번호']} onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={RECEIVED_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 참조/열람 대기 문서 목록 ── */
export function CcViewDocList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getCcViewDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(CC_VIEW_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">참조/열람 대기 문서</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={CC_VIEW_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '기안자', '문서번호']} onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={CC_VIEW_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 결재 예정 문서 목록 ── */
export function UpcomingDocList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getUpcomingDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(ALL_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">결재 예정 문서</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={ALL_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={ALL_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 기안 완료 문서함 ── */
export function DraftDocList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getDraftDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(DRAFT_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">기안 완료 문서함</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={DRAFT_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={DRAFT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 결재 문서함 ── */
export function ApprovalBoxList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getApprovedDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(DRAFT_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">결재 문서함</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={DRAFT_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={DRAFT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 참조/열람 문서함 ── */
export function CcViewBoxList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getCcViewBoxDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(CC_VIEW_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">참조/열람 문서함</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={CC_VIEW_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '기안자', '문서번호']} onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={CC_VIEW_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 발송 문서함 ── */
export function SentDocList({ title = '발송 문서함' }: { title?: string }) {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getSentDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(SENT_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">{title}</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={SENT_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '기안자', '결재양식']} onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={SENT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 수신 문서함 ── */
export function InboxDocList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getInboxDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(INBOX_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">수신 문서함</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={INBOX_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '기안자', '문서번호']} onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={INBOX_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

/* ── 부서 문서함 (완료/수신/발신) ── */
export function DeptCompletedDocList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getDeptCompletedDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(DRAFT_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">부서 결재 완료함</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={DRAFT_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={DRAFT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

export function DeptReceivedDocList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getDeptReceivedDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(RECEIVED_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">부서 결재 수신함</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={RECEIVED_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '기안자']} onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={RECEIVED_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}

export function DeptSentDocList() {
  const { docs, page, setPage, perPage, setPerPage, totalPages, loading, setSearch } = useDocumentList(approvalApi.getDeptSentDocuments)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [visibleFields, setVisibleFields] = useState(SENT_FIELDS.map((f) => f.key))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">부서 결재 발신함</h1>
      <ToolbarRow perPage={perPage} setPerPage={setPerPage} setPage={setPage} fieldModalOpen={() => setFieldModalOpen(true)} />
      <DocTable docs={docs} fields={SENT_FIELDS} visibleFields={visibleFields} loading={loading} />
      <Pagination page={page + 1} totalPages={totalPages} setPage={(p) => setPage(p - 1)} />
      <SearchBar options={['제목', '기안자']} onSearch={setSearch} />
      <FieldSettingsModal isOpen={fieldModalOpen} fields={SENT_FIELDS} visibleFields={visibleFields} onClose={() => setFieldModalOpen(false)} onSave={(f) => { setVisibleFields(f); setFieldModalOpen(false) }} />
    </div>
  )
}
