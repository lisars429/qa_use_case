'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { CodeViewer } from '@/components/shared'

import {
    Play,
    Copy,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    Loader2
} from 'lucide-react'

interface TestScript {
    id: string
    name: string
    testCaseId: string
    testCaseName: string
    userStoryId: string
    userStoryTitle: string
    code?: string
    framework: string
    status: 'active' | 'draft' | 'maintenance'
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

interface DetailsPanelProps {
    script: TestScript | null
    isRunning?: boolean
    onRun?: (scriptId: string) => void
}

export function DetailsPanel({ script, isRunning = false, onRun }: DetailsPanelProps) {
    const [activeTab, setActiveTab] = useState('code')

    if (!script) {
        return (
            <div className="flex items-center justify-center h-full bg-muted/20 border border-dashed border-border rounded-xl">
                <div className="text-center p-8">
                    <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-bold">Select a Test Case</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Choose a test case from the list to view its script and details.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col border border-border rounded-xl overflow-hidden bg-card">
            {/* Header */}
            <div className="p-6 border-b border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight mb-2">{script.testCaseName}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-muted-foreground">User Story: {script.userStoryId}</span>
                            <span className="text-slate-700">•</span>
                            <span className="text-muted-foreground">Test Case: {script.testCaseId}</span>
                        </div>
                    </div>
                    {script.executionResult && !isRunning && (
                        <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
                            script.executionResult.status === 'passed'
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        )}>
                            {script.executionResult.status === 'passed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span>{script.executionResult.status === 'passed' ? 'Passed' : 'Failed'}</span>
                            <span className="opacity-50">•</span>
                            <span>{script.executionResult.duration_ms || 2341}ms</span>
                        </div>
                    )}
                    {isRunning && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Running Test...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="px-6 border-b border-border">
                    <TabsList className="bg-muted/50 p-1 gap-1 h-auto w-full justify-start rounded-lg inline-flex">
                        <TabsTrigger value="code" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-8">Code</TabsTrigger>
                        <TabsTrigger value="execution" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-8">Execution</TabsTrigger>
                        <TabsTrigger value="metrics" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-8">Metrics</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-background">
                    <TabsContent value="code" className="mt-0 h-full flex flex-col">
                        <div className="flex-1 rounded-xl overflow-hidden border border-border bg-[#0D1117] flex flex-col min-h-[500px]">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                                <span className="text-xs font-mono text-muted-foreground">TYPESCRIPT</span>
                                <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={() => script.code && navigator.clipboard.writeText(script.code)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                                {script.code ? (
                                    <CodeViewer code={script.code} language="typescript" className="h-full" />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No code generated for this script.
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="execution" className="mt-0 h-full">
                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex-1 bg-[#0D1117] p-4 rounded-xl border border-white/10 font-mono text-sm text-slate-300 overflow-x-auto whitespace-pre relative min-h-[400px]">
                                {isRunning ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center space-y-3">
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                                            <p className="text-slate-400">Executing Playwright Test...</p>
                                        </div>
                                    </div>
                                ) : (
                                    script.executionResult?.output || 'No execution logs available.'
                                )}
                            </div>
                            <Button
                                onClick={() => onRun?.(script.id)}
                                disabled={isRunning}
                                className={cn(
                                    "w-full text-white transition-all",
                                    isRunning ? "bg-slate-700" : "bg-[#3B82F6] hover:bg-[#2563EB]"
                                )}
                            >
                                {isRunning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Running Test...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        {script.executionResult ? 'Re-run Test' : 'Run Test'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="metrics" className="mt-0 h-full">
                        <div className="grid grid-cols-2 gap-4 max-w-2xl">
                            {/* Pass Rate */}
                            <div className="p-6 rounded-2xl border border-white/10 bg-[#0D1117]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        script.passRate >= 80 ? "bg-emerald-500" : "bg-rose-500"
                                    )}>
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">Pass Rate</span>
                                </div>
                                <div className="text-4xl font-bold text-white mt-2">{script.passRate}%</div>
                            </div>

                            {/* Avg Duration */}
                            <div className="p-6 rounded-2xl border border-white/10 bg-[#0D1117]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-500">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">Avg Duration</span>
                                </div>
                                <div className="text-4xl font-bold text-white mt-2">
                                    {script.executionResult?.duration_ms ? `${script.executionResult.duration_ms}ms` : '2341ms'}
                                </div>
                            </div>

                            {/* Last Run */}
                            <div className="p-6 rounded-2xl border border-white/10 bg-[#0D1117]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-purple-500">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">Last Run</span>
                                </div>
                                <div className="text-2xl font-bold text-white mt-2">
                                    {script.lastRun || '2 hours ago'}
                                </div>
                            </div>

                            {/* Total Runs */}
                            <div className="p-6 rounded-2xl border border-white/10 bg-[#0D1117]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-orange-500">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">Total Runs</span>
                                </div>
                                <div className="text-4xl font-bold text-white mt-2">
                                    {script.executionResult ? '1' : '0'}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
