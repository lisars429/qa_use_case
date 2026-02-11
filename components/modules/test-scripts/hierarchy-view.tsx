'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserStoryGroup } from './user-story-group'
import { Search } from 'lucide-react'
import { useState, useMemo } from 'react'

interface TestScript {
    id: string
    name: string
    testCaseId: string
    testCaseName: string
    userStoryId: string
    userStoryTitle: string
    status: 'active' | 'draft' | 'maintenance'
    passRate: number
    lastRun?: string
    isGenerated: boolean
}

interface HierarchyViewProps {
    scripts: TestScript[]
    selectedTestCaseId: string | null
    onTestCaseSelect: (testCaseId: string) => void
}

export function HierarchyView({ scripts, selectedTestCaseId, onTestCaseSelect }: HierarchyViewProps) {
    const [searchQuery, setSearchQuery] = useState('')

    // Group scripts by user story and test case
    const hierarchy = useMemo(() => {
        const grouped = new Map<string, {
            userStoryId: string
            userStoryTitle: string
            testCases: Map<string, {
                testCaseId: string
                testCaseName: string
                scripts: TestScript[]
            }>
        }>()

        scripts.forEach(script => {
            if (!grouped.has(script.userStoryId)) {
                grouped.set(script.userStoryId, {
                    userStoryId: script.userStoryId,
                    userStoryTitle: script.userStoryTitle,
                    testCases: new Map()
                })
            }

            const userStory = grouped.get(script.userStoryId)!
            if (!userStory.testCases.has(script.testCaseId)) {
                userStory.testCases.set(script.testCaseId, {
                    testCaseId: script.testCaseId,
                    testCaseName: script.testCaseName,
                    scripts: []
                })
            }

            userStory.testCases.get(script.testCaseId)!.scripts.push(script)
        })

        return Array.from(grouped.values()).map(userStory => ({
            ...userStory,
            testCases: Array.from(userStory.testCases.values())
        }))
    }, [scripts])

    // Filter by search query
    const filteredHierarchy = useMemo(() => {
        if (!searchQuery.trim()) return hierarchy

        const query = searchQuery.toLowerCase()
        return hierarchy
            .map(userStory => ({
                ...userStory,
                testCases: userStory.testCases.filter(tc =>
                    tc.testCaseName.toLowerCase().includes(query) ||
                    tc.testCaseId.toLowerCase().includes(query) ||
                    userStory.userStoryTitle.toLowerCase().includes(query)
                )
            }))
            .filter(userStory => userStory.testCases.length > 0)
    }, [hierarchy, searchQuery])

    return (
        <div className="h-full flex flex-col bg-card border-r border-border">
            {/* Search */}
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search scripts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                    />
                </div>
            </div>

            {/* Hierarchy */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredHierarchy.length > 0 ? (
                    filteredHierarchy.map(userStory => (
                        <UserStoryGroup
                            key={userStory.userStoryId}
                            userStoryId={userStory.userStoryId}
                            userStoryTitle={userStory.userStoryTitle}
                            testCases={userStory.testCases}
                            selectedTestCaseId={selectedTestCaseId}
                            onTestCaseSelect={onTestCaseSelect}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                        <Search className="w-12 h-12 mb-4 text-slate-500" />
                        <p className="text-sm font-medium text-slate-400">
                            {searchQuery ? 'No test cases found' : 'No test scripts available'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
