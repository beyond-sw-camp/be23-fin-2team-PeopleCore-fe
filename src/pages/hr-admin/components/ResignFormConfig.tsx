import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { FieldConfig } from './EmployeeRegisterFormConfig'
import { EMP_AUTO_FILL_FIELDS, SortableRow, resToFieldConfig, fieldToReq } from './EmployeeRegisterFormConfig'
import FormPreviewModal from './FormPreviewModal'
import { formSetupApi } from '../../../api/formConfig'

const FIELD_TYPE_LABEL: Record<string, string> = {
  TEXT: '텍스트', DATE: '날짜', SELECT: '셀렉트', NUMBER: '숫자',
  TEXTAREA: '장문', RADIO: '라디오', FILE: '파일', AUTO: '자동입력', SEARCH: '검색',
}

const FIELD_TYPES: FieldConfig['fieldType'][] = ['TEXT', 'DATE', 'SELECT', 'NUMBER', 'TEXTAREA', 'RADIO', 'FILE']

const DEFAULT_FIELDS: FieldConfig[] = [
  // ① 대상자
  { fieldKey: 'empSearch',    label: '사원 검색',    section: '대상자',    fieldType: 'SEARCH', visible: true, required: true,  sortOrder: 1 },
  { fieldKey: 'department',   label: '부서',         section: '대상자',    fieldType: 'TEXT', visible: true, required: true,  sortOrder: 2, autoFillFrom: 'department' },
  { fieldKey: 'rank',         label: '직급',         section: '대상자',    fieldType: 'TEXT', visible: true, required: true,  sortOrder: 3, autoFillFrom: 'rank' },
  { fieldKey: 'hireDate',     label: '입사일',       section: '대상자',    fieldType: 'TEXT', visible: true, required: true,  sortOrder: 4, autoFillFrom: 'hireDate' },

  // ② 퇴직 정보
  { fieldKey: 'resignDate',   label: '퇴직일',       section: '퇴직 정보', fieldType: 'DATE',   visible: true, required: true,  sortOrder: 1 },
  { fieldKey: 'resignType',   label: '퇴직 사유',    section: '퇴직 정보', fieldType: 'SELECT', visible: true, required: true,  sortOrder: 2, options: ['자진퇴사', '권고사직', '정년퇴직', '계약만료', '기타'] },
  { fieldKey: 'resignDetail', label: '상세 사유',    section: '퇴직 정보', fieldType: 'TEXTAREA', visible: true, required: false, sortOrder: 3 },

  // ③ 인수인계 체크리스트
  { fieldKey: 'handoverWork',    label: '업무 인수인계 완료', section: '인수인계 현황', fieldType: 'RADIO', visible: true, required: false, sortOrder: 1 },
  { fieldKey: 'handoverEquip',   label: '장비 반납',         section: '인수인계 현황', fieldType: 'RADIO', visible: true, required: false, sortOrder: 2 },
  { fieldKey: 'handoverAccount', label: '계정 비활성화',      section: '인수인계 현황', fieldType: 'RADIO', visible: true, required: false, sortOrder: 3 },
  { fieldKey: 'handoverPay',     label: '퇴직금 정산',       section: '인수인계 현황', fieldType: 'RADIO', visible: true, required: false, sortOrder: 4 },
]

const SECTIONS = ['대상자', '퇴직 정보', '인수인계 현황']

interface AddFieldForm {
  label: string
  fieldKey: string
  fieldType: FieldConfig['fieldType']
  section: string
  required: boolean
  options: string
  autoFill: boolean
  autoFillFrom: string
}

const EMPTY_ADD_FORM: AddFieldForm = { label: '', fieldKey: '', fieldType: 'TEXT', section: '', required: false, options: '', autoFill: false, autoFillFrom: '' }

interface Props {
  onBack: () => void
}

