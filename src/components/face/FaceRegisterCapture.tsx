import { useState, useRef, useCallback, useEffect } from 'react'
import { authApi } from '../../api/auth'

interface FaceRegisterCaptureProps {
  empId: number
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

type Status = 'idle' | 'camera' | 'capturing'

function ScanningDots() {
  return (
    <span style={{ display: 'inline-flex', width: '1.2em', justifyContent: 'flex-start', marginLeft: 1 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            animation: 'face-dot-bounce 1.4s infinite',
            animationDelay: `${i * 0.2}s`,
            opacity: 0,
            fontWeight: 'bold',
          }}
        >.</span>
      ))}
    </span>
  )
}

export default function FaceRegisterCapture({ empId, onSuccess, onError }: FaceRegisterCaptureProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (status !== 'camera' || streamRef.current) return

    setCameraReady(false)
    const connect = async () => {
      try {
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
          })
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setCameraReady(true)
          await videoRef.current.play().catch(() => {})
        }
      } catch (err: any) {
        console.error('카메라 에러:', err.name, err.message)
        setStatus('idle')
        if (err.name === 'NotAllowedError') {
          onError?.('카메라 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.')
        } else if (err.name === 'NotFoundError') {
          onError?.('카메라 장치를 찾을 수 없습니다.')
        } else if (err.name === 'NotReadableError') {
          onError?.('카메라가 다른 프로그램에서 사용 중입니다.')
        } else {
          onError?.(`카메라를 사용할 수 없습니다. (${err.name})`)
        }
      }
    }

    connect()
  }, [status, onError])

  const startCamera = useCallback(() => {
    setCameraError('')
    setCameraReady(false)
    setStatus('camera')
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const captureAndRegister = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      setCameraError('카메라가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    setStatus('capturing')
    setCameraError('')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const base64Image = dataUrl.split(',')[1]

    try {
      const { data } = await authApi.faceRegister({ image: base64Image, empId })
      stopCamera()
      setStatus('idle')
      onSuccess?.(data.message || '얼굴 등록이 완료되었습니다.')
    } catch (err: any) {
      setStatus('camera')
      const detail = err.response?.data?.detail || err.response?.data?.message || '얼굴 등록에 실패했습니다.'
      setCameraError(detail)
    }
  }, [empId, stopCamera, onSuccess])

  const handleClose = useCallback(() => {
    stopCamera()
    setStatus('idle')
    setCameraError('')
  }, [stopCamera])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const isScanning = status === 'camera' && cameraReady && !cameraError
  const isCapturing = status === 'capturing'

  const ringColor = isCapturing ? '#f59e0b' : '#1D9E75'
  const ringColorFaded = isCapturing ? 'rgba(245,158,11,0.3)' : 'rgba(29,158,117,0.3)'
  const showRing = isScanning || isCapturing

  return (
    <div className="flex flex-col gap-3">
      <canvas ref={canvasRef} className="hidden" />

      {status === 'idle' && (
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
        >
          <i className="fas fa-camera text-xs" />
          안면인식 등록
        </button>
      )}

      {(status === 'camera' || status === 'capturing') && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          {/* 카메라 + 회전 링 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ position: 'relative', width: 208, height: 208 }}>

              {/* 회전 링 1 — 시계 방향 */}
              {showRing && (
                <div style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: ringColor,
                  borderRightColor: ringColor,
                  animation: `face-ring-spin ${isCapturing ? '0.8s' : '1.5s'} linear infinite`,
                  pointerEvents: 'none' as const,
                }} />
              )}

              {/* 회전 링 2 — 반시계 방향 */}
              {isScanning && (
                <div style={{
                  position: 'absolute',
                  inset: -10,
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderBottomColor: ringColorFaded,
                  borderLeftColor: ringColorFaded,
                  animation: 'face-ring-spin 2.5s linear infinite reverse',
                  pointerEvents: 'none' as const,
                }} />
              )}

              {/* 카메라 원 */}
              <div
                style={{
                  width: 192,
                  height: 192,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: 8,
                  borderWidth: 4,
                  borderStyle: 'solid',
                  transition: 'border-color 0.3s',
                  borderColor: isCapturing
                    ? '#f59e0b'
                    : cameraError
                      ? '#f87171'
                      : isScanning
                        ? '#1D9E75'
                        : '#d1d5db',
                  animation: isScanning ? 'face-glow-breathe 2s ease-in-out infinite' : 'none',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
              </div>
            </div>
          </div>

          {/* 상태 텍스트 */}
          <div className="text-center mb-3">
            {!cameraReady && !cameraError && (
              <div className="flex items-center justify-center gap-1 text-gray-400">
                <i className="fas fa-spinner fa-spin text-xs" />
                <span className="text-xs">카메라 연결 중<ScanningDots /></span>
              </div>
            )}
            {isScanning && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2 text-[#1D9E75]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9E75] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1D9E75]" />
                  </span>
                  <span className="text-xs font-medium">
                    스캔 중<ScanningDots />
                  </span>
                </div>
                <span className="text-[11px] text-gray-600">얼굴을 원 안에 맞추고 정면을 바라봐 주세요</span>
              </div>
            )}
            {isCapturing && (
              <div className="flex items-center justify-center gap-1 text-[#f59e0b]">
                <i className="fas fa-spinner fa-spin text-xs" />
                <span className="text-xs font-medium">
                  얼굴 인식 및 등록 중<ScanningDots />
                </span>
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {cameraError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg mb-3">
              <i className="fas fa-exclamation-triangle text-red-400 text-xs shrink-0" />
              <span className="text-xs text-red-500">{cameraError}</span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={captureAndRegister}
              disabled={isCapturing || !cameraReady}
              className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors disabled:opacity-60"
            >
              <i className={`fas ${isCapturing ? 'fa-spinner fa-spin' : 'fa-camera'} text-xs`} />
              {isCapturing ? '등록 중...' : '촬영 및 등록'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:border-red-300 hover:text-red-500 transition-all"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
