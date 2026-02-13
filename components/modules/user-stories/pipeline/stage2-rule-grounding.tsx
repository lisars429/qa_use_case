'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared'
import { Shield, Loader2, CheckCircle2, AlertCircle, RotateCcw, Sparkles } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { RuleGroundingInput, RuleAuditResult, RequirementRefinementInput, RequirementRefinementResult, UserStoryInput } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

// ============================================================================
// Stage 2: Rule Grounding Analysis
// ============================================================================

interface RuleGroundingAnalysisProps {
    userStoryInput: UserStoryInput
    stage1Behaviors?: string[]
    onAnalysisComplete: (result: RuleAuditResult) => void
    initialResult?: RuleAuditResult
    isTurboMode?: boolean
    autoRun?: boolean
}

export function RuleGroundingAnalysis({
    userStoryInput,
    stage1Behaviors,
    onAnalysisComplete,
    initialResult,
    isTurboMode,
    autoRun,
}: RuleGroundingAnalysisProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<RuleAuditResult | null>(initialResult || null)
    const [activeTab, setActiveTab] = useState('rules')

    useEffect(() => {
        if ((isTurboMode || autoRun) && !result && !isLoading) {
            handleRunAnalysis()
        }
    }, [isTurboMode, autoRun, result, isLoading])

    const handleRunAnalysis = async () => {
        setIsLoading(true)
        try {
            const input: RuleGroundingInput = {
                user_story: userStoryInput.user_story,
                detailed_description: userStoryInput.detailed_description,
                acceptance_criteria: userStoryInput.acceptance_criteria,
                stage_1_behaviors: stage1Behaviors,
            }
            const analysisResult = await api.analyzeRuleGrounding(input)
            setResult(analysisResult)
            onAnalysisComplete(analysisResult)
        } catch (error) {
            console.error('Failed to analyze rule grounding:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const isRuleComplete = result?.rule_status === 'Likely Rule-Complete'

    if (!result) {
        return (
            <Card className="p-6 bg-card border-border">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-primary/10">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Stage 2: Rule Grounding & Completeness
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Extract and validate business rules from your user story to ensure completeness
                        </p>
                    </div>
                    <Button
                        onClick={handleRunAnalysis}
                        disabled={isLoading}
                        className="bg-primary text-primary-foreground"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing Rules...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 mr-2" />
                                Run Stage 2 Analysis
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card className={cn(
                'p-4 border-2',
                isRuleComplete ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
            )}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {isRuleComplete ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            <h3 className="text-lg font-semibold text-foreground">{result.rule_status}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.status_reason}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleRunAnalysis} disabled={isLoading}>
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Re-analyzing...</> : 'Re-run Analysis'}
                    </Button>
                </div>
            </Card>

            <Card className="bg-card border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-border px-4">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="rules">Explicit Rules ({result.explicit_rules.length})</TabsTrigger>
                            <TabsTrigger value="completeness">Completeness ({result.completeness_evaluation.length})</TabsTrigger>
                            <TabsTrigger value="gaps">Gaps & Conflicts ({result.rule_gaps.length + result.rule_conflicts.length})</TabsTrigger>
                            <TabsTrigger value="clarifications">Clarifications ({result.clarification_questions.length})</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="rules" className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Extracted Business Rules</h4>
                        <div className="space-y-2">
                            {result.explicit_rules.map((rule, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-border">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm text-foreground flex-1">{rule}</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="completeness" className="p-4">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Completeness Evaluation</h4>
                        <div className="border border-border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary hover:bg-secondary">
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Explanation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.completeness_evaluation.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.category}</TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={item.status === 'Present' ? 'pass' : item.status === 'Missing' ? 'fail' : 'pending'}
                                                    label={item.status}
                                                    showIcon={false}
                                                />
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{item.explanation}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="gaps" className="p-4 space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">Identified Rule Gaps</h4>
                            {result.rule_gaps.length > 0 ? (
                                <div className="space-y-2">
                                    {result.rule_gaps.map((gap, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-foreground flex-1">{gap}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No rule gaps identified</p>
                            )}
                        </div>

                        {result.rule_conflicts.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3">Rule Conflicts</h4>
                                <div className="space-y-2">
                                    {result.rule_conflicts.map((conflict, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-foreground flex-1">{conflict}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="clarifications" className="p-4">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Clarification Questions</h4>
                        {result.clarification_questions.length > 0 ? (
                            <div className="space-y-2">
                                {result.clarification_questions.map((question, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm text-foreground flex-1">{question}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No clarification questions</p>
                        )}
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    )
}

// ============================================================================
// Stage 2: Requirement Refinement
// ============================================================================

interface RequirementRefinementProps {
    userStoryInput: UserStoryInput
    clarificationQuestions: string[]
    onRefinementComplete: (result: RequirementRefinementResult) => void
    iterationCount: number
}

export function RequirementRefinement({
    userStoryInput,
    clarificationQuestions,
    onRefinementComplete,
    iterationCount,
}: RequirementRefinementProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [answers, setAnswers] = useState<Record<number, string>>({})

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }))
    }

    const handleRefine = async () => {
        const clarifications = clarificationQuestions.map((question, index) => ({
            question,
            answer: answers[index] || '',
        })).filter(item => item.answer.trim() !== '')

        if (clarifications.length === 0) return

        setIsLoading(true)
        try {
            const input: RequirementRefinementInput = {
                user_story: userStoryInput.user_story,
                detailed_description: userStoryInput.detailed_description,
                acceptance_criteria: userStoryInput.acceptance_criteria,
                clarifications,
            }
            const result = await api.refineRequirements(input)
            onRefinementComplete(result)
            setAnswers({})
        } catch (error) {
            console.error('Failed to refine requirements:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const answeredCount = Object.values(answers).filter(a => a.trim() !== '').length
    const canRefine = answeredCount > 0

    if (clarificationQuestions.length === 0) return null

    return (
        <Card className="p-6 bg-card border-border">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-primary" />
                        Requirement Refinement
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Answer clarification questions to refine and improve your requirements
                    </p>
                </div>
                {iterationCount > 0 && (
                    <Badge variant="secondary" className="text-xs">Iteration {iterationCount}</Badge>
                )}
            </div>

            <div className="space-y-4">
                {clarificationQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                        <Label htmlFor={`answer-${index}`} className="text-sm font-medium flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                            </span>
                            <span className="flex-1">{question}</span>
                        </Label>
                        <Textarea
                            id={`answer-${index}`}
                            placeholder="Enter your answer..."
                            value={answers[index] || ''}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="min-h-[80px] bg-input border-border"
                        />
                    </div>
                ))}

                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {answeredCount} of {clarificationQuestions.length} questions answered
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${(answeredCount / clarificationQuestions.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-foreground font-medium">
                            {Math.round((answeredCount / clarificationQuestions.length) * 100)}%
                        </span>
                    </div>
                </div>

                <Button onClick={handleRefine} disabled={!canRefine || isLoading} className="w-full bg-primary text-primary-foreground">
                    {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Refining Requirements...</>
                    ) : (
                        <><Sparkles className="w-4 h-4 mr-2" />Refine & Re-run Stage 2</>
                    )}
                </Button>
            </div>
        </Card>
    )
}

// ============================================================================
// Combined Stage 2 Component Export
// ============================================================================

export const Stage2RuleGrounding = {
    Analysis: RuleGroundingAnalysis,
    Refinement: RequirementRefinement,
}
