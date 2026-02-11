'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
    title: string
    value: number | string
    icon?: LucideIcon
    color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'default'
    subtitle?: string
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    color = 'default',
    subtitle,
    trend,
    className,
}: MetricCardProps) {
    const getColorClasses = () => {
        switch (color) {
            case 'green':
                return {
                    iconBg: 'bg-green-500/10',
                    iconColor: 'text-green-600',
                    valueColor: 'text-green-600',
                }
            case 'yellow':
                return {
                    iconBg: 'bg-yellow-500/10',
                    iconColor: 'text-yellow-600',
                    valueColor: 'text-yellow-600',
                }
            case 'red':
                return {
                    iconBg: 'bg-red-500/10',
                    iconColor: 'text-red-600',
                    valueColor: 'text-red-600',
                }
            case 'blue':
                return {
                    iconBg: 'bg-blue-500/10',
                    iconColor: 'text-blue-600',
                    valueColor: 'text-blue-600',
                }
            case 'purple':
                return {
                    iconBg: 'bg-purple-500/10',
                    iconColor: 'text-purple-600',
                    valueColor: 'text-purple-600',
                }
            default:
                return {
                    iconBg: 'bg-primary/10',
                    iconColor: 'text-primary',
                    valueColor: 'text-foreground',
                }
        }
    }

    const colors = getColorClasses()

    return (
        <Card className={cn('p-4 bg-card border-border', className)}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{title}</p>
                    <p className={cn('text-3xl font-bold', colors.valueColor)}>{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last period</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={cn('p-2.5 rounded-lg', colors.iconBg)}>
                        <Icon className={cn('w-5 h-5', colors.iconColor)} />
                    </div>
                )}
            </div>
        </Card>
    )
}
