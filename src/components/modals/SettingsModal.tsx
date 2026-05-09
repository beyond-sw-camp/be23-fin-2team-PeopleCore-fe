import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { hrAdminPinApi } from '../../api/hrAdminPin'
import { useHrAdminSession } from '../../contexts/HrAdminSessionContext'
import { mySalaryApi, type MySalaryInfoRes } from '../../api/mypay'
import { EMP_TYPE_LABEL, type EmpType } from '../../api/employee/types'
import { updateMyProfileImage, deleteMyProfileImage } from '../../api/employee/employeeApi'
import { authApi, simplePasswordApi, loginHistoryApi, type LoginHistoryItem, type SimplePasswordStatus } from '../../api/auth'
import { notificationSettingsApi } from '../../api/notificationSettings'
import { extractErrorMessage } from '../../api/http'
import { resolveProfileImageUrl } from '../../utils/profileImage'

type SettingsTab = 'info' | 'security' | 'notification'
type InfoSubView = 'list' | 'profile'
// 간편 비밀번호는 현재 실제 인증에 사용되는 곳이 없어 메뉴에서 숨김 — API/뷰는 살려둠 (재노출 시 'simplePassword' 다시 추가)
type SecuritySubView = 'list' | 'password' | 'loginHistory' | 'hrAdminPin'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// ── 내 프로필 관리 ──
function ProfileView({ onBack }: { onBack: () => void }) {
  const { user, setProfileImageUrl } = useAuth()
  const [info, setInfo] = useState<MySalaryInfoRes | null>(null)
  const [uploading, setUploading] = useState(false)
  const [emailEditOpen, setEmailEditOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => {
    mySalaryApi.getInfo().then(setInfo).catch(() => { /* ignore */ })
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleDeleteImage = async () => {
    if (!info?.profileImageUrl) return
    if (!confirm('프로필 이미지를 삭제하시겠습니까?')) return
    setUploading(true)
    try {
      await deleteMyProfileImage()
      setInfo((prev) => prev ? { ...prev, profileImageUrl: null } : prev)
      setProfileImageUrl(null)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? '삭제에 실패했습니다.'
      alert(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.')
      return
    }
    setUploading(true)
    try {
      const { profileImageUrl } = await updateMyProfileImage(file)
      setInfo((prev) => prev ? { ...prev, profileImageUrl } : prev)
      setProfileImageUrl(profileImageUrl)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? '업로드에 실패했습니다.'
      alert(msg)
    } finally {
      setUploading(false)
    }
  }

  const displayName = info?.empName ?? user?.empName ?? '-'
  const initials = displayName !== '-' ? displayName.slice(0, 2) : ''
  const profileSrc = resolveProfileImageUrl(info?.profileImageUrl)
  const empTypeLabel = info?.empType ? (EMP_TYPE_LABEL[info.empType as EmpType] ?? info.empType) : '-'

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-4">
        <i className="fas fa-arrow-left text-xs" /> 내 프로필 관리
      </button>

      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-2">
          {profileSrc ? (
            <img src={profileSrc} alt="프로필" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 bg-[#9FE1CB] rounded-full flex items-center justify-center text-[#1D9E75] font-bold text-2xl">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'} text-[10px] text-gray-500`} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
        <p className="text-sm font-bold text-gray-800">{displayName}</p>
        {info?.profileImageUrl && (
          <button
            onClick={handleDeleteImage}
            disabled={uploading}
            className="mt-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-trash-alt text-[10px] mr-1" />
            이미지 제거
          </button>
        )}
      </div>

      <div className="space-y-4 text-xs">
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">사원번호</span>
          <span className="text-gray-800">{info?.empNum ?? '-'}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">부서</span>
          <span className="text-gray-800">{info?.deptName ?? '-'}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">직급</span>
          <span className="text-gray-800">{info?.gradeName ?? '-'}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">직책</span>
          <span className="text-gray-800">{info?.titleName ?? '-'}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">직원구분</span>
          <span className="text-gray-800">{empTypeLabel}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">입사일</span>
          <span className="text-gray-800">{info?.empHireDate ?? '-'}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">회사 메일</span>
          <span className="text-gray-800">{info?.empEmail ?? '-'}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">연락처</span>
          <span className="text-gray-800">{info?.empPhone ?? '-'}</span>
        </div>
        <div className="border-b border-gray-100 py-2.5">
          <div className="flex items-center">
            <span className="text-gray-500 w-20 shrink-0">외부 메일</span>
            <span className="text-gray-800 flex-1">{info?.empPersonalEmail || '-'}</span>
            <button
              onClick={() => setEmailEditOpen(v => !v)}
              className="text-[11px] text-[#1D9E75] hover:underline shrink-0"
            >
              {emailEditOpen ? '취소' : '변경'}
            </button>
          </div>
          {emailEditOpen && (
            <PersonalEmailChangeForm
              currentEmail={info?.empPersonalEmail ?? ''}
              onSuccess={() => {
                setEmailEditOpen(false)
                reload()
              }}
            />
          )}
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">권한</span>
          <span className="text-gray-800">{user?.empRole === 'HR_SUPER_ADMIN' ? '최고관리자' : user?.empRole === 'HR_ADMIN' ? '인사관리자' : '일반사원'}</span>
        </div>
      </div>
    </div>
  )
}

// ── 외부 메일 변경 폼 (이메일 입력 → 코드 발송 → 코드 검증 + 저장) ──
function PersonalEmailChangeForm({ currentEmail, onSuccess }: { currentEmail: string; onSuccess: () => void }) {
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleSendCode = async () => {
    setMsg(null)
    const trimmed = newEmail.trim()
    if (!trimmed) { setMsg({ type: 'error', text: '새 이메일 주소를 입력해주세요' }); return }
    if (trimmed.toLowerCase() === currentEmail.trim().toLowerCase()) {
      setMsg({ type: 'error', text: '현재 등록된 이메일과 동일합니다. 다른 이메일을 입력해주세요.' })
      return
    }
    setSubmitting(true)
    try {
      await authApi.sendPersonalEmailChangeCode(trimmed)
      setMsg({ type: 'success', text: '인증 코드를 발송했습니다. 새 이메일함을 확인해주세요.' })
      setStep('verify')
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '인증 코드 발송에 실패했습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async () => {
    setMsg(null)
    if (!code.trim()) { setMsg({ type: 'error', text: '인증 코드를 입력해주세요' }); return }
    setSubmitting(true)
    try {
      await authApi.verifyAndUpdatePersonalEmail(newEmail.trim(), code.trim())
      setMsg({ type: 'success', text: '외부 메일이 변경되었습니다.' })
      setTimeout(onSuccess, 600)
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '인증에 실패했습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          placeholder="새 외부 이메일"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          disabled={step === 'verify'}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e] disabled:bg-gray-50"
        />
        <button
          onClick={handleSendCode}
          disabled={submitting || !newEmail.trim()}
          className="px-3 py-2 text-xs text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 shrink-0"
        >
          {step === 'input' ? '코드 발송' : '재발송'}
        </button>
      </div>

      {step === 'verify' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="이메일로 받은 코드"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
          />
          <button
            onClick={handleVerify}
            disabled={submitting}
            className="px-3 py-2 text-xs text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-50 shrink-0"
          >
            확인 및 저장
          </button>
        </div>
      )}

      {msg && (
        <p className={`text-[11px] ${msg.type === 'error' ? 'text-red-500' : 'text-[#1D9E75]'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}

// ── 내 정보 관리 ──
function InfoTab() {
  const [subView, setSubView] = useState<InfoSubView>('list')

  if (subView === 'profile') return <ProfileView onBack={() => setSubView('list')} />

  return (
    <div className="space-y-1">
      <button
        onClick={() => setSubView('profile')}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-gray-800">내 프로필 관리</p>
          <p className="text-xs text-gray-400 mt-0.5">사용자의 프로필을 관리합니다.</p>
        </div>
        <i className="fas fa-chevron-right text-xs text-gray-400" />
      </button>
    </div>
  )
}

// 8~16자, 영문/숫자/특수문자 중 2종 이상 조합
function isPasswordPolicyOk(pw: string): boolean {
  if (pw.length < 8 || pw.length > 16) return false
  let kinds = 0
  if (/[A-Za-z]/.test(pw)) kinds++
  if (/\d/.test(pw)) kinds++
  if (/[^A-Za-z0-9]/.test(pw)) kinds++
  return kinds >= 2
}

// ── 비밀번호 변경 (이메일 인증 후 새 비밀번호 설정) ──
function PasswordChangeView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  // AuthContext의 empPersonalEmail은 로그인 직후 1회만 보강되므로, 외부메일 변경 직후엔 stale일 수 있다.
  // 비밀번호 변경은 이메일 인증이 핵심이라 항상 최신값을 직접 fetch한다 (ProfileView와 동일 패턴).
  const [empPersonalEmail, setEmpPersonalEmail] = useState<string>(user?.empPersonalEmail ?? '')
  const [emailLoading, setEmailLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    mySalaryApi.getInfo()
      .then((info) => { if (!cancelled) setEmpPersonalEmail(info.empPersonalEmail ?? '') })
      .catch(() => { /* AuthContext 폴백값 유지 */ })
      .finally(() => { if (!cancelled) setEmailLoading(false) })
    return () => { cancelled = true }
  }, [])

  const [step, setStep] = useState<'send' | 'verify' | 'reset'>('send')
  const [code, setCode] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleSendCode = async () => {
    if (!empPersonalEmail) { setMsg({ type: 'error', text: '개인 이메일이 등록되어 있지 않습니다. 인사담당자에게 문의해주세요.' }); return }
    setMsg(null)
    setSubmitting(true)
    try {
      await authApi.sendPasswordResetEmail(empPersonalEmail)
      setMsg({ type: 'success', text: '인증 코드를 이메일로 발송했습니다. 메일함을 확인해주세요.' })
      setStep('verify')
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '인증 코드 발송에 실패했습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    setMsg(null)
    if (!code.trim()) { setMsg({ type: 'error', text: '인증 코드를 입력해주세요' }); return }
    setSubmitting(true)
    try {
      await authApi.verifyPasswordResetEmail(empPersonalEmail, code.trim())
      setMsg({ type: 'success', text: '인증되었습니다. 새 비밀번호를 입력해주세요.' })
      setStep('reset')
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '인증 코드가 올바르지 않습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    setMsg(null)
    if (!isPasswordPolicyOk(newPw)) {
      setMsg({ type: 'error', text: '새 비밀번호는 8~16자 영문/숫자/특수문자 중 2종 이상 조합이어야 합니다' })
      return
    }
    if (newPw !== confirmPw) { setMsg({ type: 'error', text: '새 비밀번호 확인이 일치하지 않습니다' }); return }
    setSubmitting(true)
    try {
      await authApi.resetPasswordByEmail(empPersonalEmail, newPw)
      setMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' })
      // 폼 초기화
      setCode(''); setNewPw(''); setConfirmPw('')
      setStep('send')
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '비밀번호 변경에 실패했습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-5">
        <i className="fas fa-arrow-left text-xs" /> 비밀번호 변경
      </button>

      <p className="text-[11px] text-gray-500 mb-4">
        본인 확인을 위해 개인 이메일로 인증 코드를 발송합니다.
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-600 w-24 shrink-0 text-right">개인 이메일</label>
          <input
            type="email"
            value={empPersonalEmail}
            placeholder={emailLoading ? '불러오는 중…' : '등록된 개인 이메일이 없습니다'}
            disabled
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700"
          />
          <button
            onClick={handleSendCode}
            disabled={submitting || emailLoading || !empPersonalEmail}
            className="px-3 py-2 text-xs text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 shrink-0"
          >
            {step === 'send' ? '코드 발송' : '재발송'}
          </button>
        </div>

        {step !== 'send' && (
          <div className="flex items-center gap-4">
            <label className="text-xs text-gray-600 w-24 shrink-0 text-right">인증 코드</label>
            <input
              type="text"
              placeholder="이메일로 받은 코드"
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={step === 'reset'}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e] disabled:bg-gray-50"
            />
            {step === 'verify' && (
              <button
                onClick={handleVerifyCode}
                disabled={submitting}
                className="px-3 py-2 text-xs text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-50 shrink-0"
              >
                확인
              </button>
            )}
            {step === 'reset' && (
              <span className="text-[11px] text-[#1D9E75] shrink-0 px-2">
                <i className="fa-solid fa-circle-check mr-1" /> 인증 완료
              </span>
            )}
          </div>
        )}

        {step === 'reset' && (
          <>
            <div className="flex items-center gap-4">
              <label className="text-xs text-gray-600 w-24 shrink-0 text-right">새 비밀번호</label>
              <input
                type="password"
                placeholder="새 비밀번호"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs text-gray-600 w-24 shrink-0 text-right">새 비밀번호 확인</label>
              <input
                type="password"
                placeholder="한번 더 입력"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-5 bg-[#fffde7] rounded-lg p-3 text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-700"><i className="fas fa-info-circle text-yellow-500 mr-1" /> 비밀번호 설정 방법</p>
        <p>- 8~16자의 영문자, 숫자, 특수문자 중 2종 이상 조합으로 사용하세요.</p>
        <p>- 연속한 문자와 숫자, 동일 문자 반복, 키보드 순차 배열 구성을 피해주세요.</p>
        <p>- 이전 비밀번호의 재사용을 피해주세요.</p>
      </div>

      {msg && (
        <p className={`mt-4 text-xs text-center ${msg.type === 'error' ? 'text-red-500' : 'text-[#1D9E75]'}`}>
          <i className={`fa-solid ${msg.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'} text-[10px] mr-1`} />
          {msg.text}
        </p>
      )}

      {step === 'reset' && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleReset}
            disabled={submitting}
            className="px-8 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── 간편 비밀번호 관리 (HR PIN과 동일 패턴) ──
// 현재 SecurityTab 진입 버튼은 숨김 상태(위 SecurityTab 주석 참고). 추후 재노출 대비로 보존.
export function SimplePwView({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<SimplePasswordStatus | null>(null)
  const [mode, setMode] = useState<'list' | 'set' | 'change' | 'remove'>('list')
  const [loginPw, setLoginPw] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const onlyDigits = (val: string) => val.replace(/\D/g, '').slice(0, 4)

  const reload = () => {
    simplePasswordApi.status()
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus({ hasPin: false, updatedAt: null }))
  }
  useEffect(() => { reload() }, [])

  const reset = () => {
    setLoginPw(''); setCurrentPin(''); setNewPin(''); setConfirmPin(''); setMsg(null)
  }

  const onSet = async () => {
    setMsg(null)
    if (!loginPw) { setMsg({ type: 'error', text: '로그인 비밀번호를 입력해주세요' }); return }
    if (!/^\d{4}$/.test(newPin)) { setMsg({ type: 'error', text: '간편 비밀번호는 4자리 숫자여야 합니다' }); return }
    if (newPin !== confirmPin) { setMsg({ type: 'error', text: '간편 비밀번호 확인이 일치하지 않습니다' }); return }
    setSubmitting(true)
    try {
      await simplePasswordApi.set(loginPw, newPin)
      setMsg({ type: 'success', text: '간편 비밀번호가 설정되었습니다' })
      reset(); setMode('list'); reload()
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '설정에 실패했습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  const onChange = async () => {
    setMsg(null)
    if (!/^\d{4}$/.test(currentPin)) { setMsg({ type: 'error', text: '현재 간편 비밀번호를 입력해주세요' }); return }
    if (!/^\d{4}$/.test(newPin)) { setMsg({ type: 'error', text: '새 간편 비밀번호는 4자리 숫자여야 합니다' }); return }
    if (newPin !== confirmPin) { setMsg({ type: 'error', text: '간편 비밀번호 확인이 일치하지 않습니다' }); return }
    setSubmitting(true)
    try {
      await simplePasswordApi.change(currentPin, newPin)
      setMsg({ type: 'success', text: '간편 비밀번호가 변경되었습니다' })
      reset(); setMode('list'); reload()
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '변경에 실패했습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  const onRemove = async () => {
    setMsg(null)
    if (!loginPw) { setMsg({ type: 'error', text: '로그인 비밀번호를 입력해주세요' }); return }
    setSubmitting(true)
    try {
      await simplePasswordApi.remove(loginPw)
      setMsg({ type: 'success', text: '간편 비밀번호가 해제되었습니다' })
      reset(); setMode('list'); reload()
    } catch (err) {
      setMsg({ type: 'error', text: extractErrorMessage(err, '해제에 실패했습니다') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button onClick={() => { reset(); setMode('list'); onBack() }} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-5">
        <i className="fas fa-arrow-left text-xs" /> 간편 비밀번호 관리
      </button>

      {status === null ? (
        <p className="text-xs text-gray-400">확인 중…</p>
      ) : (
        <>
          {mode === 'list' && (
            <div className="space-y-2">
              <div className="border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 flex items-center justify-between">
                <span>설정 상태</span>
                <span className={status.hasPin ? 'text-[#1D9E75] font-medium' : 'text-gray-400'}>
                  {status.hasPin ? '설정됨' : '미설정'}
                </span>
              </div>
              {!status.hasPin ? (
                <button
                  onClick={() => { reset(); setMode('set') }}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs text-gray-700">간편 비밀번호 설정</span>
                  <i className="fas fa-chevron-right text-xs text-gray-400" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { reset(); setMode('change') }}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs text-gray-700">간편 비밀번호 변경</span>
                    <i className="fas fa-chevron-right text-xs text-gray-400" />
                  </button>
                  <button
                    onClick={() => { reset(); setMode('remove') }}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs text-red-600">간편 비밀번호 해제</span>
                    <i className="fas fa-chevron-right text-xs text-gray-400" />
                  </button>
                </>
              )}
            </div>
          )}

          {mode === 'set' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-32 shrink-0 text-right">로그인 비밀번호</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={e => setLoginPw(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-32 shrink-0 text-right">새 간편 비밀번호</label>
                <input
                  type="password" inputMode="numeric" maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(onlyDigits(e.target.value))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-32 shrink-0 text-right">간편 비밀번호 확인</label>
                <input
                  type="password" inputMode="numeric" maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(onlyDigits(e.target.value))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                />
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => { reset(); setMode('list') }} className="px-6 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
                <button onClick={onSet} disabled={submitting} className="px-8 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50">{submitting ? '저장 중...' : '저장'}</button>
              </div>
            </div>
          )}

          {mode === 'change' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-32 shrink-0 text-right">현재 간편 비밀번호</label>
                <input
                  type="password" inputMode="numeric" maxLength={4}
                  value={currentPin}
                  onChange={e => setCurrentPin(onlyDigits(e.target.value))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-32 shrink-0 text-right">새 간편 비밀번호</label>
                <input
                  type="password" inputMode="numeric" maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(onlyDigits(e.target.value))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-32 shrink-0 text-right">간편 비밀번호 확인</label>
                <input
                  type="password" inputMode="numeric" maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(onlyDigits(e.target.value))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                />
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => { reset(); setMode('list') }} className="px-6 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
                <button onClick={onChange} disabled={submitting} className="px-8 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50">{submitting ? '저장 중...' : '저장'}</button>
              </div>
            </div>
          )}

          {mode === 'remove' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">간편 비밀번호를 해제하시겠습니까? 본인 확인을 위해 로그인 비밀번호를 입력해주세요.</p>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-32 shrink-0 text-right">로그인 비밀번호</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={e => setLoginPw(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                />
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => { reset(); setMode('list') }} className="px-6 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
                <button onClick={onRemove} disabled={submitting} className="px-8 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">{submitting ? '처리 중...' : '해제'}</button>
              </div>
            </div>
          )}

          {mode !== 'list' && (
            <div className="mt-5 bg-[#fffde7] rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-700"><i className="fas fa-info-circle text-yellow-500 mr-1" /> 간편 비밀번호 설정 방법</p>
              <p>- 4자리의 숫자만 입력 가능합니다.</p>
              <p>- 연속된 숫자, 3자리 이상의 반복된 숫자는 피해주세요.</p>
            </div>
          )}

          {msg && (
            <p className={`mt-4 text-xs text-center ${msg.type === 'error' ? 'text-red-500' : 'text-[#1D9E75]'}`}>
              <i className={`fa-solid ${msg.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'} text-[10px] mr-1`} />
              {msg.text}
            </p>
          )}
        </>
      )}
    </div>
  )
}

// User-Agent 문자열에서 브라우저+OS 추출 (간단 휴리스틱)
function summarizeUserAgent(ua: string | null): string {
  if (!ua) return '알 수 없음'
  const browser =
    /Edg\//i.test(ua) ? 'Edge'
    : /Chrome\//i.test(ua) ? 'Chrome'
    : /Safari\//i.test(ua) ? 'Safari'
    : /Firefox\//i.test(ua) ? 'Firefox'
    : '브라우저'
  const os =
    /Windows/i.test(ua) ? 'Windows'
    : /Mac OS X/i.test(ua) ? 'macOS'
    : /Android/i.test(ua) ? 'Android'
    : /iPhone|iPad/i.test(ua) ? 'iOS'
    : /Linux/i.test(ua) ? 'Linux'
    : ''
  return os ? `${browser} · ${os}` : browser
}

function formatLoginAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function LoginHistoryView({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [items, setItems] = useState<LoginHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [logoutSubmitting, setLogoutSubmitting] = useState(false)

  useEffect(() => {
    loginHistoryApi.list(20)
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleLogoutAll = async () => {
    if (!confirm('로그아웃 하시겠습니까? 다시 로그인이 필요합니다.')) return
    setLogoutSubmitting(true)
    // logout()이 내부적으로 /auth/logout 호출 + 로컬 토큰 클리어 + Redis RT:{empId} 무효화 (= 모든 세션 종료)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <i className="fas fa-arrow-left text-xs" /> 로그인 이력 정보
        </button>
        <button
          onClick={handleLogoutAll}
          disabled={logoutSubmitting}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
        >
          <i className="fas fa-sign-out-alt text-[10px]" /> 전체 로그아웃
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mb-5">최근 로그인 이력입니다 (최대 20건). 의심스러운 접근이 있으면 비밀번호를 변경하고 전체 로그아웃을 진행해주세요.</p>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-8">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="far fa-clock text-[32px] text-gray-200 mb-3" />
          <p className="text-xs">로그인 이력이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-lg px-4 py-3 flex items-start gap-3">
              <i className="fas fa-desktop text-gray-300 text-base mt-0.5" />
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{formatLoginAt(item.loginAt)}</span>
                  {item.loginMethod && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      {item.loginMethod === 'FACE' ? '얼굴' : '비밀번호'}
                    </span>
                  )}
                </div>
                <p className="text-gray-500">
                  <i className="fas fa-globe text-[10px] mr-1.5 text-gray-400" />
                  {item.ip || '-'}
                  <span className="mx-2 text-gray-300">·</span>
                  {summarizeUserAgent(item.userAgent)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 인사통합 PIN 관리 (HR_SUPER_ADMIN 전용) ──
function HrAdminPinManageView({ onBack }: { onBack: () => void }) {
  const { clearSession } = useHrAdminSession()
  const [hasPin, setHasPin] = useState<boolean | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'change' | 'delete'>('list')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const reload = () => {
    hrAdminPinApi.status()
      .then(({ data }) => { setHasPin(data.hasPin); setUpdatedAt(data.updatedAt) })
      .catch(() => setHasPin(false))
  }

  useEffect(() => { reload() }, [])

  const resetForms = () => {
    setCurrentPin(''); setNewPin(''); setNewPinConfirm(''); setPassword(''); setMsg(null)
  }

  const onChangeSubmit = async () => {
    setMsg(null)
    if (!/^\d{4,6}$/.test(newPin)) { setMsg({ type: 'error', text: '새 PIN은 4~6자리 숫자여야 합니다' }); return }
    if (newPin !== newPinConfirm) { setMsg({ type: 'error', text: '새 PIN이 일치하지 않습니다' }); return }
    if (submitting) return
    setSubmitting(true)
    try {
      await hrAdminPinApi.change(currentPin, newPin)
      setMsg({ type: 'success', text: 'PIN이 변경되었습니다' })
      resetForms()
      setMode('list')
      reload()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const code = e?.response?.data?.code
      setMsg({
        type: 'error',
        text: code === 'HR_ADMIN_PIN_MISMATCH' ? '현재 PIN이 일치하지 않습니다'
          : e?.response?.data?.message || '변경에 실패했습니다',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteSubmit = async () => {
    setMsg(null)
    if (submitting) return
    setSubmitting(true)
    try {
      await hrAdminPinApi.remove(password)
      clearSession()
      setMsg({ type: 'success', text: 'PIN이 해제되었습니다' })
      resetForms()
      setMode('list')
      reload()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const code = e?.response?.data?.code
      setMsg({
        type: 'error',
        text: code === 'INVALID_CREDENTIALS' ? '비밀번호가 일치하지 않습니다'
          : e?.response?.data?.message || '해제에 실패했습니다',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-5">
        <i className="fas fa-arrow-left text-xs" /> 인사통합 PIN 관리
      </button>

      {hasPin === null ? (
        <p className="text-xs text-gray-400">확인 중…</p>
      ) : !hasPin ? (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-xs text-amber-700">
          <i className="fas fa-circle-info mr-1.5" />
          PIN이 설정되어 있지 않습니다. 인사통합 메뉴에 처음 진입할 때 설정할 수 있습니다.
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-xs text-gray-600 flex items-center justify-between">
            <span>마지막 변경</span>
            <span className="text-gray-800">{updatedAt ? new Date(updatedAt).toLocaleString() : '-'}</span>
          </div>

          {mode === 'list' && (
            <div className="space-y-2">
              <button
                onClick={() => { resetForms(); setMode('change') }}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs text-gray-700">PIN 변경</span>
                <i className="fas fa-chevron-right text-xs text-gray-400" />
              </button>
              <button
                onClick={() => { resetForms(); setMode('delete') }}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs text-red-600">PIN 해제</span>
                <i className="fas fa-chevron-right text-xs text-gray-400" />
              </button>
            </div>
          )}

          {mode === 'change' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0 text-right">현재 PIN</label>
                <input type="password" inputMode="numeric" maxLength={6}
                  value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0 text-right">새 PIN</label>
                <input type="password" inputMode="numeric" maxLength={6}
                  value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0 text-right">새 PIN 확인</label>
                <input type="password" inputMode="numeric" maxLength={6}
                  value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => { resetForms(); setMode('list') }} className="px-6 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
                <button onClick={onChangeSubmit} disabled={submitting} className="px-8 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50">저장</button>
              </div>
            </div>
          )}

          {mode === 'delete' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">PIN을 해제하면 인사통합 접근 시 PIN을 다시 설정해야 합니다.</p>
              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0 text-right">로그인 비밀번호</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]" />
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => { resetForms(); setMode('list') }} className="px-6 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
                <button onClick={onDeleteSubmit} disabled={submitting} className="px-8 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">해제</button>
              </div>
            </div>
          )}

          {msg && (
            <p className={`mt-4 text-xs text-center ${msg.type === 'error' ? 'text-red-500' : 'text-[#1D9E75]'}`}>
              <i className={`fa-solid ${msg.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'} text-[10px] mr-1`} />
              {msg.text}
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ── 보안설정 ──
function SecurityTab() {
  const { user } = useAuth()
  const [subView, setSubView] = useState<SecuritySubView>('list')

  if (subView === 'password') return <PasswordChangeView onBack={() => setSubView('list')} />
  if (subView === 'loginHistory') return <LoginHistoryView onBack={() => setSubView('list')} />
  if (subView === 'hrAdminPin') return <HrAdminPinManageView onBack={() => setSubView('list')} />

  const isSuperAdmin = user?.empRole === 'HR_SUPER_ADMIN'

  return (
    <div>
      {/* 비밀번호 관리 */}
      <div className="border border-gray-200 rounded-lg mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-800">비밀번호 관리</p>
        </div>
        <button
          onClick={() => setSubView('password')}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs text-gray-700">비밀번호 관리</span>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
        </button>
        {/* 간편 비밀번호: 실제 인증 사용처가 없어 일단 숨김. 추후 재노출 시 setSubView('simplePassword') 버튼 복구 */}
      </div>

      {/* 로그인/인증 관리 */}
      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-800">로그인/ 인증 관리</p>
        </div>
        <button
          onClick={() => setSubView('loginHistory')}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs text-gray-700">로그인 이력 정보</span>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
        </button>
      </div>

      {/* 인사통합 PIN 관리 (HR_SUPER_ADMIN 전용) */}
      {isSuperAdmin && (
        <div className="border border-gray-200 rounded-lg mt-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800">인사통합</p>
          </div>
          <button
            onClick={() => setSubView('hrAdminPin')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs text-gray-700">인사통합 PIN 관리</span>
            <i className="fas fa-chevron-right text-xs text-gray-400" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── 알림 서비스 정의 ──
interface NotiServiceConfig {
  key: string
  label: string
  description: string
}

// 알림 채널은 인앱 알림 1종만 운영. 업무별로 ON·OFF 토글.
const DEFAULT_SERVICES: NotiServiceConfig[] = [
  { key: 'board',     label: '게시판',   description: '신규 게시글·댓글 알림' },
  { key: 'calendar',  label: '캘린더',   description: '일정 시작·초대·변경 알림' },
  { key: 'approval',  label: '전자결재', description: '결재 요청·승인·반려 알림' },
  { key: 'messenger', label: '메신저',   description: '신규 메시지·멘션 알림' },
  { key: 'payroll',   label: '급여',     description: '급여명세서 발행·지급 알림' },
]

// ── 알림설정 ──
function NotificationTab() {
  const [serviceSettings, setServiceSettings] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DEFAULT_SERVICES.map(s => [s.key, true]))
  )
  const loadedRef = useRef(false)

  // 마운트 시 1회 GET 으로 초기값 로드
  useEffect(() => {
    notificationSettingsApi.getMine()
      .then(res => {
        setServiceSettings(prev => {
          const next = { ...prev }
          for (const [k, v] of Object.entries(res.serviceSettings ?? {})) {
            if (typeof v === 'boolean') next[k] = v
          }
          return next
        })
        loadedRef.current = true
      })
      .catch(() => {
        // 백엔드 미배포 등 실패 시 default(모두 ON) 유지
        loadedRef.current = true
      })
  }, [])

  const toggle = (key: string) => {
    setServiceSettings(prev => {
      const next = { ...prev, [key]: !prev[key] }
      if (loadedRef.current) {
        notificationSettingsApi.updateMine({ serviceSettings: next })
          .catch(() => { /* 저장 실패는 조용히 무시 */ })
      }
      return next
    })
  }

  return (
    <div>
      <div className="border border-gray-200 rounded-lg mb-4 px-4 py-3">
        <p className="text-[11px] text-gray-400">업무별로 인앱 알림 수신 여부를 설정합니다. OFF 인 업무는 알림이 발송되지 않습니다.</p>
      </div>

      <div className="border border-gray-200 rounded-lg">
        {DEFAULT_SERVICES.map((svc, idx) => {
          const enabled = serviceSettings[svc.key] ?? true
          return (
            <div
              key={svc.key}
              className={`flex items-center justify-between px-4 py-3 ${
                idx < DEFAULT_SERVICES.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">{svc.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{svc.description}</p>
              </div>
              <button
                onClick={() => toggle(svc.key)}
                role="switch"
                aria-checked={enabled}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  enabled ? 'bg-[#2e9e6e]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 메인 설정 모달 ──
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('info')

  if (!isOpen) return null

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'info', label: '내 정보 관리' },
    { key: 'security', label: '보안설정' },
    // 알림설정 탭은 백엔드 미구현으로 일시 숨김. 구현 후 주석 해제.
    // { key: 'notification', label: '알림설정' },
  ]

  const tabTitles: Record<SettingsTab, string> = {
    info: '내 정보 관리',
    security: '보안설정',
    notification: '알림설정',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl flex" style={{ width: '680px', height: '600px' }}>
        {/* 왼쪽: 설정 메뉴 */}
        <div className="w-[140px] bg-gray-50 rounded-l-xl p-4 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 mb-5">설정</h2>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-800 font-medium shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 오른쪽: 콘텐츠 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <h3 className="text-[15px] font-bold text-gray-900">{tabTitles[activeTab]}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && <InfoTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'notification' && <NotificationTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
