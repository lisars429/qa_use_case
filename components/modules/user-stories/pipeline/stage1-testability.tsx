'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, ExpandableCard } from '@/components/shared'
import { Loader2, Sparkles, Download, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { UserStoryInput, TestabilityInsight } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

// ============================================================================
// Stage 1: User Story Input Form
// ============================================================================

interface UserStoryInputFormProps {
    onAnalysisComplete: (result: TestabilityInsight, input: UserStoryInput) => void
    initialData?: Partial<UserStoryInput>
}

export function UserStoryInputForm({ onAnalysisComplete, initialData }: UserStoryInputFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<UserStoryInput>({
        user_story: initialData?.user_story || '',
        detailed_description: initialData?.detailed_description || '',
        acceptance_criteria: initialData?.acceptance_criteria || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.user_story.trim()) {
            return
        }

        setIsLoading(true)
        try {
            const result = await api.analyzeTestability(formData)
            onAnalysisComplete(result, formData)
        } catch (error) {
            console.error('Failed to analyze testability:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const isFormValid = formData.user_story.trim().length > 0

    return (
        <Card className="p-6 bg-card border-border">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Stage 1: Testability Analysis
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Analyze your user story for testability and identify potential issues
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="user_story" className="text-sm font-medium">
                        User Story <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="user_story"
                        placeholder="As a [role], I want to [action], so that [benefit]"
                        value={formData.user_story}
                        onChange={(e) => setFormData({ ...formData, user_story: e.target.value })}
                        className="min-h-[100px] bg-input border-border"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="detailed_description" className="text-sm font-medium">
                        Detailed Description <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Textarea
                        id="detailed_description"
                        placeholder="Provide additional context, technical details, or implementation notes..."
                        value={formData.detailed_description}
                        onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                        className="min-h-[80px] bg-input border-border"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="acceptance_criteria" className="text-sm font-medium">
                        Acceptance Criteria <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Textarea
                        id="acceptance_criteria"
                        placeholder="Given [context], When [action], Then [outcome]"
                        value={formData.acceptance_criteria}
                        onChange={(e) => setFormData({ ...formData, acceptance_criteria: e.target.value })}
                        className="min-h-[80px] bg-input border-border"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing Testability...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analyze Stage 1
                        </>
                    )}
                </Button>
            </form>
        </Card>
    )
}

// ============================================================================
// Stage 1: Testability Results Display
// ============================================================================

interface TestabilityResultsProps {
    result: TestabilityInsight
    onProceed?: () => void
}

export function TestabilityResults({ result, onProceed }: TestabilityResultsProps) {
    const [activeTab, setActiveTab] = useState('behaviors')

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'testability-analysis.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const isTestReady = result.testability_status === 'Likely Test-Ready'

    return (
        <div className="space-y-4">
            <Card className={cn(
                'p-4 border-2',
                isTestReady ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
            )}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {isTestReady ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            <h3 className="text-lg font-semibold text-foreground">
                                {result.testability_status}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.status_reason}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDownload}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        {onProceed && isTestReady && (
                            <Button
                                size="sm"
                                onClick={onProceed}
                                className="bg-primary text-primary-foreground"
                            >
                                Proceed to Stage 2
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="bg-card border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-border px-4">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="behaviors">Behaviors ({result.explicitly_stated_behaviors.length})</TabsTrigger>
                            <TabsTrigger value="checklist">Checklist ({result.testability_checklist.length})</TabsTrigger>
                            <TabsTrigger value="assumptions">Assumptions ({result.assumptions_required.length})</TabsTrigger>
                            <TabsTrigger value="questions">Questions ({result.clarification_questions.length})</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="behaviors" className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Explicitly Stated Behaviors</h4>
                        <div className="space-y-2">
                            {result.explicitly_stated_behaviors.map((behavior, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-border">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm text-foreground flex-1">{behavior}</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="checklist" className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Testability Checklist</h4>
                        <div className="space-y-2">
                            {result.testability_checklist.map((item, index) => (
                                <ExpandableCard
                                    key={index}
                                    title={item.dimension}
                                    defaultExpanded={item.status !== 'Pass'}
                                    badge={
                                        <StatusBadge
                                            status={item.status === 'Pass' ? 'pass' : item.status === 'Fail' ? 'fail' : 'pending'}
                                            label={item.status}
                                            showIcon={false}
                                        />
                                    }
                                >
                                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                                </ExpandableCard>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="assumptions" className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Required Assumptions</h4>
                        {result.assumptions_required.length > 0 ? (
                            <div className="space-y-2">
                                {result.assumptions_required.map((assumption, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-foreground flex-1">{assumption}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No assumptions required</p>
                        )}
                    </TabsContent>

                    <TabsContent value="questions" className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Clarification Questions</h4>
                        {result.clarification_questions.length > 0 ? (
                            <div className="space-y-2">
                                {result.clarification_questions.map((question, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                            <HelpCircle className="w-4 h-4" />
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
// Combined Stage 1 Component Export
// ============================================================================

export const Stage1Testability = {
    InputForm: UserStoryInputForm,
    Results: TestabilityResults,
}
