'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface SuccessModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    count: number
    targetModule: string
    title?: string
    description?: string
}

export function SuccessModal({ isOpen, onClose, onConfirm, count, targetModule, title, description }: SuccessModalProps) {
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        if (!isOpen) return

        setCountdown(5)
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onConfirm()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isOpen, onConfirm])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-xl border-border shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                    <Progress value={(countdown / 5) * 100} className="h-full bg-primary transition-all duration-1000 ease-linear" />
                </div>

                <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary relative z-10 border border-primary/20">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500 animate-bounce" />
                    </div>

                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
                            {title || `${count} Test Cases Generated!`}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            {description || (
                                <>
                                    Your requirements have been successfully transformed. Redirecting to <span className="text-primary font-bold">{targetModule}</span> in {countdown} seconds...
                                </>
                            )}
                        </DialogDescription>
                    </div>

                    <div className="flex gap-3 w-full pt-4">
                        <Button variant="ghost" className="flex-1 border-border" onClick={onClose}>
                            Stay Here
                        </Button>
                        <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground group" onClick={onConfirm}>
                            View Now
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
