import api from './client'

// ── Tier 1: 시스템 전역 "파일함 Admin 권한" ──
// HR 최고권한자가 직급 또는 직책에 배타적으로 부여하는 생성 권한.

export type AdminCapabilityMode = 'GRADE' | 'TITLE'

export interface AdminCapabilityConfig {
  mode: AdminCapabilityMode
  grantedTargetIds: number[]
}

export interface AdminCapabilityUpdateRequest {
  mode: AdminCapabilityMode
  grantedTargetIds: number[]
}

export interface MyAdminCapability {
  isAdmin: boolean
}

export const adminCapabilityApi = {
  getConfig: () =>
    api.get<AdminCapabilityConfig>('/collaboration-service/filevault/admin-capability/config'),

  updateConfig: (request: AdminCapabilityUpdateRequest) =>
    api.put<AdminCapabilityConfig>('/collaboration-service/filevault/admin-capability/config', request),

  me: () =>
    api.get<MyAdminCapability>('/collaboration-service/filevault/admin-capability/me'),
}

// ── Tier 2: 파일함별 ACL ──
// Owner가 파일함 단위로 개별 사원에게 부여하는 접근 권한.

export interface FileBoxAclEntry {
  empId: number
  empName: string | null
  deptName: string | null
  gradeName: string | null
  titleName: string | null
  canRead: boolean
  canWrite: boolean
  canDownload: boolean
  canDelete: boolean
}

export interface FileBoxAcl {
  folderId: number
  folderName: string
  owner: FileBoxAclEntry | null
  members: FileBoxAclEntry[]
}

export interface FileBoxAclAddRequest {
  empId: number
  canRead?: boolean
  canWrite?: boolean
  canDownload?: boolean
  canDelete?: boolean
}

export interface FileBoxAclUpdateRequest {
  canRead: boolean
  canWrite: boolean
  canDownload: boolean
  canDelete: boolean
}

export interface MyFileBoxAcl {
  folderId: number
  isOwner: boolean
  canRead: boolean
  canWrite: boolean
  canDownload: boolean
  canDelete: boolean
}

export const fileBoxAclApi = {
  get: (folderId: number) =>
    api.get<FileBoxAcl>(`/collaboration-service/filevault/folders/${folderId}/acl`),

  me: (folderId: number) =>
    api.get<MyFileBoxAcl>(`/collaboration-service/filevault/folders/${folderId}/acl/me`),

  add: (folderId: number, request: FileBoxAclAddRequest) =>
    api.post<FileBoxAclEntry>(`/collaboration-service/filevault/folders/${folderId}/acl`, request),

  update: (folderId: number, empId: number, request: FileBoxAclUpdateRequest) =>
    api.patch<FileBoxAclEntry>(
      `/collaboration-service/filevault/folders/${folderId}/acl/${empId}`,
      request,
    ),

  remove: (folderId: number, empId: number) =>
    api.delete<void>(`/collaboration-service/filevault/folders/${folderId}/acl/${empId}`),
}
