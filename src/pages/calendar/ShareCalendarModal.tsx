import { useState, useEffect } from 'react'
import type { SharedCalendar } from './types'
import { COLORS } from './types'
import { interestCalendarApi } from '../../api/calendar'
import api from '../../api/client'

interface ShareCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  onRequest: (calendar: SharedCalendar) => void
}

interface EmployeeItem {
  empId: number
  empName: string
  departmentName: string
}

interface PageResponse<T> {
  content: T[]
}

export default function ShareCalendarModal({ isOpen, onClose, onRequest }: ShareCalendarModalProps) {
  const [searchText, setSearchText] = useState('')
  const [employees, setEmployees] = useState<EmployeeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set())
  const myEmpId = Number(localStorage.getItem('empId') || '0')

  // 직원 목록 검색
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    api.get<PageResponse<EmployeeItem>>('/hr-service/employee', { params: { keyword: searchText || undefined, size: 50 } })
      .then(r => {
        setEmployees(r.data.content.filter(e => e.empId !== myEmpId))
      })
      .catch(() => {
        setEmployees([
          { empId: 2, empName: '이영희', departmentName: '인사총무팀' },
          { empId: 3, empName: '박지훈', departmentName: '인사총무팀' },
          { empId: 4, empName: '최수진', departmentName: '개발팀' },
          { empId: 5, empName: '정민호', departmentName: '기획팀' },
          { empId: 6, empName: '한서연', departmentName: '디자인팀' },
          { empId: 7, empName: '강동우', departmentName: '마케팅팀' },
        ].filter(e => e.empId !== myEmpId))
      })
      .finally(() => setLoading(false))
  }, [isOpen, searchText])

  // 모달 열 때 신청 목록 초기화
  useEffect(() => {
    if (!isOpen) return
    setRequestedIds(new Set())
    // 이미 보낸 요청 조회
    interestCalendarApi.getSentRequests(0, 100)
      .then(r => {
        const ids = new Set(r.content.filter(req => req.shareStatus === 'PENDING' || req.shareStatus === 'APPROVED').map(req => req.toEmpId))
        setRequestedIds(ids)
      })
      .catch(() => {})
  }, [isOpen])

  if (!isOpen) return null

  const handleRequest = (emp: EmployeeItem) => {
    if (requestedIds.has(emp.empId)) return
    setRequestedIds(prev => new Set(prev).add(emp.empId))
    interestCalendarApi.requestShare({ targetEmpId: emp.empId })
      .then(() => {
        const colorIdx = Math.floor(Math.random() * COLORS.length)
        const newCal: SharedCalendar = {
          id: 'sub-' + emp.empId,
          name: `내 일정(${emp.empName})`,
          type: 'subscribed',
          color: COLORS[colorIdx],
          visible: false,
          owner: emp.empName,
          status: 'pending',
        }
        onRequest(newCal)
        onClose()
      })
      .catch(() => {
        // 폴백: 로컬에서만 추가
        const colorIdx = Math.floor(Math.random() * COLORS.length)
        onRequest({
          id: 'sub-' + emp.empId,
          name: `내 일정(${emp.empName})`,
          type: 'subscribed',
          color: COLORS[colorIdx],
          visible: false,
          owner: emp.empName,
          status: 'pending',
        })
        onClose()
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[400px] max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-[15px] font-bold text-gray-900">관심 캘린더 추가</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0">
          <p className="text-xs text-gray-500 mb-3">상대방에게 캘린더 공유 요청을 보냅니다. 승인되면 일정을 열람할 수 있습니다.</p>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="이름 또는 부서로 검색..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#2e9e6e] focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-xs">검색 중...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">검색 결과가 없습니다</div>
          ) : (
            <div className="space-y-1">
              {employees.map(emp => (
                <div key={emp.empId} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#f2faf6] group transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                      {emp.empName[0]}
                    </div>
                    <div>
                      <div className="text-sm text-gray-800 font-medium">{emp.empName}</div>
                      <div className="text-[11px] text-gray-400">{emp.departmentName}</div>
                    </div>
                  </div>
                  {requestedIds.has(emp.empId) ? (
                    <span className="text-[10px] text-gray-400 px-3 py-1.5">신청완료</span>
                  ) : (
                    <button
                      onClick={() => handleRequest(emp)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-[#2e9e6e] font-medium px-3 py-1.5 rounded-lg bg-[#f0f9f6] hover:bg-[#e0f3ec] transition-all"
                    >
                      신청
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
