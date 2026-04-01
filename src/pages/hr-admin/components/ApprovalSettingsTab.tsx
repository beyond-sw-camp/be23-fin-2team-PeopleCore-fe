import { useState } from 'react'

type ApprovalSettingsView = 'form-manage' | 'delegation' | 'doc-number' | 'member-settings' | 'dept-docbox'

const MOCK_FORMS = [
  { id: 1, name: '휴가신청', code: 'LEAVE', folder: '인사', version: 1, isSystem: true, isCurrent: true, isActive: true, createdAt: '2025-01-01' },
  { id: 2, name: '지출결의', code: 'EXPENSE', folder: '일반', version: 1, isSystem: true, isCurrent: true, isActive: true, createdAt: '2025-01-01' },
  { id: 3, name: '채용요청', code: 'RECRUIT', folder: '인사', version: 1, isSystem: true, isCurrent: true, isActive: true, createdAt: '2025-01-01' },
  { id: 4, name: '해외출장신청', code: 'BIZ_TRIP', folder: '출장', version: 1, isSystem: true, isCurrent: true, isActive: true, createdAt: '2025-01-01' },
  { id: 5, name: '국내출장신청', code: 'DOM_TRIP', folder: '출장', version: 1, isSystem: true, isCurrent: true, isActive: true, createdAt: '2025-01-01' },
  { id: 6, name: '경조금지급신청', code: 'CONGRAT', folder: '일반', version: 2, isSystem: false, isCurrent: true, isActive: true, createdAt: '2025-06-15' },
]

const MOCK_DELEGATIONS = [
  { id: 1, from: '강희계 부장', to: '권시정 차장', dept: '경영', startAt: '2026-04-01', endAt: '2026-04-05', isActive: true, reason: '출장' },
  { id: 2, from: '박서준 팀장', to: '이민호 과장', dept: '개발', startAt: '2026-03-20', endAt: '2026-03-22', isActive: false, reason: '휴가' },
]

const APPROVAL_SETTING_MENUS: { key: ApprovalSettingsView; label: string }[] = [
  { key: 'form-manage', label: '결재 양식 관리' },
  { key: 'delegation', label: '결재 위임 정책' },
  { key: 'doc-number', label: '결재번호 규칙' },
  { key: 'member-settings', label: '사원 결재 환경 설정' },
  { key: 'dept-docbox', label: '부서 문서함' },
]

/* ── 결재 양식 관리 ── */
interface FormFolder { name: string; forms: string[]; expanded: boolean }

const INIT_FORM_FOLDERS: FormFolder[] = [
  { name: '차용증', forms: [], expanded: false },
  { name: '근태', forms: [], expanded: false },
  { name: '기안 및 지출', forms: ['시행문', '지출결의서', '경조금지급신청', '개인경비 사용내역서', '법인카드 품의서', '전도금 정산서'], expanded: true },
  { name: '인사', forms: ['휴가신청', '채용요청', '휴직원'], expanded: false },
  { name: '출장', forms: ['해외출장신청', '국내출장신청', '비자발급신청'], expanded: false },
]

interface FormSetting {
  name: string
  folder: string
  writePermission: '전체' | '부서' | '개인'
  isPublic: boolean
  retentionYears: number
  mobileDraft: boolean
  preApproval: boolean
  isActive: boolean
}

const ALL_FORM_SETTINGS: FormSetting[] = [
  { name: '시행문', folder: '기안 및 지출', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: true, preApproval: false, isActive: true },
  { name: '지출결의서', folder: '기안 및 지출', writePermission: '전체', isPublic: true, retentionYears: 10, mobileDraft: true, preApproval: false, isActive: true },
  { name: '경조금지급신청', folder: '기안 및 지출', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: false, preApproval: false, isActive: true },
  { name: '개인경비 사용내역서', folder: '기안 및 지출', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: false, preApproval: false, isActive: true },
  { name: '법인카드 품의서', folder: '기안 및 지출', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: true, preApproval: false, isActive: true },
  { name: '전도금 정산서', folder: '기안 및 지출', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: false, preApproval: false, isActive: true },
  { name: '휴가신청', folder: '인사', writePermission: '전체', isPublic: true, retentionYears: 3, mobileDraft: true, preApproval: true, isActive: true },
  { name: '채용요청', folder: '인사', writePermission: '부서', isPublic: false, retentionYears: 5, mobileDraft: false, preApproval: false, isActive: true },
  { name: '휴직원', folder: '인사', writePermission: '전체', isPublic: false, retentionYears: 5, mobileDraft: false, preApproval: false, isActive: true },
  { name: '해외출장신청', folder: '출장', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: false, preApproval: false, isActive: true },
  { name: '국내출장신청', folder: '출장', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: true, preApproval: false, isActive: true },
  { name: '비자발급신청', folder: '출장', writePermission: '전체', isPublic: true, retentionYears: 5, mobileDraft: false, preApproval: false, isActive: true },
]

