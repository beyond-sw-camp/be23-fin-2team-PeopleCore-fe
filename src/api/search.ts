import api from './client'

export type SearchType = 'EMPLOYEE' | 'DEPARTMENT' | 'APPROVAL' | 'CALENDAR'
export type SearchSort = 'relevance' | 'latest' | 'oldest'

export interface SearchResultItem {
  id: string
  type: SearchType
  sourceId: string
  title: string
  content: string
  metadata: Record<string, any>
  createdAt: string
  score: number
  /** 서버 하이라이팅 fragment. key = 필드명 ("title", "metadata.empName" 등), value = "<em>...</em>" 포함 문자열 배열. */
  highlights?: Record<string, string[]>
}

export interface SearchResponse {
  keyword: string
  totalHits: number
  page: number
  size: number
  items: SearchResultItem[]
  typeCounts: Record<SearchType, number>
}

export const searchApi = {
  search: (
    keyword: string,
    type?: SearchType,
    page = 0,
    size = 10,
    sort: SearchSort = 'relevance',
  ) =>
    api.get<SearchResponse>('/search-service/search', {
      params: { keyword, type, page, size, sort },
    }),
}

// ── 상세 검색 ───────────────────────────────────────────
export interface AdvancedSearchParams {
  keyword?: string
  type?: SearchType
  dateFrom?: string   // YYYY-MM-DD
  dateTo?: string     // YYYY-MM-DD
  author?: string     // 작성자 이름
  department?: string // 부서명
  fileType?: string   // PDF | IMAGE | DOC | XLS | HWP | ETC
  page?: number
  size?: number
  sort?: SearchSort
}

export const advancedSearchApi = {
  search: (params: AdvancedSearchParams) =>
    api.get<SearchResponse>('/search-service/search/advanced', {
      params: {
        page: 0,
        size: 20,
        sort: 'relevance',
        ...params,
      },
    }),
}

export interface SuggestItem {
  type: SearchType
  sourceId: string
  title: string
  subLabel: string | null
  link: string | null
}

export interface SuggestResponse {
  keyword: string
  items: SuggestItem[]
}

export const suggestApi = {
  suggest: (keyword: string, size = 8, signal?: AbortSignal) =>
    api.get<SuggestResponse>('/search-service/search/suggest', {
      params: { keyword, size },
      signal,
    }),
}

// ── 검색 이력 ───────────────────────────────────────────
export interface SearchHistoryItem {
  id: number
  keyword: string
  searchedAt: string
}

export const historyApi = {
  list: (size = 10) =>
    api.get<SearchHistoryItem[]>('/search-service/search/history', {
      params: { size },
    }),
  remove: (id: number) =>
    api.delete<void>(`/search-service/search/history/${id}`),
  clear: () =>
    api.delete<void>('/search-service/search/history'),
}
