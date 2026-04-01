import React, { useState } from 'react'
import { OrgPickerModal } from './ApprovalModals'

/* ── 부서 문서함 관리 뷰 ── */
interface DeptFolder { id: number; name: string; createdAt: string; docCount: number; checked: boolean }

export default function DeptBoxManageView() {
  const [tab, setTab] = useState<'문서함' | '자동분류'>('문서함')
  const [folders, setFolders] = useState<DeptFolder[]>([])
  const [managers, setManagers] = useState<string[]>([])
  const [orgPickerOpen, setOrgPickerOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const allChecked = folders.length > 0 && folders.every((f) => f.checked)
  const someChecked = folders.some((f) => f.checked)
  const toggleAll = () => setFolders((p) => p.map((f) => ({ ...f, checked: !allChecked })))
  const toggleOne = (id: number) => setFolders((p) => p.map((f) => f.id === id ? { ...f, checked: !f.checked } : f))
  const addFolder = () => { if (!newFolderName.trim()) return; setFolders((p) => [...p, { id: Date.now(), name: newFolderName.trim(), createdAt: new Date().toISOString().slice(0, 10), docCount: 0, checked: false }]); setNewFolderName(''); setAddOpen(false) }
  const deleteChecked = () => setFolders((p) => p.filter((f) => !f.checked))
  const onDragStart = (idx: number) => setDragIdx(idx)
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); if (dragIdx === null || dragIdx === idx) return; setFolders((p) => { const n = [...p]; const [item] = n.splice(dragIdx, 1); n.splice(idx, 0, item); return n }); setDragIdx(idx) }
  const onDragEnd = () => setDragIdx(null)

  return (
    <div className="p-6">
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">부서 문서함 관리</h1>
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        {(['문서함', '자동분류'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-[13px] transition-colors ${tab === t ? 'text-gray-900 font-bold border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
        ))}
      </div>
      {tab === '문서함' ? (<>
        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-[13px] text-gray-700 font-medium">부서 문서함 담당자</span>
          {managers.map((m, i) => (
            <span key={i} className="text-[12px] bg-white border border-gray-200 rounded px-2 py-0.5 flex items-center gap-1">{m}<button onClick={() => setManagers((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 text-[10px]">&times;</button></span>
          ))}
          <button onClick={() => setOrgPickerOpen(true)} className="text-[12px] text-[#1D9E75] hover:underline">+ 담당자 추가</button>
        </div>
        {orgPickerOpen && (
          <OrgPickerModal
            title="담당자 선택"
            onClose={() => setOrgPickerOpen(false)}
            onSelect={(name) => {
              if (!managers.includes(name)) setManagers((p) => [...p, name])
              setOrgPickerOpen(false)
            }}
          />
        )}
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => setReorderMode(!reorderMode)} className="text-[12px] text-gray-600 hover:text-[#1D9E75] flex items-center gap-1"><i className="fas fa-sort text-[10px]" /> {reorderMode ? '순서 완료' : '순서 바꾸기'}</button>
          <button onClick={() => setAddOpen(true)} className="text-[12px] text-gray-600 hover:text-[#1D9E75] flex items-center gap-1">+ 추가</button>
          <button onClick={deleteChecked} disabled={!someChecked} className={`text-[12px] flex items-center gap-1 ${someChecked ? 'text-gray-600 hover:text-red-500' : 'text-gray-300 cursor-not-allowed'}`}><i className="fas fa-trash-alt text-[10px]" /> 삭제</button>
          <button className="text-[12px] text-gray-600 hover:text-[#1D9E75] flex items-center gap-1"><i className="far fa-clone text-[10px]" /> 문서함 이관</button>
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
              {folders.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center">
                  <div className="text-gray-300 text-[40px] mb-3"><i className="far fa-folder-open" /></div>
                  <div className="text-[13px] text-gray-400">문서함이 없습니다.</div>
                </td></tr>
              ) : folders.map((f, idx) => (
                <tr key={f.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${reorderMode ? 'cursor-grab' : ''}`}
                  draggable={reorderMode} onDragStart={() => onDragStart(idx)} onDragOver={(e) => onDragOver(e, idx)} onDragEnd={onDragEnd}>
                  <td className="py-2.5 px-3">{reorderMode ? <i className="fas fa-grip-vertical text-gray-400" /> : <input type="checkbox" checked={f.checked} onChange={() => toggleOne(f.id)} className="accent-[#1D9E75]" />}</td>
                  <td className="py-2.5 px-3 text-gray-800">{f.name}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500">{f.createdAt}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500">{f.docCount}</td>
                  <td className="py-2.5 px-3 text-right"><button className="text-gray-400 hover:text-gray-600"><i className="fas fa-cog text-[11px]" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>) : (
        <div className="text-[13px] text-gray-400 text-center py-16">자동분류 설정은 준비 중입니다.</div>
      )}
    </div>
  )
}
