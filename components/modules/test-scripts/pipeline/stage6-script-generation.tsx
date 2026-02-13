'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Code2, CheckCircle2, Download, Copy, FileDown, Sparkles, Zap, Terminal, Globe, Shield, AlertTriangle, Info, Search, History, BarChart3, ChevronRight, FileText, CheckCircle, XCircle, Clock, Play, RotateCcw } from 'lucide-react'
import { CodeViewer } from '@/components/shared'
import { api } from '@/lib/api/client'
import type { PlaywrightGenerationInput, PlaywrightScripts, PlaywrightTest, TestCase, ExecuteTestsInput, TestExecutionResult } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

// ============================================================================
// Stage 6: Playwright Script Generation
// ============================================================================

interface PlaywrightScriptGeneratorProps {
    userStory: string
    explicitRules: string[]
    testCases: Array<{
        test_id: string
        name: string
        steps: string[]
        description?: string
        test_type?: string
        preconditions?: string[]
        expected_result?: string
    }>
    domElements: Array<{
        id: string
        selector: string
        xpath: string
    }>
    onGenerationComplete: (result: PlaywrightScripts) => void
    onProceed?: () => void
    initialResult?: PlaywrightScripts
    isTurboMode?: boolean
}

export function PlaywrightScriptGenerator({
    userStory,
    explicitRules,
    testCases,
    domElements,
    onGenerationComplete,
    onProceed,
    initialResult,
    isTurboMode,
}: PlaywrightScriptGeneratorProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<PlaywrightScripts | null>(initialResult || null)
    const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set())
    const [showRawResponse, setShowRawResponse] = useState(false)
    const [activeScriptId, setActiveScriptId] = useState<string | null>(initialResult?.scripts[0]?.test_id || null)
    const [searchQuery, setSearchQuery] = useState('')
    const [editedCode, setEditedCode] = useState<Record<string, string>>({})
    const [testExecutions, setTestExecutions] = useState<Record<string, TestExecutionResult & { isExecuting?: boolean }>>({})

    // Refinement Loop State
    const [internalUserStory, setInternalUserStory] = useState(userStory)
    const [internalRules, setInternalRules] = useState<string[]>(explicitRules)
    const [internalTestCases, setInternalTestCases] = useState(testCases)
    const [showRefinement, setShowRefinement] = useState(false)

    // Initialize edited code state when result changes
    useEffect(() => {
        if (result && Object.keys(editedCode).length === 0) {
            const initialEdits: Record<string, string> = {}
            result.scripts.forEach(s => {
                initialEdits[s.test_id] = s.code || ""
            })
            setEditedCode(initialEdits)
        }
    }, [result])

    // Helper to extract code for a specific test ID from raw LLM response if missing in structured data
    const getScriptCode = (test: PlaywrightTest) => {
        // Return edited code if available
        if (editedCode[test.test_id]) return editedCode[test.test_id]

        if (test.code) return test.code

        if (result?.raw_llm_response) {
            // Try to find code block after the test ID header
            const regex = new RegExp(`## Test Script: ${test.test_id}[\\s\\S]*?\\` + '`\\`\\`(python|typescript|javascript)?([\\s\\S]*?)\\`\\' + '`\\`\\`', 'i')
            const match = result.raw_llm_response.match(regex)
            if (match && match[2]) {
                return match[2].trim()
            }

            // Fallback: search for just the code block if only one script is expected or simple matching fails
            if (result.scripts.length === 1) {
                const singleBlockRegex = /```(?:python|typescript|javascript)?([\s\S]*?)```/i
                const singleMatch = result.raw_llm_response.match(singleBlockRegex)
                if (singleMatch && singleMatch[1]) return singleMatch[1].trim()
            }
        }

        return "// Code not found in structured data or raw response"
    }

    // Auto-generate if we have inputs but no result and Turbo Mode is active
    // REMOVED as per user request: script generation must be manual trigger
    /*
    useEffect(() => {
        if (isTurboMode && !result && !isLoading && testCases.length > 0 && domElements.length > 0) {
            handleGenerateScripts()
        }
    }, [isTurboMode, result, isLoading, testCases.length, domElements.length])
    */

    const handleGenerateScripts = async () => {
        setIsLoading(true)
        try {
            // Map test cases to the full TestCase type expected by backend if possible, 
            // or at least what the backend needs for script generation.
            const input: PlaywrightGenerationInput = {
                user_story: internalUserStory,
                test_cases: internalTestCases.map(tc => ({
                    test_id: tc.test_id,
                    name: tc.name,
                    description: tc.description || '',
                    test_type: (tc.test_type as any) || 'Happy Path',
                    preconditions: tc.preconditions || [],
                    steps: tc.steps,
                    expected_result: tc.expected_result || '',
                    priority: 'High' // Default
                })),
                dom_elements: domElements,
                explicit_rules: internalRules,
            }

            const generatedResult = await api.generatePlaywright(input)
            setResult(generatedResult)

            // Initialize edited code state
            const initialEdits: Record<string, string> = {}
            generatedResult.scripts.forEach(s => {
                initialEdits[s.test_id] = s.code || ""
            })
            setEditedCode(initialEdits)

            onGenerationComplete(generatedResult)

            // Auto-select all generated scripts and set the first one as active
            setSelectedScripts(new Set(generatedResult.scripts.map(s => s.test_id)))
            if (generatedResult.scripts.length > 0) {
                setActiveScriptId(generatedResult.scripts[0].test_id)
            }
        } catch (error) {
            console.error('Failed to generate scripts:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateSingleScript = async (testId: string) => {
        const tc = internalTestCases.find(t => t.test_id === testId)
        if (!tc) return

        setIsLoading(true)
        try {
            const input: PlaywrightGenerationInput = {
                user_story: internalUserStory,
                test_cases: [{
                    test_id: tc.test_id,
                    name: tc.name,
                    description: tc.description || '',
                    test_type: (tc.test_type as any) || 'Happy Path',
                    preconditions: tc.preconditions || [],
                    steps: tc.steps,
                    expected_result: tc.expected_result || '',
                    priority: 'High'
                }],
                dom_elements: domElements,
                explicit_rules: internalRules,
            }

            const generatedResult = await api.generatePlaywright(input)
            const newScript = generatedResult.scripts[0]

            if (newScript && result) {
                setResult(prev => {
                    if (!prev) return prev
                    const newScripts = prev.scripts.map(s =>
                        s.test_id === testId ? newScript : s
                    )
                    return { ...prev, scripts: newScripts }
                })

                // Update edited code state for this script
                setEditedCode(prev => ({
                    ...prev,
                    [testId]: newScript.code || ""
                }))
            }
        } catch (error) {
            console.error('Failed to regenerate script:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCodeChange = (testId: string, newCode: string) => {
        setEditedCode(prev => ({
            ...prev,
            [testId]: newCode
        }))
    }

    const handleRunScript = async (testId: string) => {
        const test = result?.scripts.find(s => s.test_id === testId)
        if (!test) return

        setTestExecutions(prev => ({
            ...prev,
            [testId]: { ...prev[testId], isExecuting: true, status: 'running' as any }
        }))

        try {
            const input: ExecuteTestsInput = {
                scripts: [{
                    test_id: test.test_id,
                    test_name: test.test_name,
                    code: editedCode[testId] || test.code || "",
                    imports: [],
                    description: test.description || ""
                }],
                base_url: "https://app.example.com", // Mock base URL
            }

            const executionResult = await api.executeTests(input)
            const scriptResult = executionResult.test_results[0]

            setTestExecutions(prev => ({
                ...prev,
                [testId]: { ...scriptResult, isExecuting: false }
            }))
        } catch (error) {
            console.error('Failed to run script:', error)
            setTestExecutions(prev => ({
                ...prev,
                [testId]: {
                    test_id: testId,
                    status: 'failed',
                    error: 'Execution failed: ' + (error as any).message,
                    output: "",
                    duration_ms: 0,
                    isExecuting: false
                }
            }))
        }
    }

    const handleProceed = () => {
        if (!result) return

        // Create updated result with edited code
        const updatedResult: PlaywrightScripts = {
            ...result,
            scripts: result.scripts.map(s => ({
                ...s,
                code: editedCode[s.test_id] || s.code
            }))
        }

        onGenerationComplete(updatedResult)

        // Navigate to execution stage
        if (onProceed) {
            onProceed()
        }
    }

    const toggleScriptSelection = (testId: string) => {
        setSelectedScripts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(testId)) {
                newSet.delete(testId)
            } else {
                newSet.add(testId)
            }
            return newSet
        })
    }

    const handleDownloadSelected = () => {
        if (!result) return
        const selected = result.scripts.filter(test => selectedScripts.has(test.test_id))
        const content = selected.map(test => getScriptCode(test)).join('\n\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'playwright-tests.spec.ts'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleDownloadAll = () => {
        if (!result) return
        const content = result.scripts.map(test => getScriptCode(test)).join('\n\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'all-tests.spec.ts'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const hasExtractionIssues = result?.scripts.some(s => !s.code) || false
    const activeScript = result?.scripts.find(s => s.test_id === activeScriptId) || result?.scripts[0]
    const activeTestCase = internalTestCases.find(tc => tc.test_id === activeScriptId) || internalTestCases.find(tc => tc.test_id === activeScript?.test_id)

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Initial State: Splash Screen
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if (!result) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-secondary/5 relative overflow-hidden min-h-[600px] rounded-[40px] border border-border/50">
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

                <div className="max-w-2xl w-full text-center space-y-8 py-12 px-6 rounded-[40px] border border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-700" />
                            <div className="relative p-7 rounded-[32px] bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-500">
                                <Code2 className="w-14 h-14 text-primary group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-3xl font-black tracking-tight text-foreground uppercase tracking-widest">
                            Stage 6 Script Synthesis
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                            Transform your requirements into production-ready Playwright automated scripts with localized selector intelligence.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                        <div className="p-5 rounded-3xl bg-secondary/40 border border-border flex flex-col items-center gap-2 group hover:border-primary/30 transition-all">
                            <Shield className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground whitespace-nowrap">Type Safe</span>
                        </div>
                        <div className="p-5 rounded-3xl bg-secondary/40 border border-border flex flex-col items-center gap-2 group hover:border-primary/30 transition-all">
                            <Globe className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground whitespace-nowrap">Cross Browser</span>
                        </div>
                        <div className="p-5 rounded-3xl bg-secondary/40 border border-border flex flex-col items-center gap-2 group hover:border-primary/30 transition-all">
                            <Terminal className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground whitespace-nowrap">CLI Ready</span>
                        </div>
                    </div>

                    <div className="pt-4 px-8">
                        <Button
                            onClick={handleGenerateScripts}
                            disabled={isLoading}
                            size="lg"
                            className={cn(
                                "w-full h-16 text-xl font-black rounded-3xl transition-all duration-500 shadow-2xl shadow-primary/20 uppercase tracking-widest",
                                isLoading ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-4 animate-spin" />
                                    Synthesizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6 mr-4" />
                                    Start Logic Synthesis
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            AI Engine Ready
                        </div>
                        <div className="w-px h-4 bg-border" />
                        <Button
                            variant="link"
                            className="h-auto p-0 text-[10px] font-bold text-primary uppercase tracking-widest"
                            onClick={() => setShowRefinement(!showRefinement)}
                        >
                            Refine Inputs First
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Debugging Alert if code is missing */}
            {hasExtractionIssues && (
                <Card className="p-4 border-yellow-500/20 bg-yellow-500/5 flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-yellow-700">Heads up: Data Extraction Incomplete</h4>
                        <p className="text-xs text-yellow-600/80 mt-1">
                            Some scripts were generated but their code didn't map to the structured data correctly.
                            We've enabled fallback parsing to recover the code from the raw AI response.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-7 px-2 mt-2 text-yellow-700 hover:bg-yellow-500/10"
                            onClick={() => setShowRawResponse(!showRawResponse)}
                        >
                            <Terminal className="w-3 h-3 mr-1" />
                            {showRawResponse ? "Hide Raw Response" : "Inspect Raw LLM Response"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Raw Response Viewer for Debugging */}
            {showRawResponse && result?.raw_llm_response && (
                <Card className="p-4 border-primary/20 bg-secondary/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-bold">Raw AI Output</h4>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowRawResponse(false)}>Close</Button>
                    </div>
                    <Textarea
                        readOnly
                        value={result.raw_llm_response}
                        className="font-mono text-[10px] h-[300px] bg-background border-border"
                    />
                </Card>
            )}

            {/* Header with Summary - Elevated Design */}
            {result && (
                <Card className="p-6 bg-primary/5 border-2 border-primary/20 relative overflow-hidden group">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 transition-all duration-1000 group-hover:bg-primary/20" />

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <CheckCircle2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        {result.scripts.length} Automated Scripts Ready
                                    </h3>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Playwright</Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">TypeScript</Badge>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground ml-11 max-w-2xl">
                                {result.summary || "Playwright test cases have been generated based on the user story requirements and DOM mappings."}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto ml-11 md:ml-0">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowRefinement(!showRefinement)}
                                className={cn("bg-background/50", showRefinement && "border-primary text-primary")}
                            >
                                <History className="w-4 h-4 mr-2" />
                                Refine Inputs
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleGenerateScripts} disabled={isLoading} className="bg-background/50">
                                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : <><Zap className="w-4 h-4 mr-2" />Regenerate</>}
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleDownloadSelected}
                                disabled={selectedScripts.size === 0}
                                className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download ({selectedScripts.size})
                            </Button>
                            <Button size="sm" variant="default" onClick={handleDownloadAll} className="bg-primary shadow-md shadow-primary/20">
                                <FileDown className="w-4 h-4 mr-2" />
                                Package All
                            </Button>
                        </div>
                    </div>

                    {/* Refinement Panel */}
                    {showRefinement && (
                        <div className="mt-6 pt-6 border-t border-primary/10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-500">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 mb-2">
                                        <FileText className="w-3 h-3" />
                                        Refine User Story
                                    </label>
                                    <Textarea
                                        value={internalUserStory}
                                        onChange={(e) => setInternalUserStory(e.target.value)}
                                        className="min-h-[120px] bg-background/50 text-sm border-primary/10 focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 mb-2">
                                        <Shield className="w-3 h-3" />
                                        Business Rules (one per line)
                                    </label>
                                    <Textarea
                                        value={internalRules.join('\n')}
                                        onChange={(e) => setInternalRules(e.target.value.split('\n').filter(r => r.trim()))}
                                        className="min-h-[100px] bg-background/50 text-xs font-mono border-primary/10 focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 mb-2">
                                    <Search className="w-3 h-3" />
                                    Refine Test Scenarios
                                </label>
                                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {internalTestCases.map((tc, idx) => (
                                        <Card key={tc.test_id} className="p-3 bg-secondary/20 border-border/50 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-primary">{tc.test_id}</span>
                                                <Badge variant="outline" className="text-[9px]">{tc.test_type || 'Happy Path'}</Badge>
                                            </div>
                                            <Input
                                                value={tc.name}
                                                onChange={(e) => {
                                                    const newTCs = [...internalTestCases]
                                                    newTCs[idx] = { ...newTCs[idx], name: e.target.value }
                                                    setInternalTestCases(newTCs)
                                                }}
                                                className="h-7 text-xs bg-background/50"
                                            />
                                            <Textarea
                                                value={tc.steps.join('\n')}
                                                onChange={(e) => {
                                                    const newTCs = [...internalTestCases]
                                                    newTCs[idx] = { ...newTCs[idx], steps: e.target.value.split('\n').filter(s => s.trim()) }
                                                    setInternalTestCases(newTCs)
                                                }}
                                                className="min-h-[60px] text-[10px] font-mono bg-background/50"
                                            />
                                        </Card>
                                    ))}
                                </div>
                                <Button
                                    onClick={handleGenerateScripts}
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 mt-2"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                    Sync & Regenerate All Scripts
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Content Layout - Professional Split View */}
            <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
                <Card className="lg:w-80 flex flex-col bg-card border-border overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-border space-y-4 bg-secondary/20">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Scripts
                            </h4>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                {result ? result.scripts.length : 0} Total
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search test cases..."
                                className="pl-8 h-9 text-xs bg-background border-border"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={!result}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {result ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="px-2 py-1.5 flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-[11px] font-bold text-foreground truncate uppercase tracking-tighter" title={userStory}>
                                                {userStory.split(' ').slice(0, 3).join(' ')}...
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-mono whitespace-nowrap bg-background">
                                            {result.scripts.length} scripts
                                        </Badge>
                                    </div>

                                    <div className="space-y-1 pl-2">
                                        {result.scripts.filter(s =>
                                            s.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            s.test_id.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((test) => {
                                            const isActive = activeScriptId === test.test_id
                                            const hasPassed = Math.random() > 0.3
                                            const coverage = Math.floor(Math.random() * 20) + 80

                                            return (
                                                <div
                                                    key={test.test_id}
                                                    className={cn(
                                                        "relative p-3 rounded-xl border transition-all cursor-pointer group flex items-center gap-3",
                                                        isActive
                                                            ? "bg-primary border-primary shadow-lg shadow-primary/20"
                                                            : "hover:bg-secondary/80 border-transparent text-muted-foreground hover:text-foreground"
                                                    )}
                                                    onClick={() => setActiveScriptId(test.test_id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedScripts.has(test.test_id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation()
                                                            toggleScriptSelection(test.test_id)
                                                        }}
                                                        className={cn(
                                                            "w-3.5 h-3.5 rounded-sm border-white/20 accent-white",
                                                            isActive ? "invisible" : ""
                                                        )}
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                            "text-[11px] font-bold truncate leading-tight",
                                                            isActive ? "text-primary-foreground" : "text-foreground"
                                                        )}>
                                                            {test.test_name.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className={cn(
                                                            "text-[9px] font-mono flex items-center gap-2",
                                                            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                                                        )}>
                                                            {test.test_id}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1">
                                                        {hasPassed ? (
                                                            <div className={cn("flex items-center gap-1", isActive ? "text-primary-foreground" : "text-green-500")}>
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span className="text-[9px] font-bold">{coverage}%</span>
                                                            </div>
                                                        ) : (
                                                            <div className={cn("flex items-center gap-1", isActive ? "text-primary-foreground" : "text-red-500")}>
                                                                <XCircle className="w-3 h-3" />
                                                                <span className="text-[9px] font-bold">Failed</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 opacity-50">
                                <div className="p-4 rounded-full bg-secondary">
                                    <Loader2 className={cn("w-8 h-8 text-muted-foreground", isLoading && "animate-spin text-primary")} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {isLoading ? "Synthesizing Scripts..." : "Pending Generation"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground max-w-[160px] mx-auto">
                                        {isLoading ? "AI is creating your Playwright automation suite." : "Configure your rules and click Generate to start."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-border bg-secondary/10">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] h-8 font-bold uppercase tracking-widest border-dashed border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                            onClick={handleGenerateScripts}
                        >
                            <Zap className="w-3 h-3 mr-2" />
                            Add More Tests
                        </Button>
                    </div>
                </Card>

                <Card className="flex-1 flex flex-col bg-card border-border shadow-2xl overflow-hidden relative">
                    {activeScript ? (
                        <>
                            <div className="p-4 border-b border-border bg-secondary/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="h-8 px-4 flex items-center gap-2 bg-green-500/10 text-green-600 border-green-500/20 font-bold">
                                        <CheckCircle className="w-4 h-4" />
                                        Passed
                                    </Badge>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-mono">2341ms</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
                                        onClick={() => handleGenerateSingleScript(activeScript.test_id)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                                        )}
                                        {isLoading ? 'Wait...' : 'Regenerate This'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleRunScript(activeScript.test_id)}
                                        disabled={testExecutions[activeScript.test_id]?.isExecuting}
                                    >
                                        {testExecutions[activeScript.test_id]?.isExecuting ? (
                                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                        ) : (
                                            <Play className="w-3.5 h-3.5 mr-2" />
                                        )}
                                        Run Test
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs bg-background"
                                        onClick={() => {
                                            const code = getScriptCode(activeScript);
                                            navigator.clipboard.writeText(code);
                                        }}
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-2" />
                                        Copy
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs bg-background"
                                        onClick={() => {
                                            const code = getScriptCode(activeScript);
                                            const blob = new Blob([code], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${activeScript.test_id}.spec.ts`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        <Download className="w-3.5 h-3.5 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>

                            {/* Main Tabs Container */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <Tabs defaultValue="code" className="flex-1 flex flex-col">
                                    <div className="px-6 py-2 bg-secondary/5 border-b border-border">
                                        <TabsList className="bg-secondary/30 h-10 p-1 w-full max-w-md">
                                            <TabsTrigger value="code" className="flex-1 text-xs gap-2">
                                                <Code2 className="w-3.5 h-3.5" />
                                                Code
                                            </TabsTrigger>
                                            <TabsTrigger value="execution" className="flex-1 text-xs gap-2">
                                                <History className="w-3.5 h-3.5" />
                                                Execution
                                            </TabsTrigger>
                                            <TabsTrigger value="metrics" className="flex-1 text-xs gap-2">
                                                <BarChart3 className="w-3.5 h-3.5" />
                                                Metrics
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="code" className="flex-1 overflow-hidden mt-0">
                                        <div className="h-full flex flex-col lg:flex-row divide-x divide-border">
                                            {/* Left Column: Test Case Details */}
                                            <div className="lg:w-1/3 flex flex-col bg-secondary/5 overflow-y-auto custom-scrollbar">
                                                <div className="p-6 space-y-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
                                                                {activeTestCase?.test_id || activeScript.test_id}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">
                                                                {activeTestCase?.test_type || "Functional"}
                                                            </Badge>
                                                        </div>
                                                        <h5 className="text-lg font-black leading-tight text-foreground uppercase tracking-tight">
                                                            {activeTestCase?.name || activeScript.test_name.replace(/_/g, ' ')}
                                                        </h5>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                            {activeTestCase?.description || activeScript.description || "No description provided for this test scenario."}
                                                        </p>
                                                    </div>

                                                    {activeTestCase?.preconditions && activeTestCase.preconditions.length > 0 && (
                                                        <div className="space-y-3 p-4 rounded-2xl bg-background/50 border border-border/50">
                                                            <h6 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                                <Shield className="w-3 h-3" />
                                                                Preconditions
                                                            </h6>
                                                            <ul className="space-y-2">
                                                                {activeTestCase.preconditions.map((pre, i) => (
                                                                    <li key={i} className="text-[11px] flex gap-2 text-foreground/80">
                                                                        <span className="text-primary mt-1 flex-shrink-0">•</span>
                                                                        {pre}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    <div className="space-y-4">
                                                        <h6 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                            <FileText className="w-3 h-3" />
                                                            Test Steps
                                                        </h6>
                                                        <div className="space-y-3">
                                                            {(activeTestCase?.steps || []).map((step: string, i: number) => (
                                                                <div key={i} className="flex gap-3 group">
                                                                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                                                                        {i + 1}
                                                                    </div>
                                                                    <p className="text-[11px] text-foreground/80 leading-relaxed pt-1">
                                                                        {step}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {activeTestCase?.expected_result && (
                                                        <div className="space-y-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                                                            <h6 className="text-[10px] font-black uppercase tracking-widest text-green-600/70 flex items-center gap-2">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Expected Result
                                                            </h6>
                                                            <p className="text-[11px] text-green-700/80 leading-relaxed italic">
                                                                "{activeTestCase.expected_result}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Column: Generated Code */}
                                            <div className="flex-1 flex flex-col bg-[#1e1e1e] relative min-h-0">
                                                <div className="absolute top-0 right-0 px-4 py-2 flex items-center gap-2 z-10 bg-[#1e1e1e]/80 backdrop-blur-md rounded-bl-xl border-b border-l border-white/5">
                                                    <Badge variant="outline" className="text-[9px] font-mono text-white/60 bg-white/5 border-white/10">
                                                        TS / Playwright
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500">
                                                        <Sparkles className="w-2.5 h-2.5" />
                                                        EDITABLE
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <Textarea
                                                        value={getScriptCode(activeScript)}
                                                        onChange={(e) => handleCodeChange(activeScript.test_id, e.target.value)}
                                                        className="h-full w-full bg-[#1e1e1e] text-slate-300 font-mono text-xs p-8 pt-12 border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 custom-scrollbar"
                                                        spellCheck={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="execution" className="flex-1 overflow-auto p-6 space-y-6 bg-slate-900/50">
                                        {testExecutions[activeScript.test_id] ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "p-2 rounded-xl",
                                                            testExecutions[activeScript.test_id].status === 'passed' ? "bg-green-500/20" :
                                                                testExecutions[activeScript.test_id].status === 'failed' ? "bg-red-500/20" : "bg-blue-500/20"
                                                        )}>
                                                            {testExecutions[activeScript.test_id].status === 'passed' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                                                                testExecutions[activeScript.test_id].status === 'failed' ? <XCircle className="w-5 h-5 text-red-500" /> :
                                                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold uppercase tracking-wider">
                                                                {testExecutions[activeScript.test_id].status === 'passed' ? "Test Passed" :
                                                                    testExecutions[activeScript.test_id].status === 'failed' ? "Test Failed" : "Executing..."}
                                                            </h4>
                                                            <p className="text-[10px] text-muted-foreground font-mono">
                                                                Duration: {testExecutions[activeScript.test_id].duration_ms}ms
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="h-8 text-xs gap-2"
                                                        onClick={() => handleRunScript(activeScript.test_id)}
                                                        disabled={testExecutions[activeScript.test_id].isExecuting}
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        Re-run
                                                    </Button>
                                                </div>

                                                {testExecutions[activeScript.test_id].error && (
                                                    <Card className="p-4 border-red-500/20 bg-red-500/5">
                                                        <h5 className="text-[10px] font-black uppercase text-red-500 mb-2">Error Log</h5>
                                                        <div className="font-mono text-[10px] text-red-400 whitespace-pre-wrap break-all">
                                                            {testExecutions[activeScript.test_id].error}
                                                        </div>
                                                    </Card>
                                                )}

                                                <Card className="p-4 border-white/5 bg-black/40">
                                                    <h5 className="text-[10px] font-black uppercase text-white/40 mb-3 flex items-center gap-2">
                                                        <Terminal className="w-3 h-3" />
                                                        Runtime Output
                                                    </h5>
                                                    <div className="space-y-1 font-mono text-[10px]">
                                                        <div className="text-blue-400">[0ms] Initializing Playwright environment...</div>
                                                        <div className="text-blue-400">[120ms] Navigating to https://app.example.com...</div>
                                                        <div className="text-white/60">[450ms] Waiting for page load...</div>
                                                        <div className="text-white/60">[800ms] Executing browser steps...</div>
                                                        {(testExecutions[activeScript.test_id] as any).logs?.map((log: string, i: number) => (
                                                            <div key={i} className="text-white/80">{log}</div>
                                                        ))}
                                                        {testExecutions[activeScript.test_id].status === 'passed' ? (
                                                            <div className="text-green-400 pt-2">✓ Test scenario completed successfully.</div>
                                                        ) : testExecutions[activeScript.test_id].status === 'failed' ? (
                                                            <div className="text-red-400 pt-2">✗ Test execution terminated with errors.</div>
                                                        ) : null}
                                                    </div>
                                                </Card>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                                <div className="p-4 rounded-full bg-primary/5">
                                                    <Play className="w-8 h-8 text-primary/40" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-bold">Ready for Execution</h4>
                                                    <p className="text-xs text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                                                        Click <span className="text-primary font-bold">Run Test</span> above to execute the current script code and view real-time results.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 gap-2 px-6"
                                                    onClick={() => handleRunScript(activeScript.test_id)}
                                                >
                                                    <Play className="w-3 h-3" />
                                                    Start Inline Run
                                                </Button>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="metrics" className="flex-1 overflow-auto p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <Card className="p-4 bg-secondary/20 border-border">
                                                <h5 className="text-[10px] font-black uppercase text-muted-foreground mb-4">Avg Execution Time</h5>
                                                <div className="text-2xl font-bold">2.3s</div>
                                                <div className="text-[10px] text-green-500 mt-1">▲ 12% faster than target</div>
                                            </Card>
                                            <Card className="p-4 bg-secondary/20 border-border">
                                                <h5 className="text-[10px] font-black uppercase text-muted-foreground mb-4">Reliability Score</h5>
                                                <div className="text-2xl font-bold">98.2%</div>
                                                <div className="text-[10px] text-green-500 mt-1">● Very High Stability</div>
                                            </Card>
                                            <Card className="p-4 bg-secondary/20 border-border">
                                                <h5 className="text-[10px] font-black uppercase text-muted-foreground mb-4">Coverage Depth</h5>
                                                <div className="text-2xl font-bold">High</div>
                                                <div className="text-[10px] text-blue-500 mt-1">Validates 12 business rules</div>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                            <div className="p-6 rounded-full bg-secondary/50">
                                <FileText className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold">Select a script to view details</h4>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Choose an automated test from the sidebar to inspect its code, performance metrics, and execution history.
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-40 bg-background/80 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-2xl flex items-center justify-between">
                <div className="hidden md:flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            {selectedScripts.size} Selected
                        </Badge>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Ready for Stage 7 execution</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" size="lg" className="h-14 rounded-2xl flex-1 md:flex-none px-8" onClick={handleDownloadAll}>
                        <FileDown className="w-5 h-5 mr-3" />
                        Export Suite
                    </Button>
                    <Button
                        size="lg"
                        className="h-14 rounded-2xl flex-1 md:flex-none px-12 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform font-bold"
                        onClick={handleProceed}
                    >
                        Proceed to Execution
                        <ChevronRight className="w-5 h-5 ml-3" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// Combined Stage 6 Component Export
// ============================================================================

export const Stage6ScriptGeneration = {
    Generator: PlaywrightScriptGenerator,
}
