import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { chatApi } from '../../api/chat'
import type { ChatRoomResponse, ChatMessageResponse } from '../../api/chat'
import { departmentApi } from '../../api/org'
import type { OrgChartNode } from '../../api/org'
import { subscribeTo, publishMessage, getStompClient } from '../../services/stompClient'
import type { StompSubscription } from '@stomp/stompjs'

// ── Types for modal ──────────────────────────────────
interface OrgMember {
  empId: number
  empName: string
  gradeName: string | null
  deptName: string | null
}

// ── Helper ─────────────────────────────────────────────
function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateLabel(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`
}

function isSameDate(a: string | null, b: string | null) {
  if (!a || !b) return false
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function getChatFileUrl(fileUrl: string | null) {
  if (!fileUrl) return ''
  // /chat/files/... → /api/hr-service/chat/files/...
  if (fileUrl.startsWith('/chat/files/')) return '/api/hr-service' + fileUrl
  // 기존 MinIO 직접 URL → 프록시 경로로 변환
  // http://localhost:9000/peoplecore-chat/room-1/uuid_file.jpg → /api/hr-service/chat/files/room-1/uuid_file.jpg
  const minioPrefix = '/peoplecore-chat/'
  const idx = fileUrl.indexOf(minioPrefix)
  if (idx !== -1) return '/api/hr-service/chat/files/' + fileUrl.substring(idx + minioPrefix.length)
  return fileUrl
}

function getProfileColor(empId: number) {
  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#E91E63', '#3F51B5', '#009688', '#FF5722', '#607D8B']
  return colors[empId % colors.length]
}

// ── Create Room Modal ──────────────────────────────────
function CreateRoomModal({
  onClose,
  onCreate,
  myEmpId,
}: {
  onClose: () => void
  onCreate: (name: string, memberIds: number[], roomType: 'DM' | 'GROUP') => void
  myEmpId: number
}) {
  const [roomName, setRoomName] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [orgTree, setOrgTree] = useState<OrgChartNode[]>([])
  const [allMembers, setAllMembers] = useState<OrgMember[]>([])

  // API에서 조직도 + 사원 로드
  useEffect(() => {
    departmentApi.getTreeWithMembers().then(({ data }) => {
      setOrgTree(data)
      // 최상위 부서 자동 펼침
      const rootIds = data.map((d) => d.id)
      setExpandedDepts(new Set(rootIds))
      // 전체 사원 목록 추출
      const members: OrgMember[] = []
      const collect = (nodes: OrgChartNode[]) => {
        for (const node of nodes) {
          if (node.members) {
            for (const m of node.members) {
              members.push({
                empId: m.empId,
                empName: m.empName,
                gradeName: m.gradeName,
                deptName: node.deptName,
              })
            }
          }
          if (node.children) collect(node.children)
        }
      }
      collect(data)
      setAllMembers(members)
    }).catch(() => {})
  }, [])

  const toggleMember = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleDept = (id: number) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const type = ids.length === 1 ? 'DM' : 'GROUP'
    const name = roomName.trim() || allMembers.filter(m => selected.has(m.empId)).map(m => m.empName).join(', ')
    onCreate(name, ids, type)
  }

  const availableMembers = allMembers.filter(m => m.empId !== myEmpId)
  const filteredBySearch = searchQuery
    ? availableMembers.filter(m => m.empName.includes(searchQuery) || (m.deptName && m.deptName.includes(searchQuery)))
    : null

  function renderDeptTree(node: OrgChartNode, level: number) {
    const hasChildren = (node.children && node.children.length > 0) || (node.members && node.members.length > 0)
    const isExpanded = expandedDepts.has(node.id)
    const nodeMembers = (node.members || []).filter(m => m.empId !== myEmpId)

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1.5 py-1.5 cursor-pointer text-[13px] text-gray-600 hover:bg-gray-50"
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => toggleDept(node.id)}
        >
          {hasChildren ? (
            <i className={`fa-solid fa-chevron-right text-[9px] w-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          ) : (
            <span className="w-3" />
          )}
          <span className="flex-1 truncate">{node.deptName}</span>
          {nodeMembers.length > 0 && (
            <span className="text-[10px] text-gray-400 mr-1">{nodeMembers.length}</span>
          )}
        </div>
        {isExpanded && (
          <div>
            {node.children && node.children.map((child) => renderDeptTree(child, level + 1))}
            {nodeMembers.map((member) => (
              <div
                key={member.empId}
                className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50"
                style={{ paddingLeft: `${24 + level * 16}px` }}
                onClick={() => toggleMember(member.empId)}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                    selected.has(member.empId)
                      ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {selected.has(member.empId) && <i className="fa-solid fa-check" />}
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                  style={{ backgroundColor: getProfileColor(member.empId) }}
                >
                  {member.empName.slice(-2)}
                </div>
                <span className="text-[12px] text-gray-700">{member.empName}</span>
                <span className="text-[10px] text-gray-400">{member.gradeName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-[min(420px,calc(100vw-24px))] max-h-[550px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-[14px] font-bold text-gray-800">새 채팅방 만들기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-gray-100 space-y-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="채팅방 이름 (비워두면 참여자 이름으로 생성)"
            className="w-full border border-gray-200 rounded-lg px-3 py-[6px] text-[12px] focus:outline-none focus:border-[var(--primary-color)]"
          />
          <div className="relative">
            <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 부서 검색"
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-[6px] text-[12px] focus:outline-none focus:border-[var(--primary-color)]"
            />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
            {allMembers
              .filter((m) => selected.has(m.empId))
              .map((m) => (
                <span
                  key={m.empId}
                  className="inline-flex items-center gap-1 bg-[#eaf6f0] text-[var(--primary-color)] text-[11px] px-2 py-0.5 rounded-full"
                >
                  {m.empName}
                  <i
                    className="fa-solid fa-xmark text-[9px] cursor-pointer hover:text-red-500"
                    onClick={() => toggleMember(m.empId)}
                  />
                </span>
              ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 py-1">
          {filteredBySearch
            ? filteredBySearch.map((member) => (
                <div
                  key={member.empId}
                  className="flex items-center gap-2 py-1.5 px-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleMember(member.empId)}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      selected.has(member.empId)
                        ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {selected.has(member.empId) && <i className="fa-solid fa-check" />}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: getProfileColor(member.empId) }}
                  >
                    {member.empName.slice(-2)}
                  </div>
                  <span className="text-[12px] text-gray-700">{member.empName}</span>
                  <span className="text-[10px] text-gray-400">{member.deptName}</span>
                </div>
              ))
            : orgTree.map((node) => renderDeptTree(node, 0))}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[12px] text-gray-500">{selected.size}명 선택</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={selected.size === 0}
              className="px-4 py-1.5 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 transition-colors disabled:opacity-40"
            >
              만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── File Preview Modal ─────────────────────────────────
function FilePreviewModal({
  file,
  onClose,
}: {
  file: { url: string; name: string; size: number | null; type: 'IMAGE' | 'FILE' }
  onClose: () => void
}) {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const isTextFile = ['txt', 'csv', 'json', 'xml', 'log', 'md'].includes(ext)
  const isPdf = ext === 'pdf'
  const canPreview = isTextFile || isPdf

  const [textContent, setTextContent] = useState<string | null>(null)
  const [textLoading, setTextLoading] = useState(false)

  useEffect(() => {
    if (isTextFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTextLoading(true)
      fetch(file.url)
        .then((res) => res.text())
        .then((text) => setTextContent(text))
        .catch(() => setTextContent('파일을 불러올 수 없습니다.'))
        .finally(() => setTextLoading(false))
    }
  }, [file.url, isTextFile])

  const sizeLabel = file.size
    ? file.size > 1048576
      ? `${(file.size / 1048576).toFixed(1)}MB`
      : `${(file.size / 1024).toFixed(0)}KB`
    : null

  // ── 이미지: 검정 배경 풀스크린 ──
  if (file.type === 'IMAGE') {
    return (
      <div
        className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/90"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 transition-colors"
        >
          <i className="fa-solid fa-xmark text-[18px]" />
        </button>
        <img
          src={file.url}
          alt={file.name}
          className="max-w-[90vw] max-h-[80vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className="mt-4 flex items-center gap-3 bg-black/50 backdrop-blur rounded-xl px-5 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[13px] text-white/80 truncate max-w-[300px]">{file.name}</span>
          {sizeLabel && <span className="text-[11px] text-white/50">{sizeLabel}</span>}
          <a
            href={file.url}
            download={file.name}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-gray-800 text-[12px] rounded-lg hover:bg-gray-100 transition-colors no-underline"
          >
            <i className="fa-solid fa-download text-[11px]" />
            다운로드
          </a>
        </div>
      </div>
    )
  }

  // ── 파일 미리보기 ──
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: canPreview ? '70vw' : '400px', height: canPreview ? '80vh' : 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <i className={`fa-solid ${isPdf ? 'fa-file-pdf text-red-500' : isTextFile ? 'fa-file-lines text-blue-500' : 'fa-file text-[var(--primary-color)]'}`} />
            <span className="text-[13px] font-medium text-gray-800 truncate">{file.name}</span>
            {sizeLabel && <span className="text-[11px] text-gray-400 shrink-0">{sizeLabel}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={file.url}
              download={file.name}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary-color)] text-white text-[12px] rounded-lg hover:opacity-90 transition-colors no-underline"
            >
              <i className="fa-solid fa-download text-[11px]" />
              다운로드
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        {isTextFile ? (
          <div className="flex-1 overflow-auto bg-[#fafafa]">
            {textLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <i className="fa-solid fa-spinner fa-spin mr-2" /> 불러오는 중...
              </div>
            ) : (
              <div className="flex">
                {/* 줄 번호 */}
                <div className="py-4 px-3 text-right select-none bg-[#f0f0f0] border-r border-gray-200 shrink-0">
                  {textContent?.split('\n').map((_, i) => (
                    <div key={i} className="text-[12px] leading-[20px] text-gray-400 font-mono">{i + 1}</div>
                  ))}
                </div>
                {/* 내용 */}
                <pre className="py-4 px-4 text-[13px] leading-[20px] text-gray-800 font-mono whitespace-pre-wrap break-all flex-1 m-0">
                  {textContent}
                </pre>
              </div>
            )}
          </div>
        ) : isPdf ? (
          <iframe
            src={file.url}
            className="flex-1 w-full border-none"
            title={file.name}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-8">
            <i className="fa-solid fa-file-lines text-5xl text-gray-300 mb-4" />
            <p className="text-[14px] text-gray-500 mb-1">미리보기를 지원하지 않는 파일 형식입니다.</p>
            <p className="text-[12px] text-gray-400">다운로드 후 확인해주세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Invite Modal ──────────────────────────────────────
function InviteModal({
  onClose,
  onInvite,
  existingEmpIds,
  myEmpId,
}: {
  onClose: () => void
  onInvite: (memberIds: number[]) => void
  existingEmpIds: number[]
  myEmpId: number
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [orgTree, setOrgTree] = useState<OrgChartNode[]>([])
  const [allMembers, setAllMembers] = useState<OrgMember[]>([])

  useEffect(() => {
    departmentApi.getTreeWithMembers().then(({ data }) => {
      setOrgTree(data)
      const rootIds = data.map((d) => d.id)
      setExpandedDepts(new Set(rootIds))
      const members: OrgMember[] = []
      const collect = (nodes: OrgChartNode[]) => {
        for (const node of nodes) {
          if (node.members) {
            for (const m of node.members) {
              members.push({ empId: m.empId, empName: m.empName, gradeName: m.gradeName, deptName: node.deptName })
            }
          }
          if (node.children) collect(node.children)
        }
      }
      collect(data)
      setAllMembers(members)
    }).catch(() => {})
  }, [])

  const toggleMember = (id: number) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }
  const toggleDept = (id: number) => {
    setExpandedDepts((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  // 이미 참여 중인 사원 + 자기 자신 제외
  const excludeIds = new Set([...existingEmpIds, myEmpId])
  const availableMembers = allMembers.filter(m => !excludeIds.has(m.empId))
  const filteredBySearch = searchQuery
    ? availableMembers.filter(m => m.empName.includes(searchQuery) || (m.deptName && m.deptName.includes(searchQuery)))
    : null

  function renderDeptTree(node: OrgChartNode, level: number) {
    const isExpanded = expandedDepts.has(node.id)
    const nodeMembers = (node.members || []).filter(m => !excludeIds.has(m.empId))
    const hasChildren = (node.children && node.children.length > 0) || nodeMembers.length > 0

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1.5 py-1.5 cursor-pointer text-[13px] text-gray-600 hover:bg-gray-50"
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => toggleDept(node.id)}
        >
          {hasChildren ? (
            <i className={`fa-solid fa-chevron-right text-[9px] w-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          ) : <span className="w-3" />}
          <span className="flex-1 truncate">{node.deptName}</span>
          {nodeMembers.length > 0 && <span className="text-[10px] text-gray-400 mr-1">{nodeMembers.length}</span>}
        </div>
        {isExpanded && (
          <div>
            {node.children && node.children.map((child) => renderDeptTree(child, level + 1))}
            {nodeMembers.map((member) => (
              <div
                key={member.empId}
                className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50"
                style={{ paddingLeft: `${24 + level * 16}px` }}
                onClick={() => toggleMember(member.empId)}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${selected.has(member.empId) ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white' : 'border-gray-300'}`}>
                  {selected.has(member.empId) && <i className="fa-solid fa-check" />}
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{ backgroundColor: getProfileColor(member.empId) }}>
                  {member.empName.slice(-2)}
                </div>
                <span className="text-[12px] text-gray-700">{member.empName}</span>
                <span className="text-[10px] text-gray-400">{member.gradeName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[min(420px,calc(100vw-24px))] max-h-[550px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-[14px] font-bold text-gray-800">대화상대 초대</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="px-4 py-2.5 border-b border-gray-100">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 부서 검색"
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-[6px] text-[12px] focus:outline-none focus:border-[var(--primary-color)]"
            />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
            {allMembers.filter((m) => selected.has(m.empId)).map((m) => (
              <span key={m.empId} className="inline-flex items-center gap-1 bg-[#eaf6f0] text-[var(--primary-color)] text-[11px] px-2 py-0.5 rounded-full">
                {m.empName}
                <i className="fa-solid fa-xmark text-[9px] cursor-pointer hover:text-red-500" onClick={() => toggleMember(m.empId)} />
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 py-1">
          {filteredBySearch
            ? filteredBySearch.map((member) => (
                <div key={member.empId} className="flex items-center gap-2 py-1.5 px-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleMember(member.empId)}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${selected.has(member.empId) ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white' : 'border-gray-300'}`}>
                    {selected.has(member.empId) && <i className="fa-solid fa-check" />}
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{ backgroundColor: getProfileColor(member.empId) }}>
                    {member.empName.slice(-2)}
                  </div>
                  <span className="text-[12px] text-gray-700">{member.empName}</span>
                  <span className="text-[10px] text-gray-400">{member.deptName}</span>
                </div>
              ))
            : orgTree.map((node) => renderDeptTree(node, 0))}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[12px] text-gray-500">{selected.size}명 선택</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">취소</button>
            <button
              onClick={() => onInvite(Array.from(selected))}
              disabled={selected.size === 0}
              className="px-4 py-1.5 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 transition-colors disabled:opacity-40"
            >
              초대하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Messenger Page ────────────────────────────────
export default function MessengerPage({
  embedded,
  initialUserId,
  initialUserName: _initialUserName,
}: {
  embedded?: boolean
  initialUserId?: string | null
  initialUserName?: string | null
} = {}) {
  const { user, setChatUnreadCount, setActiveViewingRoomId } = useAuth()
  const myEmpId = user ? Number(user.empId) : 0

  const [rooms, setRooms] = useState<ChatRoomResponse[]>([])
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null)

  // AuthContext에 현재 보고 있는 방 ID 동기화
  useEffect(() => {
    setActiveViewingRoomId(activeRoomId)
    return () => setActiveViewingRoomId(null)
  }, [activeRoomId, setActiveViewingRoomId])
  const [messages, setMessages] = useState<ChatMessageResponse[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [isEditingRoomName, setIsEditingRoomName] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; size: number | null; type: 'IMAGE' | 'FILE' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastTypingSentRef = useRef(0)
  const [msgSearchOpen, setMsgSearchOpen] = useState(false)
  const [msgSearchQuery, setMsgSearchQuery] = useState('')
  const [msgSearchResults, setMsgSearchResults] = useState<ChatMessageResponse[]>([])
  const [msgSearching, setMsgSearching] = useState(false)
  // 검색 결과 클릭 시 해당 메시지 텍스트 안의 매치 부분만 일시적으로 하이라이트
  const [highlightedMsg, setHighlightedMsg] = useState<{ id: number; query: string } | null>(null)
  const [editRoomName, setEditRoomName] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const msgSubRef = useRef<StompSubscription | null>(null)
  const readSubRef = useRef<StompSubscription | null>(null)
  const participantsSubRef = useRef<StompSubscription | null>(null)

  // ── 채팅방 목록 로드 ──
  const loadRooms = useCallback(async () => {
    try {
      const { data } = await chatApi.getMyRooms()
      setRooms(data)
    } catch (e) {
      console.error('채팅방 목록 로드 실패:', e)
    }
  }, [])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // ── 참여자 목록 로드 (조직도 데이터 — 추후 API로 교체 가능) ──
  // ── 1:1 채팅 자동 생성 (조직도에서 진입 시) ──
  useEffect(() => {
    if (!initialUserId) return

    const targetEmpId = Number(initialUserId)
    if (!targetEmpId) return

    const openOrCreateDm = async () => {
      try {
        const { data: existing } = await chatApi.findDmRoom(targetEmpId)
        setActiveRoomId(existing.roomId)
      } catch {
        // 404 → 새로 생성
        try {
          const { data: created } = await chatApi.createRoom({
            roomType: 'DM',
            memberEmpIds: [targetEmpId],
          })
          await loadRooms()
          setActiveRoomId(created.roomId)
        } catch (e) {
          console.error('DM 방 생성 실패:', e)
        }
      }
    }
    openOrCreateDm()
  }, [initialUserId, loadRooms])

  // ── 채팅방 선택 시: 메시지 로드 + STOMP 구독 ──
  useEffect(() => {
    if (!activeRoomId) return

    // 이전 구독 해제
    msgSubRef.current?.unsubscribe()
    readSubRef.current?.unsubscribe()
    participantsSubRef.current?.unsubscribe()
    setTypingUsers([])

    // 메시지 로드
    const loadMessages = async () => {
      try {
        const { data } = await chatApi.getMessages(activeRoomId)
        setMessages(data)
        setHasMoreMessages(data.length >= 50)
      } catch (e) {
        console.error('메시지 로드 실패:', e)
      }
    }
    loadMessages()

    // 읽음 처리 + 즉시 로컬 unread 0으로 + 헤더 뱃지 감소
    const currentRoom = rooms.find((r) => r.roomId === activeRoomId)
    const prevUnread = currentRoom?.unreadCount || 0
    chatApi.markAsRead(activeRoomId).catch(() => {})
    setRooms((prev) => prev.map((r) =>
      r.roomId === activeRoomId ? { ...r, unreadCount: 0 } : r
    ))
    if (prevUnread > 0) {
      setChatUnreadCount((prev) => Math.max(0, prev - prevUnread))
    }

    // STOMP 구독: 새 메시지
    const waitAndSubscribe = () => {
      const client = getStompClient()
      if (!client?.connected) {
        setTimeout(waitAndSubscribe, 500)
        return
      }

      msgSubRef.current = subscribeTo(`/sub/chat/room/${activeRoomId}`, (msg) => {
        const newMsg: ChatMessageResponse = JSON.parse(msg.body)
        setMessages((prev) => [...prev, newMsg])
        // 내가 보고 있으므로 바로 읽음 처리
        chatApi.markAsRead(activeRoomId).catch(() => {})
        // 방 목록의 lastMessage 갱신, unread는 항상 0 (내가 보고 있으니까)
        setRooms((prev) => prev.map((r) =>
          r.roomId === activeRoomId
            ? { ...r, lastMessage: newMsg.content, lastMessageAt: newMsg.createdAt, unreadCount: 0 }
            : r
        ))
      })

      // 참여자 변경 구독
      participantsSubRef.current = subscribeTo(`/sub/chat/room/${activeRoomId}/participants`, (msg) => {
        const event = JSON.parse(msg.body)
        // 방 목록의 참여자 정보 즉시 갱신
        setRooms((prev) => prev.map((r) => {
          if (r.roomId !== activeRoomId) return r
          return {
            ...r,
            roomType: 'GROUP' as const,
            participants: event.participants.map((p: { empId: number; empName: string; gradeName: string; deptName: string }) => ({
              empId: p.empId,
              empName: p.empName,
              gradeName: p.gradeName,
              deptName: p.deptName,
              profileImageUrl: null,
            })),
          }
        }))
      })

      // 방 이름 변경 구독 (생성자가 변경하면 다른 참여자도 반영)
      subscribeTo(`/sub/chat/room/${activeRoomId}/rename`, (msg) => {
        const event = JSON.parse(msg.body)
        setRooms((prev) => prev.map((r) =>
          r.roomId === event.roomId ? { ...r, roomName: event.roomName } : r
        ))
      })

      // 메시지 삭제 구독
      subscribeTo(`/sub/chat/room/${activeRoomId}/delete`, (msg) => {
        const event = JSON.parse(msg.body)
        setMessages((prev) => prev.map((m) =>
          m.msgId === event.msgId
            ? { ...m, content: null, msgType: 'TEXT' as const, fileUrl: null, fileName: null, fileSize: null }
            : m
        ))
      })

      // 타이핑 구독
      subscribeTo(`/sub/chat/room/${activeRoomId}/typing`, (msg) => {
        const event = JSON.parse(msg.body)
        if (event.empId === myEmpId) return
        const name = event.empName as string
        setTypingUsers((prev) => prev.includes(name) ? prev : [...prev, name])
        // 기존 타이머 제거 후 2초 후 제거
        if (typingTimeoutRef.current[name]) clearTimeout(typingTimeoutRef.current[name])
        typingTimeoutRef.current[name] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== name))
          delete typingTimeoutRef.current[name]
        }, 2000)
      })
    }
    waitAndSubscribe()

    return () => {
      msgSubRef.current?.unsubscribe()
      // eslint-disable-next-line react-hooks/exhaustive-deps
      readSubRef.current?.unsubscribe()
      participantsSubRef.current?.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, loadRooms])

  // ── 스크롤 제어 ──
  // skipScrollRef가 true이면 messages 변경 시 스크롤하지 않음 (과거 메시지 로드 시 사용)
  const skipScrollRef = useRef(false)
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false
      return
    }
    if (isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      isInitialLoadRef.current = false
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    isInitialLoadRef.current = true
  }, [activeRoomId])

  const activeRoom = rooms.find((r) => r.roomId === activeRoomId)

  // ── 메시지 전송 ──
  // ── 과거 메시지 추가 로드 ──
  const loadMoreMessages = useCallback(async () => {
    if (!activeRoomId || loadingMore || !hasMoreMessages || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldestMsgId = messages[0].msgId
      const { data } = await chatApi.getMessages(activeRoomId, oldestMsgId)
      if (data.length === 0) {
        setHasMoreMessages(false)
      } else {
        setHasMoreMessages(data.length >= 50)
        // 스크롤 위치 보존: 현재 스크롤 높이 기억
        const container = messagesContainerRef.current
        const prevScrollHeight = container?.scrollHeight || 0
        skipScrollRef.current = true
        setMessages((prev) => [...data, ...prev])
        // prepend 후 스크롤 위치 복원
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight
          }
        })
      }
    } catch (e) {
      console.error('과거 메시지 로드 실패:', e)
    } finally {
      setLoadingMore(false)
    }
  }, [activeRoomId, loadingMore, hasMoreMessages, messages])

  const sendMessage = () => {
    if (!inputValue.trim() || !activeRoomId) return
    publishMessage('/pub/chat/message', {
      roomId: activeRoomId,
      content: inputValue.trim(),
      msgType: 'TEXT',
    })
    setInputValue('')
  }

  // ── 파일/이미지 업로드 후 메시지 전송 ──
  const handleFileUpload = async (file: File) => {
    if (!activeRoomId) return
    setUploading(true)
    try {
      const { data } = await chatApi.uploadFile(activeRoomId, file)
      publishMessage('/pub/chat/message', {
        roomId: activeRoomId,
        content: data.fileName,
        msgType: data.msgType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      })
    } catch (e) {
      console.error('파일 업로드 실패:', e)
    } finally {
      setUploading(false)
    }
  }

  // ── 채팅방 생성 ──
  const handleCreateRoom = async (name: string, memberIds: number[], roomType: 'DM' | 'GROUP') => {
    try {
      const { data } = await chatApi.createRoom({
        roomType,
        roomName: roomType === 'GROUP' ? name : undefined,
        memberEmpIds: memberIds,
      })
      await loadRooms()
      setActiveRoomId(data.roomId)
      setShowCreateModal(false)
    } catch (e) {
      console.error('채팅방 생성 실패:', e)
    }
  }

  const filteredRooms = searchQuery
    ? rooms.filter(
        (r) =>
          r.roomName?.includes(searchQuery) ||
          r.participants.some((p) => p.empName.includes(searchQuery))
      )
    : rooms

  return (
    <div className={`flex ${embedded ? 'h-full' : 'h-screen'} bg-[#f4f7f6] font-['Pretendard',sans-serif]`}>
      {/* Left: Room List */}
      <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className={`flex items-center justify-between px-4 ${embedded ? 'py-2' : 'py-3'} border-b border-gray-100`}>
          {!embedded && (
            <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
              <i className="fa-regular fa-comment-dots text-[var(--primary-color)]" />
              메신저
            </h2>
          )}
          {embedded && <span className="text-[13px] font-medium text-gray-700">채팅방</span>}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            title="새 채팅방"
          >
            <i className="fa-solid fa-pen-to-square text-[13px]" />
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="채팅방, 이름 검색"
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-[6px] text-[12px] focus:outline-none focus:border-[var(--primary-color)] bg-[#f9fafb]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <i className="fa-regular fa-comment-dots text-3xl mb-3" />
              <p className="text-[13px]">채팅방이 없습니다</p>
              <p className="text-[11px] mt-1">새 채팅방을 만들어보세요</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const otherParticipant = room.participants.find(p => p.empId !== myEmpId)
              return (
                <div
                  key={room.roomId}
                  onClick={() => setActiveRoomId(room.roomId)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    activeRoomId === room.roomId ? 'bg-[#eaf6f0]' : 'hover:bg-gray-50'
                  }`}
                >
                  {room.roomType === 'GROUP' ? (
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white shrink-0">
                      <i className="fa-solid fa-users text-[14px]" />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                      style={{ backgroundColor: otherParticipant ? getProfileColor(otherParticipant.empId) : '#999' }}
                    >
                      {otherParticipant?.empName.slice(-2) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-gray-800 truncate">
                        {room.roomName}
                        {room.roomType === 'GROUP' && (
                          <span className="text-[11px] text-gray-400 ml-1">
                            {room.participants.length}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {formatTime(room.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {room.lastMessage || '대화를 시작해보세요'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {room.muted && (
                      <i className="fa-solid fa-bell-slash text-[10px] text-gray-300" title="알림 꺼짐" />
                    )}
                    {room.unreadCount > 0 && (
                      <span className={`w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center ${room.muted ? 'bg-gray-400' : 'bg-red-500'}`}>
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                {activeRoom.roomType === 'GROUP' ? (
                  <div className="w-9 h-9 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white">
                    <i className="fa-solid fa-users text-[12px]" />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                    style={{
                      backgroundColor: getProfileColor(
                        activeRoom.participants.find(p => p.empId !== myEmpId)?.empId || 0
                      ),
                    }}
                  >
                    {activeRoom.participants.find(p => p.empId !== myEmpId)?.empName.slice(-2) || '?'}
                  </div>
                )}
                <div>
                  {isEditingRoomName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editRoomName}
                        onChange={(e) => setEditRoomName(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && !e.nativeEvent.isComposing && editRoomName.trim() && activeRoomId) {
                            await chatApi.renameRoom(activeRoomId, editRoomName.trim())
                            setRooms((prev) => prev.map((r) =>
                              r.roomId === activeRoomId ? { ...r, roomName: editRoomName.trim() } : r
                            ))
                            setIsEditingRoomName(false)
                          }
                          if (e.key === 'Escape') setIsEditingRoomName(false)
                        }}
                        autoFocus
                        className="text-[14px] font-bold text-gray-800 border border-[var(--primary-color)] rounded-md px-2 py-0.5 focus:outline-none w-[180px]"
                      />
                      <button
                        onClick={async () => {
                          if (editRoomName.trim() && activeRoomId) {
                            await chatApi.renameRoom(activeRoomId, editRoomName.trim())
                            setRooms((prev) => prev.map((r) =>
                              r.roomId === activeRoomId ? { ...r, roomName: editRoomName.trim() } : r
                            ))
                          }
                          setIsEditingRoomName(false)
                        }}
                        className="text-[var(--primary-color)] hover:text-green-700 text-[12px]"
                      >
                        <i className="fa-solid fa-check" />
                      </button>
                      <button
                        onClick={() => setIsEditingRoomName(false)}
                        className="text-gray-400 hover:text-gray-600 text-[12px]"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  ) : (
                    <h3
                      className={`text-[14px] font-bold text-gray-800 ${activeRoom.roomType === 'GROUP' && activeRoom.createdByEmpId === myEmpId ? 'cursor-pointer hover:text-[var(--primary-color)] transition-colors' : ''}`}
                      onClick={() => {
                        if (activeRoom.roomType === 'GROUP' && activeRoom.createdByEmpId === myEmpId) {
                          setEditRoomName(activeRoom.roomName || '')
                          setIsEditingRoomName(true)
                        }
                      }}
                      title={activeRoom.roomType === 'GROUP' && activeRoom.createdByEmpId === myEmpId ? '클릭하여 이름 변경' : undefined}
                    >
                      {activeRoom.roomName}
                      {activeRoom.roomType === 'GROUP' && (
                        <span className="text-[12px] text-gray-400 font-normal ml-1">
                          {activeRoom.participants.length}
                        </span>
                      )}
                      {activeRoom.roomType === 'GROUP' && activeRoom.createdByEmpId === myEmpId && (
                        <i className="fa-solid fa-pen text-[9px] text-gray-300 ml-1.5" />
                      )}
                    </h3>
                  )}
                  <p className="text-[11px] text-gray-400">
                    {activeRoom.participants
                      .filter(p => p.empId !== myEmpId)
                      .map((p) => p.empName)
                      .join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMsgSearchOpen((prev) => !prev)}
                  className={`w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors ${msgSearchOpen ? 'text-[var(--primary-color)]' : 'text-gray-500'}`}
                  title="메시지 검색"
                >
                  <i className="fa-solid fa-search text-[13px]" />
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                  title="나가기"
                >
                  <i className="fa-solid fa-right-from-bracket text-[13px]" />
                </button>
              </div>
            </div>

            {/* 메시지 검색바 */}
            {msgSearchOpen && (
              <div className="px-4 py-2 bg-white border-b border-gray-200">
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
                  <input
                    type="text"
                    value={msgSearchQuery}
                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing && msgSearchQuery.trim() && activeRoomId) {
                        setMsgSearching(true)
                        try {
                          const { data } = await chatApi.searchMessages(activeRoomId, msgSearchQuery.trim())
                          setMsgSearchResults(data)
                        } catch { /* ignore */ }
                        finally { setMsgSearching(false) }
                      }
                    }}
                    placeholder="메시지 내용 검색 (Enter)"
                    autoFocus
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-[6px] text-[12px] focus:outline-none focus:border-[var(--primary-color)] bg-[#f9fafb]"
                  />
                  {msgSearchQuery && (
                    <button
                      onClick={() => { setMsgSearchQuery(''); setMsgSearchResults([]) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className="fa-solid fa-xmark text-[11px]" />
                    </button>
                  )}
                </div>
                {msgSearching && (
                  <div className="py-2 text-center text-[11px] text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin mr-1" /> 검색 중...
                  </div>
                )}
                {!msgSearching && msgSearchResults.length > 0 && (
                  <div className="mt-2 max-h-[200px] overflow-y-auto space-y-1">
                    {msgSearchResults.map((r) => (
                      <div
                        key={r.msgId}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-[12px]"
                        onClick={() => {
                          const el = document.querySelector(`[data-msgid="${r.msgId}"]`)
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          const query = msgSearchQuery.trim()
                          setHighlightedMsg({ id: r.msgId, query })
                          setTimeout(() => {
                            setHighlightedMsg((cur) => (cur && cur.id === r.msgId ? null : cur))
                          }, 3000)
                          setMsgSearchOpen(false)
                          setMsgSearchResults([])
                          setMsgSearchQuery('')
                        }}
                      >
                        <span className="font-medium text-gray-700 shrink-0">{r.senderName}</span>
                        <span className="text-gray-500 truncate flex-1">{r.content}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatTime(r.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!msgSearching && msgSearchQuery && msgSearchResults.length === 0 && (
                  <div className="py-2 text-center text-[11px] text-gray-400">검색 결과가 없습니다</div>
                )}
              </div>
            )}

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement
                if (target.scrollTop < 50 && hasMoreMessages && !loadingMore) {
                  loadMoreMessages()
                }
              }}
            >
              {/* 과거 메시지 로딩 */}
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <i className="fa-solid fa-spinner fa-spin text-gray-400 text-[14px]" />
                </div>
              )}
              {!hasMoreMessages && messages.length > 0 && (
                <div className="flex justify-center py-2">
                  <span className="text-[11px] text-gray-400">이전 메시지가 없습니다</span>
                </div>
              )}
              {messages.length === 0 && !loadingMore && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <i className="fa-regular fa-comment-dots text-4xl mb-3" />
                  <p className="text-[13px]">대화를 시작해보세요</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === myEmpId
                const nextMsg = messages[idx + 1]
                const prevMsg = messages[idx - 1]
                const myTime = formatTime(msg.createdAt)
                const nextTime = nextMsg ? formatTime(nextMsg.createdAt) : ''

                // 날짜 구분선: 이전 메시지와 날짜가 다르면 표시
                const showDateSeparator = !prevMsg || !isSameDate(prevMsg.createdAt, msg.createdAt)

                // 같은 발신자 + 같은 시간(분)의 연속 메시지면 시간 숨김
                const showTime = !nextMsg || nextMsg.senderId !== msg.senderId || nextTime !== myTime

                // 같은 발신자 + 같은 시간(분)의 연속이면 아바타/이름 숨김
                const prevTime = prevMsg ? formatTime(prevMsg.createdAt) : ''
                const showSender = showDateSeparator || !prevMsg || prevMsg.senderId !== msg.senderId || prevTime !== myTime

                return (
                  <div key={msg.msgId} data-msgid={msg.msgId} className="transition-colors duration-500">
                    {showDateSeparator && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[11px] text-gray-400 shrink-0">{formatDateLabel(msg.createdAt)}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}
                  <div
                    className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} ${!showSender ? '!mt-0.5' : ''}`}
                  >
                    {!isMe && (
                      showSender ? (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5"
                          style={{ backgroundColor: getProfileColor(msg.senderId) }}
                        >
                          {msg.senderName.slice(-2)}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )
                    )}
                    <div className={`max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && showSender && (
                        <span className="text-[11px] text-gray-500 mb-1">{msg.senderName}</span>
                      )}
                      {/* 삭제된 메시지 */}
                      {msg.content === null && !msg.fileUrl ? (
                        <div className={`px-3.5 py-2 rounded-2xl text-[12px] italic ${
                          isMe ? 'bg-gray-200 text-gray-400 rounded-br-md' : 'bg-gray-100 text-gray-400 rounded-bl-md'
                        }`}>
                          삭제된 메시지입니다.
                        </div>
                      ) : (
                      <div className="relative group">
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                          isMe
                            ? 'bg-[var(--primary-color)] text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                        }`}
                      >
                        {msg.msgType === 'IMAGE' && msg.fileUrl ? (
                          <img
                            src={getChatFileUrl(msg.fileUrl)}
                            alt={msg.fileName || '이미지'}
                            className="max-w-[240px] max-h-[240px] rounded-lg cursor-pointer object-cover"
                            onClick={() => setPreviewFile({
                              url: getChatFileUrl(msg.fileUrl),
                              name: msg.fileName || '이미지',
                              size: msg.fileSize,
                              type: 'IMAGE',
                            })}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = `
                                <div class="flex items-center gap-2 text-[12px] ${isMe ? 'text-white/70' : 'text-gray-400'}">
                                  <i class="fa-solid fa-image-slash"></i>
                                  <span>만료된 이미지입니다. (30일이 지나 삭제됨)</span>
                                </div>`
                            }}
                          />
                        ) : msg.msgType === 'FILE' && msg.fileUrl ? (
                          <div
                            className={`flex items-center gap-2 cursor-pointer ${isMe ? 'text-white' : 'text-gray-800'}`}
                            onClick={() => setPreviewFile({
                              url: getChatFileUrl(msg.fileUrl),
                              name: msg.fileName || '',
                              size: msg.fileSize,
                              type: 'FILE',
                            })}
                          >
                            <i className={`fa-solid fa-file-arrow-down text-[16px] ${isMe ? 'text-white/80' : 'text-[var(--primary-color)]'}`} />
                            <div>
                              <p className="text-[12px] font-medium truncate max-w-[180px]">{msg.fileName}</p>
                              {msg.fileSize && (
                                <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                  {msg.fileSize > 1048576
                                    ? `${(msg.fileSize / 1048576).toFixed(1)}MB`
                                    : `${(msg.fileSize / 1024).toFixed(0)}KB`}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          highlightedMsg?.id === msg.msgId && highlightedMsg.query && msg.content
                            ? renderHighlighted(msg.content, highlightedMsg.query)
                            : msg.content
                        )}
                      </div>
                      {/* 본인 메시지 삭제 버튼 (hover 시 표시) */}
                      {isMe && (
                        <button
                          onClick={async () => {
                            if (!confirm('메시지를 삭제하시겠습니까?')) return
                            try {
                              await chatApi.deleteMessage(msg.msgId)
                            } catch (e) {
                              console.error('메시지 삭제 실패:', e)
                            }
                          }}
                          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white shadow border border-gray-200 items-center justify-center text-gray-400 hover:text-red-500 text-[10px] hidden group-hover:flex transition-colors"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      )}
                      </div>
                      )}
                      {showTime && (
                        <span className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right' : ''}`}>
                          {myTime}
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {/* 타이핑 표시 */}
            {typingUsers.length > 0 && (
              <div className="px-5 py-1.5 text-[11px] text-gray-400 italic">
                {typingUsers.length === 1
                  ? `${typingUsers[0]}님이 입력 중...`
                  : `${typingUsers[0]} 외 ${typingUsers.length - 1}명이 입력 중...`}
              </div>
            )}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                {/* + 버튼 + 드롭업 메뉴 */}
                <div className="relative" ref={plusMenuRef}>
                  <button
                    onClick={() => setShowPlusMenu((prev) => !prev)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                      showPlusMenu
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <i className={`fa-solid fa-plus text-[14px] transition-transform ${showPlusMenu ? 'rotate-45' : ''}`} />
                  </button>
                  {showPlusMenu && (
                    <>
                      <div className="fixed inset-0 z-[98]" onClick={() => setShowPlusMenu(false)} />
                      <div className="absolute bottom-12 left-0 z-[99] bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 w-44">
                        <button
                          onClick={() => { setShowPlusMenu(false); setShowInviteModal(true) }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="fa-solid fa-user-plus text-[12px] text-[var(--primary-color)] w-4 text-center" />
                          대화상대 초대
                        </button>
                        <button
                          onClick={() => { setShowPlusMenu(false); imageInputRef.current?.click() }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="fa-solid fa-image text-[12px] text-blue-500 w-4 text-center" />
                          이미지 전송
                        </button>
                        <button
                          onClick={() => { setShowPlusMenu(false); fileInputRef.current?.click() }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="fa-solid fa-file-arrow-up text-[12px] text-orange-500 w-4 text-center" />
                          파일 전송
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={async () => {
                            setShowPlusMenu(false)
                            if (!activeRoomId) return
                            try {
                              const { data } = await chatApi.toggleMute(activeRoomId)
                              setRooms((prev) => prev.map((r) =>
                                r.roomId === activeRoomId ? { ...r, muted: data.muted } : r
                              ))
                            } catch (e) {
                              console.error('음소거 토글 실패:', e)
                            }
                          }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className={`fa-solid ${activeRoom?.muted ? 'fa-bell text-[var(--primary-color)]' : 'fa-bell-slash text-gray-400'} text-[12px] w-4 text-center`} />
                          {activeRoom?.muted ? '알림 켜기' : '알림 끄기'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    // 타이핑 이벤트 전송 (1초에 최대 1회)
                    if (activeRoomId && Date.now() - lastTypingSentRef.current > 1000) {
                      publishMessage('/pub/chat/typing', { roomId: activeRoomId })
                      lastTypingSentRef.current = Date.now()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={uploading ? '파일 업로드 중...' : '메시지를 입력하세요'}
                  disabled={uploading}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[var(--primary-color)] bg-[#f9fafb] disabled:opacity-50"
                />
                {uploading && (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-spinner fa-spin text-[var(--primary-color)] text-[14px]" />
                  </div>
                )}
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 rounded-xl bg-[var(--primary-color)] text-white flex items-center justify-center hover:opacity-90 transition-colors disabled:opacity-40 shrink-0"
                >
                  <i className="fa-solid fa-paper-plane text-[14px]" />
                </button>
              </div>
              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                  e.target.value = ''
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                  e.target.value = ''
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <i className="fa-regular fa-comments text-5xl mb-4" />
            <p className="text-[15px] font-medium">채팅방을 선택하세요</p>
            <p className="text-[12px] mt-1">좌측에서 채팅방을 선택하거나 새로 만들어보세요</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
          myEmpId={myEmpId}
        />
      )}
      {showInviteModal && activeRoomId && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={async (memberIds) => {
            try {
              await chatApi.inviteMembers(activeRoomId, memberIds)
              await loadRooms()
              // 현재 보고 있는 방이므로 unread 강제 0
              setRooms((prev) => prev.map((r) =>
                r.roomId === activeRoomId ? { ...r, unreadCount: 0 } : r
              ))
              chatApi.markAsRead(activeRoomId).catch(() => {})
              setShowInviteModal(false)
            } catch (e) {
              console.error('초대 실패:', e)
            }
          }}
          existingEmpIds={activeRoom?.participants.map(p => p.empId) || []}
          myEmpId={myEmpId}
        />
      )}
      {/* 파일/이미지 미리보기 모달 */}
      {/* 이미지/파일 미리보기 모달 */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowLeaveConfirm(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[min(320px,calc(100vw-24px))] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fa-solid fa-right-from-bracket text-3xl text-red-400 mb-3" />
            <h3 className="text-[14px] font-bold text-gray-800 mb-1">채팅방 나가기</h3>
            <p className="text-[12px] text-gray-500 mb-5">
              이 채팅방을 나가시겠습니까?<br />대화 내용이 모두 삭제됩니다.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-5 py-2 text-[12px] text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (activeRoomId) {
                    try {
                      await chatApi.leaveRoom(activeRoomId)
                      // 헤더 뱃지에서 해당 방 unread 차감
                      const leavingRoom = rooms.find(r => r.roomId === activeRoomId)
                      if (leavingRoom && leavingRoom.unreadCount > 0) {
                        setChatUnreadCount((prev) => Math.max(0, prev - leavingRoom.unreadCount))
                      }
                      setRooms((prev) => prev.filter((r) => r.roomId !== activeRoomId))
                      setActiveRoomId(null)
                      setMessages([])
                    } catch (e) {
                      console.error('채팅방 나가기 실패:', e)
                    }
                  }
                  setShowLeaveConfirm(false)
                }}
                className="px-5 py-2 text-[12px] text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 검색어와 일치하는 부분만 <mark> 로 감싸서 반환 (대소문자 무시).
// content 가 null/빈 문자열인 경우 호출자가 미리 가드.
function renderHighlighted(content: string, query: string) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = content.split(new RegExp(`(${escaped})`, 'gi'))
  const lower = query.toLowerCase()
  return parts.map((part, i) =>
    part.toLowerCase() === lower
      ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark>
      : <span key={i}>{part}</span>,
  )
}
