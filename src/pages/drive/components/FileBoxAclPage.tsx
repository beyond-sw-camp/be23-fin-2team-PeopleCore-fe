import { useEffect, useMemo, useState } from 'react'
import type { FileBox } from '../types'
import {
  fileBoxAclApi,
  type FileBoxAcl,
  type FileBoxAclEntry,
} from '../../../api/filebox-permission'
import OrgSelectModal from '../../../components/modals/OrgSelectModal'
import { AlertModal } from './DriveModals'

const extractErrorMessage = (e: unknown, fallback: string): string =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

interface FileBoxAclPageProps {
  fileBoxes: FileBox[]
  currentUserEmpId?: number
}

type AclFlag = 'canRead' | 'canWrite' | 'canDownload' | 'canDelete'

const FLAGS: AclFlag[] = ['canRead', 'canWrite', 'canDownload', 'canDelete']

const FLAG_LABELS: Record<AclFlag, string> = {
  canRead: '읽기',
  canWrite: '쓰기',
  canDownload: '다운로드',
  canDelete: '삭제',
}

export default function FileBoxAclPage({ fileBoxes, currentUserEmpId }: FileBoxAclPageProps) {
  const ownableBoxes = useMemo(
    () => fileBoxes.filter(b => !b.deleted && !b.isSystemDefault),
    [fileBoxes],
  )

  const [selectedId, setSelectedId] = useState<string | null>(ownableBoxes[0]?.id ?? null)
  const [acl, setAcl] = useState<FileBoxAcl | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)

  const isOwner = acl?.owner?.empId === currentUserEmpId

  const load = async (folderId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await fileBoxAclApi.get(Number(folderId))
      setAcl(data)
    } catch (e) {
      console.error('[FileBoxAclPage] ACL 조회 실패', e)
      setError('권한 정보를 불러오지 못했습니다.')
      setAcl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedId) load(selectedId)
    else setAcl(null)
  }, [selectedId])

  useEffect(() => {
    if (!selectedId && ownableBoxes[0]) setSelectedId(ownableBoxes[0].id)
  }, [ownableBoxes, selectedId])

  const updateMember = async (member: FileBoxAclEntry, flag: AclFlag, value: boolean) => {
    if (!acl) return
    if (acl.owner?.empId === member.empId) {
      setAlert({
        title: 'Owner 권한 수정 불가',
        message: 'Owner는 항상 모든 권한을 보유하며, 개별 권한을 수정할 수 없습니다.',
      })
      return
    }
    const next = {
      canRead: member.canRead,
      canWrite: member.canWrite,
      canDownload: member.canDownload,
      canDelete: member.canDelete,
      [flag]: value,
    }
    const prev = acl
    setAcl({
      ...acl,
      members: acl.members.map(m =>
        m.empId === member.empId ? { ...m, [flag]: value } : m,
      ),
    })
    try {
      await fileBoxAclApi.update(Number(acl.folderId), member.empId, next)
    } catch (e) {
      console.error('[FileBoxAclPage] ACL 수정 실패', e)
      setAcl(prev)
      setAlert({
        title: '권한 수정 실패',
        message: extractErrorMessage(e, '권한을 수정하지 못했습니다.'),
      })
    }
  }

  const removeMember = async (empId: number) => {
    if (!acl) return
    if (acl.owner?.empId === empId) {
      setAlert({
        title: 'Owner 삭제 불가',
        message: 'Owner는 파일함의 소유자로, 멤버 목록에서 삭제할 수 없습니다.',
      })
      return
    }
    const prev = acl
    setAcl({ ...acl, members: acl.members.filter(m => m.empId !== empId) })
    try {
      await fileBoxAclApi.remove(Number(acl.folderId), empId)
    } catch (e) {
      console.error('[FileBoxAclPage] 멤버 제거 실패', e)
      setAcl(prev)
      setAlert({
        title: '멤버 제거 실패',
        message: extractErrorMessage(e, '멤버를 제거하지 못했습니다.'),
      })
    }
  }

  const addMember = async (empId: number) => {
    if (!acl) return
    setAddOpen(false)
    if (acl.owner?.empId === empId) {
      setAlert({
        title: '멤버 추가 불가',
        message: 'Owner는 이미 모든 권한을 보유하고 있어 멤버로 추가할 수 없습니다.',
      })
      return
    }
    if (acl.members.some(m => m.empId === empId)) {
      setAlert({
        title: '멤버 추가 불가',
        message: '이미 추가된 멤버입니다.',
      })
      return
    }
    try {
      const { data } = await fileBoxAclApi.add(Number(acl.folderId), {
        empId,
        canRead: true,
        canWrite: false,
        canDownload: true,
        canDelete: false,
      })
      setAcl({ ...acl, members: [...acl.members, data] })
    } catch (e) {
      console.error('[FileBoxAclPage] 멤버 추가 실패', e)
      setAlert({
        title: '멤버 추가 실패',
        message: extractErrorMessage(e, '멤버를 추가하지 못했습니다.'),
      })
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* 좌측: 내 파일함 목록 */}
      <div className="w-[200px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-800">내 파일함</h2>
        </div>
        {ownableBoxes.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-gray-400">
            관리할 수 있는 파일함이 없습니다.
          </div>
        ) : (
          <div className="py-2">
            {ownableBoxes.map(b => (
              <div
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={`px-4 py-2 text-[13px] cursor-pointer truncate ${
                  selectedId === b.id
                    ? 'bg-[#E1F5EE] text-[#1D9E75] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {b.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 우측: ACL 편집 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-gray-400 text-[13px] text-center py-20">
            <i className="fa-solid fa-spinner fa-spin mr-2" /> 불러오는 중...
          </div>
        ) : error ? (
          <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        ) : !acl ? (
          <div className="text-center text-[13px] text-gray-400 py-20">
            좌측에서 파일함을 선택하세요.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[18px] font-bold text-gray-800">
                  {ownableBoxes.find(b => b.id === String(acl.folderId))?.name || '파일함'}
                </h1>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Owner: <span className="font-medium text-gray-700">{acl.owner?.empName ?? '-'}</span>
                  {isOwner && <span className="ml-1 text-[#1D9E75]">(나)</span>}
                </p>
              </div>
              {isOwner && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="px-4 py-2 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:opacity-90"
                >
                  <i className="fa-solid fa-plus mr-1" /> 멤버 추가
                </button>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">사원</th>
                    <th className="text-left px-3 py-2 font-medium">부서</th>
                    <th className="text-left px-3 py-2 font-medium">직급/직책</th>
                    {FLAGS.map(f => (
                      <th key={f} className="text-center px-2 py-2 font-medium">{FLAG_LABELS[f]}</th>
                    ))}
                    <th className="px-2 py-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Owner 행 (읽기 전용 full grant) */}
                  <tr className="bg-[#F1FAF5]">
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {acl.owner?.empName ?? '-'} <span className="ml-1 text-[10px] text-[#1D9E75]">Owner</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400">—</td>
                    <td className="px-3 py-2.5 text-gray-400">—</td>
                    {FLAGS.map(f => (
                      <td key={f} className="text-center px-2 py-2.5">
                        <i className="fa-solid fa-check text-[#1D9E75]" />
                      </td>
                    ))}
                    <td />
                  </tr>
                  {acl.members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                        등록된 멤버가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    acl.members.map(m => (
                      <tr key={m.empId} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-800">{m.empName}</td>
                        <td className="px-3 py-2.5 text-gray-600">{m.deptName}</td>
                        <td className="px-3 py-2.5 text-gray-600">
                          {m.gradeName}{m.titleName ? ` / ${m.titleName}` : ''}
                        </td>
                        {FLAGS.map(f => (
                          <td key={f} className="text-center px-2 py-2.5">
                            <input
                              type="checkbox"
                              checked={m[f]}
                              disabled={!isOwner}
                              onChange={e => updateMember(m, f, e.target.checked)}
                              className="w-4 h-4 accent-[#1D9E75] cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-2.5 text-center">
                          {isOwner && (
                            <button
                              onClick={() => removeMember(m.empId)}
                              className="w-6 h-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                              title="멤버 제거"
                            >
                              <i className="fa-solid fa-xmark" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-gray-400">
              <i className="fa-solid fa-circle-info mr-1" />
              권한이 설정되지 않은 사원은 기본적으로 이 파일함에 접근할 수 없습니다.
            </p>
          </div>
        )}
      </div>

      <OrgSelectModal
        isOpen={addOpen}
        title="멤버 추가"
        excludeEmpId={acl?.owner?.empId}
        onClose={() => setAddOpen(false)}
        onSelect={emp => addMember(emp.empId)}
      />

      {alert && (
        <AlertModal
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  )
}
