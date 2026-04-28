import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SettingsModal from '../modals/SettingsModal'
import { openApprovalWindow } from '../../utils/approvalWindow'
import { useAuth } from '../../contexts/AuthContext'
import { alarmApi, type AlarmItem } from '../../api/alarm'
import { interestCalendarApi } from '../../api/calendar'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { getAccessToken, parseJwt } from '../../utils/token'
import { searchApi, suggestApi, historyApi, advancedSearchApi, type SearchType, type SearchSort, type SearchResultItem, type SuggestItem, type SearchHistoryItem, type AdvancedSearchParams } from '../../api/search'
import { FEATURES, filterFeaturesByRole, matchFeatures, type FeatureEntry } from '../../config/features'
import CopilotDrawer from '../copilot/CopilotDrawer'

// ── 검색 카테고리 정의 ──────────────────────────────────
const SEARCH_CATEGORIES = [
  { key: 'all',        label: '전체' },
  { key: 'EMPLOYEE',   label: '사원' },
  { key: 'DEPARTMENT', label: '부서' },
  { key: 'APPROVAL',   label: '전자결재' },
  { key: 'CALENDAR',   label: '캘린더' },
] as const

type CategoryKey = (typeof SEARCH_CATEGORIES)[number]['key']

// ── 카테고리별 아이콘 매핑 ──────────────────────────────
const CATEGORY_ICONS: Record<SearchType, string> = {
  EMPLOYEE:   'fa-solid fa-user',
  DEPARTMENT: 'fa-solid fa-sitemap',
  APPROVAL:   'fa-solid fa-file-signature',
  CALENDAR:   'fa-solid fa-calendar-da                                                                                                                                                                      ys',
}

const CATEGORY_LABELS: Record<SearchType, string> = {
  EMPLOYEE:   '사원',
  DEPARTMENT: '부서',
  APPROVAL:   '전자결재',
  CALENDAR:   '캘린더',
}

