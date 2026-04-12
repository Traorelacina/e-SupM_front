import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftElement, rightElement, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-stone-700 mb-1.5">
            {label}
            {props.required && <span className="text-brand-red ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full py-3 rounded-xl border bg-white',
              'text-stone-900 placeholder-stone-400 text-sm font-medium',
              'focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange',
              'transition-all duration-200',
              'disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60',
              leftElement ? 'pl-10' : 'pl-4',
              rightElement ? 'pr-10' : 'pr-4',
              error ? 'border-brand-red focus:ring-brand-red/30 focus:border-brand-red' : 'border-stone-200',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-brand-red">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
