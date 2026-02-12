'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowVisualization } from '@/components/shared'
import { Stage1Testability } from './stage1-testability'
import { Stage2RuleGrounding } from './stage2-rule-grounding'
import { Stage3Ambiguity } from './stage3-ambiguity'
import { Stage4TestGeneration } from './stage4-test-generation'
import { Stage5DOMMapping } from '@/components/modules/test-cases/pipeline/stage5-dom-mapping'
import { Stage6ScriptGeneration } from '@/components/modules/test-scripts/pipeline/stage6-script-generation'
import { Stage7Execution } from '@/components/modules/test-scripts/pipeline/stage7-execution'
import { SuccessModal } from '@/components/shared/success-modal'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Zap } from 'lucide-react'
import type {
    UserStoryInput,
    TestabilityInsight,
    RuleAuditResult,
    AmbiguityClassification as AmbiguityClassificationType,
    RequirementRefinementResult,
    TestScenarios,
    DOMMappingResult,
    PlaywrightScripts,
    ExecutionResults,
} from '@/lib/types/pipeline'
import { saveActivity } from '@/app/actions/unified-store'
import { cn } from '@/lib/utils'
import { usePipelineData } from '@/lib/context/pipeline-data-context'

// ============================================================================
// Pipeline Container for Stages 1-3 (User Stories Module)
// ============================================================================

interface PipelineUnifiedProps {
    userStoryId: string
    initialData?: Partial<UserStoryInput>
    activeRange?: [number, number]
    standaloneStage?: number
    onModuleChange?: (module: 'user-stories' | 'test-cases' | 'test-scripts' | 'execution' | 'insights', state?: any) => void
}