export default function ResignFormConfig({ onBack }: Props) {
  const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS)
  const [_loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [addModal, setAddModal] = useState<{ open: boolean; section: string }>({ open: false, section: '' })
  const [addForm, setAddForm] = useState<AddFieldForm>(EMPTY_ADD_FORM)
  const [addError, setAddError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    formSetupApi.getSetup('RESIGN_REGISTER')
      .then(res => {
        const list: FieldConfig[] = []
        for (const item of res.data) { list.push(resToFieldConfig(item)) }
        if (list.length > 0) setFields(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openAddModal = (section: string) => {
    setAddForm({ ...EMPTY_ADD_FORM, section })
    setAddError('')
    setAddModal({ open: true, section })
  }

  const handleAddField = () => {
    if (!addForm.label.trim()) { setAddError('필드명을 입력하세요.'); return }
    if (!addForm.fieldKey.trim()) { setAddError('필드 키를 입력하세요.'); return }
    if (fields.some(f => f.fieldKey === addForm.fieldKey.trim())) { setAddError('이미 존재하는 필드 키입니다.'); return }

    const sectionFields = fields.filter(f => f.section === addForm.section)
    const maxOrder = sectionFields.length > 0 ? Math.max(...sectionFields.map(f => f.sortOrder)) : 0

    const newField: FieldConfig = {
      fieldKey: addForm.fieldKey.trim(),
      label: addForm.label.trim(),
      section: addForm.section,
      fieldType: addForm.fieldType,
      visible: true,
      required: addForm.required,
      sortOrder: maxOrder + 1,
      options: addForm.fieldType === 'SELECT' && addForm.options.trim() ? addForm.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      autoFillFrom: addForm.autoFill ? addForm.autoFillFrom : undefined,
    }

    setFields(prev => [...prev, newField])
    setHasChanges(true)
    setAddModal({ open: false, section: '' })
  }

  const toggleAutoFill = (fieldKey: string) => {
    setFields(prev => prev.map(f => {
      if (f.fieldKey !== fieldKey) return f
      if (f.autoFillFrom) return { ...f, autoFillFrom: undefined }
      return { ...f, autoFillFrom: EMP_AUTO_FILL_FIELDS[0].key, required: true }
    }))
    setHasChanges(true)
  }

  const changeAutoFillFrom = (fieldKey: string, empField: string) => {
    setFields(prev => prev.map(f => f.fieldKey === fieldKey ? { ...f, autoFillFrom: empField } : f))
    setHasChanges(true)
  }

  const deleteField = (fieldKey: string) => {
    const field = fields.find(f => f.fieldKey === fieldKey)
    if (!field) return
    if (!window.confirm(`'${field.label}' 필드를 삭제하시겠습니까?`)) return
    setFields(prev => prev.filter(f => f.fieldKey !== fieldKey))
    setHasChanges(true)
  }

  const changeFieldType = (fieldKey: string, newType: FieldConfig['fieldType']) => {
    setFields(prev => prev.map(f => f.fieldKey === fieldKey ? { ...f, fieldType: newType, options: newType === 'SELECT' ? (f.options || []) : undefined } : f))
    setHasChanges(true)
  }

  const toggleVisible = (fieldKey: string) => {
    setFields(prev => prev.map(f => f.fieldKey === fieldKey ? { ...f, visible: !f.visible, required: !f.visible ? f.required : false } : f))
    setHasChanges(true)
  }

  const toggleRequired = (fieldKey: string) => {
    setFields(prev => prev.map(f => f.fieldKey === fieldKey && f.visible && !f.autoFillFrom ? { ...f, required: !f.required } : f))
    setHasChanges(true)
  }

  const startEditLabel = (fieldKey: string, currentLabel: string) => {
    setEditingField(fieldKey)
    setEditLabel(currentLabel)
  }

  const saveLabel = () => {
    if (editingField && editLabel.trim()) {
      setFields(prev => prev.map(f => f.fieldKey === editingField ? { ...f, label: editLabel.trim() } : f))
      setHasChanges(true)
    }
    setEditingField(null)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (section: string) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setFields(prev => {
      const next = [...prev]
      const sectionFields = next.filter(f => f.section === section).sort((a, b) => a.sortOrder - b.sortOrder)
      const oldIdx = sectionFields.findIndex(f => f.fieldKey === active.id)
      const newIdx = sectionFields.findIndex(f => f.fieldKey === over.id)
      if (oldIdx < 0 || newIdx < 0) return prev
      const ordered = [...sectionFields]
      const [moved] = ordered.splice(oldIdx, 1)
      ordered.splice(newIdx, 0, moved)
      ordered.forEach((f, i) => {
        const target = next.find(nf => nf.fieldKey === f.fieldKey)!
        target.sortOrder = i + 1
      })
      setHasChanges(true)
      return next
    })
  }

  const handleSave = () => {
    const reqs = fields.filter(f => !f.locked).map(fieldToReq)
    formSetupApi.saveSetup('RESIGN_REGISTER', reqs)
      .then(res => {
        const list: FieldConfig[] = []
        for (const item of res.data) { list.push(resToFieldConfig(item)) }
        if (list.length > 0) setFields(list)
        alert('폼 구성이 저장되었습니다.')
        setHasChanges(false)
      })
      .catch(() => alert('저장에 실패했습니다.'))
  }

  const handleReset = () => {
    if (!window.confirm('기본 설정으로 초기화하시겠습니까?\n변경사항이 모두 사라집니다.')) return
    formSetupApi.resetSetup('RESIGN_REGISTER')
      .then(res => {
        const list: FieldConfig[] = []
        for (const item of res.data) { list.push(resToFieldConfig(item)) }
        if (list.length > 0) setFields(list)
        setHasChanges(false)
      })
      .catch(() => { setFields(DEFAULT_FIELDS); setHasChanges(false) })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <i className="fas fa-arrow-left text-sm"></i>
        </button>
        <h3 className="text-[16px] font-bold text-gray-800">퇴직 처리 폼 설정</h3>
      </div>
      <p className="text-[12px] text-gray-400 mb-5 ml-10">퇴직 처리 시 입력받을 항목을 설정합니다. 회사 상황에 맞게 필드를 커스텀할 수 있습니다.</p>

      <div className="bg-blue-50 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
        <i className="fas fa-info-circle text-blue-400 text-sm mt-0.5"></i>
        <div className="text-[11px] text-blue-700 space-y-0.5">
          <p>필드를 <strong className="font-semibold">숨김</strong> 처리하면 퇴직 처리 화면에서 해당 항목이 표시되지 않습니다.</p>
        </div>
      </div>

      <div className="space-y-5">
        {SECTIONS.map(section => {
          const sectionFields = fields.filter(f => f.section === section).sort((a, b) => a.sortOrder - b.sortOrder)
          return (
            <div key={section} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-800">{section}</span>
                  <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {sectionFields.filter(f => f.visible).length}/{sectionFields.length} 표시
                  </span>
                </div>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(section)}>
              <SortableContext items={sectionFields.map(f => f.fieldKey)} strategy={verticalListSortingStrategy}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-white">
                    <th className="w-8"></th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 w-10">순서</th>
                    <th className="text-left px-3 py-2.5 text-[11px] font-medium text-gray-400">필드명</th>
                    <th className="text-left px-3 py-2.5 text-[11px] font-medium text-gray-400 w-20">입력방식</th>
                    <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-400 w-16">표시</th>
                    <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-400 w-16">필수</th>
                    <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-400 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {sectionFields.map((field, idx) => (
                    <SortableRow key={field.fieldKey} id={field.fieldKey} className={!field.visible ? 'bg-gray-50/50' : 'hover:bg-gray-50/50'}>
                      {(listeners) => (<>
                      <td className="pl-2 pr-0 py-2.5 text-center">
                        <button {...listeners} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                          <i className="fas fa-grip-vertical text-[10px]"></i>
                        </button>
                      </td>
                      <td className="px-5 py-2.5 text-[12px] text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {editingField === field.fieldKey ? (
                            <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)} onBlur={saveLabel}
                              onKeyDown={e => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') setEditingField(null) }}
                              className="text-[12px] border border-[#1D9E75] rounded px-2 py-1 outline-none w-36" />
                          ) : (
                            <button onClick={() => startEditLabel(field.fieldKey, field.label)}
                              className={`text-[12px] font-medium hover:text-[#1D9E75] transition-colors text-left ${!field.visible ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                              title="클릭하여 라벨 수정">{field.label}</button>
                          )}
                          <span className="text-[10px] text-gray-300 font-mono">{field.fieldKey}</span>
                        </div>
                        {field.fieldKey !== 'empSearch' && (
                          <div className="flex items-center gap-1.5 mt-1.5" onClick={e => e.stopPropagation()}>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={!!field.autoFillFrom} onChange={() => toggleAutoFill(field.fieldKey)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                              <span className={`text-[10px] ${field.autoFillFrom ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>자동입력</span>
                            </label>
                            {field.autoFillFrom && (
                              <select value={field.autoFillFrom} onChange={e => changeAutoFillFrom(field.fieldKey, e.target.value)}
                                className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 outline-none focus:border-blue-400 cursor-pointer">
                                {EMP_AUTO_FILL_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                              </select>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <select value={field.fieldType} onChange={e => changeFieldType(field.fieldKey, e.target.value as FieldConfig['fieldType'])}
                          className="text-[10px] bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 outline-none focus:border-[#1D9E75] cursor-pointer hover:border-[#1D9E75] transition-colors text-gray-500">
                          {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => toggleVisible(field.fieldKey)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${field.visible ? 'bg-[#1D9E75]' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.visible ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => toggleRequired(field.fieldKey)} disabled={!field.visible || !!field.autoFillFrom}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            !field.visible || !!field.autoFillFrom ? 'border-gray-200 cursor-not-allowed' :
                            field.required ? 'border-[#1D9E75] bg-[#1D9E75] cursor-pointer' : 'border-gray-300 cursor-pointer hover:border-[#1D9E75]'
                          }`}>
                          {field.required && <i className="fas fa-check text-white text-[8px]"></i>}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => deleteField(field.fieldKey)}
                          className="w-6 h-6 rounded text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors flex items-center justify-center" title="필드 삭제">
                          <i className="fas fa-trash-alt text-[10px]"></i></button>
                      </td>
                      </>)}
                    </SortableRow>
                  ))}
                </tbody>
              </table>
              </SortableContext>
              </DndContext>
              <div className="px-5 py-2.5 bg-white border-t border-gray-100">
                <button onClick={() => openAddModal(section)} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#1D9E75] transition-colors">
                  <i className="fas fa-plus text-[9px]"></i>필드 추가</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 bg-[#f8fcfa] border border-[#d0ede2] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <i className="fas fa-eye text-[#1D9E75] text-xs"></i>
          <span className="text-[12px] font-semibold text-gray-800">현재 구성 요약</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {SECTIONS.map(section => {
            const sf = fields.filter(f => f.section === section)
            return (
              <div key={section} className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-[11px] font-medium text-gray-700 mb-1.5">{section}</div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-[#1D9E75]">표시 {sf.filter(f => f.visible).length}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-red-400">필수 {sf.filter(f => f.required).length}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">전체 {sf.length}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button onClick={handleReset} className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
          <i className="fas fa-undo text-[10px]"></i>기본값으로 초기화</button>
        <div className="flex items-center gap-2">
          {hasChanges && <span className="text-[11px] text-amber-500 flex items-center gap-1"><i className="fas fa-exclamation-circle text-[10px]"></i>저장하지 않은 변경사항이 있습니다</span>}
          <button onClick={() => setShowPreview(true)} className="px-4 py-2 text-[12px] text-[#1D9E75] border border-[#1D9E75] rounded-lg hover:bg-[#f2faf6] transition-colors flex items-center gap-1.5">
            <i className="fas fa-eye text-[10px]"></i>미리보기</button>
          <button onClick={onBack} className="px-4 py-2 text-[12px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
          <button onClick={handleSave} className="px-5 py-2 text-[12px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors">
            <i className="fas fa-save mr-1.5 text-[10px]"></i>저장</button>
        </div>
      </div>

      {addModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddModal({ open: false, section: '' })} />
          <div className="relative bg-white rounded-xl shadow-xl w-[440px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">필드 추가</h3>
                <p className="text-[11px] text-gray-400 mt-0.5"><span className="text-[#1D9E75] font-medium">{addModal.section}</span> 섹션에 새 필드를 추가합니다</p>
              </div>
              <button onClick={() => setAddModal({ open: false, section: '' })} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">필드명 <span className="text-red-500">*</span></label>
                <input type="text" value={addForm.label} onChange={e => setAddForm(prev => ({ ...prev, label: e.target.value }))} placeholder="예) 퇴직금 정산일" className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]" autoFocus />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">필드 키 <span className="text-red-500">*</span></label>
                <input type="text" value={addForm.fieldKey} onChange={e => setAddForm(prev => ({ ...prev, fieldKey: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))} placeholder="예) severanceDate" className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75] font-mono" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">입력방식 <span className="text-red-500">*</span></label>
                <select value={addForm.fieldType} onChange={e => setAddForm(prev => ({ ...prev, fieldType: e.target.value as FieldConfig['fieldType'] }))} className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]">
                  {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
                </select>
              </div>
              {addForm.fieldType === 'SELECT' && (
                <div className="flex items-start gap-3">
                  <label className="text-[12px] text-gray-500 w-20 shrink-0 mt-1.5">선택지</label>
                  <div className="flex-1">
                    <input type="text" value={addForm.options} onChange={e => setAddForm(prev => ({ ...prev, options: e.target.value }))} placeholder="옵션1, 옵션2, 옵션3" className="w-full text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]" />
                    <p className="text-[10px] text-gray-400 mt-1">쉼표(,)로 구분하여 입력</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">자동입력</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addForm.autoFill}
                      onChange={e => setAddForm(prev => ({ ...prev, autoFill: e.target.checked, autoFillFrom: e.target.checked ? EMP_AUTO_FILL_FIELDS[0].key : '' }))}
                      className="w-3.5 h-3.5 accent-blue-500"
                    />
                    <span className="text-[12px] text-gray-700">사원 검색 시</span>
                  </label>
                  {addForm.autoFill && (
                    <select
                      value={addForm.autoFillFrom}
                      onChange={e => setAddForm(prev => ({ ...prev, autoFillFrom: e.target.value }))}
                      className="text-[12px] text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 outline-none focus:border-blue-400"
                    >
                      {EMP_AUTO_FILL_FIELDS.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">필수 여부</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={addForm.required} onChange={e => setAddForm(prev => ({ ...prev, required: e.target.checked }))} className="w-3.5 h-3.5 accent-[#1D9E75]" />
                  <span className="text-[12px] text-gray-700">필수 입력</span>
                </label>
              </div>
              {addError && <p className="text-[11px] text-red-500 flex items-center gap-1"><i className="fas fa-exclamation-circle text-[10px]"></i>{addError}</p>}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setAddModal({ open: false, section: '' })} className="px-4 py-2 text-[12px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleAddField} className="px-5 py-2 text-[12px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65]">추가</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <FormPreviewModal title="퇴직 처리" sections={SECTIONS} fields={fields} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
