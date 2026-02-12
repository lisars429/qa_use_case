'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { PipelineUnified } from '@/components/modules/user-stories/pipeline'
import { usePipelineData } from '@/lib/context/pipeline-data-context'

interface TestExecutionModuleProps {
  initialState?: {
    userStoryId?: string
    scripts?: any[]
  }
  onModuleChange?: (module: 'user-stories' | 'test-cases' | 'test-scripts' | 'execution' | 'insights', state?: any) => void
}

export function TestExecutionModule({ initialState, onModuleChange }: TestExecutionModuleProps) {
  const { userStories, generatedScripts } = usePipelineData()

  // Try to find the most recently worked on story if none is provided
  const latestStoryIdWithScript = generatedScripts.length > 0
    ? generatedScripts[generatedScripts.length - 1].testCaseId
    : 'tc-001'

  const [selectedUserStoryId, setSelectedUserStoryId] = useState<string | null>(initialState?.userStoryId || latestStoryIdWithScript)

  useEffect(() => {
    if (initialState?.userStoryId) {
      setSelectedUserStoryId(initialState.userStoryId)
    }
  }, [initialState])

  const storyMeta = selectedUserStoryId ? userStories.get(selectedUserStoryId) : null
  const storyTitle = storyMeta?.userStory.user_story || 'Automation Execution'

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Execution Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live monitoring and execution results for {storyTitle}
          </p>
        </div>
      </div>

      <div className="px-2">
        <PipelineUnified
          userStoryId={selectedUserStoryId || 'tc-001'}
          onModuleChange={onModuleChange}
          standaloneStage={7}
          initialData={{
            user_story: storyTitle,
          }}
        />
      </div>
    </div>
  )
}
