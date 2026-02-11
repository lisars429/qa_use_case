'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExpandableCard, StatusBadge } from '@/components/shared'
import { Loader2, FileText, CheckCircle2, Download, Plus } from 'lucide-react'
import { api } from '@/lib/api/client'
import { usePipelineData } from '@/lib/context/pipeline-data-context'
import type { TestCaseGenerationInput, TestScenarios, TestCase } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

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
                enriched_context: userStoryInput.detailed_description,
            }
            const generatedResult = await api.generateTestCases(input)
            setResult(generatedResult)
            onGenerationComplete(generatedResult)

            // Save test cases to context for cross-module access with user story metadata
            addTestCases(
                generatedResult.test_cases,
                userStoryId || 'unknown',
                userStoryInput
            )
        } catch (error) {
            console.error('Failed to generate test cases:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleTestCaseSelection = (testId: string) => {
        setSelectedTestCases(prev => {
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
        const selected = result.test_cases.filter(tc => selectedTestCases.has(tc.test_id))
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
            <Card className="p-6 bg-card border-border">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-primary/10">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Stage 4: Test Case Generation
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Generate comprehensive test cases covering happy paths, negative scenarios, and edge cases
                        </p>
                    </div>
                    <Button
                        onClick={handleGenerateTestCases}
                        disabled={isLoading}
                        className="bg-primary text-primary-foreground"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating Test Cases...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Test Cases
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        )
    }

    const stats = {
        total: result.test_cases.length,
        happyPath: result.test_cases.filter(tc => tc.test_type === 'Happy Path').length,
        negative: result.test_cases.filter(tc => tc.test_type === 'Negative').length,
        validation: result.test_cases.filter(tc => tc.test_type === 'Validation').length,
        highPriority: result.test_cases.filter(tc => tc.priority === 'High').length,
    }

    return (
        <div className="space-y-4">
            {/* Header with Summary */}
            <Card className="p-4 bg-green-500/5 border-2 border-green-500/20">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {result.test_cases.length} Test Cases Generated
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleGenerateTestCases} disabled={isLoading}>
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : 'Regenerate'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportSelected}
                            disabled={selectedTestCases.size === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export ({selectedTestCases.size})
                        </Button>
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
                    <p className="text-xs text-muted-foreground mb-1">Happy Path</p>
                    <p className="text-2xl font-bold text-green-600">{stats.happyPath}</p>
                </Card>
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">Negative</p>
                    <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
                </Card>
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">Validation</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.validation}</p>
                </Card>
                <Card className="p-3 bg-card border-border">
                    <p className="text-xs text-muted-foreground mb-1">High Priority</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
                </Card>
            </div>

            {/* Test Cases Table - Simpler View */}
            <Card className="bg-card border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary/50">
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedTestCases.size === result.test_cases.length}
                                    onChange={() => {
                                        if (selectedTestCases.size === result.test_cases.length) {
                                            setSelectedTestCases(new Set())
                                        } else {
                                            setSelectedTestCases(new Set(result.test_cases.map(tc => tc.test_id)))
                                        }
                                    }}
                                    className="w-4 h-4 rounded border-border"
                                />
                            </TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Test Case Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Steps</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {result.test_cases.map((testCase) => (
                            <TableRow key={testCase.test_id} className="hover:bg-secondary/30">
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedTestCases.has(testCase.test_id)}
                                        onChange={() => toggleTestCaseSelection(testCase.test_id)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                </TableCell>
                                <TableCell className="font-mono text-xs">{testCase.test_id}</TableCell>
                                <TableCell className="font-medium">{testCase.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn('text-[10px] px-1', getTestTypeColor(testCase.test_type))}>
                                        {testCase.test_type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn('text-[10px] px-1', getPriorityColor(testCase.priority))}>
                                        {testCase.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {testCase.steps.length} steps
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Proceed Button */}
            <Button className="w-full bg-primary text-primary-foreground">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Proceed to Stage 5: DOM Mapping
            </Button>
        </div>
    )
}

// ============================================================================
// Combined Stage 4 Component Export
// ============================================================================

export const Stage4TestGeneration = {
    Generator: TestCaseGenerator,
}
