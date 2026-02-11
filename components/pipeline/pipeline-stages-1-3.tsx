'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowVisualization } from '@/components/shared'
import { UserStoryInputForm, TestabilityResults } from '@/components/stages/stage1'
import { RuleGroundingAnalysis, RequirementRefinement } from '@/components/stages/stage2'
import { AmbiguityClassification } from '@/components/stages/stage3'
import type {
    UserStoryInput,
    TestabilityInsight,
    RuleAuditResult,
    AmbiguityClassification as AmbiguityClassificationType,
    RequirementRefinementResult,
} from '@/lib/types/pipeline'

interface PipelineStages1to3Props {
    userStoryId: string
    initialData?: Partial<UserStoryInput>
}

export function PipelineStages1to3({ userStoryId, initialData }: PipelineStages1to3Props) {
    const [currentStage, setCurrentStage] = useState(1)
    const [activeTab, setActiveTab] = useState('stage1')

    // Stage results
    const [userStoryInput, setUserStoryInput] = useState<UserStoryInput | null>(null)
    const [stage1Result, setStage1Result] = useState<TestabilityInsight | null>(null)
    const [stage2Result, setStage2Result] = useState<RuleAuditResult | null>(null)
    const [stage3Result, setStage3Result] = useState<AmbiguityClassificationType | null>(null)

    const handleStage1Complete = (result: TestabilityInsight, input: UserStoryInput) => {
        setStage1Result(result)
        setUserStoryInput(input)
        setCurrentStage(2)
        setActiveTab('stage2')
    }

    const handleStage2Complete = (result: RuleAuditResult) => {
        setStage2Result(result)
        setCurrentStage(3)
        setActiveTab('stage3')
    }

    const handleRefinementComplete = (result: RequirementRefinementResult) => {
        // Update user story input with refined data
        if (userStoryInput) {
            setUserStoryInput({
                user_story: result.updated_user_story,
                detailed_description: result.updated_detailed_description,
                acceptance_criteria: result.updated_acceptance_criteria,
            })
        }
        // Reset stage 2 to re-run with refined data
        setStage2Result(null)
    }

    const handleStage3Complete = (result: AmbiguityClassificationType) => {
        setStage3Result(result)
        setCurrentStage(4)
        // Stage 4 will be handled in Test Cases module
    }

    return (
        <div className="space-y-6">
            {/* Workflow Visualization */}
            <WorkflowVisualization currentStage={currentStage} />

            {/* Pipeline Stages */}
            <Card className="bg-card border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-border px-4">
                        <TabsList className="bg-transparent">
                            <TabsTrigger
                                value="stage1"
                                className="data-[state=active]:bg-secondary"
                                disabled={currentStage < 1}
                            >
                                Stage 1: Testability
                            </TabsTrigger>
                            <TabsTrigger
                                value="stage2"
                                className="data-[state=active]:bg-secondary"
                                disabled={currentStage < 2}
                            >
                                Stage 2: Rule Grounding
                            </TabsTrigger>
                            <TabsTrigger
                                value="stage3"
                                className="data-[state=active]:bg-secondary"
                                disabled={currentStage < 3}
                            >
                                Stage 3: Ambiguity
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Stage 1: Testability Analysis */}
                    <TabsContent value="stage1" className="p-6 space-y-4">
                        {!stage1Result ? (
                            <UserStoryInputForm
                                onAnalysisComplete={handleStage1Complete}
                                initialData={initialData}
                            />
                        ) : (
                            <TestabilityResults
                                result={stage1Result}
                                onProceed={() => setActiveTab('stage2')}
                            />
                        )}
                    </TabsContent>

                    {/* Stage 2: Rule Grounding */}
                    <TabsContent value="stage2" className="p-6 space-y-4">
                        {userStoryInput && (
                            <>
                                <RuleGroundingAnalysis
                                    userStoryInput={userStoryInput}
                                    stage1Behaviors={stage1Result?.explicitly_stated_behaviors}
                                    onAnalysisComplete={handleStage2Complete}
                                    initialResult={stage2Result || undefined}
                                />

                                {stage2Result && stage2Result.clarification_questions.length > 0 && (
                                    <RequirementRefinement
                                        userStoryInput={userStoryInput}
                                        clarificationQuestions={stage2Result.clarification_questions}
                                        onRefinementComplete={handleRefinementComplete}
                                    />
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* Stage 3: Ambiguity Classification */}
                    <TabsContent value="stage3" className="p-6 space-y-4">
                        {userStoryInput && stage2Result && (
                            <AmbiguityClassification
                                userStoryInput={userStoryInput}
                                clarificationQuestions={stage2Result.clarification_questions}
                                onClassificationComplete={handleStage3Complete}
                                initialResult={stage3Result || undefined}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    )
}
