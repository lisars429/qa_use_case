'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Globe, CheckCircle2, Copy, Search, RotateCcw } from 'lucide-react'
import type { DOMMappingResult, DOMElement } from '@/lib/types/pipeline'
import { cn } from '@/lib/utils'

// ============================================================================
// Stage 5: DOM Mapping
// ============================================================================

export interface DOMMappingProps {
    testCaseIds: string[]
    onMappingComplete: (result: DOMMappingResult) => void
    initialResult?: DOMMappingResult
    onProceed?: () => void
    isTurboMode?: boolean
    onRegenerate?: () => void
}

export function DOMMapping({
    testCaseIds,
    onMappingComplete,
    initialResult,
    onProceed,
    isTurboMode,
    onRegenerate,
}: DOMMappingProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<DOMMappingResult | null>(initialResult || null)
    const [url, setUrl] = useState('https://app.example.com/login')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set())
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        if (isTurboMode && !result && !isLoading && url) {
            handleMapDOM()
        }
    }, [isTurboMode, result, isLoading, url])

    const handleMapDOM = async () => {
        setIsLoading(true)
        try {
            // Simulate DOM mapping - in real implementation, this would call the backend
            await new Promise(resolve => setTimeout(resolve, 2000))

            const mockResult: DOMMappingResult = {
                url,
                timestamp: new Date().toISOString(),
                elements: [
                    {
                        id: 'elem-001',
                        tag: 'input',
                        selector: 'input[name="email"]',
                        text_content: '',
                        attributes: {
                            type: 'email',
                            name: 'email',
                            placeholder: 'Enter your email',
                            required: 'true',
                        },
                        xpath: '//*[@id="email-input"]',
                    },
                    {
                        id: 'elem-002',
                        tag: 'input',
                        selector: 'input[name="password"]',
                        text_content: '',
                        attributes: {
                            type: 'password',
                            name: 'password',
                            placeholder: 'Enter your password',
                            required: 'true',
                        },
                        xpath: '//*[@id="password-input"]',
                    },
                    {
                        id: 'elem-003',
                        tag: 'button',
                        selector: 'button[type="submit"]',
                        text_content: 'Sign In',
                        attributes: {
                            type: 'submit',
                            class: 'btn btn-primary',
                        },
                        xpath: '//*[@id="login-form"]/button',
                    },
                    {
                        id: 'elem-004',
                        tag: 'div',
                        selector: 'div.error-message',
                        text_content: '',
                        attributes: {
                            class: 'error-message hidden',
                            role: 'alert',
                        },
                        xpath: '//*[@id="error-container"]',
                    },
                    {
                        id: 'elem-005',
                        tag: 'a',
                        selector: 'a.forgot-password',
                        text_content: 'Forgot Password?',
                        attributes: {
                            href: '/forgot-password',
                            class: 'forgot-password',
                        },
                        xpath: '//*[@id="forgot-password-link"]',
                    },
                ],
            }

            setResult(mockResult)
            onMappingComplete(mockResult)

            if (isTurboMode && onProceed) {
                const timer = setTimeout(() => {
                    onProceed()
                }, 1500)
                return () => clearTimeout(timer)
            }
        } catch (error) {
            console.error('Failed to map DOM:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleElementSelection = (elementId: string) => {
        setSelectedElements(prev => {
            const newSet = new Set(prev)
            if (newSet.has(elementId)) {
                newSet.delete(elementId)
            } else {
                newSet.add(elementId)
            }
            return newSet
        })
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    if (!result) {
        return (
            <Card className="p-6 bg-card border-border">
                <div className="space-y-4">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="p-4 rounded-full bg-primary/10">
                                <Globe className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Stage 5: DOM Mapping
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Extract and map UI elements from the target application for test automation
                            </p>
                        </div>
                    </div>

                    {/* URL Input */}
                    <div className="max-w-md mx-auto space-y-2">
                        <Label htmlFor="url" className="text-sm font-medium">
                            Target URL
                        </Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="bg-input border-border"
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the URL of the page you want to map for test automation
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <Button
                            onClick={handleMapDOM}
                            disabled={isLoading || !url}
                            className="bg-primary text-primary-foreground"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Mapping DOM Elements...
                                </>
                            ) : (
                                <>
                                    <Globe className="w-4 h-4 mr-2" />
                                    Map DOM Elements
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    const filteredElements = result.elements.filter(elem =>
        elem.selector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        elem.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        elem.text_content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const elementsByTag = result.elements.reduce((acc, elem) => {
        if (!acc[elem.tag]) {
            acc[elem.tag] = []
        }
        acc[elem.tag].push(elem)
        return acc
    }, {} as Record<string, DOMElement[]>)

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="p-4 bg-green-500/5 border-2 border-green-500/20">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {result.elements.length} Elements Mapped
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            URL: <span className="font-mono text-primary">{result.url}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Mapped at: {new Date(result.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleMapDOM} disabled={isLoading}>
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Remapping...</> : 'Remap'}
                    </Button>
                </div>
            </Card>

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search elements by selector, tag, or text..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-input border-border"
                    />
                </div>
                <Badge variant="secondary" className="text-sm">
                    {selectedElements.size} selected
                </Badge>
            </div>

            {/* Tabs */}
            <Card className="bg-card border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-border px-4">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="all">All Elements ({result.elements.length})</TabsTrigger>
                            <TabsTrigger value="inputs">Inputs ({elementsByTag['input']?.length || 0})</TabsTrigger>
                            <TabsTrigger value="buttons">Buttons ({elementsByTag['button']?.length || 0})</TabsTrigger>
                            <TabsTrigger value="links">Links ({elementsByTag['a']?.length || 0})</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* All Elements */}
                    <TabsContent value="all" className="p-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary hover:bg-secondary">
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedElements.size === result.elements.length}
                                                onChange={() => {
                                                    if (selectedElements.size === result.elements.length) {
                                                        setSelectedElements(new Set())
                                                    } else {
                                                        setSelectedElements(new Set(result.elements.map(e => e.id)))
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-border"
                                            />
                                        </TableHead>
                                        <TableHead>Tag</TableHead>
                                        <TableHead>Selector</TableHead>
                                        <TableHead>XPath</TableHead>
                                        <TableHead>Text</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredElements.map((element) => (
                                        <TableRow key={element.id}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedElements.has(element.id)}
                                                    onChange={() => toggleElementSelection(element.id)}
                                                    className="w-4 h-4 rounded border-border"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {element.tag}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-secondary px-2 py-1 rounded">
                                                        {element.selector}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => copyToClipboard(element.selector || '')}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-secondary px-2 py-1 rounded max-w-xs truncate">
                                                        {element.xpath}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => copyToClipboard(element.xpath || '')}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                                {element.text_content || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" className="text-xs">
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Filtered by Tag */}
                    {['inputs', 'buttons', 'links'].map(tabValue => {
                        const tagMap = { inputs: 'input', buttons: 'button', links: 'a' }
                        const elements = elementsByTag[tagMap[tabValue as keyof typeof tagMap]] || []

                        return (
                            <TabsContent key={tabValue} value={tabValue} className="p-4">
                                <div className="space-y-2">
                                    {elements.map(element => (
                                        <Card key={element.id} className="p-3 bg-secondary border-border">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedElements.has(element.id)}
                                                    onChange={() => toggleElementSelection(element.id)}
                                                    className="w-4 h-4 rounded border-border mt-1"
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs font-mono">{element.tag}</Badge>
                                                        {element.text_content && (
                                                            <span className="text-sm font-medium text-foreground">{element.text_content}</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground w-16">Selector:</span>
                                                            <code className="text-xs bg-input px-2 py-1 rounded flex-1">{element.selector}</code>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => copyToClipboard(element.selector || '')}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground w-16">XPath:</span>
                                                            <code className="text-xs bg-input px-2 py-1 rounded flex-1">{element.xpath}</code>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => copyToClipboard(element.xpath || '')}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        )
                    })}
                </Tabs>
            </Card>

            {/* Proceed Button */}
            {/* Proceed Button */}
            {/* Proceed Button */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                        if (onRegenerate) onRegenerate()
                    }}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate Test Cases
                </Button>
                <Button
                    className="flex-1 bg-primary text-primary-foreground"
                    onClick={() => {
                        console.log('DOMMapping: Proceed button clicked')
                        if (onProceed) {
                            onProceed()
                        } else {
                            console.warn('DOMMapping: onProceed prop is undefined')
                        }
                    }}
                >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Proceed to Stage 6
                </Button>
            </div>
        </div>
    )
}

// ============================================================================
// Combined Stage 5 Component Export
// ============================================================================

export const Stage5DOMMapping = {
    Mapper: DOMMapping,
}
