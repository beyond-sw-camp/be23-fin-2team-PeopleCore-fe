import { Client } from '@stomp/stompjs'
import type { IMessage } from '@stomp/stompjs'
import { getAccessToken } from '../utils/token'
import { WS_BASE_URL } from '../config/env'

let stompClient: Client | null = null
let onConnectedCallback: (() => void) | null = null

export function connectStomp(onConnected?: () => void): Client {
  // 콜백 저장 (재연결 시에도 사용)
  if (onConnected) {
    onConnectedCallback = onConnected
  }

  if (stompClient?.connected) {
    onConnected?.()
    return stompClient
  }

  // 기존 클라이언트가 있으면 정리
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }

  const client = new Client({
    brokerURL: `${WS_BASE_URL}/hr-service/ws`,
    connectHeaders: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    // 재연결 전에 토큰 갱신
    beforeConnect: () => {
      const freshToken = getAccessToken()
      if (freshToken) {
        client.connectHeaders = {
          Authorization: `Bearer ${freshToken}`,
        }
      }
    },

    onConnect: () => {
      console.log('[STOMP] 연결 성공 (재연결 포함)')
      // 연결될 때마다 콜백 실행 → AuthContext에서 전역 구독 재등록
      onConnectedCallback?.()
    },
    onDisconnect: () => {
      console.log('[STOMP] 연결 해제, 자동 재연결 대기 중...')
    },
    onStompError: (frame) => {
      console.error('[STOMP] 에러:', frame.headers['message'])
    },
    onWebSocketError: () => {
      // 재연결은 reconnectDelay로 자동 처리
    },
  })

  client.activate()
  stompClient = client
  return client
}

export function getStompClient(): Client | null {
  return stompClient
}

export function disconnectStomp() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
    onConnectedCallback = null
    console.log('[STOMP] 연결 종료')
  }
}

export function subscribeTo(
  destination: string,
  callback: (message: IMessage) => void
) {
  if (!stompClient?.connected) {
    console.warn('[STOMP] 연결되지 않은 상태에서 구독 시도:', destination)
    return null
  }
  return stompClient.subscribe(destination, callback)
}

export function publishMessage(destination: string, body: object) {
  if (!stompClient?.connected) {
    console.warn('[STOMP] 연결되지 않은 상태에서 전송 시도:', destination)
    return
  }
  stompClient.publish({
    destination,
    body: JSON.stringify(body),
  })
}