export function PipelineUnified({ userStoryId, initialData, activeRange, standaloneStage, onModuleChange }: PipelineUnifiedProps) {
    const initialStage = standaloneStage || (activeRange ? activeRange[0] : 1)
    const [currentStage, setCurrentStage] = useState(initialStage)
    const [activeTab, setActiveTab] = useState(`stage${initialStage}`)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [generatedCount, setGeneratedCount] = useState(0)
    const [isTurboMode, setIsTurboMode] = useState(true)
    const { updateUserStoryAnalysis, addScript, getDOMMapping, generatedTestCases, userStories, getTestCaseUserStory, generatedScripts } = usePipelineData()

    // Stage results
    const [userStoryInput, setUserStoryInput] = useState<UserStoryInput | null>(null)
    const [stage1Result, setStage1Result] = useState<TestabilityInsight | null>(null)
    const [stage2Result, setStage2Result] = useState<RuleAuditResult | null>(null)
    const [stage3Result, setStage3Result] = useState<AmbiguityClassificationType | null>(null)
    const [stage4Result, setStage4Result] = useState<TestScenarios | null>(null)
    const [stage5Result, setStage5Result] = useState<DOMMappingResult | null>(null)
    const [stage6Result, setStage6Result] = useState<PlaywrightScripts | null>(null)
    const [stage7Result, setStage7Result] = useState<ExecutionResults | null>(null)

    // Hydrate state from context when entering specific stages
    useEffect(() => {
        if (standaloneStage === 6 || standaloneStage === 7) {
            // Reconstruct Stage 4 result from global test cases
            // Try to find if userStoryId matches a test case OR a user story
            let relevantTestCases = generatedTestCases.filter(tc =>
                tc.test_id === userStoryId ||
                (userStories.get(userStoryId)?.testCaseIds.includes(tc.test_id))
            )

            // Find story metadata
            const storyMeta = userStories.get(userStoryId) || getTestCaseUserStory(userStoryId)

            // If we found a story but no test cases yet, maybe they are in storyMeta
            if (relevantTestCases.length === 0 && storyMeta) {
                relevantTestCases = generatedTestCases.filter(tc =>
                    storyMeta.testCaseIds.includes(tc.test_id)
                )
            }

            if (relevantTestCases.length > 0) {
                const testCaseId = relevantTestCases[0].test_id

                setStage4Result({
                    test_cases: relevantTestCases,
                    summary: `Recovered ${relevantTestCases.length} test cases for ${userStoryId}`
                })

                const domMapping = getDOMMapping(userStoryId) || getDOMMapping(testCaseId)
                if (domMapping) {
                    setStage5Result(domMapping)
                }

                if (storyMeta) {
                    setUserStoryInput(storyMeta.userStory)
                    setStage1Result(storyMeta.stage1Result || null)
                    setStage2Result(storyMeta.stage2Result || null)
                    setStage3Result(storyMeta.stage3Result || null)
                    setStage7Result(storyMeta.stage7Result || null)
                }
            }

            // Hydrate scripts for Stage 6/7
            const scriptsForThisStory = generatedScripts.filter(gs => {
                if (gs.testCaseId === userStoryId) return true
                if (storyMeta && storyMeta.testCaseIds.includes(gs.testCaseId)) return true
                return false
            })

            console.log('PipelineUnified: Hydrating scripts for', userStoryId, 'Found:', scriptsForThisStory.length)

            if (scriptsForThisStory.length > 0) {
                const pws: PlaywrightScripts = {
                    scripts: scriptsForThisStory.map(s => s.script),
                    setup_instructions: ["Run naturally via the pipeline executor."],
                    summary: `Ready to execute ${scriptsForThisStory.length} scripts.`
                }
                setStage6Result(pws)
            } else if (standaloneStage === 7) {
                console.warn('PipelineUnified: No scripts found during hydration for Stage 7')
            }
        }
    }, [standaloneStage, userStoryId, generatedTestCases, getDOMMapping, userStories, getTestCaseUserStory, generatedScripts])

    const handleStage1Complete = async (result: TestabilityInsight, input: UserStoryInput) => {
        setStage1Result(result)
        setUserStoryInput(input)

        // Save to DB
        await saveActivity(
            'stage1_testability',
            'pipeline_step',
            result,
            {
                sessionId: userStoryId,
                stepType: 'stage1_testability',
                payload: result
            }
        )

        setCurrentStage(2)
        setActiveTab('stage2')

        // Save to global context
        updateUserStoryAnalysis(userStoryId, { stage1: result, userStory: input })
    }

    const handleStage2Complete = async (result: RuleAuditResult) => {
        setStage2Result(result)

        // Save to DB
        await saveActivity(
            'stage2_rules',
            'pipeline_step',
            result,
            {
                sessionId: userStoryId,
                stepType: 'stage2_rules',
                payload: result
            }
        )

        setCurrentStage(3)
        setActiveTab('stage3')

        // Save to global context
        updateUserStoryAnalysis(userStoryId, { stage2: result })
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

    const handleStage3Complete = async (result: AmbiguityClassificationType, forceProceed = false) => {
        setStage3Result(result)

        // Save to DB
        await saveActivity(
            'stage3_ambiguity',
            'pipeline_step',
            result,
            {
                sessionId: userStoryId,
                stepType: 'stage3_ambiguity',
                payload: result
            }
        )

        // If we are in a limited range (e.g., Stories module showing 1-3)
        if (activeRange && activeRange[1] === 3) {
            setGeneratedCount(result.clarification_items.length)
            setShowSuccessModal(true)
        } else {
            // Otherwise advance to stage 4
            setCurrentStage(4)
            setActiveTab('stage4')
        }

        // Save to global context
        updateUserStoryAnalysis(userStoryId, { stage3: result })
    }

    const handleConfirmRedirect = () => {
        if (onModuleChange) {
            onModuleChange('test-cases', { filter: userStoryId })
        }
    }

    const isWithinRange = (stageId: number) => {
        if (!activeRange) return true
        return stageId >= activeRange[0] && stageId <= activeRange[1]
    }

    const handleStage4Complete = (result: TestScenarios) => {
        setStage4Result(result)
        setCurrentStage(5)
        setActiveTab('stage5')
    }

    const handleStage5Complete = (result: DOMMappingResult) => {
        setStage5Result(result)
        setCurrentStage(6)
        setActiveTab('stage6')
    }

    const handleStage6Complete = (result: PlaywrightScripts) => {
        setStage6Result(result)

        // Save to global context for persistence across modules
        result.scripts.forEach(test => {
            addScript({
                id: `script-${test.test_id}-${Date.now()}`,
                testCaseId: test.test_id,
                testCaseName: test.test_name,
                script: test,
                domMapping: getDOMMapping(test.test_id),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
        })

        setCurrentStage(7)
        setActiveTab('stage7')

        // If we are in standalone Stage 6 mode (launched from Test Scripts)
        // Transition to execution module after scripts are generated
        if (standaloneStage === 6 && onModuleChange) {
            onModuleChange('execution', { userStoryId, scripts: result.scripts })
        }
    }

    const handleStage7Complete = (result: ExecutionResults) => {
        setStage7Result(result)
        // Save to global context for persistence across modules
        updateUserStoryAnalysis(userStoryId, { stage7: result })
    }

    return (
        <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
            {/* Workflow Visualization */}
            <WorkflowVisualization
                currentStage={currentStage}
                activeRange={activeRange}
                forceStageActive={standaloneStage}
            />

            {/* Pipeline Stages */}
            <Card className="bg-card border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-border px-4 py-2 flex items-center justify-between">
                        <TabsList className="bg-transparent">
                            {!standaloneStage || standaloneStage === 1 ? (
                                <TabsTrigger
                                    value="stage1"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 1}
                                >
                                    Stage 1: Testability
                                </TabsTrigger>
                            ) : null}
                            {!standaloneStage || standaloneStage === 2 ? (
                                <TabsTrigger
                                    value="stage2"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 2}
                                >
                                    Stage 2: Rule Grounding
                                </TabsTrigger>
                            ) : null}
                            {!standaloneStage || standaloneStage === 3 ? (
                                <TabsTrigger
                                    value="stage3"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 3}
                                >
                                    Stage 3: Ambiguity
                                </TabsTrigger>
                            ) : null}
                            {(!standaloneStage || standaloneStage === 4) && isWithinRange(4) ? (
                                <TabsTrigger
                                    value="stage4"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 4}
                                >
                                    Stage 4: Test Cases
                                </TabsTrigger>
                            ) : null}
                            {(!standaloneStage || standaloneStage === 5) && isWithinRange(5) ? (
                                <TabsTrigger
                                    value="stage5"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 5}
                                >
                                    Stage 5: DOM Mapping
                                </TabsTrigger>
                            ) : null}
                            {(!standaloneStage || standaloneStage === 6) && isWithinRange(6) && (
                                <TabsTrigger
                                    value="stage6"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 6}
                                >
                                    Stage 6: Scripts
                                </TabsTrigger>
                            )}
                            {(standaloneStage === 7) && isWithinRange(7) && (
                                <TabsTrigger
                                    value="stage7"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 7}
                                >
                                    Stage 7: Execution
                                </TabsTrigger>
                            )}
                            {(!standaloneStage) && isWithinRange(7) && (
                                <TabsTrigger
                                    value="stage7"
                                    className="data-[state=active]:bg-secondary"
                                    disabled={currentStage < 7}
                                >
                                    Stage 7: Execution
                                </TabsTrigger>
                            )}
                        </TabsList>

                        {(!standaloneStage) && (
                            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                                <Zap className={cn("w-3.5 h-3.5", isTurboMode ? "text-primary fill-primary animate-pulse" : "text-muted-foreground")} />
                                <Label htmlFor="turbo-mode" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Turbo Mode</Label>
                                <Switch
                                    id="turbo-mode"
                                    checked={isTurboMode}
                                    onCheckedChange={setIsTurboMode}
                                    className="scale-75 data-[state=checked]:bg-primary"
                                />
                            </div>
                        )}
                    </div>

                    <Card className="bg-slate-950/20 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">

                        {/* Stage 1: Testability Analysis */}
                        <TabsContent value="stage1" className="p-6 space-y-4">
                            {!stage1Result ? (
                                <Stage1Testability.InputForm
                                    onAnalysisComplete={handleStage1Complete}
                                    initialData={initialData}
                                />
                            ) : (
                                <Stage1Testability.Results
                                    result={stage1Result}
                                    onProceed={() => setActiveTab('stage2')}
                                />
                            )}
                        </TabsContent>

                        {/* Stage 2: Rule Grounding */}
                        <TabsContent value="stage2" className="p-6 space-y-4">
                            {userStoryInput && (
                                <>
                                    <Stage2RuleGrounding.Analysis
                                        userStoryInput={userStoryInput}
                                        stage1Behaviors={stage1Result?.explicitly_stated_behaviors}
                                        onAnalysisComplete={handleStage2Complete}
                                        initialResult={stage2Result || undefined}
                                        isTurboMode={isTurboMode}
                                    />

                                    {stage2Result && stage2Result.clarification_questions.length > 0 && (
                                        <Stage2RuleGrounding.Refinement
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
                                <Stage3Ambiguity.Classification
                                    userStoryInput={userStoryInput}
                                    clarificationQuestions={stage2Result.clarification_questions}
                                    onClassificationComplete={handleStage3Complete}
                                    initialResult={stage3Result || undefined}
                                    isTurboMode={isTurboMode}
                                />
                            )}
                        </TabsContent>

                        {/* Stage 4: Test Case Generation */}
                        <TabsContent value="stage4" className="p-6 space-y-4">
                            {userStoryInput && (
                                <Stage4TestGeneration.Generator
                                    userStoryInput={userStoryInput}
                                    stage1Behaviors={stage1Result?.explicitly_stated_behaviors}
                                    stage2Rules={stage2Result?.explicit_rules}
                                    onGenerationComplete={handleStage4Complete}
                                    initialResult={stage4Result || undefined}
                                    userStoryId={userStoryId}
                                />
                            )}
                        </TabsContent>

                        {/* Stage 5: DOM Mapping */}
                        <TabsContent value="stage5" className="p-6 space-y-4">
                            <Stage5DOMMapping.Mapper
                                testCaseIds={stage4Result?.test_cases.map(tc => tc.test_id) || []}
                                onMappingComplete={handleStage5Complete}
                                initialResult={stage5Result || undefined}
                            />
                        </TabsContent>

                        {/* Stage 6: Playwright Script Generation */}
                        <TabsContent value="stage6" className="p-6 space-y-4">
                            <Stage6ScriptGeneration.Generator
                                userStory={userStoryInput?.user_story || ''}
                                explicitRules={stage2Result?.explicit_rules || []}
                                testCases={stage4Result?.test_cases.map(tc => ({
                                    test_id: tc.test_id,
                                    name: tc.name,
                                    steps: tc.steps
                                })) || []}
                                domElements={stage5Result?.elements.map(e => ({
                                    id: e.id,
                                    selector: e.selector,
                                    xpath: e.xpath || ''
                                })) || []}
                                onGenerationComplete={handleStage6Complete}
                                initialResult={stage6Result || undefined}
                            />
                        </TabsContent>

                        {/* Stage 7: Execution */}
                        <TabsContent value="stage7" className="p-6 space-y-4">
                            <Stage7Execution.Executor
                                scripts={stage6Result?.scripts.map(s => ({
                                    test_id: s.test_id,
                                    test_name: s.test_name,
                                    code: s.code
                                })) || []}
                                baseUrl="https://app.example.com"
                                onExecutionComplete={handleStage7Complete}
                                initialResult={stage7Result || undefined}
                            />
                        </TabsContent>
                    </Card>
                </Tabs>
            </Card>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onConfirm={handleConfirmRedirect}
                count={0}
                targetModule="Test Cases"
                title="Requirements Refined!"
                description="Your user story is now clear and testable. Proceed to Test Cases to view the generated scenarios."
            />
        </div>
    )
}
