import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import LogoHeader from '../../components/auth/LogoHeader'
import { useAuth } from '../../contexts/AuthContext'

type Tab = 'face' | 'email'
type FaceStatus = 'scanning' | 'failed' | 'locked' | 'no-camera'

const CAPTURE_INTERVAL = 3000
const MAX_FAIL_COUNT = 5

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

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, faceLogin, user } = useAuth()
  const hasCameraSupport = !!navigator.mediaDevices?.getUserMedia
  const [activeTab, setActiveTab] = useState<Tab>(hasCameraSupport ? 'face' : 'email')
  const [companyCode, setCompanyCode] = useState(() => localStorage.getItem('lastCompanyCode') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [faceStatus, setFaceStatus] = useState<FaceStatus>(hasCameraSupport ? 'scanning' : 'no-camera')
  const [failCount, setFailCount] = useState(0)
  const [alert, setAlert] = useState<string | null>(hasCameraSupport ? null : '카메라를 사용할 수 없습니다.')
  const [cameraReady, setCameraReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const startCamera = useCallback(async () => {
    setCameraReady(false)
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
    } catch {
      setFaceStatus('no-camera')
      setAlert('카메라를 사용할 수 없습니다.')
      setActiveTab('email')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (captureTimerRef.current) {
      clearTimeout(captureTimerRef.current)
      captureTimerRef.current = null
    }
    setCameraReady(false)
  }, [])

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    return dataUrl.split(',')[1]
  }, [])

  const attemptFaceLogin = useCallback(async () => {
    if (faceStatus !== 'scanning') return

    const base64Image = captureFrame()
    if (!base64Image) {
      captureTimerRef.current = setTimeout(attemptFaceLogin, 1000)
      return
    }

    try {
      await faceLogin(base64Image)
    } catch {
      const newCount = failCount + 1
      setFailCount(newCount)

      if (newCount >= MAX_FAIL_COUNT) {
        setFaceStatus('locked')
        setAlert('안면인식 5회 실패로 잠겼습니다.')
        setActiveTab('email')
        stopCamera()
      } else {
        setFaceStatus('failed')
        setTimeout(() => {
          setFaceStatus('scanning')
        }, 2000)
      }
    }
  }, [faceStatus, failCount, captureFrame, faceLogin, stopCamera])

  useEffect(() => {
    if (activeTab === 'face' && hasCameraSupport) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [activeTab, hasCameraSupport, startCamera, stopCamera])

  useEffect(() => {
    if (activeTab !== 'face' || faceStatus !== 'scanning') return

    captureTimerRef.current = setTimeout(attemptFaceLogin, CAPTURE_INTERVAL)

    return () => {
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current)
    }
  }, [activeTab, faceStatus, attemptFaceLogin])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyCode.trim() || !email.trim() || !password.trim()) {
      setAlert('모든 항목을 입력해주세요.')
      return
    }
    setAlert(null)
    setIsSubmitting(true)
    try {
      await login({ companyId: companyCode.trim(), email: email.trim(), password })
      localStorage.setItem('lastCompanyCode', companyCode.trim())
      navigate('/', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.message || '로그인에 실패했습니다. 정보를 확인해주세요.'
      setAlert(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTabChange = (tab: Tab) => {
    if (tab === 'face' && (faceStatus === 'locked' || faceStatus === 'no-camera')) return
    setAlert(null)
    setActiveTab(tab)
    if (tab === 'face') {
      setFaceStatus('scanning')
      setFailCount(0)
    }
  }

  const isScanning = faceStatus === 'scanning' && cameraReady
  const isFailed = faceStatus === 'failed'

  // 링 색상
  const ringColor = isFailed ? '#ef4444' : '#1D9E75'
  const ringColorFaded = isFailed ? 'rgba(239,68,68,0.3)' : 'rgba(29,158,117,0.3)'

  return (
    <AuthLayout>
      <LogoHeader subtitle="HR & ERP for growing teams" />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('face')}
          className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'face'
              ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          } ${faceStatus === 'locked' || faceStatus === 'no-camera' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          안면인식
        </button>
        <button
          onClick={() => handleTabChange('email')}
          className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          이메일 / 패스워드
        </button>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className="bg-[#fff8e1] border border-[#ffe082] rounded-lg px-4 py-3 text-sm text-[#b08c00] text-center mb-4">
          {alert}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Face Recognition Tab */}
        {activeTab === 'face' && (
          <div className="flex flex-col items-center py-6">
            {/* 카메라 + 회전 링 */}
            <div style={{ position: 'relative', width: 208, height: 208, marginBottom: 24 }}>

              {/* 회전 링 1 — 시계 방향 */}
              {(isScanning || isFailed) && (
                <div style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: ringColor,
                  borderRightColor: ringColor,
                  animation: `face-ring-spin ${isFailed ? '0.8s' : '1.5s'} linear infinite`,
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
                  borderColor: isFailed
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

            {/* 상태 텍스트 */}
            {!cameraReady && faceStatus === 'scanning' && (
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-2">
                <i className="fas fa-spinner fa-spin text-xs" />
                <span className="text-sm">카메라 연결 중<ScanningDots /></span>
              </div>
            )}

            {isScanning && (
              <>
                <div className="flex items-center gap-2 text-[#1D9E75] mb-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9E75] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1D9E75]" />
                  </span>
                  <span className="text-sm font-medium">
                    얼굴을 인식하고 있습니다<ScanningDots />
                  </span>
                </div>
                <span className="inline-block px-3 py-1 text-xs font-medium border border-[var(--primary-color)] text-[var(--primary-color)] rounded-full mb-3">
                  스캔 중
                </span>
                <p className="text-xs text-gray-600">카메라를 정면으로 바라봐 주세요</p>
              </>
            )}

            {isFailed && (
              <>
                <div className="flex items-center gap-2 text-red-500 mb-3">
                  <i className="fas fa-exclamation-circle text-sm" />
                  <span className="text-sm font-medium">인식 실패 — 자동 재시도 중<ScanningDots /></span>
                </div>
                <span className="inline-block px-3 py-1 text-xs font-medium border border-[#f59e0b] text-[#b08c00] bg-[#fffbeb] rounded-full mb-3">
                  실패 {failCount} / {MAX_FAIL_COUNT}회
                </span>
                <p className="text-xs text-gray-600">조명을 확인하고 얼굴을 정면으로 향해 주세요</p>
              </>
            )}
          </div>
        )}

        {/* Email/Password Tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              placeholder="회사 코드"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="패스워드"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold text-base hover:bg-[var(--dark-color)] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>

            <div className="flex justify-between text-sm pt-2">
              <button
                type="button"
                onClick={() => navigate('/find-email')}
                className="text-[var(--primary-color)]"
              >
                이메일 찾기
              </button>
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-[var(--primary-color)]"
              >
                비밀번호 재설정
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
