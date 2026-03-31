import { useState } from 'react'
import type { DriveFolder, DriveFile, PermissionLevel } from '../types'
import { FILE_TYPE_ICONS, formatBytes, formatDate } from '../types'

// ── Folder Create / Rename Modal ───────────────────────
export function FolderModal({
  mode,
  folder,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'rename'
  folder?: DriveFolder
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(folder?.name || '')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onSubmit(name.trim())
          }}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={() => name.trim() && onSubmit(name.trim())}
            disabled={!name.trim()}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            {mode === 'create' ? '만들기' : '변경'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Permission Modal ───────────────────────────────────
export function PermissionModal({
  folder,
  onClose,
  onSave,
}: {
  folder: DriveFolder
  onClose: () => void
  onSave: (folderId: string, permission: PermissionLevel) => void
}) {
  const [level, setLevel] = useState<PermissionLevel>(folder.permission)

  const options: { value: PermissionLevel; label: string; desc: string; icon: string }[] = [
    { value: 'private', label: '나만', desc: '본인만 접근 가능', icon: 'fa-solid fa-lock' },
    { value: 'team', label: '팀', desc: '같은 팀원만 접근 가능', icon: 'fa-solid fa-users' },
    { value: 'department', label: '부서', desc: '같은 부서원만 접근 가능', icon: 'fa-solid fa-building' },
    { value: 'public', label: '전체', desc: '모든 사용자 접근 가능', icon: 'fa-solid fa-globe' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[14px] font-bold text-gray-800 mb-1">폴더 권한 설정</h3>
        <p className="text-[12px] text-gray-400 mb-4">'{folder.name}' 폴더의 접근 권한을 설정합니다.</p>

        <div className="space-y-2 mb-5">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setLevel(opt.value)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                level === opt.value
                  ? 'border-[var(--primary-color)] bg-[#f0faf6]'
                  : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                level === opt.value ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <i className={`${opt.icon} text-[12px]`} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-800">{opt.label}</p>
                <p className="text-[11px] text-gray-400">{opt.desc}</p>
              </div>
              {level === opt.value && (
                <i className="fa-solid fa-check text-[var(--primary-color)] ml-auto" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={() => onSave(folder.id, level)}
            className="px-4 py-2 text-[12px] text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// ── File Preview Modal ─────────────────────────────────
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center py-16 px-8 bg-gray-50 min-h-[300px]">
          <div className="text-center">
            <i className={`${typeConfig.icon} text-6xl mb-4`} style={{ color: typeConfig.color }} />
            <p className="text-[14px] text-gray-600 font-medium">{file.name}</p>
            <p className="text-[12px] text-gray-400 mt-2">
              미리보기가 지원되지 않는 파일 형식입니다.
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              파일을 다운로드하여 확인하세요.
            </p>
          </div>
        </div>

        {/* Footer */}
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

// ── Confirm Modal ──────────────────────────────────────
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
      <div className="relative bg-white rounded-xl shadow-2xl w-[340px] p-6 text-center" onClick={(e) => e.stopPropagation()}>
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
