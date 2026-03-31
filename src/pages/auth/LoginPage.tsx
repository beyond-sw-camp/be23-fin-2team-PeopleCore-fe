import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import LogoHeader from '../../components/auth/LogoHeader'

type Tab = 'face' | 'email'
type FaceStatus = 'scanning' | 'failed' | 'locked' | 'no-camera'

export default function LoginPage() {
  const navigate = useNavigate()
  const hasCameraSupport = !!navigator.mediaDevices?.getUserMedia
  const [activeTab, setActiveTab] = useState<Tab>(hasCameraSupport ? 'face' : 'email')
  const [companyCode, setCompanyCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [faceStatus, setFaceStatus] = useState<FaceStatus>(hasCameraSupport ? 'scanning' : 'no-camera')
  const [failCount, setFailCount] = useState(0)
  const [alert, setAlert] = useState<string | null>(hasCameraSupport ? null : '카메라를 사용할 수 없습니다.')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Face recognition simulation
  useEffect(() => {
    if (activeTab !== 'face' || !hasCameraSupport) return

    if (faceStatus === 'scanning') {
      timerRef.current = setTimeout(() => {
        const newCount = failCount + 1
        setFailCount(newCount)
        if (newCount >= 5) {
          setFaceStatus('locked')
          setAlert('안면인식 5회 실패로 잠겼습니다.')
          setActiveTab('email')
        } else {
          setFaceStatus('failed')
          // Auto-retry after 2 seconds
          setTimeout(() => setFaceStatus('scanning'), 2000)
        }
      }, 9000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [activeTab, faceStatus, failCount])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API call
    console.log('Login:', email, password)
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

      {/* Tab Content - fixed height to prevent layout shift */}
      <div className="min-h-[300px]">
      {/* Face Recognition Tab */}
      {activeTab === 'face' && (
        <div className="flex flex-col items-center py-6">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all ${
              faceStatus === 'failed'
                ? 'border-4 border-red-300 bg-red-50'
                : 'border-4 border-[var(--light-color)] bg-[#f0faf6]'
            } ${faceStatus === 'scanning' ? 'scan-circle' : ''}`}
            style={
              faceStatus === 'failed'
                ? { boxShadow: '0 0 0 16px rgba(239,68,68,0.1)' }
                : faceStatus !== 'scanning' ? { boxShadow: '0 0 0 16px rgba(159,225,203,0.3)' } : undefined
            }
          >
            <i
              className={`fa-solid fa-camera text-3xl ${
                faceStatus === 'failed' ? 'text-red-400' : 'text-[var(--primary-color)]'
              }`}
            ></i>
          </div>

          {faceStatus === 'scanning' && (
            <>
              <p className="text-sm text-gray-700 mb-4">
                얼굴을 인식하고 있습니다
                <span className="scanning-dots"><span>.</span><span>.</span><span>.</span></span>
              </p>
              <span className="inline-block px-3 py-1 text-xs font-medium border border-[var(--primary-color)] text-[var(--primary-color)] rounded-full">
                스캔 중
              </span>
              <p className="text-xs text-gray-400 mt-4">카메라를 바라봐 주세요</p>
            </>
          )}

          {faceStatus === 'failed' && (
            <>
              <p className="text-sm text-gray-700 mb-4">인식 실패 &mdash; 자동 재시도 중...</p>
              <span className="inline-block px-3 py-1 text-xs font-medium border border-[#f59e0b] text-[#b08c00] bg-[#fffbeb] rounded-full">
                실패 {failCount} / 5회
              </span>
              <p className="text-xs text-gray-400 mt-4">조명을 확인하고 얼굴을 정면으로 향해 주세요</p>
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
            className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold text-base hover:bg-[var(--dark-color)] transition-colors"
          >
            로그인
          </button>

          <div className="flex justify-between text-sm pt-2">
            <button
              type="button"
              onClick={() => navigate('/find-email')}
              className="text-[var(--primary-color)] "
            >
              이메일 찾기
            </button>
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="text-[var(--primary-color)] "
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
