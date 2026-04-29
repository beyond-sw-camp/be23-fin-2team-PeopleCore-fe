import React, { useState, useEffect, useCallback, useRef } from 'react'
import { TransferModal, AutoClassifyTab } from './ApprovalModals'
import { approvalApi, type PersonalFolderResponse } from '../../../api/approval'

interface PersonalFolderUI extends PersonalFolderResponse { checked: boolean }

export default function PersonalBoxManageView({ onFoldersChange }: { folders?: unknown; onFoldersChange?: (f: { id: number; name: string; createdAt: string; docCount: number; shared: number }[]) => void }) {
  const [activeTab, setActiveTab] = useState('문서함')
  const [folders, setFolders] = useState<PersonalFolderUI[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [reordering, setReordering] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)

  const onFoldersChangeRef = useRef(onFoldersChange)
  // eslint-disable-next-line react-hooks/refs
  onFoldersChangeRef.current = onFoldersChange

  const loadFolders = useCallback(() => {
    return approvalApi.getPersonalFolders()
      .then(({ data }) => {
        setFolders(data.map((f) => ({ ...f, checked: false })))
        onFoldersChangeRef.current?.(data.map((f) => ({ ...f, shared: 0 })))
      })
      .catch(() => setFolders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { void loadFolders() }, [loadFolders])

  const toggleAll = () => {
    if (folders.every((f) => checkedIds.has(f.id))) setCheckedIds(new Set())
    else setCheckedIds(new Set(folders.map((f) => f.id)))
  }
  const toggleOne = (id: number) => setCheckedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await approvalApi.createPersonalFolder(newName.trim())
      setNewName(''); setAddOpen(false)
      setLoading(true); loadFolders()
    } catch {
      alert('문서함 생성에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    const targets = folders.filter((f) => checkedIds.has(f.id))
    const hasDoc = targets.some((f) => f.docCount > 0)
    if (hasDoc) { alert('문서가 존재하는 문서함은 삭제할 수 없습니다.'); return }
    try {
      await Promise.all(targets.map((f) => approvalApi.deletePersonalFolder(f.id)))
      setCheckedIds(new Set())
      setLoading(true); loadFolders()
    } catch {
      alert('문서함 삭제에 실패했습니다.')
    }
  }

  const startEdit = (id: number, name: string) => { setEditingId(id); setEditName(name) }
  const saveEdit = async (id: number) => {
    if (editName && !folders.some((f) => f.id !== id && f.name === editName)) {
      try {
        await approvalApi.updatePersonalFolder(id, editName)
        setLoading(true); loadFolders()
      } catch {
        alert('이름 변경에 실패했습니다.')
      }
    }
    setEditingId(null)
  }

  const handleReorderDone = async () => {
    const orderList = folders.map((f, idx) => ({ id: f.id, sortOrder: idx + 1 }))
    try {
      await approvalApi.reorderPersonalFolders(orderList)
      setReordering(false)
      setLoading(true); loadFolders()
    } catch {
      alert('순서 변경에 실패했습니다.')
    }
  }

  const moveRow = (from: number, to: number) => {
    if (to < 0 || to >= folders.length) return
    const u = [...folders]; const [item] = u.splice(from, 1); u.splice(to, 0, item); setFolders(u)
  }
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const handleDrop = (idx: number) => { if (dragIdx !== null && dragIdx !== idx) moveRow(dragIdx, idx); setDragIdx(null); setDragOverIdx(null) }

  const handleTransfer = async (targetEmpId: number) => {
    const targets = folders.filter((f) => checkedIds.has(f.id))
    try {
      await Promise.all(targets.map((f) => approvalApi.transferPersonalFolder(f.id, targetEmpId)))
      setCheckedIds(new Set())
      setTransferOpen(false)
      setLoading(true); loadFolders()
    } catch {
      alert('문서함 이관에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">개인 문서함 관리</h1>
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        {['문서함', '자동분류 규칙'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`pb-2 text-[13px] transition-colors ${activeTab === t ? 'text-gray-900 font-bold border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
        ))}
      </div>
      {activeTab === '문서함' ? (
        <>
          <div className="flex items-center gap-4 mb-3">
            <button onClick={() => { if (reordering) handleReorderDone(); else setReordering(true) }} className={`text-[12px] flex items-center gap-1 transition-colors ${reordering ? 'text-[#1D9E75] font-semibold' : 'text-gray-600 hover:text-[#1D9E75]'}`}>
              <i className={`fas ${reordering ? 'fa-check' : 'fa-sort'} text-[10px]`} /> {reordering ? '순서 완료' : '순서 바꾸기'}
            </button>
            {!reordering && (<>
              <button onClick={() => setAddOpen(true)} className="text-[12px] text-gray-600 hover:text-[#1D9E75] flex items-center gap-1">+ 추가</button>
              <button onClick={handleDelete} disabled={checkedIds.size === 0} className="text-[12px] flex items-center gap-1 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><i className="fas fa-trash-alt text-[10px]" /> 삭제</button>
              <button disabled={checkedIds.size === 0} onClick={() => setTransferOpen(true)} className="text-[12px] flex items-center gap-1 hover:text-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><i className="fas fa-exchange-alt text-[10px]" /> 문서함 이관</button>
            </>)}
          </div>
          {addOpen && (
            <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg px-4 py-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="문서함 이름" className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none flex-1" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }} />
              <button onClick={handleAdd} className="text-[12px] text-[#1D9E75] font-medium hover:underline">확인</button>
              <button onClick={() => { setAddOpen(false); setNewName('') }} className="text-[12px] text-gray-500 hover:underline">취소</button>
            </div>
          )}
          <div className="border-t-2 border-gray-900">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b-2 border-gray-900 bg-white">
                {reordering && <th className="px-3 py-2.5 text-gray-500 font-medium w-16">순서</th>}
                {!reordering && <th className="px-3 py-2.5 w-10"><input type="checkbox" checked={folders.length > 0 && folders.every((f) => checkedIds.has(f.id))} onChange={toggleAll} className="accent-[#1D9E75]" /></th>}
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">문서함 이름</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium w-28">생성일</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium w-24">문서 개수</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium w-20">설정</th>
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
                    className={`border-b transition-colors ${reordering && dragOverIdx === idx && dragIdx !== idx ? 'border-t-2 border-t-[#1D9E75] bg-[#f0fdf8]' : 'border-gray-100 hover:bg-gray-50'} ${reordering ? 'cursor-grab' : ''} ${reordering && dragIdx === idx ? 'opacity-40' : ''}`}
                    draggable={reordering} onDragStart={() => setDragIdx(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={() => handleDrop(idx)} onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}>
                    {reordering ? <td className="px-3 py-2.5"><i className="fas fa-grip-vertical text-gray-400 cursor-grab" /></td>
                      : <td className="px-3 py-2.5"><input type="checkbox" checked={checkedIds.has(f.id)} onChange={() => toggleOne(f.id)} className="accent-[#1D9E75]" /></td>}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {editingId === f.id ? (
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => saveEdit(f.id)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(f.id) }} autoFocus className="border border-[#1D9E75] rounded px-2 py-0.5 text-[12px] outline-none w-40" />
                        ) : (<>
                          <span className="text-gray-800">{f.name}</span>
                          {!reordering && <button onClick={() => startEdit(f.id, f.name)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-pen text-[9px]" /></button>}
                        </>)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{f.createdAt}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{f.docCount}</td>
                    <td className="px-3 py-2.5 text-right"><span className="text-[11px] text-gray-500">순서 {f.sortOrder}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transferOpen && (
            <TransferModal
              folderNames={folders.filter((f) => checkedIds.has(f.id)).map((f) => f.name)}
              onClose={() => setTransferOpen(false)}
              onConfirm={(_targetName, targetEmpId) => {
                if (targetEmpId) handleTransfer(targetEmpId)
              }}
            />
          )}
        </>
      ) : (
        <AutoClassifyTab />
      )}
    </div>
  )
}