// ── 통합검색 모달 ───────────────────────────────────────
function SearchModal({ query: initialQuery, onClose }: { query: string; onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery)
  const [searchedQuery, setSearchedQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [items, setItems] = useState<SearchResultItem[]>([])
  const [typeCounts, setTypeCounts] = useState<Record<SearchType, number>>({ EMPLOYEE: 0, DEPARTMENT: 0, APPROVAL: 0, CALENDAR: 0 })
  const [totalHits, setTotalHits] = useState(0)
  const [sort, setSort] = useState<SearchSort>('relevance')
  const [page, setPage] = useState(0)
  const SIZE = 20
  // 상세 검색 필터
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [filters, setFilters] = useState<AdvancedSearchParams>({})
  const hasAdvancedFilters = Boolean(
    filters.dateFrom || filters.dateTo || filters.author || filters.department || filters.fileType
  )
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const loadHistory = useCallback(() => {
    historyApi.list(10)
      .then(({ data }) => setHistory(data))
      .catch(() => setHistory([]))
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleRemoveHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await historyApi.remove(id)
      setHistory((prev) => prev.filter((h) => h.id !== id))
    } catch { /* ignore */ }
  }

  const handleClearHistory = async () => {
    try {
      await historyApi.clear()
      setHistory([])
    } catch { /* ignore */ }
  }

  const handlePickHistory = (keyword: string) => {
    setQuery(keyword)
    setSearchedQuery(keyword)
  }

  const runSearch = useCallback(async (
    keyword: string,
    type: CategoryKey,
    pageArg: number,
    sortArg: SearchSort,
    advFilters: AdvancedSearchParams,
  ) => {
    const hasAdv = Boolean(
      advFilters.dateFrom || advFilters.dateTo || advFilters.author || advFilters.department || advFilters.fileType
    )
    if (!keyword.trim() && !hasAdv) {
      setItems([])
      setTypeCounts({ EMPLOYEE: 0, DEPARTMENT: 0, APPROVAL: 0, CALENDAR: 0 })
      setTotalHits(0)
      return
    }
    setLoading(true)
    try {
      const { data } = hasAdv
        ? await advancedSearchApi.search({
            keyword: keyword.trim() || undefined,
            type: type === 'all' ? undefined : type,
            page: pageArg,
            size: SIZE,
            sort: sortArg,
            ...advFilters,
          })
        : await searchApi.search(keyword, type === 'all' ? undefined : type, pageArg, SIZE, sortArg)
      setItems(data.items)
      setTypeCounts(data.typeCounts)
      setTotalHits(data.totalHits)
      if (keyword.trim()) loadHistory()
    } catch {
      setItems([])
      setTotalHits(0)
    } finally {
      setLoading(false)
    }
  }, [loadHistory])

  // 검색어/카테고리/정렬/페이지/필터 변경 시 자동 재조회
  useEffect(() => {
    if (searchedQuery.trim() || hasAdvancedFilters) runSearch(searchedQuery, activeCategory, page, sort, filters)
  }, [searchedQuery, activeCategory, page, sort, filters, hasAdvancedFilters, runSearch])

  // 검색어/카테고리/정렬/필터 바뀌면 페이지 초기화
  useEffect(() => { setPage(0) }, [searchedQuery, activeCategory, sort, filters])

  const handleSearch = () => {
    if (query.trim()) setSearchedQuery(query.trim())
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSearch()
  }

  const handleResultClick = (item: SearchResultItem) => {
    switch (item.type) {
      case 'EMPLOYEE':
        window.dispatchEvent(new CustomEvent('open-orgchart', { detail: { empId: item.sourceId } }))
        break
      case 'DEPARTMENT':
        window.dispatchEvent(new CustomEvent('open-orgchart', { detail: { deptId: item.sourceId } }))
        break
      case 'APPROVAL':
        openApprovalWindow({ viewDocId: Number(item.sourceId) })
        break
      case 'CALENDAR':
        navigate('/calendar', { state: { viewEventId: Number(item.sourceId) } })
        break
    }
    onClose()
  }

  // '전체' 탭: API에서 이미 모든 type을 반환하므로 그대로 사용
  const filteredResults = items

  // 전체 탭일 때 type별 그룹핑
  const groupedResults = activeCategory === 'all'
    ? (['EMPLOYEE', 'DEPARTMENT', 'APPROVAL', 'CALENDAR'] as SearchType[]).reduce<Record<string, SearchResultItem[]>>((acc, type) => {
        const group = filteredResults.filter(i => i.type === type)
        if (group.length > 0) acc[type] = group
        return acc
      }, {})
    : null

  // 카테고리 탭에 표시할 건수
  const totalCount = Object.values(typeCounts).reduce((a, b) => a + b, 0)
  const categoryCounts: Record<string, number> = {
    all: totalCount,
    ...typeCounts,
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-100 bg-black/40 flex items-start justify-center pt-15 px-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        {/* 검색 입력 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <i className="fa-solid fa-magnifying-glass text-gray-400 text-[16px]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="검색어를 입력하세요"
            className="flex-1 text-[15px] text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
              <i className="fa-solid fa-xmark text-gray-500 text-[11px]" />
            </button>
          )}
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className={`ml-1 px-2.5 py-1 rounded-md text-[12px] flex items-center gap-1.5 transition-colors ${
              advancedOpen || hasAdvancedFilters
                ? 'bg-[#E6F4EF] text-[#1D9E75]'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="상세 검색"
          >
            <i className="fa-solid fa-sliders text-[11px]" />
            <span>상세</span>
            {hasAdvancedFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
            )}
          </button>
          <button onClick={onClose} className="ml-1 text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fa-solid fa-xmark text-[18px]" />
          </button>
        </div>

        {/* 상세 검색 패널 */}
        {advancedOpen && (
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 w-14 shrink-0">기간 시작</span>
                <input
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                  className="flex-1 text-[12px] px-2 py-1 border border-gray-200 rounded bg-white"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 w-14 shrink-0">기간 종료</span>
                <input
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                  className="flex-1 text-[12px] px-2 py-1 border border-gray-200 rounded bg-white"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 w-14 shrink-0">작성자</span>
                <input
                  type="text"
                  placeholder="이름"
                  value={filters.author ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, author: e.target.value || undefined }))}
                  className="flex-1 text-[12px] px-2 py-1 border border-gray-200 rounded bg-white"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 w-14 shrink-0">부서</span>
                <input
                  type="text"
                  placeholder="부서명"
                  value={filters.department ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value || undefined }))}
                  className="flex-1 text-[12px] px-2 py-1 border border-gray-200 rounded bg-white"
                />
              </label>
              <label className="flex items-center gap-2 col-span-2">
                <span className="text-[11px] text-gray-500 w-14 shrink-0">파일 유형</span>
                <select
                  value={filters.fileType ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, fileType: e.target.value || undefined }))}
                  className="flex-1 text-[12px] px-2 py-1 border border-gray-200 rounded bg-white"
                >
                  <option value="">전체</option>
                  <option value="PDF">PDF</option>
                  <option value="IMAGE">이미지</option>
                  <option value="DOC">문서 (DOC/DOCX)</option>
                  <option value="XLS">스프레드시트 (XLS/XLSX)</option>
                  <option value="HWP">한글 (HWP)</option>
                  <option value="ETC">기타</option>
                </select>
              </label>
            </div>
            {hasAdvancedFilters && (
              <div className="flex justify-end">
                <button
                  onClick={() => setFilters({})}
                  className="text-[11px] text-gray-500 hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-rotate-left mr-1" />
                  조건 초기화
                </button>
              </div>
            )}
          </div>
        )}

        {/* 카테고리 탭 */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-100 overflow-x-auto scrollbar-none">
          {SEARCH_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key
            const count = categoryCounts[cat.key] ?? 0
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#1D9E75] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
                {searchedQuery && count > 0 && (
                  <span className={`ml-1.5 text-[11px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 정렬 바 */}
        {(searchedQuery.trim() || hasAdvancedFilters) && (
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100 bg-white">
            <span className="text-[12px] text-gray-500">
              총 <strong className="text-gray-700">{totalHits.toLocaleString()}</strong>건
            </span>
            <div className="flex items-center gap-1">
              {([
                { key: 'relevance', label: '관련도순' },
                { key: 'latest',    label: '최신순' },
                { key: 'oldest',    label: '오래된순' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className={`px-2.5 py-1 text-[12px] rounded-md transition-colors ${
                    sort === opt.key
                      ? 'text-[#1D9E75] font-semibold bg-[#E6F4EF]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto">
          {!searchedQuery.trim() && !hasAdvancedFilters ? (
            /* 검색어 없을 때 - 최근 검색어 */
            history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <i className="fa-solid fa-magnifying-glass text-[32px] mb-4 text-gray-300" />
                <p className="text-[14px] font-medium text-gray-500">검색어를 입력하세요</p>
                <p className="text-[12px] mt-1">사원, 부서, 전자결재, 캘린더를 통합 검색합니다</p>
              </div>
            ) : (
              <div className="py-2">
                <div className="flex items-center justify-between px-6 py-2.5 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <i className="fa-regular fa-clock text-[12px] text-[#1D9E75]" />
                    <span className="text-[13px] font-semibold text-gray-700">최근 검색어</span>
                    <span className="text-[11px] text-gray-400 ml-1">{history.length}건</span>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    전체 삭제
                  </button>
                </div>
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="group flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handlePickHistory(h.keyword)}
                  >
                    <i className="fa-regular fa-clock text-[12px] text-gray-300" />
                    <span className="flex-1 text-[13px] text-gray-700 truncate">{h.keyword}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {new Date(h.searchedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                    </span>
                    <button
                      onClick={(e) => handleRemoveHistory(h.id, e)}
                      className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                      aria-label="검색어 삭제"
                    >
                      <i className="fa-solid fa-xmark text-[10px] text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <i className="fa-solid fa-spinner fa-spin text-[24px] mb-3 text-gray-300" />
              <p className="text-[13px] text-gray-500">검색 중...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            /* 결과 없음 */
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <i className="fa-regular fa-face-frown text-[32px] mb-4 text-gray-300" />
              <p className="text-[14px] font-medium text-gray-500">검색 결과가 없습니다</p>
              <p className="text-[12px] mt-1">다른 검색어나 카테고리를 시도해보세요</p>
            </div>
          ) : activeCategory === 'all' && groupedResults ? (
            /* 전체 탭 - 타입별 그룹 */
            <div className="py-2">
              {Object.entries(groupedResults).map(([typeKey, groupItems]) => {
                const type = typeKey as SearchType
                return (
                  <div key={typeKey} className="mb-1">
                    <div className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 sticky top-0">
                      <i className={`${CATEGORY_ICONS[type]} text-[12px] text-[#1D9E75]`} />
                      <span className="text-[13px] font-semibold text-gray-700">{CATEGORY_LABELS[type]}</span>
                      <span className="text-[11px] text-gray-400 ml-1">{groupItems.length}건</span>
                    </div>
                    {groupItems.map((item) => (
                      <ResultItem key={item.id} item={item} onClick={handleResultClick} />
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            /* 개별 카테고리 탭 */
            <div className="py-2">
              {filteredResults.map((item) => (
                <ResultItem key={item.id} item={item} onClick={handleResultClick} />
              ))}
            </div>
          )}
        </div>

        {/* 하단 바 - 페이지네이션 */}
        {(searchedQuery.trim() || hasAdvancedFilters) && totalHits > 0 && (() => {
          const totalPages = Math.max(1, Math.ceil(totalHits / SIZE))
          const windowSize = 5
          const windowStart = Math.max(0, Math.min(page - Math.floor(windowSize / 2), totalPages - windowSize))
          const windowEnd = Math.min(totalPages, windowStart + windowSize)
          const pages: number[] = []
          for (let p = windowStart; p < windowEnd; p++) pages.push(p)
          return (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-[11px] text-gray-400">
                {page + 1} / {totalPages} 페이지
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="w-7 h-7 text-[11px] text-gray-500 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="첫 페이지"
                >
                  <i className="fa-solid fa-angles-left" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-7 h-7 text-[11px] text-gray-500 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="이전 페이지"
                >
                  <i className="fa-solid fa-angle-left" />
                </button>
                {pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 text-[12px] rounded transition-colors ${
                      p === page
                        ? 'bg-[#1D9E75] text-white font-semibold'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-7 h-7 text-[11px] text-gray-500 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="다음 페이지"
                >
                  <i className="fa-solid fa-angle-right" />
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="w-7 h-7 text-[11px] text-gray-500 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="마지막 페이지"
                >
                  <i className="fa-solid fa-angles-right" />
                </button>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── 검색 결과 아이템 ────────────────────────────────────
function ResultItem({ item, onClick }: { item: SearchResultItem; onClick: (item: SearchResultItem) => void }) {
  // 서버에서 <em>...</em> 태그가 삽입된 fragment 그대로 렌더 (ES가 원본 HTML은 escape).
  // fragment 없으면 평문 그대로.
  const hl = item.highlights || {}
  const renderField = (fieldKey: string, fallback: string | undefined | null) => {
    const fragment = hl[fieldKey]?.[0]
    const text = fragment ?? fallback ?? ''
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }
  // 여러 필드를 " · " 로 이어붙일 때 사용 — 값이 있는 것만.
  const joinFields = (entries: Array<[string, string | undefined | null]>) => {
    const parts = entries
      .filter(([, raw]) => raw != null && raw !== '')
      .map(([key, raw]) => hl[key]?.[0] ?? raw)
    return parts.join(' · ')
  }

  const icon = CATEGORY_ICONS[item.type]

  // 타입별로 부가 정보(두번째 줄) — 값+highlight key를 함께 전달해 서버 fragment 우선.
  const descriptionHtml = (() => {
    const meta = item.metadata || {}
    switch (item.type) {
      case 'EMPLOYEE':
        return joinFields([
          ['metadata.deptName', meta.deptName],
          ['metadata.gradeName', meta.gradeName],
          ['metadata.titleName', meta.titleName],
        ]) || meta.empEmail || ''
      case 'DEPARTMENT':
        return meta.deptCode ? `코드: ${meta.deptCode}` : ''
      case 'APPROVAL':
        return joinFields([
          ['metadata.docNum', meta.docNum],
          ['metadata.empName', meta.empName],
          ['', meta.approvalStatus], // status는 하이라이트 대상 아님
        ])
      case 'CALENDAR':
        return joinFields([
          ['metadata.location', meta.location],
          ['', meta.startAt?.slice(0, 16).replace('T', ' ')],
        ])
      default:
        return hl['content']?.[0] ?? item.content ?? ''
    }
  })()

  // 상태 뱃지 (결재 문서용)
  const statusBadge = (() => {
    if (item.type !== 'APPROVAL') return null
    const status = item.metadata?.approvalStatus
    const styles: Record<string, string> = {
      PENDING:  'bg-blue-100 text-blue-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    }
    if (!status || !styles[status]) return null
    return <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status]}`}>{status}</span>
  })()

  return (
    <div
      onClick={() => onClick(item)}
      className="flex items-start gap-3.5 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#E1F5EE] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
        <i className={`${icon} text-[13px] text-gray-400 group-hover:text-[#1D9E75] transition-colors`} />
      </div>
      <div className="flex-1 min-w-0 search-hl">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-gray-800 truncate">{renderField('title', item.title)}</p>
          {statusBadge}
        </div>
        {descriptionHtml && (
          <p className="text-[12px] text-gray-500 mt-0.5 truncate" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        )}
      </div>
      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

// ── 알림 아이콘/링크 매핑 ──────────────────────────────────
const NOTIF_ICON_MAP: Record<string, string> = {
  attendance: 'fa-solid fa-briefcase',
  approval: 'fa-solid fa-file-signature',
  board: 'fa-solid fa-clipboard-list',
  hr: 'fa-solid fa-user-tie',
  system: 'fa-solid fa-gear',
}

// ── 알림 패널 ─────────────────────────────────────────────
const NOTIF_SIDEBAR = [
  { key: 'all', label: '전체 알림' },
  { key: 'unread', label: '안읽은 알림' },
] as const

type NotifTab = (typeof NOTIF_SIDEBAR)[number]['key']

function NotificationPanel({ onClose, onUnreadCountChange }: { onClose: () => void; onUnreadCountChange: (count: number) => void }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<NotifTab>('all')
  const [notifications, setNotifications] = useState<AlarmItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [shareReqModal, setShareReqModal] = useState<AlarmItem | null>(null)
  const [respondLoading, setRespondLoading] = useState(false)

  const fetchAlarms = useCallback(async (filter: 'all' | 'unread' = 'all') => {
    setLoading(true)
    try {
      const { data } = await alarmApi.getAlarms({ filter, page: 0, size: 50 })
      setNotifications(data.content)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await alarmApi.getUnreadCount()
      setUnreadCount(data.count)
      onUnreadCountChange(data.count)
    } catch { /* ignore */ }
  }, [onUnreadCountChange])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 탭 변경 시 알림 목록/미읽 수 재조회
    fetchAlarms(tab)
    fetchUnreadCount()
  }, [tab, fetchAlarms, fetchUnreadCount])

  const markAllRead = async () => {
    try {
      await alarmApi.markAllAsRead()
      setNotifications((p) => p.map((n) => ({ ...n, alarmIsRead: true })))
      setUnreadCount(0)
      onUnreadCountChange(0)
    } catch { /* ignore */ }
  }

  const deleteAll = async () => {
    try {
      await alarmApi.deleteAllAlarms()
      setNotifications([])
      setUnreadCount(0)
      onUnreadCountChange(0)
    } catch { /* ignore */ }
  }

  const handleClick = async (n: AlarmItem) => {
    if (!n.alarmIsRead) {
      try {
        await alarmApi.markAsRead(n.alarmId)
        setNotifications((p) => p.map((x) => x.alarmId === n.alarmId ? { ...x, alarmIsRead: true } : x))
        setUnreadCount((c) => Math.max(0, c - 1))
        onUnreadCountChange(Math.max(0, unreadCount - 1))
      } catch { /* ignore */ }
    }
    // 캘린더 공유 요청 관련 알림은 인라인 모달로 처리
    console.log('[알림 클릭]', { alarmType: n.alarmType, alarmRefType: n.alarmRefType, alarmRefId: n.alarmRefId, alarmLink: n.alarmLink })
    const refType = (n.alarmRefType || '').toUpperCase()
    const isShareRelated = refType.includes('SHARE') || refType === 'CALENDAR_SHARE_REQUEST' || refType === 'INTEREST_CALENDAR_REQUEST' || refType === 'CALENDAR_SHARE_RESPONSE'
    if (isShareRelated && n.alarmRefId) {
      setShareReqModal(n)
      return
    }
    if (n.alarmRefType === 'APPROVAL_DOCUMENT' && n.alarmRefId) {
      openApprovalWindow({ viewDocId: n.alarmRefId })
    } else if (refType === 'COMMUTE_ABSENT' || refType === 'COMMUTE_AUTO_CLOSED') {
      // 결근/자동마감 알림: alarmLink = "/attendance?date=YYYY-MM-DD&empId=N"
      // 라우팅 분기(본인 vs HR 타인)는 AttendancePage가 URL 파라미터+현재 사용자로 처리
      if (n.alarmLink) navigate(n.alarmLink)
    } else if (n.alarmLink) {
      navigate(n.alarmLink)
    }
    onClose()
  }

  const handleRespondShare = async (accepted: boolean) => {
    if (!shareReqModal?.alarmRefId) return
    setRespondLoading(true)
    try {
      await interestCalendarApi.respondShare(shareReqModal.alarmRefId, accepted)
      setShareReqModal(null)
      // 응답 후 알림 목록에서 해당 항목 제거 (재조회로 처리)
      fetchAlarms(tab)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert('처리 실패: ' + (msg || '오류가 발생했습니다.'))
    } finally {
      setRespondLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl mt-16 w-full max-w-[820px] min-h-[500px] max-h-[80vh] flex overflow-hidden border border-gray-200">
        {/* 왼쪽 사이드바 */}
        <div className="hidden sm:flex w-[180px] bg-white border-r border-gray-200 shrink-0 flex-col">
          <div className="p-5 pb-3">
            <h2 className="text-[18px] font-bold text-gray-900">알림</h2>
          </div>
          <nav className="px-3 space-y-0.5 flex-1">
            {NOTIF_SIDEBAR.map((item) => (
              <div key={item.key}>
                <button
                  onClick={() => setTab(item.key)}
                  className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors flex items-center justify-between ${
                    tab === item.key ? 'bg-[#E1F5EE] text-[#1D9E75] font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.key === 'unread' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* 오른쪽 콘텐츠 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                {tab === 'all' ? '전체 알림' : '안읽은 알림'}
              </h3>
              <button onClick={markAllRead} className="text-[12px] text-gray-400 hover:text-[#1D9E75] flex items-center gap-1 border border-gray-200 rounded-full px-3 py-1">
                <i className="fas fa-check-double text-[10px]" /> 전체 읽음
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={deleteAll} className="text-[12px] text-gray-400 hover:text-red-500 flex items-center gap-1">
                <i className="far fa-trash-alt text-[11px]" /> 전체 삭제
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-[13px] text-gray-400">로딩 중...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20">
                <i className="far fa-bell-slash text-[40px] text-gray-200 mb-3" />
                <p className="text-[13px] text-gray-400">{tab === 'unread' ? '안읽은 알림이 없습니다.' : '알림이 없습니다.'}</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <div key={n.alarmId}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 px-5 py-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${!n.alarmIsRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <i className={`${NOTIF_ICON_MAP[n.alarmType.toLowerCase()] || NOTIF_ICON_MAP.system} text-[14px] text-gray-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug ${!n.alarmIsRead ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{n.alarmTitle}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{n.alarmContent}</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">{n.createdAt}</p>
                    </div>
                    {!n.alarmIsRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 캘린더 공유 요청 / 응답결과 알림 모달 */}
      {shareReqModal && (() => {
        // 결과 알림(보낸 쪽이 받는 알림)인지 판별
        const refType = (shareReqModal.alarmRefType || '').toUpperCase()
        const titleAndContent = `${shareReqModal.alarmTitle || ''} ${shareReqModal.alarmContent || ''}`
        const isResponseAlarm =
          refType === 'CALENDAR_SHARE_RESPONSE' ||
          refType.includes('RESPONSE') ||
          /수락|승인|거절|반려/.test(titleAndContent)

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShareReqModal(null)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-xl shadow-xl w-[400px]" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-[15px] font-bold text-gray-900">
                  {isResponseAlarm ? '캘린더 공유 응답' : '캘린더 공유 요청'}
                </h3>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center shrink-0">
                    <i className="far fa-calendar-alt text-[#1D9E75]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-800 leading-snug">{shareReqModal.alarmTitle}</p>
                    <p className="text-[12px] text-gray-500 mt-1">{shareReqModal.alarmContent}</p>
                  </div>
                </div>
                {!isResponseAlarm && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
                    수락하면 상대방이 내 캘린더 일정을 관심 캘린더로 열람할 수 있게 됩니다.
                  </div>
                )}
              </div>
              <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
                {isResponseAlarm ? (
                  <button
                    onClick={() => setShareReqModal(null)}
                    className="px-5 py-2 text-[13px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65]"
                  >
                    확인
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleRespondShare(false)}
                      disabled={respondLoading}
                      className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      거절
                    </button>
                    <button
                      onClick={() => handleRespondShare(true)}
                      disabled={respondLoading}
                      className="px-5 py-2 text-[13px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-40"
                    >
                      {respondLoading ? '처리중...' : '수락'}
                    </button>
                    <button
                      onClick={() => setShareReqModal(null)}
                      disabled={respondLoading}
                      className="px-3 py-2 text-[13px] text-gray-400 hover:text-gray-600 disabled:opacity-40"
                    >
                      나중에
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── 검색어 자동완성 드롭다운 ─────────────────────────────
// activeIndex는 features → items를 이어붙인 전체 목록 기준.
function SuggestDropdown({
  query,
  activeIndex,
  features,
  items,
  onPickFeature,
  onPickItem,
  onViewAll,
}: {
  query: string
  activeIndex: number
  features: FeatureEntry[]
  items: SuggestItem[]
  onPickFeature: (f: FeatureEntry) => void
  onPickItem: (item: SuggestItem) => void
  onViewAll: () => void
}) {
  const total = features.length + items.length
  if (total === 0 && !query) return null
  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
      {total === 0 ? (
        <div className="px-4 py-3 text-[12px] text-gray-400">일치하는 항목이 없습니다</div>
      ) : (
        <ul className="max-h-[400px] overflow-y-auto py-1">
          {features.length > 0 && (
            <li className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">기능</li>
          )}
          {features.map((f, idx) => (
            <li
              key={`feat_${f.id}`}
              onMouseDown={(e) => { e.preventDefault(); onPickFeature(f) }}
              className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-colors ${
                idx === activeIndex ? 'bg-[#E1F5EE]' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-6 h-6 rounded bg-[#E1F5EE] flex items-center justify-center shrink-0">
                <i className={`${f.icon} text-[11px] text-[#1D9E75]`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-gray-800 truncate">{f.label}</p>
                <p className="text-[11px] text-gray-400 truncate">{f.category}</p>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">바로가기</span>
            </li>
          ))}
          {items.length > 0 && features.length > 0 && (
            <li className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-1">검색 결과</li>
          )}
          {items.map((item, idx) => {
            const globalIdx = features.length + idx
            return (
              <li
                key={`${item.type}_${item.sourceId}`}
                onMouseDown={(e) => { e.preventDefault(); onPickItem(item) }}
                className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-colors ${
                  globalIdx === activeIndex ? 'bg-[#E1F5EE]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                  <i className={`${CATEGORY_ICONS[item.type]} text-[11px] text-gray-500`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 truncate">{item.title}</p>
                  {item.subLabel && (
                    <p className="text-[11px] text-gray-400 truncate">{item.subLabel}</p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{CATEGORY_LABELS[item.type]}</span>
              </li>
            )
          })}
        </ul>
      )}
      <button
        onMouseDown={(e) => { e.preventDefault(); onViewAll() }}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-100 text-[12px] text-[#1D9E75] hover:bg-gray-50 transition-colors"
      >
        <span>'{query}' 전체 결과 보기</span>
        <i className="fa-solid fa-arrow-right text-[10px]" />
      </button>
    </div>
  )
}

// ── 헤더 컴포넌트 ───────────────────────────────────────
export default function Header({ onOpenMessenger, extraRight, onToggleSidebar }: { onOpenMessenger?: () => void; extraRight?: React.ReactNode; onToggleSidebar?: () => void }) {
  const navigate = useNavigate()
  const { user, logout, chatUnreadCount } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerQuery, setHeaderQuery] = useState('')
  const [suggestItems, setSuggestItems] = useState<SuggestItem[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const profileRef = useRef<HTMLDivElement>(null)

  const displayName = user?.empName || '사용자'
  const initials = displayName.slice(0, 2)

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  // 안읽은 알림 개수 초기 로딩 + SSE 실시간 스트림
  useEffect(() => {
    alarmApi.getUnreadCount()
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => { /* ignore */ })

    const token = getAccessToken()
    const payload = token ? parseJwt(token) : null
    const empId = payload?.sub
    if (!empId || !token) return

    let sse: EventSourcePolyfill | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let retryDelay = 3000
    let cancelled = false

    const refreshUnreadCount = () => {
      alarmApi.getUnreadCount()
        .then(({ data: d }) => setUnreadCount(d.count))
        .catch(() => { /* ignore */ })
    }

    const connect = () => {
      if (cancelled) return
      const freshToken = getAccessToken()
      if (!freshToken) return
      sse = new EventSourcePolyfill(`/api/collaboration-service/alarm/stream?empId=${empId}`, {
        headers: { Authorization: `Bearer ${freshToken}` },
        heartbeatTimeout: 24 * 60 * 60 * 1000,
      })
      sse.onopen = () => { retryDelay = 3000 }
      sse.onmessage = () => { refreshUnreadCount() }
      sse.onerror = () => {
        sse?.close()
        sse = null
        if (cancelled) return
        reconnectTimer = setTimeout(() => {
          refreshUnreadCount()
          connect()
        }, retryDelay)
        retryDelay = Math.min(retryDelay * 2, 30_000)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      sse?.close()
    }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false)
  }, [])

  // 현재 role로 필터된 기능 목록 + 쿼리 매칭 (즉시, FE 전용)
  const allowedFeatures = useMemo(
    () => filterFeaturesByRole(FEATURES, user?.empRole),
    [user?.empRole]
  )
  const matchedFeatures = useMemo(
    () => (headerQuery.trim().length >= 2 ? matchFeatures(headerQuery, allowedFeatures, 3) : []),
    [headerQuery, allowedFeatures]
  )

  // 자동완성 디바운스 호출 (2글자 이상)
  useEffect(() => {
    const q = headerQuery.trim()
    if (q.length < 2) {
      setSuggestItems([])
      setActiveIdx(-1)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      suggestApi.suggest(q, 8, controller.signal)
        .then(({ data }) => {
          setSuggestItems(data.items)
          setActiveIdx(-1)
        })
        .catch((err) => {
          if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
          setSuggestItems([])
        })
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [headerQuery])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openFullSearch = useCallback(() => {
    if (!headerQuery.trim()) return
    setSuggestOpen(false)
    setSearchOpen(true)
  }, [headerQuery])

  const pickFeature = useCallback((f: FeatureEntry) => {
    setSuggestOpen(false)
    setHeaderQuery('')
    if (f.action.type === 'navigate') {
      navigate(f.action.path)
    } else if (f.action.type === 'event') {
      window.dispatchEvent(new CustomEvent(f.action.name))
    }
  }, [navigate])

  const pickSuggestItem = useCallback((item: SuggestItem) => {
    setSuggestOpen(false)
    setHeaderQuery('')
    switch (item.type) {
      case 'EMPLOYEE':
        window.dispatchEvent(new CustomEvent('open-orgchart', { detail: { empId: item.sourceId } }))
        break
      case 'DEPARTMENT':
        window.dispatchEvent(new CustomEvent('open-orgchart', { detail: { deptId: item.sourceId } }))
        break
      case 'APPROVAL':
        openApprovalWindow({ viewDocId: Number(item.sourceId) })
        break
      case 'CALENDAR':
        navigate('/calendar', { state: { viewEventId: Number(item.sourceId) } })
        break
    }
  }, [navigate])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    const total = matchedFeatures.length + suggestItems.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (total === 0) return
      setSuggestOpen(true)
      setActiveIdx((i) => (i + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (total === 0) return
      setActiveIdx((i) => (i <= 0 ? total - 1 : i - 1))
    } else if (e.key === 'Enter') {
      if (suggestOpen && activeIdx >= 0 && activeIdx < total) {
        if (activeIdx < matchedFeatures.length) {
          pickFeature(matchedFeatures[activeIdx])
        } else {
          pickSuggestItem(suggestItems[activeIdx - matchedFeatures.length])
        }
      } else if (headerQuery.trim()) {
        openFullSearch()
      }
    } else if (e.key === 'Escape') {
      setSuggestOpen(false)
    }
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-[#d1d5db] flex items-center justify-between px-3 sm:px-4 md:px-8 gap-3 shrink-0">
        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden -ml-1 w-9 h-9 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="메뉴 열기"
            >
              <i className="fa-solid fa-bars text-[16px]" />
            </button>
          )}
          <h1
            className="text-xl font-bold text-[#1D9E75] tracking-tight cursor-pointer select-none shrink-0"
            onClick={() => navigate('/')}
          >
            PeopleCore
          </h1>
          <div className="relative hidden sm:block flex-1 max-w-[384px]" ref={searchWrapRef}>
            <input
              type="text"
              value={headerQuery}
              onChange={(e) => { setHeaderQuery(e.target.value); setSuggestOpen(true) }}
              onFocus={() => { if (headerQuery.trim().length >= 2) setSuggestOpen(true) }}
              onKeyDown={handleKeyDown}
              placeholder="전사 통합 검색..."
              className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#1D9E75] text-sm"
            />
            <i className="fas fa-search absolute left-4 top-3 text-gray-400"></i>
            {suggestOpen && headerQuery.trim().length >= 2 && (
              <SuggestDropdown
                query={headerQuery.trim()}
                activeIndex={activeIdx}
                features={matchedFeatures}
                items={suggestItems}
                onPickFeature={pickFeature}
                onPickItem={pickSuggestItem}
                onViewAll={openFullSearch}
              />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {extraRight}
          <button
            className="relative text-gray-500 hover:text-[#1D9E75]"
            onClick={() => setCopilotOpen(true)}
            title="AI 코파일럿"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          </button>
          <button className="relative text-gray-500 hover:text-[#1D9E75]" onClick={() => setNotifOpen(true)}>
            <i className="far fa-bell text-xl"></i>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            className="relative text-gray-500 hover:text-[#1D9E75]"
            onClick={() => onOpenMessenger?.()}
            title="메신저"
          >
            <i className="far fa-comment-dots text-xl"></i>
            {chatUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
              </span>
            )}
          </button>
          <div className="relative border-l pl-6" ref={profileRef}>
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{displayName}</p>
                <p className="text-[11px] text-gray-500">{user?.empRole === 'HR_SUPER_ADMIN' ? '최고관리자' : user?.empRole === 'HR_ADMIN' ? '인사관리자' : '일반사원'}</p>
              </div>
              <div className="w-10 h-10 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold">
                {initials}
              </div>
            </div>

            {profileOpen && (
              <div className="absolute right-0 top-14 w-[220px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="flex justify-end px-3 pt-2">
                  <button onClick={() => setProfileOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
                </div>
                <div className="flex flex-col items-center pb-4 px-4">
                  <div className="w-16 h-16 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold text-xl mb-2">
                    {initials}
                  </div>
                  <p className="text-sm font-bold text-gray-800">{displayName}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{user?.empRole === 'HR_SUPER_ADMIN' ? '최고관리자' : user?.empRole === 'HR_ADMIN' ? '인사관리자' : '일반사원'}</p>
                </div>
                <div className="border-t border-gray-100 px-4 py-3 flex justify-center gap-6">
                  <button
                    onClick={() => { setProfileOpen(false); setSettingsOpen(true) }}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-cog text-sm" />
                    </div>
                    <span className="text-[11px]">설정</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-power-off text-sm" />
                    </div>
                    <span className="text-[11px]">로그아웃</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <SearchModal query={headerQuery} onClose={handleSearchClose} />
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} onUnreadCountChange={setUnreadCount} />}
      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </>
  )
}
