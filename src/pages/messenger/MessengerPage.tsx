import { useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────
interface ChatRoom {
  id: string
  name: string
  members: ChatMember[]
  isGroup: boolean
  lastMessage?: string
  lastTime?: string
  unread?: number
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  time: string
}

interface ChatMember {
  id: string
  name: string
  rank: string
  department: string
  profileColor: string
}

// ── Org data for invite modal ──────────────────────────
interface Department {
  id: string
  name: string
  children?: Department[]
}

const orgDepartments: Department[] = [
  {
    id: 'ceo',
    name: 'PeopleCore',
    children: [
      {
        id: 'management',
        name: '경영지원본부',
        children: [
          { id: 'hr', name: '인사총무팀' },
          { id: 'finance', name: '재무회계팀' },
          { id: 'ga', name: '총무팀' },
        ],
      },
      {
        id: 'dev',
        name: '개발본부',
        children: [
          { id: 'frontend', name: '프론트엔드팀' },
          { id: 'backend', name: '백엔드팀' },
          { id: 'infra', name: '인프라팀' },
          { id: 'qa', name: 'QA팀' },
        ],
      },
      {
        id: 'sales',
        name: '영업본부',
        children: [
          { id: 'sales1', name: '영업1팀' },
          { id: 'sales2', name: '영업2팀' },
          { id: 'marketing', name: '마케팅팀' },
        ],
      },
    ],
  },
]

const allMembers: ChatMember[] = [
  { id: '1', name: '김철수', rank: '부장', department: '인사총무팀', profileColor: '#4CAF50' },
  { id: '2', name: '이영희', rank: '대리', department: '인사총무팀', profileColor: '#2196F3' },
  { id: '3', name: '박민수', rank: '사원', department: '인사총무팀', profileColor: '#FF9800' },
  { id: '4', name: '정수연', rank: '부장', department: '재무회계팀', profileColor: '#9C27B0' },
  { id: '5', name: '최동혁', rank: '과장', department: '재무회계팀', profileColor: '#F44336' },
  { id: '6', name: '한지민', rank: '부장', department: '총무팀', profileColor: '#00BCD4' },
  { id: '7', name: '강호진', rank: '이사', department: '경영지원본부', profileColor: '#795548' },
  { id: '8', name: '윤서준', rank: '부장', department: '프론트엔드팀', profileColor: '#E91E63' },
  { id: '9', name: '임하은', rank: '대리', department: '프론트엔드팀', profileColor: '#3F51B5' },
  { id: '10', name: '송태현', rank: '사원', department: '프론트엔드팀', profileColor: '#009688' },
  { id: '11', name: '오민정', rank: '부장', department: '백엔드팀', profileColor: '#FF5722' },
  { id: '12', name: '배준호', rank: '과장', department: '백엔드팀', profileColor: '#607D8B' },
  { id: '13', name: '신예린', rank: '이사', department: '개발본부', profileColor: '#CDDC39' },
  { id: '14', name: '장우성', rank: '부장', department: '영업1팀', profileColor: '#FFC107' },
  { id: '15', name: '권나영', rank: '부장', department: '마케팅팀', profileColor: '#8BC34A' },
]

const ME: ChatMember = { id: 'me', name: '나', rank: '', department: '', profileColor: '#1D9E75' }

// ── Helper ─────────────────────────────────────────────
function getTimeStr() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getDeptMembers(deptId: string): ChatMember[] {
  const deptMap: Record<string, string> = {
    hr: '인사총무팀', finance: '재무회계팀', ga: '총무팀',
    management: '경영지원본부', frontend: '프론트엔드팀', backend: '백엔드팀',
    infra: '인프라팀', qa: 'QA팀', dev: '개발본부',
    sales1: '영업1팀', sales2: '영업2팀', marketing: '마케팅팀', sales: '영업본부',
  }
  const deptName = deptMap[deptId]
  if (!deptName) return []

  const dept = findDeptById(orgDepartments, deptId)
  if (!dept) return []

  const allIds = getAllDescendantDeptNames(dept, deptMap)
  return allMembers.filter((m) => allIds.includes(m.department))
}

function findDeptById(depts: Department[], id: string): Department | null {
  for (const d of depts) {
    if (d.id === id) return d
    if (d.children) {
      const found = findDeptById(d.children, id)
      if (found) return found
    }
  }
  return null
}

function getAllDescendantDeptNames(dept: Department, deptMap: Record<string, string>): string[] {
  const names = deptMap[dept.id] ? [deptMap[dept.id]] : []
  if (dept.children) {
    for (const child of dept.children) {
      names.push(...getAllDescendantDeptNames(child, deptMap))
    }
  }
  return names
}

// ── Invite Modal ───────────────────────────────────────
function InviteModal({
  onClose,
  onInvite,
  existingMemberIds,
}: {
  onClose: () => void
  onInvite: (members: ChatMember[]) => void
  existingMemberIds: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(['ceo']))

  const toggleMember = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleDept = (id: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectDeptMembers = (deptId: string) => {
    const deptMems = getDeptMembers(deptId)
    setSelected((prev) => {
      const next = new Set(prev)
      const available = deptMems.filter((m) => !existingMemberIds.includes(m.id))
      const allSelected = available.every((m) => next.has(m.id))
      if (allSelected) {
        available.forEach((m) => next.delete(m.id))
      } else {
        available.forEach((m) => next.add(m.id))
      }
      return next
    })
  }

  const filteredMembers = searchQuery
    ? allMembers.filter(
        (m) =>
          !existingMemberIds.includes(m.id) &&
          (m.name.includes(searchQuery) || m.department.includes(searchQuery))
      )
    : null

  const handleInvite = () => {
    const selectedMembers = allMembers.filter((m) => selected.has(m.id))
    if (selectedMembers.length > 0) onInvite(selectedMembers)
  }

  function renderDeptTree(dept: Department, level: number) {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expandedDepts.has(dept.id)
    const deptMems = getDeptMembers(dept.id).filter(
      (m) => !existingMemberIds.includes(m.id)
    )

    return (
      <div key={dept.id}>
        <div
          className="flex items-center gap-1.5 py-1.5 cursor-pointer text-[13px] text-gray-600 hover:bg-gray-50"
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          <span
            className="w-4 text-center"
            onClick={() => {
              if (hasChildren) toggleDept(dept.id)
            }}
          >
            {hasChildren ? (
              <i className={`fa-solid fa-chevron-right text-[9px] text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            ) : null}
          </span>
          <span className="flex-1 truncate" onClick={() => toggleDept(dept.id)}>
            {dept.name}
          </span>
          {deptMems.length > 0 && (
            <button
              onClick={() => selectDeptMembers(dept.id)}
              className="text-[10px] text-[var(--primary-color)] hover:underline mr-2"
            >
              전체선택
            </button>
          )}
        </div>
        {isExpanded && (
          <div>
            {hasChildren && dept.children!.map((child) => renderDeptTree(child, level + 1))}
            {allMembers
              .filter((m) => {
                const deptMap: Record<string, string> = {
                  hr: '인사총무팀', finance: '재무회계팀', ga: '총무팀',
                  management: '경영지원본부', frontend: '프론트엔드팀', backend: '백엔드팀',
                  infra: '인프라팀', qa: 'QA팀', dev: '개발본부',
                  sales1: '영업1팀', sales2: '영업2팀', marketing: '마케팅팀', sales: '영업본부',
                }
                return m.department === deptMap[dept.id] && !existingMemberIds.includes(m.id)
              })
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50"
                  style={{ paddingLeft: `${24 + level * 16}px` }}
                  onClick={() => toggleMember(member.id)}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      selected.has(member.id)
                        ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {selected.has(member.id) && <i className="fa-solid fa-check" />}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: member.profileColor }}
                  >
                    {member.name.slice(-2)}
                  </div>
                  <span className="text-[12px] text-gray-700">{member.name}</span>
                  <span className="text-[10px] text-gray-400">{member.rank}</span>
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
        className="relative bg-white rounded-xl shadow-2xl w-[400px] max-h-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-[14px] font-bold text-gray-800">대화상대 초대</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-100">
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

        {/* Selected chips */}
        {selected.size > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
            {allMembers
              .filter((m) => selected.has(m.id))
              .map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 bg-[#eaf6f0] text-[var(--primary-color)] text-[11px] px-2 py-0.5 rounded-full"
                >
                  {m.name}
                  <i
                    className="fa-solid fa-xmark text-[9px] cursor-pointer hover:text-red-500"
                    onClick={() => toggleMember(m.id)}
                  />
                </span>
              ))}
          </div>
        )}

        {/* Tree or search results */}
        <div className="flex-1 overflow-y-auto min-h-0 py-1">
          {filteredMembers
            ? filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 py-1.5 px-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleMember(member.id)}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      selected.has(member.id)
                        ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {selected.has(member.id) && <i className="fa-solid fa-check" />}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: member.profileColor }}
                  >
                    {member.name.slice(-2)}
                  </div>
                  <span className="text-[12px] text-gray-700">{member.name}</span>
                  <span className="text-[10px] text-gray-400">{member.department}</span>
                </div>
              ))
            : orgDepartments.map((dept) => renderDeptTree(dept, 0))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[12px] text-gray-500">{selected.size}명 선택</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleInvite}
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

// ── Create Room Modal ──────────────────────────────────
function CreateRoomModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, members: ChatMember[]) => void
}) {
  const [roomName, setRoomName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(['ceo']))

  const toggleMember = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleDept = (id: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = () => {
    const selectedMembers = allMembers.filter((m) => selected.has(m.id))
    if (selectedMembers.length === 0) return
    const name = roomName.trim() || selectedMembers.map((m) => m.name).join(', ')
    onCreate(name, selectedMembers)
  }

  function renderDeptTree(dept: Department, level: number) {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expandedDepts.has(dept.id)
    const deptMap: Record<string, string> = {
      hr: '인사총무팀', finance: '재무회계팀', ga: '총무팀',
      management: '경영지원본부', frontend: '프론트엔드팀', backend: '백엔드팀',
      infra: '인프라팀', qa: 'QA팀', dev: '개발본부',
      sales1: '영업1팀', sales2: '영업2팀', marketing: '마케팅팀', sales: '영업본부',
    }

    return (
      <div key={dept.id}>
        <div
          className="flex items-center gap-1.5 py-1.5 cursor-pointer text-[13px] text-gray-600 hover:bg-gray-50"
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => { if (hasChildren) toggleDept(dept.id) }}
        >
          {hasChildren ? (
            <i className={`fa-solid fa-chevron-right text-[9px] w-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          ) : (
            <span className="w-3" />
          )}
          <span className="flex-1 truncate">{dept.name}</span>
        </div>
        {isExpanded && (
          <div>
            {hasChildren && dept.children!.map((child) => renderDeptTree(child, level + 1))}
            {allMembers
              .filter((m) => m.department === deptMap[dept.id])
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50"
                  style={{ paddingLeft: `${24 + level * 16}px` }}
                  onClick={() => toggleMember(member.id)}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      selected.has(member.id)
                        ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {selected.has(member.id) && <i className="fa-solid fa-check" />}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: member.profileColor }}
                  >
                    {member.name.slice(-2)}
                  </div>
                  <span className="text-[12px] text-gray-700">{member.name}</span>
                  <span className="text-[10px] text-gray-400">{member.rank}</span>
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
        className="relative bg-white rounded-xl shadow-2xl w-[420px] max-h-[550px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-[14px] font-bold text-gray-800">새 채팅방 만들기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Room name */}
        <div className="px-4 py-2.5 border-b border-gray-100">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="채팅방 이름 (비워두면 참여자 이름으로 생성)"
            className="w-full border border-gray-200 rounded-lg px-3 py-[6px] text-[12px] focus:outline-none focus:border-[var(--primary-color)]"
          />
        </div>

        {/* Selected chips */}
        {selected.size > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
            {allMembers
              .filter((m) => selected.has(m.id))
              .map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 bg-[#eaf6f0] text-[var(--primary-color)] text-[11px] px-2 py-0.5 rounded-full"
                >
                  {m.name}
                  <i
                    className="fa-solid fa-xmark text-[9px] cursor-pointer hover:text-red-500"
                    onClick={() => toggleMember(m.id)}
                  />
                </span>
              ))}
          </div>
        )}

        {/* Org tree */}
        <div className="flex-1 overflow-y-auto min-h-0 py-1">
          {orgDepartments.map((dept) => renderDeptTree(dept, 0))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[12px] text-gray-500">{selected.size}명 선택</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
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

// ── Main Messenger Page ────────────────────────────────
export default function MessengerPage({
  embedded,
  initialUserId,
  initialUserName,
}: {
  embedded?: boolean
  initialUserId?: string | null
  initialUserName?: string | null
} = {}) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [inputValue, setInputValue] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-create 1:1 room from URL params or props
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userId = initialUserId || params.get('userId')
    const userName = initialUserName || params.get('userName')
    if (userId && userName) {
      const member = allMembers.find((m) => m.id === userId)
      if (member) {
        const existingRoom = rooms.find(
          (r) => !r.isGroup && r.members.length === 1 && r.members[0].id === userId
        )
        if (existingRoom) {
          setActiveRoomId(existingRoom.id)
        } else {
          const roomId = `room_${Date.now()}`
          const newRoom: ChatRoom = {
            id: roomId,
            name: userName,
            members: [member],
            isGroup: false,
            lastMessage: '',
            lastTime: getTimeStr(),
          }
          setRooms((prev) => [newRoom, ...prev])
          setMessages((prev) => ({ ...prev, [roomId]: [] }))
          setActiveRoomId(roomId)
        }
      }
      // Clear URL params
      window.history.replaceState({}, '', '/messenger')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoomId])

  const activeRoom = rooms.find((r) => r.id === activeRoomId)
  const activeMessages = activeRoomId ? messages[activeRoomId] || [] : []

  const sendMessage = () => {
    if (!inputValue.trim() || !activeRoomId) return
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'me',
      senderName: '나',
      content: inputValue.trim(),
      time: getTimeStr(),
    }
    setMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMsg],
    }))
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoomId
          ? { ...r, lastMessage: inputValue.trim(), lastTime: getTimeStr() }
          : r
      )
    )
    setInputValue('')
  }

  const handleCreateRoom = (name: string, selectedMembers: ChatMember[]) => {
    const roomId = `room_${Date.now()}`
    const isGroup = selectedMembers.length > 1
    const newRoom: ChatRoom = {
      id: roomId,
      name,
      members: selectedMembers,
      isGroup,
      lastMessage: '',
      lastTime: getTimeStr(),
    }
    setRooms((prev) => [newRoom, ...prev])
    setMessages((prev) => ({ ...prev, [roomId]: [] }))
    setActiveRoomId(roomId)
    setShowCreateModal(false)
  }

  const handleInvite = (newMembers: ChatMember[]) => {
    if (!activeRoomId || !activeRoom) return
    const updatedMembers = [...activeRoom.members, ...newMembers]
    const updatedName = activeRoom.isGroup
      ? activeRoom.name
      : updatedMembers.map((m) => m.name).join(', ')
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoomId
          ? { ...r, members: updatedMembers, isGroup: true, name: updatedName }
          : r
      )
    )
    // System message
    const sysMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'system',
      senderName: '시스템',
      content: `${newMembers.map((m) => m.name).join(', ')}님이 초대되었습니다.`,
      time: getTimeStr(),
    }
    setMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), sysMsg],
    }))
    setShowInviteModal(false)
  }

  const handleLeaveRoom = () => {
    if (!activeRoomId) return
    setRooms((prev) => prev.filter((r) => r.id !== activeRoomId))
    setMessages((prev) => {
      const next = { ...prev }
      delete next[activeRoomId]
      return next
    })
    setActiveRoomId(null)
    setShowLeaveConfirm(false)
  }

  const filteredRooms = searchQuery
    ? rooms.filter(
        (r) =>
          r.name.includes(searchQuery) ||
          r.members.some((m) => m.name.includes(searchQuery))
      )
    : rooms

  return (
    <div className={`flex ${embedded ? 'h-full' : 'h-screen'} bg-[#f4f7f6] font-['Pretendard',sans-serif]`}>
      {/* Left: Room List */}
      <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Header */}
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

        {/* Search */}
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

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <i className="fa-regular fa-comment-dots text-3xl mb-3" />
              <p className="text-[13px]">채팅방이 없습니다</p>
              <p className="text-[11px] mt-1">새 채팅방을 만들어보세요</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  activeRoomId === room.id ? 'bg-[#eaf6f0]' : 'hover:bg-gray-50'
                }`}
              >
                {/* Room avatar */}
                {room.isGroup ? (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white shrink-0">
                    <i className="fa-solid fa-users text-[14px]" />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                    style={{ backgroundColor: room.members[0]?.profileColor || '#999' }}
                  >
                    {room.members[0]?.name.slice(-2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-gray-800 truncate">
                      {room.name}
                      {room.isGroup && (
                        <span className="text-[11px] text-gray-400 ml-1">
                          {room.members.length + 1}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {room.lastTime}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {room.lastMessage || '대화를 시작해보세요'}
                  </p>
                </div>
                {room.unread && room.unread > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shrink-0">
                    {room.unread}
                  </span>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                {activeRoom.isGroup ? (
                  <div className="w-9 h-9 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white">
                    <i className="fa-solid fa-users text-[12px]" />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ backgroundColor: activeRoom.members[0]?.profileColor || '#999' }}
                  >
                    {activeRoom.members[0]?.name.slice(-2)}
                  </div>
                )}
                <div>
                  <h3 className="text-[14px] font-bold text-gray-800">
                    {activeRoom.name}
                    {activeRoom.isGroup && (
                      <span className="text-[12px] text-gray-400 font-normal ml-1">
                        {activeRoom.members.length + 1}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {activeRoom.members.map((m) => m.name).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[var(--primary-color)] transition-colors"
                  title="초대하기"
                >
                  <i className="fa-solid fa-user-plus text-[13px]" />
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {activeMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <i className="fa-regular fa-comment-dots text-4xl mb-3" />
                  <p className="text-[13px]">대화를 시작해보세요</p>
                </div>
              )}
              {activeMessages.map((msg) => {
                if (msg.senderId === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  )
                }
                const isMe = msg.senderId === 'me'
                const sender = isMe
                  ? ME
                  : activeRoom.members.find((m) => m.id === msg.senderId) || ME
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {!isMe && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: sender.profileColor }}
                      >
                        {sender.name.slice(-2)}
                      </div>
                    )}
                    <div className={`max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && (
                        <span className="text-[11px] text-gray-500 mb-1">{msg.senderName}</span>
                      )}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                          isMe
                            ? 'bg-[var(--primary-color)] text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right' : ''}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[var(--primary-color)] bg-[#f9fafb]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 rounded-xl bg-[var(--primary-color)] text-white flex items-center justify-center hover:opacity-90 transition-colors disabled:opacity-40 shrink-0"
                >
                  <i className="fa-solid fa-paper-plane text-[14px]" />
                </button>
              </div>
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
        />
      )}
      {showInviteModal && activeRoom && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          existingMemberIds={[...activeRoom.members.map((m) => m.id), 'me']}
        />
      )}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowLeaveConfirm(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[320px] p-6 text-center"
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
                onClick={handleLeaveRoom}
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
