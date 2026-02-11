'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MetricCard, StatusBadge } from '@/components/shared'
import { AlertTriangle, Loader2, Users, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { AmbiguityClassificationInput, AmbiguityClassification as AmbiguityClassificationType, ClarificationItem, UserStoryInput } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

interface AmbiguityClassificationProps {
    userStoryInput: UserStoryInput
    clarificationQuestions: string[]
    onClassificationComplete: (result: AmbiguityClassificationType) => void
    initialResult?: AmbiguityClassificationType
}

export function AmbiguityClassification({
    userStoryInput,
    clarificationQuestions,
    onClassificationComplete,
    initialResult,
}: AmbiguityClassificationProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<AmbiguityClassificationType | null>(initialResult || null)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [groupBy, setGroupBy] = useState<'all' | 'owner'>('all')

    const handleRunClassification = async () => {
        setIsLoading(true)
        try {
            const input: AmbiguityClassificationInput = {
                user_story: userStoryInput.user_story,
                detailed_description: userStoryInput.detailed_description,
                acceptance_criteria: userStoryInput.acceptance_criteria,
                clarification_questions: clarificationQuestions,
            }
            const classificationResult = await api.classifyAmbiguities(input)
            setResult(classificationResult)
            onClassificationComplete(classificationResult)
        } catch (error) {
            console.error('Failed to classify ambiguities:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }))
    }

    if (!result) {
        return (
            <Card className="p-6 bg-card border-border">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-yellow-500/10">
                            <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Stage 3: Ambiguity Classification
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Categorize ambiguities by type, impact, and resolution owner
                        </p>
                    </div>
                    <Button
                        onClick={handleRunClassification}
                        disabled={isLoading}
                        className="bg-primary text-primary-foreground"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Classifying Ambiguities...
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Run Stage 3 Classification
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        )
    }

    const stats = {
        total: result.clarification_items.length,
        mandatory: result.clarification_items.filter(item => item.mandatory).length,
        blocked: result.clarification_items.filter(item => item.testing_impact === 'Blocked').length,
        uniqueOwners: new Set(result.clarification_items.map(item => item.resolution_owner)).size,
    }

    const ownerGroups = result.clarification_items.reduce((acc, item) => {
        if (!acc[item.resolution_owner]) {
            acc[item.resolution_owner] = []
        }
        acc[item.resolution_owner].push(item)
        return acc
    }, {} as Record<string, ClarificationItem[]>)

    const getOwnerIcon = (owner: string) => {
        switch (owner) {
            case 'Product': return Users
            case 'Business': return Users
            case 'Tech': return AlertCircle
            case 'Compliance': return Lock
            default: return Users
        }
    }

    const getOwnerColor = (owner: string) => {
        switch (owner) {
            case 'Product': return 'blue'
            case 'Business': return 'green'
            case 'Tech': return 'purple'
            case 'Compliance': return 'red'
            default: return 'default'
        }
    }

    return (
        <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <MetricCard
                    title="Total Items"
                    value={stats.total}
                    icon={AlertTriangle}
                    color="default"
                />
                <MetricCard
                    title="Mandatory"
                    value={stats.mandatory}
                    icon={AlertCircle}
                    color="red"
                />
                <MetricCard
                    title="Blocked"
                    value={stats.blocked}
                    icon={Lock}
                    color="yellow"
                />
                <MetricCard
                    title="Unique Owners"
                    value={stats.uniqueOwners}
                    icon={Users}
                    color="blue"
                />
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Clarification Items</h4>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={groupBy === 'all' ? 'default' : 'outline'}
                        onClick={() => setGroupBy('all')}
                    >
                        All Items
                    </Button>
                    <Button
                        size="sm"
                        variant={groupBy === 'owner' ? 'default' : 'outline'}
                        onClick={() => setGroupBy('owner')}
                    >
                        Group by Owner
                    </Button>
                </div>
            </div>

            {/* All Items View */}
            {groupBy === 'all' && (
                <Card className="bg-card border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary hover:bg-secondary">
                                    <TableHead className="text-foreground">Question</TableHead>
                                    <TableHead className="text-foreground">Type</TableHead>
                                    <TableHead className="text-foreground">Impact</TableHead>
                                    <TableHead className="text-foreground">Owner</TableHead>
                                    <TableHead className="text-foreground">Mandatory</TableHead>
                                    <TableHead className="text-foreground">Answer</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.clarification_items.map((item, index) => (
                                    <TableRow key={index} className="border-border">
                                        <TableCell className="max-w-xs text-sm text-foreground">
                                            {item.question}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {item.ambiguity_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={item.testing_impact === 'Blocked' ? 'blocked' : 'pending'}
                                                label={item.testing_impact}
                                                showIcon={false}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-xs',
                                                    getOwnerColor(item.resolution_owner) === 'blue' && 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                                                    getOwnerColor(item.resolution_owner) === 'green' && 'bg-green-500/10 text-green-600 border-green-500/20',
                                                    getOwnerColor(item.resolution_owner) === 'purple' && 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                                                    getOwnerColor(item.resolution_owner) === 'red' && 'bg-red-500/10 text-red-600 border-red-500/20'
                                                )}
                                            >
                                                {item.resolution_owner}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.mandatory ? (
                                                <CheckCircle2 className="w-4 h-4 text-red-600" />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Textarea
                                                placeholder="Enter answer..."
                                                value={answers[index] || item.resolution_answer || ''}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                className="min-h-[60px] text-xs bg-input border-border"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Grouped by Owner View */}
            {groupBy === 'owner' && (
                <div className="space-y-4">
                    {Object.entries(ownerGroups).map(([owner, items]) => {
                        const Icon = getOwnerIcon(owner)
                        const color = getOwnerColor(owner)
                        return (
                            <Card key={owner} className="bg-card border-border">
                                <div className="p-4 border-b border-border bg-secondary">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            'p-2 rounded-lg',
                                            color === 'blue' && 'bg-blue-500/10',
                                            color === 'green' && 'bg-green-500/10',
                                            color === 'purple' && 'bg-purple-500/10',
                                            color === 'red' && 'bg-red-500/10'
                                        )}>
                                            <Icon className={cn(
                                                'w-5 h-5',
                                                color === 'blue' && 'text-blue-600',
                                                color === 'green' && 'text-green-600',
                                                color === 'purple' && 'text-purple-600',
                                                color === 'red' && 'text-red-600'
                                            )} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground">{owner}</h4>
                                            <p className="text-xs text-muted-foreground">{items.length} items</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {items.map((item, index) => (
                                        <div key={index} className="p-3 rounded-lg bg-secondary border border-border space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-foreground flex-1">{item.question}</p>
                                                <div className="flex gap-2">
                                                    {item.mandatory && (
                                                        <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                                                    )}
                                                    <StatusBadge
                                                        status={item.testing_impact === 'Blocked' ? 'blocked' : 'pending'}
                                                        label={item.testing_impact}
                                                        showIcon={false}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 text-xs">
                                                <Badge variant="outline">{item.ambiguity_type}</Badge>
                                            </div>
                                            <Textarea
                                                placeholder="Enter answer..."
                                                value={answers[index] || item.resolution_answer || ''}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                className="min-h-[60px] text-xs bg-input border-border"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Action Button */}
            <Button className="w-full bg-primary text-primary-foreground">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Update Context & Proceed to Stage 4
            </Button>
        </div>
    )
}
