import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { approvalApi } from '../../../api/approval'
import { queryKeys } from '../../../lib/queryKeys'
import { Skeleton } from '../../../components/ui/Skeleton'

/* ── 섹션 테이블 공통 ── */
function SectionTable({ title, columns, rows, onRowClick }: { title: string; columns: string[]; rows: React.ReactNode[][]; onRowClick?: (index: number) => void }) {
  return (
    <div className="mb-8">
      <h2 className="text-[14px] font-bold text-[#000000] mb-3 tracking-tight">{title}</h2>
      <div className="bg-white rounded-xl border border-[#d1d5db] shadow-sm overflow-hidden">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-800">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 font-semibold text-[#000000] ${
                    i >= columns.length - 2 ? 'text-right' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-300 text-[13px]">문서가 없습니다.</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-200 last:border-b-0 hover:bg-[#E1F5EE] cursor-pointer transition-colors" onClick={() => onRowClick?.(i)}>
                  {row.map((cell, j) => (
                    <td key={j} className={`px-5 py-3 ${j >= row.length - 2 ? 'text-right' : ''}`}>{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function statusBadge(status: string) {
  const statusMap: Record<string, { label: string; color: string }> = {
    'PENDING': { label: '진행중', color: 'bg-[#E1F5EE] text-[#1D9E75]' },
    'APPROVED': { label: '승인', color: 'bg-blue-50 text-blue-600' },
    'REJECTED': { label: '반려', color: 'bg-red-50 text-red-500' },
    'DRAFT': { label: '임시저장', color: 'bg-yellow-50 text-yellow-600' },
    'CANCELED': { label: '회수', color: 'bg-gray-100 text-gray-500' },
  }
  const info = statusMap[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }
  return <span className={`inline-block text-[11px] px-2.5 py-1 font-semibold rounded-full ${info.color}`}>{info.label}</span>
}

function attachmentIcon(hasAttachment: boolean) {
  if (!hasAttachment) return <span className="text-gray-300">-</span>
  return (
    <span className="inline-flex items-center text-gray-500" title="첨부파일 있음" aria-label="첨부파일 있음">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.93 8.8l-8.58 8.57a2 2 0 0 1-2.83-2.83l7.86-7.86" />
      </svg>
    </span>
  )
}

/* ── 전자결재 홈 ── */
export default function ApprovalHome({ onDocClick }: { onDocClick?: (docId: number) => void }) {
  const waitingQuery = useQuery({
    queryKey: queryKeys.approval.documents('home:waiting', { page: 0, size: 4 }),
    queryFn: () => approvalApi.getWaitingDocuments({ page: 0, size: 4 }).then((r) => r.data),
  })
  const draftQuery = useQuery({
    queryKey: queryKeys.approval.documents('home:draftPending', { page: 0, size: 5 }),
    queryFn: () => approvalApi.getDraftDocuments({ page: 0, size: 5, status: 'PENDING' }).then((r) => r.data),
  })
  const approvedQuery = useQuery({
    queryKey: queryKeys.approval.documents('home:draftApproved', { page: 0, size: 5 }),
    queryFn: () => approvalApi.getDraftDocuments({ page: 0, size: 5, status: 'APPROVED' }).then((r) => r.data),
  })
  const waitingDocs = waitingQuery.data?.content ?? []
  const draftDocs = draftQuery.data?.content ?? []
  const approvedDocs = approvedQuery.data?.content ?? []
  const loading = waitingQuery.isPending || draftQuery.isPending || approvedQuery.isPending

  if (loading) {
    return (
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#d1d5db] p-5 space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-40 w-full mb-8" />
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-6 tracking-tight">전자결재 홈</h1>

      {/* 결재 대기 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {waitingDocs.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center text-gray-300 text-[13px] py-8">결재 대기 문서가 없습니다.</div>
        ) : (
          waitingDocs.map((doc) => (
            <div key={doc.docId} className="bg-white rounded-xl border border-[#d1d5db] p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-1.5 mb-3">
                {doc.isEmergency && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 font-semibold rounded-full">긴급</span>}
                {statusBadge(doc.docStatus)}
              </div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-4 leading-snug">{doc.docTitle}</h3>
              <div className="space-y-1.5 text-[12px] text-gray-400 mb-4 flex-1">
                <div className="flex"><span className="w-14 text-gray-500">기안자</span>{doc.drafterName}</div>
                <div className="flex"><span className="w-14 text-gray-500">기안일</span>{doc.createdAt?.slice(0, 10)}</div>
                <div className="flex"><span className="w-14 text-gray-500">결재양식</span>{doc.formName}</div>
              </div>
              <button
                className="w-full py-2 border border-[#e0e5e2] rounded-lg text-[12px] text-gray-600 font-medium hover:bg-[#1D9E75] hover:text-white hover:border-[#1D9E75] transition-all"
                onClick={() => onDocClick?.(doc.docId)}
              >
                결재하기
              </button>
            </div>
          ))
        )}
      </div>

      {/* 기안 진행 문서 */}
      <SectionTable
        title="기안 진행 문서"
        columns={['기안일', '결재양식', '제목', '첨부', '문서번호', '결재상태']}
        rows={draftDocs.map((doc) => [
          <span className="text-[#000000]">{doc.createdAt?.slice(0, 10)}</span>,
          <span className="text-gray-600">{doc.formName}</span>,
          <span className="text-gray-900 font-medium">{doc.docTitle}</span>,
          attachmentIcon(doc.hasAttachment),
          <span className="text-black">{doc.docNum}</span>,
          statusBadge(doc.docStatus),
        ])}
        onRowClick={(i) => onDocClick?.(draftDocs[i].docId)}
      />

      {/* 완료 문서 */}
      <SectionTable
        title="완료 문서"
        columns={['기안일', '결재양식', '제목', '첨부', '문서번호', '결재상태']}
        rows={approvedDocs.map((doc) => [
          <span className="text-[#000000]">{doc.createdAt?.slice(0, 10)}</span>,
          <span className="text-gray-600">{doc.formName}</span>,
          <span className="text-gray-900 font-medium">{doc.docTitle}</span>,
          attachmentIcon(doc.hasAttachment),
          <span className="text-black">{doc.docNum}</span>,
          statusBadge(doc.docStatus),
        ])}
        onRowClick={(i) => onDocClick?.(approvedDocs[i].docId)}
      />
    </div>
  )
}
