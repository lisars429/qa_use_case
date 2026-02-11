'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronRight, Layers, Settings, Users } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen }: SidebarProps) {
  const projects = [
    { id: 1, name: 'Mobile App Redesign', progress: 75 },
    { id: 2, name: 'API Gateway Update', progress: 45 },
    { id: 3, name: 'Database Migration', progress: 90 },
  ]

  return (
    <aside
      className={cn(
        'bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="h-full flex flex-col">
        {/* Logo Area */}
        <div className="p-4 border-b border-sidebar-border">
          {isOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">TestVault</p>
                <p className="text-xs text-muted-foreground">QA Platform</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div className="flex-1 overflow-y-auto p-4">
          {isOpen && (
            <>
              <p className="text-xs font-semibold text-sidebar-accent-foreground mb-3 uppercase">Projects</p>
              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    className="w-full text-left p-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
                  >
                    <p className="text-sm font-medium text-sidebar-foreground group-hover:text-sidebar-primary">
                      {project.name}
                    </p>
                    <div className="mt-1 w-full bg-sidebar-accent rounded-full h-1.5">
                      <div
                        className="bg-sidebar-primary h-full rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-sidebar-accent-foreground mt-1">{project.progress}% complete</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary',
              !isOpen && 'justify-center'
            )}
          >
            <Users className="w-4 h-4" />
            {isOpen && <span className="ml-2">Team</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary',
              !isOpen && 'justify-center'
            )}
          >
            <Settings className="w-4 h-4" />
            {isOpen && <span className="ml-2">Settings</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
