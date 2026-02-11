'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    ChevronRight,
    ChevronDown,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    LayoutGrid
} from 'lucide-react'

interface TestScript {
    id: string
    name: string
    testCaseId: string
    testCaseName: string
    status: 'active' | 'draft' | 'maintenance'
    passRate: number
    lastRun?: string
    isGenerated: boolean
}

interface TestCaseItemProps {
    testCaseId: string
    testCaseName: string
    scripts: TestScript[]
    isSelected: boolean
    onClick: () => void
}

export function TestCaseItem({ testCaseId, testCaseName, scripts, isSelected, onClick }: TestCaseItemProps) {
    const script = scripts[0]
    const passRate = script ? script.passRate : 0
    const isPassing = passRate >= 80

    return (
        <div
            onClick={onClick}
            className={cn(
                'group flex items-center justify-between py-3 px-4 cursor-pointer transition-all border-l-4',
                isSelected
                    ? 'bg-[#007AFF] border-l-[#007AFF] shadow-lg shadow-blue-900/20'
                    : 'bg-transparent border-l-transparent hover:bg-white/5'
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <FileText className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isSelected ? "text-white/70" : "text-slate-500 group-hover:text-slate-400"
                )} />
                <div className="min-w-0">
                    <p className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                    )}>
                        {testCaseName}
                    </p>
                    <p className={cn(
                        "text-[10px] truncate",
                        isSelected ? "text-blue-100" : "text-slate-500 group-hover:text-slate-400"
                    )}>
                        {testCaseId}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 pl-2">
                {script?.isGenerated && !isSelected && (
                    <Sparkles className="w-3 h-3 text-amber-500/50" />
                )}
                <div className="flex items-center gap-1.5">
                    {isSelected ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 text-white/90" />
                            <span className="text-xs font-bold text-white/90">{passRate}%</span>
                        </>
                    ) : (
                        <>
                            {passRate > 0 ? (
                                <CheckCircle2 className={cn("w-4 h-4", isPassing ? "text-emerald-500" : "text-rose-500")} />
                            ) : (
                                <Clock className="w-4 h-4 text-slate-600" />
                            )}
                            {passRate > 0 && (
                                <span className={cn(
                                    "text-xs font-semibold",
                                    isPassing ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {passRate}%
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

interface UserStoryGroupProps {
    userStoryId: string
    userStoryTitle: string
    testCases: Array<{
        testCaseId: string
        testCaseName: string
        scripts: TestScript[]
    }>
    selectedTestCaseId: string | null
    onTestCaseSelect: (testCaseId: string) => void
}

export function UserStoryGroup({
    userStoryId,
    userStoryTitle,
    testCases,
    selectedTestCaseId,
    onTestCaseSelect,
}: UserStoryGroupProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    const totalScripts = testCases.reduce((sum: number, tc: any) => sum + tc.scripts.length, 0)
    const passedScripts = testCases.reduce(
        (sum: number, tc: any) => sum + tc.scripts.filter((s: TestScript) => s.passRate >= 80).length,
        0
    )
    const allPassed = totalScripts > 0 && passedScripts === totalScripts

    return (
        <div className="mb-1">
            {/* User Story Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center justify-between p-3 cursor-pointer group hover:bg-white/5 rounded-lg transition-all",
                    !isExpanded && "opacity-70"
                )}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                                {userStoryTitle}
                            </h4>
                            <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-[10px] px-1.5 h-5 group-hover:bg-slate-700">
                                {totalScripts} {totalScripts === 1 ? 'script' : 'scripts'}
                            </Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-400">
                            {userStoryId}
                        </p>
                    </div>
                </div>

                {totalScripts > 0 && (
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={cn(
                            "w-4 h-4",
                            allPassed ? "text-emerald-500" : "text-slate-600"
                        )} />
                        <span className={cn(
                            "text-xs font-mono font-medium",
                            allPassed ? "text-emerald-500" : "text-slate-500"
                        )}>
                            {passedScripts}/{totalScripts}
                        </span>
                    </div>
                )}
            </div>

            {/* Test Cases */}
            {isExpanded && (
                <div className="mt-1 pb-2 space-y-0.5">
                    {testCases.map((testCase) => (
                        <TestCaseItem
                            key={testCase.testCaseId}
                            testCaseId={testCase.testCaseId}
                            testCaseName={testCase.testCaseName}
                            scripts={testCase.scripts}
                            isSelected={selectedTestCaseId === testCase.testCaseId}
                            onClick={() => onTestCaseSelect(testCase.testCaseId)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
