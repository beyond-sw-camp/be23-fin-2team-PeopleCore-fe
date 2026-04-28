import { useEffect, useState } from 'react'
import type { DriveFolder, DriveFile, FileBox } from '../types'
import { FILE_TYPE_ICONS, formatBytes, formatDate } from '../types'
import { fileApi } from '../../../api/filevault'

export function FolderModal({
  mode,
  folder,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'rename'
  folder?: DriveFolder
  onClose: () => void
  onSubmit: (name: string) => void | Promise<void>
}) {
  const [name, setName] = useState(folder?.name || '')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = !!name.trim() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[min(380px,calc(100vw-24px))] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">
          {mode === 'create' ? '새 폴더 만들기' : '폴더 이름 변경'}
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="폴더 이름"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--primary-color)] mb-5"
          autoFocus
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            {mode === 'create' ? '만들기' : '변경'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FilePreviewModal({
  file,
  onClose,
  onDownload,
}: {
  file: DriveFile
  onClose: () => void
  onDownload: (file: DriveFile) => void
}) {
  const typeConfig = FILE_TYPE_ICONS[file.type]
  const previewable = file.type === 'image' || file.type === 'pdf'
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(previewable)

  useEffect(() => {
    if (!previewable) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewLoading(true)
    setPreviewError(false)
    fileApi.generateDownloadUrl(Number(file.id), 'inline')
      .then(({ data }) => {
        if (cancelled) return
        setPreviewUrl(data.downloadUrl)
      })
      .catch((e) => {
        console.error('[FilePreviewModal] 미리보기 URL 생성 실패:', e)
        if (cancelled) return
        setPreviewError(true)
      })
      .finally(() => {
        if (cancelled) return
        setPreviewLoading(false)
      })
    return () => { cancelled = true }
  }, [file.id, previewable])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[min(600px,calc(100vw-24px))] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <i className={`${typeConfig.icon} text-[20px]`} style={{ color: typeConfig.color }} />
            <div>
              <h3 className="text-[14px] font-bold text-gray-800">{file.name}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatBytes(file.size)} &middot; {file.createdBy} &middot; {formatDate(file.updatedAt)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[300px] overflow-hidden">
          {previewable && previewLoading ? (
            <div className="text-center text-gray-400">
              <i className="fa-solid fa-spinner fa-spin text-3xl mb-3" />
              <p className="text-[12px]">미리보기 불러오는 중...</p>
            </div>
          ) : previewable && previewError ? (
            <div className="text-center py-16 px-8">
              <i className={`${typeConfig.icon} text-6xl mb-4`} style={{ color: typeConfig.color }} />
              <p className="text-[14px] text-gray-600 font-medium">{file.name}</p>
              <p className="text-[12px] text-gray-400 mt-2">미리보기를 불러오지 못했습니다.</p>
            </div>
          ) : previewable && previewUrl && file.type === 'image' ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : previewable && previewUrl && file.type === 'pdf' ? (
            <iframe
              src={previewUrl}
              title={file.name}
              className="w-full h-[60vh] border-0"
            />
          ) : (
            <div className="text-center py-16 px-8">
              <i className={`${typeConfig.icon} text-6xl mb-4`} style={{ color: typeConfig.color }} />
              <p className="text-[14px] text-gray-600 font-medium">{file.name}</p>
              <p className="text-[12px] text-gray-400 mt-2">
                미리보기가 지원되지 않는 파일 형식입니다.
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                파일을 다운로드하여 확인하세요.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span><i className="fa-solid fa-shield-halved mr-1" /> {file.permission === 'owner' ? '소유자' : file.permission === 'edit' ? '편집 가능' : '읽기 전용'}</span>
          </div>
          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg text-[12px] hover:opacity-90"
          >
            <i className="fa-solid fa-download text-[11px]" />
            다운로드
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[min(340px,calc(100vw-24px))] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[14px] font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-[12px] text-gray-500 mb-5 whitespace-pre-line">{message}</p>
        <div className="flex justify-center gap-2">
          <button onClick={onClose} className="px-5 py-2 text-[12px] text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-[12px] text-white rounded-lg ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--primary-color)] hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AlertModal({
  title,
  message,
  onClose,
}: {
  title: string
  message: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[min(340px,calc(100vw-24px))] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-50 flex items-center justify-center">
          <i className="fa-solid fa-circle-exclamation text-amber-500 text-[18px]" />
        </div>
        <h3 className="text-[14px] font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-[12px] text-gray-500 mb-5 whitespace-pre-line">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90"
        >
          확인
        </button>
      </div>
    </div>
  )
}

export function FileBoxModal({
  mode = 'create',
  fileBox,
  onClose,
  onSubmit,
}: {
  mode?: 'create' | 'edit'
  fileBox?: FileBox
  onClose: () => void
  onSubmit: (name: string) => void | Promise<void>
}) {
  const [name, setName] = useState(fileBox?.name || '')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = !!name.trim() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-[min(420px,calc(100vw-24px))] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-bold text-gray-800 mb-1">
          {mode === 'edit' ? '파일함 수정' : '새 파일함 만들기'}
        </h3>
        <p className="text-[12px] text-gray-400 mb-4">
          {mode === 'edit'
            ? '파일함 이름을 수정합니다.'
            : '파일함을 만들면 본인이 Owner가 되며, 생성 후 권한 관리에서 멤버별 접근 권한을 설정할 수 있습니다.'}
        </p>
        <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">파일함 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 개발팀 파일함"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--primary-color)] mb-5"
          autoFocus
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            {mode === 'edit' ? '저장' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SharedFolderModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (name: string) => void | Promise<void>
}) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = !!name.trim() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-[min(420px,calc(100vw-24px))] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-bold text-gray-800 mb-1">새 공용 폴더</h3>
        <p className="text-[12px] text-gray-400 mb-4">
          현재 파일함의 권한을 상속합니다.
        </p>
        <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">폴더 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="공용 폴더 이름을 입력하세요"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--primary-color)] mb-5"
          autoFocus
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  )
}
