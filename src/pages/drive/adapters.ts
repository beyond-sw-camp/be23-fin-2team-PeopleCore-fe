import type { FolderResponse, FileResponse, FolderType } from '../../api/filevault'
import type { DriveFolder, DriveFile, FileBox, PermissionLevel } from './types'
import { getFileType } from './types'

/**
 * BE FolderType → FE PermissionLevel 매핑 (표시용).
 * 실제 권한 제어는 BE capability에서 수행.
 */
export function toPermissionLevel(type: FolderType): PermissionLevel {
  switch (type) {
    case 'PERSONAL': return 'private'
    case 'COMPANY':  return 'public'
    case 'DEPT':     return 'department'
  }
}

/**
 * BE FolderType → FE scope 매핑.
 */
export function toScope(type: FolderType): 'personal' | 'shared' {
  return type === 'PERSONAL' ? 'personal' : 'shared'
}

/**
 * 루트 파일함(parentFolderId=null, type=COMPANY/DEPT) → FE FileBox.
 * 개인 파일함은 별도로 "내 파일"로 다뤄서 FileBox로 변환하지 않음.
 */
export function toFileBox(folder: FolderResponse): FileBox {
  return {
    id: String(folder.folderId),
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.createdAt,
    createdBy: '',
    permissionTargets: [],
    deleted: false,
  }
}

/**
 * 하위 폴더(parentFolderId != null) → FE DriveFolder.
 * 루트 파일함 자신은 DriveFolder가 아니라 FileBox로 취급하므로 제외.
 *
 * @param parentScope 최상위 파일함의 scope (해당 폴더가 어떤 파일함에 속해있는지 결정)
 * @param fileBoxId 이 폴더가 속한 루트 파일함 id (shared인 경우에만)
 */
export function toDriveFolder(
  folder: FolderResponse,
  parentScope: 'personal' | 'shared',
  fileBoxId?: string,
): DriveFolder {
  return {
    id: String(folder.folderId),
    name: folder.name,
    parentId: folder.parentFolderId !== null ? String(folder.parentFolderId) : null,
    createdAt: folder.createdAt,
    updatedAt: folder.createdAt,
    createdBy: '',
    starred: false,
    deleted: false,
    permission: parentScope === 'personal' ? 'private' : 'team',
    permissionTargets: [],
    scope: parentScope,
    fileBoxId,
  }
}

/**
 * BE FileItem → FE DriveFile.
 * @param parentScope 파일이 속한 폴더의 scope
 * @param currentUserEmpId 현재 로그인 유저 empId (소유자 판단용)
 */
export function toDriveFile(
  file: FileResponse,
  parentScope: 'personal' | 'shared',
  currentUserEmpId?: number,
): DriveFile {
  const isOwner = currentUserEmpId !== undefined && file.uploadedBy === currentUserEmpId
  return {
    id: String(file.fileId),
    name: file.name,
    type: getFileType(file.name),
    size: file.sizeBytes,
    folderId: String(file.folderId),
    createdAt: file.createdAt,
    updatedAt: file.createdAt,
    createdBy: String(file.uploadedBy),
    starred: false,
    deleted: false,
    permission: isOwner ? 'owner' : 'view',
    scope: parentScope,
  }
}
