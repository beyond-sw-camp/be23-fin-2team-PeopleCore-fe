import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FormPreviewModal from './FormPreviewModal'
import { formSetupApi } from '../../../api/formConfig'
import type { FormFieldSetupRes } from '../../../api/formConfig'

export interface FieldConfig {
  fieldKey: string
  label: string
  section: string
  fieldType: 'TEXT' | 'DATE' | 'SELECT' | 'NUMBER' | 'TEXTAREA' | 'RADIO' | 'FILE' | 'AUTO' | 'SEARCH'
  visible: boolean
  required: boolean
  sortOrder: number
  locked?: boolean       // true면 표시/필수 변경 불가 (핵심 필드)
  options?: string[]     // SELECT일 때 선택지
  autoFillFrom?: string  // 사원 검색 시 자동입력할 사원 정보 필드 (예: 'department')
}

// 사원 정보에서 자동입력 가능한 필드 목록
export const EMP_AUTO_FILL_FIELDS = [
  { key: 'empName',      label: '성명' },
  { key: 'empNameEn',    label: '영문명' },
  { key: 'birthDate',    label: '생년월일' },
  { key: 'gender',       label: '성별' },
  { key: 'phone',        label: '연락처' },
  { key: 'personalEmail',label: '개인 이메일' },
  { key: 'hireDate',     label: '입사일' },
  { key: 'employType',   label: '고용 형태' },
  { key: 'department',   label: '부서' },
  { key: 'rank',         label: '직급' },
  { key: 'position',     label: '직책' },
]

// 드래그앤드롭 행 컴포넌트 (공통)
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
export function SortableRow({ id, children, className }: { id: string; children: (listeners: SyntheticListenerMap | undefined) => React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <tr ref={setNodeRef} style={style} {...attributes} className={`border-b border-gray-50 transition-colors ${className || ''} ${isDragging ? 'bg-[#f2faf6] shadow-sm' : ''}`}>
      {children(listeners)}
    </tr>
  )
}

// API 응답 → FieldConfig 변환
export function resToFieldConfig(res: FormFieldSetupRes): FieldConfig {
  return {
    fieldKey: res.fieldKey,
    label: res.label,
    section: res.section,
    fieldType: res.fieldType as FieldConfig['fieldType'],
    visible: res.visible,
    required: res.required,
    sortOrder: res.sortOrder,
    options: res.options || undefined,
    autoFillFrom: res.autoFillFrom || undefined,
    locked: res.locked || undefined,
  }
}

// FieldConfig → API 요청 변환
export function fieldToReq(field: FieldConfig) {
  return {
    fieldKey: field.fieldKey,
    label: field.label,
    section: field.section,
    fieldType: field.fieldType,
    visible: field.visible,
    required: field.required,
    sortOrder: field.sortOrder,
    options: field.options || null,
    autoFillFrom: field.autoFillFrom || null,
  }
}

