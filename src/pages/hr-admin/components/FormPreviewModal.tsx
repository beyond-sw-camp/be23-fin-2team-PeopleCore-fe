import type { FieldConfig } from './EmployeeRegisterFormConfig'

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1D9E75] transition-colors w-full'

function PreviewField({ field }: { field: FieldConfig }) {
  const label = (
    <label className="text-xs font-medium text-gray-500">
      {field.label}
      {field.required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )

  // 프로필 사진 — 실제 사원등록 화면과 동일한 원형 아바타 + 업로드 버튼 형태
  if (field.fieldKey === 'profileImage') {
    return (
      <div className="col-span-2 flex items-center gap-5">
        <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
          <i className="fas fa-user text-3xl text-gray-300"></i>
        </div>
        <div className="flex flex-col gap-2">
          {label}
          <button
            type="button"
            disabled
            className="border border-gray-200 bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-medium self-start"
          >
            <i className="fas fa-camera text-[11px] mr-1.5"></i>
            사진 업로드
          </button>
          <span className="text-[11px] text-gray-400">JPG / PNG · 5MB 이하 · 권장 1:1 비율</span>
        </div>
      </div>
    )
  }

  switch (field.fieldType) {
    case 'TEXT':
    case 'NUMBER':
    case 'SEARCH':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input
            className={inputClass}
            placeholder={field.fieldType === 'SEARCH' ? `${field.label} 검색` : `${field.label} 입력`}
            type={field.fieldType === 'NUMBER' ? 'number' : 'text'}
            disabled
          />
        </div>
      )
    case 'DATE':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input type="date" className={inputClass} disabled />
        </div>
      )
    case 'SELECT':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <select className={inputClass} disabled>
            <option>{field.options?.[0] || '선택'}</option>
          </select>
        </div>
      )
    case 'RADIO':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <div className="flex gap-2">
            {(field.options || ['옵션 1', '옵션 2']).map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                {opt}
              </div>
            ))}
          </div>
        </div>
      )
    case 'TEXTAREA':
      return (
        <div className="flex flex-col gap-1 col-span-2">
          {label}
          <textarea className={`${inputClass} h-20 resize-none`} placeholder={`${field.label} 입력`} disabled />
        </div>
      )
    case 'FILE':
      return (
        <div className="flex flex-col gap-1 col-span-2">
          {label}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
            <i className="fas fa-cloud-upload-alt text-xl text-gray-300 mb-1"></i>
            <div className="text-xs text-gray-400">파일을 드래그하거나 클릭하여 업로드</div>
          </div>
        </div>
      )
    case 'AUTO':
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input className={`${inputClass} bg-gray-100 text-gray-400`} placeholder="자동입력" disabled />
        </div>
      )
    default:
      return (
        <div className="flex flex-col gap-1">
          {label}
          <input className={inputClass} placeholder={`${field.label} 입력`} disabled />
        </div>
      )
  }
}

interface Props {
  title: string
  sections: string[]
  fields: FieldConfig[]
  onClose: () => void
}

export default function FormPreviewModal({ title, sections, fields, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-gray-100 rounded-2xl w-[820px] mx-4 max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* 헤더 */}
        <div className="bg-white px-7 pt-5 pb-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <i className="fas fa-eye text-[#1D9E75] text-sm"></i>
              <h3 className="text-[15px] font-bold text-gray-900">미리보기</h3>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">실제 화면과 유사하게 표시</span>
            </div>
            <p className="text-[11px] text-gray-400">현재 설정된 구성으로 {title} 화면이 어떻게 보이는지 확인합니다</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* 미리보기 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 페이지 헤더 모킹 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
            <div className="text-xs text-gray-400 mb-1">
              인사관리 › <span className="text-[#1D9E75] font-medium">{title}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          </div>

          {/* 섹션별 렌더링 */}
          {sections.map(section => {
            const sectionFields = fields
              .filter(f => f.section === section && f.visible)
              .sort((a, b) => a.sortOrder - b.sortOrder)

            if (sectionFields.length === 0) return null

            const hasFileOrTextarea = sectionFields.some(f => f.fieldType === 'FILE' || f.fieldType === 'TEXTAREA')

            return (
              <div key={section} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-3">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">{section}</span>
                  {sectionFields.some(f => f.required) && (
                    <span className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">필수</span>
                  )}
                </div>
                <div className={`grid gap-x-5 gap-y-4 ${hasFileOrTextarea ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {sectionFields.map(field => (
                    <PreviewField key={field.fieldKey} field={field} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* 하단 버튼 모킹 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-3.5 flex items-center justify-end gap-2">
            <button className="border border-gray-200 bg-white text-gray-500 px-4 py-2 rounded-lg text-xs" disabled>취소</button>
            <button className="bg-[#1D9E75] text-white px-5 py-2 rounded-lg text-xs font-medium opacity-80" disabled>
              <i className="fas fa-check mr-1.5 text-[10px]"></i>등록 완료
            </button>
          </div>
        </div>

        {/* 하단 */}
        <div className="bg-white px-7 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>표시 필드: <strong className="text-[#1D9E75]">{fields.filter(f => f.visible).length}</strong>개</span>
            <span>필수 필드: <strong className="text-red-400">{fields.filter(f => f.required).length}</strong>개</span>
            <span>숨김 필드: <strong className="text-gray-500">{fields.filter(f => !f.visible).length}</strong>개</span>
          </div>
          <button onClick={onClose} className="px-5 py-2 text-[12px] font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors">
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
