import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SettingsModal from '../modals/SettingsModal'

// ── 검색 카테고리 정의 ──────────────────────────────────
const SEARCH_CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'approval', label: '전자결재' },
  { key: 'board', label: '게시판' },
  { key: 'calendar', label: '캘린더' },
  { key: 'drive', label: '파일함' },
  { key: 'attendance', label: '근태/연차' },
  { key: 'salary', label: '급여' },
  { key: 'address', label: '주소록' },
  { key: 'community', label: '커뮤니티' },
] as const

type CategoryKey = (typeof SEARCH_CATEGORIES)[number]['key']

// ── 카테고리별 아이콘 매핑 ──────────────────────────────
const CATEGORY_ICONS: Record<Exclude<CategoryKey, 'all'>, string> = {
  approval: 'fa-solid fa-file-signature',
  board: 'fa-solid fa-clipboard-list',
  calendar: 'fa-solid fa-calendar-days',
  drive: 'fa-solid fa-folder-open',
  attendance: 'fa-solid fa-clock',
  salary: 'fa-solid fa-wallet',
  address: 'fa-solid fa-address-book',
  community: 'fa-solid fa-users',
}

// ── 더미 검색 결과 ──────────────────────────────────────
interface SearchResult {
  id: string
  category: Exclude<CategoryKey, 'all'>
  title: string
  description: string
  meta?: string
  status?: { label: string; color: string }
}

function generateMockResults(query: string): SearchResult[] {
  if (!query.trim()) return []
  return [
    {
      id: '1', category: 'approval', title: `[기안] ${query} 관련 품의서`,
      description: '기안자: 김철수 · 기안일: 2026-03-15 · 결재라인: 김철수 → 이영희 → 박지민',
      status: { label: '결재중', color: 'bg-blue-100 text-blue-700' },
    },
    {
      id: '2', category: 'approval', title: `[휴가] ${query} 연차 신청서`,
      description: '기안자: 홍길동 · 기안일: 2026-03-20 · 결재라인: 홍길동 → 김철수',
      status: { label: '승인완료', color: 'bg-green-100 text-green-700' },
    },
    {
      id: '3', category: 'board', title: `[공지] ${query} 관련 안내사항`,
      description: '전사 공지 · 작성자: 인사총무팀 · 2026-03-28',
    },
    {
      id: '4', category: 'board', title: `${query} 프로젝트 진행 현황 공유`,
      description: '부서 게시판 · 작성자: 박지민 · 2026-03-25 · 댓글 3',
    },
    {
      id: '5', category: 'drive', title: `${query}_최종보고서.pdf`,
      description: '내 파일 · 12.5 MB · 수정일: 2026-03-27',
    },
    {
      id: '6', category: 'calendar', title: `${query} 관련 미팅`,
      description: '2026-04-01 14:00 ~ 15:00 · 회의실 A · 참석자 5명',
    },
    {
      id: '7', category: 'salary', title: `2026년 3월 ${query} 급여명세서`,
      description: '지급일: 2026-03-25 · 지급총액: 4,200,000원',
    },
    {
      id: '8', category: 'address', title: `${query} (인사총무팀)`,
      description: '팀장 · 내선: 1234 · kim@peoplecore.com',
    },
    {
      id: '9', category: 'community', title: `${query} 동호회 모집`,
      description: '커뮤니티 · 작성자: 이수진 · 2026-03-22 · 좋아요 12',
    },
    {
      id: '10', category: 'attendance', title: `${query} 근태 기록`,
      description: '2026-03 · 정상출근 20일 · 연차사용 1일 · 지각 0일',
    },
  ]
}

