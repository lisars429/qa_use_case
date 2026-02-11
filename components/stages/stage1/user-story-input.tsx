'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { UserStoryInput, TestabilityInsight } from '@/lib/types/pipeline'

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
            // TODO: Add error toast notification
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
                {/* User Story - Required */}
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
                    <p className="text-xs text-muted-foreground">
                        Describe the feature or functionality from a user's perspective
                    </p>
                </div>

                {/* Detailed Description - Optional */}
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

                {/* Acceptance Criteria - Optional */}
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
                    <p className="text-xs text-muted-foreground">
                        Define the conditions that must be met for this story to be considered complete
                    </p>
                </div>

                {/* Submit Button */}
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
