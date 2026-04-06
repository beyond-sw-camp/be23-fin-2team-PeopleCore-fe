import React, { useState, useEffect, useCallback } from 'react'
import { OrgPickerModal, AutoClassifyTab } from './ApprovalModals'
import { approvalApi, type DeptFolderResponse, type ManagerInfo } from '../../../api/approval'

/* ── 부서 문서함 관리 뷰 ── */
interface DeptFolder extends DeptFolderResponse { checked: boolean }

export default function DeptBoxManageView() {
  const [tab, setTab] = useState<'문서함' | '자동분류 규칙'>('문서함')
  const [folders, setFolders] = useState<DeptFolder[]>([])
  const [orgPickerOpen, setOrgPickerOpen] = useState(false)
  const [managerPickerFolderId, setManagerPickerFolderId] = useState<number | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)

  const allChecked = folders.length > 0 && folders.every((f) => f.checked)
  const someChecked = folders.some((f) => f.checked)
  const toggleAll = () => setFolders((p) => p.map((f) => ({ ...f, checked: !allChecked })))
  const toggleOne = (id: number) => setFolders((p) => p.map((f) => f.id === id ? { ...f, checked: !f.checked } : f))

  const loadFolders = useCallback(() => {
    setLoading(true)
    approvalApi.getDeptFolders()
      .then(({ data }) => setFolders(data.map((f) => ({ ...f, checked: false }))))
      .catch(() => setFolders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  const addFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await approvalApi.createDeptFolder(newFolderName.trim())
      setNewFolderName('')
      setAddOpen(false)
      loadFolders()
    } catch {
      alert('문서함 생성에 실패했습니다.')
    }
  }

  const deleteChecked = async () => {
    const targets = folders.filter((f) => f.checked)
    if (targets.length === 0) return
    try {
      await Promise.all(targets.map((f) => approvalApi.deleteDeptFolder(f.id)))
      loadFolders()
    } catch {
      alert('문서함 삭제에 실패했습니다.')
    }
  }

  const handleReorderDone = async () => {
    const orderList = folders.map((f, idx) => ({ id: f.id, sortOrder: idx + 1 }))
    try {
      await approvalApi.reorderDeptFolders(orderList)
      setReorderMode(false)
      loadFolders()
    } catch {
      alert('순서 변경에 실패했습니다.')
    }
  }

  const onDragStart = (idx: number) => setDragIdx(idx)
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setFolders((p) => { const n = [...p]; const [item] = n.splice(dragIdx, 1); n.splice(idx, 0, item); return n })
    setDragIdx(idx)
  }
  const onDragEnd = () => setDragIdx(null)

  const handleAddManager = async (member: { empId: number; name: string; deptName: string }) => {
    const folderId = managerPickerFolderId ?? selectedFolderId
    if (!folderId) return
    try {
      await approvalApi.addDeptFolderManager(folderId, { empId: member.empId, empName: member.name, deptName: member.deptName })
      loadFolders()
    } catch {
      alert('담당자 추가에 실패했습니다.')
    }
    setOrgPickerOpen(false)
    setManagerPickerFolderId(null)
  }

  const handleRemoveManager = async (folderId: number, empId: number) => {
    try {
      await approvalApi.removeDeptFolderManager(folderId, empId)
      loadFolders()
    } catch {
      alert('담당자 삭제에 실패했습니다.')
    }
  }

  // 선택된 폴더의 담당자 표시
  const selectedFolder = folders.find((f) => f.id === selectedFolderId)

  return (
    <div className="p-6">
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">부서 문서함 관리</h1>
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        {(['문서함', '자동분류 규칙'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-[13px] transition-colors ${tab === t ? 'text-gray-900 font-bold border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
        ))}
      </div>
      {tab === '문서함' ? (<>
        {selectedFolder && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
            <span className="text-[13px] text-gray-700 font-medium">"{selectedFolder.name}" 담당자</span>
            {selectedFolder.managers.map((m) => (
              <span key={m.empId} className="text-[12px] bg-white border border-gray-200 rounded px-2 py-0.5 flex items-center gap-1">
                {m.empName} ({m.deptName})
                <button onClick={() => handleRemoveManager(selectedFolder.id, m.empId)} className="text-gray-400 hover:text-red-500 text-[10px]">&times;</button>
              </span>
            ))}
            <button onClick={() => { setManagerPickerFolderId(selectedFolder.id); setOrgPickerOpen(true) }} className="text-[12px] text-[#1D9E75] hover:underline">+ 담당자 추가</button>
          </div>
        )}
        {orgPickerOpen && (
          <OrgPickerModal
            title="담당자 선택"
            onClose={() => { setOrgPickerOpen(false); setManagerPickerFolderId(null) }}
            onSelect={(member) => handleAddManager(member)}
          />
        )}
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => { if (reorderMode) handleReorderDone(); else setReorderMode(true) }} className="text-[12px] text-gray-600 hover:text-[#1D9E75] flex items-center gap-1"><i className="fas fa-sort text-[10px]" /> {reorderMode ? '순서 완료' : '순서 바꾸기'}</button>
          <button onClick={() => setAddOpen(true)} className="text-[12px] text-gray-600 hover:text-[#1D9E75] flex items-center gap-1">+ 추가</button>
          <button onClick={deleteChecked} disabled={!someChecked} className={`text-[12px] flex items-center gap-1 ${someChecked ? 'text-gray-600 hover:text-red-500' : 'text-gray-300 cursor-not-allowed'}`}><i className="fas fa-trash-alt text-[10px]" /> 삭제</button>
        </div>
        {addOpen && (
          <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg px-4 py-2">
            <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="문서함 이름" className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') addFolder() }} />
            <button onClick={addFolder} className="text-[12px] text-[#1D9E75] font-medium hover:underline">확인</button>
            <button onClick={() => { setAddOpen(false); setNewFolderName('') }} className="text-[12px] text-gray-500 hover:underline">취소</button>
          </div>
        )}
        <div className="border-t-2 border-gray-900">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900 bg-white">
              <th className="py-2.5 px-3 w-8 text-left"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#1D9E75]" /></th>
              <th className="py-2.5 px-3 text-left text-gray-700 font-medium">문서함 이름</th>
              <th className="py-2.5 px-3 text-right text-gray-700 font-medium w-28">생성일</th>
              <th className="py-2.5 px-3 text-right text-gray-700 font-medium w-24">문서 개수</th>
              <th className="py-2.5 px-3 text-right text-gray-700 font-medium w-16">설정</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-gray-400 text-[13px]">로딩 중...</td></tr>
              ) : folders.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center">
                  <div className="text-gray-300 text-[40px] mb-3"><i className="far fa-folder-open" /></div>
                  <div className="text-[13px] text-gray-400">문서함이 없습니다.</div>
                </td></tr>
              ) : folders.map((f, idx) => (
                <tr key={f.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${reorderMode ? 'cursor-grab' : ''} ${selectedFolderId === f.id ? 'bg-[#f0fdf8]' : ''}`}
                  draggable={reorderMode} onDragStart={() => onDragStart(idx)} onDragOver={(e) => onDragOver(e, idx)} onDragEnd={onDragEnd}
                  onClick={() => !reorderMode && setSelectedFolderId(f.id === selectedFolderId ? null : f.id)}>
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>{reorderMode ? <i className="fas fa-grip-vertical text-gray-400" /> : <input type="checkbox" checked={f.checked} onChange={() => toggleOne(f.id)} className="accent-[#1D9E75]" />}</td>
                  <td className="py-2.5 px-3 text-gray-800">{f.name}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500">{f.createdAt}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500">{f.docCount}</td>
                  <td className="py-2.5 px-3 text-right"><button className="text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); setSelectedFolderId(f.id) }}><i className="fas fa-cog text-[11px]" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>) : (
        <AutoClassifyTab />
      )}
    </div>
  )
}
