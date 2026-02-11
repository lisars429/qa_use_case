'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, Clock, Lock, AlertCircle, Loader2 } from 'lucide-react'

export type StatusType = 'completed' | 'current' | 'pending' | 'blocked' | 'pass' | 'fail' | 'error'

interface StatusBadgeProps {
    status: StatusType
    label: string
    className?: string
    showIcon?: boolean
}

export function StatusBadge({ status, label, className, showIcon = true }: StatusBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'completed':
            case 'pass':
                return {
                    icon: Check,
                    bgColor: 'bg-green-500/10',
                    textColor: 'text-green-600',
                    borderColor: 'border-green-500/20',
                }
            case 'current':
                return {
                    icon: Loader2,
                    bgColor: 'bg-yellow-500/10',
                    textColor: 'text-yellow-600',
                    borderColor: 'border-yellow-500/20',
                    animate: true,
                }
            case 'pending':
                return {
                    icon: Clock,
                    bgColor: 'bg-gray-500/10',
                    textColor: 'text-gray-600',
                    borderColor: 'border-gray-500/20',
                }
            case 'blocked':
            case 'fail':
            case 'error':
                return {
                    icon: AlertCircle,
                    bgColor: 'bg-red-500/10',
                    textColor: 'text-red-600',
                    borderColor: 'border-red-500/20',
                }
            default:
                return {
                    icon: Clock,
                    bgColor: 'bg-gray-500/10',
                    textColor: 'text-gray-600',
                    borderColor: 'border-gray-500/20',
                }
        }
    }

    const config = getStatusConfig()
    const Icon = config.icon

    return (
        <Badge
            variant="outline"
            className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 font-medium',
                config.bgColor,
                config.textColor,
                config.borderColor,
                config.animate && 'animate-pulse',
                className
            )}
        >
            {showIcon && <Icon className={cn('w-3.5 h-3.5', config.animate && 'animate-spin')} />}
            <span className="capitalize">{label}</span>
        </Badge>
    )
}
