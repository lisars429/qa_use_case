'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { PipelineUnified } from '@/components/modules/user-stories/pipeline'
import { HierarchyView } from '@/components/modules/test-scripts/hierarchy-view'
import { DetailsPanel } from '@/components/modules/test-scripts/details-panel'
import { usePipelineData } from '@/lib/context/pipeline-data-context'
import { saveActivity } from '@/app/actions/unified-store'
import { cn } from '@/lib/utils'

interface TestScript {
  id: string
  name: string
  testCaseId: string
  testCaseName: string
  userStoryId: string
  userStoryTitle: string
  code?: string
  framework: string
  status: 'draft' | 'active' | 'maintenance'
  executionResult?: {
    status: 'passed' | 'failed' | 'error'
    duration_ms?: number
    output?: string
    error?: string
  }
  lastRun?: string
  passRate: number
  isGenerated: boolean
}

interface TestScriptsModuleProps {
  initialState?: {
    view?: 'pipeline' | 'explorer'
    stage?: number
    testCaseId?: string
    userStoryId?: string
  }
  onModuleChange?: (module: 'user-stories' | 'test-cases' | 'test-scripts' | 'execution' | 'insights', state?: any) => void
}

export function TestScriptsModule({ initialState, onModuleChange }: TestScriptsModuleProps) {
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(initialState?.testCaseId || null)
  const [selectedUserStoryId, setSelectedUserStoryId] = useState<string | null>(initialState?.userStoryId || null)
  const { generatedScripts, getTestCaseUserStory, userStories } = usePipelineData()

  // Verify if we need to auto-trigger generation or setup based on initialState
  useEffect(() => {
    if (initialState?.testCaseId) {
      setSelectedTestCaseId(initialState.testCaseId)
    }
    if (initialState?.userStoryId) {
      setSelectedUserStoryId(initialState.userStoryId)
    }
  }, [initialState])

  const scripts = useMemo(() => {
    return generatedScripts.map(gs => {
      const userStoryMeta = getTestCaseUserStory(gs.testCaseId)
      return {
        id: gs.id,
        name: gs.script.test_name,
        testCaseId: gs.testCaseId,
        testCaseName: gs.testCaseName,
        userStoryId: userStoryMeta?.userStoryId || 'Generated',
        userStoryTitle: userStoryMeta?.userStory.user_story || 'AI Generated Test',
        code: gs.script.code,
        framework: 'Playwright',
        status: gs.executionResult
          ? (gs.executionResult.pass_rate >= 80 ? 'active' : 'maintenance') as 'active' | 'maintenance'
          : 'draft' as 'draft',
        executionResult: gs.executionResult ? {
          status: (gs.executionResult.passed > 0 ? 'passed' : 'failed') as 'passed' | 'failed',
          duration_ms: 2000,
          output: `Passed: ${gs.executionResult.passed}\nFailed: ${gs.executionResult.failed}`,
        } : undefined,
        lastRun: gs.executionResult ? 'Recently' : undefined,
        passRate: gs.executionResult?.pass_rate || 0,
        isGenerated: true,
      }
    })
  }, [generatedScripts, getTestCaseUserStory])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">Automation Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and execute automation scripts for your test cases
          </p>
        </div>
      </div>

      <div className="px-2">
        <PipelineUnified
          userStoryId={selectedUserStoryId || selectedTestCaseId || (userStories.size > 0 ? Array.from(userStories.keys())[0] : 'us-001')}
          onModuleChange={onModuleChange}
          standaloneStage={6}
          initialData={{
            user_story: (selectedUserStoryId ? userStories.get(selectedUserStoryId)?.userStory.user_story : (selectedTestCaseId ? scripts.find(s => s.testCaseId === selectedTestCaseId)?.userStoryTitle : Array.from(userStories.values())[0]?.userStory.user_story)) || 'AI Generated Test',
          }}
        />
      </div>
    </div>
  )
}
