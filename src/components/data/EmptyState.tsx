import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, emoji, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
    >
      {emoji && <div className="text-6xl mb-4">{emoji}</div>}
      {icon && <div className="mb-4 text-stone-300">{icon}</div>}
      <h3 className="text-xl font-bold text-stone-800 font-display">{title}</h3>
      {description && <p className="mt-2 text-stone-500 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
