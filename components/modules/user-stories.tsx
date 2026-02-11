'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, Lock, Check, AlertCircle, Zap, Download, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JiraImportDialog } from '@/components/jira-import-dialog'
import { PipelineUnified } from '@/components/modules/user-stories/pipeline'
import { api } from '@/lib/api/client'
import { type UserStory } from '@/lib/types/pipeline'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect } from 'react'
import '@/styles/user-stories.css'
import { TrendingUp, CheckCircle2, Timer, LockKeyhole, AlertTriangle, Layers, FileJson, Gauge } from 'lucide-react'

// Local interface removed in favor of import from @/lib/types/pipeline

interface UserStoriesModuleProps {
  onModuleChange?: (module: 'user-stories' | 'test-cases' | 'test-scripts' | 'execution' | 'insights', state?: any) => void
}

export function UserStoriesModule({ onModuleChange }: UserStoriesModuleProps) {
  const [expandedId, setExpandedId] = useState<string | null>('us-001')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showPipelineForId, setShowPipelineForId] = useState<string | null>(null)
  const [stories, setStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true)
        const data = await api.getUserStories()
        setStories(data)
      } catch (error) {
        console.error('Failed to fetch user stories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [])

  const handleImport = (importedStories: UserStory[]) => {
    setStories((prev) => [...prev, ...importedStories])
    console.log('[v0] Stories imported:', importedStories)
  }

  const getStatusIcon = (status: UserStory['status']) => {
    switch (status) {
      case 'ready':
        return <Check className="w-4 h-4 text-green-500" />
      case 'in-progress':
        return <Zap className="w-4 h-4 text-yellow-500" />
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'locked':
        return <Lock className="w-4 h-4 text-gray-500" />
    }
  }

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 90) return 'text-green-500'
    if (completeness >= 70) return 'text-yellow-500'
    if (completeness >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">User Stories</h2>
          <p className="text-muted-foreground">Manage feature requirements with completeness gating</p>
        </div>
        <Button
          onClick={() => setShowImportDialog(true)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Import from Jira
        </Button>
      </div>

      {/* Stats Cards - Enhanced */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-5 glass-card border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider text-xs">Total Stories</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-foreground">{stories.length}</p>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full opacity-50" />
          </div>
        </Card>

        <Card className="p-5 glass-card border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider text-xs">Ready for Testing</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-green-500">{stories.filter(s => s.status === 'ready').length}</p>
          </div>
          <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${(stories.filter(s => s.status === 'ready').length / stories.length) * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-5 glass-card border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Timer className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider text-xs">In Progress</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-amber-500">{stories.filter(s => s.status === 'in-progress').length}</p>
          </div>
          <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(stories.filter(s => s.status === 'in-progress').length / stories.length) * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-5 glass-card border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Gauge className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider text-xs">Avg Completeness</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-blue-500">
              {stories.length > 0 ? Math.round(stories.reduce((a, b) => a + b.completeness, 0) / stories.length) : 0}%
            </p>
          </div>
          <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${stories.length > 0 ? (stories.reduce((a, b) => a + b.completeness, 0) / stories.length) : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Jira-like Table Header REMOVED in favor of card layout */}

      {/* User Stories List - Jira Style */}
      <div className="space-y-2 border-b border-border">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-1"><Skeleton className="h-4 w-12" /></div>
                <div className="col-span-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="col-span-2"><Skeleton className="h-6 w-20" /></div>
                <div className="col-span-1"><Skeleton className="h-4 w-10" /></div>
                <div className="col-span-1"><Skeleton className="h-6 w-8 mx-auto" /></div>
                <div className="col-span-1"><Skeleton className="h-6 w-8 mx-auto" /></div>
                <div className="col-span-1"><Skeleton className="h-6 w-8 mx-auto" /></div>
              </div>
            </div>
          ))
        ) : (
          stories.map((story) => (
            <div
              key={story.id}
              className={cn(
                'group p-0 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden relative',
                expandedId === story.id && 'ring-2 ring-primary bg-card/60'
              )}
              onClick={() => setExpandedId(expandedId === story.id ? null : story.id)}
            >
              {/* Gradient Overlay for Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="p-5 flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                {/* ID & Type Icon */}
                <div className="flex items-center gap-3 min-w-[100px]">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary tracking-tighter uppercase">{story.id}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Story</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {story.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] uppercase font-black px-2 py-0.5 rounded-full border-none',
                        story.status === 'ready' && 'bg-green-500/10 text-green-500 glow-green',
                        story.status === 'in-progress' && 'bg-amber-500/10 text-amber-500 glow-amber',
                        story.status === 'blocked' && 'bg-red-500/10 text-red-500 glow-red',
                        story.status === 'locked' && 'bg-slate-500/10 text-slate-400'
                      )}
                    >
                      {story.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-medium max-w-2xl leading-relaxed">
                    {story.description}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4 md:border-l md:border-border/50">
                  {/* Progress */}
                  <div className="flex flex-col gap-1.5 min-w-[80px]">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest text-[9px]">Progress</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-1000 ease-out',
                            story.completeness >= 90 && 'gradient-progress-success',
                            story.completeness >= 70 && story.completeness < 90 && 'gradient-progress-warning',
                            story.completeness < 70 && 'gradient-progress-danger'
                          )}
                          style={{ width: `${story.completeness}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-black min-w-[32px]', getCompletenessColor(story.completeness))}>
                        {story.completeness}%
                      </span>
                    </div>
                  </div>

                  {/* Dependencies */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest text-[9px]">Dependencies</span>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-bold text-foreground">{story.dependencies}</span>
                    </div>
                  </div>

                  {/* Test Cases */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest text-[9px]">Test Cases</span>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70" />
                      <span className="text-sm font-bold text-foreground">{story.testCases}</span>
                    </div>
                  </div>

                  {/* Automation */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest text-[9px]">Automation</span>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-sm font-bold text-foreground">{story.testScripts}</span>
                    </div>
                  </div>
                </div>

                {/* Expand Toggle */}
                <div className="hidden md:flex items-center justify-center pl-4">
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-300",
                    expandedId === story.id && "rotate-180"
                  )} />
                </div>
              </div>

              {/* Expanded Details - Premium View */}
              {expandedId === story.id && (
                <div className="px-5 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-6" />

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Quality Gates */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold uppercase tracking-tight text-foreground">Quality Gates</h4>
                      </div>
                      <div className="grid gap-3">
                        <GateCheck
                          label="Requirement Specification"
                          status={story.completeness >= 80}
                          description="Business logic and edge cases defined"
                        />
                        <GateCheck
                          label="Test Design"
                          status={story.testCases > 0}
                          description="Comprehensive test scenarios drafted"
                        />
                        <GateCheck
                          label="Scripting"
                          status={story.testScripts > 0}
                          description="Playwright automation scripts verified"
                        />
                      </div>
                    </div>

                    {/* Right Column: Actions & Summary */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold uppercase tracking-tight text-foreground">Strategic Actions</h4>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button
                          className="w-full justify-start gap-3 h-12 bg-primary hover:bg-primary/90 text-primary-foreground group overflow-hidden relative"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowPipelineForId(showPipelineForId === story.id ? null : story.id)
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />
                          <Sparkles className="w-5 h-5 animate-pulse" />
                          <div className="flex flex-col items-start text-xs">
                            <span className="text-xs font-bold">{showPipelineForId === story.id ? 'Close Analysis' : 'Run AI Pipeline Analysis'}</span>
                            <span className="text-[10px] opacity-70">Execute Stage 1-4 validation</span>
                          </div>
                        </Button>

                      </div>
                    </div>
                  </div>

                  {/* Pipeline Integration */}
                  {showPipelineForId === story.id && (
                    <div className="mt-4 p-1 rounded-2xl bg-black/20 border border-white/5 overflow-hidden">
                      <PipelineUnified
                        userStoryId={story.id}
                        onModuleChange={onModuleChange}
                        activeRange={[1, 3]}
                        initialData={{
                          user_story: story.title,
                          detailed_description: story.description,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Jira Import Dialog */}
      {showImportDialog && (
        <JiraImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />
      )}
    </div>
  )
}

function GateCheck({ label, status, description }: { label: string; status: boolean; description?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground">{label}</span>
        {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
      </div>
      <div className={cn(
        "p-1.5 rounded-full",
        status ? "bg-green-500/20 text-green-500" : "bg-white/5 text-muted-foreground"
      )}>
        {status ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" />
        )}
      </div>
    </div>
  )
}