// ── 통합검색 모달 ───────────────────────────────────────
function SearchModal({ query: initialQuery, onClose }: { query: string; onClose: () => void }) {
  const [query, setQuery] = useState(initialQuery)
  const [searchedQuery, setSearchedQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSearch = () => {
    if (query.trim()) setSearchedQuery(query.trim())
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const results = generateMockResults(searchedQuery)

  const filteredResults = activeCategory === 'all'
    ? results
    : results.filter((r) => r.category === activeCategory)

  // 카테고리별 그룹핑 (전체 탭일 때)
  const groupedResults = activeCategory === 'all'
    ? SEARCH_CATEGORIES.filter((c) => c.key !== 'all').reduce<Record<string, SearchResult[]>>((acc, cat) => {
        const items = results.filter((r) => r.category === cat.key)
        if (items.length > 0) acc[cat.key] = items
        return acc
      }, {})
    : null

  // 카테고리별 건수
  const categoryCounts = SEARCH_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.key] = cat.key === 'all' ? results.length : results.filter((r) => r.category === cat.key).length
    return acc
  }, {})

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[60px]"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[720px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
          <button onClick={onClose} className="ml-1 text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fa-solid fa-xmark text-[18px]" />
          </button>
        </div>

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

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto">
          {!searchedQuery.trim() ? (
            /* 검색어 없을 때 */
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-[32px] mb-4 text-gray-300" />
              <p className="text-[14px] font-medium text-gray-500">검색어를 입력하세요</p>
              <p className="text-[12px] mt-1">전자결재, 게시판, 캘린더, 파일함 등을 통합 검색합니다</p>
            </div>
          ) : filteredResults.length === 0 ? (
            /* 결과 없음 */
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <i className="fa-regular fa-face-frown text-[32px] mb-4 text-gray-300" />
              <p className="text-[14px] font-medium text-gray-500">검색 결과가 없습니다</p>
              <p className="text-[12px] mt-1">다른 검색어나 카테고리를 시도해보세요</p>
            </div>
          ) : activeCategory === 'all' && groupedResults ? (
            /* 전체 탭 - 카테고리별 그룹 */
            <div className="py-2">
              {Object.entries(groupedResults).map(([catKey, items]) => {
                const catLabel = SEARCH_CATEGORIES.find((c) => c.key === catKey)?.label ?? catKey
                const catIcon = CATEGORY_ICONS[catKey as Exclude<CategoryKey, 'all'>]
                return (
                  <div key={catKey} className="mb-1">
                    <div className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 sticky top-0">
                      <i className={`${catIcon} text-[12px] text-[#1D9E75]`} />
                      <span className="text-[13px] font-semibold text-gray-700">{catLabel}</span>
                      <span className="text-[11px] text-gray-400 ml-1">{items.length}건</span>
                    </div>
                    {items.map((item) => (
                      <ResultItem key={item.id} item={item} query={searchedQuery} />
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            /* 개별 카테고리 탭 */
            <div className="py-2">
              {filteredResults.map((item) => (
                <ResultItem key={item.id} item={item} query={searchedQuery} />
              ))}
            </div>
          )}
        </div>

        {/* 하단 바 */}
        {searchedQuery.trim() && filteredResults.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-[12px] text-gray-400">
              총 <strong className="text-gray-600">{filteredResults.length}</strong>건의 검색 결과
            </span>
            <span className="text-[11px] text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono">ESC</kbd> 로 닫기
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 검색 결과 아이템 ────────────────────────────────────
function ResultItem({ item, query }: { item: SearchResult; query: string }) {
  const highlightText = (text: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-200/70 text-inherit rounded-sm px-0.5">{part}</mark>
        : part,
    )
  }

  const icon = CATEGORY_ICONS[item.category]

  return (
    <div className="flex items-start gap-3.5 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#E1F5EE] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
        <i className={`${icon} text-[13px] text-gray-400 group-hover:text-[#1D9E75] transition-colors`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-gray-800 truncate">{highlightText(item.title)}</p>
          {item.status && (
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${item.status.color}`}>
              {item.status.label}
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-500 mt-0.5 truncate">{highlightText(item.description)}</p>
      </div>
      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

// ── 헤더 컴포넌트 ───────────────────────────────────────
export default function Header() {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerQuery, setHeaderQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && headerQuery.trim()) {
      setSearchOpen(true)
    }
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-[#d1d5db] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <h1
            className="text-xl font-bold text-[#1D9E75] tracking-tight cursor-pointer select-none"
            onClick={() => navigate('/')}
          >
            PeopleCore
          </h1>
          <div className="relative w-96">
            <input
              type="text"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="전사 통합 검색..."
              className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#1D9E75] text-sm"
            />
            <i className="fas fa-search absolute left-4 top-3 text-gray-400"></i>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button className="relative text-gray-500 hover:text-[#1D9E75]">
            <i className="far fa-bell text-xl"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <button className="text-gray-500 hover:text-[#1D9E75]">
            <i className="far fa-envelope text-xl"></i>
          </button>
          <button
            className="text-gray-500 hover:text-[#1D9E75]"
            onClick={() => window.open('/messenger', 'messenger', 'width=1100,height=700')}
            title="메신저"
          >
            <i className="far fa-comment-dots text-xl"></i>
          </button>
          <div className="relative border-l pl-6" ref={profileRef}>
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">김철수 팀장</p>
                <p className="text-[11px] text-gray-500">인사총무팀 / PeopleCore</p>
              </div>
              <div className="w-10 h-10 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold">
                JS
              </div>
            </div>

            {profileOpen && (
              <div className="absolute right-0 top-14 w-[220px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="flex justify-end px-3 pt-2">
                  <button onClick={() => setProfileOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
                </div>
                <div className="flex flex-col items-center pb-4 px-4">
                  <div className="w-16 h-16 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold text-xl mb-2">
                    JS
                  </div>
                  <p className="text-sm font-bold text-gray-800">김철수 팀장</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">kimcs@peoplecore.kr</p>
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
                    onClick={() => { setProfileOpen(false); navigate('/login') }}
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
    </>
  )
}
