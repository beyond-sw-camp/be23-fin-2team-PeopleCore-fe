export default function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '완료': 'bg-gray-100 text-gray-600', '진행중': 'bg-[#E1F5EE] text-[#1D9E75]',
    '대기': 'bg-yellow-50 text-yellow-600', '취소': 'bg-red-50 text-red-500',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}
