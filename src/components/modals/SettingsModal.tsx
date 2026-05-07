import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { hrAdminPinApi } from '../../api/hrAdminPin'
import { useHrAdminSession } from '../../contexts/HrAdminSessionContext'
import { mySalaryApi, type MySalaryInfoRes } from '../../api/mypay'
import { EMP_TYPE_LABEL, type EmpType } from '../../api/employee/types'
import { updateMyProfileImage } from '../../api/employee/employeeApi'
import { resolveProfileImageUrl } from '../../utils/profileImage'

type SettingsTab = 'info' | 'security' | 'notification'
type InfoSubView = 'list' | 'profile'
type SecuritySubView = 'list' | 'password' | 'simplePassword' | 'loginHistory' | 'hrAdminPin'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// ── 내 프로필 관리 ──
function ProfileView({ onBack }: { onBack: () => void }) {
  const { user, setProfileImageUrl } = useAuth()
  const [info, setInfo] = useState<MySalaryInfoRes | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => {
    mySalaryApi.getInfo().then(setInfo).catch(() => { /* ignore */ })
  }, [])

  useEffect(() => { reload() }, [reload])

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
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">외부 메일</span>
          <span className="text-gray-800">{info?.empPersonalEmail || '-'}</span>
        </div>
        <div className="flex border-b border-gray-100 py-2.5">
          <span className="text-gray-500 w-20 shrink-0">권한</span>
          <span className="text-gray-800">{user?.empRole === 'HR_SUPER_ADMIN' ? '최고관리자' : user?.empRole === 'HR_ADMIN' ? '인사관리자' : '일반사원'}</span>
        </div>
      </div>
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

// ── 비밀번호 변경 ──
function PasswordChangeView({ onBack }: { onBack: () => void }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-5">
        <i className="fas fa-arrow-left text-xs" /> 비밀번호 변경
      </button>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-600 w-24 shrink-0 text-right">현재 비밀번호</label>
          <input
            type="password"
            placeholder="현재 사용중인 비밀번호를 입력해주세요"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-600 w-24 shrink-0 text-right">새 비밀번호</label>
          <input
            type="password"
            placeholder="새 비밀번호를 입력해주세요"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-600 w-24 shrink-0 text-right">새 비밀번호 확인</label>
          <input
            type="password"
            placeholder="새 비밀번호를 한번 더 입력해주세요"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
          />
        </div>
      </div>

      <div className="mt-5 bg-[#fffde7] rounded-lg p-3 text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-700"><i className="fas fa-info-circle text-yellow-500 mr-1" /> 비밀번호 설정 방법</p>
        <p>- 8~16자의 영문자, 숫자, 특수문자를 조합하여 사용하세요.</p>
        <p>- 연속한 문자와 숫자, 동일 문자 반복, 키보드 순차 배열 구성을 피해주세요.</p>
        <p>- 이전 비밀번호의 재사용을 피해주세요.</p>
      </div>

      <div className="flex justify-center mt-6">
        <button className="px-8 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors">
          저장
        </button>
      </div>
    </div>
  )
}

