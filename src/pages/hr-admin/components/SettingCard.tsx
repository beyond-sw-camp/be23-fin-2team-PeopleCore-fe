export default function SettingCard({ title, desc, id, badge }: { title: string; desc: string; id: string; badge?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#1D9E75]/30 hover:shadow-sm transition-all cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[13px] font-semibold text-gray-800 group-hover:text-[#1D9E75] transition-colors">{title}</h4>
            {badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                badge === '승인 필요' ? 'bg-amber-50 text-amber-600' :
                badge === '주의' ? 'bg-red-50 text-red-500' :
                badge === '확정' ? 'bg-blue-50 text-blue-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">{desc}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[10px] text-gray-300 font-mono">{id}</span>
        </div>
      </div>
    </div>
  )
}
