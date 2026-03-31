interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[460px] px-10 py-8">
        {children}
      </div>
    </div>
  )
}
