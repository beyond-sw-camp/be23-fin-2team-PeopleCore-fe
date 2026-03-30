import { useState, useRef, useEffect, useCallback } from 'react'
import ApprovalInfoModal from './ApprovalInfoModal'
import { CURRENT_USER, type OrgMember } from './ApprovalInfoModal'
import { getFormHtml } from './formTemplates'

interface FormInfo {
  name: string
  folder: string
  retention: string
}

interface AttachedFile {
  file: File
  name: string
  size: number
}

export interface TempSavedDoc {
  id: number
  form: FormInfo
  docData: Record<string, string>
  savedAt: string
}

interface ApprovalDocumentPageProps {
  form: FormInfo
  onBack: () => void
  onTempSave?: (doc: TempSavedDoc) => void
  readOnly?: boolean
  initialDocData?: Record<string, string>
  /** 임시저장 문서 편집 시 기존 id */
  editingTempId?: number
}

const RETENTION_OPTIONS = ['1년', '3년', '5년', '10년', '영구']
const DEPARTMENTS = ['경영', '개발', '인사']
const DEPT_DOCS = ['미지정', '경영지원팀', '개발팀', '인사팀']

export default function ApprovalDocumentPage({
  form,
  onBack,
  onTempSave,
  readOnly = false,
  initialDocData,
  editingTempId,
}: ApprovalDocumentPageProps) {
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [approvers, setApprovers] = useState<OrgMember[]>([])
  const [ccList, setCcList] = useState<OrgMember[]>([])
  const [viewers, setViewers] = useState<OrgMember[]>([])
  const [bottomTab, setBottomTab] = useState<'결재선' | '문서정보'>('결재선')
  const [docData, setDocData] = useState<Record<string, string>>(initialDocData ?? {})

  // 문서정보 state
  const [isPublic, setIsPublic] = useState(false)
  const [retention, setRetention] = useState(form.retention)
  const [draftDept, setDraftDept] = useState(CURRENT_USER.department)
  const [deptDoc, setDeptDoc] = useState('미지정')
  const [isEmergency, setIsEmergency] = useState(false)

  // 파일첨부 state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const formHtml = getFormHtml(form.name)

  const today = new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}(${dayNames[today.getDay()]})`

  const totalFileSize = attachedFiles.reduce((s, f) => s + f.size, 0)
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0MB'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  /* ── form_html 렌더링 + doc_data 바인딩 ── */
  const collectValues = useCallback(() => {
    if (!formRef.current) return
    const data: Record<string, string> = {}
    formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el) => {
      if (!el.name) return
      if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value
      } else if (el.type === 'checkbox') {
        data[el.name] = el.checked ? 'true' : 'false'
      } else {
        data[el.name] = el.value
      }
    })
    setDocData(data)
  }, [])

  useEffect(() => {
    if (!formRef.current) return
    formRef.current.innerHTML = formHtml

    if (readOnly) formRef.current.classList.add('form-readonly')

    const dataToFill = initialDocData ?? {}
    Object.entries(dataToFill).forEach(([name, value]) => {
      const els = formRef.current!.querySelectorAll<HTMLInputElement>(`[name="${name}"]`)
      els.forEach((el) => {
        if (el.type === 'radio') {
          el.checked = el.value === value
        } else if (el.type === 'checkbox') {
          el.checked = value === 'true'
        } else {
          el.value = value
        }
      })
    })

    if (!readOnly) {
      const handler = () => collectValues()
      formRef.current.addEventListener('input', handler)
      formRef.current.addEventListener('change', handler)
      const ref = formRef.current
      return () => {
        ref.removeEventListener('input', handler)
        ref.removeEventListener('change', handler)
      }
    }
  }, [formHtml, readOnly, initialDocData, collectValues])

  /* ── 파일 추가 ── */
  const addFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).map((f) => ({
      file: f,
      name: f.name,
      size: f.size,
    }))
    setAttachedFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }

  /* ── 임시저장 ── */
  const handleTempSave = () => {
    collectValues()
    const now = new Date()
    const savedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (onTempSave) {
      // formRef에서 최신 값 직접 수집
      const data: Record<string, string> = {}
      if (formRef.current) {
        formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el) => {
          if (!el.name) return
          if (el.type === 'radio') { if (el.checked) data[el.name] = el.value }
          else if (el.type === 'checkbox') { data[el.name] = el.checked ? 'true' : 'false' }
          else { data[el.name] = el.value }
        })
      }
      onTempSave({
        id: editingTempId ?? Date.now(),
        form,
        docData: data,
        savedAt,
      })
    }
    alert('임시저장되었습니다.')
    onBack()
  }

  /* ── 결재요청 ── */
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  const handleSubmitClick = () => {
    if (approvers.length === 0) {
      alert('결재선을 설정해주세요.')
      setInfoModalOpen(true)
      return
    }
    collectValues()
    setSubmitModalOpen(true)
  }

  const handleSubmitConfirm = (opinion: string, urgent: boolean) => {
    console.log('결재요청 doc_data:', docData)
    console.log('기안의견:', opinion)
    console.log('is_emergency:', urgent)
    console.log('결재선:', approvers)
    console.log('참조자:', ccList)
    console.log('열람자:', viewers)
    console.log('첨부파일:', attachedFiles.map((f) => f.name))
    setSubmitModalOpen(false)
    alert('결재 요청되었습니다.')
    onBack()
  }

  /* ── 미리보기 (새 창) ── */
  const handlePreview = () => {
    collectValues()
    const previewWindow = window.open('', '_blank', 'width=900,height=800,scrollbars=yes')
    if (!previewWindow) return

    const approverHeaders = approvers.map((a) => `<td style="padding:4px 16px;border:1px solid #d1d5db;text-align:center;color:#6b7280;font-weight:500;min-width:70px;">${a.position}</td>`).join('')
    const approverNames = approvers.map((a) => `<td style="padding:12px 16px;border:1px solid #d1d5db;text-align:center;">${a.name}</td>`).join('')
    const approverSep = approvers.length > 0
      ? `<td rowspan="2" style="background:#f9fafb;padding:4px 8px;border:1px solid #d1d5db;font-weight:600;text-align:center;writing-mode:vertical-rl;">승인</td>`
      : ''

    previewWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${form.name} - 미리보기</title>
<link rel="stylesheet" href="/src/index.css">
<style>
  body { font-family: 'Pretendard', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; font-size: 13px; }
  .header { display: flex; gap: 24px; margin-bottom: 32px; }
  .info-table td { border: 1px solid #d1d5db; padding: 8px 16px; font-size: 12px; }
  .info-table .label { background: #f9fafb; font-weight: 600; color: #374151; width: 80px; }
  .approval-table td { font-size: 12px; }
  .section-title { font-size: 13px; font-weight: 600; margin: 24px 0 8px; }
  .file-item { background: #f9fafb; border-radius: 4px; padding: 6px 12px; margin: 4px 0; font-size: 12px; }
  .approver { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  .approver-avatar { width: 36px; height: 36px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af; }
  ${document.querySelector('style')?.textContent ?? ''}
</style></head><body>
<h1 style="text-align:center;font-size:20px;font-weight:700;margin-bottom:24px;">${form.name}</h1>
<div class="header">
  <table class="info-table"><tbody>
    <tr><td class="label">기안자</td><td style="width:140px;">${CURRENT_USER.name}</td></tr>
    <tr><td class="label">소속</td><td>${CURRENT_USER.department}</td></tr>
    <tr><td class="label">기안일</td><td>${dateStr}</td></tr>
    <tr><td class="label">문서번호</td><td style="color:#9ca3af;"></td></tr>
  </tbody></table>
  <table class="approval-table" style="border-collapse:collapse;align-self:start;"><tbody>
    <tr>
      <td rowspan="2" style="background:#f9fafb;padding:4px 8px;border:1px solid #d1d5db;font-weight:600;text-align:center;writing-mode:vertical-rl;">신청</td>
      <td style="padding:4px 16px;border:1px solid #d1d5db;text-align:center;color:#6b7280;font-weight:500;min-width:70px;">${CURRENT_USER.position}</td>
      ${approverSep}
      ${approverHeaders}
    </tr>
    <tr>
      <td style="padding:12px 16px;border:1px solid #d1d5db;text-align:center;">${CURRENT_USER.name}</td>
      ${approverNames}
    </tr>
  </tbody></table>
</div>
<div class="form-readonly">${formHtml}</div>
${attachedFiles.length > 0 ? `
<div class="section-title">파일첨부</div>
${attachedFiles.map((f) => `<div class="file-item">${f.name} (${formatSize(f.size)})</div>`).join('')}
` : ''}
<div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:16px;">
  <div class="section-title">결재선</div>
  <div class="approver"><div class="approver-avatar">👤</div><div><strong>${CURRENT_USER.name} ${CURRENT_USER.position}</strong><br><span style="color:#9ca3af;font-size:11px;">${CURRENT_USER.department} · 기안</span></div></div>
  ${approvers.map((a) => `<div class="approver"><div class="approver-avatar">👤</div><div><strong>${a.name} ${a.position}</strong><br><span style="color:#9ca3af;font-size:11px;">${a.department} · 결재 예정</span></div></div>`).join('')}
</div>
</body></html>`)
    previewWindow.document.close()

    // fill doc_data into the preview
    setTimeout(() => {
      Object.entries(docData).forEach(([name, value]) => {
        const els = previewWindow.document.querySelectorAll<HTMLInputElement>(`[name="${name}"]`)
        els.forEach((el) => {
          if (el.type === 'radio') el.checked = el.value === value
          else if (el.type === 'checkbox') el.checked = value === 'true'
          else el.value = value
        })
      })
    }, 100)
  }

  /* ── 툴바 ── */
  const Toolbar = () => (
    <div className="flex items-center gap-4 px-4 py-2 text-[12px] text-gray-600 border-b border-gray-200 bg-white">
      {!readOnly && (
        <>
          <button onClick={handleSubmitClick} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
            <i className="fas fa-pen text-[10px]" /> 결재요청
          </button>
          <button onClick={handleTempSave} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
            <i className="fas fa-save text-[10px]" /> 임시저장
          </button>
        </>
      )}
      <button onClick={handlePreview} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
        <i className="fas fa-eye text-[10px]" /> 미리보기
      </button>
      {!readOnly && (
        <button onClick={onBack} className="flex items-center gap-1 hover:text-red-400 transition-colors">
          <i className="fas fa-times-circle text-[10px]" /> 취소
        </button>
      )}
      <button
        onClick={() => setInfoModalOpen(true)}
        className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors"
      >
        <i className="fas fa-info-circle text-[10px]" /> 결재 정보
      </button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <Toolbar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto py-8 px-4">
          {/* 기안 정보 (좌) + 결재선 미리보기 (우) */}
          <div className="flex justify-between items-start mb-8">
            <table className="text-[12px] border border-gray-300">
              <tbody>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300 w-20">기안자</td>
                  <td className="px-4 py-2 border border-gray-300 w-36">{CURRENT_USER.name}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300">소속</td>
                  <td className="px-4 py-2 border border-gray-300">{CURRENT_USER.department}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300">기안일</td>
                  <td className="px-4 py-2 border border-gray-300">{dateStr}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300">문서번호</td>
                  <td className="px-4 py-2 border border-gray-300 text-gray-400"></td>
                </tr>
              </tbody>
            </table>

            <table className="text-[12px] border border-gray-300 self-start">
              <tbody>
                {/* 헤더: 직급 */}
                <tr>
                  <td rowSpan={2} className="bg-gray-50 px-2 py-1 border border-gray-300 text-gray-700 font-semibold text-center">
                    <span className="[writing-mode:vertical-rl]">신청</span>
                  </td>
                  <td className="px-4 py-1 border border-gray-300 text-gray-500 font-medium text-center min-w-[70px]">
                    {CURRENT_USER.position}
                  </td>
                  {approvers.length > 0 && (
                    <td rowSpan={2} className="bg-gray-50 px-2 py-1 border border-gray-300 text-gray-700 font-semibold text-center">
                      <span className="[writing-mode:vertical-rl]">승인</span>
                    </td>
                  )}
                  {approvers.map((a) => (
                    <td key={a.id} className="px-4 py-1 border border-gray-300 text-gray-500 font-medium text-center min-w-[70px]">
                      {a.position}
                    </td>
                  ))}
                </tr>
                {/* 이름 + 서명 영역 */}
                <tr>
                  <td className="px-4 py-3 border border-gray-300 text-center text-gray-800">
                    {CURRENT_USER.name}
                  </td>
                  {approvers.map((a) => (
                    <td key={a.id} className="px-4 py-3 border border-gray-300 text-center text-gray-800">
                      {a.name}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── form_html 렌더링 영역 ── */}
          <div ref={formRef} className="mb-8" />

          {/* ── 파일첨부 ── */}
          <div className="mt-8 mb-4">
            <div className="flex items-center gap-1 text-[13px] font-semibold text-[#000000] mb-2">
              파일첨부
              <span className="text-gray-400 text-[11px] font-normal cursor-help" title="파일을 첨부합니다">&#9432;</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
            />
            <div
              className={`border border-dashed rounded-lg py-6 text-center text-[12px] transition-colors ${
                isDragOver ? 'border-[#1D9E75] bg-[#E1F5EE]' : 'border-gray-300 text-gray-400'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <i className="fas fa-paperclip text-gray-300 mr-1" />
              이곳에 파일을 드래그 하세요. 또는{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[#000000] underline hover:text-gray-600"
              >
                파일선택
              </button>
              <span className="text-gray-300 ml-1">({formatSize(totalFileSize)})</span>
            </div>
            {/* 첨부된 파일 목록 */}
            {attachedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] bg-gray-50 rounded px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-file text-gray-400 text-[10px]" />
                      <span className="text-gray-700">{f.name}</span>
                      <span className="text-gray-400">({formatSize(f.size)})</span>
                    </div>
                    {!readOnly && (
                      <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <i className="fas fa-times" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관련문서 */}
          <div className="mb-8">
            <div className="text-[13px] font-semibold text-[#000000] mb-2">관련문서</div>
            <button className="text-[12px] border border-gray-300 rounded px-3 py-1 text-gray-600 hover:bg-gray-50 transition-colors">
              문서 검색
            </button>
          </div>

          {/* ── 하단 결재선 / 문서정보 ── */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex gap-4 mb-4 text-[13px]">
              <button
                onClick={() => setBottomTab('결재선')}
                className={`pb-1 ${bottomTab === '결재선' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
              >
                결재선
              </button>
              <button
                onClick={() => setBottomTab('문서정보')}
                className={`pb-1 ${bottomTab === '문서정보' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
              >
                문서정보
              </button>
            </div>

            {bottomTab === '결재선' ? (
              <div className="space-y-3">
                <ApproverCard name={CURRENT_USER.name} position={CURRENT_USER.position} department={CURRENT_USER.department} role="기안" />
                {approvers.map((a) => (
                  <ApproverCard key={a.id} name={a.name} position={a.position} department={a.department} role="결재 예정" />
                ))}
                {approvers.length === 0 && (
                  <div className="text-[12px] text-gray-400 py-4 text-center">결재 정보에서 결재선을 설정해주세요.</div>
                )}
              </div>
            ) : (
              /* ── 문서정보 탭 (ERD 기반) ── */
              <div className="text-[13px] space-y-5 pl-2">
                {/* 문서번호 */}
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-[#000000]">문서번호</span>
                  <span className="text-gray-400 text-[12px]"></span>
                </div>

                {/* 공개여부 */}
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-[#000000]">공개여부</span>
                  <label className="flex items-center gap-1 mr-4 text-gray-700 cursor-pointer">
                    <input type="radio" name="doc_public" checked={isPublic} onChange={() => setIsPublic(true)} className="accent-[#1D9E75]" />
                    공개
                  </label>
                  <label className="flex items-center gap-1 text-gray-500 cursor-pointer">
                    <input type="radio" name="doc_public" checked={!isPublic} onChange={() => setIsPublic(false)} className="accent-gray-500" />
                    비공개
                  </label>
                </div>

                {/* 전사문서함 */}
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-[#000000]">전사문서함</span>
                  <span className="inline-block text-[11px] bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-gray-700 mr-2">
                    {form.folder}
                  </span>
                  <button className="text-[11px] text-gray-500 hover:text-[#1D9E75] transition-colors">
                    + 전사문서함 추가
                  </button>
                </div>

                {/* 보존연한 */}
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-[#000000]">보존연한</span>
                  <select
                    value={retention}
                    onChange={(e) => setRetention(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                  >
                    {RETENTION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* 기안부서 */}
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-[#000000]">기안부서</span>
                  <select
                    value={draftDept}
                    onChange={(e) => setDraftDept(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                  >
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* 부서문서함 */}
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-[#000000]">부서문서함</span>
                  <select
                    value={deptDoc}
                    onChange={(e) => setDeptDoc(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                  >
                    {DEPT_DOCS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* 문서참조 */}
                <div className="flex items-start">
                  <span className="w-24 font-semibold text-[#000000] pt-0.5">문서참조</span>
                  <div className="flex flex-wrap gap-1">
                    {ccList.length === 0
                      ? <span className="text-gray-400 text-[12px]"></span>
                      : ccList.map((m) => (
                          <span key={m.id} className="text-[11px] bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                            {m.name} {m.position}
                          </span>
                        ))
                    }
                  </div>
                </div>

                {/* 문서열람 */}
                <div className="flex items-start">
                  <span className="w-24 font-semibold text-[#000000] pt-0.5">문서열람</span>
                  <div className="flex flex-wrap gap-1">
                    {viewers.length === 0
                      ? <span className="text-gray-400 text-[12px]"></span>
                      : viewers.map((m) => (
                          <span key={m.id} className="text-[11px] bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                            {m.name} {m.position}
                          </span>
                        ))
                    }
                  </div>
                </div>

                {/* 긴급문서 */}
                <div className="flex items-start">
                  <span className="w-24 font-semibold text-[#000000] pt-0.5">긴급문서</span>
                  <div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                      <input
                        type="checkbox"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        className="accent-[#1D9E75] w-4 h-4"
                      />
                      긴급
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1">결재자의 대기문서 가장 상단에 표시됩니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ApprovalInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        approvers={approvers}
        ccList={ccList}
        viewers={viewers}
        onSave={(newApprovers, newCc, newViewers) => {
          setApprovers(newApprovers)
          setCcList(newCc)
          setViewers(newViewers)
          setInfoModalOpen(false)
        }}
      />

      <SubmitModal
        isOpen={submitModalOpen}
        formName={form.name}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={handleSubmitConfirm}
      />
    </div>
  )
}

function ApproverCard({ name, position, department, role }: {
  name: string; position: string; department: string; role: string
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100">
      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
        <i className="fas fa-user text-sm" />
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-semibold text-gray-900">{name} {position}</div>
        <div className="text-[11px] text-gray-400">{department}</div>
        <div className="text-[11px] text-gray-400">{role}</div>
      </div>
    </div>
  )
}

/* ── 결재요청 확인 모달 ── */
function SubmitModal({ isOpen, formName, onClose, onSubmit }: {
  isOpen: boolean
  formName: string
  onClose: () => void
  onSubmit: (opinion: string, urgent: boolean) => void
}) {
  const [opinion, setOpinion] = useState('')
  const [urgent, setUrgent] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[460px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">결재요청</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 결재문서명 */}
          <div className="flex items-start">
            <span className="w-24 text-[13px] font-semibold text-gray-900 pt-0.5 shrink-0">결재문서명</span>
            <span className="text-[13px] text-gray-700">{formName}</span>
          </div>

          {/* 기안의견 */}
          <div className="flex items-start">
            <span className="w-24 text-[13px] font-semibold text-gray-900 pt-1 shrink-0">기안의견</span>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="의견을 작성해 주세요."
              rows={4}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none resize-none placeholder-gray-400 focus:border-[#1D9E75]"
            />
          </div>

          {/* 긴급문서 */}
          <div className="flex items-start">
            <span className="w-24 text-[13px] font-semibold text-gray-900 pt-0.5 shrink-0">긴급문서</span>
            <div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] text-gray-700">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="accent-[#1D9E75] w-4 h-4"
                />
                긴급
              </label>
              <p className="text-[11px] text-gray-500 mt-1">결재자의 대기문서 가장 상단에 표시됩니다.</p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => onSubmit(opinion, urgent)}
            className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors"
          >
            결재요청
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
