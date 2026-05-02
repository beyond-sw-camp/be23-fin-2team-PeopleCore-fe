import { useEffect, useState, useMemo } from 'react'
import { approvalDraftApi } from '../../api/payAdmin'
import type { ApprovalFormType, ApprovalDraftRes, ApprovalLineItem } from '../../api/payAdmin'
import api from '../../api/client'

interface Props {
  type: ApprovalFormType
  ledgerId: number
  onClose: () => void
  onSubmitted?: () => void
}

interface EmployeeItem { empId: number; empName: string; departmentName: string }

/**
 * 결의서 HTML에 data-key 매칭하여 실제 값으로 치환
 */
function injectDataMap(html: string, dataMap: Record<string, string>): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  doc.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key')
    if (key && dataMap[key] != null) el.textContent = dataMap[key]
  })
  return doc.documentElement.outerHTML
}

export default function ApprovalDraftModal({ type, ledgerId, onClose, onSubmitted }: Props) {
  const [draft, setDraft] = useState<ApprovalDraftRes | null>(null)
  const [renderedHtml, setRenderedHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 결재선
  const [approverSearch, setApproverSearch] = useState('')
  const [empList, setEmpList] = useState<EmployeeItem[]>([])
  const [approvalLine, setApprovalLine] = useState<ApprovalLineItem[]>([])

  // 1) 결의서 데이터 조회
  useEffect(() => {
    approvalDraftApi.getDraft(type, ledgerId)
      .then(res => {
        setDraft(res)
        setRenderedHtml(injectDataMap(res.htmlTemplate, res.dataMap))
      })
      .catch(err => {
        console.error('결의서 조회 실패:', err)
        alert('결재 양식을 불러오지 못했습니다: ' + (err?.response?.data?.message || '오류'))
        onClose()
      })
      .finally(() => setLoading(false))
  }, [type, ledgerId, onClose])

  // 2) 결재자 검색
  useEffect(() => {
    if (!approverSearch.trim()) { setEmpList([]); return }
    const t = setTimeout(() => {
      api.get<{ content: EmployeeItem[] }>('/hr-service/employee', { params: { keyword: approverSearch, size: 10 } })
        .then(r => setEmpList(r.data.content))
        .catch(() => setEmpList([]))
    }, 300)
    return () => clearTimeout(t)
  }, [approverSearch])

  const addApprover = (emp: EmployeeItem, approvalType: string) => {
    if (approvalLine.some(a => a.approverId === emp.empId)) return
    setApprovalLine(prev => [...prev, { approverId: emp.empId, order: prev.length + 1, approvalType }])
    setApproverSearch('')
    setEmpList([])
  }
  const removeApprover = (empId: number) => {
    setApprovalLine(prev => prev.filter(a => a.approverId !== empId).map((a, i) => ({ ...a, order: i + 1 })))
  }

  const approverNameMap = useMemo(() => {
    const map: Record<number, string> = {}
    empList.forEach(e => map[e.empId] = e.empName)
    return map
  }, [empList])

  const handleSubmit = async () => {
    if (!draft) return
    if (approvalLine.length === 0) { alert('결재선을 선택해 주세요.'); return }
    if (!confirm(`${type === 'SALARY' ? '급여지급결의서' : '퇴직급여지급결의서'}를 상신하시겠습니까?`)) return

    setSubmitting(true)
    try {
      await approvalDraftApi.submit({
        type,
        ledgerId,
        htmlContent: renderedHtml,
        approvalLine,
      })
      alert('전자결재가 상신되었습니다.')
      onSubmitted?.()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert('상신 실패: ' + (msg || '오류'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(960px,calc(100vw-24px))] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">
              <i className="fas fa-file-signature text-[#2e9e6e] mr-2" />
              전자결재 상신 · {type === 'SALARY' ? '급여지급결의서' : '퇴직급여지급결의서'}
            </h3>
            <p className="text-[11px] text-gray-500 mt-1">
              <i className="fas fa-info-circle mr-1" />
              현재 <span className="font-medium text-gray-700">확정된 사원</span>만 결재 양식에 포함됩니다. 확정 안 된 사원은 다음 결재로 처리됩니다.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">결재 양식을 불러오는 중...</div>
          ) : (
            <>
              {/* 결재선 설정 */}
              <div className="border border-gray-200 rounded-lg p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[13px] font-semibold text-gray-800">결재선 설정 <span className="text-red-500">*</span></h4>
                  <span className="text-[10px] text-gray-400">순서대로 결재 진행됩니다</span>
                </div>

                {/* 선택된 결재자 목록 */}
                {approvalLine.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {approvalLine.map((a, i) => (
                      <div key={a.approverId} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-[#2e9e6e] text-white text-[10px] flex items-center justify-center font-semibold">{i + 1}</span>
                        <span className="font-medium text-gray-800 flex-1">{approverNameMap[a.approverId] || `사원 #${a.approverId}`}</span>
                        <span className="text-[11px] text-gray-500 px-1.5 py-0.5">결재</span>
                        <button onClick={() => removeApprover(a.approverId)} className="text-gray-400 hover:text-red-500 text-xs">
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 결재자 검색 */}
                <div className="relative">
                  <input
                    type="text"
                    value={approverSearch}
                    onChange={e => setApproverSearch(e.target.value)}
                    placeholder="결재자 이름으로 검색..."
                    className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#2e9e6e]"
                  />
                  {empList.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {empList.map(emp => (
                        <button key={emp.empId}
                          onMouseDown={() => addApprover(emp, 'APPROVER')}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span className="text-gray-800 font-medium">{emp.empName}</span>
                          <span className="text-[10px] text-gray-400">{emp.departmentName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 결의서 미리보기 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-[11px] font-medium text-gray-600 border-b border-gray-200">
                  결의서 미리보기
                </div>
                <div
                  className="p-4 bg-white overflow-auto max-h-[50vh]"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading || approvalLine.length === 0}
            className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '상신 중...' : '상신'}
          </button>
        </div>
      </div>
    </div>
  )
}
