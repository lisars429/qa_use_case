'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type {
    TestCase,
    PlaywrightTest,
    ExecutionResults,
    DOMMappingResult,
    UserStoryInput,
    TestabilityInsight,
    RuleAuditResult,
    AmbiguityClassification,
} from '@/lib/types/pipeline'

// ============================================================================
// Pipeline Data Context
// Shares data between User Stories, Test Cases, and Test Scripts modules
// ============================================================================

interface GeneratedScript {
    id: string
    testCaseId: string
    testCaseName: string
    script: PlaywrightTest
    domMapping?: DOMMappingResult
    executionResult?: ExecutionResults
    createdAt: string
    updatedAt: string
}

interface UserStoryMetadata {
    userStoryId: string
    userStory: UserStoryInput
    testCaseIds: string[]
    stage1Result?: TestabilityInsight
    stage2Result?: RuleAuditResult
    stage3Result?: AmbiguityClassification
}

interface PipelineDataContextType {
    // Generated test cases from Stage 4
    generatedTestCases: TestCase[]
    addTestCases: (testCases: TestCase[], userStoryId: string, userStory: UserStoryInput) => void
    updateUserStoryAnalysis: (
        userStoryId: string,
        analysis: {
            stage1?: TestabilityInsight
            stage2?: RuleAuditResult
            stage3?: AmbiguityClassification
            userStory?: UserStoryInput
        }
    ) => void
    updateTestCase: (testCaseId: string, updates: Partial<TestCase>) => void
    removeTestCase: (testCaseId: string) => void
    bulkUpdateTestCases: (testCaseIds: string[], updates: Partial<TestCase>) => void
    addManualTestCase: (testCase: TestCase, userStoryId: string) => void

    // User story metadata
    userStories: Map<string, UserStoryMetadata>
    getUserStory: (userStoryId: string) => UserStoryMetadata | undefined
    getTestCaseUserStory: (testCaseId: string) => UserStoryMetadata | undefined

    // Generated scripts from Stage 6
    generatedScripts: GeneratedScript[]
    addScript: (script: GeneratedScript) => void
    updateScript: (scriptId: string, updates: Partial<GeneratedScript>) => void
    getScriptsByTestCase: (testCaseId: string) => GeneratedScript[]

    // Execution results from Stage 7
    addExecutionResult: (scriptId: string, result: ExecutionResults) => void
    getExecutionResult: (scriptId: string) => ExecutionResults | undefined

    // DOM mappings from Stage 5
    domMappings: Map<string, DOMMappingResult>
    addDOMMapping: (testCaseId: string, mapping: DOMMappingResult) => void
    getDOMMapping: (testCaseId: string) => DOMMappingResult | undefined
}

const PipelineDataContext = createContext<PipelineDataContextType | undefined>(undefined)

