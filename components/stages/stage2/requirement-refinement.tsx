'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { RequirementRefinementInput, RequirementRefinementResult, UserStoryInput } from '@/lib/types/pipeline'

interface RequirementRefinementProps {
    userStoryInput: UserStoryInput
    clarificationQuestions: string[]
    onRefinementComplete: (result: RequirementRefinementResult) => void
}

export function RequirementRefinement({
    userStoryInput,
    clarificationQuestions,
    onRefinementComplete,
}: RequirementRefinementProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [iterationCount, setIterationCount] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }))
    }

    const handleRefine = async () => {
        const clarifications = clarificationQuestions.map((question, index) => ({
            question,
            answer: answers[index] || '',
        })).filter(item => item.answer.trim() !== '')

        if (clarifications.length === 0) {
            return
        }

        setIsLoading(true)
        try {
            const input: RequirementRefinementInput = {
                user_story: userStoryInput.user_story,
                detailed_description: userStoryInput.detailed_description,
                acceptance_criteria: userStoryInput.acceptance_criteria,
                clarifications,
            }
            const result = await api.refineRequirements(input)
            setIterationCount(prev => prev + 1)
            onRefinementComplete(result)
            // Clear answers after successful refinement
            setAnswers({})
        } catch (error) {
            console.error('Failed to refine requirements:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const answeredCount = Object.values(answers).filter(a => a.trim() !== '').length
    const canRefine = answeredCount > 0

    if (clarificationQuestions.length === 0) {
        return null
    }

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
                    <Badge variant="secondary" className="text-xs">
                        Iteration {iterationCount}
                    </Badge>
                )}
            </div>

            <div className="space-y-4">
                {/* Clarification Questions */}
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

                {/* Progress Indicator */}
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

                {/* Refine Button */}
                <Button
                    onClick={handleRefine}
                    disabled={!canRefine || isLoading}
                    className="w-full bg-primary text-primary-foreground"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Refining Requirements...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Refine & Re-run Stage 2
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}
