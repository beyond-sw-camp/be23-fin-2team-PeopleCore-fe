import axios from 'axios'
import api from './client'

export type FolderType = 'PERSONAL' | 'COMPANY' | 'DEPT'

export interface FolderResponse {
  folderId: number
  name: string
  type: FolderType
  parentFolderId: number | null
  isSystemDefault: boolean
  createdAt: string
  deletedAt?: string | null
}

export interface FileResponse {
  fileId: number
  folderId: number
  name: string
  mimeType: string
  sizeBytes: number
  uploadedBy: number
  createdAt: string
  deletedAt?: string | null
}

export interface TrashResponse {
  folders: FolderResponse[]
  files: FileResponse[]
}

export interface FolderCreateRequest {
  name: string
  type: FolderType
  parentFolderId?: number | null
  deptId?: number | null
}

export interface UploadUrlRequest {
  folderId: number
  fileName: string
  mimeType: string
  sizeBytes: number
}

export interface UploadUrlResponse {
  uploadUrl: string
  storageKey: string
}

export interface FileUploadConfirmRequest {
  folderId: number
  name: string
  mimeType: string
  sizeBytes: number
  storageKey: string
}

export const folderApi = {
  listRoot: (type: FolderType) =>
    api.get<FolderResponse[]>('/collaboration-service/filevault/folders', { params: { type } }),

  ensurePersonal: () =>
    api.post<FolderResponse>('/collaboration-service/filevault/folders/ensure-personal'),

  get: (folderId: number) =>
    api.get<FolderResponse>(`/collaboration-service/filevault/folders/${folderId}`),

  listChildren: (folderId: number) =>
    api.get<FolderResponse[]>(`/collaboration-service/filevault/folders/${folderId}/children`),

  create: (request: FolderCreateRequest) =>
    api.post<FolderResponse>('/collaboration-service/filevault/folders', request),

  rename: (folderId: number, name: string) =>
    api.patch<FolderResponse>(`/collaboration-service/filevault/folders/${folderId}/rename`, { name }),

  move: (folderId: number, parentFolderId: number | null) =>
    api.patch<FolderResponse>(`/collaboration-service/filevault/folders/${folderId}/move`, { parentFolderId }),

  softDelete: (folderId: number) =>
    api.delete<void>(`/collaboration-service/filevault/folders/${folderId}`),

  restore: (folderId: number) =>
    api.post<void>(`/collaboration-service/filevault/folders/${folderId}/restore`),

  permanentDelete: (folderId: number) =>
    api.delete<void>(`/collaboration-service/filevault/folders/${folderId}/permanent`),
}

export const trashApi = {
  list: () =>
    api.get<TrashResponse>('/collaboration-service/filevault/trash'),

  empty: () =>
    api.delete<void>('/collaboration-service/filevault/trash'),
}

export const fileApi = {
  listByFolder: (folderId: number) =>
    api.get<FileResponse[]>('/collaboration-service/filevault/files', { params: { folderId } }),

  generateUploadUrl: (request: UploadUrlRequest) =>
    api.post<UploadUrlResponse>('/collaboration-service/filevault/files/upload-url', request),

  confirmUpload: (request: FileUploadConfirmRequest) =>
    api.post<FileResponse>('/collaboration-service/filevault/files', request),

  generateDownloadUrl: (fileId: number) =>
    api.get<{ downloadUrl: string }>(`/collaboration-service/filevault/files/${fileId}/download-url`),

  rename: (fileId: number, name: string) =>
    api.patch<FileResponse>(`/collaboration-service/filevault/files/${fileId}/rename`, { name }),

  move: (fileId: number, folderId: number) =>
    api.patch<FileResponse>(`/collaboration-service/filevault/files/${fileId}/move`, { folderId }),

  softDelete: (fileId: number) =>
    api.delete<void>(`/collaboration-service/filevault/files/${fileId}`),

  restore: (fileId: number) =>
    api.post<void>(`/collaboration-service/filevault/files/${fileId}/restore`),

  permanentDelete: (fileId: number) =>
    api.delete<void>(`/collaboration-service/filevault/files/${fileId}/permanent`),
}

/**
 * Presigned URL로 MinIO에 직접 PUT 업로드.
 * 진행률 콜백을 통해 업로드 큐 UI에 연결 가능.
 */
export const uploadToMinio = (
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
) =>
  axios.put(presignedUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })

/**
 * 전체 업로드 플로우 (upload-url → MinIO PUT → confirm)
 */
export async function uploadFile(
  folderId: number,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<FileResponse> {
  const { data: urlRes } = await fileApi.generateUploadUrl({
    folderId,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  })

  await uploadToMinio(urlRes.uploadUrl, file, onProgress)

  const { data: fileRes } = await fileApi.confirmUpload({
    folderId,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    storageKey: urlRes.storageKey,
  })

  return fileRes
}