export function PipelineDataProvider({ children }: { children: ReactNode }) {
    const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([])
    const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([])
    const [domMappings, setDOMMappings] = useState<Map<string, DOMMappingResult>>(new Map())
    const [userStories, setUserStories] = useState<Map<string, UserStoryMetadata>>(new Map())

    const addTestCases = (testCases: TestCase[], userStoryId: string, userStory: UserStoryInput) => {
        setGeneratedTestCases(prev => {
            // Avoid duplicates
            const existingIds = new Set(prev.map(tc => tc.test_id))
            const newCases = testCases.filter(tc => !existingIds.has(tc.test_id))

            // Track user story metadata
            setUserStories(prevStories => {
                const newMap = new Map(prevStories)
                const existing = newMap.get(userStoryId) || {
                    userStoryId,
                    userStory,
                    testCaseIds: [],
                }
                newMap.set(userStoryId, {
                    ...existing,
                    testCaseIds: Array.from(new Set([...existing.testCaseIds, ...testCases.map(tc => tc.test_id)])),
                })
                return newMap
            })

            return [...prev, ...newCases]
        })
    }

    const updateUserStoryAnalysis = (
        userStoryId: string,
        analysis: {
            stage1?: TestabilityInsight
            stage2?: RuleAuditResult
            stage3?: AmbiguityClassification
            userStory?: UserStoryInput
        }
    ) => {
        setUserStories(prev => {
            const newMap = new Map(prev)
            const existing = newMap.get(userStoryId) || {
                userStoryId,
                userStory: analysis.userStory || { user_story: '' }, // Fallback placeholder
                testCaseIds: [],
            }
            newMap.set(userStoryId, {
                ...existing,
                stage1Result: analysis.stage1 || existing.stage1Result,
                stage2Result: analysis.stage2 || existing.stage2Result,
                stage3Result: analysis.stage3 || existing.stage3Result,
                userStory: analysis.userStory || existing.userStory,
            })
            return newMap
        })
    }

    const updateTestCase = (testCaseId: string, updates: Partial<TestCase>) => {
        setGeneratedTestCases(prev =>
            prev.map(tc => tc.test_id === testCaseId ? { ...tc, ...updates } : tc)
        )
    }

    const removeTestCase = (testCaseId: string) => {
        setGeneratedTestCases(prev => prev.filter(tc => tc.test_id !== testCaseId))
        setUserStories(prev => {
            const newMap = new Map(prev)
            for (const [id, meta] of newMap) {
                if (meta.testCaseIds.includes(testCaseId)) {
                    newMap.set(id, {
                        ...meta,
                        testCaseIds: meta.testCaseIds.filter(tid => tid !== testCaseId)
                    })
                }
            }
            return newMap
        })
    }

    const bulkUpdateTestCases = (testCaseIds: string[], updates: Partial<TestCase>) => {
        setGeneratedTestCases(prev =>
            prev.map(tc => testCaseIds.includes(tc.test_id) ? { ...tc, ...updates } : tc)
        )
    }

    const addManualTestCase = (testCase: TestCase, userStoryId: string) => {
        setGeneratedTestCases(prev => [...prev, testCase])
        setUserStories(prev => {
            const newMap = new Map(prev)
            const existing = newMap.get(userStoryId)
            if (existing) {
                newMap.set(userStoryId, {
                    ...existing,
                    testCaseIds: [...existing.testCaseIds, testCase.test_id]
                })
            }
            return newMap
        })
    }

    const getUserStory = (userStoryId: string) => {
        return userStories.get(userStoryId)
    }

    const getTestCaseUserStory = (testCaseId: string) => {
        for (const [, metadata] of userStories) {
            if (metadata.testCaseIds.includes(testCaseId)) {
                return metadata
            }
        }
        return undefined
    }

    const addScript = (script: GeneratedScript) => {
        setGeneratedScripts(prev => {
            // Check if script already exists
            const existingIndex = prev.findIndex(s => s.id === script.id)
            if (existingIndex >= 0) {
                // Update existing
                const updated = [...prev]
                updated[existingIndex] = { ...script, updatedAt: new Date().toISOString() }
                return updated
            }
            // Add new
            return [...prev, script]
        })
    }

    const updateScript = (scriptId: string, updates: Partial<GeneratedScript>) => {
        setGeneratedScripts(prev =>
            prev.map(script =>
                script.id === scriptId
                    ? { ...script, ...updates, updatedAt: new Date().toISOString() }
                    : script
            )
        )
    }

    const getScriptsByTestCase = (testCaseId: string) => {
        return generatedScripts.filter(s => s.testCaseId === testCaseId)
    }

    const addExecutionResult = (scriptId: string, result: ExecutionResults) => {
        updateScript(scriptId, { executionResult: result })
    }

    const getExecutionResult = (scriptId: string) => {
        return generatedScripts.find(s => s.id === scriptId)?.executionResult
    }

    const addDOMMapping = (testCaseId: string, mapping: DOMMappingResult) => {
        setDOMMappings(prev => new Map(prev).set(testCaseId, mapping))
    }

    const getDOMMapping = (testCaseId: string) => {
        return domMappings.get(testCaseId)
    }

    const value: PipelineDataContextType = {
        generatedTestCases,
        addTestCases,
        updateUserStoryAnalysis,
        updateTestCase,
        removeTestCase,
        bulkUpdateTestCases,
        addManualTestCase,
        userStories,
        getUserStory,
        getTestCaseUserStory,
        generatedScripts,
        addScript,
        updateScript,
        getScriptsByTestCase,
        addExecutionResult,
        getExecutionResult,
        domMappings,
        addDOMMapping,
        getDOMMapping,
    }

    return (
        <PipelineDataContext.Provider value={value}>
            {children}
        </PipelineDataContext.Provider>
    )
}

export function usePipelineData() {
    const context = useContext(PipelineDataContext)
    if (!context) {
        throw new Error('usePipelineData must be used within PipelineDataProvider')
    }
    return context
}
