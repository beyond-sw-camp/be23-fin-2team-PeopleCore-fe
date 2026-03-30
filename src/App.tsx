import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MenuSettingsModal from './components/MenuSettingsModal'

function App() {
  const isHRAdmin = true

  const [menuSettingsOpen, setMenuSettingsOpen] = useState(false)
  const [menuVisibility, setMenuVisibility] = useState<Record<string, boolean>>({
    dashboard: true,
    board: true,
    approval: true,
    attendance: true,
    performance: true,
    salary: true,
    mail: true,
    org: true,
  })

  const toggleMenuVisibility = (key: string) => {
    setMenuVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isHRAdmin={isHRAdmin}
          menuVisibility={menuVisibility}
          onOpenMenuSettings={() => setMenuSettingsOpen(true)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Dashboard />
        </main>
      </div>
      <MenuSettingsModal
        isOpen={menuSettingsOpen}
        onClose={() => setMenuSettingsOpen(false)}
        menuVisibility={menuVisibility}
        onToggle={toggleMenuVisibility}
      />
    </div>
  )
}

export default App
