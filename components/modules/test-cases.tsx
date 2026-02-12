'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, FileText, Zap, Sparkles, ChevronDown, ChevronUp, Loader2, MoreHorizontal, Edit2, Trash2, Filter, Download, Globe, CheckCircle2, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from '@/lib/utils'
import { PipelineUnified } from '@/components/modules/user-stories/pipeline'
import { Stage5DOMMapping } from '@/components/modules/test-cases/pipeline/stage5-dom-mapping'
import { usePipelineData } from '@/lib/context/pipeline-data-context'
import { saveActivity } from '@/app/actions/unified-store'
import { api } from '@/lib/api/client'
import type { DOMMappingResult } from '@/lib/types/pipeline'

import { TestCase, Priority } from '@/lib/types/pipeline'

interface TestCasesModuleProps {
  initialState?: { filter?: string }
  onModuleChange?: (module: 'test-scripts', state?: any) => void
}

export function TestCasesModule({ initialState, onModuleChange }: TestCasesModuleProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'generated' | 'internal'>('all')
  const [expandedTestCaseId, setExpandedTestCaseId] = useState<string | null>(null)
  const [showDOMMappingForStoryId, setShowDOMMappingForStoryId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    priority: 'Medium',
    status: 'draft',
    steps: [''],
    preconditions: ['']
  })
  const {
    generatedTestCases,
    getTestCaseUserStory,
    addTestCases,
    userStories,
    updateTestCase,
    removeTestCase,
    bulkUpdateTestCases,
    addManualTestCase,
    getDOMMapping,
    addDOMMapping
  } = usePipelineData()

  useEffect(() => {
    const triggerAutoGeneration = async () => {
      if (initialState?.filter) {
        const storyId = initialState.filter
        const hasTestCases = generatedTestCases.some(tc => {
          const meta = getTestCaseUserStory(tc.test_id)
          return meta?.userStoryId === storyId
        })

        if (!hasTestCases && !isGenerating) {
          setIsGenerating(true)
          try {
            const storyMeta = userStories.get(storyId)
            if (storyMeta && storyMeta.userStory.user_story) {
              const result = await api.generateTestCases({
                user_story: storyMeta.userStory.user_story,
                explicit_rules: storyMeta.stage2Result?.explicit_rules || [],
                enriched_context: storyMeta.userStory.detailed_description
              })
              addTestCases(result.test_cases, storyId, storyMeta.userStory)
            }
          } catch (err) {
            console.error('Auto-generation failed:', err)
          } finally {
            setIsGenerating(false)
          }
        }
      }
    }
    triggerAutoGeneration()
  }, [initialState, userStories])

  useEffect(() => {
    if (initialState?.filter) {
      setSearchQuery(initialState.filter)
      setViewMode('generated')
    }
  }, [initialState])

  const testCases = useMemo(() => {
    const generated: (TestCase & { userStory: string })[] = generatedTestCases.map(tc => {
      const userStoryMeta = getTestCaseUserStory(tc.test_id)
      return {
        ...tc,
        userStory: userStoryMeta?.userStoryId || 'Generated',
        priority: tc.priority || 'Medium',
        status: tc.status || 'draft',
        automationLevel: tc.automationLevel || 0,
      }
    })

    return generated
  }, [generatedTestCases, getTestCaseUserStory])

  const getPriorityColor = (priority: Priority | string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'High':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'Medium':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'Low':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getAutomationColor = (level: number) => {
    if (level >= 80) return 'text-green-500'
    if (level >= 50) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const filtered = testCases.filter(tc => {
    const matchesSearch = tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.test_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.userStory.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter

    return matchesSearch && matchesPriority && matchesStatus
  })

  const stats = useMemo(() => {
    const totalCount = testCases.length
    const draftCount = testCases.filter(tc => tc.status === 'draft').length
    const activeCount = testCases.filter(tc => tc.status === 'active').length
    const highPriorityDraftCount = testCases.filter(tc => tc.status === 'draft' && (tc.priority === 'Critical' || tc.priority === 'High')).length
    const avgAutomationCount = totalCount > 0 ? Math.round(testCases.reduce((a, b) => a + (b.automationLevel || 0), 0) / totalCount) : 0

    return {
      total: totalCount,
      active: activeCount,
      draft: draftCount,
      highPriorityDraft: highPriorityDraftCount,
      avgAutomation: avgAutomationCount,
    }
  }, [testCases])

  const groupedByStory = useMemo(() => {
    const groups: Record<string, TestCase[]> = {}
    filtered.forEach(tc => {
      const storyId = tc.userStory
      if (!groups[storyId]) groups[storyId] = []
      groups[storyId].push(tc)
    })
    return groups
  }, [filtered])

  const toggleSelectAll = (ids: string[]) => {
    const newSelected = new Set(selectedIds)
    const allSelected = ids.every(id => newSelected.has(id))
    if (allSelected) {
      ids.forEach(id => newSelected.delete(id))
    } else {
      ids.forEach(id => newSelected.add(id))
    }
    setSelectedIds(newSelected)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const handleCreateTestCase = () => {
    if (!newTestCase.name) return

    addManualTestCase({
      ...newTestCase,
      test_id: `TC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      test_type: 'Happy Path', // Default
    } as TestCase, initialState?.filter || 'manual-entry')

    setIsCreateDialogOpen(false)
    setNewTestCase({
      priority: 'Medium',
      status: 'draft',
      steps: [''],
      preconditions: ['']
    })
  }

  const addStep = () => {
    setNewTestCase(prev => ({
      ...prev,
      steps: [...(prev.steps || []), '']
    }))
  }

  const updateStep = (index: number, value: string) => {
    const newSteps = [...(newTestCase.steps || [])]
    newSteps[index] = value
    setNewTestCase(prev => ({ ...prev, steps: newSteps }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Test Cases</h2>
          <p className="text-muted-foreground">Design and manage test scenarios</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Test Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Create Manual Test Case</DialogTitle>
              <DialogDescription>
                Add a new test scenario to your quality assurance suite.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Test Case Title</Label>
                <Input
                  id="name"
                  placeholder="e.g. Verify user can login with valid credentials"
                  value={newTestCase.name || ''}
                  onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={newTestCase.priority}
                    onValueChange={(val) => setNewTestCase({ ...newTestCase, priority: val as Priority })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={newTestCase.status}
                    onValueChange={(val) => setNewTestCase({ ...newTestCase, status: val as any })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Business Logic / Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the objective and business value of this test..."
                  value={newTestCase.description || ''}
                  onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                  className="bg-secondary/50 border-border min-h-[100px]"
                />
              </div>
              <div className="grid gap-3">
                <Label className="flex items-center justify-between">
                  <span>Execution Steps</span>
                  <Button variant="ghost" size="sm" onClick={addStep} className="h-7 text-primary">
                    <Plus className="w-3 h-3 mr-1" /> Add Step
                  </Button>
                </Label>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                  {newTestCase.steps?.map((step, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex-none w-6 h-8 flex items-center justify-center font-bold text-muted-foreground text-xs bg-secondary rounded">
                        {idx + 1}
                      </div>
                      <Input
                        value={step}
                        onChange={(e) => updateStep(idx, e.target.value)}
                        placeholder={`Step ${idx + 1}...`}
                        className="bg-secondary/30 border-border h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTestCase} disabled={!newTestCase.name}>Create Test Case</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Cases</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <p className="text-3xl font-bold text-green-500">{stats.active}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Draft</p>
          <p className="text-3xl font-bold text-yellow-500">{stats.draft}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground mb-1">Avg Automation</p>
          <p className="text-3xl font-bold text-accent">{stats.avgAutomation}%</p>
        </Card>
      </div>

      {/* Search, Filters & Bulk Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search test cases, stories, or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border h-11"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-right-2">
              <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
              <div className="h-4 w-[1px] bg-primary/20 mx-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                    Actions <ChevronDown className="ml-1 w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => bulkUpdateTestCases(Array.from(selectedIds), { status: 'active' })}>
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => bulkUpdateTestCases(Array.from(selectedIds), { status: 'draft' })}>
                    Returns to Draft
                  </DropdownMenuItem>
                  <div className="h-[1px] bg-border my-1" />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                    Array.from(selectedIds).forEach(id => removeTestCase(id))
                    setSelectedIds(new Set())
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 border-border bg-card">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Filter by Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8 bg-secondary/50 border-none">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 bg-secondary/50 border-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[1px] bg-border my-1" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-8"
                onClick={() => { setPriorityFilter('all'); setStatusFilter('all'); }}
              >
                Reset Filters
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-11 w-11 border-border bg-card">
            <Download className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {isGenerating && (
          <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full animate-pulse">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-medium text-primary">Generating AI Test Cases...</span>
          </div>
        )}
      </div>

      {/* Test Cases Grouped by Story */}
      <div className="space-y-4">
        {Object.keys(groupedByStory).length === 0 && !isGenerating && (
          <Card className="flex flex-col items-center justify-center py-20 bg-card border-border">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No test cases found</h3>
            <p className="text-muted-foreground max-w-xs text-center mt-2">
              Start by refining a user story to generate AI test cases or create one manually.
            </p>
          </Card>
        )}

        {isGenerating && Object.keys(groupedByStory).length === 0 && (
          <Card className="p-8 space-y-4 bg-card border-border animate-pulse">
            <div className="h-8 bg-secondary rounded w-1/4 mb-6" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-secondary/50 rounded flex items-center px-4 gap-4">
                <div className="h-4 w-4 bg-secondary rounded" />
                <div className="h-4 w-12 bg-secondary rounded" />
                <div className="h-4 w-64 bg-secondary rounded" />
                <div className="ml-auto h-4 w-24 bg-secondary rounded" />
              </div>
            ))}
          </Card>
        )}

        <Accordion type="multiple" defaultValue={Object.keys(groupedByStory)} className="space-y-4">
          {Object.entries(groupedByStory).map(([storyId, cases]) => {
            const storyMeta = userStories.get(storyId)
            const storyTitle = storyMeta?.userStory.user_story || `Story: ${storyId}`

            return (
              <AccordionItem key={storyId} value={storyId} className="border-none">
                <Card className="overflow-hidden border-border bg-card hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center justify-between hover:bg-secondary/20 group">
                    <AccordionTrigger className="flex-1 px-6 py-4 hover:no-underline border-none">
                      <div className="flex items-center gap-4 text-left w-full mr-4">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{storyTitle}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-accent/70">{storyId}</span>
                            <span className="opacity-30">•</span>
                            <span>{cases.length} test cases</span>
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 mr-10 shrink-0">
                      {getDOMMapping(storyId) ? (
                        <>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1 hidden md:flex">
                            <CheckCircle2 className="w-3 h-3" /> Mapped
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-accent/10 text-accent border-accent/10 hover:bg-accent/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              onModuleChange?.('test-scripts', {
                                view: 'pipeline',
                                stage: 6,
                                userStoryId: storyId
                              })
                            }}
                          >
                            <Zap className="w-3 h-3 mr-1" /> Generate Scripts
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs bg-primary/5 text-primary border-primary/10 hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDOMMappingForStoryId(storyId);
                          }}
                        >
                          <Globe className="w-3 h-3 mr-1" /> Map Story
                        </Button>
                      )}
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 hidden sm:flex">
                        {Math.round(cases.filter(c => c.status === 'active').length / cases.length * 100)}% Ready
                      </Badge>
                    </div>
                  </div>

                  <AccordionContent className="p-0 border-t border-border">
                    {showDOMMappingForStoryId === storyId && (
                      <div className="p-6 bg-secondary/10 border-b border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">User Story DOM Mapping</h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowDOMMappingForStoryId(null)}>
                            <X className="w-4 h-4 mr-2" /> Close Mapper
                          </Button>
                        </div>
                        <Stage5DOMMapping.Mapper
                          testCaseIds={cases.map(c => c.test_id)}
                          onMappingComplete={(result) => {
                            addDOMMapping(storyId, result)
                          }}
                          initialResult={getDOMMapping(storyId) || undefined}
                          onProceed={() => {
                            setShowDOMMappingForStoryId(null)
                            onModuleChange?.('test-scripts', {
                              view: 'pipeline',
                              stage: 6,
                              userStoryId: storyId
                            })
                          }}
                        />
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/30 border-none hover:bg-secondary/30">
                            <TableHead className="w-12 px-6">
                              <Checkbox
                                checked={cases.every(c => selectedIds.has(c.test_id))}
                                onCheckedChange={() => toggleSelectAll(cases.map(c => c.test_id))}
                              />
                            </TableHead>
                            <TableHead className="w-24 font-semibold text-foreground">ID</TableHead>
                            <TableHead className="font-semibold text-foreground">Test Case Name</TableHead>
                            <TableHead className="w-32 font-semibold text-foreground">Priority</TableHead>
                            <TableHead className="w-32 font-semibold text-foreground">Status</TableHead>
                            <TableHead className="w-20 text-right font-semibold text-foreground pr-6">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cases.map((tc) => (
                            <TableRow
                              key={tc.test_id}
                              className={cn(
                                "border-border hover:bg-secondary/20 transition-colors group/row",
                                selectedIds.has(tc.test_id) && "bg-primary/5 hover:bg-primary/10",
                                expandedTestCaseId === tc.test_id && "bg-secondary/10"
                              )}
                              onClick={() => setExpandedTestCaseId(expandedTestCaseId === tc.test_id ? null : tc.test_id)}
                            >
                              <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedIds.has(tc.test_id)}
                                  onCheckedChange={() => toggleSelect(tc.test_id)}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs text-accent/80">{tc.test_id}</TableCell>
                              <TableCell>
                                <div className="font-medium text-foreground group-hover/row:text-primary transition-colors">
                                  {tc.name}
                                </div>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={tc.priority}
                                  onValueChange={(val) => updateTestCase(tc.test_id, { priority: val as Priority })}
                                >
                                  <SelectTrigger className={cn('h-8 w-32 border-none bg-transparent hover:bg-secondary/50 h-auto py-0.5 px-2 font-medium capitalize', getPriorityColor(tc.priority))}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={tc.status}
                                  onValueChange={(val) => updateTestCase(tc.test_id, { status: val as any })}
                                >
                                  <SelectTrigger className={cn(
                                    "h-8 w-28 border-none bg-transparent hover:bg-secondary/50 h-auto py-0.5 px-2 capitalize font-medium rounded-full",
                                    tc.status === 'active' ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground bg-muted"
                                  )}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="deprecated">Deprecated</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => setExpandedTestCaseId(tc.test_id)}>
                                      <Zap className="w-4 h-4 mr-2" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit2 className="w-4 h-4 mr-2" /> Inline Edit
                                    </DropdownMenuItem>
                                    <div className="h-[1px] bg-border my-1" />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => removeTestCase(tc.test_id)}>
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      {/* Expandable Test Case Details with Premium UI */}
      {expandedTestCaseId && (
        <Card className="bg-card/50 backdrop-blur-xl border-primary/20 p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {filtered.find(tc => tc.test_id === expandedTestCaseId)?.priority}
                </Badge>
                <div className="h-4 w-[1px] bg-border" />
                <span className="text-xs font-mono text-muted-foreground">{expandedTestCaseId}</span>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mt-2">
                {filtered.find(tc => tc.test_id === expandedTestCaseId)?.name}
              </h3>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full h-10 px-6 bg-secondary/80 hover:bg-secondary border-border"
              onClick={() => setExpandedTestCaseId(null)}
            >
              <ChevronUp className="w-4 h-4 mr-2" />
              Close Overview
            </Button>
          </div>

          <div className="space-y-8">
            <div className="space-y-8">
              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="w-4 h-4" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">Business Logic & Context</h4>
                </div>
                <p className="text-foreground/80 leading-relaxed text-lg italic">
                  "{filtered.find(tc => tc.test_id === expandedTestCaseId)?.description}"
                </p>
              </div>

              {/* Steps & Expected Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Zap className="w-4 h-4" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">Execution Steps</h4>
                  </div>
                  <div className="space-y-3">
                    {filtered.find(tc => tc.test_id === expandedTestCaseId)?.steps?.map((step, idx) => (
                      <div key={idx} className="flex gap-4 group">
                        <span className="flex-none w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-foreground/80 pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4 shadow-inner">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">Expected Outcome</h4>
                  </div>
                  <p className="text-primary/90 font-medium text-lg leading-relaxed">
                    The system validates the business rules and provides a success confirmation with the expected state change.
                  </p>
                </div>
              </div>



              {/* DOM Mapping Section - removed from here as it is now at story level */}
            </div>
          </div>
        </Card>
      )}



      {/* AI Insights Card */}
      {stats.draft > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-accent mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">AI Insight</h3>
              <p className="text-sm text-muted-foreground">
                {stats.draft} test {stats.draft === 1 ? 'case is' : 'cases are'} in draft status.
                {stats.highPriorityDraft > 0
                  ? ` Consider prioritizing the ${stats.highPriorityDraft} critical and high-priority cases for automation.`
                  : ' All high-priority cases are active or complete.'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
