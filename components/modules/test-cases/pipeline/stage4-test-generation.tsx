'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExpandableCard, StatusBadge } from '@/components/shared'
import { Loader2, FileText, CheckCircle2, Download, Plus, Edit2, Save, Trash2, X, ChevronRight, Wand2, RotateCw, Sparkles, Zap } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { TestCaseGenerationInput, TestScenarios, TestCase } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'
import { usePipelineData } from '@/lib/context/pipeline-data-context'

// ============================================================================
// Stage 4: Test Case Generation
// ============================================================================

interface TestCaseGeneratorProps {
    userStoryInput: {
        user_story: string
        detailed_description?: string
        acceptance_criteria?: string
    }
    stage1Behaviors?: string[]
    stage2Rules?: string[]
    onGenerationComplete: (result: TestScenarios) => void
    initialResult?: TestScenarios
    userStoryId?: string
    isTurboMode?: boolean
}

export function TestCaseGenerator({
    userStoryInput,
    stage1Behaviors,
    stage2Rules,
    onGenerationComplete,
    initialResult,
    userStoryId,
    isTurboMode,
}: TestCaseGeneratorProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<TestScenarios | null>(initialResult || null)
    const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
    const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null)
    const [editedTestCase, setEditedTestCase] = useState<TestCase | null>(null)
    const { addTestCases } = usePipelineData()

    useEffect(() => {
        if (isTurboMode && !result && !isLoading) {
            handleGenerateTestCases()
        }
    }, [isTurboMode, result, isLoading])

    const handleGenerateTestCases = async () => {
        setIsLoading(true)
        try {
            const input: TestCaseGenerationInput = {
                user_story: userStoryInput.user_story,
                explicit_rules: stage2Rules || [],
                explicit_behaviors: stage1Behaviors || [],
                enriched_context: userStoryInput.detailed_description,
            }
            const generatedResult = await api.generateTestCases(input)
            // We only save to context, we don't proceed yet
            setResult(generatedResult)

            // Select all by default
            setSelectedTestCases(new Set(generatedResult.test_cases.map(tc => tc.test_id)))
        } catch (error) {
            console.error('Failed to generate test cases:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleProceed = () => {
        if (!result) return

        // Filter for only selected test cases
        const finalTestCases = result.test_cases.filter(tc => selectedTestCases.has(tc.test_id))

        // Save to context
        addTestCases(
            finalTestCases,
            userStoryId || 'unknown',
            userStoryInput
        )

        // Proceed to next module
        onGenerationComplete({
            ...result,
            test_cases: finalTestCases
        })
    }

    const startEditing = (testCase: TestCase) => {
        setEditingTestCaseId(testCase.test_id)
        setEditedTestCase({ ...testCase })
    }

    const cancelEditing = () => {
        setEditingTestCaseId(null)
        setEditedTestCase(null)
    }

    const saveEdit = () => {
        if (!result || !editedTestCase) return
        const newTestCases = result.test_cases.map(tc =>
            tc.test_id === editingTestCaseId ? editedTestCase : tc
        )
        setResult({ ...result, test_cases: newTestCases })
        setEditingTestCaseId(null)
        setEditedTestCase(null)
    }

    const deleteTestCase = (testId: string) => {
        if (!result) return
        const newTestCases = result.test_cases.filter(tc => tc.test_id !== testId)
        setResult({ ...result, test_cases: newTestCases })
        setSelectedTestCases(prev => {
            const newSet = new Set(prev)
            newSet.delete(testId)
            return newSet
        })
    }

    const toggleTestCaseSelection = (testId: string) => {
        setSelectedTestCases((prev: Set<string>) => {
            const newSet = new Set(prev)
            if (newSet.has(testId)) {
                newSet.delete(testId)
            } else {
                newSet.add(testId)
            }
            return newSet
        })
    }

    const handleExportSelected = () => {
        if (!result) return
        const selected = result.test_cases.filter((tc: TestCase) => selectedTestCases.has(tc.test_id))
        const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'test-cases.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High':
                return 'bg-red-500/10 text-red-600 border-red-500/20'
            case 'Medium':
                return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
            case 'Low':
                return 'bg-green-500/10 text-green-600 border-green-500/20'
            default:
                return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
        }
    }

    const getTestTypeColor = (type: string) => {
        switch (type) {
            case 'Happy Path':
                return 'bg-green-500/10 text-green-600 border-green-500/20'
            case 'Negative':
                return 'bg-red-500/10 text-red-600 border-red-500/20'
            case 'Validation':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
            case 'Edge Case':
                return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
            default:
                return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
        }
    }

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative p-8 rounded-2xl bg-card border border-border shadow-2xl">
                        <Wand2 className="w-16 h-16 text-primary animate-pulse" />
                    </div>
                </div>

                <div className="text-center space-y-4 max-w-md">
                    <h3 className="text-3xl font-bold text-foreground">
                        Ready to Generate?
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Our AI will analyze your {stage2Rules?.length || 0} business rules and requirements to create a comprehensive test suite.
                    </p>
                    <div className="pt-6">
                        <Button
                            onClick={handleGenerateTestCases}
                            disabled={isLoading}
                            size="lg"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-12 h-14 text-lg font-bold shadow-lg shadow-primary/20 group transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-3 animate-spin border-primary-foreground/30 border-t-primary-foreground" />
                                    Analyzing & Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                                    Generate Suite
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Hints */}
                <div className="grid grid-cols-2 gap-4 mt-16 max-w-2xl w-full">
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Grounded</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Uses explicit rules from Stage 2 as test logic foundations.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2 mb-2 text-accent">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Coverage</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Automatically includes Happy Path, Validation, and Negative scenarios.</p>
                    </div>
                </div>
            </div>
        )
    }

    const stats = {
        total: result.test_cases.length,
        happyPath: result.test_cases.filter((tc: TestCase) => tc.test_type === 'Happy Path').length,
        negative: result.test_cases.filter((tc: TestCase) => tc.test_type === 'Negative').length,
        validation: result.test_cases.filter((tc: TestCase) => tc.test_type === 'Validation').length,
        highPriority: result.test_cases.filter((tc: TestCase) => tc.priority === 'High').length,
    }

    return (
        <div className="space-y-6">
            {/* Header with Summary - Glassmorphic */}
            <div className="relative overflow-hidden rounded-2xl p-6 border border-primary/20 bg-primary/5">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-24 h-24" />
                </div>

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/20 text-primary">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">
                                {result.test_cases.length} Scenarios Ready
                            </h3>
                        </div>
                        <p className="text-muted-foreground max-w-2xl leading-relaxed italic">
                            "{result.summary}"
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleGenerateTestCases}
                            disabled={isLoading}
                            className="bg-background/50 border-border hover:bg-background h-10"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <RotateCw className="w-4 h-4 mr-2" />
                            )}
                            Regenerate
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportSelected}
                            disabled={selectedTestCases.size === 0}
                            className="bg-background/50 border-border hover:bg-background h-10"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-foreground' },
                    { label: 'Happy Path', value: stats.happyPath, color: 'text-green-500' },
                    { label: 'Negative', value: stats.negative, color: 'text-red-500' },
                    { label: 'Validation', value: stats.validation, color: 'text-blue-500' },
                    { label: 'High Priority', value: stats.highPriority, color: 'text-orange-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 transition-all hover:border-primary/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                        <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between px-2 pt-4">
                <div className="flex items-center gap-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                        Test Suite Definition
                        <Badge variant="outline" className="text-[10px] font-bold h-5">{selectedTestCases.size}/{result.test_cases.length}</Badge>
                    </h4>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            if (selectedTestCases.size === result.test_cases.length) {
                                setSelectedTestCases(new Set())
                            } else {
                                setSelectedTestCases(new Set(result.test_cases.map(tc => tc.test_id)))
                            }
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest h-8"
                    >
                        {selectedTestCases.size === result.test_cases.length ? 'Deselect All' : 'Select All'}
                    </Button>
                </div>
            </div>

            {/* Test Cases List Body */}
            <div className="space-y-3">
                {result.test_cases.map((testCase, index) => (
                    <div key={testCase.test_id} className="group transition-all">
                        <ExpandableCard
                            title={
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedTestCases.has(testCase.test_id)}
                                        onChange={() => toggleTestCaseSelection(testCase.test_id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                                    />
                                    <span className={cn(
                                        "font-bold transition-opacity",
                                        !selectedTestCases.has(testCase.test_id) && "opacity-50 line-through"
                                    )}>
                                        {testCase.name}
                                    </span>
                                </div>
                            }
                            defaultExpanded={index === 0}
                            badge={
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn('text-[10px] uppercase font-black tracking-widest h-5 px-1.5', getPriorityColor(testCase.priority))}>
                                        {testCase.priority}
                                    </Badge>
                                    <Badge variant="outline" className={cn('text-[10px] uppercase font-black tracking-widest h-5 px-1.5', getTestTypeColor(testCase.test_type))}>
                                        {testCase.test_type}
                                    </Badge>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                startEditing(testCase)
                                            }}
                                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteTestCase(testCase.test_id)
                                            }}
                                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            }
                        >
                            {editingTestCaseId === testCase.test_id && editedTestCase ? (
                                <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scenario Name</label>
                                            <input
                                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                value={editedTestCase.name}
                                                onChange={e => setEditedTestCase({ ...editedTestCase, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</label>
                                                <select
                                                    className="w-full bg-background border border-border rounded px-2 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={editedTestCase.test_type}
                                                    onChange={e => setEditedTestCase({ ...editedTestCase, test_type: e.target.value as any })}
                                                >
                                                    <option>Happy Path</option>
                                                    <option>Negative</option>
                                                    <option>Validation</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</label>
                                                <select
                                                    className="w-full bg-background border border-border rounded px-2 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={editedTestCase.priority}
                                                    onChange={e => setEditedTestCase({ ...editedTestCase, priority: e.target.value as any })}
                                                >
                                                    <option>High</option>
                                                    <option>Medium</option>
                                                    <option>Low</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                                        <textarea
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                                            value={editedTestCase.description}
                                            onChange={e => setEditedTestCase({ ...editedTestCase, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                        <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                                        <Button size="sm" onClick={saveEdit} className="bg-primary text-primary-foreground">
                                            <Save className="w-3.5 h-3.5 mr-2" />
                                            Update Scenario
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-12 gap-6 p-2">
                                    <div className="col-span-8 space-y-6">
                                        <div>
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Narrative & Context</h5>
                                            <p className="text-sm leading-relaxed text-foreground/90">{testCase.description}</p>
                                        </div>

                                        <div>
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Preconditions</h5>
                                            <ul className="space-y-2">
                                                {testCase.preconditions.map((pre, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                                        <span className="text-primary/50 font-bold">•</span>
                                                        {pre}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Execution Steps</h5>
                                            <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/50">
                                                {testCase.steps.map((step, i) => (
                                                    <div key={i} className="flex gap-4 items-start relative bg-secondary/20 p-2 rounded-lg border border-border/10">
                                                        <span className="flex-shrink-0 w-[24px] h-[24px] flex items-center justify-center rounded-full bg-background border border-border text-[10px] font-bold text-primary z-10">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-sm text-foreground/80 mt-1">{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4 border-l border-border pl-6">
                                        <div className="space-y-6 sticky top-4">
                                            <div>
                                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-success-600 mb-3">Expected Result</h5>
                                                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 shadow-sm shadow-green-500/10">
                                                    <div className="flex gap-3">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                                        <p className="text-sm font-medium text-green-900 dark:text-green-100 leading-relaxed">
                                                            {testCase.expected_result}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Traceability</span>
                                                    <span className="font-mono text-[10px] text-primary select-all">{testCase.test_id}</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="h-[2px] w-full bg-border/50 overflow-hidden rounded-full">
                                                        <div
                                                            className={cn("h-full transition-all",
                                                                testCase.priority === 'High' ? "w-full bg-red-500" :
                                                                    testCase.priority === 'Medium' ? "w-[60%] bg-yellow-500" : "w-[30%] bg-green-500"
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className="text-muted-foreground">Automation Priority</span>
                                                        <span className={cn(
                                                            testCase.priority === 'High' ? "text-red-500" :
                                                                testCase.priority === 'Medium' ? "text-yellow-600" : "text-green-600"
                                                        )}>{testCase.priority}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ExpandableCard>
                    </div>
                ))}
            </div>

            {/* Global Actions */}
            <div className="pt-8 border-t border-border mt-8">
                <div className="flex items-center justify-between gap-6 bg-secondary/30 p-6 rounded-2xl border border-border">
                    <div>
                        <h4 className="font-bold text-foreground">Review & Confirm</h4>
                        <p className="text-sm text-muted-foreground mt-1 text-balance">
                            Generating DOM Mapping requires an active URL. Ensure your test scenarios are refined before proceeding.
                        </p>
                    </div>
                    <Button
                        onClick={handleProceed}
                        disabled={selectedTestCases.size === 0}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-xl font-bold shadow-xl shadow-primary/20 flex-shrink-0 group"
                    >
                        Proceed to DOM Mapping
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// Combined Stage 4 Component Export
// ============================================================================

export const Stage4TestGeneration = {
    Generator: TestCaseGenerator,
}
