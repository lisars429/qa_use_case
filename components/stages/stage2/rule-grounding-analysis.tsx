'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge, ExpandableCard } from '@/components/shared'
import { Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { RuleGroundingInput, RuleAuditResult, UserStoryInput } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

interface RuleGroundingAnalysisProps {
    userStoryInput: UserStoryInput
    stage1Behaviors?: string[]
    onAnalysisComplete: (result: RuleAuditResult) => void
    initialResult?: RuleAuditResult
}

export function RuleGroundingAnalysis({
    userStoryInput,
    stage1Behaviors,
    onAnalysisComplete,
    initialResult,
}: RuleGroundingAnalysisProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<RuleAuditResult | null>(initialResult || null)
    const [activeTab, setActiveTab] = useState('rules')

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
            {/* Status Header */}
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
                            <h3 className="text-lg font-semibold text-foreground">
                                {result.rule_status}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.status_reason}</p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRunAnalysis}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Re-analyzing...
                            </>
                        ) : (
                            'Re-run Analysis'
                        )}
                    </Button>
                </div>
            </Card>

            {/* Tabbed Results */}
            <Card className="bg-card border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-border px-4">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="rules" className="data-[state=active]:bg-secondary">
                                Explicit Rules ({result.explicit_rules.length})
                            </TabsTrigger>
                            <TabsTrigger value="completeness" className="data-[state=active]:bg-secondary">
                                Completeness ({result.completeness_evaluation.length})
                            </TabsTrigger>
                            <TabsTrigger value="gaps" className="data-[state=active]:bg-secondary">
                                Gaps & Conflicts ({result.rule_gaps.length + result.rule_conflicts.length})
                            </TabsTrigger>
                            <TabsTrigger value="clarifications" className="data-[state=active]:bg-secondary">
                                Clarifications ({result.clarification_questions.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Explicit Rules Tab */}
                    <TabsContent value="rules" className="p-4 space-y-3">
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                                Extracted Business Rules
                            </h4>
                            <div className="space-y-2">
                                {result.explicit_rules.map((rule, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-border"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm text-foreground flex-1">{rule}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Completeness Tab */}
                    <TabsContent value="completeness" className="p-4">
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                                Completeness Evaluation
                            </h4>
                            <div className="border border-border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-secondary hover:bg-secondary">
                                            <TableHead className="text-foreground">Category</TableHead>
                                            <TableHead className="text-foreground">Status</TableHead>
                                            <TableHead className="text-foreground">Explanation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.completeness_evaluation.map((item, index) => (
                                            <TableRow key={index} className="border-border">
                                                <TableCell className="font-medium text-foreground">
                                                    {item.category}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        status={
                                                            item.status === 'Present' ? 'pass' :
                                                                item.status === 'Missing' ? 'fail' : 'pending'
                                                        }
                                                        label={item.status}
                                                        showIcon={false}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {item.explanation}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Gaps & Conflicts Tab */}
                    <TabsContent value="gaps" className="p-4 space-y-4">
                        {/* Rule Gaps */}
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                                Identified Rule Gaps
                            </h4>
                            {result.rule_gaps.length > 0 ? (
                                <div className="space-y-2">
                                    {result.rule_gaps.map((gap, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                                        >
                                            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-foreground flex-1">{gap}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No rule gaps identified
                                </p>
                            )}
                        </div>

                        {/* Rule Conflicts */}
                        {result.rule_conflicts.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                    Rule Conflicts
                                </h4>
                                <div className="space-y-2">
                                    {result.rule_conflicts.map((conflict, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                                        >
                                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-foreground flex-1">{conflict}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Clarifications Tab */}
                    <TabsContent value="clarifications" className="p-4">
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                                Clarification Questions
                            </h4>
                            {result.clarification_questions.length > 0 ? (
                                <div className="space-y-2">
                                    {result.clarification_questions.map((question, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                                        >
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-semibold">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm text-foreground flex-1">{question}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No clarification questions
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    )
}
