import FileBoxAdminTab from '../hr-admin/components/FileBoxAdminTab'

export default function FileBoxAdminPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="p-3 md:p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">파일함 관리</h1>
          <p className="text-xs text-gray-400 mt-1">파일함 Admin 권한 부여 대상을 직급 또는 직책 단위로 설정합니다.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200">
          <FileBoxAdminTab />
        </div>
      </div>
    </div>
  )
}