function FormManageView() {
  const [folders, setFolders] = useState(INIT_FORM_FOLDERS)
  const [selectedFolder, setSelectedFolder] = useState('기안 및 지출')
  const [search, setSearch] = useState('')
  const [checkedForms, setCheckedForms] = useState<Set<string>>(new Set())
  const [folderVisible, setFolderVisible] = useState<'정상' | '숨김'>('정상')
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSettings, setBatchSettings] = useState(ALL_FORM_SETTINGS)

  const currentFolder = folders.find((f) => f.name === selectedFolder)
  const currentForms = currentFolder?.forms.filter((f) => !search || f.includes(search)) ?? []
  const allChecked = currentForms.length > 0 && currentForms.every((f) => checkedForms.has(f))

  const toggleFolder = (name: string) => setFolders((prev) => prev.map((f) => f.name === name ? { ...f, expanded: !f.expanded } : f))
  const toggleAllCheck = () => {
    if (allChecked) setCheckedForms(new Set())
    else setCheckedForms(new Set(currentForms))
  }
  const toggleCheck = (name: string) => setCheckedForms((prev) => { const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n })

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-5">결재 양식</h3>

      <div className="border border-gray-200 rounded-xl p-5">
        <h4 className="text-[14px] font-bold text-gray-800 mb-4">결재 양식 관리</h4>

        <div className="flex gap-6">
          {/* 왼쪽: 폴더 트리 */}
          <div className="w-[260px] shrink-0">
            <h5 className="text-[13px] font-semibold text-gray-800 mb-3">결재양식 폴더 목록</h5>
            <div className="flex items-center gap-1 mb-3">
              <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">폴더 추가</button>
              <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">수정</button>
              <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors text-red-500">삭제</button>
            </div>
            <div className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b border-gray-100">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="양식 제목을 입력하세요." className="text-[11px] outline-none bg-transparent w-full placeholder-gray-400" />
              </div>
              <div className="p-2 text-[12px] max-h-[400px] overflow-y-auto">
                {/* 회사 루트 */}
                <div className="flex items-center gap-1 py-1 px-1 text-gray-700 font-semibold select-none">
                  PeopleCore
                </div>
                {folders.map((folder) => (
                  <div key={folder.name} className="ml-2">
                    <div
                      className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer select-none transition-colors ${selectedFolder === folder.name ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => { setSelectedFolder(folder.name); toggleFolder(folder.name); setCheckedForms(new Set()) }}
                    >
                      <span className="text-[10px] text-gray-400 w-3">{folder.forms.length > 0 ? (folder.expanded ? '▼' : '▶') : ''}</span>
                      <span>{folder.name}</span>
                    </div>
                    {folder.expanded && folder.forms.map((form) => (
                      <div key={form}
                        className="ml-5 py-1 px-2 text-[11px] text-gray-600 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                        {form}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 선택된 폴더의 양식 목록 */}
          <div className="flex-1">
            <h5 className="text-[13px] font-semibold text-gray-800 mb-3">{selectedFolder}</h5>

            {/* 폴더 노출 여부 */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[12px] text-gray-500">폴더 노출 여부</span>
              <label className="flex items-center gap-1 text-[12px] cursor-pointer">
                <input type="radio" name="folderVisible" checked={folderVisible === '정상'} onChange={() => setFolderVisible('정상')} className="accent-[#1D9E75]" /> 정상
              </label>
              <label className="flex items-center gap-1 text-[12px] cursor-pointer">
                <input type="radio" name="folderVisible" checked={folderVisible === '숨김'} onChange={() => setFolderVisible('숨김')} className="accent-[#1D9E75]" /> 숨김
              </label>
              <button className="px-3 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 ml-2">저장</button>
            </div>

            {/* 양식 툴바 */}
            <div className="flex items-center gap-1 mb-3">
              <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">양식 추가</button>
              <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">양식 수정</button>
              <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors text-red-500">양식 삭제</button>
              <button className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">순서바꾸기</button>
              <button onClick={() => setBatchOpen(true)} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">일괄설정</button>
            </div>

            {/* 양식 테이블 */}
            <table className="w-full text-[12px]">
              <thead><tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 w-8"><input type="checkbox" checked={allChecked} onChange={toggleAllCheck} className="accent-[#1D9E75]" /></th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">제목</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">최종 수정자</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">운영자</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">작성권한</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용여부</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">모바일 기안 허용</th>
              </tr></thead>
              <tbody>
                {currentForms.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-[13px]">양식이 없습니다.</td></tr>
                ) : currentForms.map((form) => (
                  <tr key={form} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5"><input type="checkbox" checked={checkedForms.has(form)} onChange={() => toggleCheck(form)} className="accent-[#1D9E75]" /></td>
                    <td className="px-3 py-2.5 text-[#1D9E75] font-medium cursor-pointer hover:underline">{form}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">차장</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">-</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">전체</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">사용</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{form === '시행문' || form === '법인카드 품의서' ? '허용' : '비허용'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 일괄설정 화면 */}
      {batchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setBatchOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[95vw] max-w-[1200px] max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">일괄설정</h2>
              <button onClick={() => setBatchOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {/* 검색 */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-100">
              <span className="text-[12px] text-gray-700 font-medium">제목</span>
              <input className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none w-32" />
              <span className="text-[12px] text-gray-700 font-medium">작성자</span>
              <input className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none w-32" />
              <span className="text-[12px] text-gray-700 font-medium">사용여부</span>
              <select className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
                <option>전체</option><option>사용</option><option>미사용</option>
              </select>
              <button className="px-3 py-1.5 text-[12px] border border-gray-300 rounded hover:bg-gray-50">검색</button>
            </div>

            {/* 테이블 */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="w-full text-[11px] whitespace-nowrap">
                <thead><tr className="border-b-2 border-gray-900">
                  <th className="px-2 py-2.5 text-left text-gray-700 font-medium sticky left-0 bg-white min-w-[250px]">제목</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">작성 권한</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">공개여부</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">전결 옵션</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">보존연한</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">모바일 기안</th>
                  <th className="px-2 py-2.5 text-center text-gray-700 font-medium">사용여부</th>
                </tr></thead>
                <tbody>
                  {batchSettings.map((f, idx) => (
                    <tr key={f.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-2.5 text-gray-800 sticky left-0 bg-white font-medium">
                        PeopleCore&gt;{f.folder}&gt;{f.name}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <select value={f.writePermission} onChange={(e) => setBatchSettings((p) => p.map((s, i) => i === idx ? { ...s, writePermission: e.target.value as FormSetting['writePermission'] } : s))}
                          className="border border-gray-300 rounded px-1 py-0.5 text-[11px] outline-none">
                          <option>전체</option><option>부서</option><option>개인</option>
                        </select>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.isPublic} onChange={() => setBatchSettings((p) => p.map((s, i) => i === idx ? { ...s, isPublic: !s.isPublic } : s))} className="accent-[#1D9E75]" />
                          <span>{f.isPublic ? '공개' : '비공개'}</span>
                        </label>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.preApproval} onChange={() => setBatchSettings((p) => p.map((s, i) => i === idx ? { ...s, preApproval: !s.preApproval } : s))} className="accent-[#1D9E75]" />
                          <span>{f.preApproval ? '사용' : '미사용'}</span>
                        </label>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <select value={f.retentionYears} onChange={(e) => setBatchSettings((p) => p.map((s, i) => i === idx ? { ...s, retentionYears: Number(e.target.value) } : s))}
                          className="border border-gray-300 rounded px-1 py-0.5 text-[11px] outline-none">
                          {[1, 3, 5, 10, 30].map((y) => <option key={y} value={y}>{y}년</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.mobileDraft} onChange={() => setBatchSettings((p) => p.map((s, i) => i === idx ? { ...s, mobileDraft: !s.mobileDraft } : s))} className="accent-[#1D9E75]" />
                          <span>{f.mobileDraft ? '허용' : '비허용'}</span>
                        </label>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={f.isActive} onChange={() => setBatchSettings((p) => p.map((s, i) => i === idx ? { ...s, isActive: !s.isActive } : s))} className="accent-[#1D9E75]" />
                          <span>{f.isActive ? '사용' : '미사용'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 하단 버튼 */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setBatchOpen(false)} className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors">확인</button>
              <button onClick={() => setBatchOpen(false)} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 결재 위임 정책 ── */
function DelegationView() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">결재 위임 정책</h3>
      <p className="text-[12px] text-gray-400 mb-5">부재 기간 설정 시 지정 대리인에게 결재 권한을 자동 위임합니다.</p>

      <div className="flex justify-end mb-4">
        <button className="px-4 py-1.5 bg-[#1D9E75] text-white text-[12px] font-medium rounded-lg hover:bg-[#178a65] transition-colors flex items-center gap-1">
          <i className="fas fa-plus text-[10px]" /> 위임 등록
        </button>
      </div>

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">원 결재자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">위임 결재자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">위임 기간</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
        </tr></thead>
        <tbody>
          {MOCK_DELEGATIONS.map((d) => (
            <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800 font-medium">{d.from}</td>
              <td className="px-3 py-2.5 text-[#1D9E75] font-medium">{d.to}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.startAt} ~ {d.endAt}</td>
              <td className="px-3 py-2.5 text-gray-500">{d.reason}</td>
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.isActive ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-100 text-gray-500'}`}>{d.isActive ? '위임중' : '만료'}</span></td>
              <td className="px-3 py-2.5 text-right">
                {d.isActive && <button className="text-[11px] text-red-500 hover:underline">해제</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── 결재번호 규칙 ── */
function DocNumberView() {
  const [slot1, setSlot1] = useState('dept_code')
  const [slot2, setSlot2] = useState('form_code')
  const [slot3, setSlot3] = useState('YYYYMMDD')
  const [seqDigits, setSeqDigits] = useState(3)
  const [separator, setSeparator] = useState('-')
  const [customSlot1, setCustomSlot1] = useState('')
  const [customSlot2, setCustomSlot2] = useState('')
  const [seqReset, setSeqReset] = useState<'YEARLY' | 'MONTHLY' | 'NEVER'>('YEARLY')

  const slotOptions = [
    { value: 'company_name', label: '회사명', example: 'PeopleCore' },
    { value: 'dept_code', label: '부서코드', example: 'HR' },
    { value: 'dept_name', label: '부서명', example: '인사' },
    { value: 'form_code', label: '양식코드', example: 'LEAVE' },
    { value: 'form_name', label: '양식명', example: '휴가신청' },
    { value: 'custom', label: '직접 입력', example: '' },
    { value: 'none', label: '없음', example: '' },
  ]

  const getExample = (slot: string, custom: string) => {
    if (slot === 'custom') return custom || '입력값'
    if (slot === 'none') return ''
    return slotOptions.find((o) => o.value === slot)?.example ?? ''
  }

  const dateExample = slot3 === 'YYYYMMDD' ? '20260401' : slot3 === 'YYYYMM' ? '202604' : '2026'
  const parts = [getExample(slot1, customSlot1), getExample(slot2, customSlot2), dateExample, String(1).padStart(seqDigits, '0')].filter(Boolean)
  const preview = parts.join(separator)

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">결재번호 규칙</h3>
      <p className="text-[12px] text-gray-400 mb-5">결재 완료 후 생성되는 문서번호의 형식을 설정합니다.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-4">번호 생성 규칙</h4>
        <p className="text-[11px] text-gray-400 mb-4">순서: 1번째 자리 → 2번째 자리 → 날짜 → 일련번호</p>

        <div className="space-y-4">
          {/* 1번째 자리 */}
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">1번째 자리</span>
            <select value={slot1} onChange={(e) => setSlot1(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              {slotOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {slot1 === 'custom' && <input value={customSlot1} onChange={(e) => setCustomSlot1(e.target.value)} placeholder="직접 입력" className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-28" />}
            {slot1 !== 'none' && slot1 !== 'custom' && <span className="text-[11px] text-gray-400">예: {getExample(slot1, '')}</span>}
          </div>

          {/* 2번째 자리 */}
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">2번째 자리</span>
            <select value={slot2} onChange={(e) => setSlot2(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              {slotOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {slot2 === 'custom' && <input value={customSlot2} onChange={(e) => setCustomSlot2(e.target.value)} placeholder="직접 입력" className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-28" />}
            {slot2 !== 'none' && slot2 !== 'custom' && <span className="text-[11px] text-gray-400">예: {getExample(slot2, '')}</span>}
          </div>

          {/* 날짜 형식 */}
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">날짜 형식</span>
            <select value={slot3} onChange={(e) => setSlot3(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value="YYYYMMDD">YYYYMMDD</option>
              <option value="YYYYMM">YYYYMM</option>
              <option value="YYYY">YYYY</option>
            </select>
            <span className="text-[11px] text-gray-400">예: {dateExample}</span>
          </div>

          {/* 일련번호 */}
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">일련번호 자릿수</span>
            <select value={seqDigits} onChange={(e) => setSeqDigits(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value={3}>3자리 (001)</option>
              <option value={4}>4자리 (0001)</option>
              <option value={5}>5자리 (00001)</option>
            </select>
          </div>

          {/* 구분자 */}
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">구분자</span>
            <select value={separator} onChange={(e) => setSeparator(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value="-">- (하이픈)</option>
              <option value="_">_ (언더스코어)</option>
              <option value="/">/ (슬래시)</option>
            </select>
          </div>

          {/* 번호 초기화 주기 */}
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-gray-600 w-28 shrink-0">번호 초기화 주기</span>
            <select value={seqReset} onChange={(e) => setSeqReset(e.target.value as typeof seqReset)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-36">
              <option value="YEARLY">매년 초기화</option>
              <option value="MONTHLY">매월 초기화</option>
              <option value="NEVER">초기화 안 함</option>
            </select>
            <span className="text-[11px] text-gray-400">일련번호를 주기적으로 001부터 다시 시작</span>
          </div>

        </div>
      </div>

      {/* 미리보기 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h4 className="text-[13px] font-semibold text-gray-800 mb-2">미리보기</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <span className="text-[20px] font-bold text-gray-900 font-mono tracking-wider">{preview}</span>
        </div>
        <div className="flex justify-center gap-1 mt-3">
          {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">{p}</span>
              {i < parts.length - 1 && <span className="text-gray-400 text-[10px]">{separator}</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
      </div>
    </div>
  )
}

/* ── 사원 결재 환경 설정 ── */
const MEMBER_MOCK_DEPTS = [
  { name: '경영', members: [
    { id: 'u2', name: '강희계', position: '부장', hasSign: true },
    { id: 'u3', name: '권시정', position: '차장', hasSign: false },
    { id: 'u1', name: '김인재', position: '차장', hasSign: true },
    { id: 'u4', name: '박지현', position: '과장', hasSign: false },
  ]},
  { name: '개발', members: [
    { id: 'u7', name: '박서준', position: '팀장', hasSign: false },
    { id: 'u8', name: '이민호', position: '과장', hasSign: false },
    { id: 'u9', name: '최예린', position: '대리', hasSign: false },
  ]},
  { name: '인사', members: [
    { id: 'u11', name: '송미래', position: '팀장', hasSign: true },
    { id: 'u12', name: '윤서연', position: '과장', hasSign: false },
  ]},
]

const MEMBER_DELEGATION_MOCK = [
  { id: 1, period: '2026-03-20 ~ 2026-03-22', delegate: '이민호 과장', reason: '휴가', isActive: false },
]

function MemberApprovalSettingsView() {
  const [search, setSearch] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({ '경영': true, '개발': true, '인사': true })
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; position: string; hasSign: boolean } | null>(null)
  const [securityLevel, setSecurityLevel] = useState('일반')

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-5">사원 결재 환경 설정</h3>

      <div className="border border-gray-200 rounded-xl p-5">
        <div className="flex gap-6">
          {/* 왼쪽: 사원 목록 */}
          <div className="w-[240px] shrink-0">
            <div className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b border-gray-100">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 직위, 부서 검색" className="text-[11px] outline-none bg-transparent w-full placeholder-gray-400" />
              </div>
              <div className="p-2 text-[12px] max-h-[500px] overflow-y-auto">
                {MEMBER_MOCK_DEPTS.map((dept) => {
                  const filtered = dept.members.filter((m) => !search || m.name.includes(search) || m.position.includes(search))
                  if (search && filtered.length === 0) return null
                  return (
                    <div key={dept.name}>
                      <div className="flex items-center gap-1 py-1 px-1 cursor-pointer select-none hover:bg-gray-50 rounded"
                        onClick={() => setExpandedDepts((p) => ({ ...p, [dept.name]: !p[dept.name] }))}>
                        <span className="text-[10px] text-gray-400 w-3">{expandedDepts[dept.name] ? '▼' : '▶'}</span>
                        <span className="font-semibold text-gray-700">{dept.name}</span>
                        <span className="text-gray-400 text-[11px] ml-1">{dept.members.length}</span>
                      </div>
                      {expandedDepts[dept.name] && (search ? filtered : dept.members).map((m) => (
                        <div key={m.id}
                          onClick={() => setSelectedMember(m)}
                          className={`flex items-center gap-2 py-1.5 pl-5 pr-2 rounded cursor-pointer transition-colors ${selectedMember?.id === m.id ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'}`}>
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0">
                            <span>{m.name[0]}</span>
                          </div>
                          <span className="text-gray-800">{m.name} {m.position}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 오른쪽: 선택된 사원 설정 */}
          <div className="flex-1">
            {!selectedMember ? (
              <div className="text-[13px] text-gray-400 text-center py-20">왼쪽에서 사원을 선택하세요.</div>
            ) : (
              <div className="space-y-5">
                {/* 이름 */}
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-gray-500 w-28 shrink-0">이름</span>
                  <span className="text-[14px] font-semibold text-gray-900">{selectedMember.name}</span>
                </div>

                {/* 서명 이미지 */}
                <div className="flex items-start gap-4">
                  <span className="text-[12px] text-gray-500 w-28 shrink-0 pt-1">서명 이미지</span>
                  <div>
                    <div className="border border-gray-200 rounded-lg p-3 mb-2 w-[160px] h-[100px] flex flex-col items-center justify-center">
                      {selectedMember.hasSign ? (
                        <div className="text-center">
                          <div className="text-[10px] text-gray-400 border border-gray-200 rounded px-2 py-0.5 mb-1 inline-block">직위</div>
                          <div className="text-[20px] font-bold text-gray-800 my-1" style={{ fontFamily: 'cursive' }}>{selectedMember.name}</div>
                          <div className="text-[10px] text-gray-400 border border-gray-200 rounded px-2 py-0.5 inline-block">결재일</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">서명 없음</span>
                      )}
                    </div>
                    <button className="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors">서명 올리기</button>
                    <p className="text-[10px] text-gray-400 mt-1">* 서명은 최대 55x40 pixel 이미지</p>
                  </div>
                </div>

                {/* 보안등급 */}
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-gray-500 w-28 shrink-0">보안등급</span>
                  <select value={securityLevel} onChange={(e) => setSecurityLevel(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
                    <option>일반</option>
                    <option>기밀</option>
                    <option>대외비</option>
                  </select>
                </div>

                {/* 부재위임설정 */}
                <div className="flex items-start gap-4">
                  <span className="text-[12px] text-gray-500 w-28 shrink-0 pt-1">부재위임설정</span>
                  <div className="flex-1">
                    <button className="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 transition-colors mb-3">+ 부재추가</button>
                    <table className="w-full text-[11px]">
                      <thead><tr className="border-b border-gray-200">
                        <th className="px-2 py-2 text-left text-gray-500 font-medium">부재기간</th>
                        <th className="px-2 py-2 text-left text-gray-500 font-medium">대결자</th>
                        <th className="px-2 py-2 text-left text-gray-500 font-medium">부재사유</th>
                        <th className="px-2 py-2 text-center text-gray-500 font-medium">사용여부</th>
                        <th className="px-2 py-2 text-center text-gray-500 font-medium">삭제</th>
                      </tr></thead>
                      <tbody>
                        {MEMBER_DELEGATION_MOCK.length === 0 ? (
                          <tr><td colSpan={5} className="py-8 text-center text-gray-400">등록된 설정이 없습니다.</td></tr>
                        ) : MEMBER_DELEGATION_MOCK.map((d) => (
                          <tr key={d.id} className="border-b border-gray-100">
                            <td className="px-2 py-2 text-gray-600">{d.period}</td>
                            <td className="px-2 py-2 text-gray-700">{d.delegate}</td>
                            <td className="px-2 py-2 text-gray-600">{d.reason}</td>
                            <td className="px-2 py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.isActive ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-gray-100 text-gray-500'}`}>{d.isActive ? '사용' : '만료'}</span></td>
                            <td className="px-2 py-2 text-center"><button className="text-red-500 hover:underline text-[10px]">삭제</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 부서 문서함 설정 ── */
const DEPT_DOCBOX_LIST = [
  { name: '부서 결재 대기함', count: 0 },
  { name: '부서 결재 수신함', count: 0 },
  { name: '부서 결재 발신함', count: 0 },
  { name: '부서 참조함', count: 0 },
  { name: '부서 열람함', count: 0 },
]

function DeptDocBoxSettingsView() {
  const [useDocBox, setUseDocBox] = useState(true)
  const [selectedBox, setSelectedBox] = useState('부서 결재 대기함')
  const [selectedDept, setSelectedDept] = useState('PeopleCore')
  const [rightPanel, setRightPanel] = useState<'none' | 'dept-picker' | 'batch-setting'>('none')
  const [deptPickerStep, setDeptPickerStep] = useState<'dept' | 'member'>('dept')
  const [pickerSelectedDept, setPickerSelectedDept] = useState('')
  const [deptManagers, setDeptManagers] = useState<{ dept: string; name: string }[]>([])
  const [deptSettings, setDeptSettings] = useState([
    { name: '경영', docbox: true, inbox: true, outbox: true, refbox: true, viewbox: true },
    { name: '개발', docbox: true, inbox: true, outbox: true, refbox: true, viewbox: true },
    { name: '인사', docbox: true, inbox: true, outbox: true, refbox: true, viewbox: true },
  ])

  const PICKER_DEPTS = [
    { name: '경영', members: ['강희계 부장', '권시정 차장', '김인재 차장', '박지현 과장', '이수진 대리'] },
    { name: '개발', members: ['박서준 팀장', '이민호 과장', '최예린 대리', '한도윤 사원'] },
    { name: '인사', members: ['송미래 팀장', '윤서연 과장', '장현우 대리'] },
  ]

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-5">부서 문서함</h3>
      <div className="border border-gray-200 rounded-xl p-5 min-h-[500px]">
        {/* 사용 설정 */}
        <div className="flex items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-[13px] text-gray-700 font-medium">부서 문서함 사용 설정</span>
          <button onClick={() => setUseDocBox(!useDocBox)}
            className={`px-4 py-1.5 text-[12px] border rounded-lg transition-colors ${useDocBox ? 'border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE] font-medium' : 'border-gray-300 text-gray-500'}`}>
            {useDocBox ? '사용 중' : '미사용'}
          </button>
        </div>



        {useDocBox && (<>
          <h4 className="text-[14px] font-bold text-gray-800 mb-3">부서 문서함 목록</h4>

          <div className="flex gap-6">
            {/* 왼쪽: 부서 선택 + 문서함 목록 */}
            <div className="w-[220px] shrink-0">
              <div className="flex items-center gap-1 mb-3">
                <button onClick={() => { setRightPanel('dept-picker'); setDeptPickerStep('dept'); setPickerSelectedDept('') }} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50">부서 선택</button>
                <button onClick={() => setRightPanel('batch-setting')} className="px-2.5 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-50">부서 일괄 세팅</button>
              </div>
              {/* 담당자 표시 */}
              {deptManagers.filter((m) => m.dept === selectedDept).length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-2 px-1">
                  <span className="text-[10px] text-gray-400">담당자:</span>
                  {deptManagers.filter((m) => m.dept === selectedDept).map((m, i) => (
                    <span key={i} className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                      {m.name}
                      <button onClick={() => setDeptManagers((p) => p.filter((x) => !(x.dept === m.dept && x.name === m.name)))} className="text-gray-400 hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[12px]">
                <div className="py-1 px-1 text-gray-700 font-semibold">
                  {selectedDept}
                </div>
                {DEPT_DOCBOX_LIST.map((box) => (
                  <div key={box.name}
                    onClick={() => setSelectedBox(box.name)}
                    className={`py-1.5 pl-5 pr-2 rounded cursor-pointer transition-colors ${selectedBox === box.name ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {box.name}
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽 패널 */}
            {rightPanel === 'dept-picker' && (
              <div className="flex-1 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-[13px] font-semibold text-gray-800">{deptPickerStep === 'dept' ? '부서 선택' : `${pickerSelectedDept} - 담당자 선택`}</h5>
                  <button onClick={() => setRightPanel('none')} className="text-[11px] text-gray-500 hover:text-[#1D9E75]">닫기</button>
                </div>
                {deptPickerStep === 'dept' ? (
                  <div className="space-y-1">
                    {PICKER_DEPTS.map((dept) => (
                      <div key={dept.name}
                        onClick={() => { setPickerSelectedDept(dept.name); setSelectedDept(dept.name); setDeptPickerStep('member') }}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer hover:bg-[#E1F5EE] transition-colors">
                        <span className="text-gray-800 font-medium text-[12px]">{dept.name}</span>
                        <span className="text-[11px] text-gray-400">{dept.members.length}명</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <button onClick={() => setDeptPickerStep('dept')} className="text-[11px] text-gray-500 hover:text-[#1D9E75] mb-3">&larr; 부서 목록</button>
                    <div className="space-y-1">
                      {PICKER_DEPTS.find((d) => d.name === pickerSelectedDept)?.members.map((member) => {
                        const isSelected = deptManagers.some((m) => m.dept === pickerSelectedDept && m.name === member)
                        return (
                          <div key={member}
                            onClick={() => {
                              if (isSelected) setDeptManagers((p) => p.filter((m) => !(m.dept === pickerSelectedDept && m.name === member)))
                              else setDeptManagers((p) => [...p, { dept: pickerSelectedDept, name: member }])
                            }}
                            className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'}`}>
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0">{member[0]}</div>
                            <span className="text-gray-800 flex-1 text-[12px]">{member}</span>
                            {isSelected && <span className="text-[#1D9E75] text-[10px] font-medium">담당자</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {rightPanel === 'batch-setting' && (
              <div className="flex-1 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-[13px] font-semibold text-gray-800">부서 일괄 세팅</h5>
                  <button onClick={() => setRightPanel('none')} className="text-[11px] text-gray-500 hover:text-[#1D9E75]">닫기</button>
                </div>
                <table className="w-full text-[12px]">
                  <thead><tr className="border-b-2 border-gray-900">
                    <th className="px-2 py-2.5 text-left text-gray-700 font-medium">부서명</th>
                    <th className="px-2 py-2.5 text-center text-gray-700 font-medium">대기함</th>
                    <th className="px-2 py-2.5 text-center text-gray-700 font-medium">수신함</th>
                    <th className="px-2 py-2.5 text-center text-gray-700 font-medium">발신함</th>
                    <th className="px-2 py-2.5 text-center text-gray-700 font-medium">참조함</th>
                    <th className="px-2 py-2.5 text-center text-gray-700 font-medium">열람함</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="px-2 py-2.5 text-gray-800 font-semibold">PeopleCore</td>
                      {(['docbox', 'inbox', 'outbox', 'refbox', 'viewbox'] as const).map((key) => (
                        <td key={key} className="px-2 py-2.5 text-center">
                          <input type="checkbox" checked={deptSettings.every((d) => d[key])}
                            onChange={() => { const allOn = deptSettings.every((d) => d[key]); setDeptSettings((p) => p.map((d) => ({ ...d, [key]: !allOn }))) }}
                            className="accent-[#1D9E75] w-4 h-4" />
                        </td>
                      ))}
                    </tr>
                    {deptSettings.map((dept, idx) => (
                      <tr key={dept.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-2 py-2.5 text-gray-700 pl-4">{dept.name}</td>
                        {(['docbox', 'inbox', 'outbox', 'refbox', 'viewbox'] as const).map((key) => (
                          <td key={key} className="px-2 py-2.5 text-center">
                            <input type="checkbox" checked={dept[key]}
                              onChange={() => setDeptSettings((p) => p.map((d, i) => i === idx ? { ...d, [key]: !d[key] } : d))}
                              className="accent-[#1D9E75] w-4 h-4" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setRightPanel('none')} className="px-4 py-1 bg-[#1D9E75] text-white text-[11px] font-medium rounded hover:bg-[#178a65] transition-colors">확인</button>
                  <button onClick={() => setRightPanel('none')} className="px-4 py-1 border border-gray-300 text-gray-600 text-[11px] font-medium rounded hover:bg-gray-50 transition-colors">취소</button>
                </div>
              </div>
            )}
          </div>
        </>)}
      </div>
    </div>
  )
}

export default function ApprovalSettingsTab() {
  const [view, setView] = useState<ApprovalSettingsView>('form-manage')

  const renderContent = () => {
    switch (view) {
      case 'form-manage': return <FormManageView />
      case 'delegation': return <DelegationView />
      case 'doc-number': return <DocNumberView />
      case 'member-settings': return <MemberApprovalSettingsView />
      case 'dept-docbox': return <DeptDocBoxSettingsView />
      default: return null
    }
  }

  return (
    <div className="flex gap-0 -m-6 h-[calc(100%+48px)]">
      {/* 서브 사이드바 */}
      <div className="w-[200px] bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-800">결재 환경설정</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">결재 프로세스 정책 관리</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {APPROVAL_SETTING_MENUS.map((m) => (
            <div key={m.key} onClick={() => setView(m.key)}
              className={`flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer rounded-lg transition-colors ${view === m.key ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-gray-600 hover:bg-gray-50'}`}>
              {m.label}
            </div>
          ))}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  )
}
