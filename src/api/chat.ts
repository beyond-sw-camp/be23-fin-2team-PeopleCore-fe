import api from './client'

export interface ParticipantInfo {
  empId: number
  empName: string
  gradeName: string | null
  deptName: string | null
  profileImageUrl: string | null
}

export interface ChatRoomResponse {
  roomId: number
  roomType: 'DM' | 'GROUP'
  roomName: string
  createdByEmpId: number
  lastMessageAt: string | null
  lastMessage: string | null
  unreadCount: number
  muted: boolean
  participants: ParticipantInfo[]
}

export interface ChatMessageResponse {
  msgId: number
  roomId: number
  senderId: number
  senderName: string
  senderProfileImageUrl: string | null
  content: string | null
  msgType: 'TEXT' | 'FILE' | 'IMAGE'
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  createdAt: string
}

export interface ChatRoomCreateRequest {
  roomType: 'DM' | 'GROUP'
  roomName?: string
  memberEmpIds: number[]
}

export const chatApi = {
  getMyRooms: () =>
    api.get<ChatRoomResponse[]>('/hr-service/chat/rooms'),

  createRoom: (data: ChatRoomCreateRequest) =>
    api.post<ChatRoomResponse>('/hr-service/chat/rooms', data),

  findDmRoom: (targetEmpId: number) =>
    api.get<ChatRoomResponse>(`/hr-service/chat/rooms/dm?targetEmpId=${targetEmpId}`),

  getMessages: (roomId: number, before?: number, size = 50) => {
    const params = new URLSearchParams({ size: String(size) })
    if (before) params.append('before', String(before))
    return api.get<ChatMessageResponse[]>(`/hr-service/chat/rooms/${roomId}/messages?${params}`)
  },

  markAsRead: (roomId: number) =>
    api.put(`/hr-service/chat/rooms/${roomId}/read`),

  inviteMembers: (roomId: number, memberEmpIds: number[]) =>
    api.post<ChatRoomResponse>(`/hr-service/chat/rooms/${roomId}/invite`, { memberEmpIds }),

  searchMessages: (roomId: number, keyword: string, size = 30) =>
    api.get<ChatMessageResponse[]>(`/hr-service/chat/rooms/${roomId}/messages/search`, { params: { keyword, size } }),

  deleteMessage: (msgId: number) =>
    api.delete(`/hr-service/chat/rooms/messages/${msgId}`),

  toggleMute: (roomId: number) =>
    api.put<{ muted: boolean }>(`/hr-service/chat/rooms/${roomId}/mute`),

  renameRoom: (roomId: number, roomName: string) =>
    api.put(`/hr-service/chat/rooms/${roomId}/rename`, { roomName }),

  leaveRoom: (roomId: number) =>
    api.delete(`/hr-service/chat/rooms/${roomId}/leave`),

  uploadFile: (roomId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ fileUrl: string; fileName: string; fileSize: number; msgType: string }>(
      `/hr-service/chat/rooms/${roomId}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  getTotalUnread: () =>
    api.get<number>('/hr-service/chat/rooms/unread/total'),
}
