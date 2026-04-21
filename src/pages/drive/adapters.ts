import type { FolderResponse, FileResponse, FolderType } from '../../api/filevault'
import type { DriveFolder, DriveFile, FileBox } from './types'
import { getFileType } from './types'

export function toScope(type: FolderType): 'personal' | 'shared' {
  return type === 'PERSONAL' ? 'personal' : 'shared'
}

export function toFileBox(folder: FolderResponse): FileBox {
  return {
    id: String(folder.folderId),
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.createdAt,
    createdBy: folder.createdBy != null ? String(folder.createdBy) : '',
    deleted: false,
    isSystemDefault: folder.isSystemDefault ?? false,
  }
}

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
    starred: folder.starred ?? false,
    deleted: false,
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
    starred: file.starred ?? false,
    deleted: false,
    permission: isOwner ? 'owner' : 'view',
    scope: parentScope,
  }
}
