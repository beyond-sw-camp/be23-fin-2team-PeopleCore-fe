import { useState } from 'react'
import type { SharedCalendar } from './types'
import { COLORS } from './types'

interface ShareCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (calendar: SharedCalendar) => void
}

export default function ShareCalendarModal({ isOpen, onClose, onSave }: ShareCalendarModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<SharedCalendar['type']>('team')
  const [color, setColor] = useState(COLORS[1])
  const [participants, setParticipants] = useState<{ name: string; permission: string }[]>([])
  const [searchText, setSearchText] = useState('')

  const MOCK_TEAMS = [
    { name: '인사총무팀', type: 'department' },
    { name: '개발팀', type: 'department' },
    { name: '기획팀', type: 'department' },
    { name: '디자인팀', type: 'department' },
    { name: '마케팅팀', type: 'department' },
    { name: '프로젝트 Beta', type: 'project' },
  ]

  const filteredTeams = searchText
    ? MOCK_TEAMS.filter(t => !participants.some(p => p.name === t.name) && t.name.includes(searchText))
    : []

  if (!isOpen) return null

  const handleSave = () => {
    if (!name.trim()) return
    const newCal: SharedCalendar = {
      id: 'cal-' + Date.now(),
      name,
      type,
      color,
      visible: true,
      permission: 'admin',
      owner: '김철수',
    }
    onSave(newCal)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[460px]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-800">공유 캘린더 만들기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 이름 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">캘린더 이름</label>
            <input
              type="text"
              placeholder="예: 개발팀 일정"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-[#2e9e6e] focus:outline-none"
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">유형</label>
            <div className="flex gap-2">
              {[
                { value: 'department', label: '부서' },
                { value: 'team', label: '팀' },
                { value: 'project', label: '프로젝트' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value as SharedCalendar['type'])}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    type === opt.value
                      ? 'border-[#2e9e6e] bg-[#f0f9f6] text-[#2e9e6e] font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">색상</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 참여자 추가 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">참여자 (부서/팀/프로젝트)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="부서 또는 팀 검색..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-[#2e9e6e] focus:outline-none"
              />
              {filteredTeams.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-32 overflow-y-auto">
                  {filteredTeams.map(team => (
                    <div
                      key={team.name}
                      onClick={() => { setParticipants([...participants, { name: team.name, permission: 'edit' }]); setSearchText('') }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                    >
                      {team.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {participants.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={p.permission}
                        onChange={e => setParticipants(participants.map((pp, ii) => ii === i ? { ...pp, permission: e.target.value } : pp))}
                        className="text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:border-[#2e9e6e] focus:outline-none"
                      >
                        <option value="view">열람</option>
                        <option value="edit">편집</option>
                        <option value="admin">관리</option>
                      </select>
                      <button onClick={() => setParticipants(participants.filter((_, ii) => ii !== i))} className="text-gray-300 hover:text-red-400">
                        <i className="fas fa-times text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1">참여자에게 참여 승인 요청 알림이 발송됩니다.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  )
}
