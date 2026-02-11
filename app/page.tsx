'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Navigation } from '@/components/navigation'
import { UserStoriesModule } from '@/components/modules/user-stories'
import { TestCasesModule } from '@/components/modules/test-cases'
import { TestScriptsModule } from '@/components/modules/test-scripts'
import { TestExecutionModule } from '@/components/modules/test-execution'
import { InsightsModule } from '@/components/modules/insights'

type ModuleType = 'user-stories' | 'test-cases' | 'test-scripts' | 'execution' | 'insights'

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleType>('user-stories')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [moduleState, setModuleState] = useState<Record<string, any>>({})

  const handleModuleChange = (module: ModuleType, state: Record<string, any> = {}) => {
    console.log('Home: handleModuleChange called', { module, state })
    setActiveModule(module)
    if (state) {
      setModuleState(state)
    } else {
      setModuleState({})
    }
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'user-stories':
        return <UserStoriesModule onModuleChange={handleModuleChange} />
      case 'test-cases':
        return <TestCasesModule initialState={moduleState} onModuleChange={handleModuleChange} />
      case 'test-scripts':
        return <TestScriptsModule initialState={moduleState} />
      case 'execution':
        return <TestExecutionModule />
      case 'insights':
        return <InsightsModule />
      default:
        return <UserStoriesModule />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Left Zone */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation - Header Zone */}
        <Navigation
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content Area - Main Zone */}
        <main className="flex-1 overflow-auto">
          {renderModule()}
        </main>
      </div>
    </div>
  )
}