// 사원등록 폼의 기본 필드 구성 (EmployeeRegister.tsx 기반)
export const DEFAULT_FIELDS: FieldConfig[] = [
  // ① 기본 인적사항
  { fieldKey: 'empName',      label: '성명',        section: '기본 인적사항',      fieldType: 'TEXT',   visible: true,  required: true,  sortOrder: 1 },
  { fieldKey: 'empNameEn',    label: '영문명',      section: '기본 인적사항',      fieldType: 'TEXT',   visible: true,  required: true,  sortOrder: 2 },
  { fieldKey: 'birthDate',    label: '생년월일',     section: '기본 인적사항',      fieldType: 'DATE',   visible: true,  required: true,  sortOrder: 3 },
  { fieldKey: 'gender',       label: '성별',        section: '기본 인적사항',      fieldType: 'RADIO',  visible: true,  required: true,  sortOrder: 4 },
  { fieldKey: 'phone',        label: '연락처',      section: '기본 인적사항',      fieldType: 'TEXT',   visible: true,  required: true,  sortOrder: 5 },
  { fieldKey: 'personalEmail',label: '개인 이메일',  section: '기본 인적사항',      fieldType: 'TEXT',   visible: true,  required: true,  sortOrder: 6 },
  { fieldKey: 'address',      label: '주소',        section: '기본 인적사항',      fieldType: 'TEXT',   visible: true,  required: true,  sortOrder: 7 },

  // ② 소속 및 고용 정보
  { fieldKey: 'hireDate',     label: '입사일',      section: '소속 및 고용 정보',   fieldType: 'DATE',   visible: true,  required: true,  sortOrder: 1 },
  { fieldKey: 'employType',   label: '고용 형태',   section: '소속 및 고용 정보',   fieldType: 'SELECT', visible: true,  required: true,  sortOrder: 2, options: ['정규직', '계약직'] },
  { fieldKey: 'contractEnd',  label: '계약 만료일',  section: '소속 및 고용 정보',   fieldType: 'DATE',   visible: true,  required: false, sortOrder: 3 },
  { fieldKey: 'department',   label: '부서',        section: '소속 및 고용 정보',   fieldType: 'SELECT', visible: true,  required: true,  sortOrder: 4 },
  { fieldKey: 'rank',         label: '직급',        section: '소속 및 고용 정보',   fieldType: 'SELECT', visible: true,  required: true,  sortOrder: 5 },
  { fieldKey: 'position',         label: '직책',        section: '소속 및 고용 정보',   fieldType: 'SELECT', visible: true,  required: true,  sortOrder: 6 },
  { fieldKey: 'insuranceJobType', label: '업종',        section: '소속 및 고용 정보',   fieldType: 'SELECT', visible: true,  required: true,  sortOrder: 7 },
  { fieldKey: 'workGroup',        label: '근무그룹',     section: '소속 및 고용 정보',   fieldType: 'SELECT', visible: true,  required: true,  sortOrder: 8 },

  // ③ 시스템 계정 설정
  { fieldKey: 'empId',        label: '사번',        section: '시스템 계정 설정',    fieldType: 'AUTO',   visible: true,  required: true,  sortOrder: 1 },
  { fieldKey: 'companyEmail', label: '사내 이메일',  section: '시스템 계정 설정',    fieldType: 'TEXT',   visible: true,  required: true,  sortOrder: 2 },
  { fieldKey: 'pwMethod',     label: '초기 비밀번호 발급 방식', section: '시스템 계정 설정', fieldType: 'RADIO', visible: true, required: true, sortOrder: 3 },

  // ④ 권한 설정
  { fieldKey: 'authTemplate', label: '권한',  section: '메뉴 / 기능 권한 설정', fieldType: 'SELECT', visible: true, required: true, sortOrder: 1, options: ['일반 사원', 'HR 담당자', '인사 최고 관리자'] },

  // ⑤ 인사 서류
  { fieldKey: 'documents',    label: '서류 첨부',   section: '인사 서류 등록',      fieldType: 'FILE',   visible: true,  required: false, sortOrder: 1 },
]

// 기본 필드는 입력방식 변경 불가 (사용자가 추가한 필드만 변경 가능)
const DEFAULT_FIELD_KEYS = new Set(DEFAULT_FIELDS.map(f => f.fieldKey))

const FIELD_TYPE_LABEL: Record<string, string> = {
  TEXT: '텍스트', DATE: '날짜', SELECT: '셀렉트', NUMBER: '숫자',
  TEXTAREA: '장문', RADIO: '라디오', FILE: '파일', AUTO: '자동생성', SEARCH: '검색',
}

const SECTIONS = ['기본 인적사항', '소속 및 고용 정보', '시스템 계정 설정', '메뉴 / 기능 권한 설정', '인사 서류 등록']

interface Props {
  onBack: () => void
}

const FIELD_TYPES: FieldConfig['fieldType'][] = ['TEXT', 'DATE', 'SELECT', 'NUMBER', 'TEXTAREA', 'RADIO', 'FILE']

interface AddFieldForm {
  label: string
  fieldKey: string
  fieldType: FieldConfig['fieldType']
  section: string
  required: boolean
  options: string
}

const EMPTY_ADD_FORM: AddFieldForm = { label: '', fieldKey: '', fieldType: 'TEXT', section: '', required: false, options: '' }

