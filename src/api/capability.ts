import api from './client'

export interface Capability {
  code: string
  description: string
  category: string
  scope: string
}

export const FILE_CAPABILITIES = {
  CREATE_DEPT_FOLDER: 'FILE_CREATE_DEPT_FOLDER',
  MANAGE_DEPT_FOLDER: 'FILE_MANAGE_DEPT_FOLDER',
  MANAGE_SUBTREE_DEPT_FOLDER: 'FILE_MANAGE_SUBTREE_DEPT_FOLDER',
  WRITE_COMPANY_FOLDER: 'FILE_WRITE_COMPANY_FOLDER',
  VIEW_OTHERS_PERSONAL: 'FILE_VIEW_OTHERS_PERSONAL',
} as const

export const capabilityApi = {
  myCapabilities: () =>
    api.get<string[]>('/collaboration-service/capability/me/capabilities'),

  listAll: () =>
    api.get<Capability[]>('/collaboration-service/capability/capabilities'),

  listByTitle: (titleId: number) =>
    api.get<string[]>(`/collaboration-service/capability/titles/${titleId}/capabilities`),

  grant: (titleId: number, code: string) =>
    api.post(`/collaboration-service/capability/titles/${titleId}/capabilities/${code}`),

  revoke: (titleId: number, code: string) =>
    api.delete<void>(`/collaboration-service/capability/titles/${titleId}/capabilities/${code}`),
}
