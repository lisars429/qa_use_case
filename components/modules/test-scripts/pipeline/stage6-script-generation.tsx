'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Code2, CheckCircle2, Download, Copy, FileDown, Sparkles, Zap, Terminal, Globe, Shield } from 'lucide-react'
import { CodeViewer } from '@/components/shared'
import { api } from '@/lib/api/client'
import type { PlaywrightGenerationInput, PlaywrightScripts, PlaywrightTest, TestCase } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

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
    initialResult?: PlaywrightScripts
}

export function PlaywrightScriptGenerator({
    userStory,
    explicitRules,
    testCases,
    domElements,
    onGenerationComplete,
    initialResult,
}: PlaywrightScriptGeneratorProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<PlaywrightScripts | null>(initialResult || null)
    const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set())

    // Auto-generate if we have inputs but no result
    // useEffect(() => {
    //     if (!result && !isLoading && testCases.length > 0 && domElements.length > 0) {
    //         handleGenerateScripts()
    //     }
    // }, []) // Empty dependency array to run only once on mount

    const handleGenerateScripts = async () => {
        setIsLoading(true)
        try {
            // Map test cases to the full TestCase type expected by backend if possible, 
            // or at least what the backend needs for script generation.
            const input: PlaywrightGenerationInput = {
                user_story: userStory,
                test_cases: testCases.map(tc => ({
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
                explicit_rules: explicitRules,
            }

            const generatedResult = await api.generatePlaywright(input)
            setResult(generatedResult)
            onGenerationComplete(generatedResult)

            // Auto-select all generated scripts
            setSelectedScripts(new Set(generatedResult.scripts.map(s => s.test_id)))
        } catch (error) {
            console.error('Failed to generate scripts:', error)
        } finally {
            setIsLoading(false)
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
        const content = selected.map(test => test.code).join('\n\n')
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
        const content = result.scripts.map(test => test.code).join('\n\n')
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

    if (!result) {
        return (
            <div className="relative min-h-[400px] flex items-center justify-center p-4">
                {/* Background decorative elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />

                <Card className="w-full max-w-2xl overflow-hidden border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl">
                    <div className="p-8 text-center space-y-6 relative overflow-hidden">
                        {/* Progress line decoration */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <div className="relative p-6 rounded-3xl bg-primary/10 border border-primary/20 group hover:border-primary/40 transition-all duration-500">
                                    <Code2 className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                Stage 6: Playwright Script Generation
                            </h3>
                            <p className="text-muted-foreground mx-auto max-w-md">
                                Transform your mapped DOM elements and test scenarios into production-ready automated scripts.
                            </p>
                        </div>

                        {/* Input Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 w-full max-w-lg mx-auto bg-secondary/20 p-4 rounded-xl border border-border/50">
                            <div className="text-center space-y-1">
                                <div className="text-2xl font-bold text-primary">{testCases.length}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Test Cases</div>
                            </div>
                            <div className="text-center space-y-1 border-l border-border/50">
                                <div className="text-2xl font-bold text-primary">{domElements.length}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">DOM Elements</div>
                            </div>
                            <div className="text-center space-y-1 border-l border-border/50">
                                <div className="text-2xl font-bold text-primary">{explicitRules.length}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rules</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 py-4">
                            <div className="p-3 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center gap-1">
                                <Shield className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Type Safe</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center gap-1">
                                <Globe className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Cross Browser</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center gap-1">
                                <Terminal className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">CLI Ready</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerateScripts}
                            disabled={isLoading}
                            size="lg"
                            className={cn(
                                "w-full h-14 text-lg font-bold transition-all duration-500 shadow-lg shadow-primary/20",
                                isLoading ? "bg-muted" : "bg-primary hover:bg-primary/90 hover:scale-[1.02]"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                    Synthesizing Test Logic...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-3" />
                                    Generate Playwright Scripts
                                </>
                            )}
                        </Button>

                        <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                            Powered by Advanced AI Engine
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header with Summary - Elevated Design */}
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
            </Card>

            {/* Content Layout */}
            <div className="space-y-6">
                {/* Source DOM Mapping Section */}
                <Card className="p-6 bg-card border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-4 text-primary" />
                            <h3 className="text-lg font-bold text-foreground">Source DOM Mapping</h3>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {domElements.length} Elements
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {domElements.map((el, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg border border-border bg-secondary/10 flex flex-col gap-1 hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-primary truncate max-w-[80%]">{el.id}</span>
                                    <Sparkles className="w-2.5 h-2.5 text-primary/40" />
                                </div>
                                <code className="text-[9px] font-mono text-muted-foreground truncate bg-background p-1 rounded">
                                    {el.selector}
                                </code>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Test Scenarios Section */}
                <Card className="p-6 bg-card border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Terminal className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Executable Test Scenarios</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {testCases.map((tc, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="font-mono text-[10px] bg-background">{tc.test_id}</Badge>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{tc.test_type || 'Functional'}</span>
                                </div>
                                <h4 className="font-semibold text-sm mb-3 line-clamp-2" title={tc.name}>{tc.name}</h4>
                                <div className="space-y-1.5">
                                    {tc.steps.slice(0, 3).map((step, sIdx) => (
                                        <div key={sIdx} className="flex gap-2 text-xs text-muted-foreground">
                                            <span className="text-primary/60 font-mono">{sIdx + 1}.</span>
                                            <span className="line-clamp-1">{step}</span>
                                        </div>
                                    ))}
                                    {tc.steps.length > 3 && (
                                        <div className="text-[10px] text-muted-foreground italic pl-4">
                                            +{tc.steps.length - 3} more steps...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Instructions & List */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Setup Instructions */}
                        <Card className="p-5 bg-card border-border shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-primary">
                                <Terminal className="w-4 h-4" />
                                <h4 className="text-xs font-black uppercase tracking-widest font-mono">Quick Start</h4>
                            </div>
                            <div className="space-y-4">
                                {result.setup_instructions ? (
                                    <div className="space-y-3">
                                        {(Array.isArray(result.setup_instructions) ? result.setup_instructions : [result.setup_instructions]).map((instruction, idx) => (
                                            <div key={idx} className="flex items-start gap-3 group">
                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{instruction}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Follow Playwright documentation to run these tests.</p>
                                )}
                            </div>
                        </Card>

                        {/* Compact List View */}
                        <Card className="p-4 space-y-3 bg-card border-border">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-foreground">All Scripts</h4>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-[10px] text-primary"
                                    onClick={() => {
                                        if (selectedScripts.size === result.scripts.length) {
                                            setSelectedScripts(new Set())
                                        } else {
                                            setSelectedScripts(new Set(result.scripts.map(test => test.test_id)))
                                        }
                                    }}
                                >
                                    {selectedScripts.size === result.scripts.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {result.scripts.map((test) => (
                                    <div
                                        key={test.test_id}
                                        className={cn(
                                            "p-2 rounded-lg border transition-all cursor-pointer group flex items-center gap-3",
                                            selectedScripts.has(test.test_id)
                                                ? "bg-primary/5 border-primary/20"
                                                : "hover:bg-secondary/50 border-transparent"
                                        )}
                                        onClick={() => toggleScriptSelection(test.test_id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedScripts.has(test.test_id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleScriptSelection(test.test_id);
                                            }}
                                            className="w-3.5 h-3.5 rounded-sm border-border accent-primary"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate text-foreground group-hover:text-primary transition-colors">
                                                {test.test_name}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                {test.test_id}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Main Code Viewer - Premium Layout */}
                    <div className="lg:col-span-3">
                        <Tabs defaultValue={result.scripts[0]?.test_id} className="w-full">
                            <TabsList className="w-full justify-start overflow-x-auto bg-secondary/30 p-1 border-b-0 rounded-t-2xl rounded-b-none h-12 no-scrollbar">
                                {result.scripts.map((test) => (
                                    <TabsTrigger
                                        key={test.test_id}
                                        value={test.test_id}
                                        className="text-xs px-6 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm border-transparent"
                                    >
                                        <div className="flex items-center gap-2">
                                            {test.test_name}
                                            {selectedScripts.has(test.test_id) && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {result.scripts.map((test) => (
                                <TabsContent
                                    key={test.test_id}
                                    value={test.test_id}
                                    className="mt-0 focus-visible:outline-none"
                                >
                                    <div className="bg-card border border-t-0 p-6 rounded-b-2xl shadow-sm space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h5 className="text-lg font-bold text-foreground">{test.test_name}</h5>
                                                    <Badge variant="outline" className="font-mono text-[10px]">{test.test_id}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{test.description || "Automated playwright test script."}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 px-4 rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(test.code);
                                                    }}
                                                >
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Copy
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 px-4 rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                                                    onClick={() => {
                                                        const blob = new Blob([test.code], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `${test.test_id}.spec.ts`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            {/* Browser-like Header */}
                                            <div className="absolute top-0 left-0 right-0 h-10 bg-[#1e1e1e] flex items-center px-4 gap-1.5 rounded-t-xl z-10 border-b border-white/5">
                                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                                <div className="ml-4 px-3 py-1 rounded bg-white/5 text-[10px] font-mono text-white/40 flex items-center gap-2">
                                                    <Globe className="w-3 h-3" />
                                                    {test.test_id}.spec.ts
                                                </div>
                                            </div>
                                            <div className="pt-10 h-[600px] border border-t-0 rounded-b-xl overflow-hidden bg-[#1e1e1e]">
                                                <CodeViewer
                                                    code={test.code}
                                                    language={test.code.includes('import') && (test.code.includes('page:') || test.code.includes('const')) ? 'typescript' : 'python'}
                                                    className="h-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>

                {/* Final Action Button - Floating/Sticky at bottom for visibility */}
                <div className="sticky bottom-4 z-50 flex justify-center pt-4 pb-2">
                    <Button
                        size="lg"
                        className="group bg-primary text-primary-foreground px-12 h-16 rounded-full font-bold shadow-2xl shadow-primary/30 hover:scale-[1.02] hover:shadow-primary/50 transition-all border-2 border-primary-foreground/10"
                        onClick={() => {
                            // This would typically trigger the move to Stage 7
                            onGenerationComplete(result);
                        }}
                    >
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-primary-foreground group-hover:scale-110 transition-transform" />
                                <span className="text-lg">Proceed to Execution</span>
                            </div>
                            <span className="text-[10px] font-normal opacity-80 uppercase tracking-widest">Stage 7 Ready</span>
                        </div>
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
