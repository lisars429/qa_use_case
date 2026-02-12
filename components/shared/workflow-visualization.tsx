'use client'

import { cn } from '@/lib/utils'
import type { StageStatus } from '@/lib/types/pipeline'
import {
    CheckCircle2,
    Circle,
    FileSearch,
    Shield,
    AlertTriangle,
    FileText,
    Globe,
    Code2,
    Play,
} from 'lucide-react'

interface Stage {
    id: number
    name: string
    emoji: string
    status: StageStatus
    description: string
}

interface WorkflowVisualizationProps {
    currentStage: number
    stages?: Stage[]
    activeRange?: [number, number] // [start, end] inclusive
    forceStageActive?: number
    className?: string
}

const defaultStages: Stage[] = [
    {
        id: 1,
        name: 'Testability',
        emoji: '🔍',
        status: 'pending',
        description: 'Analyze user story for testability',
    },
    {
        id: 2,
        name: 'Rule Grounding',
        emoji: '📋',
        status: 'pending',
        description: 'Extract and validate business rules',
    },
    {
        id: 3,
        name: 'Ambiguity',
        emoji: '⚠️',
        status: 'pending',
        description: 'Identify and resolve ambiguities',
    },
    {
        id: 4,
        name: 'Test Cases',
        emoji: '📝',
        status: 'pending',
        description: 'Generate comprehensive test cases',
    },
    {
        id: 5,
        name: 'DOM Mapping',
        emoji: '🌐',
        status: 'pending',
        description: 'Map UI elements for automation',
    },
    {
        id: 6,
        name: 'Scripts',
        emoji: '💻',
        status: 'pending',
        description: 'Generate Playwright test scripts',
    },
    {
        id: 7,
        name: 'Execution',
        emoji: '▶️',
        status: 'pending',
        description: 'Execute and validate tests',
    },
]

const stageIcons = [
    FileSearch,
    Shield,
    AlertTriangle,
    FileText,
    Globe,
    Code2,
    Play,
]

export function WorkflowVisualization({
    currentStage: propCurrentStage,
    stages = defaultStages,
    activeRange,
    forceStageActive,
    className,
}: WorkflowVisualizationProps) {
    // Determine which stages to display
    const visibleStages = activeRange
        ? stages.filter(s => s.id >= activeRange[0] && s.id <= activeRange[1])
        : stages

    // If forceStageActive is provided, the effective current stage is at least that stage
    const currentStage = forceStageActive ? Math.max(propCurrentStage, forceStageActive) : propCurrentStage

    const getStageStatus = (stageId: number): StageStatus => {
        if (stageId < currentStage) return 'completed'
        if (stageId === currentStage) return 'current'
        return 'pending'
    }

    // Calculate progress relative to visible stages
    const startId = visibleStages[0]?.id || 1
    const endId = visibleStages[visibleStages.length - 1]?.id || stages.length
    const totalVisible = visibleStages.length

    const relativeProgress = totalVisible > 1
        ? Math.min(Math.max((currentStage - startId) / (endId - startId), 0), 1)
        : currentStage >= startId ? 1 : 0

    return (
        <div className={cn('w-full', className)}>
            {/* Horizontal Stepper */}
            <div className="relative">
                {/* Progress Line Background */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border"
                    style={{
                        left: '2rem',
                        right: '2rem',
                    }}
                />

                {/* Active Progress Line */}
                <div
                    className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary via-blue-500 to-purple-500 transition-all duration-700 ease-out"
                    style={{
                        left: '2rem',
                        width: `calc(${relativeProgress * 100}% - 4rem)`,
                    }}
                />

                {/* Stages */}
                <div className="relative flex items-start justify-between">
                    {visibleStages.map((stage) => {
                        const status = getStageStatus(stage.id)
                        const Icon = stageIcons[stage.id - 1] || FileSearch
                        const isCompleted = status === 'completed'
                        const isCurrent = status === 'current'
                        const isPending = status === 'pending'

                        return (
                            <div
                                key={stage.id}
                                className="flex flex-col items-center transition-opacity duration-300"
                                style={{ flex: '1 1 0' }}
                            >
                                {/* Step Circle */}
                                <div className="relative z-10 mb-3">
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                                            'border-2 backdrop-blur-sm',
                                            isCompleted && 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 shadow-lg shadow-green-500/30',
                                            isCurrent && 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500 shadow-lg shadow-blue-500/40 animate-pulse',
                                            isPending && 'bg-muted border-border'
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        ) : isCurrent ? (
                                            <Icon className="w-5 h-5 text-white" />
                                        ) : (
                                            <Circle className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Pulse effect for current stage */}
                                    {isCurrent && (
                                        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                                    )}
                                </div>

                                {/* Stage Info */}
                                <div className="text-center max-w-[100px]">
                                    <p
                                        className={cn(
                                            'text-xs font-semibold mb-1 transition-colors',
                                            isCompleted && 'text-green-600',
                                            isCurrent && 'text-blue-600',
                                            isPending && 'text-muted-foreground'
                                        )}
                                    >
                                        {stage.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                        Stage {stage.id}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Progress Percentage */}
                <div className="mt-6 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 bg-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary via-blue-500 to-purple-500 transition-all duration-700"
                                style={{ width: `${relativeProgress * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            {Math.round(relativeProgress * 100)}% Complete
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {Math.min(currentStage - startId + 1, totalVisible)} of {totalVisible} stages
                    </span>
                </div>
            </div>
        </div>
    )
}
