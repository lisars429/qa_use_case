'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, Search, Bell, User, Layers } from 'lucide-react'
import { ThemeToggle } from "@/components/theme-toggle"

interface NavigationProps {
  activeModule: string
  onModuleChange: (module: any) => void
  onSidebarToggle: () => void
}

export function Navigation({ activeModule, onModuleChange, onSidebarToggle }: NavigationProps) {
  const modules = [
    { id: 'user-stories', label: 'User Stories' },
    { id: 'test-cases', label: 'Test Cases' },
    { id: 'test-scripts', label: 'Test Scripts' },
    { id: 'execution', label: 'Execution' },
    { id: 'insights', label: 'Insights' },
  ]

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between p-4 gap-4">
        {/* Left Section - Menu only */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Middle Section - Module Tabs */}
        <nav className="flex gap-1 bg-secondary rounded-lg p-1">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                activeModule === module.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {module.label}
            </button>
          ))}
        </nav>

        {/* Right Section - Search, Notifications, User */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center">
            <Input
              placeholder="Search..."
              className="w-48 h-9 bg-input border-border"
            />
            <button className="absolute mr-3 text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
