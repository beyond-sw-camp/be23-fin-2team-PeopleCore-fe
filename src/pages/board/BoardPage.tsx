import { useState, useRef } from 'react'

/* ══════════════════════════════════════
   타입 (ERD 기반)
   ══════════════════════════════════════ */
interface BoardCategory {
  category_id: number
  category_name: string
  category_code: string
  category_is_anonymous: boolean
  category_is_active: boolean
  category_type: 'company' | 'dept'
  dept_name?: string
  // 권한 (추후 API)
  can_write: boolean
  can_comment: boolean
  has_like: boolean
}

interface Post {
  post_id: number
  category_id: number
  post_emp_name: string
  post_dept_name: string
  post_emp_grade: string
  post_title: string
  post_contents: string
  post_view_count: number
  post_is_pinned: boolean
  post_is_secret: boolean
  post_createdAt: string
  post_updatedAt?: string
  like_count: number
  comment_count: number
  is_anonymous: boolean
}

interface Comment {
  comment_id: number
  post_id: number
  emp_name: string
  emp_dept_name: string
  comment_content: string
  comment_parent_id: number | null
  comment_createdAt: string
}

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
const MOCK_CATEGORIES: BoardCategory[] = [
  // 전사 게시판 (기본 제공, 1개)
  { category_id: 1, category_name: '전사 게시판', category_code: 'COMPANY_BOARD', category_is_anonymous: false, category_is_active: true, category_type: 'company', can_write: false, can_comment: true, has_like: true },
  // 인사과가 만든 게시판들
  { category_id: 3, category_name: '자유 게시판', category_code: 'FREE_BOARD', category_is_anonymous: false, category_is_active: true, category_type: 'dept', dept_name: '전사', can_write: true, can_comment: true, has_like: true },
  { category_id: 4, category_name: '동호회 소식', category_code: 'CLUB_NEWS', category_is_anonymous: false, category_is_active: true, category_type: 'dept', dept_name: '전사', can_write: true, can_comment: true, has_like: true },
  { category_id: 10, category_name: '익명게시', category_code: 'DEPT_ANON', category_is_anonymous: true, category_is_active: true, category_type: 'dept', dept_name: '경영', can_write: true, can_comment: true, has_like: true },
  { category_id: 11, category_name: '개발게시판', category_code: 'DEPT_DEV', category_is_anonymous: false, category_is_active: true, category_type: 'dept', dept_name: '경영', can_write: true, can_comment: true, has_like: true },
  { category_id: 12, category_name: 'CS', category_code: 'DEPT_CS', category_is_anonymous: false, category_is_active: true, category_type: 'dept', dept_name: '경영', can_write: true, can_comment: true, has_like: false },
]

