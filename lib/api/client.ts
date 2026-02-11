// ============================================================================
// API Client for Pipeline Backend
// Base URL: http://localhost:8000
// This client is ready for backend integration but currently uses mock data
// ============================================================================

import type {
    UserStoryInput,
    TestabilityInsight,
    RuleGroundingInput,
    RuleAuditResult,
    RequirementRefinementInput,
    RequirementRefinementResult,
    AmbiguityClassificationInput,
    AmbiguityClassification,
    TestCaseGenerationInput,
    TestScenarios,
    DOMMappingInput,
    DOMMappingResult,
    PlaywrightGenerationInput,
    PlaywrightScripts,
    ExecuteTestsInput,
    ExecutionResults,
    HealthStatus,
    UserStory,
} from '@/lib/types/pipeline'

import {
    mockUserStories,
    mockTestabilityInsight,
    mockRuleAuditResult,
    mockAmbiguityClassification,
    mockTestScenarios,
    mockPlaywrightScripts,
    mockExecutionResults,
    mockDOMMappingResult,
} from '@/lib/data/mock-data'

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const USE_MOCK_DATA = false // Set to false to enable real API calls

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

// Simulate API delay for realistic UX
function delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// API Client
// ============================================================================

export const api = {
    // ============================================================================
    // Health Check
    // ============================================================================

    health: async (): Promise<HealthStatus> => {
        if (USE_MOCK_DATA) {
            await delay(300)
            return {
                status: 'healthy',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
            }
        }
        return fetchAPI<HealthStatus>('/health')
    },

    // ============================================================================
    // Stage 1: Testability Analysis
    // ============================================================================

    analyzeTestability: async (data: UserStoryInput): Promise<TestabilityInsight> => {
        if (USE_MOCK_DATA) {
            await delay(1500)
            return mockTestabilityInsight
        }
        return fetchAPI<TestabilityInsight>('/api/v1/analyze', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // ============================================================================
    // Stage 2: Rule Grounding
    // ============================================================================

    analyzeRuleGrounding: async (data: RuleGroundingInput): Promise<RuleAuditResult> => {
        if (USE_MOCK_DATA) {
            await delay(1500)
            return mockRuleAuditResult
        }
        return fetchAPI<RuleAuditResult>('/api/v1/rule-grounding', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    refineRequirements: async (data: RequirementRefinementInput): Promise<RequirementRefinementResult> => {
        if (USE_MOCK_DATA) {
            await delay(2000)
            return {
                updated_user_story: data.user_story + ' [REFINED]',
                updated_acceptance_criteria: data.acceptance_criteria || 'Updated criteria based on clarifications',
                updated_detailed_description: data.detailed_description || 'Enhanced description with clarifications',
                change_summary: `Incorporated ${data.clarifications.length} clarifications into the requirements`,
            }
        }
        return fetchAPI<RequirementRefinementResult>('/api/v1/refine-requirements', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // ============================================================================
    // Stage 3: Ambiguity Classification
    // ============================================================================

    classifyAmbiguities: async (data: AmbiguityClassificationInput): Promise<AmbiguityClassification> => {
        if (USE_MOCK_DATA) {
            await delay(1500)
            return mockAmbiguityClassification
        }
        return fetchAPI<AmbiguityClassification>('/api/v1/ambiguity-classification', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // ============================================================================
    // Stage 4: Test Case Generation
    // ============================================================================

    generateTestCases: async (data: TestCaseGenerationInput): Promise<TestScenarios> => {
        if (USE_MOCK_DATA) {
            await delay(2000)
            return mockTestScenarios
        }
        return fetchAPI<TestScenarios>('/api/v1/generate-test-cases', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // ============================================================================
    // Stage 5: DOM Mapping
    // ============================================================================

    mapDOM: async (data: DOMMappingInput): Promise<DOMMappingResult> => {
        if (USE_MOCK_DATA) {
            await delay(1500)
            return mockDOMMappingResult
        }
        return fetchAPI<DOMMappingResult>('/api/v1/dom-mapping', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // ============================================================================
    // Stage 6: Playwright Script Generation
    // ============================================================================

    generatePlaywright: async (data: PlaywrightGenerationInput): Promise<PlaywrightScripts> => {
        if (USE_MOCK_DATA) {
            await delay(2000)
            return mockPlaywrightScripts
        }
        return fetchAPI<PlaywrightScripts>('/api/v1/generate-playwright', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // ============================================================================
    // Stage 7: Test Execution
    // ============================================================================

    executeTests: async (data: ExecuteTestsInput): Promise<ExecutionResults> => {
        if (USE_MOCK_DATA) {
            await delay(3000)
            return mockExecutionResults
        }
        return fetchAPI<ExecutionResults>('/api/v1/execute-tests', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // ============================================================================
    // Playwright Status
    // ============================================================================

    playwrightStatus: async (): Promise<{ installed: boolean; version?: string }> => {
        if (USE_MOCK_DATA) {
            await delay(300)
            return {
                installed: true,
                version: '1.40.0',
            }
        }
        return fetchAPI('/api/v1/playwright-status')
    },

    // ============================================================================
    // User Stories
    // ============================================================================

    getUserStories: async (): Promise<UserStory[]> => {

        await delay(800)
        return mockUserStories

        return fetchAPI<UserStory[]>('/api/v1/user-stories')
    },
}

// ============================================================================
// Export configuration for toggling mock data
// ============================================================================

export const toggleMockData = (useMock: boolean) => {
    // This would require making USE_MOCK_DATA mutable
    // For now, change it directly in the code above
    console.log(`Mock data mode: ${useMock ? 'ENABLED' : 'DISABLED'}`)
}

export const isMockMode = () => USE_MOCK_DATA
