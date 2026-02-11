'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Play, CheckCircle2, XCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { ExpandableCard } from '@/components/shared'
import { api } from '@/lib/api/client'
import type { ExecuteTestsInput, ExecutionResults, TestExecutionResult } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

// ============================================================================
// Stage 7: Test Execution
// ============================================================================

interface TestExecutorProps {
    scripts: Array<{
        test_id: string
        test_name: string
        code: string
    }>
    baseUrl: string
    onExecutionComplete: (result: ExecutionResults) => void
    initialResult?: ExecutionResults
}

export function TestExecutor({
    scripts,
    baseUrl,
    onExecutionComplete,
    initialResult,
}: TestExecutorProps) {
    const [isExecuting, setIsExecuting] = useState(false)
    const [result, setResult] = useState<ExecutionResults | null>(initialResult || null)
    const [progress, setProgress] = useState(0)

    const handleExecuteTests = async () => {
        setIsExecuting(true)
        setProgress(0)
        try {
            const input: ExecuteTestsInput = {
                scripts: scripts.map(s => ({
                    test_id: s.test_id,
                    test_name: s.test_name,
                    code: s.code,
                    imports: [],
                    description: s.test_name
                })),
                base_url: baseUrl,
            }

            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90))
            }, 500)

            const executionResult = await api.executeTests(input)

            clearInterval(progressInterval)
            setProgress(100)
            setResult(executionResult)
            onExecutionComplete(executionResult)
        } catch (error) {
            console.error('Failed to execute tests:', error)
        } finally {
            setIsExecuting(false)
        }
    }

    const handleRerunFailed = async () => {
        if (!result) return
        const failedTests = result.test_results.filter(t => t.status === 'failed')
        if (failedTests.length === 0) return

        setIsExecuting(true)
        setProgress(0)
        try {
            const input: ExecuteTestsInput = {
                scripts: failedTests.map(t => {
                    const script = scripts.find(s => s.test_id === t.test_id)
                    return {
                        test_id: t.test_id,
                        test_name: script?.test_name || t.test_id,
                        code: script?.code || '',
                        imports: [],
                        description: script?.test_name || t.test_id
                    }
                }),
                base_url: baseUrl,
            }

            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90))
            }, 500)

            const executionResult = await api.executeTests(input)

            clearInterval(progressInterval)
            setProgress(100)

            // Merge results
            const updatedResults = result.test_results.map(oldResult => {
                const newResult = executionResult.test_results.find(r => r.test_id === oldResult.test_id)
                return newResult || oldResult
            })

            const updatedResult: ExecutionResults = {
                ...executionResult,
                test_results: updatedResults,
            }

            setResult(updatedResult)
            onExecutionComplete(updatedResult)
        } catch (error) {
            console.error('Failed to rerun tests:', error)
        } finally {
            setIsExecuting(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'passed':
                return <CheckCircle2 className="w-4 h-4 text-green-600" />
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-600" />
            case 'skipped':
                return <AlertCircle className="w-4 h-4 text-yellow-600" />
            default:
                return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'passed':
                return 'bg-green-500/10 text-green-600 border-green-500/20'
            case 'failed':
                return 'bg-red-500/10 text-red-600 border-red-500/20'
            case 'skipped':
                return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
            default:
                return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        }
    }

    if (!result) {
        return (
            <Card className="p-6 bg-card border-border">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-primary/10">
                            <Play className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Stage 7: Test Execution
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Execute your Playwright tests and view real-time results
                        </p>
                    </div>
                    <Button
                        onClick={handleExecuteTests}
                        disabled={isExecuting}
                        className="bg-primary text-primary-foreground"
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Executing Tests...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Execute Tests
                            </>
                        )}
                    </Button>

                    {isExecuting && (
                        <div className="max-w-md mx-auto space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">Running tests... {progress}%</p>
                        </div>
                    )}
                </div>
            </Card>
        )
    }

    const stats = {
        total: result.test_results.length,
        passed: result.test_results.filter(t => t.status === 'passed').length,
        failed: result.test_results.filter(t => t.status === 'failed').length,
        skipped: result.test_results.filter(t => t.status === 'skipped').length,
        passRate: Math.round((result.test_results.filter(t => t.status === 'passed').length / result.test_results.length) * 100),
    }

    return (
        <div className="space-y-4">
            {/* Header with Summary */}
            <Card className={cn(
                "p-4 border-2",
                stats.failed === 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
            )}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {stats.failed === 0 ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <h3 className="text-lg font-semibold text-foreground">
                                Test Execution Complete
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Successfully executed {stats.total} tests with a {stats.passRate}% pass rate.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleExecuteTests} disabled={isExecuting}>
                            {isExecuting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running...</> : 'Rerun All'}
                        </Button>
                        {stats.failed > 0 && (
                            <Button size="sm" variant="outline" onClick={handleRerunFailed} disabled={isExecuting}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Rerun Failed ({stats.failed})
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-5 gap-4">
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </Card>
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">Passed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                </Card>
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </Card>
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">Skipped</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.skipped}</p>
                </Card>
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">Pass Rate</p>
                    <p className="text-2xl font-bold text-accent">{stats.passRate}%</p>
                </Card>
            </div>

            {/* Test Results */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Test Results</h4>

                {result.test_results.map((testResult, index) => (
                    <ExpandableCard
                        key={testResult.test_id}
                        title={scripts.find(s => s.test_id === testResult.test_id)?.test_name || testResult.test_id}
                        defaultExpanded={testResult.status === 'failed'}
                        badge={
                            <div className="flex items-center gap-2">
                                {getStatusIcon(testResult.status)}
                                <Badge variant="outline" className={cn('text-xs capitalize', getStatusColor(testResult.status))}>
                                    {testResult.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {testResult.duration_ms}ms
                                </span>
                            </div>
                        }
                    >
                        <div className="space-y-3">
                            {/* Test ID */}
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Test ID</p>
                                <p className="text-sm text-primary font-mono">{testResult.test_id}</p>
                            </div>

                            {/* Error Message (if failed) */}
                            {testResult.status === 'failed' && testResult.error && (
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Error Message</p>
                                    <div className="bg-red-500/5 border border-red-500/20 rounded p-3">
                                        <p className="text-sm text-red-600 font-mono whitespace-pre-wrap">
                                            {testResult.error}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Screenshots (if available) */}
                            {(testResult as any).screenshots && (testResult as any).screenshots.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Screenshots</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(testResult as any).screenshots.map((screenshot: string, idx: number) => (
                                            <div key={idx} className="border border-border rounded overflow-hidden">
                                                <img src={screenshot} alt={`Screenshot ${idx + 1}`} className="w-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Logs (if available) */}
                            {(testResult as any).logs && (testResult as any).logs.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Logs</p>
                                    <div className="bg-secondary rounded p-3 max-h-40 overflow-y-auto">
                                        {(testResult as any).logs.map((log: string, idx: number) => (
                                            <p key={idx} className="text-xs text-foreground font-mono">{log}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ExpandableCard>
                ))}
            </div>

            {/* Completion Message */}
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <div>
                        <h4 className="font-semibold text-foreground">Pipeline Complete!</h4>
                        <p className="text-sm text-muted-foreground">
                            All 7 stages of the QA pipeline have been executed successfully.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}

// ============================================================================
// Combined Stage 7 Component Export
// ============================================================================

export const Stage7Execution = {
    Executor: TestExecutor,
}
