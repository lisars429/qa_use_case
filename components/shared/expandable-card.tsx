'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ChevronDown, LucideIcon } from 'lucide-react'

interface ExpandableCardProps {
    title: string | React.ReactNode
    icon?: LucideIcon
    defaultExpanded?: boolean
    children: React.ReactNode
    className?: string
    headerClassName?: string
    badge?: React.ReactNode
}

export function ExpandableCard({
    title,
    icon: Icon,
    defaultExpanded = false,
    children,
    className,
    headerClassName,
    badge,
}: ExpandableCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <Card className={cn('bg-card border-border overflow-hidden', className)}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsExpanded(!isExpanded)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setIsExpanded(!isExpanded)
                    }
                }}
                className={cn(
                    'w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    headerClassName
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    {badge && <div>{badge}</div>}
                </div>
                <ChevronDown
                    className={cn(
                        'w-5 h-5 text-muted-foreground transition-transform duration-200',
                        isExpanded && 'transform rotate-180'
                    )}
                />
            </div>

            <div
                className={cn(
                    'overflow-hidden transition-all duration-200',
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                <div className="p-4 pt-0 border-t border-border">{children}</div>
            </div>
        </Card>
    )
}
