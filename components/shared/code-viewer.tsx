'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Copy, Check, Download } from 'lucide-react'

interface CodeViewerProps {
    code: string
    language?: string
    showLineNumbers?: boolean
    onCopy?: () => void
    onDownload?: () => void
    fileName?: string
    className?: string
    maxHeight?: string
}

export function CodeViewer({
    code,
    language = 'typescript',
    showLineNumbers = true,
    onCopy,
    onDownload,
    fileName,
    className,
    maxHeight = '400px',
}: CodeViewerProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        onCopy?.()
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName || `code.${language}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        onDownload?.()
    }

    const lines = code.split('\n')

    return (
        <Card className={cn('bg-card border-border overflow-hidden', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground uppercase">{language}</span>
                    {fileName && (
                        <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-foreground font-medium">{fileName}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                <span className="text-xs">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 mr-1" />
                                <span className="text-xs">Copy</span>
                            </>
                        )}
                    </Button>
                    {onDownload && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDownload}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            <span className="text-xs">Download</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Code Content */}
            <div
                className="overflow-auto bg-input"
                style={{ maxHeight }}
            >
                <pre className="p-4 text-sm">
                    <code className="font-mono">
                        {showLineNumbers ? (
                            <table className="w-full border-collapse">
                                <tbody>
                                    {lines.map((line, index) => (
                                        <tr key={index}>
                                            <td className="pr-4 text-right text-muted-foreground select-none w-12">
                                                {index + 1}
                                            </td>
                                            <td className="text-foreground whitespace-pre-wrap break-words">
                                                {line || '\n'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-foreground whitespace-pre-wrap break-words">{code}</div>
                        )}
                    </code>
                </pre>
            </div>
        </Card>
    )
}