// ── 간편 비밀번호 관리 ──
function SimplePwView({ onBack }: { onBack: () => void }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const onlyDigits = (val: string) => val.replace(/\D/g, '').slice(0, 4)

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-6">
        <i className="fas fa-arrow-left text-xs" /> 간편 비밀번호 관리
      </button>

      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-600 w-32 shrink-0 text-right">현재 간편 비밀번호</label>
          <div className="relative flex-1">
            <input
              type={showCurrent ? 'text' : 'password'}
              placeholder="현재 사용중인 비밀번호를 입력해주세요."
              value={currentPw}
              onChange={e => setCurrentPw(onlyDigits(e.target.value))}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-[#2e9e6e]"
            />
            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
              <i className={`fas ${showCurrent ? 'fa-eye' : 'fa-eye-slash'} text-xs`} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-600 w-32 shrink-0 text-right">새 간편 비밀번호</label>
          <div className="relative flex-1">
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="새로운 간편 비밀번호를 입력해주세요."
              value={newPw}
              onChange={e => setNewPw(onlyDigits(e.target.value))}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-[#2e9e6e]"
            />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
              <i className={`fas ${showNew ? 'fa-eye' : 'fa-eye-slash'} text-xs`} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-600 w-32 shrink-0 text-right">새 간편 비밀번호 확인</label>
          <div className="relative flex-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="새로운 간편 비밀번호를 한번 더 입력해주세요."
              value={confirmPw}
              onChange={e => setConfirmPw(onlyDigits(e.target.value))}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-[#2e9e6e]"
            />
            <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
              <i className={`fas ${showConfirm ? 'fa-eye' : 'fa-eye-slash'} text-xs`} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 bg-[#fffde7] rounded-lg p-3 text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-700"><i className="fas fa-info-circle text-yellow-500 mr-1" /> 간편 비밀번호 설정 방법</p>
        <p>- 4자리의 숫자만 입력 가능합니다.</p>
        <p>- 연속된 숫자, 3자리 이상의 반복된 숫자는 피해주세요.</p>
      </div>

      <div className="flex justify-center gap-3 mt-6">
        <button className="px-6 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          간편 비밀번호 초기화
        </button>
        <button className="px-8 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors">
          저장
        </button>
      </div>
    </div>
  )
}

// TODO: 백엔드 로그인 이력 API 연동 필요
const MOCK_LOGIN_HISTORY: { id: string; ip: string; lastLogin: string; firstLogin: string }[] = []

function LoginHistoryView({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <i className="fas fa-arrow-left text-xs" /> 로그인 이력 정보
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
          <i className="fas fa-sign-out-alt text-[10px]" /> 모든 기기 로그아웃
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mb-5">현재 로그인 중인 기기 목록을 확인하고 원격으로 로그아웃을 할 수 있습니다.</p>

      <div className="space-y-4">
        {MOCK_LOGIN_HISTORY.map(item => (
          <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <i className="fas fa-desktop text-gray-300 text-lg mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="flex gap-4">
                  <span className="text-gray-500 w-14">로그인 IP</span>
                  <span className="text-gray-800">{item.ip}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-14">최근 로그인</span>
                  <span className="text-gray-800">{item.lastLogin}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-14">최초 로그인</span>
                  <span className="text-gray-800">{item.firstLogin}</span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1 text-[11px] text-gray-500 border border-gray-200 rounded px-2.5 py-1 hover:bg-gray-50 shrink-0">
              <i className="fas fa-sign-out-alt text-[9px]" /> 로그아웃
            </button>
          </div>
        ))}
      </div>
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
  if (subView === 'simplePassword') return <SimplePwView onBack={() => setSubView('list')} />
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
        <div className="border-t border-gray-100" />
        <button
          onClick={() => setSubView('simplePassword')}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs text-gray-700">간편 비밀번호 관리</span>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
        </button>
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

// ── 알림 서비스 세부 설정 ──
interface NotiChannel { email: boolean; push: boolean; bell: boolean }

interface NotiServiceConfig {
  key: string
  label: string
  icon: string
  channels: NotiChannel
  items: { label: string; description: string; channels: NotiChannel; options?: { label: string; checked: boolean }[] }[]
}

const DEFAULT_SERVICES: NotiServiceConfig[] = [
  {
    key: 'board', label: '게시판', icon: 'fas fa-clipboard-list',
    channels: { email: false, push: false, bell: true },
    items: [
      { label: '게시글 등록', description: '게시판에 신규 게시글이 등록되면 알림을 받습니다.', channels: { email: true, push: true, bell: false },
        options: [{ label: '전체 게시판', checked: false }, { label: '내가 운영하는 게시판', checked: false }, { label: '즐겨찾기 게시판', checked: false }, { label: '게시글 등록자가 알림 발송 시', checked: true }] },
      { label: '게시글 수정', description: '게시글이 수정되면 알림을 받습니다.', channels: { email: true, push: true, bell: false },
        options: [{ label: '전체 게시판', checked: false }, { label: '내가 운영하는 게시판', checked: false }, { label: '즐겨찾기 게시판', checked: false }] },
      { label: '댓글 등록', description: '게시글에 댓글이 등록되면 알림을 받습니다.', channels: { email: true, push: true, bell: false },
        options: [{ label: '전체 게시판', checked: false }, { label: '내가 운영하는 게시판', checked: false }, { label: '즐겨찾기 게시판', checked: false }, { label: '내가 등록한 게시글', checked: true }] },
    ],
  },
  {
    key: 'calendar', label: '캘린더', icon: 'fas fa-calendar-alt',
    channels: { email: false, push: false, bell: true },
    items: [
      { label: '일정 알림', description: '일정 시작 전 설정한 시간에 알림을 받습니다.', channels: { email: false, push: true, bell: true }, options: [] },
      { label: '일정 초대', description: '새로운 일정에 초대되면 알림을 받습니다.', channels: { email: true, push: true, bell: true }, options: [] },
      { label: '일정 변경/취소', description: '참석 중인 일정이 변경되거나 취소되면 알림을 받습니다.', channels: { email: false, push: false, bell: true }, options: [] },
    ],
  },
  {
    key: 'approval', label: '전자결재', icon: 'fas fa-file-signature',
    channels: { email: false, push: false, bell: true },
    items: [
      { label: '결재 요청', description: '새로운 결재 요청이 도착하면 알림을 받습니다.', channels: { email: true, push: true, bell: true }, options: [] },
      { label: '결재 승인', description: '내 결재 문서가 승인되면 알림을 받습니다.', channels: { email: false, push: true, bell: true }, options: [] },
      { label: '결재 반려', description: '내 결재 문서가 반려되면 알림을 받습니다.', channels: { email: true, push: true, bell: true }, options: [] },
    ],
  },
]

function ChannelToggles({ channels, onChange, allowed }: { channels: NotiChannel; onChange: (ch: NotiChannel) => void; allowed?: NotiChannel }) {
  const items: { key: keyof NotiChannel; label: string }[] = [
    { key: 'email', label: '메일' },
    { key: 'push', label: '웹푸시' },
    { key: 'bell', label: '알림' },
  ]
  return (
    <div className="flex items-center gap-1">
      {items.map(({ key, label }) => {
        const disabled = allowed && !allowed[key]
        const active = channels[key] && !disabled
        return (
          <button
            key={key}
            onClick={() => !disabled && onChange({ ...channels, [key]: !channels[key] })}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
              disabled
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : active
                  ? 'border-gray-700 text-gray-700'
                  : 'border-gray-200 text-gray-300'
            }`}
          >
            ✓ {label}
          </button>
        )
      })}
    </div>
  )
}

function NotiServiceDetailView({ service, onBack, allowed }: { service: NotiServiceConfig; onBack: () => void; allowed: NotiChannel }) {
  const [serviceChannels, setServiceChannels] = useState<NotiChannel>(service.channels)
  const [itemChannels, setItemChannels] = useState<NotiChannel[]>(service.items.map(i => ({ ...i.channels })))

  const updateItemChannel = (idx: number, ch: NotiChannel) => {
    setItemChannels(prev => prev.map((c, i) => i === idx ? ch : c))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <i className="fas fa-arrow-left text-xs" /> {service.label}
        </button>
        <ChannelToggles channels={serviceChannels} onChange={setServiceChannels} allowed={allowed} />
      </div>

      <div className="space-y-5">
        {service.items.map((item, idx) => (
          <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-800">{item.label}</span>
              <ChannelToggles channels={itemChannels[idx]} onChange={(ch) => updateItemChannel(idx, ch)} allowed={{ email: allowed.email && serviceChannels.email, push: allowed.push && serviceChannels.push, bell: allowed.bell && serviceChannels.bell }} />
            </div>
            <p className="text-[11px] text-gray-400 mb-2">{item.description}</p>
            {item.options && item.options.length > 0 && (
              <div className="space-y-1.5 ml-1">
                {item.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={opt.checked} className="w-3.5 h-3.5 rounded accent-[#2e9e6e]" />
                    <span className="text-xs text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 알림설정 ──
function NotificationTab() {
  const [emailNoti, setEmailNoti] = useState(true)
  const [pushNoti, setPushNoti] = useState(true)
  const [bellNoti, setBellNoti] = useState(true)
  const [selectedService, setSelectedService] = useState<NotiServiceConfig | null>(null)

  if (selectedService) {
    return <NotiServiceDetailView service={selectedService} onBack={() => setSelectedService(null)} allowed={{ email: emailNoti, push: pushNoti, bell: bellNoti }} />
  }

  return (
    <div>
      {/* 임직원포털 알림 설정 */}
      <div className="border border-gray-200 rounded-lg mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-800">임직원포털 알림 설정</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setEmailNoti(!emailNoti)} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${emailNoti ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-400'}`}>
              ✓ 메일
            </button>
            <button onClick={() => setPushNoti(!pushNoti)} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${pushNoti ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-400'}`}>
              ✓ 웹푸시
            </button>
            <button onClick={() => setBellNoti(!bellNoti)} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${bellNoti ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-400'}`}>
              ✓ 알림
            </button>
          </div>
        </div>
        <div className="px-4 py-2">
          <p className="text-[11px] text-gray-400">임직원포털 앱에서 발송되는 메일/웹푸시/알림 의 수신 여부를 설정합니다.</p>
        </div>
      </div>

      {/* 서비스별 목록 */}
      <div className="border border-gray-200 rounded-lg">
        {DEFAULT_SERVICES.map((svc, idx) => (
          <button
            key={svc.key}
            onClick={() => setSelectedService(svc)}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
              idx < DEFAULT_SERVICES.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <span className="text-xs text-gray-700">{svc.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">
                {[svc.channels.email && '메일', svc.channels.push && '웹푸시', svc.channels.bell && '알림'].filter(Boolean).join(', ')}
              </span>
              <i className="fas fa-chevron-right text-xs text-gray-400" />
            </div>
          </button>
        ))}
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
    { key: 'notification', label: '알림설정' },
  ]

  const tabTitles: Record<SettingsTab, string> = {
    info: '내 정보 관리',
    security: '보안설정',
    notification: '알림설정',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl flex" style={{ width: '750px', height: '600px' }}>
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
