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
  }
}

export function TestScriptsModule({ initialState }: TestScriptsModuleProps) {
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(initialState?.testCaseId || null)
  const [showPipeline, setShowPipeline] = useState(initialState?.view === 'pipeline')
  const { generatedScripts, getTestCaseUserStory } = usePipelineData()

  // Verify if we need to auto-trigger generation or setup based on initialState
  useEffect(() => {
    if (initialState?.view === 'pipeline') {
      setShowPipeline(true)
    }
    if (initialState?.testCaseId) {
      setSelectedTestCaseId(initialState.testCaseId)
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

  const selectedScript = useMemo(() => {
    if (!selectedTestCaseId) return null
    return scripts.find(s => s.testCaseId === selectedTestCaseId) || null
  }, [selectedTestCaseId, scripts])

  const handleRunScript = async (scriptId: string) => {
    console.log('Running script:', scriptId)
    await saveActivity(`Run Script ${scriptId}`, 'test_script_execution', { scriptId })
  }

  if (showPipeline) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Automation Pipeline</h2>
          <Button onClick={() => setShowPipeline(false)} variant="outline">
            Exit to Dashboard
          </Button>
        </div>

        <div className="px-2">
          <PipelineUnified
            userStoryId={selectedTestCaseId || 'tc-001'}
            onModuleChange={(module) => {
              if (module === 'execution') {
                setShowPipeline(false)
              }
            }}
            standaloneStage={6}
            initialData={{
              user_story: scripts.find(s => s.testCaseId === selectedTestCaseId)?.name || 'AI Generated Test',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">Test Scripts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {scripts.length} total scripts configured
          </p>
        </div>
        <Button
          onClick={() => setShowPipeline(true)}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          Launch Pipeline
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-6 h-[calc(100vh-18rem)]">
        <Card className="col-span-2 overflow-hidden border-border">
          <HierarchyView
            scripts={scripts}
            selectedTestCaseId={selectedTestCaseId}
            onTestCaseSelect={setSelectedTestCaseId}
          />
        </Card>
        <Card className="col-span-3 p-6 overflow-y-auto border-border">
          <DetailsPanel
            script={selectedScript}
            onRun={handleRunScript}
          />
        </Card>
      </div>
    </div>
  )
}
