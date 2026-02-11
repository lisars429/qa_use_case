'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Square, RotateCw, TrendingUp, AlertCircle, Check, X, Clock } from 'lucide-react'
import { saveActivity, getActivities } from '@/app/actions/unified-store'
import { useEffect } from 'react'
import { PipelineUnified } from '@/components/modules/user-stories/pipeline'
import { WorkflowVisualization } from '@/components/shared'
import { cn } from '@/lib/utils'
import type { ExecutionResults } from '@/lib/types/pipeline'

interface TestRun {
  id: string
  name: string
  started: string
  passed: number
  failed: number
  skipped: number
  duration: string
  status: 'running' | 'passed' | 'failed' | 'stopped'
  category: 'sanity' | 'regression' | 'smoke' | 'production-defect' | 'integration'
}

interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'running'
  duration: string
  category: string
}

export function TestExecutionModule() {
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null)
  const [view, setView] = useState<'list' | 'pipeline'>('list')
  const [stage7Result, setStage7Result] = useState<ExecutionResults | null>(null)

  const [runs, setRuns] = useState<TestRun[]>([
    {
      id: 'run-1',
      name: 'Nightly Regression Suite',
      started: '2024-01-15 02:00 AM',
      passed: 285,
      failed: 3,
      skipped: 2,
      duration: '1h 20m',
      status: 'passed',
      category: 'regression'
    },
    {
      id: 'run-2',
      name: 'Daily Sanity Tests',
      started: '2024-01-15 11:30 AM',
      passed: 42,
      failed: 0,
      skipped: 0,
      duration: '15m',
      status: 'passed',
      category: 'sanity'
    },
    {
      id: 'run-3',
      name: 'Production Defect Verification',
      started: 'Running now',
      passed: 58,
      failed: 2,
      skipped: 0,
      duration: '5m 42s',
      status: 'running',
      category: 'production-defect'
    }
  ])

  useEffect(() => {
    const fetchRuns = async () => {
      const result = await getActivities('test_run')
      if (result.success && result.data) {
        const mappedRuns = result.data.map((item: any) => ({
          id: item.id.toString(),
          ...item.details
        }))
        setRuns(mappedRuns)
      }
    }
    fetchRuns()
  }, [])

  const handleStartRun = async () => {
    const newRun: TestRun = {
      id: `run-${Date.now()}`,
      name: 'Manual Test Run',
      started: new Date().toLocaleString(),
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: '0s',
      status: 'running',
      category: 'smoke'
    }

    const result = await saveActivity('Manual Test Run', 'test_run', newRun)
    if (result.success) {
      setRuns([newRun, ...runs])
      setSelectedRun(newRun)
      setView('pipeline')
    }
  }

  const handleStage7Complete = (result: ExecutionResults) => {
    setStage7Result(result)
    // Update local metrics if needed
  }

  const activeRun = selectedRun || (runs && runs.length > 2 ? runs[2] : runs[0])
  const totalTests = activeRun ? (activeRun.passed + activeRun.failed + activeRun.skipped) : 0
  const passRate = activeRun && (activeRun.passed + activeRun.failed > 0)
    ? Math.round((activeRun.passed / (activeRun.passed + activeRun.failed)) * 100)
    : 0

  const testResults: TestResult[] = [
    { name: 'Defect FIX-2481: Payment Retry Logic', status: 'passed', duration: '2.3s', category: 'production-defect' },
    { name: 'Defect FIX-2519: Concurrent Session Handling', status: 'failed', duration: '1.8s', category: 'production-defect' },
    { name: 'Sanity: Database Connection Pool', status: 'passed', duration: '3.1s', category: 'sanity' },
    { name: 'Sanity: API Response Times', status: 'passed', duration: '5.2s', category: 'sanity' },
    { name: 'Sanity: Authentication Service Health', status: 'passed', duration: '2.9s', category: 'sanity' },
    { name: 'Regression: UI Layout Consistency', status: 'passed', duration: '4.1s', category: 'regression' },
    { name: 'Integration: Third-party Payment Gateway', status: 'running', duration: '1.2s...', category: 'integration' },
    { name: 'Smoke: Critical User Flows', status: 'passed', duration: '1.5s', category: 'smoke' },
  ]

  const getStatusColor = (status: TestRun['status']) => {
    switch (status) {
      case 'passed':
        return 'text-green-500'
      case 'failed':
        return 'text-red-500'
      case 'running':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="w-4 h-4 text-green-500" />
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      default:
        return null
    }
  }

  const getRunStatusBadge = (status: TestRun['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'running':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getCategoryBadge = (category: TestRun['category']) => {
    switch (category) {
      case 'sanity':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'regression':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'smoke':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'production-defect':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'integration':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Test Execution</h1>
          <p className="text-muted-foreground mt-2 text-lg">Monitor live test runs and results</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-red-500/50 text-red-500 hover:bg-red-500/10 h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <Square className="w-5 h-5 mr-2 fill-red-500/20" />
            Stop Execution
          </Button>
          <Button
            variant="outline"
            className="border-border hover:bg-secondary h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <RotateCw className="w-5 h-5 mr-2" />
            Retry Failed
          </Button>
        </div>
      </div>

      {/* Hero Metrics Bar */}
      <div className="grid grid-cols-5 gap-6">
        {[
          { label: 'Total Tests', value: totalTests.toString(), color: 'text-foreground' },
          { label: 'Passed', value: activeRun?.passed.toString() || '0', color: 'text-green-500' },
          { label: 'Failed', value: activeRun?.failed.toString() || '0', color: 'text-red-500' },
          { label: 'Pass Rate', value: `${passRate}%`, color: 'text-blue-500' },
          { label: 'Duration', value: activeRun?.duration || '0s', sub: activeRun?.status === 'running' ? '(running)' : '', color: 'text-foreground' },
        ].map((metric, i) => (
          <Card key={i} className="p-6 bg-slate-950/40 backdrop-blur-3xl border-white/5 rounded-3xl shadow-2xl group hover:border-primary/30 transition-all duration-300">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-4">{metric.label}</p>
            <div className="flex items-baseline gap-2">
              <p className={cn("text-5xl font-black tracking-tighter", metric.color)}>{metric.value}</p>
              {metric.sub && <span className="text-xs font-bold text-muted-foreground animate-pulse">{metric.sub}</span>}
            </div>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className={cn("h-full transition-all duration-1000", metric.color.replace('text', 'bg'))} style={{ width: '70%' }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar: Test Runs */}
        <div className="col-span-3 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Test Runs</h3>
          <div className="space-y-3">
            {runs.map((run, i) => (
              <Card
                key={run.id}
                onClick={() => setSelectedRun(run)}
                className={cn(
                  "p-5 bg-slate-950/20 backdrop-blur-xl border-white/5 rounded-2xl cursor-pointer hover:bg-slate-900/40 transition-all group overflow-hidden relative",
                  activeRun?.id === run.id && "ring-2 ring-primary bg-slate-900/60"
                )}
              >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{run.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{run.started}</p>
                  </div>
                  <Badge className={cn(
                    "text-[10px] uppercase font-black px-2 py-0.5 rounded-full border-none",
                    run.status === 'passed' ? "bg-green-500/10 text-green-500" :
                      run.status === 'running' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {run.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-none text-[9px] uppercase font-black tracking-tighter px-2 py-0">
                    {run.category}
                  </Badge>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground flex gap-2">
                  {run.passed}✓ {run.failed > 0 && `${run.failed}✗`} {run.skipped > 0 && `${run.skipped}⊘`}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed View: Active Run */}
        {activeRun && (
          <Card className="col-span-9 p-8 bg-slate-950/40 backdrop-blur-3xl border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
            {/* Subtle patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="relative z-10 space-y-12">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{activeRun.name}</h2>
                  <p className="text-muted-foreground mt-2 font-medium">
                    {activeRun.status === 'running' ? 'Running now' : `Completed on ${activeRun.started}`}
                  </p>
                </div>
                <Badge className={cn(
                  "border-none px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2",
                  activeRun.status === 'passed' ? "bg-green-500/10 text-green-500" :
                    activeRun.status === 'running' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                )}>
                  {activeRun.status === 'running' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                  {activeRun.status.charAt(0).toUpperCase() + activeRun.status.slice(1)}
                </Badge>
              </div>

              {/* Central Progress Bar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Overall Progress</span>
                  <span className="text-xs font-black text-blue-400">{passRate}% passing</span>
                </div>
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden p-1 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-primary rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000"
                    style={{ width: `${passRate}%` }}
                  />
                </div>
              </div>

              {/* Results Breakdown */}
              <div className="grid grid-cols-3 gap-12 pt-8 border-t border-white/5">
                {[
                  { label: 'Passed', value: activeRun.passed.toString(), percent: `${totalTests > 0 ? Math.round((activeRun.passed / totalTests) * 100) : 0}%`, color: 'text-green-500' },
                  { label: 'Failed', value: activeRun.failed.toString(), percent: `${totalTests > 0 ? Math.round((activeRun.failed / totalTests) * 100) : 0}%`, color: 'text-red-500' },
                  { label: 'Skipped', value: activeRun.skipped.toString(), percent: `${totalTests > 0 ? Math.round((activeRun.skipped / totalTests) * 100) : 0}%`, color: 'text-slate-500' },
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline gap-3">
                      <p className={cn("text-4xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
                      <span className="text-xs font-bold text-muted-foreground/60">{stat.percent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