const MOCK_POSTS: Post[] = [
  { post_id: 1, category_id: 1, post_emp_name: '인사팀', post_dept_name: '인사', post_emp_grade: '', post_title: '[공지] 2026년 복지 포인트 지급 안내', post_contents: '2026년 복지 포인트가 지급됩니다. 자세한 내용은 아래를 참고해주세요.\n\n- 지급일: 2026-04-01\n- 금액: 1인당 50만원\n- 사용기한: 2026-12-31', post_view_count: 142, post_is_pinned: true, post_is_secret: false, post_createdAt: '2026-03-28', like_count: 23, comment_count: 5, is_anonymous: false },
  { post_id: 2, category_id: 1, post_emp_name: '총무팀', post_dept_name: '총무', post_emp_grade: '', post_title: '[이벤트] 사내 카페 테이크아웃 할인 혜택', post_contents: '사내 카페 테이크아웃 할인 이벤트를 진행합니다.', post_view_count: 89, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-27', like_count: 12, comment_count: 3, is_anonymous: false },
  { post_id: 3, category_id: 1, post_emp_name: 'IT운영팀', post_dept_name: 'IT', post_emp_grade: '', post_title: '시스템 점검에 따른 서비스 일시 중단 안내', post_contents: '시스템 점검으로 인해 서비스가 일시 중단됩니다.', post_view_count: 201, post_is_pinned: true, post_is_secret: false, post_createdAt: '2026-03-25', like_count: 5, comment_count: 0, is_anonymous: false },
  { post_id: 4, category_id: 1, post_emp_name: '교육팀', post_dept_name: '교육', post_emp_grade: '', post_title: '신규 입사자 교육 일정 안내 (4월)', post_contents: '4월 신규 입사자 교육 일정 안내입니다.', post_view_count: 67, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-24', like_count: 8, comment_count: 2, is_anonymous: false },
  { post_id: 5, category_id: 3, post_emp_name: '김인재', post_dept_name: '경영', post_emp_grade: '차장', post_title: '사내 동호회 회원 모집 (등산, 독서)', post_contents: '등산/독서 동호회 회원을 모집합니다!\n\n관심 있으신 분은 댓글 남겨주세요.', post_view_count: 45, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-22', like_count: 15, comment_count: 8, is_anonymous: false },
  { post_id: 6, category_id: 3, post_emp_name: '박서준', post_dept_name: '개발', post_emp_grade: '팀장', post_title: '점심 메뉴 추천해주세요', post_contents: '오늘 점심 뭐 먹을지 추천 부탁드립니다~', post_view_count: 32, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-21', like_count: 7, comment_count: 12, is_anonymous: false },
  // 동호회 소식
  { post_id: 7, category_id: 4, post_emp_name: '이수진', post_dept_name: '경영', post_emp_grade: '대리', post_title: '등산 동호회 4월 일정 안내', post_contents: '4월 등산 일정입니다.\n\n- 일시: 4월 12일 토요일\n- 장소: 북한산\n- 집합: 구파발역 1번 출구 08:00', post_view_count: 28, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-26', like_count: 9, comment_count: 4, is_anonymous: false },
  { post_id: 8, category_id: 4, post_emp_name: '한도윤', post_dept_name: '개발', post_emp_grade: '사원', post_title: '독서 동호회 3월 도서 선정', post_contents: '3월 도서는 "클린 코드"입니다.', post_view_count: 15, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-18', like_count: 5, comment_count: 2, is_anonymous: false },
  // 익명게시
  { post_id: 9, category_id: 10, post_emp_name: '익명', post_dept_name: '', post_emp_grade: '', post_title: '회사 복지 관련 의견', post_contents: '복지 관련해서 의견 남깁니다.', post_view_count: 88, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-20', like_count: 31, comment_count: 15, is_anonymous: true },
  { post_id: 10, category_id: 10, post_emp_name: '익명', post_dept_name: '', post_emp_grade: '', post_title: '야근 문화 개선 요청합니다', post_contents: '최근 야근이 너무 잦습니다. 개선이 필요합니다.', post_view_count: 156, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-19', like_count: 52, comment_count: 23, is_anonymous: true },
  { post_id: 11, category_id: 10, post_emp_name: '익명', post_dept_name: '', post_emp_grade: '', post_title: '점심 시간 연장 건의', post_contents: '점심 시간이 부족합니다.', post_view_count: 72, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-15', like_count: 18, comment_count: 7, is_anonymous: true },
  // 개발게시판
  { post_id: 12, category_id: 11, post_emp_name: '박서준', post_dept_name: '개발', post_emp_grade: '팀장', post_title: '코드 리뷰 가이드라인 공유', post_contents: '코드 리뷰 시 참고할 가이드라인을 공유합니다.', post_view_count: 64, post_is_pinned: true, post_is_secret: false, post_createdAt: '2026-03-27', like_count: 11, comment_count: 3, is_anonymous: false },
  { post_id: 13, category_id: 11, post_emp_name: '이민호', post_dept_name: '개발', post_emp_grade: '과장', post_title: 'Spring Boot 3.x 마이그레이션 후기', post_contents: 'Spring Boot 3.x 마이그레이션 후기를 공유합니다.', post_view_count: 41, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-23', like_count: 8, comment_count: 5, is_anonymous: false },
  // CS
  { post_id: 14, category_id: 12, post_emp_name: '최예린', post_dept_name: '개발', post_emp_grade: '대리', post_title: '고객 문의 처리 매뉴얼 업데이트', post_contents: '고객 문의 처리 매뉴얼이 업데이트되었습니다.', post_view_count: 33, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-25', like_count: 0, comment_count: 1, is_anonymous: false },
  { post_id: 15, category_id: 12, post_emp_name: '정하은', post_dept_name: '경영', post_emp_grade: '사원', post_title: '3월 고객 만족도 조사 결과', post_contents: '3월 고객 만족도 조사 결과를 공유합니다.', post_view_count: 27, post_is_pinned: false, post_is_secret: false, post_createdAt: '2026-03-20', like_count: 0, comment_count: 0, is_anonymous: false },
]

const MOCK_COMMENTS: Comment[] = [
  { comment_id: 1, post_id: 1, emp_name: '김인재', emp_dept_name: '경영', comment_content: '좋은 소식이네요!', comment_parent_id: null, comment_createdAt: '2026-03-28' },
  { comment_id: 2, post_id: 1, emp_name: '박서준', emp_dept_name: '개발', comment_content: '감사합니다', comment_parent_id: null, comment_createdAt: '2026-03-28' },
  { comment_id: 3, post_id: 1, emp_name: '이수진', emp_dept_name: '경영', comment_content: '저도 기대됩니다!', comment_parent_id: 1, comment_createdAt: '2026-03-29' },
]

interface FavGroup {
  name: string
  boardIds: number[]
}

const DEFAULT_FAV_GROUPS: FavGroup[] = [
  { name: '기본', boardIds: [4, 3] },
]

/* ══════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════ */
export default function BoardPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [homeTab, setHomeTab] = useState<'favorites' | 'all'>('all')
  const [writeModalOpen, setWriteModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'title' | 'author' | 'content'>('title')
  const [postsPerPage, setPostsPerPage] = useState(20)
  const [postPage, setPostPage] = useState(1)
  const [posts, setPosts] = useState(MOCK_POSTS)
  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [categories, setCategories] = useState(MOCK_CATEGORIES)
  const [favGroups, setFavGroups] = useState(DEFAULT_FAV_GROUPS)
  const [favSelectModal, setFavSelectModal] = useState<{ boardId: number; adding: boolean } | null>(null)
  const [boardSettingsOpen, setBoardSettingsOpen] = useState(false)

  // 사이드바 펼치기
  const [favExpanded, setFavExpanded] = useState(true)
  const [companyExpanded, setCompanyExpanded] = useState(true)
  const [deptExpanded, setDeptExpanded] = useState(true)

  const selectedCategory = categories.find((c) => c.category_id === selectedCategoryId)
  const companyBoards = categories.filter((c) => c.category_type === 'company' && c.category_is_active)
  const deptBoards = categories.filter((c) => c.category_type === 'dept' && c.category_is_active)
  const allFavIds = favGroups.flatMap((g) => g.boardIds)
  const isFavorite = (id: number) => allFavIds.includes(id)

  // 게시글 필터
  const filteredPosts = posts
    .filter((p) => p.category_id === selectedCategoryId)
    .filter((p) => {
      if (!searchQuery) return true
      if (searchType === 'title') return p.post_title.includes(searchQuery)
      if (searchType === 'author') return p.post_emp_name.includes(searchQuery)
      return p.post_contents.includes(searchQuery)
    })
    .sort((a, b) => {
      if (a.post_is_pinned && !b.post_is_pinned) return -1
      if (!a.post_is_pinned && b.post_is_pinned) return 1
      return 0
    })

  const selectedPost = selectedPostId ? posts.find((p) => p.post_id === selectedPostId) : null

  // 즐겨찾기 토글
  const handleStarClick = (boardId: number) => {
    if (isFavorite(boardId)) {
      // 해제
      setFavGroups((prev) => prev.map((g) => ({ ...g, boardIds: g.boardIds.filter((id) => id !== boardId) })))
    } else {
      // 그룹이 1개면 바로 추가, 여러 개면 선택 모달
      if (favGroups.length <= 1) {
        if (favGroups.length === 0) setFavGroups([{ name: '기본', boardIds: [boardId] }])
        else setFavGroups((prev) => prev.map((g, i) => i === 0 ? { ...g, boardIds: [...g.boardIds, boardId] } : g))
      } else {
        setFavSelectModal({ boardId, adding: true })
      }
    }
  }

  const addToFavGroup = (boardId: number, groupName: string) => {
    setFavGroups((prev) => prev.map((g) => g.name === groupName ? { ...g, boardIds: [...g.boardIds, boardId] } : g))
    setFavSelectModal(null)
  }

  // 좋아요
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
        setPosts((p) => p.map((pp) => pp.post_id === postId ? { ...pp, like_count: pp.like_count - 1 } : pp))
      } else {
        next.add(postId)
        setPosts((p) => p.map((pp) => pp.post_id === postId ? { ...pp, like_count: pp.like_count + 1 } : pp))
      }
      return next
    })
  }

  // 댓글 추가
  const addComment = (postId: number, content: string, parentId: number | null) => {
    const newComment: Comment = {
      comment_id: Date.now(),
      post_id: postId,
      emp_name: '김인재',
      emp_dept_name: '경영',
      comment_content: content,
      comment_parent_id: parentId,
      comment_createdAt: new Date().toISOString().slice(0, 10),
    }
    setComments((prev) => [...prev, newComment])
    setPosts((prev) => prev.map((p) => p.post_id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
  }

  // 글 작성/수정
  const handleSavePost = (title: string, content: string, isPinned: boolean) => {
    if (editingPost) {
      setPosts((prev) => prev.map((p) => p.post_id === editingPost.post_id ? { ...p, post_title: title, post_contents: content, post_is_pinned: isPinned, post_updatedAt: new Date().toISOString().slice(0, 10) } : p))
    } else {
      const catId = selectedCategoryId ?? 1
      const cat = categories.find((c) => c.category_id === catId)
      const newPost: Post = {
        post_id: Date.now(), category_id: catId,
        post_emp_name: cat?.category_is_anonymous ? '익명' : '김인재',
        post_dept_name: cat?.category_is_anonymous ? '' : '경영',
        post_emp_grade: cat?.category_is_anonymous ? '' : '차장',
        post_title: title, post_contents: content, post_view_count: 0,
        post_is_pinned: isPinned, post_is_secret: false,
        post_createdAt: new Date().toISOString().slice(0, 10),
        like_count: 0, comment_count: 0,
        is_anonymous: cat?.category_is_anonymous ?? false,
      }
      setPosts((prev) => [newPost, ...prev])
      setSelectedCategoryId(catId)
    }
    setWriteModalOpen(false)
    setEditingPost(null)
    setSelectedPostId(null)
  }

  // 글 삭제
  const deletePost = (postId: number) => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    setPosts((prev) => prev.filter((p) => p.post_id !== postId))
    setSelectedPostId(null)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2
            className="text-[15px] font-bold text-[#000000] cursor-pointer hover:text-[#1D9E75] transition-colors"
            onClick={() => { setSelectedCategoryId(null); setSelectedPostId(null); setSearchQuery('') }}
          >
            게시판
          </h2>
        </div>

        {/* 즐겨찾기 (그룹별) */}
        {favGroups.length > 0 && (
          <SideSection title="즐겨찾기" expanded={favExpanded} onToggle={() => setFavExpanded(!favExpanded)}>
            {favGroups.map((group) => (
              <div key={group.name}>
                <div className="text-[11px] text-gray-500 px-4 pt-2 pb-0.5 font-medium">{group.name}</div>
                {group.boardIds.map((id) => {
                  const b = categories.find((c) => c.category_id === id)
                  if (!b) return null
                  return (
                    <SideItemWithStar key={b.category_id} label={b.category_name} active={selectedCategoryId === b.category_id}
                      starred={true}
                      onToggleStar={() => handleStarClick(b.category_id)}
                      onClick={() => { setSelectedCategoryId(b.category_id); setSelectedPostId(null); setSearchQuery('') }} />
                  )
                })}
              </div>
            ))}
          </SideSection>
        )}

        {/* 전사게시판 */}
        <SideSection title="전사게시판" expanded={companyExpanded} onToggle={() => setCompanyExpanded(!companyExpanded)}>
          {companyBoards.map((b) => (
            <SideItemWithStar key={b.category_id} label={b.category_name} active={selectedCategoryId === b.category_id}
              starred={isFavorite(b.category_id)}
              onToggleStar={() => handleStarClick(b.category_id)}
              onClick={() => { setSelectedCategoryId(b.category_id); setSelectedPostId(null); setSearchQuery('') }} />
          ))}
        </SideSection>

        {/* 부서게시판 */}
        <SideSection title="부서게시판" expanded={deptExpanded} onToggle={() => setDeptExpanded(!deptExpanded)}>
          {deptBoards.map((b) => (
            <SideItemWithStar key={b.category_id} label={b.category_name} active={selectedCategoryId === b.category_id}
              starred={isFavorite(b.category_id)}
              onToggleStar={() => handleStarClick(b.category_id)}
              onClick={() => { setSelectedCategoryId(b.category_id); setSelectedPostId(null); setSearchQuery('') }} />
          ))}
        </SideSection>

        {/* 게시판 환경설정 */}
        <div className="px-4 pt-2 pb-4">
          <button
            onClick={() => setBoardSettingsOpen(true)}
            className="py-1.5 px-2 text-[12px] text-[#000000] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors w-full text-left"
          >
            게시판 환경설정
          </button>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      {writeModalOpen ? (
        <WritePostView
          category={selectedCategory!}
          categories={categories}
          editingPost={editingPost}
          onClose={() => { setWriteModalOpen(false); setEditingPost(null) }}
          onSave={handleSavePost}
          onChangeCategory={(id) => setSelectedCategoryId(id)}
        />
      ) : selectedCategoryId === null ? (
        /* ── 게시판 홈 ── */
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="flex">
            {/* 피드 영역 */}
            <div className="flex-1 p-6 max-w-[750px]">
              <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-4">게시판 홈</h1>

              {/* 즐겨찾기 / 전체 게시판 탭 */}
              <div className="flex items-center gap-2 mb-5">
                <button onClick={() => setHomeTab('favorites')}
                  className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${homeTab === 'favorites' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                  즐겨찾기
                </button>
                <button onClick={() => setHomeTab('all')}
                  className={`px-4 py-1.5 text-[12px] rounded-full border transition-colors ${homeTab === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                  전체 게시판
                </button>
              </div>

              {/* 피드 카드 목록 */}
              <div className="space-y-0">
                {(() => {
                  const homePosts = homeTab === 'favorites'
                    ? posts.filter((p) => allFavIds.includes(p.category_id))
                    : posts
                  return homePosts.sort((a, b) => b.post_createdAt.localeCompare(a.post_createdAt)).map((post) => {
                    const cat = categories.find((c) => c.category_id === post.category_id)
                    return (
                      <div key={post.post_id} className="border-b border-gray-100 py-5 cursor-pointer hover:bg-gray-50/50 transition-colors px-1"
                        onClick={() => { setSelectedCategoryId(post.category_id); setSelectedPostId(post.post_id) }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* 카테고리 + 댓글 수 */}
                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1.5">
                              <span>PeopleCore &gt; {cat?.category_name}</span>
                              <span className="flex items-center gap-0.5"><i className="far fa-comment text-[9px]" /> {post.comment_count}</span>
                            </div>
                            {/* 제목 */}
                            <h3 className="text-[14px] font-semibold text-gray-900 mb-1.5">{post.post_title}</h3>
                            {/* 본문 미리보기 */}
                            <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 mb-2">
                              {post.post_contents}
                            </p>
                            {/* 작성자 정보 */}
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500">
                                <i className="fas fa-user" />
                              </div>
                              <span>{post.is_anonymous ? '익명' : `${post.post_emp_name} ${post.post_emp_grade}`}</span>
                              <span>{post.post_createdAt}</span>
                            </div>
                          </div>
                          {/* 좋아요 */}
                          <div className="flex flex-col items-center ml-4 pt-4">
                            <button onClick={(e) => { e.stopPropagation(); toggleLike(post.post_id) }}
                              className={`text-[16px] transition-colors ${likedPosts.has(post.post_id) ? 'text-red-400' : 'text-gray-300 hover:text-red-300'}`}>
                              <i className={`${likedPosts.has(post.post_id) ? 'fas' : 'far'} fa-heart`} />
                            </button>
                            <span className="text-[11px] text-gray-400 mt-0.5">{post.like_count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* 최신글 모음 사이드 */}
            <div className="w-[220px] border-l border-gray-100 p-4 shrink-0 hidden lg:block">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">최신글 모음</h3>
              {categories.filter((c) => c.category_type === 'company').slice(0, 3).map((cat) => {
                const latestPost = posts.filter((p) => p.category_id === cat.category_id).sort((a, b) => b.post_createdAt.localeCompare(a.post_createdAt))[0]
                if (!latestPost) return null
                return (
                  <div key={cat.category_id} className="mb-4">
                    <div className="text-[12px] font-semibold text-gray-700 mb-1.5">{cat.category_name}</div>
                    <div
                      className="text-[11px] text-gray-500 cursor-pointer hover:text-[#1D9E75] transition-colors flex items-center justify-between"
                      onClick={() => { setSelectedCategoryId(cat.category_id); setSelectedPostId(latestPost.post_id) }}
                    >
                      <span className="truncate mr-2">{latestPost.post_title}</span>
                      <span className="text-gray-400 whitespace-nowrap">{latestPost.post_createdAt.slice(5)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {selectedPost ? (
            <PostDetailView
              post={selectedPost}
              comments={comments.filter((c) => c.post_id === selectedPost.post_id)}
              category={selectedCategory!}
              liked={likedPosts.has(selectedPost.post_id)}
              onBack={() => setSelectedPostId(null)}
              onLike={() => toggleLike(selectedPost.post_id)}
              onAddComment={(content, parentId) => addComment(selectedPost.post_id, content, parentId)}
              onEdit={() => { setEditingPost(selectedPost); setWriteModalOpen(true) }}
              onDelete={() => deletePost(selectedPost.post_id)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">{selectedCategory?.category_name}</h1>
                {selectedCategory?.category_is_anonymous && (
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">익명 게시판</span>
                )}
              </div>

              {/* 새 글쓰기 + 검색 */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  {selectedCategory?.can_write && (
                    <button
                      onClick={() => { setEditingPost(null); setWriteModalOpen(true) }}
                      className="flex items-center gap-1 text-[12px] text-gray-600 hover:text-[#1D9E75] transition-colors"
                    >
                      <i className="fas fa-pen text-[10px]" /> 새글쓰기
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select value={searchType} onChange={(e) => setSearchType(e.target.value as 'title' | 'author' | 'content')}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
                    <option value="title">제목</option>
                    <option value="content">제목+내용</option>
                    {!selectedCategory?.category_is_anonymous && <option value="author">작성자</option>}
                  </select>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="검색" className="px-2 py-1 text-[12px] outline-none w-32" />
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors">
                      <i className="fas fa-search text-[10px] text-gray-500" />
                    </button>
                  </div>
                  <select value={postsPerPage} onChange={(e) => { setPostsPerPage(Number(e.target.value)); setPostPage(1) }}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none">
                    {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* 게시글 목록 */}
              {(() => {
                const isAnon = selectedCategory?.category_is_anonymous
                const totalPostPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage))
                const pagedPosts = filteredPosts.slice((postPage - 1) * postsPerPage, postPage * postsPerPage)
                return (
                  <>
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">번호</th>
                          <th className="px-4 py-3 text-gray-500 font-medium">제목</th>
                          {!isAnon && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">작성자</th>}
                          <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">작성일</th>
                          <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">수정일</th>
                          <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">조회</th>
                          {selectedCategory?.has_like && <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">좋아요</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPosts.length === 0 ? (
                          <tr><td colSpan={isAnon ? 4 : 6} className="py-20 text-center text-gray-300 text-[13px]">게시글이 없습니다.</td></tr>
                        ) : pagedPosts.map((post, idx) => (
                          <tr key={post.post_id} onClick={() => setSelectedPostId(post.post_id)}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{filteredPosts.length - ((postPage - 1) * postsPerPage + idx)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {post.post_is_pinned && <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 font-semibold rounded">고정</span>}
                                <span className="text-gray-900 font-medium">{post.post_title}</span>
                                {post.comment_count > 0 && <span className="text-[11px] text-[#1D9E75]">[{post.comment_count}]</span>}
                              </div>
                            </td>
                            {!isAnon && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{post.post_emp_name} {post.post_emp_grade}</td>}
                            <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{post.post_createdAt}</td>
                            <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{post.post_updatedAt || '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{post.post_view_count}</td>
                            {selectedCategory?.has_like && <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{post.like_count > 0 && post.like_count}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* 페이지네이션 */}
                    <div className="flex items-center justify-center gap-1 mt-6">
                      <button onClick={() => setPostPage(1)} disabled={postPage === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-double-left" /></button>
                      <button onClick={() => setPostPage(Math.max(1, postPage - 1))} disabled={postPage === 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-left" /></button>
                      {Array.from({ length: totalPostPages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setPostPage(p)} className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors ${p === postPage ? 'bg-[#1D9E75] text-white font-bold' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
                      ))}
                      <button onClick={() => setPostPage(Math.min(totalPostPages, postPage + 1))} disabled={postPage === totalPostPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-right" /></button>
                      <button onClick={() => setPostPage(totalPostPages)} disabled={postPage === totalPostPages} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"><i className="fas fa-angle-double-right" /></button>
                    </div>

                  </>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* 모달들 */}
      {createBoardOpen && (
        <CreateBoardModal
          onClose={() => setCreateBoardOpen(false)}
          onConfirm={(board) => {
            setCategories((prev) => [...prev, { ...board, category_id: Date.now(), category_is_active: true, category_type: 'dept' }])
            setCreateBoardOpen(false)
          }}
        />
      )}
      {favSelectModal && (
        <FavGroupSelectModal
          groups={favGroups}
          onSelect={(groupName) => addToFavGroup(favSelectModal.boardId, groupName)}
          onClose={() => setFavSelectModal(null)}
        />
      )}
      {boardSettingsOpen && (
        <BoardSettingsModal
          groups={favGroups}
          onGroupsChange={setFavGroups}
          onClose={() => setBoardSettingsOpen(false)}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════
   게시글 상세 뷰
   ══════════════════════════════════════ */
function PostDetailView({ post, comments, category, liked, onBack, onLike, onAddComment, onEdit, onDelete }: {
  post: Post; comments: Comment[]; category: BoardCategory; liked: boolean
  onBack: () => void; onLike: () => void; onAddComment: (content: string, parentId: number | null) => void
  onEdit: () => void; onDelete: () => void
}) {
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const topComments = comments.filter((c) => c.comment_parent_id === null)
  const isMyPost = post.post_emp_name === '김인재'

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <i className="fas fa-arrow-left text-[10px]" /> 목록으로
      </button>

      {/* 제목 + 메타 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {post.post_is_pinned && <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 font-semibold rounded">고정</span>}
          <h1 className="text-[20px] font-bold text-gray-900">{post.post_title}</h1>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-gray-500">
          <span>{post.is_anonymous ? '익명' : `${post.post_emp_name} ${post.post_emp_grade}`}</span>
          {!post.is_anonymous && <span>{post.post_dept_name}</span>}
          <span>{post.post_createdAt}</span>
          <span>조회 {post.post_view_count}</span>
        </div>
      </div>

      {/* 본문 */}
      <div className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap min-h-[120px] mb-6">
        {post.post_contents}
      </div>

      {/* 좋아요 + 수정/삭제 */}
      <div className="flex items-center justify-between border-t border-b border-gray-100 py-3 mb-6">
        <div className="flex items-center gap-3">
          {category.has_like && (
            <button onClick={onLike} className={`flex items-center gap-1 text-[12px] transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
              <i className={`${liked ? 'fas' : 'far'} fa-heart`} /> {post.like_count}
            </button>
          )}
          <span className="text-[12px] text-gray-400"><i className="far fa-comment" /> {post.comment_count}</span>
        </div>
        {isMyPost && !post.is_anonymous && (
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">수정</button>
            <button onClick={onDelete} className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">삭제</button>
          </div>
        )}
      </div>

      {/* 댓글 */}
      {category.can_comment && (
        <div>
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">댓글 {post.comment_count}</h3>

          {/* 댓글 입력 */}
          <div className="flex gap-2 mb-4">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요" className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]" />
            <button onClick={() => { if (newComment.trim()) { onAddComment(newComment, null); setNewComment('') } }}
              className="px-4 py-2 bg-[#1D9E75] text-white text-[12px] rounded hover:bg-[#178a65] transition-colors">등록</button>
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-3">
            {topComments.map((c) => (
              <div key={c.comment_id}>
                <div className="flex items-start gap-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0 mt-0.5">
                    <i className="fas fa-user" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-gray-800">{c.emp_name}</span>
                      <span className="text-[11px] text-gray-400">{c.emp_dept_name}</span>
                      <span className="text-[11px] text-gray-400">{c.comment_createdAt}</span>
                    </div>
                    <p className="text-[12px] text-gray-700">{c.comment_content}</p>
                    <button onClick={() => setReplyTo(replyTo === c.comment_id ? null : c.comment_id)}
                      className="text-[11px] text-gray-400 hover:text-[#1D9E75] mt-1 transition-colors">답글</button>
                  </div>
                </div>
                {/* 대댓글 */}
                {comments.filter((r) => r.comment_parent_id === c.comment_id).map((r) => (
                  <div key={r.comment_id} className="flex items-start gap-3 py-2 ml-10">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400 shrink-0 mt-0.5">
                      <i className="fas fa-user" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-gray-800">{r.emp_name}</span>
                        <span className="text-[11px] text-gray-400">{r.comment_createdAt}</span>
                      </div>
                      <p className="text-[12px] text-gray-700">{r.comment_content}</p>
                    </div>
                  </div>
                ))}
                {/* 답글 입력 */}
                {replyTo === c.comment_id && (
                  <div className="flex gap-2 ml-10 mt-1">
                    <input type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="답글을 입력하세요" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]" />
                    <button onClick={() => { if (replyContent.trim()) { onAddComment(replyContent, c.comment_id); setReplyContent(''); setReplyTo(null) } }}
                      className="px-3 py-1.5 bg-[#1D9E75] text-white text-[11px] rounded hover:bg-[#178a65] transition-colors">등록</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════
   글쓰기 모달
   ══════════════════════════════════════ */
function WritePostView({ category, categories, editingPost, onClose, onSave, onChangeCategory }: {
  category: BoardCategory; categories: BoardCategory[]; editingPost: Post | null; onClose: () => void
  onSave: (title: string, content: string, isPinned: boolean) => void; onChangeCategory: (id: number) => void
}) {
  const [title, setTitle] = useState(editingPost?.post_title ?? '')
  const [content, setContent] = useState(editingPost?.post_contents ?? '')
  const [isPinned, setIsPinned] = useState(editingPost?.post_is_pinned ?? false)
  const [selectedCatId, setSelectedCatId] = useState(category.category_id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  const writableBoards = categories.filter((c) => c.can_write && c.category_is_active)
  const selectedCat = categories.find((c) => c.category_id === selectedCatId)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-white">
      <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-6">{editingPost ? '게시글 수정' : '글쓰기'}</h1>

      {/* 게시판 정보 */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[12px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{category.category_name}</span>
        {category.category_is_anonymous && (
          <span className="text-[11px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded">익명</span>
        )}
      </div>

      {/* 제목 */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[13px] font-semibold text-gray-900 w-16">제목</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-[13px] outline-none focus:border-[#1D9E75]" />
      </div>

      {/* 파일 첨부 */}
      <div className="flex items-start gap-4 mb-4">
        <span className="text-[13px] font-semibold text-gray-900 w-16 pt-2">파일 첨부</span>
        <div className="flex-1">
          <input ref={fileInputRef} type="file" multiple className="hidden"
            onChange={(e) => { if (e.target.files) setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]); e.target.value = '' }} />
          <div className="border border-dashed border-gray-300 rounded-lg py-4 text-center text-[12px] text-gray-400">
            <i className="fas fa-paperclip text-gray-300 mr-1" />
            이곳에 파일을 드래그 하세요. 또는{' '}
            <button onClick={() => fileInputRef.current?.click()} className="text-[#000000] underline">파일선택</button>
            <span className="text-gray-300 ml-1">({attachedFiles.length > 0 ? `${attachedFiles.length}개` : '0MB'})</span>
          </div>
          {attachedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] bg-gray-50 rounded px-3 py-1.5">
                  <span className="text-gray-700"><i className="fas fa-file text-gray-400 text-[10px] mr-1" />{f.name}</span>
                  <button onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-400"><i className="fas fa-times" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 본문 초기화 */}
      <div className="flex items-center justify-end mb-2">
        <button onClick={() => setContent('')} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">본문 초기화</button>
      </div>

      {/* 에디터 툴바 */}
      <div className="border border-gray-300 rounded-t-lg px-3 py-2 bg-gray-50 flex items-center gap-1 text-gray-500 text-[13px] flex-wrap">
        <button className="p-1 hover:bg-gray-200 rounded"><b>B</b></button>
        <button className="p-1 hover:bg-gray-200 rounded"><i>I</i></button>
        <button className="p-1 hover:bg-gray-200 rounded"><u>U</u></button>
        <span className="w-px h-4 bg-gray-300 mx-1" />
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-list-ul text-[11px]" /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-list-ol text-[11px]" /></button>
        <span className="w-px h-4 bg-gray-300 mx-1" />
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-align-left text-[11px]" /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-align-center text-[11px]" /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-align-right text-[11px]" /></button>
        <span className="w-px h-4 bg-gray-300 mx-1" />
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-image text-[11px]" /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-link text-[11px]" /></button>
        <button className="p-1 hover:bg-gray-200 rounded"><i className="fas fa-code text-[11px]" /></button>
      </div>

      {/* 본문 */}
      <textarea value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요"
        className="w-full border border-gray-300 border-t-0 rounded-b-lg px-4 py-3 text-[13px] outline-none resize-none focus:border-[#1D9E75] min-h-[400px]" />

      {/* 하단 버튼 */}
      <div className="flex items-center justify-between mt-6">
        <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="accent-[#1D9E75]" />
          게시글 상단 고정
        </label>
        <div className="flex gap-2">
          <button onClick={() => { if (title.trim()) onSave(title, content, isPinned) }} disabled={!title.trim()}
            className="px-6 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editingPost ? '수정' : '등록'}
          </button>
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   게시판 생성 모달 (인사과 권한)
   ══════════════════════════════════════ */
function CreateBoardModal({ onClose, onConfirm }: {
  onClose: () => void
  onConfirm: (board: Omit<BoardCategory, 'category_id' | 'category_is_active' | 'category_type'>) => void
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [deptName, setDeptName] = useState('경영')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [canWrite, setCanWrite] = useState(true)
  const [canComment, setCanComment] = useState(true)
  const [hasLike, setHasLike] = useState(true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[480px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">게시판 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-20 text-[13px] font-semibold text-gray-900">게시판 이름</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 text-[13px] font-semibold text-gray-900">게시판 코드</span>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="DEPT_XXX"
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 text-[13px] font-semibold text-gray-900">소속 부서</span>
            <select value={deptName} onChange={(e) => setDeptName(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
              <option>경영</option><option>개발</option><option>인사</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="accent-[#1D9E75]" />
              익명 게시판
            </label>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
              <input type="checkbox" checked={canWrite} onChange={(e) => setCanWrite(e.target.checked)} className="accent-[#1D9E75]" />
              게시글 작성 허용
            </label>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
              <input type="checkbox" checked={canComment} onChange={(e) => setCanComment(e.target.checked)} className="accent-[#1D9E75]" />
              댓글 허용
            </label>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
              <input type="checkbox" checked={hasLike} onChange={(e) => setHasLike(e.target.checked)} className="accent-[#1D9E75]" />
              좋아요 기능
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={() => { if (name.trim()) onConfirm({ category_name: name, category_code: code || `DEPT_${Date.now()}`, category_is_anonymous: isAnonymous, can_write: canWrite, can_comment: canComment, has_like: hasLike, dept_name: deptName }) }}
            disabled={!name.trim()} className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">생성</button>
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   사이드바 컴포넌트
   ══════════════════════════════════════ */
function SideSection({ title, expanded, onToggle, trailing, children }: {
  title: string; expanded: boolean; onToggle: () => void; trailing?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="px-2 pt-3 pb-1">
      <div className="flex items-center justify-between px-2 mb-1">
        <div className="flex items-center gap-1 cursor-pointer select-none" onClick={onToggle}>
          <span className="text-[10px] text-gray-400">{expanded ? '▼' : '▶'}</span>
          <span className="text-[12px] font-semibold text-[#000000]">{title}</span>
        </div>
        {trailing}
      </div>
      {expanded && <div>{children}</div>}
    </div>
  )
}

function SideItem({ label, active, onClick, indent }: {
  label: string; active: boolean; onClick: () => void; indent?: boolean
}) {
  return (
    <div onClick={onClick}
      className={`py-1.5 px-4 text-[12px] cursor-pointer rounded transition-colors ${indent ? 'pl-8' : ''} ${
        active ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-[#000000] hover:bg-[#E1F5EE]'
      }`}>
      {label}
    </div>
  )
}

function SideItemWithStar({ label, active, starred, onClick, onToggleStar }: {
  label: string; active: boolean; starred: boolean; onClick: () => void; onToggleStar: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-1.5 px-4 text-[12px] cursor-pointer rounded transition-colors group ${
        active ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-[#000000] hover:bg-[#E1F5EE]'
      }`}
    >
      <span>{label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStar() }}
        className={`text-[10px] transition-colors ${
          starred ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
        }`}
      >
        <i className={`${starred ? 'fas' : 'far'} fa-star`} />
      </button>
    </div>
  )
}

/* ── 즐겨찾기 그룹 선택 모달 ── */
function FavGroupSelectModal({ groups, onSelect, onClose }: {
  groups: FavGroup[]; onSelect: (groupName: string) => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[320px] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-900">즐겨찾기 그룹 선택</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <div className="p-4 space-y-1">
          {groups.map((g) => (
            <div key={g.name} onClick={() => onSelect(g.name)}
              className="py-2 px-3 text-[13px] text-gray-700 cursor-pointer rounded hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors">
              {g.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 게시판 환경설정 모달 (즐겨찾기 그룹 관리) ── */
function BoardSettingsModal({ groups, onGroupsChange, onClose }: {
  groups: FavGroup[]; onGroupsChange: (groups: FavGroup[]) => void; onClose: () => void
}) {
  const [localGroups, setLocalGroups] = useState(groups)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const handleAddGroup = () => {
    const name = prompt('그룹 이름을 입력하세요')
    if (!name) return
    if (localGroups.some((g) => g.name === name)) { alert('이미 같은 이름의 그룹이 존재합니다.'); return }
    setLocalGroups((prev) => [...prev, { name, boardIds: [] }])
  }

  const handleDeleteGroup = (idx: number) => {
    if (!confirm(`"${localGroups[idx].name}" 그룹을 삭제하시겠습니까?\n포함된 즐겨찾기는 해제됩니다.`)) return
    setLocalGroups((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleRename = (idx: number) => {
    if (editName.trim() && !localGroups.some((g, i) => i !== idx && g.name === editName)) {
      setLocalGroups((prev) => prev.map((g, i) => i === idx ? { ...g, name: editName } : g))
    }
    setEditingIdx(null)
  }

  const handleSave = () => {
    onGroupsChange(localGroups)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[500px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">게시판 환경설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-gray-900">즐겨찾기 그룹 관리</h3>
            <button onClick={handleAddGroup} className="text-[12px] text-[#1D9E75] hover:text-[#178a65] transition-colors">
              + 그룹 추가
            </button>
          </div>

          <div className="space-y-1">
            {localGroups.length === 0 ? (
              <div className="py-8 text-center text-gray-300 text-[13px]">즐겨찾기 그룹이 없습니다.</div>
            ) : localGroups.map((g, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 px-3 border-b border-gray-100 hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  {editingIdx === idx ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(idx)} onKeyDown={(e) => { if (e.key === 'Enter') handleRename(idx) }}
                      autoFocus className="border border-[#1D9E75] rounded px-2 py-0.5 text-[12px] outline-none w-36" />
                  ) : (
                    <>
                      <span className="text-[13px] text-gray-800">{g.name}</span>
                      <span className="text-[11px] text-gray-400">{g.boardIds.length}개</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingIdx(idx); setEditName(g.name) }}
                    className="text-gray-400 hover:text-gray-600 text-[10px] transition-colors">
                    <i className="fas fa-pen" />
                  </button>
                  <button onClick={() => handleDeleteGroup(idx)}
                    className="text-gray-400 hover:text-red-500 text-[10px] transition-colors">
                    <i className="fas fa-trash-alt" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={handleSave} className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">저장</button>
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
        </div>
      </div>
    </div>
  )
}
