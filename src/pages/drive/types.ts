// 파일함 공통 타입 정의

export interface DriveFile {
  id: string
  name: string
  type: 'hwp' | 'word' | 'xlsx' | 'pdf' | 'image' | 'etc'
  size: number
  folderId: string
  createdAt: string
  updatedAt: string
  createdBy: string
  starred: boolean
  deleted: boolean
  permission: 'owner' | 'edit' | 'view'
  scope?: 'personal' | 'shared'
}

export interface FileBox {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  createdBy: string
  permissionTargets: PermissionTarget[]
  deleted: boolean
}

export interface DriveFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
  starred: boolean
  deleted: boolean
  permission: PermissionLevel
  permissionTargets: PermissionTarget[]
  scope?: 'personal' | 'shared'
  fileBoxId?: string
}

export type PermissionLevel = 'private' | 'team' | 'department' | 'public'

export interface PermissionTarget {
  type: 'user' | 'team' | 'department'
  id: string
  name: string
  level: 'view' | 'edit'
}

export interface ActivityItem {
  id: string
  action: 'create_folder' | 'delete_folder' | 'upload' | 'delete' | 'rename' | 'download' | 'restore' | 'permanent_delete'
  targetName: string
  location: string
  timestamp: string
  user: string
}

export type DriveView = 'home' | 'favorites' | 'my-drive' | 'shared' | 'trash' | 'recent' | 'recent-updated'

export const FILE_ACCEPT_TYPES = '.hwp,.doc,.docx,.xls,.xlsx,.pdf'

export const FILE_TYPE_ICONS: Record<DriveFile['type'], { icon: string; color: string }> = {
  hwp: { icon: 'fa-solid fa-file-lines', color: '#2196F3' },
  word: { icon: 'fa-solid fa-file-word', color: '#2B579A' },
  xlsx: { icon: 'fa-solid fa-file-excel', color: '#217346' },
  pdf: { icon: 'fa-solid fa-file-pdf', color: '#E53935' },
  image: { icon: 'fa-solid fa-file-image', color: '#FF9800' },
  etc: { icon: 'fa-solid fa-file', color: '#9E9E9E' },
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Byte'
  const k = 1024
  const sizes = ['Byte', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileType(fileName: string): DriveFile['type'] {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (ext === 'hwp') return 'hwp'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx'
  if (ext === 'pdf') return 'pdf'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image'
  return 'etc'
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
