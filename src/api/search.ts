import api from './client'

export type SearchType = 'EMPLOYEE' | 'DEPARTMENT' | 'APPROVAL' | 'CALENDAR'

export interface SearchResultItem {
  id: string
  type: SearchType
  sourceId: string
  title: string
  content: string
  metadata: Record<string, any>
  createdAt: string
  score: number
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
  search: (keyword: string, type?: SearchType, page = 0, size = 10) =>
    api.get<SearchResponse>('/search-service/search', {
      params: { keyword, type, page, size },
    }),
}
