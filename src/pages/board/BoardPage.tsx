import { useState } from 'react'

/* ── 게시판 구조 ── */
interface BoardItem {
  id: string
  label: string
  children?: BoardItem[]
}

const FAVORITES: BoardItem[] = [
  { id: 'fav-1', label: '동호회 소식' },
  { id: 'fav-2', label: '자유 게시판' },
]

const COMPANY_BOARDS: BoardItem[] = [
  { id: 'c-1', label: '전사 공지' },
  { id: 'c-2', label: '전사 알림' },
  { id: 'c-3', label: '자유 게시판' },
  { id: 'c-4', label: '동호회 소식' },
]

const DEPT_BOARDS: BoardItem[] = [
  {
    id: 'd-1',
    label: '경영',
    children: [
      { id: 'd-1-1', label: '익명게시' },
      { id: 'd-1-2', label: '개발게시판' },
      { id: 'd-1-3', label: 'CS' },
      { id: 'd-1-4', label: '피드 게시판' },
      { id: 'd-1-5', label: '피드 익명 게시판' },
    ],
  },
]

/* ── Mock 게시글 ── */
const MOCK_POSTS = [
  { id: 1, title: '[공지] 2026년 복지 포인트 지급 안내', author: '인사팀', date: '2026-03-28', views: 142, comments: 5 },
  { id: 2, title: '[이벤트] 사내 카페 테이크아웃 할인 혜택', author: '총무팀', date: '2026-03-27', views: 89, comments: 3 },
  { id: 3, title: '시스템 점검에 따른 서비스 일시 중단 안내', author: 'IT운영팀', date: '2026-03-25', views: 201, comments: 0 },
  { id: 4, title: '신규 입사자 교육 일정 안내 (4월)', author: '교육팀', date: '2026-03-24', views: 67, comments: 2 },
  { id: 5, title: '사내 동호회 회원 모집 (등산, 독서)', author: '김인재', date: '2026-03-22', views: 45, comments: 8 },
]

export default function BoardPage() {
  const [selectedBoard, setSelectedBoard] = useState('전사 공지')
  const [favExpanded, setFavExpanded] = useState(true)
  const [companyExpanded, setCompanyExpanded] = useState(true)
  const [deptExpanded, setDeptExpanded] = useState(true)
  const [deptChildExpanded, setDeptChildExpanded] = useState<Record<string, boolean>>({ '경영': true })

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 게시판 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        {/* 헤더 */}
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000] mb-3">게시판</h2>
          <button className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] transition-colors">
            글쓰기
          </button>
        </div>

        {/* 즐겨찾기 */}
        <SideSection
          title="즐겨찾기"
          expanded={favExpanded}
          onToggle={() => setFavExpanded(!favExpanded)}
          trailing={
            <button className="text-[11px] text-gray-400 hover:text-gray-600">
              <i className="fas fa-pen text-[9px]" />
            </button>
          }
        >
          {FAVORITES.map((b) => (
            <SideItem key={b.id} label={b.label} active={selectedBoard === b.label} onClick={() => setSelectedBoard(b.label)} />
          ))}
        </SideSection>

        {/* 전사게시판 */}
        <SideSection title="전사게시판" expanded={companyExpanded} onToggle={() => setCompanyExpanded(!companyExpanded)}>
          {COMPANY_BOARDS.map((b) => (
            <SideItem key={b.id} label={b.label} active={selectedBoard === b.label} onClick={() => setSelectedBoard(b.label)} />
          ))}
        </SideSection>

        {/* 부서게시판 */}
        <SideSection title="부서게시판" expanded={deptExpanded} onToggle={() => setDeptExpanded(!deptExpanded)}>
          {DEPT_BOARDS.map((dept) => (
            <div key={dept.id}>
              <div
                className="flex items-center gap-1 py-1.5 px-4 text-[12px] text-gray-700 cursor-pointer hover:bg-[#E1F5EE] rounded transition-colors select-none"
                onClick={() => setDeptChildExpanded((prev) => ({ ...prev, [dept.label]: !prev[dept.label] }))}
              >
                <span className="text-[10px] text-gray-400 w-3">{deptChildExpanded[dept.label] ? '▼' : '▶'}</span>
                <span className="font-medium">{dept.label}</span>
              </div>
              {deptChildExpanded[dept.label] && dept.children?.map((child) => (
                <SideItem key={child.id} label={child.label} active={selectedBoard === child.label} onClick={() => setSelectedBoard(child.label)} indent />
              ))}
            </div>
          ))}
          <button className="flex items-center gap-1 py-1.5 px-4 text-[12px] text-gray-400 hover:text-[#1D9E75] transition-colors mt-1">
            <i className="fas fa-plus text-[9px]" /> 게시판 추가
          </button>
        </SideSection>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight mb-5">{selectedBoard}</h1>

        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-gray-500 font-medium">제목</th>
              <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">작성자</th>
              <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">날짜</th>
              <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">조회</th>
              <th className="px-4 py-3 text-gray-500 font-medium text-right whitespace-nowrap">댓글</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_POSTS.map((post) => (
              <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">{post.title}</td>
                <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{post.author}</td>
                <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{post.date}</td>
                <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{post.views}</td>
                <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">{post.comments > 0 && post.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── 사이드 섹션 ── */
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

/* ── 사이드 아이템 ── */
function SideItem({ label, active, onClick, indent }: {
  label: string; active: boolean; onClick: () => void; indent?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`py-1.5 px-4 text-[12px] cursor-pointer rounded transition-colors ${indent ? 'pl-8' : ''} ${
        active ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-[#000000] hover:bg-[#E1F5EE]'
      }`}
    >
      {label}
    </div>
  )
}
