interface LogoHeaderProps {
  title?: string
  subtitle?: string
}

export default function LogoHeader({ title, subtitle }: LogoHeaderProps) {
  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--primary-color)] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="8" x2="9" y2="30" stroke="var(--primary-color)" strokeWidth="2.5" />
            <line x1="20" y1="8" x2="31" y2="30" stroke="var(--primary-color)" strokeWidth="2.5" />
            <line x1="9" y1="30" x2="31" y2="30" stroke="var(--primary-color)" strokeWidth="2.5" />
            <circle cx="20" cy="8" r="4.5" fill="var(--primary-color)" />
            <circle cx="9" cy="30" r="4.5" fill="var(--primary-color)" />
            <circle cx="31" cy="30" r="4.5" fill="var(--primary-color)" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-gray-800">PeopleCore</span>
      </div>
      {title && <h2 className="text-lg font-bold text-gray-800 mt-3">{title}</h2>}
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
