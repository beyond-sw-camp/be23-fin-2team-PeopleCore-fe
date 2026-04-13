interface Props {
  page: number           // 1-based
  total: number          // 전체 항목 수
  pageSize: number       // 페이지당 항목 수
  onChange: (page: number) => void
  maxButtons?: number    // 한 번에 보이는 번호 버튼 수 (기본 7)
}

export default function Pagination({ page, total, pageSize, onChange, maxButtons = 7 }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const half = Math.floor(maxButtons / 2)
  let start = Math.max(1, page - half)
  let end = Math.min(totalPages, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)
  const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return
    onChange(p)
  }

  const btnBase = 'min-w-[28px] h-7 px-2 text-[12px] rounded border transition-colors'

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => go(1)}
        disabled={page === 1}
        className={`${btnBase} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        «
      </button>
      <button
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className={`${btnBase} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        ‹
      </button>

      {start > 1 && <span className="px-1 text-gray-400 text-[11px]">…</span>}

      {nums.map(n => (
        <button
          key={n}
          onClick={() => go(n)}
          className={`${btnBase} ${
            n === page
              ? 'bg-[#1D9E75] text-white border-[#1D9E75] font-semibold'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {n}
        </button>
      ))}

      {end < totalPages && <span className="px-1 text-gray-400 text-[11px]">…</span>}

      <button
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        ›
      </button>
      <button
        onClick={() => go(totalPages)}
        disabled={page === totalPages}
        className={`${btnBase} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        »
      </button>

      <span className="ml-2 text-[11px] text-gray-400">
        {page} / {totalPages} · 총 {total}건
      </span>
    </div>
  )
}