export default function EmployeeRegisterFormConfig({ onBack }: Props) {
  const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS)
  const [_loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [addModal, setAddModal] = useState<{ open: boolean; section: string }>({ open: false, section: '' })
  const [addForm, setAddForm] = useState<AddFieldForm>(EMPTY_ADD_FORM)
  const [addError, setAddError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // API에서 폼 설정 로드
  useEffect(() => {
    formSetupApi.getSetup('EMPLOYEE_REGISTER')
      .then(res => {
        const list: FieldConfig[] = []
        for (const item of res.data) { list.push(resToFieldConfig(item)) }
        if (list.length > 0) setFields(list)
      })
      .catch(() => { /* 백엔드 미연결 시 DEFAULT_FIELDS 유지 */ })
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
    }

    setFields(prev => [...prev, newField])
    setHasChanges(true)
    setAddModal({ open: false, section: '' })
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
      // 재정렬: sortOrder를 인덱스 순서대로 재배정
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
    formSetupApi.saveSetup('EMPLOYEE_REGISTER', reqs)
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
    formSetupApi.resetSetup('EMPLOYEE_REGISTER')
      .then(res => {
        const list: FieldConfig[] = []
        for (const item of res.data) { list.push(resToFieldConfig(item)) }
        if (list.length > 0) setFields(list)
        setHasChanges(false)
      })
      .catch(() => {
        setFields(DEFAULT_FIELDS)
        setHasChanges(false)
      })
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <i className="fas fa-arrow-left text-sm"></i>
        </button>
        <h3 className="text-[16px] font-bold text-gray-800">신규 사원 등록 폼 설정</h3>
      </div>
      <p className="text-[12px] text-gray-400 mb-5 ml-10">신규 사원 등록 시 입력받을 항목을 설정합니다. 회사 상황에 맞게 필드를 커스텀할 수 있습니다.</p>

      {/* 안내 배너 */}
      <div className="bg-blue-50 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
        <i className="fas fa-info-circle text-blue-400 text-sm mt-0.5"></i>
        <div className="text-[11px] text-blue-700 space-y-0.5">
          <p>필드를 <strong className="font-semibold">숨김</strong> 처리하면 사원 등록 화면에서 해당 항목이 표시되지 않습니다.</p>
          <p>필드명을 클릭하면 화면에 표시되는 <strong className="font-semibold">라벨을 수정</strong>할 수 있습니다.</p>
        </div>
      </div>

      {/* 섹션별 필드 설정 */}
      <div className="space-y-5">
        {SECTIONS.map(section => {
          const sectionFields = fields.filter(f => f.section === section).sort((a, b) => a.sortOrder - b.sortOrder)

          return (
            <div key={section} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* 섹션 헤더 */}
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-800">{section}</span>
                  <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {sectionFields.filter(f => f.visible).length}/{sectionFields.length} 표시
                  </span>
                </div>
              </div>

              {/* 필드 테이블 */}
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
                    <SortableRow key={field.fieldKey} id={field.fieldKey}>
                      {(listeners) => (<>
                      {/* 드래그 핸들 */}
                      <td className="pl-2 pr-0 py-2.5 text-center">
                        <button {...listeners} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                          <i className="fas fa-grip-vertical text-[10px]"></i>
                        </button>
                      </td>
                      {/* 순서 */}
                      <td className="px-5 py-2.5 text-[12px] text-gray-400 font-mono">{idx + 1}</td>

                      {/* 필드명 (클릭 시 수정) */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {editingField === field.fieldKey ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                autoFocus
                                value={editLabel}
                                onChange={e => setEditLabel(e.target.value)}
                                onBlur={saveLabel}
                                onKeyDown={e => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') setEditingField(null) }}
                                className="text-[12px] border border-[#1D9E75] rounded px-2 py-1 outline-none w-36"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditLabel(field.fieldKey, field.label)}
                              className={`text-[12px] font-medium hover:text-[#1D9E75] transition-colors text-left ${!field.visible ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                              title="클릭하여 라벨 수정"
                            >
                              {field.label}
                            </button>
                          )}
                          <span className="text-[10px] text-gray-300 font-mono">{field.fieldKey}</span>
                        </div>
                      </td>

                      {/* 입력방식 */}
                      <td className="px-3 py-2.5">
                        {DEFAULT_FIELD_KEYS.has(field.fieldKey) ? (
                          <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">
                            {FIELD_TYPE_LABEL[field.fieldType]}
                          </span>
                        ) : (
                          <select
                            value={field.fieldType}
                            onChange={e => changeFieldType(field.fieldKey, e.target.value as FieldConfig['fieldType'])}
                            className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 outline-none focus:border-[#1D9E75] cursor-pointer hover:border-[#1D9E75] transition-colors"
                          >
                            {FIELD_TYPES.map(t => (
                              <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* 표시 토글 */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => toggleVisible(field.fieldKey)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            field.visible ? 'bg-[#1D9E75]' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            field.visible ? 'translate-x-[18px]' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </td>

                      {/* 필수 토글 */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => toggleRequired(field.fieldKey)}
                          disabled={!field.visible || !!field.autoFillFrom}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            !field.visible || !!field.autoFillFrom ? 'border-gray-200 cursor-not-allowed' :
                            field.required ? 'border-[#1D9E75] bg-[#1D9E75] cursor-pointer' : 'border-gray-300 cursor-pointer hover:border-[#1D9E75]'
                          }`}
                        >
                          {field.required && <i className="fas fa-check text-white text-[8px]"></i>}
                        </button>
                      </td>

                      {/* 삭제 */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => deleteField(field.fieldKey)}
                          className="w-6 h-6 rounded text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors flex items-center justify-center"
                          title="필드 삭제"
                        >
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                      </td>
                      </>)}
                    </SortableRow>
                  ))}
                </tbody>
              </table>
              </SortableContext>
              </DndContext>

              {/* 필드 추가 버튼 */}
              <div className="px-5 py-2.5 bg-white border-t border-gray-100">
                <button
                  onClick={() => openAddModal(section)}
                  className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#1D9E75] transition-colors"
                >
                  <i className="fas fa-plus text-[9px]"></i>
                  필드 추가
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 미리보기 요약 */}
      <div className="mt-5 bg-[#f8fcfa] border border-[#d0ede2] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <i className="fas fa-eye text-[#1D9E75] text-xs"></i>
          <span className="text-[12px] font-semibold text-gray-800">현재 구성 요약</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {SECTIONS.map(section => {
            const sectionFields = fields.filter(f => f.section === section)
            const visibleCount = sectionFields.filter(f => f.visible).length
            const requiredCount = sectionFields.filter(f => f.required).length
            return (
              <div key={section} className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-[11px] font-medium text-gray-700 mb-1.5 truncate" title={section}>{section}</div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-[#1D9E75]">표시 {visibleCount}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-red-400">필수 {requiredCount}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">전체 {sectionFields.length}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleReset}
          className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
        >
          <i className="fas fa-undo text-[10px]"></i>
          기본값으로 초기화
        </button>
        <div className="flex items-center gap-2">
          {hasChanges && <span className="text-[11px] text-amber-500 flex items-center gap-1"><i className="fas fa-exclamation-circle text-[10px]"></i>저장하지 않은 변경사항이 있습니다</span>}
          <button onClick={() => setShowPreview(true)} className="px-4 py-2 text-[12px] text-[#1D9E75] border border-[#1D9E75] rounded-lg hover:bg-[#f2faf6] transition-colors flex items-center gap-1.5">
            <i className="fas fa-eye text-[10px]"></i>미리보기
          </button>
          <button onClick={onBack} className="px-4 py-2 text-[12px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
          <button onClick={handleSave} className="px-5 py-2 text-[12px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors">
            <i className="fas fa-save mr-1.5 text-[10px]"></i>저장
          </button>
        </div>
      </div>

      {/* 필드 추가 모달 */}
      {addModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddModal({ open: false, section: '' })} />
          <div className="relative bg-white rounded-xl shadow-xl w-[440px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">필드 추가</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  <span className="text-[#1D9E75] font-medium">{addModal.section}</span> 섹션에 새 필드를 추가합니다
                </p>
              </div>
              <button onClick={() => setAddModal({ open: false, section: '' })} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">필드명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={addForm.label}
                  onChange={e => setAddForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="예) 비상연락처"
                  className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">필드 키 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={addForm.fieldKey}
                  onChange={e => setAddForm(prev => ({ ...prev, fieldKey: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                  placeholder="예) emergencyContact"
                  className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75] font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">입력방식 <span className="text-red-500">*</span></label>
                <select
                  value={addForm.fieldType}
                  onChange={e => setAddForm(prev => ({ ...prev, fieldType: e.target.value as FieldConfig['fieldType'] }))}
                  className="flex-1 text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]"
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              {addForm.fieldType === 'SELECT' && (
                <div className="flex items-start gap-3">
                  <label className="text-[12px] text-gray-500 w-20 shrink-0 mt-1.5">선택지</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={addForm.options}
                      onChange={e => setAddForm(prev => ({ ...prev, options: e.target.value }))}
                      placeholder="옵션1, 옵션2, 옵션3"
                      className="w-full text-[12px] border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#1D9E75]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">쉼표(,)로 구분하여 입력</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 w-20 shrink-0">필수 여부</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.required}
                    onChange={e => setAddForm(prev => ({ ...prev, required: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-[#1D9E75]"
                  />
                  <span className="text-[12px] text-gray-700">필수 입력</span>
                </label>
              </div>
              {addError && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle text-[10px]"></i>{addError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setAddModal({ open: false, section: '' })} className="px-4 py-2 text-[12px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleAddField} className="px-5 py-2 text-[12px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65]">추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {showPreview && (
        <FormPreviewModal
          title="신규 사원 등록"
          sections={SECTIONS}
          fields={fields}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
