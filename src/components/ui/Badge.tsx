import { cn } from '@/lib/utils'
import React from 'react'

type BadgeVariant = 'orange' | 'red' | 'green' | 'blue' | 'gray' | 'purple' | 'yellow'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  orange: 'bg-amber-100 text-amber-800 border-amber-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  green:  'bg-green-100 text-green-700 border-green-200',
  blue:   'bg-blue-100 text-blue-700 border-blue-200',
  gray:   'bg-stone-100 text-stone-600 border-stone-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

export function Badge({ variant = 'gray', children, className, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border', variants[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', { 'bg-amber-500': variant === 'orange', 'bg-red-500': variant === 'red', 'bg-green-500': variant === 'green', 'bg-blue-500': variant === 'blue', 'bg-stone-400': variant === 'gray' })} />}
      {children}
    </span>
  )
}
